"use client";
import {useState,useEffect,useCallback,useRef} from 'react';
import {DepartureMap} from '@/components/departure-map';
import {formatEuro, rentalTotal} from '@/lib/money';
import {flushSync} from 'react-dom';
import {Waves,MapPin,CalendarDays,Clock3,ShieldCheck,Anchor,ChevronRight,Minus,Plus,Check,LockKeyhole,ArrowLeft,RefreshCw} from 'lucide-react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import {Checkbox} from '@/components/ui/checkbox';
import {useI18n,Key} from '@/lib/i18n';
import {fleet,api,coastNow,tomorrow,subscribeAvailability} from '@/lib/client';
const titleKeys:Key[]=['jet','para','yacht'],typeKeys:Key[]=['jetType','paraType','yachtType'],tagKeys:Key[]=['jetTag','paraTag','yachtTag'];
const departures=['Sunny Beach','Nessebar','Burgas Marina'];
const locationKeys:Key[]=['sunny','nessebar','burgas'];
function errorKey(code:string):Key{return ({SOLD_OUT:'soldout',PAST_SLOT:'past',PRICE_CHANGED:'changed',INVALID_INPUT:'invalid'} as Record<string,Key>)[code]||'unavailable';}
function Choice({value,onChange,options,label}:{value:string,onChange:(v:string)=>void,options:{value:string,label:string,disabled?:boolean}[],label:string}){
 return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="choice"><SelectValue/></SelectTrigger><SelectContent>{options.map(o=><SelectItem key={o.value} value={o.value} disabled={o.disabled}>{o.label}</SelectItem>)}</SelectContent></Select>;
}
export default function Home(){
 const {t,lang}=useI18n();
 const [selected,setSelected]=useState(0),[items,setItems]=useState(fleet),[departure,setDeparture]=useState(departures[0]);
 const [date,setDate]=useState(()=>{const n=coastNow();return n.hour>=17?tomorrow(n.date):n.date});
 const [hour,setHour]=useState(()=>Math.max(9,coastNow().hour>=17?9:coastNow().hour+1));
 const [duration,setDuration]=useState(1),[quantity,setQuantity]=useState(1);
 const [counts,setCounts]=useState<Record<number,number>>({}),[readyKey,setReadyKey]=useState(''),[connection,setConnection]=useState('loading'),[revision,setRevision]=useState(0);
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[terms,setTerms]=useState(false),[result,setResult]=useState<{confirmation:string,total:number,status:string}|null>(null);
 const attempt=useRef<{payload:string,key:string}|null>(null);
 const selection=useRef({date,hour,duration,quantity,equipment:selected+1});
 selection.current={date,hour,duration,quantity,equipment:items[selected].id};
 const slotKey=date+'/'+hour+'/'+duration;
 const e=items[selected],available=counts[e.id]??0,ready=readyKey===slotKey&&connection==='ready';
 const total=rentalTotal(e.hourly_rate_eur,duration,quantity),now=coastNow(),past=date<now.date||(date===now.date&&hour<=now.hour);
 const canBook=ready&&!past&&available>=quantity;
 const refresh=useCallback(()=>setRevision(v=>v+1),[]);
 useEffect(()=>{
  const ctrl=new AbortController();setConnection('loading');
  Promise.all([api('/api/equipment',{signal:ctrl.signal}),api('/api/availability?date='+date+'&hour='+hour+'&duration='+duration,{signal:ctrl.signal})])
   .then(([equipment,availability])=>{
    if(ctrl.signal.aborted)return;
    if(!Array.isArray(equipment)||equipment.length!==3||equipment.some((row:{hourly_rate_eur?:number})=>!Number.isFinite(Number(row.hourly_rate_eur))||Number(row.hourly_rate_eur)<=0)||!Array.isArray(availability)||availability.length!==3)throw new Error('UNAVAILABLE');
    setItems(fleet.map(f=>({...f,...equipment.find((x:{id:number})=>x.id===f.id)})));
    setCounts(Object.fromEntries(availability.map((a:{equipment_id:number,available:number})=>[a.equipment_id,a.available])));
    setReadyKey(slotKey);setConnection('ready');
   }).catch(()=>{if(!ctrl.signal.aborted)setConnection('error')});
  return ()=>ctrl.abort();
 },[date,hour,duration,revision,slotKey]);
 useEffect(()=>{
  let disposed=false,cleanup:(()=>void)|undefined;
  subscribeAvailability(refresh).then(fn=>{if(disposed)fn();else cleanup=fn}).catch(()=>{});
  const timer=setInterval(refresh,30000);window.addEventListener('focus',refresh);
  return ()=>{disposed=true;cleanup?.();clearInterval(timer);window.removeEventListener('focus',refresh)};
 },[refresh]);
 useEffect(()=>{
  const context=(document as Document & {modelContext?:{registerTool:(tool:unknown,options:unknown)=>Promise<void>}}).modelContext;
  if(!context)return;
  const lifecycle=new AbortController();
  const tools=[
   {name:'configure_rental',description:'Stage an equipment choice, date, hour, duration and quantity in the booking form. Does not book or pay.',inputSchema:{type:'object',properties:{equipment:{type:'integer',minimum:1,maximum:3},date:{type:'string'},hour:{type:'integer',minimum:9,maximum:17},duration:{type:'integer',minimum:1,maximum:4},quantity:{type:'integer',minimum:1,maximum:8}},required:['equipment','date','hour','duration','quantity'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async(input:unknown)=>{
    const p=input as typeof selection.current;
    if(!p||![1,2,3].includes(p.equipment)||!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||p.date<coastNow().date||![p.hour,p.duration,p.quantity].every(Number.isInteger)||p.hour<9||p.hour+p.duration>18||p.duration<1||p.duration>4||p.quantity<1||p.quantity>fleet[p.equipment-1].max_quantity)throw new Error('INVALID_INPUT');
    flushSync(()=>{setSelected(p.equipment-1);setDate(p.date);setHour(p.hour);setDuration(p.duration);setQuantity(p.quantity)});
    return {staged:selection.current};
   }},
   {name:'read_rental_availability',description:'Read authoritative capacity for the currently selected rental slot.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:async()=>{const p=selection.current;return api('/api/availability?date='+p.date+'&hour='+p.hour+'&duration='+p.duration)}}
  ];
  for(const tool of tools)Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});
  return ()=>lifecycle.abort();
 },[]);
 function choose(i:number){setSelected(i);setQuantity(1);}
 function changeDate(v:string){if(!v)return;setDate(v);if(v===coastNow().date&&hour<=coastNow().hour){const next=Math.max(9,coastNow().hour+1);setHour(Math.min(17,next));setDuration(1);}}
 async function pay(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setError('');
  const form=new FormData(event.currentTarget),card=String(form.get('card')).replace(/\s/g,'');
  const expiry=String(form.get('expiry')).split('/').map(Number),cvc=String(form.get('cvc'));
  if(!terms||card!=='4242424242424242'||!/^\d{2}\/\d{2}$/.test(String(form.get('expiry')))||expiry.length!==2||expiry[0]<1||expiry[0]>12||new Date(2000+expiry[1],expiry[0],1)<=new Date()||!/^\d{3}$/.test(cvc)){setError('invalid');return;}
  const payload={equipment:e.id,name:form.get('name'),phone:form.get('phone'),date,hour,duration,quantity,departure,amount:total,currency:'EUR',terms:true,payment_token:'pm_mock_visa'};
  const serialized=JSON.stringify(payload);
  if(!attempt.current||attempt.current.payload!==serialized)attempt.current={payload:serialized,key:crypto.randomUUID()};
  setBusy(true);
  try{const data=await api<{confirmation:string,total:number,status:string}>('/api/payments/mock',{method:'POST',body:JSON.stringify({...payload,key:attempt.current.key})});setResult(data);refresh();}
  catch(ex){setError(errorKey((ex as Error).message));refresh();}
  finally{setBusy(false);}
 }
 const money=(v:number)=>formatEuro(v,lang);
 return <><main className="shell">
  <div className="eyebrow">{t('coast')}</div>
  <div className="intro"><div><h1>{t('headline')}</h1><p>{t('subtitle')}</p></div><div className="coast-mark"><Waves/><span style={{whiteSpace:'pre-line'}}>{t('moreSea')}</span></div></div>
  <div className="filter-bar"><div><MapPin/><div className="filter-input"><small>{t('departure')}</small><Choice value={departure} onChange={setDeparture} label={t('departure')} options={departures.map((v,i)=>({value:v,label:t(locationKeys[i])}))}/></div></div><div><CalendarDays/><div className="filter-input"><label htmlFor="rental-date"><small>{t('day')}</small></label><input id="rental-date" type="date" min={now.date} max={tomorrow(new Date(Date.now()+364*86400000).toISOString().slice(0,10))} value={date} onChange={ev=>changeDate(ev.target.value)}/></div></div></div>
  <div className="workspace"><section><div className="section-heading"><h2>{t('choose')}</h2><span>3 {t('experiences')}</span></div><div className="catalog">
   {items.map((item,i)=><button type="button" aria-pressed={selected===i} onClick={()=>choose(i)} key={item.id} className={'experience '+(selected===i?'selected':'')}>
    <div className="photo"><img src={'https://images.unsplash.com/photo-'+item.image+'?auto=format&fit=crop&w=1000&h=760&q=85'} alt={t(typeKeys[i])} width={1000} height={760}/><span className="photo-tag">{t(tagKeys[i])}</span><span className="select-dot">{selected===i&&<Check size={14}/>}</span></div>
    <div className="card-content"><h3>{t(titleKeys[i])}</h3><p>{i===1?t('paraType'):item.model}</p><div className="card-detail"><Clock3 size={14}/><span>1–4 {t('hours')}</span><span>·</span><span>{t('briefing')}</span></div><div className="card-bottom"><strong>{money(item.hourly_rate_eur)} <small>/ {t('hour')}</small></strong><span className="availability">{ready?counts[item.id]:item.max_quantity} {t(ready?'available':'capacity')}</span></div></div>
   </button>)}
  </div><DepartureMap departure={departure}/><div className="assurances"><div><ShieldCheck/><span><strong>{t('peace')}</strong><small>{t('safety')}</small></span></div><div><Anchor/><span><strong>{t('people')}</strong><small>{t('operators')}</small></span></div><div><Waves/><span><strong>{t('weather')}</strong><small>{t('refund')}</small></span></div></div></section>
  <aside className="booking-panel"><div className="panel-title"><h2>{t('yourTime')}</h2><span>01 / 02</span></div><p className="chosen">{t(titleKeys[selected])}</p>
   <div className="booking-fields"><div><label>{t('start')}</label><Choice label={t('start')} value={String(hour)} onChange={v=>{setHour(Number(v));if(Number(v)+duration>18)setDuration(18-Number(v));}} options={Array.from({length:9},(_,i)=>({value:String(i+9),label:String(i+9).padStart(2,'0')+':00',disabled:date===now.date&&i+9<=now.hour}))}/></div><div><label>{t('duration')}</label><Choice label={t('duration')} value={String(duration)} onChange={v=>setDuration(Number(v))} options={Array.from({length:Math.min(4,18-hour)},(_,i)=>({value:String(i+1),label:(i+1)+' '+t(i===0?'hour':'hours')}))}/></div></div>
   <div className="quantity-row"><span>{t('quantity')}</span><div className="stepper"><button aria-label={t('quantity')+' −'} disabled={quantity<=1} onClick={()=>setQuantity(q=>q-1)}><Minus size={14}/></button><output aria-live="polite">{quantity}</output><button aria-label={t('quantity')+' +'} disabled={quantity>=(ready?available:e.max_quantity)} onClick={()=>setQuantity(q=>q+1)}><Plus size={14}/></button></div></div>
   <p className="slot-note">{t('localTime')}</p>
   <div className="price-row"><span>{quantity} × {money(e.hourly_rate_eur)} × {duration} {t(duration===1?'hour':'hours')}</span><strong>{money(total)}</strong></div>
   <div className="price-row included"><span>{t('briefing')}</span><strong>{t('included')}</strong></div>
   <div className="total"><span>{t('total')}</span><strong>{money(total)}</strong></div>
   {connection==='error'?<div className="notice" role="status">{t('unavailable')}<button onClick={refresh}><RefreshCw size={13}/>{t('retry')}</button></div>:!ready?<p className="slot-note" role="status">{t('loading')}</p>:past?<p className="notice">{t('past')}</p>:available<quantity?<p className="notice">{t('soldout')}</p>:null}
   <button className="primary" disabled={!canBook} onClick={()=>{setResult(null);setError('');setTerms(false);setOpen(true)}}>{t('continue')}<ChevronRight size={18}/></button><p className="secure"><LockKeyhole size={13}/>{t('secure')}</p>
  </aside></div>
  <div className="coast-strip"><div><MapPin size={18}/><strong>{t('oneCoast')}</strong></div><span>{t('sunny')}<i>·</i>{t('nessebar')}<i>·</i>{t('burgas')}</span><Waves/></div>
 </main>
 <Dialog open={open} onOpenChange={v=>{if(!busy)setOpen(v)}}><DialogContent showCloseButton={false} className="checkout-modal">
  <DialogClose className="modal-close" disabled={busy} aria-label={t('close')}>×</DialogClose>
  <DialogTitle className="modal-title">{t(result?'success':'checkout')}</DialogTitle><DialogDescription>{result?t('arrival'):t('test')}</DialogDescription>
  {result?<div className="success-content"><span className="success-icon"><Check size={32}/></span><h3>{t(titleKeys[selected])}</h3><p>{date} · {String(hour).padStart(2,'0')}:00 · {t(locationKeys[departures.indexOf(departure)])}</p><p>{quantity} × {duration} {t('hours')} · {money(result.total)} · {t('Paid')}</p><div className="reference"><small>{t('confirmation')}</small><code>{result.confirmation}</code></div><p className="slot-note">{t('test')}</p><button className="primary" onClick={()=>setOpen(false)}>{t('done')}</button></div>:
  <form onSubmit={pay}><div className="checkout-summary"><strong>{t(titleKeys[selected])}</strong><span>{date} · {String(hour).padStart(2,'0')}:00 · {quantity} × {duration} {t('hours')}</span><b>{money(total)}</b></div>
   <label className="form-label">{t('name')}<input className="field" name="name" autoComplete="name" minLength={2} maxLength={255} required/></label>
   <label className="form-label">{t('phone')}<input className="field" name="phone" type="tel" autoComplete="tel" placeholder="+359" minLength={7} maxLength={30} required/></label>
   <label className="form-label">{t('card')}<input className="field" name="card" inputMode="numeric" autoComplete="off" defaultValue="4242 4242 4242 4242" required maxLength={23}/></label>
   <div className="booking-fields"><label className="form-label">{t('expiry')}<input className="field" name="expiry" inputMode="numeric" defaultValue="12/30" required maxLength={5}/></label><label className="form-label">{t('cvc')}<input className="field" name="cvc" inputMode="numeric" defaultValue="123" required maxLength={3}/></label></div>
   <div className="consent"><Checkbox id="terms-accepted" checked={terms} onCheckedChange={v=>setTerms(v===true)}/><label htmlFor="terms-accepted">{t('agree')} <a href="/compliance/terms" target="_blank" rel="noreferrer">{t('terms')}</a> · <a href="/compliance/privacy" target="_blank" rel="noreferrer">{t('privacy')}</a></label></div>
   {error&&<p role="alert" className="notice">{t(error as Key)}</p>}
   <button className="primary" type="submit" disabled={busy||!terms}>{busy?t('paying'):t('pay')+' · '+money(total)}<LockKeyhole size={15}/></button>
  </form>}
 </DialogContent></Dialog></>;
}
