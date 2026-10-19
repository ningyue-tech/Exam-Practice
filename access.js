/*
 * 分科目独立名单：纯浏览器入口校验，不是安全认证。
 * 名单仅发布带随机盐的慢哈希，不发布姓名和手机号。
 * 校验值仍可被离线猜测，前端入口可被绕过；不替代服务端认证。
 */
(function () {
  'use strict';
  const SUBJECTS = Object.freeze({auto: '汽车科目组', marketing: '市场营销科目组', english: '英语'});
  const FILES = Object.freeze({auto: 'auto-exam.html', marketing: 'marketing-exam.html', english: 'english-exam.html'});
  const base = new URL('./', document.currentScript.src);
  const prefix = 'exam-practice-whitelist-v1:' + encodeURIComponent(base.pathname) + ':';
  let config = null, loading = null;
  const verified = new Map(), generations = new Map();
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
    if(raw.version!==2 || raw.algorithm!=='PBKDF2-SHA-256' || raw.iterations!==600000)
      throw new Error('名单格式已升级，请使用本地名单工具生成新版 whitelist.js，并刷新页面。');
    const hours = raw.sessionHours === undefined ? 12 : raw.sessionHours;
    if(typeof hours !== 'number' || !Number.isFinite(hours) || hours <= 0 || hours > 168)
      throw new Error('whitelist.js 的 sessionHours 应为大于0且不超过168的数字。');
    const result={sessionHours:hours,iterations:raw.iterations};
    const salts=new Set();
    for(const s of Object.keys(SUBJECTS)) {
      // 旧版名单没有英语数组时，仅关闭英语授权，不影响原有两科。
      const rows=s==='english' && raw[s]===undefined ? [] : raw[s];
      if(!Array.isArray(rows)) throw new Error('whitelist.js 缺少 '+s+' 名单数组。');
      result[s]=rows.map((r,i) => {
        if(!r || Object.keys(r).some(k=>!['salt','hash','enabled'].includes(k))
          || typeof r.salt!=='string' || !/^[a-f0-9]{32}$/.test(r.salt)
          || typeof r.hash!=='string' || !/^[a-f0-9]{64}$/.test(r.hash))
          throw new Error(SUBJECTS[s]+'名单第'+(i+1)+'条：需要有效的盐和校验值，不能填写明文姓名或手机号。');
        if(r.enabled !== undefined && typeof r.enabled !== 'boolean')
          throw new Error(SUBJECTS[s]+'名单第'+(i+1)+'条：enabled 只能为 true 或 false。');
        if(salts.has(r.salt)) throw new Error('名单中存在重复盐，请重新生成。');
        salts.add(r.salt);
        return Object.freeze({salt:r.salt,hash:r.hash,enabled:r.enabled!==false});
      });
      Object.freeze(result[s]);
    }
    return Object.freeze(result);
  }
  async function find(s,name,phone) {
    if(!config || !validSubject(s))return null;
    const rows=config[s].filter(r=>r.enabled);
    if(!rows.length)return null;
    const subtle=window.crypto.subtle;
    const key=await subtle.importKey('raw',new TextEncoder().encode(JSON.stringify(['exam-whitelist-v2',s,name,phone])), 'PBKDF2',false,['deriveBits']);
    // Bound concurrency; only login/initial restoration performs expensive derivation.
    for(let i=0;i<rows.length;i+=4) {
      const batch=rows.slice(i,i+4);
      const matches=await Promise.all(batch.map(async row=>{
        const salt=Uint8Array.from(row.salt.match(/../g),byte=>parseInt(byte,16));
        const bits=await subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:config.iterations},key,256);
        const hash=Array.from(new Uint8Array(bits),byte=>byte.toString(16).padStart(2,'0')).join('');
        return hash===row.hash?row:null;
      }));
      const match=matches.find(Boolean);if(match)return match;
    }
    return null;
  }
  function validSession(s,d) {
    const now=Date.now();
    return d && d.version===1 && d.subject===s && typeof d.name==='string' && !!d.name && d.name.length<=80
      && d.name===normalizeName(d.name) && typeof d.phone==='string' && phoneValid(d.phone)
      && Number.isFinite(d.issuedAt) && Number.isFinite(d.expiresAt) && d.issuedAt<=now && d.expiresAt>now
      && d.expiresAt>d.issuedAt && now-d.issuedAt<config.sessionHours*3600000
      && d.expiresAt-d.issuedAt<=config.sessionHours*3600000;
  }
  async function restoreSessions() {
    await Promise.all(Object.keys(SUBJECTS).map(async s=>{
      let raw,d;
      try {raw=sessionStorage.getItem(storageKey(s));if(!raw)return;d=JSON.parse(raw);}
      catch(_){clear(s,false);return;}
      if(!validSession(s,d)){clear(s,false);return;}
      const generation=generations.get(s)||0;
      const member=await find(s,d.name,d.phone);
      try {
        if((generations.get(s)||0)!==generation || sessionStorage.getItem(storageKey(s))!==raw)return;
        if(member && validSession(s,d))verified.set(s,{raw,member});else clear(s,false);
      }catch(_){clear(s,false);}
    }));
  }
  function ready() {
    if(loading) return loading;
    loading=new Promise((resolve,reject) => {
      if(!window.crypto || !window.crypto.subtle || typeof TextEncoder==='undefined') {
        reject(new Error('当前浏览器无法进行名单校验，请使用新版浏览器通过 HTTPS 或 localhost 打开。'));return;
      }
      const script=document.createElement('script');
      // 每次打开页面使用新参数，减少更新单一名单文件后的旧缓存影响。
      const url=new URL('whitelist.js',base);url.searchParams.set('_t',String(Date.now()));
      script.src=url.href;script.async=true;
      let finished=false;
      const fail=message=>{if(finished)return;finished=true;clearTimeout(timeout);reject(new Error(message));};
      const timeout=setTimeout(()=>fail('加载名单超时。请刷新页面，或联系管理员检查 whitelist.js。'),15000);
      script.onerror=()=>fail('找不到名单文件。请将 whitelist.js 与网页放在同一目录。');
      script.onload=async ()=>{
        if(finished)return;
        finished=true;clearTimeout(timeout);
        try{config=validate(window.EXAM_WHITELISTS);await restoreSessions();resolve(config);}
        catch(e){config=null;verified.clear();reject(e);}
      };
      document.head.appendChild(script);
    });
    return loading;
  }
  function clear(s,cancel=true) {
    verified.delete(s);
    if(cancel)generations.set(s,(generations.get(s)||0)+1);
    try{sessionStorage.removeItem(storageKey(s));}catch(_){}
  }
  function session(s) {
    if(!validSubject(s) || !config)return null;
    try {
      const raw=sessionStorage.getItem(storageKey(s));if(!raw)return null;
      const d=JSON.parse(raw),proof=verified.get(s);
      if(!validSession(s,d) || !proof || proof.raw!==raw || !config[s].includes(proof.member) || !proof.member.enabled) {
        clear(s);return null;
      }
      return {subject:s,name:d.name,phone:d.phone,maskedPhone:maskPhone(d.phone),expiresAt:d.expiresAt};
    } catch(_) {clear(s);return null;}
  }
  async function login(s,rawName,rawPhone) {
    if(!validSubject(s))throw new Error('请选择有效的考试科目。');
    const generation=(generations.get(s)||0)+1;generations.set(s,generation);
    await ready();
    if(generations.get(s)!==generation)throw new Error('本次验证已取消，请重新验证。');
    const name=normalizeName(rawName),phone=normalizePhone(rawPhone);
    if(!name || name.length>80)throw new Error('请输入有效姓名。');
    if(!phoneValid(phone))throw new Error('请输入有效的11位大陆手机号，可带 +86 前缀。');
    const r=await find(s,name,phone);
    if(generations.get(s)!==generation)throw new Error('本次验证已取消，请重新验证。');
    if(!r)throw new Error('姓名和手机号未匹配本科目的有效名单，请核对所选科目或联系管理员。');
    const now=Date.now();
    const d={version:1,subject:s,name,phone,issuedAt:now,expiresAt:now+config.sessionHours*3600000};
    try{const raw=JSON.stringify(d);sessionStorage.setItem(storageKey(s),raw);verified.set(s,{raw,member:r});}
    catch(_){throw new Error('浏览器禁止保存本地验证状态。请允许网站存储后重试；本地文件可改用本地服务器打开。');}
    return session(s);
  }
  function logout(s) {
    if(validSubject(s)) clear(s);else Object.keys(SUBJECTS).forEach(subject=>clear(subject));
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
      if(!p){blockExam(s,'请先完成'+(SUBJECTS[s]||'所选科目')+'名单验证；其他科目的验证状态不能代替本科目。');return null;}
      return p;
    }catch(e){blockExam(s,e.message);return null;}
  }
  window.ExamAccess=Object.freeze({subjects:SUBJECTS,ready,normalizeName,normalizePhone,maskPhone,session,login,logout,
    examUrl,loginUrl,progressKey,samePerson,blockExam,initializeExam});
})();
