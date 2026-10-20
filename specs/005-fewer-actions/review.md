# 005 Fewer Actions: Review (Issues Check)

Reviewed against `mute-music-app` (branch `feature/004-app-language`, with the language work uncommitted) on 2026-10-20, before coding.

| # | Sev | Issue | Decision |
|---|---|---|---|
| I1 | Med | **Remove sound goes behind More actions.** It is the fast, reliable option, and now one extra tap away. | Per the request, Remove music only is the main action. Remove sound stays one tap away under More actions. |
| I2 | Med | **A result from Remove sound isn't covered by the request** (it only names Remove music only). | Treat any result the same: Done shows Pick another video and Save (A1). |
| I3 | Med | **Choose a part is hidden by default**, but the "too long for Remove music" snackbar leads there. | The snackbar already opens Choose a part directly (A8); nothing to change. |
| I4 | Med | **Should More stay open?** If it stays open after a result, the user sees five buttons again; if it closes after every action, Choose a part (which stays in Picked) would close it too. | Collapse only when the **stage** changes (A5). |
| I5 | Low | **Buttons could jump during a job** if the stage used the busy status. | The stage comes from source/result only (A6). Buttons are disabled during the job as today. |
| I6 | Low | **"More actions" state is UI-only.** | Keep it in the widget, not the cubit. It isn't saved, and it resets on a new launch. |

## Result

No blockers.
