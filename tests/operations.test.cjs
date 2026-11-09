'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const K=require('../lib/core.js'),{workspace,example,save,cli}=require('./helpers.cjs');
const python=process.env.PYTHON||'python3';
const has=(m,p)=>K.validate(m).errors.some(x=>x.path===p);
function complete(kind='minigame'){const m=example(kind);m.operations=K.operations.operationsTemplate();m.monetization=K.operations.monetizationTemplate();return m;}
function media(m,file,slot='general-cover') {const a=K.operations.material(slot,m.project.version);a.path=file;m.operations.materials=[a];return a;}
function inspect(dir,m,...args){const r=cli('check-materials',save(dir,m),'--python',python,'--json',...args);return {...r,report:r.stdout?JSON.parse(r.stdout):null};}
const pillow=cp.spawnSync(python,['-c','import PIL']).status===0;
const video=cp.spawnSync('ffmpeg',['-version']).status===0&&cp.spawnSync('ffprobe',['-version']).status===0;
function image(dir){const r=cp.spawnSync(python,['-c',"from PIL import Image; import sys,pathlib; p=pathlib.Path(sys.argv[1]); Image.new('RGB',(650,250),'green').save(p/'cover.jpg'); Image.new('RGB',(20,20),'red').save(p/'small.png'); (p/'bad.jpg').write_bytes(b'not an image')",dir],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);}

test('legacy manifests remain valid; added operations retain unknown status and export all chosen fields',()=>{
  const operationsExample=JSON.parse(fs.readFileSync(path.join(__dirname,'../examples/minigame-operations.json'),'utf8'));assert.deepEqual(K.validate(operationsExample).errors,[]);
  const old=example();assert.deepEqual(K.validate(old).errors,[]);assert.equal(old.operations,undefined);
  const m=complete();m.operations.gameIntro='合成测试：点击开始躲避障碍';m.operations.promotionCopy='合成测试：一局短挑战';m.monetization.ads.intent='traffic-owner';
  const a=media(m,'materials/cover.jpg');a.description='只展示合成场景，尚未制作';
  const before=JSON.stringify(m),report=K.textReport(m,K.validate(m));assert.equal(JSON.stringify(m),before);
  for(const text of ['一局短挑战','materials/cover.jpg','广告合同、结算及税务事项','pending','unknown'])assert.ok(report.includes(text),text);
  assert.equal(K.operations.checklist(m).length,5);assert.equal(m.release.stage,'draft');
  assert.equal(cli('operations-checklist',path.join(__dirname,'../examples/minigame.json'),'--json').stdout.trim(),'[]');
});

test('game IAP, ordinary payment and personal vs sole proprietor remain distinct; scope locks persist',()=>{
  const m=complete();m.monetization.payment.intent='game-iap';m.monetization.payment.longTermNoVirtualPayment=true;
  assert.ok(has(m,'monetization.payment.intent'));assert.equal(m.monetization.payment.longTermNoVirtualPayment,true);
  m.monetization.payment.longTermNoVirtualPayment=false;const iap=K.operations.checklist(m);assert.ok(iap.some(x=>x.id==='game-qualifications'));assert.ok(!iap.some(x=>x.id==='binding'||x.id==='merchant'));m.monetization.payment.intent='physical-goods-services';assert.ok(has(m,'monetization.payment.intent'));
  const p=complete('miniprogram');p.monetization.payment.intent='game-iap';assert.ok(has(p,'monetization.payment.intent'));
  p.monetization.payment.intent='physical-goods-services';p.project.subjectType='individual';assert.ok(has(p,'monetization.payment.intent'));
  p.project.subjectType='organization';p.monetization.payment.subjectDetail='sole-proprietor';assert.deepEqual(K.validate(p).errors,[]);
  assert.equal(K.operations.checklist(p).length,9);p.monetization.payment.longTermNoVirtualPayment=true;assert.deepEqual(K.validate(p).errors,[]);
});

test('external channel and QR claims need version, time and evidence; ready materials are not approval',()=>{
  const m=complete(),ads=m.monetization.ads;ads.intent='traffic-owner';ads.status='enabled';
  assert.ok(has(m,'monetization.ads.evidence'));assert.ok(has(m,'monetization.ads.eligibility'));
  Object.assign(ads,{status:'preparing',materials:[{id:'agreements',intent:'traffic-owner',status:'ready',evidence:'仅供测试的准备记录'}]});assert.deepEqual(K.validate(m).errors,[]);assert.equal(ads.status,'preparing');
  ads.materials[0].evidence='';assert.ok(has(m,'monetization.ads.materials[0].evidence'));
  const d=m.operations.delivery;d.entryPath='pages/index/index';assert.ok(has(m,'operations.delivery.entryPath'));
  d.entryPath='?channel=poster';d.status='verified';d.qrKind='release';assert.ok(has(m,'operations.delivery.evidence'));assert.ok(has(m,'operations.delivery.status'));
  Object.assign(d,{version:m.project.version,evidenceType:'user-report',evidence:'合成测试扫码记录',observedAt:'2026-01-01',qrPath:'materials/code.png'});assert.ok(has(m,'operations.delivery.status'));
  Object.assign(m.release,{stage:'published',version:m.project.version,evidenceType:'user-report',evidence:'合成测试发布记录',observedAt:'2026-01-01'});ads.materials=[];assert.deepEqual(K.validate(m).errors,[]);
});

