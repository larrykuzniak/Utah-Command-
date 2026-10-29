# Utah Command

A free, independent, turn-based World War II operational command game. Game design and development lead: Larry Kuzniak. Development assistance: OpenAI ChatGPT/Codex.

## Current supplied version
Current incremental test build (following **0.23.1**). Adds the Boundaries map switch, estimated maneuver frontage, formation-dependent spread, and selected-unit left/right contact or gap reports. Boundaries are a display estimate; combat rules and saved battle format are unchanged. See `checks/frontage-check.cjs` and the existing command/UI checks for validation.

Performance review and timing results: see `PERFORMANCE-LOG.md`.

## Division-scale development scenario (October 2026)
Select **Utah · 4th Infantry Division** in Scenarios to try a 13 × 11-hex experimental map with nine battalion counters (8th, 12th and 22nd Infantry), support, and opposition. The original **Utah · Beach Exits** introductory scenario is preserved.

Higher Army/Corps HQ counters are hidden on the tactical map; their legacy engine objects and command logic remain for save compatibility. This is not yet the final three-regimental-HQ command implementation. Unit arrival times, map geography, and enemy deployment are game-design approximations rather than historically verified detailed D-Day positions. See `checks/division-setup-check.cjs` for intended setup checks (not yet executed in this environment).

## Experimental VII Corps scenario and unit-establishment display (28 October 2026)
The **VII Corps · Two-Division Advance** scenario includes battalion groupings representing the **4th and 90th Infantry Divisions**, corps armor and artillery, a larger 17 × 13 map, 20 turns and three shared objectives. It uses the existing four-headquarters engine, so it is a first corps-scope playtest, not yet a complete independently subordinate two-division command hierarchy. The order of battle, unit placements, terrain and strengths are illustrative game assumptions, not verified historical deployment details.

Selected friendly combat units now show an **estimated TO&E panel**. Personnel and weapons counts are teaching estimates proportional to game strength; they are not live casualty records or verified 1944 unit complements. These changes have been committed but browser runtime and automated checks were **not run in this session**. Existing saved games are intended to remain compatible.

## Windows
See `READ-ME-FIRST.txt` for instructions. On a Windows 10/11 personal computer, launch `Start-Utah-Command.cmd` from this folder after extracting all files. The launcher uses PowerShell and a local browser server; it does not install an EXE.

## Web
The game is stored under `game/` (including its maps and graphics). Play at https://larrykuzniak.github.io/Utah-Command-/game/ . GitHub Pages publishes main / (root); the root entry page opens game/.

## Documentation and rights
- `Utah_Command_Guide.pdf`: player guide and submission handbook.
- `DISTRIBUTION-NOTICE.txt`: redistribution and rights notice. This is not declared open-source software.
- `BETA-FEEDBACK.txt`: beta-test feedback guidance.

