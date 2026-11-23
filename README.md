# meta-paseo

Design docs for Paseo plugins, starting with a clean-room rethink of `session-board`.
This folder holds philosophy and design only. No code lives here.

| Doc | What it holds |
|---|---|
| [philosophy.md](philosophy.md) | The principles every plugin built from this follows, and the layer model for UI. |
| [board-definition.md](board-definition.md) | Draft schema for the user-configurable board, the invariants, and open questions. |

## Status
Draft 2, 2026-11-23. Written from a skim of `../session-board` and its `OVERVIEW.md`, plus a check of the plugin settings types, not a full code read.
Details are expected to change. The principles in philosophy.md are the part to settle first.

## Source material
- `../session-board/OVERVIEW.md`: the current behavior spec. The clean-room remake starts from it.
- `../session-board/mockup.html`: visual reference. It may grow into a gallery of UI atoms.
