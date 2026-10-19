// Synthetic DOM and identities only; never loads the published student roster.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

// --baseline runs the exact same cases against committed HTML without changing files.
const html = process.argv.includes('--baseline')
  ? execFileSync('git', ['show', 'HEAD:login.html'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' })
  : fs.readFileSync(new URL('../login.html', import.meta.url), 'utf8');
const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)?.[1];
assert.ok(source, 'login page inline script exists');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
class Element {
  constructor(properties = {}) { this.listeners = new Map(); this.value = ''; Object.assign(this, properties); }
  addEventListener(type, callback) {
    const callbacks = this.listeners.get(type) ?? [];
    callbacks.push(callback); this.listeners.set(type, callbacks);
  }
  async emit(type, event = {}) {
    await Promise.all((this.listeners.get(type) ?? []).map(callback => callback({ preventDefault() {}, ...event })));
  }
  append(...children) { this.children = [...(this.children ?? []), ...children]; }
  replaceChildren(...children) { this.children = children; }
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
}
function harness(options = {}) {
  const elements = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], new Element()]));
  const radios = ['auto', 'marketing', 'english'].map(value => new Element({ value, checked: value === 'auto' }));
  const ready = options.ready ?? deferred();
  const calls = [], destinations = [], pending = [], sessions = new Map();
  const window = new Element();
  const access = {
    subjects: { auto: '汽车科目组', marketing: '市场营销科目组', english: '英语' },
    ready: () => ready.promise,
    session: subject => sessions.get(subject) ?? null,
    logout: subject => sessions.delete(subject),
    examUrl: (subject, test) => `https://example.test/${subject}-exam.html${test ? '?test=1' : ''}`,
    login: (subject, name, phone) => {
      calls.push({ subject, name, phone });
      const request = deferred(); pending.push(request); return request.promise;
    },
  };
  window.ExamAccess = access;
  elements.get('verifyLoginBtn').disabled = true;
  elements.get('candidateName').value = '合成测试';
  elements.get('candidatePhone').value = '000101';
  const sandbox = {
    window, ExamAccess: access, URL, URLSearchParams,
    location: { search: '', href: 'https://example.test/login.html', assign: destination => destinations.push(destination) },
    history: { replaceState() {} },
    document: {
      getElementById: id => elements.get(id),
      querySelectorAll: () => radios,
      querySelector: selector => selector.endsWith(':checked') ? radios.find(radio => radio.checked)
        : radios.find(radio => selector.includes(`value="${radio.value}"`)),
      createElement: () => new Element(), createTextNode: text => ({ text }),
    },
  };
  vm.runInNewContext(source, sandbox, { filename: 'login.html:inline' });
  return {
    elements, ready, calls, destinations, pending, window,
    button: elements.get('verifyLoginBtn'),
    submit: () => elements.get('loginForm').emit('submit'),
    show: persisted => window.emit('pageshow', { persisted }),
    async load() { ready.resolve(); await new Promise(resolve => setImmediate(resolve)); },
  };
}

const cases = [];
const test = (name, run) => cases.push({ name, run });

test('successful login can be repeated after browser back/forward restoration', async () => {
  const h = harness(); await h.load();
  assert.equal(h.button.disabled, false);
  const first = h.submit(); assert.equal(h.calls.length, 1); assert.equal(h.button.disabled, true);
  h.pending[0].resolve(); await first; assert.equal(h.destinations.length, 1);
  await h.show(true); assert.equal(h.button.disabled, false);
  const second = h.submit(); assert.equal(h.calls.length, 2);
  h.pending[1].resolve(); await second; assert.equal(h.destinations.length, 2);
});
test('failed verification re-enables the form for another attempt', async () => {
  const h = harness(); await h.load();
  const first = h.submit(); h.pending[0].reject(new Error('synthetic mismatch')); await first;
  assert.equal(h.button.disabled, false);
  assert.equal(h.elements.get('loginMessage').textContent, 'synthetic mismatch');
  const second = h.submit(); assert.equal(h.calls.length, 2);
  h.pending[1].resolve(); await second; assert.equal(h.destinations.length, 1);
});
test('ordinary pageshow does not unlock an in-flight login', async () => {
  const h = harness(); await h.load();
  const first = h.submit(); await h.show(false); await h.submit();
  assert.equal(h.calls.length, 1); assert.equal(h.button.disabled, true);
  h.pending[0].resolve(); await first; assert.equal(h.destinations.length, 1);
});
test('restoration before roster readiness keeps verification disabled', async () => {
  const h = harness(); await h.show(true); await h.submit();
  assert.equal(h.button.disabled, true); assert.equal(h.calls.length, 0);
  await h.load(); assert.equal(h.button.disabled, false);
});
test('restoration after roster load failure keeps verification disabled', async () => {
  const h = harness(); h.ready.reject(new Error('synthetic load error'));
  await new Promise(resolve => setImmediate(resolve)); await h.show(true); await h.submit();
  assert.equal(h.button.disabled, true); assert.equal(h.calls.length, 0);
  assert.equal(h.elements.get('loadError').textContent, 'synthetic load error');
});
test('stale success from before restoration cannot navigate over a new login', async () => {
  const h = harness(); await h.load();
  const first = h.submit(); await h.show(true);
  const second = h.submit(); assert.equal(h.calls.length, 2);
  h.pending[0].resolve(); await first;
  assert.equal(h.destinations.length, 0); assert.equal(h.button.disabled, true);
  h.pending[1].resolve(); await second; assert.equal(h.destinations.length, 1);
});
test('stale failure from before restoration cannot unlock or overwrite a new login', async () => {
  const h = harness(); await h.load();
  const first = h.submit(); await h.show(true);
  const second = h.submit(); assert.equal(h.calls.length, 2);
  const message = h.elements.get('loginMessage').textContent;
  h.pending[0].reject(new Error('stale synthetic failure')); await first;
  assert.equal(h.button.disabled, true); assert.equal(h.elements.get('loginMessage').textContent, message);
  await h.submit(); assert.equal(h.calls.length, 2);
  h.pending[1].resolve(); await second; assert.equal(h.destinations.length, 1);
});

let failures = 0;
for (const { name, run } of cases) {
  try { await run(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}: ${error.message}`); }
}
console.log(`${cases.length - failures}/${cases.length} login UI checks passed`);
process.exitCode = failures ? 1 : 0;
