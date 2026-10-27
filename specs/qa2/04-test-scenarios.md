# Step 4 — Test scenarios (Given / When / Then)

> ai-test-generation pipeline, Step 4 · 2026-10-27 · synced to **CL-10**
> **What** happens, written as Given/When/Then. **How** to verify each one is a separate step: [05-oracles.md](05-oracles.md). Priority, automation and review status: [03-coverage-matrix.md](03-coverage-matrix.md).

## 0. Test data

Set this data up before a run, in the test company on `test.talentlink360.com`. Times are in the device's local time zone. "Today" means the day of the run.

**Accounts**

| Key | Who |
|---|---|
| U-TEAM | A manager with a team: at least 2 departments and 2 employees under them |
| U-EMP | An employee in U-TEAM's team |
| U-SOLO | A user with no team |

**Activities** (all assigned to U-TEAM unless stated)

| Key | Activity |
|---|---|
| D1 | Task "QA2 Pending today", Pending, today 10:00–11:00, priority High |
| D2 | Visit "QA2 Visit check-in", Pending, today 09:00–10:00. Its category uses check-in and check-out, requires location, and has a start form with one required question |
| D3 | Task "QA2 Done yesterday", Completed, yesterday 10:00 |
| D4 | Visit "QA2 Yesterday midnight", Pending, yesterday 00:00 |
| D5 | Task "QA2 My private", private, created by U-TEAM |
| D6 | Task "QA2 Team member task", assigned to U-EMP, today 12:00 |
| D7 | Task "QA2 Cancelled", Cancelled, today−3 |
| D8 | Task "QA2 Overdue pending", Pending, ended yesterday |
| D9 | Visit "QA2 Weekly visit", weekly Sun + Tue, 3+ occurrences in the default window |
| D10 | Task "QA2 Midnight today", Pending, today 00:00 |
| D11 | Task "QA2 Not mine to edit", created by someone else, can-edit false |
| D12 | Task "QA2 In progress", In progress, progress 20, today 14:00 |
| D13 | Task "QA2 Yesterday late", Pending, yesterday 23:59 |
| D-PRIV | Task "QA2 Their private", private, created by U-EMP |
| D-BULK | 21 tasks titled "QA2 Bulk 01" … "QA2 Bulk 21" in the default window |

Scenarios that change data (Start, End, status, progress, edit, disable) need a fresh copy of their activity each run. Name new ones `QA2-<scenario ID>-<n>`.

---

## Dashboard (DSH)

| ID | Given | When | Then |
|---|---|---|---|
| DSH-01 | U-TEAM is logged in | They tap the Activities tab | A shimmer shows, then the dashboard (not the list): donut, Visits summary, Tasks summary, date range |
| DSH-02 | Default filter | The dashboard loads | The date range reads today−6 to today |
| DSH-03 | Default filter, D1–D13 exist | The dashboard loads | Donut total = Visits total + Tasks total. For each type, completed + in progress + pending (+ late, A-03) ≤ that type's total |
| DSH-04 | The list was set to Type · Tasks | The user switches to the dashboard | The donut and Visits summary still count visits |
| DSH-05 | Dashboard shows N completed tasks | The user applies Status · Completed in the filter sheet | Tasks pending and in progress show 0; completed stays N |
| DSH-06 | D1 is High, others aren't | The user sets Priority · High and compares the dashboard with the list | Agreed behavior per A-02: the counts match, or the dashboard says it ignores priority |
| DSH-07 | Main has M masters | The user selects Main, then opens the dashboard | Agreed behavior per A-02 |
| DSH-08 | D8 is Pending but overdue | The dashboard loads | D8 counts in Tasks pending (per IMP-02, A-03). Today it counts only as late (DEF-09) |
| DSH-09 | The dashboard request will fail | The dashboard loads, then the request succeeds and the user taps Retry | "Something went wrong" + Retry first, then the dashboard. No overlay is left |
| DSH-10 | An account whose filter range holds no visits | The dashboard loads | Visits total, completed, in progress, pending, late all show 0, never blank |
| DSH-11 | Dashboard shown | The user taps the Tasks summary | The list opens with the chip "Type · Tasks", and every card is a Task |
| DSH-12 | Type Visit and a category were applied | The user goes to the dashboard and taps the Tasks summary | The list shows Tasks, and the filter sheet has no category picked |
| DSH-13 | Dashboard shown | The user taps the Visits summary | The list opens with "Type · Visits", and every card is a Visit |
| DSH-14 | Dashboard shown | The user scrolls to the end of the Visits summary | Every number, including Late, is fully visible (not under the Add button) |
| DSH-15 | Dashboard shown | The user looks at the app bar and the chip row | Per A-13: Back button and quick filters exist, or the spec is changed to drop them |

