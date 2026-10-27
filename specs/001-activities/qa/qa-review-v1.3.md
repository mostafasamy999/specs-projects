# QA Review — 001 New Activities (Visits & Tasks)

**Review version:** 1.3
**Reviewer role:** Senior QA Analyst (requirements review + test design only; no code read, no code changed)
**Review date:** 2026-10-21 (v1.2), updated 2026-10-27 (v1.3)
**Spec baseline:** `specs/001-activities/` v1.2 (Approved, last updated 2026-10-21). The spec itself hasn't changed since v1.2.

**What changed in v1.3**
- Corrected QF-09 (it marked a request as confirmed that G-01 says is contradictory), FLT-04 and FLT-21 (they expected an `isPrivate` field the requests don't have) and the smoke-suite count.
- Added gaps G-32 to G-50: privacy control, edit data loss, double submission, out-of-order responses, multi-assignee and recurring behavior, private assignment, session/company switch, deep links, cross-company assignment, weekday mapping, Arabic-Indic digits, reschedule validation, upload limits, dashboard vs list counts, and (critical) dashboard vs Main list counts.
- Added gaps G-51 to G-57 from a cross-screen pass (each filter walked through the list, Main, dashboard, picker and details): the dashboard can't follow Priority or Search (critical), Main can't filter by execution type, type and time chips empty parts of the dashboard, the list endpoint may ignore team scope, the picker and list count differently, and the timeline depends on the entry point.
- Added §7, the test execution log. Run R1 (2026-10-27, Android emulator) covered G-01 to G-04, raised defects DEF-01 to DEF-07 and gap G-58.
- Added 45 test cases (DSH-13–19, QF-16–18, FLT-25–26, SRC-13–14, SRT-05, PAG-13–14, LST-10, CRT-19–26, DET-21–31, PRG-13–16, ASG-13, PERM-08–10), the matching coverage rows, and questions 31–56.

| File reviewed | Lines | Status |
|---|---|---|
| `business-requirements.md` (BR) | 592 | Read in full |
| `api-contracts.md` (API) | 579 | Read in full |
| `changelog.md` (CL) | 110 | Read in full |
| `open-questions.md` (OQ) | 59 | Read in full |

**Limitations**
- Only these four files exist under `specs/`. The files they reference — root `README.md`, `how to use`, and the app code at `~/StudioProjects/talentlink` — were **not** reviewed (the first two aren't in the specs folder I was given; the code is out of scope for a QA spec review).
- The create-form validation, the company/employee/department lookup endpoints and the `RemoteDynamicForm` shape are documented only as "existing behavior". No expected results can be taken from the spec for them, so those test cases are marked **Blocked – undocumented**.
- No captured request/response samples exist (API header). Every API expectation below is based on DTO shapes, not observed traffic.

**Conventions in this document**
- **[DOC]** = expected result taken directly from the spec. **[ASSUMED-IN-CODE]** = the spec records it as code behavior that isn't confirmed. **[PO-CONFIRM]** = the spec doesn't define it; the test can't pass or fail until the product owner answers. **[BLOCKED Qn]** = waiting on a numbered open question.
- Test reference date: **today = Wed 2026-10-21**, device and server in the same time zone (the spec doesn't define time zones, see G-03).
- Test users: **M1** = Manager with team E1, E2 across companies C1, C2. **E1** = Employee (company C1, department D1). **E2** = Employee (company C2, department D2).

---

## 1. QA summary and specification readiness

### Overall verdict: **Partially ready — testable for the list/filter core, not ready for workload, permissions, create validation or detail actions.**

| Area | Readiness | Why |
|---|---|---|
| Dashboard | 🔴 Not ready | Metrics approved (Q10), but status-list field names unconfirmed (Q20), "late" undefined, Visit summary counts parsed but not mapped, and no rule on whether the dashboard follows the filters. Its counts can't match the Main list, because the dashboard has no Main field (G-50) |
| Current / Previous | 🟡 Partial | Business rule clear (Q2). The boundary depends on Q14 (inclusive `endDateTime`) and Q23 (date format). Time zone and recurring-occurrence start are undefined |
| Quick filters / Scope | 🔴 Not ready | The scope → `onlyMe` mapping contradicts itself between files and with the business meaning (Q16). Chip combination rules are undefined |
| Filter sheet | 🟢 Mostly ready | Apply / Reset / Dismiss, date validation and dependent-clear rules are defined. Missing: category → execution type clear, defaults for Reset, chip-vs-sheet date conflict |
| Search | 🔴 Not ready | Matched fields unknown (Q19). Debounce interval, minimum length and trimming undefined |
| Sorting | 🟢 Ready | Q8 confirmed. Tie-break undefined (minor) |
| Pagination | 🟢 Mostly ready | Rules are clear. Page size, dedupe key and the `totalCount`-missing case are undefined |
| Create / Edit | 🟡 Partial | v1.2 toggle behavior is clear. Field-level validation is "existing baseline" with no written rules. Edit may drop attachments, address and contact (G-35) |
| Details & actions | 🔴 Not ready | Permission flags blocked (Q13). Status transitions, step order and status 7 handling undefined |
| Progress | 🟢 Mostly ready | 0–100 int confirmed (Q7). Who may update is blocked (Q13) |
| Workload / Assignment | 🔴 Blocked | Status field doesn't exist yet (Q12). Date window contradicts "today" (Q17) |
| Errors & UI states | 🟡 Partial | States listed. Retry behavior, timeouts and error messages undefined (Q24) |
| Arabic / English | 🟡 Partial | Toggle direction defined. Whether backend names are localized is TBD |
| Regression (old module) | 🟢 Ready | Isolation rules and shared classes clearly listed |
| Concurrency / double submit | 🟡 Partial | Only concurrent page loads are covered. No rules for double submission, late responses or stale details (G-36–G-38) |
| Cross-screen consistency | 🔴 Not ready | The same filter means different things on the list, Main and the dashboard: the dashboard can't carry Main, Priority or Search, and Main can't carry execution type or Current/Previous (G-13, G-50–G-55) |
| Multi-assignee / recurring | 🔴 Not ready | One card or one per assignee, count and progress semantics, and occurrence vs series actions are undefined (G-39, G-40) |

**Numbers:** 236 test cases written (46 P0). 111 have fully documented expected results, 108 have at least one [PO-CONFIRM] or [ASSUMED-IN-CODE] part, and 17 are blocked (Q12, Q13, Q14, Q19 or the undocumented create baseline). 58 specification gaps found, 11 of them critical. Run R1 (§7) raised 7 defects.

**Process observations**
- The spec is marked **Approved** while three backend questions (Q12–Q14) block core behavior and ten more (Q15–Q24) aren't sent yet. QA recommends "Approved with open items" until at least Q14, Q16 and Q19 are answered.
- The v1.2 change (Visit default) records "Reason: requested by the user" (CL line 20) but no product-owner confirmation. All other product decisions cite a PO answer. Traceability gap.
- BR §12.4 "State (2026-10-18) … No app code has changed yet" is stale: T10.1 and T10.2 are ticked as done on 2026-10-21.
- (v1.3, 2026-10-27) Q12–Q14 have waited 9 days with no answer, and Q15–Q24 still haven't been sent. G-01 to G-06 depend on Q14, Q16, Q19 and Q23, so QA recommends sending Q15–Q24 now.

---

## 2. Critical gaps and ambiguities

Severity: **Critical** = a test cannot have a defined expected result, or the spec contradicts itself on core behavior. **High** = likely defect or user-visible inconsistency. **Medium / Low** = edge cases.

| ID | Type | Severity | Finding | Where | Impact | Question for the product owner / backend |
|---|---|---|---|---|---|---|
| G-01 | Contradiction | **Critical** | **Tested R1 (§7): partly settled, My activities sends the user's own IDs, so API §1.7 is wrong. Not closed: no account with a team was available.** Scope → request mapping contradicts itself. API §1.7 says **My activities** sends "the user's allowed companies and employees". BR §12.1 and T5.3 say Mine and Private send "the user's **own** IDs". | API §1.7, BR §12.1, T5.3 | "My activities" might return the whole team's activities. Test expected results differ depending on which file is right. | For "My activities", must the request contain only the logged-in user's own employee ID, or every employee they're allowed to see? |
| G-02 | Contradiction | **Critical** | **Tested R1 (§7): defect DEF-01, Private only returns public activities.** `onlyMe = true` is sent for both **All** (team + mine + private) and **Private only**, which have opposite meanings. The only difference is the ID list. On create, `onlyMe` means "only the creator sees it". The DTO says `null` = All scope, but the code never sends null. | API §1.7, §3.10, OQ Q16 | Private-only may show non-private items, or All may hide public ones. The scope filter can't be verified. | What does `onlyMe` mean on list/dashboard requests? What exact request represents "All", "My team", "My activities" and "Private only"? |
| G-03 | Missing rule | **Critical** | **Tested R1 (§7): DEF-07, the buckets follow the device time zone.** No time zone rule. "Today 00:00" isn't defined as device local time, company time or server time. | BR §7.2, API §1.6 | Users in another time zone, or a device with the wrong clock, will see activities in the wrong bucket. Gap/overlap rule can break. | Which time zone defines "today 00:00" for Current/Previous, the dashboard and the workload? |
| G-04 | Undefined API | **Critical** | **Tested R1 (§7): DEF-06, Previous still ends at yesterday 00:00; Q14 still open.** Previous boundary depends on whether `endDateTime` is inclusive (Q14) and whether the backend reads `yyyy-MM-dd` or `yyyy-MM-ddTHH:mm:ss` (Q23). If the backend truncates to a date, "2026-10-20T23:59:59" and "2026-10-21T00:00:00" behave differently than the spec intends. | BR §7.2, API §1.6, Q14, Q23 | Activities at 00:00 today may appear in both lists, or yesterday's may still drop. The core WP1 fix can't be signed off. | Is `endDateTime` inclusive? Does the backend compare date-times or only dates? |
| G-05 | Missing rule | **Critical** | "Scheduled start" isn't defined for recurring (weekly/monthly) activities. A list item is one occurrence, but the card shows only `masterData.fromDateTime`/`endDateTime` (API §4.3). | BR §6.7, §7.2, API §4.1, §4.3 | Sorting and Current/Previous might use the master start, not the occurrence date. A recurring activity that started last month would sit in Previous forever. | For a recurring activity, are Current/Previous and sorting based on the occurrence date/time or the master's start? Which date must the card show? |
| G-06 | Ambiguous | **Critical** | Search fields unknown (Q19). Debounce interval, minimum characters, trimming and case/diacritic sensitivity aren't defined. | BR §6.6, Q19 | The acceptance criterion "matching results are returned according to the agreed search contract" refers to a contract that doesn't exist. | Which fields does `searchValue` match? Debounce ms? Minimum length? Trimmed? Case-insensitive? Arabic diacritics/alef variants normalized? |
| G-07 | Missing rule | **Critical** | Status **7 Partially Completed** is in neither the Open group {1,2} nor the Non-editable group {3,4,5}. | BR §4.2, §7.1 | Actions on a partially completed activity are undefined (edit, progress, reschedule, complete). | Which actions are allowed when the status is Partially Completed? How does an activity reach status 7? |
| G-08 | Blocked | **Critical** | Workload status field doesn't exist yet (Q12). | BR §6.5, API §3.6 | WP2 and its four acceptance-criteria-level states can't be tested. | (Already sent) field name, type and value set. Also see G-15. |
| G-09 | Blocked | **Critical** | Per-action permission flags don't exist (Q13). Only `canEdit` exists. | BR §3, API §3.7 | No permission test can pass against the confirmed rule (Q9). Security risk if actions show by status alone. | (Already sent) Plus: which screens can the Employee role open (Add? Main? Filter by employee?) |
| G-10 | Contradiction | High | Workload window: BR §4.2 says the window is **today**; API §3.6 / Q17 says `fromDateTime` and `endDateTime` are **both the current instant**. A zero-width window. | BR §4.2, API §3.6, Q17 | Workload may always be empty → every employee shown as Unknown (after WP2) or Available (today). | Which window defines workload: today, current instant, or the scheduled period of the activity being assigned? |
| G-11 | Ambiguous | High | Does the dashboard follow the quick filters and filter sheet? "Must stay consistent with … the dashboard state" (BR §6.1) vs the dashboard request having no priority, search or department fields. | BR §5.1, §6.1, API §3.1 | After filtering by Priority the dashboard may show unfiltered numbers. | Which filters apply to the dashboard counts and chart? Which do not? |
| G-12 | Missing rule | High | Combination rules for chips are missing: Current vs Previous vs Main (mutually exclusive?), the default chip on open, the default scope, and how a chip interacts with the filter sheet's start/end dates. | BR §6.1, §6.2 | Two different date ranges could be sent at once; chips may show selected state inconsistently. | Which chips are single-select vs multi-select? What is selected on first open? If the user sets a date range in the sheet, is Current/Previous cleared? |
| G-13 | Contradiction | High | Main list ignores Current/Previous: `currentOrOld` is always 0, `priorityId` is a list, `categoryId` is an int, and the response shape is unknown (Q18). | API §3.3 | Main + Previous may show current items. Main pagination may stop early or loop. | Can Main be combined with Current/Previous? What is the Main response shape and total? |
| G-14 | Missing validation | High | Create/Edit validation is "the existing form" with no written rules: required fields per type, title length, from/to date and time rules, past dates, recurrence rules, location required for Visits, contact mobile format, attachment limits. | BR §5.3, Q6 | QA cannot derive expected results. Only "same as today's behavior" regression testing is possible. | Please list the required fields and validation messages for Visit and Task, or attach the existing form's rule sheet. |
| G-15 | Missing rule | High | Employees absent from the workload response: are they Available or Unknown? The rule "missing → unknown, never Available" would make every idle employee Unknown if the backend omits them. | BR §6.5, API §3.6 | Every free employee may be shown Unknown, defeating the picker's purpose. | Will the backend return an entry with a status for every employee, including employees with no activities? |
| G-16 | Missing rule | High | Status change: allowed transitions, which target statuses are offered, and whether `statusReason` is mandatory (e.g. for Cancelled/Rejected). | BR §5.4, API §3.15 | Users may reject without a reason, or reopen completed items. | What is the status transition matrix? When is a reason required? |
| G-17 | Missing rule | High | Step order and preconditions: can Start happen before Check-in? Complete before Start? Check-out without Check-in? Location permission denied when `locationRequired`? Does Complete set status 4 or 7? Does progress 100 auto-complete? | BR §5.4, API §3.11–3.14 | Field users can submit steps out of order; data integrity risk. | Please define the step state machine for Visits and Tasks. |
| G-18 | Undefined API | High | `totalCount` missing maps to 0 (API §3.2). With 10 items returned and total 0, "stop when every item is loaded" can't be evaluated. | API §3.2, BR §8.1 | List may stop after page 1, or the empty state may show over real items. | Is `totalCount` always present? If absent, should the app fall back to "full page = maybe more" like the Main list? |
| G-19 | Contradiction | Medium | BR §7.3 says an empty selection "may be sent as `null`", but also that All sends **every allowed ID**. API marks `companyId`/`employeeId` as required arrays. | BR §7.3, API §3.1–3.2 | Two valid-looking requests for the same UI state; backend results may differ. | For "All", send `null`, `[]`, or the full allowed-ID list? (One answer per field.) |
| G-20 | Missing rule | Medium | Department filter has no request field (Q15). Whether choosing a parent department includes child departments is undefined. | BR §6.4, Q15 | Department results may miss sub-department employees. | Is selecting a department recursive over its sub-departments? |
| G-21 | Missing rule | Medium | Dependent-clear rules don't cover: Visits → All (are Visit-only values cleared?), and Category change → execution type (execution types depend on category, API §3.5). | BR §6.2, §7.4 | A stale execution type may be submitted for a different category. | Clear execution type when category changes? Clear Visit-only values when type becomes All? |
| G-22 | Missing rule | Medium | Employee picker "not displayed until a company has been selected" vs company **defaults to All**. Does All count as selected? | BR §6.4, §7.3, §10 | Picker may be hidden on first open, or shown, depending on interpretation. | With company = All (the default), is the employee picker shown? |
| G-23 | Undefined | Medium | Dashboard: definition of `tasksLate`/`visitsLate`, which statuses appear in the stacked bar (mapping sums only 1, 2, 4), "empty summary" definition, and Visit summary today/current/previous parsed but not mapped. | API §3.1, BR §5.1 | Bar segments may not add up to the totals; Visit and Task summaries show different data without a rule. | Which statuses appear in the bar and rows? What does "late" mean? What must the Visit Summary show? |
| G-24 | Missing rule | Medium | Type switch on Add clears the form, but there's no rule for warning the user about losing entered data. | BR §5.3 | Data loss complaints. | Show a confirmation before clearing a non-empty form on type switch? |
| G-25 | Missing rule | Medium | Progress: can it decrease? Is it editable for Completed/Cancelled/Rejected? What does `null` progress display ("0%" or "not started")? Input method (slider steps, free text)? | BR §7.5, API §3.19, §4.2 | Inconsistent display and possibly invalid updates. | Define progress editability per status and the display for `null`. |
| G-26 | Undefined API | Medium | Error messaging: the `error` array is ignored; `responseMessage` may be empty; no timeout values; no retry action defined for any state. | API §1.5, BR §8.2, Q24 | Blank error toasts, no way to recover except leaving the screen. | Which message shows when `responseMessage` is empty? Which states need a Retry button? Timeout length? |
| G-27 | Missing rule | Medium | Refresh behavior: what happens to sort, filters and current page on pull-to-refresh, after create/edit/status change, and at midnight rollover ("today" recalculated?). | BR §6.7, §8.1 | Stale lists after actions; activities in the wrong bucket after midnight. | Which actions trigger a list/dashboard refresh? Is "today" recomputed on refresh? |
| G-28 | Assumed in code | Low | Unknown `typeId` falls back to **Task**. Unknown status IDs (6, 8…) have no display rule. | BR §4.2 | A new backend type would silently show as Task. | Confirm the fallback, or show "Unknown"? |
| G-29 | Ambiguous | Low | "Creator" (searchable, displayed) — the list item has only `assignByName`. Is assigner = creator? | BR §5.2, §6.6, API §4.1 | Wrong field shown/searched. | Is `assignByName` the creator? |
| G-30 | Undefined | Low | Localization: are `priorityName`, `statusName`, `typeName`, `actionName` localized by `langId`? Is `langId` "ar" for Arabic? What happens to the screen when the language changes? | API §1.2, §3.4 | English labels in the Arabic UI. | Does the backend localize lookup names by `langId`? |
| G-31 | Traceability | Low | v1.2 "Visit default" has no product-owner approval recorded. `isEnabled = false` activities: visible in lists or hidden? | CL v1.2, API §3.18 | Disabled items may still appear and be actionable. | Confirm v1.2 with the PO. Should disabled activities appear in the lists and dashboard? |
| G-32 | Contradiction | High | Privacy is controlled in two places, and neither maps cleanly to the request. BR §6.2 and §7.3 define a Privacy filter (`isPrivate`, default true = private included with public), and BR §6.1 has a "Private only" scope chip. The list and dashboard requests have no `isPrivate` field, only `onlyMe`, which the scope drives (API §1.7). What `isPrivate = false` does is undefined. | BR §6.1, §6.2, §7.3; API §1.7, §3.1–3.2 | FLT-04 and FLT-21 can't check the request. Turning privacy off may do nothing. | Is the Privacy filter separate from the Scope chip? If so, which request field carries it, and does `isPrivate = false` exclude private activities? |
| G-33 | Contradiction | Low | BR §11 asks for unit tests of "workload classification", but Q4 says the app computes no thresholds and only displays the backend status. | BR §11, §6.5, Q4 | Developers may write or keep client-side classification to satisfy the test plan. | Remove "workload classification" from BR §11, or rename it to "workload status mapping". |
| G-34 | Test design | Medium | The sort field isn't sent, only `direction`. Sorting by scheduled start (Q8) happens on the backend. If test data is created in the same order it is scheduled, sorting by creation date would also pass. | BR §6.7, API §3.2 | A backend that sorts by `createdAt` would go unnoticed. | (QA action, no question) Use data whose creation order differs from its scheduled order (SRT-05). |
| G-35 | Undefined API | High | Edit goes through `InsertVisitOrTask` with the activity ID, but the repository always sends `attachments = []`, `addressText = null`, `companyContactId` / `companyContactEmail = null` and `companyId` = the logged-in company. If the backend replaces the record, every edit deletes the existing attachments, address and contact, and can move the activity to another company. | API §3.10 | Silent data loss on edit. | On update, does the backend replace every field or only the ones sent? Are existing attachments kept when `attachments = []`? Which `companyId` must an update send? |
| G-36 | Missing rule | High | No rule against double submission of Save (create/edit), steps (check-in/out, start, complete), change status, reschedule, add note or progress. The requests carry no idempotency key. | BR §5.3, §5.4, §8.2; API §3.10–3.19 | Duplicate activities, steps or notes from a double tap or a retry after a timeout. | Must the app disable each action while its request is in flight? Does the backend reject duplicates? |
| G-37 | Missing rule | High | BR §8.1 prevents concurrent page requests but says nothing about responses that arrive out of order: a slow search response arriving after a newer one, or page 2 of the old filter arriving after the filter changed. | BR §6.6, §8.1 | The list shows results for an old query, or mixes two filters. | Must the app ignore (or cancel) every response except the one for the latest query? |
| G-38 | Missing rule | Medium | No rule for acting on stale details: another user changes the status (for example, the manager cancels) while the details screen is open, and the user then starts or completes it. | BR §5.4 | Actions on cancelled or completed activities; unclear error. | What does the backend return for an action the current status doesn't allow? Must the app reload details after a failed action? |
| G-39 | Ambiguous | High | An activity with several assignees has one occurrence (`detailsid`) per assignee. Undefined: whether a manager's list shows it once per assignee, whether dashboard counts are per activity or per occurrence, and whether progress is per occurrence or rolled up to the master. | BR §5.1, §5.2, §7.5; API §3.1, §3.19, §4.1 | Cards that look duplicated, dashboard totals that don't match the list, wrong progress. | For a multi-assignee activity: one card or one per assignee? Do counts count activities or occurrences? Is progress per assignee? |
| G-40 | Missing rule | Medium | Recurring activities: does reschedule or change status apply to one occurrence or the whole series? What happens to completed occurrences when the master is edited (new dates, days or assignees)? | BR §5.3, §5.4; API §3.10, §3.15, §3.16 | History lost or rewritten; duplicated occurrences. | Which actions apply to one occurrence and which to the series? How does editing a master affect past and completed occurrences? |
| G-41 | Missing rule | High | On create, `onlyMe` means "only the creator sees it" (Q16), but a private activity still has assignees. Undefined: whether an assignee can see a private activity assigned to them. | API §3.10, §4.1; Q16 | An employee may never see a task assigned to them, or private data may leak to assignees. | Can an assignee see a private activity assigned to them? Can a private activity be assigned to someone else at all? |
| G-42 | Missing rule | Medium | No rule for applied filters, scope and selected employees on logout, user switch or logged-in company switch. WP1 mentions persisted filters, so persistence may exist. | BR §7.3, WP1; API §1.2 | The next user or company inherits the previous filters and employee IDs; wrong or empty results. | Are filters persisted? Must they reset on logout and on company switch? |
| G-43 | Missing rule | Medium | No rule for opening details (deep link, notification, stale list) of an activity that was deleted, disabled or is no longer accessible to the user. | BR §5.4, §8.2; API §3.7, §3.18 | Crash, blank screen, or a disabled or private activity shown to the wrong user. | What does `GetVisitOrTaskDetails` return in those cases, and what must the app show? |
| G-44 | Missing rule | Medium | Create sends `companyId` = the logged-in company, but the assign-to picker can list employees from other companies in the user's tree. | BR §6.3, §6.5; API §3.10 | Activity saved under the wrong company; the assignee can't see it. | Can an activity be assigned across companies? If so, which `companyId` is sent? |
| G-45 | Test risk | Medium | Weekly days use 1 = Saturday … 7 = Friday (API §1.6), while Dart's `DateTime.weekday` uses 1 = Monday … 7 = Sunday. A mapping error shifts every weekly schedule by two days. | API §1.6, §3.10 | Weekly activities created on the wrong days. | (QA action, no question) Test every weekday (CRT-24). |
| G-46 | Missing validation | Medium | No rule for Arabic-Indic digits (٠–٩) typed into progress, search, dates or times. | BR §6.6, §7.5 | Progress rejected or saved as 0; numeric searches don't match. | Must numeric inputs accept and normalize Arabic-Indic digits? |
| G-47 | Missing validation | Medium | Reschedule sends one `newDate` with `newFromTime` / `newToTime`, plus `startDateTime` / `endDateTime`. Undefined: an end before the start, an activity that crosses midnight, and which pair the backend trusts. | API §3.16 | Invalid schedules saved, or the two pairs disagree. | What are the reschedule validation rules? Which fields are authoritative? |
| G-48 | Missing rule | Medium | No limits for attachments and step files (size, count, types), and no rule for a failed or partial multipart upload. | API §1.3, §3.10, §3.12–3.14 | Large uploads time out; a step saved without its files, or files without the step. | Maximum file size, count and types? Is a step saved when a file upload fails? |
| G-49 | Contradiction | Medium | The dashboard's `totalTasksCurrent` / `totalTasksPrevious` (and the Visit equivalents) are computed by the backend with its own split. The list uses the app's split at today 00:00 (Q2). | BR §7.2; API §3.1 | The dashboard and the list can show different Current/Previous counts. | Does the backend use the same today-00:00 split, and the same time zone, as Q2? |
| G-50 | Contradiction | **Critical** | The dashboard and the Main list count different things, so their numbers can't match. The Main chip switches the list to `GetVisitAndTaskList`, which returns master activities (one per activity). The dashboard always calls `GetTaskAndVisitDashboard`, whose request has no Main (`isMain`) field and which likely counts occurrences (one per assignee and date, see G-39). After selecting Main and going to the dashboard, the user sees a total that differs from the Main list. BR §6.1 requires the quick filters to stay consistent with the dashboard state. | BR §5.1, §6.1; API §3.1, §3.3 | Users read the dashboard as wrong; managers can't reconcile the dashboard with the Main list. | Must the dashboard follow the Main chip? If yes, the backend needs a Main flag (or master-level counts) on `GetTaskAndVisitDashboard`. If no, must the dashboard say what it counts, or must Main be cleared when the user returns to the dashboard? |
| G-51 | Contradiction | **Critical** | Same problem as G-50 for **Priority** and **Search**. The list request carries `priorityId` and `searchValue`, but the dashboard request has neither. After filtering by Priority High or searching "Audit" and going to the dashboard, the dashboard still counts every priority and every title, while the chip or search box shows a filter is active. | BR §5.1, §6.1; API §3.1, §3.2 | The dashboard and the list disagree whenever Priority or Search is used. | Must the dashboard follow Priority and Search? If yes, the backend must add `priorityId` and `searchValue` to `GetTaskAndVisitDashboard`. If no, must the dashboard show that these filters don't apply to it? |
| G-52 | Contradiction | High | The Main list can't filter by **Visit execution type**: `GetVisitAndTaskList` has no `executionTypeId` field (it also ignores Current/Previous, G-13). With Visits + a category + an execution type applied, the regular list is filtered by execution type but Main isn't, and the filter sheet still shows it as applied. | API §3.2, §3.3; BR §6.2 | Main shows Visits of every execution type under an active execution-type filter. | Must the backend add `executionTypeId` to `GetVisitAndTaskList`? If not, must the app hide or disable the execution-type filter while Main is selected? |
| G-53 | Ambiguous | Medium | The dashboard request carries `typeId`. After the Tasks (or Visits) chip, the Visits-vs-Tasks donut becomes 100 % / 0 % and the other type's summary shows 0. The approved metrics (Q10) assume both types. | BR §5.1 Q10; API §3.1 | The donut and one summary look broken or empty while a type chip is active. | Must the dashboard ignore the type chip, or show only the selected type's summary and hide the donut? |
| G-54 | Contradiction | Medium | The dashboard request carries `fromDateTime` / `endDateTime`, and its summary has its own Today / Current / Previous counts. With the Previous chip applied, the dashboard's Current and Today counts can only be 0; with Current, Previous is 0. | BR §5.1, §7.2; API §3.1 | The summary shows zeros that look like missing data. | Must the dashboard ignore the Current/Previous chip, since its summary already splits by time? |
| G-55 | Ambiguous | High | The list endpoint is named `GetVisitAndTaskAssignedToLoggedInUser`, but the app uses it for the All and My team scopes with the whole team's `employeeId` list. If the backend only returns activities assigned to the logged-in user, the list shows only the manager's own activities while the dashboard (which takes the same IDs) counts the team's. | API §3.2, §1.7; BR §6.1 | Under My team, the list and the dashboard show different totals; a manager can't see the team's activities. | Does `GetVisitAndTaskAssignedToLoggedInUser` honor `employeeId` for other employees, or only return the logged-in user's activities? |
| G-56 | Ambiguous | Medium | The workload chip in the picker counts an employee's activities for the current instant (G-10) with no scope, while the list filtered to that employee for today uses the scope, Current/Previous and the other filters. The two numbers for the same employee differ. | BR §6.5; API §3.6, §3.2 | A manager sees "3 activities" in the picker and 5 in the list for the same employee and day. | Which window and filters define the workload count, and must it match the list for that employee? |
| G-57 | Ambiguous | Medium | The timeline opens with whatever ID the screen has: an occurrence ID from the regular list, a master ID from Main (API §3.9 TBD). The same activity may show a different history depending on where the user opened it. | API §3.9; BR §5.4 | Missing or extra history entries depending on the entry point. | Is `GetTaskHistoryTimeline` keyed by master or occurrence ID, and must both entry points show the same history? |

---

## 3. Prioritized test cases

Priority: **P0** = smoke / blocker, **P1** = core functional, **P2** = edge / secondary, **P3** = cosmetic.
Steps are numbered within the cell. "Req" = requirement reference.

### 3.1 Dashboard (Module: Activities Dashboard)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| DSH-01 | Dashboard is the entry screen and shows returned data | M1 logged in; backend returns data | `taskCount`=6, `visitCount`=4 | 1) Open Activities from the app menu | [DOC] Dashboard opens first. App bar: Back, "Activities", Add, Filter. Donut shows Tasks 6 and Visits 4. Visit Summary and Tasks Summary sections are visible and visually distinct. Quick filters are visible | P0 | Positive | BR §5.1, §10 Dashboard |
| DSH-02 | Status counts map by status ID | As DSH-01 | `taskStatusList`: {1:2},{2:1},{4:3} | 1) Open dashboard 2) Read task status bar and rows | [DOC] Pending 2, In Progress 1, Completed 3 for Tasks | P1 | Positive | API §3.1 mapping, Q10 |
| DSH-03 | Statuses 3, 5, 7 in the status list | As DSH-01 | `taskStatusList`: {3:1},{5:1},{7:2},{4:1} | 1) Open dashboard | [PO-CONFIRM G-23] Mapping sums only 1, 2, 4. Whether Cancelled, Rejected and Partially Completed are shown is undefined. Record what is displayed | P2 | Boundary | API §3.1, G-23 |
| DSH-04 | Missing numbers become 0 | As DSH-01 | `result` without `taskCount`, `visitStatusList` | 1) Open dashboard | [DOC] Missing values display as 0. No crash, no "null" | P1 | Negative | API §3.1 |
| DSH-05 | Empty summary | M1 has no activities | `taskCount`=0, `visitCount`=0, empty lists | 1) Open dashboard | [DOC] Empty-summary state is shown (BR §8.2). Donut doesn't render broken/NaN. [PO-CONFIRM] exact empty UI | P1 | Boundary | BR §8.2 |
| DSH-06 | Dashboard business failure | — | `success`=false, `statusCode`=200, `responseMessage`="Server busy" | 1) Open dashboard | [DOC] Error state shows "Server busy". Loading indicator stops | P0 | Negative | BR §10, §8.2; API §1.5 |
| DSH-07 | `success` true but `statusCode` ≠ 200 | — | `success`=true, `statusCode`=400 | 1) Open dashboard | [DOC] Treated as failure → error state | P1 | Negative | API §1.5 |
| DSH-08 | Network timeout / offline | Airplane mode on | — | 1) Open dashboard | [DOC] Error state, loader stops. [PO-CONFIRM G-26] Retry control and message text | P0 | Negative | BR §8.2 |
| DSH-09 | Default dashboard request body | M1, no filters applied | Allowed companies C1, C2 | 1) Open dashboard 2) Capture request (Chucker) | [DOC] `data` contains `typeId`=null, `statusId`=null, `categoryId`=[], `executionTypeId`=null, `companyId`=[C1,C2] and all allowed `employeeId`, null keys present (`includeIfNull`). [PO-CONFIRM G-19] null vs full ID list | P1 | Integration | API §3.1, BR §7.3 |
| DSH-10 | Tasks quick filter on dashboard | Dashboard loaded | — | 1) Tap Tasks chip | [DOC] Activity view restricted to Tasks (list `typeId`=1). [PO-CONFIRM G-11] whether donut/summaries also refresh | P0 | Positive | BR §10 Dashboard |
| DSH-11 | Late counts | — | `tasksLate`=2, `visitsLate`=1 | 1) Open dashboard | [PO-CONFIRM G-23] Where and whether late counts show; definition of late | P3 | Positive | API §3.1 |
| DSH-12 | Dashboard follows filter sheet | Dashboard loaded | Filter: Status=Pending, Priority=High | 1) Apply filter 2) Observe dashboard | [PO-CONFIRM G-11] Dashboard request carries `statusId`=1. Priority cannot be sent (no field) | P2 | Integration | BR §6.1, API §3.1 |
| DSH-13 | Dashboard and list Current/Previous counts match | Activities on both sides of today 00:00 | TS-08 dataset (10 activities) | 1) Read the dashboard Current/Previous summary counts 2) Count list items under Current and under Previous | [PO-CONFIRM G-49] The counts match (backend uses the Q2 split) | P2 | Integration | BR §7.2, API §3.1, G-49 |
| DSH-14 | Multi-assignee activity in the counts | One Task assigned to E1 and E2 | — | 1) Open dashboard as M1 | [PO-CONFIRM G-39] `taskCount` counts it once or twice; record which | P1 | Boundary | API §3.1, G-39 |
| DSH-15 | Dashboard counts vs Main list | 3 master Tasks: one weekly with 4 occurrences, one assigned to E1 and E2, one single | — | 1) Tap Main and count the Tasks in the list (scroll to the end) 2) Go to the dashboard and read `taskCount` | [PO-CONFIRM G-50] The counts match, or the dashboard clearly says what it counts. Record both numbers | P1 | Integration | BR §5.1, §6.1; API §3.1, §3.3; G-50 |
| DSH-16 | Priority chip → dashboard | 4 Tasks: 1 High, 3 Low | Priority High | 1) In the list, select Priority High (1 Task listed) 2) Go to the dashboard 3) Capture the dashboard request | [PO-CONFIRM G-51] Dashboard shows 1 Task, or clearly says Priority doesn't apply. Request has no `priorityId` today | P1 | Integration | BR §6.1; API §3.1; G-51 |
| DSH-17 | Search → dashboard | "Audit" matches 1 of 4 Tasks | "Audit" | 1) Search "Audit" in the list 2) Go to the dashboard | [PO-CONFIRM G-51] Dashboard shows 1 Task, or clearly says search doesn't apply. Request has no `searchValue` today | P1 | Integration | BR §6.1; API §3.1; G-51 |
| DSH-18 | Type chip → donut and summaries | 3 Visits, 4 Tasks | Tasks chip | 1) Select Tasks 2) Go to the dashboard | [PO-CONFIRM G-53] Donut and Visit Summary: unchanged, hidden, or 0 / 100 %. Nothing renders as broken | P2 | Boundary | BR §5.1 Q10; G-53 |
| DSH-19 | Previous chip → dashboard summary | Activities today, in the future and in the past | Previous chip | 1) Select Previous 2) Go to the dashboard | [PO-CONFIRM G-54] Today/Current counts aren't shown as 0 when such activities exist, or the dashboard says the time filter applies | P2 | Boundary | BR §7.2; API §3.1; G-54 |

