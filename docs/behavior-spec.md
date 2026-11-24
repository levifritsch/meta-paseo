# Behavior spec

Scenarios for the board engine: snapshot in, layout and events out. Seeded from `session-board`'s `OVERVIEW.md`. **Not yet verified against its code.** Each scenario becomes a test in `tests/core/`. IDs are stable; mark scenarios dropped, never renumber.

Vocabulary: **state** is `needs` (question), `permission`, `running`, `done`, `failed`. **Expanded** and **compact** are card sizes. **Group** is a labelled section inside a column.

## Classification

- **C1.** A session whose turn is over but whose sub-agents or background tasks still work counts as `running`.
- **C2.** Sub-agent and background sessions get no card. Their requests join the queue, tagged with the parent.
- **C3.** Internal sessions are not shown.

## Default size and order

- **S1.** A `needs`, `done` or `failed` card opens expanded. `running` and `permission` cards open compact.
- **S2.** A card waiting on a permission is always expanded, with no collapse control. When answered, it returns to the size it had before.
- **S3.** An expanded card stays expanded when it moves from `running` to `permission`.
- **S4.** Within a column, and within each group of a workspace column, expanded cards precede compact ones.
- **S5.** A card you expand goes to the bottom of the expanded stack in its group, and the column scrolls to it. A card you collapse goes to the top of the compact stack.
- **S6.** A card that moves into a column joins below the expanded cards already there.

## Collapse memory

- **M1.** A hand-collapsed card stays collapsed across closing and reopening the board, while it stays in the same group.
- **M2.** A `done` session you collapsed reopens as soon as it does something new.
- **M3.** Collapsing a `failed` card marks it dealt with: it leaves the queue and drops below the expanded cards.
- **M4.** A failed session stays queued until it acts again or is collapsed.

## Focus pinning

- **F1.** A card with focus inside it keeps its column and place when its state changes. Its dot and outline update at once.
- **F2.** It moves when focus leaves or when you send to it.
- **F3.** A pinned card that starts waiting on a permission still expands (S2 beats F1 for size). Found by the property test.
- **F4.** Pinning holds a card's size only against automatic change. A hand collapse or expand applies at once, even though clicking the toggle puts focus in the card. Found live in Paseo: the toggle did nothing until you clicked elsewhere.

## Columns

- **K1.** Workspace view: one column per workspace. A workspace with no sessions folds to a strip. A folded column shows one dot per session in its state color.
- **K2.** Status view: `Needs you` (needs, failed), `Done` (done: expanded above compact), `Running` (running, with `permission` sorted to its top).
- **K3.** Status columns show one count each in the header. Cards there name their workspace.
- **K4.** A card appears in exactly one column. Unmatched cards go to a trailing `Other`, hidden when empty.

## Events

- **E1.** A column header shakes when a card there comes to need you or finishes: a state change in the column, or a move into it. A newly appearing card counts as a move in. (Not in `OVERVIEW.md`; our reading.)
- **E2.** No shake on first load, or when the grouping or definition changes.
- **E3.** A queue filter chip shakes when another item of its kind joins the queue.
- **E4.** Cards present at load do not animate. Nothing animates under reduced motion. (UI concern: the core only emits events.)

## Queue

- **Q1.** Order: permissions and questions, oldest first; then failed sessions, oldest first.
- **Q2.** A failed session leaves the queue when it does something new or when collapsed (M3, M4).
- **Q3.** Sub-agent requests are tagged `Sub-agent` with the starting session's title.
- **Q4.** Badges: a workspace row counts items waiting there, in the tone of the loudest kind (failure > permission > question). The Sessions row counts the whole queue.

## Session colors

- **P1.** A new session takes a random color among the least used on the board. White and gray are never auto-picked.
- **P2.** On first load, existing sessions are colored oldest first so they spread.
- **P3.** The color is stored and kept.

## New-chat card

- **N1.** At most one per column. Kept (title, prompt, chips) across leaving the board until sent or cancelled. A second `+` scrolls to it.
- **N2.** In a status column or `Other`, the workspace starts empty. It is never guessed.
- **N3.** Nothing is created until the first prompt is sent. On failure the card returns with its text.

## Chat follow

Tested in `tests/ui/follow-scroll.test.ts` (a UI behavior, not the board engine).

- **L1.** A card's chat keeps the top of the latest reply in view, or the bottom before the turn has a reply.
- **L2.** Scrolling away stops following. The jump button shows only when the latest reply is off screen (before a reply, when the bottom is).
- **L3.** A new prompt or the jump button follows again, aimed at the top of the latest reply.
- **L4.** Scrolling back to the bottom by hand follows again, and then follows the bottom (not the reply top) until the next prompt. (Ours, from trying the spike; `OVERVIEW.md` lists only L3.)
- **L6.** The chat spaces groups apart: each prompt, each reply, and each unbroken run of tool calls and thinking. Inside a run, blocks sit close.
- **L5.** "Show earlier" keeps the same row in view.

## Conflicts with `decisions.md`

- `OVERVIEW.md` stores column width, font scale, folds, grouping, collapses and colors **per host**. Our decisions store layout **per client** and colors and collapses **per host**. Deliberate change; confirm it.
- `OVERVIEW.md` puts `permission` cards in the Running column. Our test fixture does not. Fix the fixture when the status preset lands.
