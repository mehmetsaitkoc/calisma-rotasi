import fs from 'node:fs';

const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('public/index.html');
const sync=read('public/account-sync.js');
const login=read('public/login.js');
const admin=read('public/admin.js');
const server=read('server.mjs');
const sql=read('docs/supabase-bootstrap.sql');

function must(condition,message){if(!condition)throw new Error(message);}

must(index.includes('window.RotaAccountBridge'),'RotaAccountBridge missing');
must(index.includes('rota:state-saved'),'cloud save event missing');
must(index.includes('/account-sync.js'),'account sync module missing');
must(index.includes('cloud-signout'),'sign-out action missing');

must(sync.includes('CLOUD_USER_KEY'),'cross-user local isolation missing');
must(sync.includes("from('workspace_state')"),'workspace cloud sync missing');
must(sync.includes("from('profiles')"),'profile sync missing');
must(sync.includes("from('activity_events')"),'activity sync missing');

must(login.includes('signInWithPassword'),'password sign-in missing');
must(login.includes('signUp'),'account sign-up missing');
must(admin.includes("select('id,is_admin')"),'admin authorization check missing');
must(admin.includes("from('workspace_state')"),'admin workspace read missing');

must(server.includes('/api/public-config'),'public Supabase config endpoint missing');
must(server.includes('SUPABASE_PUBLISHABLE_KEY'),'publishable key config missing');
must(!server.includes('SUPABASE_SERVICE_ROLE'),'service-role key must not be exposed');

for(const table of ['profiles','workspace_state','activity_events']){
  must(sql.includes('alter table public.'+table+' enable row level security'),table+' RLS missing');
}
must(sql.includes('private.is_current_admin'),'private admin authorization helper missing');
must(sql.includes('grant update (email,display_name,exam,target_score,daily_minutes,last_seen_at,updated_at)'),'profile update column allowlist missing');
must(!sql.includes('grant update (is_admin'),'is_admin must not be user-updatable');

console.log('account-cloud-contract: ok');