### 3.2 Current / Previous time scope (Module: Quick filters — time)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| TS-01 | Activity exactly at today 00:00 | Today 2026-10-21 | A1 start `2026-10-21T00:00:00` | 1) Tap Current 2) Tap Previous | [DOC] A1 is in Current only, never in Previous | P0 | Boundary | BR §7.2, T1.1 |
| TS-02 | Yesterday's activity is not dropped (WP1 fix) | — | A2 start `2026-10-20T10:00:00` | 1) Tap Previous 2) Tap Current | [DOC] A2 is in Previous only. (Current code drops it — expected to fail until WP1) | P0 | Regression | BR §12.1 WP1, Q2 |
| TS-03 | Last second of yesterday | — | A3 start `2026-10-20T23:59:59` | 1) Tap Previous 2) Tap Current | [DOC] A3 in Previous only | P0 | Boundary | BR §7.2 |
| TS-04 | Future activity | — | A4 start `2027-01-01T09:00:00` | 1) Tap Current | [DOC] A4 in Current (no end bound) | P1 | Positive | BR §6.1 |
| TS-05 | Old activity | — | A5 start `2020-01-01T09:00:00` | 1) Tap Previous | [DOC] A5 in Previous (no start bound) | P1 | Positive | BR §6.1 |
| TS-06 | Current request | — | — | 1) Tap Current 2) Capture list request | [DOC] `fromDateTime`="2026-10-21T00:00:00", `endDateTime`=null | P0 | Integration | API §3.2 |
| TS-07 | Previous request | — | — | 1) Tap Previous 2) Capture request | [BLOCKED Q14] `fromDateTime`=null; `endDateTime`="2026-10-21T00:00:00" if exclusive, or "2026-10-20T23:59:59" if inclusive (current fallback). Never "2026-10-20T00:00:00" | P0 | Integration | API §3.2, BR §12.4 |
| TS-08 | No gap, no overlap | Dataset A1–A5 + 5 more around midnight | 10 activities total | 1) Count Current 2) Count Previous 3) Count with no time scope | [DOC] Current + Previous = total; no activity ID appears in both | P0 | Boundary | BR §6.1, §7.2 |
| TS-09 | Midnight rollover | App open at 2026-10-21 23:59 on Current | A6 start `2026-10-21T08:00` | 1) Wait until 00:01 on 2026-10-22 2) Pull to refresh | [PO-CONFIRM G-27] Whether A6 moves to Previous and request uses 2026-10-22 | P2 | Boundary | G-27 |
| TS-10 | Device in another time zone | Device TZ UTC+0, company/server UTC+3 | A7 start 2026-10-21 01:00 (server time) | 1) Open Current and Previous | [PO-CONFIRM G-03] Bucket depends on undefined TZ rule | P2 | Boundary | G-03 |
| TS-11 | Previous chip stays highlighted | — | — | 1) Tap Previous 2) Navigate into a detail and back | [DOC] Previous chip still highlighted | P1 | Regression | T1.2 |
| TS-12 | Saved filter from before WP1 | App upgraded from build with old Previous range | — | 1) Open Activities after upgrade | [DOC] No filter keeps the old yesterday-00:00 bound; Previous chip matches | P2 | Regression | BR WP1 |
| TS-13 | Recurring activity occurrence | Weekly activity master start 2026-09-01, occurrence 2026-10-23 | — | 1) Tap Current | [PO-CONFIRM G-05] Is the 2026-10-23 occurrence in Current? | P1 | Boundary | G-05 |

