(() => {
  'use strict';
  const $=(id)=>document.getElementById(id);
  const fmt=new Intl.DateTimeFormat('tr-TR',{dateStyle:'medium',timeStyle:'short'});
  let profiles=[];
  let states=[];
  let stateByUser=new Map();

  function setStatus(text,error=false){
    const el=$('status');
    el.textContent=text||'';
    el.className='status'+(text?' show':'')+(error?' error':'');
  }
  function safeDate(value){
    if(!value)return '—';
    const d=new Date(value);
    return Number.isNaN(d.getTime())?'—':fmt.format(d);
  }
  function wsFrom(row){return row?.payload?.workspaces?.kpss||{};}
  function modeOf(ws){
    const decision=Array.isArray(ws?.route?.decisions)?ws.route.decisions.at(-1):null;
    const history=Array.isArray(ws?.route?.modeHistory)?ws.route.modeHistory.at(-1):null;
    return String(decision?.mode||history?.mode||history?.to||'—').toUpperCase();
  }
  function openMistakes(ws){
    const items=Array.isArray(ws?.mistakes)?ws.mistakes:[];
    return items.filter((x)=>!(x?.resolved||x?.closed||x?.status==='resolved'||x?.status==='closed')).length;
  }
  function summary(row){
    const ws=wsFrom(row);
    return {
      configured:!!ws.configured,
      target:String(ws.settings?.target||ws.profile?.targetScore||ws.profile?.targetNet||'—'),
      daily:Number(ws.settings?.dailyMinutes)||0,
      logs:Array.isArray(ws.logs)?ws.logs.length:0,
      assessments:Array.isArray(ws.assessments)?ws.assessments.length:0,
      mistakes:openMistakes(ws),
      plan:Array.isArray(ws.plan)?ws.plan.length:0,
      mode:modeOf(ws),
      revision:Number(row?.revision)||0
    };
  }
  function node(tag,text,cls){
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(text!==undefined)n.textContent=String(text);
    return n;
  }
  function recent(value,hours){
    if(!value)return false;
    const t=new Date(value).getTime();
    return Number.isFinite(t)&&Date.now()-t<=hours*3600000;
  }
  function renderStats(){
    $('total').textContent=String(profiles.length);
    $('today').textContent=String(profiles.filter((p)=>recent(p.last_seen_at,24)).length);
    $('week').textContent=String(profiles.filter((p)=>recent(p.last_seen_at,24*7)).length);
    $('configured').textContent=String(states.filter((s)=>wsFrom(s).configured).length);
  }
  function renderTable(){
    const body=$('studentsBody');body.textContent='';
    for(const profile of profiles){
      const state=stateByUser.get(profile.id);
      const s=summary(state);
      const tr=document.createElement('tr');
      const name=node('td');
      name.append(node('strong',profile.full_name||'İsimsiz öğrenci'),node('small',profile.email||profile.id));
      tr.append(
        name,
        node('td',s.configured?'Hazır':'Kurulumda'),
        node('td',s.target),
        node('td',s.mode),
        node('td',s.assessments),
        node('td',s.mistakes),
        node('td',safeDate(profile.last_seen_at||state?.synced_at))
      );
      tr.tabIndex=0;
      tr.addEventListener('click',()=>renderDetail(profile,state));
      tr.addEventListener('keydown',(e)=>{if(e.key==='Enter')renderDetail(profile,state);});
      body.appendChild(tr);
    }
    $('empty').hidden=profiles.length>0;
  }
  function metric(label,value){
    const box=node('div',undefined,'metric');
    box.append(node('span',label),node('strong',value));
    return box;
  }
  function renderDetail(profile,state){
    const area=$('detail');area.textContent='';
    const s=summary(state),ws=wsFrom(state);
    const head=node('div',undefined,'detail-head');
    const copy=node('div');
    copy.append(node('h2',profile.full_name||'Öğrenci'),node('p',profile.email||profile.id));
    head.append(copy,node('button','Kapat','close'));
    head.querySelector('button').onclick=()=>{area.classList.remove('show');};
    const grid=node('div',undefined,'metric-grid');
    grid.append(
      metric('Rota',s.configured?'Hazır':'Kurulumda'),
      metric('Rota modu',s.mode),
      metric('Hedef',s.target),
      metric('Günlük süre',s.daily?s.daily+' dk':'—'),
      metric('Çalışma kaydı',s.logs),
      metric('Test / deneme',s.assessments),
      metric('Açık yanlış',s.mistakes),
      metric('Plan görevi',s.plan),
      metric('Revision',s.revision)
    );
    const meta=node('div',undefined,'detail-meta');
    meta.append(
      node('p','Son aktivite: '+safeDate(profile.last_seen_at)),
      node('p','Son bulut senkronu: '+safeDate(state?.synced_at)),
      node('p','Workspace: '+(state?.workspace_id||ws.sync?.workspaceId||'—'))
    );
    const details=document.createElement('details');
    const sum=node('summary','Ham çalışma verisini görüntüle');
    const pre=node('pre',state?JSON.stringify(state.payload,null,2):'Henüz çalışma verisi yok.');
    details.append(sum,pre);
    area.append(head,grid,meta,details);
    area.classList.add('show');
  }

  async function load(){
    setStatus('Yönetici yetkisi doğrulanıyor…');
    const user=await window.RotaCloud.currentUser();
    if(!user){
      location.href='/login.html?return=%2Fadmin.html';
      return;
    }
    if(user.app_metadata?.role!=='admin'){
      $('gate').hidden=false;
      $('app').hidden=true;
      setStatus('Bu hesap yönetici yetkisine sahip değil.',true);
      return;
    }
    const client=await window.RotaCloud.getClient();
    const [p,s]=await Promise.all([
      client.from('profiles').select('id,email,full_name,exam,target,daily_minutes,last_seen_at,created_at,updated_at').order('last_seen_at',{ascending:false,nullsFirst:false}).limit(1000),
      client.from('student_states').select('user_id,storage_key,workspace_id,revision,client_updated_at,payload,synced_at').limit(1000)
    ]);
    if(p.error)throw p.error;if(s.error)throw s.error;
    profiles=p.data||[];states=s.data||[];stateByUser=new Map(states.map((row)=>[row.user_id,row]));
    $('app').hidden=false;$('gate').hidden=true;setStatus('');
    renderStats();renderTable();
  }

  $('refresh').onclick=()=>load().catch((e)=>setStatus(e.message||'Veriler alınamadı.',true));
  $('logout').onclick=async()=>{await window.RotaCloud.signOut();location.href='/';};
  load().catch((e)=>setStatus(e.message||'Yönetici paneli açılamadı.',true));
})();
