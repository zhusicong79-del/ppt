import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
const port=Number(process.env.PORT||3000), sessions=new Map();
const users=[['demo@smartx.com','SmartX 演示组织'],['demo@partner.com','合作伙伴演示组织']].map(([email,tenant],i)=>({email,tenant,id:String(i+1),hash:scryptSync('Demo2026!',email,64)}));
const blocks=[{id:'intro',category:'产品介绍',title:'让 IT 更简单，让业务更敏捷',tag:'SMTX OS',body:'以软件定义基础设施，构建稳定、易用、高性能的企业云。',type:'hero'},{id:'platform',category:'产品介绍',title:'从基础设施到云原生，一体化演进',tag:'产品能力',body:'超融合架构 · 分布式存储 · 企业级虚拟化 · Kubernetes 管理',type:'features'},{id:'finance',category:'客户案例',title:'金融行业｜关键业务的坚实底座',tag:'行业解决方案',body:'案例演示：整合分散的 IT 资源，以高可用架构支持核心业务，简化运维与扩容。数据仅为演示。',type:'case'},{id:'value',category:'解决方案',title:'以更少的复杂性，创造更多价值',tag:'业务价值',body:'统一管理资源，按需弹性扩展，以开放架构支持业务持续创新。',type:'features'},{id:'closing',category:'品牌素材',title:'开启企业云的下一步',tag:'SMARTX',body:'与您的团队一起，探索适合业务的基础设施方案。',type:'hero'}];
const files=[{id:'drive-1',name:'SMTX OS 产品介绍.pptx',pages:18,modified:'2026-10-10',block:'intro'},{id:'drive-2',name:'金融行业客户案例.pptx',pages:12,modified:'2026-10-09',block:'finance'},{id:'drive-3',name:'企业云解决方案.pptx',pages:24,modified:'2026-10-08',block:'value'}];
const customers=[{id:'c1',name:'远景金融集团',industry:'金融',owner:'陈经理',stage:'方案评估'},{id:'c2',name:'星河制造',industry:'制造',owner:'李经理',stage:'需求确认'},{id:'c3',name:'云帆科技',industry:'科技',owner:'王经理',stage:'技术验证'}];
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
async function body(req){let s='';for await(const c of req){s+=c;if(s.length>1000000)throw Error('请求过大');}return JSON.parse(s||'{}');}
export const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/')){
if(url.pathname==='/api/login'&&req.method==='POST'){const d=await body(req),u=users.find(x=>x.email===d.email);if(!u||!timingSafeEqual(u.hash,scryptSync(String(d.password||''),u.email,64)))return json(res,401,{error:'账号或密码不正确'});const token=randomBytes(32).toString('hex');sessions.set(token,{user:u,expires:Date.now()+86400000});res.setHeader('Set-Cookie',`session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);return json(res,200,{email:u.email,tenant:u.tenant});}
const token=req.headers.cookie?.match(/(?:^|; )session=([a-f0-9]+)/)?.[1],session=sessions.get(token);if(!session||session.expires<Date.now())return json(res,401,{error:'请先登录'});const u=session.user;
if(req.method==='POST'&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return json(res,403,{error:'不允许跨站请求'});
if(url.pathname==='/api/logout'){sessions.delete(token);res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,200,{ok:true});}
if(url.pathname==='/api/me')return json(res,200,{email:u.email,tenant:u.tenant});
if(url.pathname==='/api/blocks')return json(res,200,blocks);
if(url.pathname==='/api/drive')return json(res,200,{mode:'demo',files});
if(url.pathname==='/api/crm')return json(res,200,{mode:'demo',customers});
if(url.pathname==='/api/deck'){const path=new URL(`./.data/tenant-${u.id}.json`,import.meta.url);if(req.method==='GET'){try{return json(res,200,JSON.parse(await readFile(path,'utf8')));}catch(e){if(e.code==='ENOENT')return json(res,200,{title:'企业云解决方案',slides:blocks.slice(0,3),customer:null});throw e;}}if(req.method==='POST'){const d=await body(req);if(typeof d.title!=='string'||!Array.isArray(d.slides)||d.slides.length>100||d.slides.some(s=>typeof s.title!=='string'||typeof s.body!=='string'||!['hero','features','case'].includes(s.type)))return json(res,400,{error:'演示文稿格式不正确'});await mkdir(new URL('./.data/',import.meta.url),{recursive:true});await writeFile(path,JSON.stringify(d));return json(res,200,{ok:true});}}
return json(res,404,{error:'接口不存在'});}
const routes={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};if(!routes[url.pathname]){res.writeHead(404);return res.end('Not found');}const file=routes[url.pathname];res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(await readFile(new URL('./public/'+file,import.meta.url)));}catch(e){json(res,500,{error:'操作失败，请重试'});}});
if(process.argv[1]?.endsWith('server.js'))server.listen(port,'0.0.0.0',()=>console.log(`Content Studio listening on ${port}`));
