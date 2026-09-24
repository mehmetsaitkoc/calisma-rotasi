# Web Beta — statik/CDN yayın yolu

Instagram gibi doğrudan kullanıcı trafiği için önerilen Web Beta dağıtımıdır.

## Neden ayrı static site?

Mevcut `calisma-rotasi` Node web servisi Android/backend geliştirmesi için korunur. Render Free web servisleri boşta kaldığında uyuyabildiği için ilk ziyaret gecikebilir. Web Beta hesap/AI kullanmadığından tam ürün çekirdeği statik olarak çalışabilir.

`npm run web:static`:

- `public/` içeriğini `dist-web-beta/` altına hazırlar.
- 256 KPSS konu testi kaynak dosyasını değiştirmeden ders bazlı 6 runtime bundle üretir.
- Public sayfaya `window.RotaWebBeta=true` işareti ekler.
- Hesap, Rota Hoca ve Plus satın alma yüzeylerine ağ bağımlılığı bırakmaz.
- Android/native kaynaklarını veya ana soru dosyalarını değiştirmez.

## Doğrulama

```sh
npm ci
npm run web:static
npm run web:static:test
```

CI ayrıca static browser testini Chromium ile çalıştırır. Test; sıfır `/api/` çağrısı, 6 soru bundle'ı, tek KPSS girişi, Web Beta yerel kayıt açıklaması ve onboarding erişimini doğrular.

## Render

Bu repo içindeki `render-static-beta.yaml` mevcut `render.yaml` yerine otomatik uygulanmaz. Yeni bir Render Blueprint/Static Site oluştururken bu dosya seçilerek ayrı `calisma-rotasi-beta` servisi kurulabilir.

Önerilen Instagram bağlantısı, static/CDN servisinin doğrulanmış HTTPS URL'sidir. Mevcut Node backend servisi gelecekte kalıcı hesap/senkronizasyon için ayrıca korunur.
