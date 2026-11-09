'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),port=Number(process.env.PORT||4173);
const allow=new Set(['/web/index.html','/web/app.js','/lib/core.js']);
const server=http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400).end();return;}
  if(name==='/'){res.writeHead(302,{Location:'/web/index.html'}).end();return;}
  if(name==='/favicon.ico'){res.writeHead(204).end();return;}
  if(!allow.has(name)){res.writeHead(404).end('Not found');return;}
  res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  fs.createReadStream(path.join(root,name)).pipe(res);
});
server.listen(port,'127.0.0.1',()=>console.log(`本地资料工作台：http://127.0.0.1:${server.address().port}（Ctrl+C 停止；不会提供本机其他文件）`));
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
