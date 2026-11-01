(() => {
  const BUILD = '0.26.1', $ = id => document.getElementById(id);
  let registration, waiting, reloading = false;
  const status = text => { $('update-state').textContent=text; $('launch-version').textContent=text; };
  const offline = text => $('offline-status').textContent=text;
  $('install-help').onclick=()=>$('install-dialog').showModal();
  $('install-close').onclick=()=>$('install-dialog').close();
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  $('launch-dialog').showModal();
  async function fullScreen(){
    const root=document.documentElement;
    if(document.fullscreenElement||navigator.standalone||window.matchMedia?.('(display-mode: standalone)').matches)return;
    const request=root.requestFullscreen||root.webkitRequestFullscreen;
    if(request){try{await request.call(root);return}catch(_){}}
    $('window-help').hidden=false;
  }
  $('window-fullscreen').onclick=fullScreen;
  $('launch-resume').onclick=()=>{fullScreen();$('launch-dialog').close();};
  $('launch-new').onclick=()=>{ $('launch-dialog').close(); $('scenarios').click(); };
  async function check() {
    status('Checking published build…');
    try {
      const response=await fetch(new URL('../version.json?check='+Date.now(), location.href), {cache:'no-store'});
      if(!response.ok) throw Error('Unavailable');
      const latest=await response.json();
      if(!latest.build) throw Error('Invalid version');
      status(latest.build===BUILD ? 'Current build verified · v'+BUILD : 'Update available · v'+latest.build);
      $('apply-update').hidden=latest.build===BUILD && !waiting;
      if(registration) await registration.update();
    } catch (_) { status('Cannot verify latest build · running v'+BUILD); }
  }
  $('check-update').onclick=check;
  $('apply-update').onclick=async()=>{
    // Saves are not removed. Normal game autosaves already record each order.
    status('Loading latest build…');
    if(waiting) {
      reloading=true; waiting.postMessage('APPLY_UPDATE');
      setTimeout(()=>location.replace(new URL('./?updated='+Date.now(),location.href)),4000);
    } else location.replace(new URL('./?updated='+Date.now(),location.href));
  };
  if('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)location.replace(new URL('./?updated='+Date.now(),location.href));});
    navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
      registration=reg;
      const notice=()=>{ if(reg.waiting){waiting=reg.waiting;$('apply-update').hidden=false;status('Update downloaded · tap Load latest saved game');} };
      const ready=()=>{
        const active=reg.active;if(!active||active.state!=='activated')return;
        const channel=new MessageChannel();channel.port1.onmessage=e=>{offline(e.data==='OFFLINE_READY'?'Offline play ready':'Offline download incomplete');channel.port1.close();};
        active.postMessage('CHECK_OFFLINE',[channel.port2]);
      };
      const watch=worker=>{if(worker)worker.addEventListener('statechange',()=>{notice();ready();});};
      watch(reg.installing);reg.addEventListener('updatefound',()=>watch(reg.installing));notice();ready();
      setTimeout(()=>{if($('offline-status').textContent==='Preparing offline play…')offline('Offline setup pending · online play available');},30000);
    }).catch(()=>offline('Offline setup unavailable · online play available'));
  } else offline('Offline installation needs HTTPS and a supported browser.');
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
  check();
})();
