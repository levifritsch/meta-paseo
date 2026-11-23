// Bridges the store's persisted slice to Paseo settings. Mount once, inside the board screen.
//
// Host to store: when a record arrives it is parsed; an invalid or newer one becomes the default,
// read-only, with the original kept, and is never written back (invariant 8).
// Store to host: edits go through a write queue that debounces, merges and handles conflicts.
import { useSettings } from "@getpaseo/plugin/client";
import { useEffect, useRef } from "react";
import { mergeSessions, parseBoardDef, parseSessions, type BoardDef, type BoardSessions } from "../../shared/core";
import { BOARD_SETTINGS, SESSION_SETTINGS } from "../../shared/settings";
import { setDef, setSessions, type BoardStore, type Record_ } from "./store";
import { createWriteQueue } from "./write-queue";

const SAVE_DELAY_MS = 600;

type Settings = ReturnType<typeof useSettings>;
type Parsed<T> = { value: T; ok: true } | { value: T; ok: false; original: unknown };

function useSyncedRecord<T>(
  settings: Settings,
  opts: {
    store: BoardStore;
    parse: (raw: unknown) => Parsed<T>;
    merge: (base: T, mine: T, latest: T) => T;
    read: (s: ReturnType<BoardStore["get"]>) => Record_<T>;
    write: (store: BoardStore, next: Record_<T>) => void;
    onError?: (message: string | null) => void;
  },
) {
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const queue = useRef<ReturnType<typeof createWriteQueue<T>> | null>(null);
  if (queue.current === null) {
    queue.current = createWriteQueue<T>({
      delayMs: SAVE_DELAY_MS,
      save: (values, revision) => settingsRef.current.save(values as never, revision),
      reload: () => settingsRef.current.reload(),
      merge: (b, m, l) => optsRef.current.merge(b, m, l),
      onError: (m) => optsRef.current.onError?.(m),
    });
  }
  const q = queue.current;

  // Store to host.
  useEffect(() => {
    const { store, read } = optsRef.current;
    let last = read(store.get());
    return store.subscribe(() => {
      const now = read(store.get());
      if (now === last) return;
      last = now;
      if (now.ready && now.ok) q.change(now.value);
    });
  }, [q]);

  // Host to store.
  useEffect(() => {
    const { store, parse, read, write } = optsRef.current;
    if (settings.status === "invalid") {
      // The host itself rejected the record. Show the default, read-only; the host keeps the original.
      write(store, { value: read(store.get()).value, ready: true, ok: false, original: settings.error });
      return;
    }
    // A failed load stays "not ready", not empty: nothing is written and nothing is pruned (invariant 9).
    if (settings.status !== "ready") return;
    const parsed = parse(settings.values);
    if (!parsed.ok) {
      write(store, { value: parsed.value, ready: true, ok: false, original: parsed.original });
      return;
    }
    q.observe(parsed.value, settings.revision);
    const current = q.current ?? parsed.value;
    const cur = read(store.get());
    if (!cur.ready || !cur.ok || JSON.stringify(cur.value) !== JSON.stringify(current)) {
      write(store, { value: current, ready: true, ok: true });
    }
  }, [settings.status, settings.status === "ready" ? settings.revision : null, q]);

  // Leaving the screen saves what is pending.
  useEffect(
    () => () => {
      void q.flush().finally(() => q.dispose());
    },
    [q],
  );

  return { saving: settings.saving, saveError: settings.saveError };
}

export function usePersistence(store: BoardStore) {
  const board = useSettings(BOARD_SETTINGS);
  const sessions = useSettings(SESSION_SETTINGS);
  const def = useSyncedRecord<BoardDef>(board, {
    store,
    parse: (raw) => toParsed(parseBoardDef(raw)),
    merge: (_base, mine) => mine, // one writer per client: mine wins
    read: (s) => s.persisted.def,
    write: setDef,
  });
  const sess = useSyncedRecord<BoardSessions>(sessions, {
    store,
    parse: parseSessions,
    merge: mergeSessions,
    read: (s) => s.persisted.sessions,
    write: setSessions,
  });
  return { def, sessions: sess, reset: { def: board.reset, sessions: sessions.reset } };
}

const toParsed = (p: ReturnType<typeof parseBoardDef>): Parsed<BoardDef> => (p.ok ? { value: p.def, ok: true } : { value: p.def, ok: false, original: p.original });
