# Rota Motoru 2.0 — Karar Kalitesi Sözleşmesi

Bu belge, mevcut rota motorunu bozmadan daha açıklanabilir, kapasite-duyarlı ve kapalı döngü çalışan bir karar motoruna yükseltmek için uygulanacak davranış sözleşmesidir.

## Her rota kararının taşıması gereken kanıtlar

Her seçilen görev için motor aşağıdaki sinyallerden hangilerinin kararı etkilediğini izlenebilir biçimde açıklayabilmelidir:

- konu ustalığı / mastery ve kanıt tazeliği
- 3 ve 7 günlük tekrar zamanı
- açık veya tekrar eden yanlışlar
- son deneme / assessment konu riski
- kişisel normalden sapma ve performans trendi
- son görevlerin tamamlanma / aksama davranışı
- sınava kalan süre ve hedef baskısı
- öğrenci profili önceliği
- günlük gerçekçi kapasite
- ONARIM / DENGE / İLERLEME modu

## Karar kuralları

1. **Kanıt yoksa kesin konuşma.** Az örnekli sinyaller düşük güvenle işaretlenir; güçlü müdahale yalnızca yeterli kanıt veya kritik sınav riskiyle yapılır.
2. **Zayıflık tek başına yetmez.** Bir konuya ayrılan yük; zayıflık, güncellik, tekrar zamanı, sınav riski ve davranış sinyallerinin birleşiminden doğar.
3. **Kapasite sert sınırdır.** Kaçırılan görevler ertesi güne körlemesine yığılmaz. Günlük dakika bütçesi korunur; düşük değerli işler ötelenir.
4. **Aynı tür ağır yük yığılmaz.** Özellikle ağır sayısal görevler gün içine dengeli dağıtılır.
5. **ONARIM cezalandırma değildir.** Düşük doğruluk / tekrar eden hata görülünce görev küçülür, yöntem değişir ve kısa takip kanıtı istenir.
6. **İLERLEME kanıt ister.** Tek iyi oturum güçlü konu kabulü için yeterli değildir; farklı günlerde tekrarlanan kanıt aranır.
7. **Unutma hesaba katılır.** Daha önce iyi öğrenilmiş ama kanıtı bayatlayan konu, gerektiğinde kısa retention refresh alır.
8. **Yeni öğrenme eski döngüyü geçersiz kılabilir.** Yeni temel çalışma sonrası eski açık 3/7 tekrarları körlemesine taşınmaz.
9. **Davranış ile bilgi ayrılır.** Başarılı ama görev aksatan öğrenciye akademik onarım değil, daha uygulanabilir yük verilir.
10. **Her karar açıklanabilir olmalıdır.** Öğrenci arayüzündeki neden metni gerçek motor sinyallerinden üretilir; dekoratif veya rastgele gerekçe kullanılmaz.

## Beklenen öğrenci dili

Örnek:

> Problemler bugün öne çıktı: son denemelerde doğruluğun düşük, açık yanlışların var ve tekrar zamanın geldi. Günlük kapasiteni aşmamak için çalışma 35 dakika ile sınırlandı.

Bir başka örnek:

> Bu konu güçlü görünüyor ancak son güvenilir kanıtın eskidi. Uzun konu çalışması yerine kısa bir hatırlama kontrolü ekledim.

## Regresyon güvenlikleri

Rota Motoru 2.0 değişiklikleri aşağıdakileri bozamaz:

- 3/7 tekrar zinciri
- yeni öğrenme döngüsünün eski tekrarları geçersiz kılması
- günlük dakika bütçesi
- recovery / severe recovery davranışı
- konuya özgü çalışma yöntemleri
- deneme riskinin rota önceliğine etkisi
- mastery için çoklu kanıt gereksinimi
- Rota Hoca bağlamındaki routeDecision / studentModel verileri
- mevcut KPSS-only ve premium workspace akışları

## 2.0 doğrulama senaryoları

Motor en az şu öğrenci tiplerinde otomatik test edilmelidir:

1. Matematiği zayıf ama düzenli gelişen.
2. Akademik olarak güçlü ama görevleri aksatan.
3. Kendini iyi hissedip ölçümlerde düşük kalan.
4. Zorlanma hissi yüksek fakat doğruluğu iyi olan.
5. Hızlı öğrenen.
6. Düzenli çalışıp plato yapan.
7. Başlangıçta güçlü olup gerileyen.
8. Aksamadan sonra toparlanan.
9. Sınava az kalmış ve kritik konuda zayıf olan.
10. Güçlü ve dengeli öğrenci.
11. Birden fazla derste aynı anda açık yanlış biriktiren öğrenci.
12. Kapasitesi düşükken backlog oluşan öğrenci.

Başarı ölçütü yalnızca testlerin geçmesi değildir. Motorun seçtiği görevlerin **neden şimdi** sorusuna gerçek sinyallerle cevap vermesi, kapasiteyi aşmaması ve yeni kanıt geldikçe rotayı değiştirmesi gerekir.
