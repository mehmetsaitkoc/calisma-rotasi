(function(root){
'use strict';
const SYNC=root.RotaAccountSync, ACTIVE='calisma-rotasi:account-active:v1';
const clone=x=>JSON.parse(JSON.stringify(x));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let adapter,user=null,csrf='',nativeToken='',cache=null,cacheStamp=null,epoch=0,busy=false,timer=0,status='guest',problem='',conflict=null,guest=null,localOnly=false;
let resolveReady;const ready=new Promise(resolve=>{resolveReady=resolve;});
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
function write(key,value){localStorage.setItem(key,JSON.stringify(value));}
function currentKey(){return user?SYNC.accountKey(user.id):null;}
function emit(){root.dispatchEvent(new CustomEvent('rota:account',{detail:{user:user?{...user}:null,status,problem,pending:!!cache&&!same(cache.data,cache.baseData)}}));}
function setStatus(value,message=''){status=value;problem=message;emit();}
function persist(){
 if(!user||!cache)return;
 try{
  const key=currentKey(),current=localStorage.getItem(key);
  if(current!==cacheStamp){const error=Error('Bu hesabın cihaz kaydı başka sekmede değişti. Bu sekmenin yedeğini indirip yenile; diğer kaydın üzerine yazılmadı.');error.code='CACHE_CHANGED';throw error;}
  const next=JSON.stringify(cache);localStorage.setItem(key,next);cacheStamp=next;
 }catch(error){setStatus('storage-error',error.code==='CACHE_CHANGED'?error.message:'Cihazda kayıt için yer kalmadı. Çıkış yapmadan önce yedek indir.');throw error;}
}
function rememberUser(value){if(value)write(ACTIVE,{id:value.id,email:value.email,name:value.name,emailVerified:!!value.emailVerified});else localStorage.removeItem(ACTIVE);}

async function request(path,options={}){
 if(!/^\/api\/[a-z0-9/_-]+(?:\?[^#]*)?$/i.test(path))throw Error('Geçersiz uygulama adresi.');
 await root.RotaNative?.ready;
 const base=root.RotaNative?.isNative?root.RotaNative.apiBase:'';
 if(root.RotaNative?.isNative&&!/^https:\/\//.test(base||''))throw Error('Uygulamanın güvenli sunucu adresi tanımlanmamış.');
 const headers=new Headers(options.headers||{}),method=(options.method||'GET').toUpperCase();
 if(nativeToken)headers.set('Authorization','Bearer '+nativeToken);
 if(user&&!/^\/api\/auth\/(?:login|register|me)$/.test(path))headers.set('X-Rota-Account-Id',user.id);
 if(!['GET','HEAD','OPTIONS'].includes(method)&&csrf&&!nativeToken)headers.set('X-CSRF-Token',csrf);
 const timeout=AbortSignal.timeout(options.timeoutMs||25000);
 const signal=options.signal?AbortSignal.any([options.signal,timeout]):timeout;
 return fetch(base+path,{...options,method,headers,signal,credentials:root.RotaNative?.isNative?'omit':'include',cache:'no-store'});
}
async function json(path,options={}){
 const response=await request(path,{...options,headers:{'Content-Type':'application/json',...options.headers}});
 let body;try{body=await response.json();}catch{throw Error('Sunucudan geçerli yanıt alınamadı. Kayıtların cihazında tutuluyor.');}
 if(!response.ok){const e=Error(body.error?.message||body.error||body.message||'İşlem tamamlanamadı.');e.status=response.status;e.code=body.code||body.error?.code;e.body=body;throw e;}
 return body;
}
function emptyData(name=''){return adapter.emptyData(name);}
function publicAccountUrl(page,mode=''){const base=root.RotaNative?.isNative&&/^https:\/\//.test(root.RotaNative.apiBase||'')?root.RotaNative.apiBase.replace(/\/$/,''):'';return base+'/'+page+(mode?'?mode='+encodeURIComponent(mode):'');}
function useData(data){adapter.applyData(clone(data));}
function retain(data){if(!user)return;cache.data=clone(data);if(conflict)conflict.merged=SYNC.merge(cache.baseData,cache.data,conflict.remote.data||cache.baseData);persist();if(!conflict)setStatus('pending');clearTimeout(timer);timer=setTimeout(()=>void flush(),700);}
function changed(){if(user&&adapter&&!adapter.isSample())retain(adapter.getData());}
function preserveBeforeAccountChange(){
 if(!user||!cache)return;
 if(status==='storage-error')throw Error('Bu oturumda cihaza kaydedilemeyen çalışman var. Hesabı değiştirmeden önce Hesabım bölümünden cihaz yedeğini indir, sonra sayfayı yenile.');
 // The main workspace can fail to persist before its sync hook runs.
 const latest=adapter.getData();if(!same(latest,cache.data))retain(latest);
}
function reconcile(remote){
 const cloud=remote.data||cache.baseData;
 const merged=SYNC.merge(cache.baseData,cache.data,cloud);
 if(merged.conflicts.length){conflict={remote,merged};setStatus('conflict','Başka cihazda da değişen kayıtlar var. İki sürümü karşılaştırıp seçimini yap.');return false;}
 cache.baseRevision=remote.revision;cache.baseData=clone(cloud);cache.data=merged.data;cache.packet=null;persist();if(!same(adapter.getData(),cache.data))useData(cache.data);return true;
}
async function pull(){
 const current=epoch;
 const remote=await json('/api/workspace');
 if(current!==epoch||!user)return false;
 return reconcile(remote);
}
async function flush(){
 if(!user||!cache||busy||conflict||status==='storage-error')return false;
 clearTimeout(timer);
 const current=epoch;busy=true;setStatus('syncing');
 try{
  // A clean device still needs the current cloud revision. Keep an uncertain
  // packet intact until its idempotent retry has been acknowledged.
  if(!cache.packet&&!await pull())return false;
  for(let attempts=0;attempts<4;attempts++){
   if(current!==epoch||!user)return false;
   if(!cache.packet&&same(cache.data,cache.baseData)){setStatus('synced');return true;}
   const packet=cache.packet||{baseRevision:cache.baseRevision,mutationId:crypto.randomUUID(),data:clone(cache.data)};
   cache.packet=packet;persist();
   try{
    const response=await json('/api/workspace',{method:'PUT',body:JSON.stringify(packet)});
    if(current!==epoch||!user)return false;
    cache.baseRevision=response.revision;cache.baseData=clone(packet.data);cache.packet=null;persist();
    // A timed-out mutation can have been acknowledged before another device wrote.
    // Read the current revision before sending a subsequent local edit.
    if(!await pull())return false;
   }catch(error){
    if(current!==epoch)return false;
    if(error.status===409&&error.body?.data!==undefined){cache.packet=null;if(!reconcile(error.body))return false;continue;}
    if(error.status===401){setStatus('expired','Oturumun sona erdi. Cihazdaki değişikliklerini eşitlemek için tekrar giriş yap.');return false;}
    throw error;
   }
  }
  setStatus('pending');timer=setTimeout(()=>void flush(),1500);return false;
 }catch(error){if(current===epoch&&status!=='storage-error'){if(error.status===401||error.code==='ACCOUNT_MISMATCH')setStatus('expired','Bu sekmenin oturumu değişti. Cihazdaki kayıtların korunuyor; doğru hesaba yeniden giriş yap.');else setStatus('offline',error.name==='TimeoutError'?'Bağlantı gecikti. Değişiklikler cihazında; yeniden bağlanınca eşitlenecek.':String(error.message||'Bağlantı yok. Değişikliklerin cihazında korunuyor.'));}return false;}
 finally{if(current===epoch){busy=false;emit();}}
}
async function attach(identity,{offline=false}={}){
 preserveBeforeAccountChange();
 const before=adapter.getData();if(!user&&SYNC.hasStudyData(before))guest=clone(before);
 epoch++;busy=false;conflict=null;user={...identity};rememberUser(user);
 cacheStamp=localStorage.getItem(currentKey());const saved=read(currentKey()),fresh=emptyData(user.name);cache=saved?.userId===user.id?saved:{userId:user.id,baseRevision:0,baseData:clone(fresh),data:clone(fresh),packet:null};
 adapter.switchAccount(user.id);useData(cache.data);
 if(offline){setStatus('offline','Çevrimdışısın. Bu hesaba ait cihaz kayıtları gösteriliyor.');return;}
 // Preserve an uncertain request for an idempotent retry; otherwise rebase first.
 if(!cache.packet)await pull();
 if(!conflict)await flush();
}
async function authenticate(kind,fields){
 preserveBeforeAccountChange();
 const response=await json('/api/auth/'+kind,{method:'POST',body:JSON.stringify({...fields,...(root.RotaNative?.isNative?{sessionTransport:'bearer'}:{})})});
 csrf=response.csrfToken||'';
 if(root.RotaNative?.isNative){nativeToken=response.sessionToken||'';if(!nativeToken)throw Error('Güvenli cihaz oturumu kurulamadı.');await root.RotaNative.secureSession.set(nativeToken);}
 await attach(response.user);return response.user;
}
async function refresh(){
 if(!user)return loginPanel('login');
 const expected=user.id,current=epoch,identity=await json('/api/auth/me');
 if(current!==epoch||identity.user?.id!==expected){const e=Error('Bu sekmenin hesabı değişti. Kendi hesabına yeniden giriş yap.');e.code='ACCOUNT_MISMATCH';throw e;}
 csrf=identity.csrfToken||'';const response=await json('/api/auth/refresh',{method:'POST',body:'{}'});
 if(current!==epoch||response.user?.id!==expected)return false;
 csrf=response.csrfToken||'';user={...response.user};rememberUser(user);
 if(root.RotaNative?.isNative){if(!response.sessionToken)throw Error('Cihaz oturumu yenilenemedi.');nativeToken=response.sessionToken;await root.RotaNative.secureSession.set(nativeToken);}
 return flush();
}
async function logout(){
 preserveBeforeAccountChange();
 if(user&&!same(cache.data,cache.baseData)&&!await flush())throw Error('Eşitlenmemiş kayıtların var. Önce bağlantıyı düzelt veya hesap yedeğini indir; kayıtlarını sessizce silmeyeceğiz.');
 await json('/api/auth/logout',{method:'POST',body:'{}'});
 epoch++;busy=false;clearTimeout(timer);await root.RotaNative?.secureSession?.remove();nativeToken='';csrf='';user=null;cache=null;conflict=null;rememberUser(null);adapter.switchAccount(null);adapter.restoreGuest();setStatus('guest');
}
async function boot(){
 if(adapter.isPreview?.()){setStatus('guest');resolveReady();return;}
 try{
  await root.RotaNative?.ready;
  if(root.RotaNative?.isNative)nativeToken=await root.RotaNative.secureSession.get()||'';
  const response=await json('/api/auth/me');csrf=response.csrfToken||'';await attach(response.user);
 }catch(error){
  if(error.status===401){rememberUser(null);setStatus('guest');}
  else if(error.code==='ACCOUNTS_UNAVAILABLE'){localOnly=true;rememberUser(null);setStatus('local-only','Web Beta: çalışmaların bu tarayıcıda saklanır. Cihaz değiştirmeden önce yedek indir.');}
  else{const previous=read(ACTIVE);if(previous?.id&&read(SYNC.accountKey(previous.id)))await attach(previous,{offline:true});else setStatus('offline','Sunucuya bağlanılamadı. Yerel çalışmanı sürdürebilirsin; hesap eşitlemesi bağlantı gelince açılacak.');}
 }finally{resolveReady();}
}
function downloadLocal(){const data=adapter.getData();adapter.download('calisma-rotasi-hesap-cihaz-yedegi.json',JSON.stringify({user:user&&{id:user.id,email:user.email},data,unsynced:!!cache&&!same(data,cache.baseData),...(cache&&!same(data,cache.data)?{pendingSyncData:cache.data}:{})},null,2),'application/json');}
function localOnlyPanel(){
 adapter.modal('Ücretsiz Web Beta',`<p class="dialog-desc">Çalışma Rotası'nı hemen kullanabilirsin. Bu beta sürümünde çalışmaların bu tarayıcıda yerel olarak saklanır; hesap ve cihazlar arası eşitleme kalıcı sunucu depolaması açıldığında etkinleşecek.</p><div class="notice mt"><strong>Önemli:</strong> Tarayıcı verilerini temizlersen yerel kayıtların silinebilir. Cihaz değiştirmeden veya verileri temizlemeden önce yedek indir.</div><div class="button-row mt"><button class="btn primary" data-account-action="backup">Cihaz yedeğini indir</button><a class="btn ghost" href="/privacy.html" target="_blank" rel="noopener">Gizlilik</a></div>`);
}
function accountPanel(){
 if(localOnly&&!user)return localOnlyPanel();
 if(!user)return loginPanel('login');
 const labels={synced:'Hesabınla eşitlendi',syncing:'Eşitleniyor',pending:'Eşitleme bekliyor',offline:'Çevrimdışı kayıt',conflict:'Çakışma kontrolü gerekiyor',expired:'Yeniden giriş gerekli','storage-error':'Cihaz kaydı yapılamadı'};
 adapter.modal('Hesabım',`<p><strong>${escape(user.name)}</strong><br>${escape(user.email)}</p><p role="status" class="notice mt">${escape(labels[status]||status)}${problem?'<br>'+escape(problem):''}</p><div class="button-row mt">${status==='expired'?'<button class="btn primary" data-account-action="login">Tekrar giriş yap</button>':'<button class="btn primary" data-account-action="sync">Şimdi eşitle</button><button class="btn ghost" data-account-action="refresh">Oturumu yenile</button>'}${!user.emailVerified?'<button class="btn ghost" data-account-action="verify">E-postamı doğrula</button>':''}<button class="btn ghost" data-account-action="backup">Cihaz yedeğini indir</button><button class="btn ghost" data-account-action="export">Hesap verilerimi indir</button></div>${guest?'<div class="notice mt">Bu cihazdaki eski yerel çalışman henüz bu hesaba aktarılmadı.<button class="btn ghost mt" data-account-action="import">Eski çalışmamı hesabıma aktar</button></div>':''}${conflict?'<button class="btn primary mt" data-account-action="conflicts">Değişen kayıtları karşılaştır</button>':''}<div class="button-row mt"><button class="btn ghost" data-account-action="logout">Çıkış yap</button><button class="btn danger" data-account-action="delete-prompt">Hesabımı sil</button></div><p class="form-error" role="alert" id="account-error"></p>`);
}
function loginPanel(mode='login'){
 if(localOnly)return localOnlyPanel();
 const register=mode==='register';
 adapter.modal(register?'Hesap oluştur':'Hesabına giriş yap',`<form id="account-form" data-mode="${mode}">${register?'<label class="field">Adın<input name="name" maxlength="60" autocomplete="name" required></label>':''}<label class="field mt">E-posta<input name="email" type="email" maxlength="254" autocomplete="email" required></label><label class="field mt">Parola<input name="password" type="password" minlength="12" maxlength="128" autocomplete="${register?'new-password':'current-password'}" required></label>${!register?`<p class="mt"><a href="${escape(publicAccountUrl('account-action.html','recovery'))}"${root.RotaNative?.isNative?' target="_blank" rel="noopener"':''}>Şifremi unuttum</a></p>`:''}<p class="muted small mt">Çalışmaların yalnız kendi hesabında saklanır. Eski yerel kayıtlar iznin olmadan hesaba aktarılmaz.</p>${register?`<p class="muted small mt"><a href="${escape(publicAccountUrl('privacy.html'))}" target="_blank" rel="noopener">Gizlilik ve veri kullanımı</a></p>`:''}<div class="form-error" role="alert" id="account-error"></div><div class="button-row"><button class="btn primary" type="submit">${register?'Hesap oluştur':'Giriş yap'}</button><button class="btn ghost" type="button" data-account-action="${register?'login':'register'}">${register?'Hesabım var':'Hesap oluştur'}</button></div></form>`);
}
function conflictPanel(){
 if(!conflict)return accountPanel();
 adapter.modal('İki cihazdaki değişiklikleri karşılaştır',`<p class="dialog-desc">Aynı kayıt iki cihazda değiştirilmiş. Önce cihaz yedeğini indirebilir, sonra hangi alanların kullanılacağını seçebilirsin.</p><form id="account-conflicts">${conflict.merged.conflicts.map((c,i)=>`<fieldset class="notice mt"><legend>${escape(c.path)}</legend><label class="field">Kullanılacak değer<select name="conflict-${i}" required><option value="">Seç</option><option value="local">Bu cihazdaki</option><option value="remote">Hesaptaki</option></select></label><p class="small">Bu cihaz: ${escape(c.localDeleted?'Silinmiş':JSON.stringify(c.local))}</p><p class="small">Hesap: ${escape(c.remoteDeleted?'Silinmiş':JSON.stringify(c.remote))}</p></fieldset>`).join('')}<p class="form-error" role="alert" id="account-error"></p><div class="button-row"><button type="button" class="btn ghost" data-account-action="backup">Cihaz yedeğini indir</button><button type="submit" class="btn primary">Seçimlerimi uygula</button></div></form>`);
}
function assignPath(data,path,value,deleted){
 const pieces=path.split('.');let node=data;
 for(const key of pieces.slice(0,-1)){node=Array.isArray(node)?node.find(x=>x.id===key):node[key];if(!node)throw Error('Değişen kayıt yenilenmiş; yeniden eşitle.');}
 const last=pieces.at(-1);
 if(Array.isArray(node)){const i=node.findIndex(x=>x.id===last);if(deleted){if(i>=0)node.splice(i,1);}else if(i>=0)node[i]=clone(value);else node.push(clone(value));}
 else if(deleted)delete node[last];else node[last]=clone(value);
}
async function action(name){
 if(localOnly&&(name==='login'||name==='register'||name==='open'))return localOnlyPanel();
 if(name==='login'||name==='register')return loginPanel(name);
 if(name==='open')return accountPanel();
 if(name==='backup')return downloadLocal();
 if(name==='sync'){await flush();return accountPanel();}
 if(name==='refresh'){try{await refresh();}catch(error){if(error.status===401||error.code==='ACCOUNT_MISMATCH'){setStatus('expired','Oturum yenilenemedi. Cihazdaki kayıtların korunuyor; yeniden giriş yap.');return loginPanel('login');}throw error;}return accountPanel();}
 if(name==='verify'){const response=await json('/api/auth/verify',{method:'POST',body:'{}'});adapter.toast(response.message||'Doğrulama isteğin alındı. E-postanı kontrol et.');return;}
 if(name==='conflicts')return conflictPanel();
 if(name==='logout'){await logout();adapter.closeModal();return;}
 if(name==='export'){const data=await json('/api/account/export');adapter.download('calisma-rotasi-hesabim.json',JSON.stringify(data,null,2),'application/json');return;}
 if(name==='import'){
  adapter.modal('Eski yerel kayıtları aktar',`<p class="dialog-desc">Bu cihazdaki kayıtların sana ait olduğunu doğrula. Kayıtlar ${escape(user.email)} hesabına aktarılacak. Çakışan alanlarda seçimini soracağız.</p><div class="button-row"><button class="btn primary" data-account-action="import-confirm">Bu kayıtlar benim, aktar</button><button class="btn ghost" data-account-action="open">Vazgeç</button></div>`);return;
 }
 if(name==='import-confirm'&&guest){
  if(!SYNC.hasStudyData(cache.data)){cache.data=clone(guest);guest=null;persist();useData(cache.data);await flush();return accountPanel();}
  const merged=SYNC.merge(emptyData(),guest,cache.data);
  if(merged.conflicts.length){conflict={remote:{revision:cache.baseRevision,data:cache.data},merged};setStatus('conflict');guest=null;return conflictPanel();}
  cache.data=merged.data;guest=null;persist();useData(cache.data);await flush();return accountPanel();
 }
 if(name==='delete-prompt')adapter.modal('Hesabını kalıcı olarak sil',`<form id="account-delete"><p class="dialog-desc">Profilin, çalışma geçmişin, sonuçların ve Rota Hoca geçmişin sunucudan silinir. Bu işlem geri alınamaz. Önce hesabının yedeğini indirebilirsin.</p><label class="field">Onaylamak için parolan<input type="password" name="password" autocomplete="current-password" required></label><label class="field mt">SİL yazarak onayla<input name="confirm" pattern="SİL" required></label><p class="form-error" role="alert" id="account-error"></p><div class="button-row"><button type="button" class="btn ghost" data-account-action="export">Önce yedeği indir</button><button type="submit" class="btn danger">Hesabımı kalıcı olarak sil</button></div></form>`);
}
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-account-action]');if(!button)return;event.preventDefault();if(button.disabled)return;button.disabled=true;void action(button.dataset.accountAction).catch(showError).finally(()=>{button.disabled=false;});});
function showError(error){const el=document.getElementById('account-error');if(el)el.textContent=String(error.message||'İşlem tamamlanamadı.');else adapter?.toast(error.message||'İşlem tamamlanamadı.',true);}
document.addEventListener('submit',event=>{
 const form=event.target;if(!['account-form','account-delete','account-conflicts'].includes(form.id))return;
 event.preventDefault();event.stopImmediatePropagation();const button=form.querySelector('[type="submit"]');if(button.disabled)return;button.disabled=true;
 void(async()=>{
  const fields=new FormData(form);
  if(form.id==='account-form'){await authenticate(form.dataset.mode,{email:String(fields.get('email')||''),password:String(fields.get('password')||''),...(form.dataset.mode==='register'?{name:String(fields.get('name')||'')}:{})});form.reset();adapter.closeModal();if(guest)accountPanel();else adapter.toast('Hesabına giriş yapıldı.');}
  else if(form.id==='account-conflicts'){
   const result=clone(conflict.merged.data);
   conflict.merged.conflicts.forEach((c,i)=>{const choice=fields.get('conflict-'+i);if(!['local','remote'].includes(choice))throw Error('Her değişen alan için seçimini yap.');assignPath(result,c.path,c[choice],c[choice+'Deleted']);});
   cache.baseRevision=conflict.remote.revision;cache.baseData=clone(conflict.remote.data);cache.data=result;cache.packet=null;conflict=null;persist();useData(cache.data);await flush();accountPanel();
  }else{
   if(fields.get('confirm')!=='SİL')throw Error('Silme onayını yaz.');
   await json('/api/account',{method:'DELETE',body:JSON.stringify({password:String(fields.get('password')||'')})});
   const key=currentKey(),deletedId=user.id;epoch++;busy=false;clearTimeout(timer);await root.RotaNative?.secureSession?.remove();nativeToken='';csrf='';user=null;cache=null;conflict=null;rememberUser(null);adapter.switchAccount(null);localStorage.removeItem(key);adapter.removeAccountData?.(deletedId);adapter.restoreGuest();setStatus('guest');adapter.closeModal();adapter.toast('Hesabın silindi.');
  }
 })().catch(showError).finally(()=>{button.disabled=false;});
},true);
root.addEventListener('online',()=>{if(user)void flush();else if(adapter&&!localOnly)void boot();});
root.addEventListener('pagehide',()=>{if(user&&cache)try{persist();}catch{}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&user)void flush();});
root.RotaAccount=Object.freeze({request,json,changed,flush,ready,open:accountPanel,login:loginPanel,get user(){return user?{...user}:null;},get status(){return status;},get available(){return !localOnly;},bind(value){if(adapter)throw Error('Hesap bağlantısı zaten kurulu.');adapter=value;void boot();}});
})(window);
