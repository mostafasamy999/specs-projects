# 004 Shifts: Changelog

## Latest status (2026-11-12)

| | |
|---|---|
| Spec version | **v0.1 draft** |
| Latest entry | **CL-1**: first spec |
| App code | Nothing built |
| QA | None yet |

Newest first, using the same entry template as 001.

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
