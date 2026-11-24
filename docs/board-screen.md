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
- Status: done (f197963). Checked in Paseo on web: a card learns of focus-within by bubbling `onFocus`/`onBlur` from a container with `tabIndex: -1`, so a click on its padding stays inside. `createFocusTracker` (`behaviors/focus-scope.ts`) smooths the blur-then-focus between two inputs. Column scroll works as wanted: the padding scrolls the column, a chat scrolls itself. The input-reporting fallback is untried on native and has the padding gap; revisit if a native client matters. The spike screen, `BoardSpikes.tsx`, stays until 4b is accepted.

**4b.1 Data.** `client/data/` turns Paseo sessions into core `Card`s and a workspace list.
- A pure mapper, tested: `PaseoAgent` to `Card`. State comes from status, attention reason and the pending request kind (see the table below).
- Sub-agent, background and internal sessions get no card (C2, C3). Their count goes on the parent. Their requests are kept for step 5.
- A hook returns `{ cards, workspaces: { loaded, list }, now }`. It must tell a failed load from an empty list (invariant 9).
- Live updates: a real subscription to the agent list, not the 3-second poll of the dev screen. Workspaces need the same.
- Status: built. Checked in Paseo: the initial load shows real sessions, states and workspace names. Live updates work: a running session ending moved its card to `done` in the data screen. Waiting states, sub-agents and open question 6 are unverified, because Paseo gives one window and the data screen blocks driving sessions. They get checked once the board screen is up beside real use. `card-map.ts` (mapper, tested), `live-map.ts` (update reducers), `useLiveCollection.ts` and `useBoardData.ts` (live hook).
- Limits: the host caps a page at 200, so the first load follows `nextCursor` through every page. A snapshot after a reconnect carries only the first page; with over 200 sessions it would drop the rest until reload. Not yet handled: a session that finished with a question open (see open question 6).

**4b.2 Settings and state.**
- Two records, each with a schema, a `version` and a pure `migrate`: the board definition (per client) and board sessions (per host: colors, hand-collapsed cards). Hand-collapse keys use the card state, never a user-defined section id.
- The server registers both (`index.server.ts`). The client writes debounced and merged, and checks the revision. A `conflict` must be handled.
- An invalid or newer-version record falls back to the default and keeps the original (invariant 8). `parseBoardDef` already does this.
- Session colors in core: pick at random among the least-used automatic colors, with white and gray manual only (P1 to P3). Existing sessions are colored oldest first on first load. Randomness is injected, so tests are deterministic.
- The store gets the persisted slice (above) and an ephemeral one: focus, hand-expanded cards, and the previous layout the engine needs. Nothing lives in module scope.
- Status: built; the plugin upgrades and loads with the server registration fixed (a6da7ac). The persistence panel results are not yet reported. Core: `colors.ts` (pick, assign oldest first, prune), `sessions.ts` (record, parse, three-way merge), `view` on `BoardDef` (column width 240 to 720, font scale 0.8 to 1.5; the 360 px default is a placeholder). `shared/settings.ts` defines `board` (device) and `sessions` (host); `index.server.ts` registers `sessions` only: the host refuses to register a device-scope record on the server ("Device settings belong to the client"), so `board` is client-only. `client/state/write-queue.ts` (debounce, merge, conflict, retry; tested), `usePersistence.ts` (bridge to `useSettings`), `useColors.ts`, and the store's persisted and ephemeral slices. The data check screen has a persistence panel.
- Check in Paseo (reload the plugin so the server registers the settings): colors appear and stay across closing and reopening the screen; font scale and hand-collapse persist; the panel shows ready, not invalid; `saving` returns to idle with no error.
- Not tested: whether the client-only `board` record loads without a server registration; whether `useSettings.save` reports a conflict as `false` and then refreshes its state (the write queue assumes it does); whether a `device` record is per client install.
- Invalid records: the host schema is loose on purpose, so our own `parse` sees a newer or broken record, shows the default read-only, and never writes over it. There is no UI yet to reset it (`usePersistence` returns `reset`).
- Limits: the host caps a page at 200, so the first load follows `nextCursor` through every page. A snapshot after a reconnect carries only the first page; with over 200 sessions it would drop the rest until reload. Not yet handled: a session that finished with a question open (see open question 6).

