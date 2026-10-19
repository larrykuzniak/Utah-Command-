// Run from the repository root: node checks/performance-benchmark.cjs [baseline-engine.cjs]
// Node timings measure engine work, not Safari rendering or device performance.
const {performance} = require('node:perf_hooks');
const path = require('node:path');
const current = require('../game/engine.js');
const baseline = process.argv[2] ? require(path.resolve(process.argv[2])) : null;
function cases(G) {
  return G.scenarios.filter(c => !c.custom).flatMap(c => [false, true].map(advanced => {
    const s = G.fresh(c.id);
    if (advanced) G.toggleOperational(s, true);
    s.commandMode = true;
    const units = s.units.filter(u => u.side === 'us' && ['infantry', 'tank'].includes(u.type));
    units.forEach((u,i) => G.assignMission(s,u.id,{type:c.mode==='hold'?'defend':'seize',objective:i%3,risk:'balanced'}));
    return {s,u:units[0]};
  }));
}
const workloads = {
  'movement routes': (G,c) => G.path(c.s,c.u,{x:0,y:0}),
  'supply forecast': (G,c) => G.logistics(c.s),
  'mission planning': (G,c) => G.commandPlan(c.s),
  'movement overlay': (G,c) => G.reachable(c.s,c.u)
};
const sets = {current:cases(current)};
if (baseline) sets.baseline = cases(baseline);
const times = {};
for (const [name,run] of Object.entries(workloads)) {
  const samples = {current:[],baseline:[]};
  for (const label of Object.keys(sets)) for (const c of sets[label]) run(label==='current'?current:baseline,c);
  // Alternate execution order to reduce warm-up and ordering bias.
  for (let round=0;round<7;round++) {
    const labels = Object.keys(sets);
    if (round%2) labels.reverse();
    for (const label of labels) {
      const G=label==='current'?current:baseline,start=performance.now();
      for (let repeat=0;repeat<20;repeat++) for (const c of sets[label]) run(G,c);
      samples[label].push(performance.now()-start);
    }
  }
  const median = a => a.slice().sort((a,b)=>a-b)[Math.floor(a.length/2)];
  const result = {callsPerSample:sets.current.length*20,currentMs:median(samples.current)};
  if (baseline) { result.baselineMs=median(samples.baseline);result.speedup=result.baselineMs/result.currentMs; }
  times[name]=result;
}
console.log(JSON.stringify({runtime:process.version,platform:process.platform,method:'median of 7 alternating batches; 8 scenarios, standard and operational rules',times},null,2));
