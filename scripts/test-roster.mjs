// Synthetic identities only. This suite never loads the published student roster.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { pbkdf2Sync, randomBytes, webcrypto } from 'node:crypto';

const source = fs.readFileSync(new URL('../access.js', import.meta.url), 'utf8');
const prefix = 'exam-practice-whitelist-v1:%2FExam-Practice%2F:';
const sessionKey = subject => prefix + 'session:' + subject;
const now = Date.now();
const identities = {
  first: { name: 'TEST甲', phone: '000101' },
  second: { name: 'TEST乙', phone: '000101' },
  disabled: { name: '停用合成账号', phone: '000102' },
};
const legacyIdentity = { name: identities.first.name, phone: '13800000101' };
const progressKey = (subject, person, test = false) => prefix + 'progress:' + subject + ':'
  + encodeURIComponent(JSON.stringify([person.name, person.phone])) + (test ? ':verification' : ':practice');
function progressRecord(person = legacyIdentity, subject = 'english', test = false) {
  return { version: subject === 'english' ? 1 : 2, owner: { subject, ...person }, testMode: test, bankSignature: 'synthetic-bank',
    startedAt: now - 10000, deadlineAt: now + 600000, answers: { 'synthetic-question': 'B' },
    questionIds: ['synthetic-question'], submitted: false, currentIndex: 0 };
}
function record(subject, person, enabled = true) {
  const salt = randomBytes(16).toString('hex');
  const input = JSON.stringify(['exam-whitelist-v3', subject, person.name, person.phone]);
  return { salt, hash: pbkdf2Sync(input, Buffer.from(salt, 'hex'), 600000, 32, 'sha256').toString('hex'), enabled };
}
const firstEnglish = record('english', identities.first);
const secondEnglish = record('english', identities.second);
const disabledEnglish = record('english', identities.disabled, false);
const firstAuto = record('auto', identities.first);
const template = {
  version: 3, credential: 'name-phone-last6', algorithm: 'PBKDF2-SHA-256', iterations: 600000, sessionHours: 12,
  auto: [firstAuto], marketing: [], english: [firstEnglish, secondEnglish, disabledEnglish],
};
const config = () => structuredClone(template);
function storedSession(person = identities.first, subject = 'english', overrides = {}) {
  return { version: 2, subject, ...person, issuedAt: now - 1000, expiresAt: now + 3600000, ...overrides };
}
const legacySession = overrides => storedSession(legacyIdentity, 'english', { version: 1, ...overrides });
const seeded = value => new Map([[sessionKey('english'), typeof value === 'string' ? value : JSON.stringify(value)]]);
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function harness(roster = config(), options = {}) {
  const storage = options.storage ?? new Map();
  const progress = options.progress ?? new Map();
  const stats = { imports: 0, derives: 0, active: 0, maxActive: 0, scripts: 0 };
  const clock = { now: options.now ?? now };
  class Clock extends Date { static now() { return clock.now; } }
  const crypto = options.noCrypto ? undefined : {
    subtle: {
      importKey: (...args) => { stats.imports++; return webcrypto.subtle.importKey(...args); },
      deriveBits: async (...args) => {
        stats.derives++; stats.active++; stats.maxActive = Math.max(stats.maxActive, stats.active);
        try {
          if (options.beforeDerive) await options.beforeDerive(stats.derives);
          return await webcrypto.subtle.deriveBits(...args);
        } finally { stats.active--; }
      },
    },
  };
  const sandbox = {
    URL, URLSearchParams, setTimeout, clearTimeout, Date: Clock, console,
    TextEncoder: options.noEncoder ? undefined : TextEncoder, crypto,
    window: { EXAM_WHITELISTS: roster, crypto },
    location: { search: '?test=1' },
    sessionStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => { if (options.blockStorage) throw new Error('storage blocked'); storage.set(key, value); },
      removeItem: key => storage.delete(key),
    },
    localStorage: {
      get length() { return progress.size; },
      key: index => [...progress.keys()][index] ?? null,
      getItem: key => progress.get(key) ?? null,
      setItem: (key, value) => { if (options.blockProgress) throw new Error('progress storage blocked'); progress.set(key, value); },
      removeItem: key => progress.delete(key),
    },
    document: {
      currentScript: { src: 'https://example.test/Exam-Practice/access.js?v=synthetic' },
      documentElement: { dataset: {} }, getElementById: () => null,
      createElement: () => ({}),
      head: { appendChild: script => {
        stats.scripts++;
        queueMicrotask(() => options.loadError ? script.onerror() : script.onload());
      } },
    },
  };
  vm.runInNewContext(source, sandbox, { filename: 'access.js' });
  return { api: sandbox.window.ExamAccess, storage, progress, stats, clock, sandbox };
}
async function loggedIn(options) {
  const h = harness(config(), options);
  await h.api.login('english', identities.first.name, identities.first.phone);
  return h;
}
const results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}

