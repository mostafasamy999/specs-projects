# 003 Choose a Part: Process Only a Sub-Clip

**Version:** v1.0  
**Status:** Draft. Waiting on answers to P1–P4 (§8).  
**App:** `~/StudioProjects/mute-music-app` (Flutter, Android + iOS)  
**Builds on:** [001 Mute Video](../001-mute-video/spec.md) F1–F4 and [002 Music Removal Isolate](../002-music-removal-isolate/spec.md). This spec removes "Trimming / picking which part of the video to process" from 001 §2 *Out of scope*.  
**Last updated:** 2026-10-20

### Changelog
- **v1.0 (2026-10-20):** First version.

---

## 1. Purpose

**The problem:** big videos. "Remove music only" keeps the whole audio track in memory (001 R3, review C3) and runs at about N× real time (001 Q2). On a long clip it is very slow, or the system kills it for using too much memory. Most users only want one part of a long video anyway.

**The fix:** let the user choose a time range. The app cuts that range into a new, short video, and from then on **only the short video is used**. Remove sound, Remove music and Save all run on the short video, and the big original is never processed.

## 2. Scenarios

| # | Steps | Result in the gallery |
|---|---|---|
| **A** | Pick video → **Remove music only** → Save | The full video, voices kept, music removed |
| **B** | Pick video → **Remove sound** → Save | The full video, silent |
| **C** | Pick video → **Choose a part** → Remove music only → Save | Only the chosen part, voices kept, music removed |
| **D** | Pick video → **Choose a part** → Remove sound → Save | Only the chosen part, silent |

A and B already work (001 F2, F3, F4). This spec adds the **Choose a part** step (F6) that C and D need. In C and D, steps 3 and 4 are exactly 001 F2/F3 and F4, run on the part instead of the original.

## 3. Scope

**In scope**
- A **Choose a part** button on the main screen, enabled when a video is picked.
- A **Choose a part** screen: a preview player, a two-handle range slider, start/end/length labels, and a **Use this part** button.
- A native **cut** (Android and iOS) that copies the chosen range of the video and audio tracks into a new MP4 **without re-encoding**.
- A length limit for Remove music on long videos. Above the limit, the app asks the user to choose a part first (§5 F3 change).
- State, cubit, use case, repository and datasource changes, EN and AR strings, and tests.

**Out of scope**
- Several parts, or joining parts.
- Frame-exact cuts that need re-encoding (see P1).
- A thumbnail strip on the slider (see P3).
- Cropping, rotating, speed, filters or any other editing.

## 4. Screen: Choose a Part (`/choose-part`)

Opened from the main screen with the current source. It returns either a `ClipRange` or nothing (when the user goes back).

Layout, from top to bottom:
1. **App bar**: the title `choosePartTitle` ("Choose a part") and a back button.
2. **Preview**: the source video. Tapping it toggles play and pause. While playing, it plays **only the chosen range** and loops back to the start handle.
3. **Range slider**: Material `RangeSlider` from 0 to the video length.
   - While the user drags a handle, the preview pauses and seeks to that handle, so they see the frame they're cutting at.
   - The minimum part length is **1 s**. The handles can't get closer than that.
4. **Labels**: `partStart` "Start 0:30", `partEnd` "End 1:45" and `partLength` "Length 1:15". Format is `m:ss`, or `h:mm:ss` from one hour up.
5. **Hint** (only when the part is longer than the Remove music limit, §5): `partTooLongForMusic` "Remove music works on parts up to 5:00. Remove sound works on any length."
6. **Use this part** (filled, full width, 52 dp). Disabled while the video is loading.

On open, the range is the whole video, or the last range used on this source if the user chose a part before (see F6 step 7).

RTL: the slider and the time labels stay left-to-right (time runs left to right in both languages). Only the label words are Arabic.

## 5. Flows

### F6 Choose a part (new)
1. The user taps **Choose a part**. The app opens §4 with the current **original** (not an earlier part).
2. The user moves the handles and taps **Use this part**. If they go back instead, nothing changes.
3. If the range is the whole video (within 0.5 s at each end), nothing is cut. If a part was chosen before, the original becomes the source again and the old part is deleted.
4. Otherwise the status becomes `cutting` and the native cut runs (§6). The status text is `cutting` "Cutting the part…".
5. On success:
   - The part becomes the new **source**, and the preview labels it `partLabel` "Part 0:30–1:45".
   - Any earlier result is dropped (same rule as F1 step 3), and any earlier part file is deleted.
   - The original is kept **only as a path** so the user can choose a different part without picking again. It is never extracted, muxed or saved. *(This is what "ignore the old big video" means here.)*
   - The status returns to `initial`, so Remove music, Remove sound and Choose a part are enabled again.