## Opening and view switch (OPN)

| ID | Given | When | Then |
|---|---|---|---|
| OPN-01 | U-TEAM, nothing changed | Activities opens | Scope is All, and the first list request carries all U-TEAM's department and employee IDs |
| OPN-02 | U-SOLO | They open the Scope chip, then tap Department | Scope has no My team option. Department does nothing (no sheet) |
| OPN-03 | The priority lookup will fail | Activities opens | The screen opens. Priority chip and section are hidden. Status, Type, Scope still work |
| OPN-04 | The list is scrolled to page 2 | The user taps the Activities tab again | The list scrolls to the first card |
| OPN-05 | Status · Completed applied in the list | The user switches to the dashboard and back | The chip still reads "Status · Completed" and the list still shows only Completed |
| OPN-06 | The list is searched for "QA2 Pending" | The user switches to the dashboard and back | The search box is empty and the full list is shown |
| OPN-07 | Dashboard loaded once | The user goes to the list and back to the dashboard | No new dashboard request is sent |

## List (LST)

| ID | Given | When | Then |
|---|---|---|---|
| LST-01 | D1 exists | The user finds D1's card | It shows "QA2 Pending today", Task, a Pending pill, High, assigned to/by and today 10:00–11:00 |
| LST-02 | An activity with no start/end dates | It's in the list | The card has no schedule line and no placeholder date |
| LST-03 | The backend returns typeId 9 and priorityId 9 for an item | The list loads | The card shows Task and Low |
| LST-04 | — | The user searches "zzqq-no-match" | "No activities" shows, with no cards |
| LST-05 | The first list request will fail | The list opens, then the user taps Retry after the backend recovers | Message + Retry, then cards |
| LST-06 | D-BULK only matches (search "QA2 Bulk") | The user scrolls to the end twice | 10 cards, then a placeholder and 20, then 21. A third scroll sends no request |
| LST-07 | D-BULK | The user scrolls through all pages | Each "QA2 Bulk nn" title appears exactly once |
| LST-08 | Page 2 will fail once | The user scrolls to the end, then scrolls again | First: the 10 cards stay, no error. Second: page 2 loads |
| LST-09 | Exactly 10 activities match | The user scrolls to the end | No placeholder and no second request |
| LST-10 | Status · Pending applied | The user pulls down | The list reloads from the top with Status · Pending still applied |
| LST-11 | List shown | The user taps Current, Previous, Main within one second | The chip row shows Main, and the cards are Main masters (pencil icons) |
| LST-12 | Scrolled to page 3 | The user picks Type · Tasks | The list is back at the top with page 1 of Tasks |
| LST-13 | An activity titled "مهمة اختبار طويلة جدا 🚀 …" (120 characters) | The list loads | The title is cut off cleanly and the rest of the card is laid out normally |

## Search (SRC)

| ID | Given | When | Then |
|---|---|---|---|
| SRC-01 | D1 exists | The user types "QA2 Pending" and stops | After about 0.4 s the list shows D1 |
| SRC-02 | D6 is assigned to U-EMP | The user searches U-EMP's name | D6 is listed (per A-05) |
| SRC-03 | D11 was created by another user | The user searches that creator's name | D11 is listed (per A-05) |
| SRC-04 | Dashboard numbers noted | The user searches "QA2 Pending" in the list, then opens the dashboard | Dashboard numbers are unchanged |
| SRC-05 | A search shows 1 card | The user clears the box | The full list comes back |
| SRC-06 | — | The user types "QA2 Bulk" quickly | One list request, sent about 0.4 s after the last key |
| SRC-07 | — | The user searches "مهمة", then "%", then "O'Neil" | Each shows results or "No activities", never "Something went wrong" |
| SRC-08 | — | The user types three spaces | The list is the same as with an empty search (per IMP-08) |

## Sort (SRT)

| ID | Given | When | Then |
|---|---|---|---|
| SRT-01 | Default sort (newest first) | The user picks Oldest first | The cards run from the earliest scheduled start to the latest |
| SRT-02 | Oldest first | The user applies Status · Pending, then pulls to refresh | Still oldest first |
| SRT-03 | Oldest first and Status · Pending | The user taps Reset in the filter sheet | Status is cleared, and the order is still oldest first |
| SRT-04 | Dashboard numbers noted | The user changes the sort | Dashboard numbers are unchanged |

