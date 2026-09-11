import {supabase,failure} from '@/lib/server';
export async function GET(req:Request){
 try{const p=new URL(req.url).searchParams;
 const date=p.get('date')||'',hour=Number(p.get('hour')),duration=Number(p.get('duration'));
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(hour)||!Number.isInteger(duration)||hour<9||duration<1||duration>4||hour+duration>18)throw new Error('INVALID_INPUT');
 return Response.json(await supabase('/rest/v1/rpc/tide_availability',{p_date:date,p_hour:hour,p_duration:duration}),{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e)}
}
