# 004 Shifts — User scenarios and rules

> **Doc v0.4 · 2026-11-12 · spec v0.4 · synced to changelog CL-8**
> What the feature must do. Where it goes in the code: [current-state-codebase-logic-tech.md](current-state-codebase-logic-tech.md).
> Rules marked **(Assumed)** are not confirmed yet; each one points to a question in [next-tasks-open-questions.md](next-tasks-open-questions.md).

## 1. Screen layout

```
#ShiftsScreen
1- app bar ( title "Shifts", filter icon with count badge )
2- tabs ( my shift / my team ( new ESS permission only ) )
3- period bar ( "12 – 18 Nov", previous / next week, today )
4- my shift tab: one card per day of the period
     day name + date ( today highlighted )
     shifts of that day ( name, start – end ), one line each, 0..n
     or "Day off" / "Not assigned yet"
5- my team tab: list grouped by day → shift
     day header
       shift header ( name, start – end, employee count )
         employee item ( name, department )
       "Day off" group ( employees with no shift that day )
6- filter bottom sheet ( apply / reset )
```

## 2. Rules

### Access and entry

| # | Rule | Why |
|---|---|---|
| R1 | #ShiftsScreen opens from #MoreScreen → work overview, as a row "Shifts" after "upcoming calendar". | Next to the other work overviews (calendar, attendance, leave balance). |
| R2 | #ShiftsScreen also opens when the user taps a **shift event** in the #HomeScreen calendar. It opens on the **My shift** tab, on the week that contains the event's day, scrolled to that day and highlighted. | The user tapped their own shift for that day. |
| R3 | Every user can see the **My shift** tab. **(Assumed, Q1)** | Every employee has shifts. |
| R4 | The **My team** tab shows only when the user has the new shift-team ESS permission (`checkEssPermission`, id TBD). Without it, the screen shows My shift only, with no tab bar. | Managers only, same pattern as team requests. |
| R5 | My team shows **everyone under the manager in the hierarchy**: direct reports and their reports, down to the bottom. | Answer 6. |

### Home calendar shift event

| # | Rule | Why |
|---|---|---|
| R6 | The Home calendar shows a shift event on every day the user has a shift. A day with 2 shifts shows 2 events. A day off shows no shift event. | "If the user should work that day, there is a shift event." |
| R7 | The event shows the shift name and start – end. | Same data as the shift screen. |
| R8 | The event comes from the existing calendar data, as a new event type (reference id TBD, Q2). | The Home calendar and Upcoming Calendar already route events by reference id. |

### Period

| # | Rule | Why |
|---|---|---|
| R9 | The first time the screen opens (from More) the period is **today and the next 6 days** (7 days). From a Home calendar event it is 7 days starting at that event's day. | Product owner, 2026-11-12: no fixed week, "only the first time displays the current 7 days". Replaces the Saturday – Friday week. |
| R10 | There is no fixed week start. The 7 is only the first period; after that the length is **whatever the user selects**. | Replaces "the week starts on Saturday" (Q3 closed). |
| R11 | The previous / next arrows move the period by **its own length** (7 days at first, 3 days after selecting a 3-day range) and reload. They always work, on a selected range too. | Product owner. |
| R12 | A date range picked in the filter replaces the period, with **no limit on its length**; picking a "from" after "to" (or the reverse) moves the other end. | Product owner. |
| R13 | The period bar always shows the period in use. | The user knows what they're looking at. |

### My shift tab

| # | Rule | Why |
|---|---|---|
| R14 | One card per day of the period, in date order, including days off. | The full week at a glance. |
| R15 | A day can have **0, 1 or more** shifts. Each shift is one line: name, start – end, sorted by start time. | Employees can have 2 shifts a day. |
| R16 | A day with no shift, in a week the admin has assigned, shows **"Day off"**. | Answer 4. |
| R17 | A day in a week the admin hasn't assigned yet shows **"Not assigned yet"** (not "Day off"). How the app knows a week is assigned comes from the API (Q5). | An empty future week mustn't look like a week off. |
| R18 | Today's card is highlighted. Past days stay visible. | Orientation. |
| R19 | Shift cards are read only, no tap action. | The admin assigns shifts; the card already shows all shift data. |

### My team tab

