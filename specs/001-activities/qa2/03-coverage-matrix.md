# Step 3 — Coverage matrix

> ai-test-generation pipeline, Step 3 · 2026-10-27 · synced to **CL-10**
> One row per scenario. Full Given/When/Then: [04-test-scenarios.md](04-test-scenarios.md). How each is verified: [05-oracles.md](05-oracles.md).

**Columns**
- **Covers:** REQ / IMP from [01](01-requirements.md), INV / R from [02](02-risks-invariants.md).
- **Cat:** Happy · Neg (negative) · Bnd (boundary) · State · Race · Integ (integration failure) · Access · Env (environment) · Inv (invariant) · Uni (Unicode).
- **Oracle:** UI (on screen) · Data (re-open / other screen confirms it) · Req (request log) · Neg (must not happen).
- **Auto:** **M** = Maestro can check it from the screen · **L** = needs the request log (`flutter run`) · **X** = needs a forced backend reply, network or device setting · **B** = blocked (feature or answer missing).
- **Review** (Step 7): **KEEP** = ready · **KNOWN** = ready, expected to fail on a known defect · **DEFER** = waits for the ambiguity named.

## Matrix

### Dashboard (DSH)
| ID | Scenario | Covers | Cat | P | Oracle | Auto | Review |
|---|---|---|---|---|---|---|---|
| DSH-01 | Activities opens on the dashboard after a shimmer | REQ-01, REQ-07 | Happy | P0 | UI | M | KEEP |
| DSH-02 | Dashboard shows the default date range today−6 – today | REQ-02, REQ-07 | Happy | P1 | UI | M | KEEP (A-14) |
| DSH-03 | Donut total = Visits + Tasks; status counts never exceed a type's total | INV-10 | Inv | P0 | UI | M | KEEP |
| DSH-04 | Dashboard keeps counting both types when the list is filtered to Tasks | REQ-08 | Happy | P1 | UI | M | KEEP |
| DSH-05 | Dashboard follows the Status filter | REQ-08 | Happy | P1 | UI | M | KEEP |
| DSH-06 | Dashboard vs list counts with Priority set | REQ-08, IMP-01, R-04 | Neg | P0 | UI | M | DEFER A-02 |
| DSH-07 | Dashboard vs Main list counts with Main selected | REQ-08, IMP-01, R-04 | Neg | P0 | UI | M | DEFER A-02 |
| DSH-08 | Overdue Pending task counted under Pending | IMP-02, R-04 | Neg | P0 | UI | M | DEFER A-03 (DEF-09) |
| DSH-09 | Dashboard request fails → message + Retry recovers | REQ-10, REQ-68 | Integ | P1 | UI, Neg | X | KEEP |
| DSH-10 | Account with no visits shows Visits 0 everywhere | REQ-09 | Bnd | P2 | UI | M | KEEP |
| DSH-11 | Tap Tasks summary → list of Tasks only | REQ-11 | Happy | P0 | UI | M | KEEP |
| DSH-12 | Tap Tasks summary drops a visit category filter | REQ-11, REQ-28, INV-09 | State | P1 | UI | M | KEEP |
| DSH-13 | Tap Visits summary → list of Visits only | REQ-11 | Happy | P1 | UI | M | KEEP |
| DSH-14 | Add button doesn't cover any dashboard number | R-21 | Env | P3 | UI | M | KNOWN (DEF-10) |
| DSH-15 | Dashboard has Back and quick filters (BR §5.1) | IMP-09 | Neg | P2 | UI | M | DEFER A-13 (DEF-08) |

