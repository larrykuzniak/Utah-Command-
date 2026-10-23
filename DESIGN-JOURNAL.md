# Utah Command — Designer's Journal

*The story behind a command-level Normandy wargame*

**Design lead:** Larry Kuzniak  
**Development assistance:** OpenAI ChatGPT/Codex  
**Journal started:** October 22, 2026

> This is a living design journal. It records the reasoning behind the project and distinguishes ideas, experiments, and shipped functionality. It is not a claim that all proposed systems have been implemented.

## The central question

What should a divisional or corps commander actually do in a wargame?

The answer is not to personally move every squad, allocate every shell, or study a spreadsheet of individual soldiers. A commander provides intent, sets priorities, assigns resources, accepts risk, and relies on subordinates. But a game must also report what those subordinates are doing and why orders sometimes take time.

Utah Command's aspiration is a believable chain between decisions, battlefield circumstances, and consequences. A beautiful map and elaborate staff system are not enough if the combat results are unconvincing.

## Principles guiding the simulation

### Outcomes must be credible
Combat resolution is the foundation. Firepower, terrain, posture, protection, ammunition, fatigue, leadership, equipment, weather, and information must affect outcomes for identifiable reasons. Calibration against historically plausible results is ongoing work, not a box to check once.

### Not every turn has to contain fighting
Longer operations contain waiting, reconnaissance, consolidation, resupply, maintenance, medical evacuation, preparation, and delays. Quiet turns are legitimate; reports must explain what is known without fabricating activity or omniscient intelligence.

### Personnel strength is not combat effectiveness
An infantry battalion can be nearly full on paper and badly impaired by the loss of seasoned NCOs, company commanders, specialist crews, or cohesion. The proposed model distinguishes authorized strength, personnel present, losses, rank and experience cohorts, replacement waves, and actual combat effectiveness. Ten casualties among recruits do not necessarily have the same consequences as ten among veteran leaders.

### Replacements don't instantly restore experience
New soldiers may restore headcount while the formation still needs leadership continuity and integration. Surviving newcomers can gain experience; wounded veterans might return after treatment and evacuation. A medical unit's usefulness may therefore emerge over several turns or much later in a campaign.

### Attachments must perform real work
A medical company treats and evacuates. Engineers remove particular obstacles, improve positions, breach hedgerows, or support crossings. Bridging units create routes with limited capacities. Tanks supply actual weapons, crews, protection, and mobility. Support availability depends on equipment, consumables, time, and location—not simply a permanent bonus added to a combat number.

### Obstacles persist
Clearing a minefield is not an instant four-hour-turn effect. Reconnaissance, partial lanes, marking, widening, interruption, and traffic capacity have consequences. A breach reduces the obstacle's effect along a specific route without magically reducing the defender's own weapons or personnel.

### The player remains a commander
Detailed simulations belong under the hood; the interface should present useful G-1, G-2, G-3, and G-4 advice and explain relevant consequences without requiring the player to manage individual platoons or hundreds of anonymous personnel records.

### Historical credibility needs labeled evidence
Scenario-specific figures must distinguish documented 1944 establishments and actual strength returns from developer estimates. Equipment like hedgerow cutters has to appear in historically plausible periods. Where evidence is incomplete, identify the uncertainty rather than disguising it as precision.

## Development chronology

**October 16–19, 2026 — Command orientation.** Early design moved toward fog of war, supply tracing, weather, attachments, HQ relationships, recon, subordinate situation reports, map usability, and a higher-level command role. The persistent concern was that delegated orders must result in understandable feedback.

**October 20–21 — More informative command decisions.** GitHub history records work on opponent behavior, coordinated attacks, command visits, status indicators, delayed reinforcements, and preventing already-assigned support from being attached twice.

**October 22 — Realistic battle consequences.** Updates addressed combat factors, follow-on landing diversions, and withdrawal by badly depleted formations. A formation intelligence window was added, explicitly noting that abstract strength points were *not* actual tank or troop counts.

**October 22 — First TO&E/G-1 foundation.** The prototype linked illustrative establishment figures to abstract strength, added a G-1 planning summary, and began accounting for replacement experience in combat effectiveness. **This remains provisional; its counts are not verified historical strength returns or actual casualty ledgers.**

**October 22 — Deeper personnel design.** Discussion established a future cohort-based model that tracks losses by experience, rank, duty, exposure, and leadership impact; medical treatment and return-to-duty pools naturally extend that idea.

**October 22 — Meaningful attachments.** Engineering and medical units should have distinct, persistent operational effects. A minefield breach changes routes and obstacle penalties over realistic time, rather than adding arbitrary attack points.

## Questions still to solve

How do we calibrate casualty probabilities by duty and exposure without false historical certainty? How do leadership losses affect a unit without excessive randomness? When should command reports convey delay rather than failure? How can the simulation give the player an honest estimate while hiding information the commander could not know?

These questions will remain visible as the engine evolves.

## For prospective players

Utah Command is being developed for players who enjoy uncertainty, the realities of operational command, and the cumulative consequences of decisions. The goal is not constant action. It is meaningful action—and meaningful inactivity.

