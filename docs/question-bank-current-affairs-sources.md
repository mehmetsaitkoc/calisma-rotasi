# KPSS Güncel Bilgiler — Kaynak ve yazar kontrolü

Kapsam: üç katalog konusu × dört test × on iki soru = **144 özgün soru**. Kaynak kontrol günü: **23 Eylül 2026 (UTC)**. Türkiye yerel takvimi bu sırada 24 Eylül olabilir.

144 sorunun tamamının kökü, beş seçeneği, doğru cevabı, çözümü ve dört çeldirici gerekçesi ayrı inceleme turunda okunmuştur. 67 maddede esaslı içerik düzeltmesi yapılmış; 144 maddenin tasnifi ve kaynak kayıtları nihai içerikle eşleştirilmiştir. Durum: **approved**. Bu kayıt bağımsız yapay zekâ editoryal incelemesidir; insan alan uzmanı onayı veya psikometrik kalibrasyon değildir.

## Kapsam ve tarih yaklaşımı

- `k-gu-1`: 2024–2026 uzay görevleri, BM tematik yılları, çevre ve kalkınma toplantıları, uluslararası anlaşmalar ve etkinlikler.
- `k-gu-2`: tarihli üyelik/karar gelişmeleri ile uluslararası kuruluşların görev, yetki, organ ve program ayrımları.
- `k-gu-3`: 2024–2025 Nobel ve sinema ödülleri, 2024–2026 olimpiyat gündemi, 2025 spor sonuçları ve UNESCO kültür kayıtları.

Her soruda `currentness.required: true`, `verifiedOn: 2026-09-23`, `validUntil: 2026-12-31` ve birincil resmî kaynak URL’si bulunmaktadır. Süre sonu, tarihsel olayın değiştiği iddiası değil editoryal tekrar kontrol eşiğidir. `fixed-dated-event` kayıtları açık yıl/tarih verilmiş olayları; `institutional-structure` kayıtları doğrulanan kurumsal işlevleri içerir. Güncel görevdeki kişiler, değişken canlı sıralamalar ve gelecekteki sonuçlar sorulmamıştır. 2026 Nobel sonuçları henüz açıklanmamış olduğundan içerikte yoktur.

Kabul/uygulama/yürürlük, ilan/gerçekleşme, film/tören yılı ve hedef/gerçekleşen ödeme ayrımları korunmuştur. Sayısal spor sonuçları ilgili resmî sonuç sayfasına dayanır. Nobel ödül paylarında gerçek ödül dağılımı ile bilimsel katkı eşleştirilmiştir.

## Yazım ve yapısal kontrol

Soru kökleri, seçenekler ve gerekçeler bu banka için tek tek yazılmıştır. Kaynaklardaki soru metinleri veya lisanslı soru bankaları kullanılmamıştır. Yazar betiği yalnız açıkça yazılmış maddeleri şemaya dönüştürür, kimlik ve seçenek dizilimi ekler; bir kökten sayısal/değişken kombinasyonları üretmez.

Her konu 48, her test 12 soru içerir. Kolay/orta/zor dağılımları 6/5/1, 3/7/2, 1/7/4, 1/5/6’dır. Test 4 son altı soru çoklu ipucu, tablo, kapsam veya çıkarım gerektirir. Doğru harfler her testte 2–3 kez kullanılır.

Çalışan `RotaQuestionBank.audit()` ile 144 kimlik, şema, seçenek, kaynak/güncellik kaydı, konu dağılımı ve benzerlik kontrolleri yürütülmüştür. Sonuç: 144 onaylı soru; 0 hata, 0 konu/test sorunu, 0 yinelenme uyarısı. Sonuç dosyası: `docs/question-bank-current-affairs-audit.json`.

## Birincil kaynaklar

