import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { pbkdf2Sync } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// All identities below are synthetic. Never load the repository's real roster.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'whitelist-tool-test-'));
const target = path.join(directory, 'whitelist.js');
const script = path.join(directory, 'scripts/manage-whitelist.mjs');
const outputs = [];
const iterations = 600000;
const source = () => fs.readFileSync(target, 'utf8');
const write = config => fs.writeFileSync(target, 'window.EXAM_WHITELISTS = ' + JSON.stringify(config) + ';\n');
const read = () => {
  const context = { window: {} };
  vm.runInNewContext(source(), context, { timeout: 1000 });
  return JSON.parse(JSON.stringify(context.window.EXAM_WHITELISTS));
};
const hash = (subject, name, last6, salt) => pbkdf2Sync(
  JSON.stringify(['exam-whitelist-v3', subject, name, last6]),
  Buffer.from(salt, 'hex'), iterations, 32, 'sha256'
).toString('hex');
const assertNoFilesLeftBehind = () => {
  assert.deepEqual(fs.readdirSync(directory).sort(), ['scripts', 'whitelist.js']);
  assert.deepEqual(fs.readdirSync(path.join(directory, 'scripts')), ['manage-whitelist.mjs']);
};
function migrate() {
  try {
    const output = execFileSync(process.execPath, [script, 'migrate'], { encoding: 'utf8', stdio: 'pipe' });
    outputs.push(output);
    return { code: 0, output };
  } catch (error) {
    const output = String(error.stdout ?? '') + String(error.stderr ?? '');
    outputs.push(output);
    return { code: error.status, output };
  }
}
async function invoke(action, subject, { name = ' 新增测试 ', last6 = ' ０００００６ ' } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, action, subject]);
    let output = '', nameSent = false, phoneSent = false;
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Whitelist tool timed out'));
    }, 20000);
    child.stdout.on('data', chunk => {
      output += chunk;
      if (!nameSent && /姓名\s*[：:]/.test(output)) {
        nameSent = true;
        child.stdin.write(name + '\n');
      }
      if (!phoneSent && /[^\r\n]*后\s*6\s*位[^\r\n]*[：:]/.test(output)) {
        phoneSent = true;
        child.stdin.write(last6 + '\n');
      }
    });
    child.stderr.on('data', chunk => { output += chunk; });
    child.stdin.on('error', error => { if (error.code !== 'EPIPE') reject(error); });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      outputs.push(output);
      resolve({ code, output });
    });
  });
}
async function assertRejectedUnchanged(action, subject, identity) {
  const before = source();
  const result = action === 'migrate' ? migrate() : await invoke(action, subject, identity);
  assert.notEqual(result.code, 0, `${action} must reject unsupported input`);
  assert.equal(source(), before, `${action} must not rewrite the roster on rejection`);
  assertNoFilesLeftBehind();
}

