# KPSS Tarih V2 — Editoryal kalite denetimi

## Amaç

Bu denetim soru sayısını artırmak için değil, 759 soruluk Tarih paketinde “AI üretimi” hissi veren veya KPSS seçiciliğini düşüren soruları bulup düzeltmek için yapıldı.

## İncelenen paket

- 13 konu
- 52 konu testi
- 624 konu sorusu
- 5 bölüm denemesi
- 135 bölüm denemesi sorusu
- toplam 759 özgün soru

## İnsan editoryal örneklemi

İki bağımsız örneklem hâlinde toplam 200 soru incelendi.

Örneklem 13 konunun tamamını, dört test karakterini, beş bölüm denemesini ve otomatik risk taramasında öne çıkan recall / kısa-kök / cevap-uzunluğu / doğrudan-bilgi sorularını kapsayacak şekilde seçildi.

## Editoryal ölçütler

1. Tarihsel doğruluk ve tartışmasız tek doğru cevap
2. KPSS’ye uygun soru kökü
3. Çeldiricilerin aynı dönem / aynı kavram ailesinden makul olması
4. Cevabın uzunluk veya dil ipucuyla belli olmaması
5. Salt ezber yerine bağlam, neden-sonuç, kronoloji, kurum-işlev, belge-karar veya çıkarım
6. Açıklamanın yalnız doğru şıkkı tekrar etmeyip gerekçelendirmesi
7. Aynı bankada benzer soruların tekrar edilmemesi

## Sonuç

İlk 100 soruluk sert editoryal turda 37 soru yeniden yazıldı. İkinci risk turunda ayrıca doğru cevabın uzunluğundan ipucu verdiği en kötü 30 soruda çeldiriciler yeniden dengelendi. Ardından ilk örneklemden tamamen bağımsız ikinci 100 soru sert biçimde incelendi; 85 soruda doğru cevap ifadesi seçenek dengesini bozmayacak şekilde yeniden yazıldı, 2 ezber ağırlıklı soru baştan kuruldu ve 9 soruda ayrıca çeldirici seti yeniden yazıldı. Çift müdahaleler nedeniyle bu 96 editoryal işlem 87 farklı soruya dokundu.

Başlıca müdahaleler:
- “hangi yıl / kimdir / hangisidir?” düz bilgi köklerini bağlam ve çıkarım sorularına dönüştürme,
- çok uzak veya komik çeldiricileri aynı dönem / aynı kurum / aynı antlaşma ailesinden seçeneklerle değiştirme,
- doğru cevabın diğer seçeneklerden belirgin uzunlukta olduğu soruları yeniden dengeleme,
- “Kürşad” gibi tartışmalı tekil-popüler anlatıya yaslanan bir soruyu, Çin egemenliği ve II. Göktürk bağımsızlık süreci üzerinden daha güvenli tarihsel ölçüme dönüştürme,
- antlaşma ve kurum sorularında yalnız isim eşleştirme yerine belge-sonuç ve politika-amaç ilişkisini ölçme.

## Dış benchmark

ÖSYM'nin yayımladığı KPSS temel soru kitapçıkları yalnız soru mantığı, dil, çeldirici yapısı ve ölçme seviyesi için incelendi; gerçek ÖSYM soruları kopyalanmadı.

Ramazan Yetgin'in 2026 “Sorularla Genel Tekrar Kampı” ve “99 Soruda Genel Tekrar” içerikleri de yalnızca soru anlatım/ayırt etme yaklaşımı açısından benchmark olarak kullanıldı; soru veya seçenek kopyalanmadı.

## Kalıcı kalite kapısı

`scripts/kpss-history-editorial-audit.test.mjs` her CI'da:
- 759 soru sözleşmesini,
- 624 + 135 ayrımını,
- 5 seçenek / tek doğru / açıklama / original-only sözleşmesini,
- recall ve çıplak knowledge oranının yeniden yükselmemesini,
- doğrudan bilgi kökü oranının kontrolden çıkmamasını,
- doğru şıkkın belirgin biçimde tek uzun seçenek olduğu örneklerin izleme metriğini,
- editoryal pass 3 kapsamındaki 30 çeldirici dengelemesinin yüklenmesini,
- tartışmalı “Kürşad” tipi sorunun geri dönmemesini

denetler.

Bu belge editoryal pass 2 için audit kaydıdır.
