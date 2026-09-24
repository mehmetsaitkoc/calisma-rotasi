# KPSS tarih — bağımsız editoryal inceleme

İnceleme tarihi: **23 Eylül 2026 UTC** (Türkiye saatiyle 24 Eylül). İncelemeci: `codex-editorial-independent-history-review`; ilk yazardan farklı yapay zekâ ajanı.

## Kapsam ve sonuç

`k-ta-2`–`k-ta-13` kapsamındaki 48 testteki **576 sorunun tamamı** okundu: kök, beş seçenek, cevap anahtarı, çözüm, dört yanlış seçenek açıklaması, kazanım ve zorluk düzeyi ayrı ayrı değerlendirildi. İlk Türk Devletleri konusundaki önceden incelenmiş 48 madde değiştirilmedi.

Son ürün dosyaları için çekirdek denetim sonucu: **576 onaylı, 0 inceleme bekleyen, 0 reddedilen; 0 şema hatası, 0 uyarı, 0 benzerlik uyarısı ve 0 test sorunu**. Pilotla birlikte tarih toplamı 624 onaylı maddedir. Dosya SHA-256 değerleri, her sorunun içerik parmak izi, kontrol alanları ve değişiklik kayıtları `question-bank-history-independent-review.json` içinde saklandı.

## İncelemede yapılan değişiklikler

- 109 farklı maddeye yönelik 110 editoryal değişiklik kaydı oluştu; bunların içinde **99 kapsamlı soru yeniden yazımı** vardır. Sadece kolay bir tanımı “zor” olarak etiketleyen, cevabı kökte açıklayan veya ilgisiz seçeneklerle tek bakışta çözülen maddeler çoklu ipucu, neden-sonuç, kurum karşılaştırması, kaynak sınırı ve tarihsel çıkarım sorularına dönüştürüldü.
- 136 maddede dil, kişi/eser adı, kesme işareti ve anlatım düzeltmesi yapıldı. 29 kronoloji maddesinde yanlış seçenek notları, o seçenekteki somut sıra tersliğini ve ilgili tarihleri açıklayacak biçimde özelleştirildi. Bu kümeler kesişebilir; sayılar toplanarak yeni soru sayısı elde edilemez.
- Konular arasında aynı cevap dizisinin yinelenmesini gidermek için seçenekler test başına deterministik olarak yeniden sıralandı. Her harfin testte 1–3 kez doğru cevap olma dağılımı korundu; cevap indeksi ve dört yanlış açıklama seçeneklerle birlikte taşındı ve kontrol edildi.
- Testlerin kolay/orta/zor adetleri sırasıyla 6/5/1, 3/7/2, 1/7/4 ve 1/5/6 olarak korundu. Zorluk yargısı içerik ve işlem gereksinimine dayalı editoryal değerlendirmedir.

## Somut bulgular

| Madde | İlk içerikteki sorun | Son düzeltme |
|---|---|---|
| `kpss-ta8-t3-q08` | Kök muharebe sorarken seçenekler komutan adlarıydı; anahtar Fahrettin Paşa'ya gidiyordu. | Muharebe seçenekleriyle yeniden kuruldu; doğru cevap Anafartalar oldu. |
| `kpss-ta8-t4-q02` | Komutan sorusunda gemi, ordu ve zafer adları çeldirici olarak kullanılmıştı. | Medine savunması bağlamında aynı türden komutan seçenekleri kullanıldı. |
| `kpss-ta13-t3-q11` | Bandung katılımcılarının hepsi blok dışı sayılıyordu. | NATO üyesi Türkiye'nin katılımı dikkate alınarak genelleme düzeltildi; ATAM ve ABD resmî arşiv kaynakları eklendi. |
| `kpss-ta13-t3-q09` | Çok partili hayata ilişkin başlangıçların tamamı 1946 DP kuruluşuyla özdeşleşebiliyordu. | Parti kuruluşu, seçime katılım ve 1950 iktidar değişimi ayrı süreçler olarak kuruldu. |
| `kpss-ta13-t4-q02`, `q09` | Avrupa bütünleşmesinde imza ve yürürlük tarihleri yeterince ayrılmıyordu. | Maastricht için 1992/1993, AKÇT Paris Antlaşması için 1951/1952 ayrımı açıkça yazıldı. |
| `kpss-ta12-t4-q10` | Boğazlar Komisyonu'nun kaldırılması “Montrö öncesinde” ifadesine bağlanıyordu. | 1936 Montrö ile kaldırılma, 1938–1939 Hatay aşamalarından ayrıldı. |
| `kpss-ta10-t2-q11` | Sakarya için “1921 sonunda” deniyordu. | Eylül 1921 olarak düzeltildi. |
| `kpss-ta5-t1-q12` | Ridaniye “Memlûklerin son direnişi” olarak mutlaklaştırılmıştı. | Mısır'ın alınması ve devletin sona ermesine giden süreç olarak sınırlandırıldı. |
| `kpss-ta5-t2-q07` | 1533 protokol ilişkisi belirsiz biçimde “Habsburg hükümdarı” üzerinden kurulmuştu. | Avusturya arşidükü unvanı kullanıldı. |
| `kpss-ta3-t2-q01` | Kösedağ adı kökte verilerek cevap açıklanıyordu. | Cevap sızıntısı kaldırıldı. |
| `kpss-ta6-t4-q04` | Ruznamçe için yanlış seçenek notunun bağlamı uygun değildi. | Günlük mali kayıt ile hane/arazi tahriri ayrımı açıklandı. |

