import { cookies } from 'next/headers';
import { z } from 'zod';

export function config() {
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_ANON_KEY;
  if(!url||!key) throw new Error('NOT_CONFIGURED');
  return {url,key};
}
export async function supabase<T=unknown>(path:string,body?:unknown,token?:string,method?:string):Promise<T>{
  const {url,key}=config();
  const res=await fetch(url+path,{method:method??(body?'POST':'GET'),headers:{apikey:key,Authorization:'Bearer '+(token||key),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});
  const data=await res.json().catch(()=>null) as {message?:string,error_description?:string,msg?:string}|null;
  if(!res.ok) throw new Error(data?.message||data?.error_description||data?.msg||'UNAVAILABLE');
  return data as T;
}
export async function staffToken(){
  const token=(await cookies()).get('tide_access')?.value;
  if(!token) throw new Error('UNAUTHORIZED');
  const user=await supabase<{id:string}>('/auth/v1/user',undefined,token).catch(()=>{throw new Error('UNAUTHORIZED')});
  const rows=await supabase<{user_id:string}[]>('/rest/v1/staff?user_id=eq.'+encodeURIComponent(user.id)+'&select=user_id',undefined,token);
  if(!rows.length) throw new Error('FORBIDDEN');
  return token;
}
export function checkOrigin(req:Request){
  const origin=req.headers.get('origin');
  if(req.headers.get('sec-fetch-site')==='cross-site')throw new Error('FORBIDDEN');
  if(origin){
    const source=new URL(origin),host=req.headers.get('host')||new URL(req.url).host;
    if(!['http:','https:'].includes(source.protocol)||source.host!==host)throw new Error('FORBIDDEN');
  }
}
export function failure(error:unknown){
  const message=error instanceof Error?error.message:'UNAVAILABLE';
  const code=['UNAUTHORIZED','FORBIDDEN','INVALID_INPUT','SOLD_OUT','PRICE_CHANGED','PAST_SLOT','INVALID_TRANSITION','IDEMPOTENCY_CONFLICT','NOT_CONFIGURED'].find(x=>message.includes(x))||'UNAVAILABLE';
  return Response.json({error:code},{status:code==='UNAUTHORIZED'?401:code==='FORBIDDEN'?403:code==='UNAVAILABLE'||code==='NOT_CONFIGURED'?503:409});
}
export const bookingInput=z.object({
  equipment:z.number().int().positive(),name:z.string().trim().min(2).max(255),
  phone:z.string().regex(/^\+?[0-9 ()-]{7,30}$/),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hour:z.number().int().min(9).max(17),duration:z.number().int().min(1).max(4),quantity:z.number().int().min(1).max(8),
  departure:z.enum(['Sunny Beach','Nessebar','Burgas Marina']),amount:z.number().positive(),
  key:z.string().uuid(),terms:z.literal(true),payment_token:z.literal('pm_mock_visa')
}).strict().refine(b=>b.hour+b.duration<=18);
export async function mockCheckout(raw:unknown){
  const parsed=bookingInput.safeParse(raw);
  if(!parsed.success) throw new Error('INVALID_INPUT');
  const b=parsed.data;
  return supabase('/rest/v1/rpc/tide_mock_checkout',{p_equipment:b.equipment,p_name:b.name,p_phone:b.phone,p_date:b.date,p_hour:b.hour,p_duration:b.duration,p_quantity:b.quantity,p_departure:b.departure,p_amount:b.amount,p_key:b.key,p_terms:b.terms});
}
