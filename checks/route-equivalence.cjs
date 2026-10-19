// Compare routes and whole battle states with a supplied pre-refactor engine.
const assert=require('node:assert/strict'),path=require('node:path');
if (!process.argv[2]) throw Error('Usage: node checks/route-equivalence.cjs baseline-engine.cjs');
const before=require(path.resolve(process.argv[2])),after=require('../game/engine.js');
let routes=0,turns=0,games=0;
for(const c of before.scenarios.filter(c=>!c.custom)) for(const rules of ['standard','advanced','operational']) {
  const s=before.fresh(c.id);
  if(rules==='advanced') before.toggleAdvanced(s,true);
  if(rules==='operational') before.toggleOperational(s,true);
  for(const weather of ['clear','rain','fog','night']) {
    s.weather=weather;
    for(const u of s.units) {
      assert.deepEqual([...after.reachable(s,u)],[...before.reachable(s,u)]);routes++;
      for(const goal of [{x:0,y:0},...c.objectives,{x:8,y:8}]) {
        assert.deepEqual(after.path(s,u,goal),before.path(s,u,goal));routes++;
        if(u.type!=='hq') for(const risk of ['cautious','balanced','aggressive']) {
          assert.deepEqual(after.commandRoute(s,u,goal,risk),before.commandRoute(s,u,goal,risk));routes++;
        }
      }
      for(const routePolicy of ['shortest','roads','cautious']) for(const supplyEntry of ['auto','north','center','south']) {
        const request={...u,routePolicy,supplyEntry};
        assert.deepEqual(after.supplyRoute(s,request),before.supplyRoute(s,request));routes++;
      }
    }
    // Full state includes RNG seed, positions, losses, resources, reports and saves.
    const a=JSON.parse(JSON.stringify(s)),b=JSON.parse(JSON.stringify(s));
    a.commandMode=b.commandMode=true;
    for(const u of a.units.filter(u=>u.side==='us'&&['infantry','tank'].includes(u.type))) {
      const m={type:c.mode==='hold'?'defend':'seize',objective:0,risk:'balanced'};
      assert.equal(before.assignMission(a,u.id,m),null);assert.equal(after.assignMission(b,u.id,m),null);
    }
    while(!a.finished) {
      const oldPlan=before.commandPlan(a),newPlan=after.commandPlan(b);
      assert.deepEqual(newPlan,oldPlan);
      const approvals=Object.fromEntries(oldPlan.requests.map(r=>[r.id,'approve']));
      before.resolve(a,approvals);after.resolve(b,approvals);assert.deepEqual(b,a);turns++;
      assert.ok(turns<5000,'Battles must terminate');
    }
    games++;
  }
}
console.log(JSON.stringify({result:'PASS',routeComparisons:routes,battles:games,identicalTurns:turns}));
