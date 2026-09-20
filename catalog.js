/* Düzenlenebilir başlangıç konu ve deneme şablonları.
 * Bu listeler resmi ve eksiksiz bir müfredat iddiası taşımaz.
 * Soru sayıları öğrencinin kullandığı denemeye göre formda değiştirilebilir. */
(function(root){
'use strict';
const subjects=[];
function course(id,exam,stage,name,short,topics,tracks=[]){subjects.push({id,exam,stage,name,short,tracks,topics:topics.split('|').map((title,i)=>({id:`${id}-${i+1}`,title,subjectId:id}))});}
course('k-tr','kpss','GY','Türkçe','Tr','Sözcükte anlam|Cümlede anlam|Paragrafta anlam|Sözel mantık|Ses bilgisi|Yazım kuralları|Noktalama işaretleri|Sözcük türleri|Cümlenin ögeleri|Cümle türleri|Anlatım bozuklukları');
course('k-ma','kpss','GY','Matematik ve geometri','Ma','Temel kavramlar|Sayı basamakları|Bölme ve bölünebilme|Asal çarpanlar, EBOB ve EKOK|Rasyonel sayılar|Eşitsizlikler ve mutlak değer|Üslü ve köklü sayılar|Oran, orantı ve denklemler|Problemler|Kümeler|Olasılık ve kombinasyon|Sayısal mantık|Üçgenler|Dörtgenler ve çokgenler|Çember ve daire|Analitik geometri|Katı cisimler');
course('k-ta','kpss','GK','Tarih','Ta','İslamiyet öncesi Türk tarihi|İlk Türk İslam devletleri|Türkiye Selçuklu Devleti|Osmanlı kuruluş dönemi|Osmanlı yükselme dönemi|Osmanlı kültür ve medeniyeti|Osmanlı yenileşme hareketleri|20. yüzyılda Osmanlı Devleti|Millî Mücadele hazırlık dönemi|Kurtuluş Savaşı cepheleri|Atatürk ilke ve inkılapları|Atatürk dönemi dış politika|Çağdaş Türk ve dünya tarihi');
course('k-co','kpss','GK','Coğrafya','Co','Türkiye’nin coğrafi konumu|Türkiye’nin yer şekilleri|Türkiye’nin iklimi ve bitki örtüsü|Toprak ve su varlığı|Nüfus ve yerleşme|Göçler|Tarım ve hayvancılık|Maden ve enerji kaynakları|Sanayi|Ulaşım ve ticaret|Turizm|Bölgesel kalkınma');
course('k-va','kpss','GK','Vatandaşlık','Va','Hukukun temel kavramları|Devlet ve demokrasi|Anayasal gelişmeler|Temel hak ve özgürlükler|Yasama|Yürütme|Yargı|İdare hukuku');
course('k-gu','kpss','GK','Güncel bilgiler','Gü','Güncel gelişme notlarım|Kurum ve kuruluşlar|Kültür, sanat ve spor notlarım');
course('t-tr','yks','TYT','Türkçe','Tr','Sözcükte anlam|Cümlede anlam|Paragraf|Ses bilgisi|Yazım kuralları|Noktalama işaretleri|Sözcük yapısı|Sözcük türleri|Fiiller ve fiilimsiler|Cümlenin ögeleri|Cümle türleri|Anlatım bozuklukları');
course('t-ma','yks','TYT','Matematik','Ma','Temel kavramlar|Sayı basamakları|Bölünebilme|EBOB ve EKOK|Rasyonel sayılar|Eşitsizlikler|Mutlak değer|Üslü sayılar|Köklü sayılar|Çarpanlara ayırma|Oran ve orantı|Denklemler|Problemler|Kümeler|Mantık|Fonksiyonlara giriş|Permütasyon ve kombinasyon|Olasılık|Veri ve istatistik');
course('t-ge','yks','TYT','Geometri','Ge','Doğruda ve üçgende açılar|Üçgenlerde benzerlik|Dik ve özel üçgenler|Üçgende alan|Çokgenler|Dörtgenler|Çember ve daire|Katı cisimler|Analitik geometriye giriş');
course('t-ta','yks','TYT','Tarih','Ta','Tarih ve zaman|İnsanlığın ilk dönemleri|Orta Çağ’da dünya|İlk Türk devletleri|İslam medeniyetinin doğuşu|Türklerin İslamiyet’i kabulü|Selçuklular|Osmanlı Devleti|Millî Mücadele|Atatürk ilke ve inkılapları');
course('t-co','yks','TYT','Coğrafya','Co','Doğa ve insan|Dünya’nın şekli ve hareketleri|Coğrafi konum|Harita bilgisi|İklim bilgisi|Yer şekilleri|Su, toprak ve bitkiler|Nüfus ve göç|Yerleşme|Ekonomik faaliyetler|Doğal afetler ve çevre');
course('t-fe','yks','TYT','Felsefe','Fe','Felsefeye giriş|Bilgi felsefesi|Varlık felsefesi|Ahlak felsefesi|Sanat felsefesi|Din felsefesi|Siyaset felsefesi|Bilim felsefesi');
course('t-di','yks','TYT','Din kültürü / ilave felsefe','Di','Bilgi ve inanç|Din ve İslam|İbadet ve ahlak|İslam düşüncesi|Dinler ve yorumlar|İlave felsefe çalışma notlarım');
course('t-fi','yks','TYT','Fizik','Fi','Fizik bilimine giriş|Madde ve özellikleri|Hareket ve kuvvet|İş, güç ve enerji|Isı ve sıcaklık|Basınç|Kaldırma kuvveti|Elektrik|Manyetizma|Dalgalar|Optik');
course('t-ki','yks','TYT','Kimya','Ki','Kimya bilimi|Atom ve periyodik sistem|Kimyasal türler arası etkileşimler|Maddenin hâlleri|Doğa ve kimya|Kimyanın temel kanunları|Kimyasal hesaplamalar|Karışımlar|Asit, baz ve tuz|Kimya her yerde');
course('t-bi','yks','TYT','Biyoloji','Bi','Canlıların ortak özellikleri|Canlıların temel bileşenleri|Hücre|Hücre zarından madde geçişleri|Canlıların sınıflandırılması|Hücre bölünmeleri|Kalıtımın genel ilkeleri|Ekosistem ekolojisi|Çevre sorunları');
course('a-ma','yks','AYT','Matematik','Ma','Fonksiyonlar|Polinomlar|İkinci dereceden denklemler|Karmaşık sayılar|Parabol|Eşitsizlikler|Trigonometri|Üstel ve logaritmik fonksiyonlar|Diziler|Limit ve süreklilik|Türev|İntegral|Olasılık', ['say','ea']);
course('a-ge','yks','AYT','Geometri','Ge','Üçgenler ve çokgenler|Çember ve daire|Analitik geometri|Dönüşüm geometrisi|Katı cisimler',['say','ea']);
course('a-fi','yks','AYT','Fizik','Fi','Vektörler|Kuvvet, tork ve denge|Hareket|Newton’un hareket yasaları|İş ve enerji|İtme ve momentum|Elektrik alan ve potansiyel|Manyetizma ve indüksiyon|Alternatif akım|Çembersel hareket|Basit harmonik hareket|Dalga mekaniği|Atom ve modern fizik',['say']);
course('a-ki','yks','AYT','Kimya','Ki','Modern atom teorisi|Gazlar|Çözeltiler|Kimyasal tepkimelerde enerji|Tepkime hızı|Kimyasal denge|Asit baz dengesi|Çözünürlük dengesi|Kimya ve elektrik|Karbon kimyasına giriş|Organik bileşikler|Enerji kaynakları',['say']);
course('a-bi','yks','AYT','Biyoloji','Bi','Sinir sistemi|Endokrin sistem|Duyu organları|Destek ve hareket|Sindirim|Dolaşım ve bağışıklık|Solunum|Üriner sistem|Üreme ve gelişme|Komünite ve popülasyon|Genden proteine|Fotosentez ve kemosentez|Hücresel solunum|Bitki biyolojisi',['say']);
course('a-ed','yks','AYT','Türk dili ve edebiyatı','Ed','Edebî bilgiler ve sanatlar|Şiir bilgisi|İslamiyet öncesi Türk edebiyatı|Geçiş dönemi|Halk edebiyatı|Divan edebiyatı|Tanzimat edebiyatı|Servetifünun|Fecriati|Millî Edebiyat|Cumhuriyet dönemi şiiri|Cumhuriyet dönemi roman ve hikâyesi|Tiyatro ve öğretici metinler',['ea','soz']);
course('a-t1','yks','AYT','Tarih-1','T1','İlk Çağ uygarlıkları|İlk Türk devletleri|İslam ve Türk İslam tarihi|Selçuklular|Osmanlı Devleti|Millî Mücadele|Atatürk dönemi',['ea','soz']);
course('a-c1','yks','AYT','Coğrafya-1','C1','Doğal sistemler|Nüfus ve yerleşme|Ekonomik faaliyetler|Türkiye ekonomisi|Küresel ortam|Çevre ve toplum',['ea','soz']);
course('a-t2','yks','AYT','Tarih-2','T2','Türk İslam devletleri|Osmanlı değişim ve dönüşümü|Millî Mücadele|Atatürk dönemi|İki savaş arası dönem|II. Dünya Savaşı|Soğuk Savaş|Küreselleşen dünya',['soz']);
course('a-c2','yks','AYT','Coğrafya-2','C2','Doğal sistemler|Beşerî sistemler|Ekonomik faaliyetler|Türkiye’nin bölgeleri|Küresel ve bölgesel ilişkiler|Çevre sorunları',['soz']);
course('a-fg','yks','AYT','Felsefe grubu','Fg','Felsefe tarihi|Psikoloji bilimi|Öğrenme, bellek ve düşünme|Ruh sağlığı ve kişilik|Sosyolojiye giriş|Toplumsal yapı ve değişme|Mantığa giriş|Klasik mantık|Sembolik mantık',['soz']);
course('a-di','yks','AYT','Din kültürü / ilave felsefe','Di','İslam düşüncesi|Din, kültür ve medeniyet|Ahlak ve değerler|Dinler|İlave felsefe çalışma notlarım',['soz']);
course('d-yd','yks','YDT','Yabancı dil','Yd','Kelime çalışması|Dil bilgisi|Cümle tamamlama|Paragraf tamamlama|Okuduğunu anlama|Çeviri|Anlamca yakın cümle|Diyalog tamamlama|Anlam bütünlüğünü bozan cümle',['dil']);
const TRACKS={tyt:'Yalnızca TYT',say:'Sayısal',ea:'Eşit ağırlık',soz:'Sözel',dil:'Dil'};
const TYPES={
 KPSS:{exam:'kpss',label:'KPSS · GY–GK',parts:[['Türkçe',30],['Matematik',30],['Tarih',27],['Coğrafya',18],['Vatandaşlık',9],['Güncel bilgiler',6]]},
 TYT:{exam:'yks',label:'TYT',parts:[['Türkçe',40],['Sosyal bilimler',20],['Temel matematik',40],['Fen bilimleri',20]]},
 AYT_SAY:{exam:'yks',label:'AYT · Sayısal',parts:[['Matematik',40],['Fizik',14],['Kimya',13],['Biyoloji',13]]},
 AYT_EA:{exam:'yks',label:'AYT · Eşit ağırlık',parts:[['Matematik',40],['Türk dili ve edebiyatı',24],['Tarih-1',10],['Coğrafya-1',6]]},
 AYT_SOZ:{exam:'yks',label:'AYT · Sözel',parts:[['Türk dili ve edebiyatı',24],['Tarih-1',10],['Coğrafya-1',6],['Tarih-2',11],['Coğrafya-2',11],['Felsefe grubu',12],['Din kültürü / ilave felsefe',6]]},
 YDT:{exam:'yks',label:'YDT',parts:[['Yabancı dil',80]]}
};
const PART_SUBJECTS={
 KPSS:{'Türkçe':['k-tr'],'Matematik':['k-ma'],'Tarih':['k-ta'],'Coğrafya':['k-co'],'Vatandaşlık':['k-va'],'Güncel bilgiler':['k-gu']},
 TYT:{'Türkçe':['t-tr'],'Sosyal bilimler':['t-ta','t-co','t-fe','t-di'],'Temel matematik':['t-ma','t-ge'],'Fen bilimleri':['t-fi','t-ki','t-bi']},
 AYT_SAY:{'Matematik':['a-ma','a-ge'],'Fizik':['a-fi'],'Kimya':['a-ki'],'Biyoloji':['a-bi']},
 AYT_EA:{'Matematik':['a-ma','a-ge'],'Türk dili ve edebiyatı':['a-ed'],'Tarih-1':['a-t1'],'Coğrafya-1':['a-c1']},
 AYT_SOZ:{'Türk dili ve edebiyatı':['a-ed'],'Tarih-1':['a-t1'],'Coğrafya-1':['a-c1'],'Tarih-2':['a-t2'],'Coğrafya-2':['a-c2'],'Felsefe grubu':['a-fg'],'Din kültürü / ilave felsefe':['a-di']},
 YDT:{'Yabancı dil':['d-yd']}
};
root.RotaCatalog={subjects,TRACKS,TYPES,PART_SUBJECTS};
if(typeof module==='object')module.exports=root.RotaCatalog;
})(typeof window!=='undefined'?window:globalThis);

