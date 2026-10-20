# 005 Fewer Actions: Spec

**Version:** v1.0  
**Status:** Approved for coding (issues in [review.md](review.md))  
**App:** `~/StudioProjects/mute-music-app`  
**Last updated:** 2026-10-20

---

## 1. Purpose

The main screen shows five buttons all the time (Pick, Choose a part, Remove music only, Remove sound, Save), and most of them are disabled most of the time. The screen should show only the next sensible actions, plus a **More actions** toggle that reveals everything.

## 2. Stages and what each shows

| Stage | When | Shown by default |
|---|---|---|
| **Empty** | No video picked | Pick a video |
| **Picked** | A video is picked, no result yet | Pick another video · Remove music only |
| **Done** | A result exists (from Remove music only or Remove sound) | Pick another video · Save to gallery |

In every stage, a **More actions** toggle sits under the buttons. Tapping it shows **all five actions** in the usual order (Pick, Choose a part, Remove music only, Remove sound, Save). Tapping it again (**Fewer actions**) goes back to the default set.

## 3. Requirements

| # | Requirement |
|---|---|
| A1 | The default set per stage is exactly the table in §2. |
| A2 | Expanded shows all five actions in the order Pick, Choose a part, Remove music only, Remove sound, Save. |
| A3 | Each button keeps its current enabled rules (busy, no source, no result). Expanded can show disabled buttons. |
| A4 | The toggle reads `moreActions` / `fewerActions` with a chevron (down/up), in EN and AR. |
| A5 | The view collapses back to the default set when the **stage** changes (e.g. after a result arrives), so the next step is obvious. It stays expanded while the stage is the same (e.g. after Choose a part). |
| A6 | While a job runs, the stage is decided by the data (source/result), not the busy status, so buttons don't jump during the job. |
| A7 | Showing and hiding animates the height (no jump). |
| A8 | The "too long for Remove music" snackbar keeps its **Choose a part** action, so that path works while the button is hidden. |

## 4. Design

- **State:** `MuteVideoState.stage` → `ActionStage { empty, picked, done }`: `muted != null` → done, else `source != null` → picked, else empty.
- **UI:** `MuteVideoActions` (new, StatefulWidget) replaces the five buttons in `MuteVideoContent`. It selects the stage, holds `_expanded`, and resets `_expanded` when the stage changes. It builds the list of buttons for the stage (or all five), wrapped in `AnimatedSize`.
- **Toggle:** `MoreActionsToggle` (new), a `TextButton.icon`.
- The existing button widgets are reused unchanged.

## 5. Acceptance checks

| # | Check |
|---|---|
| AC1 | Fresh start: only Pick a video and More actions are visible. |
| AC2 | After picking: Pick another video, Remove music only, More actions. |
| AC3 | After Remove music only finishes: Pick another video, Save to gallery, More actions. |
| AC4 | More actions shows all five in order; Fewer actions hides them again. |
| AC5 | Expanded, then a result arrives → collapses to the Done set. |
| AC6 | Works in Arabic (RTL). `flutter analyze` is clean and `flutter test` is green. |
