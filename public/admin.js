import { getSupabase } from './supabase-client.js';

const $=(q)=>document.querySelector(q);
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const client=await getSupabase();

if(!client){
  location.replace('/login.html?next=/admin.html');
}else{
  const sessionResult=await client.auth.getSession();
  const session=sessionResult?.data?.session;
  if(!session){
    location.replace('/login.html?next=/admin.html');
  }else{
    $('#signout').addEventListener('click',async()=>{
      await client.auth.signOut();
      location.replace('/login.html');
    });

    const meResult=await client.from('profiles').select('id,is_admin').eq('id',session.user.id).maybeSingle();
    const me=meResult.data;
    if(meResult.error || !me?.is_admin){
      $('#denied').classList.remove('hidden');
    }else{
      $('#app').classList.remove('hidden');

      const listResult=await client.from('profiles')
        .select('id,email,display_name,exam,last_seen_at,created_at,target_score,daily_minutes')
        .order('last_seen_at',{ascending:false,nullsFirst:false})
        .limit(500);
      if(listResult.error) throw listResult.error;

      const students=listResult.data||[];
      const msDay=86400000,now=Date.now();
      const ageDays=(v)=>v?Math.floor((now-new Date(v).getTime())/msDay):9999;
      const labelAge=(v)=>{
        const d=ageDays(v);
        if(d<1)return 'Bugün';
        if(d===1)return 'Dün';
        if(d<30)return d+' gün önce';
        return v?new Date(v).toLocaleDateString('tr-TR'):'—';
      };

      $('#total').textContent=students.length;
      $('#today').textContent=students.filter(x=>ageDays(x.last_seen_at)<1).length;
      $('#week').textContent=students.filter(x=>ageDays(x.last_seen_at)<7).length;

      function renderRows(list){
        $('#rows').innerHTML=list.map((x)=>{
          const old=ageDays(x.last_seen_at)>7?' old':'';
          return '<tr data-id="'+esc(x.id)+'">'+
            '<td><strong>'+esc(x.display_name||'İsimsiz')+'</strong><div style="color:#78837e;font-size:11px">'+esc(x.email||'')+'</div></td>'+
            '<td>'+esc((x.exam||'kpss').toUpperCase())+'</td>'+
            '<td><span class="status"><i class="dot'+old+'"></i>'+esc(labelAge(x.last_seen_at))+'</span></td>'+
          '</tr>';
        }).join('');
        document.querySelectorAll('tr[data-id]').forEach(tr=>{
          tr.addEventListener('click',()=>openStudent(tr.dataset.id));
        });
      }

      renderRows(students);
      $('#search').addEventListener('input',(e)=>{
        const q=e.target.value.trim().toLocaleLowerCase('tr-TR');
        const filtered=!q?students:students.filter(x=>((x.display_name||'')+' '+(x.email||'')).toLocaleLowerCase('tr-TR').includes(q));
        renderRows(filtered);
      });

      async function openStudent(id){
        const p=students.find(x=>x.id===id);
        if(!p)return;
        $('#detail').innerHTML='<div class="empty">Öğrenci verisi yükleniyor…</div>';

        const cloudResult=await client.from('workspace_state')
          .select('state,active_exam,updated_at')
          .eq('user_id',id)
          .maybeSingle();
        if(cloudResult.error){
          $('#detail').innerHTML='<div class="warn">'+esc(cloudResult.error.message)+'</div>';
          return;
        }

        const cloud=cloudResult.data;
        const state=cloud?.state||{};
        const exam=cloud?.active_exam||state.activeExam||'kpss';
        const w=state?.workspaces?.[exam]||{};
        const logs=Array.isArray(w.logs)?w.logs:[];
        const plan=Array.isArray(w.plan)?w.plan:[];
        const assess=Array.isArray(w.assessments)?w.assessments:[];
        const exams=Array.isArray(w.exams)?w.exams:[];
        const mistakes=Array.isArray(w.mistakes)?w.mistakes:[];
        const done=plan.filter(x=>x.done).length;
        const completion=plan.length?Math.round(done/plan.length*100):0;
        const answered=logs.reduce((n,x)=>n+(Number(x.correct)||0)+(Number(x.wrong)||0),0);
        const correct=logs.reduce((n,x)=>n+(Number(x.correct)||0),0);
        const accuracy=answered?Math.round(correct/answered*100):0;
        const openMistakes=mistakes.filter(x=>!x.resolved&&!x.closed&&!x.done).length;
        const topics=w.topicState&&typeof w.topicState==='object'?Object.values(w.topicState):[];
        const activeTopics=topics.filter(x=>Number(x?.status||0)>0).length;
        const recentAssess=[...assess].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,5);

        let recentHtml='';
        if(recentAssess.length){
          recentHtml=recentAssess.map((a)=>{
            const label=a.title||a.subjectName||a.subjectId||'Mini deneme';
            return '<div class="row"><span>'+esc(label)+'</span><b>'+esc((a.correct??0)+'D / '+(a.wrong??0)+'Y')+'</b></div>';
          }).join('');
        }else{
          recentHtml='<div class="row"><span>Henüz mini sonuç yok</span><b>—</b></div>';
        }

        $('#detail').innerHTML=
          '<div class="eyebrow">Öğrenci detayı</div>'+
          '<h2>'+esc(p.display_name||'İsimsiz')+'</h2>'+
          '<div class="mail">'+esc(p.email||'')+'</div>'+
          '<div class="stats">'+
            '<div class="mini"><b>'+completion+'%</b><span>Plan tamamlama</span></div>'+
            '<div class="mini"><b>'+accuracy+'%</b><span>Kayıtlı doğruluk</span></div>'+
            '<div class="mini"><b>'+openMistakes+'</b><span>Açık yanlış</span></div>'+
            '<div class="mini"><b>'+activeTopics+'</b><span>Çalışılan konu</span></div>'+
          '</div>'+
          '<div class="section"><h3>Profil</h3>'+
            '<div class="row"><span>Hedef puan</span><b>'+esc(p.target_score??'—')+'</b></div>'+
            '<div class="row"><span>Günlük süre</span><b>'+(p.daily_minutes?esc(p.daily_minutes)+' dk':'—')+'</b></div>'+
            '<div class="row"><span>Tam deneme</span><b>'+exams.length+'</b></div>'+
            '<div class="row"><span>Mini değerlendirme</span><b>'+assess.length+'</b></div>'+
            '<div class="row"><span>Son bulut kayıt</span><b>'+esc(labelAge(cloud?.updated_at))+'</b></div>'+
          '</div>'+
          '<div class="section"><h3>Son mini sonuçlar</h3>'+recentHtml+'</div>';
      }
    }
  }
}
