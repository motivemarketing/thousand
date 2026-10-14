// Runs supabase/schema.sql on an in-memory Postgres (PGlite) with stubbed Supabase auth/storage, then checks the privacy rules.
import { PGlite } from '@electric-sql/pglite';
process.on("unhandledRejection",e=>{console.log("ERROR:",e.message);process.exit(1)});
import fs from 'fs';
const db = new PGlite();
const stub = `
create schema auth; create schema storage;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true),'')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;
create role authenticated;
`;
await db.exec(stub);
await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261014000000_thousand_init.sql', import.meta.url),'utf8'));
await db.exec(`grant usage on schema public to authenticated; grant all on all tables in schema public to authenticated; grant usage on schema auth to authenticated; grant execute on all functions in schema auth to authenticated;`);
const U = { A:'00000000-0000-0000-0000-00000000000a', B:'00000000-0000-0000-0000-00000000000b', C:'00000000-0000-0000-0000-00000000000c', D:'00000000-0000-0000-0000-00000000000d' };
for (const id of Object.values(U)) await db.query('insert into auth.users(id) values ($1)', [id]);
const as = async (who, sql, params=[]) => { await db.exec(`reset role; select set_config('test.uid','${U[who]}',false); set role authenticated;`); try { return (await db.query(sql, params)).rows; } finally { await db.exec('reset role'); } };
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };

for (const [k,n] of Object.entries({A:'Jake',B:'Sarah',C:'Marcus',D:'Stranger'})) await as(k, `insert into profiles(id, first_name, onboarded) values ($1,$2,true)`, [U[k], n]);
await as('A', `insert into baselines(user_id, answers) values ($1, '{"secret":1}')`, [U.A]);
const hh = (await as('A', 'select * from ensure_household()'))[0];
await as('B', 'select join_household($1)', [hh.invite_code.toLowerCase()]);
const crew = (await as('A', `select * from create_crew('Tuesday')`))[0];
await as('C', 'select join_crew($1)', [crew.invite_code]);
ok((await as('D','select peek_invite($1,$2) r',['crew',crew.invite_code]))[0].r.members === 2, 'stranger can peek a crew invite');

const day = (await db.query(`select (case when extract(dow from current_date)=0 then current_date-1 else current_date end)::text d`)).rows[0].d;
const gA = (await as('A', `insert into goals(owner_id, area, title, start_date, end_date) values ($1,'faith','Bible',$2,$2::date+90) returning id`, [U.A, day]))[0].id;
const gBud = (await as('A', `insert into goals(household_id, area, title, start_date, end_date) values ($1,'budget','Debt',$2,$2::date+90) returning id`, [hh.id, day]))[0].id;
const gAm = (await as('A', `insert into goals(owner_id, area, title, start_date, end_date) values ($1,'marriage','Pray',$2,$2::date+90) returning id`, [U.A, day]))[0].id;
const gBm = (await as('B', `insert into goals(owner_id, area, title, start_date, end_date) values ($1,'marriage','Pray',$2,$2::date+90) returning id`, [U.B, day]))[0].id;
const hAm = (await as('A', `insert into habits(goal_id,name,days,shared) values ($1,'Pray together',array[1,2,3,4,5,6],true) returning id`, [gAm]))[0].id;
const hBm = (await as('B', `insert into habits(goal_id,name,days,shared) values ($1,'pray together',array[1,2,3,4,5,6],true) returning id`, [gBm]))[0].id;
const hBud = (await as('A', `insert into habits(goal_id,name,days,shared) values ($1,'Log purchases',array[1,2,3,4,5,6],true) returning id`, [gBud]))[0].id;

let threw = false; try { await as('D', `insert into goals(owner_id, area, title, start_date, end_date) values ($1,'faith','x',$2,$2)`, [U.A, day]); } catch { threw = true; }
ok(threw, 'stranger cannot create a goal for someone else');
threw = false; try { await as('A', `insert into habits(goal_id,name,days) values ($1,'Sunday thing',array[0])`, [gA]); } catch { threw = true; }
ok(threw, 'habits cannot be scheduled on Sunday');

await as('A', 'select log_rep($1,$2,true)', [hAm, day]);
ok((await as('B', 'select count(*)::int n from rep_logs where habit_id=$1', [hBm]))[0].n === 1, 'shared marriage rep mirrors to spouse');
await as('B', 'select log_rep($1,$2,true)', [hBud, day]);
ok((await as('A', 'select count(*)::int n from rep_logs where habit_id=$1', [hBud]))[0].n === 1, 'spouse can log the household budget rep');
threw = false; try { await as('C', 'select log_rep($1,$2,true)', [hAm, day]); } catch { threw = true; }
ok(threw, 'crew cannot log your reps');

const vis = async (who) => (await as(who, 'select title from goals order by title')).map((r) => r.title).join(',');
ok((await vis('B')).includes('Bible') && (await vis('B')).includes('Debt'), 'spouse sees all goals incl. budget: ' + await vis('B'));
ok((await vis('C')).includes('Bible') && !(await vis('C')).includes('Debt'), 'crew sees goals but not budget: ' + await vis('C'));
ok((await vis('D')) === '', 'stranger sees nothing');
ok((await as('B', 'select * from baselines')).length === 0, 'spouse cannot read private baseline');
ok((await as('A', 'select * from baselines')).length === 1, 'you can read your baseline');
ok((await as('C', 'select first_name from profiles order by first_name')).map(r=>r.first_name).join(',') === 'Jake,Marcus', 'crew sees crewmate profiles only');
ok((await as('D', 'select * from profiles')).length === 1, 'stranger sees only self');
ok((await as('C', 'select count(*)::int n from rep_logs'))[0].n === 1, 'crew sees reps of visible goals only (not budget)');
await as('A', 'select delete_my_account()');
ok((await db.query('select count(*)::int n from goals where owner_id=$1', [U.A])).rows[0].n === 0, 'deleting account removes owned goals');
ok((await db.query('select count(*)::int n from goals where id=$1', [gBud])).rows[0].n === 1, 'household budget goal stays with spouse');
