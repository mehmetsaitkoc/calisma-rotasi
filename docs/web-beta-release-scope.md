# Çalışma Rotası — Web Beta yayın kapsamı

Tarih: 24 Eylül 2026

Bu belge Instagram ve doğrudan bağlantı üzerinden paylaşılacak ilk herkese açık Web Beta'nın ürün sınırıdır.

## Yayında olan çekirdek

- KPSS Lisans Genel Yetenek / Genel Kültür
- kişisel onboarding ve rota oluşturma
- Bugünün Planı / Programım
- ONARIM / DENGE / İLERLEME karar döngüsü
- deneme ve konu testi kanıtları
- yanlış kaydı ve konu kurtarma
- 3 / 7 günlük tekrar
- soru bankası ve branş denemeleri
- yerel çalışma geçmişi ve cihaz yedeği
- mobil / masaüstü responsive arayüz

## Bu beta sürümünde kapalı

- Rota Hoca / AI öğretmen arayüzü
- öğretmen önerisi / öğretmen kataloğu
- YKS ürün yüzeyi
- canlı Plus satışı, fiyat teklifi ve ödeme akışı
- bulut hesabı ve cihazlar arası eşitleme

Rota Hoca'nın eski iç kodu veya backend sözleşmeleri migrasyon / ileride yeniden değerlendirme amacıyla repoda bulunabilir; fakat public Web Beta'da navigasyon, route, CTA, pazarlama metni veya görünür sayfa olarak sunulamaz.

## Veri kalıcılığı

Render'da kalıcı `ROTA_DB_PATH` yoksa uygulama otomatik olarak `local-only` Web Beta moduna düşer. Geçici Render diskine öğrenci hesabı yazılmaz. Çalışma verileri tarayıcıda tutulur.

Mobil kullanıcıya ilk ekranda bunun açıkça belirtilmesi gerekir. Instagram içi tarayıcı ile Safari/Chrome yerel depolaması aynı olmayabileceğinden kullanıcıya Safari/Chrome'da devam etmesi önerilir.

Kalıcı veritabanı provision edilip yedek/retention politikası doğrulanmadan persistent hesap modu açılmamalıdır.

## Public beta yayın kapısı

Aşağıdakiler yeşil olmadan main'e merge edilmez:

1. KPSS-only CI
2. Route Engine CI
3. Production Readiness
4. Web Beta browser / share-readiness
5. Rota Hoca görünür yüzey kontrolü
6. unfinished billing / pricing yüzeyi kontrolü
7. 320–430 px mobil taşma ve CTA kontrolü
8. Render local-only startup kontrolü

Deploy sonrasında ayrıca canlı URL health check, ilk onboarding, reload sonrası yerel kayıt ve mobil gerçek tarayıcı kontrolü yapılır.
