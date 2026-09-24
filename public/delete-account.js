(function(){
'use strict';
let user=null,csrf='';
const status=document.getElementById('status');
async function request(path,method='GET',data){
 const headers={'Content-Type':'application/json'};
 if(user){headers['X-Rota-Account-Id']=user.id;if(method!=='GET')headers['X-CSRF-Token']=csrf;}
 const response=await fetch(path,{method,headers,credentials:'include',cache:'no-store',signal:AbortSignal.timeout(25000),...(data===undefined?{}:{body:JSON.stringify(data)})});
 const body=await response.json();if(!response.ok)throw Object.assign(Error(body.error||'İşlem tamamlanamadı.'),{status:response.status,code:body.code});return body;
}
function show(identity,token){user=identity;csrf=token||'';document.getElementById('login-panel').hidden=!!user;document.getElementById('delete-panel').hidden=!user;document.getElementById('account-name').textContent=user?user.name+' · '+user.email:'';status.textContent=user?'Hesabın doğrulandı. Silmeden önce yedeğini indirebilirsin.':'Giriş yaparak devam et.';}
function failure(error){if(error.code==='ACCOUNTS_UNAVAILABLE'){document.getElementById('login-panel').hidden=true;document.getElementById('delete-panel').hidden=true;status.textContent='Web Beta şu anda hesap oluşturmuyor. Sunucuda silinecek bir hesabın yok; yerel çalışma kayıtlarını silmek için tarayıcının bu siteye ait verilerini temizle.';return;}status.textContent=error.name==='TimeoutError'?'İstek gecikti. Silme durumunu yeniden giriş yaparak kontrol et; sonuç doğrulanmadan yeni işlem başlatma.':error.message||'İşlem tamamlanamadı.';}
document.getElementById('delete-login-form').addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget,button=form.querySelector('button');button.disabled=true;
 try{const fields=new FormData(form),result=await request('/api/auth/login','POST',{email:String(fields.get('email')),password:String(fields.get('password'))});form.reset();show(result.user,result.csrfToken);}catch(error){failure(error);}finally{button.disabled=false;}
});
document.getElementById('export-account').addEventListener('click',async event=>{
 const button=event.currentTarget;button.disabled=true;try{const data=await request('/api/account/export'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='calisma-rotasi-hesabim.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Hesap yedeği indirildi. Eşitlenmemiş cihaz kayıtlarını ayrıca uygulamadan yedekle.';}catch(error){failure(error);}finally{button.disabled=false;}
});
document.getElementById('delete-account-form').addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget,button=form.querySelector('button'),fields=new FormData(form);if(fields.get('confirmation')!=='SİL'){status.textContent='Silme onayı için SİL yaz.';return;}button.disabled=true;
 try{const id=user?.id;if(!id)throw Error('Önce giriş yap.');await request('/api/account','DELETE',{password:String(fields.get('password'))});form.reset();
  // Remove only this account's cache; preserve other accounts and guest work.
  try{for(const key of Object.keys(localStorage))if(key==='calisma-rotasi:account:v1:'+id||key.includes(':account:'+id+':')||key.endsWith(':account:'+id))localStorage.removeItem(key);const active=JSON.parse(localStorage.getItem('calisma-rotasi:account-active:v1')||'null');if(active?.id===id)localStorage.removeItem('calisma-rotasi:account-active:v1');}catch{}
  show(null,'');status.textContent='Hesabın ve sunucudaki ilişkili kayıtların silindi. Diğer cihazlardaki çevrimdışı kopyaları ve indirdiğin yedekleri ayrıca temizle.';
 }catch(error){failure(error);}finally{button.disabled=false;}
});
void request('/api/auth/me').then(result=>show(result.user,result.csrfToken)).catch(error=>{if(error.status===401)show(null,'');else failure(error);});
})();
