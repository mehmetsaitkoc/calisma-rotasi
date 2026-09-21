(function(root){
'use strict';
const tests=[
  {
    "id": "kpss:k-tr:k-tr-5:t01",
    "exam": "kpss",
    "subjectId": "k-tr",
    "topicId": "k-tr-5",
    "topicTitle": "Ses bilgisi",
    "setNo": 1,
    "title": "KPSS Türkçe · Ses Bilgisi · Test 1",
    "eyebrow": "PROFESYONEL KONU TESTİ · KPSS",
    "minutes": 16,
    "level": "Temel kazanım + bağlam",
    "questions": [
      {
        "id": "ktr5-t1-q01",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerin hangisinde ünlü düşmesi vardır?",
        "options": [
          "kalemi",
          "omzu",
          "sokağı",
          "kapısı",
          "oyunu"
        ],
        "answer": 1,
        "explanation": "“Omuz” sözcüğü ünlüyle başlayan iyelik eki aldığında ikinci hecedeki dar ünlü düşer: omuz + u → omzu.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Ünlü düşmesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t1-q02",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerin hangisinde ünsüz yumuşaması görülür?",
        "options": [
          "yurtta",
          "ağaçtan",
          "seçkin",
          "kitabı",
          "topçu"
        ],
        "answer": 3,
        "explanation": "“Kitap” sözcüğünün sonundaki p, ünlüyle başlayan ek geldiğinde b’ye dönüşür: kitap + ı → kitabı.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Ünsüz yumuşaması",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t1-q03",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerin hangisinde ünsüz benzeşmesi vardır?",
        "options": [
          "dolapçı",
          "odacı",
          "gözlük",
          "evde",
          "simitçi"
        ],
        "answer": 0,
        "explanation": "“Dolap” sert ünsüzle bittiği için +cı eki sertleşerek +çı olur: dolapçı.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Ünsüz benzeşmesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t1-q04",
        "topicId": "k-tr-5",
        "text": "“başlıyor” sözcüğünde görülen ses olayı aşağıdakilerden hangisidir?",
        "options": [
          "Ünsüz türemesi",
          "Ünlü düşmesi",
          "Ünsüz yumuşaması",
          "Ünlü türemesi",
          "Ünlü daralması"
        ],
        "answer": 4,
        "explanation": "“Başla-” fiiline -yor eki geldiğinde a ünlüsü ı’ya daralır: başlıyor.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Ünlü daralması",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t1-q05",
        "topicId": "k-tr-5",
        "text": "“affetmek” sözcüğünde görülen ses olayı hangisidir?",
        "options": [
          "Ünlü daralması",
          "Ünsüz benzeşmesi",
          "Ünsüz türemesi",
          "Ünlü düşmesi",
          "Ünsüz yumuşaması"
        ],
        "answer": 2,
        "explanation": "“Af” sözcüğü “etmek” yardımcı fiiliyle birleşirken f ünsüzü türemiştir: affetmek.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Ünsüz türemesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t1-q06",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerin hangisinde kaynaştırma ünsüzü kullanılmıştır?",
        "options": [
          "evde",
          "arabaya",
          "kitaptan",
          "gözlük",
          "sokakçı"
        ],
        "answer": 1,
        "explanation": "“Araba” ile yönelme eki -a arasına y kaynaştırma ünsüzü girer: araba-y-a.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Kaynaştırma",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t1-q07",
        "topicId": "k-tr-5",
        "text": "“küçücük” sözcüğünün oluşumunda aşağıdaki ses olaylarından hangisi vardır?",
        "options": [
          "Ünlü daralması",
          "Ünsüz türemesi",
          "Ünlü düşmesi",
          "Ünsüz düşmesi",
          "Ünsüz yumuşaması"
        ],
        "answer": 3,
        "explanation": "“Küçük” sözcüğüne küçültme eki geldiğinde k ünsüzlerinden biri düşer: küçük → küçücük.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Ünsüz düşmesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t1-q08",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerin hangisinde ünlü türemesi vardır?",
        "options": [
          "azıcık",
          "burnu",
          "kitabı",
          "bekliyor",
          "hissi"
        ],
        "answer": 0,
        "explanation": "“Az” sözcüğüne küçültme eki getirilirken araya ı ünlüsü girer: az → azıcık.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Ünlü türemesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t1-q09",
        "topicId": "k-tr-5",
        "text": "“renge” sözcüğünde görülen ses olayı hangisidir?",
        "options": [
          "Ünlü düşmesi",
          "Ünsüz türemesi",
          "Ünlü daralması",
          "Ünsüz benzeşmesi",
          "Ünsüz yumuşaması"
        ],
        "answer": 4,
        "explanation": "“Renk” sözcüğündeki k, ünlüyle başlayan yönelme eki aldığında g’ye dönüşür: renk + e → renge.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Ünsüz yumuşaması",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t1-q10",
        "topicId": "k-tr-5",
        "text": "“anlıyor” sözcüğünde aşağıdaki ses olaylarından hangisi gerçekleşmiştir?",
        "options": [
          "Ünlü düşmesi",
          "Ünsüz yumuşaması",
          "Ünlü daralması",
          "Ünsüz benzeşmesi",
          "Ünsüz türemesi"
        ],
        "answer": 2,
        "explanation": "“Anla-” fiiline -yor eki geldiğinde a ünlüsü ı’ya daralır: anlıyor.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Ünlü daralması",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t1-q11",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerden hangisinde hem ünlü düşmesi hem de kaynaştırma ünsüzü vardır?",
        "options": [
          "kitabı",
          "ağzına",
          "bekliyor",
          "affetmek",
          "dolapçı"
        ],
        "answer": 1,
        "explanation": "“Ağız” sözcüğü iyelik eki aldığında ünlü düşmesiyle “ağzı” olur; ardından yönelme eki gelirken n kaynaştırması kullanılır: ağzına.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Birleşik ses olayları",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t1-q12",
        "topicId": "k-tr-5",
        "text": "“Ağzı” sözcüğündeki ses olayını doğru açıklayan seçenek hangisidir?",
        "options": [
          "Son ünsüz sertleşmiştir.",
          "Ünlü daralması olmuştur.",
          "Kaynaştırma ünsüzü kullanılmıştır.",
          "Ağız sözcüğündeki ikinci hece ünlüsü düşmüştür.",
          "Ünsüz türemesi olmuştur."
        ],
        "answer": 3,
        "explanation": "“Ağız” sözcüğü ünlüyle başlayan iyelik eki aldığında ikinci hecedeki ı düşer: ağız + ı → ağzı.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Ünlü düşmesini çözümleme",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      }
    ],
    "version": 2,
    "qualityStatus": "approved",
    "sourceKind": "original",
    "copyrightPolicy": "original-only",
    "sourceBasis": [
      "tdk-turkce-ses-bilgisi",
      "official-scope-2026",
      "official-question-style-review"
    ]
  },
  {
    "id": "kpss:k-tr:k-tr-5:t02",
    "exam": "kpss",
    "subjectId": "k-tr",
    "topicId": "k-tr-5",
    "topicTitle": "Ses bilgisi",
    "setNo": 2,
    "title": "KPSS Türkçe · Ses Bilgisi · Test 2",
    "eyebrow": "PROFESYONEL KONU TESTİ · KPSS",
    "minutes": 16,
    "level": "Bağlam ve ayırt etme",
    "questions": [
      {
        "id": "ktr5-t2-q01",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki cümlelerin hangisinde altı çizili sözcükte ünsüz yumuşaması vardır?",
        "options": [
          "Çocuk parkta oynuyor.",
          "Masadan kalemi aldı.",
          "Bu kitabı dün bitirdim.",
          "Sokakta kimse kalmadı.",
          "Bahçede çiçek açtı."
        ],
        "answer": 2,
        "explanation": "“Kitap” sözcüğü belirtme eki aldığında p → b değişimi olur: kitabı.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Cümlede ünsüz yumuşaması",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t2-q02",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki cümlelerin hangisinde ünlü düşmesine uğramış bir sözcük vardır?",
        "options": [
          "Boynu tutulduğu için başını çeviremiyordu.",
          "Kalemi masanın üzerine bıraktı.",
          "Çocuklar bahçede oynuyordu.",
          "Dosyayı dikkatlice inceledi.",
          "Sabah erkenden yola çıktık."
        ],
        "answer": 0,
        "explanation": "“Boyun” sözcüğü iyelik eki aldığında ikinci hecedeki u düşer: boyun + u → boynu.",
        "difficulty": "medium",
        "cognitive": "context",
        "skill": "Cümlede ünlü düşmesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t2-q03",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki cümlelerin hangisinde ünlü daralmasına örnek vardır?",
        "options": [
          "Seni akşam arayacağım.",
          "Yolculuk uzun sürdü.",
          "Bahçeyi suladı.",
          "Dersi dikkatle dinledi.",
          "Çocuk kapıda bekliyor."
        ],
        "answer": 4,
        "explanation": "“Bekle-” fiiline -yor eki geldiğinde e → i daralması gerçekleşir: bekliyor.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Cümlede ünlü daralması",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t2-q04",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerden hangisindeki ses olayı diğerlerinden farklıdır?",
        "options": [
          "kitabı",
          "burnu",
          "ağacı",
          "kanadı",
          "rengi"
        ],
        "answer": 1,
        "explanation": "Kitabı, ağacı, kanadı ve rengi örneklerinde son ünsüz yumuşar; “burnu”nda ise ünlü düşmesi vardır.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Ses olaylarını karşılaştırma",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t2-q05",
        "topicId": "k-tr-5",
        "text": "Aşağıdakilerden hangisinde ünsüz türemesi yoktur?",
        "options": [
          "affetmek",
          "hissetmek",
          "reddetmek",
          "kaybetmek",
          "zannetmek"
        ],
        "answer": 3,
        "explanation": "Affetmek, hissetmek, reddetmek ve zannetmekte ünsüz türemesi vardır; “kaybetmek”te böyle bir türeme yoktur.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Ünsüz türemesini ayırt etme",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t2-q06",
        "topicId": "k-tr-5",
        "text": "“Gencecik” sözcüğünde görülen ses olayı aşağıdakilerden hangisidir?",
        "options": [
          "Ünlü türemesi",
          "Ünsüz benzeşmesi",
          "Ünsüz düşmesi",
          "Ünlü daralması",
          "Ünsüz yumuşaması"
        ],
        "answer": 2,
        "explanation": "“Genç” sözcüğüne küçültme eki getirilirken yapı değişir ve ses düşmesi oluşur: genç → gencecik.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Ünsüz düşmesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t2-q07",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcük çiftlerinden hangisinde aynı ses olayı vardır?",
        "options": [
          "burun-burnu / ağız-ağzı",
          "kitap-kitabı / his-hissetmek",
          "başla-başlıyor / renk-renge",
          "ufak-ufacık / af-affetmek",
          "bekle-bekliyor / omuz-omzu"
        ],
        "answer": 0,
        "explanation": "Burun→burnu ve ağız→ağzı örneklerinin ikisinde de orta hece ünlüsü düşer.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Aynı ses olayını eşleştirme",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t2-q08",
        "topicId": "k-tr-5",
        "text": "“Sokağa çıktığında yağmur başlamıştı.” cümlesinde “sokağa” sözcüğündeki ses olayının nedeni hangisidir?",
        "options": [
          "Sert ünsüzle biten sözcüğün sert ek alması",
          "Dar ünlünün düşmesi",
          "Kaynaştırma ünsüzünün kullanılması",
          "Ünlünün daralması",
          "Son ünsüzün ünlüyle başlayan ek karşısında yumuşaması"
        ],
        "answer": 4,
        "explanation": "“Sokak” sözcüğünün sonundaki k, ünlüyle başlayan yönelme eki geldiğinde ğ’ye dönüşür: sokağa.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Yumuşamanın nedeni",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t2-q09",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki cümlelerin hangisinde kaynaştırma ünsüzü yoktur?",
        "options": [
          "Arabaya hızla bindi.",
          "Kapıda uzun süre bekledi.",
          "Masayı pencerenin yanına çekti.",
          "İki gün sonra buraya gelecek.",
          "Bahçeye yeni fidanlar dikildi."
        ],
        "answer": 1,
        "explanation": "“Kapıda” sözcüğünde -da bulunma eki doğrudan gelir; araya kaynaştırma ünsüzü girmez. Diğerlerinde y kaynaştırması vardır.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Kaynaştırmayı ayırt etme",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t2-q10",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerin hangisinde ses olayı sözcüğün kökünde değil, ekin biçiminde ortaya çıkar?",
        "options": [
          "burnu",
          "hissetmek",
          "bekliyor",
          "kitapçı",
          "ufacık"
        ],
        "answer": 3,
        "explanation": "“Kitapçı”da sert ünsüzden sonra gelen -cı eki -çı biçimine dönüşür; değişim ekin ünsüzünde gerçekleşir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Ünsüz benzeşmesinin yeri",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t2-q11",
        "topicId": "k-tr-5",
        "text": "“Onun fikrine saygı duyuyorum.” cümlesindeki “fikrine” sözcüğünde hangi ses olayı vardır?",
        "options": [
          "Ünsüz yumuşaması",
          "Ünlü daralması",
          "Ünlü düşmesi",
          "Ünsüz türemesi",
          "Ses olayı yoktur"
        ],
        "answer": 2,
        "explanation": "“Fikir” sözcüğü iyelik eki aldığında ikinci hecedeki i düşer: fikir + i → fikri; ardından yönelme eki gelir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Ek zincirinde ünlü düşmesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t2-q12",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerden hangisinin aldığı ek, sözcüğün son sesinde değişikliğe yol açmamıştır?",
        "options": [
          "sınıfı",
          "kanadı",
          "çiçeği",
          "dolabı",
          "rengi"
        ],
        "answer": 0,
        "explanation": "“Sınıf” sözcüğünde f ünsüzü ünlüyle başlayan ek karşısında değişmez: sınıfı. Diğerlerinde son ünsüz yumuşar.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Yumuşamaya aykırı durum",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      }
    ],
    "version": 2,
    "qualityStatus": "approved",
    "sourceKind": "original",
    "copyrightPolicy": "original-only",
    "sourceBasis": [
      "tdk-turkce-ses-bilgisi",
      "official-scope-2026",
      "official-question-style-review"
    ]
  },
  {
    "id": "kpss:k-tr:k-tr-5:t03",
    "exam": "kpss",
    "subjectId": "k-tr",
    "topicId": "k-tr-5",
    "topicTitle": "Ses bilgisi",
    "setNo": 3,
    "title": "KPSS Türkçe · Ses Bilgisi · Test 3",
    "eyebrow": "PROFESYONEL KONU TESTİ · KPSS",
    "minutes": 16,
    "level": "Karma ve güçlü çeldirici",
    "questions": [
      {
        "id": "ktr5-t3-q01",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki cümlelerin hangisindeki koyu anlamlı sözcükte hem ünlü düşmesi hem kaynaştırma ünsüzü vardır?",
        "options": [
          "Kalemi çantasına koydu.",
          "Yolcular sıraya girdi.",
          "Bahçedeki ağacı suladı.",
          "Çocuk hızlıca koştu.",
          "Ağzını kapatıp bir süre sustu."
        ],
        "answer": 4,
        "explanation": "“Ağız” sözcüğü iyelik ekiyle “ağzı” olurken ünlü düşer; belirtme eki eklenirken n kaynaştırması kullanılır: ağzını.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Ek zincirinde ses olayları",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t3-q02",
        "topicId": "k-tr-5",
        "text": "“Daracık” sözcüğünün oluşumunda görülen ses olayı aşağıdakilerden hangisidir?",
        "options": [
          "Ünsüz düşmesi",
          "Ünsüz türemesi",
          "Ünlü türemesi",
          "Ünlü daralması",
          "Ünsüz yumuşaması"
        ],
        "answer": 2,
        "explanation": "“Dar” sözcüğüne küçültme eki getirilirken araya a ünlüsü girer: dar → daracık; bu ünlü türemesidir.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Ünlü türemesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t3-q03",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerden hangisi ünsüz yumuşamasına örnek gösterilemez?",
        "options": [
          "yüreği",
          "hukuku",
          "çocuğu",
          "sebebi",
          "kanadı"
        ],
        "answer": 1,
        "explanation": "“Hukuk” sözcüğünde son k, çekimde yumuşamayabilir: hukuku. Diğer örneklerde p/ç/t/k sesleri b/c/d/ğ-g yönünde değişmiştir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Yumuşamaya aykırılık",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t3-q04",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki cümlelerin hangisinde altı çizili sözcükte ünlü daralması yoktur?",
        "options": [
          "Bizi dikkatle dinliyor.",
          "Soruyu hemen anlıyor.",
          "Çocuk kapıda bekliyor.",
          "Akşam eve geliyor.",
          "Yemeği ocakta pişiriyor."
        ],
        "answer": 3,
        "explanation": "“Geliyor” sözcüğünde kök “gel-”dir; -yor eki geldiğinde a/e ünlüsünün daralması söz konusu değildir. Diğerlerinde a/e ile biten fiiller daralmıştır.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Daralma koşulu",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t3-q05",
        "topicId": "k-tr-5",
        "text": "“Hakkı” sözcüğünde görülen ses olayı aşağıdakilerden hangisidir?",
        "options": [
          "Ünsüz türemesi",
          "Ünlü düşmesi",
          "Ünsüz yumuşaması",
          "Ünlü daralması",
          "Ünsüz benzeşmesi"
        ],
        "answer": 0,
        "explanation": "“Hak” sözcüğü ünlüyle başlayan ek aldığında söyleyişte ve yazımda k ünsüzü ikizleşir: hakkı; bu ünsüz türemesi olarak değerlendirilir.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Ünsüz türemesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t3-q06",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki seçeneklerin hangisinde ses olayı yanlış adlandırılmıştır?",
        "options": [
          "burnu — ünlü düşmesi",
          "kitabı — ünsüz yumuşaması",
          "başlıyor — ünlü daralması",
          "affetmek — ünsüz türemesi",
          "kitapçı — ünsüz yumuşaması"
        ],
        "answer": 4,
        "explanation": "“Kitapçı”da p yumuşamaz; +cı ekinin c sesi sertleşerek ç olur. Bu, ünsüz benzeşmesidir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Ses olayını adlandırma",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t3-q07",
        "topicId": "k-tr-5",
        "text": "“Sabahın serinliğinde burnundan derin bir nefes aldı.” cümlesinde “burnundan” sözcüğünün oluşumunda ilk gerçekleşen ses olayı hangisidir?",
        "options": [
          "Ünsüz benzeşmesi",
          "Ünlü daralması",
          "Ünlü düşmesi",
          "Kaynaştırma",
          "Ünsüz türemesi"
        ],
        "answer": 2,
        "explanation": "Temel biçim “burun”dur; iyelik ekiyle “burnu” olurken u düşer. Sonraki hâl ekleri bu biçime eklenir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Ses olayında sıra",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t3-q08",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerin hangisinde kaynaştırma ünsüzü ile ünsüz yumuşaması birlikte görülür?",
        "options": [
          "masaya",
          "sokağına",
          "kitapta",
          "burnunda",
          "bekliyor"
        ],
        "answer": 1,
        "explanation": "“Sokak” → “sokağı” biçiminde k→ğ yumuşaması olur; ardından yönelme eki gelirken “sokağına” biçiminde n kaynaştırması kullanılır.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Birleşik ses olayları",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t3-q09",
        "topicId": "k-tr-5",
        "text": "“Azıcık” ve “biricik” sözcüklerinde ortak olan ses olayı hangisidir?",
        "options": [
          "Ünlü düşmesi",
          "Ünsüz yumuşaması",
          "Ünsüz türemesi",
          "Ünlü türemesi",
          "Ünlü daralması"
        ],
        "answer": 3,
        "explanation": "Her iki örnekte de küçültme yapısı kurulurken kökle ek arasında bir ünlü türemiştir.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "Ünlü türemesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t3-q10",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki cümlelerin hangisinde ses olayı nedeniyle sözcüğün hece sayısı azalmıştır?",
        "options": [
          "Omzu ağrıdığı için çantasını taşımadı.",
          "Kitabı masanın üzerine bıraktı.",
          "Sokağa doğru yürüdü.",
          "Çocuk kapıda bekliyordu.",
          "Dolapçı yeni dükkân açtı."
        ],
        "answer": 0,
        "explanation": "“Omuz” iki heceliyken “omzu” biçiminde orta hecedeki ünlü düştüğü için hece sayısı azalır.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Hece sayısına etki",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t3-q11",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerden hangisinde son ünsüzün değişmemesi, genel yumuşama kuralına bir istisna örneğidir?",
        "options": [
          "sanatı",
          "ağacı",
          "kanadı",
          "dolabı",
          "hukuku"
        ],
        "answer": 4,
        "explanation": "“Hukuk” sözcüğü ünlüyle başlayan ek aldığında “hukuku” biçiminde k sesini korur; bu kullanım yumuşamaya aykırı örnektir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Yumuşama istisnası",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t3-q12",
        "topicId": "k-tr-5",
        "text": "“Kaybolmak” sözcüğünün oluşumu için aşağıdakilerden hangisi doğrudur?",
        "options": [
          "Ünlü daralması vardır.",
          "Ünsüz türemesi vardır.",
          "Birleşme sırasında ses düşmesi vardır.",
          "Ünsüz benzeşmesi vardır.",
          "Kaynaştırma ünsüzü vardır."
        ],
        "answer": 2,
        "explanation": "“Kayıp olmak” birleşmesi sırasında ikinci hecedeki dar ünlü düşerek “kaybolmak” biçimi oluşur.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Birleşmede ses düşmesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      }
    ],
    "version": 2,
    "qualityStatus": "approved",
    "sourceKind": "original",
    "copyrightPolicy": "original-only",
    "sourceBasis": [
      "tdk-turkce-ses-bilgisi",
      "official-scope-2026",
      "official-question-style-review"
    ]
  },
  {
    "id": "kpss:k-tr:k-tr-5:t04",
    "exam": "kpss",
    "subjectId": "k-tr",
    "topicId": "k-tr-5",
    "topicTitle": "Ses bilgisi",
    "setNo": 4,
    "title": "KPSS Türkçe · Ses Bilgisi · Test 4",
    "eyebrow": "PROFESYONEL KONU TESTİ · KPSS",
    "minutes": 16,
    "level": "Sınav provası",
    "questions": [
      {
        "id": "ktr5-t4-q01",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki cümlelerin hangisinde bir ses olayı yanlış yorumlanmıştır?",
        "options": [
          "“Sokakta” sözcüğünde ünsüz yumuşaması vardır.",
          "“Burnu” sözcüğünde ünlü düşmesi vardır.",
          "“Kitabı” sözcüğünde ünsüz yumuşaması vardır.",
          "“Bekliyor” sözcüğünde ünlü daralması vardır.",
          "“Affetmek” sözcüğünde ünsüz türemesi vardır."
        ],
        "answer": 0,
        "explanation": "“Sokakta” sözcüğünde yumuşama yoktur; sert ünsüz k’dan sonra bulunma ekinin d’si t’ye dönüşür ve ünsüz benzeşmesi gerçekleşir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Ses olayı yorumlama",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t4-q02",
        "topicId": "k-tr-5",
        "text": "“Çocuğun yanağı soğuktan kızarmıştı.” cümlesinde “yanağı” sözcüğündeki ses olayı hangisidir?",
        "options": [
          "Ünlü düşmesi",
          "Ünsüz türemesi",
          "Ünlü daralması",
          "Ünsüz yumuşaması",
          "Ünsüz benzeşmesi"
        ],
        "answer": 3,
        "explanation": "“Yanak” sözcüğündeki k, ünlüyle başlayan iyelik eki geldiğinde ğ’ye dönüşür: yanağı.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Ünsüz yumuşaması",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t4-q03",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerin hangisinde ses olayı, sözcüğe getirilen “-yor” ekinden kaynaklanmıştır?",
        "options": [
          "burnu",
          "kitabı",
          "söylüyor",
          "affetmek",
          "ufacık"
        ],
        "answer": 2,
        "explanation": "“Söyle-” fiiline -yor eki geldiğinde e daralarak ü’ye yaklaşan çekim biçimi oluşur; olay -yor ekiyle ilişkilidir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "-yor ile daralma",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t4-q04",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcük çiftlerinden hangisinde ilk sözcük ünlü düşmesine, ikinci sözcük ünsüz yumuşamasına örnektir?",
        "options": [
          "kitabı / ağzı",
          "bekliyor / rengi",
          "affetmek / omzu",
          "azıcık / dolapçı",
          "burnu / kitabı"
        ],
        "answer": 4,
        "explanation": "“Burnu”nda burun→burnu ünlü düşmesi; “kitabı”nda kitap→kitabı ünsüz yumuşaması vardır.",
        "difficulty": "easy",
        "cognitive": "application",
        "skill": "İki ses olayını eşleştirme",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t4-q05",
        "topicId": "k-tr-5",
        "text": "“Sabrı sayesinde zor süreci tamamladı.” cümlesindeki “sabrı” sözcüğünde hangi ses olayı vardır?",
        "options": [
          "Ünsüz yumuşaması",
          "Ünlü düşmesi",
          "Ünsüz türemesi",
          "Ünlü daralması",
          "Kaynaştırma"
        ],
        "answer": 1,
        "explanation": "“Sabır” sözcüğü iyelik eki aldığında ikinci hecedeki ı düşer: sabır + ı → sabrı.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Ünlü düşmesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t4-q06",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki cümlelerin hangisinde ünsüz benzeşmesi görülür?",
        "options": [
          "Kitapçı dükkânını erkenden açtı.",
          "Çocuğu okuldan aldı.",
          "Burnu soğuktan kızardı.",
          "Anlıyor ama konuşmuyor.",
          "Arabaya hızlıca bindi."
        ],
        "answer": 0,
        "explanation": "“Kitapçı” sözcüğünde p sert ünsüzünden sonra gelen c, ç’ye dönüşmüştür; bu ünsüz benzeşmesidir.",
        "difficulty": "medium",
        "cognitive": "context",
        "skill": "Cümlede ünsüz benzeşmesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t4-q07",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerin hangisinde ses olayı sözcük birleşmesi sırasında gerçekleşmiştir?",
        "options": [
          "burnu",
          "kitabı",
          "bekliyor",
          "kaybolmak",
          "sokağa"
        ],
        "answer": 3,
        "explanation": "“Kayıp olmak” birleşirken dar ünlü düşer ve “kaybolmak” biçimi oluşur; olay birleşme sırasında gerçekleşir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Birleşmede ses olayı",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t4-q08",
        "topicId": "k-tr-5",
        "text": "“Bana” sözcüğünün oluşumuyla ilgili aşağıdakilerden hangisi doğrudur?",
        "options": [
          "Ünlü daralması vardır.",
          "Ünlü düşmesi vardır.",
          "Kök biçiminde ses değişmesi meydana gelmiştir.",
          "Ünsüz türemesi vardır.",
          "Ünsüz benzeşmesi vardır."
        ],
        "answer": 2,
        "explanation": "“Ben” zamiri yönelme eki aldığında düzenli “bene” biçimi yerine “bana” olur; kökte ünlü değişmesi görülür.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Zamirlerde ses değişmesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t4-q09",
        "topicId": "k-tr-5",
        "text": "Aşağıdaki sözcüklerden hangisinde yumuşama beklenebilecek bir ortam olmasına rağmen son ünsüz değişmemiştir?",
        "options": [
          "ağacı",
          "kanadı",
          "rengi",
          "dolabı",
          "hukuku"
        ],
        "answer": 4,
        "explanation": "“Hukuk” sözcüğü ünlüyle başlayan ek aldığında “hukuku” biçiminde son k sesini korur; bu nedenle yumuşamaya aykırı örnektir.",
        "difficulty": "medium",
        "cognitive": "reasoning",
        "skill": "Yumuşama istisnası",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t4-q10",
        "topicId": "k-tr-5",
        "text": "“Ufak” sözcüğünden “ufacık” biçiminin oluşması aşağıdakilerden hangisiyle açıklanır?",
        "options": [
          "Ünlü daralması",
          "Ünsüz düşmesi",
          "Ünsüz türemesi",
          "Ünsüz benzeşmesi",
          "Ünlü düşmesi"
        ],
        "answer": 1,
        "explanation": "“Ufak” sözcüğüne küçültme eki gelirken k ünsüzü düşer ve “ufacık” biçimi oluşur.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Ünsüz düşmesi",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t4-q11",
        "topicId": "k-tr-5",
        "text": "“Çantaya” sözcüğündeki y sesinin görevi aşağıdakilerden hangisidir?",
        "options": [
          "Kaynaştırma ünsüzü",
          "Ünsüz yumuşaması",
          "Ünsüz benzeşmesi",
          "Ünsüz türemesi",
          "Ünlü daralması"
        ],
        "answer": 0,
        "explanation": "“Çanta” ünlüyle bittiği için yönelme eki -a doğrudan getirilemez; kökle ek arasındaki y sesi kaynaştırma görevi yapar: çanta-y-a.",
        "difficulty": "medium",
        "cognitive": "application",
        "skill": "Kaynaştırma",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      },
      {
        "id": "ktr5-t4-q12",
        "topicId": "k-tr-5",
        "text": "Bir sözcükte ünlü düşmesinin bulunduğunu kesin olarak gösterebilmek için aşağıdakilerden hangisi en güvenilir karşılaştırmadır?",
        "options": [
          "Sözcüğün hece sayısını tek başına saymak",
          "Sözcüğün son harfine bakmak",
          "Ek türünü bilmeden telaffuzu değerlendirmek",
          "Sözcüğün kök biçimi ile ek almış biçimini karşılaştırmak",
          "Sözcüğün cümledeki görevini belirlemek"
        ],
        "answer": 3,
        "explanation": "Ünlü düşmesi kök ile eklenmiş biçim karşılaştırıldığında açıkça görülür; tek başına hece sayısı veya son harf yeterli kanıt değildir.",
        "difficulty": "hard",
        "cognitive": "reasoning",
        "skill": "Ses olayını kanıtlama",
        "sourceKind": "original",
        "copyrightPolicy": "original-only"
      }
    ],
    "version": 2,
    "qualityStatus": "approved",
    "sourceKind": "original",
    "copyrightPolicy": "original-only",
    "sourceBasis": [
      "tdk-turkce-ses-bilgisi",
      "official-scope-2026",
      "official-question-style-review"
    ]
  }
];
root.RotaKpssProfessionalTurkish05={VERSION:2,tests};
if(typeof module==='object')module.exports=root.RotaKpssProfessionalTurkish05;
})(typeof window!=='undefined'?window:globalThis);
