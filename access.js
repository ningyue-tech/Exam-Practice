/*
 * 双科目独立名单：纯浏览器入口校验，不是安全认证。
 * 不发送短信；名单及题库可被下载，前端校验可被绕过。
 * 预设人员只改同目录 whitelist.js。无第三方依赖。
 */
(function () {
  'use strict';
  const SUBJECTS = Object.freeze({auto: '汽车维修', marketing: '商务营销'});
  const FILES = Object.freeze({auto: 'auto-exam.html', marketing: 'marketing-exam.html'});
  const base = new URL('./', document.currentScript.src);
  const prefix = 'exam-practice-whitelist-v1:' + encodeURIComponent(base.pathname) + ':';
  let config = null, loading = null;
  const validSubject = s => typeof s === 'string' && Object.hasOwn(SUBJECTS, s);
  const normalizeName = s => String(s ?? '').normalize('NFKC').trim();
  function normalizePhone(s) {
    let p = String(s ?? '').normalize('NFKC').trim().replace(/[\s-]/g, '');
    if(p.startsWith('+86')) p=p.slice(3);
    else if(p.startsWith('0086')) p=p.slice(4);
    else if(/^86\d{11}$/.test(p)) p=p.slice(2);
    return p;
  }
  const phoneValid = p => /^1[3-9]\d{9}$/.test(p);
  const maskPhone = p => p.slice(0,3) + '****' + p.slice(-4);
  const storageKey = s => prefix + 'session:' + s;
  function validate(raw) {
    if(!raw || typeof raw !== 'object') throw new Error('名单文件未正确加载，请检查 whitelist.js。');
    const hours = raw.sessionHours === undefined ? 12 : raw.sessionHours;
    if(typeof hours !== 'number' || !Number.isFinite(hours) || hours <= 0 || hours > 168)
      throw new Error('whitelist.js 的 sessionHours 应为大于0且不超过168的数字。');
    const result={sessionHours:hours};
    for(const s of Object.keys(SUBJECTS)) {
      if(!Array.isArray(raw[s])) throw new Error('whitelist.js 缺少 '+s+' 名单数组。');
      const seen = new Set();
      result[s]=raw[s].map((r,i) => {
        if(!r || typeof r.name !== 'string' || typeof r.phone !== 'string')
          throw new Error(SUBJECTS[s]+'名单第'+(i+1)+'条：姓名和手机号须为字符串。');
        const name=normalizeName(r.name), phone=normalizePhone(r.phone);
        if(!name || name.length>80 || !phoneValid(phone))
          throw new Error(SUBJECTS[s]+'名单第'+(i+1)+'条：请检查姓名及11位大陆手机号。');
        if(r.enabled !== undefined && typeof r.enabled !== 'boolean')
          throw new Error(SUBJECTS[s]+'名单第'+(i+1)+'条：enabled 只能为 true 或 false。');
        const pair=JSON.stringify([name,phone]);
        if(seen.has(pair)) throw new Error(SUBJECTS[s]+'名单中有重复姓名与手机号，请保留一条。');
        seen.add(pair);
        return Object.freeze({name,phone,enabled:r.enabled!==false});
      });
    }
    return result;
  }
  function ready() {
    if(loading) return loading;
    loading=new Promise((resolve,reject) => {
      const script=document.createElement('script');
      // 每次打开页面使用新参数，减少更新单一名单文件后的旧缓存影响。
      const url=new URL('whitelist.js',base);url.searchParams.set('_t',String(Date.now()));
      script.src=url.href;script.async=true;
      let finished=false;
      const fail=message=>{if(finished)return;finished=true;clearTimeout(timeout);reject(new Error(message));};
      const timeout=setTimeout(()=>fail('加载名单超时。请刷新页面，或联系管理员检查 whitelist.js。'),15000);
      script.onerror=()=>fail('找不到名单文件。请将 whitelist.js 与网页放在同一目录。');
      script.onload=()=>{
        if(finished)return;
        try{config=validate(window.EXAM_WHITELISTS);finished=true;clearTimeout(timeout);resolve(config);}
        catch(e){fail(e.message);}
      };
      document.head.appendChild(script);
    });
    return loading;
  }
  function find(s,name,phone) {
    if(!config || !validSubject(s))return null;
    return config[s].find(r=>r.enabled && r.name===name && r.phone===phone)||null;
  }
  function clear(s) {try{sessionStorage.removeItem(storageKey(s));}catch(_){} }
  function session(s) {
    if(!validSubject(s) || !config)return null;
    try {
      const raw=sessionStorage.getItem(storageKey(s));if(!raw)return null;
      const d=JSON.parse(raw),now=Date.now();
      if(d.version!==1 || d.subject!==s || typeof d.name!=='string' || typeof d.phone!=='string'
        || !Number.isFinite(d.issuedAt) || !Number.isFinite(d.expiresAt) || d.issuedAt>now
        || d.expiresAt<=now || now-d.issuedAt>=config.sessionHours*3600000
        || d.expiresAt-d.issuedAt>config.sessionHours*3600000 || !find(s,d.name,d.phone)) {
        clear(s);return null;
      }
      return {subject:s,name:d.name,phone:d.phone,maskedPhone:maskPhone(d.phone),expiresAt:d.expiresAt};
    } catch(_) {clear(s);return null;}
  }
  async function login(s,rawName,rawPhone) {
    await ready();
    if(!validSubject(s))throw new Error('请选择有效的考试科目。');
    const name=normalizeName(rawName),phone=normalizePhone(rawPhone);
    if(!name)throw new Error('请输入姓名。');
    if(!phoneValid(phone))throw new Error('请输入有效的11位大陆手机号，可带 +86 前缀。');
    const r=find(s,name,phone);
    if(!r)throw new Error('姓名和手机号未匹配本科目的有效名单，请核对所选科目或联系管理员。');
    const now=Date.now();
    const d={version:1,subject:s,name:r.name,phone:r.phone,issuedAt:now,expiresAt:now+config.sessionHours*3600000};
    try{sessionStorage.setItem(storageKey(s),JSON.stringify(d));}
    catch(_){throw new Error('浏览器禁止保存本地验证状态。请允许网站存储后重试；本地文件可改用本地服务器打开。');}
    return session(s);
  }
  function logout(s) {
    if(validSubject(s)) clear(s);else Object.keys(SUBJECTS).forEach(clear);
  }
  function examUrl(s,test=false) {
    if(!validSubject(s))throw new Error('无效科目');
    const u=new URL(FILES[s],base);if(test)u.searchParams.set('test','1');return u.href;
  }
  function loginUrl(s,test=false) {
    const u=new URL('login.html',base);if(validSubject(s))u.searchParams.set('subject',s);
    if(test)u.searchParams.set('test','1');return u.href;
  }
  function progressKey(s,person,test=false) {
    if(!validSubject(s) || !person || person.subject!==s)throw new Error('名单验证尚未通过。');
    // 不继承旧匿名版记录。姓名、手机号、科目和验证模式分别隔离。
    return prefix+'progress:'+s+':'+encodeURIComponent(JSON.stringify([person.name,person.phone]))+(test?':verification':':practice');
  }
  function samePerson(a,b) {return !!a && !!b && a.subject===b.subject && a.name===b.name && a.phone===b.phone;}
  function blockExam(s,message) {
    document.documentElement.dataset.accessState='blocked';
    const gate=document.getElementById('accessGate');
    if(!gate)return;
    const m=document.getElementById('accessMessage');if(m)m.textContent=message||'请先完成本科目的姓名与手机号名单验证。';
    const a=document.getElementById('accessLogin');
    if(a)a.href=loginUrl(s,new URLSearchParams(location.search).get('test')==='1');
    gate.setAttribute('aria-busy','false');
  }
  async function initializeExam(s) {
    try{
      await ready();const p=session(s);
      if(!p){blockExam(s,'请先完成'+(SUBJECTS[s]||'所选科目')+'名单验证；另一科的验证状态不能代替本科目。');return null;}
      return p;
    }catch(e){blockExam(s,e.message);return null;}
  }
  window.ExamAccess=Object.freeze({subjects:SUBJECTS,ready,normalizeName,normalizePhone,maskPhone,session,login,logout,
    examUrl,loginUrl,progressKey,samePerson,blockExam,initializeExam});
})();