- **apec-2025** — [31 Ekim–1 Kasım 2025 APEC Ekonomik Liderler Toplantısı Gyeongju/Kore Cumhuriyeti.](https://www.apec.org/meeting-papers/leaders-declarations/2025/2025-apec-leaders--gyeongju-declaration)
- **archery2024** — [29 Temmuz 2024: Mete Gazoz, Ulaş Berkim Tümer ve Abdullah Yıldırmış erkek takım okçuluk bronzu.](https://www.worldarchery.sport/news/201750/how-turkiyes-mens-team-took-historic-medal-paris)
- **athletics1002025** — [2025 Tokyo erkekler 100 m finali: Oblique Seville 9.77, Kishane Thompson 9.82, Noah Lyles 9.89.](https://worldathletics.org/competition/calendar-results/results/7190593?eventId=10229630)
- **athletics2025** — [13–21 Eylül 2025 Tokyo/Japonya Dünya Atletizm Şampiyonası sonuç sayfası.](https://worldathletics.org/results/world-athletics-championships/2025/world-athletics-championships-tokyo-2025-7190593)
- **basket2025** — [2025 EuroBasket Riga finali: Almanya 88–83 Türkiye; şampiyon Almanya, ikinci Türkiye.](https://www.fiba.basketball/en/events/fiba-eurobasket-2025/news/germany-win-incredible-final-against-tuerkiye-eb-25)
- **breaking2024** — [Breaking branşının 9–10 Ağustos Paris 2024’te Olimpiyat Oyunları programındaki ilk müsabakaları.](https://www.worlddancesport.org/News/breaking-debut-paris-2024-olympics-3468)
- **brics-indonesia2025** — [6 Ocak 2025: Brezilya dönem başkanlığının Endonezya’nın BRICS’e tam üyeliğini duyurması.](https://brics.br/en/news/brazil-announces-indonesia-as-full-member-of-brics)
- **cannes2024** — [Sean Baker’ın Anora filmi, 2024 Altın Palmiye; yapım yılı 2024.](https://www.festival-cannes.com/en/f/anora/)
- **cannes2024-date** — [25 Mayıs 2024 ödül töreni sonrasında Sean Baker’ın Anora için Altın Palmiye aldığı haber.](https://www.festival-cannes.com/en/2024/a-la-rencontre-des-laureats-du-77e-festival/)
- **cannes2025** — [24 Mayıs 2025; Jafar Panahi, Un simple accident (It Was Just an Accident), Altın Palmiye.](https://www.festival-cannes.com/en/2025/meet-the-78th-festival-de-cannes-winners/)
- **cbd-cop16** — [2024 Cali’de başlayan Biyolojik Çeşitlilik COP16 görüşmelerinin Şubat 2025’te Roma’da tamamlanması.](https://www.cbd.int/article/cop16-resumed-session-closing-2025)
- **ecb-bulgaria2026** — [1 Ocak 2026: Bulgaristan’ın avroyu kullanmaya başlaması ve avro alanının 21. üyesi olması.](https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.pr260101~c830245e42.en.html)
- **eu-schengen2025** — [Bulgaristan ve Romanya ile iç kara sınır kontrollerinin 1 Ocak 2025’ten itibaren kaldırılması; hava/deniz aşaması 31 Mart 2024.](https://www.consilium.europa.eu/en/press/press-releases/2024/12/12/schengen-council-decides-to-lift-land-border-controls-with-bulgaria-and-romania/)
- **euro2024** — [14 Temmuz 2024 erkekler Avrupa Futbol Şampiyonası finali: İspanya 2–1 İngiltere, Berlin.](https://www.uefa.com/uefaeuro/history/news/0275-151eb1c333ea-d30deec67b13-1000--uefa-euro-2024-results-when-and-where-were-the-matches/)
- **expo-close** — [Expo 2025’in 13 Ekim 2025’te kapanışı, 184 gün sürmesi.](https://www.expo2025.or.jp/en/news/news-20251013-01/)
- **expo2025** — [Expo 2025 Osaka-Kansai; Yumeshima adası, 13 Nisan–13 Ekim 2025, Hayatlarımız için Geleceğin Toplumunu Tasarlamak teması.](https://www.expo2025.or.jp/en/overview/)
- **fao-camelids2024** — [2024 Uluslararası Devegiller Yılı; deve, lama ve alpaka gibi türler ve geçim kaynakları.](https://www.fao.org/camelids-2024/en)
- **fao-mandate** — [FAO gıda güvencesi ve açlıkla mücadele alanındaki uzman kuruluş.](https://www.fao.org/about/about-fao/en/)
- **fao-rangelands2026** — [2026 Uluslararası Meralar ve Çobanlar Yılı; FAO, otlak ekosistemleri ve pastoral geçim sistemleri.](https://www.fao.org/rangelands-pastoralists-2026/about/)
- **fao-woman2026** — [2026 Uluslararası Kadın Çiftçi Yılı ve tarım-gıda sistemlerinde kadınların katkıları.](https://www.fao.org/woman-farmer-2026)
- **g20-2024** — [2025 kapanış konuşmasında 2024 Rio de Janeiro G20 Zirvesine tarihsel atıf.](https://www.thepresidency.gov.za/closing-remarks-president-cyril-ramaphosa-g20-leaders-summit)
- **g20-2025** — [22–23 Kasım 2025 Johannesburg/Güney Afrika; Afrika kıtasındaki ilk G20 Liderler Zirvesi.](https://www.g20.org.za/wp-content/uploads/2025/11/2025-G20-Summit-Declaration.pdf)
- **iaea-mandate** — [IAEA nükleer bilim ve teknolojinin güvenli, emniyetli ve barışçıl kullanımları; Viyana.](https://www.iaea.org/about/overview)
- **icao-mandate** — [ICAO sivil havacılık için uluslararası standartlar ve tavsiye edilen uygulamalar.](https://www.icao.int/how-icao-develops-standards)
- **icc-mandate** — [Uluslararası Ceza Mahkemesi belirli ağır uluslararası suçlarda bireylerin cezai sorumluluğunu inceler.](https://www.icc-cpi.int/sites/default/files/VPRS_Victim-s_booklet.pdf)
- **ilo-tripartite** — [ILO’nun hükûmet, işçi ve işveren temsilcilerini bir araya getiren üçlü yapısı.](https://www.ilo.org/about-ilo/how-ilo-works)
- **imf-liechtenstein2024** — [21 Ekim 2024: Lihtenştayn IMF’nin 191. üyesi oldu.](https://www.imf.org/en/news/articles/2024/10/21/pr-24387-liechtenstein-principality-of-liechtenstein-becomes-imfs-191st-member)
- **imf-mandate** — [IMF ekonomik gözetim, finansal istikrar, kredi ve kapasite geliştirme görevleri.](https://www.imf.org/en/about)
- **interpol-silver2025** — [Ocak 2025 Gümüş Bülten pilotu: suçla bağlantılı varlıkların yerinin belirlenmesi ve bilgi paylaşımı.](https://www.interpol.int/News-and-Events/News/2025/INTERPOL-publishes-first-Silver-Notice-targeting-criminal-assets)
- **issf2024** — [30 Temmuz 2024 Paris 10 m havalı tabanca karma takım: Yusuf Dikeç ve Şevval İlayda Tarhan gümüş; Türkiye’nin ilk atıcılık olimpiyat madalyası.](https://www.issf-sports.org/news/4407)
- **itu-mandate** — [ITU bilgi ve iletişim teknolojileri, frekans ve yörünge kaynakları, teknik standartlar.](https://www.itu.int/en/about/Pages/default.aspx)
- **itu-satellite** — [Uluslararası spektrum/yörünge eşgüdümü ITU; uydu işletmecilerinin lisanslanması ulusal idare sorumluluğu.](https://www.itu.int/en/mediacentre/backgrounders/Pages/Regulation-of-Satellite-Systems.aspx)
- **milano2026** — [6 Şubat 2026 Milano-Cortina Kış Olimpiyatları açılış günü haberi; İtalya, Milano San Siro.](https://newsroom.olympics.com/record/3173)
- **nato-sweden2024** — [7 Mart 2024: İsveç’in NATO’nun 32. üyesi olması; olay tarihindeki sıra sayısı.](https://www.government.se/press-releases/2024/03/sweden-is-a-nato-member/)
- **nobel-ceremony2024** — [10 Aralık 2024 Nobel Barış Ödülü töreni Oslo Belediye Binasında.](https://www.nobelprize.org/ceremonies/the-nobel-peace-prize-award-ceremony-2024.)
- **nobel-chem2024** — [2024 kimya: David Baker protein tasarımı (1/2), Demis Hassabis ve John Jumper protein yapı tahmini (birlikte 1/2).](https://www.nobelprize.org/uploads/2024/10/press-chemistryprize2024-3.pdf)
- **nobel-chem2025** — [2025 kimya: Susumu Kitagawa, Richard Robson, Omar M. Yaghi; metal-organik kafesler.](https://www.nobelprize.org/uploads/2025/10/press-chemistryprize2025.pdf)
- **nobel-econ2024** — [2024 ekonomi ödülü: Daron Acemoğlu, Simon Johnson, James A. Robinson; kurumların oluşumu ve refaha etkisi.](https://www.nobelprize.org/uploads/2024/10/advanced-economicsciencesprize2024.pdf)
- **nobel-econ2025** — [2025 ekonomi: Joel Mokyr, Philippe Aghion, Peter Howitt; yenilik ve yaratıcı yıkım üzerinden sürekli büyüme.](https://www.nobelprize.org/uploads/2025/10/Speakersmanuscript_EconomicScience_2025_NobelPrizeLessons.pdf)
- **nobel-lit2024** — [10 Ekim 2024 duyurusu; Güney Koreli Han Kang, Nobel Edebiyat Ödülü.](https://www.nobelprize.org/prizes/literature/2024/press-release/Machine/)
- **nobel-lit2025** — [2025 Nobel Edebiyat Ödülü László Krasznahorkai; 2024 Han Kang ile yıllık ayrım.](https://www.nobelprize.org/nobel_prizes/literature/laureates/)
- **nobel-med2024** — [2024 tıp: Victor Ambros ve Gary Ruvkun; mikroRNA ve gen düzenlenmesindeki rolü.](https://www.nobelprize.org/uploads/2024/11/press-medicineprize2024.pdf)
- **nobel-med2025** — [2025 tıp: Mary Brunkow, Fred Ramsdell, Shimon Sakaguchi; periferik immün tolerans.](https://www.nobelprize.org/uploads/2025/10/press-medicineprize2025.pdf)
- **nobel-peace2024** — [2024 Nobel Barış Ödülü Japon örgüt Nihon Hidankyo; nükleer silahsızlanma ve tanıklık.](https://www.nobelprize.org/uploads/2024/11/press-peaceprize2024-2.pdf)
- **nobel-peace2025** — [2025 Nobel Barış Ödülü María Corina Machado; Venezuela’daki demokratik haklar ve barışçıl geçiş çalışmaları.](https://www.nobelprize.org/uploads/2025/10/press-peaceprize2025.pdf)
- **nobel-physics2024** — [2024 fizik: John Hopfield ve Geoffrey Hinton; yapay sinir ağlarıyla makine öğrenmesine temel katkılar.](https://www.nobelprize.org/prizes/physics/2024/press-release/?session_id=session-vikx8pb5k)
- **nobel-physics2025** — [2025 fizik: John Clarke, Michel Devoret, John Martinis; elektrik devresinde makroskopik kuantum tünelleme ve enerji kuantizasyonu.](https://www.nobelprize.org/prizes/physics/2025/press-release/?gsid=6f08e7cf-850e-4d60-bd13-f301b94cf932)
- **oscars2025** — [2 Mart 2025, 97. Akademi Ödülleri; 2024 filmlerini ödüllendiren törende en iyi film Anora.](https://www.oscars.org/oscars/ceremonies/2025)
- **paris2024-calendar** — [Paris 2024 Olimpiyat Oyunları takvimi: 26 Temmuz–11 Ağustos 2024.](https://newsroom.olympics.com/record/1271)
- **paris2024-tmok** — [TMOK Paris 2024 raporu: 3 gümüş, 5 bronz, 8 madalya; madalyalı sporcular/yarışmalar; takım sonuçları.](https://api.olimpiyat.org.tr/upload/1741976267_paris_2024_rapor.pdf)
- **tua-ax3** — [Ocak 2024: Alper Gezeravcı ve Ax-3 ekibinin Uluslararası Uzay İstasyonuna ulaşması.](https://tua.gov.tr/tr/haberler/kenetlenme-basarili)
- **tua-program** — [TUA 2025 Performans Programı: Gezeravcı’nın yörünge görevi ve Atasever’in 8 Haziran 2024 yörünge altı araştırma uçuşu.](https://cdn.tua.gov.tr/679399ed1cd1a.pdf)
- **tua-return** — [9 Şubat 2024: Alper Gezeravcı’nın Dünya’ya dönüşü.](https://tua.gov.tr/tr/haberler/turkiye-nin-ilk-astronotu-alper-gezeravci-dunya-ya-indi)
- **turksat-6a-orbit** — [TÜRKSAT 6A’nın 42° doğu yörüngesi ve 21 Nisan 2025 hizmet tarihi.](https://www.turksat.com.tr/haberler/turksat-6a-uzay-vatanda-1-yilini-doldurdu)
- **turksat-6a-service** — [21 Nisan 2025: Türkiye’nin yerli haberleşme uydusu TÜRKSAT 6A’nın hizmete alınması.](https://www.turksat.com.tr/haberler/turksat-6a-cumhurbaskani-erdoganin-katildigi-torenle-hizmete-alindi)
- **ucl2025** — [31 Mayıs 2025 UEFA Şampiyonlar Ligi finali: PSG 5–0 Inter; PSG’nin ilk şampiyonluğu.](https://www.uefa.com/uefachampionsleague/news/0299-1de417608530-15b01ff7b150-1000/)
- **un-bbnj** — [Ulusal yetki alanları dışındaki deniz biyolojik çeşitliliği anlaşması; 19 Haziran 2023 kabulü ve 17 Ocak 2026 yürürlüğe girişi.](https://www.un.org/bbnjagreement/en)
- **un-cooperatives** — [2025 Uluslararası Kooperatifler Yılı; ekonomik ve sosyal kalkınmada kooperatifler.](https://www.un.org/sustainabledevelopment/blog/2024/06/press-release-iyc2025/)
- **un-digital** — [Küresel Dijital İlkeler Sözleşmesi: dijital iş birliği ve dijital uçurumların azaltılması.](https://www.un.org/en/summit-of-the-future/global-digital-compact)
- **un-ffd4** — [30 Haziran–3 Temmuz 2025 Sevilla/İspanya, Kalkınmanın Finansmanı Dördüncü Uluslararası Konferansı ve Sevilla Taahhüdü.](https://www.un.org/sustainabledevelopment/blog/2025/07/ffd4-closing-press-release/)
- **un-ga-vote** — [BM Genel Kurulunda her üye devletin bir oyu vardır.](https://www.un.org/en/ga/about/ropga/plenary.shtml)
- **un-glaciers** — [2025 Uluslararası Buzulların Korunması Yılı; 2025’ten başlayarak 21 Mart Dünya Buzullar Günü.](https://www.un.org/en/node/229429)
- **un-icj** — [UAD BM’nin başlıca yargı organıdır; devletler arası uyuşmazlıklar ve danışma görüşleri; Lahey.](https://www.un.org/en/our-work/uphold-international-law)
- **un-mainbodies** — [BM’nin altı ana organı; Genel Kurul, Güvenlik Konseyi, ECOSOC, Vesayet Konseyi, UAD, Sekreterlik.](https://www.un.org/en/about-us/main-bodies)
- **un-ocean2025** — [2025 BM Okyanus Konferansı 9–13 Haziran’da Nice’te; Fransa ve Kosta Rika ortak ev sahipliği; SKA 14.](https://unstats.un.org/sdgs/files/report/2025/2025_Factsheets.pdf)
- **un-pact** — [22 Eylül 2024 Gelecek Paktı; Küresel Dijital İlkeler Sözleşmesi ve Gelecek Nesiller Bildirgesi ekleri.](https://www.un.org/pact-for-the-future/en/pacts-journey)
- **un-play2024** — [11 Haziran 2024’te ilk Uluslararası Oyun Günü; çocukların oyun hakkı.](https://www.un.org/en/node/217717)
- **un-security** — [Güvenlik Konseyinin uluslararası barış ve güvenlik sorumluluğu ve üyelik yapısı.](https://main.un.org/securitycouncil/en/content/what-security-council)
- **un-sg-appointment** — [BM Şartı madde 97: Genel Sekreter, Güvenlik Konseyinin tavsiyesi üzerine Genel Kurulca atanır.](https://www.un.org/sg/en/content/appointment-secretary-general)
- **un-social2025** — [Kasım 2025 Doha/Katar İkinci Dünya Sosyal Kalkınma Zirvesi; yoksulluk, insana yakışır iş ve sosyal kapsayıcılık.](https://www.un.org/en/desa-en/doha-summit-ends-call-turn-social-pledges-action)
- **undp-mandate** — [UNDP yoksullukla mücadele, yönetişim, kalkınma kapasitesi ve kriz dayanıklılığı.](https://www.undp.org/about-us)
- **unep-mandate** — [UNEP küresel çevre gündemi, sürdürülebilir kalkınmanın çevre boyutu; Nairobi merkezi.](https://www.unep.org/about-un-environment/why-does-un-environment-matter)
- **unep-wed2024** — [2024 Dünya Çevre Günü Suudi Arabistan ev sahipliği; arazi restorasyonu, çölleşme ve kuraklığa dayanıklılık.](https://www.unep.org/news-and-stories/statements/world-environment-day-2024-accelerating-land-restoration-drought)
- **unep-wed2025** — [2025 Dünya Çevre Günü Kore Cumhuriyeti/Jeju; plastik kirliliğiyle mücadele.](https://www.unep.org/news-and-stories/press-release/world-environment-day-2025-mobilizes-commitment-action-end-plastic)
- **unesco-book** — [Dünya Kitap Başkentleri listesi: 2024 Strasbourg, 2025 Rio de Janeiro, 2026 Rabat.](https://www.unesco.org/en/world-book-capital)
- **unesco-decade** — [2024–2033 Sürdürülebilir Kalkınma için Uluslararası Bilimler On Yılı; UNESCO öncülüğü.](https://articles.unesco.org/sites/default/files/medias/fichiers/2024/12/PR_UNESCO_launches_the_International_Decade_of_Science_for_Sustainable_Development_2024-2033_en.pdf)
- **unesco-mandate** — [UNESCO eğitim, bilim, kültür, iletişim ve bilgi alanlarındaki uluslararası iş birliği.](https://www.unesco.org/en/about-us)
- **unesco-quantum** — [2025 Uluslararası Kuantum Bilimi ve Teknolojisi Yılı; UNESCO eşgüdümü.](https://www.unesco.org/en/years/quantum-science-technology?hub=195885)
- **unesco-rabat2026** — [8 Ekim 2024 duyurusuyla Rabat/Fas’ın 2026 Dünya Kitap Başkenti seçilmesi; okuma ve yayıncılık, 23 Nisan 2026 başlangıcı.](https://www.unesco.org/en/articles/unesco-names-rabat-world-book-capital-2026?hub=370)
- **unesco-sardis-decision** — [47 COM 8B.30 kararı: Sardes ve Bin Tepe Lidya Tümülüslerinin (iii) ölçütüyle Dünya Miras Listesine alınması.](https://whc.unesco.org/en/decisions/8964)
- **unesco-sardis2025** — [2025 Dünya Miras Listesine kaydı: Sardes ve Bin Tepe Lidya Tümülüsleri, Türkiye; Lidya başkenti ve tümülüsler, kültürel seri alan.](https://whc.unesco.org/en/list/1731)
- **unfccc-cop29** — [COP29, Kasım 2024, Bakü/Azerbaycan, iklim değişikliği konferansı.](https://unfccc.int/cop29)
- **unfccc-cop30** — [COP30, Kasım 2025, Belém/Brezilya.](https://unfccc.int/cop30)
- **unfccc-finance** — [COP29’da gelişmekte olan ülkeler için 2035’e kadar yıllık en az 300 milyar dolar iklim finansmanı hedefi.](https://unfccc.int/news/cop29-un-climate-conference-agrees-to-triple-finance-to-developing-countries-protecting-lives-and)
- **unhcr-mandate** — [UNHCR mülteciler, sığınmacılar, yerinden edilenler ve vatansız kişilerin korunması.](https://www.unhcr.org/about-unhcr/who-we-protect)
- **unicef-mandate** — [UNICEF çocuk hakları, eğitim, sağlık, beslenme ve korunma çalışmaları.](https://www.unicef.org/what-we-do)
- **unodc-hanoi** — [25–26 Ekim 2025 Hanoi/Vietnam BM Siber Suçlarla Mücadele Sözleşmesi imza töreni.](https://www.un.org/ola/en/node/1234)
- **unv2026** — [2026 Uluslararası Sürdürülebilir Kalkınma için Gönüllüler Yılı; 5 Aralık 2025 açılışı.](https://www.unv.org/sites/default/files/IVY%202026%20-%20Quick%20Facts%20and%20Key%20Messages.pdf)
- **unwomen-mandate** — [UN Women toplumsal cinsiyet eşitliği ve kadınların güçlenmesi alanındaki BM birimi.](https://chile.unwomen.org/en/quienes-somos-cl/acerca-de-onu-mujeres)
- **volleymen2025** — [28 Eylül 2025 erkekler Dünya Voleybol Şampiyonası Filipinler finali: İtalya Bulgaristan’ı yenerek şampiyon.](https://en.volleyballworld.com/volleyball/competitions/men-world-championship/news/italy-beat-bulgaria-to-triumph-with-second-consecutive-and-fifth-overall-world-title)
- **volleywomen2024** — [Paris 2024 kadınlar voleybol: İtalya’nın ilk Olimpiyat voleybol altını.](https://www.fivb.com/italys-historic-olympic-gold-earns-prestigious-prize-at-anoc-awards/)
- **volleywomen2025** — [7 Eylül 2025 kadınlar Dünya Voleybol Şampiyonası Bangkok finali: İtalya 3–2 Türkiye; setler ve sonuç.](https://en.volleyballworld.com/volleyball/competitions/women-world-championship/news/italy-continue-dominate-claim-world-title)
- **wfp-mandate** — [WFP acil durumlarda gıda yardımı, beslenme ve dayanıklı geçim kaynakları.](https://www.wfp.org/who-we-are)
- **who-ihr2024** — [WHO Haziran 2024 raporu: 1 Haziran 2024’te Uluslararası Sağlık Tüzüğü değişikliklerinin kabulü.](https://cdn.who.int/media/docs/default-source/documents/emergencies/who_wou_jun_2024.pdf?download=true&sfvrsn=76a655fb_3)
- **who-pandemic2025** — [20 Mayıs 2025 Dünya Sağlık Asamblesinin pandemi anlaşmasını kabulü; ulusal sağlık politikalarını emretme yetkisi vermediği açıklaması.](https://www.who.int/news/item/20-05-2025-world-health-assembly-adopts-historic-pandemic-agreement-to-make-the-world-more-equitable-and-safer-from-future-pandemics)
- **wipo-mandate** — [WIPO fikrî mülkiyet, yenilikçilik ve yaratıcılık alanında uluslararası iş birliği.](https://www.wipo.int/en/web/about-wipo)
- **womeneuro2025** — [27 Temmuz 2025 kadınlar Avrupa Futbol Şampiyonası: İngiltere, İspanya’yı penaltılarla yenerek şampiyon.](https://www.uefa.com/womenseuro/news/029b-1e56a4b43051-3ec6381b01f6-1000/)
- **worldbank-mandate** — [Dünya Bankası Grubu kalkınma finansmanı ve yoksulluğun azaltılması; IBRD, IDA, IFC, MIGA, ICSID işlevleri.](https://www.worldbank.org/ext/en/who-we-are)
- **wto-accessions2024** — [DTÖ 2024 yıllık raporu: Komorlar 21 Ağustos, Timor-Leste 30 Ağustos 2024’te üye oldu.](https://www.wto.org/english/tratop_e/devel_e/teccop_e/ta_annrep24_e.pdf)
- **wto-mandate** — [DTÖ ülkeler arası ticaret kuralları ve anlaşmaları; Cenevre.](https://www.wto.org/english/thewto_e/whatis_e/whatis_e.htm)

## Yazar araçları

`work/guncel-author/topic1.py`, `topic2.py`, `topic3.py` tek tek yazılan tanımları; `build.py` şema dönüştürmesini; üç kaynak dosyası resmî URL kayıtlarını içerir. Nihai JS dosyaları esas alınmalıdır; son bağımsız inceleme düzeltmeleri ve imzaları içerir; eski üretim betikleri yeniden çalıştırılmamalıdır.

## Bağımsız incelemede eklenen kaynaklar

- [BM Güvenlik Konseyi üyelik yapısı](https://main.un.org/securitycouncil/en/content/current-members): beş daimî, on seçilmiş üye.
- [WHO etik ilkeleri](https://www.who.int/docs/default-source/documents/ethics/code-of-ethics-pamphlet-en.pdf): BM uzman kuruluşu statüsü.

Düzeltmeler özellikle COP29 finansman hedefi ile gerçekleşen ödeme ayrımı, UNESCO seri kültürel alan kaydı, kurumsal yetki sınırları, ödül alan kişi–çalışma eşleştirmesi, etkinlik kronolojisi ve 2025 spor sonuçlarının doğru şehir–turnuva–yıl bağlamı üzerinde yoğunlaşmıştır.
