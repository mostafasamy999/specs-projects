# 003 Choose a Part: Tasks

From [spec.md](spec.md). Tick a box only when its **Verify** step passes.

## Constraints

- No re-encoding in the cut (spec N1). Don't touch the DSP math (`mdx_stft`, `mdx_tensor`, `chunk_window`).
- Every new string goes into both `intl_en.arb` and `intl_ar.arb`, then `dart run intl_utils:generate`.
- No exception escapes a repository. The screen can never stay busy (001 R2).
- `flutter analyze` clean and `flutter test` green after each task.

## Tasks

- [ ] **T1** Native cut on Android: `VideoCutter.kt`, a shared copy-samples helper used by `VideoMuter` too, and the `cutVideo` method in `MainActivity` (spec §6, N1–N7).
  **Verify:** integration test on a device cuts 1 s–3 s of `test_clip.mp4`: the output has video and audio tracks, the returned real start is ≤ the asked start, its length is within one keyframe interval of the asked length, and `removeSound` still passes its test.
- [ ] **T2** Native cut on iOS: `VideoCutter.swift` and the `cutVideo` method in `AppDelegate`.
  **Verify:** the same check on an iOS simulator or device, including a portrait clip.
- [ ] **T3** Domain + data: `ClipRange`, `VideoAsset.duration` / `range`, `AppFailure.cutFailed` / `tooLongForMusic`, `VideoMuteDatasource.cutVideo`, `VideoRepository.cut`, `CutVideoUseCase`, DI, and `discard` also deleting part files.
  **Verify:** repository tests: success maps the real range; `no_video_track`, `bad_range` and any other error map to failures; nothing throws.
- [ ] **T4** Bloc: `cutting` status (busy), `original` field, `hasPart`, `usePart(range)`, whole-video range is a no-op, new pick clears the part, and the length limit in `removeMusic()`.
  **Verify:** cubit tests for AC7, AC8, AC10, and that `removeMusic` after a part passes the part's path to the use case (AC3).
- [ ] **T5** UI: `ChoosePartButton`, `ChoosePartScreen` (range slider, seek on drag, loop the range, labels, hint), the route, the preview *Part* label, the `cutting` status text, and the snackbar action on `errorTooLongChoosePart`. EN and AR strings.
  **Verify:** widget tests: back returns null (AC9); handles can't go under 1 s; the hint shows only above the limit.
- [ ] **T6** Device check of scenarios A–D on the SM-A515F with a 20-minute clip (AC1–AC6, AC11), and on iOS.
  **Verify:** notes in this file, with the device, clip and timings.

🔒 Before T4/T5 are final: answers to P1 (keyframe cut OK?) and P2 (the length limit, 001 Q1). The code can use the suggested defaults until then.
