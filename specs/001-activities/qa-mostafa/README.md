# qa-mostafa — Create a task, then filter for it

Source: [../prompt.txt](../prompt.txt)

## Scenario (CRT-FLT-01)

1. Create a **Task** titled `QA-M-<timestamp>`, priority **High**, **Private**, start = end = now (rounded up to 5 min by the wheel).
2. Submit. Expect **"Activity created"** and a return to Activities.
3. In the list (default: the current month), the card shows the title, `TASK`, `High`, `Private`, status `Pending`, and today's start time.
4. Each filter must keep or drop the task correctly:

| Filter | Shown | Hidden |
|---|---|---|
| Status (quick chip) | Pending | Completed |
| Priority (quick chip) | High | Low |
| Scope (quick chip) | Private, My Activity, All | (My Team not checked: not in the spec) |
| Start date-time (filter sheet) | from today 00:00 | from tomorrow 00:00 |

Change the values at the top of the flow (`env:`) if the backend uses other status or priority names.

## Files

| File | What it does |
|---|---|
| `CRT-FLT-01-create-task-then-filter.yaml` | The test |
| `scripts/test_data.js` | Unique title and the filter's expected date strings |
| `scripts/start_slot.js` | Expected start/end time on the card (now rounded up to 5 min) |
| `subflows/create_task.yaml` | Fills and submits the create form |
| `subflows/pick_quick_option.yaml` | Opens a quick chip (status / priority) and picks an option |
| `subflows/expect_task.yaml` | Searches the title and asserts the card is shown / hidden |
| `subflows/set_filter_start.yaml` | Moves the filter sheet's start field one day at a time to the expected date |

The flow also uses the shared subflows in `../maestro/subflows/` (login, open dashboard, scope, search).

## Run

From `specs/001-activities/`, with `maestro/.env` filled in (`DEVICE` must match `adb devices`):

```bash
maestro/run.sh ../qa-mostafa/CRT-FLT-01-create-task-then-filter.yaml
```

Screenshots go to `maestro/results/qa-mostafa-*.png`. Each run creates one task on the test backend.

## Last run

2026-11-05 on the Samsung phone `RZ8R10Y5LSA`: **passed** in 8 min (all steps above).

## How this app looks to Maestro (learned while getting it to pass)

- Create form: the "Start date and time" label isn't tappable; tap the field below it ("Select..."). Closing the wheel puts focus back in Title, so hide the keyboard before tapping End.
- The "Activity created" dialog is one node: `Activity created\nIt's now in your activities list.`
- A list card is the `activities_card` node (no text) holding one node with all its lines joined (`TASK\n#2811\nHigh\nPrivate\n<title>\nPending\n...`). Match with a regex and `childOf`.
- Filter sheet date field is one node: `Start date and time\nSun, 1 Nov 2026 · 00:00`.
- Don't re-type into the search box: the tap lands mid-text and `eraseText` leaves part of the old query.

## Known limits

- **Time zone:** expected dates are computed on the Mac running Maestro. The Mac and the device must use the same time zone.
- **5-minute boundary:** the expected card time is taken right before the start wheel opens (`scripts/start_slot.js`). If a 5-minute mark passes in that second, the card check is off by 5 minutes. Rerun.
- **End of month:** the default list covers the current month, so a task created at 23:55 on the last day can fall into the next month.
- **Wheel swipe:** `set_filter_start.yaml` swipes the day column (x 25%, y 88% → 85%) once per pass. If the start field never reaches the expected date (it skips days or doesn't move), edit the `swipe` points in that file for your screen.
