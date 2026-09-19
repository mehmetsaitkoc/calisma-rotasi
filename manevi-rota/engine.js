const MR_KEY='manevi-rota-v04';
const MR_DEFAULT={onboardStep:0,onboardDone:false,profile:{priorities:[]},daily:{},view:'today'};
let MR=JSON.parse(localStorage.getItem(MR_KEY)||'null')||structuredClone(MR_DEFAULT);
const mrSave=()=>localStorage.setItem(MR_KEY,JSON.stringify(MR));
const mrDate=(d=new Date())=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10)};
const mrOffset=(k,n)=>{const d=new Date(k+'T12:00:00');d.setDate(d.getDate()+n);return mrDate(d)};
const mrToday=()=>mrDate();
const mrClamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mrAvg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const MR_TASKS={
 quran:{icon:'📖',title:'Kur’an',base:6,cog:1,calm:3,baseScore:15,desc:'Okuma / dinleme'},
 meal:{icon:'💭',title:'Meal & tefekkür',base:5,cog:2,calm:2,baseScore:10,desc:'Kısa anlam okuması'},
 reading:{icon:'📚',title:'Okuma',base:6,cog:2,calm:2,baseScore:10,desc:'Seçtiğin eserden bölüm'},
 dua:{icon:'🤲',title:'Dua / tesbihat',base:4,cog:0,calm:4,baseScore:12,desc:'Kısa ve sakin bölüm'},
 learning:{icon:'🎓',title:'İlim',base:7,cog:3,calm:1,baseScore:9,desc:'İlmihal / siyer / hadis'},
 akhlaq:{icon:'❤️',title:'Davranış hedefi',base:3,cog:1,calm:2,baseScore:8,desc:'Bugün tek güzel davranış'}
};
const MR_ONBOARD=[
 {k:'rhythm',q:'Manevî düzenin şu an nasıl?',o:[['new','Sıfırdan başlıyorum','Küçük ve net başlangıç'],['irregular','Düzensizim','İstikrarı kurmak istiyorum'],['steady','Bir düzenim var','Daha dengeli ilerlemek istiyorum'],['strong','Düzenliyim','Derinleşmek istiyorum']]},
 {k:'baseMinutes',q:'Normal bir günde gerçekçi olarak kaç dakika ayırabilirsin?',num:true,o:[[10,'10 dk','Çok sade'],[15,'15 dk','Kısa'],[20,'20 dk','Dengeli'],[30,'30 dk','Kapsamlı'],[45,'45 dk','Derin']]},
 {k:'quranLevel',q:'Kur’an okuma düzenin nasıl?',o:[['beginner','Yeni başlıyorum','Alışkanlık kur'],['rare','Ara sıra','Düzen kazan'],['regular','Düzenli','Meal / tefekkür ekle'],['advanced','Güçlü','Derinleştir']]},
 {k:'reading',q:'Düzenli okuma alışkanlığın?',o:[['none','Yok','Kısa başla'],['rare','Ara sıra','İstikrar kur'],['regular','Düzenli','Koru'],['strong','Güçlü','Derinleş']]},
 {k:'priorities',q:'Önceliklerin hangileri?',multi:true,o:[['quran','Kur’an'],['meal','Meal / tefekkür'],['reading','Okuma'],['dua','Dua / tesbihat'],['learning','İlmihal / siyer / hadis'],['akhlaq','Ahlâk / davranış']]},
 {k:'blocker',q:'Seni en sık ne aksatıyor?',o:[['time','Vakit','Plan fazla uzun geliyor'],['forget','Unutma','Gün içinde kaynıyor'],['start','Başlamak','İlk adım zor geliyor'],['overload','Fazla hedef','Program şişiyor'],['variable','Değişken günler','Her gün aynı değil'],['none','Belirgin engel yok','Daha ileri gidebilirim']]},
 {k:'pace',q:'Programın genel temposu nasıl olsun?',o:[['gentle','Sakin','Az ama sürdürülebilir'],['balanced','Dengeli','Sürdürülebilir gelişim'],['deep','Derin','Müsait günleri güçlü kullan']]}
];
function mrEnsure(k=mrToday()){if(!MR.daily[k])MR.daily[k]={checkin:{},done:[],feedback:null,route:null};return MR.daily[k]}
function mrValidCheck(c){return !!(c.minutes&&c.energy&&c.load&&c.mood&&c.context)}
function mrHistory(k){
 const days=[1,2,3,4,5,6,7].map(n=>MR.daily[mrOffset(k,-n)]).filter(Boolean);
 const rates=days.filter(d=>d.route?.tasks?.length).map(d=>(d.done||[]).length/d.route.tasks.length);
 const recent=rates.slice(0,3), taskRate={};
 Object.keys(MR_TASKS).forEach(id=>{const a=days.filter(d=>d.route?.tasks?.some(t=>t.id===id));taskRate[id]=a.length?a.filter(d=>(d.done||[]).includes(id)).length/a.length:null});
 return {avg3:mrAvg(recent),avg7:mrAvg(rates),heavy:days.slice(0,3).filter(d=>d.feedback==='heavy').length,easy:days.slice(0,3).filter(d=>d.feedback==='easy').length,taskRate};
}
function mrDaysSince(k,id){for(let i=1;i<=7;i++){const d=MR.daily[mrOffset(k,-i)];if(d&&(d.done||[]).includes(id))return i}return 8}
function mrCapacity(c,p,h){
 let f=1;
 if(c.energy<=2)f-=.18;if(c.energy>=4)f+=.08;
 if(c.load>=4)f-=.16;if(c.load<=2)f+=.05;
 if(c.mood==='low')f-=.14;if(c.mood==='motivated')f+=.08;
 if(c.context==='busy')f-=.14;if(c.context==='travel')f-=.08;if(c.context==='rest')f+=.08;
 if(h.avg3&&h.avg3<.5)f-=.15;if(h.avg3>.85&&h.easy)f+=.06;if(h.heavy)f-=.10;
 if(p.blocker==='overload'||p.blocker==='time')f-=.07;
 if(p.pace==='gentle')f-=.06;if(p.pace==='deep')f+=.06;
 return mrClamp(f,.55,1.18)
}
function mrScore(id,c,p,h,k){
 const t=MR_TASKS[id];let s=t.baseScore;const why=[];
 if((p.priorities||[]).includes(id)){s+=28;why.push('önceliğin')}
 const tr=h.taskRate[id];if(tr!==null&&tr<.5){s+=13;why.push('son günlerde aksadı')}
 if(mrDaysSince(k,id)>=4){s+=9;why.push('birkaç gündür yapılmadı')}
 if(c.energy<=2&&t.cog>=3)s-=14;
 if(c.energy>=4&&t.cog>=2){s+=7;why.push('enerjin uygun')}
 if(c.load>=4&&t.calm>=3){s+=11;why.push('zihinsel yüküne uygun')}
 if(c.load>=4&&t.cog>=3)s-=13;
 if(c.mood==='low'&&t.base<=5){s+=8;why.push('başlaması kolay')}
 if(c.mood==='motivated'&&t.cog>=2)s+=5;
 if(c.context==='travel'&&['dua','quran','akhlaq'].includes(id)){s+=8;why.push('taşınabilir')}
 if(c.context==='busy'&&t.base<=5)s+=7;
 if(id==='meal'&&p.quranLevel==='beginner')s-=8;
 if(id==='quran'&&['beginner','rare'].includes(p.quranLevel)){s+=8;why.push('Kur’an düzenini güçlendirir')}
 if(id==='reading'&&p.reading==='none')s-=4;
 return {score:s,why}
}
function mrBuild(k=mrToday(),force=false){
 const d=mrEnsure(k),c=d.checkin,p=MR.profile,h=mrHistory(k);if(!mrValidCheck(c))return null;if(d.route&&!force)return d.route;
 const factor=mrCapacity(c,p,h),budget=Math.max(5,Math.round(c.minutes*factor)),count=budget<=8?2:budget<=14?3:budget<=22?4:5;
 const scored=Object.keys(MR_TASKS).map(id=>({id,...mrScore(id,c,p,h,k)})).sort((a,b)=>b.score-a.score);
 const tasks=[];let rem=budget;
 for(const x of scored){if(tasks.length>=count)break;const t=MR_TASKS[x.id];let dur=t.base;if(c.energy<=2)dur=Math.max(2,dur-2);if(['busy','travel'].includes(c.context))dur=Math.max(2,dur-1);if(c.context==='rest'&&c.energy>=4)dur++;if(dur<=rem||tasks.length<2){tasks.push({id:x.id,duration:dur,reasons:x.why,score:x.score});rem-=dur}}
 if(!tasks.length)tasks.push({id:'dua',duration:3,reasons:['bugün için en hafif başlangıç'],score:99});
 while(rem>=3&&tasks.length){const i=tasks.findIndex(x=>['quran','reading','learning','meal'].includes(x.id));if(i<0)break;tasks[i].duration++;rem--}
 const why=[];
 if(factor<.85)why.push('Bugünkü kapasiteyi korumak için rota hafifletildi.');
 else if(factor>1.05)why.push('Bugün kapasiten iyi olduğu için kontrollü biçimde genişletildi.');
 else why.push('Bugün için dengeli yoğunluk seçildi.');
 if(h.avg3&&h.avg3<.5)why.push('Son 3 gündeki tamamlama düşük olduğu için görev sayısı sınırlandı.');
 if(h.heavy)why.push('Yakın zamanda “ağır geldi” dediğin için yük azaltıldı.');
 if(c.load>=4)why.push('Zihinsel yük yüksek olduğu için sakin görevler öne alındı.');
 if(c.energy<=2)why.push('Enerji düşük olduğu için kısa görevler seçildi.');
 d.route={createdAt:Date.now(),budget,total:tasks.reduce((a,x)=>a+x.duration,0),factor,tasks,why,analysis:{avg3:h.avg3,avg7:h.avg7,energy:c.energy,load:c.load,mood:c.mood,context:c.context}};
 mrSave();return d.route
}