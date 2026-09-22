# DecisionTrace Candidate Ranking v2

Bu katman DecisionTrace'i yalnız açıklama kaydı olmaktan çıkarıp aday görev karşılaştırmasının kanıt tabanlı puan katmanına dönüştürür.

## Puan modeli

Her aday iki parçalı puan taşır:

- `baseScore`: mevcut rota motorunun aday önceliği.
- `evidenceScore`: DecisionTrace reason code'larının güven düzeyiyle kalibre edilmiş katkısı.
- `finalScore`: `baseScore + evidenceScore`, 0..200 aralığında sınırlandırılır.

Kanıt ağırlıkları deterministiktir. Deneme riski, açık/tekrarlanan yanlış, 3/7 günlük tekrar, kişisel norm altı, negatif trend ve hedef aciliyeti adayı yukarı taşır. Güvenilir mastery/pozitif trend, düşük kanıt ve davranışsal sürtünme akademik aciliyeti aşağı çeker.

## Karşılaştırma sözleşmesi

`compareDecisionTraces(a,b)` iki aday için şunları üretir:

- final skor farkı,
- hangi tarafın kanıt puanında önde olduğu,
- yalnız solda ve yalnız sağda bulunan reason code avantajları,
- iki adayın base/evidence/final skor kırılımı.

Bu sayede seçim audit'i ilerleyen adımda “A seçildi, B ertelendi; çünkü A'nın tekrarlanan yanlış + deneme riski kanıtı B'nin profil önceliğinden daha güçlüydü” gibi makinece doğrulanabilir karşılaştırma üretebilir.

## Sonraki entegrasyon

Bir sonraki adım `routeBuildCandidates -> routeRebalance` sıralamasını `finalScore` ile beslemek ve `selectionAudit.deferred` kayıtlarına seçilen en yakın rakip ile skor farkını eklemektir. Bu değişiklik ayrı tutulur; böylece mevcut scheduler güvenlik sınırları (kapasite, bilişsel yük, sayısal ağır limit, review/backlog limitleri) bozulmadan test edilebilir.
