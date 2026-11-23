# Board definition (draft 2)

A board definition is the user's configuration for the Session Board: which columns exist, in what order, how states group, and how cards sort. It is plain JSON. The board engine reads it. Built-in views ship as presets.

Draft status: shapes and names will change. The structure and the invariants are the part to hold.
Draft 2 (2026-11-23) folds in the storage check and four answers from the user. See Decisions in [philosophy.md](philosophy.md).

## Storage and scope

Verified in `@getpaseo/plugin` 0.16.1 (`dist/settings.d.ts`): `defineSettings` takes `scope: "host" | "device"`. Session-board uses `"host"` today (`shared/settings.ts`).

- **Board definition: `scope: "device"`.** Per-client, as decided. Same machinery as today: a zod schema, a `version`, a `migrate` function, and revision-checked writes (`saved` / `conflict` / `invalid`). The `invalid` status is how invariant 8 is detected.
- **Session data: stays `scope: "host"`**, shared for consistency, as decided: session colors and hand-collapsed cards.
- Today one host record also holds `columnWidth`, `fontScale`, `columns` (fold state) and `groupBy`. These are layout, so they move into the device record. This is the only part of the split that is not an explicit decision. Check it.

Two records, two schemas:

| Record | Scope | Holds |
|---|---|---|
| `board-definition` | device | columns, sections, buckets, sort, view, queue, fold state |
| `board-sessions` | host | `sessionColors`, `collapsedCards` |

Consequence for the host record: a hand-collapse is keyed `agentId:group@activityAt`. Since clients can now define different sections, **`group` in that key must be a fixed, built-in state group (`needs` / `permission` / `running`), never a user-defined section id.** Otherwise one client's regrouping would invalidate another client's collapses.

Not yet verified: how finely `"device"` is scoped (per app install, per browser profile). Assumed to be one definition per client install.

## Pipeline

```
agents + workspaces
   → cards          (state per agent, from core)
   → columns        (expand generators against live workspaces; see below)
   → partition      (first matching column wins; the rest go to Other)
   → sections       (groups inside a column)
   → sort           (chained comparators)
   → place          (sticky rules; invariants, not configurable)
   → layout + events
```

## Schema

```ts
type BoardDef = {
  version: 1;
  columns: ColumnSlot[];         // order = display order
  other: { title: string };      // catch-all; see below
  buckets: Record<CardState, string>;   // state → section id
  sections: SectionDef[];        // ordered
  sort: SortSpec[];
  view: { columnWidth: number; fontScale: number };
  cards: CardDef;                // shared look of a card; see Cards and the queue
  queue: QueueDef;               // separate from columns
  state: DeviceState;            // fold state and workspace order, pruned against reality
};

type ColumnSlot = RuleColumn | WorkspaceColumns;

type RuleColumn = {
  kind: "rule";
  id: string;
  title: string;
  match: Rule;
  sections?: string[];           // override which sections show, and in what order
};

// A generator, not a column. Expands at runtime to one column per live workspace.
type WorkspaceColumns = {
  kind: "workspaces";
  sections?: string[];
};

type SectionDef = { id: string; label: string };

type Rule = {
  state?: CardState[];
  workspace?: string[];          // workspace ids
  project?: string[];
  model?: string[];
  hasSubAgents?: boolean;
  idleOver?: number;             // ms since last activity
  not?: Rule;
  any?: Rule[];                  // OR; plain fields are ANDed
};

type SortSpec = { by: "activity" | "title" | "color" | "waitingSince"; dir: "asc" | "desc" };

type DeviceState = {
  folded: Record<string, boolean>;   // column id or workspace id → folded
  workspaceOrder: string[];          // user's order of workspace columns
};
```

## Workspace columns: generated, reconciled with reality

Columns for workspaces are not written by hand. A `WorkspaceColumns` slot expands, on every render, from the live workspace list:

- **A new workspace gets a column** the moment the directory reports it.
- **An archived workspace loses its column.** The directory already drops workspaces that are archived or archiving (`directory.ts`, `fetchWorkspaces`). The board follows it.
- **Order.** Workspaces in `state.workspaceOrder` come first in that order. Workspaces not in the list append at the end, in directory order. Dragging a column rewrites the list.
- **Per-workspace state** (fold, order) is keyed by workspace id. It is pruned against the live list so stale entries do not pile up.
- **Prune only on a good read.** Pruning runs only when the workspace list has loaded successfully. A failed or still-loading fetch must never read as "all workspaces archived".
- **Empty workspaces fold into the narrow strip by default**, as today. A manual fold overrides it.

