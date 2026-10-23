import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{load}=require('./tooling/node_modules/cheerio');
const exec=promisify(execFile),root=path.resolve('dist'),raw=path.resolve('outputs/migration/raw');
const read=async n=>JSON.parse(await fs.readFile(path.join(raw,n+'.json'),'utf8'));
const [posts,pages,categories,users,tags,media,oldAuthors]=await Promise.all(['posts','pages','categories','users','tags','media'].map(read).concat(fs.readFile('dist/authors.json','utf8').then(JSON.parse)));
let comments=[];try{comments=await read('comments')}catch{}
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const text=html=>{const d=load('<body>'+html+'</body>');d('script,style,noscript,svg').remove();return d('body').text().replace(/\s+/g,' ').trim()};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
await fs.mkdir(path.join(root,'assets/imported'),{recursive:true});
await fs.mkdir(path.join(root,'data/sermons'),{recursive:true});await fs.mkdir(path.join(root,'data/pages'),{recursive:true});
const assets=new Map(),assetFailures=[],assetRecords=[];
async function download(url,id){
 let parsed;try{parsed=new URL(url)}catch{return null}if(!['https:','http:'].includes(parsed.protocol))return null;
 const clean=decodeURIComponent(parsed.pathname.split('/').pop()).replace(/[^\p{L}\p{N}._-]/gu,'-');
 const local='assets/imported/'+id+'-'+clean,dest=path.join(root,local);
 try{const st=await fs.stat(dest);if(st.size>0){assets.set(url,local);return local}}catch{}
 try{await exec('curl.exe',['--fail','-L','-s','--max-time','60','--retry','1',url,'-o',dest]);const st=await fs.stat(dest);if(st.size<100)throw new Error('Empty asset');assets.set(url,local);return local}catch(e){assetFailures.push({url,message:'Arquivo indisponível na origem',replacement:url.includes('Pr.-Abram-deGraaf')?'Foto atual de Abram de Graaf, já presente no acervo':null});if(url.includes('Pr.-Abram-deGraaf'))assets.set(url,'assets/pastor-1.jpg');return null}
}
for(let i=0;i<media.length;i+=3){await Promise.all(media.slice(i,i+3).map(async m=>{const p=await download(m.source_url,m.id);if(p){assetRecords.push({id:m.id,source:m.source_url,path:p});for(const size of Object.values(m.media_details?.sizes||{}))if(size.source_url)assets.set(size.source_url,p)}}));}
function localAsset(url){
 if(assets.has(url))return assets.get(url);
 if(url.includes('Pr.-Abram-deGraaf'))return 'assets/pastor-1.jpg';
 let name;try{name=decodeURIComponent(new URL(url).pathname.split('/').pop())}catch{return url}
 const original=media.find(m=>{const n=decodeURIComponent(new URL(m.source_url).pathname.split('/').pop()).replace(/\.[^.]+$/,'');return name.startsWith(n+'-')||name===n+'.jpg'});
 return original?assets.get(original.source_url)||url:url;
}
const catById=new Map(categories.map(c=>[c.id,c])),tagById=new Map(tags.map(t=>[t.id,t]));
const authorById=new Map();
for(const u of users){
 let old=oldAuthors.find(a=>normalize(a.name)===normalize(u.name));
 if(!old)old=oldAuthors.find(a=>({2:'Jim Witteveen',7:'Iraldo Luna',37:'Elienai Batista'}[u.id])===a.name);
 const relevant=posts.filter(p=>p.author===u.id),sample=relevant.find(p=>p.content.rendered.includes('image.default'));
 const $=load(sample?.content.rendered||'');
 const photo=old?.photo||localAsset($('[data-widget_type="image.default"] img').first().attr('src')||'');
 const bioWidget=$('[data-widget_type="image.default"]').first().nextAll('[data-widget_type="text-editor.default"]').first();
 const bios=$('[data-widget_type="text-editor.default"]').toArray().slice(1).map(x=>$(x).html()).filter(x=>x&&!text(x).startsWith('©'));
 const a={id:String(u.id),slug:u.slug,name:old?.name||u.name,church:old?.church||'',photo:photo||null,source:old?.source||u.link,bio:bios[0]||u.description||'',count:relevant.length,social:[]};
 $('[data-widget_type="social-icons.default"] a').each((i,x)=>{const href=$(x).attr('href');if(/^https?:/.test(href||'')&&href!=='https://todaescritura.org/')a.social.push({url:href,label:$(x).text().trim()||new URL(href).hostname})});
 authorById.set(u.id,a);
}
const routes=new Map();
for(const p of posts)routes.set(new URL(p.link).pathname,'/#sermao/'+p.slug);
for(const u of users)routes.set(new URL(u.link).pathname,'/#autor/'+u.id);
const leaf=c=>categories.find(x=>x.slug===c.replace(/-2$/,''))||categories.find(x=>normalize(x.name)===normalize(c));
for(const p of pages){
 let route='/#pagina/'+p.slug;
 const c=leaf(p.slug),a=[...authorById.values()].find(a=>new URL(a.source).pathname.replace(/\/$/,'')===new URL(p.link).pathname.replace(/\/$/,''));
 if(c)route='/#categoria/'+c.slug;
 if(a)route='/#autor/'+a.id;
 if(p.slug==='home')route='/#inicio';if(p.slug==='autores')route='/#pastores';
 routes.set(new URL(p.link).pathname,route);p.newRoute=route;
}
for(const c of categories)routes.set(new URL(c.link).pathname,'/#categoria/'+c.slug);
for(const t of tags)routes.set(new URL(t.link).pathname,'/#tema/'+t.slug);
// Nine public WordPress URLs are shared by a post and a page. Keep sermon links
// unambiguous; the rebuilt book/day navigation always uses taxonomy routes.
for(const p of posts)routes.set(new URL(p.link).pathname,'/#sermao/'+p.slug);
function internal(url){
 if(!url)return '';if(url.startsWith('#'))return url;
 let u;try{u=new URL(url,'https://todaescritura.org')}catch{return ''}
 if(!['https:','http:','mailto:','tel:'].includes(u.protocol))return '';
 if(u.hostname==='todaescritura.org'){
  if(u.searchParams.get('p')){const p=posts.find(x=>x.id===Number(u.searchParams.get('p')));if(p)return '/#sermao/'+p.slug}
  const found=routes.get(u.pathname)||routes.get(u.pathname.endsWith('/')?u.pathname.slice(0,-1):u.pathname+'/');
  if(found)return found;
  if(u.pathname==='/')return '/#inicio';
  if(u.pathname.includes('/wp-content/uploads/')){const asset=localAsset(u.href);return /^https?:/.test(asset)?asset:'/'+asset;}
 }
 return u.href;
}
function sanitize(html){
 const $=load('<main>'+html+'</main>',null,false);
 $('script,style,svg,noscript,form,input,select,textarea,button').remove();
 const allowed=new Set('p br strong b em i u s a ul ol li blockquote h1 h2 h3 h4 h5 h6 img figure figcaption table thead tbody tr th td hr audio video source iframe sub sup pre code'.split(' '));
 $('*').toArray().reverse().forEach(el=>{const t=el.tagName;if(!allowed.has(t)&&t!=='main')$(el).replaceWith($(el).contents());});
 $('*').each((i,el)=>{
  const keep={};for(const name of ['href','src','alt','title','colspan','rowspan','id','name'])if($(el).attr(name))keep[name]=$(el).attr(name);
  for(const attr of Object.keys(el.attribs||{}))$(el).removeAttr(attr);
  for(const [k,v]of Object.entries(keep)){
   if(k==='href'){$(el).attr(k,internal(v));if(/^https?:/.test(internal(v)))$(el).attr({target:'_blank',rel:'noopener noreferrer'})}
   else if(k==='src'){if(/^https?:/.test(v)){const asset=localAsset(v);$(el).attr(k,/^https?:/.test(asset)?asset:'/'+asset)}else if(v.startsWith('/'))$(el).attr(k,v);}
   else if(k==='id'||k==='name'){if(/^[A-Za-z_][A-Za-z0-9_:.-]*$/.test(v))$(el).attr(k,v)}else $(el).attr(k,v);
  }
  if(el.tagName==='img')$(el).attr('loading','lazy');if(['audio','video'].includes(el.tagName))$(el).attr('controls','');
  if(el.tagName==='iframe'){const src=keep.src||'';if(!/^https:\/\/(www\.)?(youtube(-nocookie)?\.com|player\.vimeo\.com)\//.test(src))$(el).remove();else $(el).attr({src,loading:'lazy',title:'Vídeo do sermão',allowfullscreen:''})}
 });
 return $('main').html()||'';
}
const catalog=[],integrity=[],allLinks=new Set();
for(const p of posts){
 const $=load(p.content.rendered);let blocks=$('[data-widget_type="text-editor.default"]').toArray().map(x=>$(x).find('.elementor-widget-container').first().html()||$(x).html());
 if(!blocks.length)blocks=[$('body').html()||p.content.rendered];
 const originalText=blocks.map(text).join(' '),safe=sanitize(blocks.join('\n'));
 if(text(safe)!==text(blocks.join('\n'))){const before=text(blocks.join('\n')),after=text(safe);let pos=0;while(before[pos]===after[pos]&&pos<before.length)pos++;console.log({id:p.id,before:before.slice(Math.max(0,pos-80),pos+250),after:after.slice(Math.max(0,pos-80),pos+250)});throw new Error('Text preservation failed for '+p.id);}
 const primary=text(blocks[0]),cats=p.categories.map(id=>catById.get(id)).filter(Boolean),main=cats.find(c=>c.parent===0&&c.id!==1)||cats[0];
 const book=cats.find(c=>c.parent!==0),a=authorById.get(p.author),title=text(p.title.rendered)||'Sem título no original';
 const excerpt=text(p.excerpt.rendered).replace(/\[\u2026\]|\[\.\.\.\]/g,'').trim();
 const words=primary.split(/\s+/).filter(Boolean).length;
 const list={id:String(p.id),slug:p.slug,title,source:p.link,date:p.date,modified:p.modified,authorId:String(p.author),author:a?.name||'Autor não informado',photo:a?.photo||null,category:main?.name||'Outros',categorySlug:main?.slug||'blog',categoryIds:p.categories,book:book?.name||'',bookSlug:book?.slug||'',tags:p.tags.map(id=>tagById.get(id)?.name).filter(Boolean),tagSlugs:p.tags.map(id=>tagById.get(id)?.slug).filter(Boolean),description:(excerpt||primary).slice(0,260),minutes:Math.max(1,Math.ceil(words/200)),words};
 const sourceLinks=[];$('a[href]').each((i,x)=>{const url=$(x).attr('href');if(url&&url!=='#'&&!url.startsWith('javascript:')){allLinks.add(url);sourceLinks.push({url:internal(url),label:$(x).text().trim()||'Link do acervo original'})}});
 const sermon={...list,html:safe,links:[...new Map(sourceLinks.map(x=>[x.url,x])).values()],comments:comments.filter(c=>c.post===p.id).map(c=>({id:c.id,author:c.author_name,date:c.date,html:sanitize(c.content.rendered)})),originalTextHash:crypto.createHash('sha256').update(originalText).digest('hex')};
 await fs.writeFile(path.join(root,'data/sermons',p.id+'.json'),JSON.stringify(sermon));
 catalog.push(list);integrity.push({id:p.id,slug:p.slug,words,contentPreserved:true,sha256:sermon.originalTextHash});
}
const pageIndex=[];
for(const p of pages){
 const $=load(p.content.rendered),special=p.newRoute.startsWith('/#pagina/');
 const blocks=[];$('[data-widget_type="text-editor.default"],[data-widget_type="heading.default"],[data-widget_type="image.default"],[data-widget_type="html.default"]').each((i,el)=>{if($(el).parents('[data-widget_type]').length)return;blocks.push($(el).html()||'')});
 let html=sanitize(blocks.join('\n')||p.content.rendered);
 const links=[];$('a[href]').each((i,x)=>{const url=$(x).attr('href');if(url&&url!=='#'&&!url.startsWith('javascript:'))links.push({url:internal(url),label:$(x).text().trim()||'Abrir link'})});
 const forms=$('form').map((i,el)=>({action:$(el).attr('action')||'',fields:$(el).find('input:not([type=hidden]),select,textarea').map((i,x)=>({name:$(x).attr('name'),type:$(x).attr('type')||x.tagName})).get()})).get();
 const entry={id:String(p.id),slug:p.slug,title:text(p.title.rendered),source:p.link,route:p.newRoute,html,links:[...new Map(links.map(x=>[x.url,x])).values()],forms,empty:!text(html)};
 await fs.writeFile(path.join(root,'data/pages',p.slug+'.json'),JSON.stringify(entry));
 pageIndex.push({id:entry.id,slug:entry.slug,title:entry.title,source:entry.source,route:entry.route,empty:entry.empty,forms:forms.length});
}
for(const a of authorById.values())a.bio=sanitize(a.bio);
await fs.writeFile(path.join(root,'authors.json'),JSON.stringify([...authorById.values()]));
await fs.writeFile(path.join(root,'data/catalog.json'),JSON.stringify({sermons:catalog,categories:categories.map(c=>({id:c.id,name:c.name,slug:c.slug,parent:c.parent,count:catalog.filter(p=>p.categoryIds.includes(c.id)).length,source:c.link})),tags:tags.map(t=>({id:t.id,name:t.name,slug:t.slug,count:t.count})),pages:pageIndex,importedAt:new Date().toISOString()}));
const siteOrigin='https://sermoes-reformados.chatpro133.chatgpt.site';
function shell(title,desc,body,canonical){return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} — Sermões Reformados</title><meta name="description" content="${escape(desc.slice(0,160))}"><link rel="canonical" href="${siteOrigin+canonical}"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/refinements.css"><link rel="stylesheet" href="/migration.css"><link rel="stylesheet" href="/natural-design.css"><link rel="stylesheet" href="/minimal-design.css"><link rel="stylesheet" href="/editorial.css"></head><body class="standalone"><header><a class="brand" href="/">✝ Sermões Reformados</a><nav><a href="/#biblioteca">Biblioteca</a><a href="/#pastores">Autores</a><a href="/#confessionalidade">Confessionalidade</a></nav><a href="/#biblioteca" class="outline">Explorar acervo ↗</a></header><main class="standalone-main">${body}</main><footer><a href="/">Sermões Reformados</a><span>Acervo migrado do Toda Escritura · Autorias e textos preservados.</span></footer></body></html>`}
for(const s of catalog){const sermon=JSON.parse(await fs.readFile(path.join(root,'data/sermons',s.id+'.json'),'utf8'));const dir=path.join(root,'sermoes',s.slug);await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'index.html'),shell(s.title,s.description,`<a class="back-link" href="/#biblioteca">← Voltar à biblioteca</a><article class="sermon-body"><div class="eyebrow">${escape(s.category)}${s.book?' / '+escape(s.book):''}</div><h1>${escape(s.title)}</h1><p class="sermon-byline"><a href="/#autor/${s.authorId}">${escape(s.author)}</a> · ${s.date.slice(0,10).split('-').reverse().join('/')} · ${s.minutes} min de leitura</p><div class="original-sermon">${sermon.html}</div><p class="source-note"><a href="${s.source}" target="_blank" rel="noopener noreferrer">Publicação original no Toda Escritura ↗</a></p></article><div class="print-tools"><button onclick="window.print()">Imprimir / salvar PDF</button><a href="/#sermao/${s.slug}">Abrir leitor com ajustes de fonte ↗</a></div>`, '/sermoes/'+s.slug+'/'));}
for(const p of pageIndex){const entry=JSON.parse(await fs.readFile(path.join(root,'data/pages',p.slug+'.json'),'utf8'));let body=p.route.startsWith('/#pagina/')?entry.html:`<p>Esta página está disponível na nova navegação do acervo.</p><a class="solid" href="${p.route}">Explorar ${escape(p.title)} ↗</a>`;if(entry.forms.length)body+=`<div class="original-form"><h2>Envie pelo canal original do acervo</h2><p>O recebimento de arquivos continua no formulário do Toda Escritura.</p><a class="solid" href="${p.source}" target="_blank" rel="noopener noreferrer">Abrir formulário de envio ↗</a></div>`;const dir=path.join(root,'paginas',p.slug);await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'index.html'),shell(p.title,text(body),`<a class="back-link" href="/">← Voltar ao início</a><article><h1>${escape(p.title)}</h1>${body}</article>`, '/paginas/'+p.slug+'/'));}
await fs.writeFile(path.join(root,'paginas/index.html'),shell('Todas as páginas do acervo','Índice das 160 páginas importadas do Toda Escritura.',`<a class="back-link" href="/">← Voltar ao início</a><article><div class="eyebrow">ARQUIVO COMPLETO</div><h1>Todas as páginas do acervo</h1><p>160 páginas preservadas e organizadas na nova navegação.</p><ul class="all-pages">${pageIndex.sort((a,b)=>a.title.localeCompare(b.title,'pt-BR',{numeric:true})).map(p=>`<li><a href="${p.route}">${escape(p.title)}</a> <a class="source-link" href="/paginas/${p.slug}/">Página permanente ↗</a></li>`).join('')}</ul></article>`,'/paginas/'));
const sitemapPosts=await fs.readFile(path.join(raw,'wp-sitemap-posts-post-1.xml'),'utf8'),sitemapPages=await fs.readFile(path.join(raw,'wp-sitemap-posts-page-1.xml'),'utf8');
const locs=s=>[...s.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);
const missingPosts=locs(sitemapPosts).filter(u=>!posts.some(p=>p.link===u)),missingPages=locs(sitemapPages).filter(u=>!pages.some(p=>p.link===u));
const report={source:'https://todaescritura.org/',importedAt:new Date().toISOString(),posts:{expected:647,imported:catalog.length,sitemap:locs(sitemapPosts).length,missing:missingPosts,textPreserved:integrity.every(x=>x.contentPreserved)},pages:{imported:pageIndex.length,sitemap:locs(sitemapPages).length,missing:missingPages,emptyInOriginal:pageIndex.filter(p=>p.empty)},authors:users.length,categories:categories.length,tags:tags.length,comments:comments.length,media:{apiReported:94,publicRecords:media.length,downloaded:assetRecords.length,failures:assetFailures},forms:{localSubmission:false,originalSubmissionUrl:'https://todaescritura.org/envia-sermao/',drive:'https://drive.google.com/drive/folders/1B7mJcp4b1oKlrLhOIV6iygFFBTgR_h5s?usp=sharing'},integrity};
await fs.writeFile('outputs/migration/report.json',JSON.stringify(report,null,2));await fs.writeFile(path.join(root,'data/migration-summary.json'),JSON.stringify({...report,integrity:undefined},null,2));
await fs.writeFile(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/',...catalog.map(s=>'/sermoes/'+s.slug+'/'),...pageIndex.map(p=>'/paginas/'+p.slug+'/')].map(u=>'<url><loc>'+siteOrigin+u+'</loc></url>').join('')+'</urlset>');
await fs.writeFile(path.join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+siteOrigin+'/sitemap.xml\n');
console.log(JSON.stringify({...report,integrity:undefined},null,2));
