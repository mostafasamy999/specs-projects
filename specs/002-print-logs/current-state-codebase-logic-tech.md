# 002 Print Logs — Current state: codebase, logic, tech (LOW-LEVEL)

> **Doc v1.0 · 2026-10-29 · synced to changelog CL-4**
> Code read from `~/StudioProjects/talentlink`, branch `feature/report_issue` @ `195a68df`, plus the uncommitted changes listed in §1 (the whole feature).
> Audience: an AI or dev changing this feature cold. Rules (R1–R16): [user-scenarios-rules.md](user-scenarios-rules.md).

All paths are relative to `lib/src/` unless they start with `test/`.

## 1. File map

| Piece | Path | Status |
|---|---|---|
| Entry point (unchanged API) | `core/utils/logging/app_log_manager.dart`: `printLog()`, `printLogAndSendToCrashlytics()` | unchanged |
| Logger | `core/utils/logging/app_logger.dart`: `AppLogger` | changed |
| File contract | `core/utils/logging/print_logs/log_file.dart`: `LogFile` | new |
| Device files | `core/utils/logging/print_logs/log_file_io.dart`: `IoLogFile`, `createLogFile()` | new |
| Web / tests | `core/utils/logging/print_logs/log_file_stub.dart`: `MemoryLogFile`, `createLogFile()` | new |
| Transaction IDs | `core/utils/logging/print_logs/log_sequence.dart`: `LogSequence` | new |
| Buffer + archive logic | `core/utils/logging/print_logs/print_log_store.dart`: `PrintLogStore` | new |
| Report issue submit | `presentation/blocs/report_issue/report_issue_cubit.dart`: `submit()` | changed |
| DI | `di/bloc_injector.dart`: `ReportIssueCubit(..., PrintLogStore.instance)` | changed |
| Tests: store | `test/core/print_log_store_test.dart` (9 tests) | new |
| Tests: submit | `test/core/report_issue_submit_test.dart` (2 tests) | new |

Before this feature, `app_log_manager.dart` and `AppLogger` didn't save prints anywhere. They went only to the console and Crashlytics. There was no "keep the last 100 prints" logic in the code.

## 2. Flow

```
printLog(msg, tag)                       app_log_manager.dart
 └─ AppLogger.log
     ├─ print(msg)                        console, raw
     ├─ _format → LogSanitizer.redact     "[tag] msg"
     ├─ Crashlytics.log(text)
     └─ PrintLogStore.write("<ISO time> [tag] msg")     not awaited
          └─ _queue (one step at a time)
              ├─ _recover()   once per session: LogSequence.resumeAfter(buffer, or archive tail 64 KB), then _flush()
              ├─ buffer.append("TX-000123 <entry>\n")
              └─ ++count >= 100 → _flush()
                   ├─ pending = buffer.read()
                   ├─ archive.append(pending)
                   │    fails → archive.dropOldestHalf(), archive.append(pending)
                   │    fails again → keep buffer, return
                   └─ buffer.clear()

ReportIssueCubit.submit()                (send button)
 ├─ canSubmit? no → return               (R14)
 ├─ haltVoiceNote(), emit submitting
 ├─ await PrintLogStore.flush()           queued after earlier prints: _recover(), _flush()
 └─ _send(draft) → sent / failure
```

## 3. Classes

### 3.1 `LogFile` (interface)
`append(text)`, `read()` (empty string if missing), `readTail(maxBytes)`, `clear()`, `dropOldestHalf()`. `PrintLogStore` only knows this interface.

### 3.2 `IoLogFile`
- Location: `getApplicationDocumentsDirectory()/print_logs/<name>`. The directory function can be injected (`root:`) for tests.
- The `File` is resolved lazily and cached **only on success**, so a print made before the Flutter binding is ready doesn't disable file logging for the whole session.
- `append`: `writeAsString(mode: append, flush: true)`.
- `read`: bytes → `utf8.decode(allowMalformed: true)`, so a line cut by a crash doesn't block the move.
- `readTail`: `RandomAccessFile`, reads only the last `maxBytes`.
- `dropOldestHalf`: done **in place**. It finds the first line start after the middle, copies the rest to the beginning in 64 KB chunks, then truncates. It needs no temporary copy, so it still works on a full disk. It cuts at lines, not entries, so the first kept entry of a multi-line print may be partial.

