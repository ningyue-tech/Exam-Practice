import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export async function runEnglishChecks({ root, check, read }) {
  const engine = require(path.join(root, 'english-exam-core.js'));
  const sandbox = { window: {} };
  vm.runInNewContext(read('data/english-bank.js'), sandbox);
  const raw = JSON.parse(JSON.stringify(sandbox.window.ENGLISH_BANK));
  const bank = engine.validateBank(raw);
  const expectedSections = ['pronunciation', 'dialogue', 'vocabulary', 'pictures', 'cloze', 'reading', 'writing'];
  check('英语完整包含7个板块，题号与答案可解析', () => {
    assert.deepEqual(bank.sections.map(s => s.id).sort(), [...expectedSections].sort());
    assert.equal(new Set(bank.questions.map(q => q.id)).size, bank.questions.length);
    assert.ok(bank.sections.every(s => s.questionCount > 0));
  });
  check('英语扫描题和材料图片全部在仓库内且存在', () => {
    for (const group of bank.groups) {
      const pictures = [...group.images, ...group.questions.flatMap(q => q.images)];
      assert.ok(pictures.length, `材料 ${group.id} 缺少原题图片`);
      for (const image of pictures) {
        const target = path.resolve(root, image.src);
        assert.ok(target.startsWith(path.join(root, 'assets') + path.sep));
        assert.ok(fs.statSync(target).size > 0, `${image.src} 图片为空`);
        assert.ok(image.alt.trim());
      }
    }
  });
  check('导入保留语音40题、词汇120题、图文32题及交际24组、阅读48组、书面8组', () => {
    const byId = Object.fromEntries(bank.sections.map(s => [s.id, s]));
    assert.equal(byId.pronunciation.questionCount, 40);
    assert.equal(byId.vocabulary.questionCount, 120);
    assert.equal(byId.pictures.questionCount, 32);
    assert.equal(byId.dialogue.groups.length, 24);
    assert.equal(byId.reading.groups.length, 48);
    assert.equal(byId.writing.groups.length, 8);
    assert.equal(byId.dialogue.questionCount, 120);
    assert.equal(byId.cloze.questionCount, 80);
    assert.equal(byId.reading.questionCount, 240);
    assert.equal(byId.writing.questionCount, 40);
    assert.equal(bank.questions.length, 672);
  });
  check('阅读判断题映射与人工复核的源答案一致', () => {
    const reading = raw.sections.find(s => s.id === 'reading');
    for (const [number, answers] of Object.entries({17:'BABAB',18:'ABABA',30:'BAABB',31:'BAABA',32:'BABAB'})) {
      const group = reading.groups.find(g => g.sourceNumber === Number(number));
      assert.ok(group);
      assert.equal(group.questions.map(q => q.answer).join(''), answers);
      assert.ok(group.questions.every(q => q.options[0].text === '正确' && q.options[1].text === '错误'));
    }
  });
  let seed = 123456789;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (const section of bank.sections) {
    check(`${section.title} 多次组卷保持题数准确、无重复且材料完整`, () => {
      const possible = engine.availableCounts(section).filter(n => n > 0);
      const targets = [...new Set([possible[0], possible[Math.floor(possible.length / 2)], possible.at(-1)])];
      for (let run = 0; run < 15; run++) for (const count of targets) {
        const paper = engine.buildPaper(bank, { [section.id]: count }, random);
        assert.equal(paper.questions.length, count);
        assert.equal(paper.max, count * 2);
        assert.equal(new Set(paper.questions.map(q => q.id)).size, count);
        assert.ok(paper.questions.every(q => q.sectionId === section.id));
        for (const group of paper.groups) {
          assert.deepEqual(paper.questions.filter(q => q.groupId === group.id).map(q => q.id), group.questions.map(q => q.id));
        }
      }
    });
  }
  check('不满足整组要求的题数明确拒绝，空卷和非法设置拒绝', () => {
    const section = bank.sections.find(s => !engine.availableCounts(s).includes(1));
    assert.ok(section, '应至少有一个多小题材料板块');
    assert.throws(() => engine.buildPaper(bank, { [section.id]: 1 }));
    assert.throws(() => engine.buildPaper(bank, {}));
    assert.throws(() => engine.buildPaper(bank, { vocabulary: -1 }));
    assert.throws(() => engine.buildPaper(bank, { vocabulary: 0.5 }));
    assert.throws(() => engine.buildPaper(bank, { vocabulary: 121 }));
    assert.throws(() => engine.buildPaper(bank, { missingSection: 10 }));
  });
  const paper = engine.buildPaper(bank, { vocabulary: 50 }, random);
  const correct = Object.fromEntries(paper.questions.map(q => [q.id, q.answer]));
  check('英语50题全对100分、全错0分、未答0分', () => {
    const full = engine.scorePaper(paper, correct);
    assert.equal(full.score, 100);
    assert.equal(full.max, 100);
    assert.equal(full.correct, 50);
    assert.equal(full.missing, 0);
    const wrong = Object.fromEntries(paper.questions.map(q => [q.id, q.options.find(o => o.key !== q.answer).key]));
    assert.equal(engine.scorePaper(paper, wrong).score, 0);
    assert.equal(engine.scorePaper(paper, wrong).wrong, 50);
    assert.equal(engine.scorePaper(paper, {}).missing, 50);
  });
  check('英语混合作答统计与分项分数一致，非法选项不计为已答', () => {
    const answers = { [paper.questions[0].id]: paper.questions[0].answer, [paper.questions[1].id]: 'Z', unrelated: 'A' };
    const result = engine.scorePaper(paper, answers);
    assert.equal(result.score, 2);
    assert.equal(result.missing, 49);
    assert.deepEqual(Object.keys(engine.sanitizeAnswers(paper, answers)), [paper.questions[0].id]);
    assert.equal(Object.values(result.sections).reduce((n, s) => n + s.score, 0), result.score);
  });
  const candidate = { subject: 'english', name: '英语测试', phone: '13800000004' };
  const startedAt = Date.now();
  const saved = { version: 1, bankSignature: bank.signature, testMode: false, owner: candidate,
    groupIds: paper.groups.map(g => g.id), ids: paper.questions.map(q => q.id),
    answers: correct, minutes: 60, startedAt, deadline: startedAt + 3600000,
    remaining: 3500, submitted: false, mode: 'practice', title: '英语测试卷', highlightMissing: true, submitReason: '' };
  check('英语刷新恢复保留同一试卷、作答、期限和漏题标记', () => {
    const restored = engine.restoreState(bank, saved, candidate, false);
    assert.ok(restored);
    assert.deepEqual(restored.paper.questions.map(q => q.id), paper.questions.map(q => q.id));
    assert.deepEqual(restored.answers, correct);
    assert.equal(restored.deadline, saved.deadline);
    assert.equal(restored.highlightMissing, true);
  });
  check('英语恢复拒绝其他考生、跨模式、损坏题号与被拆散的材料', () => {
    assert.equal(engine.restoreState(bank, saved, { ...candidate, name: '另一个人' }, false), null);
    assert.equal(engine.restoreState(bank, saved, candidate, true), null);
    assert.equal(engine.restoreState(bank, { ...saved, bankSignature: 'old' }, candidate, false), null);
    assert.equal(engine.restoreState(bank, { ...saved, ids: saved.ids.slice(1) }, candidate, false), null);
    assert.equal(engine.restoreState(bank, { ...saved, groupIds: [saved.groupIds[0], saved.groupIds[0]] }, candidate, false), null);
    assert.equal(engine.restoreState(bank, { ...saved, deadline: saved.deadline + 1000 }, candidate, false), null);
  });
  check('英语题库无效答案、重复题号和外部图片会被拒绝', () => {
    const invalid = JSON.parse(JSON.stringify(raw));
    invalid.sections[0].groups[0].questions[0].answer = 'Z';
    assert.throws(() => engine.validateBank(invalid));
    invalid.sections[0].groups[0].questions[0].answer = raw.sections[0].groups[0].questions[0].answer;
    invalid.sections[0].groups[0].images = [{ src: 'https://example.test/answer.png' }];
    assert.throws(() => engine.validateBank(invalid));
  });
}
