# Çalışma Rotası — KPSS üretim hazırlık raporu

Tarih: 24 Eylül 2026. İncelenen başlangıç: `f3224bf4a5f4b6a31bbed398ffb08c2cadcdf303`. Kapsam ilk sürümde KPSS; YKS eski yerel kayıt uyumluluğunda kaldı. Canlı siteye dağıtım ve main'e birleştirme yapılmadı.

**Karar:** Öğrenme, hesap ve Android altyapısı uygulanmış ve yerel otomatik senaryolarla doğrulanmıştır. Yayın için dış bağımlılıklar hâlâ vardır; bu rapor Play Store'a hazır olduğuna dair koşulsuz bir onay değildir. Gerçek öğrenci kullanım araştırması yapılmadı; aşağıdaki kanıtlar gerçek uygulama kodunu ve tarayıcıyı çalıştıran kontrollü öğrenci senaryolarıdır.

## 1. Başlangıçtaki kritik problemler

Gerçek kayıt/giriş ve kullanıcıya bağlı veritabanı yoktu. Giriş düğmesi yerel çalışma alanını açıyordu. Öğrenci geçmişi tek tarayıcıdaki LocalStorage'a bağlıydı; ikinci cihazdan geri getirilemiyordu. AI/ses uçları gerçek oturum aramıyor, ücretli sağlayıcı tüketimi hesap başına sınırlandırılmıyordu. Render yapılandırmasında kalıcı disk bulunmuyordu.

Rota motoru vardı ve gerçekten karar üretiyordu; ancak branş denemesi kanıtının bir kısmı konu tarihine/onarımına ulaşmıyor, yenilemede DecisionTrace kayboluyor, başarısız çalışmaya da 7 günlük tekrar üretilebiliyor ve 240 ölçüm sınırından çıkan kaynaklar eski görevleri yüklenemez hâle getirebiliyordu.

## 2. Göstermelik veya eksik sistemler

Hesap/uzak eşitleme, Konu Kurtarma ve soru bazlı Yanlış Laboratuvarı eksikti. Bilinmeyen başlangıç mastery değeri sıfır kabul edilerek yanıltıcı kazanım hesaplanabiliyordu. Rota Hoca kodu bulunmasına rağmen rota ve CSS tarafından gizleniyordu. Öğretmen kataloğu iç öğrenme döngüsünün yerini doldurmuyordu. Örnek panel ve satışa kapalı Plus sunumu gerçek kullanıcı verisi/ödeme olarak değerlendirilmedi.

## 3. Öğrenci analiz motoru değişiklikleri

Mevcut aday oluşturma, ders yöntemleri, kapasite ve öncelik motoru korundu. Saf `student-recovery.js` modülü konu ölçümlerini, branş kırılımlarını, görev sonuçlarını ve hata geçmişini birleştirir. Aynı testin aynı gün yeniden gönderimi bağımsız yeni kanıt gibi çoğaltılmaz. Kurtarma sonucu mevcut assessment ve rota yollarına bağlanır; ayrı bir demo veri deposuna yazılmaz.

## 4. Eksik tespiti

Ders → konu → alt konu/kazanım/beceri → doğru/yanlış/boş → hata nedeni zinciri kullanılır. Konu kurtarma için birden fazla ölçüm ve yeterli soru veya tekrar eden risk gerekir. Sıfır veride sistem teşhis koymaz; başlangıç ölçümü önerir. Serbest günlükte konu belirtilmemişse konu veya alt beceri uydurulmaz. Açıklamalarda kullanılan ölçüm sayısı, soru sayısı ve oranlar kayıtlardan gelir.

## 5. Mastery hesaplama mantığı

Ekranın tek mastery kaynağı mevcut `routeTopicMasteryScore` hesabıdır. Puan performans, ana çalışma, 3/7 kontrolü, kalıcılık, eğilim ve açık yanlışları değerlendirir; kanıt güveni ayrıca bildirilir. Kısa kontroller tam konu testleriyle aynı ağırlıkta değildir. Yeni modülün yumuşatılmış performansı ikinci bir mastery puanı gibi sunulmaz. Tek iyi/kötü sonucun etkisi ve veri yetersizliği test edilir; puan psikometrik olarak kalibre edilmiş bir başarı olasılığı değildir.

