// Debounced, merged, revision-checked saving of one settings document. Pure: the host, the timer
// and the merge are injected, so the conflict paths are tested without Paseo.
//
// The host's `save` says only whether it worked; the new revision arrives later through `observe`
// (the settings state the UI reads). So a save is not final until `observe` shows the host's copy.

export type Timers = { set(fn: () => void, ms: number): unknown; clear(handle: unknown): void };

export type WriteQueueOptions<T> = {
  delayMs: number;
  /** Save a whole document against the revision it was based on. False means it failed or conflicted. */
  save(values: T, revision: string): Promise<boolean>;
  /** Ask the host for its current copy. The answer comes back through `observe`. */
  reload(): Promise<void>;
  /** Re-apply my pending change on top of the host's newer copy. */
  merge(base: T, mine: T, latest: T): T;
  /** Give up after this many failed saves in a row. */
  maxFailures?: number;
  onError?(message: string | null): void;
  timers?: Timers;
};

export type WriteQueue<T> = {
  /** The host's current copy and revision. Call on every settings state change. */
  observe(values: T, revision: string): void;
  /** The client wants the document to be `next`. */
  change(next: T): void;
  /** Save now, without waiting out the delay. */
  flush(): Promise<void>;
  dispose(): void;
  readonly hasPending: boolean;
  /** What the document should be: my pending change if any, else the host's copy. */
  readonly current: T | null;
};

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const realTimers: Timers = { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) };

export function createWriteQueue<T>(opts: WriteQueueOptions<T>): WriteQueue<T> {
  const timers = opts.timers ?? realTimers;
  const maxFailures = opts.maxFailures ?? 3;
  let base: T | null = null;
  let revision: string | null = null;
  let pending: T | null = null;
  let timer: unknown = null;
  let inFlight = false;
  let awaitingRevision = false;
  let failures = 0;
  let disposed = false;

  const stopTimer = () => {
    if (timer !== null) timers.clear(timer);
    timer = null;
  };
  const schedule = (ms = opts.delayMs) => {
    stopTimer();
    if (disposed || pending === null) return;
    timer = timers.set(() => {
      timer = null;
      void run();
    }, ms);
  };

  async function run(): Promise<void> {
    if (disposed || inFlight || awaitingRevision || pending === null || revision === null || base === null) return;
    const sent = pending;
    inFlight = true;
    let ok = false;
    try {
      ok = await opts.save(sent, revision);
    } catch {
      ok = false;
    }
    inFlight = false;
    if (disposed) return;
    if (ok) {
      failures = 0;
      opts.onError?.(null);
      base = sent;
      awaitingRevision = true;
      if (pending !== null && sameJson(pending, sent)) pending = null;
      return; // `observe` delivers the new revision, and schedules anything typed meanwhile
    }
    failures += 1;
    if (failures >= maxFailures) {
      opts.onError?.("Could not save your settings. Changes stay on screen until the page closes.");
      return;
    }
    // Most likely a conflict: fetch the host's copy. `observe` rebases, and this timer retries if it does not.
    void opts.reload().catch(() => {});
    schedule(opts.delayMs * 2 ** failures);
  }

  return {
    observe(values, rev) {
      if (disposed) return;
      if (rev === revision && base !== null && sameJson(values, base)) return;
      const previous = base;
      base = values;
      revision = rev;
      awaitingRevision = false;
      if (pending !== null && previous !== null) {
        pending = opts.merge(previous, pending, values);
        if (sameJson(pending, values)) pending = null;
      }
      if (pending !== null) schedule();
      else stopTimer();
    },
    change(next) {
      if (disposed || base === null) return;
      pending = sameJson(next, base) ? null : next;
      if (pending === null) stopTimer();
      else schedule();
    },
    async flush() {
      stopTimer();
      await run();
    },
    dispose() {
      disposed = true;
      stopTimer();
    },
    get hasPending() {
      return pending !== null;
    },
    get current() {
      return pending ?? base;
    },
  };
}
