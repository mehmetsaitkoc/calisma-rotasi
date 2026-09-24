# Öğrenci motoru ve Konu Kurtarma: uygulama kanıtı

Doğrulama tarihi: 24 Eylül 2026. İlk etkin kapsam KPSS’dir. YKS’nin eski veri biçimi korunur; yeni kurtarma akışı YKS derslerini etkinleştirmez. Bu belge çalışan karar kurallarını ve testlerini açıklar; puanlar, deneysel olarak doğrulanmış öğrenme veya sınav başarısı olasılığı değildir.

## Veri ve karar akışı

`public/student-recovery.js` içindeki saf `topicEvidence` ve `snapshot` fonksiyonları tarih, çalışma alanı ve konu kimliğini girdi alır. DOM, depolama veya ağ kullanmaz. Kaynaklar gerçek konu testleri, branş denemesinin konu dilimleri, doğru/yanlış bilgisi bulunan görev kayıtları, öğrenci tarafından bildirilen yanlışlar ve kurtarma mini kontrolleridir.

`public/index.html` içindeki `routeRecoverySnapshot` bu kanıtı mevcut motora bağlar. `routeStudentModel`, `routeAppliedDecisionFromSignals`, `routeBuildCandidates` ve `routeRebalance` günlük rotayı üretir. Önceki günlük kapasite, sınav kotaları ve yük sınırları korunur. Karar kimlikleri `repair`, `steady`, `progress` olarak kalır; öğrenciye ONARIM, DENGE ve İLERLEME gösterilir. Kapasiteyi hafifletme kararı ayrıca açıklanır.

`routeRecordRecoveryAssessment` gerçek ölçümü doğrular ve yalnız bir kez ekler. Başarılı kontrol aynı acil onarımı yeniden üretmez; eski yanlış kayıtlarını silmez. Sonraki kanıt yeniden zayıflarsa eski sonuç korunarak yeni kurtarma oturumu açılır. `routeRecordQuestionMistake` yalnız gerçek yanlış/boş soruya ve öğrencinin seçtiği hata türüne bağlı kayıt oluşturur. Aynı assessment/soru çifti ikinci kez eklenmez.

## Ölçümün anlamı ve belirsizlik

- Son 28 günlük performans yakınlık ve soru sayısıyla ağırlıklandırılır. Aynı formun aynı gündeki son denemesi bir ölçüm olarak sayılır. Gelecek tarihli veri onarımı tetiklemez. Branş sonucu yalnız ilgili konunun gerçek soru sayısıyla hesaba katılır.
- Bir yeni ölçüm yumuşatılmış performans tahminini en fazla 22 puan değiştirebilir. Tek ilk sonuç 39–61 aralığını aşmaz; güveni en çok 35 olur. Tek kötü sonuç otomatik tekrarlayan eksik tanısı, tek iyi sonuç güçlü öğrenme kararı üretmez.
- **Konu ustalığı** ekranda yalnız `routeTopicMasteryScore` sonucudur. Bu sayı performansla birlikte ana çalışma, 3/7 kontrolleri, kalıcılık, trend ve açık yanlışları kullanır. Saf modülün yumuşatılmış performansı ikinci bir ustalık sayısı gibi gösterilmez. Yüksek test doğruluğu, henüz kalıcılık kanıtı yoksa yüksek ustalık anlamına gelmez.
- `confidence` bir başarı olasılığı değildir; mevcut kanıt miktarı/çeşitliliği ve güncelliğine ilişkin kural tabanlı göstergedir. Kanıt yokken ustalık tahmini `null`, mod `collect` ve güven 0’dır. Bilinmeyen learning-gain başlangıcı sıfıra çevrilmez.
- Bilgi, kavram, işlem, yanlış yorumlama, kronoloji, dikkat, zaman ve yöntem ayrı hata türleridir. Öğrenci bildirimi `reported`, soru becerisinden yapılan tahmin `inferred` olarak tutulur. Bir yanlış şıktan dikkat veya zaman sorunu uydurulmaz. İki farklı hata türü tek tekrarlayan hata olarak birleştirilmez.
- `sourceAssessmentId`, `questionId`, `questionVersion`, `source:'question-bank'`, `inferred:false` gerçek soru için öğrencinin hata bildirimini izler. Soru sürümü değişmişse eski yanlışa yeni sürümün açıklaması bağlanmaz.

## Kurtarma içeriği ve tüketilmiş soru havuzu

