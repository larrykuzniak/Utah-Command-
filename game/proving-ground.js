/* Fictional combined-arms exercise. Uses the normal engine, with explicit training controls. */
(function(root){
'use strict';
const G=root.Game,width=24,height=18;
const terrain=Array.from({length:height},(_,y)=>Array.from({length:width},(_,x)=>{
 if([3,8,14].includes(y)||[5,16,23].includes(x))return 'road';
 if((x<6&&y>10)||(x>=9&&x<=12&&y>=10))return 'hedgerow';
 if(x>=10&&x<=12&&![3,8,14].includes(y))return 'marsh';
 return 'field';
}));
for(const [x,y] of [[5,3],[5,8],[6,14],[16,8],[18,3]])terrain[y][x]='town';
const deployment=[];
function add(id,name,side,x,y,type='infantry',extra={}){deployment.push({id,name,side,x,y,type,hp:10,...extra})}
add('pg-a','1/8 Infantry','us',21,3);add('pg-b','2/8 Infantry','us',21,6);add('pg-c','3/8 Infantry','us',21,9);
add('pg-d','1/22 Infantry','us',21,12);add('pg-e','2/22 Infantry','us',22,15);add('pg-f','3/22 Infantry','us',22,1);
add('pg-t1','70th Tank company A','us',20,5,'tank');add('pg-t2','70th Tank company B','us',21,14,'tank');
add('pg-g1','29th Field Art. battery A','us',23,4,'artillery');add('pg-g2','29th Field Art. battery B','us',23,11,'artillery');
add('pg-eng','Combat engineer company','us',20,8,'infantry',{organicEngineers:true});
add('pg-recon','Reconnaissance detachment','us',20,1);
for(const [i,x,y] of [[1,18,3],[2,17,8],[3,18,14],[4,14,3],[5,14,14],[6,5,3],[7,5,8],[8,6,14]])add('pg-r'+i,'Roadblock '+i+' · platoon equivalent','de',x,y,'infantry',{hp:3});
add('pg-armor-n','Armor target group N','de',16,4,'tank');add('pg-armor-s','Armor target group S','de',15,13,'tank');
add('pg-village','Village defense company','de',16,8);add('pg-hill','Western defense company','de',3,6);
add('pg-guns-n','Defense gun section N','de',8,2,'artillery');add('pg-guns-s','Defense gun section S','de',7,15,'artillery');
G.scenarios.push({id:'proving-ground',name:'Command Proving Ground',date:'Fictional combined-arms training area',start:360,turns:1000000000,supply:60,air:99,faction:'us',nation:'American',theme:'training',edge:'TRAINING REAR AREA',mode:'sandbox',difficulty:'Sandbox',sandbox:true,width,height,terrain,riverX:11,bridgeRows:[3,8,14],reinforce:1000000000,deployment,objectives:[{x:5,y:3,name:'Northern training objective'},{x:5,y:8,name:'Western training objective'},{x:6,y:14,name:'Southern training objective'}],brief:'Open-ended 24 × 18 testing ground. Static defenders return fire. Practice maneuver, frontage, support, attachments, reports and river crossings. Training controls add units and replenish resources. Capturing objectives or losing forces never ends the exercise.'});
function note(s,message){s.log=['TRAINING — '+message,...s.log].slice(0,120)}
function restore(u){Object.assign(u,{hp:10,fatigue:0,cohesion:100,suppression:0,stock:3,ammo:6,supplied:true,replacementQuality:1,preparedTarget:null,preparedTurn:0,order:null})}
function freshUnit(s,q){const u={id:'pg-extra-'+(++s.sandbox.sequence),name:q.name||('Training '+q.side+' '+q.type+' '+s.sandbox.sequence),side:q.side,x:q.x,y:q.y,type:q.type,hp:q.hp||10,fatigue:0,stock:3,priority:'normal',supplyRequest:1,routePolicy:'shortest',supplyEntry:'auto',supplied:true,order:null,organicEngineers:!!q.engineers};s.units.push(u);G.migrate(s);return u}
function action(s,kind,o={}){
 if(!G.scenario(s).sandbox||!s.sandbox)return 'Open the Command Proving Ground first.';
 const fields=()=>s.units.filter(u=>u.side==='us');
 if(kind==='replenish'){for(const u of fields().filter(u=>u.hp>0)){u.stock=3;u.ammo=6}for(const p of s.supplyPoints||[])if(!['lost','retired'].includes(p.status))p.stock=p.capacity;s.airRemaining=99;note(s,'Air missions, friendly reserves, artillery ammunition and active supply-point stocks replenished.');return null}
 if(kind==='restore'){const u=s.units.find(u=>u.id===o.id);if(!u)return 'Select a unit to restore.';if(u.hp<=0&&G.alive(s).some(v=>v.x===u.x&&v.y===u.y))return 'Its former hex is occupied. Add a fresh reinforcement at another hex.';restore(u);note(s,u.name+' restored to full readiness. Existing attachments and standing mission retained.');return null}
 if(kind==='queue'){
  if(!['us','de'].includes(o.side)||!['infantry','tank','artillery','engineers'].includes(o.type))return 'Choose a side and unit type.';
  if(!Number.isInteger(o.x)||!Number.isInteger(o.y)||['off','sea','rear'].includes(G.cell(o.x,o.y,s)))return 'Choose a battlefield hex inside the training map.';
  const queue=s.sandbox.queue||(s.sandbox.queue=[]);if(s.units.length+queue.length>=G.unitLimit(s))return 'Training limit reached (120 units, including losses and pending arrivals). Reset the exercise to clear it.';
  queue.push({side:o.side,type:o.type==='engineers'?'infantry':o.type,engineers:o.type==='engineers',x:o.x,y:o.y,hp:o.weak?3:10});note(s,'Reinforcement requested at '+(o.x+1)+', '+(o.y+1)+'. Arrives after the next resolution; occupied entries retry.');return null
 }
 if(kind==='arrivals'){const pending=[];for(const q of s.sandbox.queue||[]){if(G.alive(s).some(u=>u.x===q.x&&u.y===q.y)){pending.push(q);o.events.push('TRAINING REINFORCEMENT DELAY — Entry '+(q.x+1)+', '+(q.y+1)+' occupied; will retry.')}else{const u=freshUnit(s,q);o.events.push('TRAINING REINFORCEMENT — '+u.name+' arrives at '+(q.x+1)+', '+(q.y+1)+'.')}}s.sandbox.queue=pending;return null}
 if(kind==='targets'){
  // Keep identities for references, recon history and save validity. Do not overlap friendly troops.
  let count=0,blocked=0;for(const v of deployment.filter(v=>v.side==='de')){const u=s.units.find(u=>u.id===v.id);if(!u)continue;if(G.alive(s).some(t=>t.id!==u.id&&t.x===v.x&&t.y===v.y)){blocked++;continue}restore(u);Object.assign(u,{x:v.x,y:v.y,hp:v.hp});count++;}
  G.updateIntel(s);note(s,count+' original enemy positions reset; '+blocked+' occupied positions retained.');return null
 }
 if(kind==='crossings'){s.damagedBridges=['bridge-8'];note(s,'Middle crossing damaged; northern and southern crossings intact.');return null}
 return 'Unknown training action.';
}
function valid(s){
 if(!G.scenario(s).sandbox)return true;
 const t=s.sandbox;if(!t||typeof t.unlimitedAir!=='boolean'||typeof t.autoResupply!=='boolean'||!['static','active'].includes(t.enemyMode)||!Number.isInteger(t.sequence)||t.sequence<0||t.sequence>120)return false;
 if(t.queue!==undefined&&(!Array.isArray(t.queue)||s.units.length+t.queue.length>120||!t.queue.every(q=>q&&['us','de'].includes(q.side)&&['infantry','tank','artillery'].includes(q.type)&&typeof q.engineers==='boolean'&&Number.isInteger(q.x)&&Number.isInteger(q.y)&&q.x>=0&&q.x<width&&q.y>=0&&q.y<height&&[3,10].includes(q.hp))))return false;
 return true;
}
G.sandboxValid=valid;
root.ProvingGround={action};
})(typeof window==='undefined'?globalThis:window);
