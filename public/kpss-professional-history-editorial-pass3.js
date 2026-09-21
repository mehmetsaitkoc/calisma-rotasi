(function(root){
'use strict';
const bank=root.RotaKpssProfessionalHistory;
if(!bank)return;
const all=[
  ...(bank.tests||[]).flatMap(t=>t.questions||[]),
  ...(bank.sectionExams||[]).flatMap(t=>t.questions||[])
];
const byId=new Map(all.map(q=>[q.id,q]));
function rebalance(id,distractors){
  const q=byId.get(id);
  if(!q)throw new Error('Editorial pass 3 question missing: '+id);
  if(!Array.isArray(distractors)||distractors.length!==4)throw new Error('Editorial pass 3 requires four distractors: '+id);
  const options=[...distractors];
  options.splice(q.answer,0,q.answerText);
  q.options=options;
  q.editorialStatus='reviewed';
}

rebalance('kta12-t3-q12',[
  "Lozan sonrasında bütün dış politika sorunlarını yalnız askerî baskıyla çözmeye ve bölgesel ittifaklardan uzak durmaya dayanan politika",
  "Uluslararası kuruluşlardan uzak kalıp güvenliği yalnız tek bir büyük devletle ikili ittifak kurarak sağlamaya çalışan politika",
  "Mevcut sınır ve antlaşma düzenini hiçbir koşulda tartışmaya açmadan, bütün egemenlik sorunlarını dondurmayı amaçlayan politika",
  "Komşu ülkelerin iç siyasal gelişmelerine müdahaleyi ve yeni toprak kazanmayı dış politikanın temel aracı sayan politika"
]);

rebalance('kta13-t4-q12',[
  "Dönem boyunca ekonomik krizlerin etkisi sınırlı kalmış, uluslararası düzen esas olarak sömürge imparatorluklarının değişmeden sürmesiyle şekillenmiştir",
  "II. Dünya Savaşı sonrasında iki kutuplu rekabet kurulmuş ancak sömürgesizleşme ve yeni bağımsız devletlerin sisteme katılması önemli bir değişim yaratmamıştır",
  "Uluslararası örgütler ve bölgesel bütünleşmeler dünya siyasetinde ikincil kalmış, devletler arası ilişkiler yalnız askerî ittifaklarla belirlenmiştir",
  "1929 sonrasında uluslararası sistem büyük ölçüde Avrupa içi gelişmelerle sınırlı kalmış, Asya ve Afrika’daki dönüşümler küresel dengeyi etkilememiştir"
]);

rebalance('kta11-t4-q12',[
  "Modernleşmeyi yalnız yönetim biçimi ve seçim sistemiyle sınırlayıp hukuk, eğitim, ekonomi ve toplumsal yaşamı büyük ölçüde eski yapısıyla sürdürmek",
  "Toplumsal dönüşümü esas olarak kıyafet ve alfabe değişikliklerine indirgerken ekonomik bağımsızlık ve hukuk birliği konularını ikincil görmek",
  "Ekonomik kalkınmayı siyasi ve hukuki dönüşümlerden bütünüyle ayrı ele alıp devlet-toplum ilişkilerinde kapsamlı değişimden kaçınmak",
  "Osmanlı kurumlarının temel yapısını koruyup yalnız dış görünüşte yenilik yaparak çağdaşlaşmayı sınırlı bir reform programı olarak yürütmek"
]);

rebalance('kta7-t3-q08',[
  "Tanzimat Fermanı devletin anayasal örgütlenmesini ayrıntılı biçimde kurarken Kanun-ı Esasi yalnız vergi ve askerlik yükümlülüklerini düzenleyen bir padişah iradesidir",
  "Tanzimat Fermanı halk egemenliğine dayalı bir anayasa iken Kanun-ı Esasi merkez ile ayanlar arasındaki yetki paylaşımını düzenleyen bir uzlaşma belgesidir",
  "Tanzimat Fermanı yalnız gayrimüslimlerin statüsünü düzenlerken Kanun-ı Esasi bütün tebaaya can ve mal güvenliği sağlayan bir reform fermanıdır",
  "İki metin de aynı hukuki nitelikte olup temel fark yalnız Kanun-ı Esasi’nin Tanzimat’tan daha sonra ilan edilmiş olmasından ibarettir"
]);

rebalance('kta7-t3-q05',[
  "Belge doğrudan halk tarafından seçilmiş bir kurucu meclisçe hazırlanıp padişahın yetkilerini anayasal olarak sınırlandırdığı için modern anayasa sayılmalıdır",
  "Metin yalnız vergi ve askerlik hükümleri içerdiğinden siyasal iktidar ilişkileriyle hiçbir bağlantısı bulunmadığı için anayasa sayılmamalıdır",
  "Belge Tanzimat sonrasında ilan edilip gayrimüslimlere eşit vatandaşlık tanıdığı için anayasal gelişmenin doğrudan başlangıcı kabul edilmelidir",
  "Metin padişah tarafından hiç tanınmamış sözlü bir yerel gelenek olduğundan merkezî yönetim açısından herhangi bir siyasi sonuç doğurmamıştır"
]);

rebalance('kta10-t3-q08',[
  "Yunan ana kuvvetleri yenildikten sonra Türk ordusunun takip yerine savunmada kalarak yeni bir cephe hattı kurulmasına izin verdiğini",
  "Başkomutanlık Meydan Muharebesi sonrasında kuvvetlerin büyük bölümünün Doğu Cephesi’ne aktarılıp Batı Anadolu harekâtının yavaşlatıldığını",
  "Türk ordusunun takip harekâtını Fransız birliklerine bırakarak İzmir’e ilerlemeyi yalnız diplomatik görüşmelerle sürdürdüğünü",
  "Mudanya Ateşkesi daha önce imzalandığı için İzmir’e doğru ilerleyişin askerî değil yalnız sembolik bir yürüyüş niteliği taşıdığını"
]);

rebalance('kta3-t2-q08',[
  "Yassıçemen’de Bizans kuvvetlerinin yenilmesi Selçukluların batı sınırını güvence altına almış, Kösedağ’da da aynı rakip karşısında bu üstünlük sürdürülmüştür",
  "Kösedağ Savaşı Yassıçemen’den önce gerçekleştiği için Harzemşahların güçlenmesi Moğol baskısını Anadolu’dan uzaklaştırmış ve Selçuklu hâkimiyetini güçlendirmiştir",
  "Her iki savaş Selçuklu zaferiyle sonuçlandığından XIII. yüzyıl boyunca Anadolu’da dış tehditler azalmış ve merkezî otorite kesintisiz güçlenmiştir",
  "Yassıçemen’den sonra Harzemşahların güçlenmesi Selçuklular için koruyucu bir tampon oluşturmuş, bu nedenle Kösedağ’da Moğol ilerleyişi kolaylıkla durdurulmuştur"
]);

rebalance('kta6-t3-q12',[
  "Klasik Osmanlı düzeninde askerî, mali, sosyal ve cemaat işlevleri büyük ölçüde tek merkezî kurumda toplanmış ve ayrı uzmanlaşmış yapılar gelişmemiştir",
  "Enderun, tımar, vakıf ve millet sistemi aynı amaç için kurulmuş olup temel işlevleri yalnız merkez hazinesinin gelirlerini doğrudan artırmaktır",
  "Bu kurumların ortak özelliği taşra ve toplum üzerindeki merkezî denetimi azaltıp bütün hizmetleri yerel toplulukların bağımsız yönetimine bırakmalarıdır",
  "Osmanlı klasik kurumları sosyal ve ekonomik hayatı düzenlemek yerine yalnız savaş zamanlarında kullanılan geçici askerî örgütlenmeler olarak işlev görmüştür"
]);

rebalance('kta-sec3-q18',[
  "Merkezî bürokrasiyi yeniden tımar gelirlerine bağlayarak memurların düzenli maaş yerine kişisel vergi kaynaklarıyla geçinmesini sağlama çabasını",
  "Devlet görevlerini kalıtsal aile ayrıcalıklarına dönüştürerek üst düzey makamların belirli hanedanlar arasında paylaşılmasını kurumsallaştırma çabasını",
  "Yeniçeri Ocağı ve geleneksel saray hizmetlerini güçlendirerek modern memuriyet düzenlemelerinin uygulanmasını sınırlandırma çabasını",
  "Müsadereyi genişleterek bütün özel serveti hazineye aktarma ve ücretli memuriyet sistemini tamamen ortadan kaldırma çabasını"
]);

rebalance('kta11-t2-q01',[
  "Cumhuriyetçilik sınıfsal ayrıcalıkların kaldırılmasını, halkçılık ise devlet başkanının seçimle belirlenmesini esas alan iki tamamen ayrı yönetim ilkesidir",
  "Cumhuriyetçilik ekonomik yatırımlarda devletin rolünü, halkçılık ise din ve devlet işlerinin ayrılmasını düzenleyen iki kurumsal ilkeye karşılık gelir",
  "Cumhuriyetçilik yalnız dış politika ve bağımsızlık sorunlarına, halkçılık ise yalnız eğitim-kültür reformlarına ilişkin iki uygulama alanını ifade eder",
  "Cumhuriyetçilik ve halkçılık aynı kavramın iki adı olup millî egemenlik ile eşit yurttaşlık arasında herhangi bir işlev ayrımı yapılmaz"
]);

rebalance('kta8-t1-q12',[
  "Osmanlı Devleti’nin savaştan çekilmesine rağmen ordunun ve stratejik ulaşım hatlarının bütünüyle kendi denetiminde kalmasını sağlayan sınırlı bir ateşkes düzeni kurulması",
  "İtilaf Devletlerinin işgal yetkilerini sınırlandırarak Osmanlı egemenliğini savaş öncesinden daha güçlü hâle getiren geçici bir barış ortamı oluşturulması",
  "Savaşın Osmanlı açısından sona ermesiyle birlikte Sevr hükümlerinin geçersiz sayılması ve devletin kaybettiği bütün toprakları geri alma sürecinin başlaması",
  "Osmanlı’nın savaştan çekilirken askerî gücünü koruması ve Boğazları tek başına denetlemeye devam etmesi sayesinde işgal riskinin ortadan kalkması"
]);

rebalance('kta13-t4-q10',[
  "Eski rakip devletlerin ekonomik ilişkilerini azaltıp her ülkenin stratejik sektörlerini yalnız ulusal denetim altında tutarak karşılıklı bağımlılığı sınırlamak",
  "Avrupa devletlerini askerî ittifak yoluyla tek bir merkezî devlet altında birleştirip ekonomik kurumları savunma politikalarına tabi kılmak",
  "Savaş sonrası barışı sağlamak için ekonomik iş birliği yerine yalnız diplomatik konferanslar ve ikili saldırmazlık antlaşmalarına dayanmak",
  "Kömür ve çelik gibi stratejik sektörlerde ortak yönetim yerine ulusal üretim kotalarını artırarak devletler arası rekabeti teşvik etmek"
]);

rebalance('kta3-t4-q09',[
  "Selçuklu Devleti Miryokefalon’dan Kösedağ’a kadar kesintisiz biçimde gerilemiş, siyasi ve ekonomik bakımdan güçlenme dönemi yaşamamıştır",
  "Miryokefalon sonrasında dış tehditler büyük ölçüde ortadan kalktığı için Kösedağ’a kadar Anadolu’da askerî ve siyasi kriz yaşanmamıştır",
  "Kösedağ yenilgisi Selçukluların Moğollara karşı bağımsızlığını güçlendirmiş, merkezî otoriteyi önceki döneme göre daha sağlam hâle getirmiştir",
  "Miryokefalon ve Kösedağ aynı düşmana karşı kazanılmış iki zafer olup Anadolu’daki Selçuklu hâkimiyetinin kesintisiz yükselişini göstermektedir"
]);

rebalance('kta-sec5-q21',[
  "Ahilerin yalnız askerî birlikler olarak faaliyet göstermesi, Osmanlı beyliğinin şehir ekonomisi ve esnaf çevreleriyle ilişki kurmasını gereksiz hâle getirmiştir",
  "Ahilerin Bizans idaresi içinde resmî vergi memurları olarak çalışması, Osmanlıların şehir yönetimini doğrudan Bizans kurumlarından devralmasını sağlamıştır",
  "Ahilerin siyasi otoriteden tamamen bağımsız kapalı zümreler olarak kalması, yeni beyliğin şehirli kesimlerle meşruiyet ilişkisi kurmasını sınırlandırmıştır",
  "Ahilerin yalnız dinî eğitim kurumları olarak işlemesi, üretici ve tüccar çevrelerle ekonomik dayanışma işlevi taşımadığını göstermektedir"
]);

rebalance('kta11-t2-q09',[
  "Özel sanayinin gelişmiş olduğu sektörlerde devlet yatırımlarını azaltarak üretimi tamamen ithalata ve yabancı sermayeye bırakmaya",
  "Tarım üretimini merkezî planla sınırlandırıp bütün ekonomik kaynakları yalnız büyük toprak sahiplerinin denetimine vermeye",
  "Devlet işletmelerini geçici olarak kurup temel sanayi yerine yalnız tüketim malları ithalatını artırmaya",
  "Özel girişimin bütün alanlarda yasaklanması ve küçük işletmelerin de doğrudan devlet mülkiyetine geçirilmesiyle tam kolektif ekonomi kurmaya"
]);

rebalance('kta10-t3-q05',[
  "Savaşın başarısının büyük ölçüde gönüllü yerel milislere dayandığını ve merkezî ordunun lojistik planlamaya sınırlı ihtiyaç duyduğunu",
  "Dış yardımların ordunun bütün ihtiyaçlarını karşıladığını, bu nedenle iç ekonomik seferberliğin askerî sonuç üzerinde belirleyici olmadığını",
  "Cephe gerisi kaynakların savaş gücüyle doğrudan ilişkili olmadığını ve hazırlık süresinin yalnız diplomatik görüşmeler nedeniyle uzadığını",
  "Sakarya sonrası askerî üstünlüğün kendiliğinden kesin zafer getirdiğini, eğitim ve ikmal hazırlıklarının taarruz kapasitesine ek katkı sağlamadığını"
]);

rebalance('kta10-t2-q08',[
  "Başkomutanlık yetkisini sona erdirip ordunun ikmal sorumluluğunu bütünüyle yerel yönetimlere bırakmak",
  "Sakarya öncesi ordunun ihtiyaçlarını dış borçlanma yoluyla karşılayıp iç kaynak kullanımını en düşük düzeye indirmek",
  "Yunan ilerleyişi karşısında düzenli orduyu küçültüp savunmayı yeniden yalnız Kuvayı Milliye birliklerine bırakmak",
  "Toplumun mal ve ulaşım kaynaklarını savaş dışında tutarak cephe gerisinin ekonomik hayatını askerî ihtiyaçlardan tamamen ayırmak"
]);

rebalance('kta-sec2-q06',[
  "Merkezî yönetimin taşradaki üretici köylülerin toprağını özel mülkiyete dönüştürerek ayanların ekonomik bağımsızlığını güçlendirmek",
  "Üst düzey görevlilerin servet birikimini koruyarak bürokratik makamların merkezden bağımsız kalıtsal güç odaklarına dönüşmesini teşvik etmek",
  "Devlet adamlarının servetini görev süresince dokunulmaz kabul ederek hazinenin bürokratik gelirlerle ilişkisini tamamen ortadan kaldırmak",
  "Müsadereyi yalnız esnaf ve lonca üyelerine uygulayarak askerî-idari sınıfın ekonomik ayrıcalıklarını genişletmek"
]);

rebalance('kta9-t3-q04',[
  "Yalnız ateşkes koşullarını ve orduların geri çekilmesini düzenleyen, siyasi hedef veya meşruiyet tartışması içermeyen teknik bir askerî metin niteliğini",
  "Merkezî hükûmetin bütün yetkilerini güçlendiren ve millî hareketin bağımsız karar alma iddiasını reddeden resmî bir yönetim talimatı niteliğini",
  "İşgalleri geçici olarak kabul ederken dış koruma altında bölgesel özerklik öneren sınırlı bir diplomatik uzlaşma metni niteliğini",
  "Yerel belediye ve idarelerin görev dağılımını düzenleyip ulusal siyasi hedefler hakkında herhangi bir yaklaşım geliştirmeyen idari metin niteliğini"
]);

rebalance('kta5-t4-q12',[
  "Osmanlı genişlemesinin esas olarak tek bir coğrafi bölgede yürüdüğünü ve farklı stratejik merkezlerin imparatorluk kapasitesine sınırlı katkı yaptığını",
  "XV-XVI. yüzyıl fetihlerinin birbirinden bağımsız tesadüfi askerî başarılar olduğunu ve ticaret yolları ya da siyasi bütünlükle bağlantı taşımadığını",
  "İstanbul, Mısır ve Orta Avrupa’daki başarıların aynı hükümdar döneminde gerçekleştiğini ve tek bir kısa sefer programının parçaları olduğunu",
  "Osmanlı büyümesinin yalnız deniz gücüne dayandığını, kara yolları ve kıtalar arası siyasi merkezlerin genişlemede belirleyici olmadığını"
]);

rebalance('kta-sec4-q24',[
  "Türkiye’nin iki sorunda da aynı diplomatik yöntemi ve aynı güç dengesini kullanmasına rağmen sonuçların yalnız tesadüfi nedenlerle farklılaştığını",
  "Musul ve Hatay’ın aynı muhatap devletle aynı dönemde görüşülmesi nedeniyle uluslararası şartların sonuçlar üzerinde belirleyici olmadığını",
  "Türkiye’nin Musul konusunda hiçbir talepte bulunmadığını, Hatay konusunda ise yalnız askerî güç kullandığı için iki dosyanın karşılaştırılamayacağını",
  "Her iki sorunun da Milletler Cemiyeti tarafından Türkiye lehine aynı hukuki ilkeye göre çözüldüğünü ancak uygulama tarihlerinin farklı olduğunu"
]);

rebalance('kta5-t3-q12',[
  "Osmanlı yükselmesinin yalnız askerî seferlerin sayısıyla açıklanabileceğini, merkezîleşme ve idari kapasitenin genişleme üzerinde belirgin etkisi olmadığını",
  "Fatih, Yavuz ve Kanuni dönemlerinde dış politika hedeflerinin ve imparatorluk ölçeğinin değişmeden kaldığını, farklı coğrafyalara yönelişin sınırlı olduğunu",
  "Devletin XV-XVI. yüzyıllarda esas olarak savunma siyaseti izlediğini ve yeni siyasi merkezleri denetim altına alma hedefinden uzak durduğunu",
  "Kurumsallaşma ile bölgesel genişlemenin birbirinden bağımsız geliştiğini, fetihlerin yönetim kapasitesi ve imparatorluk yapısına önemli etkisi olmadığını"
]);

rebalance('kta10-t4-q10',[
  "Cephelerin kapanması TBMM’nin askerî kaynaklarını azaltmış ve Batı Cephesi’ndeki ana tehdide karşı daha da dağınık bir kuvvet yapısı oluşmasına yol açmıştır",
  "Doğu ve Güney cephelerinin sona ermesi diplomatik yalnızlığı artırmış, Batı Cephesi’nde Yunanistan’a karşı kullanılabilecek kaynakları sınırlamıştır",
  "Cephe sayısının azalması stratejik öncelik üzerinde etkisiz kalmış, TBMM bütün cephelere aynı miktarda insan ve malzeme ayırmaya devam etmiştir",
  "Doğu ve Güney cephelerindeki gelişmeler Batı Cephesi’nden tamamen bağımsız olduğundan askerî kuvvet ve diplomatik kapasite aktarımı mümkün olmamıştır"
]);

rebalance('kta10-t3-q02',[
  "Doğu Cephesi’ndeki askerî başarının yalnız geçici ateşkesler ürettiğini ve sınır sorunlarının diplomatik metinlerle kalıcı biçimde ele alınmadığını",
  "Gümrü, Moskova ve Kars antlaşmalarının birbirinden bağımsız olup doğu sınırı konusunda ortak bir diplomatik süreç oluşturmadığını",
  "Doğu sınırının yalnız askerî harekâtla belirlendiğini, Sovyet Rusya ve Kafkas cumhuriyetleriyle yapılan anlaşmaların sınır üzerinde etkisiz kaldığını",
  "Antlaşmaların temel amacının Batı Cephesi’ndeki Yunan savaşı ve Boğazlar sorununu çözmek olduğunu, doğu sınırına ilişkin düzenleme içermediğini"
]);

rebalance('kta-sec1-q27',[
  "Çanakkale’deki başarının Osmanlı’nın bütün cephelerde stratejik üstünlük kurduğunu ve savaşın genel sonucunu kendi lehine çevirdiğini gösterdiğini",
  "Bir cephedeki başarı ile genel savaş sonucu arasında doğrudan zorunlu bağ bulunduğunu, ittifak sistemi ve diğer cephelerin sonucu değiştiremeyeceğini",
  "Osmanlı’nın savaş boyunca hiçbir cephede yenilmediğini ancak yalnız ekonomik nedenlerle ateşkes imzalamak zorunda kaldığını",
  "Çanakkale’nin askerî açıdan başarısız olmasına rağmen yalnız propaganda etkisi yarattığını ve genel savaş sonucu üzerinde dolaylı rol oynadığını"
]);

rebalance('kta3-t4-q05',[
  "İç ayaklanmaların dış savaş kapasitesiyle ilişkisiz olduğunu ve Kösedağ yenilgisinin yalnız savaş alanındaki taktik tercihlerle açıklanması gerektiğini",
  "Babai Ayaklanması gibi iç krizlerin devletin askerî ve toplumsal kaynaklarını etkilemediğini, dış tehditlere karşı dayanıklılığı değiştirmediğini",
  "Bütün iç ayaklanmaların doğrudan yabancı devletler tarafından çıkarıldığını ve devletin iç yapısındaki sorunların dış savaş performansına etkisi olmadığını",
  "Askerî yenilgilerin yalnız coğrafi şartlarla açıklanabileceğini, merkezî otorite ve toplumsal istikrarın savaş gücünde belirleyici olmadığını"
]);

rebalance('kta8-t3-q07',[
  "Her iki harekâtın da Osmanlı’nın başkentini savunmak için yürüttüğü geri çekilme savaşı olması ve lojistik açıdan güvenli iç bölgelerde gerçekleşmesi",
  "Kafkas ve Kanal cephelerinin ikisinin de deniz gücüne dayalı savunma harekâtları olması ve kara ikmal hatlarının savaşın seyrinde belirleyici olmaması",
  "Her iki harekâtın da aynı düşmana karşı aynı coğrafyada yürütülmesi ve savaşın sonunda kesin Osmanlı zaferiyle sonuçlanması",
  "İki harekâtın da Osmanlı’nın yalnız mevcut sınırlarını korumaya yönelik pasif savunma stratejisinin parçaları olması ve taarruz amacı taşımaması"
]);

rebalance('kta12-t4-q08',[
  "Barışçılık ilkesi gereği Türkiye bütün millî taleplerinden vazgeçmiş, sınır ve egemenlik sorunlarında mevcut durumu koşulsuz kabul etmiştir",
  "Millî çıkarların korunması yalnız askerî güç kullanımına bağlanmış, diplomasi ve uluslararası hukuk ikincil araçlar olarak değerlendirilmiştir",
  "Barışçılık komşu devletlerin iç işlerine müdahale etme ve bölgesel baskı kurma stratejisini meşrulaştıran esnek bir dış politika ilkesi olarak uygulanmıştır",
  "Uluslararası hukuk Türkiye’nin hareket alanını sınırladığı için egemenlik sorunlarının çözümünde diplomatik ve hukuki yöntemlerden mümkün olduğunca kaçınılmıştır"
]);

rebalance('kta9-t3-q08',[
  "Ulusal hedefleri parlamenter kurum yerine yalnız yerel silahlı örgütlerin kararı olarak tutarak merkezî siyasi meşruiyet arayışından uzaklaşmasına",
  "İşgaller karşısında dış manda seçeneğini Osmanlı Meclisi aracılığıyla resmileştirerek bağımsızlık talebini ikinci plana bırakmasına",
  "Temsil Heyetini dağıtıp siyasi karar yetkisini bütünüyle İstanbul Hükûmetine bırakarak millî hareketin bağımsız merkezini sona erdirmesine",
  "Saltanatın kaldırılmasını doğrudan kabul ettirerek yeni devlet düzenini TBMM açılmadan önce hukuken tamamlamasına"
]);

rebalance('kta5-t3-q06',[
  "Osmanlıların Balkan siyasetine ağırlık verip Anadolu ve güney sınırlarındaki siyasi bütünleşme hedeflerinden giderek uzaklaştığını",
  "Turnadağ ve Ridaniye sonrasında Osmanlıların doğu-güney hattındaki genişlemeyi durdurup mevcut sınırları korumaya dayalı savunma siyasetine geçtiğini",
  "Dulkadirli ve Memlük yapılarının güçlenerek Osmanlı merkezî otoritesinden bağımsız yeni tampon devletler hâline geldiğini",
  "Bu iki gelişmenin Osmanlı’nın Karadeniz ve Balkanlardaki topraklarını kaybetmesine yol açarak imparatorluk ölçeğini daralttığını"
]);

root.RotaKpssHistoryEditorialPass3={version:3,rebalancedOptions:30};
if(typeof module==='object')module.exports=root.RotaKpssHistoryEditorialPass3;
})(typeof window!=='undefined'?window:globalThis);
