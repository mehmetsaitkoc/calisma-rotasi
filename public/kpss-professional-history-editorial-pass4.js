(function(root){
'use strict';
const bank=root.RotaKpssProfessionalHistory;
if(!bank)return;
const all=[...(bank.tests||[]).flatMap(t=>t.questions||[]),...(bank.sectionExams||[]).flatMap(s=>s.questions||[])];
const byId=new Map(all.map(q=>[q.id,q]));

function shorten(id,answerText){
  const q=byId.get(id);
  if(!q)throw new Error('Editorial pass 4 question missing: '+id);
  q.answerText=answerText;
  q.options[q.answer]=answerText;
  q.editorialStatus='reviewed';
}
function rebalance(id,distractors){
  const q=byId.get(id);
  if(!q)throw new Error('Editorial pass 4 question missing: '+id);
  if(!Array.isArray(distractors)||distractors.length!==4)throw new Error('Editorial pass 4 requires four distractors: '+id);
  const options=[...distractors]; options.splice(q.answer,0,q.answerText); q.options=options; q.editorialStatus='reviewed';
}
function rewrite(id,{text,correct,distractors,explanation,cognitive,skill,historyForm,distractorPolicy}){
  const q=byId.get(id);
  if(!q)throw new Error('Editorial pass 4 question missing: '+id);
  const options=[...distractors]; options.splice(q.answer,0,correct);
  Object.assign(q,{text,options,answerText:correct,explanation,cognitive,skill,historyForm,distractorPolicy,editorialStatus:'reviewed'});
}

// Second independent 100-question review: answer-length and clue control.
const shorterAnswers={
'kta1-t1-q04':'Toy',
'kta1-t4-q06':'Geniş coğrafyada yönetim ve savunmayı kolaylaştırmak',
'kta1-t3-q10':'Avrasya siyasetinde farklı güçlerle esnek ilişkiler kurduklarını',
'kta1-t4-q12':'Türk devlet geleneğinde süreklilikle dönüşümün birlikte görüldüğünü',
'kta2-t4-q12':'Yönetimde bilgi, ahlak ve yetişmiş insanın önemini',
'kta2-t1-q05':'İslamlaşmanın Türk kültürel sürekliliğini bütünüyle kesmediğine',
'kta2-t1-q10':'Devlet kadrosu yetiştirip Sünni öğretimi güçlendirmek',
'kta2-t1-q12':'Taşra yetkisinin merkez zayıfladığında parçalanma riski taşıdığına',
'kta2-t2-q07':'Bizans’la Anadolu sahasındaki erken büyük mücadelelerden biri olmasına',
'kta3-t3-q04':'Deniz ticareti ve kıyı güvenliği için stratejik merkezler olmaları',
'kta3-t3-q08':'Ekonomik hayatta güven ve düzeni desteklemeleri',
'kta3-t1-q02':'Haçlı baskısının siyasi merkezi değiştirecek ölçüde etkili olmasına',
'kta3-t3-q05':'Harzemşah tamponunun kalkmasıyla Moğol tehdidinin daha doğrudan hâle gelmesine',
'kta3-t4-q04':'Doğu siyasetinin fetih kadar Moğol tehdidini dengeleme amacı taşımasına',
'kta4-t1-q08':'Osmanlıların Balkan üstünlüğünün güçlenmesi',
'kta4-t1-q03':'Daha düzenli askerî birlik ihtiyacını karşılamak',
'kta4-t1-q12':'Haçlıların Osmanlıyı Balkanlardan çıkarma girişimlerinin başarısızlaşması',
'kta4-t2-q12':'Balkan güvenliğinin İstanbul’un fethi için elverişli ortam sağlaması',
'kta4-t3-q07':'Anadolu ve Balkanlarda merkezî gücü eş zamanlı büyütmek',
'kta5-t1-q07':'Anadolu Türk siyasi birliğini Osmanlı lehine büyük ölçüde tamamlamak',
'kta5-t1-q12':'Osmanlı’nın çok cepheli imparatorluk siyaseti yürüttüğünü',
'kta5-t2-q04':'İtalya’ya baskı kurabilecek deniz aşırı askerî kapasiteye ulaşmasını',
'kta5-t2-q06':'Doğu Anadolu’da rakip güçleri sınırlayıp merkezî hâkimiyeti genişletmek',
'kta5-t2-q07':'Suriye-Mısır hattı ve bölgesel güç dengesini denetleme mücadelesi',
'kta6-t3-q09':'Sıbyan mektebinin temel, medresenin ileri eğitim vermesi',
'kta6-t2-q08':'Vergi gelirini asker yerine nakit hazine geliri için kullanması',
'kta6-t2-q12':'Örfî ve şer’î hukukun birlikte norm kaynağı olması',
'kta6-t3-q04':'Peşin nakit ihtiyacının iltizamı cazip kılması',
'kta6-t3-q11':'Seyfiyenin yönetim-askerî, kalemiyenin yazı-maliye ağırlıklı olması',
'kta7-t1-q01':'Çözümün klasik kurumları yeniden işler hâle getirmekte aranması',
'kta7-t1-q06':'Askerî reform için ayrı mali kaynak gereğinin fark edilmesi',
'kta7-t2-q03':'Muhalefetin reformların sürekliliğini kesintiye uğratabilmesi',
'kta7-t2-q04':'Askerî reformu diplomasi ve mali kurumlarla destekleyen bütüncül yaklaşım',
'kta8-t3-q02':'Anayasal düzenin kısa sürede ciddi muhalefetle karşılaşması',
'kta8-t2-q02':'Meşrutiyet kurumlarının padişahın konumunu etkileyebilmesi',
'kta8-t2-q06':'Askerî başarının kurum ve koordinasyon kapasitesine de bağlı olması',
'kta8-t2-q07':'Örgütlü siyasi müdahalenin yönetim gücünü şekillendirebilmesi',
'kta9-t1-q03':'Millî direnişi merkezileştiren örgütlenme sürecinin başlangıcı olması',
'kta9-t1-q07':'Bölgesel katılıma rağmen ulusal kararlar alınması',
'kta9-t1-q10':'Millî hareketin bölgeselden ulusal otoriteye ilerlemesi',
'kta9-t1-q11':'Temsil Heyetinin İstanbul Hükûmetince fiilen muhatap alınması',
'kta9-t1-q12':'Misak’ın İtilaf baskısını artırıp yeni temsil merkezini hızlandırması',
'kta10-t1-q04':'Dağınık yerel kuvvetlerin ortak komutada yetersiz kalması',
'kta10-t2-q01':'Kaynakların Batı Cephesi’ne aktarılabilmesi',
'kta10-t2-q05':'Bağımsız silahlı güçlerin tek komutada toplanması',
'kta11-t2-q08':'Kültür ve vatandaşlık faaliyetlerini geniş kitlelere ulaştırmak',
'kta11-t4-q09':'İlkelerin birbirini tamamlayan dönüşüm hedefleri taşıması',
'kta11-t1-q02':'Devlet başkanlığı ve hükûmet sisteminin netleşmesi',
'kta12-t4-q10':'Diplomatik fırsatları egemenlik lehine kullanmak',
'kta12-t4-q12':'Bağımsızlığı gerçekçi, barışçı ve çok taraflı yöntemlerle güçlendirmek',
'kta12-t1-q01':'Millî çıkarları korurken sorunları barışçı diplomasiyle çözmek',
'kta12-t1-q08':'Balkan statükosu ve bölgesel güvenliği korumak',
'kta12-t2-q07':'Bulgaristan’ın revizyonist sınır talepleri',
'kta13-t3-q07':'Yeni bağımsız devletlerin iki blok karşısında özerklik araması',
'kta13-t3-q12':'Bağımsız Türk cumhuriyetlerinin ortaya çıkması',
'kta-sec1-q17':'Kesin taarruzun lojistik ve hazırlık üstünlüğü gerektirmesi',
'kta-sec1-q18':'Siyasi bağımsızlığın ekonomik ve hukuki egemenlikle tamamlanması',
'kta-sec1-q21':'Daha etkili bir kolektif güvenlik örgütü ihtiyacı',
'kta-sec1-q23':'Avrupa gözleminden sistemli askerî-idari-hukuki reformlara geçiş',
'kta-sec2-q15':'Türkiye’nin uluslararası meşruiyet ve saygınlığının güçlenmesi',
'kta-sec2-q19':'Kadro yetiştirme ve Sünni öğretimi güçlendirme',
'kta-sec2-q20':'Millî hedeflere parlamenter meşruiyet kazandırılması',
'kta-sec2-q22':'Ticaret güvenliği ve ekonomik hareketliliği artırmak',
'kta-sec2-q23':'Fethedilen bölgelerde kalıcı yönetim ve güvenlik kurmak',
'kta-sec3-q09':'II. Meşrutiyet’te asker-siyaset ve parti rekabetinin sertleşmesi',
'kta-sec3-q14':'Anadolu ticaretini deniz yollarına bağlamak',
'kta-sec3-q16':'Batı ittifakını Doğu Bloku karşı ittifakının izlemesi',
'kta-sec3-q17':'Hanedan dışı insan kaynağından padişaha bağlı kadro yetiştirmek',
'kta-sec4-q04':'Mısır’ın İngiliz denetimi ve deniz ulaşım yetersizliği',
'kta-sec4-q05':'Yasal reformun eğitimle toplumsallaştırılması',
'kta-sec4-q10':'Millî hareketin fiilî siyasi otorite kazanması',
'kta-sec4-q11':'Boğazları koruyup savaşın süresini etkileyen savunma başarısı',
'kta-sec4-q13':'Çoğulculuk ile rejim güvenliği gerilimi',
'kta-sec5-q04':'Kuvveti koruyup uygun koşulu bekleme ilkesi',
'kta-sec5-q05':'Hukuki reformdan eşitlik ve anayasal yönetime genişleme',
'kta-sec5-q08':'Millî egemenlik ve eşit yurttaşlık düzeni',
'kta-sec5-q12':'Askerî güç dengesinin diplomatik sonuçları etkilemesi',
'kta-sec5-q16':'Uzmanlaşmış modern bürokrasiye geçiş',
'kta2-t2-q10':'Kurumsal eğitim ve yetişmiş insan kaynağını güçlendirmesi',
'kta4-t3-q09':'Devlet kurumları ve Rumeli tabanının kriz boyunca tümüyle yok olmaması',
'kta5-t2-q12':'Sınır, mezhep-siyaset ve ticaret yollarının birlikte önem taşıması',
'kta7-t2-q12':'Anayasal kurum kurmanın kalıcılık için tek başına yetmemesi',
'kta8-t3-q08':'Cephe başarısının genel savaş sonucunu tek başına belirlememesi',
'kta9-t2-q01':'İlke ile galip devlet uygulaması arasındaki çelişkinin görünür olması',
'kta10-t2-q09':'Savunmadan stratejik inisiyatif almaya geçiş'
};
for(const [id,answer] of Object.entries(shorterAnswers))shorten(id,answer);

// Two questions were still too close to raw memorisation.
rewrite('kta1-t2-q07',{
 text:"Uygur Kağanlığı’nın 840’ta Kırgız saldırısı sonrasında Ordu Balık merkezini kaybetmesi hangi sonucu en doğrudan doğurmuştur?",
 correct:"Uygur Kağanlığı’nın Orta Asya’daki merkezî siyasi varlığının sona ermesini",
 distractors:[
  "Uygurların Çin’i ele geçirerek yeni bir hanedan kurmasını",
  "Göktürk Devleti’nin yeniden kurulmasını",
  "Karlukların Uygur yönetimine bağlanmasını",
  "Hazarların Orta Asya’ya egemen olmasını"
 ],
 explanation:"840 Kırgız saldırısı Ordu Balık merkezli Uygur Kağanlığı’nın çöküşünde belirleyici oldu; Uygur toplulukları daha sonra farklı bölgelere dağıldı.",
 cognitive:"reasoning",skill:"Uygur Kağanlığının yıkılış süreci",historyForm:"cause-effect",distractorPolicy:"near-chronology"
});
rewrite('kta-sec1-q19',{
 text:"Kutadgu Bilig’de adaletli hükümdar, devlet düzeni ve yöneticinin sorumlulukları üzerinde durulması eserin hangi düşünce alanıyla güçlü bağ kurduğunu gösterir?",
 correct:"Siyaset ve devlet yönetimi düşüncesiyle",
 distractors:[
  "Coğrafi keşif ve haritacılık düşüncesiyle",
  "Fıkhî mezhep tartışmalarıyla",
  "Askerî sefer kronikleriyle",
  "Tıp ve eczacılık bilgisiyle"
 ],
 explanation:"Kutadgu Bilig ideal yönetim, adalet, hükümdarlık ve toplum düzenini tartışır; bu yönüyle siyasetname geleneğiyle güçlü ilişki taşır.",
 cognitive:"reasoning",skill:"Kutadgu Bilig’in siyaset düşüncesi",historyForm:"evidence-inference",distractorPolicy:"same-concept-family"
});

// Harder distractors for the most clue-prone items in the second 100.
rebalance('kta11-t2-q08',[
 "Kültürel faaliyetleri yalnız merkez bürokrasisinin meslek içi eğitimine ayırmak",
 "Yerel kültür çalışmalarını devlet kurumlarından çıkarıp yalnız özel çevrelere bırakmak",
 "Eğitim etkinliklerini yalnız yükseköğretim kurumlarıyla sınırlı tutmak",
 "Kültür faaliyetlerini taşra yerine yalnız başkent çevresinde yoğunlaştırmak"
]);
rebalance('kta11-t4-q09',[
 "İlkelerin birbirinden bağımsız alanlara ait olması ve ortak bir modernleşme yönü taşımaması",
 "Ekonomik ilkelerin siyasal ve toplumsal reformlardan özellikle ayrılması",
 "Her ilkenin yalnız tek bir inkılapla ilişkilendirilebilmesi",
 "İlkeler arasında zamanla birbirini dışlayan hedeflerin ortaya çıkması"
]);
rebalance('kta12-t4-q10',[
 "Mevcut antlaşmaları hiçbir koşulda değiştirmeden statükoyu aynen korumak",
 "Egemenlik sorunlarını yalnız askerî müdahaleyle sonuçlandırmak",
 "Uluslararası kuruluşları dışlayıp yalnız ikili baskı siyaseti kullanmak",
 "Büyük devletlerden birinin korumasına girerek sorunları çözmek"
]);
rebalance('kta12-t4-q12',[
 "Uluslararası örgütlerden uzak durup güvenliği tek bir büyük devletle ittifaka bağlamak",
 "Egemenlik sorunlarını ağırlıklı olarak askerî genişleme yoluyla çözmek",
 "Komşuların iç işlerine müdahaleyi bölgesel güvenliğin temel aracı saymak",
 "Mevcut antlaşma düzenini değişen koşullardan bağımsız biçimde aynen korumak"
]);
rebalance('kta12-t1-q08',[
 "Balkan devletlerinin sınır değişikliklerini ortak askerî harekâtla hızlandırmak",
 "Balkan ülkelerini tek ekonomik ve siyasi federasyonda birleştirmek",
 "Boğazlar rejimini pakt üyelerinin ortak denetimine bırakmak",
 "Bölgedeki bütün devletleri aynı ideolojik yönetim modeline geçirmek"
]);
rebalance('kta12-t2-q07',[
 "Bulgaristan’ın Balkan sınırlarının değişmeden korunmasını diğer üyelerden daha güçlü savunmasına",
 "Bulgaristan’ın pakt üyeleriyle ortak savunma planını önceden kabul etmiş olmasına",
 "Bulgaristan’ın Balkanlar yerine yalnız Orta Doğu güvenliğiyle ilgilenmesine",
 "Bulgaristan’ın mevcut sınır düzeninden bütünüyle memnun bir politika izlemesine"
]);
rebalance('kta13-t3-q07',[
 "Yeni bağımsız devletlerin iki bloktan birine otomatik olarak katılmayı bağımsızlığın şartı saymasına",
 "Eski sömürge güçleriyle siyasi bağları sürdürüp dış politikada yeniden bağımlı kalmayı tercih etmelerine",
 "Bağlantısızlığın askerî ittifaklardan daha güçlü yeni bir üçüncü blok kurmayı amaçlamasına",
 "Sömürgesizleşmenin yeni devletlerin dış politika tercihleri üzerinde belirgin etkisi bulunmamasına"
]);
rebalance('kta13-t3-q12',[
 "Türkiye’nin NATO üyeliğinin sona erip tarafsızlık politikasına geçmesine",
 "Varşova Paktının daha geniş coğrafyada yeniden kurulmasına",
 "Sovyet coğrafyasındaki bütün cumhuriyetlerin tek federasyonda kalmasına",
 "Orta Asya ve Kafkasya’daki Türk topluluklarının bağımsız devlet kuramamasına"
]);
rebalance('kta-sec3-q09',[
 "II. Meşrutiyet döneminde parlamenter rekabetin askerî ve örgütlü müdahalelerden tamamen bağımsız işlemesine",
 "İttihat ve Terakki’nin iktidar üzerindeki etkisinin Babıali Baskını sonrasında belirgin biçimde azalmasına",
 "Siyasi partilerin ordu ve bürokrasiyle ilişkilerinin II. Meşrutiyet boyunca önemini kaybetmesine",
 "Meşrutiyet düzeninin 1913 sonrasında bütün siyasal çekişmeleri sona erdirmesine"
]);

root.RotaKpssHistoryEditorialPass4={version:4,reviewedSecondSample:100,shortenedAnswers:Object.keys(shorterAnswers).length,rewrittenQuestions:2,rebalancedDistractors:9,totalInterventions:Object.keys(shorterAnswers).length+11};
if(typeof module==='object')module.exports=root.RotaKpssHistoryEditorialPass4;
})(typeof window!=='undefined'?window:globalThis);
