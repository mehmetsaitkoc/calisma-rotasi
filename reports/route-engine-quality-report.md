# Route Engine — 60 Günlük Motor Quality Report

**Snapshot:** 2026-09-19T15:19:36.940Z  
**Kaynak branch:** `gpt/route-engine-evidence-balance`  
**Kaynak SHA:** `cb0b046faab6722c44148bc4740a7208aab5073c`  
**CI:** Route Engine CI #217 — SUCCESS  
**Test kapsamı:** 18 persona × 60 gün = 1080 günlük kapalı döngü

## Yönetici özeti

Bu rapor gerçek kullanıcı başarısını kanıtlamaz. Sentetik uzun dönem yaşam döngülerinde motorun karar tutarlılığını, kanıt eskimesini, mastery/forgetting davranışını ve müdahale sonuçlarını denetler.

- Ortalama 60 günlük stability score: **93/100**
- Mode bounce: **0**
- Zararlı müdahale olayı: **0**
- Zararlı 7/14/30 günlük müdahale ufku: **0**
- Mastery regression: **0**
- Duplicate retention-refresh routeKey: **0**
- En yüksek stale-evidence etkisi: **5 puan**
- Yetersiz takip ufku: **10**
- Persona fazı nedeniyle confounded ufuk: **15**
- Durum dağılımı: **10 GÜÇLÜ · 8 İZLE · 0 BLOKER**

### Kalite kapısı

**GEÇTİ** — Sentetik 60 günlük kalite kapısında bloker bulunmadı.

Bu sonuç kontrollü gerçek kullanıcı pilotuna geçiş için teknik bir güvenlik/istikrar sinyalidir; pedagojik etki ve gerçek öğrenci başarısı için pilot verisi hâlâ gereklidir.

## Persona özeti

| Persona | Durum | 60g final state | Stability | Risk | Tamamlanan konu | Müdahale olayı | Kanıt açığı | Not |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Matematiği zayıf ama düzenli gelişen | GÜÇLÜ | GELİŞİM | 90 | 26 | 6 | 2 | 1 | mod bounce yok, uzun ONARIM dönemi, uzun GELİŞİM dönemi |
| Başarılı ama görevleri aksatan | GÜÇLÜ | DENGELİ | 100 | 21 | 8 | 0 | 0 | mod bounce yok, stability 100, gereksiz müdahale üretmedi / geri test yok |
| Rahat hissedip düşük doğruluk yapan | İZLE | GELİŞİM | 90 | 21 | 6 | 2 | 4 | mod bounce yok, uzun dönem kanıt açığı |
| Zorlanıyor ama yüksek doğruluk yapıyor | GÜÇLÜ | DENGELİ | 100 | 15 | 6 | 0 | 0 | mod bounce yok, stability 100, gereksiz müdahale üretmedi / geri test yok |
| Hızlı öğrenen | İZLE | DENGELİ | 85 | 16 | 6 | 2 | 0 | mod bounce yok |
| Çalışıyor ama plato yapan | GÜÇLÜ | DENGELİ | 100 | 46 | 2 | 0 | 0 | mod bounce yok, stability 100, gereksiz müdahale üretmedi / geri test yok |
| Başta güçlü olup düşüşe geçen | GÜÇLÜ | ONARIM | 95 | 38 | 6 | 1 | 2 | mod bounce yok |
| İlk hafta aksatıp sonra toparlanan | İZLE | DENGELİ | 80 | 20 | 6 | 2 | 3 | mod bounce yok, uzun dönem kanıt açığı |
| Sınava çok az kalmış ve matematiği zayıf | İZLE | DENGELİ | 95 | 50 | 2 | 1 | 0 | mod bounce yok, uzun ONARIM dönemi, final risk yüksek |
| Güçlü ve düzenli | GÜÇLÜ | DENGELİ | 100 | 21 | 6 | 0 | 0 | mod bounce yok, stability 100, gereksiz müdahale üretmedi / geri test yok |
| Geç açılan öğrenci | GÜÇLÜ | DENGELİ | 95 | 17 | 6 | 1 | 1 | mod bounce yok, uzun ONARIM dönemi |
| Başarı sonrası tükenme | İZLE | SÜRDÜRÜLEBİLİR | 85 | 16 | 10 | 2 | 4 | mod bounce yok, uzun dönem kanıt açığı |
| Yanlış güvenini düzelten | GÜÇLÜ | DENGELİ | 95 | 18 | 6 | 1 | 1 | mod bounce yok, uzun ONARIM dönemi |
| Toparlanıp tekrar düşen | İZLE | DENGELİ | 85 | 43 | 2 | 2 | 5 | mod bounce yok, uzun dönem kanıt açığı |
| Eski kötü denemeyi yeni güçlü denemeyle güncelleyen | İZLE | DENGELİ | 85 | 13 | 6 | 2 | 2 | mod bounce yok, yeni deneme eski kanıtı geçti |
| Uzun süre güçlü ve dengeli | GÜÇLÜ | DENGELİ | 100 | 17 | 6 | 0 | 0 | mod bounce yok, stability 100, gereksiz müdahale üretmedi / geri test yok |
| Yavaş ama kalıcı gelişen | İZLE | DENGELİ | 85 | 24 | 5 | 2 | 2 | mod bounce yok |
| Günlük dalgalı uzun dönem stabil | GÜÇLÜ | DENGELİ | 100 | 36 | 3 | 0 | 0 | mod bounce yok, stability 100, gereksiz müdahale üretmedi / geri test yok |