`recovery-content.js` yalnız yayınlanmış, beş tekil seçenekli ve geçerli tek cevap anahtarı olan banka sorusunun açıklamasını kullanır. Ders yöntemi ile ölçülen beceriye uygun düşünme adımı ayrıdır. Mikro bölümde kullanılan açıklamanın ilk adımı açıkça “Örneğin kilit adımı” olarak sunulur; otomatik üretilmiş kapsamlı bir ders özeti iddiası yoktur. Soru içeriğinin doğruluğu ayrıca bankanın mevcut bağımsız inceleme kayıtlarına dayanır.

`recoveryPlan` 3–5 onaylı soru seçer. En az üç yeni soru kaldıysa yalnız bunlar kullanılır. Üçten az kaldığında daha önce en eski görülen sorularla pekiştirme sağlanır. `excludedQuestionIds` çözümlü örneği kontrol dışında tutar. `practice` ve `reusedQuestionIds` sonucu ve yedeğiyle birlikte kalır. UI açıkça “Daha önce gördüğün sorularla pekiştirme; bağımsız yeni ölçüm değil” der. Soru bankasına yeni soru eklenmez ve özgün soru sayısı artmış gibi gösterilmez.

Tekrar kullanılan kontrolün yumuşatılmış performans ağırlığı `.30`, yeni kısa kontrolün `.65` değeridir. Eski motorun kısa pratik sinyalinde tekrar ağırlığı ayrıca yarıya iner. Başarılı pekiştirme yalnız **geçici DENGE** verir; güçlü ustalık veya yeni bağımsız ölçüm ilan etmez. 3/7 kontrolleri gerekir. Başarısız kontrol ONARIM’da kalır.

## Somut A/B/C örnekleri

Aşağıdaki deterministik örnekler 24 Eylül 2026 tarihinde, başlangıçta ana çalışma/kalıcılık kaydı olmayan çalışma alanında çalıştırıldı. “Ustalık” ana motorun ekran puanıdır; yanındaki yumuşatılmış performans yalnız teknik kanıt açıklaması içindir.

| Örnek | Gerçek girdiler | Karar ve sonuç |
| --- | --- | --- |
| A | Üç ayrı günde 20’şer soru; 9, 10, 11 doğru: %45, %50, %55 | ONARIM; kurtarma gerekli; yumuşatılmış performans 50, konu ustalığı 27/100. Aynı hata türünün tekrarı ayrıca raporlu/çıkarılmış kaynak ayrımıyla test edilir. |
| A + yeni mini | Yukarıdaki geçmişten sonra 5/5 yeni soruluk başarılı kontrol | DENGE; yumuşatılmış performans 54, ustalık 39/100; konu tamamlandı yapılmaz. 3. gün 27 Eylül, 7. gün 1 Ekim. |
| A + pekiştirme | Aynı geçmişten sonra 5/5 daha önce görülmüş soruluk kontrol | Geçici DENGE; yumuşatılmış performans 52, ustalık yuvarlama nedeniyle yine 39/100. Daha düşük ağırlık daha düşük tahmin üretir; her durumda tam puan farkı görünmesi garanti değildir. |
| B | Üç günde 18, 19, 19 / 20 doğru: %90, %95, %95 | Saf kanıt modu İLERLEME, otomatik kurtarma yok. Yumuşatılmış performans 73; ana çalışma/kalıcılık eksik olduğu için ustalık 37/100. Bu yüzden İLERLEME “konu kesin öğrenildi” demek değildir. |
| C1: istenen orta paragraf profili | Üç gün matematik %45; tarih %90; paragraf %70 | Konu kanıt modları sırasıyla ONARIM/İLERLEME/DENGE. Bugünkü ilk hedefli görev matematik konu onarımı, 30 dakika; tarih ve paragraf için onarım üretilmez. |
| C2 | Üç gün matematik %90; tarih ve paragraf %45 | Bugünkü rotada tarih ve paragraf için ayrı 25’er dakika konu onarımı; matematik onarımı yok. Öğrenciler aynı planı almıyor. |

İstenen C1 profili “matematik zayıf, tarih güçlü, paragraf orta” yeni `Exact C1 middle-paragraph profile changes real today priorities against C2` senaryosunda birleşik olarak çalıştırıldı. Üç gün boyunca her dersten 20 soruda C1 için 9/18/14, C2 için 18/9/9 doğru kullanıldı. Gerçek `routeRebalance` çıktısında C1'in ilk hedefli görevi matematik, C2'nin ilk iki hedefli görevi tarih ve paragraftır. C1 paragrafı DENGE'de kalır. Yukarıdaki sayılar fixture çıktılarıdır; soru becerileri, açık yanlışlar, çalışma ve kalıcılık geçmişi eklendiğinde ustalık ve rota değişir.