### 3.3 Quick filters (Module: Quick filters — type, main, scope, status, priority, department)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| QF-01 | Visits chip | Mixed data | 3 visits, 4 tasks | 1) Tap Visits | [DOC] Request `typeId`=2; only Visits listed | P0 | Positive | BR §6.1 |
| QF-02 | Tasks chip | Mixed data | — | 1) Tap Tasks | [DOC] Request `typeId`=1; only Tasks | P0 | Positive | BR §6.1, §10 |
| QF-03 | Main chip uses Main endpoint | — | — | 1) Tap Main | [DOC] Request goes to `GetVisitAndTaskList`; items are master activities | P1 | Integration | API §3.3 |
| QF-04 | Main with priority | — | Priority High (id 3) | 1) Tap Main 2) Set Priority High | [DOC] `priorityId`=[3]. With no priority → `[]`, never `0` | P1 | Integration | API §3.3 |
| QF-05 | Main + Previous | — | — | 1) Tap Main 2) Tap Previous | [PO-CONFIRM G-13] `currentOrOld` always 0 today, so Previous is ignored on Main | P1 | Integration | API §3.3, G-13 |
| QF-06 | Scope All | M1 | Allowed companies C1, C2 | 1) Select Scope All | [ASSUMED-IN-CODE] `onlyMe`=true, all allowed IDs. [PO-CONFIRM G-02] Results include team + mine + private | P1 | Integration | BR §6.1, API §1.7, Q16 |
| QF-07 | Scope My team | M1 | — | 1) Select My team | [ASSUMED-IN-CODE] `onlyMe`=false, all allowed IDs | P1 | Integration | API §1.7 |
| QF-08 | Scope My activities | M1 | — | 1) Select My activities | [PO-CONFIRM G-01] `onlyMe`=false; ID list = own IDs (BR) or allowed IDs (API). Results only M1's activities | P1 | Integration | API §1.7, T5.3 |
| QF-09 | Scope Private only | M1 has 2 private, 5 public | — | 1) Select Private | [DOC] Only the 2 private activities appear, each with a privacy indicator. [PO-CONFIRM G-01] Request: `onlyMe`=true; ID list = own IDs (BR T5.3) or allowed IDs (API §1.7) | P1 | Positive | BR §6.1, §5.2 |
| QF-10 | Status chip | — | Completed (4) | 1) Select Status Completed | [DOC] `statusId`=4; every item shows Completed | P1 | Positive | BR §6.1 |
| QF-11 | Priority chip | — | High (id 3) | 1) Select Priority High | [DOC] `priorityId`=3 (single int); every item High | P1 | Positive | BR §6.1, API §3.2 |
| QF-12 | Department chip | E1 in D1, E2 in D2 | D1 | 1) Select Department D1 | [ASSUMED-IN-CODE Q15] No department field; `employeeId` contains only D1 employees; only E1's activities | P1 | Integration | BR §6.1, Q15 |
| QF-13 | Chip ↔ sheet consistency | — | — | 1) Tap Tasks 2) Open Filter 3) Change type to Visits 4) Apply | [DOC] Sheet opens with Tasks; after apply the Visits chip is selected | P1 | Integration | BR §6.1 |
| QF-14 | Default chip on first open | Fresh install | — | 1) Open Activities | [PO-CONFIRM G-12] Default time scope and scope chip | P2 | Positive | G-12 |
| QF-15 | Current and Previous together | — | — | 1) Tap Current 2) Tap Previous | [PO-CONFIRM G-12] Single-select (Previous replaces Current) or toggle off | P2 | Boundary | G-12 |
| QF-16 | List → Main → dashboard | Mixed data; dashboard loaded | — | 1) Open the list 2) Tap Main 3) Go back to the dashboard 4) Open the list again | [PO-CONFIRM G-50, G-12] Whether Main stays selected on the dashboard and in the list. The chip state shown always matches the data shown | P1 | Integration | BR §6.1, G-50 |
| QF-17 | Main + execution type | Visits of category A with execution types X and Y | Type Visits, category A, execution X | 1) Apply the filter in the regular list 2) Tap Main 3) Capture the Main request | [PO-CONFIRM G-52] Main shows only execution X, or the execution-type filter is hidden/disabled on Main. Request has no `executionTypeId` today | P1 | Integration | API §3.3; G-52 |
| QF-18 | My team: list vs dashboard totals | M1's team: E1 has 3 Tasks, E2 has 2, M1 has 1 | Scope My team | 1) Select My team 2) Count Tasks in the list 3) Go to the dashboard and read `taskCount` | [PO-CONFIRM G-55] Both show the team's Tasks (6, or 5 if M1's own are excluded), not only M1's 1 | P1 | Integration | API §1.7, §3.2; G-55 |

### 3.4 Filter sheet (Module: Filter Sheet)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| FLT-01 | Apply status and priority | List on page 3 | In Progress (2), High (3) | 1) Open Filter 2) Pick both 3) Apply | [DOC] Request `statusId`=2, `priorityId`=3, `skip`=0. List refreshes | P0 | Positive | BR §10 Filtering, §8.1 |
| FLT-02 | Dismiss keeps applied filters | Applied Status=Pending | — | 1) Open Filter 2) Change to Completed 3) Dismiss (swipe down / back) 4) Reopen | [DOC] No new request; list still Pending; sheet shows Pending | P0 | Negative | BR §5.5, §10 |
| FLT-03 | Reset only clears the draft | Applied Status=Pending, Priority=High | — | 1) Open Filter 2) Reset 3) Dismiss | [DOC] Draft cleared to defaults; after Dismiss applied filters are still Pending/High. [PO-CONFIRM G-12] list of defaults | P1 | Positive | BR §5.5 |
| FLT-04 | Reset then Apply | As FLT-03 | — | 1) Reset 2) Apply | [DOC] Request with defaults (`statusId`=null, `priorityId`=null). [PO-CONFIRM G-32] How the privacy default appears in the request (there is no `isPrivate` field) | P1 | Positive | BR §5.5, §7.3 |
| FLT-05 | Visits → Tasks clears Visit-only | — | Category "Field", Execution "On-site" | 1) Type Visits 2) Pick category + execution 3) Switch to Tasks 4) Apply | [DOC] Category and execution hidden; request `categoryId`=[], `executionTypeId`=null | P0 | Positive | BR §7.4, §10 |
| FLT-06 | Visit-only hidden for All | — | — | 1) Type All | [DOC] Category and execution type hidden. [PO-CONFIRM G-21] whether earlier values are cleared | P1 | Boundary | BR §6.2 |
| FLT-07 | Category change reloads execution types | Type Visits | Category A → B | 1) Pick A, execution X 2) Change to B | [DOC] `GetTaskExecutionTypeList` called with `{"id": B}`. [PO-CONFIRM G-21] X cleared | P1 | Integration | API §3.5 |
| FLT-08 | Only one category | Type Visits | — | 1) Try to pick 2 categories | [DOC] At most one ID sent in `categoryId` | P2 | Boundary | API §3.2 |
| FLT-09 | Start equals end | — | Start = End = 2026-10-21 10:00 | 1) Set dates 2) Apply | [DOC] Allowed ("not later than"). Request has both values | P1 | Boundary | BR §7.3 |
| FLT-10 | Start after end | — | Start 2026-10-22 10:00, End 2026-10-21 10:00 | 1) Set dates 2) Apply | [DOC] Not submitted, no request. [PO-CONFIRM] message text and whether Apply is disabled | P0 | Negative | BR §7.3 |
| FLT-11 | Start 1 minute after end | — | Start 2026-10-21 10:01, End 10:00 | 1) Apply | [DOC] Rejected as FLT-10 | P1 | Boundary | BR §7.3 |
| FLT-12 | Only start date | — | Start 2026-10-01 00:00 | 1) Apply | [DOC] `fromDateTime`="2026-10-01T00:00:00", `endDateTime`=null | P2 | Positive | API §1.6 |
| FLT-13 | Sheet range vs Current chip | Current chip active | Range 2026-09-01 → 2026-09-30 | 1) Apply range | [PO-CONFIRM G-12] Which range is sent; whether Current is deselected | P1 | Integration | G-12 |
| FLT-14 | Company change clears employees | — | C1 + E1 | 1) Pick C1, E1 2) Change to C2 3) Apply | [DOC] E1 removed from selection and from `employeeId` | P0 | Positive | BR §6.3, §7.4, §10 |
| FLT-15 | Employee picker needs a company | No company selected | — | 1) Open Filter | [DOC] Employee picker not displayed. [PO-CONFIRM G-22] when company = All | P1 | Negative | BR §6.4, §10 |
| FLT-16 | Company All | M1 with C1, C2 | — | 1) Leave company on All 2) Apply | [DOC] `companyId` contains C1 and C2 (every allowed ID). [PO-CONFIRM G-19] | P1 | Integration | BR §7.3 |
| FLT-17 | Employee All | — | — | 1) Leave employee on All | [DOC] `employeeId` = every allowed employee ID | P1 | Integration | BR §7.3 |
| FLT-18 | Empty company list fallback | Company list returns [] | — | 1) Open Filter | [DOC] Current company used "where permitted". [PO-CONFIRM] when it's permitted | P2 | Boundary | BR §6.3 |
| FLT-19 | Department change clears out-of-scope employees | E1 in D1 | — | 1) Pick D1, E1 2) Change to D2 | [DOC] E1 cleared | P1 | Positive | BR §7.4 |
| FLT-20 | Parent department | D1 has child D1a with E3 | — | 1) Pick D1 | [PO-CONFIRM G-20] Whether E3's activities are included | P2 | Boundary | G-20 |
| FLT-21 | Privacy default | M1 has private + public | — | 1) Open Filter without changes 2) Apply | [DOC] Privacy default (`isPrivate` = true) → private and public both listed. [PO-CONFIRM G-32] Which request field carries it (lists only have `onlyMe`) | P1 | Positive | BR §7.3 |
| FLT-22 | Priority lookup fails | `GetPriorityList` returns failure | — | 1) Open Filter | [DOC] Lookup error state in the priority section; sheet still usable | P2 | Negative | BR §8.2 |
| FLT-23 | Priority lookup empty | Returns [] | — | 1) Open Filter | [DOC] "No available options" state | P2 | Boundary | BR §8.2 |
| FLT-24 | Full applied state sent | Applied: Type Visits, Status Pending | — | 1) Open Filter 2) Change only Priority to Low 3) Apply | [DOC] Request still includes `typeId`=2 and `statusId`=1 plus the new priority | P1 | Regression | BR §8.1 |
| FLT-25 | Privacy filter turned off | M1 has private and public activities | Privacy off | 1) Open Filter 2) Turn privacy off 3) Apply 4) Capture request | [PO-CONFIRM G-32] Which request field changes; whether private activities disappear | P1 | Integration | BR §6.2, §7.3, G-32 |
| FLT-26 | Privacy filter vs Private-only chip | — | Scope Private only; privacy off in the sheet | 1) Select Private only 2) Turn privacy off in the sheet 3) Apply | [PO-CONFIRM G-32] Which one wins; the request doesn't contradict itself | P2 | Integration | BR §6.1, §7.3, G-32 |

