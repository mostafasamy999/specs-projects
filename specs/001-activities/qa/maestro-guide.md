# Maestro guide — writing UI flows for 001 New Activities

Read this before writing or changing a Maestro flow in `qa/maestro/`. It is written for an AI assistant (and for people) who need to turn a test case from the QA review into a flow that runs the same way every time.

## 1. What you are working with

| Item | Where |
|---|---|
| Test cases (source of truth) | `qa/qa-review-v*.md` §3. Every case has an ID (`QF-01`), steps and an expected result. |
| Flows | `qa/maestro/flows/<area>/<ID>.yaml`, one file per test case |
| Shared steps | `qa/maestro/subflows/` |
| Which case has a flow | `qa/maestro/COVERAGE.md` (generated, see §8) |
| Element ids in the app | `lib/src/core/utils/semantics_ids.dart` in the app repo `~/StudioProjects/talentlink` |
| Credentials and device | `qa/maestro/.env` (local only, never committed). Template: `.env.example` |
| Runner | `qa/maestro/run.sh` |
| What is out of date | `qa/sync-status.md`, written by `python3 -I qa/sync_check.py` (see §9) |

App package: `com.ilead.talent.link.talent_link.dev` (development flavor). Flows use `${APP_ID}`.

## 2. Rules

1. **One flow per test case.** File name = test case ID: `flows/quick_filters/QF-01.yaml`. If one flow honestly covers two cases, list both IDs in `tags` (see `SRC-06`, which also covers `LST-06`). A second variant of the same case gets a suffix: `FLT-02b.yaml`.
2. **Select by id first.** Use `id:` from `SemanticsIds`. Use visible text only when no id exists, and only for English UI text that won't change (chip labels like `"Type · Task"`). Never select by screen coordinates.
3. **Never hard-code credentials, phone numbers or company codes.** Use `${LOGIN_PHONE}`, `${LOGIN_PASSWORD}`, `${LOGIN_COMPANY_CODE}` from `.env`.
4. **Assert the expected result from the test case, not what the app happens to do.** If the app is wrong, the flow must fail. Mark known failures with the `known-defect` tag and the defect ID in the header comment.
5. **Don't invent expected results.** If the test case says `[PO-CONFIRM]`, automate only the part that is defined, and say in the header what is left out.
6. **Every flow starts from a fresh launch** through `subflows/open_dashboard.yaml` or `subflows/open_list.yaml`. Don't depend on another flow having run first.
7. **Wait, don't sleep.** Use `extendedWaitUntil` or `subflows/wait_for_results.yaml`. Never use fixed delays.
8. **Leave the app tidy.** Close sheets and forms you opened (`back`), and don't save data unless the case needs it. A flow that creates data must name it `maestro-<ID>-...` so it can be found and cleaned up.
9. **System dialogs:** always decline (`subflows/dismiss_system_dialogs.yaml` taps "No thanks" / "Don't allow"). Never accept permissions or turn on device settings from a flow.

## 3. File template

```yaml
# <ID> — <scenario from the test case> (<priority>)
# Req: <Req column>. Expected: <expected result, in one or two lines>.
# Not checked here: <anything Maestro can't see, e.g. request bodies>.
# Known defect: <DEF-nn>, if any.
# synced: CL-<newest changelog number>
appId: ${APP_ID}
tags: [<ID>, <P0|P1|P2|P3>, <area>, <smoke|regression if in those suites>]
env:                       # only for values a tester may need to change
  SOME_LABEL: Default
---
- runFlow: ../../subflows/open_list.yaml
# steps from the test case
- assertVisible:
    id: "activities_chip_type"
    selected: true
```

`<area>` is the folder name: `dashboard`, `time_scope`, `quick_filters`, `filter_sheet`, `search`, `sorting`, `pagination`, `list`, `create`, `details`, `permissions`. Add `smoke` for cases in the QA review's smoke suite (§6.1) and `regression` for the regression-type cases.