### 3.3 `MemoryLogFile`
A `StringBuffer` version of the same contract. Used on web through the conditional import, and in tests.

### 3.4 `LogSequence`
- `next()` → `TX-` + `++last` padded to 6 digits.
- `resumeAfter(text)`: last match of `^TX-(\d+) ` (multi-line), so continuation lines of a multi-line print are skipped.

### 3.5 `PrintLogStore`
- Constructor: `buffer`, `archive`, optional `sequence`, `capacity = 100`. `PrintLogStore.instance` uses `createLogFile('Buffer.txt')` and `createLogFile('PrintLogsFile.txt')`.
- Platform: `import 'log_file_stub.dart' if (dart.library.io) 'log_file_io.dart' as storage;`, the same pattern as `ApiLogStore`.
- `_queue`: a `Future` chain. `write()` and `flush()` add to it and return the step's future. That is how R11 (no loss, no reordering) works without locks.
- `_count` counts entries written this session, not lines, so multi-line prints count once. It is reset at every `_flush()`, even a failed one (R10: the kept buffer goes with the next 100).
- Every step catches all errors (R15). `_recover()` catches ID-resume errors separately, so a read failure only restarts numbering and doesn't block the move.

### 3.6 `AppLogger`
`AppLogger._(this._printLogs)`, `instance = AppLogger._(PrintLogStore.instance)`. `log()` adds `_printLogs.write('${DateTime.now().toIso8601String()} $log')` after `Crashlytics.log`. The write isn't awaited, so `log()` stays synchronous.

### 3.7 `ReportIssueCubit.submit()`
The constructor gets a 4th argument, `PrintLogStore`. After `emit(submitting)`, it runs `await _printLogs.flush(); if (isClosed) return;`, then sends.

## 4. Design (OOP / SOLID)

| Principle | Where |
|---|---|
| Single responsibility | `LogFile` = storage. `LogSequence` = numbering. `PrintLogStore` = buffer/archive policy. `AppLogger` = formatting and fan-out. |
| Open/closed | New storage (encrypted, remote) = a new `LogFile`, with no change to the store. |
| Liskov | `IoLogFile` and `MemoryLogFile` are used the same way, and the tests swap one for the other. |
| Interface segregation | `LogFile` has only the 5 operations the store needs. |
| Dependency inversion | The store gets its files and sequence through the constructor, `AppLogger` gets the store, and `ReportIssueCubit` gets it through DI. |

## 5. Tests

| Test | Rule |
|---|---|
| buffer moves to archive every time it is full | R4, R7 |
| archive failure drops oldest half then appends | R9 |
| buffer is kept when archive keeps failing | R10 |
| prints left from previous session are archived first | R12 |
| flush moves a partial buffer and keeps later prints | R11, R13 |
| ids continue after restart from the buffer (with a multi-line entry) | R5, R6 |
| ids continue after restart from the archive | R5 |
| io file reads only the tail it is asked for | `readTail` |
| io file drops oldest half in place keeping whole lines (10,000 lines, real file) | R9 |
| submit moves the buffer into the print file before sending | R13 |
| submit does not touch the logs when the form is incomplete | R14 |

Run:

```bash
flutter test test/core/print_log_store_test.dart test/core/report_issue_submit_test.dart
```

Last run 2026-10-29: 11/11 passed. `flutter analyze` on the changed files reports only the existing `avoid_print` warning in `app_logger.dart`.

## 6. Known limits

- If writing to `Buffer.txt` itself fails, that one entry is lost (there is no memory fallback).
- `dropOldestHalf` can leave the first kept multi-line entry partly cut (R9 cuts at a line, not an entry).
- If the archive's last 64 KB contains no ID (one huge print), numbering restarts at 1.
- `TX-` at the start of a line inside a multi-line message could be read as an ID on resume. This is unlikely.
