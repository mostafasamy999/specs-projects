# Step 1 — Requirements, entities and rules

> ai-test-generation pipeline, Step 1 · 2026-10-27 · sources synced to changelog **CL-10**
> **REQ-n** = stated in a source file. **IMP-n** = inferred, not stated: each one needs a product or backend confirmation before its scenarios count as pass/fail.

Source keys: **US** = [user-scenarios-rules.md](../user-scenarios-rules.md) (SC-xx, §H) · **BR** = [business-requirements.md](../business-requirements.md) (§) · **API** = [api-contracts.md](../api-contracts.md) (§) · **CS** = [current-state-codebase-logic-tech.md](../current-state-codebase-logic-tech.md) (§) · **NQ** = [next-tasks-open-questions.md](../next-tasks-open-questions.md).

## 1. Entities

| Entity | States / attributes that matter for testing |
|---|---|
| Activity (master) | type Task 1 / Visit 2 · title · start/end · priority 1–3 · private (`onlyMe`) · people · enabled flag · status · Visit only: category, execution type (1 one-time, 2 daily, 3 weekly, 4 monthly), week days 1 Sat … 7 Fri, month days 1–31, location, contact |
| Occurrence | one scheduled instance for one person · status 1 Pending, 2 In progress, 3 Cancelled, 4 Completed, 5 Rejected, 7 Partially completed · progress 0–100 · checked-in / checked-out · notes · timeline |
| Filter | view (dashboard/list) · type · status · priority · category · execution type · scope (All / My team / My activities / Private) · departments/employees · from/to date-time · list chip (none / Current / Previous / Main) · search · sort |
| User | Team user (has people to see) · Solo user (no team) |
| Workload | per employee: Busy / Available today (4 levels agreed, blocked on Q12) |

Status groups: **open** = {1, 2}; **closed / non-editable** = {3, 4, 5}; 7 is neither (CS §5).

## 2. Explicit requirements

### A. Opening and dashboard
| ID | Requirement | Source |
|---|---|---|
| REQ-01 | Activities opens on the **Dashboard**, after a shimmer while filter options load | US SC-01, BR §5.1 |
| REQ-02 | Default filter: both types, scope All, today−6 00:00 → today 23:59, no list chip, newest first | US "Words", CS §5 |
| REQ-03 | A team user starts with all their departments and employees in scope; a solo user with only their own activities | US SC-01 |
| REQ-04 | A lookup that fails (statuses, priorities, categories, execution types, departments) hides only its own filter section / chip; the screen still opens | US SC-01, SC-12, SC-15 |
| REQ-05 | Tapping the Activities tab while on it scrolls the list to the top | US SC-01 |
| REQ-06 | The view switch shows the other view, keeps every filter, clears the search (reloading the list if it had one), and does not reload the dashboard | US SC-02 |
| REQ-07 | Dashboard shows a Visits vs Tasks donut; Visits summary (total, completed, in progress, pending, late); Tasks summary (same + today / current / previous); and the date range in use | US SC-03, BR §5.1 |
| REQ-08 | The dashboard always counts both types and follows status, category, execution type, dates and scope. It ignores priority, search and Main (⚠ Q25, Q26) | US SC-03, API §5 |
| REQ-09 | Missing dashboard numbers show as 0 | US SC-03, CS §4.5 |
| REQ-10 | Dashboard: shimmer while loading; "Something went wrong" + Retry on failure | US SC-03, BR §10 |
| REQ-11 | Tapping the Visits / Tasks summary opens the list filtered to that type; the type stays set; Tasks drops visit-only filters | US SC-04, BR §10 |

### B. List
| ID | Requirement | Source |
|---|---|---|
| REQ-12 | A card shows title, type, colored status pill, priority, private marker, assigned to / by and the schedule; fields the backend didn't send are hidden, never faked | US SC-05, BR §5.2 |
| REQ-13 | List states: shimmer on first load, "No activities" when empty, "Something went wrong" + Retry on failure | US SC-05, BR §8.2 |
| REQ-14 | Paging: 10 per page; the next page loads near the bottom with a placeholder card; one page at a time; stops when all are loaded; no duplicates | US SC-06, BR §8.1 |
| REQ-15 | A later page that fails keeps the cards shown, shows no error, and scrolling again retries | US SC-06 |
| REQ-16 | Any change of filter, search, sort or chip restarts from page 1 and discards results of the old query | US SC-06, BR §8.1 |
| REQ-17 | Pull to refresh reloads page 1 with the same filters | US SC-07 |
| REQ-18 | Search reloads the list ~0.4 s after typing stops; list only; clearing reloads the full list; switching view clears it | US SC-08, BR §6.6 |
| REQ-19 | Search matches title, assigned employee and creator (⚠ fields unconfirmed, Q19) | BR §6.6 |
| REQ-20 | Sort newest / oldest first by scheduled start; kept across refresh and filter changes; not reset by Reset; doesn't affect the dashboard | US SC-09, SC-17, BR §6.7 |

