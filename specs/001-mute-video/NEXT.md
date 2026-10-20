# 001 Mute Video: Start Here

**Last updated:** 2026-10-19  
**State:** T0.1, WP1, T2.1 and WP4 are done and device-checked on the API 36 emulator (not committed yet). 36 unit tests and 6 integration tests pass, and analyze is clean. Open questions Q1–Q8 haven't been sent yet.

## 1. Send the open questions (10 min)

Take [open-questions.md](open-questions.md) to whoever owns the product. Q1 (max length and lowest device), Q3 (model license and hosting) and Q5 (memory probe) block real work.

## 2. Work you can do now (in order)

1. ~~**T0.1:** test dependencies.~~ Done.
2. ~~**WP1 (T1.1–T1.3):** stop the screen getting stuck in a busy state.~~ Done.
3. ~~**T2.1**~~ and ~~**WP4**~~: done.

5. **T3.1 → T3.2:** the isolate spike, then move separation off the UI isolate.
6. **WP8:** add the tests alongside the work above.

**New: [003 Choose a Part](../003-choose-part/spec.md)** fixes big videos by processing only a chosen part (scenarios C and D). Start with its T1 (native cut on Android). Send its P1–P4 together with Q1–Q8.

Then do T3.3 (a memory run on a device), WP5 (with the test clips), and the 🔒 tasks as answers arrive.

## 3. Prompt to start a Claude session

Open a session in `~/StudioProjects/mute-music-app` and paste:

```
Read ~/work/specs-projects/specs/001-mute-video/{spec.md,review.md,plan.md,tasks.md,NEXT.md}.
Do T3.1 (the isolate spike), then T3.2.
Follow the plan's constraints (don't touch the DSP math; every new string in EN and AR; no exception escapes a repository).
Tick each task in tasks.md only after its Verify step passes.
```

## 4. At the end of the day

- Tick the finished tasks in `tasks.md`.
- Update this file's **State** and next steps.
- Commit the specs repo, for example `spec(001): progress — WP1 done`.

## Running the device tests

`integration_test/native_cleanup_test.dart` needs `test_clip.mp4` (with video and audio) in the app's files folder. `flutter test` uninstalls the app at the end, so stage the clip again before every run:

```bash
flutter build apk --debug && adb -s emulator-5554 install -r build/app/outputs/flutter-apk/app-debug.apk
adb -s emulator-5554 push test_clip.mp4 /data/local/tmp/
adb -s emulator-5554 shell run-as com.mostafasamy.mutemusic.mute_music_app mkdir -p files
adb -s emulator-5554 shell run-as com.mostafasamy.mutemusic.mute_music_app cp /data/local/tmp/test_clip.mp4 files/test_clip.mp4
flutter test integration_test/native_cleanup_test.dart -d emulator-5554
```

The clip used on 2026-10-19 was the video_player example `Butterfly-209.mp4` plus a `say`-generated AAC voice track (4.7 s). It is not in either repo. Tracked as part of T5.1 (`test_assets/`).
