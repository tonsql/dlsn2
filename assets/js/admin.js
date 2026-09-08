(()=>{
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const client=window.dlsnSupabase;
const isLocal=['localhost','127.0.0.1',''].includes(location.hostname);
const LOCAL_USER='admin', LOCAL_PASS='dlsn1997';
let mode=(isLocal&&!client)?'local':'supabase', products=[],reviews=[],settings={},user=null;
const base=window.DLSN_PRODUCTS||[];
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

function err(m){const x=$('#adminError');if(x)x.textContent=m||''}
function show(v){$$('[data-admin-view]').forEach(b=>b.classList.toggle('active',b.dataset.adminView===v));$$('[data-view]').forEach(s=>s.classList.toggle('active',s.dataset.view===v))}
function localLoad(){
  try{products=JSON.parse(localStorage.getItem('dlsn-admin-products')||'null')||structuredClone(base)}catch{products=JSON.parse(JSON.stringify(base))}
  try{reviews=JSON.parse(localStorage.getItem('dlsn-local-reviews')||'[]')}catch{reviews=[]}
  try{settings=JSON.parse(localStorage.getItem('dlsn-site-settings')||'{}')}catch{settings={}}
}
function localSave(){localStorage.setItem('dlsn-admin-products',JSON.stringify(products))}
async function verifySupabase(){
  if(!client)throw new Error('Supabase ainda não configurado.');
  const {data:{session}}=await client.auth.getSession();
  if(!session)return false;
  const {data:p,error}=await client.from('profiles').select('role').eq('user_id',session.user.id).maybeSingle();
  if(error)throw error;
  if(p?.role!=='admin'){await client.auth.signOut();throw new Error('Sem permissão de administrador.')}
  user=session.user;return true;
}
async function login(e){
  e.preventDefault();err('');
  const u=$('#adminEmail').value.trim(),pw=$('#adminPassword').value;
  try{
    if(mode==='local'){
      if(u!==LOCAL_USER||pw!==LOCAL_PASS)throw new Error('Usuário ou senha incorretos.');
      sessionStorage.setItem('dlsn-local-admin','1');
      user={email:'admin@local.dlsn'};
      localLoad();enter();return;
    }
    const {error}=await client.auth.signInWithPassword({email:u,password:pw});if(error)throw error;
    if(!await verifySupabase())throw new Error('Não foi possível validar a conta.');
    await loadAll();enter();
  }catch(e){err(e.message)}
}
function enter(){
  $('#adminGate').classList.add('hidden');$('#adminApp').classList.remove('hidden');
  $('#adminAccountEmail').textContent=mode==='local'?'admin (modo local)':(user?.email||'—');
  renderAll();
}
async function loadAll(){
  if(mode==='local'){localLoad();return}
  const [pr,rv,st]=await Promise.all([
    client.from('products').select('*').order('id'),
    client.from('reviews').select('*,review_images(url,path)').order('created_at',{ascending:false}),
    client.from('site_settings').select('*').eq('id',1).maybeSingle()
  ]);
  if(pr.error)throw pr.error;
  products=(pr.data||[]).map(p=>({...p,price_num:Number(p.price||0),old_price_num:Number(p.old_price||p.price||0)}));
  reviews=rv.data||[];settings=st.data||{};
  if(reviews.length){
    const ids=[...new Set(reviews.map(r=>r.user_id).filter(Boolean))];
    if(ids.length){const {data:pf}=await client.from('profiles').select('user_id,display_name,email').in('user_id',ids);const map=Object.fromEntries((pf||[]).map(x=>[x.user_id,x]));reviews=reviews.map(r=>({...r,profile:map[r.user_id]||null}))}
  }
}
function renderAll(){renderDashboard();renderProducts();renderReviews();renderSettings()}
function renderDashboard(){
  const stock=products.reduce((n,p)=>n+Number(p.stock||0),0);
  const val=products.reduce((n,p)=>n+Number(p.stock||0)*Number(p.price_num??p.price??0),0);
  $('#statProducts').textContent=products.length;
  $('#statStock').textContent=stock.toLocaleString('pt-BR');
  $('#statBrands').textContent=new Set(products.map(p=>p.brand)).size;
  $('#statValue').textContent=money(val);
  $('#statReviews').textContent=reviews.length;
  $('#statPending').textContent=reviews.filter(r=>r.status==='pending').length;
  const counts={};products.forEach(p=>counts[p.brand]=(counts[p.brand]||0)+1);
  $('#brandStats').innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([b,n])=>`<div class="brand-stat-row"><span>${b}</span><strong>${n}</strong></div>`).join('');
}
function renderProducts(){
  const q=($('#adminProductSearch')?.value||'').toLowerCase();
  const rows=products.filter(p=>!q||`${p.name} ${p.brand} ${p.model}`.toLowerCase().includes(q));
  $('#productsAdminBody').innerHTML=rows.map(p=>`<tr>
<td><div class="admin-product-cell"><img src="${p.image}"><div><strong>${p.name}</strong><small>${p.brand} • ${p.model}</small></div></div></td>
<td><small><s>${money(p.old_price_num??p.old_price??p.price_num??p.price)}</s></small><strong>${money(p.price_num??p.price)}</strong></td>
<td>${(p.sizes||[]).join(', ')}</td><td><strong>${p.stock}</strong></td><td>${p.active===false?'Oculto':'Ativo'}</td>
<td><button class="admin-btn" data-edit-product="${p.id}">Editar</button> <button class="admin-btn danger" data-delete-product="${p.id}">Excluir</button></td></tr>`).join('');
}
function clearProduct(){
  ['productId','productName','productBrand','productModel','productColor','productOldPrice','productPrice','productImage'].forEach(id=>{const x=$('#'+id);if(x)x.value=''});
  $('#productStock').value=1997;$('#productSizes').value='38,39,40,41,42,43,44';$('#productActive').checked=true;$('#productFeatured').checked=$('#productBestSeller').checked=$('#productPromotion').checked=false;
}
function editProduct(id){
  const p=products.find(x=>String(x.id)===String(id));if(!p)return;
  $('#productId').value=p.id;$('#productName').value=p.name||'';$('#productBrand').value=p.brand||'';$('#productModel').value=p.model||'';$('#productColor').value=p.color||'';
  $('#productOldPrice').value=Number(p.old_price_num??p.old_price??p.price_num??p.price??0);$('#productPrice').value=Number(p.price_num??p.price??0);$('#productImage').value=p.image||'';$('#productStock').value=p.stock||0;$('#productSizes').value=(p.sizes||[]).join(',');
  $('#productActive').checked=p.active!==false;$('#productFeatured').checked=!!p.featured;$('#productBestSeller').checked=!!p.best_seller;$('#productPromotion').checked=!!p.promotion;
  show('products');scrollTo({top:0,behavior:'smooth'});
}
async function saveProduct(e){
  e.preventDefault();
  const id=$('#productId').value;
  const payload={
    name:$('#productName').value.trim(),brand:$('#productBrand').value.trim(),model:$('#productModel').value.trim(),color:$('#productColor').value.trim(),
    slug:slug($('#productName').value),old_price:Number($('#productOldPrice').value),price:Number($('#productPrice').value),image:$('#productImage').value.trim(),
    stock:Number($('#productStock').value),sizes:$('#productSizes').value.split(',').map(Number).filter(Boolean),kind:'Tênis',
    active:$('#productActive').checked,featured:$('#productFeatured').checked,best_seller:$('#productBestSeller').checked,promotion:$('#productPromotion').checked
  };
  if(mode==='local'){
    const localPayload={...payload,old_price_num:payload.old_price,price_num:payload.price,old_price:payload.old_price,price:payload.price,url:`produto.html?slug=${payload.slug}`};
    if(id){const i=products.findIndex(x=>String(x.id)===String(id));if(i>=0)products[i]={...products[i],...localPayload}}
    else {localPayload.id=Math.max(0,...products.map(x=>Number(x.id)||0))+1;products.unshift(localPayload)}
    localSave();clearProduct();renderAll();return;
  }
  const r=id?await client.from('products').update(payload).eq('id',id):await client.from('products').insert(payload);
  if(r.error)return alert(r.error.message);clearProduct();await loadAll();renderAll();
}
async function delProduct(id){
  if(!confirm('Excluir este produto?'))return;
  if(mode==='local'){products=products.filter(x=>String(x.id)!==String(id));localSave();renderAll();return}
  const r=await client.from('products').delete().eq('id',id);if(r.error)return alert(r.error.message);await loadAll();renderAll();
}
function renderReviews(){
  const total=reviews.length,approved=reviews.filter(r=>r.status==='approved').length,pending=reviews.filter(r=>r.status==='pending').length;
  const avg=reviews.length?(reviews.reduce((n,r)=>n+Number(r.rating||0),0)/reviews.length).toFixed(1):'—';
  $('#reviewTotal').textContent=total;$('#reviewPending').textContent=pending;$('#reviewApproved').textContent=approved;$('#reviewAverage').textContent=avg;
  $('#reviewsAdminBody').innerHTML=reviews.map(r=>`<tr><td><strong>${r.profile?.display_name||r.reviewer_name||'Cliente'}</strong><small>${r.profile?.email||''}</small></td><td>${r.product_slug||'-'}</td><td><strong>${'★'.repeat(r.rating||0)}${'☆'.repeat(5-(r.rating||0))}</strong><small>${String(r.text||'').slice(0,120)}</small><div class="admin-review-photos">${(r.review_images||[]).map(x=>`<a href="${x.url}" target="_blank"><img src="${x.url}"></a>`).join('')}</div></td><td>${r.status||'pending'}</td><td><button class="admin-btn" data-review-status="${r.id}:approved">Publicar</button> <button class="admin-btn" data-review-status="${r.id}:rejected">Ocultar</button> <button class="admin-btn danger" data-review-delete="${r.id}">Excluir</button></td></tr>`).join('')||'<tr><td colspan="5">Nenhuma avaliação.</td></tr>';
}
async function reviewStatus(id,status){
  if(mode==='local'){const r=reviews.find(x=>String(x.id)===String(id));if(r)r.status=status;localStorage.setItem('dlsn-local-reviews',JSON.stringify(reviews));renderReviews();return}
  const r=await client.from('reviews').update({status}).eq('id',id);if(r.error)return alert(r.error.message);await loadAll();renderAll();
}
async function reviewDelete(id){
  if(!confirm('Excluir esta avaliação?'))return;
  if(mode==='local'){reviews=reviews.filter(x=>String(x.id)!==String(id));localStorage.setItem('dlsn-local-reviews',JSON.stringify(reviews));renderReviews();return}
  const review=reviews.find(x=>String(x.id)===String(id));const paths=(review?.review_images||[]).map(x=>x.path).filter(Boolean);if(paths.length)await client.storage.from('review-images').remove(paths);
  const r=await client.from('reviews').delete().eq('id',id);if(r.error)return alert(r.error.message);await loadAll();renderAll();
}
function renderSettings(){
  const s=settings||{};
  $('#settingAnnouncement').value=s.announcement||'';$('#settingHeroBanner').value=s.hero_banner||'';$('#settingInstagram').value=s.instagram||'';$('#settingWhatsapp').value=s.whatsapp||'5567996773494';$('#settingStoreDescription').value=s.store_description||'';$('#settingFooterNote').value=s.footer_note||'';
  $('#settingBg').value=s.bg_color||'#0a0b0e';$('#settingCard').value=s.card_color||'#15171b';$('#settingText').value=s.text_color||'#ffffff';$('#settingRadius').value=s.radius||16;$('#settingFont').value=s.font_family||'Inter';$('#settingLogoSpin').value=s.logo_spin_seconds||8;
  const brands=[...new Set(products.map(p=>p.brand))].sort();let visible=[];try{visible=JSON.parse(s.visible_brands||'[]')}catch{};if(!visible.length)visible=brands;
  $('#categorySettings').innerHTML=brands.map(b=>`<label class="category-setting-item"><input type="checkbox" data-visible-brand value="${b.replace(/"/g,'&quot;')}" ${visible.includes(b)?'checked':''}> ${b}<small>${products.filter(p=>p.brand===b).length} produtos</small></label>`).join('');
}
async function saveSettings(e){
  e.preventDefault();
  const payload={id:1,announcement:$('#settingAnnouncement').value,hero_banner:$('#settingHeroBanner').value,instagram:$('#settingInstagram').value,whatsapp:$('#settingWhatsapp').value,store_description:$('#settingStoreDescription').value,footer_note:$('#settingFooterNote').value,bg_color:$('#settingBg').value,card_color:$('#settingCard').value,text_color:$('#settingText').value,radius:Number($('#settingRadius').value),font_family:$('#settingFont').value,logo_spin_seconds:Number($('#settingLogoSpin').value),visible_brands:JSON.stringify($$('[data-visible-brand]:checked').map(x=>x.value))};
  if(mode==='local'){settings=payload;localStorage.setItem('dlsn-site-settings',JSON.stringify(settings));alert('Ajustes salvos no modo local.');return}
  const r=await client.from('site_settings').upsert(payload);if(r.error)return alert(r.error.message);settings=payload;alert('Ajustes salvos.');
}
document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-admin-view]');if(nav)return show(nav.dataset.adminView);
  const ep=e.target.closest('[data-edit-product]');if(ep)return editProduct(ep.dataset.editProduct);
  const dp=e.target.closest('[data-delete-product]');if(dp)return delProduct(dp.dataset.deleteProduct);
  const rs=e.target.closest('[data-review-status]');if(rs){const [id,status]=rs.dataset.reviewStatus.split(':');return reviewStatus(id,status)}
  const rd=e.target.closest('[data-review-delete]');if(rd)return reviewDelete(rd.dataset.reviewDelete);
});
$('#adminLoginForm')?.addEventListener('submit',login);
$('#productForm')?.addEventListener('submit',saveProduct);
$('#newProductBtn')?.addEventListener('click',()=>{clearProduct();show('products')});
$('#cancelProductEdit')?.addEventListener('click',clearProduct);
$('#settingsForm')?.addEventListener('submit',saveSettings);
$('#adminProductSearch')?.addEventListener('input',renderProducts);
$('#refreshReviewsBtn')?.addEventListener('click',async()=>{await loadAll();renderAll()});
$('#adminLogout')?.addEventListener('click',async()=>{if(mode==='local'){sessionStorage.removeItem('dlsn-local-admin');location.reload()}else{await client.auth.signOut();location.reload()}});

(async()=>{
  try{
    if(mode==='local'&&sessionStorage.getItem('dlsn-local-admin')==='1'){user={email:'admin@local.dlsn'};localLoad();enter();return}
    if(mode==='supabase'&&await verifySupabase()){await loadAll();enter()}
  }catch(e){err(e.message)}
})();
})();