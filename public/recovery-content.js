(function(root){
'use strict';
const METHODS=Object.freeze({
 'k-ma':{logic:'Verilenleri ve isteneni ayır. Bilinmeyeni tanımlayıp ilişkileri bir eşitlik, şekil veya tablo üzerinde kur.',check:'Bulduğun değeri başlangıç koşullarına geri koy. Birimi, işareti ve hangi büyüklüğün sorulduğunu kontrol et.'},
 'k-tr':{logic:'Yargını metindeki bir ifadeye dayandır. Kendi genel bilgin ile metnin söylediğini birbirinden ayır.',check:'Seçeneğin bütününü denetle. Bir kısmı doğru olan fakat kapsamı genişleten veya kesinlik ekleyen seçeneği ele.'},
 'k-ta':{logic:'Olayı dönem, neden ve sonuç ilişkisi içinde konumlandır. Önce gerçekleşen bir olayı sonraki dönemin özelliğiyle açıklama.',check:'Kişi, kurum ve olayın aynı döneme ait olup olmadığını kontrol et. Neden ile sonucu birbirinin yerine kullanma.'},
 'k-co':{logic:'Sorunun istediği dağılışı veya ilişkiyi belirle. Doğal koşul ile beşerî etkiyi ayrı değerlendir.',check:'Genellemenin bölge, mevsim ve ölçek sınırına dikkat et. Tek bir örnekten bütün ülke için sonuç çıkarma.'},
 'k-va':{logic:'Kavramın tanımını belirle; kurumun yetkisi ile yaptığı işlemi eşleştir. Genel kuralı, istisnayı ve koşulu ayır.',check:'Birbirine yakın kurumları ve yetkileri karşılaştır. Açıklamada verilen kapsamın dışına çıkma.'},
 'k-gu':{logic:'Sorunun dayandığı olguyu, kurumu veya bilimsel kavramı ayırt et. Tarihe bağlı bir bilgi varsa sorudaki tarihi esas al.',check:'Kurumun adı ile işlevini karıştırma. Soruda verilmeyen güncel bir durumu varsayma.'}
});
const SKILLS=Object.freeze({knowledge:'Gereken bilgiyi önce kendi sözlerinle hatırla; ardından seçenekteki kişi, kavram veya koşulla eşleştir.',concept:'Yakın kavramların ortak ve ayırıcı özelliklerini yaz; sorunun hangi özelliği ölçtüğünü belirle.',interpretation:'Verilen bulguyu yorumundan ayır; seçeneğin verilen bilginin sınırını aşıp aşmadığını denetle.',chronology:'Olayları önce–sonra sırasına koy; eş zamanlılık ile neden olmayı birbirine karıştırma.','cause-effect':'Nedeni, koşulu ve sonucu ayrı yaz; bir olayın önce gelmesi tek başına neden olduğunu göstermez.',comparison:'Karşılaştırılanları aynı ölçüte göre yan yana getir; ölçüt değiştirerek yapılan karşılaştırmayı ele.',inference:'Sonucun hangi öncüle dayandığını göster; öncüllerin desteklemediği ek varsayımı çıkar.',paragraph:'Sorulan yargıyı paragraftaki dayanağıyla eşleştir; örnek, gerekçe ve ana düşüncenin görevini ayır.',table:'Satır ve sütun başlıklarını, birimi ve toplamı oku; mutlak fark ile oransal değişimi ayrı hesapla.',graph:'Önce eksenleri, ölçeği ve birimi oku; grafiğin gösterdiği değişimden daha geniş bir sonuç çıkarma.',map:'Haritadaki işareti ve ölçeği oku; konum bilgisiyle sorulan dağılış veya ilişkiyi eşleştir.',calculation:'Bilinmeyeni ve birimini tanımla; ilişkileri kurduktan sonra işlem yap ve sonucu koşullarda denetle.',mixed:'Her bilgiyi ayrı bir koşula dönüştür; seçenekleri tek bir ipucuyla değil koşulların tamamıyla sına.'});
function build(question){
 if(!question||question.qualityStatus!=='approved'||typeof question.explanation!=='string'||!question.explanation.trim()||typeof question.learningObjective!=='string'||!question.learningObjective.trim()||!Array.isArray(question.options)||question.options.length!==5||question.options.some(o=>typeof o!=='string'||!o.trim())||new Set(question.options.map(o=>o.trim().normalize('NFC'))).size!==5||!Number.isInteger(question.answer)||question.answer<0||question.answer>4)throw Error('Bu beceri için doğrulanmış mikro içerik bulunamadı.');
 const method=METHODS[question.subjectId];if(!method)throw Error('Bu ders henüz desteklenmiyor.');
 const steps=String(question.explanation).split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9])/u).map(x=>x.trim()).filter(Boolean);
 const thinking=SKILLS[question.skill]||SKILLS[question.questionType]||method.logic;
 return {objective:question.learningObjective,logic:method.logic,rule:steps[0],commonMistake:question.commonMistake||'Seçimini açıklamadaki koşullarla karşılaştır.',thinking,steps,check:method.check,sourceQuestionId:question.id};
}
root.RotaRecoveryContent=Object.freeze({build});
if(typeof module==='object')module.exports=root.RotaRecoveryContent;
})(typeof window!=='undefined'?window:globalThis);
