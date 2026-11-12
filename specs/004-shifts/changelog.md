# 004 Shifts: Changelog

## Latest status (2026-11-12)

| | |
|---|---|
| Spec version | **v0.3** |
| Latest entry | **CL-13**: branch, visits and tasks on every shift |
| App code | `feautre/shift`: UI built, API and Home calendar event not. Part of it is in commit `a42c8a13a`, the rest uncommitted |
| QA | 27 unit and widget tests pass. Nothing checked on a device. No Maestro flows |

Newest first, using the same entry template as 001.

---

## CL-13 · 2026-11-12 — v0.4 — Branch, visits and tasks on every shift

- **Change:** each shift shows its **branch** (pin + name) and two counters, **visits** and **tasks** (grey pills), from the design (`TalentLink Shifts.html`). My shift: a second line under each shift's name and time (branch on the start, counters on the end). My team: under each employee's department a branch line, and the counters on the end of the row. The Day off group and the "Not assigned yet" / "Day off" pills have none. `Shift` and `ShiftEmployee` gain `branch`, `visitsCount`, `tasksCount`; new `ShiftBranchWidget` and `ShiftCountsWidget`.
- **Reason:** product owner: show the branch and the visits / tasks indicators on My shift and My team items.
- **Affected area:** feature overview, tech §4 (entities), the shift line and the employee row.
- **Decisions:** the values are per shift (an employee with two shifts has a branch and counters in each). Counts of 0 are shown as 0. The fake API makes up the branch names (English only). Open for the API: where the branch name comes from and whether it comes translated.

---

## CL-12 · 2026-11-12 — v0.4 — Department and employee are one field

- **Change:** the filter's Department and Employee fields are one `ActivitySelectFieldWidget` ("Company · department · employee") opening the shared `CompanyEmployeePickerSheet` (the Activities picker). `ShiftFilter` holds `departmentIds` and `employeeIds` (lists) instead of one id each, and `ShiftFilterOptions` carries a `CompanyTree` instead of flat lists. The repository, use case, cubit and fake API take the two lists. `ShiftsOptionPickerSheet` is deleted. The badge counts the field once.
- **Reason:** product owner: one field for employee and department, like the Activities screen.
- **Affected area:** R26, R28, R31, R36, tech §4
- **Decisions:** it is multi-select, as in Activities. The fake API matches an employee when picked or when their department is.

---

## CL-11 · 2026-11-12 — v0.4 — Tap the period title: a date-only filter

