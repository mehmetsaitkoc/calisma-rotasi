import { failure } from './validation.mjs';

// Resend's documented HTTP API; the override is restricted to loopback tests.
// No token, destination address, request body or provider response is logged.
export function createMailer(env=process.env){
 const key=env.ROTA_MAIL_API_KEY||'',from=env.ROTA_MAIL_FROM||'',origin=env.ROTA_APP_ORIGIN||env.RENDER_EXTERNAL_URL||'';
 const configured=env.ROTA_MAIL_PROVIDER==='resend'&&!!key&&!!from&&!!origin;
 let endpoint='https://api.resend.com/emails';
 if(env.ROTA_MAIL_TEST_URL){const url=new URL(env.ROTA_MAIL_TEST_URL);if(env.NODE_ENV!=='test'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||!['http:','https:'].includes(url.protocol))throw Error('E-posta test adresi yalnız testte loopback olabilir.');endpoint=url.href;}
 if(configured){const url=new URL(origin);if(url.origin!==origin||!['https:','http:'].includes(url.protocol)||((env.NODE_ENV==='production'||env.RENDER==='true')&&env.NODE_ENV!=='test'&&url.protocol!=='https:'))throw Error('E-posta bağlantısı için güvenli uygulama origin gerekli.');if(from.length>254||/[\r\n]/.test(from)||!/@/.test(from))throw Error('E-posta gönderen adresi geçersiz.');}
 function requireConfigured(){if(!configured)throw failure(503,'FEATURE_UNAVAILABLE','E-posta hizmeti henüz yapılandırılmadı. Bu işlem şu anda kullanılamıyor.');}
 async function send({email,purpose,token,requestId}){
  requireConfigured();const verify=purpose==='verify',link=new URL('/account-action.html',origin);link.hash=new URLSearchParams({mode:verify?'verify':'reset',token}).toString();
  const subject=verify?'Çalışma Rotası · E-posta adresini doğrula':'Çalışma Rotası · Parolanı yenile';
  const text=(verify?'E-posta adresini doğrulamak':'Parolanı yenilemek')+' için bu bağlantıyı aç:\n\n'+link.href+'\n\nBağlantı '+(verify?'24 saat':'30 dakika')+' geçerlidir ve yalnız bir kez kullanılabilir. Bu isteği sen yapmadıysan bağlantıyı kullanma.\nÇalışma Rotası';
  let response;try{response=await fetch(endpoint,{method:'POST',redirect:'error',signal:AbortSignal.timeout(env.NODE_ENV==='test'?Number(env.ROTA_MAIL_TEST_TIMEOUT_MS)||500:10000),headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':requestId},body:JSON.stringify({from,to:[email],subject,text})});}catch{throw failure(503,'MAIL_UNAVAILABLE','E-posta gönderimi şu anda doğrulanamadı. Biraz sonra tekrar dene.');}
  if(!response.ok){await response.body?.cancel();throw failure(503,'MAIL_UNAVAILABLE','E-posta gönderimi şu anda doğrulanamadı. Biraz sonra tekrar dene.');}
  let body;try{body=await response.json();}catch{throw failure(503,'MAIL_UNAVAILABLE','E-posta gönderimi doğrulanamadı.');}
  if(typeof body.id!=='string'||!body.id)throw failure(503,'MAIL_UNAVAILABLE','E-posta gönderimi doğrulanamadı.');
 }
 return {configured,requireConfigured,send};
}