### C. Quick chips and scopes
| ID | Requirement | Source |
|---|---|---|
| REQ-21 | **Current** = scheduled start at or after today 00:00 | US SC-10, BR §7.2 |
| REQ-22 | **Previous** = scheduled start before today 00:00 (⚠ code ends at yesterday 00:00, DEF-06; Q14 for the exact end) | BR §7.2, US SC-10 |
| REQ-23 | Current and Previous never overlap and leave no gap | BR §6.1, §7.2 |
| REQ-24 | Tapping the highlighted Current/Previous clears it (back to the last 7 days). Current, Previous and Main exclude each other | US SC-10 |
| REQ-25 | **Main** lists the activities themselves (masters) with a pencil icon; ignores Current/Previous; uses a date range only if one was set in the filter sheet; tapping it again returns to the default list | US SC-11 |
| REQ-26 | Type / Scope / Status / Priority chips show the pick ("Status · In progress"); All clears that filter; list and dashboard reload | US SC-12 |
| REQ-27 | Scope always has exactly one value | US SC-12, SC-15 |
| REQ-28 | Changing the type to anything but Visit drops category and execution type | US SC-12, BR §7.4 |
| REQ-29 | Changing the scope to anything but My team clears picked departments and employees | US SC-12 |
| REQ-30 | Department chip (team users only): searchable tree; confirming filters by the pick and sets scope My team; cancel keeps the old pick; an empty confirm means everyone; solo user: does nothing | US SC-13 |
| REQ-31 | Scopes: All = everyone visible + own incl. private · My team = picked people (or all) · My activities = own only · Private = own private only (⚠ Q16, Q28) | US SC-14, BR §6.1 |

### D. Filter sheet
| ID | Requirement | Source |
|---|---|---|
| REQ-32 | Sheet sections: Type (dashboard only), Status, Priority (dashboard only), Category + Execution type (list only, Visit type only), Scope, Department, Start and End date-time | US SC-15, CS §7.1 |
| REQ-33 | Nothing applies until **Show results**; Cancel, back or swipe-down discards the draft | US SC-15, BR §5.5, §10 |
| REQ-34 | Tapping a selected option clears it; Scope can't be cleared | US SC-15 |
| REQ-35 | Department row disabled for solo users and for My activities / Private; picking departments switches the scope to My team | US SC-15 |
| REQ-36 | Either date can be removed (open-ended); end can't be before start; moving start past end clears end | US SC-15, BR §7.3 |
| REQ-37 | A badge counts filters that differ from the default; default dates and scope All don't count | US SC-15 |
| REQ-38 | Show results closes the sheet; list (page 1) and dashboard reload | US SC-16 |
| REQ-39 | Reset closes the sheet, restores the default filter, reloads, cancels a pending search reload; sort is kept | US SC-17 |

### E. Create and edit
| ID | Requirement | Source |
|---|---|---|
| REQ-40 | Add opens the form with **Visit** selected, Visit on the start side, Task on the end side (flips in Arabic) | US SC-18, BR §5.3 |
| REQ-41 | A solo user's department and employee are fixed to themselves | US SC-18 |
| REQ-42 | Create (and Save changes) stays faded until something changes | US SC-18, SC-22 |
| REQ-43 | Switching type clears the form, with a confirmation if anything was entered; locked when editing | US SC-19, BR §5.3 |
| REQ-44 | Required: title, both dates, people (department if private). Visit also: category, execution type, location, week days if weekly, month days if monthly | US SC-20, CS §6.3 |
| REQ-45 | End can't be before start; moving start past end clears end | US SC-20 |
| REQ-46 | Execution types come from the category; a category change drops an unsupported execution type; an execution-type change clears days; week Sat→Fri, month 1–31 | US SC-20 |
| REQ-47 | Private on → people fixed to the creator; off → people cleared (solo stays fixed) | US SC-20 |
| REQ-48 | After both dates are set, the people picker shows Busy / Available; on failure no chip; never Available when unknown (⚠ 4 levels blocked on Q12) | US SC-20, BR §6.5, §10 |
| REQ-49 | Contact: pick a saved one (searchable) or add one (name required); the add form opens directly when there are none | US SC-20 |
| REQ-50 | Attachments from camera, gallery or file; each can be previewed or removed | US SC-20 |
| REQ-51 | Location is picked on a map | US SC-20 |
| REQ-52 | Submit: missing fields outlined red + scroll to the first, nothing sent; success → overlay → dialog → back, list + dashboard reload; failure → dialog, stays with data kept; no double submit | US SC-21 |
| REQ-53 | Edit (Main pencil): opens filled, type locked, button "Save changes" if status not closed **and** can-edit flag; otherwise a toast ("This task is completed / cancelled / rejected" or "You can't edit this task/visit") | US SC-22 |
| REQ-54 | Edit load failure → failure dialog, then the form closes | US SC-22 |