Kontrollü A örneğinde %45/%50/%55 sonuçlarından sonra temel mastery 27 idi; beş yeni soruluk 5/5 kurtarma sonrasında 39 oldu. Aynı anda konu “tam öğrenildi” sayılmadı; kısa onarım kapandı ve kalıcılık kontrolleri planlandı. Bu değerler belirli fixture'a aittir, her öğrenci için sabit değildir.

## 6. Yanlış Laboratuvarı

Sekiz neden desteklenir: bilgi, kavram, işlem, yorum, kronoloji, dikkat, zaman, yöntem. Öğrencinin belirttiği neden ile soru tipinden çıkarılan olası sorun açıkça ayrılır. Bir yanlış seçenekten dikkatsizlik veya zaman yönetimi teşhisi konmaz. Aynı beceride tekrar eden yanlışlar soru ve ölçüm kimlikleriyle açıklanır. Öğrenci gerçek yanlış/boş sorusuna neden ekleyebilir; bu kayıt rota motoruna gider ve yeniden girişte korunur.

## 7. ONARIM / DENGE / İLERLEME

ONARIM doğrulanmış açık için hedefli çalışma üretir. DENGE toparlanma ve normal çalışma arasında takip sağlar. İLERLEME yeterli kanıt olduğunda gereksiz onarımı azaltır. Günlük kapasite koruması ayrıca sürer. Karar etiketleri UI ve sözleşmede aynılaştırıldı. Bir günlük sınır geçişlerinin sürekli karar değişimine dönüşmesini önleyen mevcut koruma, doğrulanmış düşüş sürerken ONARIM'dan erken çıkmama koşuluyla güçlendirildi.

## 8. Konu Kurtarma

Akış: gerçek risk açıklaması → kısa konu desteği → çözümlü düşünme örneği → 3–5 soruluk kontrol → kayıt → yeni rota. Mikro içerik, onaylı bankadaki açıklama/kazanım/yaygın hata verisini kullanır. Örnek soru kontrolde sorulmaz. Taslak ve işaretlenmiş cevaplar hesap tercihleriyle saklanır. Bozuk konu/sürüm/tekrar kimliği olan taslak temizlenir; tamamlanmış ölçüm tekrar yazılamaz.

Konuya ait tüm sorular daha önce görülmüşse ekran bunu açıkça belirtir. En eski görülmüş sorularla düşük ağırlıklı pekiştirme sunar; bunu bağımsız yeni ölçüm gibi göstermez. Başarılı tekrar geçici DENGE ve kalıcılık takibi sağlar. Başarısız kontrol ONARIM'da kalır.

## 9. Deneme ve testlerin rotaya etkisi

256 konu testi ve 18 branş denemesinin konu/beceri kırılımları ortak analizde kullanılır. Branş sonucunun konu tazeliğine ve onarım adaylarına ulaşmaması düzeltildi. Sadece toplam ders neti girilmiş bir harici denemeden kesin konu teşhisi çıkarılmaz; mevcut ayrıntı kadar analiz yapılır. Ölçüm gönderimi rota yeniler; otomatik testler önce/sonra aday ve görev farkını doğrular.

## 10. Görev sonucunun sonraki plana etkisi

Görevde tamamlandı bayrağının yanında doğru/yanlış, çalışma miktarı, zorlanma ve gerçek çalışma tarihi kullanılır. Zayıf ve başarılı geri bildirim farklı tekrar/onarım yollarına gider. Aynı kurtarma ölçüm kimliğinin tekrar gönderilmesi ikinci sonuç üretmez; yeni bir test denemesi ayrı kayıt olabilir. Bugünün Planı'nda görev başlığı çalışmayı açar; uygun riskte doğrudan Konu Kurtarma'ya geçer.

