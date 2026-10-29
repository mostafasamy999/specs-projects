# 001 New Activities — Next tasks and open questions (HIGH-LEVEL)

> **Doc v2.0 · 2026-10-27 · synced to changelog CL-10**
> Use this file to answer **"what do I need to chase, and what do I do next?"** It replaces `open-questions.md` and the task checklist in `business-requirements.md` §12 (both still in git history). What the code does today: [current-state-codebase-logic-tech.md](current-state-codebase-logic-tech.md). Field-level detail: [api-contracts.md](api-contracts.md). QA's own question list (56 items, G-xx gaps): [qa/qa-review-v1.3.md](qa/qa-review-v1.3.md) §2 and §5.

## 1. Blocked work

| Blocked task | Waiting on | Since |
|---|---|---|
| Show the four workload levels (Available / Busy / Very busy / Overloaded) in the people picker, and never show "Available" when it's unknown | **Q12**, backend | sent 2026-10-18 |
| Show or hide each detail action (status, reschedule, progress, enable, steps, notes) by a per-activity permission from the backend | **Q13**, backend | sent 2026-10-18 |
| Exact end of the Previous range | **Q14**, backend. Not blocking: fall back to "end inclusive, send today 00:00 minus 1 s" | sent 2026-10-18 |

## 2. Open questions

**Sent, waiting for an answer**

| # | Question (one line) | To |
|---|---|---|
| Q12 | Workload status field on the workload endpoint: name, type, value set | Backend |
| Q13 | Per-activity permission flags. Does `canEdit` already cover some of them? | Backend |
| Q14 | Is the end date of a date range inclusive or exclusive? | Backend |

**Not sent yet.** Bundle these into one message.

| # | Question (one line) | To | Why it matters |
|---|---|---|---|
| Q16 | What should "only me" be for each scope? The app sends it as *true* for All, which may hide team activities | Backend + product | Linked to defects DEF-01 and DEF-02. **Top priority** |
| Q28 | Does the "assigned to me" list return team members' activities when it's sent team IDs? | Backend | Decides whether team scopes work at all |
| Q25 | Should the dashboard follow the Main chip? | Product, then backend | Dashboard vs list numbers differ |
| Q26 | Should the dashboard follow Priority and Search? | Product, then backend | Same |
| Q27 | Should the Main list filter by execution type? | Product, then backend | Filter looks applied but isn't |
| Q15 | Departments are sent only as company IDs. Is that how the backend filters by department? | Backend | Department filter |
| Q17 | What date window should the workload check use? | Backend | Busy/available accuracy |
| Q18 | Response shape of the Main list (page with total, or plain list)? | Backend | Main paging |
| Q19 | Which fields does search match? | Backend | Search tests |
| Q20 | Confirm the dashboard status-count field names | Backend | Dashboard numbers |
| Q21 | Shape of notes/comments on the details response | Backend | Notes display |
| Q22 | Real path prefix (`v2/`?) for each environment | Backend | Docs only |
| Q23 | Date format for filters: date only, or date and time? | Backend | Pairs with Q14 |
| Q24 | Failure status codes and error contents | Backend | Error messages |

**Resolved:** Q1–Q11 (product, answered 2026-10-18 and built into spec v1.1/v1.2).

**New questions found while writing these docs.** Not numbered yet. Add them as Q29+ when they're sent:
- Does the details response include the check-in/out and start/end times? Today they're shown from the phone only and lost on reload.
- When an activity is edited, should existing attachments be sent back? Today they're dropped from the save.
- Is "late" a separate bucket, or should overdue items stay in their status count? (DEF-09, QA G-23)

## 3. What to do next (priority order)

1. **Send the unsent questions** (Q15–Q28, plus the three new ones), with Q16 and Q28 first: they decide whether scopes show the right people's activities.
2. **Fix the Previous date range** so yesterday's activities appear (today it ends a day early). Use the Q14 fallback until the backend answers. Then check that the Previous chip still highlights. *(Old T1.1–T1.2. Fixes DEF-06.)*
3. **Clean up dead and debug code:** delete the unused fake-data folder and its stale "fake until the backend is ready" comment, and remove the leftover debug prints. *(Old T3.1, plus new.)*
4. **Domain and data tests:** date presets, scope → IDs, filter clear rules, request building, dashboard/list mappers. Add the missing bloc test package first. *(Old T5.1–T5.6.)*
5. **Manual check** of Add Activity: Visit is selected by default and on the start side, switching types works, and editing a Task shows Task, locked. *(Old T10.3.)*
6. **Get product decisions** on the open QA defects that are really spec questions: no Back button or chips on the dashboard (DEF-08), "late" vs Pending (DEF-09), and the device-time-zone behavior of Current/Previous (DEF-07).
7. **When Q12 is answered:** show the four workload levels plus "unknown", and make tapping an employee's chip open their workload (today the tap does nothing). *(Old T2.1–T2.6.)*
8. **When Q13 is answered:** gate each detail action on role, status and the backend flag. *(Old T4.1–T4.2.)*
9. **Cubit and widget tests:** list paging and reload rules, dashboard error, filter sheet cancel, empty/error states, visit-only filters hidden for Tasks. *(Old T5.7–T5.8.)*
10. **Close out the docs:** add changelog entry CL-11 for this docs restructure (doc v2.0), set QA markers to CL-11, and decide whether to delete `business-requirements.md` and `open-questions.md` now that the 7 files replace them. *(Old T9.1–T9.2.)*

## 4. When an answer arrives

1. Update the row in §2 (or move it to "Resolved").
2. Unblock the matching task in §1 and §3.
3. Put the rule in [user-scenarios-rules.md](user-scenarios-rules.md) and/or [api-contracts.md](api-contracts.md).
4. Add a changelog entry with its QA impact, then run `python3 -I qa/sync_check.py`.
