/* Deterministic illustrated terrain. Art uses the engine's own hexes and terrain;
   it never changes the rules or the saved battle. */
(function(root){
function draw(G,s,pos){
let out='<defs><filter id="paper-grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".13"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter><linearGradient id="water-tone" x2="1" y2="1"><stop stop-color="#89b1b4"/><stop offset="1" stop-color="#346779"/></linearGradient><filter id="counter-shadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="1" dy="3" stdDeviation="2" flood-opacity=".45"/></filter></defs>';
const colors={town:'#b4aa83',rear:'#a4ac7a',sea:'#527f8d',beach:'#d9c696',field:'#9aa06a',road:'#95976c',hedgerow:'#77834e',marsh:'#789b92'};
const points=(p,r=43)=>Array.from({length:6},(_,i)=>{let a=(i*60-30)*Math.PI/180;return `${(p.x+r*Math.cos(a)).toFixed(2)},${(p.y+r*Math.sin(a)).toFixed(2)}`}).join(' ');
if(G.scenario(s).sandbox){
 for(let y=0;y<G.board(s).height;y++)for(let x=0;x<G.board(s).width;x++){const p=pos({x,y}),t=G.cell(x,y,s);out+=`<polygon class="hex" tabindex="0" role="button" aria-label="${t} hex ${x+1}, ${y+1}" data-x="${x}" data-y="${y}" points="${points(p)}" fill="${colors[t]}" stroke="#d9dfba" stroke-width="1"/>`;if(t==='road')out+=`<path d="M${p.x-32} ${p.y}h64" stroke="#d8c99d" stroke-width="5" pointer-events="none"/>`;if(t==='town')out+=`<text x="${p.x}" y="${p.y+5}" text-anchor="middle" pointer-events="none" fill="#4c4031">▥</text>`;if(t==='hedgerow')out+=`<path d="M${p.x-24} ${p.y+22}h48" stroke="#3d6038" stroke-width="8" pointer-events="none"/>`;out+=`<text x="${p.x}" y="${p.y+32}" text-anchor="middle" font-size="9" fill="#283727" pointer-events="none">${x+1},${y+1}</text>`;}
 return out;
}
if(G.scenario(s).theme==='coast'){
out+='<image href="'+(typeof window!=='undefined'&&window.UTAH_TEST_EDITION?'../normandy-map-v2.jpg?test=0.24.0':'normandy-map-v2.jpg')+'" x="0" y="0" width="750" height="650" preserveAspectRatio="none" pointer-events="none"/>';
for(let y=0;y<G.board(s).height;y++)for(let x=0;x<G.board(s).width;x++){let t=G.cell(x,y,s),p=pos({x,y});out+=`<polygon class="hex illustrated-hit" tabindex="0" role="button" aria-label="${t} hex ${x+1}, ${y+1}" data-x="${x}" data-y="${y}" points="${points(p)}" fill="transparent" style="stroke:#f3eed3;stroke-opacity:.3;stroke-width:.7"/>`}
out+='<g class="terrain-rules-overlay" pointer-events="none">';for(let y=0;y<G.board(s).height;y++)for(let x=0;x<G.board(s).width;x++){let t=G.cell(x,y,s);out+=`<polygon points="${points(pos({x,y}))}" fill="${colors[t]}" fill-opacity=".6"/>`}out+='</g>';
out+='<g pointer-events="none" transform="translate(25 18)"><path d="M0 30L8 0L16 30L8 23Z" fill="#fff1cf" stroke="#354835"/><text x="8" y="43" text-anchor="middle" fill="#fff1cf" font-size="12" font-weight="800">N</text></g>';return out;
}
const line=(x1,y1,x2,y2,c,w=1,extra='')=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${c}" stroke-width="${w}" fill="none" ${extra}/>`;
function tree(x,y,r=3){return `<ellipse cx="${x+1.5}" cy="${y+2}" rx="${r+1}" ry="${r}" fill="#273a28" opacity=".3"/><circle cx="${x}" cy="${y}" r="${r}" fill="#3e5535"/><circle cx="${x-.7}" cy="${y-.8}" r="${r*.6}" fill="#6b7946" opacity=".8"/>`}
function house(x,y,angle=0){return `<g transform="translate(${x} ${y}) rotate(${angle})"><rect x="-4" y="-3" width="10" height="8" fill="#273b2e" opacity=".35"/><rect x="-5" y="-4" width="9" height="7" fill="#e2d7b7"/><path d="M-6 -4L-1 -7L5 -4V0H-6Z" fill="#795c48"/><path d="M-6 -4H5" stroke="#b99b7c" stroke-width=".8"/></g>`}
for(let y=0;y<G.board(s).height;y++)for(let x=0;x<G.board(s).width;x++){
const p=pos({x,y}),t=G.cell(x,y,s),id='land-'+x+'-'+y;let seed=(x+13)*7717+(y+9)*131+17;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
out+=`<defs><clipPath id="${id}"><polygon points="${points(p)}"/></clipPath></defs><polygon class="hex" tabindex="0" role="button" aria-label="${t} hex ${x+1}, ${y+1}" data-x="${x}" data-y="${y}" points="${points(p)}" fill="${colors[t]}"/><g clip-path="url(#${id})" pointer-events="none">`;
if(['field','hedgerow','road','rear'].includes(t)){
// Small irregular agricultural plots and cultivated strips.
out+=`<path d="M${p.x-44} ${p.y-44}H${p.x+3}L${p.x-6} ${p.y+8}H${p.x-44}Z" fill="${rnd()>.5?'#b2ac79':'#8f9a62'}"/><path d="M${p.x+5} ${p.y-44}H${p.x+44}V${p.y+10}L${p.x-4} ${p.y+7}Z" fill="#a7a775"/><path d="M${p.x-44} ${p.y+12}L${p.x+44} ${p.y+8}V${p.y+44}H${p.x-44}Z" fill="${rnd()>.5?'#838f56':'#bdaf7b'}"/>`;
for(let k=0;k<12;k++){let yy=p.y-38+k*3.5;out+=line(p.x+7,yy,p.x+41,yy-2,'#7a834e',.5,'opacity=".4"')}
out+=line(p.x-6,p.y-44,p.x-4,p.y+8,'#5b6c3d',2)+line(p.x-44,p.y+11,p.x+44,p.y+7,'#627343',2);
for(let k=0;k<(t==='hedgerow'?32:11);k++){let xx,yy;if(k%2){xx=p.x-39+rnd()*78;yy=p.y+8+rnd()*3}else{xx=p.x-5+rnd()*4;yy=p.y-40+rnd()*80}out+=tree(xx,yy,1.5+rnd()*2)}
if(t==='hedgerow')for(let k=0;k<15;k++)out+=tree(p.x-30+(k%5)*7,p.y+20+Math.floor(k/5)*7,2);
if(rnd()>.65)out+=house(p.x+22,p.y+22,15);
}
if(t==='marsh'){
for(let k=0;k<25;k++){let xx=p.x-42+rnd()*84,yy=p.y-42+rnd()*84;out+=`<ellipse cx="${xx}" cy="${yy}" rx="${2+rnd()*8}" ry="${1+rnd()*3}" fill="${k%3?'#8f9b6c':'#adc1b3'}" opacity=".7"/>`;if(k%3===0)out+=line(xx,yy,xx-1,yy-4,'#526c4f',.7)}
out+=`<path d="M${p.x-45} ${p.y+12}Q${p.x-15} ${p.y-25} ${p.x+8} ${p.y+8}T${p.x+45} ${p.y-12}" fill="none" stroke="#527e84" stroke-width="3"/>`;
}
if(t==='sea'){
out+=`<rect x="${p.x-44}" y="${p.y-44}" width="88" height="88" fill="url(#water-tone)"/>`;
for(let k=0;k<9;k++){let yy=p.y-40+k*10;out+=`<path d="M${p.x-44} ${yy}q10 -3 20 0t20 0t20 0t28 0" stroke="#d5e2d5" opacity=".2" stroke-width=".6" fill="none"/>`}
}
if(t==='beach'){
out+=`<path d="M${p.x+26} ${p.y-46}Q${p.x+15} ${p.y} ${p.x+26} ${p.y+46}H${p.x+46}V${p.y-46}Z" fill="#aac1b4"/><path d="M${p.x+23} ${p.y-46}Q${p.x+12} ${p.y} ${p.x+23} ${p.y+46}" fill="none" stroke="#f2ead0" stroke-width="3"/><path d="M${p.x-29} ${p.y-44}Q${p.x-17} ${p.y} ${p.x-29} ${p.y+44}" fill="none" stroke="#8b9569" stroke-width="12" opacity=".7"/>`;
for(let k=0;k<24;k++){let xx=p.x-40+rnd()*80,yy=p.y-42+rnd()*84;out+=`<circle cx="${xx}" cy="${yy}" r=".7" fill="#8b8359" opacity=".4"/>`}
out+=`<path d="M${p.x+3} ${p.y-10}l5 6m-5 0l5 -6M${p.x+1} ${p.y+23}l5 6m-5 0l5 -6" stroke="#746d58" stroke-width="1.5"/>`;
}
if(t==='town'){
out+=line(p.x-40,p.y+8,p.x+40,p.y-8,'#d0c39f',5)+line(p.x-8,p.y-42,p.x+9,p.y+42,'#c7ba93',4);
for(let k=0;k<12;k++)out+=house(p.x-27+rnd()*54,p.y-30+rnd()*60,k%2?12:-10);
out+=`<rect x="${p.x-3}" y="${p.y-12}" width="7" height="18" fill="#d0c4a3"/><path d="M${p.x-5} ${p.y-12}l5 -8 5 8Z" fill="#655c50"/>`;
}
// Fine grain is geometry rather than a heavy SVG filter, keeping iPad redraws fast.
for(let k=0;k<22;k++){let xx=p.x-43+rnd()*86,yy=p.y-43+rnd()*86;out+=`<circle cx="${xx}" cy="${yy}" r="${.3+rnd()*.5}" fill="#283c29" opacity=".11"/>`}
out+='</g>';
}
// Continuous roads connect only hexes the rules identify as road or beach.
let roads='';for(let y=0;y<G.board(s).height;y++)for(let x=0;x<G.board(s).width;x++){let t=G.cell(x,y,s);if(!['road','beach'].includes(t))continue;let p=pos({x,y});for(let n of G.neighbors({x,y},s)){if(n.y*G.W+n.x<=y*G.W+x||!['road','beach'].includes(G.cell(n.x,n.y,s)))continue;let q=pos(n);roads+=`M${p.x} ${p.y}L${q.x} ${q.y}`}}
out+=`<g pointer-events="none"><path d="${roads}" fill="none" stroke="#5b634a" stroke-width="7" opacity=".75"/><path d="${roads}" fill="none" stroke="#c9bc91" stroke-width="4"/><path d="${roads}" fill="none" stroke="#eee0b4" stroke-width=".7" opacity=".65"/></g>`;
// The grid stays above the illustration and below tactical overlays.
out+='<g pointer-events="none">';for(let y=0;y<G.board(s).height;y++)for(let x=0;x<G.board(s).width;x++){let p=pos({x,y});out+=`<polygon class="cartographic-grid" points="${points(p)}" fill="none" stroke="#f3eed3" stroke-opacity=".27" stroke-width=".7"/>`}
out+=`<g transform="translate(28 18)"><path d="M0 32L8 0L16 32L8 25Z" fill="#f6efd5" stroke="#354835"/><text x="8" y="46" text-anchor="middle" fill="#f9f0d6" stroke="#334231" stroke-width=".3" font-size="12" font-weight="800">N</text></g></g>`;
return out;
}
root.TerrainMap={draw};if(typeof module!=='undefined')module.exports=root.TerrainMap;
})(typeof window==='undefined'?globalThis:window);
