'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={window:{}};vm.createContext(ctx);for(const file of ['engine.js','command-services.js','proving-ground.js','frontage.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../game',file),'utf8'),ctx);
const G=ctx.window.Game,F=ctx.window.Frontage;
const valid=vm.runInContext('('+fs.readFileSync(path.join(__dirname,'../game/app.js'),'utf8').match(/function valid\(p\)\{[\s\S]*?(?=\nfunction esc)/)[0]+')',vm.createContext({G}));
const fresh=()=>G.fresh('proving-ground');let s=fresh();assert.equal(G.board(s).width,24);assert.equal(G.board(s).height,18);assert.equal(s.units.length,30);assert(valid(s),'opening save valid');assert(G.makeReport(s).lines.some(t=>t.includes('Available on request')));
assert.equal(G.cell(23,17,s),'road');assert.equal(G.cell(24,17,s),'rear');assert.equal(G.cell(23,18,s),'off');assert(G.neighbors({x:22,y:16},s).some(p=>p.x===23));
const a=s.units.find(u=>u.id==='pg-a');assert(G.path(s,a,{x:22,y:4}));assert(F.model(G,s,p=>({x:p.x*76,y:p.y*62})).some(v=>v.id===a.id),'frontage on extended map');assert(G.edgeSupplyRoute(s,a).at(-1).x===23);
const before=s.units.filter(u=>u.side==='de').map(u=>[u.id,u.x,u.y]);G.planOpponent(s);for(const [id,x,y] of before){const u=s.units.find(u=>u.id===id);assert.notEqual(u.order?.type,'move');assert.equal(u.x,x);assert.equal(u.y,y)}
// Once the exercise has no remaining enemies or friendly maneuver units it still runs.
s.owners=['us','us','us'];for(const u of s.units)if(u.side==='de')u.hp=0;G.resolve(s);assert(!s.finished);for(const u of s.units)if(u.side==='us'&&u.type!=='hq')u.hp=0;G.resolve(s);assert(!s.finished);
assert.equal(G.sandboxAction(s,'queue',{side:'us',type:'tank',x:23,y:10}),null);G.resolve(s);assert(s.units.some(u=>u.id.startsWith('pg-extra-')&&u.hp>0));assert(valid(s),'save valid after losses and fresh arrival');
s=fresh();const occupied=s.units.find(u=>u.id==='pg-a');G.sandboxAction(s,'queue',{side:'us',type:'engineers',x:occupied.x,y:occupied.y});G.resolve(s);assert.equal(s.sandbox.queue.length,1);occupied.x=22;G.resolve(s);assert.equal(s.sandbox.queue.length,0);assert(s.units.find(u=>u.id==='pg-extra-1').organicEngineers);
assert.equal(G.assignAttachment(s,'div-armor','pg-a'),null);assert(G.assignAttachment(s,'div-armor','pg-b'));assert.equal(G.assignAttachment(s,'div-armor',null),null);assert.equal(G.assignAttachment(s,'div-armor','pg-b'),null);
const eng=s.units.find(u=>u.id==='pg-eng');eng.x=12;eng.y=8;eng.stock=3;eng.order={type:'repair',target:'bridge-8'};s.forwardSupplyEnabled=false;G.resolve(s);assert(!s.damagedBridges.includes('bridge-8'),'engineer repairs central crossing');G.sandboxAction(s,'crossings');assert(s.damagedBridges.includes('bridge-8'));
s=fresh();s.fog=false;const t=s.units.find(u=>u.id==='pg-armor-n');s.airRemaining=1;s.airTarget=t.id;G.resolve(s);assert.equal(s.airRemaining,99);assert(t.hp<10,'air strike executes');s.sandbox.unlimitedAir=false;s.airTarget=t.id;G.resolve(s);assert.equal(s.airRemaining,98);
G.sandboxAction(s,'replenish');assert(s.units.filter(u=>u.side==='us').every(u=>u.stock===3&&u.ammo===6));assert.equal(s.airRemaining,99);
// Test real turns beyond legacy 30/60 limits, including delayed patrols and log history.
s=fresh();s.turn=75;G.toggleOperational(s,false);G.toggleOperational(s,true);assert(G.operationalValid(s));G.resolve(s);assert.equal(s.turn,76);assert(valid(s),'turn 76 save round-trips');const broken=JSON.parse(JSON.stringify(s));broken.sandbox.enemyMode='bad';assert(!valid(broken),'malformed training options rejected');const copy=JSON.parse(JSON.stringify(s));G.migrate(copy);assert(valid(copy));assert.equal(copy.sandbox.enemyMode,'static');
// Existing normal scenarios retain victory/end conditions.
s=G.fresh('utah');for(const u of s.units)if(u.side==='de')u.hp=0;s.owners=['us','us','us'];G.resolve(s);assert(s.finished);
console.log('PASS: large-map movement, frontage, supply, static defenses, open-ended outcomes, arrivals/retries, attachments, bridging, renewable air, replenishment, and long-session save validation.');
