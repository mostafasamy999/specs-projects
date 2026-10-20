# 001 Mute Video: Spec

**Version:** v1.1 (baseline: describes the app as built)  
**Status:** Draft. Waiting on product answers Q1–Q8 in [open-questions.md](open-questions.md).  
**App:** `~/StudioProjects/mute-music-app` (Flutter, Android + iOS)  
**Last updated:** 2026-10-20

### Changelog
- **v1.1 (2026-10-20):** Choosing a part of the video moved into scope. See [003 Choose a Part](../003-choose-part/spec.md) (scenarios C and D, F6, and the Remove music length limit).
- **v1.0 (2026-10-19):** First spec, written from the code at commit `6fd1532`. It records the current behavior as the baseline and lists the gaps found in the review as requirements (§9).

---

## 1. Purpose

The user picks a video from their gallery and gets a copy with either:
- **all sound removed** (fast, no quality loss), or
- **only the background music removed**, with the voices kept (on-device AI, slow).

They can then save the result back to their gallery. Everything runs on the device. The only network call is a one-time download of the AI model.

## 2. Scope

**In scope (v1)**
- One screen: pick → preview → remove sound or remove music → preview the result → save.
- Android and iOS.
- English and Arabic (RTL).
- Light and dark theme that follows the system.

**Out of scope (v1)**
- Accounts, a backend, analytics, ads and purchases.
- Recording video in the app. Gallery picking only.
- Editing (crop, rotate, filters). *Choosing a part to process is now in scope: see [003](../003-choose-part/spec.md).*
- Keeping music and dropping voices (karaoke mode).
- Processing several videos at once, or a history of past results.
- Web and desktop. The folders exist but are not supported targets.

## 3. Users and permissions

| Permission | Platform | Why | When asked |
|---|---|---|---|
| Photo library read | iOS (`NSPhotoLibraryUsageDescription`), Android 13+ (`READ_MEDIA_VIDEO`) | Pick a video | By the system picker |
| Photo library add | iOS (`NSPhotoLibraryAddUsageDescription`), Android ≤ 9 (`WRITE_EXTERNAL_STORAGE`, maxSdk 28) | Save the result | On the first save |
| Internet | Android | Download the AI model | Not a runtime prompt |

If the user denies the save permission, the app shows `errorPermission`, and the result stays on screen so they can try again.

## 4. Screen: Mute Video (`/`)

Layout, from top to bottom:
1. **App bar**: the title `appTitle`.
2. **Preview panel**: fills the remaining height.
   - With no video, it shows an empty placeholder with a movie icon.
   - With a video, it shows a label (*Original*, *No sound* or *No music*) above a looping player. Tapping the player toggles play and pause, and a play icon shows while it is paused.
   - It shows the result if there is one, and the source otherwise.
3. **Status message**: one line of text, plus a progress bar during the AI steps (§6).
4. **Buttons** (full width, 52 dp tall):
   - **Pick a video** / **Pick another video** (outlined)
   - **Remove music only** (filled)
   - **Remove sound** (filled)
   - **Save to gallery** (tonal)

### Button rules

| Button | Enabled when |
|---|---|
| Pick | Not busy |
| Remove music only | A source exists and the app is not busy |
| Remove sound | A source exists and the app is not busy |
| Save | A result exists and the app is not busy |

"Busy" means the status is `picking`, `cutting` (003), `muting`, `preparingModel`, `removingMusic` or `saving`. The **Choose a part** button and its rules are in [003 §7.4](../003-choose-part/spec.md).

## 5. Flows

### F1 Pick a video
1. Open the system gallery picker, limited to videos.
2. If the user cancels, nothing changes. Any earlier source and result stay.
3. If the user picks a video, it becomes the new source, and **any earlier result is dropped**.
4. If the picker fails, show `errorPickFailed`.

### F2 Remove sound
1. A native remux copies the **video track** into a new MP4 and leaves out every audio track. The video is not re-encoded, so quality is unchanged and the job takes about a second.
2. Portrait videos must stay upright (Android rotation hint, iOS `preferredTransform`).
3. On success, the result becomes the preview, labeled *No sound*. The status reads `readyToSave`.
4. Errors: no video track → `errorNoVideoTrack`. Anything else → `errorMuteFailed`.

### F3 Remove music only (AI)
1. **Make sure the model is ready** (§7). If it has to be downloaded, the status reads `downloadingModel` with a progress bar.
2. **Extract** the audio natively to raw interleaved float32 PCM.
3. **Normalize** the audio to 44.1 kHz stereo. Mono is copied into both channels. Other sample rates are resampled linearly.
4. **Separate** the audio with the MDX vocals model, chunk by chunk (§8). The status reads `removingMusic  NN%`.
5. **Mux** the vocals back in as AAC at 192 kbps, 44.1 kHz stereo, and copy the video track without re-encoding.
6. On success, the result becomes the preview, labeled *No music*. The status reads `readyToSaveMusic`.
7. Errors: model download fails → `errorModelDownload`. Model missing → `errorModelMissing`. No audio track → `errorNoAudioTrack`. No video track → `errorNoVideoTrack`. Anything else → `errorMusicRemoval`.