## 11. 3/7 günlük tekrar

Tarihler gerçek tamamlanma gününden üretilir. 24 Eylül başarılı kurtarma fixture'ı 27 Eylül ve 1 Ekim kontrollerini oluşturdu. Başarısız temel çalışma, öğrenme doğrulanmadan 7. gün kontrolüne geçirilmez. Başarısız 3. gün sonucu 7. gün adayını engeller ve onarım değerlendirmesine kanıt ekler; tek sonuç her öğrenciyi otomatik ONARIM'a geçirmez. Kaynak kaldırıldığında bağlantılı açık tekrarlar güvenli şekilde yenilenir.

## 12. DecisionTrace ve “Neden bu görev?”

Görev nedenleri gerçek karar sinyallerinden türetilir; soru sayısı, ölçüm, mastery, trend, yanlış ve öncelik bilgileri korunur. Plan, karar ve müdahale kayıtlarındaki Trace alanları artık yedek/yenileme/eşitleme sınırını geçer. Bilinmeyen başlangıç değeri sıfır değildir; karşılaştırma çifti yoksa kazanım iddiası üretilmez. Her günlük görevde “Neden bugün?” görünürdür.

## 13. Rota Hoca entegrasyonu

Rota Hoca korundu ve görünür menü/çalışma alanı geri getirildi. Sınav, aktif konu/görev, mastery, son hatalar ve planın sınırlı özeti kullanılır. Fotoğraf/metin yalnız gönderimle sağlayıcıya gider. Hesap veya sınav değişirken bekleyen yanıt, ses, fotoğraf ve dikte eski hesaptan yeni hesaba taşınamaz. Eksik sağlayıcı yapılandırması dürüst hata verir; hazır bir yanıt üretilmez.

Android kamera/sistem fotoğraf seçimi ve sistem diktesi bağlandı. Gerçek AI cevabı, ses kalitesi ve fiziksel cihaz kamera/mikrofon davranışı henüz doğrulanmadı. Test sağlayıcıları yerel sahtedir; gerçek ücretli çağrı veya e-posta gönderilmedi.

## 14. Ders Hocaları temizliği

Paketlenmiş öğretmen isimleri, öğretmen/kanal seçimleri, profil ve öneri yardımcıları çekirdek katalogdan kaldırıldı. Soru kütüphanesi doğrudan uygulama içindeki ders, konu ve testleri açar. Eski kişisel kaynak bağlantıları, notlar ve kaldığı süre uyumluluk için korunur; yeni rotanın şartı değildir. Rota Hoca, dış öğretmen dizininden ayrı bir özelliktir.

## 15. Veri kalıcılığı

SQLite WAL/transaction tabanlı hesap çalışma alanı, sunucu revision'ı ve karşılaştırmalı yazma eklendi. Her hesaba ayrı yerel kuyruk vardır; misafir geçmişi açık aktarım olmadan hesaba bağlanmaz. Bağımsız değişiklikler birleştirilir; aynı alan çakışması öğrenciye gösterilir. Ağ kesintisi, belirsiz tekrar, iki cihaz, iki sekme ve eşitlenmemiş veride çıkış testleri mevcuttur. Onboarding adımı da kaydedilir; başka cihazda devam edilebilir.

Yerel DB yeniden başlatma ve ayrı yola yedek geri yükleme testleri geçti. **Canlı Render diski oluşturulmadı.** Üretim mutlak kalıcı DB yolu ve HTTPS origin olmadan başlamaz. Mevcut tasarım bir uygulama örneği ve bir disk içindir; birden fazla bağımsız SQLite ile yatay ölçekleme desteklenmez.

## 16. Authentication ve güvenlik

Parolalar scrypt ile türetilir; sunucuda ham parola tutulmaz. Tarayıcıda HttpOnly/Secure/SameSite oturum, native'de Keystore ile şifrelenen opak bearer token vardır. CSRF/Origin/JSON kontrolü, kullanıcı izolasyonu, veri sınırları, idempotency ve rate/quota koruması eklendi. Hesap değiştiren başka sekmenin cookie'si eski çalışma alanına yetki vermez.

