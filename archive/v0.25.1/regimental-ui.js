/* Division command interface. State and rendering are owned by app.js. */
var RegimentalUI=(()=>{
 const $=id=>document.getElementById(id);
 let chosen=null;
 const groups=()=>G.regiments(s);
 const orderText=o=>!o?'Awaiting division orders':(o.paused?'PAUSED · ':'')+({seize:'Seize, then hold ',defend:'Defend ',support:'Support ',reserve:'Reserve for '})[o.type]+(['seize','defend'].includes(o.type)?G.scenario(s).objectives[o.objective]?.name:groups().find(r=>r.id===o.targetRegiment)?.name||'unavailable regiment')+' · '+o.effort+' effort';
 function fillGoal(o){const type=$('regiment-mission').value,list=groups();$('regiment-goal-label').textContent=['seize','defend'].includes(type)?'Regimental objective':'Supported regiment';
  $('regiment-goal').innerHTML=['seize','defend'].includes(type)?G.scenario(s).objectives.map((v,i)=>`<option value="${i}" ${o?.objective===i?'selected':''}>${esc(v.name)}</option>`).join(''):list.filter(r=>r.id!==chosen&&r.members.some(u=>u.hp>0)).map(r=>`<option value="${r.id}" ${o?.targetRegiment===r.id?'selected':''}>${esc(r.name)}</option>`).join('');
 }
 function form(){const list=groups();if(!list.some(r=>r.id===chosen))chosen=list.find(r=>r.members.some(u=>u.hp>0))?.id||list[0]?.id||null;const group=list.find(r=>r.id===chosen),o=s.regimentalOrders?.[chosen];
  $('regiment-select').innerHTML=list.map(r=>`<option value="${r.id}" ${chosen===r.id?'selected':''}>${esc(r.name)}</option>`).join('');
  $('regiment-mission').value=o?.type||'seize';$('regiment-risk').value=o?.risk||'balanced';$('regiment-effort').value=o?.effort||'supporting';fillGoal(o);
  $('regiment-current').textContent=group?group.name+' · '+orderText(o):'This scenario has no identified infantry regiments. Use battalion directives.';
  const unavailable=!group||!group.members.some(u=>u.hp>0)||s.finished; $('regiment-issue').disabled=unavailable;$('regiment-pause').disabled=unavailable||!o;$('regiment-cancel').disabled=unavailable||!o;$('regiment-pause').textContent=o?.paused?'Resume regimental mission':'Pause regimental mission';
  $('regiment-subordinates').innerHTML=group?`<table><thead><tr><th>Battalion</th><th>Task from regiment</th><th>Latest report</th></tr></thead><tbody>${group.members.map(u=>`<tr><th>${esc(u.name)}<small>${u.hp}/10 strength</small></th><td>${u.hp<=0?'Out of action':esc(u.regimentalTask?.job||'Awaiting regimental assignment')}<small>${esc(G.missionName(s,u.missionOrder))}${u.missionOrder?.paused?' · paused':''}${u.order?' · direct intervention queued':''}</small></td><td>${esc(u.commandReport||'No report yet.')}</td></tr>`).join('')}</tbody></table>`:'';
 }
 function refresh(){const list=groups();$('regimental-summary').hidden=!list.length;
  $('regimental-context').textContent=s.scenarioId==='utah-division'?'4th Infantry Division · Order the 8th, 12th and 22nd Infantry. Battalion AI executes each regimental plan.':'This is '+G.scenario(s).name+'. Only its deployed regiments are listed. Choose Utah · 4th Infantry Division for the 8th, 12th and 22nd Infantry.';
  $('regimental-cards').innerHTML=list.map(r=>`<button class="regiment-card" data-regiment="${r.id}"><strong>${esc(r.name)}</strong><span>${r.members.filter(u=>u.hp>0).length}/${r.members.length} battalions operational · ${r.members.reduce((n,u)=>n+u.hp,0)} strength</span><span>${esc(orderText(s.regimentalOrders?.[r.id]))}</span></button>`).join('');
  $('regimental-cards').querySelectorAll('[data-regiment]').forEach(b=>b.onclick=()=>open(b.dataset.regiment));
  if($('regimental-dialog').open)form();
 }
 function open(id){chosen=id||G.regimentOf(s.units.find(u=>u.id===selected)||{})||chosen;refresh();form();$('regiment-message').textContent='';$('map-menu-dialog').close();$('regimental-dialog').showModal()}
 $('regimental-open').onclick=()=>open();$('map-regimental').onclick=()=>open();$('regimental-close').onclick=()=>$('regimental-dialog').close();$('regimental-scenario').onclick=()=>{$('scenarios').click()};
 $('regiment-select').onchange=()=>{chosen=$('regiment-select').value;form();$('regiment-message').textContent=''};
 $('regiment-mission').onchange=()=>fillGoal();
 $('regiment-issue').onclick=()=>{const type=$('regiment-mission').value,mission={type,risk:$('regiment-risk').value,effort:$('regiment-effort').value,...(['seize','defend'].includes(type)?{objective:Number($('regiment-goal').value)}:{targetRegiment:$('regiment-goal').value})};const error=G.issueRegimentalOrder(s,chosen,mission);if(!error){save();render();form()}$('regiment-message').textContent=error||'Division order issued. The regiment assigned its battalion tasks. Issue orders to other regiments, then resolve the turn.'};
 $('regiment-pause').onclick=()=>{const error=G.pauseRegimentalOrder(s,chosen);if(!error){save();render();form()}$('regiment-message').textContent=error||'Regimental mission updated.'};
 $('regiment-cancel').onclick=()=>{const error=G.cancelRegimentalOrder(s,chosen);if(!error){save();render();form()}$('regiment-message').textContent=error||'Regimental mission canceled. Other regiments retain their orders.'};
 $('regiment-resolve').onclick=()=>{$('regimental-dialog').close();reviewCommandTurn()};
 refresh();return {refresh,open};
})();