### 3.5 Search (Module: Activities List — Search)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| SRC-01 | Search by title | Activity "Quarterly Audit" exists | "Audit" | 1) Type "Audit" | [DOC] One request with `searchValue`="Audit", `skip`=0. [BLOCKED Q19] "Quarterly Audit" returned | P0 | Positive | BR §6.6, §10 |
| SRC-02 | Search by assigned employee | Assigned to "Ahmed Ali" | "Ahmed" | 1) Type "Ahmed" | [BLOCKED Q19] Activities assigned to Ahmed returned | P1 | Positive | BR §6.6 |
| SRC-03 | Search by creator | Created by "Sara" | "Sara" | 1) Type "Sara" | [BLOCKED Q19, G-29] Activities created by Sara | P1 | Positive | BR §6.6 |
| SRC-04 | Debounce | — | Type "A","u","d","i","t" within 1 s | 1) Type quickly 2) Count requests | [DOC] Not one request per keystroke; final request "Audit". [PO-CONFIRM G-06] interval | P1 | Positive | BR §6.6 |
| SRC-05 | Clear search | Search "Audit" active | — | 1) Clear the field | [DOC] Request `searchValue`="" and full list returns; `skip`=0 | P1 | Positive | API §3.2 |
| SRC-06 | No match | — | "zzqq" | 1) Type "zzqq" | [DOC] Empty state shown | P1 | Negative | BR §10 List |
| SRC-07 | Arabic text | Arabic title "زيارة عميل" | "زيارة" | 1) Type "زيارة" | [DOC] Sent unchanged as UTF-8. [BLOCKED Q19] matching result | P2 | Positive | BR §6.6 |
| SRC-08 | Whitespace only | — | "   " | 1) Type spaces | [PO-CONFIRM G-06] Trimmed to "" or sent as is | P2 | Boundary | G-06 |
| SRC-09 | Special characters | — | `%'_"<>` | 1) Type value | [DOC] No crash; sent literally; error or empty state, not a hang | P2 | Negative | BR §8.2 |
| SRC-10 | Search + filter | Status=Pending applied | "Audit" | 1) Type "Audit" | [DOC] Request has `statusId`=1 and `searchValue`="Audit" | P1 | Integration | BR §8.1 |
| SRC-11 | Search on Main | Main chip active | "Audit" | 1) Type "Audit" | [DOC] `GetVisitAndTaskList` receives `searchValue`="Audit" | P2 | Integration | API §3.3 |
| SRC-12 | Very long input | — | 500 characters | 1) Paste | [PO-CONFIRM] Max length; no crash | P3 | Boundary | G-06 |
| SRC-13 | Out-of-order search responses | Slow network: the "Au" response is delayed 3 s, "Audit" 1 s | "Au", then "Audit" | 1) Type "Au" and pause past the debounce 2) Type "dit" | [PO-CONFIRM G-37] Results for "Audit" stay on screen after the late "Au" response arrives | P1 | Negative | BR §6.6, G-37 |
| SRC-14 | Arabic-Indic digits | Title "Visit 2026" exists | "٢٠٢٦" | 1) Type "٢٠٢٦" | [PO-CONFIRM G-46] Digits normalized or sent as typed; record whether "Visit 2026" is found | P2 | Boundary | BR §6.6, G-46 |

