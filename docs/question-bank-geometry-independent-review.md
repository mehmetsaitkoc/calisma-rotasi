# Matematik 13–17: bağımsız editoryal inceleme

İnceleyen: İlk yazardan farklı yapay zekâ ajanı (`codex-editorial-independent-geometry-review`). Tarih: 23 Eylül 2026 UTC / 24 Eylül 2026 Türkiye. Kapsam: Üçgenler, Dörtgenler ve çokgenler, Çember ve daire, Analitik geometri ve Katı cisimler; 20 test, 240 soru.

240 sorunun **tamamı**, dosyalara inceleme onayı yazılmadan önce kök, beş seçenek, anahtar, çözüm ve dört yanlış seçenek açıklamasıyla tek tek okundu. İlk yazarın güçlendirdiği 41 soru da nihai JS metinlerinden okundu. İlk dosyalarda yanlış anahtar tespit edilmedi. Formüller, geometrik mümkünlük, verilen koşulların tek cevap sağlaması ve seçeneklerin anlamı ayrıca değerlendirildi.

## Somut bulgular ve düzeltmeler

- **Zorluk:** 17 soru yeniden kuruldu. Tek başına açıortay oranı yerine yükseklik+alan payı; tek alan oranı yerine iki bağımsız oran; doğrudan düzgün altıgen alanı yerine orta noktalardan ayrılan bölgeler; tek uzaklık formülü yerine iki mutlak-değer çözümü; doğrudan prizma köşegeni yerine ayrıt toplamı+yüzey özdeşliği kullanıldı. Bunlar test başına kolay/orta/zor adetlerini değiştirmeden yapıldı.
- **Yanlış seçenek açıklamaları:** Önceki bazı açıklamalar, ileri sürdüğü hatanın gerçekten üretmediği bir sayıyı o hataya bağlıyordu. Örneğin 13t4q07’de kısa kenarın yarısı ile yarıçap oranı karışmıştı; 13t4q11’de iki uzunluğun toplamı 12’yi üretmiyordu; 14t4q12’de önerilen çıkarma 18’i vermiyordu. Bu atıflar gerçek karşı-kontrollerle değiştirildi. Çember ve cisimlerdeki benzer gerekçeler de düzeltildi.
- **Seçenek bazlı sayısal geri kontrol:** 107 soruda her sayısal çeldirici kökün zorunlu bir bağıntısına geri yerleştirildi. Açıklama artık yalnız doğru çözümü tekrar etmek yerine seçilen sayının ürettiği yanlış açı toplamını, alanı, uzaklık karesini, boyutu veya hacmi gösterir. Bu kontrollerde doğru seçenek de aynı bağıntıyla sınandı.
- **Teklik ve açıklık:** Daire diliminin çevresi ve alanı iki pozitif yarıçap üretebildiğinden 15t4q09’a yarıçapın 9 cm’den küçük olması koşulu eklendi. Katı cisimlerde prizmanın türü ve su aktarımında kayıp/taşma koşulu açıklaştırıldı. Üçgendeki orta noktaların hangi kenarlarda olduğu belirtildi.
- **Dil:** Sayı-kelime aralarındaki bazı bitişiklikler giderildi; kısa kök uyarısı veren analitik geometri maddesi koordinat düzlemi bağlamıyla açıklaştırıldı.

Yeniden kurulan sorular: 13t2q12, 13t3q09–q11; 14t2q12, 14t3q09–q10; 15t2q12, 15t3q10–q11, 15t4q07/q09/q10; 16t3q09/q11; 17t1q12, 17t4q07. Ayrıca 15t2q04’te teğet eşitliğine birinci dereceden denklem koşulu eklendi.

## Son doğrulama

Uygulamanın gerçek `RotaQuestionBank.audit` işleviyle sonuç: **240 approved, 0 hata, 0 uyarı, 0 yinelenen kayıt, 0 test dağılım sorunu**. Her soruya içerik parmak izi ve yedi ayrı inceleme kontrolü kaydedildi. Sorulardaki sonradan yapılacak içerik değişiklikleri parmak izini geçersiz kılar.

Makinece okunabilen 240 satırlık inceleme kaydı: `question-bank-geometry-independent-review.json`. Bu, bağımsız yapay zekâ editoryal incelemesidir; insan öğretmen onayı veya gerçek öğrenci verisiyle psikometrik zorluk kalibrasyonu iddiası değildir. Temel sorularda kalan bazı açıklamalar doğru bağıntıyı tekrar eden kısa öğretici açıklamalardır; tüm seçenekler için özgül bir bilişsel hata teşhisi yapıldığı iddia edilmez.

## Son yazım kontrolü

23 sorunun metninde yalnız boşluklar düzenlendi. Rakamlar, matematiksel işaretler, cevap indeksleri ve seçenek sırası otomatik karşılaştırmayla aynı kaldı. İçerik parmak izleri güncellendi; değişen alanların önce/sonra metinleri ve son dosya SHA-256 değerleri `question-bank-mathematics-spacing-review.json` kaydındadır.