### Opening and view switch (OPN)
| ID | Scenario | Covers | Cat | P | Oracle | Auto | Review |
|---|---|---|---|---|---|---|---|
| OPN-01 | Team user starts with all their departments and employees in scope | REQ-03 | Happy | P1 | UI, Req | L | KEEP |
| OPN-02 | Solo user: no My team option, Department chip does nothing | REQ-03, REQ-30 | Access | P1 | UI, Neg | M | KEEP |
| OPN-03 | Priority lookup fails → only the Priority chip/section is hidden | REQ-04, R-16 | Integ | P2 | UI | X | KEEP |
| OPN-04 | Re-tapping the Activities tab scrolls the list to the top | REQ-05 | Happy | P3 | UI | M | KEEP |
| OPN-05 | Switching view keeps the applied filters | REQ-06 | State | P1 | UI | M | KEEP |
| OPN-06 | Switching view clears the search and reloads the list | REQ-06, REQ-18 | State | P1 | UI | M | KEEP |
| OPN-07 | Going back to the dashboard doesn't reload it | REQ-06 | Neg | P3 | Req | L | KEEP |

### List (LST)
| ID | Scenario | Covers | Cat | P | Oracle | Auto | Review |
|---|---|---|---|---|---|---|---|
| LST-01 | A card shows title, type, status, priority, private, people, schedule | REQ-12 | Happy | P1 | UI | M | KEEP |
| LST-02 | Activity without dates shows no schedule line | REQ-12 | Neg | P2 | UI | X | KEEP |
| LST-03 | Unknown type → Task; unknown priority id → Low | REQ-72 | Neg | P3 | UI | X | KEEP |
| LST-04 | No match → "No activities" | REQ-13 | Bnd | P1 | UI | M | KEEP |
| LST-05 | First load fails → message + Retry recovers | REQ-13 | Integ | P1 | UI | X | KEEP |
| LST-06 | 21 activities load as 10 + 10 + 1 and paging stops | REQ-14 | Bnd | P0 | UI, Req | M | KEEP |
| LST-07 | No card appears twice across pages | REQ-14, INV-02, R-07 | Inv | P0 | UI | M | KEEP |
| LST-08 | Page 2 fails → cards kept, scrolling retries | REQ-15 | Integ | P2 | UI | X | KEEP |
| LST-09 | Exactly 10 results → no second page, no placeholder | REQ-14 | Bnd | P2 | UI, Req | M | KEEP |
| LST-10 | Pull to refresh reloads page 1 with the same filters | REQ-17 | Happy | P2 | UI | M | KEEP |
| LST-11 | Fast chip changes → list matches the last chip | REQ-16, INV-12, R-06 | Race | P1 | UI | M | KEEP |
| LST-12 | A filter change after paging restarts at page 1 | REQ-16 | State | P1 | UI | M | KEEP |
| LST-13 | Long Arabic + emoji title fits the card | REQ-12 | Uni | P3 | UI | M | KEEP |

### Search (SRC)
| ID | Scenario | Covers | Cat | P | Oracle | Auto | Review |
|---|---|---|---|---|---|---|---|
| SRC-01 | Search by title finds the activity | REQ-18, REQ-19 | Happy | P0 | UI | M | KEEP |
| SRC-02 | Search by assigned employee's name | REQ-19 | Happy | P2 | UI | M | DEFER A-05 |
| SRC-03 | Search by creator's name | REQ-19 | Happy | P2 | UI | M | DEFER A-05 |
| SRC-04 | Search leaves the dashboard unchanged | REQ-18 | Neg | P1 | UI | M | KEEP |
| SRC-05 | Clearing the search brings back the full list | REQ-18 | State | P1 | UI | M | KEEP |
| SRC-06 | Fast typing sends one request, ~0.4 s after the last key | REQ-18 | Race | P2 | Req | L | KEEP |
| SRC-07 | Arabic and special characters search without error | REQ-18 | Uni | P2 | UI, Neg | M | KEEP |
| SRC-08 | Whitespace-only search behaves as no search | IMP-08 | Neg | P3 | UI | M | DEFER IMP-08 |

### Sort (SRT)
| ID | Scenario | Covers | Cat | P | Oracle | Auto | Review |
|---|---|---|---|---|---|---|---|
| SRT-01 | Oldest first orders cards by scheduled start ascending | REQ-20 | Happy | P1 | UI | M | KEEP |
| SRT-02 | Sort is kept after a filter change and pull to refresh | REQ-20 | State | P1 | UI | M | KEEP |
| SRT-03 | Reset keeps the sort | REQ-20, REQ-39 | State | P2 | UI | M | KEEP |
| SRT-04 | Sort doesn't change the dashboard | REQ-20 | Neg | P3 | UI | M | KEEP |