test('preparation evidence stays on its original payment route and unfilled submission text does not block a checklist',t=>{
  const dir=workspace(t),m=complete('miniprogram');
  const p=m.monetization.payment;p.intent='physical-goods-services';p.materials=[{id:'agreements',intent:p.intent,status:'ready',evidence:'普通小程序支付合同，非游戏虚拟支付合同'}];
  assert.equal(K.operations.checklist(m).find(x=>x.id==='agreements').status,'ready');
  m.project.kind='minigame';p.intent='game-iap';let row=K.operations.checklist(m).find(x=>x.id==='agreements');assert.equal(row.status,'pending');assert.equal(row.evidence,'');
  p.materials.push({id:'agreements',intent:'game-iap',status:'ready',evidence:'合成测试：游戏协议准备记录'});assert.equal(K.operations.checklist(m).find(x=>x.id==='agreements').evidence,'合成测试：游戏协议准备记录');
  p.intent='physical-goods-services';m.project.kind='miniprogram';assert.equal(K.operations.checklist(m).find(x=>x.id==='agreements').evidence,'普通小程序支付合同，非游戏虚拟支付合同');
  delete p.materials[0].intent;assert.ok(has(m,'monetization.payment.materials[0].intent'));
  const blank=K.template('minigame');blank.monetization.ads.intent='traffic-owner';const file=save(dir,blank),result=cli('operations-checklist',file,'--json');assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).length,5);
});

test('material declarations reject escapes, cross-version reuse, conflicting or unknown rules',()=>{
  const m=complete(),a=media(m,'../outside.jpg');assert.ok(has(m,'operations.materials[0].path'));
  a.path='materials/cover.jpg';a.version='old';assert.ok(has(m,'operations.materials[0].version'));a.version=m.project.version;
  a.constraints.minBytes=90000;assert.ok(has(m,'operations.materials[0].constraints'));delete a.constraints.minBytes;
  a.constraints.codec='guess';assert.ok(has(m,'operations.materials[0].constraints.codec'));delete a.constraints.codec;
  a.constraints.maxDurationSeconds=30;assert.ok(has(m,'operations.materials[0].constraints'));
  delete a.constraints.maxDurationSeconds;a.contentReview='reviewed';assert.ok(has(m,'operations.materials[0].contentNotes'));
});

test('real JPEG bytes/dimensions and configurable limits are checked without modification',{skip:!pillow},t=>{
  const dir=workspace(t);image(dir);const m=complete(),a=media(m,'cover.jpg'),before=fs.readFileSync(path.join(dir,'cover.jpg'));
  let r=inspect(dir,m);assert.equal(r.status,0,r.stderr);assert.equal(r.report.files[0].width,650);assert.equal(r.report.files[0].format,'JPEG');
  assert.ok(r.report.warnings.some(x=>x.path.endsWith('contentReview')));assert.deepEqual(fs.readFileSync(path.join(dir,'cover.jpg')),before);
  a.constraints.maxBytes=10;r=inspect(dir,m);assert.equal(r.status,1);assert.ok(r.report.errors.some(x=>x.path.endsWith('.bytes')));
  a.constraints.maxBytes=80000;a.path='small.png';r=inspect(dir,m);assert.equal(r.status,1);for(const key of ['format','width','height'])assert.ok(r.report.errors.some(x=>x.path.endsWith('.'+key)));
  a.path='cover.jpg';a.constraints={formats:[],checkedAt:'',provenance:''};r=inspect(dir,m);assert.equal(r.status,0);assert.ok(r.report.warnings.some(x=>x.message.includes('未检查未配置规则')));
});

test('invalid media and symlink escapes fail before opening outside the manifest directory',{skip:!pillow},t=>{
  const dir=workspace(t);image(dir);const child=path.join(dir,'local');fs.mkdirSync(child);fs.symlinkSync(path.join(dir,'cover.jpg'),path.join(child,'escape.jpg'));
  const m=complete();media(m,'escape.jpg');let r=inspect(child,m);assert.equal(r.status,1);assert.ok(!r.stdout.includes(dir));assert.ok(!r.report.files[0].width);
  media(m,'../cover.jpg');assert.equal(inspect(child,m).status,1);
  media(m,'bad.jpg');assert.equal(inspect(dir,m).status,1);
  fs.copyFileSync(path.join(dir,'cover.jpg'),path.join(dir,'wrong.png'));media(m,'wrong.png');r=inspect(dir,m);assert.equal(r.status,1);assert.match(r.report.errors[0].message,/扩展名/);
});

test('ffprobe checks actual video duration; absence and fake video never pass',{skip:!video},t=>{
  const dir=workspace(t),r=cp.spawnSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=green:s=320x240:d=1','-c:v','libx264','-pix_fmt','yuv420p',path.join(dir,'demo.mp4')],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  const m=complete(),a=media(m,'demo.mp4','promotion-video');a.constraints={formats:['MP4'],width:320,height:240,maxBytes:100000,maxDurationSeconds:2,checkedAt:'2026-01-01',provenance:'合成测试规格'};
  let checked=inspect(dir,m);assert.equal(checked.status,0,checked.stderr);assert.ok(checked.report.files[0].durationSeconds>=1);
  a.constraints.maxDurationSeconds=.5;checked=inspect(dir,m);assert.equal(checked.status,1);assert.ok(checked.report.errors.some(x=>x.path.endsWith('durationSeconds')));
  a.constraints.maxDurationSeconds=2;checked=inspect(dir,m,'--ffprobe','/unavailable/launch-kit-ffprobe');assert.equal(checked.status,1);assert.match(checked.report.errors[0].message,/未检查视频/);
  fs.writeFileSync(path.join(dir,'fake.mp4'),'not video');a.path='fake.mp4';assert.equal(inspect(dir,m).status,1);
});
