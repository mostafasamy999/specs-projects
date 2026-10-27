# 001 New Activities — Feature overview (HIGH-LEVEL)

> **Doc v2.0 · 2026-10-27 · spec v1.2 · synced to changelog CL-10**

## What it is

New Activities is the TalentLink360 screen where managers and employees track **Visits** (on-site, with a place, category and optional check-in/out) and **Tasks** (everything else). It opens on a dashboard of counts, switches to a searchable, filterable, paged list, and lets the user create, edit, reschedule, change status, add notes, update progress, and start/complete an activity. It was built as a separate module next to the old Visit/Task screens, so the old screens keep working while this one replaces them.

## Scope

**In scope**
- Dashboard: Visits vs Tasks donut, status breakdown, late count, Tasks today/current/previous
- List with paging, search, sort, quick-filter chips and a full filter sheet
- Three ways to view the list: assigned occurrences (Current / Previous) and Main (the activities themselves)
- Scopes: All, My team, My activities, Private, plus a department/employee picker
- Create and edit, with an employee picker that shows who's busy
- Detail screen actions: check-in/out, start, complete, change status, reschedule, notes, progress, timeline
- Master screen: enable/disable
- Loading, empty and error states. Arabic and English

**Out of scope**
- Changing or removing the old Visit/Task module
- Backend changes. The app only calls the existing endpoints
- Other app modules

## Status

**Built end to end. 5 gaps left (Previous date range, 4-level workload status, dead fake data, per-action permission flags, tests). Backend answers block 2 of them (Q12, Q13), and 14 more API/product questions haven't been sent yet.**

## Where to look next

| Need | File |
|---|---|
| Change code: files, layers, mappers, packages | [current-state-codebase-logic-tech.md](current-state-codebase-logic-tech.md) |
| Which endpoint/field, and what value it takes | [api-contracts.md](api-contracts.md) |
| Every user action and its rules | [user-scenarios-rules.md](user-scenarios-rules.md) |
| Test cases and Maestro flows | [test-cases-maestro.md](test-cases-maestro.md) |
| Latest version and history | [changelog.md](changelog.md) |
| What's blocked, what to do next | [next-tasks-open-questions.md](next-tasks-open-questions.md) |
