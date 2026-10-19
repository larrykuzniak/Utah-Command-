(() => {
  const status = document.getElementById('offline-status');
  document.getElementById('install-help').onclick = () => document.getElementById('install-dialog').showModal();
  document.getElementById('install-close').onclick = () => document.getElementById('install-dialog').close();
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    status.textContent = 'Offline installation needs HTTPS and a supported browser.';
    return;
  }
  // A successful registration may still fail installation; ready never rejects
  // in that case. Monitor lifecycle and bound the wait.
  let timer, complete = false;
  const finish = text => {
    clearTimeout(timer);
    status.textContent = text;
  };
  timer = setTimeout(() => {
    if (!complete) finish('Offline setup did not finish · reopen online to retry.');
  }, 30000);
  navigator.serviceWorker.register('./sw.js', {updateViaCache: 'none'}).then(registration => {
    function notice() {
      if (registration.waiting) finish('Update ready · close all game windows and reopen online.');
    }
    let checked = false;
    function checkReady() {
      // Use this edition's registration, not a broader worker that may already
      // control the same tab while this edition is being installed.
      const active = registration.active;
      if (!active || active.state !== 'activated' || checked) return;
      checked = true;
      const channel = new MessageChannel();
      channel.port1.onmessage = event => {
        complete = event.data === 'OFFLINE_READY';
        finish(complete ? 'Offline play ready' : 'Offline files incomplete · reopen online to retry.');
        channel.port1.close();
        notice();
      };
      active.postMessage('CHECK_OFFLINE', [channel.port2]);
    }
    function watch(worker) {
      if (!worker) return;
      const changed = () => {
        if (worker.state === 'redundant' && !registration.active) finish('Offline download failed · reopen online to retry.');
        notice();
        checkReady();
      };
      worker.addEventListener('statechange', changed);
      changed();
    }
    watch(registration.installing);
    notice();
    registration.addEventListener('updatefound', () => watch(registration.installing));
    watch(registration.active);
    checkReady();
  }).catch(() => finish('Offline setup unavailable · open in Safari while online and retry.'));
})();
