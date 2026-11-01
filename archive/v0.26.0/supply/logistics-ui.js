/* Supply Command is a planning desk for the same saved battle and turn engine. */
const SupplyUI = {
  init() {
    this.rememberView();
    $('supply-command').onclick = () => this.setView(!supplyView);
    $('allocation-auto').onchange = () => this.allocate('automatic');
    $('allocation-manual').onchange = () => this.allocate('manual');
    $('logistics-sustain').onclick = () => this.preset('sustain');
    $('logistics-rebuild').onclick = () => this.preset('rebuild');
    $('logistics-clear').onclick = () => this.preset('clear');
    window.addEventListener?.('hashchange', () => {
      supplyView = window.location.hash === '#supply';
      this.rememberView();
      render();
    });
  },
  rememberView() {
    try { localStorage.setItem(KEY+'-view', supplyView ? 'supply' : 'battle'); } catch(e) {}
  },
  setView(on) {
    supplyView = on;
    this.rememberView();
    mode = 'move';
    window.history?.replaceState(null, '', on ? '#supply' : '#battle');
    if (on && $('report-dialog').open) $('report-dialog').close();
    render();
    $('logistics-title').scrollIntoView?.({block:'nearest'});
  },
  allocate(value) {
    if (s.finished) return;
    if (value === 'manual' && s.allocationMode !== 'manual') {
      // Start from the automatic plan, then let the player reassign it.
      const plan = G.logistics(planning());
      for (const row of plan.rows) s.units.find(u => u.id === row.id).supplyRequest = row.delivery;
    }
    s.allocationMode = value;
    save(); render();
  },
  preset(kind) {
    if (s.finished) return;
    s.allocationMode = 'manual';
    for (const u of G.alive(s).filter(u => u.side === 'us' && u.type !== 'hq')) {
      u.supplyRequest = kind === 'clear' ? 0 : Math.max(0, (kind === 'sustain' ? G.consumption(u,s) : 3) - u.stock);
    }
    save(); render();
  },
  change(id, field, value) {
    if (s.finished) return;
    const u = s.units.find(u => u.id === id && u.side === 'us' && u.hp > 0);
    if (!u) return;
    const allowed = {priority:['high','normal','low'], routePolicy:['shortest','roads','cautious'], supplyEntry:['auto','north','center','south']};
    if (field === 'supplyRequest') {
      value = Number(value);
      if (!Number.isInteger(value) || value < 0 || value > 3) return;
      s.allocationMode = 'manual';
    } else if (!allowed[field]?.includes(value)) return;
    u[field] = value;
    selected = id;
    save(); render();
  },
  select(id) { selected = id; mode = 'move'; render(); },
  options(values, selectedValue) {
    return values.map(([value,label]) => `<option value="${value}" ${value === selectedValue ? 'selected' : ''}>${label}</option>`).join('');
  },
  exposure(state, route) {
    const threats = G.alive(state).filter(u => u.side === 'de' && (!state.fog || state.finished || G.spotted(state,u)));
    return route ? route.filter(p => threats.some(e => G.dist(e,p) <= 1)).length : 0;
  },
  mapRoutes(state, active) {
    let svg = '';
    for (const u of G.alive(state).filter(u => u.side === 'us' && u.type !== 'hq')) {
      const route = G.supplyRoute(state,u);
      if (!route) continue;
      const chosen = u.id === active, points = route.map(pos);
      svg += `<polyline points="${points.map(p => p.x+','+p.y).join(' ')}" fill="none" stroke="${chosen?'#075c96':'#326b7f'}" stroke-width="${chosen?7:3}" stroke-opacity="${chosen?1:.55}" stroke-dasharray="${chosen?'5 6':'3 6'}" pointer-events="none"/>`;
    }
    for (const [name,y] of [['N',1],['C',4],['S',7]]) {
      const p = pos({x:8,y});
      svg += `<g pointer-events="none"><rect x="${p.x+34}" y="${p.y-18}" width="35" height="36" rx="4" fill="#fcf4d5" stroke="#496a68" stroke-width="2"/><text x="${p.x+51}" y="${p.y+5}" text-anchor="middle" fill="#254e62" font-weight="800" font-size="16">${name}</text></g>`;
    }
    return svg;
  },
  render() {
    $('logistics-command').hidden = !supplyView;
    document.body?.classList.toggle('supply-command-view', supplyView);
    $('supply-command').textContent = supplyView ? '← Battle Map' : 'Supply Command';
    $('supply-command').classList.toggle('active',supplyView);
    $('map-mode-title').textContent = supplyView ? 'SUPPLY ROUTE MAP · N / C / S ENTRY SECTORS' : 'TACTICAL MAP';
    if (!supplyView) return;
    const state = planning(), plan = G.logistics(state), units = G.alive(s).filter(u => u.side === 'us' && u.type !== 'hq');
    const totalUse = units.reduce((n,u) => n + G.consumption(u,s),0);
    const shortage = plan.rows.filter(r => r.after < 2).length;
    const metrics = [[plan.capacity,'AVAILABLE / TURN'],[plan.capacity-plan.unused,'PLANNED DELIVERY'],[totalUse,'TURN CONSUMPTION'],[plan.unused,'UNASSIGNED'],[shortage,'LOW AFTER TURN']];
    $('logistics-metrics').innerHTML = metrics.map(([value,label]) => `<div><b>${value}</b><span>${label}</span></div>`).join('');
    $('allocation-auto').checked = s.allocationMode === 'automatic';
    $('allocation-manual').checked = s.allocationMode === 'manual';
    for (const id of ['allocation-auto','allocation-manual','logistics-sustain','logistics-rebuild','logistics-clear']) $(id).disabled = s.finished;
    $('logistics-explainer').textContent = (s.allocationMode === 'manual' ? 'MANUAL PLAN · Set each unit’s request below. ' : 'AUTOMATIC PLAN · Fill reserves by priority. Choose My delivery requests to ration the pool. ') + 'High → Normal → Low; ties favor lower reserves, then unit ID. All entry sectors share one pool. Changes apply when you resolve the turn.';
    const disabled = s.finished ? 'disabled' : '';
    const rows = units.map(u => {
      const r = plan.rows.find(r => r.id === u.id), after = {...u,stock:r.after};
      const order = u.order?.type || 'rest', warning = !r.route ? 'Route cut' : r.shortfall ? r.reason : r.after < 2 ? 'Low reserves after use' : 'Plan covered';
      return `<tr class="${u.id===selected?'chosen-logistics':''}"><td><button class="formation-link" data-supply-select="${u.id}" aria-pressed="${u.id===selected}">${u.id===selected?'▶ ':''}${esc(u.name)}</button><small>${esc(order.toUpperCase())} · use ${r.use} point${r.use===1?'':'s'} · ${warning}</small></td><td><select data-supply-id="${u.id}" data-supply-field="priority" aria-label="Priority for ${esc(u.name)}" ${disabled}>${this.options([['high','High'],['normal','Normal'],['low','Low']],u.priority)}</select></td><td><select data-supply-id="${u.id}" data-supply-field="supplyRequest" aria-label="Delivery request for ${esc(u.name)}" ${s.finished||s.allocationMode!=='manual'?'disabled':''}>${this.options([0,1,2,3].map(n=>[n,String(n)]),s.allocationMode==='manual'?u.supplyRequest:r.request)}</select></td><td><strong class="delivery-amount">+${r.delivery}</strong>${r.shortfall?`<small>${r.shortfall} unmet</small>`:''}</td><td><span class="reserve-ledger">${u.stock} + ${r.delivery} − ${r.use} → <b>${r.after}</b></span><small>before + delivery − use · min 0</small></td><td><span class="readiness ${r.after<2?'readiness-low':''}">${r.after}/3 · ${Math.round(G.fireFactor(after)*100)}% fire</span><small>${G.budget(after)} movement before fatigue changes</small></td></tr>`;
    });
    $('logistics-rows').innerHTML = rows.join('');
    $('logistics-rows').querySelectorAll('[data-supply-select]').forEach(b => b.onclick = () => this.select(b.dataset.supplySelect));
    $('logistics-rows').querySelectorAll('select').forEach(el => el.onchange = () => this.change(el.dataset.supplyId,el.dataset.supplyField,el.value));
    let u = units.find(u => u.id === selected);
    $('route-unit-title').textContent = u ? u.name : 'Choose a formation';
    if (!u) $('route-inspector').innerHTML = '<p>Select a formation in the ledger or on the map to control its route.</p><p class="logistics-caption">N / C / S mark northern, central, and southern entry sectors. Allied counters do not block supplies; enemy-occupied hexes do.</p>';
    else {
      const row = plan.rows.find(r => r.id === u.id), route = row.route, exposed = this.exposure(state,route), end = route?.at(-1);
      const routeHexes = route ? route.slice().reverse().map(p => `<span>${p.x+1},${p.y+1}</span>`).join('<i>›</i>') : '';
      $('route-inspector').innerHTML = `<label>Supply entry sector<select data-route-field="supplyEntry" aria-label="Supply entry sector" ${disabled}>${this.options([['auto','Any open entry'],['north','North · rows 1–3'],['center','Center · rows 4–6'],['south','South · rows 7–9']],u.supplyEntry)}</select></label><label>Route preference<select data-route-field="routePolicy" aria-label="Route preference" ${disabled}>${this.options([['shortest','Shortest open route'],['roads','Favor roads / beach'],['cautious','Avoid spotted threats']],u.routePolicy)}</select></label><div class="route-facts"><strong>${route?'Route open':'ROUTE CUT'}</strong><span>${route?`${route.length-1} hex steps · entry ${end.x+1},${end.y+1}`:'Choose another sector or clear enemy blockers.'}</span><span>${exposed} route hexes beside spotted enemies</span></div><p class="logistics-caption">${s.fog?'Forecast from observed positions; unseen enemies may block actual delivery.':'All current enemy positions are included.'} Exposure is a warning; transport losses and road capacity are not modeled.</p>${route?`<h4>Entry → formation</h4><div class="route-itinerary">${routeHexes}</div>`:''}`;
      $('route-inspector').querySelectorAll('select').forEach(el => el.onchange = () => this.change(u.id,el.dataset.routeField,el.value));
    }
    const warnings = [];
    for (const r of plan.rows) {
      const v = units.find(u => u.id===r.id);
      if (!r.route) warnings.push(`${v.name}: route cut. Try another entry sector or clear the route.`);
      else if (r.shortfall) warnings.push(`${v.name}: ${r.shortfall} requested points unmet (${r.reason.toLowerCase()}).`);
      if (r.stock < r.use) warnings.push(`${v.name}: reserves cannot cover planned consumption; firepower and movement are reduced this turn.`);
    }
    if (plan.unused) warnings.push(`${plan.unused} delivery points are unassigned and will expire this turn.`);
    if (totalUse > plan.capacity) warnings.push(`Consumption exceeds incoming supply by ${totalUse-plan.capacity}. You are drawing down reserves; consider resting tanks or artillery.`);
    $('logistics-warnings').innerHTML = warnings.length ? warnings.map(t => `<p class="supply-warning">${esc(t)}</p>`).join('') : '<p class="supply-clear">All requests are covered. Review the after-turn reserves before advancing.</p>';
    const last = s.lastSupply;
    $('logistics-last').innerHTML = last ? `<p><strong>Turn ${last.turn}</strong> · ${last.delivered} delivered / ${last.delivered+last.unused} available.</p><p>${last.unused} expired · ${last.blocked} cut routes.</p>` : '<p>No deliveries dispatched yet. Your first plan takes effect when you resolve the turn.</p>';
  }
};
