(function(root){
'use strict';

const SCHEMA='calisma-rotasi-kpss-practice-v1';
const VERSION=1;
const BASIS='KPSS GY-GK ders toplamları esas alınır; konu içi dağılım geçmiş sınav eğilimlerine göre yaklaşık ürün planıdır ve ÖSYM konu başına sabit soru sayısı garantisi değildir.';
const Q=(id,topicId,text,options,answer,explanation)=>({id,topicId,text,options,answer,explanation});
const T=(id,subjectId,topicTitle,title,questions,minutes=8)=>({id,exam:'kpss',subjectId,topicId:id.replace(/-practice-01$/,''),topicTitle,title,eyebrow:'ROTA KONU PRATİĞİ · KPSS',minutes,level:'Orta',questions,version:1,sourceKind:'original',original:true});

const topicSets=[
T('k-tr-1-practice-01','k-tr','Sözcükte anlam','KPSS Sözcükte Anlam · Hızlı Pratik',[
 Q('tr1q1','k-tr-1','k-tr-1','Eleştirmen, yazarın son romanında dili “arıtmayı” seçtiğini söylüyor. Bu cümlede “arıtmak” sözcüğü hangi anlamda kullanılmıştır?',['Dili yabancı ve gereksiz ögelerden temizlemek','Anlatımı uzatmak','Kişileri çoğaltmak','Olayları hızlandırmak','Konuyu değiştirmek'],0,'Bağlamda arıtmak, dili gereksiz/yabancı ögelerden temizlemek anlamındadır.'),
 Q('tr1q2','k-tr-1','“Bu küçük ayrıntı, araştırmanın yönünü değiştiren bir ipucu oldu.” cümlesinde “ipucu” sözcüğü aşağıdakilerden hangisine en yakındır?',['Kesin sonuç','Yol gösteren belirti','Gizli amaç','Yanlış bilgi','Önemsiz ayrıntı'],1,'İpucu, sonuca ulaşmada yol gösteren belirti anlamındadır.'),
 Q('tr1q3','k-tr-1','“Toplantıda söylenenleri süzgeçten geçirerek aktardı.” cümlesindeki altı çizili sözün anlamı hangisidir?',['Olduğu gibi tekrarlamak','Seçip değerlendirerek iletmek','Abartarak anlatmak','Unutarak eksiltmek','Gizlice kaydetmek'],1,'Süzgeçten geçirmek, bilgiyi seçip değerlendirerek aktarmayı anlatır.'),
 Q('tr1q4','k-tr-1','“Onun bu konudaki tavrı zamanla yumuşadı.” cümlesinde “yumuşamak” sözcüğü hangi anlamda kullanılmıştır?',['Sesini azaltmak','Fiziksel olarak esnemek','Daha ılımlı hâle gelmek','Kararsız kalmak','Gücünü kaybetmek'],2,'Tavrın yumuşaması daha ılımlı hâle gelmek demektir.')
]),
T('k-tr-2-practice-01','k-tr','Cümlede anlam','KPSS Cümlede Anlam · Hızlı Pratik',[
 Q('tr2q1','k-tr-2','“Düzenli tekrar yaparsan bilgilerin daha kalıcı olur.” cümlesinde hangi anlam ilişkisi vardır?',['Neden-sonuç','Koşul-sonuç','Amaç-sonuç','Karşılaştırma','Varsayım'],1,'Kalıcı olma, düzenli tekrar yapma koşuluna bağlanmıştır.'),
 Q('tr2q2','k-tr-2','“Yağmur başladığı için maç ertelendi.” cümlesinde hangi anlam ilişkisi vardır?',['Amaç-sonuç','Koşul-sonuç','Neden-sonuç','Karşıtlık','Olasılık'],2,'Maçın ertelenmesinin nedeni yağmurun başlamasıdır.'),
 Q('tr2q3','k-tr-2','“Bu kitabı, konuya farklı bir açıdan bakabilmek için okudum.” cümlesinde hangi anlam vardır?',['Amaç-sonuç','Neden-sonuç','Koşul','Yakınma','Öneri'],0,'Okuma eyleminin amacı farklı açıdan bakabilmektir.'),
 Q('tr2q4','k-tr-2','“Yeni yöntem, eskisine göre daha az zaman alıyor.” cümlesinde hangisi vardır?',['Tanım','Karşılaştırma','Öznel yargı','Koşul','Kesinlik'],1,'Yeni ve eski yöntem süre bakımından karşılaştırılmıştır.')
]),
T('k-tr-3-practice-01','k-tr','Paragrafta anlam','KPSS Paragrafta Anlam · Hızlı Pratik',[
 Q('tr3q1','k-tr-3','Bir şehrin belleği yalnız anıtlarda saklı değildir. Mahalle arasındaki fırın, yıllardır aynı köşede duran ağaç ve insanların birbirine sesleniş biçimi de bu belleğin parçalarıdır. Bu parçanın ana düşüncesi hangisidir?',['Şehirler sürekli değişmelidir.','Kent belleği gündelik yaşamın küçük unsurlarında da yaşar.','Anıtlar şehirler için gereksizdir.','Mahalle kültürü yalnız eski şehirlerde görülür.','Ağaçlar tarihî yapılardan daha değerlidir.'],1,'Parça kent belleğinin gündelik ayrıntılarda da sürdüğünü vurgular.'),
 Q('tr3q2','k-tr-3','Bir araştırmacı için iyi soru, cevabı hemen bulunan soru değildir. Bazen doğru soru yeni veriler toplamayı, eski varsayımları yeniden sınamayı gerektirir. Parçada asıl anlatılmak istenen nedir?',['Araştırma yalnız veri toplamaktır.','İyi sorular düşünmeyi ve yeniden sınamayı tetikler.','Eski bilgiler her zaman yanlıştır.','Hızlı cevap bilimsel başarının ölçüsüdür.','Araştırmacı varsayım kurmamalıdır.'],1,'Vurgu iyi sorunun araştırmayı ve sorgulamayı derinleştirmesidir.'),
 Q('tr3q3','k-tr-3','Bir müzik eserini yalnız teknik kusurları arayarak dinlemek, eserin bütününü kaçırmaya yol açabilir. Teknik bilgi önemlidir; ancak ritim, duygu ve yapı birlikte değerlendirilmelidir. Bu parçadan hangisi çıkarılabilir?',['Teknik bilgi gereksizdir.','Müzik yalnız duyguyla anlaşılır.','Değerlendirme hem ayrıntıyı hem bütünü gözetmelidir.','Kusursuz eser yoktur.','Ritim, teknikten her zaman önemlidir.'],2,'Parça ayrıntı ve bütünün birlikte değerlendirilmesini savunur.'),
 Q('tr3q4','k-tr-3','Yeni bir alışkanlık edinirken ilk günlerde kusursuz bir program kurmaya çalışmak yerine sürdürülebilir küçük bir adım seçmek çoğu zaman daha etkilidir. Çünkü devamlılık, tek seferlik yoğunluktan daha güçlü bir birikim oluşturur. Parçaya en uygun başlık hangisidir?',['Kusursuz Program','Küçük Adımların Gücü','Yoğun Çalışmanın Önemi','Başarıda Tesadüf','Zaman Kaybı'],1,'Parçanın odağı sürdürülebilir küçük adımların birikimidir.')
]),
T('k-tr-4-practice-01','k-tr','Sözel mantık','KPSS Sözel Mantık · Hızlı Pratik',[
 Q('tr4q1','k-tr-4','A, B, C ve D sunumları art arda yapılacaktır. A, B’den önce; C ise D’den sonra yapılacaktır. Buna göre aşağıdaki sıralamalardan hangisi mümkün olabilir?',['B-A-C-D','A-B-D-C','D-C-B-A','C-D-A-B','B-D-A-C'],1,'A B’den önce ve C D’den sonra olmalıdır; A-B-D-C koşulları sağlar.'),
 Q('tr4q2','k-tr-4','Bir rafta K, L, M kitapları soldan sağa dizilecektir. K, L’nin solunda; M ise K’nin sağındadır. Aşağıdakilerden hangisi kesinlikle doğrudur?',['M en sağdadır.','L en soldadır.','K, M’nin solundadır.','L, M’nin sağındadır.','M, L’nin solundadır.'],2,'Verilen bilgi doğrudan M’nin K’nin sağında olduğunu söyler; dolayısıyla K M’nin solundadır.'),
 Q('tr4q3','k-tr-4','Pazartesi, salı ve çarşamba günlerinden her birinde birer görev yapılacaktır: X, Y, Z. X salı günü değildir; Y, X’ten sonra yapılacaktır. Buna göre X hangi gün olabilir?',['Yalnız pazartesi','Yalnız salı','Yalnız çarşamba','Pazartesi veya salı','Salı veya çarşamba'],0,'Y X’ten sonra olacağı için X çarşamba olamaz; ayrıca salı olmadığı verilmiştir, bu yüzden pazartesidir.'),
 Q('tr4q4','k-tr-4','E, F, G ve H kişilerinden iki kişilik ekip kurulacaktır. E seçilirse F seçilemez; G seçilirse H mutlaka seçilir. Aşağıdaki ekiplerden hangisi kurulabilir?',['E-F','G-E','G-F','G-H','E-G'],3,'G seçildiğinde H’nin de seçilmesi zorunludur; G-H mümkündür.')
]),
T('k-tr-5-practice-01','k-tr','Ses bilgisi','KPSS Ses Bilgisi · Hızlı Pratik',[
 Q('tr5q1','k-tr-5','Aşağıdaki sözcüklerden hangisinde ünlü düşmesi vardır?',['burnu','kalemi','sokağı','kapısı','oyunu'],0,'Burun + u birleşiminde ikinci hecedeki ünlü düşer: burnu.'),
 Q('tr5q2','k-tr-5','Aşağıdaki sözcüklerden hangisinde ünsüz yumuşaması vardır?',['kitabı','sınıfta','ağaçtan','yurtta','seçkin'],0,'Kitap sözcüğündeki p, ünlüyle başlayan ek alınca b’ye dönüşür.'),
 Q('tr5q3','k-tr-5','Aşağıdaki sözcüklerden hangisinde ünsüz benzeşmesi görülür?',['kitapçı','odacı','gözlük','evde','yazıcı'],0,'Kitap + cı birleşiminde c, sert ünsüzün etkisiyle ç olur.'),
 Q('tr5q4','k-tr-5','“hissetmek” sözcüğünde görülen ses olayı hangisidir?',['Ünlü düşmesi','Ünsüz türemesi','Ünlü daralması','Ünsüz yumuşaması','Ünlü türemesi'],1,'His + etmek birleşiminde s ünsüzü türemiştir.')
]),
T('k-tr-6-practice-01','k-tr','Yazım kuralları','KPSS Yazım Kuralları · Hızlı Pratik',[
 Q('tr6q1','k-tr-6','Aşağıdaki cümlelerin hangisinde “de”nin yazımı doğrudur?',['Ben de geleceğim.','Evde ki kitapları topladı.','Oda bizimle gelicek.','Sende biliyorsun.','Bende yarın uğrarım.'],0,'Bağlaç olan de ayrı yazılır: Ben de.'),
 Q('tr6q2','k-tr-6','Aşağıdakilerden hangisinin yazımı doğrudur?',['bir çok','herşey','hiçbir','pekçok','bir kaç'],2,'“Hiçbir” birleşik yazılır.'),
 Q('tr6q3','k-tr-6','Aşağıdaki cümlelerin hangisinde “ki” doğru yazılmıştır?',['Duydumki gelmeyecekmiş.','Evdeki hesap çarşıya uymadı.','Seninki deil benimki.','Öyleki herkes şaşırdı.','Bilmem ki neden gelmedi mi?'],1,'Sıfat yapan -ki bitişik yazılır: evdeki.'),
 Q('tr6q4','k-tr-6','Aşağıdakilerden hangisinde büyük harflerin kullanımı doğrudur?',['Türk Dil Kurumu bugün açıklama yaptı.','ankara Üniversitesi açıldı.','Mayıs Ayında geleceğim.','Doğu anadolu Bölgesi soğuktur.','Pazartesi Günü görüşürüz.'],0,'Kurum adlarının her sözcüğü büyük harfle başlar.')
]),
T('k-tr-7-practice-01','k-tr','Noktalama işaretleri','KPSS Noktalama · Hızlı Pratik',[
 Q('tr7q1','k-tr-7','“Çantama üç şey koydum ___ defter, kalem ve su.” boşluğuna hangi işaret getirilmelidir?',['Virgül','Noktalı virgül','İki nokta','Üç nokta','Kısa çizgi'],2,'Açıklama ve örnek verileceği için iki nokta kullanılır.'),
 Q('tr7q2','k-tr-7','Aşağıdaki cümlelerin hangisinde virgül doğru kullanılmıştır?',['Ali, ve Ayşe geldi.','Pazardan elma, armut, portakal aldım.','Bugün, okula gitmedim çünkü hastaydım.','Eve geldim, ve dinlendim.','Kırmızı, kalemi aldım.'],1,'Eş görevli sözcükleri ayırmak için virgül doğru kullanılmıştır.'),
 Q('tr7q3','k-tr-7','“Eyvah ___ anahtarı içeride unuttum.” cümlesinde boşluğa hangi işaret gelmelidir?',['Nokta','Virgül','Ünlem','Soru işareti','Noktalı virgül'],2,'Duygu bildiren ünlem sözünden sonra ünlem işareti uygundur.'),
 Q('tr7q4','k-tr-7','Aşağıdaki cümlelerin hangisinin sonuna soru işareti getirilmelidir?',['Ne kadar güzel bir gün','Bunu gerçekten sen mi yaptın','Keşke bizimle gelseydin','Sana anlatacaklarım var','Bugün hava çok soğuk'],1,'Soru anlamı doğrudan “mi” ile kurulmuştur.')
]),
T('k-tr-8-practice-01','k-tr','Sözcük türleri','KPSS Sözcük Türleri · Hızlı Pratik',[
 Q('tr8q1','k-tr-8','“Eski ev sessizce boş sokağa bakıyordu.” cümlesinde “eski” sözcüğünün türü nedir?',['İsim','Sıfat','Zarf','Zamir','Bağlaç'],1,'Eski, “ev” ismini nitelediği için sıfattır.'),
 Q('tr8q2','k-tr-8','“Çocuk soruyu hızlı çözdü.” cümlesinde “hızlı” sözcüğü hangi türdedir?',['Sıfat','Zarf','İsim','Zamir','Edat'],1,'“Çözdü” fiilinin nasıl yapıldığını belirttiği için zarftır.'),
 Q('tr8q3','k-tr-8','“Bazıları toplantıya erken geldi.” cümlesinde “bazıları” hangi türdedir?',['Sıfat','Belgisiz zamir','İşaret zamiri','Zarf','Bağlaç'],1,'İsmin yerini belirsiz biçimde tuttuğu için belgisiz zamirdir.'),
 Q('tr8q4','k-tr-8','“Senin için bu dosyayı hazırladım.” cümlesinde “için” hangi türdedir?',['Edat','Bağlaç','Zamir','Sıfat','Fiil'],0,'“İçin” bu kullanımda edattır.')
]),
T('k-tr-9-practice-01','k-tr','Cümlenin ögeleri','KPSS Cümlenin Ögeleri · Hızlı Pratik',[
 Q('tr9q1','k-tr-9','“Öğretmen bugün sınıfta yeni konuyu anlattı.” cümlesinin öznesi hangisidir?',['bugün','sınıfta','yeni konuyu','öğretmen','anlattı'],3,'Anlatma işini yapan “öğretmen” öznesidir.'),
 Q('tr9q2','k-tr-9','“Arkadaşım bana güzel bir kitap verdi.” cümlesinde dolaylı tümleç hangisidir?',['Arkadaşım','bana','güzel','bir kitap','verdi'],1,'Yönelme eki alan “bana” dolaylı tümleçtir.'),
 Q('tr9q3','k-tr-9','“Sporcular sabah erkenden stadyuma gittiler.” cümlesinde zarf tümleci hangisidir?',['Sporcular','sabah erkenden','stadyuma','gittiler','stadyum'],1,'Zamanı belirten “sabah erkenden” zarf tümlecidir.'),
 Q('tr9q4','k-tr-9','“Kardeşim odasını dün temizledi.” cümlesinde belirtili nesne hangisidir?',['Kardeşim','odasını','dün','temizledi','oda'],1,'“-ı” belirtme hâl eki almış “odasını” nesnedir.')
]),
T('k-tr-10-practice-01','k-tr','Cümle türleri','KPSS Cümle Türleri · Hızlı Pratik',[
 Q('tr10q1','k-tr-10','“Hava karardığında eve döndük.” cümlesi yapısına göre hangisidir?',['Basit','Birleşik','Sıralı','Bağlı','Eksiltili'],1,'Zarf-fiil yan cümleciği bulunduğu için birleşik cümledir.'),
 Q('tr10q2','k-tr-10','“Kapıyı açtı, içeri girdi.” cümlesi hangisidir?',['Basit','Birleşik','Sıralı','Bağlı','Devrik'],2,'Birden fazla yargı virgülle sıralandığı için sıralı cümledir.'),
 Q('tr10q3','k-tr-10','“Kitabı okudum ama not almadım.” cümlesi yapısına göre hangisidir?',['Basit','Sıralı','Bağlı','Birleşik','Eksiltili'],2,'İki yargı “ama” bağlacıyla bağlandığı için bağlı cümledir.'),
 Q('tr10q4','k-tr-10','“Bu sabah erkenden yola çıktık.” cümlesi yüklemin yerine göre hangisidir?',['Devrik','Kurallı','Eksiltili','Soru','Olumsuz'],1,'Yüklem sonda olduğu için kurallı cümledir.')
]),
T('k-tr-11-practice-01','k-tr','Anlatım bozuklukları','KPSS Anlatım Bozuklukları · Hızlı Pratik',[
 Q('tr11q1','k-tr-11','Aşağıdaki cümlelerin hangisinde gereksiz sözcük kullanımından doğan anlatım bozukluğu vardır?',['Bu konuda herkes aynı fikirde birleşti.','Toplantı saat üçte başladı.','Kitabı dün bitirdim.','Soruyu dikkatlice okudu.','Yarın seni arayacağım.'],0,'“Aynı fikirde” ve “birleşti” birlikte gereksiz anlam tekrarına yol açar.'),
 Q('tr11q2','k-tr-11','“Beni en çok sevindiren şey, sınavı kazanmış olmamdır.” cümlesinde anlatım bozukluğu var mıdır?',['Özne eksikliği vardır.','Nesne eksikliği vardır.','Tamlama yanlışlığı vardır.','Anlatım bozukluğu yoktur.','Çatı uyuşmazlığı vardır.'],3,'Cümlede anlam ve yapı bakımından bir bozukluk yoktur.'),
 Q('tr11q3','k-tr-11','“Bu konuda seni destekliyor ve güveniyorum.” cümlesindeki anlatım bozukluğunun nedeni hangisidir?',['Özne eksikliği','Tümleç eksikliği','Yanlış bağlaç','Gereksiz sözcük','Zaman uyumsuzluğu'],1,'“Destekliyorum” fiili “seni”, “güveniyorum” fiili ise “sana” tümlecini ister; ikinci yüklemin tümleci eksiktir.'),
 Q('tr11q4','k-tr-11','Aşağıdaki cümlelerin hangisinde mantık hatası vardır?',['Bırakın sigarayı, hiç olmazsa azaltın.','Önce küçük odaları, sonra salonu temizledi.','Toplantıya müdür ve çalışanlar katıldı.','Bu yazı anlaşılır ve akıcıdır.','Kitabı masanın üzerine bıraktı.'],0,'“Bırakmak” azaltmaktan daha ileri bir aşama olduğu için sıralama mantıksal olarak ters kurulmuştur.')
]),

T('k-ta-1-practice-01','k-ta','İslamiyet öncesi Türk tarihi','KPSS İslamiyet Öncesi Türk Tarihi · Hızlı Pratik',[
 Q('ta1q1','k-ta-1','Eski Türk devletlerinde hükümdara yönetme yetkisinin Tanrı tarafından verildiği inancına ne ad verilir?',['Töre','Kut','Kurultay','Ülüş','Boy'],1,'Kut, hükümdarın yönetme yetkisinin ilahî kaynağa dayandırılmasıdır.'),
 Q('ta1q2','k-ta-1','Orhun Yazıtları hangi Türk devleti dönemine aittir?',['Asya Hun','I. Göktürk','II. Göktürk','Uygur','Avar'],2,'Orhun Yazıtları II. Göktürk Kağanlığı döneminde dikilmiştir.'),
 Q('ta1q3','k-ta-1','Yerleşik yaşama geçen ve şehir kültürünü geliştiren ilk Türk topluluklarından biri hangisidir?',['Kıpçaklar','Uygurlar','Peçenekler','Avarlar','Sabirler'],1,'Uygurlar yerleşik yaşam ve şehir kültürüyle öne çıkar.'),
 Q('ta1q4','k-ta-1','İslamiyet öncesi Türklerde devlet işlerinin görüşüldüğü meclisin adı nedir?',['Divan','Şûra','Kurultay','Meclis-i Mebusan','Toygan'],2,'Kurultay devlet işlerinin görüşüldüğü danışma meclisidir.')
]),
T('k-ta-2-practice-01','k-ta','İlk Türk İslam devletleri','KPSS İlk Türk İslam Devletleri · Hızlı Pratik',[
 Q('ta2q1','k-ta-2','İslamiyet’i resmî din olarak kabul eden ilk Türk devleti hangisidir?',['Gazneliler','Karahanlılar','Büyük Selçuklu','Harzemşahlar','Tolunoğulları'],1,'Karahanlılar İslamiyet’i resmî din olarak kabul eden ilk Türk devletidir.'),
 Q('ta2q2','k-ta-2','Kutadgu Bilig adlı eserin yazarı kimdir?',['Kaşgarlı Mahmut','Yusuf Has Hacip','Edip Ahmet Yükneki','Ahmet Yesevi','Nizamülmülk'],1,'Kutadgu Bilig Yusuf Has Hacip tarafından yazılmıştır.'),
 Q('ta2q3','k-ta-2','Nizamiye Medreseleri hangi devlet döneminde kurulmuştur?',['Karahanlı','Gazneli','Büyük Selçuklu','Türkiye Selçuklu','Memlük'],2,'Nizamiye Medreseleri Büyük Selçuklu döneminde Nizamülmülk öncülüğünde kurulmuştur.'),
 Q('ta2q4','k-ta-2','Dîvânu Lugâti’t-Türk’ün yazarı kimdir?',['Kaşgarlı Mahmut','Yusuf Has Hacip','Ali Şir Nevai','Ahmet Yesevi','Farabi'],0,'Eser Kaşgarlı Mahmut tarafından yazılmıştır.')
]),
T('k-ta-3-practice-01','k-ta','Türkiye Selçuklu Devleti','KPSS Türkiye Selçukluları · Hızlı Pratik',[
 Q('ta3q1','k-ta-3','Anadolu’nun Türk yurdu olma sürecini pekiştiren 1176 tarihli savaş hangisidir?',['Pasinler','Malazgirt','Miryokefalon','Kösedağ','Dandanakan'],2,'Miryokefalon Savaşı Bizans’ın Anadolu’yu geri alma ümidini büyük ölçüde kırmıştır.'),
 Q('ta3q2','k-ta-3','Türkiye Selçuklu Devleti’nin Moğol baskısı altına girmesine yol açan savaş hangisidir?',['Kösedağ','Yassıçemen','Miryokefalon','Pasinler','Katvan'],0,'1243 Kösedağ yenilgisi Moğol/İlhanlı baskısını başlatmıştır.'),
 Q('ta3q3','k-ta-3','Türkiye Selçuklularının ticareti geliştirmek için yol güzergâhlarında yaptırdığı yapılar hangisidir?',['Kümbet','Kervansaray','Darüşşifa','Medrese','Külliye'],1,'Kervansaraylar ticaret yollarında güvenlik ve konaklama sağladı.'),
 Q('ta3q4','k-ta-3','Anadolu’da esnaf ve zanaatkârlar arasında dayanışmayı sağlayan teşkilat hangisidir?',['Ahilik','Enderun','Lonca-i Hassa','Devşirme','Tımar'],0,'Ahilik esnaf ve zanaatkâr dayanışmasında etkili olmuştur.')
]),
T('k-ta-4-practice-01','k-ta','Osmanlı kuruluş dönemi','KPSS Osmanlı Kuruluş · Hızlı Pratik',[
 Q('ta4q1','k-ta-4','Osmanlı Devleti ile Bizans arasında yapılan ilk savaş olarak kabul edilen mücadele hangisidir?',['Koyunhisar','Sazlıdere','Sırpsındığı','Niğbolu','Varna'],0,'1302 Koyunhisar (Bafeus) Osmanlı-Bizans arasındaki ilk savaş kabul edilir.'),
 Q('ta4q2','k-ta-4','Bursa hangi Osmanlı hükümdarı döneminde fethedilmiştir?',['Osman Bey','Orhan Bey','I. Murat','Yıldırım Bayezid','Çelebi Mehmet'],1,'Bursa 1326’da Orhan Bey döneminde fethedildi.'),
 Q('ta4q3','k-ta-4','Rumeli’de fethedilen yerlere Anadolu’dan Türk nüfus yerleştirilmesine dayanan politika hangisidir?',['İskân','İltizam','Devşirme','Müsadere','Narh'],0,'İskân politikası fetihlerin kalıcılaşmasına hizmet etmiştir.'),
 Q('ta4q4','k-ta-4','Osmanlı Devleti’nin Rumeli’de elde ettiği ilk kalıcı üs aşağıdakilerden hangisidir?',['Edirne','Çimpe Kalesi','Belgrad','Selanik','Sofya'],1,'Çimpe Kalesi Osmanlıların Rumeli’deki ilk kalıcı üssü kabul edilir.')
]),
T('k-ta-5-practice-01','k-ta','Osmanlı yükselme dönemi','KPSS Osmanlı Yükselme · Hızlı Pratik',[
 Q('ta5q1','k-ta-5','İstanbul hangi padişah döneminde fethedilmiştir?',['II. Murat','Fatih Sultan Mehmet','Yavuz Sultan Selim','Kanuni Sultan Süleyman','II. Bayezid'],1,'İstanbul 1453’te Fatih Sultan Mehmet döneminde fethedildi.'),
 Q('ta5q2','k-ta-5','Mısır Seferi sonucunda Memlük Devleti’ne son veren Osmanlı padişahı kimdir?',['Fatih Sultan Mehmet','Yavuz Sultan Selim','Kanuni Sultan Süleyman','II. Bayezid','II. Selim'],1,'1516-1517 seferleri Yavuz Sultan Selim dönemindedir.'),
 Q('ta5q3','k-ta-5','Kanuni döneminde 1526’da Macar Krallığı’nın gücünü kıran savaş hangisidir?',['Mohaç','Preveze','Ridaniye','Çaldıran','Otlukbeli'],0,'Mohaç Meydan Savaşı 1526’da Osmanlı zaferiyle sonuçlandı.'),
 Q('ta5q4','k-ta-5','1538 Preveze Deniz Zaferi’nde Osmanlı donanmasının komutanı kimdir?',['Piri Reis','Barbaros Hayreddin Paşa','Turgut Reis','Kılıç Ali Paşa','Seydi Ali Reis'],1,'Preveze’de Osmanlı donanmasına Barbaros Hayreddin Paşa komuta etti.')
]),
T('k-ta-6-practice-01','k-ta','Osmanlı kültür ve medeniyeti','KPSS Osmanlı Kültür ve Medeniyet · Hızlı Pratik',[
 Q('ta6q1','k-ta-6','Dirlik topraklarının gelirlerinin hizmet karşılığında görevlilere bırakıldığı sistem hangisidir?',['Tımar','İltizam','Müsadere','Narh','Malikâne'],0,'Tımar sisteminde vergi gelirleri hizmet karşılığında sipahilere tahsis edilirdi.'),
 Q('ta6q2','k-ta-6','Osmanlı merkez teşkilatında devlet işlerinin görüşüldüğü en üst kurul hangisidir?',['Enderun','Divan-ı Hümayun','Meclis-i Vâlâ','Şeyhülislamlık','Lonca'],1,'Divan-ı Hümayun merkez yönetiminin temel karar organıdır.'),
 Q('ta6q3','k-ta-6','Osmanlı’da farklı dinî toplulukların kendi dinî ve bazı sosyal işlerini düzenleyebilmesine imkân veren yapı hangisidir?',['Millet sistemi','Tımar sistemi','Devşirme sistemi','İltizam sistemi','Pençik sistemi'],0,'Millet sistemi gayrimüslim topluluklara dinî-toplumsal özerklik alanı tanıdı.'),
 Q('ta6q4','k-ta-6','Sarayda devlet adamı yetiştiren eğitim kurumu hangisidir?',['Sıbyan mektebi','Enderun','Medrese-i Süleymaniye','Darülmuallimin','Rüştiye'],1,'Enderun saray içinde yönetici yetiştiren seçkin eğitim kurumuydu.')
]),
T('k-ta-7-practice-01','k-ta','Osmanlı yenileşme hareketleri','KPSS Osmanlı Yenileşme · Hızlı Pratik',[
 Q('ta7q1','k-ta-7','Lale Devri hangi antlaşma ile başlayıp hangi olayla sona ermiştir?',['Pasarofça – Patrona Halil İsyanı','Karlofça – Kabakçı Mustafa İsyanı','Yaş – Vakayı Hayriye','Belgrad – Patrona Halil İsyanı','Paris – 31 Mart Olayı'],0,'Lale Devri 1718 Pasarofça ile başlayıp 1730 Patrona Halil İsyanı ile sona erdi.'),
 Q('ta7q2','k-ta-7','Nizam-ı Cedid ordusunu kuran padişah kimdir?',['III. Selim','II. Mahmut','Abdülmecid','Abdülaziz','III. Ahmet'],0,'Nizam-ı Cedid III. Selim’in yenileşme programıdır.'),
 Q('ta7q3','k-ta-7','Tanzimat Fermanı hangi padişah döneminde ilan edilmiştir?',['II. Mahmut','Abdülmecid','Abdülaziz','II. Abdülhamid','V. Murat'],1,'Tanzimat Fermanı 1839’da Abdülmecid döneminde ilan edildi.'),
 Q('ta7q4','k-ta-7','Islahat Fermanı’nın öne çıkan yönlerinden biri hangisidir?',['Gayrimüslimlere yönelik hakları genişletmesi','Yeniçeri Ocağını kaldırması','Saltanatı kaldırması','Meşrutiyeti sona erdirmesi','Kapitülasyonları kaldırması'],0,'1856 Islahat Fermanı özellikle gayrimüslimlerin haklarında düzenlemeler içerdi.')
]),
T('k-ta-8-practice-01','k-ta','20. yüzyılda Osmanlı Devleti','KPSS 20. Yüzyılda Osmanlı · Hızlı Pratik',[
 Q('ta8q1','k-ta-8','Trablusgarp Savaşı hangi devletle yapılmıştır?',['Rusya','İtalya','Yunanistan','Bulgaristan','Fransa'],1,'1911-1912 Trablusgarp Savaşı Osmanlı ile İtalya arasındadır.'),
 Q('ta8q2','k-ta-8','Balkan Savaşları sonunda Osmanlı Devleti’nin batı sınırı büyük ölçüde hangi çizgiye çekilmiştir?',['Meriç Nehri','Tuna Nehri','Sakarya Nehri','Aras Nehri','Dicle Nehri'],0,'II. Balkan Savaşı sonrası sınırın önemli bölümü Meriç’e kadar çekildi.'),
 Q('ta8q3','k-ta-8','I. Dünya Savaşı’nda Osmanlı Devleti’nin taarruz cephelerinden biri hangisidir?',['Çanakkale','Kafkas','Hicaz-Yemen','Irak','Suriye-Filistin'],1,'Kafkas Cephesi Osmanlı’nın taarruz amacıyla açtığı cephelerdendir.'),
 Q('ta8q4','k-ta-8','Mondros Ateşkes Antlaşması hangi tarihte imzalanmıştır?',['30 Ekim 1918','10 Ağustos 1920','24 Temmuz 1923','23 Nisan 1920','19 Mayıs 1919'],0,'Mondros Ateşkesi 30 Ekim 1918’de imzalandı.')
]),
T('k-ta-9-practice-01','k-ta','Millî Mücadele hazırlık dönemi','KPSS Millî Mücadele Hazırlık · Hızlı Pratik',[
 Q('ta9q1','k-ta-9','“Milletin bağımsızlığını yine milletin azim ve kararı kurtaracaktır.” ifadesi hangi belgede yer alır?',['Amasya Genelgesi','Erzurum Kongresi','Sivas Kongresi','Misak-ı Millî','Lozan Antlaşması'],0,'Bu temel ifade Amasya Genelgesi’nde yer alır.'),
 Q('ta9q2','k-ta-9','Toplanış bakımından bölgesel, aldığı kararlar bakımından ulusal olan kongre hangisidir?',['Balıkesir','Alaşehir','Erzurum','Sivas','Pozantı'],2,'Erzurum Kongresi bölgesel toplanmış, ulusal nitelikli kararlar almıştır.'),
 Q('ta9q3','k-ta-9','Tüm millî cemiyetlerin Anadolu ve Rumeli Müdafaa-i Hukuk Cemiyeti adı altında birleştirildiği kongre hangisidir?',['Erzurum','Sivas','Amasya','Balıkesir','Londra'],1,'Birleşme Sivas Kongresi’nde sağlandı.'),
 Q('ta9q4','k-ta-9','Misak-ı Millî kararları hangi mecliste kabul edilmiştir?',['TBMM','Son Osmanlı Mebusan Meclisi','Temsil Heyeti','Meclis-i Âyan','Saltanat Şûrası'],1,'Misak-ı Millî Son Osmanlı Mebusan Meclisinde kabul edildi.')
]),
T('k-ta-10-practice-01','k-ta','Kurtuluş Savaşı cepheleri','KPSS Kurtuluş Savaşı Cepheleri · Hızlı Pratik',[
 Q('ta10q1','k-ta-10','Düzenli ordunun Batı Cephesi’ndeki ilk askerî başarısı hangisidir?',['I. İnönü','Sakarya','Büyük Taarruz','Kütahya-Eskişehir','II. İnönü'],0,'I. İnönü Savaşı düzenli ordunun ilk başarısıdır.'),
 Q('ta10q2','k-ta-10','Sakarya Meydan Muharebesi’nden sonra Mustafa Kemal’e hangi unvan ve rütbe verilmiştir?',['Gazi ve Mareşal','Başkomutan ve Gazi','Paşa ve Başkomutan','Mareşal ve Cumhurbaşkanı','Gazi ve General'],0,'TBMM Mustafa Kemal’e Gazi unvanı ve Mareşal rütbesi verdi.'),
 Q('ta10q3','k-ta-10','Büyük Taarruz hangi tarihte başlamıştır?',['26 Ağustos 1922','30 Ağustos 1922','9 Eylül 1922','23 Ağustos 1921','11 Ekim 1922'],0,'Büyük Taarruz 26 Ağustos 1922’de başladı.'),
 Q('ta10q4','k-ta-10','Doğu Cephesi’nde Ermenistan ile imzalanan antlaşma hangisidir?',['Gümrü','Moskova','Kars','Ankara','Mudanya'],0,'Gümrü Antlaşması TBMM’nin uluslararası alandaki ilk siyasî başarısı kabul edilir.')
]),
T('k-ta-11-practice-01','k-ta','Atatürk ilke ve inkılapları','KPSS Atatürk İlke ve İnkılapları · Hızlı Pratik',[
 Q('ta11q1','k-ta-11','Saltanatın kaldırılması en doğrudan hangi ilkeyle ilişkilidir?',['Cumhuriyetçilik','Devletçilik','Laiklik','İnkılapçılık','Milliyetçilik'],0,'Egemenliğin millete dayandırılması Cumhuriyetçilikle doğrudan ilişkilidir.'),
 Q('ta11q2','k-ta-11','Tevhid-i Tedrisat Kanunu’nun temel amacı nedir?',['Eğitimde birliği sağlamak','Tarımı geliştirmek','Yerel yönetimleri güçlendirmek','Dış ticareti artırmak','Bankacılığı düzenlemek'],0,'Kanun eğitim kurumlarını tek çatı altında birleştirmeyi amaçladı.'),
 Q('ta11q3','k-ta-11','Türk Medeni Kanunu’nun kabulü hangi alanda önemli bir dönüşüm sağlamıştır?',['Özel hukuk ve aile hukuku','Askerî teşkilat','Dış politika','Vergi sistemi','Yerel yönetim'],0,'Medeni Kanun kişi, aile, miras gibi özel hukuk alanlarını düzenledi.'),
 Q('ta11q4','k-ta-11','Devletin ekonomik kalkınmada gerektiğinde yatırımcı ve düzenleyici rol üstlenmesi hangi ilkeyle ilişkilidir?',['Halkçılık','Devletçilik','Cumhuriyetçilik','Milliyetçilik','Laiklik'],1,'Bu yaklaşım Devletçilik ilkesinin ekonomik boyutudur.')
]),
T('k-ta-12-practice-01','k-ta','Atatürk dönemi dış politika','KPSS Atatürk Dönemi Dış Politika · Hızlı Pratik',[
 Q('ta12q1','k-ta-12','Musul sorunu Türkiye ile hangi devlet arasında temel anlaşmazlık konusu olmuştur?',['Fransa','İtalya','İngiltere','Yunanistan','Sovyetler Birliği'],2,'Musul meselesinde Türkiye’nin karşısındaki temel taraf İngiltere idi.'),
 Q('ta12q2','k-ta-12','Türkiye’nin boğazlar üzerindeki egemenlik haklarını güçlendiren 1936 tarihli sözleşme hangisidir?',['Lozan','Montrö','Moskova','Ankara','Balkan Antantı'],1,'Montrö Boğazlar Sözleşmesi Türkiye’nin boğazlar üzerindeki yetkilerini genişletti.'),
 Q('ta12q3','k-ta-12','Türkiye, Yunanistan, Yugoslavya ve Romanya arasında 1934’te kurulan oluşum hangisidir?',['Sadabat Paktı','Balkan Antantı','Bağdat Paktı','NATO','Küçük Antant'],1,'Balkan Antantı 1934’te bu dört devlet arasında kuruldu.'),
 Q('ta12q4','k-ta-12','Hatay hangi yıl Türkiye’ye katılmıştır?',['1936','1937','1938','1939','1940'],3,'Hatay 1939’da Türkiye’ye katıldı.')
]),
T('k-ta-13-practice-01','k-ta','Çağdaş Türk ve dünya tarihi','KPSS Çağdaş Türk ve Dünya Tarihi · Hızlı Pratik',[
 Q('ta13q1','k-ta-13','Birleşmiş Milletler hangi savaşın ardından kurulmuştur?',['I. Dünya Savaşı','II. Dünya Savaşı','Kore Savaşı','Vietnam Savaşı','Körfez Savaşı'],1,'Birleşmiş Milletler 1945’te II. Dünya Savaşı sonrasında kuruldu.'),
 Q('ta13q2','k-ta-13','Türkiye NATO’ya hangi yıl üye olmuştur?',['1945','1949','1952','1955','1960'],2,'Türkiye 1952’de NATO’ya katıldı.'),
 Q('ta13q3','k-ta-13','Soğuk Savaş döneminde ABD’nin Avrupa’nın ekonomik toparlanmasını desteklemek için uyguladığı program hangisidir?',['Marshall Planı','Molotov Planı','Schuman Planı','Dawes Planı','Young Planı'],0,'Marshall Planı ABD’nin Avrupa’ya yönelik ekonomik yardım programıdır.'),
 Q('ta13q4','k-ta-13','Berlin Duvarı’nın yıkılması hangi yıl gerçekleşmiştir?',['1985','1987','1989','1991','1993'],2,'Berlin Duvarı 1989’da yıkıldı.')
])
];

const turkishSection={
 id:'kpss-turkce-section-01',exam:'kpss',subjectId:'k-tr',title:'KPSS Türkçe Bölüm Denemesi #01',eyebrow:'BÖLÜM DENEMESİ · KPSS',minutes:35,penalty:4,version:1,
 blueprint:[
  ['k-tr-1','Sözcükte anlam',2],['k-tr-2','Cümlede anlam',3],['k-tr-3','Paragrafta anlam',14],['k-tr-4','Sözel mantık',4],
  ['k-tr-5','Ses bilgisi',1],['k-tr-6','Yazım kuralları',1],['k-tr-7','Noktalama işaretleri',1],['k-tr-8','Sözcük türleri',1],
  ['k-tr-9','Cümlenin ögeleri',1],['k-tr-10','Cümle türleri',1],['k-tr-11','Anlatım bozuklukları',1]
 ],
 questions:[
 Q('tr-s1','k-tr-1','“Bu öneri ilk bakışta cazip görünse de ayrıntılar incelendiğinde bazı riskler barındırıyor.” cümlesinde “cazip” sözcüğü hangi anlamdadır?',['Pahalı','Çekici','Karmaşık','Kesin','Yeni'],1,'Cazip, çekici ve ilgi uyandırıcı demektir.'),
 Q('tr-s2','k-tr-1','“Yazar, olayları aktarırken yer yer ince bir alay kullanıyor.” cümlesinde “ince” sözcüğünün anlamı hangisidir?',['Kalın olmayan','Ayrıntılı','Sezdirilen, ölçülü','Zayıf','Uzun'],2,'Burada ince, açıkça sertleşmeyen, sezdirilen anlamındadır.'),
 Q('tr-s3','k-tr-2','“Bu yolu seçersen köye daha erken varırsın.” cümlesinde hangi ilişki vardır?',['Amaç','Koşul','Neden','Karşılaştırma','Olasılık'],1,'Erken varma, yolu seçme koşuluna bağlıdır.'),
 Q('tr-s4','k-tr-2','“Daha iyi anlayabilmek için metni ikinci kez okudu.” cümlesinde hangi anlam vardır?',['Neden-sonuç','Amaç-sonuç','Koşul','Karşıtlık','Kesinlik'],1,'İkinci kez okumanın amacı daha iyi anlamaktır.'),
 Q('tr-s5','k-tr-2','“Bu yılki sonuçlar geçen yıla göre daha dengeli.” cümlesinde hangisi vardır?',['Karşılaştırma','Varsayım','Neden','Koşul','Öneri'],0,'İki yılın sonuçları karşılaştırılmıştır.'),
 Q('tr-s6','k-tr-3','Bir işi hızlandırmanın en kolay yolu her zaman daha çok çalışmak değildir. Bazen gereksiz adımları çıkarmak, tekrar eden işleri otomatikleştirmek ve karar sayısını azaltmak daha büyük kazanç sağlar. Parçanın ana düşüncesi hangisidir?',['Başarı yalnız çok çalışmaya bağlıdır.','Verimlilik, gereksiz yükleri azaltarak da artırılabilir.','Otomasyon her işte zorunludur.','Karar vermek zaman kaybıdır.','Hız kaliteyi her zaman düşürür.'],1,'Parça verimliliğin yalnız çaba artışıyla değil süreç sadeleştirmesiyle de sağlanabileceğini söyler.'),
 Q('tr-s7','k-tr-3','Kütüphaneler sessiz çalışma alanı olmanın ötesinde, insanların bilgiye eşit erişimi için de önemlidir. İnternet erişimi, danışmanlık ve ortak çalışma alanları bu işlevi genişletir. Bu parçadan hangisi çıkarılabilir?',['Kütüphaneler yalnız kitap ödünç verir.','Kütüphanelerin toplumsal işlevi çeşitlenmiştir.','İnternet kütüphaneleri gereksiz kılmıştır.','Sessizlik kütüphanenin tek özelliğidir.','Ortak çalışma alanları bilgiye erişimi azaltır.'],1,'Parça kütüphanelerin çok yönlü toplumsal işlevini anlatır.'),
 Q('tr-s8','k-tr-3','Bir metni anlamak için yalnız bilinmeyen sözcükleri çözmek yetmez; cümleler arasındaki ilişkiyi, yazarın hangi düşünceyi öne çıkardığını ve örnekleri neden kullandığını da görmek gerekir. Bu parçaya göre okuma nedir?',['Sözcük ezberleme işi','Çok katmanlı bir anlam kurma süreci','Yalnız hızlı göz gezdirme','Yazarın her fikrine katılma','Örnekleri atlama'],1,'Metin okumanın ilişkiler kurmayı gerektiren çok katmanlı bir süreç olduğunu vurgular.'),
 Q('tr-s9','k-tr-3','Bir fotoğrafçının iyi ışığı beklemesi bazen saatler sürer. Dışarıdan bakıldığında bu bekleyiş “hiçbir şey yapmamak” gibi görünebilir; oysa doğru anı seçmek üretim sürecinin bir parçasıdır. Ana düşünce hangisidir?',['Fotoğraf çekmek kolaydır.','Üretimde beklemek de bilinçli bir çalışma olabilir.','İyi ışık yalnız sabah bulunur.','Fotoğrafçılar çok zaman kaybeder.','Hızlı çalışanlar daha yaratıcıdır.'],1,'Bekleme, doğru zamanı seçme amacıyla üretimin parçası olarak sunulmuştur.'),
 Q('tr-s10','k-tr-3','Bir şehrin ulaşım sorununu yalnız yeni yollar açarak çözmeye çalışmak kısa süreli rahatlama sağlayabilir. Toplu taşıma, yaya erişimi ve bisiklet altyapısı birlikte ele alınmadığında trafik yeniden yoğunlaşabilir. Parçanın vurgusu nedir?',['Yeni yol yapmak gereksizdir.','Ulaşım sorunu bütüncül çözümler gerektirir.','Bisiklet her şehirde tek çözümdür.','Toplu taşıma trafiği artırır.','Yaya yolları araçları tamamen kaldırmalıdır.'],1,'Parça ulaşımın birden çok araç ve altyapıyı birlikte ele alan bütüncül plan gerektirdiğini savunur.'),
 Q('tr-s11','k-tr-3','Bir beceriyi öğrenirken hata yapmak sürecin doğal parçasıdır. Önemli olan hatayı yalnız “yanlış” diye işaretlemek değil, hangi adımda ve neden ortaya çıktığını incelemektir. Bu yaklaşımın temel amacı nedir?',['Hataları gizlemek','Öğrenme sürecini hatanın nedeninden hareketle geliştirmek','Daha az soru çözmek','Yanlışları ezberlemek','Başarıyı sadece puanla ölçmek'],1,'Hatanın nedenini analiz ederek öğrenmeyi geliştirmek amaçlanır.'),
 Q('tr-s12','k-tr-3','Bir ürünün dayanıklı olması önemlidir; fakat kullanıcı ürünü nasıl kullanacağını anlayamıyorsa iyi tasarımdan söz etmek güçtür. Tasarım, yalnız nesnenin görünüşü değil kullanım deneyimidir. Parçanın ana düşüncesi hangisidir?',['Dayanıklılık önemsizdir.','İyi tasarım kullanışlılığı da kapsar.','Görünüş tasarımın tek ölçütüdür.','Kullanıcılar eğitim almalıdır.','Ürünler karmaşık olmalıdır.'],1,'Tasarımın estetiğin yanında kullanılabilirliği de içermesi vurgulanır.'),
 Q('tr-s13','k-tr-3','Çok sayıda kaynak okumak bilgi birikimini artırabilir; ancak kaynaklar arasındaki çelişkileri fark etmek ve güvenilir olanı ayırmak da gerekir. Bu nedenle nicelik kadar değerlendirme becerisi de önemlidir. Parçada ne vurgulanmaktadır?',['Az kaynak okumak daha iyidir.','Bilgiye erişim değerlendirme becerisiyle desteklenmelidir.','Kaynaklar hiçbir zaman çelişmez.','Güvenilirlik yalnız yazara bağlıdır.','Okuma sayısı başarıyı garanti eder.'],1,'Bilgi miktarı yanında kaynakları değerlendirme becerisi öne çıkarılır.'),
 Q('tr-s14','k-tr-3','Bir takımda fikir ayrılığı olması başarısızlık göstergesi değildir. Görüşler gerekçeleriyle tartışıldığında ekip, ilk bakışta fark edilmeyen riskleri görebilir. Sorun, tartışmanın kişiselleşmesidir. Parçadan hangisi çıkarılabilir?',['Her fikir eşit derecede doğrudur.','Yapıcı fikir ayrılığı karar kalitesini artırabilir.','Takımlar tartışmamalıdır.','Lider tüm kararları tek başına vermelidir.','Kişisel çatışma verimlidir.'],1,'Gerekçeli ve yapıcı fikir ayrılığı riskleri görünür kılabilir.'),
 Q('tr-s15','k-tr-3','Bir dil, yeni kavramlarla karşılaştığında değişir; yeni sözcükler üretir, bazılarını başka dillerden alır, bazı eski sözcüklerin anlamını genişletir. Bu değişim, dilin canlılığının göstergelerinden biridir. En uygun başlık hangisidir?',['Dilin Değişen Yapısı','Sözcük Ezberleme','Yabancı Dillerin Zararı','Eski Sözcükler','Dil Bilgisinin Kuralları'],0,'Parçanın bütünü dilin zamanla değişmesi üzerinedir.'),
 Q('tr-s16','k-tr-3','Bir öğrenci denemede yaptığı yanlışları yalnız doğru cevaba bakarak kapatıyorsa aynı hatayı tekrar edebilir. Yanlışın bilgi eksiğinden mi, dikkatten mi, süreden mi kaynaklandığını ayırmak daha işlevseldir. Bu parçanın ana düşüncesi hangisidir?',['Her yanlış bilgi eksikliğidir.','Yanlışların nedenini sınıflandırmak öğrenmeyi güçlendirebilir.','Deneme çözmek gereksizdir.','Doğru cevaplara bakmak yeterlidir.','Süre hiçbir zaman hata nedeni değildir.'],1,'Hatanın kaynağını ayırmanın öğrenmeye katkısı vurgulanır.'),
 Q('tr-s17','k-tr-3','Bazı kitaplar ilk okumada kolayca anlaşılır, bazılarıysa okurdan daha yavaş ilerlemesini ister. Bu farklılık, ikinci tür kitapların mutlaka daha değerli olduğu anlamına gelmez; önemli olan okuma hızını metnin yapısına göre ayarlayabilmektir. Parçadan hangisi çıkarılır?',['Yavaş okunan kitaplar daha değerlidir.','Okuma hızı metne göre değişebilir.','Kolay kitaplar okunmamalıdır.','Her kitap aynı hızla okunmalıdır.','Değer yalnız uzunlukla ölçülür.'],1,'Metnin yapısına göre okuma hızının ayarlanması gerektiği savunulur.'),
 Q('tr-s18','k-tr-3','Bir mahallede küçük bir meydan, insanların karşılaşmasına ve kısa sohbetler etmesine imkân verir. Bu karşılaşmalar planlanmış etkinlikler kadar görünür olmasa da topluluk duygusunu besleyebilir. Parçanın konusu nedir?',['Büyük etkinliklerin maliyeti','Kamusal alanların gündelik toplumsal ilişkilerdeki rolü','Mahallelerde trafik sorunu','Meydanların mimarisi','Sohbetin zararları'],1,'Parça küçük kamusal alanların topluluk ilişkilerine katkısını anlatır.'),
 Q('tr-s19','k-tr-3','Bir kararın iyi olup olmadığını yalnız sonucuna bakarak değerlendirmek yanıltıcı olabilir. Bazen doğru süreç izlenir fakat beklenmedik koşullar sonucu etkiler. Bu nedenle karar kalitesi ile sonuç kalitesini ayırmak gerekir. Bu parçada ne anlatılmaktadır?',['Her iyi karar iyi sonuç verir.','Karar süreci ile sonuç aynı şey değildir.','Sonuçların önemi yoktur.','Beklenmedik durumlar planlanamaz.','Kararlar rastgele verilmelidir.'],1,'Parça karar süreci ile ortaya çıkan sonucun ayrı değerlendirilmesini savunur.'),
 Q('tr-s20','k-tr-4','A, B, C, D sırasıyla dört farklı gün sunum yapacaktır. A, C’den önce; B, D’den sonra sunum yapacaktır. Hangisi mümkün bir sıralamadır?',['C-A-D-B','A-C-D-B','B-D-A-C','D-B-C-A','C-D-B-A'],1,'A C’den önce, B de D’den sonra olmalıdır; A-C-D-B uygundur.'),
 Q('tr-s21','k-tr-4','K, L, M, N kişilerinden üçü seçilecektir. K seçilirse L de seçilecek; M ile N birlikte seçilemeyecektir. Hangisi mümkün seçimdir?',['K-M-N','K-L-M','K-N-M','K-M','M-N-L'],1,'K-L-M üçlüsü koşulları sağlar; K ile L birlikte, M ile N birlikte değildir.'),
 Q('tr-s22','k-tr-4','Üç kitap P, R, S rafta soldan sağa dizilecektir. P en solda değildir, R ise S’nin solundadır. Hangisi mümkün olabilir?',['P-R-S','R-S-P','S-R-P','P-S-R','S-P-R'],1,'R-S-P diziliminde P en solda değildir ve R S’nin solundadır.'),
 Q('tr-s23','k-tr-4','X, Y, Z görevleri pazartesi, salı, çarşamba yapılacaktır. Z çarşamba değildir; X, Y’den önce yapılacaktır. Hangisi kesinlikle yanlıştır?',['X pazartesi olabilir.','Y çarşamba olabilir.','Z pazartesi olabilir.','X çarşamba olabilir.','Z salı olabilir.'],3,'X Y’den önce olmak zorunda olduğundan X çarşamba olamaz.'),
 Q('tr-s24','k-tr-5','Aşağıdaki sözcüklerden hangisinde ünlü daralması vardır?',['bekliyor','kitabı','burnu','ağaçta','hissi'],0,'Bekle-yor birleşiminde e ünlüsü i’ye daralır: bekliyor.'),
 Q('tr-s25','k-tr-6','Aşağıdakilerden hangisinin yazımı doğrudur?',['ard arda','peşpeşe','birdenbire','her hangi','hiç bir'],2,'“Birdenbire” bitişik yazılır.'),
 Q('tr-s26','k-tr-7','“Toplantıya kimler katılacak ___” cümlesinin sonuna hangi işaret gelmelidir?',['Nokta','Virgül','Soru işareti','Ünlem','İki nokta'],2,'Doğrudan soru cümlesidir.'),
 Q('tr-s27','k-tr-8','“Bu işi ancak sen çözebilirsin.” cümlesinde “ancak” hangi görevde kullanılmıştır?',['Bağlaç','Zarf','Edat','Sıfat','Zamir'],1,'Burada “ancak” yalnızca anlamında zarf görevindedir.'),
 Q('tr-s28','k-tr-9','“Müdür toplantıdan sonra çalışanlara yeni kararı açıkladı.” cümlesinde belirtili nesne hangisidir?',['Müdür','toplantıdan sonra','çalışanlara','yeni kararı','açıkladı'],3,'Belirtme hâl eki alan “yeni kararı” nesnedir.'),
 Q('tr-s29','k-tr-10','“Beni ararsan sana ayrıntıları anlatırım.” cümlesi yapısına göre hangisidir?',['Basit','Birleşik','Sıralı','Bağlı','Eksiltili'],1,'Şart yan cümleciği bulunduğu için birleşik cümledir.'),
 Q('tr-s30','k-tr-11','Aşağıdaki cümlelerin hangisinde anlatım bozukluğu vardır?',['Bu karar herkesi şaşırttı ve tepki gösterdi.','Bu karar herkesi şaşırttı.','Herkes karara tepki gösterdi.','Kararın ayrıntıları açıklandı.','Toplantı kısa sürdü.'],0,'“Tepki gösterdi” yükleminin öznesi “bu karar” olamaz; özne uyumsuzluğu vardır.')
 ]
};

const historySection={
 id:'kpss-tarih-section-01',exam:'kpss',subjectId:'k-ta',title:'KPSS Tarih Bölüm Denemesi #01',eyebrow:'BÖLÜM DENEMESİ · KPSS',minutes:24,penalty:4,version:1,
 blueprint:[
  ['k-ta-1','İslamiyet öncesi Türk tarihi',2],['k-ta-2','İlk Türk İslam devletleri',2],['k-ta-3','Türkiye Selçuklu Devleti',1],
  ['k-ta-4','Osmanlı kuruluş dönemi',2],['k-ta-5','Osmanlı yükselme dönemi',2],['k-ta-6','Osmanlı kültür ve medeniyeti',2],
  ['k-ta-7','Osmanlı yenileşme hareketleri',2],['k-ta-8','20. yüzyılda Osmanlı Devleti',2],['k-ta-9','Millî Mücadele hazırlık dönemi',3],
  ['k-ta-10','Kurtuluş Savaşı cepheleri',3],['k-ta-11','Atatürk ilke ve inkılapları',3],['k-ta-12','Atatürk dönemi dış politika',2],
  ['k-ta-13','Çağdaş Türk ve dünya tarihi',3]
 ],
 questions:[
 Q('ta-s1','k-ta-1','Eski Türklerde yazısız hukuk kurallarının bütününe ne ad verilirdi?',['Töre','Kut','Ülüş','Toy','Yabgu'],0,'Töre toplum ve devlet hayatını düzenleyen geleneksel hukuk kurallarıdır.'),
 Q('ta-s2','k-ta-1','Uygurların diğer birçok eski Türk topluluğundan farklı olarak öne çıktığı özellik hangisidir?',['Tamamen göçebe kalmaları','Yerleşik şehir yaşamını geliştirmeleri','İslamiyet’i ilk kabul etmeleri','Anadolu’ya ilk yerleşmeleri','Roma ile ittifak kurmaları'],1,'Uygurlar yerleşik yaşam, şehir ve kültür faaliyetleriyle öne çıkar.'),
 Q('ta-s3','k-ta-2','Türkçenin söz varlığını Araplara tanıtmak amacıyla yazılan eser hangisidir?',['Kutadgu Bilig','Dîvânu Lugâti’t-Türk','Atabetü’l-Hakayık','Divan-ı Hikmet','Siyasetname'],1,'Kaşgarlı Mahmut’un Dîvânu Lugâti’t-Türk’ü Türkçeyi tanıtır.'),
 Q('ta-s4','k-ta-2','Büyük Selçuklu Devleti’nde vezirlik yapan ve Siyasetname’yi yazan devlet adamı kimdir?',['Nizamülmülk','Tuğrul Bey','Alp Arslan','Melikşah','Hasan Sabbah'],0,'Siyasetname Nizamülmülk’e aittir.'),
 Q('ta-s5','k-ta-3','1243 Kösedağ Savaşı’nın Türkiye Selçukluları açısından en önemli sonucu hangisidir?',['Bizans’ın yıkılması','Moğol/İlhanlı hâkimiyetinin güçlenmesi','Haçlı Seferlerinin sona ermesi','Osmanlı Devleti’nin kurulması','İstanbul’un fethedilmesi'],1,'Kösedağ yenilgisi Selçukluları Moğol nüfuzu altına soktu.'),
 Q('ta-s6','k-ta-4','Osmanlıların Rumeli’ye geçişinde üs olarak kullanılan kale hangisidir?',['Çimpe','Belgrad','Akçahisar','Niğbolu','Varna'],0,'Çimpe Kalesi Rumeli’ye yerleşmede ilk kalıcı üs olmuştur.'),
 Q('ta-s7','k-ta-4','Edirne’yi fethederek başkent yapan Osmanlı hükümdarı kimdir?',['Orhan Bey','I. Murat','Yıldırım Bayezid','Çelebi Mehmet','II. Murat'],1,'Edirne I. Murat döneminde fethedilip başkent yapıldı.'),
 Q('ta-s8','k-ta-5','Fatih Sultan Mehmet döneminde Karadeniz’in Türk gölü hâline gelmesinde etkili olan fetihlerden biri hangisidir?',['Kırım','Mısır','Belgrad','Rodos','Kıbrıs'],0,'Kırım’ın Osmanlı hâkimiyetine girmesi Karadeniz denetimini güçlendirdi.'),
 Q('ta-s9','k-ta-5','Kanuni döneminde Osmanlı’nın Akdeniz üstünlüğünü güçlendiren deniz zaferi hangisidir?',['Preveze','İnebahtı','Çeşme','Navarin','Sinop'],0,'1538 Preveze Zaferi Akdeniz üstünlüğünde dönüm noktasıdır.'),
 Q('ta-s10','k-ta-6','Osmanlı’da tımar sisteminin askerî sonucu aşağıdakilerden hangisidir?',['Donanmanın kaldırılması','Eyalet askerlerinin yetişmesine katkı sağlaması','Yeniçerilerin maaşsız kalması','Topçuların kaldırılması','Akıncıların sarayda eğitim görmesi'],1,'Tımar sahipleri gelir karşılığı cebelü yetiştirerek eyalet ordusuna katkı sağlardı.'),
 Q('ta-s11','k-ta-6','Devşirme sistemiyle yetiştirilen devlet görevlilerinin saraydaki eğitim kurumu hangisidir?',['Enderun','Sahn-ı Seman','Rüştiye','İdadî','Darülfünun'],0,'Enderun devşirme kökenli yetenekli öğrencilerin de yetiştirildiği saray okuludur.'),
 Q('ta-s12','k-ta-7','Yeniçeri Ocağı hangi olayla kaldırılmıştır?',['Vakayı Hayriye','31 Mart Olayı','Patrona Halil İsyanı','Kabakçı Mustafa İsyanı','Babıali Baskını'],0,'1826’da II. Mahmut dönemindeki kaldırma Vakayı Hayriye olarak anılır.'),
 Q('ta-s13','k-ta-7','I. Meşrutiyet’in ilanıyla yürürlüğe giren anayasa hangisidir?',['Kanun-ı Esasi','Teşkilat-ı Esasiye','1924 Anayasası','Tanzimat Fermanı','Islahat Fermanı'],0,'1876 Kanun-ı Esasi Osmanlı’nın ilk anayasasıdır.'),
 Q('ta-s14','k-ta-8','Trablusgarp Savaşı’nı sona erdiren antlaşma hangisidir?',['Uşi','Londra','Bükreş','Berlin','Ayastefanos'],0,'1912 Uşi (Ouchy) Antlaşması savaşı sona erdirdi.'),
 Q('ta-s15','k-ta-8','Osmanlı Devleti I. Dünya Savaşı’ndan hangi ateşkesle çekilmiştir?',['Mondros','Mudanya','Selanik','Rethondes','Sevr'],0,'30 Ekim 1918 Mondros Ateşkesi Osmanlı’nın savaştan çekilmesini sağladı.'),
 Q('ta-s16','k-ta-9','Amasya Genelgesi’nin Millî Mücadele açısından temel önemi hangisidir?',['İlk kez millî egemenliğe dayalı çözümü açıkça ortaya koyması','Saltanatı kaldırması','Cumhuriyeti ilan etmesi','Lozan’ı imzalaması','TBMM’yi kapatması'],0,'“Milletin azim ve kararı” ifadesi millî egemenlik anlayışını açıkça ortaya koyar.'),
 Q('ta-s17','k-ta-9','Erzurum Kongresi’nde alınan “manda ve himaye kabul olunamaz” kararı en çok hangi kavramla ilişkilidir?',['Tam bağımsızlık','Devletçilik','Laiklik','Kabotaj','Yerel yönetim'],0,'Manda ve himayenin reddi tam bağımsızlık düşüncesini gösterir.'),
 Q('ta-s18','k-ta-9','Sivas Kongresi’nin Millî Mücadele açısından önemli sonuçlarından biri hangisidir?',['Millî cemiyetlerin birleştirilmesi','Saltanatın kaldırılması','Cumhuriyetin ilan edilmesi','Halifeliğin kaldırılması','Lozan’ın imzalanması'],0,'Sivas’ta millî cemiyetler Anadolu ve Rumeli Müdafaa-i Hukuk çatısı altında birleşti.'),
 Q('ta-s19','k-ta-10','I. İnönü Zaferi’nden sonra İtilaf Devletlerinin TBMM’yi de çağırdığı konferans hangisidir?',['Londra Konferansı','Paris Barış Konferansı','Lozan Konferansı','San Remo Konferansı','Yalta Konferansı'],0,'I. İnönü sonrasında TBMM Londra Konferansı’na davet edildi.'),
 Q('ta-s20','k-ta-10','Sakarya Savaşı sırasında Mustafa Kemal’in “Hattı müdafaa yoktur, sathı müdafaa vardır.” sözü hangi anlayışı ifade eder?',['Savunmanın bütün vatan sathına yayılması','Sadece şehirlerin savunulması','Deniz harekâtına geçilmesi','Taarruzun durdurulması','Yalnız düzenli ordunun geri çekilmesi'],0,'Savunmanın belirli bir hatta değil bütün vatan alanına yayılması anlatılır.'),
 Q('ta-s21','k-ta-10','Kurtuluş Savaşı’nın askerî safhasını sona erdiren ateşkes hangisidir?',['Mudanya','Mondros','Gümrü','Moskova','Ankara'],0,'Mudanya Ateşkesi silahlı çatışma dönemini sona erdirdi.'),
 Q('ta-s22','k-ta-11','Aşağıdaki inkılaplardan hangisi laiklik ilkesiyle en doğrudan ilişkilidir?',['Halifeliğin kaldırılması','Kabotaj Kanunu','Aşar vergisinin kaldırılması','İzmir İktisat Kongresi','Demiryollarının millîleştirilmesi'],0,'Halifeliğin kaldırılması dinî-siyasî otoritenin ayrılması yönünde önemli adımdır.'),
 Q('ta-s23','k-ta-11','Soyadı Kanunu’nun kabulü hangi alandaki düzenlemeler arasında değerlendirilir?',['Toplumsal','Askerî','Dış politika','Maliye','Tarım'],0,'Soyadı Kanunu toplumsal alandaki inkılaplardandır.'),
 Q('ta-s24','k-ta-11','Aşağıdaki gelişmelerden hangisi ekonomik alandaki devletçilik uygulamalarına örnektir?',['Birinci Beş Yıllık Sanayi Planı','Harf İnkılabı','Şapka Kanunu','Tevhid-i Tedrisat','Soyadı Kanunu'],0,'Sanayi planları devletin ekonomide aktif rol üstlenmesinin örneklerindendir.'),
 Q('ta-s25','k-ta-12','Türkiye’nin Milletler Cemiyetine üye olduğu yıl hangisidir?',['1923','1929','1932','1936','1939'],2,'Türkiye 1932’de Milletler Cemiyetine üye oldu.'),
 Q('ta-s26','k-ta-12','Sadabat Paktı’nda Türkiye ile birlikte yer alan devletlerden biri hangisidir?',['İran','Yunanistan','Bulgaristan','Romanya','Yugoslavya'],0,'Sadabat Paktı Türkiye, İran, Irak ve Afganistan arasında imzalandı.'),
 Q('ta-s27','k-ta-13','Türkiye’nin Kore Savaşı’na asker göndermesinin ardından üye olduğu askerî ittifak hangisidir?',['NATO','Varşova Paktı','SEATO','Bağdat Paktı','Avrupa Konseyi'],0,'Türkiye 1952’de NATO’ya üye oldu.')
 ]
};

const sectionExams=[turkishSection,historySection];

function validateQuestion(q){
 if(!q||typeof q!=='object'||!q.id||!q.topicId||!q.text)throw new Error('KPSS soru kimliği/konusu/metni eksik.');
 if(!Array.isArray(q.options)||q.options.length!==5)throw new Error('KPSS sorusu 5 seçenekli olmalı: '+q.id);
 if(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length)throw new Error('KPSS soru cevabı geçersiz: '+q.id);
 return q;
}
function validate(){
 const ids=new Set();
 for(const set of topicSets){
  if(set.questions.length<3||set.questions.length>6)throw new Error('Konu pratiği 3-6 soru aralığında olmalı: '+set.id);
  for(const q of set.questions){validateQuestion(q);if(ids.has(q.id))throw new Error('Soru id tekrar ediyor: '+q.id);ids.add(q.id);}
 }
 for(const exam of sectionExams){
  const expected=exam.blueprint.reduce((n,row)=>n+row[2],0);
  if(expected!==exam.questions.length)throw new Error('Bölüm denemesi blueprint toplamı uyuşmuyor: '+exam.id);
  for(const q of exam.questions){validateQuestion(q);if(ids.has(q.id))throw new Error('Soru id tekrar ediyor: '+q.id);ids.add(q.id);}
  const byTopic=new Map();
  for(const q of exam.questions)byTopic.set(q.topicId,(byTopic.get(q.topicId)||0)+1);
  for(const [topicId,,count] of exam.blueprint)if((byTopic.get(topicId)||0)!==count)throw new Error('Bölüm denemesi konu dağılımı uyuşmuyor: '+exam.id+' / '+topicId);
 }
 return {questions:ids.size,topicSets:topicSets.length,sectionExams:sectionExams.length};
}
function coverage(){
 const v=validate();
 return {...v,schema:SCHEMA,version:VERSION,subjects:[...new Set(topicSets.map(x=>x.subjectId))],basis:BASIS};
}
validate();

root.RotaKpssPractice={SCHEMA,VERSION,BASIS,topicSets,sectionExams,validateQuestion,validate,coverage};
if(typeof module==='object')module.exports=root.RotaKpssPractice;
})(typeof window!=='undefined'?window:globalThis);