### Quick chips (CHP)
| ID | Scenario | Covers | Cat | P | Oracle | Auto | Review |
|---|---|---|---|---|---|---|---|
| CHP-01 | Current includes today 00:00 and excludes yesterday | REQ-21 | Bnd | P0 | UI | M | KEEP |
| CHP-02 | Previous includes yesterday 00:00 and yesterday 10:00 | REQ-22, R-03 | Bnd | P0 | UI | M | KNOWN (DEF-06) |
| CHP-03 | Every activity is in exactly one of Current / Previous | REQ-23, INV-01 | Inv | P0 | UI | M | KNOWN (DEF-06) |
| CHP-04 | Tapping the highlighted chip clears it | REQ-24 | State | P1 | UI | M | KEEP |
| CHP-05 | Current, Previous and Main exclude each other | REQ-24 | State | P1 | UI | M | KEEP |
| CHP-06 | Main lists masters once each, with a pencil | REQ-25 | Happy | P0 | UI | M | KEEP |
| CHP-07 | Main ignores a Current selection | REQ-25 | State | P2 | UI | M | KEEP |
| CHP-08 | Main with an execution-type filter | REQ-25 | Neg | P2 | UI | M | DEFER A-06 |
| CHP-09 | Type · Tasks shows only tasks and reloads the dashboard | REQ-26 | Happy | P0 | UI | M | KEEP |
| CHP-10 | Status · Completed shows only completed | REQ-26 | Happy | P1 | UI | M | KEEP |
| CHP-11 | Priority · High shows only high | REQ-26 | Happy | P1 | UI | M | KEEP |
| CHP-12 | Picking All resets the chip label and the filter | REQ-26 | State | P2 | UI | M | KEEP |
| CHP-13 | Visit + category, then Type · Tasks → category gone | REQ-28, INV-09, R-12 | State | P1 | UI | M | KEEP |
| CHP-14 | My team + picked people, then My activities → pick cleared | REQ-29 | State | P1 | UI | M | KEEP |
| CHP-15 | Device at UTC−12: today's 00:30 task stays in Current | IMP-07, R-15 | Env | P2 | UI | X | DEFER A-11 (DEF-07) |

### Scopes and departments (SCP)
| ID | Scenario | Covers | Cat | P | Oracle | Auto | Review |
|---|---|---|---|---|---|---|---|
| SCP-01 | All shows a team member's activity | REQ-31, R-01 | Access | P0 | UI | M | DEFER A-01 (DEF-02) |
| SCP-02 | My team with one employee shows only that employee's | REQ-31, R-01 | Access | P0 | UI | M | DEFER A-01 |
| SCP-03 | My activities shows only the user's own | REQ-31 | Access | P0 | UI, Neg | M | KEEP |
| SCP-04 | Private shows only the user's private activities | REQ-31, R-02 | Access | P0 | UI, Neg | M | KNOWN (DEF-01) |
| SCP-05 | Another user's private activity never shows | IMP-03, R-02 | Access | P0 | Neg | M | KEEP |
| SCP-06 | Picking a department switches the scope to My team | REQ-30 | State | P1 | UI | M | KEEP |
| SCP-07 | Cancelling the picker keeps the old pick | REQ-30 | Neg | P1 | UI | M | KEEP |
| SCP-08 | Confirming an empty pick means everyone | REQ-30 | Bnd | P2 | Req | L | KEEP |
| SCP-09 | Tree search finds a nested employee | REQ-30 | Happy | P2 | UI | M | KEEP |

