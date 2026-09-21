(function(root){
'use strict';
const bank=root.RotaKpssProfessionalHistory;
if(!bank||!Array.isArray(bank.tests))return;
const byQuestionId=new Map(bank.tests.flatMap(t=>t.questions||[]).map(q=>[q.id,q]));

const cultureT1Q7=byQuestionId.get('kta6-t1-q07');
if(cultureT1Q7){
  cultureT1Q7.historyForm='evidence-inference';
  cultureT1Q7.distractorPolicy='same-concept-family';
}

const stemRefinements={
  'kta9-t3-q01':'Millî Mücadele hazırlık sürecindeki aşağıdaki gelişmelerden hangisi kronolojik olarak önce gerçekleşmiştir?',
  'kta11-t3-q01':'Cumhuriyet inkılaplarıyla ilgili aşağıdaki gelişmelerden hangisi kronolojik olarak diğerlerinden önce gerçekleşmiştir?',
  'kta12-t3-q01':'Atatürk dönemi dış politika gelişmelerinden hangisi kronolojik olarak diğerlerinden önce gerçekleşmiştir?',
  'kta13-t3-q01':'Çağdaş dünya düzeninin oluşumuyla ilgili aşağıdaki gelişmelerden hangisi kronolojik olarak diğerlerinden önce gerçekleşmiştir?'
};
for(const [id,text] of Object.entries(stemRefinements)){
  const question=byQuestionId.get(id);
  if(question)question.text=text;
}
})(typeof window!=='undefined'?window:globalThis);
