# 002 Music Removal: Background Isolate and Step Progress

**Version:** v1.0  
**Status:** Approved for coding (see [review.md](review.md) for the issues found and how they are handled)  
**App:** `~/StudioProjects/mute-music-app` (Flutter, Android + iOS)  
**Builds on:** [001 Mute Video](../001-mute-video/spec.md) F3 "Remove music only". This spec replaces 001 tasks **T3.1** and **T3.2**.  
**Last updated:** 2026-10-19

### Changelog
- **v1.0 (2026-10-19):** First version.

---

## 1. Purpose

"Remove music only" keeps the speakers' voices and drops the background music. Today it has two problems:

1. **The UI freezes.** Reading and resampling the PCM, every STFT `pack`/`unpack` (pure Dart, several seconds per 12 s chunk) and writing the PCM all run on the **UI isolate**. The progress bar stutters, taps lag, and Android can show "App not responding" on long clips.
2. **The user can't see what is happening.** The screen shows one line, "Removing the music... NN%". The download, extraction and muxing steps don't show up, so the app looks stuck at 0% and at 100%.

This change:
- **C1:** moves all the Dart-side heavy work into a **background isolate** (the same idea as `compute()`, but long-lived so it can report progress).
- **C2:** splits the progress view into **small steps**, so the user sees each stage of the job and how far along the current one is.

## 2. Scope

**In scope**
- The F3 flow only (Remove music only).
- A background isolate for: PCM read and resample, ONNX session creation and every chunk (pack → run → unpack → merge), and the PCM write.
- A step list in place of the single status line while F3 runs.
- New EN and AR strings.
- Tests for the new state, the isolate worker plumbing, the repository and the cubit.

**Out of scope**
- F2 Remove sound (it is native and takes about a second).
- Cancel (001 Q2), max length / streaming memory (001 Q1), model hash (001 Q3).
- Any change to the DSP math (`mdx_stft`, `mdx_tensor`, `chunk_window`).
- Native code changes.

## 3. Requirements

### C1: Off the UI isolate

| # | Requirement |
|---|---|
| C1.1 | No step of F3 that is CPU-heavy in Dart runs on the UI isolate: PCM read and resample, STFT pack/unpack, chunk merge and PCM write all run in a worker isolate. |
| C1.2 | The ONNX session is created, run and closed **inside** the worker isolate. The worker uses `BackgroundIsolateBinaryMessenger.ensureInitialized` with the `RootIsolateToken` captured on the UI isolate. |
| C1.3 | No audio data crosses the isolate boundary. The worker gets file paths and plain numbers, and sends back only small progress messages and the final result. |
| C1.4 | One worker per job. It exits when the job ends (success or failure). |
| C1.5 | If the worker throws, or dies without a result, the repository returns `DataFailed(musicRemovalFailed)`. The caller's future must always complete (001 R2: never stuck busy). |
| C1.6 | `MusicRemovalRepository` keeps returning `DataState<VideoAsset>`, and the temporary PCM files are still deleted on every path (001 R4). |
| C1.7 | The output audio is bit-identical to today's for the same input (same DSP code, same order). |

### C2: Step progress

The job is shown as four steps, in order:

| Step | Key (EN) | Shown progress |
|---|---|---|
| 1. Get the AI model | `stepModel`: "Get the AI model" | Download % (only when it downloads; otherwise it ticks at once) |
| 2. Read the audio | `stepExtract`: "Read the audio" | Indeterminate |
| 3. Separate the voices | `stepSeparate`: "Separate the voices" | "Part 3 of 8" plus a bar at 3/8 |
| 4. Build the video | `stepBuild`: "Build the video" | Indeterminate |

