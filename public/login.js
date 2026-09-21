import { getSupabase, safeNext } from './supabase-client.js';

const $ = (q)=>document.querySelector(q);
const next = safeNext(new URLSearchParams(location.search).get('next') || '/', '/');
const client = await getSupabase();
let mode = 'signin';

function setMessage(text, ok=false){
  const el=$('#msg'); el.textContent=text||''; el.classList.toggle('ok',!!ok);
}
function setMode(nextMode){
  mode=nextMode;
  const signup=mode==='signup';
  $('#signin-tab').classList.toggle('active',!signup);
  $('#signup-tab').classList.toggle('active',signup);
  $('#name-row').hidden=!signup;
  $('#name').required=signup;
  $('#password').autocomplete=signup?'new-password':'current-password';
  $('#submit').textContent=signup?'Hesap oluştur':'Giriş yap';
  $('#title').textContent=signup?'Rotanı hesabına bağla.':'Tekrar hoş geldin.';
  $('#sub').textContent=signup?'Bir kez hesap oluştur; çalışma verilerin cihazdan bağımsız saklansın.':'Çalışma Rotana kaldığın yerden devam et.';
  setMessage('');
}
$('#signin-tab').addEventListener('click',()=>setMode('signin'));
$('#signup-tab').addEventListener('click',()=>setMode('signup'));

if(!client){
  setMessage('Bulut sistemi henüz etkinleştirilmedi. Yönetici Supabase ayarlarını tamamlamalı.');
  $('#submit').disabled=true;
}else{
  const { data } = await client.auth.getSession();
  if(data?.session) location.replace(next);
}

$('#form').addEventListener('submit',async(e)=>{
  e.preventDefault();
  if(!client) return;
  const email=$('#email').value.trim();
  const password=$('#password').value;
  const displayName=$('#name').value.trim();
  const button=$('#submit');
  button.disabled=true; setMessage('');
  try{
    if(mode==='signup'){
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options:{ data:{ display_name:displayName } }
      });
      if(error) throw error;
      if(!data?.session){
        setMessage('Hesap oluşturuldu. E-postana gelen doğrulama bağlantısına dokunup sonra giriş yap.',true);
        setMode('signin');
        $('#email').value=email;
        return;
      }
      location.replace(next);
    }else{
      const { error } = await client.auth.signInWithPassword({ email, password });
      if(error) throw error;
      location.replace(next);
    }
  }catch(err){
    setMessage(err?.message || 'İşlem tamamlanamadı.');
  }finally{
    button.disabled=false;
  }
});
