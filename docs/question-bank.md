# KPSS soru bankası — tam katalog ve entegrasyon

Mevcut KPSS Lisans Genel Yetenek / Genel Kültür kataloğunun tamamı: **6 ders, 64 konu, 256 test, 3.072 özgün soru ve 18 branş denemesi**. Her konuda dört ayrı 12 soruluk test vardır. Geometri, mevcut katalogdaki Matematik dersi altında yer alır.

| Ders | Konu | Test | Özgün soru | Branş denemesi | Bir denemedeki soru |
|---|---:|---:|---:|---:|---:|
| Türkçe | 11 | 44 | 528 | 3 | 30 |
| Matematik ve geometri | 17 | 68 | 816 | 3 | 30 |
| Tarih | 13 | 52 | 624 | 3 | 27 |
| Coğrafya | 12 | 48 | 576 | 3 | 18 |
| Vatandaşlık | 8 | 32 | 384 | 3 | 9 |
| Güncel bilgiler | 3 | 12 | 144 | 3 | 6 |
| Toplam | 64 | 256 | 3.072 | 18 | 360 kullanım |

Branşlar aynı soru bankasından seçilen sabit formlardır. Aynı dersin üç denemesi arasında soru tekrarı yoktur; konu testlerinde çözülmüş bir soru branşta yeniden görülebilir. **360 branş kullanımı ayrıca 360 yeni özgün soru olarak sayılmaz.** Konu kotaları editoryal çalışma dağılımıdır; ÖSYM'nin konu başına kesin sayı taahhüdü değildir.

## Mevcut sistemle uyum

`public/catalog.js` ders ve konu kimliklerinin kaynağıdır. Eski on Tarih paketi ve pratik setleri, geçmiş deneme sonuçlarının açılabilmesi için korunur. Konu ekranı her konuda dört yeni onaylı seti sunar. Yeni branş formları eski branş kartlarının yerini alır; eski sonuçların tanımları çözülmeye devam eder. Yeni bankanın yönettiği bir konuda/derste inceleme kapısı kapanırsa eski onaysız içerik Başla seçeneğine geri dönmez. Güncellik listeleme, başlatma ve kayıt anında yeniden kontrol edilir. Süre dolduktan sonra sayfa yenilense de kayıtlı soru kimliği/sürümü/cevabı eşleşen eski branş sonucu yalnız geçmiş incelemesi için açılabilir.

`public/question-bank.js` saf içerik/ölçme modülüdür; DOM, depolama veya rota ağırlığı değiştirmez. Her konu `public/questions/kpss/<ders>/<konu>/test-{1,2,3,4}.js` dosyalarında saklanır. `manifest.json` tam dosya ve katalog dökümüdür. `branch-exams.js`, onaylı havuzdan `blueprints.js` kotalarıyla üçer form oluşturur. Uygulama mevcut test arayüzünü, gönderim ve sonuç saklama akışlarını kullanır.

Doğru, yanlış ve boş bütün soruların açıklaması ile dört çeldirici gerekçesi sonuç ekranında açılabilir. Branş çözümleri ilk 12 soruyla kesilmez.

## Veri sözleşmesi

Her soru; sabit `id`, `exam`, `field`, `lesson`, `subjectId`, `unit`, `topic`, `topicId`, `subtopic`, `testNo`, `questionNo`, `difficulty`, `questionType`, `skill`, `learningObjectiveId`, `learningObjective`, `commonMistake`, `tags`, `sourceBasis`, `sourceRefs` içerir. Mevcut uygulamanın puanlama sözleşmesi korunarak kök `text`, doğru cevap sıfır tabanlı `answer` içinde saklanır. Beş `options`, doğru cevabın `explanation` alanı ve dört yanlış seçeneğin harfe bağlı `wrongAnswerNotes` kayıtları bulunur. Dışa aktarılan JSON ayrıca `question` ve A–E harfi olarak `correctAnswer` sağlar.

Türler `RotaQuestionBank.TYPES` içinde sınırlıdır; kullanıcıya `SKILL_LABELS` ile Türkçe gösterilir. `difficulty`: `easy`, `medium`, `hard`. Test 1 temel/orta, Test 2 pekiştirme, Test 3 KPSS, Test 4 seçici/ustalık düzeyidir. Kolay/orta/zor dağılımları sırasıyla **6/5/1, 3/7/2, 1/7/4, 1/5/6** olur. Cevap harfleri test başına 1–3 kez kullanılır ve konu başına aynı anahtar dizisinin tekrarından kaçınılır.

Alt konu ve kazanım etiketleri arama/filtrelemede kullanılır. `filter({exam, lesson, topic, subtopic, testNo, difficulty, questionType, learningObjectiveId, qualityStatus, search})` yönetim arayüzüne bağlanabilir. `allTests()` bütün tanımları, `topicTests()` yalnız yayın kapısını geçen setleri döndürür.

## İçerik incelemesi ve yayın kapısı