## Quick chips (CHP)

| ID | Given | When | Then |
|---|---|---|---|
| CHP-01 | D10 (today 00:00), D13 (yesterday 23:59), D3 (yesterday 10:00) | The user taps Current | D10 is listed. D13 and D3 aren't |
| CHP-02 | D4 (yesterday 00:00), D3, D13 | The user taps Previous | D4, D3 and D13 are listed. Today it drops all three (DEF-06) |
| CHP-03 | D10, D13, D4, D1 | The user checks each under Current and under Previous | Each appears under exactly one |
| CHP-04 | Current is highlighted | The user taps Current again | No chip is highlighted and the default 7-day list is back |
| CHP-05 | Current is highlighted | The user taps Previous, then Main | Only the last-tapped chip is highlighted each time |
| CHP-06 | D9 has 3+ occurrences | The user taps Main | D9 shows once, with a pencil icon |
| CHP-07 | Current is highlighted | The user taps Main | Main is highlighted, Current isn't, and the list isn't limited to today onwards |
| CHP-08 | Type Visit and execution type Weekly | The user taps Main | Per A-06 |
| CHP-09 | Default filter | The user picks Type · Tasks | The chip reads "Type · Tasks", only Tasks are listed, and the dashboard reloads |
| CHP-10 | Default filter | The user picks Status · Completed | Only Completed pills are listed (D3) |
| CHP-11 | Default filter | The user picks Priority · High | Only High cards are listed (D1) |
| CHP-12 | Status · Completed | The user picks Status · All | The chip label goes back to "Status" and every status shows |
| CHP-13 | Type · Visits and a category are applied | The user picks Type · Tasks, then opens the filter sheet | No category or execution type is selected or shown |
| CHP-14 | My team with one department picked | The user picks Scope · My activities, then My team again | The department pick is empty |
| CHP-15 | Device time zone UTC−12, a task today 00:30 local | The user taps Current | The task is listed (per A-11) |

## Scopes and departments (SCP)

| ID | Given | When | Then |
|---|---|---|---|
| SCP-01 | D6 is assigned to U-EMP | U-TEAM views scope All | D6 is listed (per A-01) |
| SCP-02 | D6 (U-EMP) and D1 (U-TEAM) | U-TEAM picks My team with only U-EMP | D6 is listed, D1 isn't (per A-01) |
| SCP-03 | D1, D6 | U-TEAM picks My activities | D1 is listed, D6 isn't |
| SCP-04 | D5 private, D1 public | U-TEAM picks Private | D5 is listed, D1 isn't |
| SCP-05 | D-PRIV is U-EMP's private task | U-TEAM tries All, My team, My activities, Private | D-PRIV never shows |
| SCP-06 | Scope All | The user picks one department in the Department chip and confirms | The scope chip reads My team |
| SCP-07 | Department A is picked | The user opens the picker, ticks B, then cancels | Only A is still picked |
| SCP-08 | My team | The user opens the picker, unticks everything, confirms | The request carries every department and employee ID |
| SCP-09 | An employee two levels down | The user types their name in the picker's search | The employee shows, with their department expanded |

## Filter sheet (FLT)

| ID | Given | When | Then |
|---|---|---|---|
| FLT-01 | Dashboard view | The user opens the filter sheet | Type, Status, Priority, Scope, Department and dates are shown. Category and execution type aren't |
| FLT-02 | List view, Type · Visits | The user opens the sheet | Category and execution type are shown. Type and Priority aren't |
| FLT-03 | List view, Type · Tasks | The user opens the sheet | No Category and no execution type |
| FLT-04 | Status · Pending applied | The user opens the sheet, picks Completed, taps Cancel | The chip still reads Pending and the list is unchanged |
| FLT-05 | Status · Pending applied | The user changes the draft, then closes the sheet once with back and once by swiping down | Pending is still applied both times |
| FLT-06 | Default filter | The user picks Status · Completed and taps Show results | The sheet closes, the list shows Completed from the top, and the dashboard reloads |
| FLT-07 | Status · Pending in the draft | The user taps Pending again, then taps the selected scope | Status clears. Scope stays selected |
| FLT-08 | U-TEAM | The user sets the draft scope to My activities, then Private | The Department row is greyed out both times |
| FLT-09 | Start today 10:00, end today 12:00 | The user tries end 09:00, then moves start to 13:00 | 09:00 can't be chosen. Moving the start clears the end |
| FLT-10 | Default dates | The user removes the start date and applies | Activities from before today−6 appear. The request's start is empty |
| FLT-11 | Default filter | The user applies Status · Pending and Priority · High | The badge shows 2. Default dates and scope All aren't counted |
| FLT-12 | Status, Priority, dates and My activities applied | The user taps Reset | The sheet closes and the default filter is back (All, 7 days, no status or priority) |
| FLT-13 | The user has just typed in the search box | They open the sheet and tap Reset within 0.4 s | No search request is sent after the reset |
| FLT-14 | — | The user applies Status · Pending and Priority · High | The list request carries the Pending status ID and the High priority ID |

