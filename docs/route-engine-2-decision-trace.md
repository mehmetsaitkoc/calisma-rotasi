# Rota Motoru 2.0 — Decision Trace v1

Bu sözleşme, rota motorunun verdiği her önemli kararın makinece test edilebilir ve öğrenciye açıklanabilir bir iz bırakmasını tanımlar.

## Canonical trace shape

```js
{
  version: 1,
  mode: 'repair' | 'balance' | 'progress',
  confidence: 0, // 0..100
  score: 0,
  reasonCodes: [],
  evidence: [],
  capacity: {
    requestedMinutes: 0,
    assignedMinutes: 0,
    dailyLimit: 0,
    constrained: false
  }
}
```

## Reason codes

- `ASSESSMENT_RISK`: son güvenilir deneme/ölçüm konu için risk gösteriyor.
- `OPEN_MISTAKE`: konuya ait kapanmamış yanlış var.
- `REPEATED_MISTAKE`: aynı hata tipi veya konu tekrar ediyor.
- `REVIEW_DUE_3`: 3 günlük tekrar zamanı geldi.
- `REVIEW_DUE_7`: 7 günlük tekrar zamanı geldi.
- `RETENTION_STALE`: daha önce öğrenilen konunun güvenilir kanıtı bayatladı.
- `BELOW_PERSONAL_NORM`: öğrenci kendi yakın dönem normalinin altında.
- `NEGATIVE_TREND`: performans düşüş eğiliminde.
- `POSITIVE_TREND`: performans güvenilir biçimde yükseliyor.
- `TARGET_URGENCY`: sınava kalan süre önceliği artırıyor.
- `PROFILE_PRIORITY`: öğrenci bu dersi/konuyu öncelikli seçmiş.
- `LOW_COMPLIANCE`: akademik seviyeden bağımsız görev tamamlama sorunu var.
- `RECOVERY_ACTIVE`: backlog/yorgunluk sonrası toparlanma politikası aktif.
- `CAPACITY_CONSTRAINED`: istenen yük günlük gerçekçi kapasiteye sığmadı.
- `MASTERY_EVIDENCE`: ilerleme için yeterli çoklu kanıt var.
- `LOW_EVIDENCE`: sinyal var fakat güçlü karar için kanıt yetersiz.

## Invariants

1. Öğrenciye gösterilen neden, trace içindeki gerçek `reasonCodes/evidence` üzerinden üretilir.
2. `confidence` düşükken motor kesin öğrenci dili kullanmaz.
3. `CAPACITY_CONSTRAINED` oluştuğunda düşük değerli adayların neden elendiği test edilebilir olmalıdır.
4. `LOW_COMPLIANCE` tek başına akademik `repair` modu üretmemelidir.
5. `MASTERY_EVIDENCE` tek oturumdan üretilemez.
6. 3/7 tekrarları gerçek çalışma tarihine bağlanır.
7. Yeni temel öğrenme döngüsü eski açık tekrar dalgasını geçersiz kılabilir.
8. Aynı konu için birden çok sinyal varsa öğrenci metni tekrar eden cümlelerden değil, en güçlü 2–3 kanıttan oluşur.

## Student-facing explanation policy

Trace → açıklama dönüşümü deterministik olmalıdır.

Örnek reasonCodes:

```js
['ASSESSMENT_RISK', 'OPEN_MISTAKE', 'REVIEW_DUE_3', 'CAPACITY_CONSTRAINED']
```

Beklenen dil:

> Problemler bugün öne çıktı: son ölçümlerde risk var, açık yanlışların bulunuyor ve tekrar zamanın geldi. Günlük kapasiteni aşmamak için çalışma süresini sınırladım.

Açıklama şu iddiaları **uyduramaz**:

- veri yokken “son denemelerde düştün”
- açık yanlış yokken “yanlışların tekrar ediyor”
- yalnızca bir başarılı oturum varken “konuyu öğrendin”
- kapasite sınırı uygulanmadıysa “programını hafiflettim”

## Selection audit

Her rebalance sonunda geliştirici/test katmanı aşağıdaki özeti üretebilmelidir:

```js
{
  date: 'YYYY-MM-DD',
  dailyLimit: 120,
  assignedMinutes: 105,
  selected: [
    { taskId: '...', topicId: '...', score: 82, reasonCodes: ['ASSESSMENT_RISK'] }
  ],
  deferred: [
    { taskId: '...', topicId: '...', score: 31, reasonCodes: [], deferredBecause: 'capacity' }
  ]
}
```

Bu audit kullanıcı arayüzünde zorunlu olarak gösterilmez; testler, Rota Hoca bağlamı ve hata ayıklama için kullanılabilir.

## Acceptance tests

Decision Trace tamamlandığında otomatik testler en az şunları kanıtlamalıdır:

- aynı kanıt girdisi aynı reason code sırasını üretir;
- veri yokken sahte neden üretilemez;
- sınava az kalmış zayıf konu, eşit diğer adaydan önce gelir;
- güçlü ama uyumsuz öğrenciye gereksiz akademik onarım verilmez;
- backlog günlük kapasiteyi aşacak şekilde ertesi güne taşınmaz;
- tekrar eden yanlış, tekil yanlıştan daha yüksek onarım baskısı oluşturur;
- güvenilir iyileşme sonrası repair baskısı azalır;
- eski kanıt retention refresh oluşturabilir ama tam konu çalışmasını zorunlu kılmaz;
- seçilmeyen yüksek skorlu adayın ertelenme nedeni audit içinde görünür.
