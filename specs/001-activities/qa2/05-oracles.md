# Step 5 — Oracles (how to verify each scenario)

> ai-test-generation pipeline, Step 5 · 2026-10-27 · synced to **CL-10**
> Written separately from the scenarios, as the skill requires. Every oracle uses an element ID that exists in the app's `SemanticsIds` (see [qa/maestro-guide.md](../qa/maestro-guide.md) §5) or a request field listed in [api-contracts.md](../api-contracts.md). The detail, timeline and master screens have no IDs yet, so their oracles use visible text. Add IDs there before automating them.

**Oracle kinds**
- **UI:** what's on screen. Element IDs are written `#id`.
- **Data:** confirmed somewhere else (reopen the screen, Main list, timeline).
- **Req:** a field in the request log from `flutter run` (PrettyDioLogger `data:` block). Endpoint names are from api-contracts §2.
- **Neg:** something that must **not** happen.

Checks common to every scenario (not repeated below): no "Something went wrong" unless the scenario expects it, no loader left on screen afterwards, and no crash.

## Dashboard
| ID | UI | Data / Req | Neg |
|---|---|---|---|
| DSH-01 | `#activities_dashboard_total`, `#activities_tasks_summary`, `#activities_visits_summary` visible | Req: E1 `GetTaskAndVisitDashboard` and E2 sent on open | `#activities_search_field` not visible |
| DSH-02 | Date-range text = today−6 and today in the UI's format | Req: E1 `fromDateTime` = today−6 T00:00:00, `endDateTime` = today T23:59:xx | — |
| DSH-03 | Read Visits and Tasks totals in `#activities_dashboard_total`; read each summary's rows | Sum check on the numbers read | No row bigger than its type's total |
| DSH-04 | Visits number in `#activities_dashboard_total` is the same before and after Type · Tasks | Req: E1 has no `typeId` | Visits not 0 when visits exist |
| DSH-05 | Tasks summary: pending 0, in progress 0, completed = N | Req: E1 `statusId` = 4 | — |
| DSH-06 | Compare Tasks total with `#activities_results_count` under the same filter | Req: E1 has no priority | Per A-02 |
| DSH-07 | Compare dashboard totals with the Main `#activities_results_count` | Req: E1 has no Main field | Per A-02 |
| DSH-08 | Tasks summary contains "<n> pending", where n counts D8 | List: Status · Pending + Type · Tasks count = dashboard pending (Maestro `testcases/DSH-02-maestro.yaml` does this check) | D8 not counted only as late |
| DSH-09 | `#activities_message` + `#activities_retry_button`, then `#activities_dashboard_total` after Retry | — | No overlay after the failure |
| DSH-10 | Visits summary rows read "0" | — | No empty number text |
| DSH-11 | `#activities_chip_type` text "Type · Tasks", selected. Every `#activities_card` contains "TASK" | Req: E2 `typeId` = 1 | No card contains "VISIT" |
| DSH-12 | After the tap, open the filter sheet: no category selected | Req: E2 category list `[]` | — |
| DSH-13 | `#activities_chip_type` "Type · Visits". Every card "VISIT" | Req: E2 `typeId` = 2 | No "TASK" card |
| DSH-14 | Screenshot: the "Late" number in `#activities_visits_summary` isn't covered | — | `#activities_add_button` doesn't overlap the number |
| DSH-15 | Back button and `#activities_chip_current` on the dashboard | — | — |

## Opening and view switch
| ID | UI | Data / Req | Neg |
|---|---|---|---|
| OPN-01 | `#activities_chip_scope` shows All | Req: E2 `companyId[]` and `employeeId[]` hold every ID from the department tree | Lists not `[]` (DEF-02) |
| OPN-02 | Scope sheet has no `#activities_scope_myTeam` | — | No department sheet opens after tapping `#activities_chip_department` |
| OPN-03 | `#activities_chip_priority` not visible. `#activities_chip_status` visible | Req: `GetPriorityList` failed in the log | Screen not stuck on the shimmer |
| OPN-04 | The first card is visible at the top | — | — |
| OPN-05 | `#activities_chip_status` "Status · Completed", selected | Every card has the Completed pill | — |
| OPN-06 | `#activities_search_field` empty | Req: E2 `searchValue` empty | — |
| OPN-07 | — | Req: no second E1 request | No dashboard shimmer |

