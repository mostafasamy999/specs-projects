# 004 Shifts — Design prompt

Paste the prompt below into Claude. Attach these screenshots from the app so the design matches it:
1. Requests tab (my / team toggle + list)
2. Requests filter bottom sheet (open)
3. Home screen with the calendar (week mode, a day with events)
4. More screen (work overview section)

---

```
Design a new mobile screen "Shifts" for TalentLink360, an HR app (Flutter, iOS + Android).
It must look like part of the existing app: match the attached screenshots
(Requests tab, Requests filter sheet, Home calendar, More screen) — same app bar,
tabs toggle, cards, bottom sheet, spacing and icons (Lucide, outline).

## Design tokens (from the app code)
- Primary (brand red): #EB001B · brand700 #BE0014 · brand50 #FFEFEF · brand100 #FFD9DC
- Page background: #F7F8FA (neutral50) · cards: #FFFFFF, radius 12–16, shadow rgba(0,0,0,0.05–0.06) blur 12
- Neutrals: 100 #EFF1F5 · 150 #E4E7EE · 200 #D4D9E2 · 300 #B6BDCB · 400 #8E97A8 · 500 #6B7488 · 700 #3A4150 · 900 #14161C
- Text black #222222 · secondary gray #989898 · border #D6D6D6
- Status: success #16A34A / bg #E7F6EC · warning #B45309 / bg #FBF1E2 · error #B0000A / bg #FBE6E6 · info #3B71CA
- Fonts: Poppins (English), Almarai (Arabic). The app supports RTL.
- Bottom nav: frosted white bar, hairline top border, 5 tabs (Home, Activities, Requests, Payslip, More), 23px icon over 11px semibold label. The Shifts screen is pushed on top, so no bottom nav on it.

## What the screen does
Users see their work shifts for this week or any date range. The admin assigns shifts every week.
An employee can have 0, 1 or 2+ shifts a day, and different shifts on different days.
A shift shows only: name, start time, end time (e.g. "Morning · 08:00 – 14:00").
Managers also see the shifts of everyone under them.
Everything is read only: no editing, no tap actions on shifts or employees.

## Layout
1. App bar: back, title "Shifts", filter icon with a small count badge (like Requests).
2. Tabs toggle: "My shift" / "My team". Employees without the team permission see no toggle.
3. Period bar: "12 – 18 Nov 2026", previous / next week arrows, a "Today" chip. Week is Saturday → Friday.
4. My shift tab: one card per day of the period, in order:
   - day name + date on the left; today's card highlighted (brand red accent)
   - shift lines on the right, one per shift, sorted by start time (a day can have 2)
   - "Day off" (muted) when the week is assigned and the day has no shift
   - "Not assigned yet" (warning style) when the admin hasn't assigned that week
5. My team tab: grouped list:
   - sticky day header (day + date)
   - shift group header: name, start – end, employee count chip
   - employee rows: avatar initials, name, department (one employee can be in 2 groups the same day)
   - a "Day off" group at the end of each day
   - whole day "Not assigned yet" when the week isn't assigned
6. Filter bottom sheet (same style as Requests filter), with Reset and Apply buttons at the bottom:
   - My shift: date range, shift type
   - My team: date range, shift type, department, employee (search in a list)

## Frames to deliver
1. My shift — current week, employee (no tabs), mix of 1 shift, 2 shifts, day off, today highlighted
2. My shift — next week "Not assigned yet"
3. My team — manager, a day with Morning (6), Evening (4), Day off (3)
4. Filter sheet — My shift fields
5. Filter sheet — My team fields, with values selected
6. My shift with an active filter (badge "2", custom range "1 – 15 Dec")
7. Loading (shimmer), error with retry, empty team
8. Home calendar (week mode) with a shift event on the selected day — the event row that opens this screen
9. More screen work overview with the new "Shifts" row after "Upcoming calendar"
10. Frame 1 in Arabic (RTL)

Phone frame 390 × 844. Keep it clean and consistent with the screenshots; don't introduce new colors
or component styles that the app doesn't already use.
```
