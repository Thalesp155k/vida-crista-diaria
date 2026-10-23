function openConfession(){const target=document.getElementById(location.hash.slice(1));if(target?.classList.contains('confession-document'))target.open=true;}
document.querySelector('#start-confessions').addEventListener('click',()=>{document.querySelector('#credo-apostolico').open=true});
window.addEventListener('hashchange',openConfession);openConfession();
