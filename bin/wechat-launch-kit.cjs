#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const core=require('../lib/core.js');
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2),command=args.shift();
function option(name,fallback){const i=args.indexOf(name);if(i<0)return fallback;if(!args[i+1]||args[i+1].startsWith('--'))throw Error(`${name} 缺少参数`);const v=args[i+1];args.splice(i,2);return v;}
function flag(name){const i=args.indexOf(name);if(i<0)return false;args.splice(i,1);return true;}
function json(file){if(!file)throw Error('缺少 manifest 文件路径');return JSON.parse(fs.readFileSync(file,'utf8'));}
function output(value){console.log(JSON.stringify(value,null,2));}
function checkArgs(count){if(args.length!==count||args.some(a=>a.startsWith('--')))throw Error('未知参数；运行 --help 查看用法');}
function printCheck(result){for(const x of result.errors)console.error(`ERROR ${x.path}: ${x.message}`);for(const x of result.warnings)console.log(`WARN  ${x.path}: ${x.message}`);console.log(`文字与结构：${result.errors.length} 错误，${result.warnings.length} 提醒。未验证截图、后台状态或平台接受结果。`);}
try {
  if(!command||command==='--help'||command==='help') {
    console.log(`wechat-launch-kit — 本地提审资料工具（Node 22+）

init <manifest.json> [--kind minigame|miniprogram]
validate <manifest.json> [--json] [--strict]
generate <manifest.json> --out <新目录> [--draft] [--force]
check-screenshots <manifest.json> [--python <解释器>] [--json]
audit-source <源码目录> --out <audit.json>

generate 默认拒绝有错误的清单；--draft 允许不完整文字并明显标注。
validate 不读取截图；--strict 将待核对提醒也视为失败。
截图路径相对于 manifest，Python 检查依赖 requirements.txt 的 Pillow。
audit-source 只读源码，输出候选调用与文件摘要；不能代替人工隐私审计。
工具不会登录、上传、保存后台、提交审核或发布。`);
  } else if(command==='init') {
    const kind=option('--kind','minigame');checkArgs(1);
    if(!['minigame','miniprogram'].includes(kind))throw Error('kind 只能是 minigame 或 miniprogram');
    fs.mkdirSync(path.dirname(path.resolve(args[0])),{recursive:true});
    fs.writeFileSync(args[0],JSON.stringify(core.template(kind),null,2)+'\n',{flag:'wx'});
    console.log(`已创建草稿 ${args[0]}。先填写真实资料，再 validate。`);
  } else if(command==='validate') {
    const asJson=flag('--json'),strict=flag('--strict');checkArgs(1);
    const result=core.validate(json(args[0]));asJson?output(result):printCheck(result);
    if(result.errors.length||(strict&&result.warnings.length))process.exitCode=1;
  } else if(command==='generate') {
    const out=option('--out'),draft=flag('--draft'),force=flag('--force');checkArgs(1);
    if(!out)throw Error('使用 --out 指定本地输出目录');
    const manifest=json(args[0]),check=core.validate(manifest);
    if(check.errors.length&&!draft){printCheck(check);throw Error('存在错误；修正后生成，或使用 --draft 导出未完成草稿');}
    for(const k of ['project','network','privacy','age','content','requirements','release'])if(!manifest[k]||typeof manifest[k]!=='object'||Array.isArray(manifest[k]))throw Error(`无法生成：${k} 结构损坏`);
    for(const [v,k] of [[manifest.content.systems,'content.systems'],[manifest.privacy.dataItems,'privacy.dataItems'],[manifest.privacy.controlledApis,'privacy.controlledApis'],[manifest.privacy.thirdParties,'privacy.thirdParties'],[manifest.screenshots,'screenshots']])if(!Array.isArray(v)||v.some(x=>!x||typeof x!=='object'||Array.isArray(x)))throw Error(`无法生成：${k} 必须是对象数组`);
    for(const [v,k] of [[manifest.privacy.evidence,'privacy.evidence'],[manifest.notes,'notes']])if(!Array.isArray(v)||v.some(x=>typeof x!=='string'))throw Error(`无法生成：${k} 必须是文本数组`);
    const target=path.resolve(out),outputs=['submission.md','submission.txt','copy-fields.html','fields.json','manifest.snapshot.json','validation.json'];
    try{const stat=fs.lstatSync(target);if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('输出目标须为实际目录，不能是符号链接');}catch(e){if(e.code!=='ENOENT')throw e;}
    if(!force&&fs.existsSync(target)&&fs.readdirSync(target).length)throw Error('输出目录非空；请选择新目录，或明确 --force 覆盖固定生成文件');
    const report=core.textReport(manifest,check);
    const data=[`# 提审资料草稿\n\n${report}`,report,core.htmlReport(manifest,check),JSON.stringify(core.fields(manifest),null,2)+'\n',JSON.stringify(manifest,null,2)+'\n',JSON.stringify(check,null,2)+'\n'];
    fs.mkdirSync(target,{recursive:true});
    for(let i=0;i<outputs.length;i++) {
      const dest=path.join(target,outputs[i]);
      try{const stat=fs.lstatSync(dest);if(stat.isSymbolicLink()||!stat.isFile()||stat.nlink>1)throw Error('拒绝覆盖符号链接、硬链接或非普通文件：'+outputs[i]);}catch(e){if(e.code!=='ENOENT')throw e;}
    }
    for(let i=0;i<outputs.length;i++){
      const fd=fs.openSync(path.join(target,outputs[i]),fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_TRUNC|fs.constants.O_NOFOLLOW,0o600);
      try{fs.writeFileSync(fd,data[i]);}finally{fs.closeSync(fd);}
    }
    console.log(`已生成 ${outputs.length} 个本地文件：${target}\n状态：草稿；${check.errors.length} 错误，${check.warnings.length} 提醒。没有执行任何后台操作。`);
    if(check.errors.length)process.exitCode=1;
  } else if(command==='check-screenshots') {
    const python=option('--python','python3'),asJson=flag('--json');checkArgs(1);
    const result=cp.spawnSync(python,[path.join(root,'scripts/check_screenshots.py'),path.resolve(args[0]),...(asJson?['--json']:[])],{encoding:'utf8',maxBuffer:10*1024*1024});
    if(result.error)throw result.error;
    if(result.stdout)process.stdout.write(result.stdout);if(result.stderr)process.stderr.write(result.stderr);
    process.exitCode=result.status===null?2:result.status;
  } else if(command==='audit-source') {
    const out=option('--out');checkArgs(1);if(!out)throw Error('使用 --out 指定只读检查结果文件');
    const {audit}=require('../lib/audit.cjs');const report=audit(args[0]);
    fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    console.log(`已输出 ${report.files.length} 个文件摘要、${report.candidates.length} 个候选调用。必须人工核查，未自动判定隐私类别。`);
  } else throw Error(`未知命令：${command}`);
} catch(e) {console.error('ERROR: '+e.message);process.exitCode=2;}
