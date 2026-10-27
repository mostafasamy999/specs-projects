# 001 New Activities — User scenarios and rules (HIGH-LEVEL)

> **Doc v2.0 · 2026-10-27 · spec v1.2 · synced to changelog CL-10**
> Every action a user can take in the module: what starts it, what should happen, and the rules that apply. It's written so you can review behavior or write test cases from this file alone.
> It describes **how the app behaves today**. Where that differs from the agreed spec, or depends on an unanswered question, the entry says so with ⚠. Code details are in [current-state-codebase-logic-tech.md](current-state-codebase-logic-tech.md). Test coverage is in [test-cases-maestro.md](test-cases-maestro.md).

---

## Words used in this file

- **Activity:** a Visit or a Task. A **Visit** happens at a place and has a category, a repeat pattern (execution type), a location, and optionally a contact and check-in/out. A **Task** has none of these.
- **Occurrence:** one scheduled instance of an activity assigned to one person. The normal list and the **Detail** screen show occurrences.
- **Main (master) activity:** the activity itself, which may have many occurrences. The **Main** list and the **Master** screen show these.
- **Open status:** Pending or In progress. **Closed status:** Cancelled, Completed or Rejected. (Partially completed is neither open nor closed.)
- **Team user:** someone who can see other employees. **Solo user:** someone with nobody else to see (no team).
- **Default filter:** both types, scope All, the last 7 days (6 days ago at 00:00 to today at 23:59), no list chip picked, newest first.

---

## A. Opening the module

### SC-01 Open Activities
- **Trigger:** tap the Activities tab, or open the Activities screen.
- **Expected:** a shimmer while the filter options load, then the **Dashboard** with the default filter. The list and dashboard data start loading together.
- **Rules:**
  - A team user starts with all their departments and employees in scope. A solo user starts with only their own activities.
  - If a lookup fails to load (statuses, priorities, categories, execution types, departments), the screen still opens. That lookup's filter section is just hidden.
  - Tapping the Activities tab while already on it scrolls the list back to the top.

### SC-02 Switch between Dashboard and List
- **Trigger:** tap the view-switch button (a centred pill that shrinks into a round button after about 1.5 s).
- **Expected:** the other view shows. The search text is cleared, and the list reloads if it had a search.
- **Rules:** switching view keeps every filter. Going back to the dashboard doesn't reload it.

---

## B. Dashboard

### SC-03 Read the dashboard
- **Trigger:** the dashboard is shown.
- **Expected:** a Visits vs Tasks donut with totals. A **Visits summary** (total, completed, in progress, pending, late). A **Tasks summary** (the same, plus today / current / previous counts). The date range in use is shown.
- **Rules:**
  - The dashboard always counts **both** types, even when the list is filtered to one.
  - It follows status, category, execution type, dates and scope.
  - ⚠ It ignores **priority**, **search** and the **Main** chip, so its numbers can differ from the list (Q25, Q26).
  - Missing numbers show as 0.
- **States:** shimmer while loading. "Something went wrong" with **Retry** on failure.

### SC-04 Tap a summary card
- **Trigger:** tap the Visits or Tasks summary.
- **Expected:** the List opens, filtered to that type, and reloads.
- **Rules:** the type filter stays set on the list afterwards. If a visit-only filter was set and Tasks is tapped, those filters are dropped.

---

## C. List

### SC-05 Browse the list
- **Trigger:** open the List view.
- **Expected:** activity cards, 10 at a time. Each card shows the title, type, status (colored pill), priority, private marker, assigned-to / assigned-by, and the schedule.
- **Rules:**
  - Fields the backend doesn't send are hidden, never faked. With no dates, there is no schedule line.
  - Newest first by scheduled start, unless the user changes the sort.
- **States:** shimmer on first load. "No activities" when empty. "Something went wrong" + **Retry** on failure.

