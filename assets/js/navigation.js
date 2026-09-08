(()=>{
  const $=(s,c=document)=>c.querySelector(s);
  const toggle=$('#categoriesToggle'), mega=$('#categoriesMega'), nav=$('#mainNav');
  function closeMega(){mega?.classList.remove('open');toggle?.setAttribute('aria-expanded','false')}
  toggle?.addEventListener('click',e=>{e.stopPropagation();const open=!mega.classList.contains('open');mega.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open))});
  document.addEventListener('click',e=>{if(mega?.classList.contains('open')&&!e.target.closest('#categoriesMega')&&!e.target.closest('#categoriesToggle'))closeMega()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMega()});
  $('#navPrev')?.addEventListener('click',()=>nav?.scrollBy({left:-360,behavior:'smooth'}));
  $('#navNext')?.addEventListener('click',()=>nav?.scrollBy({left:360,behavior:'smooth'}));
})();