### 3.6 Sorting (Module: Activities List — Sort)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| SRT-01 | Default newest first | 3 activities: 10-18, 10-20, 10-25 | — | 1) Open list | [DOC] `direction`="desc"; order 10-25, 10-20, 10-18 | P0 | Positive | BR §6.7, API §1.6 |
| SRT-02 | Oldest first | List on page 2 | — | 1) Choose Oldest first | [DOC] `direction`="asc", `skip`=0; order reversed | P1 | Positive | BR §6.7, §8.1 |
| SRT-03 | Sort kept on refresh/filter | Oldest first selected | — | 1) Pull to refresh 2) Apply a status filter | [DOC] `direction` stays "asc" both times | P1 | Regression | BR §6.7 |
| SRT-04 | Same start time | 3 activities at 2026-10-21 09:00 across 2 pages | pageSize such that they split | 1) Scroll both pages | [DOC] No duplicates or missing items. [PO-CONFIRM] tie-break order | P2 | Boundary | BR §8.1 |
| SRT-05 | Sort uses scheduled start, not creation date | — | A: created 10-01, scheduled 10-25. B: created 10-10, scheduled 10-18. C: created 10-20, scheduled 10-22 | 1) Open list (newest first) 2) Switch to oldest first | [DOC] Newest first: A, C, B. Oldest first: B, C, A. (Sorting by creation would give C, B, A) | P1 | Positive | BR §6.7 Q8, G-34 |

### 3.7 Pagination (Module: Activities List — Paging)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| PAG-01 | First page | — | `totalCount`=25, pageSize N | 1) Open list | [DOC] Request `skip`=0, `pageSize`=N. [PO-CONFIRM] value of N | P0 | Positive | BR §8.1 |
| PAG-02 | Next pages without duplicates | 25 items, pageSize 10 | — | 1) Scroll to end twice | [DOC] Requests `skip`=10 then 20; 25 unique items | P0 | Positive | BR §10 List |
| PAG-03 | Stop when complete | 25 loaded | — | 1) Scroll to end again | [DOC] No 4th request; no endless loader | P0 | Boundary | BR §8.1 |
| PAG-04 | No concurrent page loads | Slow network (3 s) | — | 1) Fling to bottom repeatedly | [DOC] Only one request in flight for `skip`=10 | P1 | Negative | BR §8.1 |
| PAG-05 | Reset on filter/search/sort/chip change | On page 3 | — | 1) Change status 2) Change search 3) Change sort 4) Change chip | [DOC] Each change sends `skip`=0 and replaces the list | P0 | Regression | BR §8.1, §10 |
| PAG-06 | Page 2 fails | Page 1 loaded | Page 2 returns 500 | 1) Scroll to end | [DOC] Page 1 items stay; pagination error shown separately; loader stops. [PO-CONFIRM G-26] retry control | P1 | Negative | BR §8.1, §8.2 |
| PAG-07 | Duplicate across pages | New activity inserted server-side between page 1 and page 2 | Same `detailsid` 101 on both pages | 1) Load page 2 | [DOC] 101 shown once. [ASSUMED] dedupe key = `detailsid` | P1 | Boundary | BR §8.1 |
| PAG-08 | `totalCount` missing | — | 10 items, no `totalCount` | 1) Open list 2) Scroll | [PO-CONFIRM G-18] Mapped to 0; whether paging continues | P1 | Negative | API §3.2 |
| PAG-09 | Exact multiple | `totalCount`=20, pageSize 10 | — | 1) Scroll to end | [DOC] Exactly 2 requests | P1 | Boundary | BR §8.1 |
| PAG-10 | Main list without total | Main chip | Page 1 = 10 items, page 2 = 3 | 1) Scroll | [DOC] Requests page 2 (full page = maybe more); stops after 3 | P2 | Boundary | API §3.3 |
| PAG-11 | Pull-to-refresh | Page 2 loaded | — | 1) Pull to refresh | [DOC] Refreshing state; page 1 reloaded with `skip`=0. [PO-CONFIRM] old items kept if refresh fails | P1 | Positive | BR §8.2 |
| PAG-12 | `totalCount`=0 with empty items | — | `{"totalCount":0,"items":[]}` | 1) Open list | [DOC] Empty state; no further requests | P1 | Boundary | BR §10 |
| PAG-13 | Filter change while a page is loading | Page 1 loaded; page 2 slow (3 s) | — | 1) Scroll to the end 2) Before page 2 returns, apply Status=Completed | [DOC] Only results for the new filter are listed; the late page 2 isn't appended. The new request uses the full new filter state with `skip`=0 | P1 | Negative | BR §8.1, G-37 |
| PAG-14 | Multi-assignee activity in a manager's list | One Task assigned to E1 and E2; M1 on Scope All | — | 1) Open list as M1 | [PO-CONFIRM G-39] One card or two (one per `detailsid`); deduplication doesn't drop a card | P1 | Boundary | BR §5.2, §8.1, G-39 |

### 3.8 List item display (Module: Activities List — Item)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| LST-01 | All fields shown | — | Item with all fields, `onlyMe`=true, progress 40 | 1) Open list | [DOC] Title, type, status, priority, assigned employee, creator, date/time, progress 40, privacy indicator | P1 | Positive | BR §5.2 |
| LST-02 | Missing fields not faked | — | `priorityName`=null, `userName`="" | 1) Open list | [DOC] Field hidden; no "null", "N/A" or invented value | P1 | Negative | BR §5.2 |
| LST-03 | Progress only where applicable | — | Item without progress | 1) View card | [DOC] No progress shown. [PO-CONFIRM G-25] null vs 0 | P2 | Boundary | BR §5.2 |
| LST-04 | Unknown type ID | — | `typeId`=3 | 1) View card | [ASSUMED-IN-CODE] Shows as Task. [PO-CONFIRM G-28] | P2 | Negative | BR §4.2 |
| LST-05 | Unknown status ID | — | `status.id`=6 | 1) View card | [PO-CONFIRM G-28] | P3 | Negative | BR §7.1 |
| LST-06 | Empty results | — | `items`=[] | 1) Apply filter with no matches | [DOC] Empty state | P0 | Negative | BR §10 List |
| LST-07 | Initial load error | — | 500 | 1) Open list | [DOC] Initial-load error state; no spinner left | P0 | Negative | BR §8.2 |
| LST-08 | Backend spellings | — | `longtitude`, `addressTest`, `detailsid` populated | 1) View card / open item | [DOC] Values displayed and used (details opens with `detailsid`) | P1 | Integration | API §1.6 |
| LST-09 | Disabled activity | — | `isEnabled`=false | 1) Open list | [PO-CONFIRM G-31] Shown or hidden; indicator | P2 | Boundary | API §3.18 |
| LST-10 | Recurring card date vs details date | Weekly Task: master starts 2026-09-01; occurrence 2026-10-23 | — | 1) Find the 10-23 occurrence in the list 2) Open it | [PO-CONFIRM G-05] The card and the details show the same date (10-23), not the master start on the card | P1 | Integration | API §4.1, §4.3; G-05 |

### 3.9 Create / Edit (Module: Add Activity)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| CRT-01 | Visit is the default | M1 | — | 1) Tap Add | [DOC] Visit selected; category, execution type, location and contact fields shown | P0 | Positive | BR §5.3 v1.2, T10.3 |
| CRT-02 | Toggle order EN | English UI | — | 1) Tap Add | [DOC] Visit on the left (start), Task on the right (end) | P1 | Positive | BR §5.3 |
| CRT-03 | Toggle order AR | Arabic UI | — | 1) Tap Add | [DOC] Visit on the right (start), Task on the left | P1 | Positive | BR §5.3 |
| CRT-04 | Type switch clears form | — | Title "Test", category A | 1) Enter data 2) Switch to Task 3) Switch back | [DOC] Form is clean after each switch. [PO-CONFIRM G-24] confirmation prompt | P1 | Positive | BR §5.3 |
| CRT-05 | Create Visit request | All Visit fields valid | Title "Client visit", category 5, exec 2, lat/long set, contact "Omar"/"0500000000", assign [E1] | 1) Fill 2) Save | [DOC] Multipart; `requestbody` envelope; `data`: `id`=0, `typeId`=2, `visitCategory`=5, `taskExecutionType`=2, `longitude`/`latitude` set, `statusId`=1, `isEnabled`=true, `companyId`=logged-in company, `attachments`=[], `translate`=[], `onlyMe`=false | P0 | Integration | API §3.10 |
| CRT-06 | Create Task request | — | Title "Prepare report", assign [E1] | 1) Switch to Task 2) Fill 3) Save | [DOC] `typeId`=1, `visitCategory`=null, `taskExecutionType`=null | P0 | Integration | API §3.10 |
| CRT-07 | Trim | — | Title "  Audit  ", description " x " | 1) Save | [DOC] `title`="Audit", `description`="x" | P1 | Boundary | API §3.10 |
| CRT-08 | Private activity | — | Private on | 1) Create as M1 2) Log in as E1 3) Search for it | [DOC] `onlyMe`=true; only creator M1 sees it | P1 | Positive | API §3.10, Q16 |
| CRT-09 | Weekly schedule | — | Saturday + Monday | 1) Choose weekly 2) Save | [DOC] `weeklyDays`=[1,3], `monthlyDays`=[] | P1 | Positive | API §1.6, §3.10 |
| CRT-10 | Monthly day 31 | — | Day 31 | 1) Choose monthly 31 | [DOC] `monthlyDays`=[31]. [PO-CONFIRM] behavior in 30-day months/February | P2 | Boundary | API §1.6 |
| CRT-11 | Required fields | — | Empty form | 1) Save | [BLOCKED – undocumented G-14] Validation per existing form | P1 | Negative | BR §5.3 Q6 |
| CRT-12 | From after To | — | From 2026-10-22, To 2026-10-21 | 1) Save | [BLOCKED – undocumented G-14] | P1 | Negative | G-14 |
| CRT-13 | Create fails | — | Backend `success`=false | 1) Save | [DOC] Error feedback with `responseMessage`. [PO-CONFIRM] form data retained | P1 | Negative | API §1.5 |
| CRT-14 | Attachments | — | 2 files | 1) Attach 2) Save | [DOC] Two `file` parts; `attachments`=[] in `data` | P2 | Integration | API §1.3, §3.10 |
| CRT-15 | Edit Task — type locked | Task from Main list | — | 1) Main chip 2) Open Task 3) Edit | [DOC] Toggle shows Task, locked; `GetVisitOrTaskMasterData` with master ID; save sends `id`=master ID and current `statusId` | P0 | Regression | BR §5.3, API §3.8, §3.10 |
| CRT-16 | Edit Visit — type locked | Visit from Main list | — | 1) Edit | [DOC] Toggle shows Visit, locked | P1 | Regression | BR §5.3 |
| CRT-17 | After create | — | — | 1) Create 2) Return to dashboard | [PO-CONFIRM G-27] List and dashboard refreshed | P2 | Integration | G-27 |
| CRT-18 | Location for Visit | Location permission denied | — | 1) Create Visit | [BLOCKED – undocumented G-14] Whether location is mandatory | P2 | Negative | G-14 |
| CRT-19 | Edit keeps existing attachments | Task with 2 attachments | — | 1) Main chip 2) Edit the Task 3) Change only the title 4) Save 5) Reopen details | [PO-CONFIRM G-35] Both attachments are still there, although the update sends `attachments`=[] | P0 | Regression | API §3.10, G-35 |
| CRT-20 | Edit keeps address and contact | Visit with address, contact name, contact ID and email | — | 1) Edit the Visit 2) Change only the description 3) Save 4) Reopen | [PO-CONFIRM G-35] Address, contact ID and email unchanged, although the update sends them as `null` | P1 | Regression | API §3.10, G-35 |
| CRT-21 | Edit an activity from another company | M1 logged in to C1; Task belongs to C2 | — | 1) Edit the Task 2) Save 3) Capture request | [PO-CONFIRM G-35] Task stays in C2, although the request sends `companyId`=C1 | P1 | Negative | API §3.10, G-35 |
| CRT-22 | Double tap Save | Valid Visit form; slow network | — | 1) Tap Save twice quickly | [PO-CONFIRM G-36] One `InsertVisitOrTask` request; one activity created | P1 | Negative | BR §5.3, G-36 |
| CRT-23 | Assign an employee from another company | M1 logged in to C1; E2 in C2 | Assign [E2] | 1) Create a Task assigned to E2 2) Log in as E2 | [PO-CONFIRM G-44] Allowed or blocked. If allowed, E2 sees it and its `companyId` is correct | P1 | Integration | API §3.10, G-44 |
| CRT-24 | Weekly day mapping | — | Each day Saturday … Friday, one at a time | 1) Create a weekly activity on one day 2) Capture `weeklyDays` 3) Check the occurrence dates | [DOC] Saturday=1, Sunday=2, Monday=3 … Friday=7; occurrences fall on the chosen day | P1 | Boundary | API §1.6, G-45 |
| CRT-25 | Edit a recurring activity with completed occurrences | Weekly Task: 2 occurrences Completed, 3 upcoming | Change the weekly days | 1) Edit 2) Save 3) Check past and upcoming occurrences | [PO-CONFIRM G-40] Completed occurrences keep their history; no duplicate occurrences | P1 | Boundary | API §3.10, G-40 |
| CRT-26 | Attachment too large or unsupported | — | 50 MB file; `.exe` file | 1) Attach 2) Save | [PO-CONFIRM G-48] Clear error before upload; no partial activity created | P2 | Negative | API §1.3, G-48 |

