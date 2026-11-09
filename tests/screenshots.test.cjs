'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {workspace,example,save,cli}=require('./helpers.cjs');
const python=process.env.PYTHON||'python3';
const available=cp.spawnSync(python,['-c','import PIL'],{encoding:'utf8'}).status===0;
const options={skip:available?false:'Pillow unavailable: install requirements.txt and set PYTHON before release'};
function fixtures(dir){
  const program=`from PIL import Image,PngImagePlugin\nimport pathlib,random,shutil,sys\np=pathlib.Path(sys.argv[1])\nr=random.Random(42)\nim=Image.frombytes('RGB',(144,144),r.randbytes(144*144*3))\nim.save(p/'original.png',compress_level=1)\nshutil.copyfile(p/'original.png',p/'copy.png')\ninfo=PngImagePlugin.PngInfo();info.add_text('fixture','same pixels, different file')\nim.save(p/'reencoded.png',compress_level=9,pnginfo=info)\nImage.new('RGB',(144,144),(10,20,30)).save(p/'icon.png')\nImage.new('RGB',(72,72),(20,30,40)).save(p/'small-icon.png')\n(p/'broken.png').write_bytes(b'invalid image')\nshutil.copyfile(p/'original.png',p/'wrong.jpg')\n`;
  const r=cp.spawnSync(python,['-c',program,dir],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
}
function shot(file,column='scene',extra={}){return {path:file,column,source:'wechat-devtools',version:'1.0.0',description:'合成测试素材，非实际微信截图',...extra};}
function run(dir,m){const r=cli('check-screenshots',save(dir,m),'--python',python,'--json');return {...r,report:r.stdout?JSON.parse(r.stdout):null};}
function lightweight(){const m=example();Object.assign(m.requirements,{minBytes:0,sceneMin:0,gameplayMin:0,systemMin:0,perSystemMin:0,checkedAt:'2026-01-01'});return m;}

test('screenshot check detects renamed files and reencoded identical pixels across columns',options,t=>{
  const dir=workspace(t);fixtures(dir);const m=lightweight();m.screenshots=[shot('original.png'),shot('copy.png','gameplay'),shot('reencoded.png','system',{systemId:'control'})];
  const r=run(dir,m);assert.equal(r.status,1,r.stderr);assert.equal(r.report.errors.length,2);
  assert.match(r.report.errors[0].message,/文件完全重复/);assert.match(r.report.errors[1].message,/解码像素完全重复/);
  const [a,b,c]=r.report.files;assert.equal(a.fileSha256,b.fileSha256);assert.notEqual(a.fileSha256,c.fileSha256);assert.equal(a.pixelSha256,c.pixelSha256);
  m.requirements.duplicatePolicy='warn';const warning=run(dir,m);assert.equal(warning.status,0,warning.stderr);assert.equal(warning.report.warnings.length,2);
});

test('screenshot decoding rejects corrupted content, mislabeled formats and version/source mismatches',options,t=>{
  const dir=workspace(t);fixtures(dir);const m=lightweight();m.screenshots=[shot('broken.png'),shot('wrong.jpg'),shot('original.png','scene',{version:'old'}),shot('copy.png','gameplay',{source:'browser'})];
  const r=run(dir,m);assert.equal(r.status,1,r.stderr);assert.equal(r.report.errors.length,4);
  assert.match(r.report.errors[1].message,/格式不同/);assert.match(r.report.errors[2].message,/版本/);assert.match(r.report.errors[3].message,/来源/);
});

test('screenshot missing paths and directory escapes cannot leak machine paths or read outside manifest',options,t=>{
  const dir=workspace(t);fixtures(dir);const local=path.join(dir,'local');fs.mkdirSync(local);fs.symlinkSync(path.join(dir,'original.png'),path.join(local,'escape.png'));
  const m=lightweight();m.screenshots=[shot('../original.png'),shot('escape.png'),shot('missing.png')];
  const r=run(local,m);assert.equal(r.status,1,r.stderr);assert.equal(r.report.errors.length,3);
  assert.ok(!r.stdout.includes(dir));assert.ok(r.report.files.every(x=>!x.fileSha256));
});

test('miniprogram bypasses game counts but still checks provided images and icon recommendations',options,t=>{
  const dir=workspace(t);fixtures(dir);const m=example('miniprogram');m.project.iconPath='icon.png';
  let r=run(dir,m);assert.equal(r.status,0,r.stderr);assert.equal(r.report.icon.width,144);assert.ok(!r.report.warnings.some(x=>x.path==='project.iconPath'));
  m.project.iconPath='small-icon.png';r=run(dir,m);assert.equal(r.status,0,r.stderr);assert.ok(r.report.warnings.some(x=>x.path==='project.iconPath'));
  m.project.iconPath='../../outside.png';r=run(dir,m);assert.equal(r.status,1,r.stderr);assert.equal(r.report.errors[0].path,'project.iconPath');
  m.project.iconPath='';m.requirements.minBytes=0;m.screenshots=[shot('broken.png')];r=run(dir,m);assert.equal(r.status,1);assert.equal(r.report.errors.length,1);
});

test('valid game image with recorded metadata passes configurable count and byte profile',options,t=>{
  const dir=workspace(t);fixtures(dir);const m=lightweight();m.requirements.sceneMin=1;m.requirements.minBytes=61440;m.screenshots=[shot('original.png')];
  const r=run(dir,m);assert.equal(r.status,0,r.stderr);assert.deepEqual(r.report.errors,[]);assert.equal(r.report.counts.scene,1);
  m.requirements.gameplayMin=1;assert.equal(run(dir,m).status,1);
});