Kültür ve medeniyet bölümündeki örnek tahrir tablosu (`kpss-ta6-t4-q09`) öğretim amacıyla kurgulandığı belirtilen bir senaryodur; gerçek bir tarihsel belgenin sayıları gibi sunulmadı. Vergi hanesi sayısı, toplam nüfus ve kapsanan köy sayısı arasındaki kanıt sınırını ölçer.

## Doğrulamada kullanılan resmî kaynaklardan seçmeler

Sorular kopyalanmadı; kaynaklar tarihsel bilgi ve ilişki doğrulaması için kullanıldı. Ayrıntılı soru kaynakları ürün dosyalarının `sourceRefs` alanındadır. Büyük kitapların tamamının her madde için okunmuş olduğu iddia edilmez.

- [MEB — Türk devletlerinde yönetim, görevler ve taşra](https://ogmmateryal.eba.gov.tr/panel/upload/etkilesimli/kitap/turkkulturvemedeniyettarihi/sec/unite1/files/basic-html/page17.html)
- [MEB — Anadolu Selçukluları ve Kösedağ](https://ogmmateryal.eba.gov.tr/panel/upload/etkilesimli/kitap/defterim/10/tarih/files/basic-html/page51.html)
- [MEB — Osmanlı siyasi tarihi ve 1533 protokol ilişkileri](https://ogmmateryal.eba.gov.tr/panel/upload/files/wo0sjmzg34b.pdf)
- [MEB — Osmanlı ekonomisinde iaşe, maliye ve lonca düzeni](https://ogmmateryal.eba.gov.tr/panel/upload/etkilesimli/kitap/turkkulturvemedeniyettarihi/sec/unite4/files/basic-html/page15.html)
- [MEB — Osmanlı mimarisi](https://ogmmateryal.eba.gov.tr/panel/upload/etkilesimli/kitap/sanattarihi/sec/unite1/files/basic-html/page189.html), [minyatür ve surname](https://ogmmateryal.eba.gov.tr/panel/upload/etkilesimli/kitap/sanattarihi/sec/unite1/files/basic-html/page228.html)
- [Anayasa Mahkemesi — 1876 Kanun-ı Esasi](https://www.anayasa.gov.tr/tr/mevzuat/onceki-anayasalar/1876-kanun-i-esasi)
- [MEB — Millî Mücadele ünite özeti](https://ogmmateryal.eba.gov.tr/panel/upload/etkilesimli/kitap/tcinkilaptarihiveataturkculuk/12/unite2/icerik/uniteozeti.pdf)
- [MEB — Atatürk dönemi dış politikası](https://ogmmateryal.eba.gov.tr/panel/upload/etkilesimli/kitap/tcinkilaptarihiveataturkculuk/12/unite4/files/basic-html/page8.html), [Hatay süreci](https://ogmmateryal.eba.gov.tr/panel/upload/etkilesimli/kitap/tcinkilaptarihiveataturkculuk/12/unite4/files/basic-html/page16.html)
- [ATAM — Türkiye ve Bandung bağlamı](https://atam.gov.tr/wp-content/uploads/2023/06/Tek-Dosya-Kazakistan.pdf), [ABD Dışişleri tarih arşivi — Bandung](https://history.state.gov/milestones/1953-1960/bandung-conf), [dönemin katılımcı ülkelerine ilişkin arşiv belgesi](https://history.state.gov/historicaldocuments/frus1955-57v21/d1)
- [Avrupa Parlamentosu — Maastricht imza ve yürürlük tarihleri](https://www.europarl.europa.eu/about-parliament/en/in-the-past/the-parliament-and-the-treaties/maastricht-treaty), [Avrupa Birliği Konseyi — Schuman Bildirisi ve AKÇT](https://www.consilium.europa.eu/en/schuman-declaration/)
- [NASA — Apollo 11](https://www.nasa.gov/mission/apollo-11/), [Sputnik ve uzay çağının başlangıcı](https://www.nasa.gov/history/dawn-of-the-space-age/)

## Kayıtların anlamı ve sınırı

`approved`, kayıtlı içerik parmak iziyle eşleşen bağımsız **yapay zekâ editoryal incelemesi** anlamına gelir. İnsan tarih öğretmeni/alan uzmanı onayı, bütün ticari kaynaklara karşı özgünlük ispatı, ÖSYM eşdeğerliği veya deneysel psikometrik kalibrasyon anlamına gelmez. Ramazan Yetgin derslerinin tamamı izlenmiş ya da kendisiyle danışılmış değildir; yazarın sınırlı başlık/açıklama kapsam kontrolünün sınırı kaynak notunda korunmuştur.

İncelemeden sonra soru metni, seçenekler, kaynak veya kazanım bilgileri değiştirilirse içerik parmak izi yeniden değerlendirilmelidir. Eski yazar üretim scriptleri bu son dosyaların üzerine çalıştırılmamalıdır.
