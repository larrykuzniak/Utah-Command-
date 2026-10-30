# Utah Command — Division Edition: design baseline (30 October 2026)

## Decision
Utah Command is a **division-command game**, not a configurable division/corps/army simulator. Maintain the current playable build while refactoring, and keep a known-good rollback point. Higher commands exist as external decision-makers, not player-selectable echelons. Corps/army games, if pursued, are separate future titles.

## Player's job
Command a WWII US infantry division. Primary mission orders go to **regiments**: objectives, timing/urgency, boundaries, posture (attack/defend/reorganize), main/supporting effort, artillery priorities and divisional reserve allocation. Regimental commanders choose battalion tactics and report outcomes. Show battalion counters as useful subordinate information, not nine mandatory separate player turns. Keep realistic command delay, friction, subordinate initiative and staff summaries.

## Narrow direct interventions
Division HQ may task a subordinate company or battalion for a **limited-purpose reconnaissance, reconnaissance in force, screening, or other discrete mission**, preferably through the parent regiment. This is not permission for routine company-level maneuver. Tasking must have explicit mission, time/area, limited scope, and a return report; subordinate assignment and reserve availability update accordingly. Validate recon-in-force consequences (contacts, casualties, detection and disengagement) before implementation.

## Higher headquarters
Model corps/army as AI/event actors only: allocate or withhold additional artillery, engineers, replacements, formations and other support when justified by scenario priorities, availability, urgency and communications. Player may submit a concise support request with rationale and wait for approval/denial/delay; higher HQ can also proactively attach assets. No playable corps command screen and no free infinite reinforcements. Preserve historical scenario constraints; distinguish scenario-authorized attachments from dynamic requests.

## Supply without micromanagement
At division level, show operational supply status and meaningful choices: main supply route threats, divisional priority of effort, artillery ammunition and fuel constraints, interdiction, delays and critical shortages. Abstract procurement, detailed depots, corps transport schedules, and individual truck inventories. G-4 summarizes problems and recommends priority decisions. Remove or hide UI that asks the division commander to perform corps logistics manually.

## Proposed iPad layout
- Large map remains the primary screen; no persistent empty/right-side wasteland.
- A compact division command bar shows mission, turn/phase, weather, overall supply, and alerts.
- Selecting a regiment opens a single order card: objective, mission type, priority, execute, and subordinate status. Defaults must not silently persist from prior units.
- A collapsible staff desk offers G-1/G-2/G-3/G-4 recommendations in short action-oriented reports, with expandable details.
- Support/requests panel covers divisional support and requests to higher HQ, with clear origin, status, and arrival uncertainty.
- Exception reports for direct reconnaissance tasking rather than a permanent separate company-command workflow.
- Preserve accessible unit numbers, clickable range, fullscreen map, and offline operation.

## Scope gates
Keep: operational orders, AI subordinate execution, operational frontage, supporting/main efforts, fog of war, staff recommendations, logistics priorities and combat resolution.
Simplify: personnel/TO&E to credible summaries initially; abstract replacement integration and detailed medical effects until core play works.
Defer to another game: playable corps/army HQ, corps supply network, theater strategy, army-scale operational direction.
Reject by default: routine division-level company micromanagement; unverified historical roster precision; new feature complexity without operational value.

## Release and testing
1. Baseline the currently playable build; **do not overwrite it as a first step**.
2. Repair existing bugs (attack resolution and dice feedback; order-mode persistence; iPad layout); establish tests.
3. Introduce the division-focused UI independently of combat math, then validate save/load and scenario compatibility.
4. Implement regiment mission orders and subordinate execution in small increments; assess AI and reports before expanding.
5. Add higher-HQ request/automatic allocation only after mission-order path is reliable.
6. Test end-to-end on iPad: fresh games, offline/PWA, phases, attack, movement, supply, reinforcement, UI geometry, save and restore.
7. Publish only when regression tests pass; label features PROPOSED / IMPLEMENTED / VERIFIED separately.

## Known current status (from README/issues at decision time)
Repository describes an incremental test build after 0.23.1, an experimental 4th Infantry Division scenario, and display-only estimated boundaries/frontage. It explicitly states final three-regimental HQ command is not implemented. TO&E, G-1 personnel, replacement reconstitution and higher-HQ reinforcement request have open planning issues; **do not call them implemented** on the strength of proposals.

## Working agreement
For each new suggestion, decide: (1) is it a division commander decision? (2) could the AI subordinate or staff handle it? (3) does it help play enough to justify testing/regression cost? (4) should an existing feature be removed? Track planned versus actually working. Stop scope creep until division core is enjoyable.