## Tam 20 kabul senaryosunun test eşlemesi

`S` = `scripts/student-recovery.test.mjs`; `R` = `scripts/recovery-browser.test.mjs`; `U` = `scripts/recovery-ui.test.mjs`; `A` = `scripts/account-client-browser.test.mjs`.

| # | Kabul senaryosu | Somut test ve uygulama bağlantısı |
| --- | --- | --- |
| 1 | Verisiz güvenli başlangıç | S: `No data is unknown, never fabricated failure`; R: no-data ekranı. `snapshot`, `home`. |
| 2 | Zayıf öğrenci ve tekrarlayan risk | S: `45/50/55 repeated weak measurements select repair`, `Real engine weak measurements produce a repair candidate with actual trace evidence`; R: A akışı. `snapshot`, `routeMiniRepairSignals`. |
| 3 | Orta öğrenci DENGE | S: `Middle performance preserves steady dose`. `snapshot`. |
| 4 | Güçlü öğrenciye gereksiz kurtarma açılmaması | S: `Strong evidence does not trigger recovery`, `No recovery content is generated for a strong learner`; R: B ekranı. `snapshot`, `recoveryPlan`. |
| 5 | Tek iyi/kötü ölçümün sınırlı etkisi | S: `One bad result cannot auto-diagnose recurring risk`, `One perfect result cannot declare mastery`, `One outlier changes smoothed mastery by at most 22 points`. `snapshot`. |
| 6 | Son test, geçmiş, doğru/yanlış/boş ve örnek sayısı | S: `Latest same-form same-day attempt is counted once`, `Blank answers remain distinct evidence`, `Future and stale-only evidence cannot trigger recovery`. `topicEvidence`. |
| 7 | Tekrarlayan hata ve dürüst hata etiketi | S: `Reported errors and inferred question patterns stay separate`, `Two unrelated reported errors are not one repeated pattern`, `Wrong Lab binds only a real wrong or blank question and deduplicates its report`; R: Wrong Lab. `errorPatterns`, `routeRecordQuestionMistake`. |
| 8 | Deneme sonrası gerçek rota değişimi | S: `Real branch exam weak topic changes route and its link survives reload`, `Branch results are measured at their actual topic counts`. `routeAssessmentSamples`, `routeBuildCandidates`. |
| 9 | Görev tamamlanma kutusu yerine performans etkisi | S: `Actual task performance changes followup and failed learning has no day-seven task`. `routeSessionPerformanceSignal`, `routeRebalance`. |
| 10 | A/B ve karşıt ders profillerine farklı plan | S: `Exact C1 middle-paragraph profile changes real today priorities against C2`, `Opposite measured subject profiles produce different real daily plans`, `Topic and subject isolation prevents cross-student-style decisions`. Gerçek `routeRebalance`, C1 (%45/%90/%70) ile C2 (%90/%45/%45) için farklı ilk görevleri üretir; C1'in orta paragrafına onarım vermez. |
| 11 | Kurtarmanın koşullu ve gerçek içerikle açılması | S: `Recovery plan uses 3–5 deterministic approved new questions`, `Insufficient reviewed content has no invented fallback`; U: onay/şık/cevap ve beceri açıklaması. `recoveryPlan`, `RotaRecoveryContent.build`. |
| 12 | Mini kontrolün gerçek assessment/mastery/rota etkisi | S: 3, 4 ve 5 soruluk `mini control produces actual assessment and evidence` ve `Three-question recovery reaches the existing practice signal at reduced weight`; R: 5 gerçek cevap. `scoreRecovery`, `routeRecordRecoveryAssessment`. |
| 13 | Başarıdan sonra aynı acil onarımın tekrarlanmaması | S: `Real recovery route removes obsolete repairs, advances other topics and schedules anchored 3/7`, `Successful recovery supersedes old repeated mistake risk without erasing history`; R: A sonrası onarım düğmesi yok. |
| 14 | Başarısız kurtarmanın ONARIM’da kalması | S: `Failed mini control remains repair and does not mark topic learned`; R: failure/restart. `snapshot`, `page`. |
| 15 | Gerçek tamamlanma tarihinden 3/7 ve başarısız öğrenme engeli | S: `Review anchors use actual completion date, not scheduled date`, `Failed learning cannot unlock blind seven-day retention`, `A failed day-three retention check closes day seven even after a successful recovery base`. `routeReviewAnchorDate`, `routeReviewLearningConfirmed`. |
| 16 | Gerçek DecisionTrace ve yedek kalıcılığı | S: `Plan and intervention traces survive reload with unknown fields dropped`, `Real trace uses repeated same-error evidence, never unrelated mistake count`, `Unknown baseline cannot become zero or helpful learning gain`, `Trace sanitizer cannot persist infinite scores or capacities`. `decisionTrace`, `validateBackup`. |
| 17 | Kısmi oturuma devam, bozuk taslak ve çift kayıt engeli | S: `Recovery submit is idempotent and creates only one successful base`, `Recovery rejects cross-topic identity and mismatched answer evidence before writes`; R: konu/çift soru/sürüm/örnek bozulması, kısmi cevap ve tamamlanmış sonucu tekrar yazamama. `material`, `routeRecordRecoveryAssessment`. |
| 18 | Yeni risk geldiğinde eski sonucu koruyarak yeniden kurtarma | R: `later risk` grubu; S: başarıdan sonra tarihli yeniden açılan yanlış. `open`, `snapshot`. |
| 19 | Tüm sorular çözülmüşken dürüst ve daha düşük ağırlıklı pekiştirme | S: `All 48 seen questions still yield an honest practice control excluding the worked example`, `Only fewer than three fresh questions enables reuse`, `Successful reused control has lower mastery weight and provisional DENGE with durable 3/7`, `A practice-only recovery cannot inherit the old progress hysteresis label`; R: exhausted topic. |
| 20 | Logout/login, farklı cihaz ve öğrenci verisi korunması | A: açık misafir aktarımı, logout/login, offline yazma, CAS birleşimi, açık çakışma seçimi, eski sekme cache koruması, A/B cookie izolasyonu, expiry→login, silmede hesap cache temizliği. `account-client`, `account-sync`, root hesap adaptörü ve backend session eşleşmesi. |

