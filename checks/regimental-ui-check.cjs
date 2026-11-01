'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const dir=path.resolve(__dirname,'../game'),html=fs.readFileSync(dir+'/index.html','utf8'),elements={};
function node(attrs='') {const e={open:false,value:'',checked:false,disabled:false,style:{setProperty(k,v){this[k]=v}},dataset:{},classList:{toggle(){},add(){},remove(){}},showModal(){this.open=true},close(){this.open=false},scrollIntoView(){},insertAdjacentElement(){},setAttribute(k,v){this[k]=v},getAttribute(k){return this[k]},click(){if(!this.disabled)this.onclick?.()},querySelector(){return null},querySelectorAll(selector){const match=selector.match(/^\[([^\]]+)\]$/);if(match)return this.children.filter(c=>Object.hasOwn(c,match[1]));return this.children.filter(c=>c.tag===selector)},children:[],textContent:''};for(const a of attrs.matchAll(/([\w-]+)(?:="([^"]*)")?/g)){a[2]=a[2]?.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');e[a[1]]=a[2]??true;if(a[1].startsWith('data-'))e.dataset[a[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=a[2];}e.checked=/\bchecked\b/.test(attrs);e.disabled=/\bdisabled\b/.test(attrs);let inner='';Object.defineProperty(e,'innerHTML',{get:()=>inner,set:v=>{inner=v;e.children=[];for(const m of v.matchAll(/<(button|input|select|div|dialog|nav)\b([^>]*)>/g)){const child=node(m[2]);child.tag=m[1];if(child.id)elements[child.id]=child;e.children.push(child);}for(const m of v.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)){const id=/id="([^"]+)"/.exec(m[1])?.[1];if(!id)continue;const options=[...m[2].matchAll(/<option value="([^"]*)"([^>]*)>/g)];(elements[id]??=node()).value=(options.find(x=>/selected/.test(x[2]))||options[0])?.[1]||'';}}});return e;}
const root=node();root.innerHTML=html;const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'unique HTML ids');
// Register the tabs with their child controls, as a browser does.
elements['desk-tabs'].innerHTML=html.match(/<nav id="desk-tabs"[^>]*>([\s\S]*?)<\/nav>/)[1];
const storage={},ctx={console,window:{addEventListener(){}},document:{createElement(){return node()},body:{appendChild(){},classList:{toggle(){}}},getElementById(id){return elements[id]??=(node())},querySelector(){return null}},localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},confirm:()=>true,alert(){},setTimeout,Blob,URL};vm.createContext(ctx);const run=code=>vm.runInContext(code,ctx),load=file=>run(fs.readFileSync(dir+'/'+file,'utf8'));load('engine.js');ctx.Game=ctx.window.Game;load('command-services.js');load('logistics-ui.js');load('terrain.js');ctx.TerrainMap=ctx.window.TerrainMap;load('frontage.js');ctx.Frontage=ctx.window.Frontage;load('app.js');load('command-desk.js');

run("s=G.fresh('utah-division');captureSession(s.scenarioId);render()");load('regimental-ui.js');
run("RegimentalUI.open('reg-8')");
assert(elements['regiment-select'].innerHTML.includes('12th Infantry Regiment'));
elements['regiment-mission'].value='seize';elements['regiment-goal'].value='0';elements['regiment-effort'].value='main';elements['regiment-risk'].value='balanced';elements['regiment-issue'].onclick();
assert(elements['regiment-subordinates'].innerHTML.includes('Regimental reserve'));
assert.equal(run("s.regimentalOrders['reg-8'].effort"),'main');
elements['regiment-select'].value='reg-12';elements['regiment-select'].onchange();
assert.equal(elements['regiment-effort'].value,'supporting','new regiment does not inherit another regiment priority');
elements['regiment-mission'].value='defend';elements['regiment-goal'].value='2';elements['regiment-risk'].value='cautious';elements['regiment-issue'].onclick();
assert.equal(run("s.regimentalOrders['reg-8'].objective"),0);assert.equal(run("s.regimentalOrders['reg-12'].objective"),2);
assert(run('valid(JSON.parse(localStorage.getItem(KEY)))'),'UI saves pass actual app validator');
elements['regiment-pause'].onclick();assert(run("s.regimentalOrders['reg-12'].paused"));elements['regiment-pause'].onclick();
elements['regiment-cancel'].onclick();assert(!run("s.regimentalOrders['reg-12']"));assert(run("!!s.regimentalOrders['reg-8']"));
run('exitWithoutSaving()');assert.equal(storage['utah-command-v1'],undefined,'exit rolls regimental orders back to session start');
console.log('PASS: regimental UI, receiving regiment selection, separate form defaults, task display, actual save validator, pause/resume/cancel and exit rollback.');