### 3.10 Details and actions (Module: Activity Details)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| DET-01 | Open from list | — | `detailsid`=101 | 1) Tap item | [DOC] `GetVisitOrTaskDetails` with `{"id":101}` | P0 | Integration | API §3.7 |
| DET-02 | Open master from Main | — | master 55 | 1) Main chip 2) Tap item | [DOC] `GetVisitOrTaskMasterData` with `{"id":55}`; master view | P1 | Integration | API §3.8 |
| DET-03 | Open status allows actions | Status Pending (1) | — | 1) Open details | [ASSUMED-IN-CODE] Edit-type actions available (Open = {1,2}), subject to Q13 | P0 | Positive | BR §4.2 |
| DET-04 | Non-editable status | Status Completed (4) | — | 1) Open details | [ASSUMED-IN-CODE] Edit-type actions hidden (Non-editable = {3,4,5}) | P0 | Negative | BR §4.2 |
| DET-05 | Partially Completed | Status 7 | — | 1) Open details | [PO-CONFIRM G-07] | P1 | Boundary | G-07 |
| DET-06 | Change status request | Pending | Target Cancelled, reason "Client absent" | 1) Change status | [DOC] `{"detailsId":101,"statusId":"3","statusReason":"Client absent"}` — `statusId` is a string | P1 | Integration | API §3.15 |
| DET-07 | Status reason empty | — | Target Rejected, no reason | 1) Submit | [PO-CONFIRM G-16] Mandatory or `""` | P1 | Negative | G-16 |
| DET-08 | Reschedule request | — | 2026-10-25 09:00–10:00 | 1) Reschedule | [DOC] `newDate`="2026-10-25", `newFromTime`="09:00:00", `newToTime`="10:00:00", `startDateTime`/`endDateTime` both present | P1 | Integration | API §3.16 |
| DET-09 | Reschedule to the past | — | 2026-10-01 | 1) Reschedule | [PO-CONFIRM] allowed or blocked | P2 | Negative | API §3.16 |
| DET-10 | Check-in with location | Category `hasCheckIn`=true, `locationRequired`=true | GPS 24.7, 46.6 | 1) Check in | [DOC] `isCheckin`=true; `longitude`/`latitude` sent; `detailsId`=occurrence | P1 | Integration | API §3.12 |
| DET-11 | No check-in step | `hasCheckIn` missing | — | 1) Open details | [DOC] Missing means no → no check-in action | P1 | Negative | API §3.12 |
| DET-12 | Location denied | `locationRequired`=true; permission denied | — | 1) Check in | [PO-CONFIRM G-17] | P1 | Negative | G-17 |
| DET-13 | Step dynamic form | Category with form for actionId 3 | Required question blank | 1) Start 2) Submit blank | [DOC] `GetTaskDynamicQuestion` `{"id":master,"actionId":3}`. [BLOCKED – undocumented] required-field handling (`isRequired`) | P1 | Negative | API §3.11 |
| DET-14 | Step without form | No form for actionId 4 | — | 1) Complete | [DOC] No questions asked | P2 | Positive | API §3.11 |
| DET-15 | File answer | File control | 2 files | 1) Submit step | [DOC] `responseValue` = comma-separated file names; 2 `file` parts | P2 | Integration | API §3.12 |
| DET-16 | Step order | Not checked in | — | 1) Try Complete before Check-in/Start | [PO-CONFIRM G-17] | P1 | Negative | G-17 |
| DET-17 | Add note | — | "Called client" | 1) Add note | [DOC] `{"detailsId":101,"comment":"Called client"}`. [BLOCKED Q21] how it appears | P1 | Integration | API §3.17 |
| DET-18 | Empty note | — | "" | 1) Submit | [PO-CONFIRM] blocked or sent | P2 | Negative | API §3.17 |
| DET-19 | Disable activity | Master 55 enabled | — | 1) Disable | [DOC] `{"id":55,"isEnabled":false}`. [PO-CONFIRM G-31] effect on lists | P1 | Integration | API §3.18 |
| DET-20 | Timeline | — | Entries actionId 0–4, `modifiedAt`="10/21/2026 9:05:00 AM" | 1) Open timeline | [DOC] Each action labeled; author from `modifiedByNAme`; date parsed. [BLOCKED] master vs occurrence ID | P2 | Positive | API §3.9 |
| DET-21 | Double tap a step | Pending activity; slow network | — | 1) Tap Start twice quickly | [PO-CONFIRM G-36] One request; one timeline entry | P1 | Negative | API §3.13, G-36 |
| DET-22 | Stale status | E1 has details open (Pending); M1 cancels it meanwhile | — | 1) As E1, tap Start | [PO-CONFIRM G-38] Backend rejects; the app shows the error and reloads details showing Cancelled | P1 | Negative | BR §5.4, G-38 |
| DET-23 | Check in twice | `isCheckedIn`=true | — | 1) Open details | [PO-CONFIRM G-17] Check-in isn't offered again | P1 | Negative | API §4.2, G-17 |
| DET-24 | Check out without check-in | `hasCheckOut`=true, `isCheckedIn`=false | — | 1) Open details | [PO-CONFIRM G-17] Check-out isn't offered until checked in | P1 | Negative | API §3.12, G-17 |
| DET-25 | Reschedule with end before start | — | 2026-10-25, 10:00–09:00 | 1) Reschedule | [PO-CONFIRM G-47] Not submitted; validation message | P1 | Negative | API §3.16, G-47 |
| DET-26 | Reschedule across midnight | — | 2026-10-25 22:00 → 2026-10-26 01:00 | 1) Reschedule 2) Capture request | [PO-CONFIRM G-47] Allowed or blocked. If allowed, `newDate`, the times and `startDateTime`/`endDateTime` agree | P2 | Boundary | API §3.16, G-47 |
| DET-27 | Reschedule one occurrence of a recurring activity | Weekly Task | Move the 10-23 occurrence to 10-24 | 1) Reschedule 2) Check the other occurrences | [PO-CONFIRM G-40] Only the 10-23 occurrence moves | P1 | Boundary | API §3.16, G-40 |
| DET-28 | Open details that are gone or not accessible | Notification or deep link to an activity that was deleted, disabled, or made private by another user | — | 1) Open the link | [PO-CONFIRM G-43] Error or "not available" message; no crash; no private data shown | P1 | Negative | BR §5.4, G-43 |
| DET-29 | Step upload fails partway | Complete step with 2 files; connection drops during upload | — | 1) Submit 2) Restore the network 3) Reopen | [PO-CONFIRM G-48] The step is saved with both files or not at all; the user can retry | P2 | Negative | API §3.14, G-48 |
| DET-30 | Timeline from list vs from Main | Activity with check-in and start done | — | 1) Open the timeline from the regular list 2) Open it from Main | [PO-CONFIRM G-57] Both show the same history | P2 | Integration | API §3.9; G-57 |
| DET-31 | Status change → list and dashboard | Pending Task listed; dashboard Pending = 2 | Change to Cancelled | 1) Open the Task 2) Change status 3) Go back to the list 4) Go to the dashboard | [PO-CONFIRM G-27] The card shows Cancelled and the dashboard Pending = 1, without a manual refresh | P1 | Integration | BR §8.1; G-27 |

### 3.11 Progress (Module: Activity Progress)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| PRG-01 | Valid update | Task In Progress, update allowed | 50 | 1) Set 50 2) Save | [DOC] `{"detailsId":101,"progress":50}`; UI shows confirmed 50 | P0 | Positive | BR §7.5, §10, API §3.19 |
| PRG-02 | Lower bound | — | 0 | 1) Save 0 | [DOC] Accepted | P0 | Boundary | BR §7.5 |
| PRG-03 | Upper bound | — | 100 | 1) Save 100 | [DOC] Accepted. [PO-CONFIRM G-17] auto-complete? | P0 | Boundary | BR §7.5 |
| PRG-04 | Out of range | — | -1, 101 | 1) Try to enter | [DOC] Not submittable (int 0..100) | P1 | Negative | BR §7.5 |
| PRG-05 | Non-integer | — | 50.5 | 1) Try to enter | [DOC] Not submittable as decimal (`int`) | P1 | Negative | BR §7.5 |
| PRG-06 | Server rounds/clamps | — | Response `progress`=49.6, then 120 | 1) Save | [DOC] Displayed 50, then 100 | P1 | Boundary | API §3.19 mapping |
| PRG-07 | Response without progress | — | Sent 70; `result` without progress | 1) Save | [DOC] Displays 70 | P1 | Negative | API §3.19 |
| PRG-08 | Update fails | Shown 30 | Send 60; backend fails | 1) Save | [DOC] Error feedback; display stays 30 (confirmed server state) | P0 | Negative | BR §10 Progress |
| PRG-09 | Visit progress | Visit In Progress | 40 | 1) Save | [DOC] Allowed for Visits too | P1 | Positive | BR §7.5 |
| PRG-10 | Never updated | `details.progress`=null | — | 1) Open details | [PO-CONFIRM G-25] display | P2 | Boundary | API §4.2 |
| PRG-11 | Progress on Completed | Status 4 | — | 1) Open details | [BLOCKED Q13] + [PO-CONFIRM G-25] | P1 | Negative | BR §7.5 |
| PRG-12 | Decrease progress | Current 80 | 40 | 1) Save | [PO-CONFIRM G-25] | P2 | Boundary | G-25 |
| PRG-13 | Arabic-Indic digits | App in Arabic | "٥٠" | 1) Enter progress 2) Save | [PO-CONFIRM G-46] Saved as 50, or input blocked; never saved as 0 | P2 | Boundary | BR §7.5, G-46 |
| PRG-14 | Progress with several assignees | Task assigned to E1 and E2 | E1 sets 80 | 1) As E1, save 80 2) As E2, open the Task 3) As M1, open the master | [PO-CONFIRM G-39] E2's progress unchanged; record what M1 sees (per assignee or rolled up) | P1 | Boundary | BR §7.5, G-39 |
| PRG-15 | Double tap Save on progress | Slow network | 60 | 1) Tap Save twice | [PO-CONFIRM G-36] One request | P2 | Negative | API §3.19, G-36 |
| PRG-16 | Progress update → list card | Card shows 30 % | Save 60 | 1) Open details 2) Save 60 3) Go back to the list | [PO-CONFIRM G-27] The card shows 60 % without a manual refresh | P2 | Integration | BR §5.2, §7.5; G-27 |

### 3.12 Assignment and workload (Module: Assigned-to picker)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| ASG-01 | Picker unavailable without company | No company | — | 1) Open Add 2) Try assign | [DOC] Employee picker unavailable | P0 | Negative | BR §10 Employee |
| ASG-02 | Company change clears assignees | C1 + E1 selected | Change to C2 | 1) Change company | [DOC] E1 cleared. [PO-CONFIRM] same rule in the create form as in the filter | P1 | Positive | BR §6.3, §10 |
| ASG-03 | Four backend statuses | — | E1 Available, E2 Busy, E3 Very Busy, E4 Overloaded | 1) Open picker | [BLOCKED Q12] Each label and color as returned; no app thresholds | P0 | Positive | BR §6.5, Q4 |
| ASG-04 | Missing status | — | E1 entry without status | 1) Open picker | [DOC] Unknown, never Available. [BLOCKED Q12] field name | P0 | Negative | BR §6.5, §10 |
| ASG-05 | Unrecognized status value | — | Status "Holiday" | 1) Open picker | [DOC] Unknown | P1 | Negative | BR WP2 |
| ASG-06 | Workload request fails | — | 500 | 1) Open picker | [DOC] No employee shown Available; no chip or Unknown chip | P0 | Negative | BR §10, T2.6 |
| ASG-07 | Grouped workload | E1 has 2 visits, 1 task | — | 1) Tap E1's status | [DOC] Grouped list showing the Visits and the Task | P1 | Positive | BR §6.5 |
| ASG-08 | Employee absent from response | E5 has no activities | — | 1) Open picker | [PO-CONFIRM G-15] | P1 | Boundary | G-15 |
| ASG-09 | Workload request window | — | — | 1) Open picker 2) Capture request | [ASSUMED-IN-CODE Q17] `fromDateTime`=`endDateTime`=current instant, `onlyMe`=false. [PO-CONFIRM G-10] | P1 | Integration | API §3.6 |
| ASG-10 | Employee search | — | "Ahmed", "أحمد" | 1) Search in picker | [DOC] Matching employees listed. [PO-CONFIRM] matched fields | P2 | Positive | BR §6.5 |
| ASG-11 | Picker states | — | Slow / empty / error responses | 1) Open picker for each | [DOC] Loading, empty and error states; loader stops on error | P1 | Negative | BR §6.5, §8.2 |
| ASG-12 | Group without employeeId | — | One group missing `employeeId` | 1) Open picker | [DOC] Group skipped; no crash | P2 | Negative | API §3.6 |
| ASG-13 | Workload count vs list for one employee | E1 has 5 activities today | — | 1) In the picker, read E1's workload 2) In the list, filter to E1 and Current, count today's items | [PO-CONFIRM G-56] Both show the same count for today, or the picker says what period it covers | P2 | Integration | BR §6.5; API §3.6; G-56 |

### 3.13 Permissions and privacy (Module: Permissions)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| PERM-01 | Role screen access | E1 (Employee role) | — | 1) Open Activities | [DOC] Only screens the role allows. [PO-CONFIRM G-09] which (Add, Main, employee filter) | P0 | Positive | BR §3 |
| PERM-02 | Flag false hides action | Status Pending, master role | `canReschedule`=false (Q13) | 1) Open details | [BLOCKED Q13] Reschedule hidden although role and status allow it | P0 | Negative | BR §3, WP4 |
| PERM-03 | Flag true shows action | As above | `canReschedule`=true | 1) Open details | [BLOCKED Q13] Reschedule shown | P1 | Positive | BR §3 |
| PERM-04 | `canEdit` per assignee wins | List item top-level `canEdit`=true; `masterData.assignedTo` for M1 `canEdit`=false | — | 1) Open item | [DOC] Edit not allowed (per-assignee value wins) | P1 | Negative | API §4.1 |
| PERM-05 | `canEdit` fallback | `assignedTo` empty; top-level `canEdit`=true | — | 1) Open item | [DOC] Top-level value used | P2 | Boundary | API §4.1 |
| PERM-06 | Others' private activity | M1 private activity assigned to nobody else | — | 1) Log in as E1 2) All scopes + search title | [DOC] Never visible to E1 | P1 | Negative | API §3.10 Q16 |
| PERM-07 | Forged master route | E1 opens a master route (deep link with `isMaster`=true) | — | 1) Open link | [PO-CONFIRM] Must be denied by role; security check | P1 | Negative | BR §3 |
| PERM-08 | Private activity assigned to someone else | M1 creates a private Task assigned to E1 | — | 1) Log in as E1 2) Open the list and search for it | [PO-CONFIRM G-41] Whether E1 sees it. If such assignment is blocked instead, the create form says so | P1 | Negative | API §3.10, Q16, G-41 |
| PERM-09 | Filters after a user switch | M1 applies Scope My team and employee E2 | — | 1) Log out 2) Log in as E1 3) Open Activities | [PO-CONFIRM G-42] Filters reset to defaults; no M1 IDs in E1's requests | P1 | Negative | BR §7.3, G-42 |
| PERM-10 | Logged-in company switch | M1 in C1 with filters applied | — | 1) Switch the logged-in company to C2 2) Open Activities | [PO-CONFIRM G-42] Filters and selected employees reset; envelope `companyId`=C2 | P2 | Negative | API §1.2, G-42 |

