/**
 * Server-side Open Food Facts caches (Stage 7 barcode lookups, Stage 8B
 * text search).
 *
 * Small in-memory caches with a clear interface so they can later be
 * replaced by a persistent implementation (e.g. Redis) without touching
 * callers. No external infrastructure is added at this stage.
 */

export interface CachedLookup {
  /**
   * "found" carries the normalized product; "incomplete" carries the
   * partial identity of a product without nutrition data; "not_found"
   * is a negative marker. Errors are never cached.
   */
  status: "found" | "not_found" | "incomplete";
  product?: unknown;
  partial?: { name?: string; brand?: string; imageUrl?: string };
}

/** A cached successful text-search result (normalized products). */
export interface CachedSearch {
  products: unknown[];
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface BarcodeCache {
  get(key: string): CachedLookup | undefined;
  set(key: string, value: CachedLookup, ttlMs: number): void;
  clear(): void;
}

/** TTLs: found products change rarely; negatives resolve faster. */
export const OFF_CACHE_TTL = {
  found: 24 * 60 * 60 * 1000, // 24 hours
  notFound: 60 * 60 * 1000, // 1 hour
  /** Stage 8B: successful search results stay fresh for a day. */
  search: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/** Cache key for a normalized barcode (conceptual: openfoodfacts:barcode:<code>). */
export function offCacheKey(normalizedBarcode: string): string {
  return `openfoodfacts:barcode:${normalizedBarcode}`;
}

/**
 * Cache key for a text search. The raw query is normalized (trim +
 * inner whitespace collapsed) so equivalent queries share one entry.
 */
export function offSearchCacheKey(query: string, page: number): string {
  return `openfoodfacts:search:${query.toLowerCase().replace(/\s+/g, " ").trim()}:${page}`;
}

/**
 * In-memory LRU-ish cache (insertion-ordered Map, pruned by size and
 * expiry). Lives for the lifetime of the server process. Generic over
 * the stored value so the same implementation serves barcode lookups
 * and text searches.
 */
export class InMemoryOffCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;

  constructor(maxEntries = 512) {
    this.maxEntries = maxEntries;
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    // Refresh insertion order so recently used keys survive pruning.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    if (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}

/** Kept for existing imports; the class is now generic. */
export type InMemoryBarcodeCache = InMemoryOffCache<CachedLookup>;

/** Shared cache instance used by the barcode API route. */
export const offBarcodeCache = new InMemoryOffCache<CachedLookup>(512);

/** Shared cache instance used by the search API route (Stage 8B). */
export const offSearchCache = new InMemoryOffCache<CachedSearch>(128);
