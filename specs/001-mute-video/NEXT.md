# 001 Mute Video: Start Here

**Last updated:** 2026-10-19  
**State:** Spec v1.0 (baseline), the review, the plan and the tasks are written. Open questions Q1–Q8 haven't been sent yet. No app code has changed yet.

## 1. Send the open questions (10 min)

Take [open-questions.md](open-questions.md) to whoever owns the product. Q1 (max length and lowest device), Q3 (model license and hosting) and Q5 (memory probe) block real work.

## 2. Work you can do now (in order)

1. **T0.1:** test dependencies.
2. **WP1 (T1.1–T1.3):** stop the screen getting stuck in a busy state. Small, and high value.
3. **T2.1:** hide the memory probe in release builds (Option A, unless Q5 says delete).
4. **WP4 (T4.1–T4.3):** temporary-file cleanup and Android resource release.
5. **T3.1 → T3.2:** the isolate spike, then move separation off the UI isolate.
6. **WP8:** add the tests alongside the work above.

Then do T3.3 (a memory run on a device), WP5 (with the test clips), and the 🔒 tasks as answers arrive.

## 3. Prompt to start a Claude session

Open a session in `~/StudioProjects/mute-music-app` and paste:

```
Read ~/work/specs-projects/specs/001-mute-video/{spec.md,review.md,plan.md,tasks.md,NEXT.md}.
Implement T0.1, then WP1 (T1.1–T1.3), then T2.1 (Option A).
Follow the plan's constraints (don't touch the DSP math; every new string in EN and AR; no exception escapes a repository).
Tick each task in tasks.md only after its Verify step passes.
```

## 4. At the end of the day

- Tick the finished tasks in `tasks.md`.
- Update this file's **State** and next steps.
- Commit the specs repo, for example `spec(001): progress — WP1 done`.
