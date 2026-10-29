# Step 2 — Risks, invariants, ambiguities, edge cases

> ai-test-generation pipeline, Step 2 · 2026-10-27 · synced to **CL-10**
> Built from [01-requirements.md](01-requirements.md). No scenarios here: those are in Step 4. Known defects (DEF-nn) are from [qa/qa-review-v1.3.md](../qa/qa-review-v1.3.md) §7.

## 1. Risks (likelihood × impact, highest first)

L/I: H = high, M = medium, L = low.

| # | Risk | L | I | Source | Known evidence |
|---|---|---|---|---|---|
| R-01 | Scope All / My team shows only the user's own activities, so managers can't see their team | H | H | REQ-31, Q16, Q28 | DEF-01, DEF-02, DEF-03 |
| R-02 | Private shows public activities, or private activities leak to other users | H | H | REQ-31, IMP-03 | DEF-01 |
| R-03 | Yesterday's activities appear in neither Current nor Previous | H | H | REQ-22, REQ-23 | DEF-06 |
| R-04 | Dashboard counts differ from the list for the same filters (Main, Priority, Search, "late") | H | H | REQ-08, IMP-01, IMP-02 | DEF-09, Q25, Q26 |
| R-05 | Editing an activity deletes its attachments / address / contact | H | H | IMP-05 | CS §9 S10, gap G-35 |
| R-06 | A stale response overwrites a newer query (fast chip taps, typing) | M | H | REQ-16, BR-10 | — |
| R-07 | Duplicate or missing cards across pages | M | H | REQ-14 | — |
| R-08 | Cancel on the filter sheet changes the applied filters | M | H | REQ-33, BR-9 | — |
| R-09 | A step (start/end/check-in) is sent twice on a double tap | M | H | REQ-69 | — |
| R-10 | Progress shows a value the backend didn't save | M | M | REQ-64, BR-8 | — |
| R-11 | A closed activity still offers edit, status change or progress | M | H | BR-6, BR-7 | — |
| R-12 | Visit-only values stay attached after switching to Task (filter or create) | M | M | REQ-28, BR-2 | — |
| R-13 | Required fields are skipped and an invalid activity is sent | L | H | REQ-44, REQ-52 | — |
| R-14 | Workload shows "Available" when it's unknown | M | M | REQ-48, BR-11 | Q12 |
| R-15 | Current/Previous shift with the device time zone | M | M | IMP-07 | DEF-07 |
| R-16 | A failing lookup blocks the whole screen | L | H | REQ-04 | — |
| R-17 | Loading overlay stays up after a failure (screen stuck) | L | H | REQ-68 | — |
| R-18 | Check-in/out and start times vanish on reload | H | M | IMP-06 | CS §9 S9 |
| R-19 | RTL layout breaks the Visit/Task toggle order or chips | M | L | REQ-40, REQ-71 | — |
| R-20 | Main list paging guesses "more" wrongly (no total) and loops or stops early | M | M | REQ-14, Q18 | CS §4.2 |
| R-21 | FAB covers dashboard numbers | H | L | REQ-07 | DEF-10 |

## 2. Invariants (must always hold)

| ID | Invariant | From |
|---|---|---|
| INV-01 | For any activity, exactly one of Current / Previous contains it | BR-4 |
| INV-02 | No card appears twice in the list | BR-10, REQ-14 |
| INV-03 | Scope shows exactly one value at all times | BR-5 |
| INV-04 | No date range on screen or sent has end < start | BR-3 |
| INV-05 | Progress shown is an integer in 0–100 and matches the last confirmed save | BR-8 |
| INV-06 | Closed occurrences show no Add note, Change status, Reschedule, Start, End or progress drag | BR-6 |
| INV-07 | Applied filters are unchanged after Cancel / back / swipe on the sheet | BR-9 |
| INV-08 | No loading overlay remains after any request finishes | REQ-68 |
| INV-09 | Type ≠ Visit ⇒ no category or execution type is set (filter or form) | BR-2 |
| INV-10 | Dashboard: Visits total + Tasks total = donut total; each type's status counts + late never exceed that type's total | REQ-07 |
| INV-11 | "Available" is never shown for an unknown workload | BR-11 |
| INV-12 | The list on screen always matches the filter chips on screen | BR-10 |

## 3. Ambiguities (block a pass/fail verdict)

Scenarios that depend on these are marked **DEFER** in the coverage matrix until answered.

