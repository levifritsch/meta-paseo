# Architecture

## Layout

```
shared/core/   pure TS: cards, placement, queue, colors, events, board engine
client/data/   Paseo adapters; the only code that knows the client API
client/state/  one store: persisted slice and ephemeral slice
client/ui/     tokens → atoms → behaviors → molecules → features
server/        settings and the rename/interrupt RPC
```

Paseo only builds plugin modules under `client/`, `server/` and `shared/`. `index.client.tsx` and `index.server.ts` sit at the repo root.

`shared/core/` imports nothing from the others. A layer imports only from layers before it. Files stay small enough to read whole.

## Pipeline

Snapshots in, layout and events out. The board is a pure function of `(previous layout, agent/workspace snapshot, settings, focus, now)`. Clock and ids are injected.

## UI layers

| Layer | Contents | Rule |
|---|---|---|
| Tokens | colors, spacing, type, motion, session palette | one file, no magic numbers elsewhere |
| Atoms | Dot, Btn, Chip, Badge, Switch, Stepper, Segmented... | stateless, domain-free |
| Behaviors | `Glide` (slide to place), `Shake`, `Reveal`, `Foldable`, `useFollowScroll`, `useDraft` | wrap children by key; know nothing of cards |
| Molecules | Menu, CodeBlock, Composer, ChatRow, Header | compose atoms |
| Features | Card, Column, Queue, NewChat, QuestionForm | the only layer that knows Paseo types |

The UI kit lives inside this plugin. Headless logic with thin views: scroll-follow is a hook with an explicit state machine, testable alone. One `Card` with slots and variants, not separate compact/full/failed components. A gallery page shows every atom in every state.

## Integration surface

Contributions the plugin makes to Paseo (>=0.16.0): a screen, a sidebar item, workspace-row badges, an explorer panel (the queue), a command-center item. The server side registers settings and handles one RPC that runs rename and interrupt through the Paseo CLI, because the client API has no call for them. Everything else goes through the client API: agent and workspace lists and subscriptions, timelines, send, permission answers, archive. Only `data/` knows any of this. Use `usePaseo()`, not the entity-state hooks (`useAgent`, `useAgents`): Paseo 0.17.3 gave plugin screens no state source for them and they throw "Plugin state hooks must run inside a plugin host".

Settings writes are debounced, merged, and checked against a revision, so a `conflict` can happen and must be handled.

## Extension points

Typed registries inside the plugin, not a plugin system. Only where variation already exists.

- Request renderers by kind (`question`, `plan`, `tool`, `other`).
- State presentation: dot, color, icon, label.
- Card menu actions and card decorations.
- Sort comparators and rule predicates.
- Board presets.

## Testing

- Scenario tests for placement and sticky rules, written from the behavior spec.
- Property tests over the pipeline: no card lost, none in two columns, rules hold for any valid definition.
- Test runner and commands: pick when scaffolding.

## Risks

- **Platform.** The old code uses React Native primitives with web-only styles. `Glide` and `useFollowScroll` carry the risk. Spike them first. If one fails, simplify the behavior, not the architecture.
- **Config explosion.** Every option multiplies the test surface. Guard with property tests, and add options on demand.
- **Over-abstraction.** Add a slot or registry only where code already varies.
- **Unverified spec.** The invariants and the "Other" concept come from `OVERVIEW.md`, not from code.

## Build order

0. Behavior spec: scenarios seeded from `session-board`'s `OVERVIEW.md`, verified against its code.
1. Board engine and `core/`, reproducing today's two views as presets.
2. Tokens and atoms.
3. Spikes: `useFollowScroll`, `Glide`.
4. Chat view, then answering (questions, permissions, composer). Done as a dev screen, "Open MetaPaseo chat view"; cards come with the board UI.
5. Needs You queue.
6. New-chat card.
7. Motion and shake polish.
