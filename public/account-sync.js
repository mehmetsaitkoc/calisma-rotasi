import { getSupabase, getPublicConfig } from './supabase-client.js';

const CLOUD_WRITE_KEY='calisma-rotasi:cloud:last-write:v1';
const CLOUD_EVENT_KEY='calisma-rotasi:cloud:last-event:v1';
const CLOUD_USER_KEY='calisma-rotasi:cloud:user:v1';
const config=await getPublicConfig();
const client=await getSupabase();

if(client){
  const { data:{ session } } = await client.auth.getSession();
  if(!session && config?.supabase?.requireAuth){
    const next=location.pathname+location.search+location.hash;
    location.replace('/login.html?next='+encodeURIComponent(next));
  }else if(session){
    const user=session.user;
    const bridge=window.RotaAccountBridge;
    const now=()=>new Date().toISOString();
    const activeState=()=>bridge?.getState?.() || null;
    const hasLocalStudy=(state)=>{
      if(!state?.workspaces) return false;
      return Object.values(state.workspaces).some(w=>w?.configured || (w?.logs?.length||0)>0 || (w?.assessments?.length||0)>0 || (w?.exams?.length||0)>0 || (w?.plan?.length||0)>0);
    };
    const upsertProfile=async()=>{
      const state=activeState();
      const exam=state?.activeExam || 'kpss';
      const workspace=state?.workspaces?.[exam] || {};
      const settings=workspace?.settings || {};
      const displayName=(user.user_metadata?.display_name || user.email?.split('@')[0] || 'Öğrenci').slice(0,80);
      const payload={
        id:user.id,
        email:user.email || '',
        display_name:displayName,
        exam:'kpss',
        target_score:Number.isFinite(Number(settings.target))?Number(settings.target):null,
        daily_minutes:Number.isFinite(Number(settings.dailyMinutes))?Number(settings.dailyMinutes):null,
        last_seen_at:now(),
        updated_at:now()
      };
      const { error }=await client.from('profiles').upsert(payload,{onConflict:'id'});
      if(error) throw error;
    };
    const writeActivity=async(type,metadata={})=>{
      const day=new Date().toISOString().slice(0,10);
      const marker=localStorage.getItem(CLOUD_EVENT_KEY);
      if(type==='app_open'&&marker===day) return;
      const { error }=await client.from('activity_events').insert({user_id:user.id,event_type:type,metadata});
      if(!error&&type==='app_open')localStorage.setItem(CLOUD_EVENT_KEY,day);
    };
    let timer=0,busy=false,pending=false;
    const syncState=async(state=activeState())=>{
      if(!state||busy){pending=true;return;}
      busy=true;
      try{
        const payload={
          user_id:user.id,
          active_exam:state.activeExam || 'kpss',
          schema_version:Number(state?.version || state?.schemaVersion || 1),
          state,
          updated_at:now()
        };
        const { error }=await client.from('workspace_state').upsert(payload,{onConflict:'user_id'});
        if(error) throw error;
        localStorage.setItem(CLOUD_WRITE_KEY,payload.updated_at);
        document.documentElement.dataset.cloud='synced';
      }catch(err){
        console.warn('Çalışma Rotası bulut eşitleme hatası:',err?.message||err);
        document.documentElement.dataset.cloud='error';
      }finally{
        busy=false;
        if(pending){pending=false;void syncState();}
      }
    };
    const scheduleSync=(state)=>{
      clearTimeout(timer);
      timer=setTimeout(()=>void syncState(state),650);
    };

    try{
      await upsertProfile();
      const { data:remote,error }=await client.from('workspace_state').select('state,updated_at').eq('user_id',user.id).maybeSingle();
      if(error) throw error;
      const local=activeState();
      const priorUser=localStorage.getItem(CLOUD_USER_KEY);
      const sameUser=!priorUser || priorUser===user.id;

      if(!sameUser && bridge?.storageKey){
        if(remote?.state){
          localStorage.setItem(bridge.storageKey,JSON.stringify(remote.state));
          localStorage.setItem(CLOUD_WRITE_KEY,remote.updated_at||now());
        }else{
          localStorage.removeItem(bridge.storageKey);
          localStorage.removeItem(CLOUD_WRITE_KEY);
        }
        localStorage.setItem(CLOUD_USER_KEY,user.id);
        location.reload();
      }else if(remote?.state && !hasLocalStudy(local) && bridge?.storageKey){
        localStorage.setItem(bridge.storageKey,JSON.stringify(remote.state));
        localStorage.setItem(CLOUD_WRITE_KEY,remote.updated_at||now());
        localStorage.setItem(CLOUD_USER_KEY,user.id);
        location.reload();
      }else{
        localStorage.setItem(CLOUD_USER_KEY,user.id);
        await syncState(local);
      }
      void writeActivity('app_open',{path:location.pathname});
    }catch(err){
      console.warn('Çalışma Rotası hesap başlangıcı tamamlanamadı:',err?.message||err);
      document.documentElement.dataset.cloud='error';
    }

    window.addEventListener('rota:state-saved',(event)=>scheduleSync(event.detail?.state || activeState()));
    window.addEventListener('focus',()=>void upsertProfile().catch(()=>{}));
    window.RotaCloud={
      user,
      sync:()=>syncState(activeState()),
      signOut:async()=>{await syncState(activeState());if(bridge?.storageKey)localStorage.removeItem(bridge.storageKey);localStorage.removeItem(CLOUD_WRITE_KEY);localStorage.removeItem(CLOUD_USER_KEY);await client.auth.signOut();location.replace('/login.html');}
    };
  }
}
