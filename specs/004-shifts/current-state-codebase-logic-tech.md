# 004 Shifts — Current state: codebase, logic, tech (LOW-LEVEL)

> **Doc v0.1 · 2026-11-12 · synced to changelog CL-1**
> Code read from `~/StudioProjects/talentlink`, branch `testflight`, on 2026-11-12. Nothing for shifts exists yet; this lists where the feature plugs in and what to reuse.
> Audience: an AI or dev building this feature cold. Rules (R1–R35): [user-scenarios-rules.md](user-scenarios-rules.md).

All paths are relative to `lib/src/`.

## 1. Where it plugs in

| Piece | Path | Change |
|---|---|---|
| Route | `config/routes/routes_manager.dart` | add `Routes.shifts = "/shifts"` + case, with `ShiftsArgs? { DateTime? focusDate }` |
| Permission | `domain/usecase/permissions/check_user_access_use_case.dart`, `enum RequestTypeId` | add `shiftTeam(<id TBD>)` under `// modules` (Q9) |
| More entry (R1) | `presentation/screens/more/widgets/more_items_widget.dart`, work overview section | add a `MoreRowWidget` "Shifts" after the upcoming calendar row |
| Home calendar tap (R2, R8) | `upcoming_calendar/widget/leave_groupedView_widget.dart`, `_notificationAction` | add a branch for the shift reference id → `Routes.shifts` with `focusDate` = event day. Same widget serves Upcoming Calendar, so the shift event opens the screen there too |
| New screen | `presentation/screens/shifts/` | new: screen, widgets, args |
| New cubit | `presentation/blocs/shifts/` | new `ShiftsCubit` (one state per tab: period, filter, data, status) |
| Domain / data | `domain/…/shifts`, `data/…/shifts` | new entities, use cases, repository, API service (API TBD) |
| DI | `di/` | register the use cases and cubit |
| Strings | `l10n` (EN + AR) | new keys: shifts, myShift, myTeam, dayOff, notAssignedYet, shiftType, noMatchingShift, … |

## 2. What to reuse

| Need | Existing piece | Path |
|---|---|---|
| My / team tabs | Requests tab toggle | `presentation/screens/requests/widgets/request_tab_toggle_widget.dart` |
| Filter bottom sheet with apply / reset, count badge | Requests filter | `presentation/screens/requests/widgets/requests_filter_bottom_sheet.dart`, `request_filter_count_badge_widget.dart` |
| Company / employee lists for the team filter | `getCompaniesAndEmployeesList` | `data/sources/remote/talent_link_hr/my_team_request/get_my_team_request_api_service.dart` (check it returns the full hierarchy, Q10) |
| Pick from a long list (employee, department) | #SearchableScreen | `presentation/screens/searchbale/` |
| Week strip / month-year picker | Home calendar | `upcoming_calendar/widget/custom_week_calendar_widget.dart`, `month_year_picker_sheet_widget.dart` |
| Permission check | `checkEssPermission` | `domain/usecase/permissions/check_user_access_use_case.dart` |

## 3. How the Home calendar routes events today

The Home calendar (`presentation/screens/home/widgets/calender_widget.dart`) uses `UpcomingBloc`, which loads `getLeaveInCalendarMobile` / `getLeaveCountInCalendarMobile` (`data/sources/remote/talent_link_hr/home/home_api_service.dart`). Each item (`RemoteGetLeaveInCalendarMobile`) is routed by `referenceId` in `_notificationAction`:
- `0` → #GeneralMessage
- `1024` or type name contains Task / Visit → #ActivityDetails
- anything else → #RequestDetails

A shift event needs its own `referenceId` and must be checked **before** the "anything else" branch, or it will open #RequestDetails.

## 4. Data the UI needs (API out of scope for now)

No endpoints are defined in this spec. When the API is designed, the screen needs:

**My shift (period from – to)**
- per day: date, `isAssigned` (week published or not), list of shifts
- per shift: id, name, start time, end time, shift type id

**My team (period from – to, filter: shift type, department, employee)**
- per day: date, `isAssigned`, list of shift groups + day-off employees
- per shift group: shift name, start, end, list of employees
- per employee: id, name, department name
- scope: everyone under the logged-in manager (full hierarchy)

**Filter lists**
- shift types (id, name)
- departments under the manager, employees under the manager

**Home calendar**
- shift events in the existing calendar response: new `referenceId`, title = shift name, start / end time, date

## 5. Constraints

- Follow the app's existing structure (screen → cubit → use case → repository → Retrofit service) and the patterns of the Requests tab.
- Every public cubit function gets a comment saying when it's called during app use (from `CLAUDE-Mistakes.md`).
- When changing #HomeScreen calendar or #MoreScreen, check both the employee and the manager views (from `CLAUDE-Mistakes.md`).
- Until the API exists, the screen can be built against a fake repository, swapped by DI.
