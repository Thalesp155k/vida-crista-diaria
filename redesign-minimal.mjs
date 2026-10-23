import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require('C:/Users/thale/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
await sharp('dist/assets/imported/130-Catecismo-Heidelberg.jpg').resize(1600,960,{fit:'cover',withoutEnlargement:true}).webp({quality:86}).toFile('dist/assets/igreja-fundo.webp');
let html=await fs.readFile('dist/index.html','utf8');
const hero=`<section class="hero" id="inicio"><img class="hero-background" src="assets/igreja-fundo.webp" alt="" width="1400" height="960" fetchpriority="high"><div class="hero-copy"><div class="eyebrow">SERMÕES REFORMADOS</div><h1>A Palavra de Deus<br>para todos os dias.</h1><p>Pregações e estudos para conhecer as Escrituras<br>e crescer na fé.</p><div class="hero-actions"><a class="hero-primary" href="#biblioteca">Explorar sermões <span aria-hidden="true">→</span></a><a class="hero-secondary" href="#confessionalidade">Conheça nossa fé</a></div></div><a class="hero-scroll" href="#biblioteca" aria-label="Ir para a biblioteca">↓</a></section><section class="search-band" aria-label="Pesquisar no acervo"><div class="search-intro"><strong>O que você deseja estudar?</strong><span>Busque uma passagem, um tema ou um autor.</span></div><form id="hero-search" class="search"><span aria-hidden="true">⌕</span><input aria-label="Buscar sermões" placeholder="Pesquisar no acervo"><button aria-label="Pesquisar">→</button></form></section>`;
html=html.replace(/<section class="hero" id="inicio">[\s\S]*?<\/section>\s*<div class="principles">[\s\S]*?<\/div>/,hero);
html=html.replace('<a href="#confessionalidade">Confessionalidade</a>','<a href="#confessionalidade">Nossa fé</a>');
html=html.replace('Encontre seu próximo sermão.','Biblioteca de sermões.');
await fs.writeFile('dist/index.html',html);
async function visit(dir){for(const ent of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())await visit(p);else if(ent.name.endsWith('.html')){let s=await fs.readFile(p,'utf8');if(!s.includes('minimal-design.css'))s=s.replace('</head>','<link rel="stylesheet" href="/minimal-design.css"></head>');await fs.writeFile(p,s)}}}
await visit('dist');
let build=await fs.readFile('build-migration.mjs','utf8');build=build.replace('<link rel="stylesheet" href="/natural-design.css">','<link rel="stylesheet" href="/natural-design.css"><link rel="stylesheet" href="/minimal-design.css">');await fs.writeFile('build-migration.mjs',build);
console.log('Full-width photo hero and minimalist interface applied.');
