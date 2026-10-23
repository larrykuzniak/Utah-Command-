'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const dir=path.resolve(__dirname,'../game'),html=fs.readFileSync(dir+'/index.html','utf8'),elements={};
function node(attrs='') {const e={open:false,value:'',checked:false,disabled:false,style:{},dataset:{},classList:{toggle(){},add(){},remove(){}},showModal(){this.open=true},close(){this.open=false},scrollIntoView(){},insertAdjacentElement(){},setAttribute(k,v){this[k]=v},getAttribute(k){return this[k]},click(){if(!this.disabled)this.onclick?.()},querySelector(){return null},querySelectorAll(selector){const match=selector.match(/^\[([^\]]+)\]$/);if(match)return this.children.filter(c=>Object.hasOwn(c,match[1]));return this.children.filter(c=>c.tag===selector)},children:[],textContent:''};for(const a of attrs.matchAll(/([\w-]+)(?:="([^"]*)")?/g)){a[2]=a[2]?.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');e[a[1]]=a[2]??true;if(a[1].startsWith('data-'))e.dataset[a[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=a[2];}e.checked=/\bchecked\b/.test(attrs);e.disabled=/\bdisabled\b/.test(attrs);let inner='';Object.defineProperty(e,'innerHTML',{get:()=>inner,set:v=>{inner=v;e.children=[];for(const m of v.matchAll(/<(button|input|select|div|dialog|nav)\b([^>]*)>/g)){const child=node(m[2]);child.tag=m[1];if(child.id)elements[child.id]=child;e.children.push(child);}for(const m of v.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)){const id=/id="([^"]+)"/.exec(m[1])?.[1];if(!id)continue;const options=[...m[2].matchAll(/<option value="([^"]*)"([^>]*)>/g)];(elements[id]??=node()).value=(options.find(x=>/selected/.test(x[2]))||options[0])?.[1]||'';}}});return e;}
const root=node();root.innerHTML=html;const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'unique HTML ids');
// Register the tabs with their child controls, as a browser does.
elements['desk-tabs'].innerHTML=html.match(/<nav id="desk-tabs"[^>]*>([\s\S]*?)<\/nav>/)[1];
const storage={},ctx={console,window:{addEventListener(){}},document:{createElement(){return node()},body:{appendChild(){},classList:{toggle(){}}},getElementById(id){return elements[id]??=(node())},querySelector(){return null}},localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},confirm:()=>true,alert(){},setTimeout,Blob,URL};vm.createContext(ctx);const run=code=>vm.runInContext(code,ctx),load=file=>run(fs.readFileSync(dir+'/'+file,'utf8'));load('engine.js');ctx.Game=ctx.window.Game;load('command-services.js');load('logistics-ui.js');load('terrain.js');ctx.TerrainMap=ctx.window.TerrainMap;load('frontage.js');ctx.Frontage=ctx.window.Frontage;load('proving-ground.js');load('app.js');load('command-desk.js');

run("s=G.fresh('proving-ground');selected='pg-a';render()");
if(process.env.PROVING_QA_SVG)fs.writeFileSync(process.env.PROVING_QA_SVG,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1898 1170" width="1898" height="1170">'+elements.map.innerHTML+'</svg>');
assert(!elements['training-controls'].hidden);assert(elements.map.innerHTML.includes('data-x="23" data-y="17"'));
assert(elements.map.innerHTML.includes('data-frontage="pg-a"'));assert(elements.map.innerHTML.includes('width="1852" height="1102"'),'frontage clipping spans the full extended battlefield');assert.equal(elements.map.viewBox,'0 0 1898 1170');
assert(elements.status.textContent.includes('Free testing'));assert(elements.turn.textContent.includes('OPEN-ENDED'));
const clickAction=action=>elements['training-controls'].querySelectorAll('[data-training]').find(b=>b.dataset.training===action).click();
run("s.units.find(u=>u.id==='pg-a').hp=3");clickAction('restore');assert.equal(run("s.units.find(u=>u.id==='pg-a').hp"),10);
elements['training-x'].value='24';elements['training-y'].value='17';elements['training-side'].value='us';elements['training-type'].value='tank';elements['training-add'].click();assert.equal(run('s.sandbox.queue.length'),1);
run('G.resolve(s);render();save()');assert.equal(run('s.sandbox.queue.length'),0);assert(run('valid(JSON.parse(localStorage.getItem(KEY)))'));
elements['training-stock'].checked=true;elements['training-stock'].onchange();assert(run('s.sandbox.autoResupply'));
run("s.turn=100;G.resolve(s);render();save()");assert(run('valid(JSON.parse(localStorage.getItem(KEY)))'));
run("s=G.fresh('utah');render()");assert(elements['training-controls'].hidden);assert.equal(elements.map.viewBox,'0 0 750 650');
console.log('PASS: training panel, extended map and frontage rendering, replenish/restore/reinforcement controls, normal scenario isolation, and UI saves beyond turn 100.');

load('builder.js');run("s=G.fresh('proving-ground');BuilderUI.blank()");assert(run('G.scenarioSpecValid(BuilderUI.draft)'));elements['builder-open'].click();assert(elements['builder-current'].disabled);

const normal=fs.readFileSync(dir+'/index.html','utf8'),testing=fs.readFileSync(dir+'/testing/index.html','utf8');
assert(!normal.includes('src="proving-ground.js"'));assert(testing.includes('window.UTAH_TEST_EDITION=true'));
assert(!fs.readFileSync(dir+'/sw.js','utf8').includes('proving-ground.js'));assert(fs.readFileSync(dir+'/testing/sw.js','utf8').includes('../proving-ground.js?test=0.24.0'));
ctx.window.UTAH_TEST_EDITION=true;
// Reload in a fresh context with the test flag, proving the entry restores only its own save slot.
const tester={...ctx,window:{addEventListener(){},UTAH_TEST_EDITION:true},localStorage:ctx.localStorage};vm.createContext(tester);
for(const file of ['engine.js','command-services.js','proving-ground.js'])vm.runInContext(fs.readFileSync(dir+'/'+file,'utf8'),tester);
tester.Game=tester.window.Game;vm.runInContext(fs.readFileSync(dir+'/app.js','utf8'),tester);
assert.equal(vm.runInContext('KEY',tester),'utah-command-testing-v1');assert.equal(vm.runInContext('s.scenarioId',tester),'proving-ground');
assert(storage['utah-command-v1']);assert(storage['utah-command-testing-v1']);
console.log('PASS: separate testing entry, isolated save keys, and no proving-ground asset in the regular offline release.');
