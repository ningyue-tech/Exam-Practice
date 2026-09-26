/* 只负责品牌文字及页面导航，不改变名单、组卷和评分逻辑。无外部依赖。 */
(function(){
  'use strict';
  const b=window.NINGYUE_BRAND||{};
  function apply(){
    document.querySelectorAll('[data-brand]').forEach(el=>{const key=el.dataset.brand;if(typeof b[key]==='string')el.textContent=b[key];});
    document.querySelectorAll('[data-year]').forEach(el=>el.textContent=b.copyrightYear||String(new Date().getFullYear()));
    document.querySelectorAll('[data-brand-logo]').forEach(el=>el.alt=(b.name||'宁跃教育')+'标志');
    if(window.matchMedia('(max-width: 900px)').matches)document.querySelectorAll('.ny-settings-disclosure').forEach(el=>el.open=false);
    const fields=[['contactPhone','电话'],['contactEmail','邮箱'],['contactAddress','地址']];
    document.querySelectorAll('[data-contact-list]').forEach(box=>{box.replaceChildren();fields.forEach(([key,label])=>{const value=String(b[key]||'').trim();if(!value)return;const line=document.createElement('p');line.textContent=label+'：'+value;box.appendChild(line);});});
    document.querySelectorAll('[data-scroll-top]').forEach(el=>el.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'})));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
