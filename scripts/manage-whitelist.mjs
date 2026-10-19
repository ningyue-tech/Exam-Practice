// Local maintenance only. Never pass names or phone numbers in command arguments.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.join(root,'whitelist.js');
const subjects=['auto','marketing','english'];
const iterations=600000;
const normalizeName=value=>String(value??'').normalize('NFKC').trim();
function normalizePhone(value) {
  let p=String(value??'').normalize('NFKC').trim().replace(/[\s-]/g,'');
  if(p.startsWith('+86'))p=p.slice(3);
  else if(p.startsWith('0086'))p=p.slice(4);
  else if(/^86\d{11}$/.test(p))p=p.slice(2);
  return p;
}
function identity(name,phone) {
  name=normalizeName(name);phone=normalizePhone(phone);
  if(!name || name.length>80 || !/^1[3-9]\d{9}$/.test(phone))throw new Error('请核对姓名和11位大陆手机号。');
  return {name,phone};
}
function hash(subject,person,salt) {
  return pbkdf2Sync(JSON.stringify(['exam-whitelist-v2',subject,person.name,person.phone]),Buffer.from(salt,'hex'),iterations,32,'sha256').toString('hex');
}
function record(subject,person,enabled=true) {
  const salt=randomBytes(16).toString('hex');
  return {salt,hash:hash(subject,person,salt),enabled};
}
function load() {
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(target,'utf8'),context,{timeout:1000});
  return JSON.parse(JSON.stringify(context.window.EXAM_WHITELISTS));
}
function validate(config) {
  if(config.version!==2 || config.algorithm!=='PBKDF2-SHA-256' || config.iterations!==iterations)
    throw new Error('名单格式不正确；迁移旧名单请执行 migrate。');
  if(!Number.isFinite(config.sessionHours) || config.sessionHours<=0 || config.sessionHours>168)throw new Error('无效会话时长。');
  const salts=new Set();
  for(const s of subjects) {
    if(!Array.isArray(config[s]))throw new Error('缺少科目数组：'+s);
    for(const row of config[s]) {
      if(!row || Object.keys(row).some(k=>!['salt','hash','enabled'].includes(k)) || typeof row.salt!=='string' || !/^[a-f0-9]{32}$/.test(row.salt)
        || typeof row.hash!=='string' || !/^[a-f0-9]{64}$/.test(row.hash) || typeof row.enabled!=='boolean' || salts.has(row.salt))throw new Error('无效或重复名单记录：'+s);
      salts.add(row.salt);
    }
  }
}
function write(config) {
  validate(config);
  const header='/**\n * 仅含名单校验值，不含明文姓名、手机号。\n * 使用 node scripts/manage-whitelist.mjs 维护，勿手工加入个人资料。\n * 每条记录随机盐 + PBKDF2-SHA-256（600000次）。\n * 校验值仍可能被离线猜测；纯前端入口不能替代服务端认证。\n */\n';
  const output=header+'window.EXAM_WHITELISTS = '+JSON.stringify(config,null,2)+';\n';
  // The temporary file contains hashes only. No plaintext backup is produced.
  const temporary=target+'.tmp';
  fs.writeFileSync(temporary,output,{mode:0o644});
  fs.renameSync(temporary,target);
  console.log(JSON.stringify({updated:true,counts:Object.fromEntries(subjects.map(s=>[s,config[s].length]))}));
}
async function main() {
  const [action,subject,...extra]=process.argv.slice(2);
  if(!['migrate','add','disable','enable'].includes(action) || extra.length || (action==='migrate'?subject:!subjects.includes(subject))) {
    console.log('用法：node scripts/manage-whitelist.mjs migrate\n      node scripts/manage-whitelist.mjs add|disable|enable auto|marketing|english\n姓名和手机号由本地交互输入，不要写进命令参数。');
    process.exitCode=1;return;
  }
  const config=load();
  if(action==='migrate') {
    if(config.version===2)throw new Error('当前名单已经是哈希格式，无需再次迁移。');
    const output={version:2,algorithm:'PBKDF2-SHA-256',iterations,sessionHours:config.sessionHours??12};
    for(const s of subjects) {
      const rows=config[s]??(s==='english'?[]:null);
      if(!Array.isArray(rows))throw new Error('缺少旧科目名单：'+s);
      const seen=new Set();
      output[s]=rows.map(row=>{
        if(typeof row?.name!=='string' || typeof row.phone!=='string' || (row.enabled!==undefined&&typeof row.enabled!=='boolean'))throw new Error('旧名单记录格式无效：'+s);
        const person=identity(row.name,row.phone),key=JSON.stringify(person);
        if(seen.has(key))throw new Error('旧名单存在重复身份：'+s);seen.add(key);
        return record(s,person,row.enabled!==false);
      });
    }
    write(output);return;
  }
  validate(config);
  const rl=createInterface({input:process.stdin,output:process.stdout});
  let person;
  try{person=identity(await rl.question('姓名：'),await rl.question('手机号：'));}finally{rl.close();}
  const existing=config[subject].find(row=>timingSafeEqual(Buffer.from(row.hash,'hex'),Buffer.from(hash(subject,person,row.salt),'hex')));
  if(action==='add') {
    if(existing)throw new Error('该考生已存在；停用记录请使用 enable 恢复。');
    config[subject].push(record(subject,person));
  }else{
    if(!existing)throw new Error('该科目没有匹配的考生。');
    existing.enabled=action==='enable';
  }
  write(config);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
