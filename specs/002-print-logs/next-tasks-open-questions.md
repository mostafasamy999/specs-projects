# 002 Print Logs — Next tasks and open questions (HIGH-LEVEL)

> **Doc v1.1 · 2026-10-29 · synced to changelog CL-5**

## 1. Next tasks

1. **Check transaction IDs and lifecycle entries on a device.** Run a dev build, press home, reopen, then close the app. Pull `PrintLogsFile.txt` and `Buffer.txt` (see [user-scenarios-rules.md](user-scenarios-rules.md) §3). Check that the IDs go up with no gaps, including across the restart, and that `grep "[LIFECYCLE]"` shows the S5 sequence.
2. **Commit** the CL-5 lifecycle change on `feature/report_issue` (`app_lifecycle_logger.dart`, `init_app.dart`, `app_lifecycle_logger_test.dart`). CL-1 to CL-4 are already in `292d9199`.
3. **Attach the file to the issue report** once the report API is wired (`SendReportIssueUseCase` is a stub). Blocked on Q2.
4. **View / share / clear from the app** (for example from the API logs screen), so testers don't need `adb`. Needs Q1.

## 2. Open questions

| # | Question | To | Why it matters |
|---|---|---|---|
| Q1 | Should testers and users see or share the print file from inside the app? Who may see it (debug builds only)? | Product | Decides task 4, and whether release users can export logs. |
| Q2 | Does the report issue API accept a log file? What is its size limit? | Backend | Decides task 3, and whether the whole file or only its last part is sent. |
| Q3 | Should `PrintLogsFile.txt` have a size cap instead of being unlimited (it's trimmed only on a write failure)? | Product | An unlimited file can use a lot of storage on long-running installs. |
| Q4 | Should the files be cleared on logout, or when another user signs in on the same device? | Product / security | The prints are sanitized but may still contain personal data. |
| Q5 | Should the buffer be moved into `PrintLogsFile.txt` when the app goes to the background (`paused`)? Today it's moved on the next launch. | Product | The newest prints would be in the big file sooner if the app is killed. |