1. İlk yazım `needs-review` durumundadır. Kök, beş seçenek, cevap, çözüm ve her yanlış seçeneğin gerekçesi ayrı içerik incelemesinde okunur. Bilgi hataları, belirsiz doğru cevaplar, zayıf çeldiriciler ve kolay kalmış ileri düzey maddeler düzeltilir.
2. Kaynaklar MEB, ÖSYM ve ilgili resmî kurum metinleriyle karşılaştırılır. Değişebilir hukuk/kurum bilgisi ve tarihli olaylar için `currentness` içinde kontrol günü, yeniden kontrol sınırı ve kaynak URL’si bulunur.
3. Yapısal denetim alanları, kimlikleri, beş farklı seçeneği, doğru cevap indeksini, dört çeldirici notunu, kaynak kayıtlarını, konu/test eşleşmesini, sayı ve zorluk dağılımını doğrular. Büyük/küçük harf, noktalama ve matematiksel işaretler sorunun konusu olabileceğinden seçenek karşılaştırması bunları silmez.
4. İç tekrar taraması normalize edilmiş soru köklerini, üçlü sözcük benzerliğini, seçenek örtüşmesini ve kazanım yoğunluğunu kontrol eder. İndeksli karşılaştırma binlerce soruda aynı denetimi gereksiz bütün çift taraması olmadan yürütür.
5. `review` içindeki yedi kontrol, inceleyen kimliği, gün ve içerik parmak izi birlikte aranır. İçerik değişirse onay geçersiz olur. Parmak izi değişiklik denetimidir; kriptografik imza veya dış dünyada özgünlük kanıtı değildir.
6. Yalnız onaylı 12 sorudan oluşan tam setler sunulur. `assembleSeries` kota eksikse kısmi bir üçlü seri yayımlamaz. Güncellik süresi geçmiş içerik yeniden inceleme gerektirir.

Matematikte yeniden yazılan işlem/olasılık/sıralama soruları bağımsız hesaplarla, Türkçe sözel mantıkta ilgili sıralamalar ayrı olasılık taramasıyla da kontrol edilmiştir. Konu bazındaki ayrıntılı inceleme ve kaynak kayıtları `docs/question-bank-*-review*`, `docs/question-bank-*-sources*` dosyalarındadır.

**`approved` proje içi bağımsız yapay zekâ editoryal durumudur.** İnsan KPSS alan uzmanı sertifikasyonu veya öğrenci verisiyle ölçülmüş madde güçlüğü/ayırt edicilik iddiası değildir. Otomasyon anlam doğruluğunu veya bütün ticari soru bankalarıyla sıfır benzerliği matematiksel olarak kanıtlayamaz. Sorular bu banka için özgün yazılmıştır; telifli soru metinleri aktarılmamıştır. Ramazan Yetgin veya başka bir öğretmenin onayı/iş birliği, incelenmemiş materyalleri kaynak gösterilerek ima edilmez.

## Branş dağılımı

Altı ders için üçer form vardır. Açık konu/zorluk kotaları korunarak ilk formda Test 2, ikinci formda Test 3, üçüncü formda Test 4 soruları tercih edilir; ilgili kota için gereken sayıya ulaşılamazsa diğer onaylı setlere belirli sırayla geçilir. Böylece ileri formlar yalnız düşük numaralı testlerden dolmaz. 2026 KPSS Lisans kılavuzunun Tablo 1 alan ağırlıkları ders toplamlarına dayanak oluşturur: [ÖSYM kılavuzu, basılı s.34](https://dokuman.osym.gov.tr/pdfdokuman/2026/KPSS/LISANS/kilavuz_Ld01072026.pdf). Alt konu payları editoryal kotadır. Genel Yetenek 60, Genel Kültür 60 ve tam KPSS 120 için mevcut genişleme şablonları ayrıca korunmuştur; bu üç şablon 18 hazır branş denemesine ek tamamlanmış sınav sayılmaz ve karma sınav göndericisi olarak yayımlanmaz.

## Rota ve geçmiş kayıtlar

Gönderimde mevcut `assessments` kaydına `questionEvidence` eklenir: soru/sürüm kimliği, seçilen/doğru cevap, sonuç ve ölçme etiketleri. `cleanEvidence` izin verilen alanları ve 120 soruluk sınırı uygular. Yedek/yeniden açılış doğrulaması ders–konu uyumunu ve toplamları kontrol eder; bilinmeyen alanlar saklanmaz.

Aynı testin aynı günkü son çözümü tek rota kanıtı olarak sayılır. Metadata, mevcut beceri analizi ve karar gerekçesine açıklama sağlar; ikinci bir performans günlüğü veya otomatik yanlış defteri kaydı üretmez. Rota öncelikleri, ONARIM/DENGE/İLERLEME eşikleri ve mastery hesabı korunur. Test sonucu 3/7 günlük tekrar görevlerini kendiliğinden tamamlamaz.

`sectionId`, `topicBreakdown`, ceza kuralı ve net, değerlendirme doğrulayıcısından geçer. Eskiden kaybolmuş konu kırılımları uydurulmaz. Bütün yollar en yeni 240 değerlendirmeyi korur. Üretilen rota hedefleri için üretici ve doğrulayıcı ortak 1.200 karakter sınırını kullanır. Eski sonuçlar yeni soru kanıtı taşımaya zorlanmaz.

## Çalıştırma ve teslim

```sh
npm test
npm run questions:audit
npm run questions:browser
node scripts/question-bank-geography-content.test.cjs
python3 scripts/question-bank-turkish-logic.test.py
node scripts/question-bank-manifest.mjs
node scripts/question-bank-export.mjs /istenen/cikti/klasoru
node scripts/question-bank-export.test.mjs /istenen/cikti/klasoru
```

Manifest ve dışa aktarım araçları tam onaylı banka gerektirir. Dışa aktarım altı çevrimdışı ders kitapçığı, bir başlangıç sayfası ve tam JSON oluşturur. Kaynak bağlantıları dışında kitapçıklar internet bağlantısı gerektirmez.

Yeni içerik revizyonlarında eski sonuçlar farklı cevap anahtarıyla yeniden puanlanmamalıdır; test sürümü ve geçmiş tanımları birlikte yönetilmelidir. Eski yazar betikleri incelemeden geçmiş nihai dosyaların üzerine çalıştırılmamalıdır.
