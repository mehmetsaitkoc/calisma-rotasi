# -*- coding: utf-8 -*-
import pathlib,json,re,itertools
qs=[]
for p in (pathlib.Path(__file__).resolve().parents[1]/'public/questions/kpss/turkce').glob('*/test-*.js'):
 o=json.JSONDecoder().raw_decode(p.read_text().split('registerTest(',1)[1])[0]
 if o['topicId']=='k-tr-4':qs+=o['questions']
def rule(s):
 s=s.strip()
 pats=[
 (r'(.+), (\d+)\. sıradaysa (.+), (\d+)\. sıradadır\.',lambda m,p:p[m[1]]!=int(m[2]) or p[m[3]]==int(m[4])),
 (r'(.+) öğesinin hemen ardından (.+) gelir\.',lambda m,p:p[m[2]]==p[m[1]]+1),
 (r'(.+), (.+) adlı öğeden önce yer alır\.',lambda m,p:p[m[1]]<p[m[2]]),
 (r'(.+), (.+) öğesinden önce gelir\.',lambda m,p:p[m[1]]<p[m[2]]),
 (r'(.+) ile (.+) arasında tam (\d+) öğe bulunur\.',lambda m,p:abs(p[m[1]]-p[m[2]])==int(m[3])+1),
 (r'(.+), (.+) ile (.+) arasındadır;.*',lambda m,p:min(p[m[2]],p[m[3]])<p[m[1]]<max(p[m[2]],p[m[3]])),
 (r'(.+) ile (.+) yan yana değildir\.',lambda m,p:abs(p[m[1]]-p[m[2]])!=1),
 (r'(.+) ile (.+) yan yana(?:dır| gelir)\.',lambda m,p:abs(p[m[1]]-p[m[2]])==1),
 (r'(.+), (\d+)\.? veya (\d+)\. sırada değildir\.',lambda m,p:p[m[1]] not in (int(m[2]),int(m[3]))),
 (r'(.+), (\d+)\. veya (\d+)\. sıradadır\.',lambda m,p:p[m[1]] in (int(m[2]),int(m[3]))),
 (r'(.+), (\d+)\. sırada değildir\.',lambda m,p:p[m[1]]!=int(m[2])),
 (r'(.+), (\d+)\. (?:sıradadır|sırada yer alır)\.',lambda m,p:p[m[1]]==int(m[2]))]
 for pat,f in pats:
  m=re.fullmatch(pat,s)
  if m:return lambda p,m=m,f=f:f(m,p)
 raise ValueError(s)
report=[]
for q in qs:
 numbered=re.findall(r'^\d+\. (.+)$',q['text'],re.M)
 if not numbered:continue
 seq=next((x for x in q['options'] if ' – ' in x),None)
 if not seq:
  ex=q['explanation']
  seq=(ex.split('örnek sıra: ')[1] if 'örnek sıra: ' in ex else ex.split('düzen kalır. ')[1]).split(';')[0].split('.')[0]
 names=seq.split(' – ')
 rules=[rule(x) for x in numbered]
 solutions=[p for perm in itertools.permutations(names) if all(r(p:={name:i+1 for i,name in enumerate(perm)}) for r in rules)]
 assert solutions,(q['id'],'no solution')
 if 'kaç farklı sıralama' in q['text']:
  valid=[i for i,o in enumerate(q['options']) if int(o)==len(solutions)]
 elif 'sıralamalardan hangisi' in q['text']:
  valid=[i for i,o in enumerate(q['options']) if all(r({name:j+1 for j,name in enumerate(o.split(' – '))}) for r in rules)]
 else:
  preds=[rule(o) for o in q['options']]
  impossible='gerçekleşemez' in q['text']
  valid=[i for i,r in enumerate(preds) if (not any(r(p) for p in solutions) if impossible else all(r(p) for p in solutions))]
 assert valid==[q['answer']],(q['id'],valid,q['answer'])
 report.append({'id':q['id'],'permutations':len(list(itertools.permutations(names))),'validPlacements':len(solutions),'uniqueCorrectOption':q['answer']})
assert len(report)==36
# Read-only regression check; final review ledger is stored in docs.
print('36 logic items independently verified from final textual rules; each has exactly one correct option.')
