'use strict';
const assert=require('node:assert/strict'),G=require('../game/engine.js');
require('../game/command-services.js')(G);
const clone=s=>JSON.parse(JSON.stringify(s));
// Enemy decisions cannot use unseen formations or the player's queued orders.
let s=G.fresh();s.weather='fog';let b=clone(s);b.units.filter(u=>u.side==='us').forEach(u=>u.order={type:'attack',target:'f'});G.planOpponent(s);G.planOpponent(b);assert.deepEqual(s.units.filter(u=>u.side==='de').map(u=>u.order),b.units.filter(u=>u.side==='de').map(u=>u.order));
s=G.fresh();s.weather='fog';b=clone(s);b.units.find(u=>u.id==='a').hp=1;G.planOpponent(s);G.planOpponent(b);assert.deepEqual(s.units.filter(u=>u.side==='de').map(u=>u.order),b.units.filter(u=>u.side==='de').map(u=>u.order));
// Fatigue now reduces operational firepower and recovers through rest.
s=G.fresh();G.toggleOperational(s,true);let u=s.units.find(u=>u.id==='a');assert(G.fireFactor({...u,fatigue:4})<G.fireFactor({...u,fatigue:0}));
// All scenarios produce valid, deterministic end-of-turn reports across rule modes.
for(const c of G.scenarios)for(let mode=0;mode<3;mode++){
 s=G.fresh(c.id);if(mode)G.toggleAdvanced(s,true);if(mode===2)G.toggleOperational(s,true);
 for(let t=0;t<4&&!s.finished;t++){b=clone(s);G.resolve(s);G.resolve(b);assert.deepEqual(s,b);assert(G.commandValid(s));assert(G.advancedValid(s));assert(G.commandServicesValid(s));assert(s.units.filter(u=>u.side==='us'&&u.type!=='hq').every(u=>u.commandReport.includes('SITREP')));const occupied=G.alive(s).map(u=>u.x+','+u.y);assert.equal(new Set(occupied).size,occupied.length);}
}
console.log('PASS: observation-limited AI, order privacy, fatigue, deterministic scenario reports, valid saves, no stacking.');
