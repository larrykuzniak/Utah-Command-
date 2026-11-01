# Current Utah Command source — 0.26.0

Main role: 4th Infantry Division commander.

- Division orders go to the 8th, 12th and 22nd Infantry Regiments.
- Regimental orders go to the selected regiment’s battalions, with independent persistent directives.
- Each regiment has its own HQ and organic battalion chain. Division support reports to Division HQ. Corps and army are off-map attachment providers in the division scenario.
- New games assign distinct north/center/south missions. Old saves upgrade HQ relationships and otherwise-unassigned regiments without moving or healing field units. Explicit mission cancellations remain canceled after the one-time upgrade.
- Regimental HQs use normal legal moves to follow their formations, subject to contact, movement budgets, traffic and observed threats. Manual intervention and auto-follow switch remain available.
- HQ contact limits distribution to its own units; depot stocks, distances, routes and shared transport remain real limits. No free global HQ supply bonus in the division scenario.
- Regiments can split battalions over multiple objectives or advance through objectives in sequence.

Canonical GitHub source: larrykuzniak/Utah-Command-, game/. This Sites checkout mirrors the game in dist/play. Prior snapshots live in archive outside published dist. Smaller scenarios are marked regimental exercises.

Release packaging: build-current.cjs produces matching generated assets and a cache-safe start-0260.html entry. This prevents old workers mixing new HTML with old engine scripts. Root, release-020 and supply are compatibility launchers only.

Validation: current-checks/division-command-check.cjs covers actual previous-engine save migration, three complete deterministic division battles, scoped distribution, separate HQ chains, legal HQ movement and split/sequential objectives. Regimental UI tests cover parent filtering, independent orders, direct intervention persistence, saves and exit rollback. Existing command desk, frontage, division setup, AI, reinforcement, visibility and offline checks pass. Browser verification covers role screens, own battalion lists, all-three-objective assignment and HQ contact. Real iPad acceptance remains pending.