### 3.14 API and error handling (Module: Integration)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| API-01 | Envelope fields | Logged in | — | 1) Capture any request | [DOC] `userId`, `subscriberId`, `companyId`, `langId`, `deviceTypeCode`, `deviceToken`, `deviceSerial`, `appVersion`, `oSVersion`, and body in `data`; all `POST` | P0 | Integration | API §1.1, §1.2 |
| API-02 | Multipart format | — | — | 1) Create activity 2) Capture | [DOC] `requestbody` is the JSON-encoded envelope; files in separate `file` parts | P1 | Integration | API §1.3 |
| API-03 | Empty failure message | — | `success`=false, `responseMessage`="", `error`=["Invalid"] | 1) Trigger list load | [PO-CONFIRM G-26] Shown text; no blank toast | P1 | Negative | API §1.5, Q24 |
| API-04 | Session expired | Expired token | 401 | 1) Pull to refresh | [DOC] Existing `AuthInterceptor` behavior unchanged | P1 | Regression | API §1.5 |
| API-05 | Timeout | Network throttled beyond timeout | — | 1) Open list | [DOC] Error state; no infinite loader. [PO-CONFIRM] timeout length, retry | P1 | Negative | BR §8.2 |
| API-06 | Malformed / null result | — | `success`=true, 200, `result`=null | 1) Open list / dashboard | [DOC] Handled without crash (missing numbers → 0, `totalCount` → 0) | P2 | Negative | API §3.1, §3.2 |
| API-07 | Main list priority never 0 | Main chip, no priority | — | 1) Capture request | [DOC] `priorityId`=[] (a plain `0` causes 500) | P1 | Negative | API §3.3 |
| API-08 | `includeIfNull` | — | No filters | 1) Capture list request | [DOC] Null fields present as `null` keys | P2 | Integration | API §3.1–3.3 |
| API-09 | Date format on filters | Range set | 2026-10-14 11:00 | 1) Capture | [ASSUMED-IN-CODE Q23] `"2026-10-14T11:00:00"` | P2 | Integration | API §1.6 |

### 3.15 Arabic / English (Module: Localization)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| L10N-01 | Arabic layout | App in Arabic | — | 1) Open dashboard, list, filter, Add, details | [DOC] RTL layout; translated labels; Visit at the start (right) of the toggle | P1 | Positive | BR §5.3 |
| L10N-02 | `langId` and backend names | App in Arabic | — | 1) Capture request 2) View priorities/statuses | [DOC] `langId` reflects Arabic. [PO-CONFIRM G-30] names localized | P1 | Integration | API §1.2, §3.4 |
| L10N-03 | Workload labels | After WP2 | — | 1) Picker in AR and EN | [BLOCKED Q12] Very Busy, Overloaded and Unknown labels exist in both ARB files | P2 | Positive | BR WP2 |
| L10N-04 | Dates under Arabic locale | App in Arabic | Timeline `modifiedAt` "10/21/2026 9:05:00 AM" | 1) Open timeline | [DOC] Parsed correctly regardless of UI locale | P2 | Negative | API §3.9 |
| L10N-05 | Language switch | Dashboard open | — | 1) Switch EN → AR 2) Return | [PO-CONFIRM] Data reloaded with new `langId` | P3 | Positive | G-30 |

### 3.16 Regression — existing Visit/Task module (Module: Old module)

