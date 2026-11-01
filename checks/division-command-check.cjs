const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const G=require('../game/engine.js');require('../game/command-services.js')(G);
let s=G.fresh('utah-division');
assert.equal(G.headquarters(s).length,4);assert.equal(G.headquarters(s).filter(h=>h.echelon==='Regiment').length,3);assert(!s.units.some(u=>['hq-corps','hq-army'].includes(u.id)));
assert(G.headquartersValid(s));assert(G.advancedValid(s));assert(G.commandServicesValid(s));assert(G.commandValid(s));
for(const [id,obj] of [['reg-8',0],['reg-12',1],['reg-22',2]]){const r=G.regiments(s).find(r=>r.id===id),h=G.regimentHQ(s,id);assert.equal(h.parentId,'hq-division');assert(r.members.every(u=>u.commandId===h.id));assert(r.members.every(u=>G.commandStatus(s,u,'Division').ok));assert.equal(s.regimentalOrders[id].objective,obj);assert(r.members.every(u=>u.missionOrder));}
const u8=s.units.find(u=>u.id==='a'),u12=s.units.find(u=>u.id==='12a'),h12=G.regimentHQ(s,'reg-12');h12.hp=2;
assert.equal(G.regimentalDistribution(s,u12).limit,1);assert.equal(G.regimentalDistribution(s,u8).limit,3);
u8.stock=0;u12.stock=0;let supply=G.logistics(s);assert.equal(supply.rows.find(r=>r.id===u12.id).delivery,1);assert(supply.rows.find(r=>r.id===u8.id).delivery>1,'another regiment keeps full distribution allowance subject to distance');
h12.hp=0;assert.equal(G.regimentalDistribution(s,u12).limit,0);assert.equal(G.logistics(s).rows.find(r=>r.id===u12.id).delivery,0);
// Multiple objectives are allocated to distinct battalions or advanced in sequence.
s=G.fresh('utah-division');assert.equal(G.issueRegimentalOrder(s,'reg-8',{type:'seize',objective:0,objectives:[0,1,2],execution:'split',effort:'main',risk:'balanced'}),null);
assert.deepEqual(new Set(G.regiments(s)[0].members.map(u=>u.missionOrder.objective)),new Set([0,1,2]));
assert.equal(G.issueRegimentalOrder(s,'reg-8',{type:'seize',objective:0,objectives:[0,1,2],execution:'sequential',effort:'main',risk:'balanced'}),null);
s.owners[0]='us';G.syncRegimentalOrders(s);assert(G.regiments(s)[0].members.filter(u=>u.missionOrder.type==='seize').every(u=>u.missionOrder.objective===1));s.owners[1]='us';G.syncRegimentalOrders(s);assert(G.regiments(s)[0].members.filter(u=>u.missionOrder.type==='seize').every(u=>u.missionOrder.objective===2));
const copy=JSON.parse(JSON.stringify(s));G.migrate(copy);assert(G.headquartersValid(copy));assert(G.commandValid(copy));assert.deepEqual(copy,s,'migration idempotent');
// Upgrade the actual previous engine's saved division state without moving or losing field units.
const oldEngine=require('../archive/v0.25.1/engine.js');const old=oldEngine.fresh('utah-division');old.units.find(u=>u.id==='12a').hp=6;const field=old.units.filter(u=>u.type!=='hq').map(u=>[u.id,u.x,u.y,u.hp]);G.migrate(old);assert.deepEqual(old.units.filter(u=>u.type!=='hq').map(u=>[u.id,u.x,u.y,u.hp]),field);assert(G.headquartersValid(old));assert(G.commandValid(old));assert(G.advancedValid(old));assert(G.commandServicesValid(old));const once=JSON.stringify(old);G.migrate(old);assert.equal(JSON.stringify(old),once);
// Full scenario runs keep parent HQs, legal movement, save/load and resources consistent.
for(const seed of [19440606,42,71]){s=G.fresh('utah-division');s.seed=seed;let moved=new Set();for(let n=0;n<20&&!s.finished;n++){
 const before=JSON.stringify(s),plan=G.commandPlan(s);assert.equal(JSON.stringify(s),before);assert(plan.proposals.every(p=>!p.order||p.order.type!=='move'||p.order.x<G.board(s).totalWidth));
 const reload=JSON.parse(before);G.migrate(reload);G.resolve(s);G.resolve(reload);assert.deepEqual(s,reload);assert(G.headquartersValid(s));assert(G.commandValid(s));assert(G.commandServicesValid(s));assert.equal(new Set(G.alive(s).map(u=>u.x+','+u.y)).size,G.alive(s).length);
 for(const r of G.regiments(s))if(r.members.some(u=>u.fatigue>0||u.hp<10))moved.add(r.id);
 }assert.equal(moved.size,3,'all regiments execute their initial missions');}
console.log('PASS: three own HQ chains, scoped distribution, default missions, multi-objective split/sequence, old-save migration, three complete deterministic division battles, legal HQ movement and resource validation.');