## List
| ID | UI | Data / Req | Neg |
|---|---|---|---|
| LST-01 | One `#activities_card` contains "QA2 Pending today", "TASK", "Pending", "High" and today's times | — | — |
| LST-02 | The card has no date text | — | No "01/01/0001" or "null" |
| LST-03 | The card shows "TASK" and "Low" | — | — |
| LST-04 | `#activities_message` shows the empty text | — | `#activities_card` not visible |
| LST-05 | `#activities_message` + `#activities_retry_button`, then cards | — | — |
| LST-06 | `#activities_results_count` reads 21. 21 cards after two scrolls | Req: E2 `skip` 0, 10, 20 with `pageSize` 10, and no 4th request | — |
| LST-07 | Each "QA2 Bulk nn" title is visible exactly once | — | No title twice |
| LST-08 | 10 cards stay after the failure. 20 after the next scroll | Req: page 2 sent twice | No `#activities_message` |
| LST-09 | 10 cards | Req: one E2 request only | No placeholder card |
| LST-10 | `#activities_chip_status` still "Status · Pending" | Req: E2 `skip` 0 with the status ID | — |
| LST-11 | `#activities_chip_main` selected. `#activities_card_edit` visible | Req: the last request is E3 `GetVisitAndTaskList` | `#activities_chip_current` and `#activities_chip_previous` not selected |
| LST-12 | The first card is at the top. `#activities_chip_type` "Type · Tasks" | Req: E2 `skip` 0 | — |
| LST-13 | Screenshot review | — | No overflow stripes or overlapping text |

## Search
| ID | UI | Data / Req | Neg |
|---|---|---|---|
| SRC-01 | A card contains "QA2 Pending today" | Req: E2 `searchValue` "QA2 Pending" | — |
| SRC-02 | A card contains "QA2 Team member task" | Req: `searchValue` = the name | — |
| SRC-03 | A card contains "QA2 Not mine to edit" | — | — |
| SRC-04 | Dashboard numbers equal the ones noted | Req: no E1 sent by the search | — |
| SRC-05 | `#activities_results_count` back to the unfiltered number | Req: `searchValue` empty | — |
| SRC-06 | — | Req: exactly one E2 with the full text | No request per key |
| SRC-07 | `#activities_card` or `#activities_message` empty text | — | Not the error text |
| SRC-08 | `#activities_results_count` same as with no search | Req: `searchValue` empty or trimmed | — |

## Sort
| ID | UI | Data / Req | Neg |
|---|---|---|---|
| SRT-01 | The first card's start ≤ the second's ≤ the third's | Req: E2 `direction` "asc" | — |
| SRT-02 | Same order check after both actions | Req: `direction` "asc" in each request | — |
| SRT-03 | `#activities_chip_status` reads "Status". Order still ascending | Req: `direction` "asc" | — |
| SRT-04 | Dashboard numbers unchanged | Req: no E1 sent | — |

## Quick chips
| ID | UI | Data / Req | Neg |
|---|---|---|---|
| CHP-01 | "QA2 Midnight today" visible. `#activities_chip_current` selected | Req: E2 `fromDateTime` today T00:00:00, `endDateTime` null | "QA2 Yesterday late" and "QA2 Done yesterday" not visible |
| CHP-02 | "QA2 Yesterday midnight", "QA2 Done yesterday", "QA2 Yesterday late" visible | Req: E2 `endDateTime` today T00:00:00 (or −1 s per A-04) | — |
| CHP-03 | Each title visible under exactly one chip | — | No title under both or neither |
| CHP-04 | No chip selected. `#activities_results_count` equals the default | Req: E2 back to the 7-day range | — |
| CHP-05 | Only the last-tapped chip is `selected` | — | Never two selected |
| CHP-06 | "QA2 Weekly visit" visible once, with `#activities_card_edit` | Req: E3 sent | Not 3+ copies |
| CHP-07 | `#activities_chip_main` selected, `#activities_chip_current` not | Req: E3 has no Current range | — |
| CHP-08 | Per A-06 | Req: E3 has no execution type field today (Q27) | — |
| CHP-09 | `#activities_chip_type` "Type · Tasks", selected. Every card "TASK" | Req: E2 `typeId` 1. E1 re-sent | — |
| CHP-10 | Every card has the Completed pill | Req: `statusId` 4 | — |
| CHP-11 | Every card shows High | Req: E2 `priorityId` 3 | — |
| CHP-12 | `#activities_chip_status` reads "Status", not selected | Req: `statusId` null | — |
| CHP-13 | Filter sheet shows no category section | Req: E2 category `[]`, execution type null | — |
| CHP-14 | The department picker shows nothing ticked | Req: with My activities, IDs are the user's own | — |
| CHP-15 | The 00:30 task is visible under Current | Req: `fromDateTime` matches the agreed time zone | — |

