# 001 Mute Video: Current State

**Snapshot:** 2026-10-19, `~/StudioProjects/mute-music-app` at commit `6fd1532` (`main`)  
**Toolchain:** Flutter ≥ 3.38, Dart ≥ 3.10. iOS 16.0+. Android min/target SDK come from Flutter defaults.  
**Health:** `flutter analyze` is clean, and all 15 tests in `flutter test` pass.

> The folder `~/StudioProjects/mute_music_app` (with underscores) is an older, empty scaffold that is not a git repo. Ignore it, or delete it once you've confirmed it isn't needed.

## Stack

| Concern | Choice |
|---|---|
| State | `flutter_bloc` (one `Cubit`) |
| DI | `get_it` (`core/di/injector.dart`) |
| Pick / save | `image_picker` / `gal` (album "Mute Video") |
| Preview | `video_player` |
| Download | `dio` (a named instance, `FileDownload`) |
| AI | `flutter_onnxruntime` and `fftea` (FFT) |
| i18n | `intl_utils` (`S` class), with `lib/l10n/intl_{en,ar}.arb` |
| Native | MethodChannel `com.mostafasamy.mutemusic/video` |

## Files

```
lib/
  main.dart                                   MaterialApp, theme, l10n, routes
  src/config/routes/routes_manager.dart       '/' → MuteVideoScreen, '/memory-probe' (TEMP)
  src/config/theme/{app_theme,color_schemes}.dart  indigo seed, AppSpacing
  src/core/
    di/{injector,network_module}.dart
    constants/model_constants.dart            model URL, size, input shape
    resources/{app_failure,data_state}.dart   9 failures, DataSuccess/DataFailed
    extensions/{failure_extensions,string_extensions}.dart
    audio/{mdx_stft,mdx_tensor,chunk_window,pcm_io}.dart   DSP
    diagnostics/memory_probe.dart             TEMP
  src/domain/
    entities/video_asset.dart
    repositories/{video,music_removal,separation_model}_repository.dart
    use_cases/{pick_video,mute_video,save_video,ensure_model_ready,remove_music}_use_case.dart
  src/data/
    local/{video_mute,audio_pipeline,device_memory}_datasource.dart, model_storage.dart, music_separator.dart
    remote/model_download_service.dart
    repositories/{video,music_removal,separation_model}_repository_impl.dart
  src/bloc/mute_video/{mute_video_cubit,mute_video_state}.dart
  src/presentation/
    screens/{mute_video_screen,memory_probe_screen}.dart
    widgets/mute_video/  content, preview panel, preview, empty hint, status, 4 buttons
android/app/src/main/kotlin/.../{MainActivity,VideoMuter,AudioPipeline}.kt
ios/Runner/{AppDelegate,VideoMuter,AudioPipeline}.swift
test/{mdx_stft,mdx_tensor,pcm_io,separation_model_repository,widget}_test.dart
```

## Native channel contract

| Method | Args | Returns | Error codes |
|---|---|---|---|
| `removeSound` | `sourcePath` | the output MP4 path | `bad_argument`, `no_video_track`, `mute_failed` |
| `extractAudio` | `sourcePath` | `{path, sampleRate, channels}`: float32 interleaved PCM | `bad_argument`, `no_audio_track`, `extract_failed` |
| `muxAudio` | `videoPath`, `pcmPath`, `sampleRate`=44100, `channels`=2 | the output MP4 path | `bad_argument`, `no_video_track`*, `no_audio_track`*, `mux_failed` |
| `memoryReport` (TEMP) | none | `{footprintMb, nativeHeapMb, deviceTotalMb, deviceAvailableMb, heapLimitMb, lowMemory}` | none |

\* iOS only. On Android, every mux error comes back as `mux_failed`.

Platform differences:
- **Extract:** Android decodes with `MediaCodec` at the source rate and channel count (16-bit or float, converted to float32). iOS has `AVAssetReader` output 44.1 kHz stereo float32 directly.
- **Mux:** Android converts float32 to int16, encodes AAC with `MediaCodec` and writes with `MediaMuxer`. iOS writes a temporary WAV, then uses `AVAssetWriter` (copying the video, encoding AAC).
- **Remove sound:** Android uses `MediaExtractor` and `MediaMuxer` to copy samples. iOS uses `AVMutableComposition` and a passthrough export.
- Outputs go to the cache directory on Android and the temp directory on iOS. They are never deleted.

## Decisions already made (keep them)

- No re-encoding of video, ever.
- The model is downloaded rather than bundled (size), into the app support directory, using the `.part`-then-rename approach.
- Linear resampling, to save memory. It was chosen on purpose over FFT resampling.
- The STFT and tensor layout match the PyTorch reference, and the tests guard this.
- One `AppFailure` enum, with every value mapped to a localized string.

## Known gaps

See [review.md](review.md). The main ones are C1 (UI isolate), C2 (stuck busy), C3 (memory), M1 (temporary files), M2 (Android leaks) and M6 (the diagnostics screen in release builds).