`WorkspaceColumns` is one slot in `columns[]`, so it can sit next to rule columns. For example, a pinned `Needs you` rule column followed by one column per workspace.

## The "Other" column

A card that matches no column goes to `Other`. This catches workspace-less agents and cards missed by user-written rules.

- Always last. Not reorderable and not deletable.
- Hidden when empty. It appears the moment any card falls into it.
- Same sections and sorting as any column.
- The first column in order whose rule fits wins. A card is never in two columns.

## Presets

Both of today's views are reproducible exactly. They are the acceptance test for the engine.

- **By workspace:** `columns: [{ kind: "workspaces" }]`.
- **By status:** three rule columns. `Needs you` (question, error), `Done`, `Running` (running, permission, with permission sorted first).

## Cards and the queue

The Needs You queue is **not** driven by the column rules. It has its own filter definition. It can be configured, but separately from the columns. It does share one thing with the board: **card definitions.**

```ts
// How a card looks and behaves. One definition, used by columns and the queue.
type CardDef = {
  density: "compact" | "comfortable";
  fields: FieldId[];             // which fields show (model, usage, time, project ...)
  decorations: DecorationId[];   // sub-agent tag, background tasks, ...
  wrapLines: boolean;            // default for command and diff blocks
};

type QueueDef = {
  include: ("permission" | "question" | "failed")[];   // default: all three
  includeSubAgents: boolean;     // default: true
  order: "oldest" | "newest";    // default: "oldest", with failures after requests
  card?: Partial<CardDef>;       // overrides on top of the shared definition
};
```

- The queue overrides only what differs. Today that is one thing: wrap-lines starts off on the board and on in the queue. The shared definition keeps the two from drifting, with `queue.card = { wrapLines: true }` capturing the difference.
- Request renderers, state presentation, menu actions and decorations come from the same registries ([philosophy.md](philosophy.md)), so both surfaces render a request the same way.
- **Decided: badges follow the queue filter.** The sidebar and workspace badges count only what the queue includes. Items outside the filter get no badge. The filter is the user's own choice, so missing a kind they excluded is accepted. Cards on the board are unaffected by the filter. The default `include` stays permission, question and failed.

## Invariants (fixed, not configurable)

Protected by property and scenario tests.

1. Every card appears in exactly one column (possibly `Other`).
2. A card waiting on a tool permission is always expanded and has no collapse control.
3. A card with focus inside it keeps its column and its place when its status changes, until focus leaves or the user sends to it.
4. Sessions with an error stay in the Needs You queue until they do something new or the user collapses them.
5. No shake on first load, and none on config changes (regrouping, reordering, workspaces appearing or disappearing from config edits).
6. Expanded cards come before compact ones within every section.
7. Sub-agent and background sessions never get cards of their own. Their permissions and questions join the queue.
8. The definition always validates. A bad or newer-version definition falls back to the default preset, and the original is kept, not overwritten.
9. Workspace-column pruning happens only against a successfully loaded workspace list.
10. Session colors and hand-collapses are keyed by session, never by a user-defined name, so clients with different definitions agree on them.

## Preferences (configurable)

Column order, column titles, which rule columns exist and what they match, where the workspace generator sits, fold state, which states share a section, section order, sort chain, column width, font scale, card fields and decorations, and the queue's filters.

## Migration

`version` is required from day one. Each version bump ships a pure migration function, run through `defineSettings({ migrate })`. A definition with a newer, unknown version is not edited. The board runs the default preset and warns.

## Open questions

1. **Granularity of `"device"`.** Not documented in the plugin types. Check by testing, or confirm with the Paseo docs.
2. **Rule power.** Is the `Rule` shape enough, or do we need regex or tag matching? Start without.
3. **Config UI.** Planned order: presets, drag reorder, bucket table, then raw JSON as the escape hatch. No rule builder initially.
4. **Per-column card overrides.** The draft has one shared `CardDef` plus a queue override. Do we also want per-column overrides? Not needed yet.

Closed in this round: layout fields live in the device record (confirmed); badges follow the queue filter (decided).
