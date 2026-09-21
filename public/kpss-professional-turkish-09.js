(function(root){
'use strict';
const SCHEMA='calisma-rotasi-kpss-professional-turkish-09-v1';
const tests=[
  {
    "id": "kpss:k-tr:k-tr-9:t01",
    "exam": "kpss",
    "subjectId": "k-tr",
    "topicId": "k-tr-9",
    "topicTitle": "Cümlenin ögeleri",
    "setNo": 1,
    "title": "KPSS Türkçe · Cümlenin Ögeleri · Test 1",
    "eyebrow": "PROFESYONEL KONU TESTİ · KPSS",
    "minutes": 16,
    "level": "Temel kazanım + bağlam",
    "questions": [
      {
        "id": "ktr9-t1-q01",
        "topicId": "k-tr-9",
        "text": "“Araştırmacılar geçen hafta arşivde yeni belgeler buldu.” cümlesinin öznesi hangisidir?",
        "options": [
          "geçen hafta",
          "Araştırmacılar",
          "arşivde",
          "yeni belgeler",
          "buldu"
        ],
        "answer": 1,
        "explanation": "“Buldu” yükleminin bildirdiği işi yapan “Araştırmacılar”dır; bu nedenle özne bu ögedir.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Özne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t1-q02",
        "topicId": "k-tr-9",
        "text": "“Editör, yazının son bölümünü dikkatle yeniden düzenledi.” cümlesinde belirtili nesne hangisidir?",
        "options": [
          "Editör",
          "dikkatle",
          "yeniden",
          "yazının son bölümünü",
          "düzenledi"
        ],
        "answer": 3,
        "explanation": "“Neyi düzenledi?” sorusunun cevabı “yazının son bölümünü”dür. Belirtme hâl eki aldığı için belirtili nesnedir.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Belirtili nesne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t1-q03",
        "topicId": "k-tr-9",
        "text": "“Öğrenciler öğleden sonra kütüphaneye gittiler.” cümlesinde dolaylı tümleç hangisidir?",
        "options": [
          "kütüphaneye",
          "öğleden sonra",
          "Öğrenciler",
          "gittiler",
          "öğrenciler öğleden sonra"
        ],
        "answer": 0,
        "explanation": "Yönelme hâl eki alan ve “nereye gittiler?” sorusunu karşılayan “kütüphaneye” dolaylı tümleçtir.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Dolaylı tümleç",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t1-q04",
        "topicId": "k-tr-9",
        "text": "“Yazar, sorulara oldukça sakin cevap verdi.” cümlesinde zarf tümleci hangisidir?",
        "options": [
          "Yazar",
          "sorulara",
          "cevap",
          "verdi",
          "oldukça sakin"
        ],
        "answer": 4,
        "explanation": "“Nasıl cevap verdi?” sorusuna “oldukça sakin” karşılık verir; bu söz grubu zarf tümlecidir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Zarf tümleci",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t1-q05",
        "topicId": "k-tr-9",
        "text": "“Bu küçük kasaba, yıllar içinde önemli bir turizm merkezine dönüştü.” cümlesinin yüklemi hangisidir?",
        "options": [
          "Bu küçük kasaba",
          "yıllar içinde",
          "dönüştü",
          "önemli bir turizm merkezine",
          "turizm merkezine dönüştü"
        ],
        "answer": 2,
        "explanation": "Çekimli fiil olan “dönüştü” cümlenin yargısını taşıyan yüklemdir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Yüklem",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t1-q06",
        "topicId": "k-tr-9",
        "text": "“Sabah erkenden pencereleri açtık.” cümlesinde gizli özne aşağıdakilerden hangisidir?",
        "options": [
          "siz",
          "biz",
          "onlar",
          "sen",
          "o"
        ],
        "answer": 1,
        "explanation": "Yüklem “açtık” birinci çoğul kişi eki taşır; cümlenin gizli öznesi “biz”dir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Gizli özne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t1-q07",
        "topicId": "k-tr-9",
        "text": "“Komisyon yeni öneriyi oy birliğiyle kabul etti.” cümlesinde “oy birliğiyle” hangi ögedir?",
        "options": [
          "Özne",
          "Nesne",
          "Dolaylı tümleç",
          "Zarf tümleci",
          "Yüklem"
        ],
        "answer": 3,
        "explanation": "“Nasıl kabul etti?” sorusuna cevap veren “oy birliğiyle” zarf tümlecidir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Zarf tümleci",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t1-q08",
        "topicId": "k-tr-9",
        "text": "“Müdür, toplantıdan sonra çalışanlara yeni kararı açıkladı.” cümlesinde “çalışanlara” hangi ögedir?",
        "options": [
          "Dolaylı tümleç",
          "Özne",
          "Belirtili nesne",
          "Zarf tümleci",
          "Yüklem"
        ],
        "answer": 0,
        "explanation": "“Kime açıkladı?” sorusunun cevabı “çalışanlara”dır; yönelme hâl eki aldığı için dolaylı tümleçtir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Dolaylı tümleç",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t1-q09",
        "topicId": "k-tr-9",
        "text": "“Çocuklar bahçede rengârenk uçurtmalar uçuruyordu.” cümlesinde nesne hangisidir?",
        "options": [
          "Çocuklar",
          "bahçede",
          "rengârenk",
          "uçuruyordu",
          "rengârenk uçurtmalar"
        ],
        "answer": 4,
        "explanation": "“Neyi uçuruyordu?” sorusuna “rengârenk uçurtmalar” cevap verir. Belirtme eki almadığı için belirtisiz nesnedir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Belirtisiz nesne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t1-q10",
        "topicId": "k-tr-9",
        "text": "“Bu sabah hava beklediğimizden daha serindi.” cümlesinin öznesi hangisidir?",
        "options": [
          "Bu sabah",
          "beklediğimizden",
          "hava",
          "daha",
          "serindi"
        ],
        "answer": 2,
        "explanation": "“Serindi” yükleminin bildirdiği durumda bulunan varlık “hava”dır; özne “hava”dır.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Özne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t1-q11",
        "topicId": "k-tr-9",
        "text": "“Uzun süren görüşmeler sonunda taraflar bir uzlaşmaya vardı.” cümlesinde “uzun süren görüşmeler sonunda” hangi ögedir?",
        "options": [
          "Özne",
          "Zarf tümleci",
          "Dolaylı tümleç",
          "Yüklem",
          "Belirtisiz nesne"
        ],
        "answer": 1,
        "explanation": "Söz grubu “ne zaman/hangi şartın sonunda vardı?” anlamı verir ve yüklemi zaman-durum bakımından tamamlar; zarf tümlecidir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Öge sınırı",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t1-q12",
        "topicId": "k-tr-9",
        "text": "“Bize bu haberi dün akşam komşumuz verdi.” cümlesinde ögelerin doğru sıralanışı hangisidir?",
        "options": [
          "Zarf tümleci – dolaylı tümleç – özne – nesne – yüklem",
          "Özne – dolaylı tümleç – zarf tümleci – nesne – yüklem",
          "Dolaylı tümleç – özne – belirtili nesne – zarf tümleci – yüklem",
          "Dolaylı tümleç – belirtili nesne – zarf tümleci – özne – yüklem",
          "Belirtili nesne – dolaylı tümleç – zarf tümleci – özne – yüklem"
        ],
        "answer": 3,
        "explanation": "“Bize” dolaylı tümleç, “bu haberi” belirtili nesne, “dün akşam” zarf tümleci, “komşumuz” özne, “verdi” yüklemdir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Öge sıralama",
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
    "id": "kpss:k-tr:k-tr-9:t02",
    "exam": "kpss",
    "subjectId": "k-tr",
    "topicId": "k-tr-9",
    "topicTitle": "Cümlenin ögeleri",
    "setNo": 2,
    "title": "KPSS Türkçe · Cümlenin Ögeleri · Test 2",
    "eyebrow": "PROFESYONEL KONU TESTİ · KPSS",
    "minutes": 16,
    "level": "Bağlam ve ayırt etme",
    "questions": [
      {
        "id": "ktr9-t2-q01",
        "topicId": "k-tr-9",
        "text": "“Toplantının sonunda hazırlanan rapor yönetime sunuldu.” cümlesinde sözde özne hangisidir?",
        "options": [
          "Toplantının sonunda",
          "hazırlanan",
          "rapor",
          "yönetime",
          "sunuldu"
        ],
        "answer": 2,
        "explanation": "Edilgen “sunuldu” yükleminde işi yapan belirtilmemiştir; eylemden etkilenen “rapor” sözde özne görevindedir.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Sözde özne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t2-q02",
        "topicId": "k-tr-9",
        "text": "“Yeni düzenlemeyle çalışanlara bazı ek haklar tanındı.” cümlesinde “çalışanlara” hangi ögedir?",
        "options": [
          "Dolaylı tümleç",
          "Belirtisiz nesne",
          "Zarf tümleci",
          "Özne",
          "Yüklem"
        ],
        "answer": 0,
        "explanation": "“Kime tanındı?” sorusuna cevap veren “çalışanlara” yönelme hâliyle kurulmuş dolaylı tümleçtir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Dolaylı tümleç",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t2-q03",
        "topicId": "k-tr-9",
        "text": "“Kentin eski sokaklarını akşamüstü uzun uzun gezdik.” cümlesinde belirtili nesne hangisidir?",
        "options": [
          "biz",
          "akşamüstü",
          "uzun uzun",
          "gezdiğimiz yer",
          "Kentin eski sokaklarını"
        ],
        "answer": 4,
        "explanation": "“Neyi gezdik?” sorusuna “kentin eski sokaklarını” cevap verir; -ı belirtme hâl ekiyle belirtili nesnedir.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Belirtili nesne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t2-q04",
        "topicId": "k-tr-9",
        "text": "“Bu konuyu arkadaşlarımla ayrıntılı biçimde tartıştım.” cümlesinde “arkadaşlarımla” hangi ögedir?",
        "options": [
          "Özne",
          "Zarf tümleci",
          "Belirtili nesne",
          "Dolaylı tümleç",
          "Yüklem"
        ],
        "answer": 1,
        "explanation": "“Arkadaşlarımla” birliktelik bildirir ve yüklemi durum/birliktelik bakımından tamamladığı için bu sınıflamada zarf tümleci olarak değerlendirilir.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Birliktelik bildiren tümleç",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t2-q05",
        "topicId": "k-tr-9",
        "text": "“Yolcular, yağmur dinince istasyondan ayrıldı.” cümlesinde “yağmur dinince” hangi ögedir?",
        "options": [
          "Özne",
          "Dolaylı tümleç",
          "Belirtisiz nesne",
          "Zarf tümleci",
          "Yüklem"
        ],
        "answer": 3,
        "explanation": "Zarf-fiil grubu “ne zaman ayrıldı?” sorusunu karşılayarak zaman anlamlı zarf tümleci olur.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Zarf-fiil grubu",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t2-q06",
        "topicId": "k-tr-9",
        "text": "“Bahçedeki yaşlı çınar geçen kış devrildi.” cümlesinde “geçen kış” hangi ögedir?",
        "options": [
          "Dolaylı tümleç",
          "Özne",
          "Zarf tümleci",
          "Nesne",
          "Yüklem"
        ],
        "answer": 2,
        "explanation": "“Ne zaman devrildi?” sorusunun cevabı “geçen kış”tır; zaman bildiren zarf tümlecidir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Zaman zarf tümleci",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t2-q07",
        "topicId": "k-tr-9",
        "text": "“Yeni proje hakkında bize hiçbir açıklama yapılmadı.” cümlesinde sözde özne hangisidir?",
        "options": [
          "hiçbir açıklama",
          "bize",
          "Yeni proje hakkında",
          "yapılmadı",
          "açıklama yapılmadı"
        ],
        "answer": 0,
        "explanation": "Edilgen yüklemde eylemin etkilediği “hiçbir açıklama” sözde özne olarak değerlendirilir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Sözde özne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t2-q08",
        "topicId": "k-tr-9",
        "text": "“Bu şiiri yıllar önce bir dergide okumuştum.” cümlesinde “bir dergide” hangi ögedir?",
        "options": [
          "Yüklem",
          "Belirtili nesne",
          "Özne",
          "Zarf tümleci",
          "Dolaylı tümleç"
        ],
        "answer": 4,
        "explanation": "“Nerede okumuştum?” sorusuna cevap veren ve bulunma hâl eki taşıyan “bir dergide” dolaylı tümleçtir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Yer tamlayıcısı",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t2-q09",
        "topicId": "k-tr-9",
        "text": "“Masanın üzerindeki dosyaları sessizce topladı.” cümlesinin gizli öznesi hangisidir?",
        "options": [
          "biz",
          "o",
          "sen",
          "onlar",
          "siz"
        ],
        "answer": 1,
        "explanation": "“Topladı” üçüncü tekil kişi yüklemidir ve açık özne yoktur; gizli özne “o”dur.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Gizli özne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t2-q10",
        "topicId": "k-tr-9",
        "text": "“Kalabalığın arasından güçlükle ilerledik.” cümlesinde “güçlükle” hangi ögedir?",
        "options": [
          "Özne",
          "Dolaylı tümleç",
          "Belirtisiz nesne",
          "Zarf tümleci",
          "Yüklem"
        ],
        "answer": 3,
        "explanation": "“Nasıl ilerledik?” sorusuna “güçlükle” cevap verir; bu nedenle zarf tümlecidir.",
        "difficulty": "hard",
        "cognitive": "application",
        "skill": "Durum zarfı",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t2-q11",
        "topicId": "k-tr-9",
        "text": "“Ders başlamadan önce telefonlarımızı dolaba bıraktık.” cümlesinde “dolaba” hangi ögedir?",
        "options": [
          "Özne",
          "Belirtili nesne",
          "Dolaylı tümleç",
          "Zarf tümleci",
          "Yüklem"
        ],
        "answer": 2,
        "explanation": "“Nereye bıraktık?” sorusunun cevabı yönelme hâlli “dolaba”dır; dolaylı tümleçtir.",
        "difficulty": "hard",
        "cognitive": "application",
        "skill": "Dolaylı tümleç",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t2-q12",
        "topicId": "k-tr-9",
        "text": "Aşağıdaki cümlelerin hangisinde hem belirtili nesne hem dolaylı tümleç vardır?",
        "options": [
          "Yeni kitabı arkadaşına dün verdi.",
          "Çocuklar parkta uzun süre oynadı.",
          "Akşam erkenden eve döndük.",
          "Bu sabah hava aniden soğudu.",
          "Komşumuz bize uğradı."
        ],
        "answer": 0,
        "explanation": "“Yeni kitabı” belirtili nesne, “arkadaşına” dolaylı tümleçtir. Aynı cümlede iki öge birlikte bulunur.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Birden çok öge",
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
    "id": "kpss:k-tr:k-tr-9:t03",
    "exam": "kpss",
    "subjectId": "k-tr",
    "topicId": "k-tr-9",
    "topicTitle": "Cümlenin ögeleri",
    "setNo": 3,
    "title": "KPSS Türkçe · Cümlenin Ögeleri · Test 3",
    "eyebrow": "PROFESYONEL KONU TESTİ · KPSS",
    "minutes": 16,
    "level": "Karma ve güçlü çeldirici",
    "questions": [
      {
        "id": "ktr9-t3-q01",
        "topicId": "k-tr-9",
        "text": "“Soruların bir bölümünü sınavdan sonra öğretmenimizle birlikte değerlendirdik.” cümlesinde “öğretmenimizle birlikte” hangi ögedir?",
        "options": [
          "Dolaylı tümleç",
          "Yüklem",
          "Özne",
          "Belirtili nesne",
          "Zarf tümleci"
        ],
        "answer": 4,
        "explanation": "Birliktelik bildiren söz grubu eylemin hangi eşlik koşulunda yapıldığını belirtir ve zarf tümleci görevindedir.",
        "difficulty": "easy",
        "cognitive": "interpretation",
        "skill": "Birliktelik zarfı",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t3-q02",
        "topicId": "k-tr-9",
        "text": "“Köprünün onarımı geçen ay tamamlandı.” cümlesinde özne hangisidir?",
        "options": [
          "geçen ay",
          "tamamlandı",
          "Köprünün onarımı",
          "köprünün",
          "onarımı"
        ],
        "answer": 2,
        "explanation": "Edilgen görünüşlü “tamamlandı” yükleminde “köprünün onarımı” cümlenin sözde öznesidir; soru özne türünü değil ögeyi sorar.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Sözde özne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t3-q03",
        "topicId": "k-tr-9",
        "text": "“Beni en çok onun sakin tavrı etkiledi.” cümlesinde özne hangisidir?",
        "options": [
          "Beni",
          "onun sakin tavrı",
          "en çok",
          "etkiledi",
          "sakin"
        ],
        "answer": 1,
        "explanation": "“Etkileyen ne?” sorusuna “onun sakin tavrı” cevap verir; bu söz grubu gerçek öznedir.",
        "difficulty": "easy",
        "cognitive": "reasoning",
        "skill": "Özne-nesne ayrımı",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t3-q04",
        "topicId": "k-tr-9",
        "text": "“Bu kararın sonuçlarını önümüzdeki hafta ayrıntılı biçimde konuşacağız.” cümlesinde zarf tümleçleri hangileridir?",
        "options": [
          "Bu kararın sonuçlarını – önümüzdeki hafta",
          "Bu kararın – sonuçlarını",
          "ayrıntılı biçimde – konuşacağız",
          "önümüzdeki hafta – ayrıntılı biçimde",
          "sonuçlarını – konuşacağız"
        ],
        "answer": 3,
        "explanation": "“Önümüzdeki hafta” zaman, “ayrıntılı biçimde” durum bildirir; ikisi de yüklemi zarf anlamıyla tamamlar.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Birden çok zarf tümleci",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t3-q05",
        "topicId": "k-tr-9",
        "text": "“Pencerenin önünde sessizce bekleyen çocuk annesini görünce gülümsedi.” cümlesinde özne hangisidir?",
        "options": [
          "bekleyen çocuk",
          "sessizce",
          "Pencerenin önünde",
          "annesini",
          "gülümseyen çocuk"
        ],
        "answer": 0,
        "explanation": "“Gülümsedi” yükleminin öznesi, sıfat-fiil grubu içeren “pencerenin önünde sessizce bekleyen çocuk” bütünüdür; çekirdek öge “bekleyen çocuk”tur.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Öge grubu",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t3-q06",
        "topicId": "k-tr-9",
        "text": "“Uzmanlar bu yöntemi uzun süredir güvenli buluyor.” cümlesinde “bu yöntemi” hangi ögedir?",
        "options": [
          "Özne",
          "Yüklem",
          "Dolaylı tümleç",
          "Zarf tümleci",
          "Belirtili nesne"
        ],
        "answer": 4,
        "explanation": "“Neyi güvenli buluyor?” sorusunun cevabı “bu yöntemi”dir. Belirtme hâl eki aldığı için belirtili nesnedir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Belirtili nesne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t3-q07",
        "topicId": "k-tr-9",
        "text": "“Çalışmanın ilk sonuçları dün kamuoyuyla paylaşıldı.” cümlesinde “kamuoyuyla” hangi ögedir?",
        "options": [
          "Dolaylı tümleç",
          "Özne",
          "Zarf tümleci",
          "Nesne",
          "Yüklem"
        ],
        "answer": 2,
        "explanation": "“-la/-le” eki burada birliktelik/araç ilişkisi kurarak eylemin gerçekleşme biçimini belirtir; zarf tümleci kabul edilir.",
        "difficulty": "medium",
        "cognitive": "interpretation",
        "skill": "Araç-birliktelik tümleci",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t3-q08",
        "topicId": "k-tr-9",
        "text": "“Birkaç öğrenci soruların tamamını süresinden önce bitirdi.” cümlesinde belirtili nesne hangisidir?",
        "options": [
          "Birkaç öğrenci",
          "soruların tamamını",
          "süresinden önce",
          "bitirdi",
          "tamamını süresinden önce"
        ],
        "answer": 1,
        "explanation": "“Neyi bitirdi?” sorusuna “soruların tamamını” cevap verir ve belirtme hâl eki taşır.",
        "difficulty": "hard",
        "cognitive": "application",
        "skill": "Belirtili nesne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t3-q09",
        "topicId": "k-tr-9",
        "text": "“Bu yaz kentte çok sayıda kültür etkinliği düzenlenecek.” cümlesinde sözde özne hangisidir?",
        "options": [
          "Bu yaz",
          "kentte",
          "düzenlenecek",
          "çok sayıda kültür etkinliği",
          "kültür"
        ],
        "answer": 3,
        "explanation": "Edilgen “düzenlenecek” yükleminde eylemden etkilenen “çok sayıda kültür etkinliği” sözde öznedir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Sözde özne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t3-q10",
        "topicId": "k-tr-9",
        "text": "“Sana dün gönderdiğim dosyayı yeniden incele.” cümlesinde gizli özne hangisidir?",
        "options": [
          "sen",
          "ben",
          "o",
          "biz",
          "siz"
        ],
        "answer": 0,
        "explanation": "Emir kipindeki “incele” ikinci tekil kişiye yöneliktir; gizli özne “sen”dir.",
        "difficulty": "hard",
        "cognitive": "application",
        "skill": "Gizli özne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t3-q11",
        "topicId": "k-tr-9",
        "text": "Aşağıdaki cümlelerin hangisinde dolaylı tümleç yoktur?",
        "options": [
          "Toplantıdan sonra eve yürüdük.",
          "Dosyayı masanın üstüne bıraktı.",
          "Kardeşim okuldan erken döndü.",
          "Soruyu öğretmenine sordu.",
          "Yeni kitabı geçen hafta bitirdim."
        ],
        "answer": 4,
        "explanation": "“Yeni kitabı” nesne, “geçen hafta” zarf tümlecidir; cümlede yönelme/bulunma/ayrılma anlamlı bir dolaylı tümleç yoktur.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Dolaylı tümleç ayırt etme",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t3-q12",
        "topicId": "k-tr-9",
        "text": "“Yarın sabah erkenden yola çıkacak ekip, geceyi burada geçirecek.” cümlesinde “yarın sabah erkenden” hangi yapının içinde yer alır?",
        "options": [
          "Ana cümlenin öznesi",
          "Ana cümlenin nesnesi",
          "Sıfat-fiil grubunun zarf tümleci",
          "Ana cümlenin dolaylı tümleci",
          "Ana cümlenin yüklemi"
        ],
        "answer": 2,
        "explanation": "“Yarın sabah erkenden” ifadesi “çıkacak” sıfat-fiilinin zamanını belirtir; ana yüklem “geçirecek”e değil sıfat-fiil grubuna bağlıdır.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Yan cümlecik içinde öge",
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
    "id": "kpss:k-tr:k-tr-9:t04",
    "exam": "kpss",
    "subjectId": "k-tr",
    "topicId": "k-tr-9",
    "topicTitle": "Cümlenin ögeleri",
    "setNo": 4,
    "title": "KPSS Türkçe · Cümlenin Ögeleri · Test 4",
    "eyebrow": "PROFESYONEL KONU TESTİ · KPSS",
    "minutes": 16,
    "level": "Sınav provası",
    "questions": [
      {
        "id": "ktr9-t4-q01",
        "topicId": "k-tr-9",
        "text": "“Kentin kıyısındaki eski depolar son yıllarda sanat galerilerine dönüştürüldü.” cümlesinde sözde özne hangisidir?",
        "options": [
          "Kentin kıyısındaki eski depolar",
          "son yıllarda",
          "sanat galerilerine",
          "dönüştürüldü",
          "eski depolar son yıllarda"
        ],
        "answer": 0,
        "explanation": "Edilgen yüklemde dönüşüme uğrayan “kentin kıyısındaki eski depolar” sözde özne görevindedir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Sözde özne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t4-q02",
        "topicId": "k-tr-9",
        "text": "“Bu kadar kısa sürede bütün ayrıntıları hatırlamak bana oldukça zor geliyor.” cümlesinde “bana” hangi ögedir?",
        "options": [
          "Özne",
          "Belirtili nesne",
          "Zarf tümleci",
          "Dolaylı tümleç",
          "Yüklem"
        ],
        "answer": 3,
        "explanation": "“Kime zor geliyor?” sorusuna cevap veren “bana” yönelme hâl ekiyle kurulmuş dolaylı tümleçtir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Dolaylı tümleç",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t4-q03",
        "topicId": "k-tr-9",
        "text": "“Toplantıya katılan uzmanların çoğu öneriyi destekledi.” cümlesinde nesne hangisidir?",
        "options": [
          "katılan uzmanların çoğu",
          "Toplantıya",
          "öneriyi",
          "destekledi",
          "uzmanların"
        ],
        "answer": 2,
        "explanation": "“Neyi destekledi?” sorusuna “öneriyi” cevap verir; belirtili nesnedir.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Belirtili nesne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t4-q04",
        "topicId": "k-tr-9",
        "text": "“Yolun karşısındaki küçük kafede saatlerce çalıştık.” cümlesinde “yolun karşısındaki küçük kafede” hangi ögedir?",
        "options": [
          "Özne",
          "Nesne",
          "Yüklem",
          "Zarf tümleci",
          "Dolaylı tümleç"
        ],
        "answer": 4,
        "explanation": "Bulunma hâl eki alan söz grubu “nerede çalıştık?” sorusunu karşılar; dolaylı tümleçtir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Dolaylı tümleç",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t4-q05",
        "topicId": "k-tr-9",
        "text": "“Sorunun çözümünü bize adım adım anlattı.” cümlesinde zarf tümleci hangisidir?",
        "options": [
          "Sorunun çözümünü",
          "adım adım",
          "bize",
          "anlattı",
          "sorunun"
        ],
        "answer": 1,
        "explanation": "“Nasıl anlattı?” sorusuna “adım adım” cevap verir; durum bildiren zarf tümlecidir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Zarf tümleci",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t4-q06",
        "topicId": "k-tr-9",
        "text": "“Bundan yıllar önce bu mahallede küçük bir sinema vardı.” cümlesinde özne hangisidir?",
        "options": [
          "küçük bir sinema",
          "bu mahallede",
          "Bundan yıllar önce",
          "vardı",
          "mahallede küçük"
        ],
        "answer": 0,
        "explanation": "“Vardı” yükleminin bildirdiği varlık “küçük bir sinema”dır; bu ifade özne görevindedir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Özne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t4-q07",
        "topicId": "k-tr-9",
        "text": "“İçeride bizi bekleyen görevliye belgeleri teslim ettik.” cümlesinde dolaylı tümleç hangisidir?",
        "options": [
          "İçeride",
          "bizi",
          "belgeleri",
          "bekleyen görevliye",
          "teslim ettik"
        ],
        "answer": 3,
        "explanation": "“Kime teslim ettik?” sorusuna “bizi bekleyen görevliye” cevap verir; bütün sıfat-fiil grubu dolaylı tümleçtir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Öge grubu",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t4-q08",
        "topicId": "k-tr-9",
        "text": "“Bugün açıklanan sonuçlar birçok kişiyi şaşırttı.” cümlesinde özne hangisidir?",
        "options": [
          "Bugün",
          "birçok kişiyi",
          "açıklanan sonuçlar",
          "şaşırttı",
          "sonuçlar birçok kişiyi"
        ],
        "answer": 2,
        "explanation": "“Şaşırtan ne?” sorusunun cevabı “bugün açıklanan sonuçlar”dır; sıfat-fiil grubu özne görevindedir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Öge grubu",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t4-q09",
        "topicId": "k-tr-9",
        "text": "“Bütün uyarılara rağmen aynı hatayı yeniden yaptı.” cümlesinde “bütün uyarılara rağmen” hangi ögedir?",
        "options": [
          "Dolaylı tümleç",
          "Özne",
          "Belirtili nesne",
          "Yüklem",
          "Zarf tümleci"
        ],
        "answer": 4,
        "explanation": "Söz grubu eylemin gerçekleştiği karşıt koşulu belirtir; yüklemi durum bakımından tamamladığı için zarf tümlecidir.",
        "difficulty": "hard",
        "cognitive": "interpretation",
        "skill": "Karşıtlık zarf tümleci",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t4-q10",
        "topicId": "k-tr-9",
        "text": "Aşağıdaki cümlelerin hangisinde özne bir söz grubudur?",
        "options": [
          "Yağmur başladı.",
          "Eski evin ahşap kapısı yavaşça açıldı.",
          "Çocuk güldü.",
          "Telefon çaldı.",
          "Güneş doğdu."
        ],
        "answer": 1,
        "explanation": "“Eski evin ahşap kapısı” tamlamalardan oluşan bir söz grubudur ve “açıldı” yükleminin öznesidir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Söz grubu özne",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t4-q11",
        "topicId": "k-tr-9",
        "text": "“Bize göre bu sorunun en etkili çözümü düzenli denetimdir.” cümlesinde yüklem hangisidir?",
        "options": [
          "düzenli denetimdir",
          "bu sorunun",
          "en etkili çözümü",
          "Bize göre",
          "çözümü düzenli"
        ],
        "answer": 0,
        "explanation": "İsim cümlesinin yargı bildiren bölümü ek fiil almış “düzenli denetimdir” söz grubudur; yüklemdir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "İsim yüklem",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr9-t4-q12",
        "topicId": "k-tr-9",
        "text": "“Gecenin ilerleyen saatlerinde sokaklar iyice sessizleşti.” cümlesinin ögeleri hangi sırayla verilmiştir?",
        "options": [
          "Özne – zarf tümleci – yüklem",
          "Zarf tümleci – nesne – yüklem",
          "Dolaylı tümleç – özne – yüklem",
          "Zarf tümleci – özne – zarf tümleci – yüklem",
          "Özne – dolaylı tümleç – zarf tümleci – yüklem"
        ],
        "answer": 3,
        "explanation": "“Gecenin ilerleyen saatlerinde” zaman zarf tümleci, “sokaklar” özne, “iyice” zarf tümleci, “sessizleşti” yüklemdir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Öge sıralama",
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
root.RotaKpssProfessionalTurkish09={SCHEMA,VERSION:1,tests};
if(typeof module==='object')module.exports=root.RotaKpssProfessionalTurkish09;
})(typeof window!=='undefined'?window:globalThis);
