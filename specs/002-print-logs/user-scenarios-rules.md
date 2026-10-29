# 002 Print Logs — User scenarios and rules

> **Doc v1.0 · 2026-10-29 · spec v1.0 · synced to changelog CL-4**
> What the feature must do. How the code does it: [current-state-codebase-logic-tech.md](current-state-codebase-logic-tech.md).

## 1. Rules

| # | Rule | Why |
|---|---|---|
| R1 | Every `printLog` / `AppLogger.log` call is saved as one entry, including errors from `printLogAndSendToCrashlytics`. | One place with the full app history. |
| R2 | The saved text is the same as what Crashlytics gets: `[tag] message` after `LogSanitizer.redact`. | Tokens, passwords and OTPs must never be written to disk. |
| R3 | Entry format: `TX-<id> <ISO-8601 local time> [tag] message`, ending with a new line. Example: `TX-000042 2026-10-29T14:54:48.054500 [DIO] ╟ strict-transport-security: [max-age=31536000; includeSubDomains]` | Readable, sortable, and easy to reference. |
| R4 | The transaction ID goes up by 1 for each entry, in the order entries are saved. It is padded to 6 digits and keeps growing past `TX-999999`. | Shows the exact order and gives each line a reference. |
| R5 | The ID continues after an app restart. It picks up from the last ID in `Buffer.txt`, or, if the buffer is empty, from the end of `PrintLogsFile.txt`. Lines saved before the IDs existed have none, so numbering starts at `TX-000001` once. | The numbering must not restart every launch. |
| R6 | A print with several lines (like a stack trace) is one entry, and only its first line has the ID. | It is a single print. |
| R7 | New entries go to `Buffer.txt`. When it holds **100** entries, all of it is appended to `PrintLogsFile.txt`, then `Buffer.txt` is cleared and starts again. | Writing to the small file is cheap. The big file keeps everything. |
| R8 | `PrintLogsFile.txt` has no size limit, except the trim in R9. | Keep as much history as possible. |
| R9 | If appending to `PrintLogsFile.txt` fails (for example a full disk), delete its **oldest 50%** (cut at a line start), then try once more. | Make room without losing the new prints. |
| R10 | If that second try also fails, `Buffer.txt` is kept as it is. It is moved together with the next batch. | No print is lost. |
| R11 | Prints made while the buffer is being moved or the big file is being trimmed wait their turn, then are saved in order. | "No print missing", even during the move. |
| R12 | On the first print of a session, prints left in `Buffer.txt` by the previous session are moved first. | They aren't counted, so the buffer would otherwise go over 100. |
| R13 | Tapping send on the report issue screen moves `Buffer.txt` into `PrintLogsFile.txt` before the report goes out, even with fewer than 100 entries. | The big file is complete when the user reports a problem. |
| R14 | Nothing moves when the report can't be sent (title or description empty, a voice note is recording, or it's already sending). | Same condition as the send button. |
| R15 | A failure in file logging never crashes the app and never creates a log about itself. | Avoid a crash or an endless loop of logs. |
| R16 | Web has no file system: the same rules apply to memory and are lost when the tab closes. | Same behavior where possible. |

## 2. Scenarios

**S1. Normal use.** The app prints 250 times. `PrintLogsFile.txt` holds entries `TX-000001`–`TX-000200`, and `Buffer.txt` holds `TX-000201`–`TX-000250`.

**S2. Restart.** The user closes the app with 30 entries in the buffer (last ID `TX-000230`) and opens it again. On the first print those 30 entries move to the big file, and the new print is `TX-000231`, in an otherwise empty buffer.

**S3. Report an issue.** The user fills the title and description and taps send. The buffer (any size) moves into the big file, and then the report is sent. Prints made during the move are saved right after it, in the buffer.

**S4. Full disk.** Appending to the big file fails. The oldest half of the big file is deleted and the append is tried again. If it works, the buffer is cleared. If not, the buffer keeps its entries until the next batch.

## 3. Where the files are and how to read them

| Platform | Folder |
|---|---|
| Android, prod | `/data/data/com.ilead.talent.link.talent_link/app_flutter/print_logs/` |
| Android, dev | `/data/data/com.ilead.talent.link.talent_link.dev/app_flutter/print_logs/` |
| iOS | `<app container>/Documents/print_logs/` |

**Android Studio:** run a **debug** build, open View → Tool Windows → **Device Explorer**, go to `data/data/<package>/app_flutter/print_logs/`, then double-click a file or right-click → Save As. Right-click → Synchronize to refresh.

**Terminal (debug builds only):**

```bash
adb exec-out run-as com.ilead.talent.link.talent_link.dev cat app_flutter/print_logs/PrintLogsFile.txt > PrintLogsFile.txt
```

Notes:
- Release builds fail with `run-as: package not debuggable`.
- `PrintLogsFile.txt` only appears after the first 100 prints or the first report-issue send. Until then, the saved copy contains the `No such file or directory` error. Also pull `Buffer.txt` for the newest prints.
