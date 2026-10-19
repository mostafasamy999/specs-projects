# 001 Mute Video: Plan

This plan closes the gaps in [review.md](review.md) so the app meets spec v1.0 §9 (R1–R9). It adds no new features.

## Constraints (apply to every work package)

- Keep the layers as they are: domain, data, bloc and presentation. Don't add Flutter imports to the domain layer.
- **Don't change the DSP math** (`mdx_stft`, `mdx_tensor`, `chunk_window` constants). The reference tests must stay green.
- Never re-encode video.
- Every new user-visible string goes into **both** `intl_en.arb` and `intl_ar.arb`, followed by `flutter pub run intl_utils:generate`.
- Every repository method returns `DataState`. No exception may escape a repository.
- `flutter analyze` must stay clean and `flutter test` must stay green after every task.

## WP1: No stuck busy state (R2, C2)

- `SeparationModelRepositoryImpl.ensureDownloaded`: keep the `DioException` catch, then add `on Object` → `modelDownloadFailed`. Run the cleanup in a `try` so a failed delete can't throw.
- `VideoRepositoryImpl`: add `on Object` to `pickFromGallery` (→ `pickFailed`), `removeSound` (→ `muteFailed`) and `saveToGallery` (→ `saveFailed`).
- `MuteVideoCubit`: as a last line of defence, wrap each public action so that an unexpected throw ends in `_fail(...)` with the action's default failure.
- Tests: use `bloc_test` and `mocktail`. Make each use case throw and check that the state ends in `failure` with `isBusy == false`.

## WP2: Diagnostics out of release builds (R7, M6), 🔒 Q5

