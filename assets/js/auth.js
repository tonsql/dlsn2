(()=>{
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const modal=$('#authModal'); if(!modal)return;
  const cfg=window.DLSN_CONFIG||{};
  let client=window.dlsnSupabase||null, turnstileTokens={login:'',register:''}, widgets={};
  const configured=!!client;
  function message(text,type='ok'){const box=$('#authMessage');box.textContent=text;box.className='auth-message show '+type}
  function clearMessage(){const box=$('#authMessage');box.className='auth-message';box.textContent=''}
  function open(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';refreshSession();renderTurnstileSoon()}
  function close(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';clearMessage()}
  $$('[data-auth-open]').forEach(b=>b.addEventListener('click',open));
  $$('[data-auth-close]').forEach(b=>b.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close()});
  $$('[data-auth-tab]').forEach(tab=>tab.addEventListener('click',()=>{
    $$('[data-auth-tab]').forEach(t=>t.classList.toggle('active',t===tab));
    $$('[data-auth-pane]').forEach(p=>p.classList.toggle('hidden',p.dataset.authPane!==tab.dataset.authTab));
    $('#authSession')?.classList.add('hidden'); clearMessage(); renderTurnstileSoon();
  }));
  function renderTurnstileSoon(){
    if(!cfg.TURNSTILE_SITE_KEY)return;
    let tries=0; const timer=setInterval(()=>{tries++; if(window.turnstile){clearInterval(timer); ['login','register'].forEach(kind=>{
      const slot=document.querySelector(`[data-turnstile-slot="${kind}"]`); if(!slot||widgets[kind]!==undefined)return;
      widgets[kind]=window.turnstile.render(slot,{sitekey:cfg.TURNSTILE_SITE_KEY,theme:'dark',callback:t=>turnstileTokens[kind]=t,'expired-callback':()=>turnstileTokens[kind]=''});
    })} else if(tries>20)clearInterval(timer)},250);
  }
  async function refreshSession(){
    const note=$('#authConfigNote');
    if(!client){note.textContent='Login ainda não conectado. Preencha assets/js/config.js com os dados públicos do Supabase.';return}
    note.textContent=cfg.TURNSTILE_SITE_KEY?'Supabase Auth + Cloudflare Turnstile configurados.':'Supabase Auth configurado. Turnstile opcional ainda não configurado.';
    const {data}=await client.auth.getSession(); const session=data?.session;
    if(session){$('#authUserEmail').textContent=session.user.email||'usuário';$('#authSession').classList.remove('hidden');$$('[data-auth-pane]').forEach(p=>p.classList.add('hidden'));$$('[data-auth-tab]').forEach(t=>t.classList.remove('active'))}
  }
  function resetTurnstile(kind){try{if(window.turnstile&&widgets[kind]!==undefined)window.turnstile.reset(widgets[kind])}catch{}turnstileTokens[kind]=''}
  async function login(e){
    e.preventDefault(); clearMessage(); if(!client){message('Configure o Supabase para ativar o login real.','error');return}
    if(cfg.TURNSTILE_SITE_KEY&&!turnstileTokens.login){message('Conclua a verificação de segurança.','error');return}
    const fd=new FormData(e.currentTarget), email=String(fd.get('email')||'').trim(), password=String(fd.get('password')||'');
    const payload={email,password}; if(turnstileTokens.login)payload.options={captchaToken:turnstileTokens.login};
    const {error}=await client.auth.signInWithPassword(payload); resetTurnstile('login'); if(error){message(error.message,'error');return} message('Login realizado com sucesso.');await refreshSession();
  }
  async function register(e){
    e.preventDefault(); clearMessage(); if(!client){message('Configure o Supabase para ativar o cadastro real.','error');return}
    if(cfg.TURNSTILE_SITE_KEY&&!turnstileTokens.register){message('Conclua a verificação de segurança.','error');return}
    const fd=new FormData(e.currentTarget), name=String(fd.get('name')||'').trim(),email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||'');
    const options={data:{name}}; if(turnstileTokens.register)options.captchaToken=turnstileTokens.register;
    const {data,error}=await client.auth.signUp({email,password,options}); resetTurnstile('register'); if(error){message(error.message,'error');return}
    message(data?.session?'Conta criada e conectada.':'Conta criada. Confira seu e-mail para confirmar o cadastro.');await refreshSession();
  }
  $('#loginForm')?.addEventListener('submit',login); $('#registerForm')?.addEventListener('submit',register);
  $('#authLogout')?.addEventListener('click',async()=>{if(client)await client.auth.signOut();$('#authSession').classList.add('hidden');const loginTab=$('[data-auth-tab="login"]');loginTab?.click();message('Você saiu da conta.')});
  if(new URLSearchParams(location.search).get('auth')==='1')setTimeout(open,100);
})();
