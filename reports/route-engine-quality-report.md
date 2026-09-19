# Route Engine — 60 Günlük Motor Quality Report

**Snapshot:** 2026-09-19  
**Kaynak branch:** `gpt/route-engine-evidence-balance`  
**Kaynak SHA:** `b64f7f2604040d4fb4b138252c3e33b18269d9c9`  
**CI:** Route Engine CI #265 — SUCCESS  
**Test kapsamı:** 18 persona × 60 gün = 1080 günlük kapalı döngü

## Yönetici özeti

- Ortalama ham transition stability: **93/100**
- Ortalama uzun dönem decision stability: **100/100**
- Mode bounce: **0**
- Zararlı müdahale olayı: **0**
- Zararlı 7/14/30 günlük müdahale ufku: **0**
- Mastery regression: **0**
- Duplicate retention-refresh routeKey: **0**
- En yüksek stale-evidence etkisi: **5 puan**
- Yetersiz takip ufku: **9**
- Confounded / nedensellik ayrımı yapılan ufuk: **29**
- Durum dağılımı: **17 GÜÇLÜ · 1 İZLE · 0 BLOKER**

### Kalite kapısı

**GEÇTİ** — Sentetik 60 günlük kalite kapısında bloker bulunmadı.

Confounded sonuçlar kalite hatası olarak sayılmaz; persona fazı veya müdahale öncesi trend ile eşleştirilmiş kontrol farklı karşı-olgu gösterdiğinde sonuç başarı/zarar hanesine zorla yazılmaz.

## Persona özeti

| Persona | Durum | Final state | Ham / uzun stability | Risk | Konu | Yetersiz | Confounded | Not |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Matematiği zayıf ama düzenli gelişen | GÜÇLÜ | GELİŞİM | 90 / 100 | 26 | 6 | 1 | 2 | bounce yok, uzun stability 100 |
| Başarılı ama görevleri aksatan | GÜÇLÜ | DENGELİ | 95 / 100 | 21 | 8 | 0 | 1 | bounce yok, uzun stability 100 |
| Rahat hissedip düşük doğruluk yapan | GÜÇLÜ | GELİŞİM | 90 / 100 | 21 | 6 | 2 | 2 | bounce yok, uzun stability 100 |
| Zorlanıyor ama yüksek doğruluk yapıyor | GÜÇLÜ | DENGELİ | 100 / 100 | 15 | 6 | 0 | 0 | bounce yok, uzun stability 100 |
| Hızlı öğrenen | GÜÇLÜ | DENGELİ | 85 / 100 | 16 | 6 | 0 | 3 | bounce yok, uzun stability 100 |
| Çalışıyor ama plato yapan | GÜÇLÜ | DENGELİ | 100 / 100 | 46 | 2 | 0 | 0 | bounce yok, uzun stability 100 |
| Başta güçlü olup düşüşe geçen | GÜÇLÜ | ONARIM | 95 / 100 | 38 | 6 | 2 | 1 | bounce yok, uzun stability 100 |
| İlk hafta aksatıp sonra toparlanan | GÜÇLÜ | DENGELİ | 80 / 100 | 20 | 6 | 0 | 6 | bounce yok, uzun stability 100, 4 anlamlı geçiş instability sayılmıyor |
| Sınava çok az kalmış ve matematiği zayıf | İZLE | DENGELİ | 95 / 100 | 50 | 2 | 0 | 0 | bounce yok, uzun stability 100, yüksek risk alarmı gelişime rağmen korunuyor |
| Güçlü ve düzenli | GÜÇLÜ | DENGELİ | 100 / 100 | 21 | 6 | 0 | 0 | bounce yok, uzun stability 100 |
| Geç açılan öğrenci | GÜÇLÜ | DENGELİ | 95 / 100 | 17 | 6 | 0 | 1 | bounce yok, uzun stability 100 |
| Başarı sonrası tükenme | GÜÇLÜ | SÜRDÜRÜLEBİLİR | 90 / 100 | 16 | 10 | 0 | 4 | bounce yok, uzun stability 100, burnout 26. günde yakalandı, ease korundu |
| Yanlış güvenini düzelten | GÜÇLÜ | DENGELİ | 95 / 100 | 18 | 6 | 0 | 1 | bounce yok, uzun stability 100 |
| Toparlanıp tekrar düşen | GÜÇLÜ | DENGELİ | 85 / 100 | 42 | 2 | 1 | 4 | bounce yok, uzun stability 100, relapse onarımı 37. günde yeniden açıldı |
| Eski kötü denemeyi yeni güçlü denemeyle güncelleyen | GÜÇLÜ | DENGELİ | 85 / 100 | 13 | 6 | 1 | 3 | bounce yok, uzun stability 100, yeni deneme eski kanıttan ağır |
| Uzun süre güçlü ve dengeli | GÜÇLÜ | DENGELİ | 100 / 100 | 17 | 6 | 0 | 0 | bounce yok, uzun stability 100 |
| Yavaş ama kalıcı gelişen | GÜÇLÜ | DENGELİ | 85 / 100 | 24 | 5 | 2 | 1 | bounce yok, uzun stability 100 |
| Günlük dalgalı uzun dönem stabil | GÜÇLÜ | DENGELİ | 100 / 100 | 36 | 3 | 0 | 0 | bounce yok, uzun stability 100 |

