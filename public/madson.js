// Videos observed on the official Vida Cristã Diária channel.
const channelVideos=[
  ['f8RhRiGjgMw','O caminho para a verdadeira felicidade'],
  ['16WDRkG1Zmw','O antídoto para o egocentrismo'],
  ['b7TvzMs8wgg','Servos uns dos outros'],
  ['R5JfCRwcUts','Cheios do Espírito'],
  ['dw00C4AJgC4','Graça e dinheiro'],
  ['kU-NSlNQZNU','A idolatria do sucesso']
];
const videoGrid=document.querySelector('#video-grid');
videoGrid.innerHTML=channelVideos.map(([id,title])=>`<button class="video-card" data-video="${id}" aria-label="Assistir: ${title}"><div class="thumb"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy"><span class="play" aria-hidden="true">▶</span></div><strong>${title}</strong></button>`).join('');
const videoDialog=document.querySelector('#video-dialog');
videoGrid.addEventListener('click',event=>{
  const card=event.target.closest('[data-video]');if(!card)return;
  const id=card.dataset.video;
  document.querySelector('#video-frame').innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1" title="${card.getAttribute('aria-label')}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  videoDialog.showModal();
});
function closeVideo(){videoDialog.close();document.querySelector('#video-frame').replaceChildren()}
document.querySelector('.video-close').addEventListener('click',closeVideo);
videoDialog.addEventListener('click',event=>{if(event.target===videoDialog)closeVideo()});
videoDialog.addEventListener('close',()=>document.querySelector('#video-frame').replaceChildren());
window.addEventListener('catalog-ready',()=>{
  document.querySelector('#latest-grid').innerHTML=[...catalog].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3).map(s=>`<article class="blog-post"><a class="post-image" href="#sermao/${s.slug}" aria-label="Ler ${esc(s.title)}"><img src="${s.cover||sermonCovers[s.id]||'/assets/banners/novo-2.webp'}" alt="" loading="lazy"></a><div class="post-copy"><div class="post-meta">${esc(s.category)} <span>·</span> ${new Date(s.date).toLocaleDateString('pt-BR')} <span>·</span> ${s.minutes} min de leitura</div><h3><a href="#sermao/${s.slug}">${esc(s.title)}</a></h3><p>${esc(s.description.slice(0,190))}${s.description.length>190?'…':''}</p><a class="post-read" href="#sermao/${s.slug}">Continuar lendo →</a></div></article>`).join('');
});
