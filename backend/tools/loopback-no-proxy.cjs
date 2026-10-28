// Test-harness preload for sandboxed environments: firebase-tools sends every request through
// HTTPS_PROXY (it ignores NO_PROXY), so emulator-to-emulator calls on 127.0.0.1 hit the proxy.
// This sends only loopback traffic directly; everything else still goes through the proxy.
// Usage: NODE_OPTIONS="--require ./tools/loopback-no-proxy.cjs" firebase emulators:exec ...
// (No child processes here: this file is preloaded into every Node process, including npm.)
const path = require('node:path');
const candidates = [
  process.env.FIREBASE_TOOLS_DIR,
  path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'firebase-tools'),
].filter(Boolean);
let undici;
for (const dir of candidates) {
  try {
    undici = require(require.resolve('undici', { paths: [dir] }));
    break;
  } catch {
    // try the next location
  }
}
if (undici && undici.ProxyAgent && !undici.ProxyAgent.prototype.__purrbiLoopback) {
  const direct = new undici.Agent();
  const LOOPBACK = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?(\/|$)/;
  const original = undici.ProxyAgent.prototype.dispatch;
  undici.ProxyAgent.prototype.dispatch = function dispatch(opts, handler) {
    if (LOOPBACK.test(String((opts && opts.origin) || ''))) return direct.dispatch(opts, handler);
    return original.call(this, opts, handler);
  };
  undici.ProxyAgent.prototype.__purrbiLoopback = true;
}
