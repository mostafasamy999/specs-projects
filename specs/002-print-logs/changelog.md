# 002 Print Logs: Changelog

## Latest status (2026-10-29)

| | |
|---|---|
| Spec version | **v1.1** |
| Latest entry | **CL-5**: lifecycle prints |
| App code | `feature/report_issue`: CL-1 to CL-4 in `292d9199`, CL-5 uncommitted. 15 unit tests pass |
| QA | Unit tests only. No Maestro flows (agreed: the files aren't visible on screen) |

Newest first, using the same entry template as 001.

---

## CL-5 · 2026-10-29 — v1.1 — Obvious print on every app lifecycle change

- **Change:** new `AppLifecycleLogger`, started in `initApp`, prints `[LIFECYCLE] ══════ APP LIFECYCLE: <from> → <to> · <meaning> ══════` at start and on every change (R17–R20). The entries go through `printLog`, so they land in the console, Crashlytics and the print files with a transaction ID.
- **Reason:** the request was an obvious print on app lifecycle changes that can be searched and fetched. It shows when the user left, came back or closed the app between the other prints.
- **Affected area:** user-scenarios-rules R17–R20, S5, §3 (search command) · tech §1, §2, §3.8, §4, §5 · overview
- **QA impact:** new `test/core/app_lifecycle_logger_test.dart` (4 tests). No Maestro flows.
- **Decisions:**
  - It uses a separate observer class instead of adding to `RuntimeDiagnostics`, because that class writes to `ApiLogStore` and has a different job.
  - The tag `LIFECYCLE`, the `APP LIFECYCLE` text and the `═` bars are the search keys and the visual marker.
  - It doesn't flush the buffer when the app goes to the background (not asked). The next launch moves it (R12).
  - Not on web, because the web entry points don't call `initApp`.

## CL-4 · 2026-10-29 — v1.0 — Sequential transaction ID on every print

- **Change:** every saved entry now starts with `TX-<6-digit id>`, which goes up by 1 and continues after a restart (R4–R6). New `LogSequence`. `LogFile` gets `readTail(maxBytes)`.
- **Reason:** each line needs a stable order and a reference that survives restarts. The request was "add a transaction ID to each print in the file and make it sequential".
- **Affected area:** user-scenarios-rules R3–R6 · tech §3.1, §3.4, §3.5
- **QA impact:** updated the expected lines in all store tests. New tests: resume from buffer, resume from archive, `readTail`.
- **Decisions:**
  - The store gives out the IDs, not `AppLogger`, so the order matches the order entries are saved.
  - The ID is resumed from the files instead of a separate counter file, so there's no third file to keep in sync. Only the last 64 KB of the archive is read.
  - Padded to 6 digits so lines line up. Multi-line prints get one ID.

## CL-3 · 2026-10-29 — v1.0 — Move the buffer on report-issue send

- **Change:** `PrintLogStore.flush()` added. `ReportIssueCubit.submit()` awaits it before sending (R13, R14). `ReportIssueCubit` gets the store through its constructor and DI.
- **Reason:** when a user reports a problem, the big file must hold every print up to that moment, ready to attach to the report once the report API exists.
- **Affected area:** rules R13, R14 · tech §2, §3.7
- **QA impact:** new `test/core/report_issue_submit_test.dart` (2 tests), and a store test for `flush()`.
- **Decisions:** the flush runs after the voice note is stopped and the state is `submitting`, and before `_send`. Nothing moves if `canSubmit` is false.

## CL-2 · 2026-10-29 — v1.0 — How to read the files on a device

- **Change:** documented the file locations per flavor and how to read them with Android Studio Device Explorer and `adb exec-out run-as` (user-scenarios-rules §3).
- **Reason:** the first `adb` pull saved only `No such file or directory`, because the command ran before the first 100 prints. Pulling again worked (1,102 lines). Only debug builds can be read.
- **Affected area:** user-scenarios-rules §3
- **QA impact:** none.
- **Decisions:** none.

## CL-1 · 2026-10-29 — v1.0 — Buffer + unlimited print file

- **Change:** prints are saved to `Buffer.txt` (100 entries). When it's full, it's appended to `PrintLogsFile.txt` (unlimited) and cleared. If the append fails, the oldest 50% of the big file is deleted and the append is tried again. Prints are queued during the move so none are lost (R1, R2, R7–R12, R15, R16).
- **Reason:** the request was to keep the full app print history on the device in two files, with no print lost while moving, following OOP/SOLID. The code had no file logging before this: `app_log_manager.dart` only sent prints to the console and Crashlytics.
- **Affected area:** all files (new feature)
- **QA impact:** new `test/core/print_log_store_test.dart`.
- **Decisions:**
  - `LogFile` interface with `IoLogFile` (device) and `MemoryLogFile` (web/tests), using the same conditional-import pattern as `ApiLogStore`.
  - One `Future` queue instead of locks, for ordering and no loss.
  - The trim is done in place, so it works on a full disk.
  - The saved text is sanitized like Crashlytics.
  - Leftover buffer entries from the last session are moved on the first print.
  - If the retry fails, the buffer is kept rather than dropped.