## Journal conventions for future updates

Each new entry should specify **date**, **design problem**, **reasoning and alternatives**, **decision**, **gameplay consequence**, **implementation status** (proposed/prototyped/tested/released), and **links to relevant commits or tests**. Earlier entries remain intact; corrections and changes of mind are part of the history.

See [the game](game/), [the technical personnel/combat specification](PERSONNEL-COMBAT-MODEL.md), and the repository's Git history.


## October 22, 2026 — Frontage, unit boundaries, and contact with adjacent formations
**Status: proposed design concept; NOT yet implemented or play-tested.**

**Problem.** A battalion represented by one square/counter looks as though it occupies only a point on the map. Two battalions advancing between the Southern Exit and Crossroads may appear miles apart, even though a real commander assigns zones or axes and expects formations to deploy across frontage, maintain flank security, and coordinate with neighbors. A unit moving in road column is not deployed in the same fashion as a battalion in an assault.

**Design direction.** Distinguish the counter's center/HQ or approximate formation position from its occupied or controlled frontage. Each maneuver formation could have a mission boundary or assigned zone (left/right limits, start line and objective), a deployment posture (road column, tactical march, deployed assault, defense), a calculated *effective frontage* reflecting terrain, strength, echelon, and posture, and an uncertainty band rather than perfectly known lines of soldiers. The commander may draw division/regimental boundary lines and assign sectors; subordinate commanders deploy companies within those limits without squad-by-squad orders.

**Contact and gaps.** Show confirmed liaison/contact, tentative contact, flank gaps, and dangerous overlaps with adjacent friendly units. A dashed line or translucent band should make coverage visible when selected; a separate overlay toggle should keep the map readable. Contiguous assigned boundaries should not imply continuous occupancy or guaranteed communication. Terrain, visibility, unit depletion, time since last report, and communications all determine confidence. A road movement column may secure much less lateral frontage than the same battalion after deploying.

**Mechanics to test.** Allow phased formation changes consuming realistic time, especially moving from road column to deployed attack. Patrols, recon and flank guards can improve awareness without making the sector impermeable. Flank gaps and poorly coordinated boundary crossings can create realistic delay, infiltration risk, friendly-fire risk, or exposure; good lateral contact can support cooperative attacks and reserve movement. Width must be bounded by available troops and mission—not a radius growing magically from the counter. Use historically defensible frontage ranges as scenario/terrain parameters, not one universal battalion width.

**Presentation.** When a unit is selected, display its assigned sector and *estimated* occupied frontage; optionally shade coverage and mark left/right neighbor status. Staff reports should say, for example, “Contact with battalion on right confirmed; gap to left not reconnoitered,” or “Unit still deploying off road; only its lead elements are in position.” A deployed battalion approaching the objective should visibly spread within its boundary rather than the square alone purporting to attack.

**Why this matters.** It preserves the higher-command scale while distinguishing a formation's physical footprint, assigned responsibility, and what higher headquarters actually knows. It also makes quiet turns meaningful: deploying, establishing boundaries, conducting liaison, and closing gaps can take time without a firefight.

**Open questions.** Hex-scale precision, overlapping formations, reserves in depth, and support or headquarters footprints need careful rules. Do not infer enemy deployment with perfect accuracy.

**Commit note.** This journal entry records a design decision to explore, not a released feature.


## October 23, 2026 — First playable frontage overlay (v0.23.1)
**Status: implemented and checked; first display-only iteration.**

**Decision.** Add a Boundaries switch above the map, enabled by default. Friendly maneuver formations show estimated frontage and dashed side limits, with the selected formation in gold and others in blue. Selected-unit details identify left/right neighbors and estimated contact, gaps, staggered lines, or open flanks. Width uses the existing illustrative establishment, orders/mission, local terrain, strength, fatigue, suppression and reserves. Movement uses a narrow column, attack and defense deploy more widely. Attached support uses its host footprint; headquarters and artillery have no separate maneuver frontage.

**Gameplay consequence.** The player can inspect the approximate formation spread and flank relationship without directing companies. Estimates follow current order/mission axes, defaulting inland; they use schematic map hex widths. They are neither historical sector assignments nor claims of occupied/control territory. No combat or movement rules change. Deployment time, manually assigned sectors, communications/liaison confidence, terrain-clipped coverage and flank combat effects remain future work.

**Validation.** `checks/frontage-check.cjs` covers posture/axis changes, left/right orientation, depleted units, contact versus gaps/depth, attached/destroyed exclusions, concealed-enemy privacy, all scenarios, movement and state purity. `checks/command-desk-ui-check.cjs` covers toggle/render, preference storage, supply-view suppression, save validation and a complete UI battle. SVG map rendering visually inspected. Existing command-services (48 complete feature games), coordinated attack, realism and reinforcement checks passed. Existing `checks/visibility-check.cjs` fails its delegated-withdrawal assertion in the unchanged engine; this release does not alter that behavior. Native iPad interaction still requires player testing.

**Implementation.** `game/frontage.js`, integrated into `game/app.js`; offline cache updated to v0.23.1. This implements the first estimated display from the preceding concept, not the full proposed boundary simulation.
