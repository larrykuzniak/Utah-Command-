'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={window:{}};vm.createContext(ctx);
for(const f of ['engine.js','frontage.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../game',f),'utf8'),ctx);
const G=ctx.window.Game,F=ctx.window.Frontage,pos=p=>({x:56+p.x*76+(p.y%2)*38,y:58+p.y*62});
let s=G.fresh('inland'),a=s.units.find(u=>u.id==='a'),b=s.units.find(u=>u.id==='b');
const row=()=>F.model(G,s,pos).find(r=>r.id==='a');
const before=JSON.stringify(s);F.model(G,s,pos);assert.equal(JSON.stringify(s),before,'display model never mutates battle or RNG');
a.order={type:'move',x:3,y:a.y};const march=row();a.order={type:'defend'};const defense=row();
assert(defense.width>march.width*2,'deployment must spread beyond a march column');assert(defense.L.y>defense.R.y,'left flank faces south when advancing inland/west');
a.order={type:'move',x:a.x,y:0};assert(row().forward.y<0,'frontage follows northward movement axis');
a.order={type:'defend'};const full=row().width;a.hp=3;a.fatigue=4;a.stock=0;assert(row().width<full,'depletion reduces estimated frontage');
a.hp=10;a.fatigue=0;a.stock=2;
// Exact schematic neighbor geometries: aligned adjacent fronts, a real gap,
// and a formation in depth must not all be reported as flank contact.
Object.assign(a,{x:4,y:4});Object.assign(b,{x:4,y:6,order:{type:'defend'}});
s.units=s.units.filter(u=>['a','b'].includes(u.id));
let f=row().flanks.find(f=>f.side==='left');assert.equal(f.id,'b');assert.equal(f.status,'contact');
b.y=8;f=row().flanks.find(f=>f.side==='left');assert.equal(f.status,'gap');assert(f.gap>.25);
b.y=6;b.x=3;f=row().flanks.find(f=>f.side==='left');assert.equal(f.status,'staggered');
b.x=0;f=row().flanks.find(f=>f.side==='left');assert.equal(f.status,'open','distant rear/front formation cannot close a flank');
b.hp=0;assert.equal(F.model(G,s,pos).length,1,'destroyed formations have no frontage');
b.hp=10;b.attachedTo='a';assert.equal(F.model(G,s,pos).length,1,'attached support does not count as a second line');
// Fog: moving a concealed enemy cannot move a front or change flank reports.
s=G.fresh();a=s.units.find(u=>u.id==='a');const enemy=s.units.find(u=>u.side==='de');
s.fog=true;a.order={type:'attack',target:enemy.id};const hiddenG={...G,spotted:()=>false};
let hidden=JSON.stringify(F.model(hiddenG,s,pos));enemy.x=0;enemy.y=8;
assert.equal(JSON.stringify(F.model(hiddenG,s,pos)),hidden,'concealed enemy positions never affect overlay');
const visibleG={...G,spotted:()=>true};assert.notEqual(JSON.stringify(F.model(visibleG,s,pos)),hidden,'observed attack target may set attack axis');
for(const scenario of G.scenarios){s=G.fresh(scenario.id);for(const hp of [10,1]){s.units.filter(u=>u.side==='us').forEach(u=>u.hp=hp);const rows=F.model(G,s,pos);assert(rows.every(r=>Number.isFinite(r.width)&&r.width>0));const svg=F.draw(rows,'a',v=>String(v),true);assert(!/NaN|Infinity|undefined/.test(svg));assert(rows.every(r=>s.units.find(u=>u.id===r.id).side==='us'));}}
s=G.fresh();a=s.units.find(u=>u.id==='a');let p=row().p;a.x--;assert.notEqual(row().p.x,p.x,'frontage moves with the formation');
console.log('PASS: deployment, orientation, strength/readiness, left/right contact-gap-depth, destroyed/attached exclusions, fog privacy, all scenarios, movement, pure state.');