## 4. Subflows

| Subflow | Does | Params |
|---|---|---|
| `open_dashboard.yaml` | Launch (restart), decline system dialogs, log in if needed, open Activities, wait for the dashboard | — |
| `open_list.yaml` | `open_dashboard` + switch to the list + wait for results | — |
| `login.yaml` | Waits for the login form or home; logs in with Phone Number + Remember me only when the form shows | uses `.env` |
| `wait_for_results.yaml` | Waits until the list shows a count or an empty/error message | — |
| `tap_chip.yaml` | Scrolls the quick-filter row to a chip and taps it | `CHIP` |
| `select_scope.yaml` | Scope chip → option → wait | `SCOPE`: `all`, `myTeam`, `myActivities`, `private` |
| `select_type.yaml` | Type chip → option → wait | `TYPE`: `all`, `task`, `visit` |
| `dismiss_system_dialogs.yaml` | Declines location / notification prompts | — |

Call a subflow with parameters like this:

```yaml
- runFlow:
    file: ../../subflows/select_scope.yaml
    env:
      SCOPE: private
```

Add a new subflow when two or more flows need the same three or more steps.

## 5. Element ids (from `SemanticsIds`)

| Screen | id | Notes |
|---|---|---|
| Login | `login_email_field`, `login_password_field`, `login_company_key_field`, `login_remember_me`, `login_submit_button` | `login_remember_me` has `checked` |
| Bottom nav | `bottom_nav_activities_tab`, `bottom_nav_requests_tab` | |
| Activities app bar | `activities_add_button`, `activities_filter_button` | |
| Both views | `activities_view_toggle` | Switches dashboard ↔ list |
| Dashboard | `activities_dashboard_total`, `activities_tasks_summary`, `activities_visits_summary` | Summaries are tappable (open the list for that type) |
| List | `activities_search_field`, `activities_results_count`, `activities_sort_button`, `activities_card` (one per card), `activities_card_edit` (Main list only), `activities_message` (empty/error), `activities_retry_button` | Use `index: 0` for the first card |
| Quick-filter chips | `activities_chip_<key>`: `current`, `previous`, `main`, `type`, `scope`, `status`, `priority`, `department` | Each chip reports `selected` |
| Option sheets | `activities_scope_<scope>`, `activities_type_<all\|task\|visit>`, `activities_sort_<newestFirst\|oldestFirst>`, `options_sheet_reset`, `options_sheet_option` (rows without their own id) | Rows report `selected` |
| Filter sheet | `activities_filter_apply`, `activities_filter_cancel`, `activities_filter_reset` | Inside the sheet, select options by text |
| Create / edit | `activity_create_type_visit`, `activity_create_type_task`, `activity_create_save_button` | Toggles report `selected` and `enabled` (locked when editing); save reports `enabled` |

Useful state checks:

```yaml
- assertVisible: { id: "activities_chip_previous", selected: true }
- assertVisible: { id: "activity_create_type_task", enabled: false }
- assertVisible: { text: "TASK|VISIT", childOf: { id: "activities_card" } }
- assertVisible: { id: "activity_create_type_visit", leftOf: { id: "activity_create_type_task" } }
```

## 6. When an element has no id

1. Prefer adding an id in the app over a fragile text selector.
2. In the app repo, add a constant to `SemanticsIds` (`lib/src/core/utils/semantics_ids.dart`) with a comment naming the widget file, in the same `snake_case` style.
3. Wrap the widget: `Semantics(identifier: SemanticsIds.x, child: ...)`. For a card or other container whose texts must stay readable, add `container: true, explicitChildNodes: true`. Add `selected:`, `checked:` or `enabled:` when the test needs that state.
4. For shared widgets (option sheets, picker buttons), add an optional `semanticsId` parameter instead of a fixed id, as `OptionsBottomSheetOption.semanticsId` and `NewPickerActionsWidget.selectSemanticsId` do.
5. Rebuild and install the app (§7), then add the id to the table in §5 of this guide.