await check('Node 生成的校验值可由 WebCrypto 验证，全角后6位归一化且保留前导0', async () => {
  const h = harness();
  const person = await h.api.login('english', '  ＴＥＳＴ甲  ', ' ０００１０１ ');
  assert.equal(person.name, identities.first.name);
  assert.equal(person.phone, identities.first.phone);
  assert.equal(person.maskedPhone, '*****000101');
  assert.equal(JSON.parse(h.storage.get(sessionKey('english'))).version, 2);
});
await check('只接受完整6位数字，拒绝全号、国家码、短长输入、内部空白与非数字', async () => {
  const h = harness();
  for (const phone of ['13800000101', '+8613800000101', '+86000101', '00101', '0000101', '000 101', '000\n101', '000-101', '00010x', '', '00010\u200b1']) {
    await assert.rejects(h.api.login('english', identities.first.name, phone));
  }
  assert.equal(h.stats.derives, 0);
  await assert.rejects(h.api.login('english', identities.first.name, '000999'));
  assert.ok(h.stats.derives > 0);
  assert.equal(h.api.session('english'), null);
});
await check('同步 session 缓存不重复派生，并且返回对象不暴露内部状态', async () => {
  const h = await loggedIn();
  const derived = h.stats.derives;
  for (let i = 0; i < 200; i++) {
    const person = h.api.session('english');
    assert.equal(typeof person.then, 'undefined');
    assert.equal(person.name, identities.first.name);
  }
  const person = h.api.session('english'); person.name = '更改返回副本';
  assert.equal(h.api.session('english').name, identities.first.name);
  await h.api.ready(); await h.api.ready();
  assert.equal(h.stats.derives, derived);
  assert.equal(h.stats.scripts, 1);
});
await check('同号不同姓名独立匹配，错名、内部空格和未授权科目均拒绝', async () => {
  const h = await loggedIn();
  const original = h.api.progressKey('english', h.api.session('english'));
  const second = await h.api.login('english', identities.second.name, identities.second.phone);
  assert.notEqual(h.api.progressKey('english', second), original);
  await assert.rejects(h.api.login('english', 'TEST丙', identities.first.phone));
  await assert.rejects(h.api.login('english', 'TEST 甲', identities.first.phone));
  await assert.rejects(h.api.login('marketing', identities.first.name, identities.first.phone));
  await assert.rejects(h.api.login('invalid', identities.first.name, identities.first.phone));
});
await check('相同姓名手机号在不同科目独立授权，移植校验值不能跨科登录', async () => {
  const h = await loggedIn();
  const a = await h.api.login('auto', identities.first.name, identities.first.phone);
  assert.equal(a.subject, 'auto');
  assert.equal(h.api.session('english').subject, 'english');
  assert.notEqual(h.api.progressKey('auto', a), h.api.progressKey('english', h.api.session('english')));
  const moved = config(); moved.auto = [firstEnglish]; moved.english = [];
  await assert.rejects(harness(moved).api.login('auto', identities.first.name, identities.first.phone));
});
await check('旧版 v1 全号会话经后6位重新验证迁移到 v2，保留原有效期', async () => {
  const legacy = legacySession();
  const storage = seeded(legacy);
  const h = harness(config(), { storage });
  assert.equal(h.api.session('english'), null);
  await h.api.ready();
  const person = h.api.session('english');
  assert.ok(person);
  assert.equal(person.expiresAt, legacy.expiresAt);
  assert.equal(person.phone, legacy.phone.slice(-6));
  assert.equal(person.maskedPhone, '*****000101');
  assert.deepEqual(JSON.parse(storage.get(sessionKey('english'))), { ...legacy, version: 2, phone: legacy.phone.slice(-6) });
  assert.equal(h.api.progressKey('english', person), progressKey('english', identities.first));
  assert.equal(h.api.progressKey('english', person, true), progressKey('english', identities.first, true));
  assert.ok(h.stats.derives > 0);
});
await check('登录时迁移当前科目两种模式的旧进度，只改 owner.phone 并移除旧键', async () => {
  const progress = new Map();
  const expected = new Map();
  for (const test of [false, true]) {
    const saved = progressRecord(legacyIdentity, 'english', test);
    progress.set(progressKey('english', legacyIdentity, test), JSON.stringify(saved));
    expected.set(test, { ...saved, owner: { ...saved.owner, phone: identities.first.phone } });
  }
  const h = await loggedIn({ progress });
  for (const test of [false, true]) {
    assert.deepEqual(JSON.parse(progress.get(h.api.progressKey('english', h.api.session('english'), test))), expected.get(test));
    assert.equal(progress.has(progressKey('english', legacyIdentity, test)), false);
  }
});
await check('旧全号会话恢复也迁移进度；v2后6位会话刷新仍可继续使用', async () => {
  const saved = progressRecord();
  const progress = new Map([[progressKey('english', legacyIdentity), JSON.stringify(saved)]]);
  const h = harness(config(), { storage: seeded(legacySession()), progress });
  await h.api.ready();
  assert.equal(JSON.parse(progress.get(progressKey('english', identities.first))).owner.phone, '000101');
  const next = harness(config(), { storage: h.storage, progress });
  await next.api.ready();
  assert.equal(next.api.session('english').phone, '000101');
  assert.equal(progress.has(progressKey('english', legacyIdentity)), false);
});
await check('v1会话不收取同名同尾的另一完整号码进度，转v2后再次刷新仍不收取', async () => {
  const otherLegacy = { ...legacyIdentity, phone: '13999000101' };
  const progress = new Map([false, true].map(test => [
    progressKey('english', otherLegacy, test), JSON.stringify(progressRecord(otherLegacy, 'english', test)),
  ]));
  const original = [...progress];
  const storage = seeded(legacySession());
  for (let refresh = 0; refresh < 2; refresh++) {
    const h = harness(config(), { storage, progress });
    await h.api.ready();
    assert.equal(h.api.session('english').phone, identities.first.phone);
    assert.equal(JSON.parse(storage.get(sessionKey('english'))).version, 2);
    assert.deepEqual([...progress], original);
    for (const test of [false, true]) assert.equal(progress.has(progressKey('english', identities.first, test)), false);
  }
});
await check('v1会话有明确完整号码时只迁移该号码，保留同名同尾的另一份旧进度', async () => {
  const otherLegacy = { ...legacyIdentity, phone: '13999000101' };
  const progress = new Map(), expected = new Map(), unrelated = new Map();
  for (const test of [false, true]) {
    const own = { ...progressRecord(legacyIdentity, 'english', test), answers: { source: 'A' } };
    const other = { ...progressRecord(otherLegacy, 'english', test), answers: { source: 'D' } };
    progress.set(progressKey('english', legacyIdentity, test), JSON.stringify(own));
    progress.set(progressKey('english', otherLegacy, test), JSON.stringify(other));
    expected.set(test, { ...own, owner: { ...own.owner, phone: identities.first.phone } });
    unrelated.set(test, JSON.stringify(other));
  }
  const h = harness(config(), { storage: seeded(legacySession()), progress });
  await h.api.ready();
  for (const test of [false, true]) {
    assert.deepEqual(JSON.parse(progress.get(progressKey('english', identities.first, test))), expected.get(test));
    assert.equal(progress.has(progressKey('english', legacyIdentity, test)), false);
    assert.equal(progress.get(progressKey('english', otherLegacy, test)), unrelated.get(test));
  }
});
await check('已有v2后6位会话刷新只恢复授权，不自动迁移旧完整号码进度', async () => {
  const progress = new Map([false, true].map(test => [
    progressKey('english', legacyIdentity, test), JSON.stringify(progressRecord(legacyIdentity, 'english', test)),
  ]));
  const original = [...progress];
  const h = harness(config(), { storage: seeded(storedSession()), progress });
  await h.api.ready();
  assert.equal(h.api.session('english').phone, identities.first.phone);
  assert.deepEqual([...progress], original);
  for (const test of [false, true]) assert.equal(progress.has(progressKey('english', identities.first, test)), false);
});
await check('已有后6位进度优先，保留目标内容和旧进度', async () => {
  const oldKey = progressKey('english', legacyIdentity), newKey = progressKey('english', identities.first);
  const oldRaw = JSON.stringify(progressRecord());
  const targetRaw = JSON.stringify({ ...progressRecord(identities.first), answers: { newer: 'C' } });
  const progress = new Map([[oldKey, oldRaw], [newKey, targetRaw]]);
  await loggedIn({ progress });
  assert.equal(progress.get(newKey), targetRaw);
  assert.equal(progress.get(oldKey), oldRaw);
});
await check('相同姓名尾号匹配多份旧进度时跳过冲突，独立的另一模式仍迁移', async () => {
  const otherLegacy = { ...legacyIdentity, phone: '13999000101' };
  const progress = new Map([
    [progressKey('english', legacyIdentity), JSON.stringify(progressRecord())],
    [progressKey('english', otherLegacy), JSON.stringify(progressRecord(otherLegacy))],
    [progressKey('english', legacyIdentity, true), JSON.stringify(progressRecord(legacyIdentity, 'english', true))],
  ]);
  const original = new Map(progress);
  await loggedIn({ progress });
  assert.equal(progress.has(progressKey('english', identities.first)), false);
  for (const person of [legacyIdentity, otherLegacy]) assert.equal(progress.get(progressKey('english', person)), original.get(progressKey('english', person)));
  assert.equal(JSON.parse(progress.get(progressKey('english', identities.first, true))).owner.phone, '000101');
});
await check('只迁移已验证科目身份，其他姓名、尾号、科目和路径的进度保持原样', async () => {
  const otherName = { ...legacyIdentity, name: identities.second.name };
  const otherTail = { ...legacyIdentity, phone: '13800000103' };
  const progress = new Map([
    [progressKey('english', otherName), JSON.stringify(progressRecord(otherName))],
    [progressKey('english', otherTail), JSON.stringify(progressRecord(otherTail))],
    [progressKey('auto', legacyIdentity), JSON.stringify(progressRecord(legacyIdentity, 'auto'))],
    [progressKey('english', legacyIdentity).replace('%2FExam-Practice%2F', '%2FOther-App%2F'), JSON.stringify(progressRecord())],
  ]);
  const original = [...progress];
  await loggedIn({ progress });
  assert.deepEqual([...progress], original);
});
await check('汽车旧版进度经该科认证后单独迁移，保留原版本及答题状态', async () => {
  const saved = progressRecord(legacyIdentity, 'auto');
  const progress = new Map([[progressKey('auto', legacyIdentity), JSON.stringify(saved)]]);
  const h = harness(config(), { progress });
  await h.api.login('auto', identities.first.name, identities.first.phone);
  assert.deepEqual(JSON.parse(progress.get(progressKey('auto', identities.first))), { ...saved, owner: { ...saved.owner, phone: identities.first.phone } });
});
await check('进度所属身份与键不一致、未知版本或损坏内容时跳过', async () => {
  const cases = [
    { ...progressRecord(), owner: { ...progressRecord().owner, phone: '13999000101' } },
    { ...progressRecord(), owner: { ...progressRecord().owner, name: identities.second.name } },
    { ...progressRecord(), owner: { ...progressRecord().owner, subject: 'auto' } },
    { ...progressRecord(), version: 999 },
    '{broken',
  ];
  for (const value of cases) {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    const progress = new Map([[progressKey('english', legacyIdentity), raw]]);
    await loggedIn({ progress });
    assert.equal(progress.has(progressKey('english', identities.first)), false);
    assert.equal(progress.get(progressKey('english', legacyIdentity)), raw);
  }
});
await check('未通过验证不迁移进度；本地写入失败保留旧进度且不阻断登录', async () => {
  const oldKey = progressKey('english', legacyIdentity), raw = JSON.stringify(progressRecord());
  const progress = new Map([[oldKey, raw]]);
  const h = harness(config(), { progress });
  await assert.rejects(h.api.login('english', identities.first.name, '000999'));
  assert.deepEqual([...progress], [[oldKey, raw]]);
  const blocked = await loggedIn({ progress, blockProgress: true });
  assert.equal(blocked.api.session('english').phone, '000101');
  assert.deepEqual([...progress], [[oldKey, raw]]);
});
await check('刷新页面重新验证，随机盐更新不丢失原身份或进度键', async () => {
  const first = await loggedIn();
  const before = first.api.progressKey('english', first.api.session('english'));
  const raw = first.storage.get(sessionKey('english'));
  const refreshed = harness(config(), { storage: first.storage });
  await refreshed.api.ready();
  assert.ok(refreshed.stats.derives > 0);
  assert.equal(refreshed.storage.get(sessionKey('english')), raw);
  const rotated = config(); rotated.english = [record('english', identities.first)];
  const next = harness(rotated, { storage: first.storage });
  await next.api.ready();
  assert.equal(next.api.progressKey('english', next.api.session('english')), before);
});
await check('过期会话在同步检查中失效，无需重复派生', async () => {
  const h = await loggedIn();
  const derived = h.stats.derives;
  h.clock.now = h.api.session('english').expiresAt;
  assert.equal(h.api.session('english'), null);
  assert.equal(h.storage.has(sessionKey('english')), false);
  assert.equal(h.stats.derives, derived);
});

