'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('../lib/core.js'),{root,example}=require('./helpers.cjs');
const has=(check,p)=>check.errors.some(e=>e.path===p);

test('both example branches validate with honest remaining warnings; templates match CLI defaults',()=>{
  for(const kind of ['minigame','miniprogram']){
    const m=example(kind),r=K.validate(m);
    assert.deepEqual(r.errors,[]);assert.ok(r.warnings.some(w=>w.path==='privacy.auditStatus'));
    assert.equal(m.release.stage,'draft');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'templates',kind+'.json'),'utf8')),K.template(kind));
  }
  const m=example('miniprogram');assert.equal(m.requirements.enabled,false);
  const labels=K.fields(m).map(x=>x.label);assert.ok(!labels.includes('主要场景'));assert.ok(!labels.includes('适龄建议'));
  assert.ok(!K.validate(m).errors.some(x=>x.path.startsWith('content.')));
});

test('name and short name use Han double count; other limits use Unicode code points',()=>{
  const m=example();m.project.name='中文';m.project.shortName='一二三四五';
  assert.equal(K.count('中文😀'),3);assert.equal(K.nameCount('中文😀'),5);
  assert.ok(!has(K.validate(m),'project.name'));assert.ok(!has(K.validate(m),'project.shortName'));
  assert.equal(K.fields(m).find(x=>x.label==='名称').characters,4);
  assert.equal(K.fields(m).find(x=>x.label.startsWith('简称')).characters,10);
  m.project.name='中';assert.ok(has(K.validate(m),'project.name'));
  m.project.name='中'.repeat(16);assert.ok(has(K.validate(m),'project.name'));
  m.project.shortName+='六';assert.ok(has(K.validate(m),'project.shortName'));
  for(const [group,key,max] of [['project','intro',120],['project','updateNotes',300],['project','releasePrompt',15],['age','background',10],['age','theme',10],['age','value',100]]){
    const v=example();v[group][key]='😀'.repeat(max);assert.ok(!has(K.validate(v),group+'.'+key));
    v[group][key]+='😀';assert.ok(has(K.validate(v),group+'.'+key));
  }
});

test('current form profile can override text lengths and required fields',()=>{
  const m=example();m.project.name='Tiny';m.content.scenes='少量';m.content.gameplay='玩法';m.content.systems[0].description='说明';
  Object.assign(m.requirements.fieldLimits,{sceneMin:2,gameplayMin:2,systemDescriptionMin:2,nameMax:8});
  assert.deepEqual(K.validate(m).errors,[]);
  m.requirements.requiredFields.push('project.iconPath','age.realEvent');m.age.realEvent='';
  assert.ok(has(K.validate(m),'project.iconPath'));assert.ok(has(K.validate(m),'age.realEvent'));
  m.requirements.requiredFields=['__proto__.polluted'];assert.ok(has(K.validate(m),'requirements.requiredFields'));
  m.requirements.fieldLimits.nameMin=9;assert.ok(has(K.validate(m),'requirements.fieldLimits'));
  assert.match(K.fields(m).find(x=>x.label==='主要场景').note,/2–800/);
});

test('retention 180 days is not misread as zero days; automatic expiry needs evidence',()=>{
  const m=example(),item=m.privacy.dataItems[0];item.retention='手动保留 180 天后由用户清理';
  assert.deepEqual(K.validate(m).errors,[]);assert.ok(K.validate(m).warnings.some(x=>x.path==='privacy.dataItems[0].retention'));
  item.autoExpires=true;assert.ok(has(K.validate(m),'privacy.dataItems[0].expiryEvidence'));
  item.expiryEvidence='src/expiry.js:8（合成测试证据）';assert.deepEqual(K.validate(m).errors,[]);
  item.autoExpires='false';assert.ok(has(K.validate(m),'privacy.dataItems[0].autoExpires'));
});

test('reviewed privacy and SDK declarations require real-shaped evidence',()=>{
  const m=example();m.privacy.auditStatus='reviewed';m.privacy.sourceRevision='synthetic-revision';m.privacy.evidence=[null];
  assert.ok(has(K.validate(m),'privacy.evidence[0]'));
  m.privacy.evidence=['src/main.js:8'];m.privacy.thirdParties=[{}];
  assert.ok(has(K.validate(m),'privacy.thirdParties[0]'));
  m.privacy.thirdParties=[{name:'示例 SDK',purpose:'示例用途',evidence:'package.json:4'}];
  m.privacy.controlledApis=[{name:'wx.example',purpose:'合成接口记录',evidence:'src/main.js:8'}];
  m.notes=['必须人工核对实际网络'];assert.deepEqual(K.validate(m).errors,[]);
  const report=K.textReport(m,K.validate(m));
  for(const value of ['示例 SDK','package.json:4','wx.example','合成接口记录','必须人工核对实际网络'])assert.ok(report.includes(value));
});

test('external state requires matching version and evidence and is never inferred',()=>{
  const m=example();m.release.stage='submitted';
  assert.ok(has(K.validate(m),'release.version'));assert.ok(has(K.validate(m),'release.evidence'));
  Object.assign(m.release,{version:m.project.version,evidenceType:'user-report',evidence:'用户报告：审核中（测试）',observedAt:'2026-01-01T00:00:00Z'});
  assert.deepEqual(K.validate(m).errors,[]);const before=JSON.stringify(m);K.fields(m);
  for(const report of [K.textReport(m,K.validate(m)),K.htmlReport(m,K.validate(m))])for(const fact of [m.release.evidence,m.release.evidenceType,m.release.observedAt,m.release.publicAccess])assert.ok(report.includes(fact));
  assert.equal(JSON.stringify(m),before);
  m.release.stage='published';assert.ok(K.validate(m).warnings.some(x=>x.path==='release.publicAccess'));
});

test('invalid structures and screenshot associations produce errors',()=>{
  assert.equal(K.validate(null).errors[0].path,'$');
  const m=example();m.content.systems[1].id=m.content.systems[0].id;assert.ok(has(K.validate(m),'content.systems[1].id'));
  m.screenshots=[{path:'../outside.png',column:'system',systemId:'missing',source:'browser',version:'0.0.0',description:'测试'}];
  for(const key of ['path','systemId','source','version'])assert.ok(has(K.validate(m),'screenshots[0].'+key));
  m.project.iconPath='../outside.png';assert.ok(has(K.validate(m),'project.iconPath'));
});