## Özellikle izlenecek personelar

### Toparlanıp tekrar düşen — İZLE

- Final state: **DENGELİ**
- Stability: **85/100**, bounce: **0**
- Final risk: **43**, learningNeed: **24**, confidence: **98**
- Longest repair/progress streak: **18 / 0 gün**
- Müdahale geri testi: **0 başarılı · 2 nötr · 0 zararlı**
- Takip kanıtı: **1 yetersiz · 4 confounded**
- Forgetting refresh: **3**, konu başına maksimum **1**
- Değerlendirme: mod bounce yok, uzun dönem kanıt açığı

### Başarı sonrası tükenme — İZLE

- Final state: **SÜRDÜRÜLEBİLİR**
- Stability: **85/100**, bounce: **0**
- Final risk: **16**, learningNeed: **14**, confidence: **85**
- Longest repair/progress streak: **0 / 7 gün**
- Müdahale geri testi: **0 başarılı · 2 nötr · 0 zararlı**
- Takip kanıtı: **1 yetersiz · 3 confounded**
- Forgetting refresh: **15**, konu başına maksimum **2**
- Değerlendirme: mod bounce yok, uzun dönem kanıt açığı

### Rahat hissedip düşük doğruluk yapan — İZLE

- Final state: **GELİŞİM**
- Stability: **90/100**, bounce: **0**
- Final risk: **21**, learningNeed: **2**, confidence: **88**
- Longest repair/progress streak: **16 / 8 gün**
- Müdahale geri testi: **1 başarılı · 1 nötr · 0 zararlı**
- Takip kanıtı: **2 yetersiz · 2 confounded**
- Forgetting refresh: **2**, konu başına maksimum **1**
- Değerlendirme: mod bounce yok, uzun dönem kanıt açığı

### İlk hafta aksatıp sonra toparlanan — İZLE

- Final state: **DENGELİ**
- Stability: **80/100**, bounce: **0**
- Final risk: **20**, learningNeed: **12**, confidence: **85**
- Longest repair/progress streak: **0 / 6 gün**
- Müdahale geri testi: **1 başarılı · 1 nötr · 0 zararlı**
- Takip kanıtı: **0 yetersiz · 3 confounded**
- Forgetting refresh: **6**, konu başına maksimum **2**
- Değerlendirme: mod bounce yok, uzun dönem kanıt açığı

### Eski kötü denemeyi yeni güçlü denemeyle güncelleyen — İZLE

- Final state: **DENGELİ**
- Stability: **85/100**, bounce: **0**
- Final risk: **13**, learningNeed: **5**, confidence: **90**
- Longest repair/progress streak: **16 / 5 gün**
- Müdahale geri testi: **2 başarılı · 0 nötr · 0 zararlı**
- Takip kanıtı: **1 yetersiz · 1 confounded**
- Forgetting refresh: **4**, konu başına maksimum **2**
- Değerlendirme: mod bounce yok, yeni deneme eski kanıtı geçti

### Yavaş ama kalıcı gelişen — İZLE

- Final state: **DENGELİ**
- Stability: **85/100**, bounce: **0**
- Final risk: **24**, learningNeed: **6**, confidence: **88**
- Longest repair/progress streak: **12 / 2 gün**
- Müdahale geri testi: **1 başarılı · 1 nötr · 0 zararlı**
- Takip kanıtı: **2 yetersiz · 0 confounded**
- Forgetting refresh: **0**, konu başına maksimum **0**
- Değerlendirme: mod bounce yok