**4b.3 Card.** One `Card` with slots and variants, not separate components.
- Compact: dot, title link, workspace (status view), time, model, context use.
- Full: header, project line, the chat from step 4, request panel, message box. While a question or permission waits, the chat folds behind a Show chat link.
- Failed: the same card with an alert dot and the error at the end.
- Outline in the session color. Menu: open chat, change color, expand or collapse, copy ID, archive. Sub-agent and background-task counts.
- A running compact card shows what it is doing, live. Decide the cost first: one small timeline subscription per running card. Fall back to the state label if it is too heavy.
- Status: built, not yet checked in Paseo. `features/Card.tsx` is one component: `expanded` (the engine's call, passed in) picks compact or full, and `failed` adds the error strip. Outline in the session color; menu (`molecules/Menu.tsx`): open chat (hidden when the host gives no `navigation`), change color (swatches), expand or collapse, copy ID, archive. `ChatView` takes `hideChat`: while a question or permission waits, the card shows the request and message box with a Show chat link. `card-map` extras gained `contextUse` and `error` (`lastUsage`, `lastError`); `card-view.ts` holds the age, context and helper-count text (tested); the store gained `setColor`. The data check screen lists every card, with a hand expand toggle until 4b.4 supplies it.
- Visual pass (after the first look in Paseo), taking the look of `session-board` through our layers: all numbers are named tokens (`radius.card` 14, `font` in tenths, `size.*`, `innerGlow`, `chatBackground`). Menus, the color picker and View Options are one `Popover`: a transparent native `Modal` at the button's window position, which fixes the menu sitting under the chat. Chat replies are Paseo's `Markdown`, which takes no size, so `Reply` scales it with CSS `zoom` (web only; elsewhere it stays full size), which fixes card text scaling skipping the chat. A full card is one surface: header, a darker chat with top and bottom `Fade`s, request, and a message box with a round send button in the session color. `Dot` gained the spinning ring (running) and alert icon (failed). Columns have no frame: an 18px unscaled title, state-count badges, Plus (disabled) and fold icons, a fade under the header, and a folded strip with the name read top to bottom.
- Not done: the live activity line on a compact running card (open question 5). The compact card shows its state label for now; the timeline-subscription cost is unmeasured. Rename and interrupt rows wait for 4b.6.
- Check in Paseo (data check screen, reload the plugin): outlines match the stored colors; Change color updates the outline and survives closing the screen; Expand shows the chat, and a waiting card shows Show chat; a failed card shows its error; Copy ID and Archive work (Archive removes the card); Open chat navigates.
- Not tested: whether `lastUsage.contextWindow*` and `lastError` arrive on the list snapshot, or only on a full agent fetch (the context figure and the error text would then be missing); whether the Menu panel clips inside a scrolling column (4b.4).

**4b.4 Board and columns.**
- A hook runs `board()` on each snapshot, passing the previous layout from the store.
- The screen: a top bar, columns edge to edge with padding inside them, `Glide` around the cards, group labels, folded strips with one dot per session, a count in status-column headers, and `Other`.
- View options: column width and card font scale (80% to 150%, via `FONT_SCALE`). Scale applies to card text only, not the top bar or headers. Today components read the fixed `font` tokens, so this needs a `useFont()` that returns scaled sizes, and the molecules and atoms switch to it.
- Focus and hand-collapse actions write to the store. Clicking out of a focused card clears focus.
- Status: built, not yet checked in Paseo. `state/run-board.ts` (pure, tested) feeds the engine from the store and attaches stored colors; `state/useBoard.ts` runs it per change, keeps the layout in the ephemeral slice and saves the engine's reconciled workspace state with the definition. `features/Column.tsx` (header, groups, folded strip, `Glide` around cards, `FocusScope` per card) and `features/BoardScreen.tsx` (top bar: grouping switch, column width, text size; loading, error, empty and read-only notices). Grouping is the definition's shape: `groupingOf` and `withGrouping` in `core/presets.ts` name the built-in views and carry layout state and view options across a switch. `FontScaleProvider` and `useFont()` replaced the fixed `font` reads in every atom, molecule and feature; the top bar and column headers sit outside the provider, so only card text scales. The board opens from a command-center item, "Open MetaPaseo board" (4b.5 adds the sidebar item).
- Assumptions to confirm in the check: a group with no cards hides its label; only status and `Other` columns show a count (K3), and only they name the workspace on a card; a folded column shows dots and a chevron but no title.
- Check in Paseo (reload the plugin, open the board): both groupings show the real sessions, and the groups, order and sizes match `session-board` on the same sessions (S, M, F, K groups); empty workspaces fold to strips with one dot per session; the text-size stepper scales card text only; column width changes stick across reopening; a card with focus holds its place while others move; clicking outside it releases that; a collapsed card stays collapsed after reopening the board.
- Not tested: layout, scroll and focus (manual only, as planned); the vertical column scroll beside the horizontal board scroll; the Menu panel clipping inside a column.
- Limits: the host caps a page at 200, so the first load follows `nextCursor` through every page. A snapshot after a reconnect carries only the first page; with over 200 sessions it would drop the rest until reload. Not yet handled: a session that finished with a question open (see open question 6).

**4b.5 Open it.** A sidebar item and a command-center item open the screen, replacing the dev screens as the entry point. Keep the dev screens until 4b is accepted.
- Status: not started.
- Limits: the host caps a page at 200, so the first load follows `nextCursor` through every page. A snapshot after a reconnect carries only the first page; with over 200 sessions it would drop the rest until reload. Not yet handled: a session that finished with a question open (see open question 6).

**4b.6 Agent commands.** Rename and interrupt through a server RPC that runs the Paseo CLI, since the client API has no call for them. Added to the card menu.
- Status: not started.
- Limits: the host caps a page at 200, so the first load follows `nextCursor` through every page. A snapshot after a reconnect carries only the first page; with over 200 sessions it would drop the rest until reload. Not yet handled: a session that finished with a question open (see open question 6).

## Session to card state

Implemented in `card-map.ts`. Still needs checking against real snapshots.

| Card state | When |
|---|---|
| `permission` | A pending request of kind `tool`, `plan`, `mode` or `other`. Outranks `needs`. |
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

1. ~~How do we tell a sub-agent, a background session and an internal one apart?~~ Answered in 4b.1: a sub-agent has the label `paseo.parent-agent-id`, a background session has `background`, an internal one `internal`. The list call needs `filter.includeBackground`; internal sessions are left out by default.
2. ~~Is there a live subscription for the agent list and for workspaces?~~ Yes: `paseo.agents.list({ subscribe: {} })` returns a subscription (fresh snapshot after a reconnect), and `paseo.agents.subscribe` and `paseo.workspaces.subscribe` deliver upserts and removals.
3. How finely is `device` settings scope kept? Assume one definition per client install. (Also in `board-definition.md`.)
4. Does the engine's collapse key, the card state, need the coarser needs, permission, running groups from `board-definition.md`? We chose card state in step 1.
5. Is the live activity line on compact cards worth its cost in 4b, or does it wait?
6. How does a session that finished with a question open show in the snapshot? It has no pending request, so the mapper calls it `done`. Check against a real session, and decide whether it needs the timeline.
