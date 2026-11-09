'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
function workspace(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wechat-launch-kit-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
function example(kind='minigame'){return JSON.parse(fs.readFileSync(path.join(root,'examples',kind+'.json'),'utf8'));}
function save(dir,value,name='manifest.json'){const file=path.join(dir,name);fs.writeFileSync(file,JSON.stringify(value));return file;}
function cli(...args){return cp.spawnSync(process.execPath,[path.join(root,'bin/wechat-launch-kit.cjs'),...args],{encoding:'utf8'});}
module.exports={root,workspace,example,save,cli};