for (const [label, value] of [
  ['过期', storedSession(undefined, undefined, { expiresAt: now - 1 })],
  ['未来签发', storedSession(undefined, undefined, { issuedAt: now + 1000 })],
  ['超长有效期', storedSession(undefined, undefined, { expiresAt: now + 13 * 3600000 })],
  ['签发时间过旧', storedSession(undefined, undefined, { issuedAt: now - 13 * 3600000 })],
  ['未知版本', storedSession(undefined, undefined, { version: 3 })],
  ['错误科目', storedSession(undefined, undefined, { subject: 'auto' })],
  ['未归一化姓名', storedSession(undefined, undefined, { name: ' TEST甲 ' })],
  ['无效手机号', storedSession(undefined, undefined, { phone: 'not-a-phone' })],
  ['v2仍保存全号', storedSession(legacyIdentity)],
  ['v1仅保存后6位', storedSession(undefined, undefined, { version: 1 })],
  ['v1错误尾号', legacySession({ phone: '13800000999' })],
  ['v1全号会话已过期', legacySession({ expiresAt: now - 1 })],
  ['损坏 JSON', '{broken'],
]) await check(`拒绝并清除${label}的旧会话`, async () => {
  const h = harness(config(), { storage: seeded(value) });
  await h.api.ready();
  assert.equal(h.api.session('english'), null);
  assert.equal(h.storage.has(sessionKey('english')), false);
});

