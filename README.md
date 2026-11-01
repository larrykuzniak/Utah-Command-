# Utah Command — 0.26.0

Free independent WWII operational command game. Game design and development lead: Larry Kuzniak. Development assistance: OpenAI ChatGPT/Codex.

Play: https://larrykuzniak.github.io/Utah-Command-/game/start-0260.html

You command the 4th Infantry Division. Division orders address the 8th, 12th and 22nd Infantry Regiments; Regimental orders address their own battalions. Each regiment has its own HQ, command chain and distribution status. All three regiments start with independent north/center/south missions. Headquarters can follow their formations by normal movement, or be placed under direct orders. A regiment can receive several objectives in sequence or spread its battalions across them. Other smaller scenarios are explicitly regimental exercises.

Use game/ as current editable source. Run node build-current.cjs after changes to generate matching isolated assets and a cache-safe launch entry. Older snapshots are in archive/ and are not a development baseline. See UPDATE-0.26.md for behavior and validation.

On iPad, open the direct address in Safari, then add it to the Home Screen with Open as Web App for a standalone window. Existing saves stay in the same browser/origin; Export/Import transfers between hosts or devices.

Validation includes actual previous-version save migration, three full deterministic division battles, per-regiment command/distribution, HQ legal movement, split/sequential objectives, direct battalion interventions, UI saves and exit rollback, and existing AI/frontage/visibility/reinforcement/offline checks. Real iPad acceptance is pending.