| # | Requirement |
|---|---|
| C2.1 | While F3 runs (`preparingModel` or `removingMusic`), the status area shows the step list instead of the single status line. |
| C2.2 | Each step shows one of three looks: **done** (check icon), **active** (spinner, bold label), **waiting** (empty circle, muted label). |
| C2.3 | Only the active step shows a progress bar and detail text. |
| C2.4 | Step 3's detail is `stepPart`: "Part {current} of {total}", where `current` counts finished chunks + 1 while running, capped at `total`. Its bar shows finished / total. |
| C2.5 | Step 2 covers the native extraction. Step 3 covers everything in the worker (PCM read, chunks, PCM write), because the worker reports only chunk counts. Step 4 covers the native mux. |
| C2.6 | On success, the step list is replaced by `readyToSaveMusic` (as today). On failure, it is replaced by nothing and the snackbar shows the error (as today). |
| C2.7 | All step strings exist in EN and AR, and the list works in RTL. |
| C2.8 | The step list fits on a 360 × 640 dp screen without pushing the buttons off screen (rows ≤ 40 dp each, the preview keeps the rest). |

## 4. Design

### 4.1 Domain

New value type in `domain/entities/removal_progress.dart`:

```dart
enum RemovalStep { model, extract, separate, build }

class RemovalProgress {
  final RemovalStep step;
  final int done;   // finished units in this step (chunks for separate)
  final int total;  // 0 = unknown / indeterminate
  double? get fraction => total == 0 ? null : done / total;
}
```

`MusicRemovalRepository.removeMusic` and `RemoveMusicUseCase` change their callback from `void Function(double)` to `void Function(RemovalProgress)`.

### 4.2 Data

- **`SeparationWorker`** (`data/local/separation_worker.dart`): `Future<void> run(SeparationJob job, {required void Function(int done, int total) onChunk})`.
  - `SeparationJob`: `inputPcmPath`, `sampleRate`, `channels`, `modelPath`, `outputPcmPath`. All sendable.
  - Spawns one isolate with `Isolate.spawn`, passing the job, a `SendPort` and the `RootIsolateToken`. Listens on one `ReceivePort` for progress, done, error and exit messages, so a crash in the worker still completes the future (C1.5).
  - Inside the worker: `PcmIo.read` → `MusicSeparator.separate` → `PcmIo.write`.
  - The body that runs inside the isolate is injectable (a top-level function by default) so tests can drive the plumbing without ONNX.
- **`MusicSeparator.separate`**: `onProgress` becomes `void Function(int done, int total)`. The maths is unchanged.
- **`MusicRemovalRepositoryImpl`**: `extract` (native) → `worker.run` → `mux` (native). It reports steps `extract` → `separate` (per chunk) → `build`. The `try/finally` cleanup stays.

Why not `compute()` / `Isolate.run`: they return one value at the end and can't send progress while running. `Isolate.spawn` with a port is the same idea with a progress channel.

### 4.3 Bloc

`MuteVideoState` gets `RemovalProgress? removal` (null when no F3 job runs). The model-download step sets `removal = RemovalProgress(step: model, done: pct, total: 100)`. `progress` stays for compatibility with the probe screen and is kept in sync.

`showsSteps` = status is `preparingModel` or `removingMusic`.

### 4.4 Presentation

- `RemovalSteps` (new): a `BlocSelector` on `removal` that renders four `RemovalStepTile`s.
- `RemovalStepTile` (new): icon + label + (active only) a `LinearProgressIndicator` and detail text.
- `StatusMessage`: when `showsSteps`, returns `RemovalSteps` instead of the text line.

## 5. Acceptance checks

| # | Check | How |
|---|---|---|
| AC1 | On a real Android device, during "Remove music only" on a 60 s clip, the spinner animates without visible stutter, and the step list advances through all four steps. | Manual, plus `flutter run --profile` timeline: no UI-thread frame > 32 ms during step 3. |
| AC2 | The output plays and the voices are kept, as before. | Manual: compare with a result from the previous build. |
| AC3 | A worker failure (for example a missing model file) shows `errorMusicRemoval`, and the buttons are enabled again. | Unit test (repository + worker plumbing) and manual. |
| AC4 | No `*.pcm` file is left in the temp directory after success or failure. | Existing repository tests stay green. |
| AC5 | The step list shows correctly in Arabic (RTL). | Manual. |
| AC6 | `flutter analyze` is clean and `flutter test` is green. | CI / local. |
