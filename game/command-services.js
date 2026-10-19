(function(root,factory){
  if(typeof module!=='undefined'&&module.exports)module.exports=factory;
  else root.CommandServices=factory(root.Game);
})(typeof window==='undefined'?globalThis:window,function(G){
  'use strict';
  const ranks={Regiment:0,Division:1,Corps:2,Army:3};
  const active=p=>['outbound','observing','returning'].includes(p.status);
  const land=(s,p)=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<9&&p.y>=0&&p.y<9&&!['off','sea','rear'].includes(G.cell(p.x,p.y,s));
  const clone=x=>JSON.parse(JSON.stringify(x));
  function log(s,kind,message,unitId=null,hqId=null){
    s.commandActivity.push({turn:s.turn,kind,message:message.slice(0,600),unitId,hqId});
    s.commandActivity=s.commandActivity.slice(-160);
  }
  function migrate(s){
    if(s.forwardSupplyEnabled===undefined)s.forwardSupplyEnabled=false;
    for(const k of ['supplyPoints','reconPatrols','reconReports','commandActivity','dismissedAdvice'])if(s[k]===undefined)s[k]=[];
    if(s.serviceSequence===undefined)s.serviceSequence=0;
    if(s.acknowledgedOrders===undefined)s.acknowledgedOrders={};
    for(const u of s.units)if(u.reconCommitted===undefined)u.reconCommitted=false;
  }
  function basePoint(s){
    const capacity=G.scenario(s).supply;
    return {id:'base-supply',name:'Rear supply base',x:8,y:4,stock:capacity*2,capacity:capacity*3,status:'active',readyTurn:s.turn,base:true};
  }
  function newGame(s){s.forwardSupplyEnabled=true;s.supplyPoints=[basePoint(s)];log(s,'supply','Rear supply base established. Staff advice and patrol orders are available from the Command desk.');}
  function enableSupply(s,on){
    if(s.finished)return 'The battle has ended.';
    if(!on&&s.supplyPoints.some(p=>!p.base&&p.stock>0&&p.status!=='lost'))return 'Recover the forward stocks before reverting to abstract supply.';
    s.forwardSupplyEnabled=!!on;
    if(on&&!s.supplyPoints.length){const p=basePoint(s);p.stock=G.scenario(s).supply;s.supplyPoints=[p];}
    log(s,'supply',on?'Stocked supply points enabled; the rear base receives the scenario allowance each turn.':'Abstract edge supply restored.');return null;
  }
  // This routing search permits friendly traffic through occupied hexes. It uses
  // the caller's known-state view for previews and actual positions at dispatch.
  function routeTo(s,from,to,policy='shortest',side='us'){
    const enemies=G.alive(s).filter(v=>v.side!==side),occupied=new Set(enemies.map(v=>v.x+','+v.y));
    const seen=new Set(),q=new G.RouteQueue({x:from.x,y:from.y,cost:0,path:[]},(a,b)=>a.cost-b.cost);
    while(q.length){const p=q.shift(),key=p.x+','+p.y;if(seen.has(key))continue;seen.add(key);
      if(p.x===to.x&&p.y===to.y)return [{x:from.x,y:from.y},...p.path];
      for(const n of G.neighbors(p,s)){
        const k=n.x+','+n.y;if(seen.has(k)||occupied.has(k)||!G.passage(s,p,n,{type:'supply'}))continue;
        const terrain=G.cell(n.x,n.y,s);let cost=policy==='roads'?(['road','beach'].includes(terrain)?1:terrain==='marsh'?4:3):1;
        if(policy==='cautious'&&enemies.some(e=>G.dist(n,e)<=1))cost+=6;
        q.push({...n,cost:p.cost+cost,path:[...p.path,n]});
      }
    }return null;
  }
  function choices(s,u,stocks=null){
    const sector=u.supplyEntry||'auto';
    return s.supplyPoints.filter(p=>p.status==='active'&&(stocks?stocks.get(p.id):p.stock)>0&&(sector==='auto'||sector===['north','center','south'][Math.floor(p.y/3)])).map(p=>{
      const route=routeTo(s,u,p,u.routePolicy||'shortest'),distance=route?route.length-1:Infinity;
      return {point:p,route,distance,limit:Math.max(1,3-Math.floor(distance/4))};
    }).filter(v=>v.route&&v.distance<=(v.point.base?12:5)).sort((a,b)=>b.limit-a.limit||a.distance-b.distance||a.point.id.localeCompare(b.point.id));
  }
  function supplyRoute(s,u){return choices(s,u)[0]?.route||null;}
  let dispatchState=null;
  function logistics(s,prepared=false){
    if(!prepared&&dispatchState!==s){const forecast=clone(s);prepareSupply(forecast,[]);return logistics(forecast,true);}
    const capacity=G.supplyCapacity(s),rank={high:0,normal:1,low:2},stocks=new Map(s.supplyPoints.map(p=>[p.id,p.stock]));let pool=capacity;
    const rows=G.alive(s).filter(u=>u.side==='us'&&u.type!=='hq').map(u=>({id:u.id,stock:u.stock,priority:u.priority,request:s.allocationMode==='manual'?u.supplyRequest:3-u.stock,delivery:0}));
    rows.sort((a,b)=>rank[a.priority]-rank[b.priority]||a.stock-b.stock||a.id.localeCompare(b.id));
    for(const r of rows){const u=s.units.find(u=>u.id===r.id),options=choices(s,u,stocks),choice=options[0];r.route=choice?.route||null;r.depotId=choice?.point.id||null;r.distance=choice?.distance??null;
      const requested=Math.min(r.request,3-r.stock);
      if(choice){r.delivery=Math.max(0,Math.min(requested,choice.limit,pool,stocks.get(r.depotId)));stocks.set(r.depotId,stocks.get(r.depotId)-r.delivery);pool-=r.delivery;r.stock+=r.delivery;}
      r.use=G.consumption(u,s);r.after=Math.max(0,r.stock-r.use);r.shortfall=Math.max(0,r.request-r.delivery);
      r.reason=!choice?'No stocked point in delivery range':!r.request?'No delivery requested':r.shortfall?(pool===0?'Transport allowance exhausted':'Distance, stocks, or reserve capacity limit'):'Request covered';
    }return {capacity,unused:pool,rows};
  }
  function setPoint(s,target,id=null){
    if(s.finished)return 'The battle has ended.';
    if(!s.forwardSupplyEnabled)return 'Enable stocked supply points first.';
    if(!land(s,target))return 'Choose a land hex inside the battlefield.';
    const known=knownState(s);
    if(G.alive(known).some(u=>u.side==='de'&&G.dist(u,target)===0))return 'That position is occupied by an observed enemy.';
    const p=id?s.supplyPoints.find(p=>p.id===id&&!p.base&&p.status!=='lost'):null;
    if(id&&!p)return 'Choose an available forward supply point.';
    if(!p&&s.supplyPoints.filter(p=>!p.base&&!['lost','retired'].includes(p.status)).length>=2)return 'Two forward points are already allocated. Relocate one of them.';
    if(s.supplyPoints.some(other=>other!==p&&other.status!=='lost'&&G.dist(other,target)===0))return 'Another supply point already occupies that hex.';
    const base=s.supplyPoints.find(v=>v.base&&v.status==='active');if(!base)return 'The rear supply base is unavailable.';
    const from=p||base,route=routeTo(known,from,target);if(!route)return 'Staff cannot identify an open supply route to that position.';
    const delay=Math.max(1,Math.ceil((route.length-1)/3)),point=p||{id:'forward-'+(++s.serviceSequence),name:'Forward supply point '+s.serviceSequence,base:false,stock:0,capacity:6,x:base.x,y:base.y};
    delete point.recovering;Object.assign(point,{status:'moving',target:{x:target.x,y:target.y},readyTurn:s.turn+delay});if(!p){s.supplyPoints=s.supplyPoints.filter(v=>!['lost','retired'].includes(v.status));s.supplyPoints.push(point);}
    log(s,'supply',point.name+' ordered to hex '+(target.x+1)+', '+(target.y+1)+'. Estimated '+delay+' turn(s); distribution suspended until established.');return null;
  }
  function recoverPoint(s,id){
    if(s.finished)return 'The battle has ended.';
    const p=s.supplyPoints.find(p=>p.id===id&&!p.base&&p.status==='active'),base=s.supplyPoints.find(p=>p.base&&p.status==='active');
    if(!p||!base)return 'Choose an active forward point and an available rear base.';
    const route=routeTo(knownState(s),p,base);if(!route)return 'No known route to recover these stocks.';
    p.recovering=true;p.status='moving';p.target={x:base.x,y:base.y};p.readyTurn=s.turn+Math.max(1,Math.ceil((route.length-1)/3));
    log(s,'supply',p.name+' ordered back to the rear base. Stocks remain unavailable in transit.');return null;
  }
  function beginTurn(s,events){prepareSupply(s,events);dispatchState=s;}
  function prepareSupply(s,events){
    if(!s.forwardSupplyEnabled)return;
    for(const p of s.supplyPoints.filter(p=>p.status==='active'&&G.alive(s).some(u=>u.side==='de'&&G.dist(u,p)===0))){p.status='lost';p.stock=0;events.push('SUPPLY POINT — '+p.name+' overrun; stocks lost before dispatch.');}
    const base=s.supplyPoints.find(p=>p.base&&p.status==='active');
    if(base)base.stock=Math.min(base.capacity,base.stock+G.scenario(s).supply);
    for(const p of s.supplyPoints.filter(p=>p.status==='moving'&&p.readyTurn<=s.turn)){
      const route=routeTo(s,p,p.target);
      if(!route){p.readyTurn++;events.push('SUPPLY POINT — '+p.name+' delayed; convoy route blocked.');continue;}
      p.x=p.target.x;p.y=p.target.y;delete p.target;
      if(p.recovering&&base){const delivered=Math.min(p.stock,base.capacity-base.stock);base.stock+=delivered;p.stock-=delivered;if(p.stock){p.readyTurn++;p.target={x:base.x,y:base.y};events.push('SUPPLY POINT — '+p.name+' waits for storage space at the rear base.');continue;}p.status='retired';delete p.recovering;events.push('SUPPLY POINT — '+p.name+' stocks recovered and point closed.');}
      else {p.status='active';events.push('SUPPLY POINT — '+p.name+' established at '+(p.x+1)+', '+(p.y+1)+'.');}
    }
    // Incoming allowance is conserved: transfers move existing stocks from base.
    if(base)for(const p of s.supplyPoints.filter(p=>!p.base&&p.status==='active')){
      const route=routeTo(s,p,base);if(!route){events.push('SUPPLY POINT — '+p.name+' isolated; using remaining stocks.');continue;}
      const n=Math.min(3,p.capacity-p.stock,base.stock);p.stock+=n;base.stock-=n;
    }
  }
  function dispatch(s,plan){dispatchState=null;if(!s.forwardSupplyEnabled)return;for(const row of plan.rows){const p=s.supplyPoints.find(p=>p.id===row.depotId);if(p)p.stock=Math.max(0,p.stock-row.delivery);}}
  function knownState(s){return s.fog&&!s.finished?{...s,units:s.units.filter(u=>u.side==='us'||G.spotted(s,u))}:s;}
  function eligible(s,u){return !!u&&u.side==='us'&&['infantry','tank'].includes(u.type)&&u.hp>=4&&u.stock>=1&&!s.finished&&!s.reconPatrols.some(p=>p.parentId===u.id&&active(p));}
  function sendPatrol(s,parentId,target){
    const u=s.units.find(u=>u.id===parentId);if(!eligible(s,u))return 'Choose infantry or armor with strength 4+, at least 1 reserve, and no patrol already out.';
    if(!land(s,target)||G.dist(u,target)>6)return 'Choose a land hex within 6 hexes of the parent formation.';
    const scout={...u,id:'patrol-route',type:'infantry'},known=knownState(s),route=G.path(known,scout,target);
    // The patrol may enter the parent hex but cannot enter an occupied target.
    if(!route||G.dist(u,target)===0)return 'Choose another hex with a known open approach.';
    const id='patrol-'+(++s.serviceSequence);s.reconPatrols=s.reconPatrols.filter(p=>active(p)||s.turn-p.completedTurn<3);
    s.reconPatrols.push({id,parentId,x:u.x,y:u.y,target:{x:target.x,y:target.y},status:'outbound',startedTurn:s.turn,reportDue:null,pending:[],reportedTurn:null,completedTurn:null});
    u.stock--;u.reconCommitted=true;log(s,'recon',u.name+' acknowledges a reconnaissance patrol to '+(target.x+1)+', '+(target.y+1)+'. One reserve committed; parent firepower reduced 10% until return.',u.id);return null;
  }
  function recallPatrol(s,id){if(s.finished)return 'The battle has ended.';const p=s.reconPatrols.find(p=>p.id===id&&active(p));if(!p)return 'This patrol is no longer active.';p.status='returning';log(s,'recon','Recall sent to '+p.id+'. Return depends on an open route.',p.parentId);return null;}
  function patrolTurn(s,events){
    for(const p of s.reconPatrols.filter(active)){
      const parent=s.units.find(u=>u.id===p.parentId&&u.hp>0);
      if(!parent){p.status='missing';p.completedTurn=s.turn;events.push('RECON — '+p.id+' has lost its parent formation; whereabouts unconfirmed.');continue;}
      const proxy={...parent,id:p.id,x:p.x,y:p.y,type:'infantry',stock:2},goal=p.status==='returning'?parent:p.target;
      if(p.status!=='observing'){
        const known=knownState(s);let route=G.path(known,proxy,goal),spent=0;if(p.status==='returning'&&G.dist(p,parent)>1){route=G.neighbors(parent,s).map(n=>G.path(known,proxy,n)).filter(Boolean).sort((a,b)=>a.cost-b.cost)[0]||null;}
        // Return into the parent hex is allowed; it never occupies a combat counter.
        const fallback=p.status==='returning'&&G.dist(p,parent)<=1?[{x:parent.x,y:parent.y}]:null;
        if(!route&&!fallback){events.push('RECON — '+p.id+' delayed by a blocked or uncertain approach.');continue;}
        for(const n of route?.path||fallback){const cost=G.moveCost(s,proxy,p,n);if(spent>0&&spent+cost>2)break;if(G.alive(s).some(u=>u.side==='de'&&G.dist(u,n)===0))break;spent+=cost;p.x=n.x;p.y=n.y;}
      }
      const observed=G.alive(s).filter(u=>u.side==='de'&&G.dist(p,u)<=1&&G.lineOfSight(s,p,u));
      if(observed.length&&G.random(s)<.15){p.status='missing';p.completedTurn=s.turn;parent.hp=Math.max(0,parent.hp-1);parent.reconCommitted=false;events.push('RECON — '+p.id+' failed to return after contact; parent records one strength point lost. Enemy situation uncertain.');continue;}
      if(p.status==='outbound'&&G.dist(p,p.target)===0){p.status='observing';events.push('RECON — '+p.id+' reached its observation area; report pending.');continue;}
      if(p.status==='observing'){
        p.pending=observed.map(u=>({id:u.id,name:u.name,type:u.type,x:u.x,y:u.y,seenTurn:s.turn}));p.reportDue=s.turn+1;p.status='returning';events.push('RECON — '+p.id+' completed observation. Report expected next turn, subject to communication range.');
      }
      if(p.status==='returning'&&G.dist(p,parent)===0){p.status='returned';p.completedTurn=s.turn;parent.reconCommitted=false;events.push('RECON — '+p.id+' rejoined '+parent.name+'.');}
    }
    for(const u of s.units)u.reconCommitted=s.reconPatrols.some(p=>p.parentId===u.id&&active(p));
  }
  function deliverReports(s,events){
    for(const p of s.reconPatrols.filter(p=>p.reportDue!==null&&p.reportDue<=s.turn&&p.reportedTurn===null&&p.status!=='missing')){
      const parent=s.units.find(u=>u.id===p.parentId&&u.hp>0);if(!parent||G.dist(p,parent)>6){events.push('RECON — '+p.id+' report overdue; beyond local communication range.');continue;}
      const contacts=clone(p.pending);s.reconReports.push({patrolId:p.id,parentId:p.parentId,observedTurn:p.reportDue-1,receivedTurn:s.turn,contacts});s.reconReports=s.reconReports.slice(-20);p.reportedTurn=s.turn;
      for(const contact of contacts)if(!G.spotted(s,contact)&&!s.intel.some(r=>r.id===contact.id&&r.seenTurn>=contact.seenTurn)){s.intel=s.intel.filter(r=>r.id!==contact.id);s.intel.push(contact);}
      events.push('RECON REPORT — '+p.id+': '+contacts.length+' contact(s) observed on turn '+(p.reportDue-1)+'. Positions are last-known, not confirmed current.');
    }
  }
  function underHQ(s,u,hqId){let parent=u.type==='hq'?u.id:u.commandId;for(let n=0;n<5&&parent;n++){if(parent===hqId)return true;parent=s.units.find(h=>h.id===parent)?.parentId;}return false;}
  function recommendations(s,hqId){
    const h=s.units.find(u=>u.id===hqId&&u.type==='hq');if(!h||h.hp<=3||s.finished)return [];
    const known=knownState(s),units=G.alive(known).filter(u=>u.side==='us'&&u.type!=='hq'&&underHQ(s,u,hqId)),shop=h.echelon==='Regiment'?'S':'G',out=[];
    const add=(number,kind,title,why,tradeoff,action)=>{const id=hqId+':'+kind+':'+JSON.stringify(action);if(!s.dismissedAdvice.includes(id))out.push({id,shop:shop+number,kind,title,why,tradeoff,action});};
    const tired=units.find(u=>(u.hp<=4||u.fatigue>=3)&&!u.missionOrder?.paused);
    if(tired)add(1,'recover','Rest '+tired.name,'Reported strength '+tired.hp+'/10; fatigue '+tired.fatigue+'/4.','Pauses its mission and cancels its queued order. A supplied formation can recover.',{type:'rest',unitId:tired.id});
    const stale=(s.intel||[]).filter(r=>!G.contacts(s).some(u=>u.id===r.id)).sort((a,b)=>b.seenTurn-a.seenTurn)[0],scout=units.filter(u=>eligible(s,u)).sort((a,b)=>stale?G.dist(a,stale)-G.dist(b,stale):a.id.localeCompare(b.id))[0];
    const target=stale||G.scenario(s).objectives.find(o=>scout&&G.dist(scout,o)>0&&G.dist(scout,o)<=6);
    if(scout&&target&&G.dist(scout,target)<=6&&land(s,target)&&G.path(known,{...scout,id:'advice-patrol',type:'infantry'},target))add(2,'recon','Scout '+(target.x+1)+', '+(target.y+1),stale?'Last report dates from turn '+stale.seenTurn+'. Current enemy position is unconfirmed.':'No patrol report is available for this approach.','One reserve and 10% of parent firepower committed until return. Reports take time and may be incomplete.',{type:'recon',unitId:scout.id,target:{x:target.x,y:target.y}});
    const host=units.find(u=>u.type==='infantry'&&u.missionOrder?.type==='seize'&&G.fieldAttachments(s,u).length<2),asset=units.find(u=>['tank','artillery'].includes(u.type)&&!u.attachedTo&&!u.order&&!u.missionOrder);
    if(host&&asset&&(!s.advancedRules||G.commandStatus(known,host,h.echelon).ok&&G.commandStatus(known,asset,h.echelon).ok))add(3,'attach','Attach '+asset.name+' to '+host.name,'Both formations report through this headquarters; support is currently uncommitted.','The supporting unit is no longer a free reserve. Its commander follows the host unless given a direct order.',{type:'attach',unitId:host.id,assetId:asset.id});
    const low=units.some(u=>u.stock<2),priorities=units.map(u=>({id:u.id,priority:u.missionOrder?.type==='seize'&&u.hp>4?'high':u.stock>=2?'low':'normal',request:Math.max(0,Math.min(2,3-u.stock))}));
    if(low&&priorities.some(p=>{const u=units.find(u=>u.id===p.id);return p.priority!==u.priority||s.allocationMode!=='manual'||p.request!==u.supplyRequest;}))add(4,'supply','Rebalance formation deliveries',units.filter(u=>u.stock<2).length+' reporting formations have reserves below 2/3.','Switches to manual requests. Prioritizes the main attack; reduced requests elsewhere may lower their reserves. Transport and stocks remain finite.',{type:'supply',priorities});
    return out;
  }
  function acceptAdvice(s,hqId,id){
    const advice=recommendations(s,hqId).find(a=>a.id===id);if(!advice)return 'This recommendation has changed. Review the latest briefing.';
    const a=advice.action;let error=null;
    if(a.type==='recon')error=sendPatrol(s,a.unitId,a.target);
    if(a.type==='attach')error=G.assignAttachment(s,a.assetId,a.unitId,true);
    if(error)return error;
    if(a.type==='rest'){const u=s.units.find(u=>u.id===a.unitId);u.order=null;if(u.missionOrder)u.missionOrder.paused=true;}
    if(a.type==='supply'){s.allocationMode='manual';for(const p of a.priorities){const u=s.units.find(u=>u.id===p.id);u.priority=p.priority;u.supplyRequest=p.request;}}
    s.dismissedAdvice.push(id);s.dismissedAdvice=s.dismissedAdvice.slice(-40);log(s,'staff',advice.shop+' recommendation accepted: '+advice.title,a.unitId||null,hqId);return null;
  }
  function dismissAdvice(s,hqId,id){if(!recommendations(s,hqId).some(a=>a.id===id))return 'Recommendation no longer available.';s.dismissedAdvice.push(id);s.dismissedAdvice=s.dismissedAdvice.slice(-40);return null;}
  function acknowledge(s){
    for(const u of s.units.filter(u=>u.side==='us')){const signature=JSON.stringify({order:u.order,mission:u.missionOrder,disengage:u.disengagePolicy});if(s.acknowledgedOrders[u.id]!==signature){if(u.order||u.missionOrder)log(s,'orders',u.name+' acknowledges '+(u.order?.type||G.missionName(s,u.missionOrder))+'. Execution awaits turn resolution.',u.id);s.acknowledgedOrders[u.id]=signature;}}
  }
  function finishTurn(s,events){
    if(s.forwardSupplyEnabled)for(const p of s.supplyPoints.filter(p=>p.status==='active')){
      if(G.alive(s).some(u=>u.side==='de'&&G.dist(u,p)===0)){p.status='lost';p.stock=0;events.push('SUPPLY POINT — '+p.name+' overrun; remaining stocks lost.');}
      else if(G.alive(s).some(u=>u.side==='de'&&G.dist(u,p)<=1)&&p.stock>0){p.stock--;events.push('SUPPLY POINT — '+p.name+' disrupted near the front; one stock point lost.');}
    }
    const unseen=s.units.filter(u=>u.side==='de'&&!G.spotted(s,u)),clean=t=>{for(const u of unseen)t=t.split(u.name).join('unidentified enemy formation');return t;};
    for(const t of events.filter(t=>/^(COMMAND|SUPPLY POINT|RECON|CONTACT|ENGINEERS|LANDING DELAY)/.test(t)))log(s,'dispatch',clean(t));
    for(const u of s.units.filter(u=>u.side==='us'&&u.commandReport))log(s,'unit',clean(u.name+': '+u.commandReport),u.id);
    for(const u of s.units.filter(u=>u.side==='us'))s.acknowledgedOrders[u.id]=JSON.stringify({order:u.order,mission:u.missionOrder,disengage:u.disengagePolicy});
  }
  function validData(s){
    const text=(v,n)=>typeof v==='string'&&v.length<=n,int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,ref=v=>v===null||s.units.some(u=>u.id===v),contact=r=>r&&text(r.id,80)&&text(r.name,80)&&['infantry','tank','artillery'].includes(r.type)&&land(s,r)&&int(r.seenTurn,1,30);
    return typeof s.forwardSupplyEnabled==='boolean'&&int(s.serviceSequence,0,10000)&&Array.isArray(s.supplyPoints)&&s.supplyPoints.length<=20&&new Set(s.supplyPoints.map(p=>p.id)).size===s.supplyPoints.length&&s.supplyPoints.filter(p=>p.base).length<=1&&s.supplyPoints.every(p=>p&&text(p.id,80)&&text(p.name,100)&&land(s,p)&&int(p.capacity,1,60)&&int(p.stock,0,p.capacity)&&typeof p.base==='boolean'&&['active','moving','retired','lost'].includes(p.status)&&int(p.readyTurn,1,60)&&(!p.target||land(s,p.target))&&(p.status!=='moving'||land(s,p.target))&&(p.recovering===undefined||typeof p.recovering==='boolean'))&&
      Array.isArray(s.reconPatrols)&&s.reconPatrols.length<=40&&new Set(s.reconPatrols.map(p=>p.id)).size===s.reconPatrols.length&&s.reconPatrols.every(p=>p&&text(p.id,80)&&ref(p.parentId)&&p.parentId!==null&&land(s,p)&&land(s,p.target)&&['outbound','observing','returning','returned','missing'].includes(p.status)&&int(p.startedTurn,1,30)&&(p.reportDue===null||int(p.reportDue,1,60))&&(p.reportedTurn===null||int(p.reportedTurn,1,30))&&(p.completedTurn===null||int(p.completedTurn,1,30))&&Array.isArray(p.pending)&&p.pending.length<=30&&p.pending.every(contact))&&
      Array.isArray(s.reconReports)&&s.reconReports.length<=20&&s.reconReports.every(r=>r&&text(r.patrolId,80)&&ref(r.parentId)&&int(r.observedTurn,1,30)&&int(r.receivedTurn,1,30)&&Array.isArray(r.contacts)&&r.contacts.length<=30&&r.contacts.every(contact))&&
      Array.isArray(s.commandActivity)&&s.commandActivity.length<=160&&s.commandActivity.every(r=>r&&int(r.turn,1,30)&&text(r.kind,30)&&text(r.message,600)&&ref(r.unitId)&&ref(r.hqId))&&Array.isArray(s.dismissedAdvice)&&s.dismissedAdvice.length<=40&&s.dismissedAdvice.every(v=>text(v,6000))&&s.acknowledgedOrders&&typeof s.acknowledgedOrders==='object'&&!Array.isArray(s.acknowledgedOrders)&&Object.keys(s.acknowledgedOrders).length<=30&&Object.entries(s.acknowledgedOrders).every(([k,v])=>s.units.some(u=>u.id===k)&&text(v,3000))&&s.units.every(u=>typeof u.reconCommitted==='boolean'&&u.reconCommitted===s.reconPatrols.some(p=>p.parentId===u.id&&active(p)));
  }
  function valid(s){try{return validData(s)}catch(e){return false}}
  const api={migrate,newGame,beginTurn,dispatch,patrolTurn,deliverReports,finishTurn,supplyRoute,logistics};
  G.installCommandServices(api);
  Object.assign(G,{commandServicesValid:valid,enableForwardSupply:enableSupply,setSupplyPoint:setPoint,recoverSupplyPoint:recoverPoint,reconEligible:eligible,sendReconPatrol:sendPatrol,recallReconPatrol:recallPatrol,staffRecommendations:recommendations,acceptStaffAdvice:acceptAdvice,dismissStaffAdvice:dismissAdvice,commandAcknowledge:acknowledge,knownState,underHQ});
  return api;
});