### SC-06 Load more (infinite scroll)
- **Trigger:** scroll near the bottom of the list.
- **Expected:** the next 10 load, with a placeholder card at the bottom while loading.
- **Rules:**
  - Stops when everything has loaded.
  - Only one page loads at a time.
  - If a later page fails, the cards already shown stay and no error is shown. Scrolling again retries.
  - Any change of filter, search, sort or chip starts again from page 1, and results from the old query are discarded.

### SC-07 Pull to refresh
- **Trigger:** pull down on the list.
- **Expected:** the list reloads from page 1 with the same filters.

### SC-08 Search
- **Trigger:** type in the search box (list view).
- **Expected:** the list reloads about 0.4 s after typing stops.
- **Rules:**
  - Search applies to the list only. The dashboard doesn't change.
  - Clearing the text reloads the full list.
  - Switching view clears the search.
  - ⚠ Which fields are matched (title, employee, creator) is decided by the backend and not confirmed (Q19).

### SC-09 Sort
- **Trigger:** tap Sort, then pick Newest first or Oldest first.
- **Expected:** the list reloads in that order.
- **Rules:** sorting is by scheduled start. The sort is kept across refreshes and filter changes. It doesn't affect the dashboard.

### SC-10 Quick chip: Current / Previous
- **Trigger:** tap **Current** or **Previous** on the chip bar.
- **Expected:** the list shows assigned occurrences in that period. The chip is highlighted. List and dashboard reload.
- **Rules:**
  - Current = scheduled from today 00:00 onwards.
  - Previous = scheduled before **yesterday** 00:00. ⚠ The agreed rule is "before today 00:00". Today the code drops yesterday's activities from both chips (gap, fix pending; Q14 affects the exact end).
  - Tapping the highlighted chip again clears it and returns to the last 7 days.
  - Current, Previous and Main exclude each other.

### SC-11 Quick chip: Main
- **Trigger:** tap **Main**.
- **Expected:** the list shows the activities themselves (masters) instead of assigned occurrences. Cards show an edit (pencil) icon.
- **Rules:**
  - Main ignores Current/Previous. Main uses the date range only if one was set in the filter sheet.
  - Tapping Main again returns to the default list.
  - ⚠ Main ignores the Visit execution-type filter even if it's set (Q27).
  - ⚠ The dashboard doesn't follow Main (Q25).

### SC-12 Quick chips: Type / Scope / Status / Priority
- **Trigger:** tap the chip, then pick an option in the sheet.
- **Expected:** the chip shows the pick (for example "Status · In progress"). List and dashboard reload.
- **Rules:**
  - Type, Status and Priority start at **All**. Picking All clears that filter.
  - Status and Priority chips are hidden if their options failed to load.
  - Scope always has exactly one value.
  - Changing the type to anything but Visit drops category and execution type.
  - Changing the scope to anything but My team clears picked departments and employees.

### SC-13 Quick chip: Department
- **Trigger:** tap **Department** (team users only).
- **Expected:** a searchable department tree with each department's employees opens. Picking whole departments or individual employees and confirming filters by them and switches the scope to **My team**.
- **Rules:**
  - Does nothing for a solo user.
  - Cancelling keeps the previous pick. Confirming an empty pick means everyone in the user's departments.

### SC-14 Scopes: what each one shows
| Scope | Who can pick it | Whose activities |
|---|---|---|
| All (default) | everyone | everyone the user can see, plus the user's own, including private ones |
| My team | team users only | the picked departments/employees, or all of them if none are picked |
| My activities | everyone | only the user's own |
| Private | everyone | only the user's private activities |

- ⚠ Exactly how the backend applies the "only me" flag for All vs Private isn't confirmed (Q16). Whether the list endpoint really returns other people's activities is also unconfirmed (Q28).

---

## D. Filter sheet

