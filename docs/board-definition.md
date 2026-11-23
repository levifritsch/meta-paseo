# Board definition

User configuration for the board: columns, order, how states group, sort. Plain JSON, versioned. The engine reads it, and built-in views are presets. Shapes are a sketch. The structure and invariants are the part to hold.

## Storage

`defineSettings` supports `scope: "host" | "device"` (checked in `@getpaseo/plugin` 0.16.1).

| Record | Scope | Holds |
|---|---|---|
| board definition | device (per-client, client-only) | columns, sections, sort, view (width, font scale), fold state, queue, card definition |
| board sessions | host (shared) | session colors, hand-collapsed cards |

The server registers only the host-scope record; the host refuses a device-scope one (see `decisions.md`). Both records use a loose host schema, and our own `parse` does the validation. `view` limits: column width 240 to 720, font scale 0.8 to 1.5.

Each record has a schema, a `version`, and a pure `migrate`. A hand-collapse key uses a built-in state group (`needs` / `permission` / `running`), never a user-defined section id, so clients with different definitions agree. Unverified: how finely `"device"` is scoped. Assume one definition per client install.

## Pipeline

```
cards → expand generators → partition (first match wins; rest → Other)
      → sections → sort → place (invariants) → layout + events
```

## Sketch

```ts
type BoardDef = {
  version: 1;
  columns: (RuleColumn | WorkspaceColumns)[];   // order = display order
  sections: { id: string; label: string }[];
  buckets: Record<CardState, string>;           // state → section
  sort: { by: "activity" | "title" | "color" | "waitingSince"; dir: "asc" | "desc" }[];
  view: { columnWidth: number; fontScale: number };
  cards: CardDef;                               // shared by board and queue
  queue: QueueDef;                              // separate from columns
  state: { folded: Record<string, boolean>; workspaceOrder: string[] };
};
type RuleColumn = { kind: "rule"; id: string; title: string; match: Rule; sections?: string[] };
type WorkspaceColumns = { kind: "workspaces"; sections?: string[] };   // a generator
type Rule = { state?; workspace?; project?; model?; hasSubAgents?; idleOver?; not?; any? };
type QueueDef = { include: ("permission" | "question" | "failed")[]; includeSubAgents: boolean;
                  order: "oldest" | "newest"; card?: Partial<CardDef> };
```

## Workspace columns

Generated and reconciled with reality. A `WorkspaceColumns` slot expands from the live workspace list. A new workspace gets a column, and an archived one loses it. User order is kept, new workspaces append, and per-workspace state is pruned against the live list. Prune only after a successful load, so a failed fetch never looks like "everything archived". Empty workspaces fold by default.

## Other

The catch-all for cards no column matches. Always last, not reorderable or deletable, hidden when empty. The first matching column wins, so a card is never in two.

## Presets

Both of today's views reproduce exactly and are the engine's acceptance test. By workspace: one `WorkspaceColumns` slot. By status: `Needs you`, `Done`, `Running` rule columns.

## Cards and queue

The queue has its own filter definition, separate from column rules and configurable. Board and queue share one card definition, and the queue overrides only what differs. Badges follow the queue filter. Defaults include permission, question and failed.

## Invariants

Fixed, and guarded by tests. Derived from `OVERVIEW.md`, not yet verified against code.

1. Every card is in exactly one column.
2. A card waiting on a permission is always expanded.
3. A focused card keeps its column and place until focus leaves.
4. Errored sessions stay queued until they act again or are collapsed.
5. No shake on first load or on config changes.
6. Expanded cards precede compact ones within a section.
7. Sub-agent and background sessions get no cards. Their requests join the queue.
8. An invalid or newer-version definition falls back to the default preset, and the original is kept.
9. Prune workspace state only against a successfully loaded list.
10. Session colors and collapses are keyed by session, never by a user-defined name.

## Open

- `"device"` scope granularity.
- Is `Rule` enough, or do we need regex or tags? Start without.
- Config UI order: presets, drag reorder, bucket table, then raw JSON. No rule builder at first.
- Per-column card overrides. Not needed yet.
