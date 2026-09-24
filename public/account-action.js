(function(){
'use strict';
const fragment=new URLSearchParams(location.hash.slice(1)),query=new URLSearchParams(location.search),mode=fragment.get('mode')||query.get('mode')||'recovery';
let token=fragment.get('token')||query.get('token')||'';
// Keep the link secret only in memory; do not forward it in links, referrers or storage.
history.replaceState(null,'',location.pathname+'?mode='+encodeURIComponent(mode));
const title=document.getElementById('title'),description=document.getElementById('description'),status=document.getElementById('status');
const form=document.getElementById(mode+'-form');
if(!['recovery','reset','verify'].includes(mode)||!form){title.textContent='Bağlantı tanınmadı';description.textContent='E-postandaki bağlantıyı yeniden aç veya uygulamadan yeni bir bağlantı iste.';return;}
title.textContent=({recovery:'Parolamı unuttum',reset:'Yeni parola belirle',verify:'E-posta adresini doğrula'})[mode];
description.textContent=({recovery:'Hesabının kayıtlı olduğu e-posta adresini yaz. Uygunsa parola yenileme bağlantısını bu adrese göndereceğiz.',reset:'En az 12 karakterlik yeni bir parola seç. İşlem tamamlanınca bütün cihazlardaki eski oturumların kapanır.',verify:'E-postandaki bağlantı bu işlemi yapmanı sağlar. Adresini doğrulamak için aşağıdaki düğmeye bas.'})[mode];
if(mode!=='recovery'&&!/^[A-Za-z0-9_-]{32,512}$/.test(token)){description.textContent='Bağlantı eksik veya geçersiz. E-postandaki bağlantıyı yeniden aç; süresi bittiyse yenisini iste.';return;}
form.hidden=false;
form.addEventListener('submit',async event=>{
 event.preventDefault();const button=form.querySelector('button');if(button.disabled)return;
 const fields=new FormData(form);status.dataset.error='false';status.textContent='İşlem yapılıyor…';
 if(mode==='reset'&&fields.get('password')!==fields.get('confirmation')){status.textContent='İki parola aynı olmalı.';status.dataset.error='true';return;}
 const data=mode==='recovery'?{email:String(fields.get('email')||'')}:mode==='reset'?{token,password:String(fields.get('password')||'')}:{token};
 button.disabled=true;
 try{
  const response=await fetch('/api/auth/'+mode,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(25000),body:JSON.stringify(data)});
  let result;try{result=await response.json();}catch{throw Error('Sunucudan geçerli yanıt alınamadı. Biraz sonra tekrar dene.');}
  if(!response.ok)throw Error(result.error?.message||result.error||'İşlem tamamlanamadı. Bağlantıyı ve süresini kontrol et.');
  form.reset();form.hidden=true;token='';
  status.textContent=mode==='recovery'?(result.message||'Bu adres için işlem uygunsa bağlantı gönderilecek. Gelen kutunu ve istenmeyen posta klasörünü kontrol et.'):mode==='reset'?'Parolan yenilendi. Çalışma Rotası uygulamasına dönüp yeni parolanla giriş yapabilirsin.':'E-posta adresin doğrulandı. Çalışma Rotası uygulamasına dönebilirsin.';
 }catch(error){status.dataset.error='true';status.textContent=error.name==='TimeoutError'?'Bağlantı gecikti. Parola yenilemede sonuçtan emin değilsen yeni parolanla giriş yapmayı dene; gerekirse yeni bağlantı iste.':error.message||'İşlem tamamlanamadı.';}
 finally{button.disabled=false;}
});
})();
