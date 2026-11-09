'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function audit(source){
  const base=fs.realpathSync(source);if(!fs.statSync(base).isDirectory())throw Error('源码位置必须是目录');
  const report={generatedAt:new Date().toISOString(),status:'candidates-only',files:[],candidates:[],skipped:[],limitations:['静态候选检索可能包含注释并漏掉别名、动态属性、压缩包及运行时行为。','不自动认定个人信息、受控 API、声明或同意流程完成；人工检查每个调用、依赖和实际运行。','本报告含项目相对路径与文件摘要，公开前仍须检查。']};
  function walk(dir){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
      const file=path.join(dir,entry.name),rel=path.relative(base,file).split(path.sep).join('/');
      if(entry.isSymbolicLink()){report.skipped.push({path:rel,reason:'symlink'});continue;}
      if(entry.name.startsWith('.')||['node_modules','vendor','dist','build','coverage'].includes(entry.name)){report.skipped.push({path:rel,reason:'hidden-or-generated; review dependencies separately'});continue;}
      if(entry.isDirectory()){walk(file);continue;}
      if(!entry.isFile()){report.skipped.push({path:rel,reason:'not-regular-file'});continue;}
      if(!/\.(?:[cm]?js|[cm]?ts|jsx|tsx|json|wxml|wxss)$/.test(entry.name))continue;
      if(fs.statSync(file).size>2*1024*1024){report.skipped.push({path:rel,reason:'over-2MiB'});continue;}
      const data=fs.readFileSync(file),text=data.toString('utf8');
      report.files.push({path:rel,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
      if(!/\.(?:[cm]?js|[cm]?ts|jsx|tsx)$/.test(entry.name))continue;
      text.split(/\r?\n/).forEach((line,i)=>{
        const matches=line.matchAll(/\bwx\s*(?:\.\s*([A-Za-z_$][\w$]*)|\[\s*['"]([A-Za-z_$][\w$]*)['"]\s*\])|\b(fetch|XMLHttpRequest|WebSocket)\b/g);
        for(const match of matches)report.candidates.push({path:rel,line:i+1,api:match[1]||match[2]?'wx.'+(match[1]||match[2]):match[3]});
      });
    }
  }
  walk(base);return report;
}
module.exports={audit};
