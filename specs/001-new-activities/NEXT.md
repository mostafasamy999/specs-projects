# 001 New Activities: Start Here Tomorrow

**Last updated:** 2026-10-18  
**State:** Spec v1.1 is approved, and the plan and tasks are written. The backend questions (Q12–Q14) have been sent. No app code has changed yet.

## 1. Check the backend replies first (5 min)

| Reply to | If answered | If not answered yet |
|---|---|---|
| Q12 workload status | Fill in [open-questions.md](open-questions.md) and unblock WP2 | Skip WP2 |
| Q13 permission flags | Fill it in and unblock WP4 | Skip WP4 |
| Q14 `endDateTime` bounds | Use the answer in T1.1 | Use the fallback: assume inclusive and send today 00:00 − 1s |

## 2. Work you can do regardless (in order)

1. **T1.1 + T1.2:** fix the Previous range in `lib/src/domain/entities/new_activities/new_activities_time_scope.dart`.
2. **T3.1:** delete `lib/src/domain/usecase/new_activities/fake/` and fix the comment at `di/use_case_injector.dart:805`.
3. **T5.1–T5.6:** the domain and data tests (time scope, `scopeIds`, filter clear rules, request JSON, mappers).

Then do WP2 and WP4 if the backend has answered, and the cubit/widget tests (T5.7–T5.8) after that.

## 3. Prompt to start a Claude session

Open a session in `~/StudioProjects/talentlink` and paste:

```
Read ~/work/talentlink-specs/specs/001-new-activities/{spec.md,plan.md,tasks.md,NEXT.md}.
Implement T1.1, T1.2 and T3.1 from tasks.md, then T5.1–T5.6.
Follow the plan's constraints (don't touch the old Visit/Task module; run the full build_runner, no --build-filter).
Tick each task in tasks.md only after its Verify step passes.
```

If the backend has answered, first add: `Backend answers: Q12 = …, Q13 = …, Q14 = … — record them in open-questions.md and unblock WP2/WP4.`

## 4. At the end of the day

- Tick the finished tasks in `tasks.md`.
- Update this file's **State** and the next steps.
- Commit the specs repo, e.g. `spec(001): progress — WP1, WP3 done`.