6. Errors: no video track → `errorNoVideoTrack`. Range outside the video → `errorCutFailed`. Anything else → `errorCutFailed`. On failure the source stays what it was before step 4.
7. Choosing a part again starts from the original with the last range already set, and the new part replaces the old one.

### F1 Pick a video (change)
- A new pick drops the original, the part and any result, and deletes the part file and the result file (001 R4).

### F2 Remove sound (no change)
- Runs on `source`, which is the part in scenario D. There is no length limit, because it is a fast remux.

### F3 Remove music only (change)
- Runs on `source`, which is the part in scenario C.
- **Length limit.** If the source is longer than `maxMusicDuration` (P2, default **5 min**), the job doesn't start. The app shows `errorTooLongChoosePart` "This video is too long for Remove music. Choose a part up to 5:00 first." with a **Choose a part** snackbar action that opens F6.
- This is the protection for scenario A on big videos. Until it lands, scenario A on a long video can still fail with an out-of-memory kill (001 R3).

### F4 Save (no change)
- Saves the result, which in C and D is the processed part. The original is never saved.

## 6. Native cut

New method `cutVideo` on the existing channel `com.mostafasamy.mutemusic/video`.

| Argument | Type | Meaning |
|---|---|---|
| `sourcePath` | String | The original video |
| `startMs` | int | Chosen start, in milliseconds |
| `endMs` | int | Chosen end, in milliseconds |

Returns `{ path, startMs, endMs }`: the new file and the range it **really** covers (see the keyframe rule).

| # | Requirement |
|---|---|
| N1 | **No re-encoding.** Video and audio samples are copied as they are, so quality is unchanged and a cut takes about a second, whatever the length of the original. |
| N2 | **Keyframe rule.** A copied video must start on a keyframe. The cut starts at the **last keyframe at or before** `startMs`, so the part can start up to one keyframe interval early (usually ≤ 1–2 s on phone videos). The real start is returned and shown in `partLabel`. The end is cut at `endMs`. |
| N3 | All tracks are kept (video plus audio), and timestamps are shifted so the part starts at 0. The audio is cut at the same real start as the video, so it stays in sync (001 R6). |
| N4 | The part keeps the source's orientation (Android rotation hint, iOS `preferredTransform`), as in 001 F2. |
| N5 | Extractors and muxers are released on every path (001 R5). A partial output file is deleted on failure. |
| N6 | Errors: no video track → `no_video_track`. `startMs >= endMs` or a range outside the video → `bad_range`. Anything else → `cut_failed`. |
| N7 | It runs off the main thread (Android: the existing background executor; iOS: export callback), like `removeSound`. |

**Android:** `VideoCutter.kt`. `MediaExtractor` + `MediaMuxer`, one muxer track per source track. For each track: `seekTo(start, SEEK_TO_PREVIOUS_SYNC)` on the video track, take its `sampleTime` as the real start, seek audio to the real start, then copy samples until `sampleTime > endUs`, writing `presentationTimeUs - realStartUs`. This is the same copy loop as `VideoMuter.copySamples`, so move that loop into a shared helper.

**iOS:** `VideoCutter.swift`. `AVAssetExportSession` with `AVAssetExportPresetPassthrough` and `timeRange = [start, end]`. Passthrough also starts on a keyframe; read the real start from the exported asset.

## 7. Design

### 7.1 Domain
- `ClipRange` (new, `domain/entities/clip_range.dart`): `Duration start`, `Duration end`, `Duration get length`. Validates `start < end`.
- `VideoAsset` gets `Duration? duration`, read when it is loaded, and `ClipRange? range`, set only on a part (its real range in the original).
- `VideoRepository.cut(VideoAsset original, ClipRange range) → Future<DataState<VideoAsset>>`.
- `CutVideoUseCase` (new).
- `AppFailure`: add `cutFailed` and `tooLongForMusic`.
- `ModelConstants` (or a new `ClipLimits`): `maxMusicDuration = Duration(minutes: 5)` (P2), `minPartLength = Duration(seconds: 1)`.

