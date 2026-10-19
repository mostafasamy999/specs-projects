# 001 Mute Video: Tasks

Derived from [plan.md](plan.md). Work from top to bottom, with one commit per task (or per small group). Tick a box only when its **Verify** step passes.

Legend: 🔒 blocked on an open question.

## WP0: Setup

- [x] **T0.1** Add `bloc_test` and `mocktail` as dev dependencies.
  **Verify:** `flutter pub get` succeeds, and `flutter test` passes 15 out of 15 tests.

## WP1: No stuck busy state

- [x] **T1.1** `SeparationModelRepositoryImpl`: add `on Object` → `modelDownloadFailed`, and make the cleanup unable to throw.
  **Verify:** a new test with a fake `ModelStorage` whose `rename` throws returns `DataFailed(modelDownloadFailed)`.
- [x] **T1.2** `VideoRepositoryImpl`: add `on Object` fallbacks for pick, mute and save.
  **Verify:** a test where the picker or datasource throws `MissingPluginException` returns the matching failure.
- [x] **T1.3** `MuteVideoCubit`: add a catch-all around each action, ending in `_fail`.
  **Verify:** a cubit test where each use case throws `StateError` ends with `status == failure` and `isBusy == false`.

## WP2: Diagnostics out of release builds 🔒 Q5 (default: Option A)

- [x] **T2.1** Show the memory-probe icon, route and DI only when `kDebugMode || kProfileMode` is true (or delete them if Q5 = B).
  **Verify:** in a `flutter run --release` build there is no memory icon in the app bar, and `/memory-probe` falls back to the main screen.
  *Done 2026-10-19 (`AppFlags.diagnostics`). Checked on the Medium Phone API 36 emulator: the release APK shows no icon, and the debug APK does. The route fallback is guarded in code (`when AppFlags.diagnostics`) and can't be reached from the release UI.*

## WP3: Separation off the UI isolate, plus memory

> T3.1 and T3.2 moved to [002-music-removal-isolate](../002-music-removal-isolate/tasks.md).

- [ ] **T3.1** Spike: check whether `flutter_onnxruntime` can create a session and run inside a background isolate (with `BackgroundIsolateBinaryMessenger`). Record the result in `current-state.md`.
  **Verify:** a written yes or no, with the device and OS used.
- [ ] **T3.2** Add `SeparationWorker` (full isolate, or pack/unpack-only per T3.1), and make `MusicRemovalRepositoryImpl` call it.
  **Verify:** during music removal on a real device, the progress bar animates smoothly and back navigation responds in under 100 ms. The output still matches AC3.
- [ ] **T3.3** Run `MemoryProbe` on the lowest supported device (Q1) with a clip at the max length. Record the peak in `current-state.md`.
- [ ] **T3.4** 🔒 Q1: either enforce the max length (add a `videoTooLong` failure, its EN/AR strings and a check on pick) or stream the chunks (plan WP3 step 2).
  **Verify:** a clip at the max length finishes on the lowest device. A longer clip shows the localized limit message (enforce), or also finishes (stream).

## WP4: Temporary files and native resources

- [x] **T4.1** `MusicRemovalRepositoryImpl`: use `try/finally` cleanup of both PCM files.
  **Verify:** a test where the separator throws leaves no `*.pcm` files in the temp directory.
- [x] **T4.2** Delete the previous source and result when they're replaced (new pick, new result), and on start delete every `muted_`/`nomusic_`/`audio_` file from earlier launches.
  **Verify:** after pick → remove sound → pick, the cache holds only the current files (check with `adb shell run-as … ls cache`, or Xcode's container view).
  *Done 2026-10-19. Unit tests: `temp_files_datasource_test`, `mute_video_cubit_test`. Device: `integration_test/native_cleanup_test.dart` (group T4.2) on the API 36 emulator, with the real native mute. It uses a queued picker instead of the system picker UI, so the image_picker copy step itself wasn't exercised.*
- [x] **T4.3** Android `AudioPipeline`: add `try/finally` release in extract and mux, delete partial output on error, and map `NoVideoTrackException` to `no_video_track`.
  **Verify:** muxing with a missing PCM path returns `mux_failed`, leaves no `nomusic_*.mp4`, and a second run straight after works (the codec is not leaked).
  *Done 2026-10-19. Device: `integration_test/native_cleanup_test.dart` (group T4.3) on the API 36 emulator. Against the old code, the "leaves no file" test fails (an orphan `nomusic_*.mp4`), and with the fix it passes. **Limit:** the 30-failures-then-real-run test passes on the old code too, so on this emulator it does not detect a codec leak. The release fix is checked by code review only.*

## WP5: Native correctness

- [ ] **T5.1** Prepare the test clips in `test_assets/`: an HE-AAC 22 kHz mono clip, a phone-trimmed clip, a portrait clip, a clip with no audio, and a 48 kHz clip.
- [ ] **T5.2** Android: take the sample rate and channel count from the decoder's output format (M3).
  **Verify:** with the HE-AAC clip, the result's duration is within ±50 ms of the source, and its pitch sounds normal.
- [ ] **T5.3** iOS: use `CMBlockBufferCopyDataBytes` (M4).
  **Verify:** all 5 test clips process with no crash, including with Address Sanitizer turned on.
- [ ] **T5.4** Both platforms: align the audio and video start, and interleave on Android (M5). Use the `sampleRate`/`channels` arguments (L1).
  **Verify:** with the phone-trimmed clip, lips and voice stay in sync. `ffprobe` shows both streams starting within 1 frame of each other.

## WP6: Model source 🔒 Q3

- [ ] **T6.1** 🔒 Add the SHA-256 constant and a streamed hash check in `_promote`.
  **Verify:** a test with the right size but wrong bytes returns `modelDownloadFailed`, and the file is deleted.
- [ ] **T6.2** 🔒 Switch to the self-hosted URL, if Q3 says to.

## WP7: Download UX 🔒 Q2 / Q4

- [ ] **T7.1** 🔒 Q4: ask for confirmation before downloading on mobile data.
- [ ] **T7.2** 🔒 Q2: add a cancel button for the download and the separation, plus a `cancelled` status.
  **Verify:** cancelling halfway leaves no `.part` file and no `*.pcm` file, and the buttons are enabled again.

## WP8: Tests

- [ ] **T8.1** `mute_video_state_test`
- [ ] **T8.2** `mute_video_cubit_test` (all the flows listed in plan WP8)
- [ ] **T8.3** `chunk_window_test`
- [ ] **T8.4** `video_repository_impl_test` and `music_removal_repository_impl_test`
- [ ] **T8.5** `failure_extensions_test` (EN and AR)
  **Verify (WP8):** `flutter test` passes, with ≥ 80% line coverage on `lib/src/bloc` and `lib/src/data/repositories` (`flutter test --coverage`).

## WP9: Housekeeping

- [ ] **T9.1** 🔒 Q6: use one app name everywhere.
- [ ] **T9.2** Write a real README, and set the `pubspec` description.
- [ ] **T9.3** Pin `intl` and replace the discontinued dependency.
  **Verify:** `flutter pub get` reports no discontinued package.

## Close-out

- [ ] **T10.1** Re-run the manual acceptance checks AC1–AC9 from `spec.md` on one Android and one iOS device.
- [ ] **T10.2** Refresh `current-state.md` (new snapshot date and commit), and mark the review findings closed in `review.md`.
- [ ] **T10.3** Bump `spec.md` to v1.1, and mark R1–R9 as met.
