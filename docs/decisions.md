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