## Create (CRT)

| ID | Given | When | Then |
|---|---|---|---|
| CRT-01 | English UI | The user taps Add | After a shimmer, the form shows Visit selected, Visit on the left, Task on the right |
| CRT-02 | Arabic UI | The user taps Add | Visit is selected and on the right |
| CRT-03 | The form is open | Nothing has been entered | Create is faded and does nothing when tapped |
| CRT-04 | Visit with a title typed | The user taps Task, cancels, then taps Task and confirms | Cancel: still a Visit with the title. Confirm: an empty Task form |
| CRT-05 | Task form, nothing entered | The user enters only a priority and taps Create | Title, start, end and people are outlined red, the form scrolls to the title, nothing is sent |
| CRT-06 | Visit form with title, dates, people | The user taps Create | Category, execution type and location are outlined red |
| CRT-07 | Visit, execution type Weekly, no days | The user taps Create, then repeats with Monthly | Week days are outlined, then month days |
| CRT-08 | Start tomorrow 10:00, end tomorrow 12:00 | The user moves the start to tomorrow 14:00 | The end is cleared |
| CRT-09 | Category A offers Weekly, category B doesn't. Weekly is picked under A | The user switches to B | The execution type is cleared |
| CRT-10 | Weekly with Sun and Tue picked | The user switches to Monthly | No days are picked |
| CRT-11 | Weekly, then Monthly | The user opens the days pickers | Week days run Saturday to Friday. Month days run 1 to 31 |
| CRT-12 | U-TEAM picked U-EMP | The user turns Private on, then off | On: people are fixed to U-TEAM. Off: people are empty |
| CRT-13 | U-SOLO | They open Add | Department and employee are fixed to themselves and can't be changed |
| CRT-14 | U-EMP has D6 today 12:00 | The user sets today 11:00–13:00 and opens the people picker | U-EMP shows Busy. Someone with nothing then shows Available |
| CRT-15 | The workload request will fail | The user sets both dates and opens the people picker | No chip shows next to anyone |
| CRT-16 | Backend sends four workload levels (A-07) | The user opens the people picker | Each level shows its own label |
| CRT-17 | Visit form | The user adds a contact, tries saving it without a name, then with "QA2 Contact" | Without a name: blocked. With it: saved and selected |
| CRT-18 | An account with no saved contacts | The user taps Contact | The add-contact form opens straight away |
| CRT-19 | A photo is in the gallery | The user attaches it, opens it, then removes it | The preview opens. After removing, no attachment is listed |
| CRT-20 | Visit form | The user picks a point on the map and confirms | The form shows the picked location |
| CRT-21 | U-TEAM | The user creates Task "QA2-CRT-21-1" for today, assigned to self | Overlay, success dialog, back to Activities. Main lists "QA2-CRT-21-1" |
| CRT-22 | U-TEAM | The user creates a weekly Visit (Sun, Tue) with category, location and contact | Success. Main lists it as a Visit |
| CRT-23 | A valid Task form | The user double-taps Create | Main lists exactly one "QA2-CRT-23-1" |
| CRT-24 | Create will fail | The user submits a valid form | Failure dialog. The form still holds every value |
| CRT-25 | — | The user creates "QA2 مهمة 🚀" | The card and detail show the title exactly |

## Edit (EDT)

| ID | Given | When | Then |
|---|---|---|---|
| EDT-01 | Main shows an open master the user can edit | They tap its pencil | The form is filled, its type is locked, the button reads "Save changes" |
| EDT-02 | Edit form open | The user changes the title to "QA2-EDT-02-new" and saves | Success, and Main shows the new title |
| EDT-03 | Masters that are Completed, Cancelled and Rejected | The user taps each pencil | "This task is completed / cancelled / rejected". No form opens |
| EDT-04 | D11 (can-edit false) in Main | The user taps its pencil | "You can't edit this task". No form opens |
| EDT-05 | Loading the master will fail | The user taps a pencil | A failure dialog, then the form closes |
| EDT-06 | A master with 2 attachments, an address and a contact | The user changes only the title and saves | Reopening it still shows both attachments, the address and the contact (per A-09) |
| EDT-07 | Default list (not Main) | The user looks at the cards | No pencil icons |

