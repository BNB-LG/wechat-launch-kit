(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./operations.js'));
  else root.LaunchKit = factory(root.LaunchOperations);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O) {
  'use strict';
  const sources = [
    ['微信公众平台（自行选择对应账号）', 'https://mp.weixin.qq.com/'],
    ['小游戏接入指南', 'https://developers.weixin.qq.com/minigame/introduction/guide/index.html'],
    ['小游戏版本审核', 'https://developers.weixin.qq.com/minigame/introduction/guide/bbsh.html'],
    ['小游戏适龄提示', 'https://developers.weixin.qq.com/minigame/introduction/guide/slts.html'],
    ['小游戏内容备案', 'https://developers.weixin.qq.com/minigame/introduction/guide/nrjs.html'],
    ['IAA 资质审核', 'https://developers.weixin.qq.com/minigame/introduction/guide/zzsh-iaa.html'],
    ['小游戏隐私保护', 'https://developers.weixin.qq.com/minigame/dev/guide/open-ability/privacy.html'],
    ['小程序隐私指引', 'https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/miniprogram-intro.html'],
    ['小程序协作与发布', 'https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/release.html'],
    ...O.sourceLinks
  ];
  const stages = ['draft', 'saved', 'uploaded', 'submitted', 'approved', 'published'];
  const stageLabels = {draft:'本地草稿',saved:'后台已保存',uploaded:'开发版已上传',submitted:'已提交／审核中',approved:'审核通过',published:'已公开发布'};
  const requiredFields = ['project.name','project.version','project.intro','project.reviewInstructions','project.updateNotes'];
  const sizeProfile = () => ({enabled:true, provenance:'实践检查模板；使用前对照当前账号页面', checkedAt:'', minBytes:61440,maxBytes:5242880,sceneMin:3,gameplayMin:3,systemMin:3,perSystemMin:1,duplicatePolicy:'error',requiredFields:[...requiredFields],fieldLimits:{nameMin:4,nameMax:30,shortNameMax:10,introMax:120,updateNotesMax:300,releasePromptMax:15,ageBackgroundMax:10,ageThemeMax:10,ageValueMax:100,sceneMin:30,sceneMax:800,gameplayMin:50,gameplayMax:800,systemDescriptionMin:30,systemDescriptionMax:800,iconWidth:144,iconHeight:144,iconMaxBytes:2097152}});
  function template(kind = 'minigame') {
    return {schemaVersion:1,project:{kind,name:'',shortName:'',iconPath:'',version:'',accountType:'unknown',subjectType:'unknown',category:'',intro:'',contactEmail:'',appleAccountEmail:'',engine:'',engineEvidence:'',businessModel:'',reviewInstructions:'',updateNotes:'',releasePrompt:''},
      network:{technicalFacts:'',platformChoice:'unconfirmed',declarationStatus:'unknown',evidence:'',futureChanges:''},
      privacy:{auditStatus:'pending',sourceRevision:'',evidence:[],controlledApis:[],dataItems:[],thirdParties:[],notes:'',consentVerification:'pending'},
      age:{suggestion:'unconfirmed',rationale:'',platformStatus:'pending',background:'',theme:'',value:'',artStyle:'',realEvent:'',socialMode:'',purchases:''},
      content:{scenes:'',gameplay:'',systems:[]},
      screenshots:[],operations:O.operationsTemplate(),monetization:O.monetizationTemplate(),requirements:Object.assign(sizeProfile(),{enabled:kind==='minigame'}),
      release:{stage:'draft',version:'',evidenceType:'none',evidence:'',observedAt:'',qualification:'unknown',contentFiling:'unknown',appFiling:'unknown',publicAccess:'unverified'},
      notes:[]};
  }
  const count = value => [...String(value || '')].length;
  const nameCount = value => [...String(value || '')].reduce((n,c)=>n+(/\p{Script=Han}/u.test(c)?2:1),0);
  const isObject = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const filled = v => typeof v === 'string' && v.trim().length > 0;
  function validate(m) {
    const errors=[],warnings=[];
    const err=(path,message)=>errors.push({path,message});
    const warn=(path,message)=>warnings.push({path,message});
    if (!isObject(m)) return {errors:[{path:'$',message:'清单必须是 JSON 对象'}],warnings};
    if (m.schemaVersion !== 1) err('schemaVersion','仅支持版本 1');
    for (const key of ['project','network','privacy','age','content','requirements','release']) if(!isObject(m[key])) err(key,'缺少对象');
    if (errors.length) return {errors,warnings};
    const p=m.project, privacy=m.privacy, c=m.content, req=m.requirements, r=m.release;
    for(const key of ['name','version','category','intro','contactEmail','engine','engineEvidence','businessModel','reviewInstructions','updateNotes']) if(typeof p[key]!=='string')err('project.'+key,'须为文本');
    for(const key of ['shortName','iconPath','appleAccountEmail','releasePrompt'])if(p[key]!==undefined&&typeof p[key]!=='string')err('project.'+key,'须为文本');
    const defaults=sizeProfile().fieldLimits;
    const limits={...defaults,...(isObject(req.fieldLimits)?req.fieldLimits:{})};
    if(req.fieldLimits!==undefined&&!isObject(req.fieldLimits))err('requirements.fieldLimits','须为对象');
    for(const [key,value] of Object.entries(limits)){
      if(!Object.hasOwn(defaults,key))err('requirements.fieldLimits.'+key,'未知的限额字段');
      else if(!Number.isSafeInteger(value)||value<0||(/^icon/.test(key)&&value===0))err('requirements.fieldLimits.'+key,/^icon/.test(key)?'须为正整数':'须为非负整数');
    }
    if(filled(p.name)&&(nameCount(p.name)<limits.nameMin||nameCount(p.name)>limits.nameMax))err('project.name',`当前模板名称 ${limits.nameMin}–${limits.nameMax} 计数字符（汉字计 2），现有 ${nameCount(p.name)}`);
    for(const [min,max] of [['nameMin','nameMax'],['sceneMin','sceneMax'],['gameplayMin','gameplayMax'],['systemDescriptionMin','systemDescriptionMax']])if(limits[min]>limits[max])err('requirements.fieldLimits',`${min} 不能超过 ${max}`);
    if(nameCount(p.shortName)>limits.shortNameMax)err('project.shortName',`简称最多 ${limits.shortNameMax} 计数字符（汉字计 2）`);
    for(const [key,limit] of [['intro','introMax'],['updateNotes','updateNotesMax'],['releasePrompt','releasePromptMax']])if(count(p[key])>limits[limit])err('project.'+key,`当前模板最多 ${limits[limit]} 字符，现有 ${count(p[key])}`);
    for(const [key,limit] of [['background','ageBackgroundMax'],['theme','ageThemeMax'],['value','ageValueMax']])if(count(m.age[key])>limits[limit])err('age.'+key,`当前模板最多 ${limits[limit]} 字符`);
    for(const key of ['background','theme','value','artStyle','realEvent','socialMode','purchases'])if(m.age[key]!==undefined&&typeof m.age[key]!=='string')err('age.'+key,'须为文本');
    if(filled(p.appleAccountEmail)&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.appleAccountEmail))err('project.appleAccountEmail','邮箱格式无效；按本人真实账号填写，不提供密码');
    if(filled(p.iconPath)&&(/^(?:[a-z]:|\/|\\)/i.test(p.iconPath)||p.iconPath.split(/[\\/]/).includes('..')))err('project.iconPath','头像路径须相对清单目录，不能越界');
    for (const [key, choices] of [['kind',['minigame','miniprogram']],['accountType',['formal','test','unknown']],['subjectType',['individual','organization','unknown']]]) if(!choices.includes(p[key])) err(`project.${key}`,`须为 ${choices.join(' / ')}`);
    const required=req.requiredFields===undefined?requiredFields:req.requiredFields;
    if(!Array.isArray(required))err('requirements.requiredFields','须为字段路径数组');
    else for(const field of required){
      if(typeof field!=='string'||!/^((project|age)\.[A-Za-z]+)$/.test(field)||typeof template(p.kind)[field.split('.')[0]][field.split('.')[1]]!=='string'){err('requirements.requiredFields','仅可指定已支持的 project / age 文本字段');continue;}
      const [group,key]=field.split('.');if(!filled(m[group][key]))err(field,'当前表单设为必填，请填写真实资料');
    }
    if(!filled(p.iconPath))warn('project.iconPath','头像文件待准备；当前模板推荐 144×144、2 MiB 以内，以账号页面为准');
    if (p.accountType !== 'formal') warn('project.accountType', p.accountType==='test'?'测试号只能开发／预览，不能作为正式发布账号':'尚未核对正式账号类型');
    if (p.subjectType === 'unknown') warn('project.subjectType','核对个人或组织主体；个人不要套用单位授权书');
    if (!filled(p.contactEmail)) warn('project.contactEmail','联系方式待填写；身份资料只在官方后台填写');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contactEmail)) err('project.contactEmail','邮箱格式无效');
    if (p.kind === 'minigame' && !filled(p.engine)) err('project.engine','填写真实引擎；原生 Canvas 2D 可备注其他／自研');
    if (!['unconfirmed','offline','online'].includes(m.network.platformChoice)) err('network.platformChoice','须为 unconfirmed / offline / online');
    if(!['unknown','not-required','pending','signed'].includes(m.network.declarationStatus))err('network.declarationStatus','无效声明状态');
    if (m.network.platformChoice === 'offline' && !filled(m.network.evidence)) warn('network.evidence','单机技术事实不能替代当前账号声明；核对适用条件，不推定备案豁免');
    if (m.network.declarationStatus === 'signed') warn('network.declarationStatus','已签署无需重复签署，但不等于备案豁免、获批或上线');
    if (!['pending','reviewed'].includes(privacy.auditStatus)) err('privacy.auditStatus','须为 pending / reviewed');
    if (privacy.auditStatus !== 'reviewed') warn('privacy.auditStatus','尚未完成源码、依赖、网络和存储人工核查；不能据清单认定隐私完成');
    if (privacy.auditStatus === 'reviewed' && (!filled(privacy.sourceRevision) || !Array.isArray(privacy.evidence) || !privacy.evidence.length)) err('privacy.evidence','已核查必须记录版本与代码证据');
    for (const key of ['controlledApis','dataItems','thirdParties','evidence']) if(!Array.isArray(privacy[key])) err(`privacy.${key}`,'须为数组');
    for(const [i,item] of (Array.isArray(privacy.evidence)?privacy.evidence:[]).entries())if(!filled(item))err(`privacy.evidence[${i}]`,'证据须为非空文本');
    if(!Array.isArray(m.notes)||m.notes.some(x=>!filled(x)))err('notes','须为非空文本组成的数组（无备注时使用空数组）');
    for (const [i,item] of (Array.isArray(privacy.controlledApis)?privacy.controlledApis:[]).entries()) {
      if(!isObject(item)||!filled(item.name)||!filled(item.purpose)||!filled(item.evidence)) err(`privacy.controlledApis[${i}]`,'受控接口须有名称、真实用途和源码证据，不能为填表勾选未调用项');
    }
    for (const [i,item] of (Array.isArray(privacy.dataItems)?privacy.dataItems:[]).entries()) {
      if(!isObject(item)) {err(`privacy.dataItems[${i}]`,'须为对象');continue;}
      for(const key of ['name','purpose','storage','retention','deletion','evidence']) if(!filled(item[key])) err(`privacy.dataItems[${i}].${key}`,'填写实际处理方式，未验证的行为明确标注');
      if(item.autoExpires!==undefined&&typeof item.autoExpires!=='boolean')err(`privacy.dataItems[${i}].autoExpires`,'须为布尔值');
      if(item.autoExpires === false) warn(`privacy.dataItems[${i}].retention`,'已声明无自动过期，请人工确认文字未承诺固定天数自动删除；工具不据数字猜测实际含义');
      if(item.autoExpires === true && !filled(item.expiryEvidence)) err(`privacy.dataItems[${i}].expiryEvidence`,'自动过期需要实现证据');
    }
    for(const [i,item] of (Array.isArray(privacy.thirdParties)?privacy.thirdParties:[]).entries())if(!isObject(item)||!filled(item.name)||!filled(item.purpose)||!filled(item.evidence))err(`privacy.thirdParties[${i}]`,'第三方须记录名称、用途与证据');
    if (!Array.isArray(c.systems)) err('content.systems','须为数组');
    if (!Array.isArray(m.screenshots)) err('screenshots','须为数组');
    if (typeof req.enabled!=='boolean') err('requirements.enabled','须为布尔值');
    for(const key of ['minBytes','maxBytes','sceneMin','gameplayMin','systemMin','perSystemMin']) if(!Number.isSafeInteger(req[key])||req[key]<0) err(`requirements.${key}`,'须为非负整数');
    if(req.minBytes>req.maxBytes) err('requirements','最小文件大小不能超过最大值');
    if(!['error','warn'].includes(req.duplicatePolicy)) err('requirements.duplicatePolicy','须为 error / warn');
    if(!filled(req.checkedAt)) warn('requirements.checkedAt','检查模板尚未对照本账号当前表单；数字不是通用永久规则');
    if(p.kind === 'minigame') {
      for (const [key,min,max] of [['scenes',limits.sceneMin,limits.sceneMax],['gameplay',limits.gameplayMin,limits.gameplayMax]]) if(count(c[key])<min||count(c[key])>max) err(`content.${key}`,`当前模板要求 ${min}–${max} 字符，现有 ${count(c[key])}；对照实际表单`);
      if((c.systems||[]).length<req.systemMin) err('content.systems',`当前模板至少 ${req.systemMin} 项真实系统，不虚构商城、货币或排行榜`);
      if(m.age.suggestion==='unconfirmed') warn('age.suggestion','依据实际画面、情节和交互评估适龄，不能沿用示例评级');
    }
    const ids=new Set();
    for(const [i,item] of (Array.isArray(c.systems)?c.systems:[]).entries()) {
      if(!isObject(item)){err(`content.systems[${i}]`,'须为对象');continue;}
      if(!filled(item.id)||ids.has(item.id)) err(`content.systems[${i}].id`,'系统 ID 必填且不能重复');
      ids.add(item.id);
      if(!filled(item.name)||!filled(item.type)) err(`content.systems[${i}]`,'填写实际系统名称和后台选项');
      if(p.kind==='minigame'&&(count(item.description)<limits.systemDescriptionMin||count(item.description)>limits.systemDescriptionMax)) err(`content.systems[${i}].description`,`当前模板要求 ${limits.systemDescriptionMin}–${limits.systemDescriptionMax} 字符，现有 ${count(item.description)}`);
    }
    for(const [i,item] of (Array.isArray(m.screenshots)?m.screenshots:[]).entries()) {
      if(!isObject(item)){err(`screenshots[${i}]`,'须为对象');continue;}
      if(!filled(item.path)||/^(?:[a-z]:|\/|\\)/i.test(item.path)||item.path.split(/[\\/]/).includes('..')) err(`screenshots[${i}].path`,'使用清单所在目录内的相对路径，禁止越界');
      if(!['scene','gameplay','system','other'].includes(item.column)) err(`screenshots[${i}].column`,'无效截图栏目');
      if(item.column==='system'&&!ids.has(item.systemId)) err(`screenshots[${i}].systemId`,'必须对应真实系统 ID');
      if(!['wechat-device','wechat-devtools'].includes(item.source)) err(`screenshots[${i}].source`,'截图来源必须为微信真机或微信开发者工具；不能把网页图当微信图');
      if(item.version!==p.version) err(`screenshots[${i}].version`,'截图版本与当前资料不一致');
      if(!filled(item.description)) warn(`screenshots[${i}].description`,'补充截图显示的真实状态，仍需人工检查画面');
    }
    if(!stages.includes(r.stage)) err('release.stage','无效流程状态');
    if(!['none','user-report','platform-readback'].includes(r.evidenceType))err('release.evidenceType','无效证据来源');
    if(r.stage!=='draft') {
      if(!filled(r.version)||r.version!==p.version) err('release.version','外部状态必须绑定当前版本');
      if(!['user-report','platform-readback'].includes(r.evidenceType)||!filled(r.evidence)||!filled(r.observedAt)) err('release.evidence','记录状态原文、时间和证据来源；不可由生成工具推定');
      if(p.accountType!=='formal') err('release.stage','正式上传或后续状态必须核对正式账号');
    }
    if(r.stage==='published'&&r.publicAccess!=='verified') warn('release.publicAccess','平台发布状态尚未验证普通用户可访问');
    if(req.enabled && (!m.screenshots || m.screenshots.length===0)) warn('screenshots','尚无截图；文字校验通过不代表提审资料齐备');
    const extra=O.validate(m);errors.push(...extra.errors);warnings.push(...extra.warnings);
    return {errors,warnings};
  }
  function fields(m) {
    const p=m.project, rows=[], limits={...sizeProfile().fieldLimits,...(isObject(m.requirements.fieldLimits)?m.requirements.fieldLimits:{})};
    const add=(label,value,note='',counter=count)=>rows.push({label,value:String(value||''),note,characters:counter(value)});
    add('应用类型',p.kind==='minigame'?'小游戏':'小程序','先核对正式账号类型与类目');
    const fieldNotes={name:`当前模板 ${limits.nameMin}–${limits.nameMax} 计数字符，汉字计 2；现有 ${nameCount(p.name)}`,shortName:`当前模板最多 ${limits.shortNameMax} 计数字符，汉字计 2；现有 ${nameCount(p.shortName)}`,iconPath:`相对清单目录路径；推荐 ${limits.iconWidth}×${limits.iconHeight}、${limits.iconMaxBytes} 字节以内；CLI 检查文件`,intro:`当前模板最多 ${limits.introMax} 字符`,updateNotes:`当前模板最多 ${limits.updateNotesMax} 字符`,releasePrompt:`选填；当前模板最多 ${limits.releasePromptMax} 字符`};
    for(const [label,key] of [['名称','name'],['简称（选填）','shortName'],['头像文件','iconPath'],['版本','version'],['类目','category'],['简介','intro'],['客服／隐私邮箱','contactEmail'],['Apple 开发者账号邮箱（按页面要求）','appleAccountEmail'],['引擎','engine'],['审核操作说明','reviewInstructions'],['版本更新说明','updateNotes'],['更新提醒（选填）','releasePrompt']]) add(label,p[key],fieldNotes[key]||'',['name','shortName'].includes(key)?nameCount:count);
    add('网络技术事实',m.network.technicalFacts,'平台单机选项及声明单独核对');
    add('网络类型选择',m.network.platformChoice,'unconfirmed = 待核对；offline = 单机；online = 联网');
    add('隐私补充说明',m.privacy.notes,'先核对源码、依赖及实际运行；不依据模板勾选接口');
    add('隐私核查证据',(m.privacy.evidence||[]).join('\n'),'核查状态 '+m.privacy.auditStatus+'；源码版本 '+(m.privacy.sourceRevision||'待核查'));
    for(const [i,item] of (m.privacy.controlledApis||[]).entries())add(`受控接口 ${i+1}：${item.name}`,item.purpose,'源码证据：'+item.evidence);
    for(const [i,item] of (m.privacy.thirdParties||[]).entries())add(`第三方 ${i+1}：${item.name}`,item.purpose,'核查证据：'+item.evidence);
    for(const [i,item] of (m.privacy.dataItems||[]).entries()) {
      add(`自定义数据 ${i+1}：名称`,item.name,'自定义项是独立入口；本地最高分不能误选微信关系');
      add(`自定义数据 ${i+1}：用途`,item.purpose);add(`自定义数据 ${i+1}：存储`,item.storage);
      add(`自定义数据 ${i+1}：保存期限`,item.retention);add(`自定义数据 ${i+1}：删除方式`,item.deletion);
      add(`自定义数据 ${i+1}：核查证据`,item.evidence,'自动过期：'+(item.autoExpires===true?'声明已实现；证据 '+(item.expiryEvidence||'缺失'):item.autoExpires===false?'未实现':'待核查'));
    }
    if(p.kind==='minigame') {
      add('适龄建议',m.age.suggestion,'建议不是平台评级');add('适龄依据',m.age.rationale);
      for(const [label,key] of [['适龄：故事背景','background'],['适龄：游戏主题','theme'],['适龄：价值说明','value'],['适龄：画面风格','artStyle'],['适龄：现实事件关系','realEvent'],['适龄：单人／社交','socialMode'],['适龄：内购事实','purchases']])add(label,m.age[key]);
      add('主要场景',m.content.scenes,`当前检查模板：${limits.sceneMin}–${limits.sceneMax} 字符`);
      add('整体玩法',m.content.gameplay,`当前检查模板：${limits.gameplayMin}–${limits.gameplayMax} 字符`);
      for(const item of (m.content.systems||[])) add(`系统：${item.type} / ${item.name}`,item.description,`当前检查模板：${limits.systemDescriptionMin}–${limits.systemDescriptionMax} 字符；截图关联 `+item.id);
    }
    if((m.notes||[]).length)add('其他限制与待核实事项',m.notes.join('\n'));
    add('外部状态记录',`状态：${stageLabels[m.release.stage]||m.release.stage}\n版本：${m.release.version||'尚无外部版本记录'}\n来源：${m.release.evidenceType}\n观察时间：${m.release.observedAt||'未记录'}\n状态原文：${m.release.evidence||'无外部证据'}\n公开访问：${m.release.publicAccess}`,'用户报告不等于平台读回；本工具不会执行后台操作');
    rows.push(...O.fields(m));
    return rows;
  }
  function textReport(m,check) {
    const rows=fields(m), lines=[`${m.project.name || '未命名项目'} · ${m.project.version || '待定版本'} 提审资料草稿`,'',`流程状态：${stageLabels[m.release.stage]||m.release.stage}（${m.release.evidenceType}）`,`观察时间：${m.release.observedAt||'未记录'}`,`证据：${m.release.evidence||'无外部状态证据'}`,'本文件由本地工具生成，不代表后台保存、提交、审核通过或发布。',''];
    for(const f of rows) lines.push(`【${f.label}】（${f.characters} 字符）`,f.value||'待填写',...(f.note?[`填写提示：${f.note}`]:[]),'');
    lines.push('【截图清单】',...(m.screenshots||[]).map(s=>`${s.column}${s.systemId?'/'+s.systemId:''} | ${s.path} | ${s.source} | ${s.version} | ${s.description||''}`),'','【待处理】',...check.errors.map(x=>`错误 ${x.path}: ${x.message}`),...check.warnings.map(x=>`提醒 ${x.path}: ${x.message}`),'','【官方入口】',...sources.map(([label,url])=>`${label}: ${url}`));
    return lines.join('\n')+'\n';
  }
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function htmlReport(m,check) {
    const cards=fields(m).map(f=>`<section><h2>${escape(f.label)} <small>${f.characters} 字符</small></h2><textarea readonly>${escape(f.value)}</textarea><p>${escape(f.note)}</p><button type="button">复制这一项</button></section>`).join('');
    return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>提审字段复制台</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:860px;margin:32px auto;padding:0 20px;background:#f5f7f9;color:#142d32}section{background:white;border:1px solid #d5e3e4;padding:20px;border-radius:12px;margin:16px 0}h1{font-size:28px}h2{font-size:18px}small{font-size:12px;color:#53696c}textarea{box-sizing:border-box;width:100%;min-height:100px;font:inherit;padding:12px;border:1px solid #b7cace;border-radius:6px}button{background:#075f55;color:white;border:0;padding:10px 18px;border-radius:6px;cursor:pointer}p{color:#53696c}a{color:#075f55}</style><h1>${escape(m.project.name)} · 字段复制台</h1><p>版本 ${escape(m.project.version)} · ${escape(stageLabels[m.release.stage]||m.release.stage)}。仅生成本地草稿；${check.errors.length} 个错误、${check.warnings.length} 个待核对项。</p><p>先核对当前账号与版本，再逐项复制；保存、提交、通过和公开发布分别记录。</p>${cards}<section><h2>待处理</h2><ul>${[...check.errors,...check.warnings].map(x=>`<li>${escape(x.path+': '+x.message)}</li>`).join('')}</ul></section><section><h2>官方入口</h2>${sources.map(([l,u])=>`<p><a href="${u}" target="_blank" rel="noopener noreferrer">${l}</a></p>`).join('')}</section><p id="status" role="status"></p><script>document.querySelectorAll('section button').forEach(b=>b.addEventListener('click',async()=>{const t=b.parentElement.querySelector('textarea');t.focus();t.select();try{await navigator.clipboard.writeText(t.value);b.textContent='已复制';}catch(e){document.getElementById('status').textContent='已选中文本，请按 Ctrl+C / ⌘C 复制。';}}));</script></html>`;
  }
  return {sources,stages,stageLabels,template,count,nameCount,validate,fields,textReport,htmlReport,operations:O};
});