### Hızlı öğrenen — İZLE

- Final state: **DENGELİ**
- Stability: **85/100**, bounce: **0**
- Final risk: **16**, learningNeed: **1**, confidence: **88**
- Longest repair/progress streak: **2 / 8 gün**
- Müdahale geri testi: **2 başarılı · 0 nötr · 0 zararlı**
- Takip kanıtı: **0 yetersiz · 0 confounded**
- Forgetting refresh: **10**, konu başına maksimum **2**
- Değerlendirme: mod bounce yok

### Sınava çok az kalmış ve matematiği zayıf — İZLE

- Final state: **DENGELİ**
- Stability: **95/100**, bounce: **0**
- Final risk: **50**, learningNeed: **15**, confidence: **98**
- Longest repair/progress streak: **32 / 0 gün**
- Müdahale geri testi: **0 başarılı · 1 nötr · 0 zararlı**
- Takip kanıtı: **0 yetersiz · 0 confounded**
- Forgetting refresh: **0**, konu başına maksimum **0**
- Değerlendirme: mod bounce yok, uzun ONARIM dönemi, final risk yüksek


## Müdahale geri testi

ONARIM / SÜRDÜRÜLEBİLİR / GELİŞİM kararları 7, 14 ve 30 günlük ufuklarda izleniyor. Faz değiştiren persona sonuçları müdahaleye yanlış nedensellik yüklememek için **confounded** olarak ayrılıyor.

| Mod | Başarılı ufuk | Nötr ufuk | Zararlı ufuk | Yetersiz | Confounded |
| --- | ---: | ---: | ---: | ---: | ---: |
| ONARIM | 9 | 12 | 0 | 3 | 9 |
| SÜRDÜRÜLEBİLİR | 0 | 2 | 0 | 1 | 3 |
| GELİŞİM | 10 | 2 | 0 | 6 | 3 |

Production intervention memory de artık 7/14/30 günlük sonucu ayrı izliyor; tek 7 günlük kötü sonuçla yöntem değiştirmiyor, daha uzun dönem doğrulama bekliyor.

## Forgetting / mastery denetimi

- 14 / 21 / 30 günlük forgetting pencereleri fixture ile korunuyor.
- Retention refresh tamamlandığında forgetting saati yeni gerçek kanıt tarihinden yeniden başlıyor.
- Eski 3/7 günlük tekrar ve eski retention refresh kanıtı yeni ana öğrenme döngüsünü tamamlatamıyor.
- Duplicate refresh routeKey: **0**
- Mastery regression: **0**

## Evidence freshness / exam refresh

Eski deneme kanıtı yaş ve yeni çalışma kanıtıyla zayıflıyor. **exam-refresh** personasında yeni deneme ayrı kanıt olarak tutuluyor ve eski denemeden daha yüksek ağırlık alması assertion ile korunuyor. 60 günlük personelar içinde maksimum stale-evidence etkisi **5 puan**.

## Pilot öncesi kalan açıklar

1. **Gerçek öğrenci verisi yok.** Sentetik test karar güvenliğini ölçer; pedagojik etkiyi kanıtlamaz.
2. **Confounded sonuçlar var.** Persona fazı değiştiğinde müdahalenin etkisini tek başına ayırmak mümkün değil; motor bunları zorla başarı/zarar hanesine yazmıyor.
3. **Bazı 30 günlük takipler yetersiz.** Motor bu durumlarda yöntem değiştirmek yerine yeni kanıt bekliyor.
4. **Gerçek pilotta telemetry şart.** Soru hedefi/gerçekleşme, completion, doğru-yanlış, açık yanlış, mode history ve intervention history birlikte tutulmalı.
5. **İlk pilotta agresif otomatik optimizasyon yapılmamalı.** Tek kısa dönem sonuçla yöntem değiştirmeme koruması devam etmeli.

## Sonraki kalite kapısı

Bir sonraki aşama küçük kontrollü gerçek kullanıcı pilotudur. Pilot değerlendirmesinde en az şu metrikler izlenmeli:

- Gün 0 / 7 / 14 / 30 performans değişimi
- completion ve hedef hacim gerçekleşmesi
- açık yanlış kapanma süresi
- repair çıkış süresi
- progress sonrası performans/retention korunması
- sustainable sonrası completion toparlanması
- mode transition / bounce
- intervention helpful / neutral / harmful / insufficient / confounded dağılımı

---

Bu snapshot, tekrar üretilebilir `npm run quality:report` altyapısının ilk baz raporudur.