### F4 Save to gallery
1. Save the result to the album **"Mute Video"**.
2. On success, the status and a snackbar read `savedToGallery`.
3. Errors: permission denied → `errorPermission`. Anything else → `errorSaveFailed`.

### F5 Errors (all flows)
- Each failure shows its localized message in a snackbar once, when the status changes to `failure`.
- After a failure, the source and any earlier result stay, and every button is usable again.
- **Rule:** no failure may leave the screen stuck in a busy state (see R2).

## 6. State

`MuteVideoCubit` is created per screen and holds `MuteVideoState`:

| Field | Meaning |
|---|---|
| `status` | `initial`, `picking`, `muting`, `preparingModel`, `removingMusic`, `muted`, `saving`, `saved` or `failure` |
| `source` | The picked video (`VideoAsset`: path plus optional size) |
| `muted` | The result video, from either F2 or F3 |
| `musicOnly` | True when the result came from F3 (voices kept) |
| `progress` | 0.0–1.0. Only meaningful in `preparingModel` and `removingMusic` |
| `failure` | An `AppFailure`. It clears on every transition |

If a job finishes after the screen is closed, it must not emit a new state or crash.

### Status text

| Status | Text |
|---|---|
| initial | `emptyHint` |
| muting | `working` |
| preparingModel | `downloadingModel` + a progress bar |
| removingMusic | `removingMusic NN%` + a progress bar |
| muted | `readyToSave` or `readyToSaveMusic` |
| saving | `saving` |
| saved | `savedToGallery` |
| picking, failure | (none) |

## 7. AI model

| Item | Value |
|---|---|
| Model | `kuielab_a_vocals.onnx` (MDX-Net, vocals stem) |
| Source | GitHub release `TRvlvr/model_repo` `all_public_uvr_models` (third party, see Q3) |
| Size | 29,703,204 bytes, checked exactly |
| Location | The app support directory. It is downloaded once and kept |
| Download | Into `<file>.part` first, renamed to the final name only when the size matches. Broken or partial files are deleted before a retry and after a failure |
| Runtime | ONNX Runtime. Preferred providers, in order: XNNPACK, then Core ML, then CPU. The arena allocator is off |
| Input | `input` with shape `[1, 4, 2048, 512]` |

## 8. Separation algorithm (must match the model exactly)

| Parameter | Value |
|---|---|
| STFT | n_fft 6144, hop 1024, periodic Hann window, `center=True` reflect padding (pad = 3072) |
| Bins kept | 2048 (out of 3073) |
| Frames per chunk | 512, so a chunk is 523,264 samples (about 11.87 s) |
| Tensor channels | `[L real, L imag, R real, R imag]` |
| Chunking | Pad the track with `trim = 3072` zeros on each side and round up to a whole number of chunks. Keep only the middle `genSize = 523,264 − 2·3072` samples of each chunk |
| Output gain | × 1.035 |
| Progress | `(chunk index + 1) / chunk count` |

The tests against the PyTorch reference (`mdx_stft_test`, `mdx_tensor_test`) are the acceptance gate for any change here.

## 9. Non-functional requirements

| ID | Requirement | Status in v1.0 |
|---|---|---|
| R1 | The UI stays responsive (no visible freeze above about 100 ms) while music is being removed | **Not met.** The STFT runs on the UI isolate (review C1) |
| R2 | No failure path leaves the cubit busy. Every exception maps to an `AppFailure` | **Not met** (review C2) |
| R3 | Memory: a clip up to the max length (Q1) finishes on the lowest supported device without an out-of-memory kill | **Unknown.** The whole track is kept in memory (review C3) |
| R4 | Temporary files (PCM, intermediate MP4s) are deleted on success, on failure, and when a new video is picked | **Partly met** (review M1) |
| R5 | Native resources (codecs, extractors, muxers) are released on every path | **Not met** on Android (review M2) |
| R6 | The output keeps the source's orientation, and the audio stays in sync with the video | Met for orientation. Sync is not verified (review M5) |
| R7 | Diagnostics tools are not reachable in release builds | **Not met** (review M6) |
| R8 | Every user-visible string is localized in EN and AR | Met |
| R9 | The model download is verified (Q3) | Size check only |

## 10. Acceptance criteria

- **AC1** Picking a video shows it under *Original*, and picking again replaces it and clears the result.
- **AC2** Remove sound on a 1-minute 1080p clip finishes in under 3 s, keeps the same resolution and orientation, and has no audio track.
- **AC3** Remove music on a speech-plus-music clip produces a result where speech is clearly audible and music is strongly reduced, and it stays the same length as the source (±50 ms).
- **AC4** The first music removal shows the model download progress. Later ones skip it, including after an app restart.
- **AC5** Killing the app during the download and reopening it never leaves a model that is treated as ready but is broken.
- **AC6** Each `AppFailure` shows its own localized message, and the screen is usable straight after.
- **AC7** Save puts the result in the "Mute Video" album, and denying permission shows `errorPermission`.
- **AC8** The UI keeps animating (the progress bar moves, and back navigation works) during music removal (R1).
- **AC9** Arabic shows RTL layout and Arabic strings.