| ID | Scenario | Preconditions | Test data | Steps | Expected result | P | Type | Req |
|---|---|---|---|---|---|---|---|---|
| REG-01 | Old module screens unchanged | Build with new module | — | 1) Run old visit list, visit & task list, add visit, add task, visit detail, visit timeline, assigned-to-me flows | [DOC] Same behavior as previous release | P0 | Regression | BR §2, §4.1, §10 Architecture |
| REG-02 | Shared Main list endpoint | — | — | 1) Use old module list (`GetVisitAndTaskList`) | [DOC] Unchanged results and request | P0 | Regression | API §3.3 |
| REG-03 | Old reschedule payload | Old module | — | 1) Reschedule in old module 2) Capture | [DOC] No `startDateTime`/`endDateTime` keys (null v2 fields omitted) | P1 | Regression | API §3.16 |
| REG-04 | List type filter order after v1.2 | — | — | 1) Open list type filter | [DOC] Order unchanged (enum order unchanged) | P1 | Regression | CL v1.2, T10.2 |
| REG-05 | Shared models | — | — | 1) Exercise old flows using lookups, statuses, assigned-to, dynamic forms | [DOC] No change in old flows | P1 | Regression | BR §4.1 |
| REG-06 | Old step submissions | Old module | — | 1) Check in / start / complete in old module | [DOC] Unchanged (shared v1 step/status classes) | P1 | Regression | BR §4.1 |
| REG-07 | Edit shows saved type | Existing Visit and Task | — | 1) Edit each | [DOC] Saved type locked (v1.2 didn't change edit) | P1 | Regression | BR §5.3 |

---

## 4. Requirement coverage matrix

Status: ✅ covered with defined expected results · 🟡 covered, part of the expectation needs PO confirmation · 🔒 blocked · ⚪ not testable from the spec.

| Requirement | Source | Test cases | Status |
|---|---|---|---|
| Dashboard layout and entry | BR §5.1 | DSH-01 | ✅ |
| Approved metrics (donut, bar, rows) | BR §5.1 Q10, API §3.1 | DSH-02, DSH-03, DSH-04, DSH-11 | 🟡 (Q20, G-23) |
| Dashboard empty / error | BR §8.2, §10 | DSH-05–DSH-08 | 🟡 (retry G-26) |
| Dashboard follows filters | BR §6.1 | DSH-10, DSH-12 | 🟡 (G-11) |
| Current / Previous split | BR §6.1, §7.2 Q2 | TS-01–TS-08, TS-13 | 🟡/🔒 (Q14, G-03, G-05) |
| WP1 Previous fix | BR §12.2 | TS-02, TS-07, TS-11, TS-12 | 🔒 Q14 for request value |
| Type, Main, Status, Priority chips | BR §6.1 Q11 | QF-01–QF-05, QF-10, QF-11 | ✅ / 🟡 (G-13) |
| Scope chip | BR §6.1, API §1.7 | QF-06–QF-09 | 🟡 (G-01, G-02) |
| Department chip / filter | BR §6.1, §6.4, Q15 | QF-12, FLT-19, FLT-20 | 🟡 (Q15, G-20) |
| Chip ↔ sheet consistency | BR §6.1 | QF-13–QF-15, FLT-13 | 🟡 (G-12) |
| Filter Apply / Reset / Dismiss | BR §5.5 | FLT-01–FLT-04 | ✅ |
| Visit-only filters + clear | BR §6.2, §7.4 | FLT-05–FLT-08 | ✅ / 🟡 (G-21) |
| Date range validation | BR §7.3 | FLT-09–FLT-12 | ✅ |
| Company / employee rules | BR §6.3, §6.4, §7.3 | FLT-14–FLT-18, ASG-01, ASG-02 | 🟡 (G-19, G-22) |
| Privacy default | BR §7.3 | FLT-21 | ✅ |
| Lookup states | BR §8.2 | FLT-22, FLT-23, ASG-11 | ✅ |
| Full applied state sent | BR §8.1 | FLT-24, SRC-10 | ✅ |
| Search fields | BR §6.6 Q19 | SRC-01–SRC-03, SRC-07 | 🔒 Q19 |
| Search debounce / edge input | BR §6.6 | SRC-04–SRC-06, SRC-08, SRC-09, SRC-11, SRC-12 | 🟡 (G-06) |
| Sorting | BR §6.7 Q8 | SRT-01–SRT-04 | ✅ |
| Pagination | BR §8.1 | PAG-01–PAG-12 | ✅ / 🟡 (G-18) |
| List item content | BR §5.2 | LST-01–LST-05, LST-08, LST-09 | ✅ / 🟡 |
| List states | BR §8.2 | LST-06, LST-07, PAG-06, PAG-11 | ✅ |
| Create default Visit / toggle (v1.2) | BR §5.3, T10.1–T10.3 | CRT-01–CRT-04, L10N-01 | ✅ |
| Create request contract | API §3.10 | CRT-05–CRT-10, CRT-14 | ✅ |
| Create validation | BR §5.3 Q6 | CRT-11, CRT-12, CRT-18 | ⚪ (G-14) |
| Edit locked type | BR §5.3 | CRT-15, CRT-16, REG-07 | ✅ |
| Details actions (status, reschedule, steps, note, enable) | BR §5.4, API §3.7–3.18 | DET-01–DET-20 | 🟡 (G-07, G-16, G-17) |
| Permission rule (role + flags) | BR §3 Q9 | PERM-01–PERM-07, DET-03, DET-04 | 🔒 Q13 |
| Progress 0–100 int | BR §7.5 Q7, API §3.19 | PRG-01–PRG-12 | ✅ / 🔒 Q13 for who |
| Workload statuses | BR §6.5 Q4 | ASG-03–ASG-08 | 🔒 Q12 |
| Workload window | API §3.6 Q17 | ASG-09 | 🟡 (G-10) |
| Envelope / errors | API §1.2–1.5 | API-01–API-09, DSH-06, DSH-07 | 🟡 (Q24) |
| Arabic / English | BR §5.3, API §1.2 | L10N-01–L10N-05, CRT-03, SRC-07 | 🟡 (G-30) |
| Isolation from old module | BR §2, §4.1, §9.2, §10 | REG-01–REG-06 | ✅ |
| Fakes removed / test fixtures (WP3, WP5) | BR §9.3, §12 | — | ⚪ Developer-level (analyzer, unit tests); outside black-box QA |
| Sort field is scheduled start (v1.3) | BR §6.7 Q8 | SRT-05 | ✅ |
| Privacy filter vs scope (v1.3) | BR §6.1, §6.2, §7.3 | FLT-25, FLT-26 | 🟡 (G-32) |
| Edit keeps existing data (v1.3) | API §3.10 | CRT-19–CRT-21 | 🟡 (G-35) |
| Double submission, late responses, stale details (v1.3) | BR §8.1, §5.4 | CRT-22, DET-21, PRG-15, PAG-13, SRC-13, DET-22 | ✅ / 🟡 (G-36–G-38) |
| Multi-assignee and recurring (v1.3) | BR §5.1, §5.2, §7.5 | DSH-14, PAG-14, PRG-14, CRT-25, DET-27 | 🟡 (G-39, G-40) |
| Private assignment, session and company switch, deep links (v1.3) | API §1.2, §3.10, Q16 | PERM-08–PERM-10, DET-28 | 🟡 (G-41–G-43) |
| Cross-company assignment and weekday mapping (v1.3) | API §1.6, §3.10 | CRT-23, CRT-24 | 🟡 (G-44) / ✅ |
| Step and reschedule edge cases, uploads (v1.3) | API §1.3, §3.12–3.16 | DET-23–DET-26, DET-29, CRT-26 | 🟡 (G-17, G-47, G-48) |
| Arabic-Indic digits (v1.3) | BR §6.6, §7.5 | SRC-14, PRG-13 | 🟡 (G-46) |
| Dashboard vs list counts (v1.3) | BR §7.2, API §3.1 | DSH-13 | 🟡 (G-49) |
| Dashboard vs Main list, Main chip across screens (v1.3) | BR §5.1, §6.1; API §3.1, §3.3 | DSH-15, QF-16 | 🟡 (G-50) |
| Filters carried to the dashboard (v1.3) | BR §5.1, §6.1; API §3.1 | DSH-16–DSH-19 | 🟡 (G-51, G-53, G-54) |
| Filters carried to Main, team scope on the list (v1.3) | API §1.7, §3.2, §3.3 | QF-17, QF-18 | 🟡 (G-52, G-55) |
| Same activity on different screens (v1.3) | BR §5.2, §6.5; API §3.6, §3.9, §4.3 | LST-10, DET-30, ASG-13 | 🟡 (G-05, G-56, G-57) |
| Screens refresh after an action (v1.3) | BR §8.1 | DET-31, PRG-16 | 🟡 (G-27) |

---

## 5. Questions requiring clarification

Grouped by who answers. Order = what to ask first.

### Must answer before testing sign-off (blockers)

1. **(G-01, G-02, Q16)** For each scope — All, My team, My activities, Private only — what exactly should the list/dashboard request send (`onlyMe` value and the employee/company ID list), and what should the user see?
2. **(G-04, Q14, Q23)** Is `endDateTime` inclusive, and does the backend compare the full date-time or only the date?
3. **(G-03)** Which time zone defines "today 00:00"?
4. **(G-05)** For recurring activities, do Current/Previous and sorting use the occurrence date or the master start? Which date does the card show?
5. **(G-06, Q19)** Which fields does search match? Debounce interval, minimum length, trimming, case and Arabic normalization?
6. **(G-07)** Which actions are allowed for status 7 (Partially Completed), and how does an activity get there?
7. **(Q12, G-15)** Workload status field, and will every employee have an entry (including idle ones)?
8. **(Q13, G-09)** Per-action flags, and which screens each role can open?
9. **(G-14)** The written validation rules of the existing create/edit form, per type.

### Should answer before release

10. **(G-10, Q17)** Workload window: today, now, or the period of the activity being assigned?
11. **(G-11)** Which filters change the dashboard numbers?
12. **(G-12)** Chip combination rules, the default chips on first open, and Reset defaults.
13. **(G-13, Q18)** Main + Current/Previous behavior and the Main response shape.
14. **(G-16)** Status transition matrix and when a reason is mandatory.
15. **(G-17)** Step order (check-in → start → complete → check-out?) and location-denied behavior.
16. **(G-18)** Is `totalCount` always returned?
17. **(G-19)** For "All": `null`, `[]` or the full allowed-ID list?
18. **(G-22)** Is the employee picker shown when the company is All?
19. **(G-26, Q24)** Error messages when `responseMessage` is empty; which states need Retry; timeout length.
20. **(G-27)** What refreshes the list and dashboard (after create/edit/status change, midnight)?

### Nice to answer

21. **(G-20)** Department selection includes sub-departments?
22. **(G-21)** Category change clears execution type? Type All clears Visit-only values?
23. **(G-23)** Bar/rows statuses, meaning of "late", Visit Summary contents.
24. **(G-24)** Confirm before clearing the form on type switch?
25. **(G-25)** Progress editability per status, decreases, display for `null`.
26. **(G-28)** Unknown type/status display.
27. **(G-29)** Is `assignByName` the creator?
28. **(G-30)** Are backend names localized by `langId`?
29. **(G-31)** Are disabled activities listed? PO sign-off of v1.2.
30. Page size for the list and Main list.

### Added in v1.3

Must answer before testing sign-off:

31. **(G-50, Q25)** Must the dashboard follow the Main chip? If yes, the backend needs a Main flag or master-level counts on `GetTaskAndVisitDashboard`. If no, how does the user know what the dashboard counts, and is Main cleared on return to the dashboard?
32. **(G-35)** On update, does `InsertVisitOrTask` replace every field or only the ones sent? Are existing attachments, address and contact kept? Which `companyId` must an update send?
33. **(G-39)** For a multi-assignee activity: one card or one per assignee? Do dashboard counts count activities or occurrences? Is progress per assignee?
34. **(G-41)** Can an assignee see a private activity assigned to them? Can a private activity be assigned to someone else at all?
35. **(G-32)** Is the Privacy filter separate from the Scope chip? Which request field carries it, and what does `isPrivate = false` do?

Should answer before release:

36. **(G-36)** Must actions be disabled while their request is in flight? Does the backend reject duplicates?
37. **(G-37)** Must the app ignore responses for anything but the latest query?
38. **(G-38)** What does the backend return for an action the current status no longer allows?
39. **(G-40)** Which actions apply to one occurrence and which to the series? How does editing a master affect completed occurrences?
40. **(G-42)** Are filters persisted? Must they reset on logout and on company switch?
41. **(G-43)** What do details return for a deleted, disabled or inaccessible activity?
42. **(G-44)** Can an activity be assigned across companies, and which `companyId` is sent?
43. **(G-47)** Reschedule validation rules, and which date/time fields are authoritative?
44. **(G-48)** File size, count and type limits; is a step saved when an upload fails?
45. **(G-49)** Does the dashboard's Current/Previous split match Q2?

Nice to answer:

46. **(G-46)** Must numeric inputs accept Arabic-Indic digits?
47. **(G-33)** Remove or rename "workload classification" in BR §11.
48. **(G-34, G-45)** QA actions only, no question: SRT-05 and CRT-24 cover them.
49. Send Q15–Q24 to the backend now (see the process observations in §1).

Cross-screen consistency (must answer before testing sign-off):

50. **(G-51, Q26)** Must the dashboard follow Priority and Search? If yes, the backend must add `priorityId` and `searchValue` to the dashboard request.
51. **(G-55, Q28)** Does `GetVisitAndTaskAssignedToLoggedInUser` return other employees' activities for My team and All, or only the logged-in user's?
52. **(G-52, Q27)** Must Main filter by execution type? If not, is the filter hidden while Main is selected?
53. **(G-53, G-54)** Must the dashboard ignore the type and Current/Previous chips, since its donut and summary already split by type and time?
54. **(G-56)** Must the picker's workload count match the list for that employee and day?
55. **(G-57)** Is the timeline keyed by master or occurrence ID?
56. **(General)** For every quick filter, list which screens it applies to (list, Main, dashboard, picker). QA suggests adding this table to BR §6.1.

---

## 6. Recommended minimum suites

### 6.1 Smoke suite (23 rows, 25 cases, run on every build)

| # | Case | Why |
|---|---|---|
| 1 | DSH-01 | Module entry works |
| 2 | DSH-06 | Error state doesn't hang |
| 3 | TS-01 | Current boundary |
| 4 | TS-02 | WP1 fix (yesterday not dropped) |
| 5 | TS-08 | No gap / no overlap |
| 6 | QF-01 | Visits chip |
| 7 | QF-02 | Tasks chip |
| 8 | FLT-01 | Apply filters |
| 9 | FLT-02 | Dismiss keeps filters |
| 10 | FLT-05 | Visit-only clear |
| 11 | FLT-10 | Date validation |
| 12 | FLT-14 | Company clears employees |
| 13 | SRC-01 | Search request sent |
| 14 | SRT-01 | Default sort |
| 15 | PAG-02 | Next page, no duplicates |
| 16 | PAG-05 | Reset on change |
| 17 | LST-06 | Empty state |
| 18 | CRT-01 | Visit default (v1.2) |
| 19 | CRT-05 / CRT-06 | Create Visit and Task |
| 20 | PRG-01, PRG-08 | Progress success and failure |
| 21 | REG-01 | Old module unaffected |
| 22 | CRT-19 | Edit doesn't drop attachments (v1.3) |
| 23 | DSH-15 | Dashboard vs Main list counts (v1.3) |

Add **ASG-04, ASG-06** once Q12 is answered and **PERM-02** once Q13 is answered.

### 6.2 Regression suite (run before each release)

- All **P0** and **P1** cases in §3, excluding those still marked 🔒 at run time.
- Always include the regression-type cases: TS-02, TS-11, TS-12, SRT-03, PAG-05, FLT-24, CRT-15, CRT-16, REG-01–REG-07, API-04.
- Run the localization pass (L10N-01, L10N-02, CRT-03) in Arabic and repeat the smoke suite once in Arabic.
- Run the error pass (DSH-06–DSH-08, LST-07, PAG-06, API-03, API-05, ASG-06, PRG-08) with a proxy or mock that forces `success=false`, HTTP 500, timeout and offline.
- (v1.3) Run the cross-screen pass: for each chip and filter, apply it in the list, then open Main, the dashboard and details, and compare counts and chip state (QF-16–QF-18, DSH-15–DSH-19, LST-10, DET-30, DET-31, PRG-16, ASG-13).
- (v1.3) Run the concurrency pass (CRT-22, DET-21, PRG-15, PAG-13, SRC-13, DET-22) on a throttled network, and the edit data pass (CRT-19–CRT-21) on activities with attachments, an address and a contact.
- **Test data set to keep stable:** activities at 2026-10-20 23:59:59, 2026-10-21 00:00:00, yesterday 10:00, far past, far future, one recurring weekly activity, one private, one disabled, one in each status 1/2/3/4/5/7, 25+ items for paging. Added in v1.3: one activity assigned to two employees, one private activity assigned to someone else, one activity in another company, one activity with attachments, an address and a contact, and three activities whose creation order differs from their scheduled order.

---

## 7. Test execution log

### Run R1 — 2026-10-27

| Item | Value |
|---|---|
| Build | `talentlink` branch `enhance/activities` @ `425fc38f`, flavor `development`, debug, app 1.3.14 |
| Device | Android emulator `Medium_Phone_API_36.0` (Android 16), time zone UTC+3 |
| Backend | `test.talentlink360.com` (TalentLink_Dev) |
| Account | "final test confirmation", role Team Leader, employee 317, company 6, subscriber 1 |
| Evidence | Request and response bodies from the app's `PrettyDioLogger` output, plus screenshots |

**Limitation:** `GetCompaniesAndEmployeesList` returned empty `allowedCompanies` and `allowedEmployees` for this Team Leader, so the app treated the account as having no team: the Scope chip offered only All, My Activity and Private. No account with a team was available, so every team-related expectation is still open.

#### Results

| Case / gap | Result | Evidence |
|---|---|---|
| G-01, QF-08 (My activities) | **Partly settled.** Sends the user's own IDs: `onlyMe`=false, `employeeId`=[317], `companyId`=[6]. This matches BR T5.3; API §1.7 ("allowed companies and employees") is wrong. Open: whether All and My activities return different results for a manager with a team. | List and dashboard requests identical in IDs; 2 activities returned |
| G-02, QF-09 (Private only) | **Fail → DEF-01.** Sends `onlyMe`=true, `employeeId`=[317], `companyId`=[6], but both returned activities have `onlyMe`=false and no privacy indicator. | Response: masters 2794 and 2780, both `onlyMe`=false |
| QF-06 (Scope All, default) | **Fail → DEF-02.** Sends `onlyMe`=true with `employeeId`=[] and `companyId`=[], not the allowed IDs (Q5) nor the user's own. Backend still returned the same 2 activities. | First list and dashboard requests after login |
| PERM-01 (role screen access) | **Blocked → DEF-03.** A Team Leader gets no team, so team scopes can't be reached. | `GetCompaniesAndEmployeesList` result empty |
| ASG-09 (workload window) | **Confirms G-10.** `fromDateTime` and `endDateTime` are both `2026-10-27T11:18:20`, a zero-length window. | `GetEmployeeTasksORVisits` request |
| TS-06 (Current request) | **Pass.** `fromDateTime`=`2026-10-27T00:00:00`, `endDateTime`=null. 1 activity (27 Oct 10:00). | List and dashboard requests |
| TS-07, G-04 (Previous request) | **Fail → DEF-06 (WP1 still open).** `fromDateTime`=null, `endDateTime`=`2026-10-26T00:00:00`, i.e. yesterday 00:00. 13 activities. This account has no activity on 26 Oct, so no item was visibly lost; Q14 (inclusive bound) still can't be checked. | List request |
| TS-10, G-03 (device time zone) | **Fail → DEF-07.** With the emulator set to UTC−12 (device date Mon 26 Oct 20:24), Current sent `2026-10-26T00:00:00` and Previous sent `endDateTime`=`2026-10-25T00:00:00`. Task #2780 (25 Oct 10:56) was then in **neither** list (Previous 12, Current 1; it was in Previous at UTC+3). "Today" comes from the device clock and is sent without a time zone. | List requests and totals before and after the change |
| QF-14 (default chips on first open) | **Observation → G-58.** Neither Current nor Previous is selected; the list and dashboard use 21 Oct 00:00 → 27 Oct 23:59:00. | First list request; dashboard header "21 Oct → 27 Oct" |

#### Defects raised

| ID | Severity | Summary | Steps | Expected | Actual |
|---|---|---|---|---|---|
| DEF-01 | High | Private only shows public activities | Activities → list → Scope → Private | Only private activities (BR §6.1) | 2 public activities (`onlyMe`=false), same as All |
| DEF-02 | High | Scope All sends empty company and employee lists | Open Activities (All is the default) | Every allowed ID (Q5), including the user's own | `employeeId`=[], `companyId`=[]. If the backend treats [] as "no filter", users may see activities outside their scope |
| DEF-03 | Medium (data or backend) | Team Leader has no team in the company/employee lookup | Log in as the Team Leader above → Activities | The Team Leader's team is returned and My team is offered | Empty `allowedCompanies` / `allowedEmployees`; My team hidden |
| DEF-04 | Low | List default range ends at 23:59:00 | Open the list | Range covers the whole last day (to 23:59:59 or next day 00:00 exclusive) | Activities between 23:59:00 and 23:59:59 are excluded |
| DEF-06 | High | Previous still ends at yesterday 00:00 (WP1 not fixed on `enhance/activities`) | List → Previous | `endDateTime` = today 00:00 (or 00:00 − 1s, Q14) | `endDateTime` = yesterday 00:00, so yesterday's activities are in neither Current nor Previous |
| DEF-07 | High | Current/Previous depend on the device time zone | Set the device to UTC−12 while the company is on UTC+3 → List → Previous, then Current | The same activity stays in the same bucket regardless of the device clock (rule pending G-03) | The boundaries move with the device date; combined with DEF-06, an activity two days old fell out of both lists |
| DEF-05 | Low (outside Activities) | Home week strip shows "THU 29" twice | Open Home | Mon 26 … Sun 1, one per day | MON 26, TUE 27, WED 28, THU 29, THU 29, FRI 30, SAT 31 |

#### New gap from R1

| ID | Type | Severity | Finding | Where | Impact | Question for the product owner |
|---|---|---|---|---|---|---|
| G-58 | Undocumented behavior | Medium | The list and dashboard open on a fixed 7-day range (21 Oct 00:00 → 27 Oct 23:59:00) with neither Current nor Previous selected. The spec defines only Current and Previous. | BR §6.1, §7.2 | Activities older than 7 days or in the future are hidden on first open; counts differ from Current/Previous. | What is the default view on first open: Current, Previous, or a date range? If a range, which one? |
