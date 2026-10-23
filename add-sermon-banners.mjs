import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require('C:/Users/thale/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const images={
 genesis:'720-Sub-Genesis.jpg',exodo:'1013-Sub-Exodo.jpg',levitico:'1079-Sub-Leviticos.jpg',numeros:'1124-Sub-Numeros.jpg',deuteronomio:'1125-Sub-deuteronomio.jpg',josue:'1138-Sub-Josue.jpg',juizes:'1239-Sub-Juizes.jpg','1-samuel':'1288-Sub-1-Samuel.jpg','1-reis':'1332-Sub-1-Reis.jpg','2-reis':'1356-Sub-2-Reis.jpg','1-cronicas':'1362-Sub-1-Cronicas.jpg',mateus:'1199-sub-mateus.jpg',marcos:'612-fundo-marcos.jpg',
 'antigo-1':'129-Antigo-Testamento.jpg','antigo-2':'568-fundo-genesis-2.jpg','antigo-3':'570-fundo-genesis-3.jpg','novo-1':'132-Novo-Testamento.jpg','novo-2':'608-fundo-mateus.jpg','novo-3':'94-pexels-oleksandr-p-1227513.jpg','catecismo-1':'130-Catecismo-Heidelberg.jpg','catecismo-2':'684-fundo-catecismo-3.jpg','catecismo-3':'94-pexels-oleksandr-p-1227513.jpg'
};
await fs.mkdir('dist/assets/banners',{recursive:true});
for(const [key,source]of Object.entries(images)){await sharp(path.join('dist/assets/imported',source)).resize(720,380,{fit:'cover',position:'attention',withoutEnlargement:true}).webp({quality:82}).toFile('dist/assets/banners/'+key+'.webp')}
const data=JSON.parse(await fs.readFile('dist/data/catalog.json','utf8'));
const choose=s=>{if(s.categorySlug==='catecismo-heidelberg'){const day=Number((s.book||s.title).match(/\d+/)?.[0]||s.id);return 'catecismo-'+(day%3+1)}if(images[s.bookSlug])return s.bookSlug;const n=Number(s.id)%3+1;return (s.categorySlug==='novo-testamento'?'novo-':'antigo-')+n};
const map=Object.fromEntries(data.sermons.map(s=>[s.id,'assets/banners/'+choose(s)+'.webp']));
await fs.writeFile('dist/banner-covers.js','const sermonCovers='+JSON.stringify(map)+';\n');
let js=await fs.readFile('dist/archive.js','utf8');
const from='<div class="card-art"><span>${esc(s.title)}</span></div>';
const to='<a class="card-art" href="#sermao/${s.slug}" aria-label="Ler ${esc(s.title)}"><img src="${sermonCovers[s.id]}" alt="" loading="lazy" decoding="async" width="720" height="380"><span>${esc(s.title)}</span></a>';
if(!js.includes(from))throw new Error('Sermon banner template not found');
js=js.replace(from,to);await fs.writeFile('dist/archive.js',js);
let html=await fs.readFile('dist/index.html','utf8');html=html.replace('<script src="archive.js"></script>','<script src="banner-covers.js"></script><script src="archive.js"></script>');await fs.writeFile('dist/index.html',html);
for(const s of data.sermons){await fs.access('dist/'+map[s.id])}
console.log(JSON.stringify({bannersAssigned:Object.keys(map).length,optimizedImages:Object.keys(images).length}));
