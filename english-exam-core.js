/* Pure English practice helpers. No storage, DOM or access-session side effects. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EnglishExamEngine = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const POINTS = 2;
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const fail = message => { throw new Error(message); };
  function identifier(value, label) {
    if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value) || own(Object.prototype, value)) fail(label + '编号无效。');
    return value;
  }
  function images(value, label) {
    if (value === undefined) return [];
    if (!Array.isArray(value)) fail(label + '图片列表无效。');
    return value.map(image => {
      const src = typeof image === 'string' ? image : image && image.src;
      if (typeof src !== 'string' || !/^(?:\.\/)?assets\/[a-zA-Z0-9_./%-]+$/.test(src) || src.split('/').includes('..')) fail(label + '图片地址无效。');
      return {src, alt: typeof image.alt === 'string' ? image.alt : label + '原题图片'};
    });
  }
  function signature(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(16);
  }
  function validateBank(raw) {
    if (!raw || !Array.isArray(raw.sections) || !raw.sections.length) fail('英语题库未加载或没有板块。');
    const sectionIds = new Set(), groupIds = new Set(), questionIds = new Set();
    const allGroups = [], allQuestions = [];
    const sections = raw.sections.map(source => {
      const id = identifier(source.id, '板块');
      if (sectionIds.has(id)) fail('板块编号重复：' + id);
      sectionIds.add(id);
      const title = String(source.title || source.label || '').trim();
      if (!title || !Array.isArray(source.groups) || !source.groups.length) fail('板块缺少名称或题目：' + id);
      const groups = source.groups.map(entry => {
        const groupId = identifier(entry.id, '材料');
        if (groupIds.has(groupId)) fail('材料编号重复：' + groupId);
        groupIds.add(groupId);
        if (!Array.isArray(entry.questions) || !entry.questions.length) fail('材料没有小题：' + groupId);
        const group = {id: groupId, sectionId: id, title: String(entry.title || ''), instructions: String(entry.instructions || ''), images: images(entry.images, title), questions: []};
        group.questions = entry.questions.map(item => {
          const questionId = identifier(item.id, '题目');
          if (questionIds.has(questionId)) fail('题目编号重复：' + questionId);
          questionIds.add(questionId);
          if (!Array.isArray(item.options) || item.options.length < 2 || item.options.length > 6) fail('选项数量无效：' + questionId);
          const keys = new Set();
          const options = item.options.map(option => {
            const key = typeof option === 'string' ? option : option && option.key;
            if (typeof key !== 'string' || !/^[A-F]$/.test(key) || keys.has(key)) fail('选项编号无效：' + questionId);
            keys.add(key);
            const text = typeof option === 'string' ? option : String(option.text || key);
            return {key, text};
          });
          if (!keys.has(item.answer)) fail('题库答案不在选项中：' + questionId);
          const question = {id: questionId, groupId, sectionId: id, sectionTitle: title, number: String(item.number ?? ''), prompt: String(item.prompt || ''), images: images(item.images, title), options, answer: item.answer, explanation: String(item.explanation || '')};
          if (!question.prompt && !question.images.length && !group.images.length) fail('题干和图片均为空：' + questionId);
          allQuestions.push(question);
          return question;
        });
        allGroups.push(group);
        return group;
      });
      return {id, title, groups, questionCount: groups.reduce((total, group) => total + group.questions.length, 0)};
    });
    return {title: String(raw.title || '英语题库'), version: String(raw.version || 1), sections, groups: allGroups, questions: allQuestions,
      signature: signature(JSON.stringify([raw.version, allGroups.map(group => [group.id, group.questions.map(q => [q.id, q.answer, q.options.map(o => o.key)])])]))};
  }
  function shuffle(array, random) {
    const copy = array.slice(), rng = random || Math.random;
    for (let i = copy.length - 1; i > 0; i--) {
      const value = rng();
      if (!Number.isFinite(value) || value < 0 || value >= 1) fail('随机数必须在0到1之间。');
      const j = Math.floor(value * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function availableCounts(section) {
    const reachable = new Uint8Array(section.questionCount + 1);
    reachable[0] = 1;
    let max = 0;
    section.groups.forEach(group => {
      const size = group.questions.length;
      for (let n = max; n >= 0; n--) if (reachable[n]) reachable[n + size] = 1;
      max += size;
    });
    return Array.from(reachable).flatMap((value, count) => value ? [count] : []);
  }
  function pickGroups(section, target, random) {
    if (!Number.isInteger(target) || target < 0 || target > section.questionCount) fail(section.title + '题数应为0至' + section.questionCount + '的整数。');
    if (target === 0) return [];
    const choices = new Array(target + 1).fill(null);
    choices[0] = {group: null, previous: null};
    const pool = shuffle(section.groups, random);
    for (const group of pool) {
      const size = group.questions.length;
      for (let n = target; n >= size; n--) if (!choices[n] && choices[n - size]) choices[n] = {group, previous: choices[n - size]};
      if (choices[target]) break;
    }
    if (!choices[target]) {
      const counts = availableCounts(section);
      const below = counts.filter(n => n < target).pop();
      const above = counts.find(n => n > target);
      fail(section.title + '需保留整组小题，无法组成' + target + '题。可改为' + [below, above].filter(n => n !== undefined).join('或') + '题。');
    }
    const result = [];
    for (let step = choices[target]; step.group; step = step.previous) result.push(step.group);
    return result.reverse();
  }
  function paperFromGroups(groups) {
    let number = 0;
    return {groups: groups.slice(), questions: groups.flatMap(group => group.questions.map(question => ({...question, no: ++number}))), max: groups.reduce((total, group) => total + group.questions.length * POINTS, 0)};
  }
  function buildPaper(bank, counts, random) {
    if (!counts || typeof counts !== 'object' || Array.isArray(counts)) fail('请选择练习题数。');
    if (Object.keys(counts).some(id => !bank.sections.some(section => section.id === id))) fail('组卷设置包含不存在的板块。');
    const groups = bank.sections.flatMap(section => pickGroups(section, own(counts, section.id) ? counts[section.id] : 0, random));
    if (!groups.length) fail('请至少选择一道题。');
    return paperFromGroups(groups);
  }
  function sanitizeAnswers(paper, answers) {
    const clean = {};
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return clean;
    paper.questions.forEach(question => {
      if (own(answers, question.id) && question.options.some(option => option.key === answers[question.id])) clean[question.id] = answers[question.id];
    });
    return clean;
  }
  function scorePaper(paper, answers) {
    const valid = sanitizeAnswers(paper, answers);
    const sections = {};
    let correct = 0, missing = 0;
    const details = paper.questions.map(question => {
      const answered = own(valid, question.id), right = answered && valid[question.id] === question.answer;
      if (right) correct++;
      if (!answered) missing++;
      if (!sections[question.sectionId]) sections[question.sectionId] = {title: question.sectionTitle, count: 0, score: 0, max: 0};
      const section = sections[question.sectionId];
      section.count++; section.max += POINTS; section.score += right ? POINTS : 0;
      return {id: question.id, answer: valid[question.id] || '', correct: right, answered, score: right ? POINTS : 0};
    });
    return {score: correct * POINTS, max: paper.questions.length * POINTS, correct, missing, wrong: paper.questions.length - correct - missing, sections, details};
  }
  function restoreState(bank, saved, candidate, testMode) {
    if (!saved || saved.version !== 1 || saved.bankSignature !== bank.signature || saved.testMode !== !!testMode) return null;
    if (!candidate || !saved.owner || saved.owner.subject !== 'english' || candidate.subject !== 'english' || saved.owner.name !== candidate.name || saved.owner.phone !== candidate.phone) return null;
    if (!Array.isArray(saved.groupIds) || !saved.groupIds.length || new Set(saved.groupIds).size !== saved.groupIds.length) return null;
    const lookup = new Map(bank.groups.map(group => [group.id, group]));
    if (saved.groupIds.some(id => !lookup.has(id))) return null;
    const paper = paperFromGroups(saved.groupIds.map(id => lookup.get(id)));
    if (!Array.isArray(saved.ids) || saved.ids.length !== paper.questions.length || saved.ids.some((id, index) => id !== paper.questions[index].id)) return null;
    if (!Number.isInteger(saved.minutes) || saved.minutes < 1 || saved.minutes > 240 || !Number.isFinite(saved.deadline) || !Number.isFinite(saved.startedAt) || saved.startedAt <= 0 || saved.deadline !== saved.startedAt + saved.minutes * 60000) return null;
    if (!Number.isInteger(saved.remaining) || saved.remaining < 0 || saved.remaining > saved.minutes * 60 || typeof saved.submitted !== 'boolean') return null;
    if (!['practice', 'custom'].includes(saved.mode) || typeof saved.title !== 'string' || !saved.title.trim() || saved.title.length > 80) return null;
    if (saved.submitted && !['manual', 'timeout', 'verify'].includes(saved.submitReason)) return null;
    if (saved.submitReason === 'verify' && !testMode) return null;
    const counts = Object.fromEntries(bank.sections.map(section => [section.id, paper.questions.filter(q => q.sectionId === section.id).length]));
    if (saved.mode === 'practice' && Object.values(counts).filter(Boolean).length !== 1) return null;
    return {paper, answers: sanitizeAnswers(paper, saved.answers), title: saved.title.trim(), minutes: saved.minutes, startedAt: saved.startedAt, deadline: saved.deadline,
      remaining: saved.remaining, submitted: saved.submitted, submitReason: saved.submitted ? saved.submitReason : '', highlightMissing: saved.highlightMissing === true, mode: saved.mode, counts};
  }
  return Object.freeze({POINTS, validateBank, availableCounts, buildPaper, sanitizeAnswers, scorePaper, restoreState});
});
