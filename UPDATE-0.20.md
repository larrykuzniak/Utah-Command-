# Utah Command — visibility & disengagement update 0.20

Based on October 17 packaged 0.19 source; applied to the GitHub game/ directory and GitHub Pages on October 19, 2026.

- Visibility setting: Clear, Rain (2 hexes), Heavy Fog (1 hex), and Night (1 hex), applied to both sides and observer-dependent fire.
- Existing last-known position intelligence stays on the map as a dated question mark when current observation is lost. A move under cover updates the displayed position only upon rediscovery.
- A unit's Disengage when practical button delegates attempted withdrawal to its commander, conditional on enemy proximity, reduced observation and availability of a legal retreat hex. It is a standing policy, not a guaranteed escape.
- German AI can exploit reduced visibility to pull back battered non-objective formations.
- Report includes weather and observation condition.

## Limits and follow-up testing
All 21 included automated checks passed before deployment. Actual iPad testing remains outstanding. Manual smoke, fire/noise contact modeling, HQ visits and actual weather time-series were not implemented by this patch. The existing command and fog logic is preserved. Check iPad Safari and all included command tests prior to distribution. Existing saves default to clear conditions.