### 7.2 Data
- `VideoMuteDatasource.cutVideo(path, startMs, endMs)`. It maps `PlatformException` codes to failures in the repository. No exception escapes the repository.
- `VideoRepositoryImpl.discard` also deletes part files (they are app-made, like results).

### 7.3 Bloc
- `MuteVideoStatus` gets `cutting`, which counts as busy.
- `MuteVideoState` gets `VideoAsset? original`. `source` is the part when one is chosen and the original otherwise. `hasPart => original != null && source != original`.
- `MuteVideoCubit.usePart(ClipRange range)`: runs F6 steps 3–6.
- `removeMusic()` checks the length limit first (F3 change) and emits `failure(tooLongForMusic)` without starting the job.

### 7.4 Presentation
- `ChoosePartButton` (new, outlined): between Pick and Remove music. Enabled when a source exists and the app is not busy.
- `ChoosePartScreen` (new route `/choose-part`): owns its own `VideoPlayerController` for the original and returns `ClipRange?` through `Navigator.pop`.
- `VideoPreviewPanel` label: *Part 0:30–1:45* when `hasPart` and there is no result.
- `StatusMessage`: `cutting` → `cutting` text.

### Button rules (replaces 001 §4)

| Button | Enabled when |
|---|---|
| Pick | Not busy |
| **Choose a part** | A source exists and the app is not busy |
| Remove music only | A source exists and the app is not busy (the length check runs on tap) |
| Remove sound | A source exists and the app is not busy |
| Save | A result exists and the app is not busy |

### New strings (EN and AR)
`choosePart`, `choosePartTitle`, `usePart`, `partStart`, `partEnd`, `partLength`, `partLabel`, `partTooLongForMusic`, `cutting`, `errorCutFailed`, `errorTooLongChoosePart`.

## 8. Open questions

| # | Question | Suggested default |
|---|---|---|
| P1 | Is a cut that starts up to about 1–2 s **early** (on the nearest keyframe) OK? A frame-exact cut needs re-encoding the video: slower (about real time) and some quality loss. | Yes, the keyframe cut. Show the real start. |
| P2 | What is the **Remove music length limit**? This is 001 Q1. | 5 min on devices with 3 GB of RAM or more |
| P3 | Should the slider show **thumbnails** of the video? It needs a new package (`video_thumbnail` or native) and adds work. | Not in v1 |
| P4 | Should **Remove sound** also be offered on the full video when it is over the limit? (Yes in this spec: no limit for Remove sound.) | Yes |

## 9. Acceptance checks

| # | Check | How |
|---|---|---|
| AC1 | **Scenario A**: a 1-minute clip → Remove music → Save gives the full length, voices kept. | Manual (as 001 AC3) |
| AC2 | **Scenario B**: a 1-minute clip → Remove sound → Save gives the full length with no audio track. | Manual (as 001 AC2) |
| AC3 | **Scenario C**: a 20-minute clip → choose 1:00–2:00 → Remove music → Save. The saved video is about 60 s long (plus up to one keyframe interval at the start), voices kept, and the job never reads the full 20-minute audio. | Manual on the SM-A515F, plus a repository test that `extractAudio` gets the part's path |
| AC4 | **Scenario D**: a 20-minute clip → choose 1:00–2:00 → Remove sound → Save. Same length rule, no audio track. | Manual |
| AC5 | Cutting 1 minute out of a 20-minute 1080p clip takes under 3 s, and the part has the same resolution and orientation (portrait included). | Manual, Android and iOS |
| AC6 | In the part, audio and video stay in sync (a clap lines up within one frame). | Manual |
| AC7 | Remove music on a source longer than the limit shows `errorTooLongChoosePart` with a working **Choose a part** action, and no model download or extraction starts. | Cubit test + manual |
| AC8 | Choosing a part again opens with the last range and replaces the old part. Picking a new video clears the part and deletes its file. | Cubit test + temp-dir check |
| AC9 | Going back from the Choose a part screen changes nothing. | Widget test |
| AC10 | A failed cut shows `errorCutFailed`, keeps the earlier source, and every button works again (001 R2). | Unit test |
| AC11 | The Choose a part screen works in Arabic (Arabic labels, LTR slider) and fits on 360 × 640 dp. | Manual |
| AC12 | `flutter analyze` is clean and `flutter test` is green. | Local |
