# 005 Fewer Actions: Tasks

- [x] **T1** `ActionStage` + `MuteVideoState.stage`.
  **Verify:** state test: empty / picked / done, and a busy job keeps its stage.
- [x] **T2** `MuteVideoActions` + `MoreActionsToggle`, EN/AR strings, used by `MuteVideoContent`.
  **Verify:** widget tests for AC1–AC5.
- [ ] **T3** Emulator check, EN and AR.

*2026-10-20: T1–T2 done; 94 tests pass (6 new for AC1–AC5), analyze clean. Emulator (EN): the empty screen shows Pick a video + More actions; expanded shows all five in order + Fewer actions. **T3 still open:** the Picked and Done stages with a real video, and Arabic.*
