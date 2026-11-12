# 004 Shifts — Feature overview (HIGH-LEVEL)

> **Doc v0.1 · 2026-11-12 · spec v0.1 draft · synced to changelog CL-1**

## What it is

A new **#ShiftsScreen** where the user sees their work shifts for this week or any date range. The admin assigns shifts every week. An employee can have **more than one shift a day** (for example morning and evening on Friday) and different shifts on different days. A day with no shift is a **day off**. A week the admin hasn't assigned yet shows **not assigned yet**.

Managers also get a **My team** tab with the shifts of everyone under them (the whole hierarchy, not only direct reports). That tab is gated by a new ESS permission.

The screen opens from **More** (work overview) and from a **shift event** in the Home calendar.

## Why

- Employees need to know when they work before they check in, and shifts change every week.
- Managers need to see who works when across their team without asking HR.

## Scope

**In scope**
- #ShiftsScreen with two tabs: **My shift** and **My team** (team tab: new ESS permission only)
- Period navigation: current week by default, previous / next week, any date range from the filter
- My shift: each day of the period with its shifts (name, start, end), or "Day off", or "Not assigned yet"
- My team: employees under the manager, grouped by day and shift, each item showing employee name and department
- Filter bottom sheet with apply / reset (date range, shift type; on team tab also department and employee)
- Entry from #MoreScreen → work overview
- Entry from a shift event in the #HomeScreen calendar, opening the screen on that day
- Loading, empty, error and pull-to-refresh states, English and Arabic (RTL)

**Out of scope (for now)**
- Shifts that cross midnight (overnight shifts)
- Leaves and holidays on the shift screen (only shifts and day off)
- Shift swap requests
- Notification when the admin publishes a week
- Offline cache
- Backend API contracts (no `api-contracts.md` yet; the data the screen needs is listed in [current-state-codebase-logic-tech.md](current-state-codebase-logic-tech.md) §4)
- Any editing of shifts from mobile (the admin assigns them)

## Status

**Spec draft v0.1. Nothing built.** Waiting on the API (out of scope for now) and the open questions in [next-tasks-open-questions.md](next-tasks-open-questions.md).

## Where to look next

| Need | File |
|---|---|
| Every rule, scenario and screen layout | [user-scenarios-rules.md](user-scenarios-rules.md) |
| Where it plugs into the code, what to reuse, data the UI needs | [current-state-codebase-logic-tech.md](current-state-codebase-logic-tech.md) |
| History of the requirement and decisions | [changelog.md](changelog.md) |
| What's left, open questions | [next-tasks-open-questions.md](next-tasks-open-questions.md) |
