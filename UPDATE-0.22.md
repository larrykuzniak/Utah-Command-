# Utah Command 0.22 — Combat decisions and subordinate SITREPs

- The opponent evaluates combat odds and nearby friendly support before committing ground formations. In advanced rules, it prepares attacks against covered defenders and uses deliberate assaults when preparation is complete. Supporting batteries choose suppression when friendly ground troops are adjacent, without inspecting the player's queued orders.
- Operational fatigue reduces firepower by 8% per fatigue level (maximum 32%). Existing rest orders recover fatigue. German formations receive one reserve point per turn through an open route rather than automatically refilling to three.
- Movement execution checks occupied hexes as well as route legality.
- Every friendly field formation produces a dated SITREP after resolution, including actual position, movement or fire result, net strength losses, fatigue, reserves, suppression, ammunition for batteries, supply needs, and command link problems. Reports appear in subordinate history and the Command Activity Log.
- Advanced and operational effects still require their existing rule switches. Standard combat remains simplified. No claim of historical calibration is made. Existing saves migrate through the existing loader.

Validation: existing 48-game command services suite, command desk UI integration suite, visibility suite, and additional deterministic multi-scenario realism checks. Route-refactor equivalence testing is inapplicable to intentionally changed whole-battle outcomes.

## Previously agreed additions

- Mission Command → Coordinated attack: select the main effort, an objective, and one or more supporting maneuver formations. They approach under normal mission rules and attack the same observed target when all elements are ready, adjacent, supplied, and connected to regimental command. The main effort reports who is delaying execution. Direct orders override the mission; reassignment, losses, pauses, missing approvals, and broken links can hold the attack. This coordinates actual fire rather than adding an artificial combat bonus.
- Direct Defend button: remain in place with one additional cover point, recover one fatigue point per turn, consume normal supplies, and retain the order until replaced. Defending does not restore strength as resting does.
- Command Visit on the selected friendly unit: opens its current report, readiness, orders, and regimental command link. This is a command briefing, not simulated commander travel or a new source of enemy intelligence.
- Existing 0.21 activity log, supply points, recon patrols, staff recommendations, and counter identifiers remain included.

Added validation covers coordination readiness and holds, common targets, direct overrides, invalid assignments, persistent defense, actual UI controls, and save validation. UI checks run in a simulated DOM; physical iPad touch/layout testing remains outstanding.

## 0.22.1 — strength and supply at a glance

Friendly map counters carry two small labeled condition dots: S for strength and L for logistics/supply. Strength is green at 7–10, yellow at 4–6, red below 4. Supply is green at 2–3 reserves with an open last reported route, yellow at 1 reserve or a cut last reported route, and red at zero. These show current friendly reports, excluding planned deliveries. Selecting a unit provides exact strength, reserve figures, and an explanation. Enemy supply is not exposed. The offline cache advances to receive the changed shell.

## 0.22.2 — delayed reinforcements retry

Scheduled eastern-edge reinforcements now wait when their entry hex is occupied, announce the delay and exact hex in dispatches, and retry on every subsequent turn. Each unit arrives once; destroyed reinforcements do not return. Existing saves beyond the arrival turn recover missing reinforcements when the entry clears. Applies to both standard and Supply editions; operational Utah landing waves keep their existing arrival rules.

Reduced-strength units now have a yellow square around the counter (4–6 strength); critical-strength units have a red square (1–3 strength). A single larger L dot shows supply: green at 2–3 reserves with an open reported route, yellow at 1 reserve or a cut reported route, red at zero. A persistent notice above the map names reduced/critical units, low/empty reserves, cut reported routes, and eliminated formations, including in full-screen mode. The separate Supply edition now also has condition lights and notices. These warnings describe current condition, not predicted incoming combat damage.

## 0.22.3 — exclusive support assignments

Support already assigned to another formation is grayed out and labeled Assigned elsewhere, with its current host named. Only the owning formation can release it through the attachment desk. Transfers require release before attaching to a new host; the engine also rejects direct reassignment. Applies to reserve and on-map support in both editions.
