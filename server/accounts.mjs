import { randomBytes,randomUUID,scrypt as derive,timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { isIP } from 'node:net';
import { openStore } from './store.mjs';
import { createMailer } from './mail.mjs';
import { failure,readJson,digest,email,password,name,validateData,revision,mutation } from './validation.mjs';

const scrypt=promisify(derive),COOKIE='rota_session',TTL=7*24*60*60*1000;
const token=()=>randomBytes(32).toString('base64url');
const publicUser=u=>({id:u.id,email:u.email,name:u.name,emailVerified:!!u.verified});
function createLocalOnlyAccounts(env=process.env){
  const features={accounts:false,emailVerification:false,passwordRecovery:false,mode:'local-only'};
  const primary=env.ROTA_APP_ORIGIN||env.RENDER_EXTERNAL_URL||'';
  function json(res,status,value){const bytes=Buffer.from(JSON.stringify(value));res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','content-length':bytes.length});res.end(bytes);}
  function permitted(req){
    const origin=req.headers.origin;
    if(!origin)return true;
    if(!primary)return env.NODE_ENV!=='production'&&env.RENDER!=='true';
    return origin===primary;
  }
  function cors(req,res){
    if(req.headers.origin&&permitted(req)){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');}
    if(req.method!=='OPTIONS')return false;
    if(req.headers.origin&&!permitted(req)){json(res,403,{code:'ORIGIN_REJECTED',error:'Kaynak kabul edilmiyor.'});return true;}
    res.writeHead(204,{'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type,X-CSRF-Token,X-Rota-Account-Id,Idempotency-Key','Access-Control-Max-Age':'600'});res.end();return true;
  }
  async function route(req,res){
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(!pathname.startsWith('/api/auth/')&&!['/api/workspace','/api/account/export','/api/account'].includes(pathname))return false;
    json(res,503,{code:'ACCOUNTS_UNAVAILABLE',error:'Web Beta şu anda bu tarayıcıda yerel kayıtla çalışıyor. Hesap ve cihazlar arası eşitleme kalıcı sunucu depolaması açıldığında etkinleştirilecek.',features});
    return true;
  }
  const unavailable=()=>{throw failure(503,'ACCOUNTS_UNAVAILABLE','Web Beta hesabı ve bulut eşitlemesi henüz etkin değil. Çalışmaların bu cihazda tutulur.');};
  return {available:false,mode:'local-only',features,route,cors,requireSession:unavailable,authenticate:()=>null,origin:unavailable,withAi:unavailable,close:()=>{},store:null,production:env.RENDER==='true'||env.NODE_ENV==='production'};
}

export function createAccounts(env=process.env){
  if(env.ROTA_ACCOUNTS_MODE==='local-only')return createLocalOnlyAccounts(env);
  const production=env.RENDER==='true'||env.NODE_ENV==='production',store=openStore(env),db=store.db;
  const allowed=new Set((env.ROTA_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean));
  const primary=env.ROTA_APP_ORIGIN||env.RENDER_EXTERNAL_URL||'';
  if(primary)allowed.add(primary);
  if(production&&!primary){store.close();throw Error('Üretim için ROTA_APP_ORIGIN veya RENDER_EXTERNAL_URL gerekli.');}
  for(const origin of allowed){const parsed=new URL(origin);if(!['https:','http:'].includes(parsed.protocol)||parsed.origin!==origin||(production&&env.NODE_ENV!=='test'&&parsed.protocol!=='https:')){store.close();throw Error('ROTA_APP_ORIGIN ve ROTA_ALLOWED_ORIGINS tam origin olmalı; üretimde HTTPS zorunlu.');}}
  const rate=new Map(),active=new Map();let globalActive=0,hashing=0;
  const mail=createMailer(env),features={emailVerification:mail.configured,passwordRecovery:mail.configured};
  function json(res,status,value){const bytes=Buffer.from(JSON.stringify(value));res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','content-length':bytes.length});res.end(bytes);}
  function permitted(req){const origin=req.headers.origin;if(!origin)return true;return allowed.has(origin)||(!production&&origin==='http://'+req.headers.host);}
  function origin(req,{native=false}={}){if(!permitted(req)||(!req.headers.origin&&!native))throw failure(403,'ORIGIN_REJECTED','Bu kaynaktan yapılan işlem kabul edilmiyor.');}
  function cors(req,res){
    if(req.headers.origin&&permitted(req)){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Access-Control-Allow-Credentials','true');res.setHeader('Vary','Origin');}
    if(req.method!=='OPTIONS')return false;
    if(!req.headers.origin||!permitted(req)){json(res,403,{code:'ORIGIN_REJECTED',error:'Kaynak kabul edilmiyor.'});return true;}
    res.writeHead(204,{'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type,X-CSRF-Token,X-Rota-Account-Id,Idempotency-Key','Access-Control-Max-Age':'600'});res.end();return true;
  }
  function limit(key,max,windowMs){const now=Date.now();if(rate.size>10000)for(const [k,v] of rate)if(v.until<=now)rate.delete(k);if(rate.size>20000)throw failure(503,'BUSY','Kısa süre sonra yeniden dene.');let row=rate.get(key);if(!row||row.until<=now)row={count:0,until:now+windowMs};row.count++;rate.set(key,row);if(row.count>max)throw failure(429,'RATE_LIMITED','Çok fazla deneme yapıldı. Biraz sonra tekrar dene.');}
  function ip(req){const forwarded=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();return (env.RENDER==='true'||env.ROTA_TRUST_PROXY==='1')&&isIP(forwarded)?forwarded:req.socket.remoteAddress||'unknown';}
  function authLimit(req,address,kind){limit(kind+':ip:'+ip(req),kind==='register'?10:60,15*60*1000);limit(kind+':email:'+digest(address),kind==='register'?5:15,15*60*1000);}
  async function hash(value,salt){if(hashing>=8)throw failure(503,'BUSY','Kısa süre sonra yeniden dene.');hashing++;try{return (await scrypt(value,salt,64,{N:16384,r:8,p:1,maxmem:32*1024*1024})).toString('hex');}finally{hashing--;}}
  async function verify(value,user){const supplied=typeof value==='string'&&value.length<=128?value:'',salt=user?.password_salt||'00000000000000000000000000000000',actual=await hash(supplied,salt),expected=user?.password_hash||'0'.repeat(128);return timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex'))&&!!user;}
  function cookie(res,value,clear=false){res.setHeader('Set-Cookie',`${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear?0:Math.floor(TTL/1000)}${production?'; Secure':''}`);}
  function issue(res,user,transport='cookie',oldHash='',verifiedPasswordHash=''){
    const sessionToken=token(),csrfToken=digest('csrf:'+sessionToken),now=Date.now();
    let current;
    store.transaction(()=>{
      current=db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
      if(!current||(verifiedPasswordHash&&current.password_hash!==verifiedPasswordHash))throw failure(401,'INVALID_CREDENTIALS','Giriş bilgileri değişti. Güncel parolanla yeniden giriş yap.');
      // Rotation consumes a still-live session atomically. A reset/logout during
      // body streaming must not let an already-revoked session re-create itself.
      if(oldHash&&db.prepare('DELETE FROM sessions WHERE token_hash=? AND user_id=? AND expires_at>?').run(oldHash,user.id,now).changes!==1)throw failure(401,'AUTH_REQUIRED','Oturumun sona erdi. Yeniden giriş yap.');
      db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now);
      db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?,?)').run(digest(sessionToken),user.id,digest(csrfToken),transport,now+TTL,now);
    });
    if(transport==='cookie')cookie(res,sessionToken);
    return {user:publicUser(current),csrfToken,expiresAt:now+TTL,...(transport==='bearer'?{sessionToken}:{}),features};
  }
  function authenticate(req){
    const bearer=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization||''),rawCookie=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1),raw=bearer?.[1]||rawCookie;
    if(!raw||!/^[A-Za-z0-9_-]{43}$/.test(raw))return null;
    const row=db.prepare('SELECT s.*,u.email,u.name,u.verified FROM sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=? AND expires_at>?').get(digest(raw),Date.now());
    if(!row||row.transport!==(bearer?'bearer':'cookie'))return null;
    return {...row,id:row.user_id,bearer:!!bearer,csrfToken:digest('csrf:'+raw)};
  }
  function requireSession(req,{write=false}={}){
    const session=authenticate(req);if(!session)throw failure(401,'AUTH_REQUIRED','Devam etmek için giriş yap.');
    if(req.headers['x-rota-account-id']!==undefined&&req.headers['x-rota-account-id']!==session.id)throw failure(409,'ACCOUNT_MISMATCH','Bu sekmenin hesabı değişti. Kayıt göndermeden önce kendi hesabına yeniden giriş yap.');
    if(req.headers.origin&&!permitted(req))throw failure(403,'ORIGIN_REJECTED','Bu kaynak kabul edilmiyor.');
    if(write){origin(req,{native:session.bearer});if(!session.bearer){const csrf=req.headers['x-csrf-token'];if(typeof csrf!=='string'||digest(csrf)!==session.csrf_hash)throw failure(403,'CSRF_REJECTED','Oturum güvenlik bilgisi yenilenmeli.');}}
    return session;
  }
  function mailLimit(req,address,purpose){limit('mail:'+purpose+':ip:'+ip(req),20,3600000);limit('mail:'+purpose+':email:'+digest(address),5,3600000);}
  async function sendToken(user,purpose){
    mail.requireConfigured();store.consume(user.id,'mail',20,300);
    const raw=token(),tokenHash=digest(raw),now=Date.now(),expires=now+(purpose==='verify'?86400000:1800000);
    db.prepare('DELETE FROM auth_tokens WHERE expires_at<=?').run(now);
    db.prepare('INSERT INTO auth_tokens VALUES(?,?,?,?,?)').run(tokenHash,user.id,purpose,expires,now);
    try{await mail.send({email:user.email,purpose,token:raw,requestId:randomUUID()});}catch(error){db.prepare('DELETE FROM auth_tokens WHERE token_hash=?').run(tokenHash);throw error;}
  }
  function tokenHash(value){if(typeof value!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(value))throw failure(400,'INVALID_TOKEN','Bağlantı geçersiz, kullanılmış veya süresi dolmuş. Yeni bağlantı iste.');return digest(value);}
  function findToken(hash,purpose){const row=db.prepare('SELECT t.*,u.email,u.name,u.verified FROM auth_tokens t JOIN users u ON u.id=t.user_id WHERE token_hash=? AND purpose=? AND expires_at>?').get(hash,purpose,Date.now());if(!row)throw failure(400,'INVALID_TOKEN','Bağlantı geçersiz, kullanılmış veya süresi dolmuş. Yeni bağlantı iste.');return row;}
  async function route(req,res){
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(!pathname.startsWith('/api/auth/')&&!['/api/workspace','/api/account/export','/api/account'].includes(pathname))return false;
    try{
      if(req.method==='POST'&&['/api/auth/register','/api/auth/login'].includes(pathname)){
        const body=await readJson(req,16384),transport=body.sessionTransport==='bearer'?'bearer':'cookie';origin(req,{native:transport==='bearer'});
        const address=email(body.email),kind=pathname.endsWith('register')?'register':'login';authLimit(req,address,kind);
        if(kind==='register'){
          const pass=password(body.password),display=name(body.name),salt=randomBytes(16).toString('hex'),hashed=await hash(pass,salt),user={id:randomUUID(),email:address,name:display,password_hash:hashed,password_salt:salt,created_at:Date.now(),verified:0};
          try{db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run(user.id,user.email,user.name,user.password_hash,user.password_salt,user.created_at,user.verified);}catch(e){if(String(e.code).startsWith('ERR_SQLITE'))throw failure(409,'ACCOUNT_EXISTS','Bu adresle kayıt oluşturulamadı. Giriş yapmayı deneyebilirsin.');throw e;}
          json(res,201,issue(res,user,transport));return true;
        }
        const user=db.prepare('SELECT * FROM users WHERE email=?').get(address);if(!await verify(body.password,user))throw failure(401,'INVALID_CREDENTIALS','E-posta veya şifre yanlış.');json(res,200,issue(res,user,transport,'',user.password_hash));return true;
      }
      if(req.method==='POST'&&['/api/auth/recovery','/api/auth/verify','/api/auth/reset'].includes(pathname)){
        const body=await readJson(req,16384);origin(req,{native:!!req.headers.authorization});
        if(pathname==='/api/auth/recovery'){
          mail.requireConfigured();const address=email(body.email);mailLimit(req,address,'reset');
          const user=db.prepare('SELECT * FROM users WHERE email=?').get(address),start=Date.now();
          // Identical public response for missing accounts and provider failures.
          // Acknowledges an attempt, never falsely promises email delivery.
          if(user)try{await sendToken(user,'reset');}catch{console.warn('Parola yenileme e-postasının iletimi doğrulanamadı.');}
          const floor=env.NODE_ENV==='test'?0:350;if(Date.now()-start<floor)await new Promise(resolve=>setTimeout(resolve,floor-(Date.now()-start)));
          json(res,202,{ok:true,message:'İstek alındı. Adres kayıtlıysa parola yenileme bağlantısı için gönderim denenir. E-posta gelmezse biraz sonra yeniden dene; bu yanıt hesabın varlığını veya e-postanın ulaştığını doğrulamaz.'});return true;
        }
        if(pathname==='/api/auth/verify'&&!body.token){
          const session=requireSession(req,{write:true});mail.requireConfigured();mailLimit(req,session.email,'verify');
          if(session.verified){json(res,200,{ok:true,alreadyVerified:true});return true;}
          await sendToken(session,'verify');json(res,202,{ok:true,message:'Doğrulama e-postası gönderim hizmetine iletildi. Gelen kutunu ve spam klasörünü kontrol et.'});return true;
        }
        limit('token:'+ip(req),30,900000);const purpose=pathname==='/api/auth/reset'?'reset':'verify',hashedToken=tokenHash(body.token);
        findToken(hashedToken,purpose);
        if(purpose==='reset'){
          const pass=password(body.password),salt=randomBytes(16).toString('hex'),passwordHash=await hash(pass,salt);
          store.transaction(()=>{const row=findToken(hashedToken,'reset');db.prepare('UPDATE users SET password_hash=?,password_salt=? WHERE id=?').run(passwordHash,salt,row.user_id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(row.user_id);db.prepare('DELETE FROM auth_tokens WHERE user_id=?').run(row.user_id);});
          json(res,200,{ok:true});return true;
        }
        const user=store.transaction(()=>{const row=findToken(hashedToken,'verify');db.prepare('UPDATE users SET verified=1 WHERE id=?').run(row.user_id);db.prepare('DELETE FROM auth_tokens WHERE user_id=? AND purpose=?').run(row.user_id,'verify');return {id:row.user_id,email:row.email,name:row.name,verified:1};});
        json(res,200,{ok:true,user:publicUser(user)});return true;
      }
      const write=!['GET','HEAD'].includes(req.method),session=requireSession(req,{write});
      if(req.method==='GET'&&pathname==='/api/auth/me'){
        json(res,200,{user:publicUser(session),csrfToken:session.csrfToken,expiresAt:session.expires_at,features});return true;
      }
      if(req.method==='POST'&&pathname==='/api/auth/refresh'){await readJson(req,16384);json(res,200,issue(res,session,session.transport,session.token_hash));return true;}
      if(req.method==='POST'&&pathname==='/api/auth/logout'){await readJson(req,16384);db.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.token_hash);if(!session.bearer)cookie(res,'',true);json(res,200,{ok:true});return true;}
      if(req.method==='POST'&&pathname==='/api/auth/profile'){const body=await readJson(req,16384),display=name(body.name);requireSession(req,{write:true});db.prepare('UPDATE users SET name=? WHERE id=?').run(display,session.id);json(res,200,{user:publicUser({...session,name:display})});return true;}
      if(pathname==='/api/workspace'&&req.method==='GET'){json(res,200,store.snapshot(session.id));return true;}
      if(pathname==='/api/workspace'&&req.method==='PUT'){
        limit('write:'+session.id,120,60000);
        const body=await readJson(req),data=validateData(body.data),baseRevision=revision(body.baseRevision),mutationId=mutation(body.mutationId||req.headers['idempotency-key']);
        requireSession(req,{write:true});
        json(res,200,store.save(session.id,baseRevision,mutationId,data));return true;
      }
      if(pathname==='/api/account/export'&&req.method==='GET'){json(res,200,{schema:'rota-account-export-v1',exportedAt:new Date().toISOString(),user:publicUser(session),...store.snapshot(session.id)});return true;}
      if(pathname==='/api/account'&&req.method==='DELETE'){
        const body=await readJson(req,16384);limit('reauth:'+session.id,5,15*60*1000);
        const user=db.prepare('SELECT * FROM users WHERE id=?').get(session.id);if(!await verify(body.password,user))throw failure(401,'INVALID_CREDENTIALS','Şifre yanlış. Hesap silinmedi.');
        requireSession(req,{write:true});
        if(db.prepare('SELECT password_hash FROM users WHERE id=?').get(session.id)?.password_hash!==user.password_hash)throw failure(401,'INVALID_CREDENTIALS','Parola değişti. Güncel parolanla tekrar onayla.');
        db.prepare('DELETE FROM users WHERE id=?').run(session.id);if(!session.bearer)cookie(res,'',true);json(res,200,{ok:true,deleted:true});return true;
      }
      throw failure(405,'METHOD_NOT_ALLOWED','Desteklenmeyen işlem.');
    }catch(e){json(res,e.status||500,{error:e.status?e.message:'İşlem tamamlanamadı.',code:e.code||'INTERNAL_ERROR',...(e.details||{})});return true;}
  }
  async function withAi(req,res,session,kind,callback){
    requireSession(req,{write:true});
    limit('ai:'+session.id+':'+kind,kind==='teacher'?20:36,60000);
    const count=active.get(session.id)||0;if(count>=2||globalActive>=8)throw failure(429,'CONCURRENT_LIMIT','Önceki isteğin tamamlanmasını bekle.');
    store.consume(session.id,kind,kind==='teacher'?50:100,kind==='teacher'?500:1000);
    active.set(session.id,count+1);globalActive++;
    const timeoutMs=Math.max(env.NODE_ENV==='test'?50:5000,Math.min(90000,Number(env.ROTA_PROVIDER_TIMEOUT_MS)||45000));
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs),closed=()=>{if(!res.writableEnded)controller.abort();};res.once('close',closed);
    try{return await callback(controller.signal);}catch(e){if(controller.signal.aborted)throw failure(504,'PROVIDER_TIMEOUT','Yanıt zamanında gelmedi. Biraz sonra yeniden dene.');throw e;}
    finally{clearTimeout(timer);res.off('close',closed);active.set(session.id,Math.max(0,(active.get(session.id)||1)-1));globalActive--;}
  }
  return {route,cors,requireSession,authenticate,origin,withAi,close:store.close,store,production};
}
