# 002 Print Logs — Feature overview (HIGH-LEVEL)

> **Doc v1.1 · 2026-10-29 · spec v1.1 · synced to changelog CL-5**

## What it is

Every `printLog(...)` the app makes is now also saved to files on the device, not only shown in the console and sent to Crashlytics. Prints are collected in a small file, **Buffer.txt** (100 prints). Each time it fills, they move into an unlimited file, **PrintLogsFile.txt**, and the buffer starts again empty. Each saved print starts with a sequential transaction ID (`TX-000042`). When the user taps send on the report issue screen, the buffer is moved right away. Every app lifecycle change (foreground, background, closing) prints an obvious `[LIFECYCLE]` entry.

## Why

- Console output is gone once the app closes, and Crashlytics only keeps a short log and only for errors. Support and QA need the full history of what the app did before a problem happened.
- A small buffer keeps writes cheap. The big file keeps everything.
- The transaction ID gives every line an order and a reference ("see TX-001204") that survives app restarts.
- Lifecycle entries show when the user left, came back or closed the app, right between the other prints, so a problem can be tied to "it happened after coming back from the background".
- Moving the buffer on report-issue submit makes the big file complete at the moment a user reports a problem, so it can be sent with the report later.

## Scope

**In scope**
- Two files per app install: `Buffer.txt` and `PrintLogsFile.txt`, in `<app documents>/print_logs/`
- Moving the buffer into the big file every 100 prints, and on report-issue submit
- When writing to the big file fails: delete its oldest half and try again
- No print lost or reordered while the files are being moved or trimmed
- Sequential transaction ID on every saved print, continuing after a restart
- The same secret hiding as Crashlytics (`LogSanitizer`): tokens and passwords never reach the files
- Web: the same logic in memory, for the open tab only
- An obvious, searchable `[LIFECYCLE]` print on every app lifecycle change and at start (not on web: the web entry points don't call `initApp`)

**Out of scope (for now)**
- A screen to view, share or export the files ([next tasks](next-tasks-open-questions.md) #1)
- Sending the file with the issue report. The report API isn't wired yet (`SendReportIssueUseCase` is a stub)
- Changing what Crashlytics or the API log store (`ApiLogStore`) records

## Status

**Built and unit tested on `feature/report_issue` (CL-1 to CL-4 committed in app commit `292d9199`, CL-5 lifecycle prints uncommitted). 15 tests pass. Checked on a dev build device: both files are created and filled. Transaction IDs and lifecycle entries not yet checked on a device.**

No backend API is involved, so this feature has no `api-contracts.md`. As agreed, there are no Maestro flows for it: the files are only reachable with `adb`, not from the screen.

## Where to look next

| Need | File |
|---|---|
| Every rule and what the user / developer sees | [user-scenarios-rules.md](user-scenarios-rules.md) |
| Change code: files, classes, flow, design | [current-state-codebase-logic-tech.md](current-state-codebase-logic-tech.md) |
| History of the requirement and why each step was taken | [changelog.md](changelog.md) |
| What's left, open questions | [next-tasks-open-questions.md](next-tasks-open-questions.md) |