| # | Question | Blocks | Open item |
|---|---|---|---|
| A-01 | What does each scope send for "only me", and what must All return? | R-01, R-02 | Q16, Q28 |
| A-02 | Should the dashboard follow Main, Priority, Search? | R-04 | Q25, Q26 |
| A-03 | Is "late" a separate bucket or a subset of Pending / In progress? | R-04 | NQ new question, DEF-09 |
| A-04 | Is a date range's end inclusive? (Previous end at today 00:00 or −1 s) | R-03 | Q14 |
| A-05 | Which fields does search match? | REQ-19 | Q19 |
| A-06 | Should Main filter by execution type? | REQ-25 | Q27 |
| A-07 | Workload: four levels and their field | REQ-48 | Q12 |
| A-08 | Per-activity permission flags | REQ-73 | Q13 |
| A-09 | Should edit keep existing attachments, address, contact? | R-05 | NQ new question |
| A-10 | Should step times come from the backend? | R-18 | NQ new question |
| A-11 | Device time zone or company time zone for "today"? | R-15 | DEF-07 |
| A-12 | Is Partially completed (7) editable / actionable? | BR-6 | IMP-10 |
| A-13 | Dashboard Back button and quick filters (BR §5.1) — build or drop? | REQ-01 | DEF-08 |
| A-14 | Is the default 7-day window the agreed list default? | REQ-02 | gap G-58 |

## 4. Edge cases (BOUNDARIES)

| Letter | Case | Input | Expected | Risk |
|---|---|---|---|---|
| **B** Boundary | Activity at today 00:00:00 | start = today 00:00 | Current only | R-03 |
| B | Activity at yesterday 23:59 | start = yesterday 23:59 | Previous only | R-03 |
| B | Activity at yesterday 00:00 | start = yesterday 00:00 | Previous only (fails today: DEF-06) | R-03 |
| B | Default window edges | start = today−6 00:00 and today−7 23:59 | first listed, second not | REQ-02 |
| B | Exactly 10 / 11 / 20 results | count | 10: one page, no placeholder; 11: second page of 1; 20: two pages, stops | R-07 |
| B | Progress 0, 1, 99, 100 | slider ends | saved and shown as sent | R-10 |
| B | Month day 31, weekly all 7 days | form | accepted | REQ-46 |
| B | Filter end = start (same minute) | dates | accepted; end < start blocked | INV-04 |
| **O** Ordering | Two activities with the same start | sort | both shown, stable across pages | R-07 |
| O | Newest ↔ Oldest toggled after paging | sort | restarts at page 1 in the new order | REQ-16 |
| **U** Unicode | Arabic title, emoji, very long title | create / search | saved and shown; card truncates without breaking layout | REQ-12 |
| U | Search with Arabic text, `%`, `'` | search | no error; results or "No activities" | REQ-18 |
| **N** Null/empty | No dates from backend | card | no schedule line | REQ-12 |
| N | Whitespace-only search / note | input | treated as empty (note not sent) | IMP-08, REQ-61 |
| N | Empty department confirm | picker | means everyone | REQ-30 |
| N | Dashboard field missing | response | 0 | REQ-09 |
| **D** Volume | 0 activities | list / dashboard | "No activities"; dashboard all 0 | REQ-13 |
| D | 1 activity | list | one card, no placeholder | REQ-14 |
| D | 500+ activities | scroll | pages keep loading, no duplicates, no freeze | R-07 |
| D | Many departments (deep tree) | picker search | finds nested employees | REQ-30 |
| **A** Access | Solo user | Department chip / row | does nothing / disabled | REQ-30, REQ-35 |
| A | Activity with can-edit false | pencil | toast "You can't edit…" | REQ-53 |
| A | Other user's private activity | any scope | never shown | R-02 |
| **R** Race | Double tap Create / Start / End | tap twice fast | one request | R-09 |
| R | Change chips fast (Current → Previous → Main) | taps | screen ends with Main's results | R-06 |
| R | Drag progress then leave at once | back within 0.6 s | last value saved | REQ-64 |
| **I** Integration | Dashboard 5xx | response | error + Retry; list unaffected | REQ-10 |
| I | Page 2 fails | response | cards kept, retry on scroll | REQ-15 |
| I | Workload request fails | create form | no chip | R-14 |
| I | Step location: permission denied / GPS timeout | device | step sent without location | REQ-58 |
| **E** Environment | Arabic UI | language | RTL; Visit on the right; English digits on the wire | REQ-71 |
| E | Time zone far from server (UTC−12 / UTC+14) | device | Current/Previous still per A-11 | R-15 |
| E | Small phone / large font | display | FAB doesn't hide numbers; chips scroll | R-21 |
| **S** State | Pending → Start → In progress → End → Completed | detail | buttons follow each state | BR-6 |
| S | Status changed to Cancelled from In progress | detail | all edit actions disappear | INV-06 |
| S | Disable → Enable on master | master | label flips each time | REQ-67 |
| S | Check-in → Check-out → Completed | visit | both disabled after Completed | REQ-60 |
