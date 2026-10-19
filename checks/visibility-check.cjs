const assert=require('node:assert/strict');const G=require('../game/engine.js');
let s=G.fresh();let scout=s.units.find(u=>u.id==='a');let german=s.units.find(u=>u.id==='f');
assert.equal(G.sightRange(s,scout),3);s.weather='rain';assert.equal(G.sightRange(s,scout),2);s.weather='fog';assert.equal(G.sightRange(s,scout),1);s.weather='night';assert.equal(G.sightRange(s,scout),1);
s=G.fresh();s.units=[{...scout,x:6,y:2},{...german,x:5,y:2}];G.updateIntel(s);assert.equal(s.intel.length,1);s.weather='fog';s.units[0].x=8;G.updateIntel(s);assert.equal(s.intel.length,1);s.units[1].x=3;G.updateIntel(s);assert.deepEqual([s.intel[0].x,s.intel[0].y],[5,2]);s.units[0].x=6;G.updateIntel(s);assert.equal(s.intel.length,0);
s=G.fresh();s.weather='fog';s.units=s.units.filter(u=>u.id==='a'||u.id==='f');s.units[0].x=5;s.units[0].y=2;s.units[1].x=4;s.units[1].y=2;s.units[0].disengagePolicy=true;const before={x:s.units[0].x,y:s.units[0].y};G.resolve(s);const after=s.units.find(u=>u.id==='a');assert.ok(after.x!==before.x||after.y!==before.y,'delegated withdrawal should move');
console.log('PASS: weather sight caps, stale-location retention, clearing searched empty locations, autonomous disengagement.');