## Scopes and departments
| ID | UI | Data / Req | Neg |
|---|---|---|---|
| SCP-01 | "QA2 Team member task" visible | Req: E2 `onlyMe` and IDs per A-01 | — |
| SCP-02 | "QA2 Team member task" visible | Req: `employeeId[]` = [U-EMP] | "QA2 Pending today" not visible |
| SCP-03 | "QA2 Pending today" visible | Req: IDs = own company + self | "QA2 Team member task" not visible |
| SCP-04 | "QA2 My private" visible. Every card has the private marker | Req: `onlyMe` true | "QA2 Pending today" not visible |
| SCP-05 | — | — | "QA2 Their private" not visible under any scope |
| SCP-06 | `#activities_chip_scope` reads My team | Req: picked IDs only | — |
| SCP-07 | Picker shows only A ticked on reopen | Req: no new E2 after cancel | — |
| SCP-08 | — | Req: every department and employee ID sent | Lists not `[]` |
| SCP-09 | The employee row is visible | — | — |

## Filter sheet
| ID | UI | Data / Req | Neg |
|---|---|---|---|
| FLT-01 | Type, Status, Priority sections visible | — | No Category or execution-type section |
| FLT-02 | Category and execution-type sections visible | — | No Type or Priority section |
| FLT-03 | — | — | No Category or execution-type section |
| FLT-04 | `#activities_chip_status` still "Status · Pending" after `#activities_filter_cancel` | Req: no new E2 | — |
| FLT-05 | Same as FLT-04, for back and swipe | Req: no new E2 | — |
| FLT-06 | Sheet gone. `#activities_chip_status` "Status · Completed" | Req: E2 `skip` 0 with `statusId` 4. E1 re-sent | — |
| FLT-07 | Status option not selected. The scope option still selected | — | Scope never empty |
| FLT-08 | Department row shows as disabled (`enabled: false` once it has an ID) | — | Tapping it opens nothing |
| FLT-09 | The end field is empty after moving the start | — | 09:00 can't be picked |
| FLT-10 | A card older than today−6 is visible | Req: `fromDateTime` null | — |
| FLT-11 | `#activities_filter_button` badge reads 2 | — | Not 3 or 4 |
| FLT-12 | `#activities_chip_scope` All. Status, Priority not selected. Default results count | Req: default range, `statusId` null | — |
| FLT-13 | — | Req: no E2 with the typed text after the reset | — |
| FLT-14 | — | Req: E2 `statusId` 1 and `priorityId` 3 in the same request | — |

## Create
| ID | UI | Data / Req | Neg |
|---|---|---|---|
| CRT-01 | `#activity_create_type_visit` selected, left of `#activity_create_type_task` | — | — |
| CRT-02 | `#activity_create_type_visit` selected, right of `#activity_create_type_task` | — | — |
| CRT-03 | `#activity_create_save_button` `enabled: false` | — | No request on tap |
| CRT-04 | Cancel: `#activity_create_type_visit` still selected, title kept. Confirm: `#activity_create_type_task` selected, title empty | — | — |
| CRT-05 | Red outlines on title, dates, people | — | Req: no E10 |
| CRT-06 | Red outlines on category, execution type, location | — | Req: no E10 |
| CRT-07 | Red outline on the days field each time | — | Req: no E10 |
| CRT-08 | End field empty | — | — |
| CRT-09 | Execution type field empty | — | — |
| CRT-10 | Days field empty | — | — |
| CRT-11 | First week day Saturday, last Friday. Month days 1 to 31 | — | No 0 or 32 |
| CRT-12 | On: one person (the user) and the picker locked. Off: no people | — | — |
| CRT-13 | Department and employee show the user and can't be opened | — | — |
| CRT-14 | "Busy" next to U-EMP, "Available" next to a free employee | Req: E6 window = the picked start and end | — |
| CRT-15 | — | Req: E6 failed in the log | No "Available" anywhere |
| CRT-16 | Four distinct labels | — | — |
| CRT-17 | "QA2 Contact" selected on the form | — | Not saved without a name |
| CRT-18 | The add-contact form is visible | — | — |
| CRT-19 | The preview opens. No attachment after removing | — | — |
| CRT-20 | Location text or map pin shown on the form | — | — |
| CRT-21 | Success dialog, then `#activities_dashboard_total` or the list | Data: Main has a card "QA2-CRT-21-1" | — |
| CRT-22 | Success dialog | Data: Main card "VISIT". Reopening it shows Weekly Sun, Tue and the contact | — |
| CRT-23 | — | Data: Main search "QA2-CRT-23-1" → `#activities_results_count` 1 | Not 2 |
| CRT-24 | Failure dialog, then the form with every value still filled | — | — |
| CRT-25 | Card and detail text equal "QA2 مهمة 🚀" | — | No "?" or boxes |

