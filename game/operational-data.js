/* Utah Command operational data exchange v1.
 * Read-only normalized snapshot. Historical provenance is mandatory for numeric personnel.
 * No hidden enemy details or mutable state references cross the staff-report boundary.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.UtahData=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION=1;
 const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
 const int=(v,d=0)=>Number.isSafeInteger(v)?v:d;
 const clean=s=>String(s??'').slice(0,160);
 const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
 function checkLedger(ledger){
  const errors=[];
  if(!ledger||typeof ledger!=='object')return ['Missing personnel ledger'];
  const keys=['authorized','present','fit','killed','wounded','missing','temporarilyUnavailable','returnedToDuty','replacements'];
  for(const k of keys)if(!Number.isSafeInteger(ledger[k])||ledger[k]<0)errors.push('Invalid '+k);
  if(errors.length)return errors;
  if(ledger.present>ledger.authorized+ledger.replacements)errors.push('Present exceeds authorized + replacements');
  if(ledger.fit+ledger.wounded+ledger.missing+ledger.temporarilyUnavailable>ledger.present)errors.push('Personnel categories exceed present; check ledger conventions');
  if(ledger.returnedToDuty>ledger.wounded+ledger.temporarilyUnavailable)errors.push('Returned-to-duty exceeds eligible categories');
  return errors;
 }
 function normalizeUnit(u){
  if(!u||typeof u!=='object'||typeof u.id!=='string'||!u.id)return null;
  const hp=clamp(int(u.hp),0,10),ledger=u.personnelLedger;
  const errors=ledger?checkLedger(ledger):[];
  const personnel=ledger&&errors.length===0?
   {basis:'recorded',authorized:ledger.authorized,present:ledger.present,fit:ledger.fit,killed:ledger.killed,wounded:ledger.wounded,missing:ledger.missing,temporarilyUnavailable:ledger.temporarilyUnavailable,returnedToDuty:ledger.returnedToDuty,replacements:ledger.replacements}:
   {basis:'unavailable',authorized:null,present:null,fit:null,killed:null,wounded:null,missing:null,temporarilyUnavailable:null,returnedToDuty:null,replacements:null};
  return {id:clean(u.id),name:clean(u.name),side:clean(u.side),type:clean(u.type),regimentId:clean(u.regimentId||u.regiment||''),commandId:clean(u.commandId||''),x:int(u.x),y:int(u.y),
   strength:hp,cohesion:clamp(int(u.cohesion,100),0,100),fatigue:clamp(int(u.fatigue),0,4),suppression:Math.max(0,int(u.suppression)),stock:clamp(int(u.stock,2),0,3),ammo:Math.max(0,int(u.ammo,6)),
   order:u.order?clean(u.order.type):null,mission:u.missionOrder?clean(u.missionOrder.type):null,
   personnel,ledgerErrors:errors};
 }
 function snapshot(state,options={}){
  if(!state||!Array.isArray(state.units))throw new TypeError('Expected battle state with units');
  const viewer=options.viewer||'us',omniscient=options.omniscient===true&&options.debug===true;
  const visible=typeof options.isVisible==='function'?options.isVisible:()=>false;
  const units=[],contacts=[];
  for(const raw of state.units){
   const u=normalizeUnit(raw);if(!u)continue;
   if(omniscient||raw.side===viewer){units.push(u);continue}
   // Never expose actual strength, losses, supply, order or HQ to the player's staff.
   if(visible(raw,state)){contacts.push({id:u.id,x:u.x,y:u.y,type:u.type,lastSeenTurn:int(state.turn),confidence:'observed'});}
  }
  const byId=new Map(units.map(u=>[u.id,u]));
  const commands=units.filter(u=>u.type==='hq').map(h=>({id:h.id,name:h.name,parentId:h.commandId||null,
    subordinates:units.filter(u=>u.commandId===h.id).map(u=>u.id)}));
  const totals={combatUnits:units.filter(u=>u.type!=='hq'&&u.strength>0).length,
    lostUnits:units.filter(u=>u.type!=='hq'&&u.strength===0).length,
    readyUnits:units.filter(u=>u.type!=='hq'&&u.strength>0&&u.cohesion>=60&&u.stock>0).length,
    lowSupply:units.filter(u=>u.type!=='hq'&&u.strength>0&&u.stock<=1).length,
    personnelKnown:units.filter(u=>u.personnel.basis==='recorded').length,
    personnelUnknown:units.filter(u=>u.personnel.basis!=='recorded').length};
  const errors=units.flatMap(u=>u.ledgerErrors.map(e=>u.id+': '+e));
  const seen=new Set();
  for(const u of units){if(seen.has(u.id))errors.push('Duplicate unit ID: '+u.id);seen.add(u.id);
   if(u.commandId&&!byId.has(u.commandId))errors.push(u.id+': command parent not in friendly snapshot');
  }
  return {schema:'utah-operational-v1',version:VERSION,turn:int(state.turn),scenarioId:clean(state.scenarioId),viewer,
   weather:clean(state.weather||'clear'),units,contacts,commands,totals,errors};
 }
 function diff(previous,current){
  if(previous.schema!=='utah-operational-v1'||current.schema!=='utah-operational-v1')throw new Error('Incompatible snapshots');
  const old=new Map(previous.units.map(u=>[u.id,u]));
  return current.units.flatMap(u=>{const p=old.get(u.id);if(!p)return [{unitId:u.id,kind:'arrival',turn:current.turn}];
   const fields=['strength','cohesion','fatigue','suppression','stock','ammo','order','mission','commandId'];
   return fields.filter(k=>u[k]!==p[k]).map(k=>({unitId:u.id,kind:'change',field:k,before:p[k],after:u[k],turn:current.turn}));
  });
 }
 function index(s){const units=new Map(s.units.map(u=>[u.id,u]));const regiments=new Map();
  for(const u of s.units){if(!u.regimentId)continue;if(!regiments.has(u.regimentId))regiments.set(u.regimentId,[]);
   regiments.get(u.regimentId).push(u.id)}
  return {units,regiments};
 }
 return Object.freeze({VERSION,checkLedger,normalizeUnit,snapshot,diff,index});
});
