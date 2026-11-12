# 004 Shifts — Next tasks and open questions (HIGH-LEVEL)

> **Doc v0.3 · 2026-11-12 · synced to changelog CL-3**

## 1. Next tasks

Done in CL-2: the UI against sample data (route, #ShiftsScreen, both tabs, period bar, filter sheet, More entry, EN / AR) and its tests.

1. **Check it on a device** (dev build): More → Shifts, both tabs, filter, Arabic. Sample data: the current week is assigned, later weeks are not. The team tab needs a user with the team attendance permission (stand-in for Q9).
2. **Answer the open questions** below, at least Q2, Q5 and Q9, which block the rest.
3. **Home calendar shift event** and its tap → `Routes.shifts` with `ShiftsArgs(focusDate)` (needs Q2). The screen side (scroll to and highlight the day) is already built.
4. **Design the API** with backend from [current-state-codebase-logic-tech.md](current-state-codebase-logic-tech.md) §4, then add `api-contracts.md`.
5. **Swap the fake repository for the real one** (see §0 of the tech file) and the permission stand-in for the real id.
6. **Maestro flows** for S1–S7.

## 2. Open questions

| # | Question | To | Status | Why it matters |
|---|---|---|---|---|
| Q1 | Does every user see #ShiftsScreen (My shift), or does My shift also need an ESS permission? | Product | Assumed: everyone (R3) | Decides whether the More row is always shown. |
| Q2 | What `referenceId` will shift events have in the calendar response? | Backend | Open | Without it, tapping a shift event opens #RequestDetails (R8). |
| Q3 | Does the week start on Saturday? | Product | Assumed: Saturday (R10) | Period bar and "current week". |
| Q4 | Max date range in the filter? | Product | Assumed: 31 days (R12) | Long ranges make big team lists. |
| Q5 | How does the app know a week is assigned vs day off? (a published flag per week / day from the API) | Backend | Open | "Day off" vs "Not assigned yet" (R16, R17). |
| Q6 | Should tapping an employee in My team open anything (their week)? | Product | Assumed: no (R24) | Possible next step. |
| Q7 | Should the manager also appear in My team? | Product | Assumed: no (R25) | Avoid duplicates. |
| Q8 | With a shift type filter on My shift, hide non-matching days or show "No matching shift"? | Product | Assumed: show (R32) | Readability of the week. |
| Q9 | ESS permission id for the team tab. | Backend | Open. Stand-in in code: the team attendance permission | Needed for `RequestTypeId` (R4). |
| Q10 | Does `getCompaniesAndEmployeesList` return the whole hierarchy under the manager, or only direct reports? | Backend | Open | My team filter must match R5. |
