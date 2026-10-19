import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}
async function checkAsync(name, fn) {
  try { await fn(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
function accessHarness(config) {
  const storage = new Map();
  const sandbox = {
    URL, URLSearchParams, setTimeout, clearTimeout, Date, console,
    window: { EXAM_WHITELISTS: config },
    sessionStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
    document: {
      currentScript: { src: 'https://example.test/Exam-Practice/access.js' },
      createElement: () => ({}),
      head: { appendChild: script => queueMicrotask(() => script.onload()) },
    },
  };
  vm.runInNewContext(read('access.js'), sandbox);
  return { api: sandbox.window.ExamAccess, storage };
}
const person = (name, phone, enabled = true) => ({ name, phone, enabled });
const config = {
  sessionHours: 12,
  auto: [person('汽车测试', '13800000001')],
  marketing: [person('营销测试', '13800000002')],
  english: [person('英语测试', '13800000004'), person('停用测试', '13800000005', false)],
};
const { api, storage } = accessHarness(config);
await api.ready();
await checkAsync('英语独立名单可登录，手机号支持 +86 和空格', async () => {
  const session = await api.login('english', ' 英语测试 ', '+86 138 0000 0004');
  assert.equal(session.subject, 'english');
  assert.equal(session.maskedPhone, '138****0004');
});
await checkAsync('汽车名单不能用于英语登录', async () => {
  await assert.rejects(api.login('english', '汽车测试', '13800000001'));
});
await checkAsync('停用学员不能登录', async () => {
  await assert.rejects(api.login('english', '停用测试', '13800000005'));
});
await checkAsync('原两科名单仍可登录并与英语状态隔离', async () => {
  await api.login('auto', '汽车测试', '13800000001');
  await api.login('marketing', '营销测试', '13800000002');
  assert.equal(api.session('auto').subject, 'auto');
  assert.equal(api.session('marketing').subject, 'marketing');
  api.logout('auto');
  assert.equal(api.session('auto'), null);
  assert.equal(api.session('english').subject, 'english');
});
check('英语进度按学员及验证模式隔离', () => {
  const a = api.session('english');
  const b = { ...a, name: '另一测试学员', phone: '13800000006' };
  assert.notEqual(api.progressKey('english', a), api.progressKey('english', b));
  assert.notEqual(api.progressKey('english', a), api.progressKey('english', a, true));
  assert.throws(() => api.progressKey('auto', a));
});
check('英语登录与考试链接保留验证模式', () => {
  assert.equal(api.examUrl('english', true), 'https://example.test/Exam-Practice/english-exam.html?test=1');
  assert.equal(api.loginUrl('english', true), 'https://example.test/Exam-Practice/login.html?subject=english&test=1');
});
check('已过期的英语会话失效', () => {
  const key = [...storage.keys()].find(key => key.endsWith('session:english'));
  const value = JSON.parse(storage.get(key));
  value.expiresAt = Date.now() - 1;
  storage.set(key, JSON.stringify(value));
  assert.equal(api.session('english'), null);
});
await checkAsync('旧名单未配置英语时不影响原两科', async () => {
  const old = accessHarness({ sessionHours: 12, auto: config.auto, marketing: config.marketing }).api;
  await old.ready();
  assert.equal((await old.login('auto', '汽车测试', '13800000001')).subject, 'auto');
  await assert.rejects(old.login('english', '英语测试', '13800000004'));
});

for (const [file, expected] of [['auto-exam.html', 796], ['marketing-exam.html', 800]]) {
  check(`${file} 原题库数量、唯一ID及答案结构`, () => {
    const match = read(file).match(/^const bank=(.*);$/m);
    assert.ok(match);
    const bank = JSON.parse(match[1]);
    assert.equal(bank.length, expected);
    assert.equal(new Set(bank.map(q => q.id)).size, expected);
    for (const q of bank) {
      assert.ok(q.stem && q.module);
      if (q.type === 'judge') assert.ok(['正确', '错误'].includes(q.answer));
      else {
        assert.ok(Array.isArray(q.answer) && q.answer.length > 0);
        assert.ok(q.answer.every(key => Object.hasOwn(q.options, key)));
        if (q.type === 'single') assert.equal(q.answer.length, 1);
      }
    }
  });
}

for (const file of fs.readdirSync(root).filter(name => /\.(html|js)$/.test(name))) {
  check(`${file} JavaScript 语法`, () => {
    const source = read(file);
    if (file.endsWith('.js')) new vm.Script(source, { filename: file });
    else for (const [index, match] of [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].entries()) {
      if (!/\bsrc=/.test(match[1])) new vm.Script(match[2], { filename: `${file}:${index}` });
    }
  });
  if (file.endsWith('.html')) check(`${file} 本地静态资源存在`, () => {
    for (const match of read(file).matchAll(/(?:src|href)=["'](\.\/[^"'#?]*)(?:[?#][^"']*)?["']/g)) {
      assert.ok(fs.existsSync(path.resolve(root, match[1])), `${file} 缺少 ${match[1]}`);
    }
  });
}

// The question-bank and scoring tests are loaded after the English module exists.
if (fs.existsSync(path.join(root, 'scripts/test-english-bank.mjs'))) {
  const { runEnglishChecks } = await import('./test-english-bank.mjs');
  await runEnglishChecks({ root, check, checkAsync, read });
}
const failed = results.filter(result => !result.passed);
const report = { date: '2026-10-19', passed: results.length - failed.length, failed: failed.length, results };
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/english-regression.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, failed: report.failed, failures: failed }, null, 2));
if (failed.length) process.exitCode = 1;
