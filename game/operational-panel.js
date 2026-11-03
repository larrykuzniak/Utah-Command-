/* Operational Data Desk: read-only live state, no game-rule changes. */
(function(){
'use strict';
const trigger=document.getElementById('data-desk-open'),dialog=document.getElementById('data-desk-dialog');
if(!trigger||!dialog||typeof UtahData==='undefined')return;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;':'&quot;',"'":'&#39;'}[c]));
let previous=null;
function report(){
 const current=UtahData.snapshot(s,{viewer:'us',isVisible:(u)=>!s.fog||s.finished||G.spotted(s,u)});
 const changes=previous?UtahData.diff(previous,current):[];
 previous=current;
 $('data-desk-summary').textContent='Turn '+current.turn+' · '+current.totals.combatUnits+' active formations · '+current.totals.readyUnits+' ready · '+current.totals.lowSupply+' low supply · '+current.contacts.length+' observed enemy contacts';
 $('data-desk-quality').textContent=current.errors.length?current.errors.join(' | '):'IDs and command references validated. Personnel headcounts unavailable until a sourced ledger is attached; abstract strength is not a casualty count.';
 $('data-desk-table').innerHTML='<thead><tr><th>Formation</th><th>HQ link</th><th>Strength</th><th>Cohesion</th><th>Supply</th><th>Order</th></tr></thead><tbody>'+current.units.filter(u=>u.type!=='hq').map(u=>'<tr><th>'+esc(u.name)+'</th><td>'+esc(u.commandId||'—')+'</td><td>'+u.strength+'/10</td><td>'+u.cohesion+'%</td><td>'+u.stock+'/3</td><td>'+esc(u.order||u.mission||'none')+'</td></tr>').join('')+'</tbody>';
 $('data-desk-changes').textContent=changes.length?changes.slice(0,30).map(c=>c.kind==='arrival'?c.unitId+' arrived':c.unitId+': '+c.field+' '+c.before+' → '+c.after).join('\n'):'No previous desk snapshot for comparison.';
 $('data-desk-export').onclick=()=>{
  const blob=new Blob([JSON.stringify(current,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='utah-operational-turn-'+current.turn+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
 };
}
trigger.addEventListener('click',()=>{report();dialog.showModal()});
$('data-desk-refresh').addEventListener('click',report);
$('data-desk-close').addEventListener('click',()=>dialog.close());
})();
