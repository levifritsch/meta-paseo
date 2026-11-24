# Decisions

Append only. One entry per decision.

- **2026-11-23: Board definition is per-client** (device scope, verified in `@getpaseo/plugin` 0.16.1).
- **2026-11-23: Catch-all `Other` column.** Cards that match no column go there, and it hides itself when empty.
- **2026-11-23: Workspace columns are generated and reconciled with reality.** A new workspace creates a column, and archiving removes it. Rule columns are always user-written.
- **2026-11-23: Session colors and hand-collapsed cards stay shared per host**, for consistency across clients.
- **2026-11-23: The queue has its own configurable filter definition**, separate from column rules. Card definitions are shared, and the queue may override.
- **2026-11-23: Layout fields (column width, font scale, fold state, grouping) live in the per-client record.**
- **2026-11-23: Badges follow the queue filter.** Nothing outside the filter gets a badge. The default filter is permission, question and failed.
- **2026-11-23: Clean-room rebuild, not a refactor of `session-board`.** Chosen so configuration and extension are first-class from the start. Refactor was the viable alternative.
- **2026-11-23: Self-contained.** No dependency on any other plugin, and no shared UI kit across plugins. The kit lives in this plugin. `session-board` is read-only reference, never imported.
- **2026-11-23: Tooling.** pnpm, vitest, fast-check, `src/` at repo root.
- **2026-11-23: Column sections are optional and set through `buckets`.** A column that declares sections groups its cards by state bucket. One that doesn't has a single unlabelled section.
- **2026-11-23: Permission cards top the Running column through the expanded-first rule**, not a sort key. A permission card is always expanded, so it sorts above compact cards.
- **2026-11-23: UI targets React Native primitives.** Screens receive `theme` as a prop. Tokens derive from it, plus fixed colors the theme lacks.
- **2026-11-23: Code lives in `shared/` and `client/`, not `src/`.** Paseo's build rejects plugin modules outside `client/`, `server/` and `shared/`. This replaces the earlier `src/` layout. `core` is in `shared/` so the server can use it.
- **2026-11-23: Device-scope settings are client-only.** The host refuses a server registration of one ("Device settings belong to the client"). The server registers `sessions` (host scope) only, and the `board` record is read and written through the client's `useSettings`.
- **2026-11-23: Both settings records use a loose host schema.** Real validation, migration and the keep-the-original fallback live in `shared/core` (invariant 8). A strict host schema would reject a newer record outright and hide it from us.
- **2026-11-23: `view` (column width, font scale) lives in the board definition record**, per client. Out-of-range values reset to the default without rejecting the definition.
- **2026-11-24: A collapsed card goes to the top of the compact stack; an opened card still goes to the bottom of the expanded stack** (S5). Tried the top for opened cards too and reverted it: cards jumped on automatic state changes.
- **2026-11-24: A card shows the raw model id.** Paseo exposes no model-name catalog to the plugin client, and a name parsed from the id was fragile.
- **2026-11-24: State is shown by symbol as well as color.** State colors are the session colors (question amber, failed red). Chosen so state reads without color and matches the palette.