### Filter sheet (FLT)
| ID | Scenario | Covers | Cat | P | Oracle | Auto | Review |
|---|---|---|---|---|---|---|---|
| FLT-01 | On the dashboard: Type and Priority shown, no Category / Exec type | REQ-32 | Happy | P1 | UI | M | KEEP |
| FLT-02 | On the list with Visit: Category and Exec type shown, no Type / Priority | REQ-32 | Happy | P1 | UI | M | KEEP |
| FLT-03 | On the list with Task: no Category / Exec type | REQ-32, INV-09 | Neg | P1 | UI | M | KEEP |
| FLT-04 | Cancel throws away the draft | REQ-33, INV-07, R-08 | Neg | P0 | UI | M | KEEP |
| FLT-05 | Back and swipe-down also throw away the draft | REQ-33, INV-07 | Neg | P1 | UI | M | KEEP |
| FLT-06 | Show results applies and reloads list + dashboard | REQ-38 | Happy | P0 | UI | M | KEEP |
| FLT-07 | Tapping a selected option clears it; Scope can't be cleared | REQ-34, REQ-27, INV-03 | State | P2 | UI | M | KEEP |
| FLT-08 | Department row disabled under My activities and Private | REQ-35 | Access | P1 | UI | M | KEEP |
| FLT-09 | End can't be before start; moving start past end clears end | REQ-36, INV-04 | Bnd | P1 | UI | M | KEEP |
| FLT-10 | Removing the start date gives an open-ended range | REQ-36 | Bnd | P2 | UI, Req | M | KEEP |
| FLT-11 | Badge counts only non-default filters | REQ-37 | Happy | P2 | UI | M | KEEP |
| FLT-12 | Reset restores the default filter | REQ-39 | Happy | P0 | UI | M | KEEP |
| FLT-13 | Reset cancels a pending search reload | REQ-39 | Race | P3 | Req | L | KEEP |
| FLT-14 | Status + Priority applied are both in the list request | REQ-26, BR §10 | Happy | P1 | Req | L | KEEP |

### Create (CRT)
| ID | Scenario | Covers | Cat | P | Oracle | Auto | Review |
|---|---|---|---|---|---|---|---|
| CRT-01 | Add opens with Visit selected on the start side | REQ-40 | Happy | P0 | UI | M | KEEP |
| CRT-02 | In Arabic, Visit is on the right | REQ-40, REQ-71 | Env | P2 | UI | M | KEEP |
| CRT-03 | Create stays faded until something changes | REQ-42 | State | P2 | UI | M | KEEP |
| CRT-04 | Switching type with data asks first; confirm clears, cancel keeps | REQ-43 | State | P1 | UI | M | KEEP |
| CRT-05 | Empty Task submit outlines required fields, nothing sent | REQ-44, REQ-52, R-13 | Neg | P0 | UI, Neg | M | KEEP |
| CRT-06 | Visit without category, exec type, location is outlined | REQ-44, R-13 | Neg | P0 | UI | M | KEEP |
| CRT-07 | Weekly / monthly without days is outlined | REQ-44 | Bnd | P1 | UI | M | KEEP |
| CRT-08 | Moving start past end clears end | REQ-45, INV-04 | Bnd | P1 | UI | M | KEEP |
| CRT-09 | Changing category drops an unsupported execution type | REQ-46 | State | P1 | UI | M | KEEP |
| CRT-10 | Changing execution type clears picked days | REQ-46 | State | P2 | UI | M | KEEP |
| CRT-11 | Week days run Sat → Fri; month days 1–31 | REQ-46 | Bnd | P3 | UI | M | KEEP |
| CRT-12 | Private on fixes people to me; off clears them | REQ-47 | State | P1 | UI | M | KEEP |
| CRT-13 | Solo user's department and employee are fixed | REQ-41 | Access | P1 | UI | M | KEEP |
| CRT-14 | Busy / Available chips appear after both dates | REQ-48 | Happy | P2 | UI | M | KEEP |
| CRT-15 | Workload request fails → no chip, nobody Available | REQ-48, INV-11, R-14 | Integ | P1 | UI, Neg | X | KEEP |
| CRT-16 | Four workload levels shown from the backend | REQ-48 | Happy | P2 | UI | B | DEFER A-07 |
| CRT-17 | Add a new contact (name required) and it's selected | REQ-49 | Happy | P2 | UI | M | KEEP |
| CRT-18 | No saved contacts → add form opens directly | REQ-49 | Bnd | P3 | UI | M | KEEP |
| CRT-19 | Attachment from gallery: preview, then remove | REQ-50 | Happy | P2 | UI | M | KEEP |
| CRT-20 | Location picked on the map shows on the form | REQ-51 | Happy | P2 | UI | M | KEEP |
| CRT-21 | Create a Task → success → appears in Main | REQ-52, IMP-04 | Happy | P0 | UI, Data | M | KEEP |
| CRT-22 | Create a weekly Visit with days, location, contact | REQ-52 | Happy | P0 | UI, Data | M | KEEP |
| CRT-23 | Double tap Create makes one activity | REQ-52, REQ-69, R-09 | Race | P1 | Data | M | KEEP |
| CRT-24 | Create fails → dialog, form keeps everything | REQ-52 | Integ | P1 | UI | X | KEEP |
| CRT-25 | Arabic + emoji title saves and shows correctly | REQ-71 | Uni | P3 | Data | M | KEEP |