## 7. Running

```bash
cd qa/maestro
cp .env.example .env              # once; fill in the test account and DEVICE
./run.sh                          # every flow
./run.sh flows/quick_filters/QF-01.yaml
./run.sh --include-tags=smoke
```

- Build: install a **profile** or **debug-from-`flutter run`** development build. A debug APK launched by Maestro on its own (after `stopApp`) is very slow and can time out.
  ```bash
  flutter build apk --profile --flavor development -t lib/main_development.dart
  adb -s emulator-5554 install -r build/app/outputs/flutter-apk/app-development-profile.apk
  ```
- Several devices connected (for example a USB phone and the emulator): set `DEVICE=` in `.env` to the `adb devices` id.
- Results: `results/report.xml` (JUnit), screenshots in `results/`, Maestro logs in `~/.maestro/tests/`.
- If the app shows the offline / attendance screen, the emulator's network is down: cold-boot the emulator (`emulator -avd <name> -no-snapshot-load`).

## 8. What Maestro can't check, and what to do instead

Maestro sees only the screen. Expected results about **request bodies** (`onlyMe`, `employeeId`, `fromDateTime`, `skip`, ...) can't be asserted in a flow. For those:
- Automate the UI part (chip selected, list reloaded) and say in the header comment that the request part is checked from the app log.
- The app logs every request with `PrettyDioLogger`; run it with `flutter run` and read the `data:` block (see QA review §7 for how R1 did it).

Expected results that need **specific backend data** (a recurring activity, a private activity assigned to someone else, two assignees) need that data to exist first. Put the title or ID in `.env` / the flow's `env:` so the tester can point the flow at their data, and say so in the header.

After adding or changing flows, regenerate the coverage index:

```bash
cd qa && python3 -I maestro/coverage.py
```

## 9. Keeping flows in step with the changelog

Every changelog entry has a number: `## CL-n · date — version — title`, with a **QA impact** line. Every flow and subflow has a `# synced: CL-n` line just above `appId:`, and the QA review has `**Synced to changelog:** CL-n` in its header. That number is the last change the file was checked against.

```bash
python3 -I qa/sync_check.py      # prints the summary, writes qa/sync-status.md, exits 1 if anything is behind
```

When a new changelog entry (say CL-12) is added:
1. Run `sync_check.py`. Everything synced to CL-11 now shows as behind, and the "Changes to apply" list shows CL-12 with its QA impact.
2. Update the QA review first (test cases added or changed), then set its marker to `CL-12`.
3. For each flow named in the QA impact: change it to match the new expected result, run it, then set `# synced: CL-12`.
4. For the other flows: check that CL-12 doesn't affect them, and set `# synced: CL-12` without other changes.
5. Run `sync_check.py` again until it reports everything up to date.

New flows start with the newest CL. Never bump a marker without checking the file against the missing changes: the marker means "reviewed against", not "touched".

## 10. After a run

Update the **Status** column in the QA review §3 for each case run: `[✓]` passed, `[✗]` failed (raise or reference a `DEF-nn` in §7), `[ ]` not run or waiting for a product answer. Add the run to §7 (build, device, account, results).

## 11. Checklist for a new flow

- [ ] File is `flows/<area>/<ID>.yaml` and the header quotes the case, Req and expected result
- [ ] Has `# synced: CL-<newest>` above `appId:`
- [ ] `tags` has the ID, priority and area (plus `smoke` / `regression` / `known-defect` where they apply)
- [ ] Starts with `open_dashboard.yaml` or `open_list.yaml`
- [ ] Uses ids; any text selector is stable English UI text
- [ ] No credentials, no coordinates, no fixed sleeps
- [ ] Asserts the expected result and fails if the app is wrong
- [ ] Closes what it opened
- [ ] Ran it once on the emulator, and regenerated `COVERAGE.md`
