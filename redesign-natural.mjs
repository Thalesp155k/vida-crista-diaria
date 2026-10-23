import fs from 'node:fs/promises';
import path from 'node:path';
let html=await fs.readFile('dist/index.html','utf8');
html=html.replace(/<div class="hero-art">[\s\S]*?<\/div><\/section>/,`<div class="hero-art"><img class="hero-main-photo" src="assets/imported/464-feche-o-padre-lendo-a-biblia.jpg" alt="Uma Bíblia nas mãos de um leitor" width="750" height="549" fetchpriority="high"><div class="hero-photo-caption"><span class="caption-icon" aria-hidden="true">✝</span><div><strong>A fé começa pela Palavra.</strong><span>Um acervo para acompanhar sua caminhada.</span></div></div><a class="hero-photo-small" href="#catecismo" aria-label="Conhecer o Catecismo de Heidelberg"><img src="assets/banners/catecismo-1.webp" alt="Interior de uma igreja" width="720" height="380"><span>Conheça nossa fé <i aria-hidden="true">↗</i></span></a></div></section>`);
html=html.replace('<h1>Os tempos mudam.<br>A Palavra <em>permanece.</em></h1>','<h1>Explore a Bíblia.<br>Aprofunde <em>sua fé.</em></h1>');
html=html.replace('<div class="hero-note"><span>01 —</span> PARA LER COM CALMA. ESTUDAR COM PROFUNDIDADE.</div>','<div class="hero-note">647 sermões completos. Uma só Palavra.</div>');
html=html.replace('<div class="eyebrow">A BIBLIOTECA</div><h2>Uma pausa para a Palavra.</h2>','<div class="eyebrow">PARA SUA LEITURA</div><h2>Encontre seu próximo sermão.</h2>');
await fs.writeFile('dist/index.html',html);
let app=await fs.readFile('dist/archive.js','utf8');app=app.replace('<span>${esc(s.title)}</span></a><div class="card-body">','<span>${esc(s.book||s.category)}</span></a><div class="card-body">');await fs.writeFile('dist/archive.js',app);
async function restyle(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())await restyle(p);else if(entry.name.endsWith('.html')){let s=await fs.readFile(p,'utf8');s=s.replace(/<link\b[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>/g,'');if(!s.includes('natural-design.css'))s=s.replace('</head>','<link rel="stylesheet" href="/natural-design.css"></head>');await fs.writeFile(p,s)}}}
await restyle('dist');
let build=await fs.readFile('build-migration.mjs','utf8');build=build.replace('<link rel="stylesheet" href="/migration.css">','<link rel="stylesheet" href="/migration.css"><link rel="stylesheet" href="/natural-design.css">').replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/g,'');await fs.writeFile('build-migration.mjs',build);
console.log('New typography and design applied to all 809 HTML pages.');