- Option A (default if Q5 isn't answered): show the app-bar icon and register the `/memory-probe` route and the `MemoryProbe`/`DeviceMemoryDatasource` DI only when `kDebugMode || kProfileMode` is true.
- Option B: delete `memory_probe.dart`, `memory_probe_screen.dart`, `device_memory_datasource.dart`, the route, the DI entries and the native `memoryReport` handlers.

## WP3: Separation off the UI isolate (R1, C1), plus memory (R3, C3)

**Step 1: isolate.**
- Add `data/local/separation_worker.dart`. It runs `PcmIo.read`, `MusicSeparator` (including ORT session creation) and `PcmIo.write` inside `Isolate.run` or a long-lived `Isolate.spawn` that sends progress over a `SendPort`.
- Pass in only plain data: the PCM path, the model path, the provider name, the sample rate and the channel count. Return the output PCM path.
- Before choosing between `Isolate.run` and `spawn`, check that `flutter_onnxruntime` works inside a background isolate. It uses platform channels, so it needs `BackgroundIsolateBinaryMessenger.ensureInitialized(rootIsolateToken)`. If it doesn't work, keep ORT on the main isolate and move **only** `pack`/`unpack` and the PCM I/O to the worker, exchanging `TransferableTypedData`.
- `MusicRemovalRepositoryImpl` keeps its contract unchanged and calls the worker.

**Step 2: memory** (after the Q1 answer and a `MemoryProbe` run on the lowest device):
- If the target is ≤ the max length from Q1 and the peak memory is acceptable, enforce the max length: read the duration on pick, add a new failure `videoTooLong` plus its ARB key, and block Remove music.
- Otherwise, stream it: read the input PCM chunk by chunk with `RandomAccessFile` (`genSize + 2·trim` samples per chunk, resampled per chunk), and write output chunks straight to the output PCM file. Peak memory then becomes about one chunk instead of the whole track. On the native side, Android `floatFileToPcm16` and iOS `writeWav` must stream as well.

## WP4: Temporary files and native resources (R4, R5, M1, M2)

- `MusicRemovalRepositoryImpl._process`: use a `try/finally` that deletes the extracted PCM and the voice PCM on every path.
- Add `data/local/temp_files.dart` (or a method on `VideoRepository`) that deletes earlier results:
  - when a new source is picked: delete the old `muted` result, and the old source copy only if it lives in the app cache, since `image_picker` copies files there;
  - when a new result replaces an old one: delete the old result;
  - on app start: delete every `muted_*`, `nomusic_*` and `audio_*` file in the cache or temp directory that is older than the launch. No state survives a restart, so nothing can still use them. This replaced the first idea of a 24-hour cutoff, which would have kept dead files for up to a day.
  - Deletion is guarded: only files inside the temp directory are ever deleted, so gallery originals are safe.
- Android `AudioPipeline`: add `try/finally` with release calls in `extractToPcm` and `muxWithNewAudio`, and delete the output file when an exception happens. Use `VideoMuter.removeSound` as the pattern.
- Android `muxAudio`: map `NoVideoTrackException` → `no_video_track`, to match iOS.

## WP5: Native correctness (M3, M4, M5, L1)

- **M3 (Android):** on `INFO_OUTPUT_FORMAT_CHANGED`, read `KEY_SAMPLE_RATE` and `KEY_CHANNEL_COUNT` from `codec.outputFormat`, and return those instead of the input format's values.
- **M4 (iOS):** replace `CMBlockBufferGetDataPointer` with `CMBlockBufferCopyDataBytes` into a `Data` of `CMBlockBufferGetDataLength` bytes.
- **M5 (both):** shift the video timestamps so the first video sample starts at the same time as the audio (subtract the first video timestamp), or offset the audio by it. Interleave on Android: copy the video samples between audio output buffers, choosing whichever stream has the lower timestamp next.
- **L1 (Android):** use the `sampleRate`/`channels` arguments in the `presentationUs` maths.
- Test clips (store them in `test_assets/`, not bundled with the app):
  - an HE-AAC 22 kHz mono clip
  - a clip trimmed on the phone (non-zero start)
  - a portrait clip
  - a clip with no audio
  - a 48 kHz clip

## WP6: Model source (R9, M7), 🔒 Q3

- Add `ModelConstants.vocalsModelSha256`, and check the hash after the size check in `_promote` (a streamed hash, so the whole file is not read into memory).
- If Q3 says to host it ourselves: change the URL, and optionally keep the GitHub URL as a fallback mirror.

## WP7: Download UX, 🔒 Q2 / Q4

- If Q4 says to ask before using mobile data: show a confirm dialog before `ensureDownloaded` when the connection is cellular (needs `connectivity_plus`).
- If Q2 says the user can cancel: add a cancel button during `preparingModel`/`removingMusic`, pass a `CancelToken` to Dio, kill the isolate from WP3, add a `cancelled` status (no snackbar), and delete partial files.

## WP8: Tests (L5)

Tests go in `test/`, using `bloc_test` and `mocktail` (add them as dev dependencies):
- `mute_video_state_test`: `isBusy`, `canSave`, `showsProgress`, `copyWith` clearing the failure, and `withNewSource` dropping the result.
- `mute_video_cubit_test`: pick (cancel, success, fail), remove sound, remove music (download fail, success with progress, fail), save (permission denied, success), and no emits after `close`.
- `chunk_window_test`: `paddedLength`, `chunkCount` and `merge` at the edges (lengths of 0, 1, `genSize` and `genSize+1`).
- `video_repository_impl_test` and `music_removal_repository_impl_test`: each error code maps to the right `AppFailure`, and temporary files are cleaned up on failure.
- `failure_extensions_test`: every `AppFailure` has a non-empty message in EN and AR.

## WP9: Housekeeping (L2, L3, L6), 🔒 Q6 for the name

- Use the same app name in the Android label, the iOS `CFBundleDisplayName`, `appTitle` and the album name.
- Write a real README covering what the app does, how to build it, the model download and the native channel contract (copy it from current-state.md).
- Set the `pubspec` description, pin `intl` to the version `flutter_localizations` needs, and replace the discontinued package.
