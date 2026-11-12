# sched-prod incident board — plan

The on-call board for sched-prod. One page, one list: tonight's incidents, newest first, so on-call sees
what just broke and takes it.

## Flows

| flow | who | what happens |
|------|-----|--------------|
| `open-board` | on-call | opens the board; sees tonight's incidents |
| `ack-incident` | on-call | picks an incident on the board and acks it — "I've got this one" |
| `watch-board` | on-call | keeps the board open; it stays current without a reload |

## Requirements

- **R1** New incidents appear live at the top of the list, newest first.
- **R2** Each incident row has an **Ack** button. Ack opens a confirm that names the incident id; only
  confirming sends the ack (`api.ack(id)`) and marks the row acked. Cancel (or Esc) sends nothing.
  *(Changed 2026-11-12, product's decision after the step-1 report: new rows moved under the pointer and
  Ack hit the wrong incident. New incidents stay live at the top; the confirm makes the id visible.)*
- **R7** Rows stay on the board while it is open; a refresh only adds rows, it never removes one.
- **R3** Show a loader until incidents load.
- **R4** The board refreshes itself every 2 seconds while open.
- **R5** Times show in the viewer's local time; day before month for EU locales (dd/mm).
- **R6** The page names its build: `<meta name="build" content="<git sha>">` in the head and the same sha in the footer.

## Hooks (pinned — tests and the replay rely on them)

| `data-testid` | element |
|---------------|---------|
| `board` | the board's main area |
| `loader` | the loader (gone once incidents load) |
| `empty` | what shows when there are no incidents |
| `incident-list` | the list |
| `incident-row` | one incident row, with `data-id="<incident id>"` |
| `ack` | the Ack button in a row |
| `acked` | the acked mark in a row |
| `build-sha` | the sha in the footer |
| `confirm` | the Ack confirm; its text names the incident id |
| `confirm-ack` | the confirm's Ack button (sends the ack) |
| `confirm-cancel` | the confirm's Cancel button (sends nothing) |

## Done

Every issue in `issues/` delivered, deployed to a public https address, and shown working.
