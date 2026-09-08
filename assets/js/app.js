(()=>{
const base=window.DLSN_PRODUCTS||[];
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
function localProducts(){try{const p=JSON.parse(localStorage.getItem('dlsn-admin-products')||'null');return Array.isArray(p)&&p.length?p:base}catch{return base}}
let products=localProducts(); window.DLSN_ACTIVE_PRODUCTS=products;
async function syncRemoteProducts(){const c=window.dlsnSupabase;if(!c)return;try{const {data,error}=await c.from('products').select('*').eq('active',true).order('id');if(error||!data?.length)return;products=data.map(p=>({...p,price_num:Number(p.price||p.price_num||0),old_price_num:Number(p.old_price||p.old_price_num||p.price||0),url:`produto.html?slug=${encodeURIComponent(p.slug)}`}));window.DLSN_ACTIVE_PRODUCTS=products;if(window.DLSN_APP)window.DLSN_APP.products=products;renderFeatured();renderCatalog();renderCart();}catch(e){console.warn('Catálogo Supabase:',e)}}
const cart=JSON.parse(localStorage.getItem('dlsn-cart')||'[]');
function pById(id){return products.find(p=>String(p.id)===String(id))}
function detail(p){return p.url||`produto.html?slug=${encodeURIComponent(p.slug)}`}
function card(p){
const current=Number(p.price_num??p.price??0),old=Number(p.old_price_num??p.old_price??current),pix=current*.97;
return `<article class="product-card">
<a class="product-media" href="${detail(p)}"><img loading="lazy" src="${p.image}" alt="${p.name}"></a>
<div class="product-body">
<a class="product-name-link" href="${detail(p)}"><div class="product-name">${p.name}</div></a>
<div class="product-old-price">De <s>${money(old)}</s></div>
<div class="product-price-main">${money(current)}</div>
<div class="installment">12x de ${money(current/12)}</div>
<div class="pix-price">${money(pix)} com Pix</div>
<a class="product-buy-button" href="${detail(p)}">Comprar</a>
</div></article>`}
function save(){localStorage.setItem('dlsn-cart',JSON.stringify(cart));renderCart()}
function toast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(window.__dlsnt);window.__dlsnt=setTimeout(()=>t.classList.remove('show'),1800)}
function add(id,size=null){const p=pById(id);if(!p)return;const key=`${p.id}-${size||''}`;let x=cart.find(i=>i.key===key);if(x)x.qty++;else cart.push({key,id:p.id,qty:1,size});save();toast('Adicionado ao carrinho')}
function renderCart(){ $$('[data-cart-count]').forEach(e=>e.textContent=cart.reduce((n,i)=>n+i.qty,0)); const box=$('#cartItems');if(!box)return;let total=0;if(!cart.length){box.innerHTML='<div class="empty-state">Seu carrinho está vazio.</div>';$('#cartSubtotal').textContent=money(0);return} box.innerHTML=cart.map(i=>{const p=pById(i.id);if(!p)return'';total+=p.price_num*i.qty;return `<div class="cart-item"><img src="${p.image}" alt=""><div><strong>${p.name}</strong><small>${i.size?`Tam. ${i.size} • `:''}${i.qty} × ${money(p.price_num)}</small></div><button class="remove-item" data-remove="${i.key}">×</button></div>`}).join('');$('#cartSubtotal').textContent=money(total)}
function openCart(){ $('#cartDrawer')?.classList.add('open');$('#backdrop')?.classList.add('open') }
function close(){ $('#cartDrawer')?.classList.remove('open');$('#mobileDrawer')?.classList.remove('open');$('#backdrop')?.classList.remove('open') }
function whatsappCart(){if(!cart.length){toast('Seu carrinho está vazio.');return}let total=0;let lines=['Olá! Quero comprar na DLSN:',''];cart.forEach(i=>{const p=pById(i.id);if(!p)return;total+=p.price_num*i.qty;lines.push(`• ${p.name}${i.size?` | Tam. ${i.size}`:''} | Qtd. ${i.qty} | ${money(p.price_num*i.qty)}`)});lines.push('',`Total: ${money(total)}`,'','Pode confirmar a disponibilidade?');location.href='https://wa.me/5567996773494?text='+encodeURIComponent(lines.join('\n'))}
function visibleProducts(){const vb=window.DLSN_VISIBLE_BRANDS;return products.filter(p=>p.active!==false).filter(p=>!Array.isArray(vb)||!vb.length||vb.includes(p.brand))}
function renderFeatured(){const el=$('#featuredProducts');if(el)el.innerHTML=visibleProducts().slice(0,12).map(card).join('')}
function renderCatalog(){const grid=$('#productsGrid');if(!grid)return;const q=($('#catalogSearch')?.value||new URLSearchParams(location.search).get('q')||'').toLowerCase();const brand=$('#brandFilter')?.value||new URLSearchParams(location.search).get('brand')||'';let arr=visibleProducts().filter(p=>(!q||`${p.name} ${p.brand} ${p.model} ${p.color||''}`.toLowerCase().includes(q))&&(!brand||p.brand===brand));const sort=$('#sortFilter')?.value;if(sort==='price-asc')arr.sort((a,b)=>a.price_num-b.price_num);if(sort==='price-desc')arr.sort((a,b)=>b.price_num-a.price_num);if(sort==='name')arr.sort((a,b)=>a.name.localeCompare(b.name));grid.innerHTML=arr.map(card).join('');$('#catalogCount').textContent=`${arr.length} tênis encontrados`; if($('#catalogSearch')&&!$('#catalogSearch').value&&q)$('#catalogSearch').value=q;if($('#brandFilter')&&brand)$('#brandFilter').value=brand}
document.addEventListener('click',e=>{const a=e.target.closest('[data-add]');if(a){add(a.dataset.add);openCart();return}const r=e.target.closest('[data-remove]');if(r){const i=cart.findIndex(x=>x.key===r.dataset.remove);if(i>=0)cart.splice(i,1);save();return}const prev=e.target.closest('[data-rail-prev]');if(prev){document.getElementById(prev.dataset.railPrev)?.scrollBy({left:-700,behavior:'smooth'});return}const next=e.target.closest('[data-rail-next]');if(next){document.getElementById(next.dataset.railNext)?.scrollBy({left:700,behavior:'smooth'});return}const tab=e.target.closest('[data-home-tab]');if(tab){$$('.home-tab').forEach(b=>b.classList.toggle('active',b===tab));$$('[data-home-panel]').forEach(p=>p.classList.toggle('active',p.dataset.homePanel===tab.dataset.homeTab));return}});
$('#cartOpen')?.addEventListener('click',openCart);$('#cartClose')?.addEventListener('click',close);$('#backdrop')?.addEventListener('click',close);$('#menuOpen')?.addEventListener('click',()=>{$('#mobileDrawer')?.classList.add('open');$('#backdrop')?.classList.add('open')});$('#menuClose')?.addEventListener('click',close);$('#checkoutBtn')?.addEventListener('click',whatsappCart);
$('#globalSearch')?.addEventListener('submit',e=>{e.preventDefault();location.href='produtos.html?q='+encodeURIComponent($('#globalSearchInput').value.trim())});
['catalogSearch','brandFilter','sortFilter'].forEach(id=>$('#'+id)?.addEventListener(id==='catalogSearch'?'input':'change',renderCatalog));
renderFeatured();renderCatalog();renderCart();
window.DLSN_APP={products,pById,card,money,add,toast,whatsappCart};
window.addEventListener('dlsn-settings-ready',()=>{renderFeatured();renderCatalog()});
syncRemoteProducts();
})();