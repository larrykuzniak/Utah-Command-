'use strict';
const assert=require('node:assert/strict');
for(const file of ['../game/engine.js','../game/supply/engine.js']){
 const G=require(file);
 for(const advanced of [false,true]){
  let s=G.fresh();if(advanced)G.toggleAdvanced(s,true);
  G.resolve(s);G.resolve(s);assert(!s.units.some(u=>['j','k'].includes(u.id)),'no early arrivals');
  // Both entry hexes occupied on the scheduled turn.
  const north=s.units.find(u=>u.id==='a'),south=s.units.find(u=>u.id==='c');
  Object.assign(north,{x:8,y:1});Object.assign(south,{x:8,y:8});
  G.resolve(s);assert(!s.units.some(u=>['j','k'].includes(u.id)));
  assert(s.log.some(t=>t.includes('REINFORCEMENT DELAY')&&t.includes('9, 2')));
  assert(s.log.some(t=>t.includes('REINFORCEMENT DELAY')&&t.includes('9, 9')));
  // Saving/reloading pending arrivals must preserve retry behavior.
  s=JSON.parse(JSON.stringify(s));s.units.find(u=>u.id==='a').y=0;
  const copy=JSON.parse(JSON.stringify(s));G.resolve(s);G.resolve(copy);assert.deepEqual(s,copy);
  assert.equal(s.units.filter(u=>u.id==='j').length,1);assert(!s.units.some(u=>u.id==='k'));
  s.units.find(u=>u.id==='c').y=3;G.resolve(s);
  assert.equal(s.units.filter(u=>u.id==='k').length,1);
  // Eliminated units are still recorded as having arrived.
  s.units.find(u=>u.id==='j').hp=0;G.resolve(s);
  assert.equal(s.units.filter(u=>u.id==='j').length,1);assert.equal(s.units.find(u=>u.id==='j').hp,0);
  assert.equal(new Set(s.units.map(u=>u.id)).size,s.units.length);
 }
 // An older save whose arrival turn has already passed also recovers.
 const old=G.fresh();old.turn=5;G.resolve(old);
 for(const id of ['j','k'])assert.equal(old.units.filter(u=>u.id===id).length,1);
}
console.log('PASS: both editions; scheduled timing, blocked entries, independent retries, save/load, old-save recovery, no duplicates or resurrection.');
