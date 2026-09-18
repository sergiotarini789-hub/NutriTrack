"use client";

/**
 * Stage 8B — debounced remote food search (client side).
 *
 * A framework-free controller (like the Stage 8A scanner session) owns
 * the debounce/staleness logic so it is unit-testable without React:
 *
 *  - remote requests fire only after the input settles for DEBOUNCE_MS
 *    and only for queries with ≥ MIN_QUERY_LENGTH meaningful chars;
 *  - clearing the input cancels pending timers and aborts the request;
 *  - stale responses are ignored via a monotonic request id — only the
 *    response to the LATEST request may update the state;
 *  - the shared OpenFoodFactsRepository performs the actual call (the
 *    browser never contacts Open Food Facts directly).
 *
 * The React hook is a thin wrapper around the controller.
 */
import { useEffect, useRef, useState } from "react";
import {
  OpenFoodFactsRepository,
  type OffSearchResponse,
} from "./openfoodfacts-repository";
import type { BrandedProduct } from "./types";

/** Remote search starts only for queries with at least this many chars. */
export const REMOTE_SEARCH_MIN_LENGTH = 2;
/** Debounce: how long the input must be idle before a request fires. */
export const REMOTE_SEARCH_DEBOUNCE_MS = 400;

export type RemoteSearchState =
  /** No meaningful query — nothing requested. */
  | { kind: "idle" }
  /** A request for the given query is in flight. */
  | { kind: "loading"; query: string }
  /** The remote search returned products for the given query. */
  | { kind: "ok"; query: string; products: BrandedProduct[] }
  /** The remote search honestly found nothing for the given query. */
  | { kind: "empty"; query: string }
  /** Technical failure (offline/timeout/server) for the given query. */
  | { kind: "error"; query: string };

export type RemoteSearchFn = (
  query: string,
  signal: AbortSignal,
) => Promise<OffSearchResponse>;

export interface OffSearchControllerOptions {
  onStateChange: (state: RemoteSearchState) => void;
  /** Injectable for tests; defaults to the real repository. */
  search?: RemoteSearchFn;
  debounceMs?: number;
}

export class OffSearchController {
  private readonly onStateChange: (state: RemoteSearchState) => void;
  private readonly search: RemoteSearchFn;
  private readonly debounceMs: number;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private abort: AbortController | null = null;
  /** Monotonic request id — stale responses are ignored. */
  private seq = 0;

  constructor(options: OffSearchControllerOptions) {
    this.onStateChange = options.onStateChange;
    this.search =
      options.search ??
      (async (query, signal) =>
        new OpenFoodFactsRepository().search(query, signal));
    this.debounceMs = options.debounceMs ?? REMOTE_SEARCH_DEBOUNCE_MS;
  }

  /** Feed the current search input; schedules/cancels the remote search. */
  setInput(rawQuery: string): void {
    const query = rawQuery.trim().replace(/\s+/g, " ");
    this.cancelTimer();
    this.seq++; // any in-flight request is now stale

    if (query.length < REMOTE_SEARCH_MIN_LENGTH) {
      // Nothing meaningful to search — drop back to the local state
      // without any request (also covers a cleared input).
      this.abortInFlight();
      this.emit({ kind: "idle" });
      return;
    }

    const request = ++this.seq;
    this.abortInFlight();
    // Feedback is immediate; the REQUEST still waits for the debounce.
    this.emit({ kind: "loading", query });
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.run(query, request);
    }, this.debounceMs);
  }

  /** Cancels everything and resets to idle (e.g. the modal closed). */
  cancel(): void {
    this.cancelTimer();
    this.seq++;
    this.abortInFlight();
    this.emit({ kind: "idle" });
  }

  private async run(query: string, request: number): Promise<void> {
    this.emit({ kind: "loading", query });
    const controller = new AbortController();
    this.abort = controller;
    let response: OffSearchResponse;
    try {
      response = await this.search(query, controller.signal);
    } catch {
      if (request === this.seq) this.emit({ kind: "error", query });
      return;
    } finally {
      if (this.abort === controller) this.abort = null;
    }
    if (request !== this.seq) return; // stale — a newer search exists
    if (response.status === "ok") {
      this.emit(
        response.products.length === 0
          ? { kind: "empty", query }
          : { kind: "ok", query, products: response.products },
      );
    } else if (response.status === "empty") {
      this.emit({ kind: "empty", query });
    } else {
      this.emit({ kind: "error", query });
    }
  }

  private cancelTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private abortInFlight(): void {
    if (this.abort !== null) {
      this.abort.abort();
      this.abort = null;
    }
  }

  private emit(state: RemoteSearchState): void {
    this.onStateChange(state);
  }
}

/**
 * React hook: debounced OFF search for the given input. The controller
 * lives as long as the component; every input change is forwarded.
 */
export function useOffSearch(query: string): RemoteSearchState {
  const [state, setState] = useState<RemoteSearchState>({ kind: "idle" });
  const controllerRef = useRef<OffSearchController | null>(null);

  useEffect(() => {
    const controller = new OffSearchController({ onStateChange: setState });
    controllerRef.current = controller;
    return () => {
      controllerRef.current = null;
      controller.cancel();
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setInput(query);
  }, [query]);

  return state;
}
