import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile), base='https://todaescritura.org';
const cache=path.resolve('outputs/migration/raw');await fs.mkdir(cache,{recursive:true});
async function request(url,file){
 const dest=path.join(cache,file),headers=dest+'.headers';
 try{const data=JSON.parse(await fs.readFile(dest,'utf8'));if(Array.isArray(data))return {data,headers:await fs.readFile(headers,'utf8')}}catch{}
 for(let attempt=0;attempt<3;attempt++){
  try{await exec('curl.exe',['--fail','-L','-s','--max-time','90','--retry','1','-D',headers,url,'-o',dest],{maxBuffer:1024*1024});return {data:JSON.parse(await fs.readFile(dest,'utf8')),headers:await fs.readFile(headers,'utf8')}}catch(e){if(attempt===2)throw e;}
 }
}
async function collection(type){
 const first=await request(`${base}/wp-json/wp/v2/${type}?per_page=100&page=1`,`${type}-1.json`);
 if(!Array.isArray(first.data))throw new Error(type+' did not return an array');
 const pages=Number(first.headers.match(/x-wp-totalpages:\s*(\d+)/i)?.[1]||1), total=Number(first.headers.match(/x-wp-total:\s*(\d+)/i)?.[1]||first.data.length);
 const items=[...first.data];
 for(let i=2;i<=pages;i++){const r=await request(`${base}/wp-json/wp/v2/${type}?per_page=100&page=${i}`,`${type}-${i}.json`);items.push(...r.data)}
 if(items.length<total){for(let i=1;i<=Math.ceil(total/25);i++){const r=await request(`${base}/wp-json/wp/v2/${type}?per_page=25&page=${i}`,`${type}-recover25-${i}.json`);for(const x of r.data)if(!items.some(y=>y.id===x.id))items.push(x);}}
 if(items.length!==total&&type==='media'){console.log(`Source discrepancy: media API reports ${total}, but exposes ${items.length} unique public records across page sizes 100 and 25.`);await fs.writeFile('outputs/migration/media-discrepancy.json',JSON.stringify({expected:total,public:items.length},null,2));}
 else if(items.length!==total||new Set(items.map(x=>x.id)).size!==total)throw new Error(`${type} count mismatch ${items.length}/${total}`);
 await fs.writeFile(path.join(cache,`${type}.json`),JSON.stringify(items));
 console.log(`${type}: ${items.length} / ${total}`);return items;
}
const results={};
for(const batch of [['posts','pages','categories'],['users','tags','media']]){const found=await Promise.all(batch.map(async type=>[type,await collection(type)]));for(const [k,v]of found)results[k]=v;}
results.comments=await collection('comments');
const sitemapNames=['wp-sitemap-posts-post-1.xml','wp-sitemap-posts-page-1.xml','wp-sitemap-taxonomies-category-1.xml','wp-sitemap-taxonomies-post_tag-1.xml','wp-sitemap-users-1.xml'];
for(const name of sitemapNames){await exec('curl.exe',['--fail','-L','-s','--max-time','30',base+'/'+name,'-o',path.join(cache,name)]);}
await fs.writeFile('outputs/migration/inventory.json',JSON.stringify({source:base,fetchedAt:new Date().toISOString(),counts:Object.fromEntries(Object.entries(results).map(([k,v])=>[k,v.length]))},null,2));
console.log('Inventory ready.');
