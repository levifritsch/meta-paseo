# Philosophy

How we build Paseo plugins. These rules are meant to hold from the first line of code.
Most of the complexity in session-board is temporal (sticky placement, focus pinning, collapse memory, event-triggered motion), not visual. The principles below put that complexity in testable places.

## Principles

1. **Spec first.** Behavior is written as scenarios ("snapshot A, then snapshot B, with this focus, gives this layout") before it is built. `OVERVIEW.md` is the seed.
2. **Pure core, thin shell.** Domain logic has no React and no daemon calls. It takes snapshots and returns layout and events. The UI renders what the core says.
3. **Derive, don't store.** Anything computable from the agent snapshot and the user's settings is not state.
4. **No module-level mutable state.** If something must persist between renders, it lives in the store, where it can be tested and reset.
5. **Events are data.** "Shake this column" is an event the core emits, not a side effect inside a component.
6. **Data over code for configuration.** What users can change is a versioned, serializable definition, not branches in components. Built-in views are presets of the same engine.
7. **Invariants are not preferences.** Rules that keep the product coherent are fixed and protected by tests. Everything else is configurable.
8. **Compose, don't fork.** One component with slots and variants, not near-duplicate components.
9. **Extend by registering.** New request types, card actions, decorations, sorts and presets are registry entries. Adding one does not mean editing a large component.
10. **Each fact has one home.** One tokens file for layout numbers, one place for each rule, one store for state.
11. **Defaults match today.** The out-of-the-box experience stays the same. Only opt-in changes behavior.
12. **Config changes make no events.** Reordering or regrouping glides things into place but never shakes or alerts.

## UI layers

Each layer imports only from layers above it in this table.

| Layer | Contents | Rule |
|---|---|---|
| Tokens | colors, spacing, radii, type scale, motion durations, session palette | one file, no magic numbers in components |
| Atoms | Dot, Btn, IconButton, Chip, Badge, Tag, Switch, Stepper, Segmented, Rule | stateless, theme from context, no domain types |
| Behaviors | `Glide` (slide to place), `Shake`, `Reveal`, `Foldable`, `useFollowScroll`, `useDraft` | wrap children, keyed by id, know nothing about cards |
| Molecules | Menu/Popover, CodeBlock (fold and wrap), Composer, ChatRow, Header | compose atoms, take plain props |
| Features | Card, Column, Queue, NewChat, QuestionForm | the only layer that knows Paseo types |

Headless logic plus thin views: behavior such as scroll-following is a hook with an explicit state machine (`following`, `user-controlled`, `anchoring`), tested on its own. The view only renders.

## Layout of a plugin

```
core/    pure TS: cards, placement, queue, colors, events, board definition engine
data/    Paseo adapters; the only code that knows the client API
state/   one store: persisted slice and ephemeral slice, plus selectors
ui/      tokens, atoms, behaviors, molecules, features
```

`core/` imports nothing from `data/`, `state/` or `ui/`. Files stay near 300 lines or fewer.

## Extension points

Typed registries local to the plugin. We are not building a general plugin system.

- Request renderers, keyed by request kind (`question`, `plan`, `tool`, `other`).
- State presentation: `CardState` to dot, color, icon, label.
- Card menu actions: `{ id, label, icon, when(card), run(card) }`.
- Card decorations: `{ slot, when(card), render(card) }` (sub-agent tag, context usage, background tasks).
- Sort comparators and match predicates.
- Board presets.

Add a slot or registry only where the code already has variation.

## Testing

- Scenario tests for the placement rules, written from the spec.
- Property tests over the board pipeline: no card lost, no card in two columns, sticky rules hold for any valid definition.
- A gallery page showing every atom and molecule in every state.

## Build order

1. Board definition engine and `core/`, reproducing today's two views as presets.
2. Tokens and atoms.
3. Spikes, early: `useFollowScroll` and `Glide`. They carry the platform risk.
4. Chat view, then answering (questions, permissions, composer).
5. Needs You queue.
6. New-chat card.
7. Motion and shake polish.

## Decisions

Append only. Add new entries below.

- **2026-11-23: Board definition is per-client.** Each client keeps its own layout. See [board-definition.md](board-definition.md).
- **2026-11-23: Catch-all `Other` column.** Cards that match no column go to an `Other` column, which hides itself when empty.
- **2026-11-23: Workspace columns are generated and reconciled with reality.** A new workspace creates a column. Archiving a workspace removes it. A slot in the board definition expands against the live workspace list. (Narrows the earlier "no auto-generated columns" note: that applied to rule columns, which are always user-written.)
- **2026-11-23: Session colors and hand-collapsed cards stay shared per host**, for consistency across clients. The board definition itself is per-client (device scope, verified in `@getpaseo/plugin` 0.16.1).
- **2026-11-23: The Needs You queue has its own filter definition, separate from column rules, and configurable.** Card definitions are shared between the board and the queue, with the queue allowed to override.
- **2026-11-23: Layout fields (column width, font scale, fold state, grouping) live in the per-client record.**
- **2026-11-23: Badges follow the queue filter.** Nothing outside the user's filter gets a badge. The default filter stays permission, question and failed.