## Edit
| ID | UI | Data / Req | Neg |
|---|---|---|---|
| EDT-01 | Title filled. The non-selected type toggle has `enabled: false`. Save button text "Save changes" | Req: E8 with the master ID | — |
| EDT-02 | Success dialog | Data: Main card shows "QA2-EDT-02-new". Req: E10 `id` = master ID | — |
| EDT-03 | Toast text matches each status | — | No form opens |
| EDT-04 | Toast "You can't edit this task" | — | No form opens |
| EDT-05 | Failure dialog, then back on the list | — | — |
| EDT-06 | — | Data: reopen → 2 attachments, address, contact. Req: E10 `attachments` holds the 2 IDs | `attachments` not `[]` (G-35) |
| EDT-07 | — | — | `#activities_card_edit` not visible |

## Detail
| ID | UI (text, no IDs yet) | Data / Req | Neg |
|---|---|---|---|
| DET-01 | Title, "#<code>", Task, Pending, High, times, people visible | Req: E7 with the occurrence ID | — |
| DET-02 | Error text + Retry, then the title | — | — |
| DET-03 | "In progress". "End" button. Slider enabled | Data: timeline has a start entry. Req: E13 | "Start" not visible |
| DET-04 | Error under the question after the empty submit, then "In progress" | Req: E11 then E13 with the answer | No E13 on the empty submit |
| DET-05 | "In progress" | Req: E13 lat/lng `''` | No blocking error |
| DET-06 | D1: End disabled. D12: "Completed", progress 100 | Req: E14 | — |
| DET-07 | "Check-out" after check-in, with a time. Both disabled after Completed | Req: E12 twice | — |
| DET-08 | Check-in time visible after reopening | — | — |
| DET-09 | "QA2 note" in the notes list | Req: one E17 | No E17 for the empty note |
| DET-10 | "Cancelled". No note, status, reschedule, End. Slider disabled | Req: E15 `statusId` "3", reason "QA2" | — |
| DET-11 | Start 14:00, end 15:00 shown | Req: one E16 only | No E16 for the cancelled attempt |
| DET-12 | Slider reads 40 after reopening | Req: E19 progress 40 | — |
| DET-13 | 0, then 100 after reopening | Req: E19 0 and 100 | — |
| DET-14 | Error shown. Slider reads 20 | — | Slider not stuck at 60 |
| DET-15 | 70 after reopening | Req: E19 70 sent on leaving | — |
| DET-16 | Slider value unchanged after the drag | — | Req: no E19 |
| DET-17 | One start entry in the timeline | Req: one E13 | Not two |
| DET-18 | — | — | No "Add note", status tap, schedule tap |
| DET-19 | — | Req: no E2 after the first back. E1 + E2 after the second | — |
| DET-20 | A dialog with the backend's message | — | No loader after closing the dialog |
| DET-21 | Per A-12 | — | — |
| DET-22 | — | — | No status-change action |

## Timeline, master, general
| ID | UI | Data / Req | Neg |
|---|---|---|---|
| TML-01 | Day headers in date order. Created before Started. Names shown | Req: E9 | — |
| TML-02 | Error text + Retry, then events | — | — |
| MST-01 | — | Req: E8, not E7 | No progress, Timeline, schedule, status or note controls |
| MST-02 | "Disable" → "Enable" → "Disable" | Req: E18 `isEnabled` false, then true. E3 after back | — |
| MST-03 | Enable/Disable button disabled | — | Req: no E18 on tap |
| GEN-01 | Screenshot: chips start at the right, Visit on the right in Add | Req: E2 dates use 0–9 digits | No Arabic-Indic digits in requests |
| GEN-02 | The old Visits list loads and opens an item | — | — |
| GEN-03 | Screenshot review on each screen | — | No overflow stripes |

## Hallucination check (skill Verification)

- Element IDs used above: `activities_dashboard_total`, `activities_tasks_summary`, `activities_visits_summary`, `activities_search_field`, `activities_results_count`, `activities_card`, `activities_card_edit`, `activities_message`, `activities_retry_button`, `activities_chip_{type,status,priority,scope,department,current,previous,main}`, `activities_scope_myTeam`, `activities_filter_button`, `activities_filter_cancel`, `activities_add_button`, `activity_create_type_visit`, `activity_create_type_task`, `activity_create_save_button`. All are listed in the Maestro guide §5.
- Endpoints E1–E19 and fields (`typeId`, `statusId`, `priorityId`, `onlyMe`, `companyId[]`, `employeeId[]`, `fromDateTime`, `endDateTime`, `searchValue`, `direction`, `skip`, `pageSize`, `isEnabled`, `attachments`, `id`) are from api-contracts §2–§4.
- **Missing IDs to add before automating:** the detail screen (Start, End, Check-in/out, Add note, status, schedule, progress slider), the timeline, the master Enable/Disable button, the filter sheet's Department row, and the form's required-field outlines.
