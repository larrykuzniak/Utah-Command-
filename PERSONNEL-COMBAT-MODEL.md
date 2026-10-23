# Personnel Cohorts, Leadership Attrition, and Combat Effectiveness — Design Specification
Status: design approved in conversation; NOT implemented in the game engine.
Date: 2026-10-22

## Objective
Model actual personnel strength independently of combat effectiveness. A loss of 10 personnel is not a fixed loss of 10 interchangeable soldiers. Experience, positions, leadership, combat exposure, and replacement history determine effects. Player sees command-level summaries, not names or roster micromanagement.

## Authoritative establishment
Use dated, nationality-specific historical TO&E documents as *authorized* positions. A distinct scenario-specific initial strength return defines personnel *present*. Never silently equate authorized, present, and combat-effective. Annotate all invented/demo headcounts explicitly. US Infantry Battalion 26 February 1944 T/O&E 7-15 is a research starting point, not universal for each scenario.

## Population model
A formation contains integer cohorts grouped by subunit (HQ, rifle companies, weapons company), billet (command officers, platoon leaders, senior NCOs, junior NCOs, technical specialists, riflemen), experience tier (green, trained, combat-tested, veteran), and replacement wave. Store integer counts and experience distribution. Individual high-impact command billets may be recorded by role, not by name. Allow trained veteran and recent replacement in each rank—rank and experience are NOT identical. Preserve provenance and checksum total.

## Loss resolution
For each combat event calculate people wounded, killed, missing, temporarily unavailable, and returned to duty according to contextual calibrated distributions (combat type, exposure, terrain, posture, weapon effects). Avoid treating all abstract HP damage as an exact headcount. Weight risk by subunit exposure and role and with protective effects of cover and posture. Sample without replacement from the actual cohort population. Track officer, NCO, and enlisted losses separately, and whether veterans or recent replacements took them. Persist losses across turns and report uncertainty where warranted. Leadership casualties are rare but consequential; leadership succession and degraded command/control resolve explicitly. Replacement casualties depend on who was exposed, not a fixed percentage.

## Combat effectiveness
Compute separately:
- available rifle/weapons crews and serviceable weapon systems;
- leadership continuity (command billets occupied; experience of incumbents; disrupted succession);
- task proficiency, veteran retention, rookie integration and cohesion;
- ammunition, supply, fatigue, posture, terrain, suppression, communications, and combined-arms effects.
Never compound personnel attrition twice if numerical combat capacity already reflects missing troops.
Nonlinear leadership penalty should be bounded and recover through succession, rest and training rather than permanently crippling a unit.
Replacements restore headcount but do not automatically restore team cohesion or commander experience; surviving replacements learn gradually from combat and training.
Wounded may return with a schedule; missing/captured require different resolution.

## Staff output
G-1: authorized, present, fit-for-duty, KIA/WIA/MIA, returned-to-duty, replacements received, veteran share, officer/NCO vacancies, strength trend and warnings.
G-3: operational impact, command risk, attack/defense assessment, progress and periods of consolidation or no combat.
G-4: equipment and crew serviceability, resupply and maintenance.
Fog of war applies to enemy formations: never disclose their exact composition just because the underlying model knows it.

## Example
10 personnel losses: 8 inexperienced riflemen + 2 experienced NCOs is operationally different from 10 inexperienced riflemen. No fixed casualty rank quotas; impacts emerge from sampled roles and their unit responsibilities. A hard turn may selectively wipe out veterans if the veteran-heavy lead elements are exposed.

## Validation and implementation order
1. Establish verified 1944 US battalion/company baseline and scenario-specific strength; mark missing data unknown.
2. Add deterministic seeded cohort initialization, serialization/migration, integer accounting checks.
3. Resolve casualties by sampled cohort and role; log the seed and causal exposure for repeatable tests.
4. Integrate leadership continuity and weapon crews into a combat-power function; maintain a single source of truth for losses.
5. Integrate rest, return-to-duty, replacements, promotion, integration and training into G-1 and combat.
6. Backtest against historical ranges of casualties, attrition rates, and operational tempo; use sensitivity/Monte Carlo runs to check outliers. Calibrate coefficients, not history-script the outcome.
7. Quiet turns remain legitimate outcomes and can involve logistics, readiness recovery, fortification, patrols, delays and no change at all.

## Safety rails
Never manufacture a historical precision unsupported by sources. Never produce false estimates of 'actual' KIA/WIA from abstract HP without a separately modeled causal casualty event. Do not allow deterministic guaranteed leader deaths from arbitrary HP thresholds.

## Future feature backlog: Persistent battlefield engineering and obstacle effects
Status: planned, not implemented.
- Replace generic attached-engineer combat-point bonuses with explicit capabilities tied to terrain, personnel, tools, materials, and time.
- Represent minefields, bocage, wire, bridges, and other obstacles as persistent map conditions with reconnaissance, breach progress, marked lanes, partial clearance, and possible enemy interference.
- A breach reduces or bypasses the obstacle's specific defensive advantage along a particular route; it does not inherently increase infantry firepower or remove the defender's organic strength.
- Model lane width/capacity separately for infantry and vehicles; one lane does not permit unlimited passage by entire formations.
- Allow tasks to take multiple turns, with variable duration depending on density, weather, enemy fire, supplies, and engineer capability. Never assume instant removal within a four-hour turn.
- Carry incomplete work between turns. Reflect effects in movement, cohesion, exposure, delays, and combat resolution—not merely attack/defense point arithmetic.
- Provide G-3/engineer reports explaining the work, progress, blockages, and expected operational impact even on quiet turns.