### SC-15 Open and use the filter sheet
- **Trigger:** tap the Filter icon.
- **Expected:** a sheet with the current filters as a draft: Type (dashboard only), Status, Priority (dashboard only), Category and Execution type (list only, Visit type only), Scope, Department, Start and End date-time.
- **Rules:**
  - Nothing applies until **Show results** is tapped.
  - **Cancel**, back or swiping down throws the draft away and keeps the applied filters.
  - Tapping a selected chip clears it. Scope can't be cleared.
  - Sections whose options failed to load are hidden.
  - The Department row is greyed out for solo users and for the My activities / Private scopes. Picking departments here also switches the scope to My team.
  - Either date can be removed (open-ended). The end can't be before the start. Moving the start past the end clears the end.
  - A filter badge shows how many filters differ from the default. Default dates and scope All don't count.

### SC-16 Apply filters
- **Trigger:** tap **Show results**.
- **Expected:** the sheet closes. List (from page 1) and dashboard reload with the filters.

### SC-17 Reset filters
- **Trigger:** tap **Reset** in the sheet.
- **Expected:** the sheet closes and everything goes back to the default filter. List and dashboard reload.
- **Rules:** reset also cancels a pending search reload. The sort isn't reset.

---

## E. Create and edit

### SC-18 Start creating an activity
- **Trigger:** tap **Add**.
- **Expected:** the form opens with **Visit** selected (Visit on the start side, Task on the end side), after a short shimmer.
- **Rules:**
  - A solo user's department and employee are fixed to themselves and can't be changed.
  - The Create button stays faded until something is changed.

### SC-19 Switch Visit ↔ Task
- **Trigger:** tap the other type on the toggle.
- **Expected:** the form clears and shows that type's fields. If anything was entered, a warning asks for confirmation first.
- **Rules:** Visit-only fields are category, execution type, repeat days, location and contact. When editing, the type is locked.

### SC-20 Fill the form
- **Fields:** title · start and end date-time · priority (optional) · private toggle · departments/employees · description (optional) · attachments (optional) · Visits only: category → execution type → week days (weekly) or month days (monthly) → location on a map → contact (optional).
- **Rules:**
  - **Required:** title. Both dates. People (or, if private, the department). Visits also need category, execution type, location, and days when the type is weekly or monthly.
  - The end can't be before the start. Moving the start past the end clears the end.
  - Execution types offered depend on the category. Changing category drops an execution type the new category doesn't offer.
  - Changing the execution type clears picked week/month days. Week days run Saturday → Friday. Month days are 1–31.
  - **Private on:** people are fixed to the creator (only they see it). **Private off:** people are cleared to pick again (solo users stay fixed).
  - Once both dates are set, the people picker shows each employee as **Busy** (has activities then) or **Available**. ⚠ The agreed spec has four levels (Available, Busy, Very busy, Overloaded) from the backend (blocked on Q12). If the workload fails to load, no chip shows. Tapping a chip doesn't open anything yet.
  - **Contact:** pick a saved contact (searchable), or add a new one. The name is required. A new contact is saved to the user's contacts first. The add form opens directly if the user has no saved contacts.
  - **Attachments:** camera, gallery or file. Each can be opened to preview or removed.
  - **Location:** picked on a map.

### SC-21 Submit (create)
- **Trigger:** tap **Create visit / Create task**.
- **Expected:**
  - Required fields empty: they're outlined in red, the form scrolls to the first one, and nothing is sent.
  - Otherwise: a loading overlay, then a success dialog, then back to Activities, which reloads the list and dashboard.
  - On failure: a failure dialog, and the user stays on the form with everything kept.
- **Rules:** the button can't be tapped twice while saving.

### SC-22 Edit an activity
- **Trigger:** on the **Main** list, tap a card's pencil icon.
- **Expected:**
  - If the activity can be edited: the form opens filled with its data, the type is locked, and the button reads **Save changes**.
  - If it can't: a toast explains why ("This task is completed / cancelled / rejected", or "You can't edit this task/visit").
- **Rules:**
  - Editable only if the status isn't closed **and** the backend allows this user (its "can edit" flag).
  - Save stays faded until something changes.
  - If the activity fails to load, a failure dialog shows, then the form closes.
  - Saving works as in SC-21.
  - ⚠ Existing attachments are shown but not sent back on save.

---

## F. Activity detail (occurrence)

Opened by tapping a card in the normal list (not Main). Back returns to the list, which reloads if anything was changed.

