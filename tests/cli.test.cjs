'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {workspace,example,save,cli}=require('./helpers.cjs');

test('CLI init creates both types, rejects overwrite, and validates strict warnings',t=>{
  const dir=workspace(t),file=path.join(dir,'manifest.json');assert.equal(cli('init',file,'--kind','miniprogram').status,0);
  assert.equal(JSON.parse(fs.readFileSync(file)).project.kind,'miniprogram');const before=fs.readFileSync(file);
  assert.equal(cli('init',file).status,2);assert.deepEqual(fs.readFileSync(file),before);
  const m=save(dir,example(),'example.json');assert.equal(cli('validate',m).status,0);assert.equal(cli('validate',m,'--strict').status,1);
  const out=cli('validate',m,'--json');assert.equal(JSON.parse(out.stdout).errors.length,0);
});

test('CLI generates six local outputs, escapes HTML, and preserves manifest and external stage',t=>{
  const dir=workspace(t),m=example();m.project.intro='</textarea><img src=x onerror="alert(1)"><script>injected()</script> & 内容';
  Object.assign(m.release,{stage:'submitted',version:m.project.version,evidenceType:'user-report',evidence:'用户说审核中',observedAt:'2026-01-01'});
  const file=save(dir,m),out=path.join(dir,'output'),r=cli('generate',file,'--out',out);assert.equal(r.status,0,r.stderr);
  assert.equal(fs.readdirSync(out).length,6);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out,'manifest.snapshot.json'))),m);
  const html=fs.readFileSync(path.join(out,'copy-fields.html'),'utf8');assert.ok(!html.includes('<img src=x'));assert.ok(!html.includes('<script>injected'));
  assert.ok(html.includes('&lt;/textarea&gt;&lt;img'));assert.ok(html.includes('已提交／审核中'));
  assert.equal(JSON.parse(fs.readFileSync(path.join(out,'validation.json'))).errors.length,0);
  fs.writeFileSync(path.join(out,'keep.txt'),'keep');assert.equal(cli('generate',file,'--out',out).status,2);
  assert.equal(cli('generate',file,'--out',out,'--force').status,0);assert.equal(fs.readFileSync(path.join(out,'keep.txt'),'utf8'),'keep');
});

test('incomplete drafts require explicit --draft and still return a failure status',t=>{
  const dir=workspace(t),m=example();m.project.name='';const file=save(dir,m),out=path.join(dir,'out');
  assert.equal(cli('generate',file,'--out',out).status,2);assert.ok(!fs.existsSync(out));
  assert.equal(cli('generate',file,'--out',out,'--draft').status,1);assert.match(fs.readFileSync(path.join(out,'submission.txt'),'utf8'),/错误 project.name/);
  m.privacy.thirdParties=[null];const broken=save(dir,m,'broken.json');assert.equal(cli('generate',broken,'--out',path.join(dir,'broken'),'--draft').status,2);
});

test('--force rejects dangling symlinks, existing symlinks and hardlinks before writing',t=>{
  const dir=workspace(t),file=save(dir,example()),outside=path.join(dir,'outside.txt');
  for(const type of ['dangling','symlink','hardlink']){
    const out=path.join(dir,type);fs.mkdirSync(out);const victim=path.join(dir,type+'-victim');
    if(type!=='dangling')fs.writeFileSync(victim,'unchanged');
    if(type==='hardlink')fs.linkSync(victim,path.join(out,'copy-fields.html'));else fs.symlinkSync(victim,path.join(out,'copy-fields.html'));
    const r=cli('generate',file,'--out',out,'--force');assert.equal(r.status,2,r.stderr);
    assert.ok(!fs.existsSync(path.join(out,'submission.md')),'preflight must happen before writing any output');
    if(type==='dangling')assert.ok(!fs.existsSync(victim));else assert.equal(fs.readFileSync(victim,'utf8'),'unchanged');
  }
  fs.mkdirSync(outside);fs.symlinkSync(outside,path.join(dir,'linked-dir'));assert.equal(cli('generate',file,'--out',path.join(dir,'linked-dir'),'--force').status,2);assert.deepEqual(fs.readdirSync(outside),[]);
});

test('source audit emits relative metadata only, skips escapes, and does not modify sources',t=>{
  const dir=workspace(t),source=path.join(dir,'source');fs.mkdirSync(source);
  const body='const privateValue="PRIVATE_SENTINEL_FOR_TEST";\nwx.getStorageSync("record");\nwx["request"]({url:"https://example.com/private-path"});\nfetch("https://example.com");\n';
  fs.writeFileSync(path.join(source,'main.js'),body);fs.writeFileSync(path.join(source,'.env'),'PRIVATE_ENV_SENTINEL');
  fs.mkdirSync(path.join(source,'node_modules'));fs.writeFileSync(path.join(source,'node_modules','sdk.js'),'wx.getLocation()');
  const external=path.join(dir,'outside.js');fs.writeFileSync(external,'wx.chooseAddress()');fs.symlinkSync(external,path.join(source,'escape.js'));
  fs.mkdirSync(path.join(dir,'external'));fs.writeFileSync(path.join(dir,'external','hidden.js'),'wx.getUserInfo()');fs.symlinkSync(path.join(dir,'external'),path.join(source,'escape-dir'));
  const out=path.join(dir,'audit.json'),r=cli('audit-source',source,'--out',out);assert.equal(r.status,0,r.stderr);
  const text=fs.readFileSync(out,'utf8'),report=JSON.parse(text);
  for(const forbidden of [source,dir,'PRIVATE_SENTINEL_FOR_TEST','PRIVATE_ENV_SENTINEL','private-path','chooseAddress','getUserInfo'])assert.ok(!text.includes(forbidden),forbidden);
  assert.deepEqual(report.files.map(x=>x.path),['main.js']);assert.deepEqual(report.candidates.map(x=>x.api),['wx.getStorageSync','wx.request','fetch']);
  assert.equal(report.files[0].sha256,crypto.createHash('sha256').update(body).digest('hex'));assert.equal(fs.readFileSync(path.join(source,'main.js'),'utf8'),body);
  assert.ok(report.skipped.some(x=>x.path==='escape-dir'&&x.reason==='symlink'));assert.equal(cli('audit-source',source,'--out',out).status,2);
});
