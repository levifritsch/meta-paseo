# meta-paseo

Clean-room, self-contained Session Board plugin. Read `docs/philosophy.md`, then `docs/architecture.md`.

- The hard part is time, not pixels. Model what changes between snapshots, and keep that pure.
- The core knows nothing of React or the daemon. The UI renders what the core decides.
- Compute it, don't keep it. State lives in the store, never in module scope.
- Configuration is data. Fixed rules are invariants, and tests guard them.
- Compose small pieces. Register new kinds, don't edit large components.
- Defaults match today's session-board. Never import from it or from any other plugin.
- Design change: log it in `docs/decisions.md`. Don't let code and docs disagree.
