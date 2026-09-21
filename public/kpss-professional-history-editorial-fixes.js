(function(root){
'use strict';
const bank=root.RotaKpssProfessionalHistory;
if(!bank||!Array.isArray(bank.tests))return;
const test=bank.tests.find(t=>t.id==='kpss:k-ta:k-ta-6:t01');
const question=test?.questions?.find(q=>q.id==='kta6-t1-q07');
if(question){
  question.historyForm='evidence-inference';
  question.distractorPolicy='same-concept-family';
}
})(typeof window!=='undefined'?window:globalThis);
