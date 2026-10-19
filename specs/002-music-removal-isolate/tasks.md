# 002 Music Removal: Tasks

From [spec.md](spec.md) and [review.md](review.md). Tick a box only when its **Verify** step passes.

## Constraints

- Don't change the DSP math (`mdx_stft`, `mdx_tensor`, `chunk_window`). The reference tests must stay green.
- Every new string goes into both `intl_en.arb` and `intl_ar.arb`, then `dart run intl_utils:generate`.
- No exception escapes a repository. The screen can never stay busy (001 R2).
- `flutter analyze` clean and `flutter test` green after each task.

## Tasks

- [x] **T1** Spike (I1): run ONNX session create + one `run` inside an `Isolate.spawn` worker with `BackgroundIsolateBinaryMessenger`.
  **Verify:** a written yes/no in this file, with the device and OS.
  *2026-10-19, emulator (Medium Phone API 36, 2.5 GB RAM): **inconclusive.** `integration_test/separation_worker_test.dart` was killed by the low-memory killer (signal 9) during the first chunk. The same job on the **main isolate** (old path) is killed the same way, so this emulator can't run the model at all; it is not caused by the isolate. Needs the SM-A515F (Android 13, 6 GB).*
  *2026-10-19, Samsung SM-A515F (Android 13, 6 GB), debug build: **yes.** The real model ran inside the worker isolate on a 15 s stereo clip: progress `(0,2) (1,2) (2,2)`, output PCM the right size, about 115 s total (debug/JIT, so release will be much faster). A 16 ms timer on the UI isolate never waited more than **81 ms**, where the old path blocks it for whole chunks. Not checked on iOS.*
- [x] **T2** Add `RemovalProgress` / `RemovalStep` (domain), and change `MusicSeparator.onProgress` to `(done, total)`.
  **Verify:** analyze clean, DSP reference tests green.
- [x] **T3** Add `SeparationWorker` (spawn, progress port, `onError`/`onExit` handling), and make `MusicRemovalRepositoryImpl` use it and report the steps. Update the use case, the repository contract and DI.
  **Verify:** tests: worker success with progress, worker throws → error, worker exits without result → error; repository: step order `extract → separate… → build`, PCM cleanup on every path.
- [x] **T4** State + cubit: `removal` field, `showsSteps`, model step from the download progress.
  **Verify:** cubit test: a success run emits model → extract → separate (n/N) → build → muted.
- [x] **T5** UI: `RemovalSteps` + `RemovalStepTile`, EN/AR strings, `StatusMessage` switches to the steps.
  **Verify:** widget test: the active step shows "Part 2 of 4" and a bar; done steps show a check.
- [ ] **T6** Device check on the Android phone (AC1, AC2, AC5).
  **Verify:** notes in this file.
