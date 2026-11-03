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
  $('check-update').hidden=true;
  $('install-help').hidden=true;
  status('Playable preview · badges, strikes and smoke');
  offline('Online preview · separate saved games');
})();
