# 001 Mute Video: Code Review

**Reviewed:** 2026-10-19, commit `6fd1532` (branch `main`, clean)  
**Checks:** `flutter analyze` found no issues. `flutter test` passed all 15 tests.

## What is good

- The layers are clean: domain, data, bloc and presentation. Use cases are thin, repositories return `DataState`, and the domain layer has no Flutter imports.
- The DSP code is careful and well commented. The STFT and tensor packing are tested against a PyTorch reference, which is the right gate for this kind of code.
- The model download is safe against partial files: it downloads to `.part`, checks the exact size, renames only on success, and cleans up broken files. It is tested.
- `_set` guards against emitting after the cubit is closed, so long jobs can outlive the screen.
- Widgets use `BlocSelector` per child, and `VideoPreview` uses a `ValueNotifier` instead of `setState`.
- Remove sound copies the video track without re-encoding on both platforms, and keeps rotation.
- The EN and AR ARB files have the same keys.

## Findings

Severity: **C** = critical (breaks a requirement), **M** = medium, **L** = low.  
Confidence: **Confirmed** = seen in the code. **Plausible** = depends on the device or input and needs a run to prove.

| ID | Sev | Where | Finding | Confidence |
|---|---|---|---|---|
| C1 | C | `data/local/music_separator.dart`, `core/audio/mdx_tensor.dart` | `MdxTensor.pack` and `unpack` (about 1,000 FFTs of 6144 points, plus loops over 4 M floats per chunk), `PcmIo.read` and resampling all run **synchronously on the UI isolate**. Only the ORT call is async. The UI freezes for each chunk: the progress bar stutters, and back navigation and the video preview hang. | Confirmed |
| C2 | C | `separation_model_repository_impl.dart`, `video_repository_impl.dart` | Only `DioException` (download), `PlatformException` (pick, mute) and `GalException` (save) are caught. A `FileSystemException` from `rename` or `delete`, a `MissingPlatformDirectoryException`, or a `MissingPluginException` escapes, so the cubit's `await` throws and the status **stays busy forever**, with every button disabled. | Confirmed |
| C3 | C | `pcm_io.dart`, `music_separator.dart`, Android `floatFileToPcm16`, iOS `writeWav` | The whole track is loaded into memory as `Float64`, in several copies: raw bytes, L/R, resampled L/R, padded L/R and output L/R. A 3-minute clip comes to roughly 400–500 MB at peak on Android (estimate). There is no maximum duration (Q1). This risks an OOM kill on mid-range phones. | Plausible (needs a device run; `MemoryProbe` exists for this) |
| M1 | M | `music_removal_repository_impl.dart`, native outputs | Temporary PCM files are deleted only on success. If separation or muxing throws, `audio_*.pcm` (tens of MB) is left behind. The `muted_*.mp4` and `nomusic_*.mp4` results in the cache or temp directory are **never** deleted, not even when a new video is picked. | Confirmed |
| M2 | M | Android `AudioPipeline.extractToPcm`, `muxWithNewAudio` | There is no `try/finally`. On an exception, `MediaCodec`, `MediaExtractor` and `MediaMuxer` are never released (codec instances are a scarce system resource), and a half-written `nomusic_*.mp4` is left behind. `VideoMuter` does this correctly and can be copied. | Confirmed |
| M3 | M | Android `AudioPipeline.extractToPcm` | The sample rate and channel count are read from the **input** track format, not from the decoder's output format (`INFO_OUTPUT_FORMAT_CHANGED`). For HE-AAC or HE-AACv2 (SBR/PS), the decoder can output twice the rate or stereo from mono, so the audio would be processed at the wrong speed or pitch. | Plausible (needs an HE-AAC clip) |
| M4 | M | iOS `AudioPipeline.pcmData` | `CMBlockBufferGetDataPointer` gives a pointer to the contiguous part only, but the code copies `totalLength` bytes. If the block buffer is not contiguous, this is an out-of-bounds read. `CMBlockBufferCopyDataBytes` is the safe API. | Plausible (LPCM reader output is usually contiguous) |
| M5 | M | Android `encodeAndMux`, iOS `writeMovie` | Audio timestamps start at 0, but video timestamps are copied as they are. A source whose first video timestamp is not 0 (edit lists, or clips trimmed on the phone) can end up with audio out of sync. On Android, all the video is also written in one go before any audio, so the file is not interleaved and plays poorly when streamed. | Plausible |
| M6 | M | `mute_video_content.dart`, `routes_manager.dart`, `injector.dart` | The **TEMPORARY** memory-probe icon is in the app bar for every build, including release, so users can open a diagnostics screen in English only. | Confirmed |
| M7 | M | `model_constants.dart` | The model is fetched at runtime from a third-party GitHub release, checked by size only. There is no SHA-256 check, no mirror you control, and the license is unconfirmed (Q3). If the release moves, music removal breaks for every new install. | Confirmed |
| L1 | L | Android `encodeAndMux` | `presentationUs` hardcodes 44100 and 2 channels and ignores the `sampleRate` and `channels` parameters it is given. This is harmless today because Dart always sends 44100/2, but it is misleading. | Confirmed |
| L2 | L | App names | The Android label is `mute_music_app`, the iOS display name is `Mute Music App`, and the in-app title is `Mute Video` (Q6). | Confirmed |
| L3 | L | `README.md`, `pubspec.yaml` | The README and the `description` are still the Flutter template text. | Confirmed |
| L4 | L | Download | The download has no cancel option, and it uses mobile data (about 30 MB) without asking (Q4). | Confirmed |
| L5 | L | Tests | There are no tests for `MuteVideoCubit`, `MuteVideoState` (busy and save rules), `ChunkWindow`, `VideoRepositoryImpl`, `MusicRemovalRepositoryImpl` or the failure-message mapping. | Confirmed |
| L6 | L | `pubspec.yaml` | `intl: any` is unpinned, and one dependency is reported as discontinued by `pub get`. | Confirmed |

## Recommended order

1. **C2** (cheap, and it stops users getting stuck), then **M6** (before any release).
2. **C1**: move the separation pipeline into a background isolate.
3. **M1** and **M2**: cleanup and resource safety.
4. Measure **C3** on a low-end device with `MemoryProbe`. Then either stream chunks to and from disk, or enforce the maximum length from Q1.
5. **M3**, **M4** and **M5**: check with test clips (HE-AAC, a non-zero start timestamp), then fix.
6. **M7** after Q3 is answered.
7. Tests (L5) alongside each fix.