## Detail (DET)

| ID | Given | When | Then |
|---|---|---|---|
| DET-01 | D1 | The user opens it | Title, code, Task, Pending, High, schedule, people, progress, notes are shown |
| DET-02 | The details request will fail | The user opens an activity, then taps Retry | Message + Retry, then the detail |
| DET-03 | A fresh copy of D1 (Pending, no start form) | The user taps Start | The status becomes In progress, Start becomes End, the progress slider is enabled |
| DET-04 | A fresh copy of D2 (start form with one required question) | The user taps Start, submits empty, then answers and submits | Empty: the question shows an error. Answered: status In progress |
| DET-05 | A fresh copy of D2, location permission denied | The user starts it | The step is still saved (status In progress) |
| DET-06 | D12 (In progress) and D1 (Pending) | The user looks at End on each, then taps End on D12 | End is disabled on D1. D12 becomes Completed with progress 100 |
| DET-07 | A fresh copy of D2, In progress | The user checks in, then checks out, then ends it | Check-in → button reads Check-out and a check-in time shows. After Completed, both are disabled |
| DET-08 | After DET-07's check-in | The user leaves and reopens the detail | The check-in time still shows (per A-10) |
| DET-09 | D1 | The user adds note "QA2 note", then tries to add an empty note | "QA2 note" is listed. The empty one isn't sent |
| DET-10 | A fresh copy of D12 | The user changes the status to Cancelled with reason "QA2" | The status reads Cancelled. Add note, status, reschedule, progress and End are gone |
| DET-11 | D1 (10:00–11:00) | The user reschedules the start to 14:00, then tries an end before it, then cancels a second reschedule | The end offered is 15:00. An end before 14:00 can't be chosen. The cancelled one changes nothing |
| DET-12 | A fresh copy of D12 | The user drags progress to 40, waits 1 s, leaves and reopens | Progress shows 40 |
| DET-13 | A fresh copy of D12 | The user saves 0, reopens, then saves 100 and reopens | 0, then 100 |
| DET-14 | Saving progress will fail | The user drags from 20 to 60 | An error shows and the slider goes back to 20 |
| DET-15 | A fresh copy of D12 | The user drags to 70 and goes back at once | Reopening shows 70 |
| DET-16 | D1 (Pending) and D3 (Completed) | The user tries to drag progress | It doesn't move on either |
| DET-17 | A fresh copy of D1 | The user double-taps Start | One "started" entry in the timeline |
| DET-18 | D3 and D7 | The user opens each | No Add note, no status change, no reschedule |
| DET-19 | — | The user opens D1 and backs out with no change, then adds a note and backs out | First: no list reload. Second: list and dashboard reload |
| DET-20 | The next action will fail with a backend message | The user adds a note | A dialog shows that message. No loader stays on screen |
| DET-21 | An occurrence in Partially completed | The user opens it | Per A-12 |
| DET-22 | The backend denies status change for this activity (A-08) | The user opens it | No status-change action |

## Timeline (TML)

| ID | Given | When | Then |
|---|---|---|---|
| TML-01 | An activity that was created, started and noted on different days | The user opens Timeline | Events are grouped by day, oldest first, each with who did it |
| TML-02 | The timeline request will fail | The user opens Timeline, then taps Retry | Message + Retry, then the events |

## Master (MST)

| ID | Given | When | Then |
|---|---|---|---|
| MST-01 | Main | The user opens D9's master | No progress, timeline, reschedule, status change or notes |
| MST-02 | An enabled open master | The user taps Disable, goes back, reopens it, taps Enable | The label flips each time, and Main reloads on back |
| MST-03 | A Completed master | The user opens it | Enable/Disable is greyed out |

## General (GEN)

| ID | Given | When | Then |
|---|---|---|---|
| GEN-01 | Arabic UI | The user applies a date filter and opens the list | Layout is right-to-left, chips scroll from the right, and the request dates use English digits |
| GEN-02 | — | The user opens the old Visits / Tasks screens | They load and open an item as before |
| GEN-03 | Smallest supported phone, largest system font | The user opens the dashboard, list, filter sheet and form | No text is cut off or overlapped, and the chip row scrolls |
