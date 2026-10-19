# Command edition 0.21.0

Open `/game/`. The separate legacy `/game/supply/` installation retains its earlier edition.

- Map counters display compact formation identifiers (1/8, 2/8, 3/8, 70 TK, 29 FA) separately from strength. Full names remain in selection labels and accessible names.
- Command desk / Headquarters → Visit staff gives the regiment S1–S4 advice and division, corps, and army G1–G4 advice. Advice covers recovery, reconnaissance, attachments, and delivery priorities. It uses subordinate formations and reported enemy knowledge. Review exact changes, apply, modify through existing controls, retain orders, or dismiss. Staff do not accept their own advice.
- Command desk → Supply points establishes or relocates up to two forward dumps. Staff handle convoys. Stocks are finite, transfers conserve stock, distance limits delivery, relocation interrupts distribution, blockers delay establishment, and enemies can disrupt or destroy dumps. Recover stocks before reverting to abstract supply. New games use stocked points; existing saves retain abstract supply until enabled here.
- Recon patrol dispatches a small detachment without moving its parent's counter or replacing its orders. Costs one reserve and temporarily commits 10% parent firepower. Patrols move up to two movement points/turn (one costly crossing can use the whole turn), observe adjacent hexes, report a further turn later within six hexes of the parent, and return. Contacts are dated observations; missing patrols can cost parent strength. Recall is available.
- Activity log records acknowledgments, staff decisions, subordinate progress, patrol messages, and supply delays. It does not reveal hidden enemy positions.
- Existing route-search improvements are included. See PERFORMANCE-LOG.md for measurements and remaining profiling candidates.

## Validation

21 supplied checks pass. Added command-services and command-desk checks cover stock conservation, forecast purity, legacy migration, hidden blockers, delayed reports, patrol returns, staff review/cancel/apply, malformed-save rejection, numbered counters, saved controls, and 48 complete deterministic feature-enabled games across eight scenarios and rule combinations.

Run `node checks/command-services-check.cjs` and `node checks/command-desk-ui-check.cjs`. Full regression results are in `checks/results/feature-regression-results.json`. UI checks use a simulated DOM. A physical iPad layout/performance check remains outstanding; Node timings do not measure Safari rendering.