### SC-23 View an activity
- **Expected:** header (title, code, type, status, priority, private), schedule, people (assigned to / by, department), category card for visits (check-in/out and location rules), progress, description, attachments (tap to preview), notes.
- **States:** shimmer while loading. "Something went wrong" + Retry on failure.

### SC-24 Start
- **Trigger:** tap **Start** (shown while the status is Pending).
- **Expected:** if the category has questions for this step, a questions sheet opens first. Then the start is sent, the screen refreshes, and the status becomes In progress.
- **Rules:**
  - Required questions must be answered. Errors show after the first submit attempt.
  - The phone location is sent only if the category requires it. If location permission is denied, the step is still sent without it.
  - On failure, an error dialog shows the backend message.

### SC-25 End (complete)
- **Trigger:** tap **End** (enabled only while In progress).
- **Expected:** optional questions, as for Start. Then status Completed and progress 100.
- **Rules:** End is disabled for every status except In progress.

### SC-26 Check in / Check out (Visits only)
- **Trigger:** tap **Check-in**, later **Check-out**.
- **Expected:** optional questions, then sent with location if required. After check-in, the button becomes Check-out, and the check-in time (and later check-out time) shows under the buttons.
- **Rules:**
  - Shown only if the visit's category uses check-in / check-out.
  - Both are disabled once the visit is Completed.
  - ⚠ The check-in/out and start/end times shown are recorded on the phone only. They disappear when the screen reloads.

### SC-27 Add a note
- **Trigger:** tap **Add note** (open status only), type, confirm.
- **Expected:** the note is saved and appears in the notes list.
- **Rules:** an empty note isn't sent.

### SC-28 Change status
- **Trigger:** tap the status (open status only), pick a status, optionally add a reason.
- **Expected:** the status is saved, with the reason if one was typed, and the screen refreshes with the new status.
- **Rules:** every status from the backend list is offered. ⚠ Whether the user may change status is decided by status and role only. Per-activity permission flags are waiting on the backend (Q13).

### SC-29 Reschedule
- **Trigger:** tap the schedule (open status only), pick a new start, then a new end.
- **Expected:** the new schedule is saved and shown.
- **Rules:** the end defaults to the old duration and can't be before the start. Cancelling either picker cancels the reschedule.

### SC-30 Update progress
- **Trigger:** drag the progress slider (only while In progress).
- **Expected:** the value moves straight away and is saved about 0.6 s after dragging stops. The screen then shows the value the backend saved.
- **Rules:**
  - 0–100, whole numbers.
  - If saving fails, the slider goes back to the last saved value and an error shows.
  - Leaving the screen right after dragging still saves the last value.

### SC-31 Open the timeline
- **Trigger:** tap **Timeline** on the detail screen.
- **Expected:** the activity's history, oldest first, grouped by day (created, checked in, checked out, and other actions by name), with who did it and any comment.
- **States:** loading, error with Retry.

---

## G. Activity master (Main)

Opened by tapping a card in the **Main** list.

### SC-32 View a master activity
- **Expected:** the same information as the detail screen, but without progress, timeline, reschedule, status change or notes.

### SC-33 Enable / Disable
- **Trigger:** tap **Disable** (or **Enable** if it's disabled).
- **Expected:** the activity switches state and the button label flips. The Main list reloads on back.
- **Rules:** the button is greyed out when the activity is Cancelled, Completed or Rejected.

---

## H. Rules that apply everywhere

- **Errors:** any failed action shows a dialog with the backend message, or "Something went wrong". A loading overlay never stays up after a failure.
- **Only one action at a time** on the detail screen. Taps during an action are ignored.
- **Returning from detail, create or edit** reloads the list and dashboard only when something was actually saved.
- **Language:** Arabic and English. Layout follows the reading direction (for example, the Visit/Task toggle order flips). Dates and numbers sent to the server always use English digits.
- **Unknown values from the backend:** an unknown type shows as Task. An unknown priority shows as Low, or none if only a name was sent. A missing status shows blank.