Parola yenileme/e-posta doğrulama: amaç bağlı, hash'lenmiş, süreli ve tek kullanımlık token. Parola değişince eski oturumlar iptal edilir. E-posta bağlantısı açılınca token otomatik tüketilmez, tarayıcı URL'sinden temizlenir. Geliştirici/işletmeci **Yasin Koç**, iletişim adresi `mehmetsaitkoc113@gmail.com` olarak eklendi; bu adres bir doğrulanmış gönderici alanı kabul edilmedi. Hesap dışa aktarma ve şifreyle onaylanan silme hem uygulamada hem bağımsız web sayfasında bulunur.

## 17. Android / Play Store hazırlığı

Capacitor kabuğu, Android projesi, ikon/splash, safe area, klavye, geri tuşu, lifecycle/network, dosya paylaşımı, fotoğraf ve dikte entegrasyonu eklendi. Node 24.21, JDK 21, SDK 36; min SDK 24, target/compile SDK 36. Eski WebView için anlaşılır güncelleme ekranı var. Minimum işletim sistemi değeri bütün cihazların test edildiği anlamına gelmez.

Gizlilik/veri silme sayfaları ve Data Safety veri akışı taslağı repodadır. Gerçek sağlayıcı/saklama/yedek silme politikaları ve canlı sayfa doğrulaması tamamlanmadan mağaza başvurusu yapılmamalıdır. Ayrıntı: [Android hazırlığı](android-release.md), [Play kontrolü](play-store-readiness.md).

## 18. Otomatik testler ve gerçek senaryo kanıtı

| Senaryo | Gözlenen davranış |
| --- | --- |
| A: Problemler %45 / %50 / %55 | ONARIM; mikro içerik, ayrı örnek, beş yeni soru; 5/5 sonrasında aynı anlık onarım kapanır, 3/7 tarihi oluşur |
| A başarısız kontrol | ONARIM sürer; yanlış nedeni soru kaynağıyla kaydedilir |
| B: %90 / %95 / %95 | Otomatik kurtarma açılmaz; performans ilerlemeyi destekler, uzun dönem kalıcılık ayrıca izlenir |
| C1: matematik %45 / tarih %90 / paragraf %70 | Konu kanıt modları ONARIM/İLERLEME/DENGE; günün ilk hedefli görevi matematik Problemler, 30 dakika. Orta paragraf için onarım üretilmez |
| C2: matematik %90 / tarih ve paragraf %45 | İlk hedefli görevler tarih ve paragraf, 25'er dakika; önceki öğrenciyle aynı plan değildir |
| Veri yok | Teşhis yerine güvenli başlangıç ölçümü |
| 48 sorunun tamamı görülmüş | Etiketli pekiştirme; yeni bağımsız ölçüm iddiası yok |
| Yenileme / ikinci cihaz / offline | Sonuç ve taslak korunur; çakışmada sessiz üzerine yazılmaz |

İstenen orta paragraf düzeyli C1 birleşimi, üç gün her dersten 20 soruda 9/18/14 doğru ile gerçek motor üzerinde çalıştırıldı. C2'de aynı sırayla 18/9/9 doğru kullanıldı. `Exact C1 middle-paragraph profile changes real today priorities against C2` senaryosu farklı günlük öncelikleri ve orta paragrafın DENGE'de kalmasını doğrular.

52 deterministik yeni motor senaryosu; 30 stres profili; 27 plan simülasyonu; 12 çok günlük yolculuk; 10×14 ve 18×60 kapalı döngü günlük karar simülasyonu. Hesap/güvenlik/mail/öğretmen ve gerçek Chromium akışları ayrı paketlerdir. Ayrıntılı kabul eşlemesi: [öğrenci motoru kanıtları](student-recovery-evidence.md).

