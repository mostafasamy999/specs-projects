# qa2 — Test scenarios generated from the spec

> 2026-10-27 · from the eight spec files at changelog **CL-10** · model `claude-opus-5-5`
> Method: the **ai-test-generation** skill (petrkindlmann/qa-skills @ 6243425, in `ai config/claude/skills/qa-test-files/`), with its BOUNDARIES edge-case checklist and the test-design techniques from **qe-test-design-techniques** (boundaries, state transitions).

This is a second, independent set of test scenarios, written fresh from the spec. It doesn't replace [qa/qa-review-v1.3.md](../qa/qa-review-v1.3.md). Its IDs are its own (an ID like `DSH-02` here isn't the same case as `DSH-02` there).

## Files (read in order)

| Step | File | What's in it |
|---|---|---|
| 1 | [01-requirements.md](01-requirements.md) | 74 stated requirements (REQ), 10 inferred ones (IMP) that need confirming, entities, 11 business rules |
| 2 | [02-risks-invariants.md](02-risks-invariants.md) | 21 risks ranked by likelihood × impact, 12 invariants, 14 open ambiguities (A-xx), and the BOUNDARIES edge cases |
| 3 | [03-coverage-matrix.md](03-coverage-matrix.md) | 147 scenarios: what each covers, priority, how it can be run, review status |
| 4 | [04-test-scenarios.md](04-test-scenarios.md) | Test data, then each scenario as Given / When / Then |
| 5 | [05-oracles.md](05-oracles.md) | How to check each scenario: screen, data, request log, and what must not happen |

The skill's Step 6 (test code) isn't here. Maestro flows live in `qa/maestro/`, and 122 scenarios are marked **M** (Maestro can check them). Step 7 (review) is the **Review** column in the matrix.

## Numbers

| | |
|---|---|
| Scenarios | 147 (P0 35 · P1 59 · P2 40 · P3 13) |
| Ready to run | 127 KEEP + 4 KNOWN (expected to fail on DEF-01, DEF-06, DEF-10) |
| Waiting on an answer | 16 DEFER (Q12, Q13, Q16/Q28, Q19, Q25/Q26, Q27, DEF-07/08/09, and new questions) |
| How to run | 122 Maestro · 9 request log · 14 need a forced reply, network or device setting · 2 blocked |

## Before running

1. Create the test data in [04-test-scenarios.md](04-test-scenarios.md) §0 (accounts U-TEAM, U-EMP, U-SOLO and activities D1–D13, D-PRIV, D-BULK).
2. To automate the detail, timeline and master scenarios, first add element IDs to those screens (listed at the end of [05-oracles.md](05-oracles.md)).
3. When an ambiguity A-xx is answered, update the scenario's expected result and change DEFER to KEEP.
