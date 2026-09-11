"use client";
import {useState,useEffect,useCallback,useRef} from 'react';
import {Anchor,CalendarDays,ArrowUpRight,LogOut,RefreshCw,Play,Check,LockKeyhole,Waves} from 'lucide-react';
import {Table,TableHeader,TableHead,TableBody,TableRow,TableCell} from '@/components/ui/table';
import {useI18n,Key} from '@/lib/i18n';
import {api,coastNow,fleet,subscribeAvailability} from '@/lib/client';
type Booking={id:number,equipment_id:number,customer_name:string,customer_phone:string,booking_date:string,start_time:string,duration_hours:number,total_price_bgn:number,payment_status:Key,fulfillment_status:Key,quantity:number,departure:string};
export default function Vendor(){
 const {t,lang}=useI18n(),[authorized,setAuthorized]=useState(false),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState<Key|null>(null);
 const [date,setDate]=useState(coastNow().date),[bookings,setBookings]=useState<Booking[]>([]),[loading,setLoading]=useState(false);
 const [changing,setChanging]=useState<number|null>(null),[hasData,setHasData]=useState(false);
 const requestId=useRef(0);
 useEffect(()=>{api('/api/staff').then(()=>setAuthorized(true)).catch(()=>{}).finally(()=>setChecking(false))},[]);
 const load=useCallback(async()=>{
  const current=++requestId.current;
  setLoading(true);setError(null);
  try{const data=await api<Booking[]>('/api/bookings?date='+date);if(current===requestId.current){setBookings(data);setHasData(true)}}
  catch(e){if(current===requestId.current){if(['UNAUTHORIZED','FORBIDDEN'].includes((e as Error).message)){setAuthorized(false);setError('session')}else setError('unavailable')}}
  finally{if(current===requestId.current)setLoading(false)}
 },[date]);
 useEffect(()=>{if(!authorized)return;void load();let dead=false,stop:(()=>void)|undefined;
  subscribeAvailability(()=>void load()).then(fn=>{if(dead)fn();else stop=fn}).catch(()=>{});
  const timer=setInterval(load,30000);return ()=>{dead=true;requestId.current++;stop?.();clearInterval(timer)};
 },[authorized,load]);
 async function login(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError(null);const data=new FormData(event.currentTarget);
  try{await api('/api/staff',{method:'POST',body:JSON.stringify({email:data.get('email'),password:data.get('password')})});setAuthorized(true)}
  catch(e){setError((e as Error).message==='UNAVAILABLE'?'unavailable':'authError')}finally{setBusy(false)}
 }
 async function transition(b:Booking,status:string){setChanging(b.id);setError(null);try{await api('/api/bookings',{method:'PATCH',body:JSON.stringify({id:b.id,status})});await load()}catch(e){const c=(e as Error).message;if(c==='UNAUTHORIZED'){setAuthorized(false);setError('session')}else setError(c==='INVALID_TRANSITION'?'transition':'unavailable')}finally{setChanging(null)}}
 const money=(n:number)=>new Intl.NumberFormat(lang,{maximumFractionDigits:2}).format(n);
 const typeKeys:Key[]=['jetType','paraType','yachtType'],paid=bookings.filter(b=>b.payment_status==='Paid');
 return <main className="shell vendor-shell"><div className="eyebrow">{t('vendor')}</div><div className="intro"><div><h1>{t('staffTitle')}</h1><p>{t('staffIntro')}</p></div>{authorized&&<button className="quiet-button" onClick={async()=>{try{await api('/api/staff',{method:'DELETE'});setAuthorized(false);setBookings([])}catch{setError('unavailable')}}}><LogOut size={16}/>{t('signout')}</button>}</div>
 {!authorized?<section className="login-panel"><span className="login-icon"><LockKeyhole/></span><h2>{t('signin')}</h2><p>{t('staffOnly')}</p>{checking?<p role="status">{t('loading')}</p>:<form onSubmit={login}><label className="form-label">{t('email')}<input className="field" type="email" name="email" autoComplete="username" required/></label><label className="form-label">{t('password')}<input className="field" type="password" name="password" autoComplete="current-password" required/></label>{error&&<p className="notice" role="alert">{t(error)}</p>}<button className="primary" disabled={busy}>{busy?t('loading'):t('signin')}<ArrowUpRight size={16}/></button></form>}</section>:
 <><div className="vendor-toolbar"><div><CalendarDays size={18}/><input aria-label={t('day')} type="date" value={date} onChange={e=>{setHasData(false);setDate(e.target.value)}}/></div><span>{t('localTime')}</span><button className="quiet-button" disabled={loading} onClick={load}><RefreshCw size={16}/>{t('retry')}</button></div>
 <div className="metrics"><div><span>{t('bookings')}</span><strong>{hasData?bookings.length:'—'}</strong><CalendarDays/></div><div><span>{t('active')}</span><strong>{hasData?bookings.filter(b=>b.fulfillment_status==='Active').reduce((s,b)=>s+b.quantity,0):'—'}</strong><Waves/></div><div><span>{t('revenue')}</span><strong>{hasData?money(paid.reduce((s,b)=>s+Number(b.total_price_bgn),0)):'—'} <small>BGN</small></strong><Anchor/></div></div>
 {error&&<p className="notice" role="alert">{t(error)}</p>}
 <section className="horizon"><div className="section-heading"><div><h2>{t('horizon')}</h2><p>{t('timeline')}</p></div><span>{date}</span></div><div className="horizon-scroll"><div className="horizon-grid"><div className="time-head"><span>{t('experience')}</span>{Array.from({length:9},(_,i)=><span key={i}>{i+9}:00</span>)}</div>{fleet.map((e,i)=><div className="horizon-row" key={e.id}><div className="asset-label"><strong>{t(typeKeys[i])}</strong><span>{e.max_quantity} {t('capacity')}</span></div>{Array.from({length:9},(_,j)=>{const h=j+9;const relevant=bookings.filter(b=>b.equipment_id===e.id&&b.payment_status==='Paid'&&['Reserved','Active'].includes(b.fulfillment_status)&&Number(b.start_time.slice(0,2))<=h&&Number(b.start_time.slice(0,2))+b.duration_hours>h);const count=relevant.reduce((s,b)=>s+b.quantity,0);return <div className={'hour-cell '+(count?'occupied':'')} key={h} title={h+':00 · '+count+' / '+e.max_quantity}>{count>0?<span>{count} / {e.max_quantity}</span>:<span className="empty-cell">—</span>}</div>})}</div>)}</div></div></section>
 <section className="operations"><div className="section-heading"><h2>{t('bookings')}</h2>{loading&&<span role="status">{t('loading')}</span>}</div><Table><TableHeader><TableRow><TableHead>{t('guest')}</TableHead><TableHead>{t('experience')}</TableHead><TableHead>{t('start')}</TableHead><TableHead>{t('total')}</TableHead><TableHead>{t('status')}</TableHead><TableHead>{t('actions')}</TableHead></TableRow></TableHeader><TableBody>{bookings.map(b=><TableRow key={b.id}><TableCell><strong>{b.customer_name}</strong><small>{b.customer_phone}</small></TableCell><TableCell>{t(typeKeys[b.equipment_id-1])}<small>{b.quantity} × {b.duration_hours} {t('hours')} · {t(b.departure==='Sunny Beach'?'sunny':b.departure==='Nessebar'?'nessebar':'burgas')}</small></TableCell><TableCell>{b.start_time.slice(0,5)}</TableCell><TableCell>{money(Number(b.total_price_bgn))} BGN<small>{t(b.payment_status)}</small></TableCell><TableCell><span className={'status status-'+b.fulfillment_status}>{t(b.fulfillment_status)}</span></TableCell><TableCell><div className="rental-actions"><button className="start-rental" disabled={changing!==null||b.fulfillment_status!=='Reserved'||b.payment_status!=='Paid'||date!==coastNow().date||Number(b.start_time.slice(0,2))>coastNow().hour} onClick={()=>transition(b,'Active')}><Play size={13}/>{t('startRental')}</button><button className="return-rental" disabled={changing!==null||b.fulfillment_status!=='Active'} onClick={()=>transition(b,'Completed')}><Check size={13}/>{t('returnRental')}</button></div></TableCell></TableRow>)}</TableBody></Table>{hasData&&!bookings.length&&!loading&&<div className="empty-bookings"><Anchor size={30}/><h3>{t('empty')}</h3><p>{t('emptyHint')}</p></div>}</section></>}
 </main>;
}
