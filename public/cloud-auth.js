/* ÇALIŞMA ROTASI · CLOUD AUTH + SAFE WORKSPACE SYNC
   Supabase publishable credentials live in /supabase-config.js.
   RLS in Supabase is the authorization boundary; no secret/service key is shipped to browsers. */
(() => {
  'use strict';

  const SDK_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0';
  const CONFIG_URL='/supabase-config.js?v=1';
  const STATE_PREFIX='calisma-rotasi:all:v5';
  const OWNER_PREFIX='calisma-rotasi:cloud-owner:';
  const APPLY_GUARD='calisma-rotasi:cloud-applied';
  const SYNC_INTERVAL_MS=15000;
  const PRESENCE_INTERVAL_MS=60000;
  let clientPromise=null;
  let syncBusy=false;
  let autoTimer=0;
  let lastPresence=0;

  function loadScript(src, marker){
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script['+marker+']');
      if(existing){
        if(existing.dataset.loaded==='1') return resolve();
        existing.addEventListener('load',()=>resolve(),{once:true});
        existing.addEventListener('error',()=>reject(new Error('Bağlantı bileşeni yüklenemedi.')),{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=src;
      script.async=true;
      script.setAttribute(marker,'1');
      script.addEventListener('load',()=>{script.dataset.loaded='1';resolve();},{once:true});
      script.addEventListener('error',()=>reject(new Error('Bağlantı bileşeni yüklenemedi.')),{once:true});
      document.head.appendChild(script);
    });
  }

  async function ensureConfig(){
    if(window.ROTA_SUPABASE_CONFIG) return window.ROTA_SUPABASE_CONFIG;
    await loadScript(CONFIG_URL,'data-rota-supabase-config');
    return window.ROTA_SUPABASE_CONFIG||{enabled:false,url:'',publishableKey:''};
  }

  async function getClient(){
    if(clientPromise) return clientPromise;
    clientPromise=(async()=>{
      const cfg=await ensureConfig();
      if(!cfg.enabled||!cfg.url||!cfg.publishableKey) return null;
      if(!window.supabase?.createClient) await loadScript(SDK_URL,'data-rota-supabase-sdk');
      if(!window.supabase?.createClient) throw new Error('Supabase istemcisi başlatılamadı.');
      return window.supabase.createClient(cfg.url,cfg.publishableKey,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      });
    })();
    return clientPromise;
  }

  function ownerKey(storageKey){return OWNER_PREFIX+storageKey;}

  function parseState(raw){
    try{
      const value=JSON.parse(raw);
      if(!value||typeof value!=='object'||!value.workspaces?.kpss) return null;
      return value;
    }catch{return null;}
  }

  function scanLocalState(){
    const preferred=localStorage.getItem(STATE_PREFIX);
    if(preferred){
      const payload=parseState(preferred);
      if(payload) return localRecord(STATE_PREFIX,payload);
    }
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(!key||!key.startsWith(STATE_PREFIX)||key.includes('fresh-preview')) continue;
      const raw=localStorage.getItem(key);
      if(!raw) continue;
      const payload=parseState(raw);
      if(payload) return localRecord(key,payload);
    }
    return null;
  }

  function localRecord(storageKey,payload){
    const ws=payload?.workspaces?.kpss||{};
    const sync=ws.sync||{};
    return {
      storageKey,
      payload,
      owner:localStorage.getItem(ownerKey(storageKey))||'',
      workspaceId:typeof sync.workspaceId==='string'?sync.workspaceId:'',
      revision:Number.isInteger(sync.revision)&&sync.revision>=0?sync.revision:0,
      clientUpdatedAt:Number.isFinite(sync.updatedAt)&&sync.updatedAt>=0?Math.floor(sync.updatedAt):0,
      configured:!!ws.configured
    };
  }

  function remoteRecord(row){
    if(!row) return null;
    const ws=row.payload?.workspaces?.kpss||{};
    return {
      row,
      storageKey:row.storage_key||STATE_PREFIX,
      payload:row.payload,
      workspaceId:row.workspace_id||ws.sync?.workspaceId||'',
      revision:Number.isFinite(Number(row.revision))?Number(row.revision):0,
      clientUpdatedAt:Number.isFinite(Number(row.client_updated_at))?Number(row.client_updated_at):0,
      configured:!!ws.configured
    };
  }

  function clearConflictingLocal(local,userId){
    if(!local||!local.owner||local.owner===userId) return local;
    try{
      localStorage.removeItem(local.storageKey);
      localStorage.removeItem(ownerKey(local.storageKey));
    }catch{}
    return null;
  }

  function samePayload(a,b){
    try{return JSON.stringify(a)===JSON.stringify(b);}catch{return false;}
  }

  function chooseWinner(local,remote){
    if(!local) return 'remote';
    if(!remote) return 'local';
    if(samePayload(local.payload,remote.payload)) return 'same';

    if(local.workspaceId&&remote.workspaceId&&local.workspaceId===remote.workspaceId){
      if(local.revision>remote.revision) return 'local';
      if(remote.revision>local.revision) return 'remote';
      if(local.clientUpdatedAt>remote.clientUpdatedAt) return 'local';
      if(remote.clientUpdatedAt>local.clientUpdatedAt) return 'remote';
      return 'same';
    }

    if(local.configured&&!remote.configured) return 'local';
    if(remote.configured&&!local.configured) return 'remote';
    if(local.clientUpdatedAt>remote.clientUpdatedAt) return 'local';
    if(remote.clientUpdatedAt>local.clientUpdatedAt) return 'remote';
    if(local.revision>remote.revision) return 'local';
    return 'remote';
  }

  async function upsertProfile(client,user,local){
    const ws=local?.payload?.workspaces?.kpss||{};
    const settings=ws.settings||{};
    const fullName=String(settings.name||user.user_metadata?.full_name||'').slice(0,120);
    const dailyMinutes=Number.isFinite(Number(settings.dailyMinutes))?Math.max(0,Math.min(1440,Number(settings.dailyMinutes))):null;
    const target=String(settings.target||ws.profile?.targetScore||ws.profile?.targetNet||'').slice(0,120);
    const now=new Date().toISOString();
    const payload={
      id:user.id,
      email:String(user.email||'').slice(0,320),
      full_name:fullName,
      exam:'kpss',
      target,
      daily_minutes:dailyMinutes,
      last_seen_at:now,
      updated_at:now
    };
    const {error}=await client.from('profiles').upsert(payload,{onConflict:'id'});
    if(error) throw error;
    lastPresence=Date.now();
  }

  async function uploadLocal(client,user,local){
    if(!local) return {status:'no_local'};
    const now=new Date().toISOString();
    const row={
      user_id:user.id,
      storage_key:local.storageKey,
      workspace_id:local.workspaceId,
      revision:local.revision,
      client_updated_at:local.clientUpdatedAt,
      payload:local.payload,
      synced_at:now
    };
    const {error}=await client.from('student_states').upsert(row,{onConflict:'user_id'});
    if(error) throw error;
    localStorage.setItem(ownerKey(local.storageKey),user.id);
    await upsertProfile(client,user,local);
    return {status:'uploaded',revision:local.revision};
  }

  function applyRemote(user,remote){
    if(!remote?.payload) return false;
    const storageKey=remote.storageKey||STATE_PREFIX;
    const raw=JSON.stringify(remote.payload);
    if(localStorage.getItem(storageKey)===raw){
      localStorage.setItem(ownerKey(storageKey),user.id);
      return false;
    }
    localStorage.setItem(storageKey,raw);
    localStorage.setItem(ownerKey(storageKey),user.id);
    try{sessionStorage.setItem(APPLY_GUARD,String(remote.row?.synced_at||Date.now()));}catch{}
    return true;
  }

  async function syncNow(options={}){
    if(syncBusy) return {status:'busy'};
    syncBusy=true;
    try{
      const client=await getClient();
      if(!client) return {status:'not_configured'};
      const {data:userData,error:userError}=await client.auth.getUser();
      if(userError) throw userError;
      const user=userData?.user;
      if(!user) return {status:'signed_out'};

      let local=clearConflictingLocal(scanLocalState(),user.id);
      const {data:remoteRow,error:remoteError}=await client
        .from('student_states')
        .select('user_id,storage_key,workspace_id,revision,client_updated_at,payload,synced_at')
        .eq('user_id',user.id)
        .maybeSingle();
      if(remoteError) throw remoteError;
      const remote=remoteRecord(remoteRow);

      if(!local&&!remote){
        if(Date.now()-lastPresence>PRESENCE_INTERVAL_MS) await upsertProfile(client,user,null);
        return {status:'empty'};
      }
      if(local&&!remote) return await uploadLocal(client,user,local);
      if(!local&&remote){
        const changed=applyRemote(user,remote);
        if(Date.now()-lastPresence>PRESENCE_INTERVAL_MS) await upsertProfile(client,user,local);
        if(changed&&options.reload!==false&&location.pathname!=='/login.html'&&location.pathname!=='/admin.html'){
          location.reload();
        }
        return {status:'downloaded',changed};
      }

      const winner=chooseWinner(local,remote);
      if(winner==='local') return await uploadLocal(client,user,local);
      if(winner==='remote'){
        const changed=applyRemote(user,remote);
        if(Date.now()-lastPresence>PRESENCE_INTERVAL_MS) await upsertProfile(client,user,local);
        if(changed&&options.reload!==false&&location.pathname!=='/login.html'&&location.pathname!=='/admin.html'){
          location.reload();
        }
        return {status:'downloaded',changed};
      }
      localStorage.setItem(ownerKey(local.storageKey),user.id);
      if(Date.now()-lastPresence>PRESENCE_INTERVAL_MS) await upsertProfile(client,user,local);
      return {status:'synced',revision:local.revision};
    } finally {
      syncBusy=false;
    }
  }

  async function currentUser(){
    const client=await getClient();
    if(!client) return null;
    const {data}=await client.auth.getUser();
    return data?.user||null;
  }

  async function signUp({email,password,fullName}){
    const client=await getClient();
    if(!client) throw new Error('Bulut hesap sistemi henüz yapılandırılmadı.');
    return client.auth.signUp({
      email:String(email||'').trim(),
      password:String(password||''),
      options:{data:{full_name:String(fullName||'').trim().slice(0,120)}}
    });
  }

  async function signIn({email,password}){
    const client=await getClient();
    if(!client) throw new Error('Bulut hesap sistemi henüz yapılandırılmadı.');
    return client.auth.signInWithPassword({email:String(email||'').trim(),password:String(password||'')});
  }

  async function clearOwnedLocal(userId){
    const keys=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key&&key.startsWith(STATE_PREFIX)&&!key.includes('fresh-preview')) keys.push(key);
    }
    for(const key of keys){
      if(localStorage.getItem(ownerKey(key))===userId){
        localStorage.removeItem(key);
        localStorage.removeItem(ownerKey(key));
      }
    }
  }

  async function signOut(){
    const client=await getClient();
    if(!client) return;
    const user=await currentUser();
    if(user){
      try{await syncNow({reload:false});}catch{}
      await clearOwnedLocal(user.id);
    }
    const {error}=await client.auth.signOut();
    if(error) throw error;
  }

  async function isAdmin(){
    const user=await currentUser();
    return !!user&&user.app_metadata?.role==='admin';
  }

  async function decorateAccountUi(){
    const user=await currentUser().catch(()=>null);
    document.querySelectorAll('.v6-outline-btn').forEach((button)=>{
      button.textContent=user?'Hesabım':'Giriş Yap';
      button.setAttribute('aria-label',user?'Hesabım':'Giriş Yap');
    });
    document.querySelectorAll('.pnx-profile').forEach((profile)=>{
      profile.style.cursor='pointer';
      profile.setAttribute('role','button');
      profile.setAttribute('tabindex','0');
      profile.setAttribute('aria-label','Hesabım');
      if(profile.dataset.cloudAccountBound==='1')return;
      const go=()=>{location.href='/login.html';};
      profile.addEventListener('click',go);
      profile.addEventListener('keydown',(event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();go();}});
      profile.dataset.cloudAccountBound='1';
    });
  }

  async function startAutoSync(){
    if(location.pathname==='/login.html'||location.pathname==='/admin.html') return;
    const client=await getClient().catch(()=>null);
    if(!client) return;
    await decorateAccountUi();
    await syncNow().catch((error)=>console.warn('[Rota Cloud]',error?.message||error));
    if(autoTimer) clearInterval(autoTimer);
    autoTimer=setInterval(()=>syncNow().catch((error)=>console.warn('[Rota Cloud]',error?.message||error)),SYNC_INTERVAL_MS);
    client.auth.onAuthStateChange(()=>{decorateAccountUi();});
  }

  window.RotaCloud={
    getClient,
    currentUser,
    signUp,
    signIn,
    signOut,
    isAdmin,
    syncNow,
    scanLocalState,
    startAutoSync
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',startAutoSync,{once:true});
  else startAutoSync();
})();