## Son regresyon sonucu ve sınırlar

- **52 deterministik öğrenci motoru senaryosu PASS.** Son senaryo istenen orta paragraf düzeyli C1 ile C2'nin gerçek günlük plan önceliklerini karşılaştırır. Ayrı ONARIM regresyonu, hâlâ iki doğrulanmış düşüş sinyali, yüksek güven ve %70 veya altında performans varsa tek günlük puan dalgalanmasının kararı ters çevirmemesini doğrular. Daha iyi performans, düşüşün bitmesi veya başarılı kurtarma çıkışı serbest bırakır.
- Mevcut route smoke, sözleşmeler, recovery UI sözleşmesi ve account-sync testleri PASS. Kapasite ve eski motor kontrolleri kaldırılmadı.
- Kapalı döngüde **10 öğrenci × 14 gün = 140**, uzun dönemde **18 öğrenci × 60 gün = 1.080** günlük döngü PASS. Başarısız 3. gün kontrolünü dikkate alan yeni kuralın açığa çıkardığı bir günlük ONARIM→DENGE→ONARIM salınımı giderildi; sıfır salınım assertion’ı gevşetilmedi.
- Recovery ve hesap akışları gerçek Chromium ile yalnız geçici yerel SQLite üzerinde çalıştırıldı. Kurtarma testi 390 px dikey ve yatay görünüm, native geri davranışı ve yenilemeden sonra kalıcılığı içerir. Pageerror listeleri boştur. Hesap testi native genel bağlantılarının HTTPS API kökünü kullanmasını navigasyon yapmadan doğrular.
- Tam bir 28/60 günlük gerçek öğrenci etkililik çalışması yapılmadı. Simülasyonlar uygulama davranışı/regresyon kanıtıdır. Genel deneme kaydında konu kırılımı yoksa motor o derse etki eder; var olmayan konu veya soru hatası uydurmaz.

Tekrar çalıştırma: `npm run student-recovery:test`, `node scripts/recovery-ui.test.mjs`, `node scripts/recovery-browser.test.mjs`, `node scripts/account-client-browser.test.mjs`, `node scripts/route-engine-closed-loop.mjs`. Tarayıcı testleri kurulu Playwright Chromium, Node 24.21 ve yerel loopback erişimi gerektirir; kendi geçici veritabanlarını oluşturup temizler.
