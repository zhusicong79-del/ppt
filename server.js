import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
const port=Number(process.env.PORT||3000), sessions=new Map();
const users=[['demo@smartx.com','SmartX 演示组织'],['demo@partner.com','合作伙伴演示组织']].map(([email,tenant],i)=>({email,tenant,id:String(i+1),hash:scryptSync('Demo2026!',email,64)}));
const blocks=[{id:'intro',category:'产品介绍',title:'让 IT 更简单，让业务更敏捷',tag:'SMTX OS',body:'以软件定义基础设施，构建稳定、易用、高性能的企业云。',type:'hero'},{id:'platform',category:'产品介绍',title:'从基础设施到云原生，一体化演进',tag:'产品能力',body:'超融合架构 · 分布式存储 · 企业级虚拟化 · Kubernetes 管理',type:'features'},{id:'finance',category:'客户案例',title:'金融行业｜关键业务的坚实底座',tag:'行业解决方案',body:'案例演示：整合分散的 IT 资源，以高可用架构支持核心业务，简化运维与扩容。数据仅为演示。',type:'case'},{id:'value',category:'解决方案',title:'以更少的复杂性，创造更多价值',tag:'业务价值',body:'统一管理资源，按需弹性扩展，以开放架构支持业务持续创新。',type:'features'},{id:'closing',category:'品牌素材',title:'开启企业云的下一步',tag:'SMARTX',body:'与您的团队一起，探索适合业务的基础设施方案。',type:'hero'}];
const files=[
{id:'drive-1',name:'SMTX OS 产品介绍.pptx',modified:'2026-10-10',category:'产品介绍',folder:'产品与技术',slides:[blocks[0],blocks[1],{id:'architecture',category:'产品介绍',title:'软件定义的企业云架构',tag:'SMTX OS · 架构',body:'计算与存储融合部署\n分布式架构，支持按需扩容\n统一管理资源与业务负载',type:'features'},blocks[4]]},
{id:'drive-2',name:'金融行业客户案例.pptx',modified:'2026-10-09',category:'客户案例',folder:'行业案例',slides:[{...blocks[2],title:'金融行业数字化基础设施',type:'hero'},blocks[2],{id:'finance-value',category:'客户案例',title:'从资源整合到业务连续性',tag:'金融案例 · 演示',body:'整合分散的业务资源\n简化日常运维与资源交付\n通过高可用设计支持业务连续性',type:'features'}]},
{id:'drive-3',name:'企业云解决方案.pptx',modified:'2026-10-08',category:'解决方案',folder:'解决方案',slides:[{...blocks[0],title:'面向业务的企业云方案',tag:'企业云解决方案'},blocks[3],{id:'roadmap',category:'解决方案',title:'分阶段，稳步演进',tag:'实施路径',body:'第一阶段：梳理应用与基础设施需求\n第二阶段：验证架构与迁移路径\n第三阶段：逐步上线与持续优化',type:'features'},blocks[4]]}
].map(f=>({...f,pages:f.slides.length,slides:f.slides.map((s,i)=>({...s,id:f.id+'-page-'+i,source:{fileId:f.id,fileName:f.name,page:i+1},template:'smartx-demo'}))}));
const customers=[{id:'c1',name:'远景金融集团',industry:'金融',owner:'陈经理',stage:'方案评估'},{id:'c2',name:'星河制造',industry:'制造',owner:'李经理',stage:'需求确认'},{id:'c3',name:'云帆科技',industry:'科技',owner:'王经理',stage:'技术验证'}];
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
async function body(req){let s='';for await(const c of req){s+=c;if(s.length>1000000)throw Error('请求过大');}return JSON.parse(s||'{}');}
export const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/')){
if(url.pathname==='/api/login'&&req.method==='POST'){const d=await body(req),u=users.find(x=>x.email===d.email);if(!u||!timingSafeEqual(u.hash,scryptSync(String(d.password||''),u.email,64)))return json(res,401,{error:'账号或密码不正确'});const token=randomBytes(32).toString('hex');sessions.set(token,{user:u,expires:Date.now()+86400000});res.setHeader('Set-Cookie',`session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);return json(res,200,{email:u.email,tenant:u.tenant});}
const token=req.headers.cookie?.match(/(?:^|; )session=([a-f0-9]+)/)?.[1],session=sessions.get(token);if(!session||session.expires<Date.now())return json(res,401,{error:'请先登录'});const u=session.user;
if(req.method==='POST'&&req.headers.origin&&!['http://'+req.headers.host,'https://'+req.headers.host].includes(req.headers.origin))return json(res,403,{error:'不允许跨站请求'});
if(url.pathname==='/api/logout'){sessions.delete(token);res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,200,{ok:true});}
if(url.pathname==='/api/me')return json(res,200,{email:u.email,tenant:u.tenant});
if(url.pathname==='/api/blocks')return json(res,200,blocks);
if(url.pathname==='/api/drive')return json(res,200,{mode:'demo',connected:false,files});
if(url.pathname==='/api/generate'&&req.method==='POST'){
const d=await body(req);if(typeof d.prompt!=='string'||!d.prompt.trim()||d.prompt.length>5000||!['hero','features','case'].includes(d.layout))return json(res,400,{error:'请填写 1–5000 字的描述并选择版式'});
const lines=d.prompt.trim().split(/[\n。；]/).map(x=>x.trim()).filter(Boolean);const title=(typeof d.title==='string'&&d.title.trim()?d.title.trim():lines[0]).slice(0,80);
return json(res,200,{mode:'template',slides:[{id:randomBytes(8).toString('hex'),title,tag:d.customer?'客户专属方案':'自定义内容',body:lines.join('\n'),type:d.layout,category:'生成页面',template:'smartx-demo',generated:true}]});}

if(url.pathname==='/api/crm')return json(res,200,{mode:'demo',customers});
if(url.pathname==='/api/deck'){const path=new URL(`./.data/tenant-${u.id}.json`,import.meta.url);if(req.method==='GET'){try{return json(res,200,JSON.parse(await readFile(path,'utf8')));}catch(e){if(e.code==='ENOENT')return json(res,200,{title:'企业云解决方案',slides:blocks.slice(0,3),customer:null});throw e;}}if(req.method==='POST'){const d=await body(req);if(typeof d.title!=='string'||!Array.isArray(d.slides)||d.slides.length>100||d.slides.some(s=>typeof s.title!=='string'||typeof s.body!=='string'||!['hero','features','case'].includes(s.type)))return json(res,400,{error:'演示文稿格式不正确'});await mkdir(new URL('./.data/',import.meta.url),{recursive:true});await writeFile(path,JSON.stringify(d));return json(res,200,{ok:true});}}
return json(res,404,{error:'接口不存在'});}
const routes={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};if(!routes[url.pathname]){res.writeHead(404);return res.end('Not found');}const file=routes[url.pathname];res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(await readFile(new URL('./public/'+file,import.meta.url)));}catch(e){json(res,500,{error:'操作失败，请重试'});}});
if(process.argv[1]?.endsWith('server.js'))server.listen(port,'0.0.0.0',()=>console.log(`Content Studio listening on ${port}`));