### Edit (EDT)
| ID | Scenario | Covers | Cat | P | Oracle | Auto | Review |
|---|---|---|---|---|---|---|---|
| EDT-01 | Pencil on an open, editable master opens a filled form, type locked | REQ-53, REQ-43 | Happy | P0 | UI | M | KEEP |
| EDT-02 | Change the title and save → Main shows the new title | REQ-53, REQ-42 | Happy | P0 | UI, Data | M | KEEP |
| EDT-03 | Pencil on Completed / Cancelled / Rejected → matching toast | REQ-53, BR-7 | Access | P1 | UI | M | KEEP |
| EDT-04 | Pencil when can-edit is false → "You can't edit…" | REQ-53 | Access | P1 | UI | M | KEEP |
| EDT-05 | Edit load fails → dialog, form closes | REQ-54 | Integ | P2 | UI | X | KEEP |
| EDT-06 | Editing keeps attachments, address and contact | IMP-05, R-05 | Neg | P0 | Data | L | DEFER A-09 |
| EDT-07 | Pencil shows only on Main cards | REQ-25 | Neg | P2 | UI | M | KEEP |

### Detail (DET)
| ID | Scenario | Covers | Cat | P | Oracle | Auto | Review |
|---|---|---|---|---|---|---|---|
| DET-01 | Detail shows header, schedule, people, progress, notes | REQ-55 | Happy | P1 | UI | M | KEEP |
| DET-02 | Detail fails → message + Retry | REQ-55 | Integ | P2 | UI | X | KEEP |
| DET-03 | Start a Pending task → In progress | REQ-56, BR-6 | State | P0 | UI, Data | M | KEEP |
| DET-04 | Start with required questions: errors, then success | REQ-56, REQ-57 | Neg | P1 | UI | M | KEEP |
| DET-05 | Location required but permission denied → step still sent | REQ-58 | Integ | P1 | UI | M | KEEP |
| DET-06 | End is enabled only In progress, and completes at 100 | REQ-59, BR-6 | State | P0 | UI | M | KEEP |
| DET-07 | Check-in → Check-out → Completed disables both | REQ-60 | State | P1 | UI | M | KEEP |
| DET-08 | Check-in time still shows after reopening | IMP-06, R-18 | Neg | P2 | Data | M | DEFER A-10 |
| DET-09 | Add a note; an empty note isn't sent | REQ-61 | Neg | P1 | UI, Data | M | KEEP |
| DET-10 | Change status to Cancelled with a reason → actions gone | REQ-62, INV-06 | State | P0 | UI | M | KEEP |
| DET-11 | Reschedule keeps duration, blocks end < start, cancel aborts | REQ-63, INV-04 | Bnd | P1 | UI | M | KEEP |
| DET-12 | Progress 40 is saved and shown after reopening | REQ-64, INV-05 | Happy | P0 | UI, Data | M | KEEP |
| DET-13 | Progress 0 and 100 save | REQ-64 | Bnd | P2 | Data | M | KEEP |
| DET-14 | Progress save fails → slider rolls back + error | REQ-64, R-10 | Integ | P1 | UI | X | KEEP |
| DET-15 | Drag then leave at once → value still saved | REQ-64 | Race | P2 | Data | M | KEEP |
| DET-16 | Progress can't be dragged when Pending or Completed | REQ-64, BR-6 | State | P1 | UI | M | KEEP |
| DET-17 | Double tap Start sends one start | REQ-69, R-09 | Race | P1 | Data | M | KEEP |
| DET-18 | Closed occurrence offers no note, status, reschedule | INV-06, R-11 | Inv | P0 | Neg | M | KEEP |
| DET-19 | Back reloads the list only after a change | REQ-70 | State | P2 | Req | L | KEEP |
| DET-20 | Failed action shows the backend message; no stuck overlay | REQ-68, INV-08 | Integ | P1 | UI | X | KEEP |
| DET-21 | Partially completed: which actions show | IMP-10 | State | P2 | UI | M | DEFER A-12 |
| DET-22 | Backend flag off hides the action | REQ-73 | Access | P1 | UI | B | DEFER A-08 |