### F. Detail (occurrence)
| ID | Requirement | Source |
|---|---|---|
| REQ-55 | Detail shows header, schedule, people, category card (visits), progress, description, attachments (preview), notes; shimmer; failure + Retry | US SC-23 |
| REQ-56 | **Start** (Pending only): category questions first if configured → In progress | US SC-24 |
| REQ-57 | Required questions must be answered; errors show after the first submit attempt | US SC-24 |
| REQ-58 | Location is sent only if the category requires it; permission denied → step still sent without it | US SC-24, API §4 |
| REQ-59 | **End** enabled only In progress → Completed, progress 100 | US SC-25 |
| REQ-60 | **Check-in / Check-out** (Visits whose category uses them): button flips, times shown; both disabled once Completed (⚠ times lost on reload) | US SC-26 |
| REQ-61 | **Add note** (open only): saved and listed; an empty note isn't sent | US SC-27 |
| REQ-62 | **Change status** (open only): pick any backend status, optional reason, screen refreshes (⚠ Q13) | US SC-28 |
| REQ-63 | **Reschedule** (open only): end defaults to the old duration, can't be before start; cancelling either picker cancels | US SC-29 |
| REQ-64 | **Progress** (In progress only): 0–100 integers; moves at once, saves ~0.6 s after the drag stops, shows the backend value; failure rolls back + error; leaving right after still saves | US SC-30, BR §7.5, §10 |
| REQ-65 | **Timeline**: oldest first, grouped by day, actor + comment; loading, error + Retry | US SC-31 |

### G. Master (Main)
| ID | Requirement | Source |
|---|---|---|
| REQ-66 | Master screen shows the detail info without progress, timeline, reschedule, status change or notes | US SC-32 |
| REQ-67 | Enable / Disable flips state and label; Main list reloads on back; greyed out for Cancelled, Completed, Rejected | US SC-33 |

### H. Everywhere
| ID | Requirement | Source |
|---|---|---|
| REQ-68 | Any failed action shows a dialog with the backend message or "Something went wrong"; a loading overlay never stays up | US §H, BR §8.2 |
| REQ-69 | One action at a time on the detail screen; taps during an action are ignored | US §H |
| REQ-70 | Returning from detail / create / edit reloads list and dashboard only when something was saved | US §H |
| REQ-71 | Arabic and English, layout follows reading direction; numbers/dates sent to the server use English digits | US §H, API §1 |
| REQ-72 | Unknown backend values: type → Task; priority → Low (or none if only an unknown name); missing status → blank | US §H, CS §4.1 |
| REQ-73 | Actions are shown only when role, status **and** the backend per-activity flag allow them (⚠ flags blocked on Q13) | BR §3 |
| REQ-74 | The old Visit/Task module keeps working unchanged | BR §2, §10 |

## 3. Implicit requirements (need confirmation)

| ID | Inferred requirement | Why inferred | Confirm with |
|---|---|---|---|
| IMP-01 | With the same filters, dashboard counts equal list counts | BR §6.1 "quick filters must stay consistent with … the dashboard state" | Product (Q25, Q26) |
| IMP-02 | An overdue Pending item is still counted as Pending (not only as "late") | Status rows are per status ID (CS §4.5); DEF-09 shows otherwise | Product (NQ new question, DEF-09) |
| IMP-03 | A user's private activity is visible to its creator under All and Private, and to nobody else | BR §7.3, US SC-14 | Backend (Q16) |
| IMP-04 | A newly created activity appears in Main (as a master) and, for its assignee, in the list (as an occurrence) after the reload | US SC-21 "reloads the list" | Product |
| IMP-05 | Editing an activity doesn't remove its attachments, address or contact | Users expect edit to change only what they touched; code drops them (CS §9 S10) | Product + backend (NQ new question) |
| IMP-06 | Check-in/out and start/end times survive leaving and reopening the detail screen | They're shown as facts about the activity | Backend (NQ new question) |
| IMP-07 | Current/Previous are computed in the user's local day | "today 00:00" in BR §7.2 doesn't name a time zone (DEF-07) | Product |
| IMP-08 | Search text is trimmed; whitespace-only search behaves as no search | Common search behavior; not stated | Product |
| IMP-09 | The dashboard's Back button and quick filters exist as BR §5.1 says (today: none, DEF-08) | BR §5.1 vs built app | Product |
| IMP-10 | Partially completed (7) items behave like closed ones for edit/actions | It's neither open nor closed in code | Product |

## 4. Business rules (numbered, for invariants in Step 2)

- **BR-1** Type IDs: Task 1, Visit 2; unknown → Task.
- **BR-2** Visit-only data (category, execution type, days, location, contact) never exists on a Task.
- **BR-3** A date range's end is never before its start (filter, create, reschedule).
- **BR-4** Current ∪ Previous = every activity; Current ∩ Previous = ∅.
- **BR-5** Scope is exactly one of four values; departments/employees only apply under My team / All.
- **BR-6** Open = Pending, In progress. Only open occurrences allow note, status change, reschedule; only In progress allows progress and End; only Pending allows Start.
- **BR-7** Closed (3, 4, 5) masters can't be edited or enabled/disabled.
- **BR-8** Progress is an integer 0–100, and the screen shows what the backend confirmed.
- **BR-9** The applied filter changes only through Show results, Reset or a chip. Cancel never changes it.
- **BR-10** The list shows only the latest query's results, with no duplicates.
- **BR-11** Workload "Available" is never shown when the status is unknown or the request failed.
