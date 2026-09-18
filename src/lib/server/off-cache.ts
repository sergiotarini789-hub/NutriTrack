/**
 * Server-side barcode lookup cache (Stage 7).
 *
 * Small in-memory cache with a clear interface so it can later be
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

interface CacheEntry {
  value: CachedLookup;
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
} as const;

/** Cache key for a normalized barcode (conceptual: openfoodfacts:barcode:<code>). */
export function offCacheKey(normalizedBarcode: string): string {
  return `openfoodfacts:barcode:${normalizedBarcode}`;
}

/**
 * In-memory LRU-ish cache (insertion-ordered Map, pruned by size and
 * expiry). Lives for the lifetime of the server process.
 */
export class InMemoryBarcodeCache implements BarcodeCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly maxEntries: number;

  constructor(maxEntries = 512) {
    this.maxEntries = maxEntries;
  }

  get(key: string): CachedLookup | undefined {
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

  set(key: string, value: CachedLookup, ttlMs: number): void {
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

/** Shared cache instance used by the barcode API route. */
export const offBarcodeCache = new InMemoryBarcodeCache();
