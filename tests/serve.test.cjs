'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),cp=require('node:child_process');
const {root}=require('./helpers.cjs');
test('local server redirects the entry point, resolves all page scripts, and excludes private files',async t=>{
  const child=cp.spawn(process.execPath,[path.join(root,'scripts/serve.cjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
  t.after(()=>child.kill());
  const base=await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{child.kill();reject(Error('server startup timed out'));},5000);
    child.once('error',e=>{clearTimeout(timeout);reject(e);});
    child.once('exit',code=>{clearTimeout(timeout);reject(Error('server exited '+code));});
    child.stdout.on('data',data=>{const match=String(data).match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timeout);resolve(match[0]);}});
  });
  const redirect=await fetch(base+'/',{redirect:'manual'});assert.equal(redirect.status,302);assert.equal(redirect.headers.get('location'),'/web/index.html');
  const page=await fetch(base+'/');assert.equal(page.status,200);assert.equal(page.url,base+'/web/index.html');
  const html=await page.text(),sources=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(x=>x[1]);assert.ok(sources.length>=2);
  for(const source of sources){const response=await fetch(new URL(source,page.url));assert.equal(response.status,200,source);assert.match(response.headers.get('content-type'),/javascript/);}
  assert.equal((await fetch(base+'/favicon.ico')).status,204);
  for(const privatePath of ['/examples/minigame.json','/.local/private.json','/package.json','/../README.md'])assert.equal((await fetch(base+privatePath)).status,404);
});