try {
  fs.mkdirSync(path.join(directory, 'scripts'));
  fs.copyFileSync(path.join(root, 'scripts/manage-whitelist.mjs'), script);
  write({
    sessionHours: 12,
    auto: [{ name: ' 原测试Ａ ', phone: '+86 １３８ ００００ ０００１', enabled: false }],
    marketing: [{ name: '跨科测试', phone: '13912345678' }]
  });
  assert.equal(migrate().code, 0);
  const migrated = read();
  assert.equal(migrated.version, 3);
  assert.equal(migrated.credential, 'name-phone-last6');
  assert.equal(migrated.algorithm, 'PBKDF2-SHA-256');
  assert.equal(migrated.iterations, iterations);
  assert.equal(migrated.sessionHours, 12);
  assert.deepEqual(migrated.english, []);
  assert.equal(migrated.auto[0].enabled, false);
  assert.equal(migrated.marketing[0].enabled, true);
  assert.equal(migrated.auto[0].hash, hash('auto', '原测试A', '000001', migrated.auto[0].salt));
  assert.equal(migrated.marketing[0].hash, hash('marketing', '跨科测试', '345678', migrated.marketing[0].salt));
  assert.notEqual(migrated.auto[0].salt, migrated.marketing[0].salt);
  assertNoFilesLeftBehind();
  await assertRejectedUnchanged('migrate');

  assert.equal((await invoke('add', 'auto')).code, 0);
  const added = read();
  assert.equal(added.auto.length, 2);
  assert.equal(added.auto[1].enabled, true);
  assert.equal(added.auto[1].hash, hash('auto', '新增测试', '000006', added.auto[1].salt));
  assert.notEqual(added.auto[0].salt, added.auto[1].salt);
  await assertRejectedUnchanged('add', 'auto', { name: '新增测试', last6: '000006' });
  assert.equal((await invoke('disable', 'auto')).code, 0);
  assert.equal(read().auto[1].enabled, false);
  await assertRejectedUnchanged('add', 'auto');
  assert.equal((await invoke('enable', 'auto')).code, 0);
  assert.equal(read().auto[1].enabled, true);
  assert.equal(read().auto[1].hash, added.auto[1].hash);
  assert.equal(read().auto[1].salt, added.auto[1].salt);
  await assertRejectedUnchanged('disable', 'marketing');

  // Both parts of the identity and the subject participate in verification.
  assert.equal((await invoke('add', 'auto', { name: '另一测试', last6: '000006' })).code, 0);
  assert.equal((await invoke('add', 'english')).code, 0);
  const separate = read();
  assert.equal(separate.auto.length, 3);
  assert.equal(separate.english.length, 1);
  assert.equal(separate.auto[2].hash, hash('auto', '另一测试', '000006', separate.auto[2].salt));
  assert.equal(separate.english[0].hash, hash('english', '新增测试', '000006', separate.english[0].salt));

  // Only exactly six digits after NFKC and outer trim are accepted interactively.
  for (const last6 of ['13800000006', '+86000006', '0086000006', '000 006', '000-006', '00000a', '00006', '0000006', '']) {
    await assertRejectedUnchanged('add', 'auto', { name: '严格输入测试', last6 });
  }
  await assertRejectedUnchanged('disable', 'auto', { last6: '13800000006' });
  await assertRejectedUnchanged('enable', 'auto', { last6: '000 006' });

  const valid = read();
  for (const subject of ['auto', 'marketing', 'english']) {
    for (const row of valid[subject]) {
      assert.deepEqual(Object.keys(row).sort(), ['enabled', 'hash', 'salt']);
      assert.match(row.salt, /^[a-f0-9]{32}$/);
      assert.match(row.hash, /^[a-f0-9]{64}$/);
    }
  }
  const privateValues = ['原测试Ａ', '原测试A', '跨科测试', '新增测试', '另一测试', '严格输入测试', '13800000001', '13800000006', '13912345678'];
  for (const value of privateValues) assert.ok(!source().includes(value), 'Roster must not store plaintext identities');
  for (const last6 of ['000001', '000006', '345678']) assert.ok(!source().includes(JSON.stringify(last6)), 'Roster must not store plaintext suffixes');
  assertNoFilesLeftBehind();

  // Existing v2 hashes cannot be reversed into v3 credentials. Reject atomically.
  const v2 = { ...valid, version: 2 };
  delete v2.credential;
  write(v2);
  await assertRejectedUnchanged('migrate');
  for (const action of ['add', 'disable', 'enable']) await assertRejectedUnchanged(action, 'auto');

  // A version marker is not permission to reinterpret unknown formats as plaintext.
  for (const version of [1, 4, '3', null]) {
    write({ version, sessionHours: 12, auto: [{ name: '旧格式测试', phone: '13800000001' }], marketing: [], english: [] });
    await assertRejectedUnchanged('migrate');
  }
  for (const credential of [undefined, 'name-phone', 'name-phone-last4']) {
    write({ ...valid, credential });
    await assertRejectedUnchanged('add', 'auto');
  }
  write({ ...valid, version: 4 });
  await assertRejectedUnchanged('add', 'auto');
  write({ sessionHours: 12, auto: [], marketing: [], english: [] });
  await assertRejectedUnchanged('add', 'auto');

  // Successful and failed operations must not echo submitted identities.
  for (const value of [...privateValues, '旧格式测试', '000006']) {
    assert.ok(!outputs.some(output => output.includes(value)), 'CLI must not echo plaintext identities');
  }
  assertNoFilesLeftBehind();
  console.log('Whitelist maintenance: v3 migration hashes, six-digit credentials, lifecycle, schema rejection and no plaintext or backup leaks passed.');
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
