# Utah Command performance log

## 2026-10-19 — Command edition 0.20.1

Baseline: commit a408a932219c2c470588a9c30c7c9444ebd5e355 (0.20).
Scope: the main Command game engine. The separate legacy Supply edition is unchanged.

### Measured bottlenecks and changes

A Node CPU profile of 64 turns across eight scenarios (standard and operational rules)
identified supplyRoute and commandRoute among the main engine costs. Repeated array sorting
in route searches and temporary arrays from occupancy scans were avoidable work.

- Replaced whole-queue sorting in movement, mission, supply and movement-overlay searches
  with one shared binary heap. Stable insertion order preserves equal-cost route choices.
- Build a living-unit occupancy set once per movement search instead of filtering and
  scanning the unit list for each neighboring hex.
- Only compute enemy observation for cautious supply routes, the policy that uses it.
- Keep all search state local to the call. No cross-turn cache or invalidation dependency.

### Timing evidence

Linux, Node v24.19.0. Median of seven alternating batches, 320 calls per batch,
covering eight scenarios with standard and operational rules. Timings are engine-only,
not measurements of iPad Safari, map drawing, taps, networking, or total application speed.

| Workload | Before, ms / batch | After, ms / batch | Speedup |
| --- | ---: | ---: | ---: |
| Movement routes | 118.45 | 52.83 | 2.24x |
| Supply forecast | 48.06 | 38.60 | 1.25x |
| Mission planning | 582.19 | 373.56 | 1.56x |
| Movement overlay | 20.25 | 16.28 | 1.24x |

A separate sample of up to 192 resolved turns found a maximum of 31.73 ms
(Utah, standard rules, first turn). This sample is not a worst-case guarantee;
large custom scenarios and slower devices may behave differently. Processes were
running in a shared test environment, so absolute timings are approximate.

### Behavior verification

- All 21 supplied automated checks passed after the engine changes.
- 38,196 direct route comparisons matched the baseline exactly, including route
  coordinates and tie choices, all weather settings, supply sectors, routing policies,
  headquarters, and standard / advanced / operational rules.
- 96 complete battles produced identical plans and complete state after every turn:
  1,272 matching turns, including RNG seeds, losses, supply, positions and reports.
- JavaScript syntax check passed. Actual iPad rendering and device timing remain untested.

Raw results and repeatable benchmark / equivalence scripts are in checks/.
The equivalence script takes a baseline engine file; use the engine from the baseline
commit above. Run from repository root:

    node checks/performance-benchmark.cjs /absolute/path/to/baseline-engine.cjs
    node checks/route-equivalence.cjs /absolute/path/to/baseline-engine.cjs

### Follow-up watch list

These are candidates, not confirmed user-visible stalls:

1. Mission planning still has the largest cost among the four benchmark workloads.
   Measure route reuse within one planning pass before introducing broader caching.
2. render() repeatedly builds planning views and regenerates map / panel markup.
   Profile actual Safari interactions before changing rendering or event handlers.
3. Custom scenario validation can repeat during terrain lookups. Any optimization must
   preserve edits to embedded scenario terrain and scenario replacement behavior.
4. Path arrays are still copied as routes expand. Consider predecessor links only if
   memory / CPU measurements justify the added complexity.
5. Measure a large custom scenario, operational reinforcements, and attached-support
   planning on an actual iPad. Log scenario, turn, rules, unit count, action, duration,
   and reproducible save for any visible delay. No persistent telemetry is enabled.

## Design discussion — future supply dumps

Current supply uses map-edge sources and per-unit reserves, with no stocked dump objects.
Consider command-level placement / relocation orders for forward supply points, with
subordinates managing distribution. Travel distance, route access, exposure, finite
stock and relocation downtime should matter if implemented. This is a design note;
this performance patch does not change supply rules.

## Design discussion — headquarters staff recommendations

Requested by Larry on October 19, 2026. Proposed, not implemented in 0.20.1.

- Regiment reports use S1, S2, S3 and S4; division / corps / army reports use G1–G4.
- Personnel: loss / fatigue / recovery and reserve recommendations.
- Intelligence: observed threats, reconnaissance needs, report age and uncertainty.
- Operations: missions, sequencing, reserve use and support attachments.
- Logistics: proposed supply priorities / delivery levels, reallocations and supported attachments.
- Advice must explain evidence, proposed changes and tradeoffs, with Accept / Modify /
  Dismiss choices. Show the exact allocations or assignments before applying them.
- Recommendations alone never change orders, supply, attachments or authority. Accepting
  uses the same validated command actions as manual orders. Respect finite resources,
  existing assignments, command links, echelon authority and fog of war.
- Use information available to the headquarters, label stale intelligence, avoid repeated
  prompts after dismissal, and keep existing orders when the commander declines.
- Show staff advice inside the selected headquarters report / visit view; preserve the
  commander's ability to take or leave it without micromanaging subordinate execution.

## Design discussion — reconnaissance patrols

Requested by Larry on October 19, 2026. Proposed, not implemented in 0.20.1.

Add a Send reconnaissance patrol action to an eligible formation. The commander picks
an area or route to investigate; a subordinate manages a small detached patrol while
the battalion continues its mission or holds. Avoid mandatory control of another counter.
Represent preparation, travel, observation, report delay, recall / return and possible
loss or overdue status. Account for a temporary commitment of parent strength / readiness
and reconnaissance assets; this is not free or instant map revelation. Reports use
observed information, timestamps and uncertainty. S2 / G2 may recommend a patrol, and
results should feed intelligence and the Command Activity Log. Exact detachment size,
visibility rules, movement, risk and resource cost remain design decisions.