for (const [label, rows] of [['移除', []], ['停用', [{ ...firstEnglish, enabled: false }]]]) {
  await check(`${label}记录后，刷新使旧会话失效且不能重新登录`, async () => {
    const roster = config(); roster.english = rows;
    const h = harness(roster, { storage: seeded(storedSession()) });
    await h.api.ready();
    assert.equal(h.api.session('english'), null);
    assert.equal(h.storage.has(sessionKey('english')), false);
    await assert.rejects(h.api.login('english', identities.first.name, identities.first.phone));
    assert.equal(h.stats.derives, 0);
  });
}
for (const [label, edit] of [
  ['姓名', d => { d.name = identities.second.name; }],
  ['手机号', d => { d.phone = '000103'; }],
  ['科目', d => { d.subject = 'auto'; }],
  ['签发时间', d => { d.issuedAt--; }],
  ['到期时间', d => { d.expiresAt--; }],
]) await check(`缓存不信任被修改${label}的存储内容`, async () => {
  const h = await loggedIn();
  const value = JSON.parse(h.storage.get(sessionKey('english'))); edit(value);
  h.storage.set(sessionKey('english'), JSON.stringify(value));
  assert.equal(h.api.session('english'), null);
  assert.equal(h.storage.has(sessionKey('english')), false);
});
await check('退出同时撤销缓存；重新塞回旧会话不能恢复当前页面授权', async () => {
  const h = await loggedIn();
  await h.api.login('auto', identities.first.name, identities.first.phone);
  const raw = h.storage.get(sessionKey('english'));
  h.api.logout('english');
  assert.equal(h.api.session('auto').subject, 'auto');
  h.storage.set(sessionKey('english'), raw);
  assert.equal(h.api.session('english'), null);
  h.api.logout();
  assert.equal(h.api.session('auto'), null);
});
await check('旧会话异步恢复期间退出，不会被迟到的派生结果恢复', async () => {
  const gate = deferred(), started = deferred();
  const h = harness(config(), { storage: seeded(legacySession()), beforeDerive: () => { started.resolve(); return gate.promise; } });
  const pending = h.api.ready();
  await started.promise;
  h.api.logout('english'); gate.resolve();
  await pending;
  assert.equal(h.api.session('english'), null);
  assert.equal(h.storage.has(sessionKey('english')), false);
});
await check('登录派生期间退出，会取消该次登录', async () => {
  const gate = deferred(), started = deferred();
  const h = harness(config(), { beforeDerive: () => { started.resolve(); return gate.promise; } });
  const pending = h.api.login('english', identities.first.name, identities.first.phone);
  await started.promise;
  h.api.logout('english'); gate.resolve();
  await assert.rejects(pending);
  assert.equal(h.api.session('english'), null);
});
await check('退出全部会取消第一科汽车尚未完成的登录', async () => {
  const gate = deferred(), started = deferred();
  const h = harness(config(), { beforeDerive: () => { started.resolve(); return gate.promise; } });
  const pending = h.api.login('auto', identities.first.name, identities.first.phone);
  await started.promise;
  h.api.logout(); gate.resolve();
  await assert.rejects(pending);
  assert.equal(h.api.session('auto'), null);
  assert.equal(h.storage.has(sessionKey('auto')), false);
});
await check('名单首次加载期间退出，也会取消此前发起的登录', async () => {
  const h = harness();
  const pending = h.api.login('english', identities.first.name, identities.first.phone);
  h.api.logout('english');
  await assert.rejects(pending);
  assert.equal(h.api.session('english'), null);
});
await check('首次登录清理过期旧会话时，不误取消新的有效登录', async () => {
  const h = harness(config(), { storage: seeded(storedSession(undefined, undefined, { expiresAt: now - 1 })) });
  const person = await h.api.login('english', identities.first.name, identities.first.phone);
  assert.equal(person.name, identities.first.name);
});
await check('同科目后发登录完成后，先发结果不能覆盖较新的身份', async () => {
  const gate = deferred(), started = deferred();
  const h = harness(config(), { beforeDerive: count => {
    if (count <= 2) { started.resolve(); return gate.promise; }
  } });
  const first = h.api.login('english', identities.first.name, identities.first.phone);
  await started.promise;
  const second = await h.api.login('english', identities.second.name, identities.second.phone);
  assert.equal(second.name, identities.second.name);
  gate.resolve(); await assert.rejects(first);
  assert.equal(h.api.session('english').name, identities.second.name);
});
await check('每次匹配复用输入密钥，最多并发四条派生且跳过停用记录', async () => {
  const roster = config();
  roster.english = Array.from({ length: 9 }, (_, index) => ({ salt: randomBytes(16).toString('hex'), hash: '0'.repeat(64), enabled: index !== 8 }));
  const h = harness(roster);
  await assert.rejects(h.api.login('english', identities.first.name, identities.first.phone));
  assert.equal(h.stats.imports, 1);
  assert.equal(h.stats.derives, 8);
  assert.equal(h.stats.maxActive, 4);
});
await check('v3 缺少英语名单仍可使用汽车授权', async () => {
  const roster = config(); delete roster.english;
  const h = harness(roster);
  assert.equal((await h.api.login('auto', identities.first.name, identities.first.phone)).subject, 'auto');
  await assert.rejects(h.api.login('english', identities.first.name, identities.first.phone));
});
await check('WebCrypto、TextEncoder、名单资源或存储不可用时明确拒绝', async () => {
  for (const options of [{ noCrypto: true }, { noEncoder: true }, { loadError: true }]) {
    const h = harness(config(), options);
    await assert.rejects(h.api.ready());
    assert.equal(h.api.session('english'), null);
  }
  const h = harness(config(), { blockStorage: true });
  await assert.rejects(h.api.login('english', identities.first.name, identities.first.phone));
  assert.equal(h.api.session('english'), null);
});
for (const [label, mutate] of [
  ['旧版明文', c => { c.version = 1; c.english = [{ ...identities.first, enabled: true }]; }],
  ['v2全号哈希格式', c => { c.version = 2; delete c.credential; }],
  ['缺少认证方式', c => { delete c.credential; }],
  ['未知认证方式', c => { c.credential = 'name-phone'; }],
  ['算法', c => { c.algorithm = 'SHA-256'; }],
  ['迭代次数', c => { c.iterations = 1; }],
  ['字符串迭代次数', c => { c.iterations = '600000'; }],
  ['非法盐', c => { c.english[0].salt = '00'; }],
  ['非法校验值', c => { c.english[0].hash = 'zz'.repeat(32); }],
  ['重复盐', c => { c.english[1].salt = c.english[0].salt; }],
  ['意外明文属性', c => { c.english[0].name = '不应发布的合成账号'; }],
  ['非布尔 enabled', c => { c.english[0].enabled = 'false'; }],
  ['缺少汽车数组', c => { delete c.auto; }],
  ['缺少营销数组', c => { delete c.marketing; }],
  ['非数组英语名单', c => { c.english = {}; }],
  ['零会话时长', c => { c.sessionHours = 0; }],
  ['过长会话时长', c => { c.sessionHours = 169; }],
  ['字符串会话时长', c => { c.sessionHours = '12'; }],
]) await check(`拒绝${label}配置`, async () => {
  const roster = config(); mutate(roster);
  const h = harness(roster);
  await assert.rejects(h.api.ready());
  assert.equal(h.api.session('english'), null);
  assert.equal(h.stats.derives, 0);
});

const failures = results.filter(result => !result.passed);
console.log(JSON.stringify({ suite: 'synthetic roster', passed: results.length - failures.length, failed: failures.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