- **Change:** the period title in the period bar is tappable and opens `ShiftsDatesFilterSheetWidget`: the main filter's frame with only Start Date / End Date on one line and Cancel / Apply. New rule R38.
- **Reason:** product owner: a small filter to change only the dates, with the same UI and behavior as the main filter.
- **Decisions:** Apply keeps every other filter field. The header Reset puts only the period back to 7 days from today (the main filter's Reset clears everything). The title of the sheet is "Date Range".

---

## CL-10 · 2026-11-12 — v0.4 — The filter sheet follows the Activities approach

- **Change:** `ShiftsFilterSheetWidget` no longer swaps pages inside one sheet. It uses the Activities pieces: `ActivitiesSheetHeaderWidget` (title + Reset), `ActivitiesFilterChipGroupWidget` (type), `ActivitySelectFieldWidget` (department, employee), `StartEndDateFieldsWidget` (dates) and `PickerActionsWidget` (Cancel / Apply), opened with `showModalBottomSheet` (white, 24 radius). Department and employee open a separate `ShiftsOptionPickerSheet` (search, Clear, Cancel / Select; employees show an initials avatar and their department).
- **Reason:** product owner: a different UI approach for department, employee and the filter, the same as the Activities bottom sheet.
- **Affected area:** R26, R30; filter sheet only. The "All" chip is gone (tap the chosen chip again to clear). The sheet fits its content, up to 85% of the screen, instead of the Activities fixed 620 height.
- **Decisions:** picking a department clears an employee of another department, and the employee list only offers the chosen department's employees (R36).

---

## CL-9 · 2026-11-12 — v0.4 — The screen uses the general `SliverOrganizerWidget`

- **Change:** `ShiftsScreen` now uses `SliverOrganizerWidget` / `SliverOrganizerContent` (the widget of the Requests screen) instead of its own slivers. No rule changed.
- **Reason:** product owner: use the general widget of the Requests screen.
- **Decisions:** the tabs and period bar scroll with the list and **come back when the user scrolls up** (the organizer's floating pre-fixed behavior, as on Requests); before they only scrolled away. The empty My shift state is the organizer's `emptyChild`, centered in the space left.

---

## CL-8 · 2026-11-12 — v0.4 — The period is dynamic: 7 days from today the first time, then the selection

- **Change:** the Saturday – Friday week is gone (`shiftWeekStart`, `ShiftFilter.week`, `isWeek`, `isCustomRange`, `currentWeekStart`, `weekOffset`). The first period is today + 6 days (`ShiftFilter.initial`, 12 – 18 Nov). The arrows move by the length of the current period (`lengthInDays`; `previousPeriod` / `nextPeriod` replace `previousWeek` / `nextWeek`) and always work. Reset goes back to 7 days from today. The badge counts the period when it differs from that first period. A single-day period reads "20 Nov 2026".
- **Reason:** product owner: make the 7 dynamic from the current selection; only the first time shows the current 7 days.
- **Affected area:** R9 – R12, R31, Q3 (closed), cubit, state, period bar, fake repository
- **Decisions:**
  - "Current 7 days" is read as **today + 6 days**, not the calendar week. From a Home calendar event it starts at the event's day.
  - The fake API treats today + 6 days (and the past) as assigned and later days as "Not assigned yet". Real rule: Q5.
  - The cubit's `now` clock is kept (the test pins it).

---

## CL-7 · 2026-11-12 — v0.3 — Filter dates: same fields and calendar as the Activities filter

- **Change:** the From / To fields of the filter sheet are now the V2 form fields of the Activities filter (label above, calendar icon), **start and end on one line**, opening the same dialog as the Activities date-time picker but date only (title, red date chip, calendar, Cancel / Ok, no clock). The "Date Range" heading is gone; the field labels are "Start Date" / "End Date". The picker offers 2000 – 2100.
- **Reason:** product owner: same design as the Activities filter, date only.
- **Affected area:** filter sheet only. Two new general widgets, usable by any screen: `showDateCalendarPicker` (`presentation/widgets/start_end_date_time/date_calendar_picker.dart`) and `StartEndDateFieldsWidget` (`start_end_date_fields_widget.dart`). No existing widget was changed.
- **Decisions:** the end can't be picked before the start, and a start moved past the end moves the end to the same day.

---

## CL-6 · 2026-11-12 — v0.3 — No limit on the date range

- **Change:** `kMaxShiftRangeDays` (31) removed. The filter's From / To pick any dates (the only rule: To is never before From). My shift is now a lazy list, and the scroll to the day opened from the Home calendar jumps near it first, since the card may not be built yet. Closes Q4.
- **Reason:** product owner: unlimited range.
- **Affected area:** R12, Q4, screen list
- **Decisions:** the date picker itself still offers only the years today ± 2. A very long range makes a big My team response, so the real API may need paging or its own cap.

---

## CL-5 · 2026-11-12 — v0.3 — No "No matching shift": the API leaves those days out

- **Change:** with a shift type, the (fake) API returns no mismatched items on My shift either: days with none of that type are left out, like on My team. The "No matching shift" pill, its string and `unfilteredShiftCount` / `hasNoMatchingShift` are removed. An empty My shift shows "No shifts to show." (new strings `shiftsEmpty`, `shiftsEmptyHint`).
- **Reason:** product owner: the repo must not return mismatched items, so "No matching shift" isn't needed.
- **Affected area:** R32, tech §4, repository contract · supersedes the `unfilteredShiftCount` decision of CL-4
- **QA impact:** screen tests: type filter lists only the evening days and no Day off; a type with no shift shows the empty state.
- **Decisions:** the real API must do the same (drop assigned days with no shift of the type; for My team also no day off group).

---

## CL-4 · 2026-11-12 — v0.3 — The shift type filter is sent to the API

- **Change:** `typeId` is now a parameter of the my-shifts and team-shifts calls (repository, use cases, cubit). The phone no longer filters by type. The fake repository plays the API and applies it. `ShiftDay` gets `unfilteredShiftCount`; the local helpers `shiftsOfType`, `hasNoShiftOfType` and `filteredByType` are gone.
- **Reason:** product owner: filter by shift type at the API, not locally (fake API for now).
- **Affected area:** R32, tech §0 / §4, repository contract
- **QA impact:** screen test checks that both tabs reload with the type id and show what the repository returns.
- **Decisions:**
  - Without the local filter, "No matching shift" needs a count from the API: each day says how many shifts it has before the type filter.
  - With a type, My team has no day off group and no day without a group of that type (the fake does this; the real API must too).
  - Known: the period bar was simplified in code (no caption, no Today chip, arrows always active). R11 and R12 still describe the earlier design and need updating once that is confirmed.

---

## CL-3 · 2026-11-12 — v0.3 — One shared filter for both tabs, both always loaded

- **Change:** R29 rewritten. The period and filter are one object for My shift and My team. Every change (week arrows, Today, Apply, Reset, pull to refresh, Retry) reloads both tabs, and so does opening the screen. Switching tabs makes no API call.
- **Reason:** product owner: "both using same filtration and every time load both".
- **Affected area:** user-scenarios-rules R29, S6 · cubit and state (`filter` replaces `myFilter` / `teamFilter`)
- **QA impact:** cubit test rewritten (both tabs load together; no team load without the permission).
- **Decisions:**
  - The filter badge counts the fields of the tab being shown: My shift counts range and type, My team also counts department and employee. A department or employee filter set on My team therefore still narrows My team while My shift is open, without a badge there.
  - A manager's screen makes two requests per change instead of one.
  - **Badge counts the period** when from / to differs from the current week (R31), not only a range picked in the filter. A week moved with the arrows now shows 1. `isCustomRange` is derived (the period is not a whole Saturday – Friday week) and only decides whether the arrows work.
  - `_moveWeeks` moves by the period length, both end days included (7 for a week).
  - Known: `shifts_screen.dart` currently has `canSeeTeam: true` hard-coded (permission check commented out) for testing, so the "no tabs for an employee" widget test fails until the permission line is restored.

---

## CL-2 · 2026-11-12 — v0.2 — UI built from the approved design, on sample data

- **Change:** #ShiftsScreen built from the approved design (`TalentLink Shifts.html`): My shift cards, My team grouped by day and shift with sticky day headers, period bar, filter bottom sheet with department / employee pickers, loading / error / empty states, Arabic RTL, and the More row. Data comes from a fake repository. New rules R36, R37; R11, R12, R32 changed (below).
- **Reason:** to start building before the API exists (API is out of scope for now).
- **Affected area:** user-scenarios-rules R11, R12, R32, R36, R37 · tech §0 (new), §4 · overview status · next tasks
- **QA impact:** 27 tests (18 cubit and entity, 9 screen). No Maestro flows yet.
- **Decisions:**
  - **Arrows frozen on a custom range** (R12): the design dims them, so the earlier "move by the range length" was dropped. Today clears the range.
  - **A Today chip** sits in the period bar when another week is shown (R11). The design's notes describe it; its markup was missing, so it was added beside the caption.
  - **The type filter runs on the phone**, so the API must send all shifts of a day (tech §4).
  - **Shift icon from the start time** (sun before 12:00, sunset before 19:00, moon after), because the API doesn't define an icon.
  - **Stand-in for Q9:** the team tab follows the team attendance permission until the real id exists.
  - **Home calendar event not built:** needs Q2 (reference id).
  - Toggle animation fades from clear white, not `Colors.transparent`, which flashed grey (found in the screenshots of the widget test).

---

## CL-1 · 2026-11-12 — v0.1 — First spec

- **Change:** new feature folder with overview, rules R1–R35, scenarios S1–S7, code entry points and open questions Q1–Q10.
- **Reason:** users need to see their weekly shifts (assigned by the admin each week), and managers their team's shifts.
- **Affected area:** all files (new).
- **QA impact:** none yet.
- **Decisions** (from the product owner, 2026-11-12):
  - An employee can have 2 shifts a day, and different shifts on different days.
  - Shift shows name, start, end. Team employee item shows name and department.
  - Overnight shifts are out of scope for now.
  - The screen shows only shifts and "Day off"; an unassigned week shows "Not assigned yet". No leaves or holidays.
  - My team covers everyone under the manager (full hierarchy), gated by a new ESS permission.
  - Filters: date range, shift type; team also department and employee. Bottom sheet with apply / reset.
  - Entry from More and from a shift event in the Home calendar; a day the user works has a shift event.
  - Swap requests, publish notification, offline cache and the API contracts are out of scope for now.
  - No separate tab in the bottom bar (already 5 tabs); one new screen instead.
