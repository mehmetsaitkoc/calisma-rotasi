# Route Engine 2.0 — Decision Outcome / Learning Gain v1

Amaç: motorun verdiği kararın yalnızca açıklanabilir olmasını değil, daha sonra gelen gerçek performans kanıtıyla işe yarayıp yaramadığının ölçülebilmesini sağlamak.

Her karar için mümkün olduğunda karar öncesi ve sonrası dört sinyal karşılaştırılır:

- doğruluk / accuracy
- net
- mastery
- görev tamamlama / completion

Sonuç `helpful | neutral | harmful | insufficient | confounded` olarak sınıflanır.

## Güvenlik kuralları

- 7 günden kısa takip veya 2'den az bağımsız örnek başarı/zarar hükmü üretmez: `insufficient`.
- Faz değişimi, yeni dış müdahale veya karşılaştırmayı bozan etken varsa sonuç `confounded`; motor karara başarı yazamaz.
- Tek bir iyi oturum motor ağırlıklarını otomatik değiştiremez.
- Learning gain, DecisionTrace'in yerine geçmez; DecisionTrace “neden seçtim?”, outcome ise “seçimden sonra ne oldu?” sorusunu cevaplar.
- İlk sürüm gözlem/telemetry katmanıdır. Otomatik ağırlık optimizasyonu için 14/30 günlük tekrarlanan kanıt gerekir.

## Akış

DecisionTrace → seçilen görev → görev sonucu → 7/14/30 günlük takip → LearningGainOutcome → kalite raporu → ancak yeterli tekrarlı kanıt varsa gelecekte politika kalibrasyonu.

Bu sözleşme gerçek kullanıcı verisinde nedensellik iddiası yapmaz. Confounded sonuçlar ayrı tutulur.
