import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { failure,digest } from './validation.mjs';

export function openStore(env=process.env){
  const production=env.RENDER==='true'||env.NODE_ENV==='production',root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const file=env.ROTA_DB_PATH||(!production?path.join(root,'work/local-data/rota.sqlite'):'');
  if(!file||!path.isAbsolute(file))throw Error('Kalıcı veritabanı için mutlak ROTA_DB_PATH gerekli.');
  const relative=path.relative(root,file);
  if(production&&env.NODE_ENV!=='test'&&(!relative.startsWith('..'+path.sep)||/^\/(?:private\/)?(?:tmp|var\/tmp)(?:\/|$)/.test(file)))throw Error('Üretim ROTA_DB_PATH kod dizini ve geçici dizin dışında kalıcı diskte olmalı.');
  fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  const db=new DatabaseSync(file);fs.chmodSync(file,0o600);
  db.exec(`PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,created_at INTEGER NOT NULL,verified INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf_hash TEXT NOT NULL,transport TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS auth_tokens(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,purpose TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS auth_tokens_user ON auth_tokens(user_id,purpose);
    CREATE TABLE IF NOT EXISTS workspaces(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,data_json TEXT,revision INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS mutations(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,mutation_id TEXT NOT NULL,request_hash TEXT NOT NULL,revision INTEGER NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(user_id,mutation_id));
    CREATE TABLE IF NOT EXISTS usage(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,day TEXT NOT NULL,kind TEXT NOT NULL,count INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,day,kind));
    CREATE TABLE IF NOT EXISTS global_usage(day TEXT NOT NULL,kind TEXT NOT NULL,count INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,kind));
    INSERT INTO global_usage(day,kind,count) SELECT day,kind,SUM(count) FROM usage GROUP BY day,kind ON CONFLICT(day,kind) DO UPDATE SET count=MAX(count,excluded.count);`);
  function transaction(fn){db.exec('BEGIN IMMEDIATE');try{const value=fn();db.exec('COMMIT');return value;}catch(e){db.exec('ROLLBACK');throw e;}}
  function snapshot(userId){const row=db.prepare('SELECT data_json,revision,updated_at FROM workspaces WHERE user_id=?').get(userId);return {revision:row?.revision||0,data:row?.data_json?JSON.parse(row.data_json):null,updatedAt:row?.updated_at||0};}
  function save(userId,baseRevision,mutationId,data){return transaction(()=>{
    const hash=digest(JSON.stringify({baseRevision,data})),old=db.prepare('SELECT * FROM mutations WHERE user_id=? AND mutation_id=?').get(userId,mutationId);
    if(old){if(old.request_hash!==hash)throw failure(409,'IDEMPOTENCY_CONFLICT','Aynı işlem kimliği farklı içerikle kullanıldı.');return {revision:old.revision,data,updatedAt:old.updated_at,duplicate:true};}
    const current=snapshot(userId);if(current.revision!==baseRevision)throw failure(409,'REVISION_CONFLICT','Başka bir cihaz daha yeni bir kayıt oluşturdu.',current);
    const now=Date.now(),revision=baseRevision+1;
    db.prepare('INSERT INTO workspaces(user_id,data_json,revision,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET data_json=excluded.data_json,revision=excluded.revision,updated_at=excluded.updated_at').run(userId,data===null?null:JSON.stringify(data),revision,now);
    db.prepare('INSERT INTO mutations VALUES(?,?,?,?,?)').run(userId,mutationId,hash,revision,now);
    return {revision,data,updatedAt:now};
  });}
  function consume(userId,kind,limit,globalLimit){return transaction(()=>{const day=new Date().toISOString().slice(0,10),row=db.prepare('SELECT count FROM usage WHERE user_id=? AND day=? AND kind=?').get(userId,day,kind),total=db.prepare('SELECT count FROM global_usage WHERE day=? AND kind=?').get(day,kind)?.count||0;if((row?.count||0)>=limit)throw failure(429,'DAILY_LIMIT','Günlük kullanım sınırına ulaştın.');if(total>=globalLimit)throw failure(503,'SERVICE_DAILY_LIMIT','Hizmetin günlük kullanım sınırına ulaşıldı. Daha sonra yeniden dene.');db.prepare('INSERT INTO usage VALUES(?,?,?,1) ON CONFLICT(user_id,day,kind) DO UPDATE SET count=count+1').run(userId,day,kind);db.prepare('INSERT INTO global_usage VALUES(?,?,1) ON CONFLICT(day,kind) DO UPDATE SET count=count+1').run(day,kind);});}
  return {db,transaction,snapshot,save,consume,close:()=>db.close(),file};
}
