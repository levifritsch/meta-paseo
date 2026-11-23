# meta-paseo

A clean-room Session Board plugin for Paseo: design docs and the code built to them.

Self-contained. It depends on no other plugin and imports nothing from `session-board`. Allowed dependencies are Paseo's own SDK packages (`@getpaseo/*`), React and zod.

| Doc | Holds |
|---|---|
| [philosophy.md](docs/philosophy.md) | Why we are rebuilding, and the principles. Read first. |
| [architecture.md](docs/architecture.md) | Layers, layout, integration surface, extension points, risks, build order. |
| [board-definition.md](docs/board-definition.md) | The configurable board: schema, invariants, open questions. |
| [decisions.md](docs/decisions.md) | Append-only decision log. |

Status: draft 3, 2026-11-23. Written from a skim of `../session-board` (read only, as reference) and its `OVERVIEW.md`, not a full code read.
