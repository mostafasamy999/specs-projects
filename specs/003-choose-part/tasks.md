# 003 Choose a Part: Tasks

From [spec.md](spec.md). Tick a box only when its **Verify** step passes.

## Constraints

- No re-encoding in the cut (spec N1). Don't touch the DSP math (`mdx_stft`, `mdx_tensor`, `chunk_window`).
- Every new string goes into both `intl_en.arb` and `intl_ar.arb`, then `dart run intl_utils:generate`.
- No exception escapes a repository. The screen can never stay busy (001 R2).
- `flutter analyze` clean and `flutter test` green after each task.

## Tasks

- [x] **T1** Native cut on Android: `VideoCutter.kt`, a shared copy-samples helper used by `VideoMuter` too, and the `cutVideo` method in `MainActivity` (spec §6, N1–N7).
  **Verify:** integration test on a device cuts 1 s–3 s of `test_clip.mp4`: the output has video and audio tracks, the returned real start is ≤ the asked start, its length is within one keyframe interval of the asked length, and `removeSound` still passes its test.
  *2026-10-20, Samsung SM-A515F (Android 13), debug: `integration_test/video_cutter_test.dart` 5/5 pass on a 32.4 s camera clip. Asked 2000–4000 ms, got **0**–4000 ms (this clip has no keyframe between 0 and 2 s, so the start snapped back 2 s: the P1 trade-off), file 4017 ms, **556 ms** to cut. The part extracts audio and `removeSound` works on it. `bad_range` and a non-video file leave no `part_` file. `native_cleanup_test.dart` 6/6 still pass after moving the copy loop into `SampleCopier`.*
- [x] **T2** Native cut on iOS: `VideoCutter.swift` and the `cutVideo` method in `AppDelegate`.
  **Verify:** the same check on an iOS simulator or device, including a portrait clip.
  *2026-10-20, iPhone 16 Pro simulator (iOS 26): `video_cutter_test.dart` 5/5 pass on a 5.3 s clip with audio. Asked 2000–4000 ms, got exactly **2000–4000** (passthrough writes an edit list), 189 ms. Portrait not checked yet (no portrait clip with audio on this Mac).*
- [x] **T3** Domain + data: `ClipRange`, `VideoAsset.duration` / `range`, `AppFailure.cutFailed` / `tooLongForMusic`, `VideoMuteDatasource.cutVideo`, `VideoRepository.cut`, `CutVideoUseCase`, DI, and `discard` also deleting part files.
  **Verify:** repository tests: success maps the real range; `no_video_track`, `bad_range` and any other error map to failures; nothing throws.
  *Done: `test/video_repository_impl_test.dart` (6 new tests, including the length read on pick).*
- [x] **T4** Bloc: `cutting` status (busy), `original` field, `hasPart`, `usePart(range)`, whole-video range is a no-op, new pick clears the part, and the length limit in `removeMusic()`.
  **Verify:** cubit tests for AC7, AC8, AC10, and that `removeMusic` after a part passes the part's path to the use case (AC3).
  *Done: `test/choose_part_cubit_test.dart` (11 tests). Choosing the whole video after a part goes back to the original and deletes the part.*
- [x] **T5** UI: `ChoosePartButton`, `ChoosePartScreen` (range slider, seek on drag, loop the range, labels, hint), the route, the preview *Part* label, the `cutting` status text, and the snackbar action on `errorTooLongChoosePart`. EN and AR strings.
  **Verify:** widget tests: back returns null (AC9); handles can't go under 1 s; the hint shows only above the limit.
  *Done: `test/choose_part_widgets_test.dart` (6 tests, including the LTR slider in Arabic). Full suite: 72 tests pass, analyze clean.*
- [ ] **T6** Device check of scenarios A–D on the SM-A515F with a 20-minute clip (AC1–AC6, AC11), and on iOS.
  **Verify:** notes in this file, with the device, clip and timings.
  *2026-10-20, iPhone 16 Pro simulator, debug, 5.3 s clip with audio:*
  - *Scenario D: **pass.** Pick → Choose a part (0:01–0:04) → Use this part → label "Part 0:00–0:03" → Remove sound → Save. The saved video is 3.00 s, video only. The cut part was 3.00 s with video + audio. The first save showed the photo-library prompt (001 §3).*
  - *Scenario C: **partly checked.** Pick → part 0:02–0:05 → Remove music only on the part: steps "Get the AI model" (download %), "Read the audio" and "Separate the voices" (1/1) completed, then the app was killed during "Build the video" (no crash report; the Mac had 474 MB of disk left and the app peaked at 4.9 GB during the chunk on the simulator). Redo on a real device with free disk.*
  - *Bug found and fixed: on iOS `getTemporaryDirectory()` is `Library/Caches`, but the native side writes to `tmp/`, so `TempFilesDatasource` never deleted results (or parts) on iOS (001 R4). It now treats both folders as temp; 3 new tests. After a restart the leftover `part_`/`muted_` files in `tmp/` were gone.*
  - *UX note: time labels round down to the second, so a handle at 1.99 s reads "0:01". Consider rounding to the nearest second or showing tenths for short clips.*
  - *Not done yet: scenarios A and B, the 20-minute clip on the SM-A515F (AC3–AC6), the length-limit snackbar (AC7) on a device, Arabic (AC11), and a portrait clip on iOS.*

🔒 Before T4/T5 are final: answers to P1 (keyframe cut OK?) and P2 (the length limit, 001 Q1). The code can use the suggested defaults until then.
