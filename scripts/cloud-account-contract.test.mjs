import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const cloud=read('public/cloud-auth.js');
const admin=read('public/admin.js');
const config=read('public/supabase-config.js');
const schema=read('supabase/cloud_accounts.sql');
const kpss=read('public/kpss-only.js');
const login=read('public/login.html');
const adminHtml=read('public/admin.html');

for(const [name,source] of [['cloud-auth.js',cloud],['admin.js',admin],['kpss-only.js',kpss]]){
  try{new Function(source);}catch(error){throw new Error(name+' JavaScript parse failed: '+error.message);}
}

function must(value,message){if(!value)throw new Error(message);}
function mustNot(value,message){if(value)throw new Error(message);}

must(cloud.includes("student_states"),'Cloud sync must persist student_states.');
must(cloud.includes("profiles"),'Cloud sync must maintain profiles.');
must(cloud.includes("signInWithPassword"),'Password login contract missing.');
must(cloud.includes("OWNER_PREFIX"),'Cross-account local owner guard missing.');
must(kpss.includes("/login.html"),'Landing login must route to account page.');
must(kpss.includes("/cloud-auth.js"),'KPSS shell must load cloud auth.');
must(login.includes("window.RotaCloud.signUp"),'Signup UI is not wired.');
must(adminHtml.includes("/admin.js"),'Admin dashboard script missing.');

must(schema.includes("alter table public.profiles enable row level security"),'profiles RLS missing.');
must(schema.includes("alter table public.student_states enable row level security"),'student_states RLS missing.');
must(schema.includes("auth.jwt() -> 'app_metadata' ->> 'role'"),'Admin policy must use signed app_metadata.');
must(schema.includes("with check ((select auth.uid()) = user_id)"),'student_states ownership WITH CHECK missing.');
must(schema.includes("with check ((select auth.uid()) = id)"),'profiles ownership WITH CHECK missing.');
mustNot(/auth\.jwt\(\)[^\n]*user_metadata/i.test(schema),'Authorization must never use user_metadata.');
mustNot(/service[_-]?role|sb_secret_/i.test(cloud+admin+config+login+adminHtml),'Browser bundle must never contain Supabase secret/service role keys.');

console.log('cloud account contracts: ok');
