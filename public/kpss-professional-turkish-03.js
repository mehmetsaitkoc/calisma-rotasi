(function(root){
'use strict';
const tests=[
  {
    "id": "kpss:k-tr:k-tr-3:t01",
    "exam": "kpss",
    "subjectId": "k-tr",
    "topicId": "k-tr-3",
    "topicTitle": "Paragrafta anlam",
    "setNo": 1,
    "title": "KPSS Türkçe · Paragrafta Anlam · Test 1",
    "eyebrow": "PROFESYONEL KONU TESTİ · KPSS",
    "minutes": 20,
    "level": "Temel kazanım + bağlam",
    "questions": [
      {
        "id": "ktr3-t1-q01",
        "topicId": "k-tr-3",
        "text": "Bir kitabı hızlı bitirmek, onu iyi anlamakla aynı şey değildir. Bazı metinler okurdan durmayı, önceki cümleyle sonrakini ilişkilendirmeyi ve kendi yorumunu sınamayı ister. Bu yüzden okuma hızını tek başına başarı ölçüsü saymak yanıltıcıdır. Bu parçanın ana düşüncesi aşağıdakilerden hangisidir?",
        "options": [
          "Okuma hızı her metinde düşürülmelidir.",
          "İyi okuma, hızdan çok anlam kurma sürecine bağlıdır.",
          "Uzun metinler kısa metinlerden daha zordur.",
          "Yavaş okuyan herkes metni daha iyi anlar.",
          "Kitap okurken mutlaka not alınmalıdır."
        ],
        "answer": 1,
        "explanation": "Parça, okumanın niteliğini yalnız hızla açıklamanın yanlış olduğunu; asıl ölçütün metinle anlamlı ilişki kurmak olduğunu vurgular.",
        "difficulty": "easy",
        "cognitive": "interpretation",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t1-q02",
        "topicId": "k-tr-3",
        "text": "Kent içindeki küçük parkların değeri yalnız yeşil alan miktarıyla ölçülemez. Bu alanlar çocukların oynadığı, yaşlıların dinlendiği, çalışanların kısa mola verdiği ve komşuların karşılaştığı ortak mekânlardır. Böylece fiziksel büyüklüklerinden daha geniş bir toplumsal işlev üstlenirler. Bu parçadan aşağıdakilerden hangisine ulaşılabilir?",
        "options": [
          "Küçük parklar büyük parklardan daha kullanışlıdır.",
          "Her mahallede aynı büyüklükte park bulunmalıdır.",
          "Parkların temel işlevi çocuklara oyun alanı sağlamaktır.",
          "Parkların değeri yalnız yüzölçümüne bağlı değildir.",
          "Kentlerde yeşil alanların çoğu yeterince kullanılmamaktadır."
        ],
        "answer": 3,
        "explanation": "Parçada parkların toplumsal buluşma işlevi öne çıkarıldığı için değerlerinin yalnız fiziksel büyüklükle açıklanamayacağı sonucu çıkar.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t1-q03",
        "topicId": "k-tr-3",
        "text": "Bir araştırmada çok veri toplamak tek başına güçlü sonuç üretmez. Verinin nasıl toplandığı, hangi koşullarda karşılaştırıldığı ve hangi soruya cevap verdiği de önemlidir. Aksi hâlde büyük bir veri yığını, zayıf bir yöntemi gizleyebilir. Bu parçaya en uygun başlık hangisidir?",
        "options": [
          "Verinin Miktarı ve Yöntemin Önemi",
          "Araştırmada Hızlı Sonuç",
          "Büyük Veri Her Zaman Güvenilir mi?",
          "Bilimsel Soruların Tarihi",
          "Karşılaştırmalı Çalışmalar"
        ],
        "answer": 0,
        "explanation": "Parçada veri miktarı ile yöntem kalitesi arasındaki ilişki tartışılıyor; en kapsayıcı başlık “Verinin Miktarı ve Yöntemin Önemi”dir.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Başlık",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t1-q04",
        "topicId": "k-tr-3",
        "text": "Bir alışkanlık oluştururken ilk günlerde çok yüksek hedefler koymak motive edici görünebilir. Ancak sürdürülemeyen yoğunluk, kısa sürede vazgeçmeye yol açabilir. Küçük ama tekrar edilebilir adımların gücü, zaman içinde birikmelerinden gelir. Bu parçanın ana düşüncesi aşağıdakilerden hangisidir?",
        "options": [
          "Büyük hedefler mutlaka başarısız olur.",
          "İlk günlerde yoğun çalışmak gerekir.",
          "Motivasyon alışkanlık oluşumunda önemsizdir.",
          "Tekrar edilen her davranış yararlıdır.",
          "Sürdürülebilir küçük adımlar uzun vadede daha etkili olabilir."
        ],
        "answer": 4,
        "explanation": "Parça, alışkanlık kurarken tek seferlik yüksek yoğunluktan çok sürdürülebilir ve tekrarlanabilir davranışların önemini vurgular.",
        "difficulty": "easy",
        "cognitive": "interpretation",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t1-q05",
        "topicId": "k-tr-3",
        "text": "Bir müzede yüzlerce eseri aynı anda göstermek mümkün olabilir; ancak iyi bir sergi her şeyi göstermeye çalışmaz. Seçilen eserlerin birbirleriyle kurduğu ilişki, ziyaretçinin zihninde bir anlatı oluşturur. Bazen dışarıda bırakılan eserler de bu anlatının netleşmesine katkı sağlar. Bu parçada asıl anlatılmak istenen nedir?",
        "options": [
          "Müzeler eser sayısını azaltmalıdır.",
          "Ziyaretçiler çok sayıda eserden hoşlanmaz.",
          "İyi bir sergi bilinçli seçim ve düzenlemeyle anlam kurar.",
          "Sergilenmeyen eserlerin değeri daha düşüktür.",
          "Her müze tek bir konuya odaklanmalıdır."
        ],
        "answer": 2,
        "explanation": "Parçanın odağı, kürasyonun her şeyi sergilemek değil seçilmiş eserlerle anlamlı bir bütün kurmak olduğudur.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t1-q06",
        "topicId": "k-tr-3",
        "text": "Bir ekipte herkesin aynı fikirde olması işleri hızlandırabilir; fakat bu durum gözden kaçan risklerin fark edilmesini de zorlaştırabilir. Farklı görüşlerin gerekçeleriyle ortaya konması, kararın zayıf yanlarını görünür kılar. Sorun fikir ayrılığı değil, tartışmanın kişiselleşmesidir. Bu parçadan aşağıdakilerden hangisi çıkarılamaz?",
        "options": [
          "Gerekçeli görüş ayrılığı karar kalitesine katkı sağlayabilir.",
          "Başarılı ekiplerde fikir ayrılığı tamamen ortadan kaldırılmalıdır.",
          "Fikir birliği her durumda doğru kararı garanti etmez.",
          "Kişisel çatışma ile düşünsel tartışma aynı şey değildir.",
          "Farklı görüşler bazı riskleri görünür kılabilir."
        ],
        "answer": 1,
        "explanation": "Parça yapıcı fikir ayrılığının yararlı olabileceğini savunduğu için “başarılı ekiplerde fikir ayrılığı tamamen kaldırılmalıdır” yargısına ulaşılamaz.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Yardımcı düşünce / çıkarılamaz",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t1-q07",
        "topicId": "k-tr-3",
        "text": "Bir çevirmen yalnız sözcükleri başka bir dile aktarmakla yetinmez. Metnin tonunu, bağlamını ve hedef dilde doğal duyulup duyulmadığını da gözetir. Sözcüğe birebir bağlı kalmak bazen anlamı korumak yerine onu yabancılaştırabilir. Bu parçaya göre iyi bir çeviri için aşağıdakilerden hangisi önemlidir?",
        "options": [
          "Her sözcüğü aynı sırayla çevirmek",
          "Kaynak metnin biçimini tamamen bırakmak",
          "Çevirmenin kişisel görüşlerini eklemesi",
          "Anlamı korurken hedef dilin doğallığını da gözetmek",
          "Yalnız kısa cümleleri çevirmek"
        ],
        "answer": 3,
        "explanation": "Parça, iyi çevirinin hem anlam sadakatini hem de hedef dilde doğallığı birlikte gözetmesini savunur.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t1-q08",
        "topicId": "k-tr-3",
        "text": "Fotoğraf, bir anı olduğu gibi saklayan nötr bir kutu değildir. Kadraja neyin alındığı, neyin dışarıda bırakıldığı ve görüntünün hangi anda çekildiği anlatıyı değiştirir. Bu nedenle aynı olayın iki fotoğrafı farklı hikâyeler kurabilir. Bu parçanın vurguladığı düşünce hangisidir?",
        "options": [
          "Fotoğrafın anlamı seçimlerden ve bakış açısından etkilenir.",
          "Fotoğraflar geçmişi eksiksiz gösterir.",
          "Aynı olay yalnız tek biçimde görüntülenebilir.",
          "İyi fotoğraf için pahalı cihaz gerekir.",
          "Fotoğraf yazıdan her zaman daha güvenilirdir."
        ],
        "answer": 0,
        "explanation": "Parçada kadraj ve zaman seçiminin anlatıyı değiştirdiği söylenerek fotoğrafın bakış açısından etkilendiği vurgulanmaktadır.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t1-q09",
        "topicId": "k-tr-3",
        "text": "Bir şehirde bisiklet kullanımını artırmak için yalnızca birkaç kilometrelik bisiklet yolu yapmak yeterli değildir. Yolların birbirine bağlanması, güvenli kavşakların kurulması ve toplu taşımayla entegrasyon da gerekir. Çünkü ulaşım tercihi, tek bir düzenlemeden çok sistemin bütünüyle ilgilidir. Bu parçadan aşağıdakilerden hangisine ulaşılabilir?",
        "options": [
          "Bisiklet yolları toplu taşımayı gereksiz kılar.",
          "Şehirlerde özel araç kullanımı tamamen kaldırılmalıdır.",
          "Kısa bisiklet yolları hiçbir işe yaramaz.",
          "Güvenli kavşaklar yalnız bisikletliler için önemlidir.",
          "Ulaşım davranışı bütüncül altyapı düzenlemelerinden etkilenir."
        ],
        "answer": 4,
        "explanation": "Parça, bisiklet kullanımının tek bir yol düzenlemesiyle değil birbirini tamamlayan altyapı unsurlarıyla desteklenmesi gerektiğini anlatır.",
        "difficulty": "easy",
        "cognitive": "reasoning",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t1-q10",
        "topicId": "k-tr-3",
        "text": "Yeni bir teknolojinin yaygınlaşması, eski yöntemin bir anda değersizleştiği anlamına gelmez. Bazen eski yöntem daha yavaş olsa da daha güvenilir, ucuz veya erişilebilir olabilir. ---- Bu nedenle hangi yöntemin uygun olduğuna karar verirken yalnız yenilik derecesine bakmak yeterli değildir. Boş bırakılan yere aşağıdakilerden hangisi getirilmelidir?",
        "options": [
          "Her yeni teknoloji eskisinden daha başarılıdır.",
          "Eski yöntemlerin geliştirilmesi mümkün değildir.",
          "Yöntemlerin değeri kullanım koşullarına göre değişebilir.",
          "Teknoloji seçimi yalnız maliyete göre yapılmalıdır.",
          "Güvenilir yöntemler genellikle daha yenidir."
        ],
        "answer": 2,
        "explanation": "Son cümleye geçiş için yeni-eski karşıtlığını koşullara bağlayan bir ara yargı gerekir; “Yöntemlerin değeri kullanım koşullarına göre değişebilir.” bu işlevi görür.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Paragraf tamamlama",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t1-q11",
        "topicId": "k-tr-3",
        "text": "Bir dil, yeni kavramlarla karşılaştığında değişir; yeni sözcükler üretir, bazılarını başka dillerden alır, bazı eski sözcüklerin anlamını genişletir. Bu hareketlilik, kuralsızlık değil yaşayan bir dilin yeni ihtiyaçlara cevap verme biçimidir. Bu parçada yazarın asıl amacı aşağıdakilerden hangisidir?",
        "options": [
          "Dillerdeki her değişimin olumlu olduğunu kanıtlamak",
          "Dil değişimini canlılığın doğal sonucu olarak açıklamak",
          "Yabancı sözcüklerin kullanımını savunmak",
          "Eski sözcüklerin unutulmasını eleştirmek",
          "Dil bilgisi kurallarının gereksizliğini göstermek"
        ],
        "answer": 1,
        "explanation": "Yazar, dildeki değişimi bozulma olarak değil yeni iletişim ihtiyaçlarına cevap veren doğal bir canlılık göstergesi olarak açıklamaktadır.",
        "difficulty": "hard",
        "cognitive": "interpretation",
        "skill": "Yazarın amacı",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t1-q12",
        "topicId": "k-tr-3",
        "text": "Bir kararın kalitesini yalnız sonucuna bakarak ölçmek yanıltıcı olabilir. Doğru bilgiyle ve tutarlı bir süreçle alınmış bir karar, beklenmedik koşullar nedeniyle kötü sonuç verebilir. Tersi de mümkündür: zayıf bir süreç şans eseri iyi sonuç doğurabilir. Bu parçaya göre aşağıdakilerden hangisi söylenebilir?",
        "options": [
          "İyi kararlar her zaman olumlu sonuç verir.",
          "Sonuçlar karar sürecinden tamamen bağımsızdır.",
          "Şans faktörü kararların tüm değerini ortadan kaldırır.",
          "Karar süreci ile ortaya çıkan sonuç ayrı ayrı değerlendirilmelidir.",
          "Kötü sonuç veren kararlar mutlaka yanlış alınmıştır."
        ],
        "answer": 3,
        "explanation": "Parça, karar sürecinin niteliği ile ortaya çıkan sonucun aynı şey olmadığını ve ikisinin ayrı değerlendirilmesi gerektiğini savunur.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      }
    ],
    "version": 2,
    "qualityStatus": "approved",
    "sourceKind": "original",
    "copyrightPolicy": "original-only",
    "sourceBasis": [
      "official-scope-2026",
      "multi-year-trend",
      "official-question-style-review"
    ]
  },
  {
    "id": "kpss:k-tr:k-tr-3:t02",
    "exam": "kpss",
    "subjectId": "k-tr",
    "topicId": "k-tr-3",
    "topicTitle": "Paragrafta anlam",
    "setNo": 2,
    "title": "KPSS Türkçe · Paragrafta Anlam · Test 2",
    "eyebrow": "PROFESYONEL KONU TESTİ · KPSS",
    "minutes": 20,
    "level": "Bağlam ve ayırt etme",
    "questions": [
      {
        "id": "ktr3-t2-q01",
        "topicId": "k-tr-3",
        "text": "Bir bilimsel modelin değeri, gerçeğin her ayrıntısını kopyalamasında değildir. Model, karmaşık bir olgunun belirli yönlerini seçerek anlaşılır hâle getirir. Bu nedenle iyi bir modelin bazı ayrıntıları dışarıda bırakması kusur değil, kimi zaman zorunlu bir sadeleştirmedir. Bu parçanın ana düşüncesi hangisidir?",
        "options": [
          "Bilimsel modeller gerçeğin birebir kopyası olmalıdır.",
          "Modelde ayrıntı azaldıkça doğruluk artar.",
          "Sadeleştirme, model kurmanın işlevsel bir parçası olabilir.",
          "Karmaşık olgular modelle açıklanamaz.",
          "Bilimsel modeller yalnız görsel olmalıdır."
        ],
        "answer": 2,
        "explanation": "Parça, modelin işlevinin her ayrıntıyı çoğaltmak değil önemli yönleri seçerek açıklanabilirlik sağlamak olduğunu vurgular.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t2-q02",
        "topicId": "k-tr-3",
        "text": "Bir mahalledeki eski bir dükkânın kapanması, yalnız bir işletmenin sona ermesi değildir. Orada yıllardır karşılaşan insanlar, aynı zamanda gündelik bir buluşma noktasını da kaybeder. Kent hafızası bazen büyük anıtlardan çok bu küçük mekânlarda yaşar. Bu parçadan aşağıdakilerden hangisine ulaşılabilir?",
        "options": [
          "Kent belleği gündelik mekânlarda da oluşabilir.",
          "Eski dükkânlar ekonomik olarak verimsizdir.",
          "Anıtların kent hafızasında hiçbir rolü yoktur.",
          "Mahalle yaşamı yalnız ticarete dayanır.",
          "Kapanan her dükkân toplumsal bağları yok eder."
        ],
        "answer": 0,
        "explanation": "Parçada küçük bir dükkânın sosyal karşılaşmalara ve kent hafızasına katkısı anlatılır; buradan kent belleğinin gündelik mekânlarda da oluşabildiği çıkar.",
        "difficulty": "easy",
        "cognitive": "reasoning",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t2-q03",
        "topicId": "k-tr-3",
        "text": "Eleştiri, bir eserin kusurlarını saymakla sınırlı değildir. Eserin hangi hedefleri koyduğunu, bunlara ne ölçüde ulaştığını ve kullandığı araçların nasıl işlediğini de inceler. Böyle bir değerlendirme, yalnız “beğendim-beğenmedim” düzeyinin ötesine geçer. Bu parçaya en uygun başlık hangisidir?",
        "options": [
          "Sanatın Kişisel Yönü",
          "Kusursuz Eser Arayışı",
          "Beğeninin Gücü",
          "Eleştirmenin Görevi",
          "Eleştiride Ölçütlü Değerlendirme"
        ],
        "answer": 4,
        "explanation": "Parça eleştirinin kişisel beğeniden çok amaç, araç ve sonuç ilişkisini ölçütlerle değerlendirme işi olduğunu anlatır.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Başlık",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t2-q04",
        "topicId": "k-tr-3",
        "text": "Bir alışkanlığı değiştirmek isteyen kişi çoğu zaman iradesini güçlendirmeye odaklanır. Oysa davranışı tetikleyen çevresel ipuçlarını değiştirmek de en az irade kadar etkili olabilir. Masadaki telefonu başka odaya bırakmak, bildirimleri kapatmak gibi küçük düzenlemeler davranışı kolaylaştırabilir. Bu parçadan aşağıdakilerden hangisi çıkarılamaz?",
        "options": [
          "Davranış çevresel düzenlemelerden etkilenebilir.",
          "İrade alışkanlık değişiminde hiçbir rol oynamaz.",
          "Alışkanlık değişiminde yalnız iradeye güvenmek yeterli olmayabilir.",
          "Küçük çevresel değişiklikler davranışı kolaylaştırabilir.",
          "Tetikleyicileri azaltmak istenen davranışı destekleyebilir."
        ],
        "answer": 1,
        "explanation": "Parça iradenin tek başına yeterli olmayabileceğini söyler; iradenin hiç rolü olmadığını iddia etmez.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Çıkarılamaz",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t2-q05",
        "topicId": "k-tr-3",
        "text": "Bir veri görselleştirmesi, çok sayıda sayıyı tek bakışta anlaşılır hâle getirebilir. Ancak eksen aralıkları, renkler ve seçilen ölçek okuyucunun algısını yönlendirebilir. Bu yüzden görselin etkileyici olması, onun tarafsız olduğu anlamına gelmez. Bu parçanın vurguladığı temel düşünce hangisidir?",
        "options": [
          "Görselleştirme her zaman yanıltıcıdır.",
          "Sayısal veriler metinle verilmelidir.",
          "Renkli grafikler bilimsel değildir.",
          "Görsel tasarım seçimleri verinin yorumunu etkileyebilir.",
          "Eksen kullanımı gereksizdir."
        ],
        "answer": 3,
        "explanation": "Parça, grafik tasarımındaki seçimlerin verinin algılanışını etkileyebileceğini, bu nedenle görselin tarafsızlığının ayrıca sorgulanması gerektiğini anlatır.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t2-q06",
        "topicId": "k-tr-3",
        "text": "İyi bir öğretmen, öğrencinin verdiği yanlış cevabı yalnız sonuç olarak görmez. Yanlışın hangi düşünme adımında ortaya çıktığını anlamaya çalışır; çünkü aynı yanlış cevap farklı nedenlerden doğabilir. Biri bilgiyi bilmiyordur, diğeri acele etmiş, bir başkası soruyu yanlış yorumlamıştır. Bu parçaya göre aşağıdakilerden hangisi önemlidir?",
        "options": [
          "Tüm yanlışları aynı biçimde düzeltmek",
          "Öğrencinin hızını artırmak",
          "Yanlışın nedenini belirlemek",
          "Doğru cevabı doğrudan söylemek",
          "Yanlış sayısını gizlemek"
        ],
        "answer": 2,
        "explanation": "Parça, yanlış cevabın altında yatan farklı nedenleri ayırt etmeyi öğretim açısından önemli görmektedir.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Yardımcı düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t2-q07",
        "topicId": "k-tr-3",
        "text": "Bir kurumun yalnız kriz anında iletişim kurması, kamuoyunda güven oluşturmak için yeterli olmayabilir. Güven, olağan zamanlarda düzenli bilgi paylaşımı ve tutarlı davranışlarla birikir. Kriz iletişimi de ancak böyle bir zeminde daha inandırıcı olabilir. Bu parçadan aşağıdaki yargılardan hangisine ulaşılabilir?",
        "options": [
          "Sürekli ve tutarlı iletişim kriz dönemindeki güvenilirliği destekler.",
          "Kriz iletişimi gereksizdir.",
          "Güven yalnız kriz zamanlarında kurulur.",
          "Kurumlar her bilgiyi paylaşmalıdır.",
          "Kamuoyu kriz dönemlerinde hiçbir açıklamaya inanmaz."
        ],
        "answer": 0,
        "explanation": "Parçada güvenin olağan dönemde biriktiği ve bunun kriz iletişimini daha inandırıcı kıldığı belirtilmektedir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t2-q08",
        "topicId": "k-tr-3",
        "text": "Bir yazarın aynı temaya yıllar boyunca dönmesi, kendini tekrar ettiği anlamına gelmeyebilir. Yaşantısı, dili ve bakış açısı değiştikçe aynı konu farklı sorulara açılabilir. Tekrar, ancak yeni bir düşünsel hareket üretmediğinde sorun hâline gelir. Bu parçanın ana düşüncesi hangisidir?",
        "options": [
          "Aynı temayı işlemek her zaman tekrardır.",
          "Yazarlar her kitapta yeni bir konu seçmelidir.",
          "Yaşantı değişikliği üslubu mutlaka geliştirir.",
          "Tekrar sanatın temel özelliğidir.",
          "Bir tema, değişen bakışla farklı biçimlerde yeniden ele alınabilir."
        ],
        "answer": 4,
        "explanation": "Parça, aynı temaya dönüşün tek başına tekrar sayılmayacağını; farklı bakış ve sorular üretildiğinde yeni bir anlam taşıyabileceğini savunur.",
        "difficulty": "easy",
        "cognitive": "interpretation",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t2-q09",
        "topicId": "k-tr-3",
        "text": "Bir şehrin yalnız merkezini yenilemek, bütün kentte yaşam kalitesini artırmayabilir. Ulaşım, eğitim, sağlık ve kamusal alanlara erişimde mahalleler arasında büyük farklar varsa merkezdeki iyileşme sınırlı kalır. ---- Boş bırakılan yere düşüncenin akışına göre aşağıdakilerden hangisi getirilmelidir?",
        "options": [
          "Kent merkezlerinde tarihî yapılar korunmalıdır.",
          "Bu nedenle kent politikaları farklı bölgeler arasındaki erişim eşitsizliklerini de gözetmelidir.",
          "Ulaşım yatırımları her zaman pahalıdır.",
          "Mahallelerin nüfusu birbirinden farklıdır.",
          "Şehirlerin büyümesi tamamen durdurulmalıdır."
        ],
        "answer": 1,
        "explanation": "Önceki cümlelerde mahalleler arası erişim farkları vurgulandığı için sonuç cümlesi kent politikasının bu eşitsizlikleri gözetmesi gerektiğini belirtmelidir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Paragraf tamamlama",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t2-q10",
        "topicId": "k-tr-3",
        "text": "Yeni bir uygulamanın ilk haftasında kullanıcı sayısının hızla artması sevindirici olabilir. Fakat kullanımın birkaç ay sonra sürüp sürmediği, insanların uygulamayı gerçekten işe yarar bulup bulmadığını daha iyi gösterir. İlk ilgi ile kalıcı kullanım aynı şey değildir. Bu parçaya göre hangi ölçüt daha anlamlıdır?",
        "options": [
          "İlk gün indirilen uygulama sayısı",
          "Reklamın görüntülenme sayısı",
          "Uygulamanın dosya büyüklüğü",
          "Uzun vadede devam eden kullanım",
          "İlk hafta yapılan yorum sayısı"
        ],
        "answer": 3,
        "explanation": "Parça, ilk ilgiden çok kullanıcıların zaman içinde uygulamayı kullanmaya devam etmesini gerçek faydanın daha güçlü göstergesi olarak sunar.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t2-q11",
        "topicId": "k-tr-3",
        "text": "Bir tartışmada güçlü olmak, karşı tarafın en zayıf cümlesine saldırmak değildir. Asıl sınama, karşı görüşün en makul ve güçlü biçimini anlamak ve ona cevap verebilmektir. Böylece tartışma, bir üstünlük gösterisinden çok düşüncenin dayanıklılık testine dönüşür. Bu parçada eleştirilen tutum hangisidir?",
        "options": [
          "Karşı görüşü en güçlü biçimiyle ele almak",
          "Fikirleri gerekçeleriyle tartışmak",
          "Karşı tarafın zayıf ifadesini hedef alarak kolay zafer aramak",
          "Kendi görüşünü sorgulamak",
          "Tartışmayı düşünceyi sınama aracı saymak"
        ],
        "answer": 2,
        "explanation": "Yazar, karşı görüşün en zayıf ifadesine saldırmayı kolay üstünlük arayışı olarak görür ve asıl sınamanın güçlü biçime cevap vermek olduğunu savunur.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Yazarın tutumu",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t2-q12",
        "topicId": "k-tr-3",
        "text": "Bir tarifin birebir uygulanması her zaman aynı sonucu vermez. Malzemenin tazeliği, ortam sıcaklığı ve kullanılan araçlar sonucu etkileyebilir. Deneyimli bir aşçı bu değişkenleri göz önünde bulundurarak küçük ayarlamalar yapar. Bu parçadan aşağıdakilerden hangisine ulaşılabilir?",
        "options": [
          "Deneyim, koşullara göre esnek uygulama yapmayı sağlar.",
          "Kurallar her durumda gereksizdir.",
          "Tarifler yalnız profesyonel aşçılar içindir.",
          "Malzemenin tazeliği tek belirleyici etkendir.",
          "Aynı yemek iki kez yapılamaz."
        ],
        "answer": 0,
        "explanation": "Parçada deneyimin, tarifi körü körüne uygulamak yerine değişen koşullara göre ayarlama yapmayı sağladığı anlatılır.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      }
    ],
    "version": 2,
    "qualityStatus": "approved",
    "sourceKind": "original",
    "copyrightPolicy": "original-only",
    "sourceBasis": [
      "official-scope-2026",
      "multi-year-trend",
      "official-question-style-review"
    ]
  },
  {
    "id": "kpss:k-tr:k-tr-3:t03",
    "exam": "kpss",
    "subjectId": "k-tr",
    "topicId": "k-tr-3",
    "topicTitle": "Paragrafta anlam",
    "setNo": 3,
    "title": "KPSS Türkçe · Paragrafta Anlam · Test 3",
    "eyebrow": "PROFESYONEL KONU TESTİ · KPSS",
    "minutes": 20,
    "level": "Karma ve güçlü çeldirici",
    "questions": [
      {
        "id": "ktr3-t3-q01",
        "topicId": "k-tr-3",
        "text": "Bir kurumun verimliliğini yalnız çalışanların ne kadar meşgul olduğuna bakarak değerlendirmek yanıltıcıdır. Yoğun görünmek ile değer üreten işe zaman ayırmak aynı şey değildir. Hatta sürekli toplantı ve mesaj trafiği, asıl işin ilerlemesini engelleyebilir. Bu parçanın ana düşüncesi hangisidir?",
        "options": [
          "Toplantılar tamamen kaldırılmalıdır.",
          "Mesajlaşma çalışanları her zaman yavaşlatır.",
          "Verimli çalışanlar daha az çalışır.",
          "Kurumlarda iletişim gereksizdir.",
          "Meşguliyet düzeyi verimliliğin güvenilir ölçütü değildir."
        ],
        "answer": 4,
        "explanation": "Parça, görünür yoğunluğun gerçek çıktı ve değer üretimiyle aynı olmadığını savunmaktadır.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t3-q02",
        "topicId": "k-tr-3",
        "text": "Bir tarihî yapıyı korumak, onu kullanımdan tamamen çıkarmak anlamına gelmez. Uygun işlevlerle yaşayan bir mekân hâline getirilen yapılar, hem günlük hayata katılır hem de bakım için kaynak üretir. Ancak yeni kullanım, yapının özgün karakterini silmemelidir. Bu parçadan hangisi çıkarılabilir?",
        "options": [
          "Tarihî yapılar yalnız müze olmalıdır.",
          "Yeni işlevler yapının özgünlüğünü her zaman bozar.",
          "Koruma ile kullanım arasında denge kurulabilir.",
          "Koruma için ekonomik kaynak gerekmez.",
          "Kullanılan tarihî yapılar korunmuş sayılmaz."
        ],
        "answer": 2,
        "explanation": "Parça, tarihî yapının hem kullanılabileceğini hem de özgün karakterinin korunması gerektiğini söyleyerek iki amaç arasında denge kurulabileceğini gösterir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t3-q03",
        "topicId": "k-tr-3",
        "text": "Bir metinde kullanılan örnekler, ana düşüncenin yerine geçmez; onu somutlaştırır ve görünür kılar. Okur örneğe takılıp asıl savı kaçırdığında parçanın ayrıntısını hatırlar ama ne söylediğini anlayamaz. Bu parçaya göre örneklerin temel işlevi nedir?",
        "options": [
          "Metnin uzunluğunu artırmak",
          "Ana düşünceyi destekleyip somutlaştırmak",
          "Yeni bir ana düşünce oluşturmak",
          "Okuru ayrıntıya yöneltmek",
          "Savı gereksiz hâle getirmek"
        ],
        "answer": 1,
        "explanation": "Parça, örneklerin ana savın yerine geçmediğini, onu anlaşılır ve somut hâle getirdiğini açıkça belirtmektedir.",
        "difficulty": "easy",
        "cognitive": "interpretation",
        "skill": "Yardımcı düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t3-q04",
        "topicId": "k-tr-3",
        "text": "Bir haberin çok sayıda kişi tarafından paylaşılması, onun doğruluğuna ilişkin kanıt değildir. İnsanlar şaşırtıcı, öfkelendirici veya kendi görüşlerini doğrulayan içerikleri daha hızlı yayabilir. Bu nedenle yaygınlık ile güvenilirlik birbirinden ayrılmalıdır. Bu parçanın temel uyarısı aşağıdakilerden hangisidir?",
        "options": [
          "Çok paylaşılan içerikler mutlaka yanlıştır.",
          "İnsanlar yalnız doğru haberleri paylaşır.",
          "Öfkeli içerikler daha güvenilirdir.",
          "Paylaşım sayısı haberin güvenilirliğini tek başına göstermez.",
          "Sosyal medya haberciliği tamamen bırakılmalıdır."
        ],
        "answer": 3,
        "explanation": "Parçanın temel uyarısı, bir içeriğin yaygınlaşmasının doğruluk kanıtı sayılamayacağıdır.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t3-q05",
        "topicId": "k-tr-3",
        "text": "Bir besteci, sessizliği müziğin yokluğu olarak değil, sesler arasındaki gerilimi kuran bir unsur olarak kullanabilir. Bazı anlarda çalınmayan nota, çalınan kadar belirleyici olur. Böylece dinleyici yalnız sesi değil, bekleyişi de duyar. Bu parçaya en uygun başlık hangisidir?",
        "options": [
          "Müzikte Sessizliğin İşlevi",
          "Bestecinin Eğitimi",
          "Nota Yazımının Tarihi",
          "Dinleyicinin Beklentileri",
          "Müzikte Hız"
        ],
        "answer": 0,
        "explanation": "Parça bütünüyle sessizliğin müzikte yapısal ve anlatımsal bir unsur olarak kullanımını ele alır.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Başlık",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t3-q06",
        "topicId": "k-tr-3",
        "text": "Bir çalışmanın “istatistiksel olarak anlamlı” sonuç vermesi, sonucun mutlaka önemli veya büyük olduğu anlamına gelmez. Çok büyük örneklemlerde küçük farklar da istatistiksel olarak belirginleşebilir. Bu nedenle sonuç yorumlanırken etkinin büyüklüğü de dikkate alınmalıdır. Bu parçadan hangisi çıkarılabilir?",
        "options": [
          "Büyük örneklemler kullanılmamalıdır.",
          "Küçük farklar her zaman önemsizdir.",
          "İstatistiksel analiz gereksizdir.",
          "Etki büyüklüğü yalnız küçük örneklemlerde önemlidir.",
          "İstatistiksel anlamlılık tek başına pratik önemi göstermeyebilir."
        ],
        "answer": 4,
        "explanation": "Parça, anlamlılık testinin pratik önemle eş tutulamayacağını ve etkinin büyüklüğünün ayrıca incelenmesi gerektiğini anlatır.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t3-q07",
        "topicId": "k-tr-3",
        "text": "Bir şehrin kimliğini yalnız tarihî binalarla açıklamak eksik kalır. Sokakların kullanım biçimi, günlük ritimler, sesler, kokular ve insanların birbirleriyle kurduğu ilişkiler de o şehri özgün kılar. Kent kimliği, taş ile yaşamın birlikte ürettiği bir bütündür. Bu parçada aşağıdakilerden hangisi vurgulanmaktadır?",
        "options": [
          "Tarihî binalar şehir kimliğinde önemsizdir.",
          "Her şehrin kokusu birbirinden farklıdır.",
          "Kent kimliği maddi ve yaşantısal unsurların birlikteliğiyle oluşur.",
          "Kentler yalnız insanların ilişkileriyle şekillenir.",
          "Yeni binalar kent kimliğini mutlaka bozar."
        ],
        "answer": 2,
        "explanation": "Parçada tarihî yapıların yanı sıra gündelik yaşamın da kimliği oluşturduğu, yani maddi ve yaşantısal öğelerin birlikte etkili olduğu vurgulanır.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t3-q08",
        "topicId": "k-tr-3",
        "text": "Bir problemi çözmeye çalışırken ilk bulunan açıklamaya bağlanmak rahatlatıcı olabilir. Ancak yeni bilgiler geldikçe bu açıklamanın sınanması gerekir. Güçlü düşünme, fikrini hiç değiştirmemek değil, hangi koşulda değiştireceğini bilmektir. Bu parçanın ana düşüncesi hangisidir?",
        "options": [
          "İlk açıklamalar genellikle yanlıştır.",
          "Güçlü düşünme, görüşleri kanıt karşısında sınayabilmeyi içerir.",
          "Fikir değiştirmek kararsızlık göstergesidir.",
          "Düşünsel tutarlılık yeni kanıta kapalı olmayı gerektirir.",
          "Her yeni bilgi eski görüşü geçersiz kılar."
        ],
        "answer": 1,
        "explanation": "Parçada düşünsel gücün fikre körü körüne bağlı kalmak değil, yeni kanıt karşısında görüşü sınayabilmek olduğu savunulur.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t3-q09",
        "topicId": "k-tr-3",
        "text": "Dijital not uygulamalarının çok sayıda özelliği olabilir: etiketler, bağlantılar, hatırlatıcılar, otomatik sınıflandırmalar… Fakat kullanıcı sistemini yönetmek için çalışmaktan daha fazla zaman harcıyorsa araç amacından uzaklaşmış demektir. Bu parçadan aşağıdakilerden hangisine ulaşılabilir?",
        "options": [
          "Not uygulamaları kullanılmamalıdır.",
          "Çok özellikli uygulamalar daima verimsizdir.",
          "Etiket kullanmak gereksizdir.",
          "Araçların değeri, işi kolaylaştırma ölçüsünde değerlendirilmelidir.",
          "Dijital araçlar öğrenmeyi azaltır."
        ],
        "answer": 3,
        "explanation": "Parça, aracın kendisinin yönetilmesinin asıl işin önüne geçmemesi gerektiğini; aracın işe sağladığı katkının esas olduğunu belirtir.",
        "difficulty": "easy",
        "cognitive": "reasoning",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t3-q10",
        "topicId": "k-tr-3",
        "text": "Bir ürün hakkında yalnız memnun kullanıcıların yorumlarını toplamak, ürünün gerçek performansını olduğundan iyi gösterebilir. Çünkü ürünü bırakan veya sorun yaşayan kişilerin deneyimi görünmez kalır. ---- Boş bırakılan yere aşağıdakilerden hangisi getirilmelidir?",
        "options": [
          "Bu yüzden değerlendirmede kimlerin veriye dâhil edilmediği de önemlidir.",
          "Memnun kullanıcıların görüşleri tamamen değersizdir.",
          "Ürün incelemeleri yalnız uzmanlarca yapılmalıdır.",
          "Sorun yaşayan kullanıcılar her zaman çoğunluktadır.",
          "Yorum sayısının fazla olması tarafsızlık sağlar."
        ],
        "answer": 0,
        "explanation": "Parçanın mantığı örneklem yanlılığına dayanır; sonuç cümlesi değerlendirmeye katılmayan grupların da önem taşıdığını belirtmelidir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Paragraf tamamlama",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t3-q11",
        "topicId": "k-tr-3",
        "text": "Bir sanat eserini kendi döneminin koşullarından tamamen koparıp bugünün değerleriyle yargılamak, bazı anlam katmanlarını kaçırabilir. Öte yandan “o dönemde böyleydi” diyerek her şeyi açıklamak da eleştiriyi susturur. Sağlıklı değerlendirme, tarihsel bağlamı anlamakla bugünden soru sormayı birlikte gerektirir. Bu parçaya göre doğru yaklaşım hangisidir?",
        "options": [
          "Geçmiş eserleri yalnız kendi dönemine göre değerlendirmek",
          "Bugünün değerlerini geçmişe aynen uygulamak",
          "Eski eserleri eleştirmemek",
          "Tarihsel koşulları önemsiz saymak",
          "Tarihsel bağlam ile güncel eleştiriyi birlikte kullanmak"
        ],
        "answer": 4,
        "explanation": "Parça iki aşırı yaklaşımı da reddedip tarihsel bağlamı anlamakla bugünden eleştirel soru sormayı birlikte önerir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Dengeleyici çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t3-q12",
        "topicId": "k-tr-3",
        "text": "Bir ekipte kararların sürekli en kıdemli kişinin görüşüne göre alınması kısa vadede tartışmayı azaltabilir. Fakat diğer üyeler zamanla fikir üretmeyi bırakırsa ekip, farklı bakışlardan doğacak uyarıları kaybeder. Bu parçanın asıl vurgusu nedir?",
        "options": [
          "Kıdemli kişiler karar vermemelidir.",
          "Tartışmasız ekipler daha hızlı çalışır.",
          "Tek seslilik ekipte düşünsel çeşitliliği zayıflatabilir.",
          "Her karar oy birliğiyle alınmalıdır.",
          "Yeni çalışanlar daha yaratıcıdır."
        ],
        "answer": 2,
        "explanation": "Parçada tek bir otoritenin sürekli belirleyici olmasının ekip üyelerinin katkısını azaltabileceği ve farklı bakışları kaybettirebileceği anlatılır.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      }
    ],
    "version": 2,
    "qualityStatus": "approved",
    "sourceKind": "original",
    "copyrightPolicy": "original-only",
    "sourceBasis": [
      "official-scope-2026",
      "multi-year-trend",
      "official-question-style-review"
    ]
  },
  {
    "id": "kpss:k-tr:k-tr-3:t04",
    "exam": "kpss",
    "subjectId": "k-tr",
    "topicId": "k-tr-3",
    "topicTitle": "Paragrafta anlam",
    "setNo": 4,
    "title": "KPSS Türkçe · Paragrafta Anlam · Test 4",
    "eyebrow": "PROFESYONEL KONU TESTİ · KPSS",
    "minutes": 20,
    "level": "Sınav provası",
    "questions": [
      {
        "id": "ktr3-t4-q01",
        "topicId": "k-tr-3",
        "text": "Bir kurumda ölçülen her şey önem taşımaz; önemli olan her şey de kolayca ölçülemez. Sayısal göstergeler karar vermeyi kolaylaştırır ancak yalnız ölçülebilir olanı hedef hâline getirmek, gerçek amacı gölgeleyebilir. Örneğin bir çağrı merkezinde görüşme süresini kısaltmak verimlilik göstergesi sayılırken, müşterinin sorununu gerçekten çözüp çözmediği ikinci plana düşebilir. Bu parçanın ana düşüncesi hangisidir?",
        "options": [
          "Ölçütler, asıl amaçla ilişkisi koparsa yanıltıcı hâle gelebilir.",
          "Kurumlarda sayısal veri kullanılmamalıdır.",
          "Çağrı merkezlerinde görüşmeler uzun sürmelidir.",
          "Ölçülemeyen hiçbir şey yönetilemez.",
          "Verimlilik yalnız hızla ölçülmelidir."
        ],
        "answer": 0,
        "explanation": "Parça, ölçülebilir göstergelerin amaç yerine geçmesi durumunda yanlış teşvikler yaratabileceğini ve değerlendirmeyi bozabileceğini anlatır.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t4-q02",
        "topicId": "k-tr-3",
        "text": "Bir araştırmacı, görüşünü destekleyen örnekleri kolayca fark ederken ona ters düşen bulguları “istisna” sayabilir. Bu eğilim, kişinin kötü niyetli olmasını gerektirmez; zihin mevcut inançlarla uyumlu bilgiyi işlemeye daha yatkın olabilir. Bu nedenle iyi araştırma, yalnız veri toplamak değil kendi beklentisini sınayacak düzenekler kurmaktır. Bu parçadan aşağıdakilerden hangisine ulaşılabilir?",
        "options": [
          "Araştırmacılar tarafsız olamaz.",
          "İstisnalar bilimde dikkate alınmamalıdır.",
          "Beklentiler araştırmada tamamen ortadan kaldırılabilir.",
          "Kendi görüşünü sınayacak yöntemler önyargı riskini azaltabilir.",
          "Yalnız ters bulgular güvenilirdir."
        ],
        "answer": 3,
        "explanation": "Parça, zihinsel yanlılığın farkında olup kişisel beklentiyi sınayacak yöntemler kurmanın araştırma kalitesini artırabileceğini savunur.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t4-q03",
        "topicId": "k-tr-3",
        "text": "Bir metnin zor olması, onun derin olduğunun kanıtı değildir. Kimi zaman gereksiz terimler ve uzun cümleler basit bir düşünceyi olduğundan karmaşık gösterir. Öte yandan karmaşık bir düşünceyi sade biçimde anlatmak, düşüncenin basitleştirildiği anlamına da gelmez. Bu parçanın ana düşüncesi hangisidir?",
        "options": [
          "Zor metinler okunmamalıdır.",
          "Karmaşık düşünceler sade anlatılamaz.",
          "Derinlik ile anlatım güçlüğü aynı şey değildir.",
          "Terim kullanmak her zaman gereksizdir.",
          "Basit cümleler derin düşünce taşımaz."
        ],
        "answer": 2,
        "explanation": "Parça, düşünsel derinlik ile dilin zorlaştırılması arasında zorunlu bir ilişki olmadığını vurgulamaktadır.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t4-q04",
        "topicId": "k-tr-3",
        "text": "Bir algoritmanın geçmiş verilerde başarılı olması, gelecekte de aynı başarıyı göstereceğini garanti etmez. Toplumun davranışı, ekonomik koşullar veya veri toplama biçimi değiştiğinde modelin öğrendiği ilişkiler zayıflayabilir. Bu nedenle modellerin yalnız kurulurken değil, kullanım süresince de izlenmesi gerekir. Bu parçanın vurguladığı düşünce hangisidir?",
        "options": [
          "Geçmiş veriler geleceği hiçbir zaman açıklamaz.",
          "Algoritmalar insan kararlarından daha zayıftır.",
          "Veri toplama biçimi modelleri etkilemez.",
          "Başarılı bir algoritma değiştirilmemelidir.",
          "Model başarısı zaman içinde yeniden değerlendirilmelidir."
        ],
        "answer": 4,
        "explanation": "Parça, koşullar değiştikçe geçmişte başarılı modellerin performansının bozulabileceğini ve bu yüzden sürekli izleme gerektiğini anlatır.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t4-q05",
        "topicId": "k-tr-3",
        "text": "Bir şehrin meydanında bankların yönü, gölge alanların dağılımı ve yaya yollarının kesişimi insanların nerede duracağını etkiler. Tasarım, insan davranışını zorla belirlemez; fakat bazı davranışları kolaylaştırıp bazılarını zorlaştırabilir. Bu parçadan aşağıdakilerden hangisine ulaşılabilir?",
        "options": [
          "İnsan davranışı bütünüyle mimariyle belirlenir.",
          "Mekânsal düzen insanların kullanım tercihlerini etkileyebilir.",
          "Kent meydanlarında yalnız bank sayısı önemlidir.",
          "Gölgelik alanlar sosyal etkileşimi azaltır.",
          "Yaya yolları davranış üzerinde etkisizdir."
        ],
        "answer": 1,
        "explanation": "Parçada tasarımın davranışı kesin biçimde belirlemediği ama kullanım olasılıklarını etkileyebildiği açıklanmaktadır.",
        "difficulty": "easy",
        "cognitive": "reasoning",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t4-q06",
        "topicId": "k-tr-3",
        "text": "Bir bilimsel tartışmada iki tarafın farklı sonuçlara ulaşması, taraflardan birinin mutlaka veriyi yanlış kullandığını göstermez. Aynı veriye farklı varsayımlarla yaklaşmak, farklı sorular sormak veya farklı belirsizlik düzeylerini kabul etmek sonuçları değiştirebilir. Bu parçaya göre aşağıdakilerden hangisi söylenebilir?",
        "options": [
          "Bilimsel yorumda yöntem ve varsayımlar sonucu etkileyebilir.",
          "Farklı sonuçlar her zaman hatadan kaynaklanır.",
          "Aynı veri yalnız tek biçimde yorumlanabilir.",
          "Belirsizlik bilimsel çalışmalarda olmamalıdır.",
          "Farklı soru sormak bilimsel değildir."
        ],
        "answer": 0,
        "explanation": "Parça, aynı verinin yöntemsel varsayımlar ve sorulan sorular değiştiğinde farklı sonuçlara götürebileceğini ifade etmektedir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t4-q07",
        "topicId": "k-tr-3",
        "text": "Bir kurum, çalışanlarına “yenilikçi olun” diyebilir; ancak her başarısız denemeyi cezalandırıyorsa bu mesaj inandırıcılığını kaybeder. Çünkü yenilik, belirli ölçüde belirsizlik ve sonuç alamama riskini içerir. Söylem ile ödül-ceza sistemi çeliştiğinde insanlar genellikle gerçek teşvike göre davranır. Bu parçanın ana düşüncesi hangisidir?",
        "options": [
          "Yenilik yalnız ödülle ortaya çıkar.",
          "Çalışanlar yöneticilerin sözlerini dikkate almaz.",
          "Başarısız denemeler hiçbir zaman değerlendirilmemelidir.",
          "Kurumsal teşvikler söylenen hedeflerle uyumlu olmalıdır.",
          "Belirsizlik her kurum için zararlıdır."
        ],
        "answer": 3,
        "explanation": "Parçada çalışan davranışını yalnız sloganların değil gerçek ödül-ceza düzeninin etkilediği, bu nedenle teşviklerle hedeflerin uyumlu olması gerektiği savunulur.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t4-q08",
        "topicId": "k-tr-3",
        "text": "Bir kişinin çok sayıda kitap satın alması, düzenli okuma alışkanlığı olduğunu göstermez. Benzer biçimde çok sayıda kursa kayıt olmak da öğrenmenin gerçekleştiğine kanıt değildir. ---- Boş bırakılan yere aşağıdakilerden hangisi getirilmelidir?",
        "options": [
          "Kitap satın almak gereksiz bir harcamadır.",
          "Kursların çoğu yeterince kaliteli değildir.",
          "Niyet ve sahiplik ile fiilî davranış birbirinden ayrılmalıdır.",
          "Öğrenme yalnız okulda gerçekleşir.",
          "Okuma alışkanlığı yaşla birlikte azalır."
        ],
        "answer": 2,
        "explanation": "Örneklerin ortak noktası, sahip olma veya kayıt olma ile gerçek davranışın karıştırılmamasıdır; uygun sonuç cümlesi bu ayrımı belirtir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Paragraf tamamlama",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t4-q09",
        "topicId": "k-tr-3",
        "text": "Bazı kararlar geri döndürülebilir, bazılarıysa yüksek maliyetle geri alınabilir. Bu iki tür kararı aynı hız ve ayrıntıyla değerlendirmek verimsizdir. Kolayca düzeltilebilecek kararlar için uzun onay süreçleri kurmak hareketi yavaşlatırken, geri dönüşü zor kararları aceleye getirmek ciddi risk yaratabilir. Bu parçadan hangisi çıkarılabilir?",
        "options": [
          "Bütün kararlar aynı sürede verilmelidir.",
          "Hızlı kararlar her zaman daha doğrudur.",
          "Onay süreçleri tamamen kaldırılmalıdır.",
          "Geri alınması zor kararlar hiç verilmemelidir.",
          "Karar verme süreci kararın geri döndürülebilirliğine göre ayarlanabilir."
        ],
        "answer": 4,
        "explanation": "Parça, kararın niteliğine göre değerlendirme derinliği ve hızının farklılaştırılması gerektiğini savunmaktadır.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t4-q10",
        "topicId": "k-tr-3",
        "text": "Bir ürünün kullanıcıları arasında yalnız ürünü uzun süredir kullanmaya devam edenleri incelemek, ilk aylarda ürünü bırakmış kişilerin deneyimini dışarıda bırakır. Böyle bir örneklem, memnuniyet düzeyini gerçekte olduğundan yüksek gösterebilir. Bu parçada sözü edilen temel sorun aşağıdakilerden hangisidir?",
        "options": [
          "Ölçüm hatası",
          "Örneklem yanlılığı",
          "Neden-sonuç ilişkisi",
          "Zaman yönetimi",
          "Maliyet analizi"
        ],
        "answer": 1,
        "explanation": "Yalnız üründe kalan kullanıcıların incelenmesi, ürünü bırakanları dışlayarak temsil gücü bozuk bir örneklem oluşturur; bu örneklem yanlılığıdır.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Kavram çıkarımı",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t4-q11",
        "topicId": "k-tr-3",
        "text": "Bir yazarın metnindeki belirsizlik, her zaman düşüncenin zayıflığından kaynaklanmaz. Bazen yazar, tek bir yorumu dayatmak yerine okurun farklı anlam bağlantıları kurmasına alan bırakır. Ancak belirsizlik metnin temel ilişkilerini görünmez hâle getiriyorsa bu kez iletişimi zayıflatır. Bu parçaya göre belirsizlik için hangisi söylenebilir?",
        "options": [
          "İşlevi ve düzeyi değerlendirilmeden olumlu ya da olumsuz sayılamaz.",
          "Her durumda olumsuzdur.",
          "Yalnız şiirde kullanılabilir.",
          "Metnin kalitesini otomatik olarak artırır.",
          "Okurun yorumunu tamamen engeller."
        ],
        "answer": 0,
        "explanation": "Parça, belirsizliğin kimi zaman yorum alanı açabileceğini, kimi zaman da iletişimi bozabileceğini söyleyerek işlevine göre değerlendirilmesi gerektiğini savunur.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Dengeleyici çıkarım",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr3-t4-q12",
        "topicId": "k-tr-3",
        "text": "Bir hedefe ulaşmak için kullanılan ölçüt zamanla hedefin kendisine dönüşebilir. Öğrencinin öğrenmesini izlemek için kullanılan sınav puanı, tek amaç hâline geldiğinde öğrenme davranışı yalnız puanı yükseltecek etkinliklere daralabilir. Bu durumda ölçüt, ölçmeye çalıştığı şeyi değiştirmeye başlar. Bu parçanın ana düşüncesi hangisidir?",
        "options": [
          "Sınavlar tamamen kaldırılmalıdır.",
          "Puan yükseltmek öğrenmeyle her zaman aynıdır.",
          "Öğrenme ölçülemez bir süreçtir.",
          "Ölçütler amaç hâline geldiğinde davranışı bozabilir.",
          "Öğrenciler yalnız sınav için çalışır."
        ],
        "answer": 3,
        "explanation": "Parça, bir gösterge hedefe dönüştüğünde insanların davranışını o göstergeyi optimize edecek biçimde değiştirebileceğini ve asıl amacı bozabileceğini anlatır.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Ana düşünce",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      }
    ],
    "version": 2,
    "qualityStatus": "approved",
    "sourceKind": "original",
    "copyrightPolicy": "original-only",
    "sourceBasis": [
      "official-scope-2026",
      "multi-year-trend",
      "official-question-style-review"
    ]
  }
];
root.RotaKpssProfessionalTurkish03={tests};
if(typeof module==='object')module.exports=root.RotaKpssProfessionalTurkish03;
})(typeof window!=='undefined'?window:globalThis);
