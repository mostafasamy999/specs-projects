# 004 Shifts — Current state: codebase, logic, tech (LOW-LEVEL)

> **Doc v0.3 · 2026-11-12 · synced to changelog CL-3**
> Code in `~/StudioProjects/talentlink`, branch `feautre/shift`, 2026-11-12. §0 lists what is built; §1–§3 are where it plugs in and what it reuses.
> Audience: an AI or dev building this feature cold. Rules (R1–R35): [user-scenarios-rules.md](user-scenarios-rules.md).

All paths are relative to `lib/src/`.

## 0. What is built (CL-2)

| Piece | Path | Notes |
|---|---|---|
| Entities | `domain/entities/shifts/`: `shift.dart`, `shift_day.dart`, `team_shift.dart`, `shift_filter.dart` | `ShiftFilter` holds the period + filters of one tab; `shiftWeekStart()` is the Saturday rule |
| Repository + use cases | `domain/repositories/shifts/`, `domain/usecase/shifts/` (my shifts, team shifts, filter options) | |
| Sample data | `data/repositories/shifts/fake_shifts_repository.dart` | Registered in `di/repository_injector.dart`. **Replace with the real repository when the API exists** and delete the file |
| Cubit | `presentation/blocs/shifts/shifts_cubit.dart` + `shifts_state.dart` | One shared period / filter for both tabs, each with its own status / data (R29). Every change reloads both. A newer load of a tab wins over a slow older one |
| Screen | `presentation/screens/shifts/shifts_screen.dart`, `shifts_args.dart`, `widgets/` | Built on the general `SliverOrganizerWidget` (as the Requests screen): the tabs and period bar are the pre-fixed children (floating: they hide on scroll down and return on scroll up), the days are the main content (`SliverOrganizerContent.list` for My shift, with its empty child; a custom sliver for My team, with `PinnedHeaderSliver` day headers) |
| Route | `config/routes/routes_manager.dart`: `Routes.shifts`, `ShiftsArgs(focusDate)` | |
| More entry | `more_items_widget.dart`: "Shifts" row after the upcoming calendar | Shown to everyone (R3) |
| Strings | `lib/l10n/intl_en.arb`, `intl_ar.arb` (+ generated) | New keys: shifts, myShift, myTeam, dayOff, shiftNotAssignedYet, noMatchingShift, shiftType, shiftThisWeek / NextWeek / LastWeek / CustomRange, shiftsLoadError(+Hint), shiftsEmptyTeam(+Hint), allEmployees, allDepartments, searchDepartments, shiftMorning / Evening / Night (sample data only) |
| Tests | `test/presentation/blocs/shifts/shifts_cubit_test.dart` (18), `test/presentation/screens/shifts/shifts_screen_test.dart` (9: both tabs, filter, picker, states, Arabic) | Set `SHIFTS_SHOT_DIR=<folder>` when running the screen test to also save a PNG per step |

**Not built:** the Home calendar shift event and its tap (§1 row "Home calendar tap", needs Q2); the real API; the real team permission (§1 row "Permission").

**Stand-ins to remove:**
- The team tab uses `checkEssPermission(RequestTypeId.myTeamAttendance)` with a `TODO(spec 004 Q9)` in `shifts_screen.dart`. Replace it with the new shift-team permission.
- The shift icon (sun / sunset / moon) comes from the start time (`Shift.partOfDay`), not from the API. Material icons are used in place of the design's Lucide icons.

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
- per day: date, `isAssigned` (week published or not), list of shifts. Takes `typeId` (optional). With it, returns only shifts of that type and leaves out assigned days with none of that type
- per shift: id, name, start time, end time, shift type id, branch name, visits count, tasks count

**My team (period from – to, filter: shift type, department ids, employee ids)**
- department / employee: the lists of ids from the one picker. An employee matches when in the employee ids or under one of the department ids; both empty means everyone
- with a shift type: only groups of that type, no day off group, and an assigned day with none of that type is left out
- per day: date, `isAssigned`, list of shift groups + day-off employees
- per shift group: shift name, start, end, list of employees
- per employee: id, name, department name; in a shift group also branch name, visits count, tasks count (not in the day-off group)
- scope: everyone under the logged-in manager (full hierarchy)

**Filter lists**
- shift types (id, name)
- the department tree under the manager with each department's employees (same shape as the Activities tree)

**Home calendar**
- shift events in the existing calendar response: new `referenceId`, title = shift name, start / end time, date

## 5. Constraints

- Follow the app's existing structure (screen → cubit → use case → repository → Retrofit service) and the patterns of the Requests tab.
- Every public cubit function gets a comment saying when it's called during app use (from `CLAUDE-Mistakes.md`).
- When changing #HomeScreen calendar or #MoreScreen, check both the employee and the manager views (from `CLAUDE-Mistakes.md`).
- Until the API exists, the screen can be built against a fake repository, swapped by DI.
