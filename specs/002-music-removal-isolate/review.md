# 002 Music Removal: Spec Review (Issues Check)

Reviewed against the code at `mute-music-app@772a36c` on 2026-10-19, before coding.

Severity: **High** = could make the change fail or break a 001 rule. **Med** = must be handled in the design. **Low** = noted, no action now.

| # | Sev | Issue | Decision |
|---|---|---|---|
| I1 | High | **ONNX in a background isolate is unproven.** `flutter_onnxruntime` 1.8.4 talks to native code over a `MethodChannel`, not FFI. From a non-root isolate, that only works after `BackgroundIsolateBinaryMessenger.ensureInitialized(token)`. On Android the plugin already runs on a background task queue (`makeBackgroundTaskQueue`), which is a good sign, but iOS hasn't been checked. | Do a spike first (T1) on the Android device. If ONNX fails in the worker, fall back as in 001 plan WP3: keep `session.run` on the UI isolate and move only PCM I/O and pack/unpack to the worker. The spec's C1.2 then changes to "everything except `session.run`". |
| I2 | High | **`compute()` can't report progress.** `compute`/`Isolate.run` return one value at the end. C2 needs per-chunk updates. | Use `Isolate.spawn` with a `ReceivePort` (same idea, long-lived). Spec §4.2 says so. |
| I3 | Med | **A dead worker could hang the screen.** If the isolate crashes (OOM, native abort) and sends nothing, the repository's future never completes → stuck busy, which breaks 001 R2. | Pass `onError` and `onExit` ports to `Isolate.spawn`. An exit with no result completes with an error → `musicRemovalFailed` (C1.5). Covered by a unit test. |
| I4 | Med | **Copying audio between isolates would cost memory and time.** A 5 min track is about 200 MB as `Float64List` per direction. | The worker reads and writes the PCM files itself. Only paths, numbers and small progress maps cross the boundary (C1.3). |
| I5 | Med | **The callback type changes in the domain.** `MusicRemovalRepository`, `RemoveMusicUseCase`, the cubit, and two test files use `void Function(double)`. | Change them all in one task (T3) to `void Function(RemovalProgress)`. `RemovalProgress` is pure Dart, so the domain stays Flutter-free. |
| I6 | Med | **"Divide the view into small pieces" is open to reading.** It could mean splitting the screen widget into smaller widgets, or showing the job as steps. | Read as the user-visible meaning: a 4-step list (spec C2). The widgets are also kept small (one per step). **Confirm with the requester.** |
| I7 | Med | **Screen height.** The preview panel is `Expanded`, so 4 extra rows shrink it. | Rows are compact (≤ 40 dp), and only the active row shows a bar. The step list replaces the status line rather than adding to it (C2.8). |
| I8 | Low | **The worker keeps running if the screen closes.** There is no cancel (001 Q2). | Accept. The cubit already ignores late results (`_set` checks `isClosed`), and the repository's `finally` still deletes the PCM files. Killing the isolate comes with 001 WP7. |
| I9 | Low | **Peak memory is unchanged.** The worker still holds the whole input and output track. | It is just moved off the UI isolate's heap. Memory limits stay with 001 Q1 / T3.3–T3.4. |
| I10 | Low | **`MemoryProbe` creates its own ORT session on the UI isolate.** | Debug-only diagnostics (001 T2.1). Not changed. |
| I11 | Low | **Native extract/mux could block the platform thread.** | Checked: Android runs them on a single-thread `Executor`, iOS on `DispatchQueue.global`. No change needed. |
| I12 | Low | **Overlap with 001.** 001 T3.1/T3.2 describe the same isolate work. | 002 replaces them. 001 `tasks.md` points here. |
| I13 | High | **Found on device after coding: XNNPACK leaks memory.** On the realme RMX3241 (Android 13, 5.6 GB), each `session.run` with the XNNPACK provider added about 2.6 GB of native memory that `dispose`, `session.close` and idle time never freed. A 15 s clip took the app from 250 MB to 3.4 GB, and ColorOS killed it once it went to the background. The same happens on the UI isolate (old code), so the isolate didn't cause it. With the CPU provider, native memory peaks around 85 MB and drops back after `session.close` (app about 410 MB); it even finishes on the 2.5 GB emulator. | XNNPACK is removed from the provider list (CPU on Android, Core ML then CPU on iOS). Also fixed: asking for CPU listed it twice, and the runtime refused to create the session. Speed checked on the SM-A515F (profile build, 15 s clip): CPU takes about 20 s per chunk and 51 s in total, and the app falls back to 248 MB. XNNPACK takes about 45 s per chunk and 101 s in total, and the app stays at 3.3 GB with 176 MB of phone RAM free (the kill level is 141 MB). So CPU is about twice as fast as well. **Still open:** Core ML memory on iOS. |

## Result

No blocking issues. I1 is a risk with a fallback, so coding starts with the spike (T1). I6 is an interpretation to confirm, and it doesn't block the isolate work.
