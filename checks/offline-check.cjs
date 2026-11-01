const vm = require('node:vm'), fs = require('node:fs'), assert = require('node:assert/strict');
async function run() {
  const directory=process.argv[2]||'dist';
  const listeners = {}, buckets = new Map([['utah-command-shell-/other-edition/:v0.1',new Map()]]), scope = directory.endsWith('/supply')?'https://example.test/utah-command/supply/':'https://example.test/utah-command/';
  let online = true, requests = 0;
  const caches = {
    async open(name) {
      if (!buckets.has(name)) buckets.set(name, new Map());
      const bucket = buckets.get(name);
      return {match: async key => bucket.get(String(key)), put: async (key, value) => bucket.set(String(key), value)};
    },
    keys: async () => [...buckets.keys()], delete: async name => buckets.delete(name)
  };
  const context = {URL, Request, caches, self: {
    registration: {scope}, location: new URL(scope), clients: {claim: async () => {}},
    addEventListener: (name, handler) => listeners[name] = handler
  }, fetch: async request => {
    requests++;
    if (!online) throw Error('Offline');
    const name = new URL(request.url || request).pathname.slice(new URL(scope).pathname.length) || 'index.html';
    // Reproduce the production host's canonical redirect.
    if (new URL(request.url || request).pathname.endsWith('/index.html')) {
      return {ok: true, redirected: true, type: 'basic'};
    }
    const bytes = fs.readFileSync(directory+'/' + name);
    return new Response(bytes, {headers: {'content-type': name.endsWith('.js') ? 'application/javascript' : name.endsWith('.html') ? 'text/html' : 'application/octet-stream'}});
  }};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(directory+'/sw.js', 'utf8'), context);
  await new Promise((resolve, reject) => listeners.install({waitUntil: promise => promise.then(resolve, reject)}));
  await new Promise((resolve, reject) => listeners.activate({waitUntil: promise => promise.then(resolve, reject)}));
  assert.ok(buckets.has('utah-command-shell-/other-edition/:v0.1'),'Activation must preserve the other edition cache');
  let message;
  await new Promise((resolve, reject) => listeners.message({data: 'CHECK_OFFLINE', ports: [{postMessage: value => message = value}], waitUntil: promise => promise.then(resolve, reject)}));
  assert.equal(message, 'OFFLINE_READY');
  online = false;
  const before = requests;
  for (const [path, mode] of [['', 'navigate'], ['engine.js', 'cors'], ['app.js', 'cors'], ['style.css', 'cors']]) {
    let response;
    listeners.fetch({request: {url: scope + path, mode, method: 'GET'}, respondWith: promise => response = promise});
    assert.ok((await response).ok, 'Offline asset should be served');
  }
  assert.equal(requests, before, 'Offline gameplay must not need a network call');
  let intercepted = false;
  listeners.fetch({request: {url: scope + 'api/private', mode: 'cors', method: 'GET'}, respondWith: () => intercepted = true});
  assert.equal(intercepted, false, 'Do not cache API/authentication traffic');
  console.log('PASS: install cache, offline-ready signal, offline navigation/assets under a repository subpath, and API exclusion.');
}
run().catch(error => {console.error(error); process.exitCode = 1;});
