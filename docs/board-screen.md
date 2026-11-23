# Step 4b: the Board screen

Plan and stage state. Stages are never deleted or renumbered: mark them done, superseded or dropped.

## Why this step exists

Steps 1 to 4 built the engine, the UI kit, two risky behaviors and the chat. None of it is the board yet. Steps 5 to 7 (queue, new-chat card, polish) all sit on a working board, so it comes first. It is also the first time the engine sees real inputs, so it will test whether the spec holds.

## Goal

A Board screen in Paseo that shows real sessions in both views (by workspace, by status), with cards that follow the spec's sizing, collapse, focus and placement rules, and settings that persist.

**Acceptance.** Run it beside `session-board` on the same sessions. Both views match on column contents, card order and sizes through the spec's scenarios (S, M, F, K groups in `behavior-spec.md`). Differences are either logged as decisions or fixed.

## Scope

In: data adapter, settings, session colors, Card, columns, top bar (grouping, column width, font scale), folding, Glide, `Other`, opening the screen.

Out, with the step that takes it:
- Needs You queue, badges, queue chips: step 5.
- New-chat card and the `+` in headers: step 6 (the button shows, disabled).
- Header and chip shake: step 7. The engine already emits the events, and 4b ignores them.
- Rename and interrupt: stage 4b.6, since they need the server RPC.

## Stages

Each stage ends with tests where the logic is pure, and a manual check in Paseo where it is not. Spikes come first, as before.

**4b.0 Spike: focus and column scroll.** The two platform risks.
- Focus-within: does a card know that focus is inside it (a message box, a question form)? `View` has no `onFocus` in React Native. Try bubbling focus events on web, and find the native equivalent. The result decides how the engine gets `focus`.
- Column scrolling: scrolling over the padding beside a card scrolls the column, not the card's chat. Check nested scroll views on web.
- Status: in progress. Spike screen built ("Open MetaPaseo board spikes" in the command center, `client/ui/gallery/BoardSpikes.tsx`). Pure part done and tested: `createFocusTracker` (`behaviors/focus-scope.ts`). Manual check in Paseo, web: bubbling and column scroll both work. One gap: a click on the card's own padding counted as outside, because only inputs take focus. Fix under test: `tabIndex: -1` on the card container, so it takes focus itself. The input-reporting fallback has the same gap, and is untried on native.

**4b.1 Data.** `client/data/` turns Paseo sessions into core `Card`s and a workspace list.
- A pure mapper, tested: `PaseoAgent` to `Card`. State comes from status, attention reason and the pending request kind (see the table below).
- Sub-agent, background and internal sessions get no card (C2, C3). Their count goes on the parent. Their requests are kept for step 5.
- A hook returns `{ cards, workspaces: { loaded, list }, now }`. It must tell a failed load from an empty list (invariant 9).
- Live updates: a real subscription to the agent list, not the 3-second poll of the dev screen. Workspaces need the same.
- Status: not started.

**4b.2 Settings and state.**
- Two records, each with a schema, a `version` and a pure `migrate`: the board definition (per client) and board sessions (per host: colors, hand-collapsed cards). Hand-collapse keys use the card state, never a user-defined section id.
- The server registers both (`index.server.ts`). The client writes debounced and merged, and checks the revision. A `conflict` must be handled.
- An invalid or newer-version record falls back to the default and keeps the original (invariant 8). `parseBoardDef` already does this.
- Session colors in core: pick at random among the least-used automatic colors, with white and gray manual only (P1 to P3). Existing sessions are colored oldest first on first load. Randomness is injected, so tests are deterministic.
- The store gets the persisted slice (above) and an ephemeral one: focus, hand-expanded cards, and the previous layout the engine needs. Nothing lives in module scope.
- Status: not started.

**4b.3 Card.** One `Card` with slots and variants, not separate components.
- Compact: dot, title link, workspace (status view), time, model, context use.
- Full: header, project line, the chat from step 4, request panel, message box. While a question or permission waits, the chat folds behind a Show chat link.
- Failed: the same card with an alert dot and the error at the end.
- Outline in the session color. Menu: open chat, change color, expand or collapse, copy ID, archive. Sub-agent and background-task counts.
- A running compact card shows what it is doing, live. Decide the cost first: one small timeline subscription per running card. Fall back to the state label if it is too heavy.
- Status: not started.

**4b.4 Board and columns.**
- A hook runs `board()` on each snapshot, passing the previous layout from the store.
- The screen: a top bar, columns edge to edge with padding inside them, `Glide` around the cards, group labels, folded strips with one dot per session, a count in status-column headers, and `Other`.
- View options: column width and card font scale (80% to 150%, via `FONT_SCALE`). Scale applies to card text only, not the top bar or headers. Today components read the fixed `font` tokens, so this needs a `useFont()` that returns scaled sizes, and the molecules and atoms switch to it.
- Focus and hand-collapse actions write to the store. Clicking out of a focused card clears focus.
- Status: not started.

**4b.5 Open it.** A sidebar item and a command-center item open the screen, replacing the dev screens as the entry point. Keep the dev screens until 4b is accepted.
- Status: not started.

**4b.6 Agent commands.** Rename and interrupt through a server RPC that runs the Paseo CLI, since the client API has no call for them. Added to the card menu.
- Status: not started.

## Session to card state

Proposed. Needs checking against real snapshots in 4b.1.

| Card state | When |
|---|---|
| `permission` | A pending request of kind `tool`, `plan` or `mode`. |
| `needs` | A pending request of kind `question`, or finished with a question open. |
| `failed` | Status `error`, or attention reason `error`. |
| `running` | Status `running`, or the turn is over but sub-agents or background tasks still work (C1). |
| `done` | Anything finished and waiting for the next prompt. |

## Tests

- Mapper: one scenario per row above, plus the exclusions (C2, C3).
- Color picking: spread over many sessions, white and gray never auto-picked, oldest-first on first load.
- Settings: `migrate`, fallback with the original kept, and conflict handling.
- Property tests extend to arbitrary snapshots through the adapter.
- Not testable here: layout, scroll and focus. Each stage lists a manual check in Paseo.

## Risks

- **Focus-within and nested scroll** on React Native web. Spiked first in 4b.0.
- **Live data cost.** A subscription per running card, plus the list and workspaces, could be heavy. Measure before widening.
- **Font scale touches every component.** Do it as one mechanical change, not piecemeal.
- **The spec is unverified against code.** The first real data will expose gaps. Expect spec edits, logged in `decisions.md`.

## Open questions

1. How do we tell a sub-agent, a background session and an internal one apart in a `PaseoAgent`? The plugin snapshot has `parentAgentId` and `background`, and the raw snapshot has `internal`. Verify in 4b.1.
2. Is there a live subscription for the agent list and for workspaces that a plugin screen may use? The entity-state hooks are not available here (see `architecture.md`).
3. How finely is `device` settings scope kept? Assume one definition per client install. (Also in `board-definition.md`.)
4. Does the engine's collapse key, the card state, need the coarser needs, permission, running groups from `board-definition.md`? We chose card state in step 1.
5. Is the live activity line on compact cards worth its cost in 4b, or does it wait?
