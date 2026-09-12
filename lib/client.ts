import {createClient} from '@supabase/supabase-js';
export const fleet=[
 {id:1,type:'Jet Ski Kawasaki STX-160',hourly_rate_eur:60,max_quantity:8,image:'1519865612913-40a817efe31b',model:'Kawasaki STX-160'},
 {id:2,type:'Parasailing Tandem Flight',hourly_rate_eur:45,max_quantity:3,image:'1560419656-c2fe828696af',model:'Tandem'},
 {id:3,type:'Sea Ray 230 Yacht Charter',hourly_rate_eur:175,max_quantity:2,image:'1648997934392-7213a9ce50b7',model:'Sea Ray 230'}
];
export function coastNow(){const s=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Sofia',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hour12:false}).format(new Date());return {date:s.slice(0,10),hour:Number(s.slice(11,13))};}
export function tomorrow(date:string){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
export async function api<T=unknown>(path:string,options?:RequestInit):Promise<T>{
 const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',...options?.headers}});
 const data=await r.json() as {error?:string};if(!r.ok)throw new Error(data.error||'UNAVAILABLE');return data as T;
}
export async function subscribeAvailability(callback:()=>void){
 const {url,key}=await api<{url:string,key:string}>('/api/config');
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const channel=client.channel('tide-availability').on('broadcast',{event:'availability'},callback).subscribe();
 return ()=>{void client.removeChannel(channel)};
}
