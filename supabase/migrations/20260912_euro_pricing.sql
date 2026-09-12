-- Apply to an existing Tide installation. Fresh projects use supabase/schema.sql.
-- The requested pricing change halves all simulated monetary amounts.
-- Existing reservations, capacity, customer details and confirmation keys are retained.
begin;
set local lock_timeout = '10s';
lock table public.equipment, public.bookings in access exclusive mode;

create or replace function public.tide_broadcast() returns trigger language plpgsql security definer set search_path=public as $$
begin
 perform realtime.send(jsonb_build_object('date',new.booking_date,'equipment_id',new.equipment_id),'availability','tide-availability',false);
 return new;
end; $$;

do $migration$
declare source_column text; column_count int; constraint_record record;
begin
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='equipment' and column_name='hourly_rate_eur') then
  select min(column_name),count(*) into source_column,column_count
  from information_schema.columns where table_schema='public' and table_name='equipment' and column_name like 'hourly_rate_%' and data_type='numeric';
  if column_count<>1 then raise exception 'Expected exactly one predecessor equipment rate column'; end if;
  execute format('alter table public.equipment rename column %I to hourly_rate_eur',source_column);
  update public.equipment set hourly_rate_eur=round(hourly_rate_eur/2,2);
 end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name='total_price_eur') then
  select min(column_name),count(*) into source_column,column_count
  from information_schema.columns where table_schema='public' and table_name='bookings' and column_name like 'total_price_%' and data_type='numeric';
  if column_count<>1 then raise exception 'Expected exactly one predecessor booking total column'; end if;
  execute format('alter table public.bookings rename column %I to total_price_eur',source_column);
  update public.bookings set total_price_eur=round(total_price_eur/2,2);
 end if;
 for constraint_record in
  select c.conname,t.relname,a.attname
  from pg_constraint c join pg_class t on t.oid=c.conrelid
  join pg_namespace n on n.oid=t.relnamespace
  join pg_attribute a on a.attrelid=t.oid and a.attnum=any(c.conkey)
  where n.nspname='public' and c.contype='c'
   and ((t.relname='equipment' and a.attname='hourly_rate_eur') or (t.relname='bookings' and a.attname='total_price_eur'))
 loop
  if constraint_record.conname<>constraint_record.relname||'_'||constraint_record.attname||'_check' then
   execute format('alter table public.%I rename constraint %I to %I',constraint_record.relname,constraint_record.conname,constraint_record.relname||'_'||constraint_record.attname||'_check');
  end if;
 end loop;
 update public.bookings set request_hash=md5(jsonb_build_array(equipment_id,trim(customer_name),customer_phone,booking_date,extract(hour from start_time)::int,duration_hours,quantity,departure,trim_scale(total_price_eur),'EUR')::text);
end;
$migration$;

create or replace function public.tide_mock_checkout(p_equipment int,p_name text,p_phone text,p_date date,
 p_hour int,p_duration int,p_quantity int,p_departure text,p_amount numeric,p_key uuid,p_terms boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare e public.equipment; b public.bookings; free int; digest text;
begin
 if p_terms is distinct from true or length(trim(p_name)) not between 2 and 255
  or p_phone !~ '^\+?[0-9 ()-]{7,30}$'
  or p_date is null or p_date<(now() at time zone 'Europe/Sofia')::date
  or p_date>(now() at time zone 'Europe/Sofia')::date+365
  or p_duration is null or p_duration not between 1 and 4
  or p_hour is null or p_hour<9 or p_hour+p_duration>18
  or p_quantity is null or p_quantity<1
  or p_departure is null or p_departure not in ('Sunny Beach','Nessebar','Burgas Marina')
  or p_name is null or p_phone is null or p_key is null or p_amount is null
 then raise exception 'INVALID_INPUT'; end if;
 digest:=md5(jsonb_build_array(p_equipment,trim(p_name),p_phone,p_date,p_hour,p_duration,p_quantity,p_departure,trim_scale(p_amount),'EUR')::text);
 -- Serialize retries before reading the idempotency record.
 perform pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 select * into b from public.bookings where idempotency_key=p_key;
 if found then
  if b.request_hash<>digest then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return jsonb_build_object('confirmation',b.confirmation,'total',b.total_price_eur,'status',b.payment_status);
 end if;
 if (p_date+make_time(p_hour,0,0)) <= (now() at time zone 'Europe/Sofia') then raise exception 'PAST_SLOT'; end if;
 select * into e from public.equipment where id=p_equipment for update;
 if not found then raise exception 'INVALID_EQUIPMENT'; end if;
 if p_amount<>e.hourly_rate_eur*p_quantity*p_duration then raise exception 'PRICE_CHANGED'; end if;
 select available into free from public.tide_availability(p_date,p_hour,p_duration) where equipment_id=p_equipment;
 if p_quantity>free then raise exception 'SOLD_OUT'; end if;
 insert into public.bookings(equipment_id,customer_name,customer_phone,booking_date,start_time,duration_hours,
 total_price_eur,quantity,departure,idempotency_key,request_hash)
 values(p_equipment,trim(p_name),p_phone,p_date,make_time(p_hour,0,0),p_duration,p_amount,p_quantity,p_departure,p_key,digest)
 returning * into b;
 update public.bookings set payment_status='Paid' where id=b.id;
 return jsonb_build_object('confirmation',b.confirmation,'total',b.total_price_eur,'status','Paid');
end; $$;
revoke all on function public.tide_mock_checkout(int,text,text,date,int,int,int,text,numeric,uuid,boolean) from public;
grant execute on function public.tide_mock_checkout(int,text,text,date,int,int,int,text,numeric,uuid,boolean) to anon,authenticated;


notify pgrst, 'reload schema';
commit;

select id,type,hourly_rate_eur,max_quantity from public.equipment order by id;
