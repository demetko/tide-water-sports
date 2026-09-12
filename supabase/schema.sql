-- Tide MVP: run once in the Supabase SQL editor.
-- Payments in this installation are simulations. Never connect these RPCs to real payments.
begin;
create table public.equipment (
 id serial primary key, type varchar(100) not null,
 hourly_rate_eur decimal(10,2) not null check(hourly_rate_eur>0),
 max_quantity int not null check(max_quantity>0)
);
create table public.bookings (
 id serial primary key, equipment_id int not null references public.equipment(id) on delete cascade,
 customer_name varchar(255) not null, customer_phone varchar(50) not null,
 booking_date date not null, start_time time not null,
 duration_hours int not null check(duration_hours between 1 and 4),
 total_price_eur decimal(10,2) not null check(total_price_eur>0),
 payment_status varchar(50) not null default 'Pending' check(payment_status in ('Pending','Paid','Refunded')),
 fulfillment_status varchar(50) not null default 'Reserved' check(fulfillment_status in ('Reserved','Active','Completed','No-Show','Cancelled')),
 quantity int not null default 1 check(quantity>0),
 departure varchar(30) not null check(departure in ('Sunny Beach','Nessebar','Burgas Marina')),
 confirmation uuid not null unique default gen_random_uuid(),
 idempotency_key uuid not null unique,
 request_hash text not null,
 terms_accepted_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 check(start_time>=time '09:00' and start_time+duration_hours*interval '1 hour'<=time '18:00'),
 check(extract(minute from start_time)=0 and extract(second from start_time)=0)
);
create index bookings_horizon on public.bookings(booking_date,equipment_id,start_time)
 where payment_status='Paid' and fulfillment_status in ('Reserved','Active');
create table public.staff(user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.equipment enable row level security;
alter table public.bookings enable row level security;
alter table public.staff enable row level security;
create policy equipment_public_read on public.equipment for select to anon,authenticated using(true);
create policy staff_self_read on public.staff for select to authenticated using(user_id=auth.uid());
create policy staff_bookings_read on public.bookings for select to authenticated
 using(exists(select 1 from public.staff where user_id=auth.uid()));
revoke all on public.equipment,public.bookings,public.staff from anon,authenticated;
grant select on public.equipment to anon,authenticated;
grant select on public.bookings,public.staff to authenticated;
insert into public.equipment(type,hourly_rate_eur,max_quantity) values
 ('Jet Ski Kawasaki STX-160',60,8),
 ('Parasailing Tandem Flight',45,3),
 ('Sea Ray 230 Yacht Charter',175,2);

create function public.tide_availability(p_date date,p_hour int,p_duration int)
returns table(equipment_id int,available int)
language sql stable security definer set search_path=public as $$
 select e.id, greatest(0,e.max_quantity-coalesce((
   select max(usage.n) from (
    select coalesce(sum(b.quantity),0)::int n
    from generate_series(p_hour,p_hour+p_duration-1) h
    left join public.bookings b on b.equipment_id=e.id and b.booking_date=p_date
     and b.payment_status='Paid' and b.fulfillment_status in ('Reserved','Active')
     and extract(hour from b.start_time)<=h and extract(hour from b.start_time)+b.duration_hours>h
    group by h
   ) usage
 ),0))::int
 from public.equipment e where p_duration between 1 and 4 and p_hour>=9 and p_hour+p_duration<=18;
$$;
revoke all on function public.tide_availability(date,int,int) from public;
grant execute on function public.tide_availability(date,int,int) to anon,authenticated;

-- Public entry point intentionally simulates a payment for this mock-only MVP.
-- Authoritative rates, capacity and status changes are inside a single transaction.
create function public.tide_mock_checkout(p_equipment int,p_name text,p_phone text,p_date date,
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

create function public.tide_transition(p_id int,p_status text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare b public.bookings;
begin
 if not exists(select 1 from public.staff where user_id=auth.uid()) then raise exception 'FORBIDDEN'; end if;
 -- Match checkout's equipment lock so capacity cannot race with a return.
 perform 1 from public.equipment where id=(select equipment_id from public.bookings where id=p_id) for update;
 select * into b from public.bookings where id=p_id for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if b.fulfillment_status=p_status then return jsonb_build_object('status',p_status); end if;
 if b.payment_status<>'Paid' or
  not ((p_status='Active' and b.fulfillment_status='Reserved' and b.booking_date=(now() at time zone 'Europe/Sofia')::date
        and (now() at time zone 'Europe/Sofia')::time >= b.start_time)
       or (p_status='Completed' and b.fulfillment_status='Active'))
 then raise exception 'INVALID_TRANSITION'; end if;
 update public.bookings set fulfillment_status=p_status where id=p_id;
 return jsonb_build_object('status',p_status);
end; $$;
revoke all on function public.tide_transition(int,text) from public;
grant execute on function public.tide_transition(int,text) to authenticated;

-- Broadcast invalidation only: customer data never leaves the protected table.
create function public.tide_broadcast() returns trigger language plpgsql security definer set search_path=public as $$
begin
 perform realtime.send(jsonb_build_object('date',new.booking_date,'equipment_id',new.equipment_id),'availability','tide-availability',false);
 return new;
end; $$;
create trigger tide_booking_changed after insert or update on public.bookings for each row execute function public.tide_broadcast();
commit;

-- After creating a staff user in Authentication > Users, allow that user with:
-- insert into public.staff(user_id) select id from auth.users where email = 'YOUR_STAFF_EMAIL';