Soru bankası korunmuştur: **6 ders, 64 konu, 256 konu testi, 3.072 tekil onaylı soru, 18 branş denemesi**. Her konuda 4×12 yapı tamdır. Branşlarda bankadan 360 soru kullanımı vardır; toplam tekil soru sayısına tekrar eklenmez. Yapısal, tekrar/metadata ve matematik kontrolleri akademik alan uzmanı incelemesinin yerine geçmez.

## 19. CI / build sonuçları

Yerel tam `npm test`, uçtan uca tarayıcı testi, görsel kontrol ve yeni davranış testleri geçti. GitHub workflow'ları Node/npm kilidine bağlandı; hesap, kurtarma, mobil ve Android teknik paket adımları eklendi. Uzak CI ve son native build sonucu teslim kanıt dosyasında ayrıca belirtilir. Test başarısı canlı Render ortamının hazır olduğunu kanıtlamaz.

## 20. Release AAB

Gerçek Gradle release AAB üretim yolu vardır. İmzasız teknik geliştirme AAB'si, geçici `app.rotasi.development` kimliğiyle üretilir. Kalıcı Play kimliği ve upload signing key belirtilmediği için bu paket doğrudan mağazaya yüklenecek nihai ürün diye sunulmaz. Script, geçici kimlikle veya eksik imza değişkenleriyle imzalı yayın girişimini reddeder. Son paket hash'leri teslim manifestinde bulunur.

## 21. Kalan production blocker'lar

1. Kalıcı barındırma/veritabanı diski, gerçek yeniden dağıtımda kayıt koruma, işletim yedeği ve restore/silme politikası.
2. Kalıcı Android application ID, Play Console/signing sahipliği ve gerçek upload anahtarıyla imzalı AAB.
3. Fiziksel Android telefon yok: kamera, dikte, izin iptali, arka plan, gerçek ağ ve cihaz/OEM davranışı doğrulanamadı.
4. Gerçek AI/ses modeli erişimi ve kalite testi; mail sağlayıcı anahtarı/doğrulanmış gönderici ve teslim testi.
5. Sağlayıcı/saklama bilgileri, canlı gizlilik ve hesap silme URL'leri, Play Data Safety/hedef kitle/içerik derecesi ve mağaza incelemesi.
6. Plus satışı kapalıdır; ödeme/Billing uygulanmadı. İlk ücretsiz sürümde çalışan çekirdek açıktır; ücretli satış açılmadan ayrı ödeme entegrasyonu gerekir.

Bu maddeler tamamlanmadan “Play Store'da yayınlanmaya hazır” denmez. Kod bu bağımlılıkları sessizce varmış gibi kabul etmez.

## 22. Önemli dosyalar

`public/index.html`, `student-recovery.js`, `recovery-ui.js`, `recovery-content.js`, `recovery.css`, `route-contracts.js`, `account-client.js`, `account-sync.js`, `teacher-context.js`; `server.mjs`, `server/{accounts,store,validation,mail}.mjs`; gizlilik ve hesap sayfaları; `native/`, `android/`, `capacitor.config.json`; `scripts/*recovery*`, `*account*`, `*android*`, `onboarding-resume-browser.test.mjs`; üç CI workflow'u ve işletim dokümanları.

## 23. Branch

`codex/production-student-recovery`. Main ve canlı uygulama değiştirilmedi. Değişiklikler ayrı inceleme isteğiyle sunulur.

## 24. Son commit ve teslim kanıtları

Commit SHA, PR, son CI, paket hash'leri ve test kayıtları aynı teslimdeki `teslim-durumu.json` dosyasında tutulur. Raporun kendi commit kimliğini içine yazmak döngü oluşturacağından bu alan dış teslim manifestine bırakılmıştır.

Ürün vaadinin kod karşılığı: Öğrencinin eksik noktasını mevcut kanıt kadar belirle; nedenini ölçüm ve doğrulanmış hata kaydıyla açıkla; hedefli desteği uygula; sonucu ölç; sonraki rotayı güncelle. Bilinmeyeni veri diye gösterme.