## Kritik dört persona — saldırı sonucu

### Recovery comeback — GÜÇLÜ
- Ham stability **80**, uzun dönem stability **100**.
- 4 geçişin tamamı anlamlı: bozulma→ease, toparlanma→steady, doğrulanmış progress, sonra steady.
- Bounce **0**; final risk **20**.

### Urgent weak — İZLE
- Performans **45 → 71**, risk **75 → 50**.
- Motor öğrenciyi 32 gün ONARIM'da tutup objektif recovery sonrası steady'e çıkarıyor.
- Riskin 50'de kalması hata değil: hedef yakın ve tamamlanan konu sayısı düşük olduğu için **doğru alarm**.

### Burnout after success — GÜÇLÜ
- Burnout fazı 21. gün başlıyor; motor SÜRDÜRÜLEBİLİR moda **26. günde** geçiyor.
- Sonrasında completion düşük kaldığı sürece ease korunuyor; gereksiz çıkış yok.
- Bounce **0**, uzun dönem stability **100**.

### Relapse — GÜÇLÜ
- Gerileme 33. gün başlıyor; motor ONARIM'ı **37. günde** yeniden açıyor.
- İkinci recovery başlayınca repair'den **45. günde** çıkıyor.
- 7/14 günlük geri testte pre-trend ile matched-control çatışması **confounded** sayılıyor; sahte harmful üretilmiyor.

## Müdahale geri testi

Production intervention memory 7 / 14 / 30 günlük sonuçları ayrı izler. Tek 7 günlük kötü sonuç yöntem değiştirmeye yetmez. Faz değişimi veya karşı-olgu çatışması varsa ufuk **confounded** olur.

## Forgetting / mastery denetimi

- 14 / 21 / 30 günlük forgetting pencereleri korunuyor.
- Refresh tamamlanınca forgetting saati yeni kanıttan başlıyor.
- Eski 3/7/refresh kanıtı yeni öğrenme döngüsüne sızmıyor.
- Duplicate refresh key: **0**
- Mastery regression: **0**

## Pilot öncesi kalan açıklar

1. Gerçek öğrenci verisi henüz yok; sentetik test pedagojik etkiyi kanıtlamaz.
2. **Tek İZLE persona urgent-weak.** Bunun nedeni motor kararsızlığı değil, sınava yakın öğrencide yüksek riskin bilinçli korunmasıdır.
3. Gerçek pilotta planlanan/gerçek soru, completion, doğru-yanlış, açık yanlış, mode history ve intervention history birlikte tutulmalı.
4. Tek kısa dönem müdahale sonucu ile otomatik strateji değişikliği yapılmamalı; 14/30 günlük doğrulama korunmalı.

## Sonraki kalite kapısı

Teknik sentetik kapı geçildi. Sonraki adım küçük kontrollü gerçek kullanıcı pilotu ve 0 / 7 / 14 / 30 günlük telemetry karşılaştırmasıdır.

---

Bu snapshot tekrar üretilebilir `npm run quality:report` altyapısının güncel baz raporudur.
