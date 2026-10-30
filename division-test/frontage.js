/* Estimated friendly deployment, in schematic map hex widths. Pure display model:
   no combat/control effects, enemy queries, RNG, or saved-state mutations. */
(function(root){
'use strict';
const SCALE=76,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const add=(a,b,k=1)=>({x:a.x+b.x*k,y:a.y+b.y*k});
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const point=p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`;
function eligible(u,width=9){return u.side==='us'&&u.hp>0&&u.x<width&&['infantry','tank'].includes(u.type)&&!u.attachedTo}
function intent(G,s,u){
 const o=u.order,m=!u.missionOrder?.paused&&s.commandMode?u.missionOrder:null;
 if(o){if(o.type==='move')return {formation:'March column',goal:o};
  if(['attack','prepare'].includes(o.type))return {formation:'Attack deployment',target:o.target};
  if(o.type==='defend')return {formation:'Defensive line'};
  if(o.type==='reserve')return {formation:'Reserve assembly'};
 }
 if(m){const objective=['seize','defend'].includes(m.type)?G.scenario(s).objectives[m.objective]:null;
  if(objective)return {formation:G.dist(u,objective)>1?'March column':m.type==='defend'?'Defensive line':'Attack deployment',goal:objective};
  return {formation:'Reserve assembly'};
 }
 return {formation:'Local security'};
}
function deployment(G,s,u,pos){
 const p=pos(u),i=intent(G,s,u);
 // Orders contain only a target ID: use its position only if currently observed.
 if(i.target){const t=s.units.find(t=>t.id===i.target);if(t&&(!s.fog||s.finished||G.spotted(s,t)))i.goal=t;}
 let d=i.goal?sub(pos(i.goal),p):{x:-1,y:0},length=Math.hypot(d.x,d.y);
 if(length<1){d={x:-1,y:0};length=1;}
 const forward={x:d.x/length,y:d.y/length},left={x:forward.y,y:-forward.x};
 const echelon=G.establishment(u).echelon,base={battalion:2.2,company:1.1,detachment:.8,section:.55}[echelon]||1.1;
 const factor={'March column':.3,'Attack deployment':1,'Defensive line':1.25,'Reserve assembly':.5,'Local security':.8}[i.formation];
 const terrain=G.cell(u.x,u.y,s),terrainFactor={town:.75,hedgerow:.8,marsh:.6}[terrain]||1;
 const readiness=clamp(.45+.55*u.hp/10-.04*(u.fatigue||0)-.06*(u.suppression||0)-(u.stock===0?.1:0),.35,1);
 const width=clamp(base*factor*terrainFactor*readiness,.2,3),half=width*SCALE/2;
 const front=add(p,forward,34),rear=add(p,forward,i.formation==='March column'?-62:-30);
 return {id:u.id,name:u.name,formation:i.formation,width,p,forward,left,front,rear,L:add(front,left,half),R:add(front,left,-half),backL:add(rear,left,half),backR:add(rear,left,-half),terrain};
}
function neighbor(a,rows,side){
 const sign=side==='left'?1:-1;
 const candidates=rows.filter(b=>b.id!==a.id).map(b=>{
  const delta=sub(b.front,a.front),lateral=dot(delta,a.left)*sign/SCALE,depth=Math.abs(dot(delta,a.forward))/SCALE;
  const aligned=dot(a.forward,b.forward)>.65;
  const reach=(Math.abs(dot(b.left,a.left))*b.width+a.width)/2;
  return {b,lateral,depth,aligned,gap:Math.max(0,lateral-reach)};
 }).filter(c=>c.lateral>.15&&c.lateral<=4&&c.depth<=1.5).sort((a,b)=>(a.lateral+a.depth)-(b.lateral+b.depth));
 const c=candidates[0];if(!c)return {side,status:'open',text:'Open flank — no nearby formation abreast'};
 const contact=c.aligned&&c.gap<=.25&&c.depth<=.6;
 const status=contact?'contact':!c.aligned||c.depth>.6?'staggered':'gap';
 const text=c.b.name+': '+(contact?'estimated contact':status==='staggered'?`staggered / different axis; ${c.depth.toFixed(1)} hex depth separation`:`estimated gap ${c.gap.toFixed(1)} hex widths`);
 // Link to the neighbor edge nearest this flank, even if its axis differs.
 const from=side==='left'?a.L:a.R,to=Math.hypot(c.b.L.x-from.x,c.b.L.y-from.y)<Math.hypot(c.b.R.x-from.x,c.b.R.y-from.y)?c.b.L:c.b.R;
 return {side,status,text,from,to,gap:c.gap,depth:c.depth,id:c.b.id};
}
function model(G,s,pos){const rows=s.units.filter(u=>eligible(u,G.board(s).width)).map(u=>deployment(G,s,u,pos));for(const a of rows)a.flanks=['left','right'].map(side=>neighbor(a,rows,side));return rows}
function draw(rows,selected,esc,onlySelected=false,bounds={width:750,height:650}){
 let svg='<g class="frontage-overlay" pointer-events="none"><defs><clipPath id="frontage-map-clip'+(onlySelected?'-selected':'')+'"><rect x="18" y="20" width="'+(bounds.width-46)+'" height="'+(bounds.height-68)+'"/></clipPath></defs><g clip-path="url(#frontage-map-clip'+(onlySelected?'-selected':'')+')">';
 for(const a of rows.filter(a=>onlySelected?a.id===selected:a.id!==selected)){
  const chosen=a.id===selected,color=chosen?'#ffe15a':'#93e3ff';
  svg+=`<g class="unit-frontage" data-frontage="${esc(a.id)}"><title>${esc(a.name)}: ${esc(a.formation)}, estimated frontage ${a.width.toFixed(1)} map hex widths</title><polygon points="${[a.L,a.R,a.backR,a.backL].map(point).join(' ')}" fill="${color}" fill-opacity="${chosen?.22:.10}"/><path class="frontage-limits" d="M${point(a.backL)}L${point(a.L)}M${point(a.backR)}L${point(a.R)}" stroke="${color}" stroke-width="2" stroke-dasharray="5 4"/><path d="M${point(a.L)}L${point(a.R)}" stroke="#142c32" stroke-width="8"/><path class="frontage-line" d="M${point(a.L)}L${point(a.R)}" stroke="${color}" stroke-width="4"/>`;
  for(const [p,label] of [[a.L,'L'],[a.R,'R']])svg+=`<circle cx="${p.x}" cy="${p.y}" r="5" fill="${color}" stroke="#142c32" stroke-width="2"/>${chosen?`<text x="${p.x+8}" y="${p.y+4}" fill="${color}" stroke="#142c32" stroke-width="3" paint-order="stroke" font-size="12" font-weight="800">${label}</text>`:''}`;
  svg+='</g>';
  if(chosen)for(const f of a.flanks.filter(f=>f.from)){const color=f.status==='contact'?'#6cf0aa':'#ffb16e';svg+=`<path class="frontage-contact" data-flank-status="${f.status}" d="M${point(f.from)}L${point(f.to)}" stroke="${color}" stroke-width="3" stroke-dasharray="${f.status==='contact'?'2 3':'7 5'}"><title>${esc(f.side+': '+f.text)}</title></path>`;}
 }
 return svg+'</g></g>';
}
function detail(rows,u,esc){
 const a=rows.find(a=>a.id===u.id);
 if(!a)return '<div class="frontage-detail">'+(u.attachedTo?'Attached support deploys with its host formation.':'HQs and artillery have no independent maneuver frontage.')+'</div>';
 return `<div class="frontage-detail"><strong>Estimated frontage · ${esc(a.formation)}</strong><br>About ${a.width.toFixed(1)} map hex widths · facing the current order / mission axis (inland by default).<br>${a.flanks.map(f=>`<span class="flank-${f.status}"><b>${f.side==='left'?'Left':'Right'}:</b> ${esc(f.text)}</span>`).join('<br>')}<br><small>Gold = selected unit; blue = other formations. Solid front, dashed side limits; green dotted link = estimated contact, orange dashed link = gap or staggered line. L/R face the advance. Estimates use establishment, orders, terrain, strength and readiness; they do not claim occupied ground or change combat.</small></div>`;
}
root.Frontage={eligible,model,draw,detail};
})(typeof window!=='undefined'?window:globalThis);
