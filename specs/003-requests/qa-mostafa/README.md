# qa-mostafa — Submit a leave, then filter for it (LV-FLT-01)

Source: your prompt of 2026-11-05 (in `../prompt.txt`). Built from the app code at commit `c1aae2e3` (`~/StudioProjects/talentlink`).

## Scenario

1. Requests → **New** → **Leave**. Type = `LEAVE_TYPE` (empty = first in the list).
2. Start = the same day next month, End = Start (a one-day leave). **Submit**.
3. If the app says **"Leave is already applied in this period!"**: Ok (the form closes), open a new form, and pick the same day one more month ahead. Up to 6 tries.
4. **Submitted successfully**: the dialog after Submit isn't the overlap message, and the leave is found in step 5.
5. Requests filter, with each field checked both ways:

| Filter set | Expected |
|---|---|
| Request Type `Leave` + Requested Date = leave day + Create Date = today + Status `Pending` | **shown** |
| same, Status `Approved` | hidden ("Requests are empty") |
| same, Requested Date = yesterday | hidden |
| same, Create Date = yesterday | hidden |
| all back to the first set | **shown** |

The app refuses a second leave on the same day, so with the requested date set to the leave day, the list shows only this leave.

## Settings (top of the flow, `env:`)

| Name | Default | What it is |
|---|---|---|
| `LEAVE_TYPE` | `""` | Leave type to pick (text in the type sheet); empty = first |
| `REQUEST_TYPE` | `Leave` | Row in the filter's Request Type list |
| `NEW_STATUS` | `Pending` | Status of a just-submitted leave |
| `NEG_STATUS` | `Approved` | A status the new leave doesn't have |
| `DUPLICATE_TEXT` | `already applied` | Part of the overlap message |

Override one for a run: `./run.sh -e LEAVE_TYPE="Annual Leave"`.

## Run

```bash
~/work/specs-talentlink/specs/003-requests/qa-mostafa/run.sh
```

It uses the account and `DEVICE` in `specs/001-activities/maestro/.env`. Each run creates one leave request.

**Pass:** `[Passed] LV-FLT-01-submit-leave-then-filter` and `1/1 Flow Passed`.
**Fail:** `[Failed] … (<reason>)`. The reason names the step, e.g. `Leave is filtered out: status Approved` (the filter kept it: app bug) or `Leave is listed: …` (the filter lost it: app bug). Screenshots are in `results/`. The dialog texts and the planned dates are in the newest `~/.maestro/tests/*/maestro.log` (search `try `).

## How the app looks to Maestro (from the code)

- Leave form dates: a **wheel** (CupertinoDatePicker, date only; columns month | day | year), not a calendar. Each column turns on its own. The flow turns the year and then the month column, one slow 3% swipe per row, and checks the field (`yyyy-MM-dd`) after Done.
- The balance check (`CalculateInCaseNewLeave`) runs right after the end date is picked. An overlap can show **then**, before Submit, or after Submit. Ok on any error dialog closes the form (`LeaveBackEvent`). Ok on success goes back to the home tabs.
- Filter sheet dates: the Material calendar. The flow taps **Switch to input** and types `mm/dd/yyyy`.
- The filter icon has no id or label. It's tapped at `92%, 7%` (top right).
- Maestro matches text **ignoring case**, so `Request Type` also finds the `REQUEST TYPE` heading, and status chips are tapped only **below** the sheet's `STATUS` label (the list behind has the same words).
- A subflow must not have its own `env:` header: it would override what the caller passes.

## Last run — 2026-11-05, phone RZ8R10Y5LSA: failed on an app bug

Everything up to Submit worked as written: login, Requests, New → Leave, type (first = **Sick Leave**), start wheel (opened on 2026-11-06, turned one month to **2026-12-06**), end = start, balance card shown. After **Submit** the spinner never stops (watched 2.5 min) and no dialog shows.

**Bug (DEF-LV-01):** for Sick Leave the balance check returns no `employeeLeaveDetailsDto`, so **Total Amount** stays empty (shown as "—"). `LeaveBloc._onCallInsertLeaveApiEvent` (`lib/src/presentation/blocs/leave/leave_bloc.dart`) emits `LeaveLoadingState`, then runs `double.parse(totalAmountController.text)` on `""`. That throws `FormatException` before the insert call, so the loading state never ends. `int.parse(remainingBalance…)` would throw the same way on `"-2.0"` when "by current balance" is on.

Until it's fixed, the scenario can run with a type that fills Total Amount: `./run.sh -e LEAVE_TYPE="<type>"`.

## Not verified yet (first run will tell)

Written without seeing these screens on a device (the phone disconnected during the read-only look). Each one fails with a clear message:

- The wheel column positions (month 28%, day 55%, year 78% of the width): the failure is "Start date is the planned day".
- The filter icon spot and the date input format (`mm/dd/yyyy`).
- The server names: the request type `Leave` and the statuses `Pending` / `Approved`.
- A leave type that needs more fields (reason, attachment, …): no dialog after Submit. Set `LEAVE_TYPE` to a simple type.

## Known limits

- Time zone: the Mac running Maestro and the phone must match.
- Each try moves a month ahead, so a run can create a leave up to 6 months out. Leave balance may run out over many runs; delete old test leaves if so.
