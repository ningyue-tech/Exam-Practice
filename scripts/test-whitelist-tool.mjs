import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'whitelist-tool-test-'));
const read=()=>{const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(directory,'whitelist.js'),'utf8'),c);return c.window.EXAM_WHITELISTS;};
async function invoke(action,subject) {
  return new Promise((resolve,reject)=>{
    const p=spawn(process.execPath,[path.join(directory,'scripts/manage-whitelist.mjs'),action,subject]);
    let output='',nameSent=false,phoneSent=false;
    const timer=setTimeout(()=>{p.kill();reject(new Error('Tool timed out'));},15000);
    p.stdout.on('data',chunk=>{
      output+=chunk;
      if(!nameSent&&output.includes('姓名：')){nameSent=true;p.stdin.write(' 新增测试 \n');}
      if(!phoneSent&&output.includes('手机号：')){phoneSent=true;p.stdin.write('+86 138 0000 0006\n');}
    });
    p.on('error',e=>{clearTimeout(timer);reject(e);});
    p.on('close',code=>{clearTimeout(timer);resolve(code);});
  });
}
try {
  fs.mkdirSync(path.join(directory,'scripts'));
  fs.copyFileSync(path.join(root,'scripts/manage-whitelist.mjs'),path.join(directory,'scripts/manage-whitelist.mjs'));
  fs.writeFileSync(path.join(directory,'whitelist.js'),'window.EXAM_WHITELISTS = '+JSON.stringify({sessionHours:12,auto:[{name:'原测试',phone:'13800000001',enabled:false}],marketing:[],english:[]})+';');
  execFileSync(process.execPath,[path.join(directory,'scripts/manage-whitelist.mjs'),'migrate']);
  const first=JSON.stringify(read());assert.equal(read().auto[0].enabled,false);
  assert.throws(()=>execFileSync(process.execPath,[path.join(directory,'scripts/manage-whitelist.mjs'),'migrate'],{stdio:'pipe'}));
  assert.equal(JSON.stringify(read()),first);
  assert.equal(await invoke('add','auto'),0);assert.equal(read().auto.length,2);
  const added=JSON.stringify(read());
  assert.equal(await invoke('add','auto'),1);assert.equal(JSON.stringify(read()),added);
  assert.equal(await invoke('disable','auto'),0);assert.equal(read().auto[1].enabled,false);
  assert.equal(await invoke('enable','auto'),0);assert.equal(read().auto[1].enabled,true);
  assert.equal(await invoke('disable','marketing'),1);assert.equal(read().marketing.length,0);
  const text=fs.readFileSync(path.join(directory,'whitelist.js'),'utf8');
  assert.ok(!text.includes('新增测试')&&!text.includes('原测试')&&!text.includes('13800000001')&&!text.includes('13800000006'));
  assert.deepEqual(fs.readdirSync(directory).sort(),['scripts','whitelist.js']);
  console.log('Whitelist maintenance: migration, add, duplicate, disable, enable and no plaintext output passed.');
} finally {fs.rmSync(directory,{recursive:true,force:true});}
