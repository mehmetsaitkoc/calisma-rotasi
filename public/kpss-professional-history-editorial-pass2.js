(function(root){
'use strict';
const bank=root.RotaKpssProfessionalHistory;
if(!bank)return;

const all=[
  ...(bank.tests||[]).flatMap(t=>t.questions||[]),
  ...(bank.sectionExams||[]).flatMap(t=>t.questions||[])
];
const byId=new Map(all.map(q=>[q.id,q]));

function rewrite(id,{text,correct,distractors,explanation,cognitive,skill,historyForm,distractorPolicy}){
  const q=byId.get(id);
  if(!q)throw new Error('Editorial pass 2 question missing: '+id);
  const options=[...distractors];
  options.splice(q.answer,0,correct);
  Object.assign(q,{
    text,options,answerText:correct,explanation,cognitive,skill,historyForm,distractorPolicy,
    editorialStatus:'reviewed'
  });
}

rewrite('kta13-t1-q10',{
  text:"Türkiye'nin 1950'de Kore'ye BM kuvvetleri kapsamında asker göndermesi ve 1952'de NATO'ya kabul edilmesi birlikte düşünüldüğünde, aşağıdaki yargılardan hangisine ulaşılır?",
  correct:"Kore'ye asker gönderme, Batı güvenlik sistemiyle fiilî dayanışmayı gösterirken NATO üyeliği bu yönelimi kurumsallaştırmıştır.",
  distractors:[
    "Türkiye, Kore Savaşı sonrasında askerî ittifaklardan uzak durmayı temel dış politika hâline getirmiştir.",
    "NATO üyeliği, Türkiye'nin Kore Savaşı'na katılmasından önce gerçekleşmiş ve bu katılımın hukuki şartını oluşturmuştur.",
    "Kore'ye asker gönderilmesi Türkiye'nin Varşova Paktı ile güvenlik iş birliği kurmasının ilk adımı olmuştur.",
    "Türkiye'nin Kore politikası, Birleşmiş Milletler yerine yalnız ikili antlaşmalara dayanan bir güvenlik anlayışını göstermiştir."
  ],
  explanation:"Türkiye 1950'de Kore'ye BM gücü kapsamında asker gönderdi; 18 Şubat 1952'de NATO'ya katıldı. Kronoloji, fiilî Batı dayanışmasının daha sonra kurumsal ittifak üyeliğiyle tamamlandığını gösterir.",
  cognitive:"reasoning",skill:"Kore-NATO güvenlik yönelimi",historyForm:"evidence-inference",distractorPolicy:"same-policy-family"
});

rewrite('kta3-t2-q01',{
  text:"I. Haçlı Seferi sırasında İznik'in kaybedilmesinden sonra Türkiye Selçuklularının yönetim merkezini Anadolu'nun iç kesimlerine taşıması hangi şehirle sonuçlanmıştır?",
  correct:"Konya",
  distractors:["Kayseri","Sivas","Aksaray","Tokat"],
  explanation:"İznik'in Haçlılar nedeniyle kaybedilmesi sonrasında Türkiye Selçuklu yönetim merkezi Konya'ya taşındı. Çeldiriciler de Selçuklu idari-kültürel ağı içinde önemli Anadolu şehirleridir.",
  cognitive:"context",skill:"Haçlı Seferi sonrası başkent değişimi",historyForm:"cause-effect",distractorPolicy:"same-era"
});

rewrite('kta1-t2-q03',{
  text:"I. Göktürk Devleti'nin yıkılışından sonra Çin egemenliği altına giren Türk topluluklarında bağımsızlık arayışlarının sürmesi, II. Göktürk Devleti'nin kuruluşuyla birlikte nasıl bir tarihsel anlam kazanmıştır?",
  correct:"Siyasal bağımsızlık düşüncesinin kesintiye uğrasa da tamamen ortadan kalkmadığını göstermiştir.",
  distractors:[
    "Çin egemenliğinin Türk siyasi teşkilatını kalıcı biçimde ortadan kaldırdığını göstermiştir.",
    "Türk topluluklarının bağımsız devlet kurmaktan vazgeçip yalnız ticari örgütlenmelere yöneldiğini göstermiştir.",
    "Göktürk siyasi geleneğinin yalnız Uygurlar tarafından ve Çin desteğiyle devam ettirildiğini göstermiştir.",
    "Bağımsızlık arayışlarının yalnız dinî nedenlerle ortaya çıktığını göstermiştir."
  ],
  explanation:"Çin hâkimiyeti dönemindeki çeşitli direnç girişimleri ve ardından Kutluk Kağan önderliğinde II. Göktürk Devleti'nin kurulması, siyasi bağımsızlık geleneğinin sürdüğünü gösterir. Tartışmalı tekil kahraman anlatıları yerine tarihsel sürecin kendisi ölçülmektedir.",
  cognitive:"reasoning",skill:"Çin egemenliği ve bağımsızlık geleneği",historyForm:"inference",distractorPolicy:"same-concept-family"
});

rewrite('kta1-t2-q09',{
  text:"626'da Sasanilerle eş zamanlı olarak İstanbul'u kuşatan, aynı zamanda Orta Avrupa'da güçlü bir kağanlık kuran topluluk aşağıdakilerden hangisidir?",
  correct:"Avarlar",
  distractors:["Hazarlar","Bulgarlar","Peçenekler","Kuman-Kıpçaklar"],
  explanation:"Avarlar Orta Avrupa'da güçlü bir siyasi yapı kurmuş ve 626'da Sasanilerle eş zamanlı İstanbul kuşatmasına katılmıştır. Çeldiriciler de Avrupa ve Doğu Avrupa sahasında etkili Türk topluluklarından seçilmiştir.",
  cognitive:"context",skill:"Avarların Avrupa siyaseti",historyForm:"evidence-inference",distractorPolicy:"same-era"
});

rewrite('kta1-t2-q10',{
  text:"Maveraünnehir'de Emevî ilerleyişine karşı özellikle Sulu Kağan döneminde yürütülen mücadeleler hangi Türk siyasi teşkilatını işaret eder?",
  correct:"Türgişler",
  distractors:["Karluklar","Hazarlar","Uygurlar","Kırgızlar"],
  explanation:"Türgişler, özellikle Sulu Kağan döneminde Maveraünnehir'deki Emevî ilerleyişine karşı etkili mücadele yürüttü. Çeldiriciler aynı geniş Orta Asya tarih çevresindeki topluluklardır.",
  cognitive:"context",skill:"Türgişler ve Emevî ilerleyişi",historyForm:"evidence-inference",distractorPolicy:"same-era"
});

rewrite('kta1-t3-q01',{
  text:"Bir kağan, savaş sonrası elde edilen ganimet ve ekonomik imkânları hanedan üyeleriyle bağlı topluluklar arasında paylaştırmaktadır. Bu uygulama eski Türklerde hangi kavramla ilişkilendirilir?",
  correct:"Ülüş",
  distractors:["Kut","Töre","Toy","Tamga"],
  explanation:"Ülüş, pay veya hisse anlamında ekonomik-siyasi paylaşımı ifade eder. Kut hükümdarlık meşruiyeti, töre hukuk düzeni, toy danışma meclisi, tamga ise aidiyet işaretidir.",
  cognitive:"application",skill:"Ülüş kavramını bağlamda ayırt etme",historyForm:"concept-event",distractorPolicy:"same-concept-family"
});

rewrite('kta10-t1-q01',{
  text:"Mondros sonrasında 15. Kolordunun terhis edilmesini engelleyerek Doğu Anadolu'da askerî kapasiteyi koruyan ve Ermenistan'a karşı harekâtı yöneten komutanın bu tutumu, Millî Mücadele açısından hangi sonucu doğurmuştur?",
  correct:"Doğu Cephesi'nde düzenli ve hazır bir askerî gücün erken dönemde kullanılabilmesini sağlamıştır.",
  distractors:[
    "Batı Cephesi'nde Kuvayı Milliyenin tamamen kaldırılmasını sağlamıştır.",
    "İstanbul Hükûmetinin Doğu Anadolu'daki denetimini kesin biçimde güçlendirmiştir.",
    "Güney Cephesi'ndeki Fransız işgalini tek başına sona erdirmiştir.",
    "Boğazlar üzerindeki İtilaf denetimini ortadan kaldırmıştır."
  ],
  explanation:"Kâzım Karabekir'in komuta ettiği 15. Kolordu'nun korunması, Doğu Cephesi'nde TBMM'nin erken dönemde düzenli kuvvet kullanabilmesini sağladı. Soru isim ezberinden çok komuta kararının stratejik sonucunu ölçer.",
  cognitive:"reasoning",skill:"15. Kolordu ve Doğu Cephesi kapasitesi",historyForm:"cause-effect",distractorPolicy:"same-era"
});

rewrite('kta12-t1-q02',{
  text:"Lozan'da çözülemeyip Türkiye ile İngiltere arasında sonraki görüşmelere bırakılan bir sınır meselesi, daha sonra Milletler Cemiyeti sürecine taşınmış ve 1926 Ankara Antlaşması ile sonuçlanmıştır. Bu süreç hangi sorunla ilgilidir?",
  correct:"Musul Sorunu",
  distractors:["Hatay Sorunu","Boğazlar Sorunu","Nüfus mübadelesi sorunu","Yabancı okullar sorunu"],
  explanation:"Lozan'da Musul sınırı kesinleşmedi; Türkiye-İngiltere görüşmeleri ve Milletler Cemiyeti sürecinin ardından 1926 Ankara Antlaşması ile mesele Türkiye aleyhine sonuçlandı.",
  cognitive:"reasoning",skill:"Musul sorununun diplomatik seyri",historyForm:"chronology",distractorPolicy:"same-policy-family"
});

rewrite('kta2-t1-q11',{
  text:"Melikşah döneminde güneş yılına dayalı hassas bir takvim hazırlanması, Büyük Selçuklularda aşağıdaki hangi özelliğin geliştiğine doğrudan kanıt oluşturur?",
  correct:"Astronomi ve matematik bilgisinin devlet ihtiyaçlarıyla ilişkilendirildiğine",
  distractors:[
    "Bilimsel çalışmaların yalnız dinî eğitimle sınırlandırıldığına",
    "Takvim düzeninin bütünüyle Bizans bürokrasisine bırakıldığına",
    "Devletin zaman ölçümünü kullanmaktan vazgeçtiğine",
    "Bilim insanlarının saray ve yönetim çevresinden tamamen dışlandığına"
  ],
  explanation:"Celâlî Takvimi'nin Ömer Hayyam'ın da bulunduğu bir heyetçe hazırlanması, astronomi-matematik bilgisinin takvim ve yönetim ihtiyaçlarıyla ilişkilendirildiğini gösterir.",
  cognitive:"reasoning",skill:"Celâlî Takvimi ve bilim",historyForm:"evidence-inference",distractorPolicy:"same-concept-family"
});

rewrite('kta2-t2-q03',{
  text:"Bir eserde ahlak, bilgi, erdem, dilin doğru kullanımı ve insan davranışları üzerine öğretici öğütler verilmektedir. Bu tanım aşağıdaki Türk-İslam eserlerinden hangisine aittir?",
  correct:"Atabetü'l-Hakayık",
  distractors:["Kutadgu Bilig","Dîvânu Lugâti't-Türk","Divan-ı Hikmet","Siyasetname"],
  explanation:"Edip Ahmet Yükneki'nin Atabetü'l-Hakayık'ı ahlak ve erdem ağırlıklı öğretici bir eserdir. Çeldiriciler aynı kültür çevresindeki diğer temel eserlerden seçilmiştir.",
  cognitive:"context",skill:"Türk-İslam eserlerini içerikten ayırt etme",historyForm:"evidence-inference",distractorPolicy:"same-concept-family"
});

rewrite('kta2-t2-q09',{
  text:"Bir Selçuklu devlet adamı eserinde hükümdarın adaletli olması, görevli seçiminde liyakat gözetmesi ve devlet düzeninin korunması gerektiğini anlatmaktadır. Bu eser aşağıdakilerden hangisidir?",
  correct:"Siyasetname",
  distractors:["Kutadgu Bilig","Atabetü'l-Hakayık","Dîvânu Lugâti't-Türk","Divan-ı Hikmet"],
  explanation:"Nizamülmülk'ün Siyasetname'si hükümdarlık, adalet, bürokrasi ve devlet görevlileri üzerine pratik yönetim öğütleri içerir.",
  cognitive:"context",skill:"Siyasetnameyi içerikten ayırt etme",historyForm:"evidence-inference",distractorPolicy:"same-concept-family"
});

rewrite('kta3-t1-q01',{
  text:"Malazgirt sonrasında Anadolu'da ilerleyen Selçuklu kuvvetleri İznik merkezli bir siyasi teşkilat kurmuştur. Bu oluşumun başındaki hükümdar aşağıdakilerden hangisidir?",
  correct:"Kutalmışoğlu Süleyman Şah",
  distractors:["I. Kılıç Arslan","I. Mesud","II. Kılıç Arslan","I. Gıyaseddin Keyhüsrev"],
  explanation:"Türkiye Selçuklu Devleti'nin kuruluş süreci Kutalmışoğlu Süleyman Şah'ın İznik merkezli hâkimiyetiyle ilişkilidir. Çeldiriciler aynı hanedanın sonraki hükümdarlarından seçilmiştir.",
  cognitive:"context",skill:"Türkiye Selçuklu kuruluş kronolojisi",historyForm:"chronology",distractorPolicy:"near-chronology"
});

rewrite('kta4-t1-q01',{
  text:"Osman Bey döneminde Bizans'a karşı kazanılan bir savaş, beyliğin yalnız yerel bir uç gücü olmadığını göstererek Bizans kaynaklarında da dikkat çekmesine yol açmıştır. 1302 tarihli bu savaş hangisidir?",
  correct:"Koyunhisar (Bafeus) Savaşı",
  distractors:["Sazlıdere Savaşı","Sırpsındığı Savaşı","Çirmen Savaşı","I. Kosova Savaşı"],
  explanation:"1302 Koyunhisar/Bafeus Savaşı Osman Bey döneminin önemli Bizans mücadelelerindendir. Diğer savaşlar Rumeli fetihlerinin daha sonraki evrelerine aittir.",
  cognitive:"context",skill:"Osman Bey dönemi ve Bafeus",historyForm:"evidence-inference",distractorPolicy:"near-chronology"
});

rewrite('kta4-t1-q11',{
  text:"Ankara Savaşı sonrasında hanedan üyeleri arasındaki mücadelelerle parçalanan Osmanlı siyasi birliğinin yeniden kurulması, Çelebi Mehmed dönemini hangi açıdan kritik hâle getirmiştir?",
  correct:"Merkezî otoriteyi ve hanedan birliğini yeniden kurarak devletin devamlılığını sağlaması açısından",
  distractors:[
    "İstanbul'u fethederek Bizans siyasi varlığına son vermesi açısından",
    "Yeniçeri Ocağını kaldırarak modern ordu kurması açısından",
    "Mısır'ı fethederek Memlük Devleti'ni sona erdirmesi açısından",
    "Kanun-ı Esasi'yi ilan ederek meşrutiyeti başlatması açısından"
  ],
  explanation:"Çelebi Mehmed Fetret Devri'ni sona erdirerek Osmanlı siyasi birliğini yeniden kurdu. 'İkinci kurucu' etiketi ezberletmek yerine bu nitelemenin tarihsel gerekçesi ölçülmektedir.",
  cognitive:"reasoning",skill:"Fetret sonrası yeniden merkezîleşme",historyForm:"cause-effect",distractorPolicy:"same-era"
});

rewrite('kta12-t1-q07',{
  text:"1930'larda Balkanlarda mevcut sınırları korumaya ve revizyonist baskılara karşı ortak güvenlik oluşturmaya çalışan Türkiye; Yunanistan, Yugoslavya ve Romanya ile hangi yapıyı kurmuştur?",
  correct:"Balkan Antantı",
  distractors:["Sadabat Paktı","Küçük Antant","Locarno düzeni","Bağlantısızlar Hareketi"],
  explanation:"Türkiye, Yunanistan, Yugoslavya ve Romanya 1934'te Balkan Antantı'nı kurdu. Soru üyeleri tek tek ezberletmek yerine yapı ile güvenlik amacı arasında bağ kurar.",
  cognitive:"context",skill:"Balkan Antantı üyelik ve amaç",historyForm:"policy-purpose",distractorPolicy:"same-institution-family"
});

rewrite('kta12-t1-q09',{
  text:"Türkiye'nin doğu ve güneydoğu çevresinde saldırmazlık ve bölgesel istikrarı güçlendirmek amacıyla İran, Irak ve Afganistan'la 1937'de kurduğu yapı hangisidir?",
  correct:"Sadabat Paktı",
  distractors:["Balkan Antantı","Bağdat Paktı","Küçük Antant","Varşova Paktı"],
  explanation:"Sadabat Paktı Türkiye, İran, Irak ve Afganistan arasında imzalandı. Çeldiriciler de bölgesel güvenlik veya ittifak yapılarıdır.",
  cognitive:"context",skill:"Sadabat Paktı üyelik ve amaç",historyForm:"policy-purpose",distractorPolicy:"same-institution-family"
});

rewrite('kta13-t1-q04',{
  text:"BM Şartı 26 Haziran 1945'te imzalanmış, gerekli onayların tamamlanmasıyla 24 Ekim 1945'te yürürlüğe girmiştir. Bu iki tarih arasındaki fark aşağıdakilerden hangisini gösterir?",
  correct:"Bir uluslararası antlaşmanın imzalanması ile hukuken yürürlüğe girmesinin farklı aşamalar olduğunu",
  distractors:[
    "Birleşmiş Milletlerin NATO'nun askerî kanadı olarak kurulduğunu",
    "BM Şartı'nın II. Dünya Savaşı başlamadan önce yürürlüğe girdiğini",
    "24 Ekim tarihinin yalnız Avrupa devletleri için geçerli olduğunu",
    "26 Haziran'da imzalanan metnin daha sonra tamamen iptal edildiğini"
  ],
  explanation:"26 Haziran imza tarihidir; BM Şartı yeterli onayların tamamlanmasıyla 24 Ekim 1945'te yürürlüğe girdi. Bu ayrım uluslararası hukukta imza ve yürürlük aşamalarını ayırt etmeyi gerektirir.",
  cognitive:"reasoning",skill:"BM kuruluş sürecini yorumlama",historyForm:"document-decision",distractorPolicy:"same-concept-family"
});

rewrite('kta4-t3-q01',{
  text:"Osman Bey dönemini Orhan Bey döneminden ayırmak isteyen bir öğrenci aşağıdaki gelişmelerden hangisini Osman Bey dönemine yerleştirmelidir?",
  correct:"Koyunhisar (Bafeus) Savaşı",
  distractors:["Bursa'nın alınması","İznik'in alınması","Yaya ve müsellem birliklerinin kurulması","Karesioğullarının topraklarının Osmanlılara katılması"],
  explanation:"Koyunhisar Osman Bey dönemindedir. Bursa ve İznik'in alınması, yaya-müsellem teşkilatı ve Karesioğulları gelişmeleri Orhan Bey dönemine aittir.",
  cognitive:"application",skill:"Osman Bey-Orhan Bey kronolojisi",historyForm:"chronology",distractorPolicy:"near-chronology"
});

rewrite('kta5-t1-q11',{
  text:"Kanuni döneminde Safevilerle uzun süren mücadelelerin ardından 1555'te imzalanan Amasya Antlaşması hangi diplomatik dönüm noktasını ifade eder?",
  correct:"Osmanlı Devleti ile Safeviler arasındaki ilk resmî barışın kurulmasını",
  distractors:[
    "Osmanlı-Safevi sınırının bugünkü biçimiyle kesin ve değişmez hâle gelmesini",
    "Safevi Devleti'nin Osmanlı egemenliğine girmesini",
    "Bağdat'ın ilk kez Safevilerden alınmasını",
    "İran üzerindeki bütün Osmanlı-Safevi rekabetinin kalıcı olarak sona ermesini"
  ],
  explanation:"1555 Amasya Antlaşması iki devlet arasındaki ilk resmî barıştır; ancak rekabeti kalıcı biçimde sona erdirmemiş ve sonraki dönemlerde yeni savaşlar yaşanmıştır.",
  cognitive:"reasoning",skill:"Amasya Antlaşmasının diplomatik niteliği",historyForm:"document-decision",distractorPolicy:"same-treaty-family"
});

rewrite('kta-sec4-q03',{
  text:"ABD, 1947'de bir yandan Türkiye ve Yunanistan'a siyasi-güvenlik desteği açıklarken diğer yandan Avrupa'nın ekonomik toparlanmasını finanse eden geniş bir yardım programı başlatmıştır. Bu iki aracın temel farkı hangisidir?",
  correct:"Truman Doktrini güvenlik-siyasi destek, Marshall Planı ise ekonomik yeniden yapılanma ağırlıklıdır.",
  distractors:[
    "Truman Doktrini ekonomik bütünleşme, Marshall Planı askerî ittifak üyeliği sağlamıştır.",
    "Truman Doktrini yalnız Batı Avrupa sanayisini, Marshall Planı yalnız Türkiye ve Yunanistan'ın askerî ihtiyaçlarını hedeflemiştir.",
    "Truman Doktrini Sovyetler Birliği tarafından, Marshall Planı Birleşmiş Milletler tarafından yürütülmüştür.",
    "İki programın da temel işlevi NATO üyeliğini otomatik olarak bütün alıcı devletlere vermektir."
  ],
  explanation:"Truman Doktrini Sovyet baskısına karşı siyasi-güvenlik desteğini, Marshall Planı ise ekonomik toparlanmayı öne çıkarır; ikisi aynı çevreleme stratejisinin farklı araçlarıdır.",
  cognitive:"reasoning",skill:"Truman-Marshall araçlarını ayırt etme",historyForm:"policy-purpose",distractorPolicy:"same-policy-family"
});

rewrite('kta-sec4-q12',{
  text:"Osmanlı yönetimi, farklı dinî cemaatlerin evlenme, boşanma ve bazı dinî-kurumsal işlerini kendi cemaat yapıları içinde yürütmesine izin vermektedir. Bu uygulamanın temel yönetim mantığı hangisidir?",
  correct:"Dinî topluluklara belirli iç işlerinde sınırlı özerklik tanırken siyasal egemenliği merkezde tutmak",
  distractors:[
    "Her dinî topluluğa bağımsız devlet kurma hakkı tanımak",
    "Gayrimüslim cemaatleri Osmanlı hukukunun ve vergi sisteminin bütünüyle dışında bırakmak",
    "Dinî farklılıkları kaldırıp bütün tebaayı tek mezhep altında toplamak",
    "Yerel cemaat liderlerini padişahla eşit egemenlik yetkisine sahip kılmak"
  ],
  explanation:"Millet sistemi, cemaatlere bazı kişisel hukuk ve dinî örgütlenme alanlarında hareket imkânı tanırken siyasal egemenliği Osmanlı merkezinde tutan bir yönetim pratiğidir.",
  cognitive:"reasoning",skill:"Millet sisteminin yönetim mantığı",historyForm:"institution-function",distractorPolicy:"same-concept-family"
});

rewrite('kta-sec5-q06',{
  text:"Türkiye, Montrö'de Boğazlar rejimini çok taraflı konferansla değiştirmiş; Hatay meselesinde ise Fransa, Milletler Cemiyeti ve yerel siyasi iradeyi birlikte kullanmıştır. Bu iki örnekten hangi ortak dış politika ilkesi çıkarılabilir?",
  correct:"Değişen uluslararası koşulları savaş yerine diplomatik ve hukuki araçlarla egemenlik lehine kullanma",
  distractors:[
    "Sınır ve egemenlik sorunlarını yalnız askerî müdahaleyle çözme",
    "Uluslararası kuruluşları dışlayıp bütün sorunları yalnız ikili gizli antlaşmalarla çözme",
    "Mevcut antlaşma düzenini hiçbir koşulda değiştirmemeyi dış politikanın temel ilkesi sayma",
    "Büyük devletlerden birinin korumasına girerek dış politika sorunlarını ona devretme"
  ],
  explanation:"Montrö ve Hatay farklı konular olsa da Türkiye her ikisinde de değişen güç dengesini diplomasi ve hukuk yoluyla egemenlik hedefleri için kullanmıştır.",
  cognitive:"reasoning",skill:"Barışçı revizyon ve diplomasi",historyForm:"inference",distractorPolicy:"same-policy-family"
});

rewrite('kta10-t1-q02',{
  text:"Doğu Cephesi'nde Ermenistan'a karşı elde edilen askerî başarının hemen ardından TBMM Hükûmeti bir uluslararası antlaşma imzalamıştır. Bu gelişme Gümrü Antlaşması'nın hangi önemini açıklar?",
  correct:"TBMM Hükûmetinin askerî başarısını ilk kez uluslararası bir antlaşmayla diplomatik kazanıma dönüştürmesini",
  distractors:[
    "Batı Cephesi'ndeki Yunan savaşını sona erdiren ilk barış olması",
    "Boğazlar rejimini TBMM lehine değiştiren ilk çok taraflı sözleşme olması",
    "İtilaf Devletlerinin tamamının TBMM'yi aynı anda tanımasını sağlayan genel barış olması",
    "Musul sınırını belirleyerek Türkiye-Irak sınırını kesinleştirmesi"
  ],
  explanation:"Gümrü TBMM Hükûmetinin imzaladığı ilk uluslararası antlaşmadır. Doğu Cephesi'ndeki askerî başarının diplomatik tanınma ve sınır düzenlemesine dönüşmesi bakımından önemlidir.",
  cognitive:"reasoning",skill:"Gümrü'nün askerî-diplomatik önemi",historyForm:"document-decision",distractorPolicy:"same-treaty-family"
});

rewrite('kta10-t2-q03',{
  text:"Moskova Antlaşması'nda şekillenen doğu sınırı ilkelerinin Kafkas cumhuriyetleriyle de kabul edilmesi amacıyla imzalanan antlaşma hangisidir?",
  correct:"Kars Antlaşması",
  distractors:["Gümrü Antlaşması","Ankara Antlaşması","Mudanya Ateşkesi","Lozan Antlaşması"],
  explanation:"1921 Kars Antlaşması, Türkiye ile Sovyet Ermenistanı, Azerbaycanı ve Gürcistanı arasında doğu sınırını Moskova çizgisi temelinde ayrıntılandırdı.",
  cognitive:"reasoning",skill:"Moskova-Kars ilişkisi",historyForm:"chronology",distractorPolicy:"same-treaty-family"
});

rewrite('kta10-t2-q12',{
  text:"Büyük Taarruz sonrasında Türk ordusu Boğazlar ve Doğu Trakya yönünde yeni bir büyük savaşa girmeden, Yunan kuvvetlerinin Doğu Trakya'dan çekilmesini kabul ettirmiştir. Bu sonuç hangi antlaşmayla sağlanmıştır?",
  correct:"Mudanya Ateşkes Antlaşması",
  distractors:["Ankara Antlaşması","Kars Antlaşması","Moskova Antlaşması","Lozan Barış Antlaşması"],
  explanation:"Mudanya Ateşkesi askerî çatışmayı durdururken Doğu Trakya'nın savaş yapılmadan Türk yönetimine devredilmesinin yolunu açtı; Lozan ise kalıcı barış düzenini kurdu.",
  cognitive:"reasoning",skill:"Mudanya'nın askerî-diplomatik sonucu",historyForm:"document-decision",distractorPolicy:"same-treaty-family"
});

rewrite('kta10-t4-q08',{
  text:"Sakarya Zaferi'nden sonra Türk ordusu yaklaşık bir yıl boyunca eğitim, ikmal ve personel hazırlığı yapmış; ardından düşman ana kuvvetlerini çevreleyip çözmeyi hedefleyen geniş çaplı bir harekât başlatmıştır. Bu hazırlığın stratejik amacı hangisidir?",
  correct:"Savunma üstünlüğünü kesin sonuçlu taarruza çevirerek Yunan ana ordusunun savaşma kapasitesini kırmak",
  distractors:[
    "Yalnız Afyon çevresindeki savunma hattını koruyup cepheyi sabitlemek",
    "Batı Cephesi'ndeki kuvvetleri Doğu Cephesi'ne aktararak Ermenistan'a yeni harekât başlatmak",
    "İtilaf Devletleriyle görüşmeleri kesip İstanbul üzerine öncelikli taarruz yapmak",
    "Kuvayı Milliye düzenine geri dönerek merkezî komutayı gevşetmek"
  ],
  explanation:"Büyük Taarruz savunma mevzisini korumak için değil, Yunan ana ordusunu kesin yenilgiye uğratıp işgalin askerî dayanağını ortadan kaldırmak için planlandı.",
  cognitive:"reasoning",skill:"Büyük Taarruz stratejik amacı",historyForm:"purpose-result",distractorPolicy:"same-concept-family"
});

rewrite('kta11-t1-q04',{
  text:"1924'te medrese, mektep ve diğer eğitim kurumlarının farklı otoriteler yerine aynı kamu yönetimi altında toplanması hangi temel soruna çözüm üretmek için yapılmıştır?",
  correct:"Eğitimde kurum ve otorite ikiliğini azaltarak ortak ve merkezî bir sistem kurmak",
  distractors:[
    "Yükseköğretimi yalnız askerî okullarla sınırlandırmak",
    "Yerel dinî cemaatlerin bağımsız eğitim sistemlerini devlet dışında genişletmek",
    "Bütün özel ve yabancı okulları herhangi bir denetime tabi olmadan serbest bırakmak",
    "Eğitim politikasını merkezden çıkarıp yalnız belediyelerin yetkisine bırakmak"
  ],
  explanation:"Tevhid-i Tedrisat Kanunu eğitim kurumlarını Millî Eğitim çatısı altında birleştirerek farklı otorite ve programların oluşturduğu ikili yapıyı azaltmayı amaçladı.",
  cognitive:"reasoning",skill:"Tevhid-i Tedrisatın sistem sorunu",historyForm:"purpose-result",distractorPolicy:"same-institution-family"
});

rewrite('kta12-t1-q03',{
  text:"Musul meselesinin Milletler Cemiyeti süreci sonrasında Türkiye ile İngiltere-Irak arasında 1926'da imzalanan bir antlaşmayla kapanması, aşağıdaki hangi sonucu doğurmuştur?",
  correct:"Musul'un Irak sınırları içinde kalması ve Türkiye-Irak sınırının büyük ölçüde kesinleşmesi",
  distractors:[
    "Hatay'ın Türkiye'ye katılması ve Suriye sınırının bütünüyle çözülmesi",
    "Boğazlar Komisyonunun kaldırılması ve Türkiye'nin Boğazları silahlandırması",
    "Batı Trakya'nın Türkiye'ye bırakılması ve mübadele sorununun sona ermesi",
    "Irak'ın Türkiye'ye bağlanması ve İngiliz mandasının aynı gün sona ermesi"
  ],
  explanation:"1926 Ankara Antlaşması Musul'u Irak'ta bıraktı ve Türkiye-Irak sınırını büyük ölçüde kesinleştirdi. Hatay, Boğazlar ve mübadele farklı diplomatik dosyalardır.",
  cognitive:"reasoning",skill:"1926 Ankara Antlaşması sonucu",historyForm:"document-decision",distractorPolicy:"same-policy-family"
});

rewrite('kta12-t2-q06',{
  text:"Türkiye 1930'larda Balkanlarda bir, doğu komşuluk çevresinde başka bir bölgesel pakt kurmuştur. Balkan Antantı ile Sadabat Paktı hangi ortak dış politika ihtiyacına cevap vermiştir?",
  correct:"Yakın çevrede saldırmazlık ve mevcut sınırları koruyan bölgesel güvenlik ağları oluşturma",
  distractors:[
    "Türkiye'nin iki bölgede de yeni toprak taleplerini ortak askerî harekâtla gerçekleştirme",
    "Boğazlar rejimini pakt üyelerine devrederek Türkiye'nin tek taraflı yetkisini azaltma",
    "Bütün üye ülkeleri tek ekonomik pazar ve ortak para biriminde birleştirme",
    "Milletler Cemiyetinden ayrılarak alternatif bir dünya örgütü kurma"
  ],
  explanation:"İki paktın üyeleri ve coğrafyası farklıdır; ortak yönleri saldırmazlık, statükonun korunması ve bölgesel güvenliği güçlendirme hedefidir.",
  cognitive:"reasoning",skill:"Bölgesel paktların ortak amacı",historyForm:"policy-purpose",distractorPolicy:"same-policy-family"
});

rewrite('kta13-t1-q07',{
  text:"II. Dünya Savaşı sonrasında Batı Avrupa'da üretim kapasitesi çökmüş, işsizlik ve siyasi istikrarsızlık artmıştır. ABD'nin geniş ölçekli ekonomik yardım programı bu tabloya hangi stratejiyle cevap vermiştir?",
  correct:"Ekonomik toparlanmayı destekleyerek Batı Avrupa'nın siyasi ve toplumsal dayanıklılığını güçlendirmek",
  distractors:[
    "Avrupa devletlerini doğrudan ABD eyaletlerine dönüştürmek",
    "Askerî savunmayı ekonomik yardımdan ayırıp yalnız NATO bütçesini finanse etmek",
    "Doğu Avrupa ülkelerini Varşova Paktına katılmaya teşvik etmek",
    "Birleşmiş Milletlerin ekonomik görevlerini kaldırıp bütün yetkileri NATO'ya vermek"
  ],
  explanation:"Marshall Planı ekonomik yeniden yapılanmayı destekledi; aynı zamanda ekonomik çöküşün Sovyet/komünist nüfuzunu artırmasını sınırlayan çevreleme stratejisinin ekonomik ayağı oldu.",
  cognitive:"reasoning",skill:"Marshall Planının stratejik işlevi",historyForm:"policy-purpose",distractorPolicy:"same-policy-family"
});

rewrite('kta13-t1-q08',{
  text:"Bir üye devlete yönelik silahlı saldırının diğer üyelerin güvenliğiyle bağlantılı sayılması ilkesi aşağıdaki hangi Soğuk Savaş kurumunun temel mantığıdır?",
  correct:"NATO",
  distractors:["Birleşmiş Milletler Genel Kurulu","Avrupa Kömür ve Çelik Topluluğu","Bağlantısızlar Hareketi","Comecon"],
  explanation:"NATO kolektif savunma ittifakıdır; saldırının ortak güvenlik meselesi sayılması ittifakın temel mantığını oluşturur. Diğer seçenekler farklı siyasi-ekonomik işlevlere sahiptir.",
  cognitive:"application",skill:"Kolektif savunmayı kurumla eşleştirme",historyForm:"institution-function",distractorPolicy:"same-institution-family"
});

rewrite('kta13-t2-q09',{
  text:"1962'de Sovyetler Birliği'nin Küba'ya nükleer füze yerleştirmesi üzerine ABD deniz ablukası uygulamış, iki taraf geri adım formülleri üzerinde uzlaşmıştır. Bu krizin Soğuk Savaş açısından en önemli sonucu hangisidir?",
  correct:"Nükleer caydırıcılığın yanında kriz iletişimi ve yanlış hesaplamayı önleyici mekanizmaların öneminin daha açık görülmesi",
  distractors:[
    "NATO ve Varşova Paktının tek askerî örgüt hâlinde birleşmesi",
    "ABD ile SSCB arasındaki bütün nükleer silahların kısa sürede ortadan kaldırılması",
    "Küba'nın Sovyet Blokundan ayrılarak NATO'ya katılması",
    "Soğuk Savaş'ın 1962'de resmen sona ermesi"
  ],
  explanation:"Küba Füze Krizi iki süper gücü nükleer çatışmaya çok yaklaştırdı. Sonrasında doğrudan iletişim ve silah kontrolü adımlarının önem kazanması, kriz yönetimi dersinin somut sonucudur.",
  cognitive:"reasoning",skill:"Küba Krizi ve nükleer kriz yönetimi",historyForm:"cause-effect",distractorPolicy:"same-concept-family"
});

rewrite('kta13-t4-q04',{
  text:"Aşağıdaki iki tanımdan ilki evrensel üyelik ve uluslararası barış-güvenlik işlevini, ikincisi ise belirli üyeler arasında kolektif savunmayı anlatmaktadır. Bu kurum çifti hangisidir?",
  correct:"Birleşmiş Milletler - NATO",
  distractors:["NATO - Birleşmiş Milletler","Avrupa Birliği - Varşova Paktı","Comecon - Avrupa Konseyi","Bağlantısızlar Hareketi - NATO"],
  explanation:"BM evrensel nitelikte çok amaçlı uluslararası örgüttür; NATO ise üyeleri arasında kolektif savunmaya dayalı bölgesel askerî-siyasi ittifaktır.",
  cognitive:"application",skill:"BM ve NATO'yu işlevden ayırt etme",historyForm:"institution-function",distractorPolicy:"same-institution-family"
});

rewrite('kta7-t2-q06',{
  text:"1808 tarihli bir belge ayanlarla merkez arasında karşılıklı yükümlülükleri düzenlerken, 1839 tarihli başka bir belge can-mal güvenliği, vergi ve askerlikte hukukilik vurgusu yapmıştır. Bu iki belgenin temel farkı hangisidir?",
  correct:"Sened-i İttifak merkez-ayan güç ilişkisini, Tanzimat Fermanı ise devlet-tebaa hukuk güvencelerini öne çıkarır.",
  distractors:[
    "Sened-i İttifak anayasal vatandaşlığı, Tanzimat Fermanı yalnız ayanların yerel yetkilerini düzenler.",
    "Sened-i İttifak gayrimüslim eşitliğini, Tanzimat Fermanı padişahın mutlak yetkisini genişletir.",
    "Sened-i İttifak meclisli yönetime, Tanzimat Fermanı yeniçeri sistemine geçişi başlatır.",
    "Her iki belge de aynı siyasi aktörlerle aynı yıl hazırlanmış ve aynı hukuki kapsamı taşımıştır."
  ],
  explanation:"Sened-i İttifak merkez ile ayanlar arasındaki güç ve yükümlülük ilişkisini; Tanzimat ise tebaaya yönelik güvenlik, vergi ve askerlik gibi alanlarda hukuki taahhütleri öne çıkarır.",
  cognitive:"reasoning",skill:"Sened-i İttifak-Tanzimat belge ayrımı",historyForm:"document-decision",distractorPolicy:"same-document-family"
});

rewrite('kta7-t2-q09',{
  text:"Tanzimat ve Islahat fermanları farklı vurgu ve hedef gruplarına sahip olsa da hangi ortak dönüşüm çizgisinin parçalarıdır?",
  correct:"Devlet-tebaa ilişkisini daha kurallı bir hukuk ve eşitlik çerçevesine taşıma arayışının",
  distractors:[
    "Saltanatın kaldırılıp cumhuriyet yönetimine geçilmesinin",
    "Merkezî yönetimin taşra üzerindeki bütün yetkilerinden vazgeçmesinin",
    "Yeniçeri Ocağının yeniden kurulup askerî düzenin eski hâline döndürülmesinin",
    "Tımar sisteminin bütün imparatorlukta özel mülkiyet biçiminde yeniden kurulmasının"
  ],
  explanation:"Tanzimat can-mal güvenliği, vergi ve askerlikte hukukilik; Islahat ise özellikle gayrimüslimlerin statüsünde eşitlik yönünü genişletti. Ortak çizgi hukuki düzenleme ve vatandaşlık statüsünün geliştirilmesidir.",
  cognitive:"reasoning",skill:"Tanzimat-Islahat ortak reform çizgisi",historyForm:"inference",distractorPolicy:"same-document-family"
});

rewrite('kta8-t1-q07',{
  text:"I. Balkan Savaşı'nda Osmanlı'ya karşı birlikte hareket eden Balkan devletlerinin kısa süre sonra birbirleriyle savaşa girmesi hangi yapısal sorunu gösterir?",
  correct:"Ortak düşmana dayalı ittifakın, savaş sonrası toprak paylaşımı konusunda çıkar çatışmasına dönüşebildiğini",
  distractors:[
    "Balkan devletlerinin savaş sonunda Osmanlı yönetimine yeniden bağlandığını",
    "İttifakın ortak bir federal devlet kurma hedefiyle kalıcı biçimde güçlendiğini",
    "Osmanlı Devleti'nin paylaşım anlaşmazlığının dışında kalıp bütün kayıplarını geri aldığını",
    "Rusya'nın bütün Balkan devletlerini savaş dışında tutmayı başardığını"
  ],
  explanation:"I. Balkan Savaşı sonrası özellikle Makedonya'nın paylaşımı eski müttefikleri karşı karşıya getirdi ve II. Balkan Savaşı'nı doğurdu.",
  cognitive:"reasoning",skill:"Balkan ittifakında çıkar çatışması",historyForm:"cause-effect",distractorPolicy:"same-era"
});

rewrite('kta9-t1-q04',{
  text:"İşgallere karşı miting düzenlenmesi, protesto telgrafları çekilmesi ve tepkilerin taşkınlığa dönüşmemesinin istenmesi, Millî Mücadele'nin hangi erken stratejisini gösterir?",
  correct:"Kamuoyu tepkisini örgütlü ve kontrollü biçimde görünür kılarak millî direnişe toplumsal zemin oluşturma",
  distractors:[
    "İşgalleri kabul edip yalnız diplomatik nota vermekle yetinme",
    "Direnişi yalnız askerî birliklerin görevi sayıp halkı süreç dışında tutma",
    "Manda yönetimini halk hareketleri yoluyla meşrulaştırma",
    "İstanbul Hükûmetinin Anadolu'daki otoritesini koşulsuz güçlendirme"
  ],
  explanation:"Havza Genelgesi miting, protesto ve telgraflarla kamuoyu oluşturmayı amaçladı; kontrollü kitlesel tepki millî direnişin toplumsal tabanını genişletmeye yönelikti.",
  cognitive:"reasoning",skill:"Havza'nın toplumsal mobilizasyon stratejisi",historyForm:"policy-purpose",distractorPolicy:"same-document-family"
});

root.RotaKpssHistoryEditorialPass2={version:2,reviewedSample:100,rewrittenQuestions:36};
if(typeof module==='object')module.exports=root.RotaKpssHistoryEditorialPass2;
})(typeof window!=='undefined'?window:globalThis);
