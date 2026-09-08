(()=>{
function apply(data){
  if(!data)return;
  if(data.announcement)document.querySelectorAll('.announcement').forEach(x=>x.textContent=data.announcement);
  if(data.hero_banner){const x=document.querySelector('[data-hero-banner]');if(x)x.src=data.hero_banner}
  if(data.bg_color)document.documentElement.style.setProperty('--dlsn-bg',data.bg_color);
  if(data.card_color)document.documentElement.style.setProperty('--dlsn-card',data.card_color);
  if(data.text_color)document.documentElement.style.setProperty('--dlsn-text',data.text_color);
  if(data.radius)document.documentElement.style.setProperty('--dlsn-radius',data.radius+'px');
  if(data.logo_spin_seconds)document.querySelectorAll('.site-logo-spin').forEach(x=>x.style.animationDuration=data.logo_spin_seconds+'s');
  try{const vb=JSON.parse(data.visible_brands||'[]');if(Array.isArray(vb))window.DLSN_VISIBLE_BRANDS=vb}catch{}
  window.dispatchEvent(new Event('dlsn-settings-ready'));
}
const c=window.dlsnSupabase;
if(!c){try{apply(JSON.parse(localStorage.getItem('dlsn-site-settings')||'{}'))}catch{};return}
(async()=>{try{const {data}=await c.from('site_settings').select('*').eq('id',1).maybeSingle();apply(data)}catch{}})();
})();