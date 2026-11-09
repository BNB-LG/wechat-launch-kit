'use strict';
const K=window.LaunchKit;
let manifest=K.template('minigame');
const $=id=>document.getElementById(id);
function setStatus(text){$('status').textContent=text;}
function getPath(obj,p){return p.split('.').reduce((o,k)=>o?.[k],obj);}
function setPath(obj,p,value){const parts=p.split('.'),key=parts.pop();let o=obj;for(const part of parts)o=o[part];o[key]=value;}
function download(name,text,type='text/plain'){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('已发起本地下载：'+name+'。未保存或提交微信后台。');}
let rowSerial=0;
function formInput(section,key,label,value,kind='input') {
  const wrapper=document.createElement('label');wrapper.textContent=label;
  const input=document.createElement(kind);input.value=value??'';input.dataset.key=key;wrapper.append(input);section.append(wrapper);return input;
}
function systemRow(data) {
  const row=document.createElement('div');row.className='system-row';row._model=structuredClone(data);row.dataset.systemId=data.id||('system-new-'+(++rowSerial));
  const title=document.createElement('h3');title.textContent='系统 · '+row.dataset.systemId;row.append(title);
  for(const [key,label] of [['type','后台类型'],['name','真实功能名称'],['description','说明']])formInput(row,key,label,data[key],key==='description'?'textarea':'input');
  const remove=document.createElement('button');remove.type='button';remove.textContent='移除此系统';remove.className='remove-system';remove.onclick=()=>{row.remove();setStatus('已从当前草稿移除系统；关联截图会在检查时提示。');};row.append(remove);$('systems').append(row);
}
function systemsForm(){
  $('systems').replaceChildren();
  const list=manifest.content.systems;
  const used=new Set(list.map(s=>s.id));
  for(let i=0;i<Math.max(3,list.length);i++){
    let id='system-'+(i+1);while(used.has(id))id='system-new-'+(++rowSerial);
    const item=list[i]||{id,type:i===2?'设置系统':'自定义系统',name:'',description:''};used.add(item.id);systemRow(item);
  }
}
function dataRow(data={}) {
  const row=document.createElement('div');row.className='data-row';row._model=structuredClone(data);
  for(const [key,label] of [['name','信息名称'],['purpose','用途'],['storage','存储位置'],['retention','真实保存期限'],['deletion','删除方式'],['evidence','源码证据']])formInput(row,key,label,data[key],['purpose','retention','deletion'].includes(key)?'textarea':'input');
  const select=formInput(row,'autoExpires','自动过期','','select');
  for(const [value,label] of [['unknown','未确认'],['false','代码无自动过期'],['true','代码有自动过期']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}
  select.value=typeof data.autoExpires==='boolean'?String(data.autoExpires):'unknown';formInput(row,'expiryEvidence','过期实现证据（存在自动过期时填写）',data.expiryEvidence);
  const remove=document.createElement('button');remove.type='button';remove.textContent='移除此数据项';remove.className='remove-data';remove.onclick=()=>{row.remove();setStatus('已从当前草稿移除此数据项。');};row.append(remove);$('data-items').append(row);
}
function dataForm(){$('data-items').replaceChildren();(manifest.privacy.dataItems.length?manifest.privacy.dataItems:[{}]).forEach(dataRow);}
function loadForm(){
  document.querySelectorAll('[data-path]').forEach(el=>{el.value=getPath(manifest,el.dataset.path)??'';});
  $('privacy-evidence').value=(manifest.privacy.evidence||[]).join('\n');
  dataForm();operationsForm();channelsForm();checklistForm();
  $('screenshots').value=JSON.stringify(manifest.screenshots,null,2);systemsForm();toggle();counts();
  $('json-editor').value=JSON.stringify(manifest,null,2);
}
function toggle(){ $('game-content').hidden=manifest.project.kind!=='minigame'; }
function counts(){ $('scene-count').textContent=K.count(document.querySelector('[data-path="content.scenes"]').value)+' 字符';$('gameplay-count').textContent=K.count(document.querySelector('[data-path="content.gameplay"]').value)+' 字符'; }
function collect(){
  const oldKind=manifest.project.kind;
  document.querySelectorAll('[data-path]').forEach(el=>setPath(manifest,el.dataset.path,el.dataset.type==='boolean'?el.value==='true':el.value));
  if(oldKind!==manifest.project.kind)manifest.requirements.enabled=manifest.project.kind==='minigame';
  manifest.privacy.evidence=$('privacy-evidence').value.split('\n').map(s=>s.trim()).filter(Boolean);
  manifest.privacy.dataItems=[...document.querySelectorAll('#data-items .data-row')].map(row=>{
    const item=structuredClone(row._model);
    row.querySelectorAll('[data-key]').forEach(el=>{if(el.dataset.key==='autoExpires'){if(el.value==='unknown')delete item.autoExpires;else item.autoExpires=el.value==='true';}else item[el.dataset.key]=el.value;});
    return item;
  }).filter(item=>['name','purpose','storage','retention','deletion','evidence','expiryEvidence'].some(key=>String(item[key]||'').trim()));
  manifest.content.systems=[...document.querySelectorAll('.system-row')].map(row=>{
    const item={...structuredClone(row._model),id:row.dataset.systemId};
    row.querySelectorAll('[data-key]').forEach(el=>item[el.dataset.key]=el.value);return item;
  }).filter(item=>item.name.trim()||item.description.trim());
  const shots=JSON.parse($('screenshots').value||'[]');if(!Array.isArray(shots))throw Error('截图清单必须是数组');manifest.screenshots=shots;
  collectOperations();toggle();counts();$('json-editor').value=JSON.stringify(manifest,null,2);return manifest;
}
function render(){
  collect();const check=K.validate(manifest);$('issues').replaceChildren();
  for(const [level,items] of [['error',check.errors],['warning',check.warnings]])for(const item of items){const li=document.createElement('li');li.className=level;li.textContent=item.path+'：'+item.message;$('issues').append(li);}
  if(!check.errors.length&&!check.warnings.length){const li=document.createElement('li');li.textContent='结构与文字检查通过；仍需截图检查和平台实际核对。';$('issues').append(li);}
  $('fields').replaceChildren();const rows=K.fields(manifest);$('field-total').textContent=rows.length+' 项';
  for(const row of rows){const d=document.createElement('div');d.className='field';const h=document.createElement('h3');h.textContent=row.label+' · '+row.characters+' 字符';const t=document.createElement('textarea');t.value=row.value;t.readOnly=true;const p=document.createElement('p');p.className='hint';p.textContent=row.note;const b=document.createElement('button');b.type='button';b.textContent='复制';b.onclick=async()=>{t.focus();t.select();try{await navigator.clipboard.writeText(t.value);b.textContent='已复制';}catch{setStatus('已选中文本，请按 Ctrl+C / ⌘C 复制。');}};d.append(h,t,p,b);$('fields').append(d);}
  setStatus(`已检查：${check.errors.length} 个错误，${check.warnings.length} 个待核对项。所有输出仍为本地草稿。`);return check;
}
function safe(fn){return (...a)=>{try{return fn(...a);}catch(e){setStatus('未完成：'+e.message);}};}
function useManifest(value){
  const structural=K.validate(value);if(structural.errors.some(e=>['$','schemaVersion','project','network','privacy','age','content','requirements','release'].includes(e.path)))throw Error('清单结构不完整；请使用本工具模板');
  for(const a of [value.privacy.dataItems,value.privacy.evidence,value.content.systems,value.screenshots])if(!Array.isArray(a)||a.some(x=>x===null))throw Error('数组结构无效');
  for(const key of ['operations','monetization'])if(value[key]!==undefined&&(!value[key]||typeof value[key]!=='object'||Array.isArray(value[key])))throw Error(key+' 须为对象');
  for(const list of [value.operations?.materials,value.monetization?.ads?.materials,value.monetization?.payment?.materials])if(list!==undefined&&(!Array.isArray(list)||list.some(x=>!x||typeof x!=='object'||Array.isArray(x))))throw Error('运营／开通材料须为对象数组');
  const defaults=K.template(value.project.kind);
  for(const key of ['project','network','privacy','age','content','requirements','release'])value[key]={...defaults[key],...value[key]};
  value.operations={...defaults.operations,...value.operations,delivery:{...defaults.operations.delivery,...value.operations?.delivery}};
  value.monetization={...defaults.monetization,...value.monetization,ads:{...defaults.monetization.ads,...value.monetization?.ads},payment:{...defaults.monetization.payment,...value.monetization?.payment}};
  manifest=value;loadForm();render();
}
$('new-game').onclick=()=>{if(confirm('新建会替换当前内存草稿；请先导出要保留的 JSON。继续？')){manifest=K.template('minigame');loadForm();render();}};
$('new-program').onclick=()=>{if(confirm('新建会替换当前内存草稿；请先导出要保留的 JSON。继续？')){manifest=K.template('miniprogram');loadForm();render();}};
$('refresh').onclick=safe(render);
$('download-json').onclick=safe(()=>{collect();download('manifest.private.json',JSON.stringify(manifest,null,2)+'\n','application/json');});
$('download-html').onclick=safe(()=>{const check=render();download('copy-fields.html',K.htmlReport(manifest,check),'text/html');});
$('download-md').onclick=safe(()=>{const check=render();download('submission.md','# 提审资料草稿\n\n'+K.textReport(manifest,check),'text/markdown');});
$('download-txt').onclick=safe(()=>{const check=render();download('submission.txt',K.textReport(manifest,check));});
$('sync-json').onclick=safe(()=>{collect();$('json-editor').value=JSON.stringify(manifest,null,2);setStatus('当前表单已同步到 JSON 编辑器。');});
$('apply-json').onclick=safe(()=>useManifest(JSON.parse($('json-editor').value)));
$('import').onclick=()=>$('import-file').click();
$('import-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{useManifest(JSON.parse(await file.text()));setStatus('已导入 '+file.name+'；未联网，关闭前请导出。');}catch(e){setStatus('导入失败：'+e.message);}event.target.value='';};
document.querySelector('[data-path="project.kind"]').onchange=safe(()=>{collect();render();});
document.querySelectorAll('[data-path^="content."]').forEach(el=>el.addEventListener('input',counts));
for(const [name,url] of K.sources){const a=document.createElement('a');a.href=url;a.textContent=name;a.target='_blank';a.rel='noopener noreferrer';$('links').append(a);}

function materialRow(data){
  const row=document.createElement('div');row.className='material-row data-row';row._model=structuredClone(data);
  const h=document.createElement('h3');h.textContent=data.label;row.append(h);
  for(const [key,label] of [['id','素材 ID'],['label','后台栏目名称'],['path','本地相对路径'],['version','素材版本'],['description','展示内容与用途'],['contentNotes','人工核对结论']])formInput(row,key,label,data[key],['description','contentNotes'].includes(key)?'textarea':'input');
  const kind=formInput(row,'kind','文件类型','','select');for(const [v,l] of [['image','图片'],['video','视频']]){const option=document.createElement('option');option.value=v;option.textContent=l;kind.append(option);}kind.value=data.kind;
  const source=formInput(row,'source','素材来源','','select');for(const [v,l] of [['unconfirmed','待核对'],['game-capture','真实游戏录制／截图'],['original-design','原创设计'],['licensed','已有授权'],['mixed','混合素材']]){const option=document.createElement('option');option.value=v;option.textContent=l;source.append(option);}source.value=data.source;
  const review=formInput(row,'contentReview','内容与授权人工检查','','select');for(const [v,l] of [['pending','待核对'],['reviewed','已核对并留结论']]){const option=document.createElement('option');option.value=v;option.textContent=l;review.append(option);}review.value=data.contentReview;
  formInput(row,'constraints','当前页面规格 JSON（字节、像素、秒、出处和日期）',JSON.stringify(data.constraints,null,2),'textarea');
  const b=document.createElement('button');b.type='button';b.textContent='移除此素材';b.onclick=()=>row.remove();row.append(b);$('operation-materials').append(row);
}
function operationsForm(){
  $('operation-materials').replaceChildren();(manifest.operations.materials||[]).forEach(materialRow);
}
function channelsForm(){
  $('monetization-channels').replaceChildren();
  for(const [group,label] of [['ads','流量主'],['payment','支付']]){
    const c=manifest.monetization[group],section=document.createElement('details');const summary=document.createElement('summary');summary.textContent=label+'资格与进度证据';section.append(summary);
    for(const [key,title,options] of [['status','申请状态',[['unknown','待确认'],['preparing','准备资料'],['submitted','已提交'],['approved','已通过'],['enabled','已开通']]],['eligibility','当前账号资格',[['unknown','待核对'],['eligible','当前页面确认符合'],['ineligible','当前页面不符合']]],['evidenceType','证据来源',[['none','无'],['user-report','用户报告'],['platform-readback','平台读回']]]]){
      const el=formInput(section,key,title,'','select');for(const [value,text] of options){const option=document.createElement('option');option.value=value;option.textContent=text;el.append(option);}el.value=c[key];el.dataset.channel=group;
    }
    for(const [key,title] of [['checkedAt','资格核对日期'],['provenance','资格／材料要求出处'],['version','状态对应版本'],['observedAt','状态观察时间'],['evidence','状态原文与证据']]){const el=formInput(section,key,title,c[key],key==='evidence'?'textarea':'input');el.dataset.channel=group;}
    $('monetization-channels').append(section);
  }
}
function checklistForm(){
  $('monetization-checklist').replaceChildren();const rows=K.operations.checklist(manifest);
  for(const item of rows){
    const row=document.createElement('div');row.className='checklist-row data-row';row.dataset.channel=item.group;row.dataset.itemId=item.id;row.dataset.intent=item.intent;
    const h=document.createElement('h3');h.textContent=(item.group==='ads'?'流量主':'支付')+'：'+item.label;const p=document.createElement('p');p.className='hint';p.textContent=item.note;row.append(h,p);
    const status=formInput(row,'status','资料准备状态','','select');for(const [value,text] of [['pending','待准备／待核对'],['ready','已准备并有依据'],['not-required','当前页面不要求并有依据']]){const option=document.createElement('option');option.value=value;option.textContent=text;status.append(option);}status.value=item.status;
    formInput(row,'evidence','准备情况／不适用的依据（不填证件账号详情）',item.evidence,'textarea');$('monetization-checklist').append(row);
  }
}
function collectOperations(){
  manifest.operations.materials=[...document.querySelectorAll('.material-row')].map(row=>{const item=structuredClone(row._model);row.querySelectorAll('[data-key]').forEach(el=>item[el.dataset.key]=el.dataset.key==='constraints'?JSON.parse(el.value||'{}'):el.value);return item;});
  document.querySelectorAll('#monetization-channels [data-channel]').forEach(el=>manifest.monetization[el.dataset.channel][el.dataset.key]=el.value);
  for(const row of document.querySelectorAll('.checklist-row')){
    const c=manifest.monetization[row.dataset.channel],id=row.dataset.itemId,intent=row.dataset.intent,old=c.materials.find(x=>x.id===id&&x.intent===intent)||{id,intent};
    const item={...old};row.querySelectorAll('[data-key]').forEach(el=>item[el.dataset.key]=el.value);c.materials=c.materials.filter(x=>!(x.id===id&&x.intent===intent));c.materials.push(item);
  }
}
for(const [id,label] of K.operations.slots){const option=document.createElement('option');option.value=id;option.textContent=label;$('material-slot').append(option);}
$('add-material').onclick=safe(()=>{collect();const a=K.operations.material($('material-slot').value,manifest.project.version),baseId=a.id,used=new Set(manifest.operations.materials.map(x=>x.id));do{a.id=baseId+'-'+(++rowSerial);}while(used.has(a.id));materialRow(a);});
$('refresh-checklist').onclick=safe(()=>{collect();checklistForm();render();});

loadForm();render();

$('add-data').onclick=()=>dataRow({});
$('add-system').onclick=()=>systemRow({id:'system-new-'+(++rowSerial),type:'自定义系统',name:'',description:''});