| # | Rule | Why |
|---|---|---|
| R20 | Grouped by day (date order), then by shift (start time order). Each shift group shows name, start – end and how many employees. | Answers "who works when" without a wide grid. |
| R21 | Employee item shows **name and department**. | Answer 2. |
| R22 | An employee with 2 shifts on the same day appears under both shifts. | Each group is complete. |
| R23 | Employees with no shift that day are listed in a "Day off" group at the end of the day. Days of a not-assigned week show "Not assigned yet" for the whole day. | Same meaning as My shift. |
| R24 | Employee items are read only, no tap action. **(Assumed, Q6)** | Nothing else to show yet. |
| R36 | Picking a department in the picker picks all its employees; picking every employee of a department picks the department. The filter keeps the picked department ids and employee ids. | Behavior of the shared picker. |
| R37 | The day the screen was opened on from the Home calendar (R2), when it isn't today, has a light red border and background. Today keeps the red border and the Today chip. | The user sees which day they came for. |
| R38 | Tapping the **period title** ("12 – 18 Nov 2026") opens a small bottom sheet with only the start and end day, in the same frame, header, date fields and Cancel / Apply as the main filter. **Apply** sets the period and reloads both tabs; the other filters stay. **Reset** (header) goes back to 7 days from today, also keeping the other filters. | Product owner: a quick way to change only the dates. |
| R25 | The manager's own shifts are on My shift, not in My team. **(Assumed, Q7)** | Avoid showing them twice. |

### Filter

| # | Rule | Why |
|---|---|---|
| R26 | The filter icon in the app bar opens a bottom sheet built like the Activities filter: title with **Reset** at the end, the shift type as chips (tap the chosen chip again to clear it; there is no "All" chip), on My team **one field for departments and employees** ("Company · department · employee", placeholder "Any department") that opens the shared department tree picker with search, Clear and Cancel / Select, the start and end day on one line, then **Cancel** and **Apply**. | Product owner: one field like the Activities screen. |
| R27 | My shift fields: **date range, shift type**. | Answer 8. |
| R28 | My team fields: **date range, shift type, and the one department / employee field** (multi-select: departments with their employees). The field reads like "Sales · Khalid Mansour" or "Sales · 3 employees". | Same field as Activities. |
| R29 | **Both tabs share one period and one filter.** Changing the week, Today, Apply, Reset or pull to refresh reloads both tabs (the team one only for managers), so switching tabs never waits for data. The My shift tab shows only the range and type fields; department and employee still apply to My team while My shift is shown. | Answer from the product owner, 2026-11-12. Replaces "each tab keeps its own filter". |
| R30 | **Apply** reloads both tabs with the filter and closes the sheet. **Reset** (header) puts the filter back to 7 days from today with no field and reloads. Cancel, swipe down and the picker sheets' Cancel drop the draft: nothing changes until Apply. | Same as Activities. |
| R31 | The filter icon shows a count of active filter fields. The **period counts as one whenever its from or to differs from the first period** (7 days from today), including after the arrows moved it. Then shift type, and on My team the department / employee field (one count, however many are picked). Reset brings it back to 0. | The user sees the screen is not showing the default view. |
| R32 | The shift type is sent to the API (both tabs). The API returns only matching shifts, and **leaves out** any assigned day with none of that type, on My shift and on My team (no day off either). Nothing is filtered or hidden on the phone and there is no "No matching shift" placeholder. When nothing is left, the tab shows an empty state ("No shifts to show." / "No team members to show."). A not-assigned day still shows "Not assigned yet". **(Assumed, Q8)** | Answer from the product owner, 2026-11-12. Replaces the "No matching shift" days. |
| R33 | Pull to refresh reloads with the current filter. | Standard in the app. |

### States

| # | Rule | Why |
|---|---|---|
| R34 | Loading: shimmer for the list. Error: message with retry. My team with no employees: empty message. | Standard app states. |
| R35 | Times use the device's locale format; all labels in English and Arabic, RTL in Arabic. | App standard. |

## 3. Scenarios

**S1. Employee checks the week.** Ahmed opens More → Shifts. He sees Sat–Fri of this week: Saturday "Morning 08:00 – 14:00", Sunday "Evening 16:00 – 22:00", Monday "Day off", Friday "Morning 08:00 – 12:00" and "Evening 16:00 – 20:00". Today is highlighted. No tab bar (no team permission).

**S2. Next week not assigned.** Ahmed taps next week. The admin hasn't assigned it, so every day shows "Not assigned yet".

**S3. From the Home calendar.** On Home, Ahmed selects Thursday; the calendar shows the event "Morning 08:00 – 14:00". He taps it. #ShiftsScreen opens on My shift, on Thursday's week, scrolled to Thursday, highlighted.

**S4. Any date.** Ahmed opens the filter, picks 1 – 15 Dec, taps apply. The period bar shows "1 – 15 Dec" and the filter icon shows 1. Next moves to 16 – 30 Dec. Reset returns to the current week.

**S5. Manager checks the team.** Sara has the team permission. She opens My team: each day lists "Morning 08:00 – 14:00 (6)", "Evening 16:00 – 22:00 (4)", "Day off (3)", each with employee name and department. Employees under her direct reports are included.

**S6. Manager filters.** Sara filters department "Sales" and shift type "Evening". Only Sales employees on evening shifts show. She switches to My shift: the same period and shift type apply there (department and employee only narrow My team).

**S7. Two shifts, same employee.** Omar works morning and evening on Friday. On My team, Friday shows Omar under both groups.
