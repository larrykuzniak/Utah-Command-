# Utah Command development testing edition — v0.24.0

Tester entry: https://larrykuzniak.github.io/Utah-Command-/game/testing/

This is a fictional development exercise, not a historical battle or a balanced public scenario. The regular `game/index.html` does not load or register it. The testing entry uses its own browser-save keys, manifest and offline-cache scope. It is publicly accessible by URL; it is not access-controlled.

For a public release package, omit `game/testing/` and `game/proving-ground.js`. Neither is a dependency of the regular offline shell. Keep this testing edition in development source for regression and manual testing.

## Command Proving Ground

A 24-column, 18-row battlefield with six infantry battalions, two tank companies, two field batteries, combat engineers, a reconnaissance detachment, four headquarters and fourteen scattered enemy formations. Units, terrain and strengths are illustrative. Weak roadblock units represent platoon-sized opposition through abstract strength, not a researched order of battle.

The exercise has no practical turn deadline, no automatic victory when objectives are occupied, and no automatic defeat on destruction of the forces. Time continues in half-hour turns, with day numbers. Normal direct orders, standing missions, attachment limits, observation, command links, reconnaissance, staff reports, supply and combat rules apply. Boundary markings remain estimates of deployment; this edition does not introduce a dedicated flank-guard mission or make the frontage overlay control terrain.

### Terrain and practice lanes

Coordinates below are displayed as column, row, starting at 1.

- Start in the east, columns 21–24. Spread formations north and south to practice maneuver and support/reserve orders.
- Road lanes run across rows 4, 9 and 15, with weak roadblocks in depth.
- Armor targets are near 17,5 and 16,14. Practice observation and combined artillery/air support.
- The river runs between columns 12 and 13. Crossings are on rows 4, 9 and 15. The middle crossing starts damaged; the others are intact. Attach engineers or use the organic engineer company and the normal Operations repair/demolition orders. Existing rules model repairs and fording, not construction of arbitrary new bridge sites.
- Western villages and hedgerows provide covered defensive positions; open fields provide room for flanking and formation movement.

### Training controls

Open **Command Proving Ground · Training controls** above the map.

- Replenish air, ammunition and supplies at any point, or enable automatic reserve/ammunition refills each turn. Automatic refills do not heal casualties, remove fatigue or bypass observation/command requirements. Turn them off to test shortages and supply routes.
- Renewable air missions are enabled initially. The normal one-strike-per-turn limit remains.
- Restore a selected friendly unit to full readiness; attachments and standing mission remain. An eliminated unit cannot be restored into a hex occupied by another living unit.
- Request friendly or enemy infantry, armor, artillery or engineers at a chosen map coordinate. They arrive after the next resolution. Occupied hexes delay arrival and retry; no stacking or teleportation of existing units.
- Static defenders return fire without maneuvering. Switch to normal maneuvering AI to test an active opponent.
- Reset original enemy positions or restore the initial crossing-damage state. Occupied enemy reset hexes are skipped.
- The exercise permits 120 units including losses and pending requests. Start a new proving-ground game to clear that pool. Reports keep the existing recent-history limits.

Use **+** to zoom into a sector; **Fit map** restores the overview. Full-screen map is available. Training controls are above the normal map, so leave full-screen to use them. Situation reports and the Command desk remain available, but automatic report popups are initially off.

Open the testing link online and wait for **Offline play ready** before disconnecting. The test entry deliberately uses versioned shared assets to avoid mixing a previously cached public engine with newer testing code.

## Validation

- Engine checks cover extended map routes/frontage/supply, static defenders, open-ended outcomes, queued arrivals and retries, attachments, bridge repair, renewable air, replenishment, malformed testing-state rejection and turn-76 saves.
- UI harness checks cover map rendering, training actions, save validation past turn 100, workshop isolation and independent testing storage/entry behavior.
- Existing command-services, coordination, frontage, realism, reinforcement and visibility regression checks run against the shared engine. The visibility check was updated from an obsolete boolean disengagement policy to the current `withdraw` policy and a depleted unit.
- Real iPad Safari layout and human playtesting remain to be done; no claim of device verification is made.
