# 001 New Activities: Open Questions

Status values:
- **Open:** no answer yet.
- **Assumed in code:** the code already uses an answer. Confirm it or change the code.
- **Resolved:** the answer is confirmed and folded into `spec.md`.

| # | Question | Status | Current answer / note | Owner |
|---|---|---|---|---|
| 1 | Exact dashboard and list endpoints, params, response envelopes | Assumed in code | Dashboard: `v2/.../GetTaskAndVisitDashboard`. List: `v2/.../GetVisitAndTaskAssignedToLoggedInUser`. See [current-state.md](current-state.md#endpoints-all-post-v2mobilevisitandtask). The request/response shapes still need a backend contract doc. | Backend |
| 2 | Definition of Current / Previous | Assumed in code | Current = today 00:00 and later. Previous = up to yesterday 00:00. **Check:** is anything dated between yesterday 00:00 and today 00:00 dropped from Previous? | Product |
| 3 | Permitted statuses and priority IDs | Assumed in code (statuses) / Open (priorities) | Statuses: 1 Pending, 2 In Progress, 3 Cancelled, 4 Completed, 5 Rejected, 7 Partially Completed (what is 6?). Priorities come from `GetPriorityList`. | Backend |
| 4 | Workload thresholds: Available / Busy / Very Busy / Overloaded | Open | Not implemented. Is it a count of activities per day? Is a Visit weighted differently from a Task? | Product |
| 5 | Company, department, employee and privacy filtering rules | Open | `null` vs `[]` vs omitted for each endpoint. Who can see private activities? | Backend |
| 6 | Required fields for creating a Visit vs a Task | Open | The create flow exists (`new_activity_create`). Document the current validation as the baseline. | Product |
| 7 | Progress range, which types support it, `int` vs `double` | Open | The code sends an `int`. Is the range 0–100? Tasks only? | Backend |
| 8 | Date field for sorting | Assumed in code | Scheduled start, newest/oldest first | Product |
| 9 | Role permissions for create, assign and progress | Open | Is it driven by backend flags on the details response? | Product + Backend |
| 10 | Dashboard summary metrics and chart values | Open | The UI has a donut, a stacked bar and status progress rows. Confirm against the `GetTaskAndVisitDashboard` fields. | Product |
| 11 | Extra quick-filter chips (`main`, `scope`, `status`, `priority`) | Open | The code has more chips than spec §5. Keep them and update the spec, or remove them? | Product |
