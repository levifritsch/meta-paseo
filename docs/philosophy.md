# Philosophy

## Why rebuild

`session-board` works and is about 3/10 spaghetti: sound layering, with the mess concentrated in the UI. A 1,500-line `cards.tsx`, a 200-line scroll-follow component, module-level mutable maps holding placement state, and no tests. Its hard part is not rendering. It is temporal rules: sticky placement, focus pinning, collapse memory, event-triggered motion.

Refactoring it was a viable alternative. We rebuild because we want configuration and extension to be first-class from the start, and a philosophy we can hold to. Treat this repo as the target architecture, and keep the old plugin as behavior reference only.

## Principles

1. **Spec before code.** Behavior is written as scenarios first: snapshot in, layout out.
2. **Pure core, thin shell.** Domain logic has no React and no daemon calls. The UI renders what the core decides.
3. **Derive, don't store.** Compute from the snapshot and settings. State lives in one store, never in module scope.
4. **Events are data.** The core emits "shake this column"; components don't decide it.
5. **Configuration is data.** A versioned, serializable definition drives the board. Built-in views are presets of the same engine.
6. **Invariants are not preferences.** Fixed rules keep the product coherent, and tests guard them. Everything else is configurable.
7. **Compose, don't fork.** One component with slots, not near-duplicates.
8. **Extend by registering.** New kinds are registry entries, not edits to big components.
9. **One home per fact.** One tokens file, one place per rule.
10. **Defaults match today.** Only opt-in changes behavior.
11. **Self-contained.** No dependency on any other plugin.
