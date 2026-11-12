# 004 Shifts: Changelog

## Latest status (2026-11-12)

| | |
|---|---|
| Spec version | **v0.3** |
| Latest entry | **CL-3**: one shared filter for both tabs |
| App code | `feautre/shift`: UI built, API and Home calendar event not. Part of it is in commit `a42c8a13a`, the rest uncommitted |
| QA | 27 unit and widget tests pass. Nothing checked on a device. No Maestro flows |

Newest first, using the same entry template as 001.

---

## CL-3 · 2026-11-12 — v0.3 — One shared filter for both tabs, both always loaded

- **Change:** R29 rewritten. The period and filter are one object for My shift and My team. Every change (week arrows, Today, Apply, Reset, pull to refresh, Retry) reloads both tabs, and so does opening the screen. Switching tabs makes no API call.
- **Reason:** product owner: "both using same filtration and every time load both".
- **Affected area:** user-scenarios-rules R29, S6 · cubit and state (`filter` replaces `myFilter` / `teamFilter`)
- **QA impact:** cubit test rewritten (both tabs load together; no team load without the permission).
- **Decisions:**
  - The filter badge counts the fields of the tab being shown: My shift counts range and type, My team also counts department and employee. A department or employee filter set on My team therefore still narrows My team while My shift is open, without a badge there.
  - A manager's screen makes two requests per change instead of one.
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
