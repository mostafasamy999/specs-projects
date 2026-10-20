# 001 Mute Video: Open Questions

Status values:
- **Open:** no answer yet.
- **Assumed in code:** the code already uses an answer. Confirm it or change the code.
- **Resolved:** the answer is confirmed and folded into `spec.md`.

| # | Question | Status | Answer | Code impact |
|---|---|---|---|---|
| 1 | What is the **maximum video length** for Remove music (and for Remove sound)? What is the lowest device we support (RAM and OS)? | Open | | Decides WP3: either a duration limit plus a message, or streaming separation. The suggested default is 5 min on devices with 3 GB of RAM or more. [003](../003-choose-part/spec.md) uses this limit to ask the user to choose a part (003 P2) |
| 2 | Is Remove music allowed to take a long time (about N× real time on a mid-range phone)? Should the user be able to **cancel**, or leave the app while it runs (keep running in the background)? | Open | | A cancel button, a `CancelToken` and an isolate kill. iOS background time is limited |
| 3 | **Model source and license:** can we redistribute `kuielab_a_vocals.onnx`? Should we host it ourselves (a CDN or Firebase Storage) and check a SHA-256? | Assumed in code (third-party GitHub, size check only) | | WP6: the URL, the checksum, a fallback mirror |
| 4 | Should we ask before downloading about 30 MB on **mobile data**, or only download on Wi-Fi? | Assumed in code (download without asking) | | A confirm dialog and a connectivity check |
| 5 | Should the **memory probe** be removed entirely, or kept behind `kDebugMode`? | Assumed in code (shown in every build) | | WP2 |
| 6 | What is the **app name** on the launcher and in the app: "Mute Video", "Mute Music" or something else? | Open | | The Android label, the iOS `CFBundleDisplayName`, `appTitle` and the gallery album name |
| 7 | After saving, should the app reset to the start, or keep the result on screen? Should it offer **Share** as well? | Assumed in code (keep the result, no share) | | Possibly new UI |
| 8 | **Audio quality** of the output: is AAC at 192 kbps, 44.1 kHz stereo OK, even when the source is 48 kHz? Is linear resampling acceptable for music-heavy clips? | Assumed in code | | `PcmIo`, the native mux settings |

When an answer arrives:
1. Fill in the **Answer** column and set the status to Resolved.
2. Fold it into `spec.md` and bump the version.
3. Unblock the matching tasks in `tasks.md` (remove the 🔒).
