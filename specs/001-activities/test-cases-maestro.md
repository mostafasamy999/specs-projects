# 001 New Activities — Test cases and Maestro (INDEX)

> **Doc v2.0 · 2026-10-27 · synced to changelog CL-10**
> A pointer file. It doesn't list test cases. The sources of truth are below. To write **new** cases from behavior, start from [user-scenarios-rules.md](user-scenarios-rules.md).

## Sources of truth

| What | Where |
|---|---|
| Test cases (current version) | [qa/qa-review-v1.3.md](qa/qa-review-v1.3.md) §3 (cases), §6 (smoke and regression suites), §7 (run log and defects) |
| Which case has a Maestro flow | [maestro/COVERAGE.md](maestro/COVERAGE.md) (generated) |
| Maestro flows | [maestro/flows/](maestro/flows/) (one folder per area), [maestro/qa-testcases/](maestro/qa-testcases/) (`<ID>-maestro.yaml`, written step by step from §3), [maestro/subflows/](maestro/subflows/) (login, open list/dashboard, pick type/scope, …) |
| How to write and run flows | [qa/maestro-guide.md](qa/maestro-guide.md) |
| Is QA behind the changelog? | [qa/sync-status.md](qa/sync-status.md) (generated) |

## Numbers (2026-10-27)

| | Count |
|---|---|
| Cases designed in v1.3 | **236** |
| Kept in §3 as Maestro-testable | **149** |
| → with a Maestro flow | **34** |
| → UI part automatable, request part checked from the app log | 21 |
| → flow not written yet | 93 |
| → blocked | 1 |
| Moved out as **manual-only** (CL-10) | **87** (still in git: `git show 1db1005:specs/001-activities/qa/qa-review-v1.3.md`) |
| Last results in §3 | 3 failed, 146 not run / blocked / waiting on a product answer |
| Open defects | DEF-01 – DEF-09 (QA review §7) |

## Why 87 cases are manual-only

| Reason | Examples |
|---|---|
| The expected result is only in the **request body** (Maestro can't see network traffic) | TS-06, QF-06, FLT-16, PAG-01, CRT-05, DET-06, API-01–09 |
| Needs a **forced server response** (errors, malformed or missing fields) | DSH-06, LST-07, PAG-06, PRG-08, ASG-06 |
| Needs a **slow or dropped network** | SRC-13, PAG-13, DET-29 |
| Needs a **different device clock or time zone** | TS-09, TS-10 |
| The **feature isn't built or documented** yet (Q12, Q13, Q19, G-14) | workload levels, permission flags, search fields |

Check these by running the app with `flutter run` and reading the request log (the app logs every request). QA review §7 run R1 shows how.

## Running

All commands below run from this folder (`specs/001-activities/`). The scripts find their own location, so they also work from anywhere else.

Once, create the env file and fill in the test account and `DEVICE`:

```bash
cp maestro/.env.example maestro/.env
```

Run every flow:

```bash
maestro/run.sh
```

`maestro/run.sh flows/quick_filters/QF-01.yaml` runs one flow (the flow path is relative to `maestro/`). `maestro/run.sh --include-tags=smoke` runs the smoke suite. Results go to `maestro/results/report.xml`. The default run covers `flows/**` only (`config.yaml`), so pass `qa-testcases/` files by path. Use a profile or debug-from-`flutter run` build. Details are in [maestro-guide.md](qa/maestro-guide.md) §7.

After adding or changing flows, regenerate the coverage index:

```bash
python3 -I maestro/coverage.py
```

## Keeping QA in sync with the changelog

- Every changelog entry is numbered **CL-n** and has a **QA impact** line.
- The QA review records `**Synced to changelog:** CL-n`, and every flow/subflow has `# synced: CL-n`: the last change it was **checked against** (not merely touched).
- `python3 -I qa/sync_check.py` compares those markers with the newest CL. It prints a summary, rewrites `qa/sync-status.md` (what's behind, and which CL entries' QA impact to apply), and exits 1 if anything is behind, so it can run in CI or a git hook.
- **Today:** the QA review and all flows are synced to **CL-10**.
- For each new CL: update the review first, then the flows named in its QA impact, then check the rest and bump their markers. Steps are in [maestro-guide.md](qa/maestro-guide.md) §9.