### Timeline, master, general
| ID | Scenario | Covers | Cat | P | Oracle | Auto | Review |
|---|---|---|---|---|---|---|---|
| TML-01 | Timeline lists events oldest first, grouped by day | REQ-65 | Happy | P2 | UI | M | KEEP |
| TML-02 | Timeline fails → message + Retry | REQ-65 | Integ | P3 | UI | X | KEEP |
| MST-01 | Master screen has no progress, timeline, reschedule, status, notes | REQ-66 | Neg | P1 | UI | M | KEEP |
| MST-02 | Disable then Enable flips the label; Main reloads | REQ-67 | State | P1 | UI | M | KEEP |
| MST-03 | Enable/Disable greyed for a Completed master | REQ-67, BR-7 | Access | P1 | UI | M | KEEP |
| GEN-01 | Arabic: RTL layout; English digits in requests | REQ-71 | Env | P2 | UI, Req | L | KEEP |
| GEN-02 | The old Visit/Task screens still work | REQ-74 | Happy | P2 | UI | M | KEEP |
| GEN-03 | Small screen + largest font: nothing clipped | R-19, R-21 | Env | P3 | UI | M | KEEP |

## Totals

| | Count |
|---|---|
| Scenarios | **147** |
| P0 / P1 / P2 / P3 | 35 / 59 / 40 / 13 |
| Maestro (M) / log (L) / forced (X) / blocked (B) | 122 / 9 / 14 / 2 |
| KEEP / KNOWN / DEFER | 127 / 4 / 16 |

## Checks (skill Step 3)

- **Every REQ-01 … REQ-74 has at least one scenario.** Every INV-01 … INV-12 has a direct scenario: INV-01 CHP-03, INV-02 LST-07, INV-03 FLT-07, INV-04 FLT-09/CRT-08/DET-11, INV-05 DET-12, INV-06 DET-10/DET-18, INV-07 FLT-04/05, INV-08 DET-20, INV-09 CHP-13/FLT-03/DSH-12, INV-10 DSH-03, INV-11 CRT-15, INV-12 LST-11.
- **Every risk R-01 … R-21 has a scenario.** R-20 (Main paging without a total) is covered only through CHP-06 with a Main list over 10 items. Add a dedicated case once Q18 says what the Main response looks like.
- **Requirements with no negative scenario:** REQ-05, REQ-17, REQ-50, REQ-51. These are low-risk, single-path behaviors. Add negatives if they break.
- **No duplicates:** each row checks a different rule or a different boundary of the same rule.
- This matrix doesn't map onto the IDs in `qa/qa-review-v1.3.md`. It was written fresh from the eight spec files, and many IDs share a prefix but mean different things (for example `DSH-02`).
