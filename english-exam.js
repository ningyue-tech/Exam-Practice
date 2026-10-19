/* English practice UI. Local records are isolated by candidate, subject and mode. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const SUBJECT = 'english';
  const TEST_MODE = new URLSearchParams(location.search).get('test') === '1';
  const DEFAULT_TITLE = '宁跃教育 · 英语练习';
  const Engine = window.EnglishExamEngine;
  let bank, candidate, storageKey, timerId, saveWarning = false;
  let state = null;
  const countOptions = new Map();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function error(message) {
    $('settingsError').textContent = message || '';
    $('settingsError').hidden = !message;
  }
  function authorized() {
    if (window.ExamAccess && ExamAccess.samePerson(ExamAccess.session(SUBJECT), candidate)) return true;
    clearInterval(timerId);
    if ($('imageDialog').open) $('imageDialog').close();
    if (window.ExamAccess) ExamAccess.blockExam(SUBJECT, '英语名单验证已失效或考生已变更，请重新验证。练习计时不会暂停。');
    return false;
  }
  function getSection(id) { return bank.sections.find(section => section.id === id); }
  function defaultCount(section) {
    const positive = countOptions.get(section.id).filter(count => count > 0);
    return positive.find(count => count >= 10) || positive[positive.length - 1];
  }
  function countsFromSettings() {
    const counts = Object.fromEntries(bank.sections.map(section => [section.id, 0]));
    if ($('mode').value === 'practice') counts[$('practiceSection').value] = Number($('practiceCount').value);
    else bank.sections.forEach(section => { counts[section.id] = Number($('count-' + section.id).value); });
    return counts;
  }
  function describeGroupSizes(section) {
    const sizes = [...new Set(section.groups.map(group => group.questions.length))].sort((a,b) => a-b);
    return sizes.length === 1 && sizes[0] === 1 ? '单题抽取' : '每组' + sizes.join(' / ') + '小题，整组抽取';
  }
  function practiceChanged(reset) {
    const section = getSection($('practiceSection').value);
    $('practiceCount').max = section.questionCount;
    if (reset) $('practiceCount').value = defaultCount(section);
    $('practiceHint').textContent = '共' + section.questionCount + '小题 · ' + describeGroupSizes(section);
    updateSettings();
  }
  function updateSettings() {
    const practice = $('mode').value === 'practice';
    $('practiceSettings').hidden = !practice;
    $('customSettings').hidden = practice;
    const counts = countsFromSettings();
    const valid = bank.sections.every(section => Number.isInteger(counts[section.id]) && countOptions.get(section.id).includes(counts[section.id]));
    const total = Object.values(counts).reduce((sum, count) => sum + (Number.isFinite(count) ? count : 0), 0);
    $('totalHint').textContent = valid && total > 0 ? '下次练习：' + total + '小题 / ' + total * Engine.POINTS + '分' : '请设置有效题数；材料题需保留整组小题。';
    $('settingsSummary').textContent = valid && total > 0 ? total + '题 / ' + total * Engine.POINTS + '分' : '每题2分';
    if (!state) renderStats();
  }
  function setupSettings() {
    bank.sections.forEach(section => countOptions.set(section.id, Engine.availableCounts(section)));
    $('practiceSection').innerHTML = bank.sections.map(section => '<option value="' + esc(section.id) + '">' + esc(section.title) + '</option>').join('');
    $('sectionCounts').innerHTML = bank.sections.map(section => '<div class="count-row"><label for="count-' + esc(section.id) + '">' + esc(section.title) + '<small>共' + section.questionCount + '小题 · ' + esc(describeGroupSizes(section)) + '</small></label><input id="count-' + esc(section.id) + '" data-count="' + esc(section.id) + '" type="number" min="0" max="' + section.questionCount + '" step="1" value="' + defaultCount(section) + '"></div>').join('');
    $('sectionOverview').innerHTML = bank.sections.map(section => '<button type="button" class="section-chip" data-section="' + esc(section.id) + '">' + esc(section.title) + ' · ' + section.questionCount + '题</button>').join('');
    $('verifyBtn').hidden = !TEST_MODE;
    $('testNote').hidden = !TEST_MODE;
    practiceChanged(true);
  }
  function startExam(force) {
    if (!authorized()) return false;
    let paper;
    const minutes = Number($('minutes').value);
    try {
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) throw new Error('练习时长请输入1至240之间的整数分钟。');
      paper = Engine.buildPaper(bank, countsFromSettings());
    } catch (problem) { error(problem.message); return false; }
    if (state && !state.submitted && !force && !confirm('重新开始会清空本次答题和未答标红状态，按当前设置重新抽题。确定继续吗？')) return false;
    clearInterval(timerId);
    const startedAt = Date.now();
    state = {paper, answers: {}, submitted: false, submitReason: '', highlightMissing: false, minutes, startedAt, deadline: startedAt + minutes * 60000, remaining: minutes * 60,
      title: $('title').value.trim() || DEFAULT_TITLE, mode: $('mode').value, counts: countsFromSettings()};
    $('missingPanel').hidden = true;
    $('missingNums').textContent = '';
    $('missingTitle').textContent = '';
    error('');
    if (!saveWarning) $('saveNote').textContent = '已开始新练习，之前的作答与标红已清除。刷新可继续；离开页面期间仍会计时。';
    renderPaper(); renderNavigation(); renderStats(); save(); startTimer();
    if (window.matchMedia('(max-width: 900px)').matches) $('exam').scrollIntoView({behavior: 'smooth', block: 'start'});
    return true;
  }
  function startTimer() {
    clearInterval(timerId); tick();
    if (state && !state.submitted) timerId = setInterval(tick, 500);
  }
  function tick() {
    if (!authorized() || !state) return;
    if (!state.submitted) state.remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    $('timer').textContent = String(Math.floor(state.remaining / 60)).padStart(2,'0') + ':' + String(state.remaining % 60).padStart(2,'0');
    $('timer').classList.toggle('lowtime', state.remaining <= 300 && !state.submitted);
    if (!state.submitted && state.remaining === 0) submit('timeout');
  }
  function answered(question) { return !!state.answers[question.id]; }
  function answer(id, value) {
    if (!authorized() || !state || state.submitted) return;
    if (Date.now() >= state.deadline) { submit('timeout'); return; }
    const question = state.paper.questions.find(item => item.id === id);
    if (!question || !question.options.some(option => option.key === value)) return;
    state.answers[id] = value;
    error('');
    $('q-' + id).querySelectorAll('.option').forEach(label => label.classList.toggle('chosen', label.querySelector('input').value === value));
    renderNavigation(); renderStats(); save();
  }
  function imageMarkup(images, title) {
    return images.map((image, index) => '<figure class="source-figure"><button type="button" class="image-open" data-image="' + esc(image.src) + '" aria-label="放大' + esc(title) + '原题第' + (index + 1) + '张图片"><img class="source-image" src="' + esc(image.src) + '" alt="' + esc(image.alt) + '" loading="eager" decoding="async"></button><figcaption><span>' + esc(title) + (images.length > 1 ? ' · 图' + (index + 1) + '/' + images.length : '') + '</span><span>点击原图放大</span></figcaption><p class="image-error" hidden>原题图片未加载。<button type="button" class="retry-image">重新加载图片</button></p></figure>').join('');
  }
  function questionMarkup(question, group) {
    const choice = state.answers[question.id];
    const typeLabel = question.options.length === 2 && question.options.some(option => option.text === '正确') && question.options.some(option => option.text === '错误') ? '判断' : '单选';
    const onlyLetters = question.options.every(option => !option.text || option.text === option.key);
    const reference = group.title + (question.number ? ' · 原题号 ' + question.number : '');
    const prompt = question.prompt || (group.questions.length > 1 ? '请选择本小题答案' : '请根据原题图片选择答案');
    let html = '<div class="q" id="q-' + esc(question.id) + '" role="group" aria-labelledby="stem-' + esc(question.id) + '"><div class="stem" id="stem-' + esc(question.id) + '"><span class="qno">' + question.no + '</span> ' + esc(prompt) + '<span class="tag">' + typeLabel + ' · ' + Engine.POINTS + '分</span><span class="source-reference">' + esc(reference) + '</span></div>';
    html += imageMarkup(question.images, reference || question.sectionTitle);
    if (group.questions.length > 1) html += '<a class="group-link" href="#group-' + esc(group.id) + '">↑ 回看本组原题材料与选项</a>';
    html += '<div class="choices' + (onlyLetters ? '' : ' with-text') + '">';
    question.options.forEach(option => {
      const selected = option.key === choice;
      let classes = 'option' + (selected ? ' chosen' : '');
      if (state.submitted && option.key === question.answer) classes += ' correct';
      if (state.submitted && selected && option.key !== question.answer) classes += ' wrong';
      html += '<label class="' + classes + '"><input type="radio" name="question-' + esc(question.id) + '" data-question="' + esc(question.id) + '" value="' + esc(option.key) + '"' + (selected ? ' checked' : '') + (state.submitted ? ' disabled' : '') + '><span><b>' + esc(option.key) + '</b>' + (onlyLetters ? '' : '. ' + esc(option.text)) + '</span></label>';
    });
    html += '</div>';
    if (state.submitted) html += '<div class="answerline">题库答案：<strong>' + esc(answerText(question, question.answer)) + '</strong>　你的答案：' + esc(answerText(question, choice)) + '　得分：' + (choice === question.answer ? Engine.POINTS : 0) + ' / ' + Engine.POINTS + (question.explanation ? '\n' + esc(question.explanation) : '') + '</div>';
    return html + '</div>';
  }
  function answerText(question, key) {
    if (!key) return '未作答';
    const option = question.options.find(item => item.key === key);
    return key + (option && option.text !== key ? '. ' + option.text : '');
  }
  function renderPaper() {
    const paper = state.paper;
    let html = '<div class="paperhead"><h2>' + esc(state.title) + '</h2><p class="candidate-caption">考生：' + esc(candidate.name) + ' · ' + esc(candidate.maskedPhone) + ' · 英语科目组</p><div class="meta">' + (state.mode === 'practice' ? '分项练习' : '自定义模拟') + ' · 共' + paper.questions.length + '小题 · 满分' + paper.max + '分 · ' + state.minutes + '分钟<br>练习计分：每小题2分，答错或未答不得分；材料题整组保留。</div></div><div id="result"></div>';
    const questions = new Map(paper.questions.map(question => [question.id, question]));
    let lastSection = '';
    paper.groups.forEach(group => {
      const section = getSection(group.sectionId);
      if (lastSection !== group.sectionId) {
        html += '<h2 class="sectiontitle">' + esc(section.title) + ' · ' + paper.questions.filter(q => q.sectionId === group.sectionId).length + '小题</h2>';
        lastSection = group.sectionId;
      }
      html += '<section class="group" id="group-' + esc(group.id) + '"><div class="group-header"><h3>' + esc(group.title || section.title) + '</h3><span>' + group.questions.length + '小题 · ' + group.questions.length * Engine.POINTS + '分</span></div>';
      if (group.instructions) html += '<p class="group-instructions">' + esc(group.instructions) + '</p>';
      html += imageMarkup(group.images, group.title || section.title);
      html += group.questions.map(q => questionMarkup(questions.get(q.id), group)).join('') + '</section>';
    });
    $('exam').innerHTML = html;
    bindImageErrors(); renderResult();
  }
  function bindImageErrors() {
    $('exam').querySelectorAll('.source-image').forEach(image => {
      const show = () => { image.closest('figure').querySelector('.image-error').hidden = false; };
      image.addEventListener('error', show);
      image.addEventListener('load', () => { image.closest('figure').querySelector('.image-error').hidden = true; });
      if (image.complete && !image.naturalWidth) show();
    });
  }
  function renderNavigation() {
    if (!state) return;
    const missing = state.paper.questions.filter(q => !answered(q));
    $('nav').innerHTML = state.paper.questions.map(question => {
      const done = answered(question), correct = state.answers[question.id] === question.answer;
      const status = state.submitted ? (correct ? '答对' : done ? '答错' : '未作答') : (done ? '已作答' : '未作答');
      const className = state.submitted ? (correct ? 'right' : done ? 'bad' : 'unanswered') : (done ? 'done' : state.highlightMissing ? 'unanswered' : '');
      const element = $('q-' + question.id);
      if (element) element.classList.toggle('is-unanswered', (state.submitted || state.highlightMissing) && !done);
      return '<button type="button" class="navnum ' + className + '" data-goto="' + esc(question.id) + '" aria-label="第' + question.no + '题：' + status + '" title="第' + question.no + '题：' + status + '">' + question.no + '</button>';
    }).join('');
    $('navHint').textContent = state.submitted ? '绿色：答对；红色：答错或未答。点击题号查看。' : state.highlightMissing ? '红色：检查后仍未答；蓝色：已答。补答后自动去除标红。' : '蓝色：已答。查看未答或尝试交卷后，漏题才会标红。';
    $('missingPanel').hidden = state.submitted || !state.highlightMissing || !missing.length;
    $('missingTitle').textContent = '还有' + missing.length + '小题未答，点击题号继续填写';
    $('missingNums').innerHTML = missing.map(q => '<button type="button" class="navnum unanswered" data-goto="' + esc(q.id) + '">第' + q.no + '题</button>').join('');
  }
  function renderStats() {
    const total = state ? state.paper.questions.length : bank.questions.length;
    const done = state ? state.paper.questions.filter(answered).length : 0;
    const score = state ? state.submitted ? Engine.scorePaper(state.paper, state.answers).score : state.paper.max : '—';
    $('stats').innerHTML = '<div class="stat"><b>' + total + '</b><span>' + (state ? '本卷小题' : '题库小题') + '</span></div><div class="stat"><b>' + done + '</b><span>已作答</span></div><div class="stat"><b>' + (state ? total - done : 0) + '</b><span>未作答</span></div><div class="stat"><b>' + score + '</b><span>' + (state && state.submitted ? '本次得分' : '试卷满分') + '</span></div>';
    $('startBtn').textContent = state ? '重新开始' : '开始练习';
    $('submitBtn').disabled = !state || state.submitted;
    $('missingBtn').disabled = !state || state.submitted;
    $('printBtn').disabled = !state;
    $('downloadBtn').disabled = !state || !state.submitted;
  }
  function goTo(id) { const element = $('q-' + id); if (element) element.scrollIntoView({behavior:'smooth', block:'center'}); }
  function showMissing() {
    if (!authorized() || !state || state.submitted) return;
    if (Date.now() >= state.deadline) { submit('timeout'); return; }
    state.highlightMissing = true;
    renderNavigation(); save();
    const missing = state.paper.questions.filter(q => !answered(q));
    error(missing.length ? '还有' + missing.length + '小题未作答。已标红；补答后可交卷。' : '所有题目均已作答，可以交卷。');
    if (missing.length) goTo(missing[0].id);
  }
  function submit(reason) {
    if (!authorized() || !state || state.submitted) return false;
    if (Date.now() >= state.deadline) reason = 'timeout';
    if (reason === 'manual' && state.paper.questions.some(q => !answered(q))) { showMissing(); return false; }
    if (reason === 'verify' && !TEST_MODE) return false;
    state.submitted = true; state.submitReason = reason;
    state.remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    clearInterval(timerId); error('');
    $('missingPanel').hidden = true;
    renderPaper(); renderNavigation(); renderStats(); tick(); save();
    $('exam').scrollIntoView({behavior:'smooth', block:'start'});
    return true;
  }
  function renderResult() {
    if (!state.submitted || !$('result')) return;
    const result = Engine.scorePaper(state.paper, state.answers);
    const label = state.submitReason === 'timeout' ? '时间到，已自动交卷' : state.submitReason === 'verify' ? '随机答题验证完成（非真实成绩）' : TEST_MODE ? '功能验证模式：已交卷（非真实成绩）' : '本次练习已完成';
    $('result').innerHTML = '<div class="result"><p class="resultlabel">' + label + '</p><div class="resultbig">' + result.score + ' <small>/ ' + result.max + '分</small></div><p>答对' + result.correct + '小题 · 答错' + result.wrong + '小题 · 未答' + result.missing + '小题</p><table class="score-breakdown"><thead><tr><th scope="col">板块</th><th scope="col">小题数</th><th scope="col">得分 / 满分</th></tr></thead><tbody>' + Object.values(result.sections).map(section => '<tr><td>' + esc(section.title) + '</td><td>' + section.count + '</td><td>' + section.score + ' / ' + section.max + '</td></tr>').join('') + '</tbody></table><p class="muted">答案依所提供的题库录入，内容需教师复核。成绩仅保存在当前浏览器，可下载留存。</p></div>';
  }
  function save() {
    if (!state || !candidate || !storageKey) return;
    if (!state.submitted) state.remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    const saved = {version:1, bankSignature:bank.signature, testMode:TEST_MODE, owner:{subject:SUBJECT, name:candidate.name, phone:candidate.phone},
      groupIds:state.paper.groups.map(group => group.id), ids:state.paper.questions.map(q => q.id), answers:state.answers, submitted:state.submitted, submitReason:state.submitReason,
      highlightMissing:state.highlightMissing, minutes:state.minutes, startedAt:state.startedAt, deadline:state.deadline, remaining:state.remaining, title:state.title, mode:state.mode};
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); }
    catch (_) { saveWarning = true; $('saveNote').textContent = '当前浏览器无法保存进度，刷新会丢失作答；请保持本页打开。'; }
  }
  function restore() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const restored = Engine.restoreState(bank, JSON.parse(raw), candidate, TEST_MODE);
      if (!restored) { $('saveNote').textContent = '上次记录与当前题库或考生不匹配，已跳过恢复。可开始新练习。'; return; }
      state = restored;
      $('title').value = state.title; $('minutes').value = state.minutes; $('mode').value = state.mode;
      bank.sections.forEach(section => { $('count-' + section.id).value = state.counts[section.id]; });
      if (state.mode === 'practice') {
        const sectionId = Object.keys(state.counts).find(id => state.counts[id] > 0);
        $('practiceSection').value = sectionId; $('practiceCount').value = state.counts[sectionId];
      }
      practiceChanged(false); renderPaper(); renderNavigation(); renderStats();
      $('saveNote').textContent = state.submitted ? '已恢复当前考生的上次英语练习结果。' : '已恢复当前考生的英语作答进度。离开页面期间仍在计时。';
      if (state.submitted) tick(); else startTimer();
    } catch (_) { $('saveNote').textContent = '上次记录无法恢复，可重新开始英语练习。'; }
  }
  function randomVerify() {
    if (!authorized() || !TEST_MODE) return;
    if (state && !confirm('将随机填写所有题目并交卷；已交卷时会重新抽题。此操作仅用于功能验证，继续吗？')) return;
    if ((!state || state.submitted) && !startExam(true)) return;
    if (Date.now() >= state.deadline) { submit('timeout'); return; }
    state.paper.questions.forEach(q => { state.answers[q.id] = q.options[Math.floor(Math.random() * q.options.length)].key; });
    submit('verify');
  }
  function download() {
    if (!authorized() || !state || !state.submitted) return;
    const score = Engine.scorePaper(state.paper, state.answers);
    const groups = new Map(state.paper.groups.map(group => [group.id, group]));
    const content = ['宁跃教育 · 英语练习成绩单', state.title, '考生：' + candidate.name, '手机号：' + candidate.maskedPhone, '科目：英语科目组', '分数：' + score.score + ' / ' + score.max,
      '模式：' + (TEST_MODE ? '功能验证（非真实成绩）' : '普通练习'), '练习计分：每小题2分；答错或未答不得分。',
      '交卷方式：' + (state.submitReason === 'timeout' ? '时间到自动交卷' : state.submitReason === 'verify' ? '随机答题验证' : '手动交卷'),
      '答对：' + score.correct + '；答错：' + score.wrong + '；未答：' + score.missing, '成绩由当前浏览器生成。', '',
      ...Object.values(score.sections).map(section => section.title + '：' + section.score + ' / ' + section.max + '分'), '',
      ...state.paper.questions.map(q => q.no + '. [' + q.sectionTitle + '] ' + groups.get(q.groupId).title + (q.number ? ' / 原题号' + q.number : '') + '\n' + q.prompt + '\n你的答案：' + answerText(q, state.answers[q.id]) + '；题库答案：' + answerText(q, q.answer) + '；得分：' + (state.answers[q.id] === q.answer ? Engine.POINTS : 0) + '/' + Engine.POINTS + '\n')].join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + content], {type:'text/plain;charset=utf-8'}));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = '宁跃教育_英语科目组_练习成绩.txt';
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function printPaper() {
    if (!authorized() || !state) return;
    const button = $('printBtn'); button.disabled = true; button.textContent = '检查图片…';
    try {
      const images = [...$('exam').querySelectorAll('.source-image')];
      await Promise.all(images.map(image => image.complete ? Promise.resolve() : new Promise(resolve => {
        const timeout = setTimeout(finish, 10000);
        function finish() { clearTimeout(timeout); image.removeEventListener('load', finish); image.removeEventListener('error', finish); resolve(); }
        image.addEventListener('load', finish); image.addEventListener('error', finish);
      })));
      if (!authorized()) return;
      if (images.some(image => !image.complete || !image.naturalWidth)) { error('仍有原题图片未加载，先点击图片下方“重新加载图片”，再打印。'); return; }
      window.print();
    } finally { button.disabled = !state; button.textContent = '打印试卷'; }
  }
  function bindEvents() {
    $('mode').addEventListener('change', updateSettings);
    $('practiceSection').addEventListener('change', () => practiceChanged(true));
    $('practiceCount').addEventListener('input', updateSettings);
    $('sectionCounts').addEventListener('input', updateSettings);
    $('allPracticeBtn').addEventListener('click', () => { $('practiceCount').value = getSection($('practiceSection').value).questionCount; updateSettings(); });
    $('startBtn').addEventListener('click', () => startExam(false));
    $('submitBtn').addEventListener('click', () => submit('manual'));
    $('missingBtn').addEventListener('click', showMissing);
    $('verifyBtn').addEventListener('click', randomVerify);
    $('downloadBtn').addEventListener('click', download);
    $('printBtn').addEventListener('click', printPaper);
    document.addEventListener('click', event => {
      const jump = event.target.closest('[data-goto]'); if (jump && authorized()) goTo(jump.dataset.goto);
      const section = event.target.closest('[data-section]');
      if (section && authorized()) { $('mode').value = 'practice'; $('practiceSection').value = section.dataset.section; practiceChanged(true); document.querySelector('.ny-settings-disclosure').open = true; $('practiceCount').focus(); }
      if (event.target.closest('#readyStartBtn')) startExam(false);
      const image = event.target.closest('[data-image]');
      if (image && authorized()) { $('enlargedImage').src = image.dataset.image; $('enlargedImage').alt = image.querySelector('img').alt; $('imageDialog').showModal(); }
      const retry = event.target.closest('.retry-image');
      if (retry && authorized()) { const img = retry.closest('figure').querySelector('img'); const src = new URL(img.src); src.searchParams.set('retry', Date.now()); img.src = src.href; }
    });
    $('exam').addEventListener('change', event => { if (event.target.matches('input[data-question]')) answer(event.target.dataset.question, event.target.value); });
    $('closeImageBtn').addEventListener('click', () => $('imageDialog').close());
    $('imageDialog').addEventListener('click', event => { if (event.target === $('imageDialog')) $('imageDialog').close(); });
    $('logoutBtn').addEventListener('click', () => {
      if (state && !state.submitted && !confirm('退出后仍继续计时。当前进度保留，重新验证同一考生可继续。确定退出英语科目？')) return;
      if (authorized()) save();
      clearInterval(timerId); ExamAccess.logout(SUBJECT); location.replace(ExamAccess.loginUrl(SUBJECT, TEST_MODE));
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else if (state && !state.submitted) tick(); else authorized(); });
    window.addEventListener('pagehide', save);
    window.addEventListener('pageshow', event => { if (event.persisted && candidate) { if (authorized() && state && !state.submitted) startTimer(); } });
  }
  async function initialize() {
    if (!window.ExamAccess) {
      document.documentElement.dataset.accessState = 'blocked'; $('accessGate').setAttribute('aria-busy','false');
      $('accessMessage').textContent = '名单验证脚本未加载，请检查同目录的 access.js。'; return;
    }
    candidate = await ExamAccess.initializeExam(SUBJECT);
    if (!candidate) return;
    try {
      if (!Engine) throw new Error('英语练习脚本未加载，请检查 english-exam-core.js。');
      bank = Engine.validateBank(window.ENGLISH_BANK);
      storageKey = ExamAccess.progressKey(SUBJECT, candidate, TEST_MODE);
      $('candidateInfo').textContent = candidate.name + ' · ' + candidate.maskedPhone;
      setupSettings(); bindEvents(); renderStats(); restore();
      if (authorized()) document.documentElement.dataset.accessState = 'allowed';
    } catch (problem) { ExamAccess.blockExam(SUBJECT, problem.message || '英语题库初始化失败，请刷新重试。'); }
  }
  initialize();
})();
