// DLSN Imports — configuração de produção.
// Preencha APENAS a URL pública do projeto e a chave publishable/anon do Supabase.
// NUNCA coloque a service_role key neste arquivo.
window.DLSN_CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  TURNSTILE_SITE_KEY: ''
};

try {
  if (window.DLSN_CONFIG.SUPABASE_URL && window.DLSN_CONFIG.SUPABASE_ANON_KEY && window.supabase?.createClient) {
    window.dlsnSupabase = window.supabase.createClient(window.DLSN_CONFIG.SUPABASE_URL, window.DLSN_CONFIG.SUPABASE_ANON_KEY);
  }
} catch (error) { console.warn('Supabase não iniciado:', error); }
