import {checkOrigin,staffToken,supabase,failure} from '@/lib/server';
export async function GET(req:Request){try{
 const token=await staffToken();const date=new URL(req.url).searchParams.get('date')||'';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('INVALID_INPUT');
 return Response.json(await supabase('/rest/v1/bookings?booking_date=eq.'+date+'&select=id,equipment_id,customer_name,customer_phone,booking_date,start_time,duration_hours,total_price_eur,payment_status,fulfillment_status,quantity,departure&order=start_time,id',undefined,token),{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e)}}
export async function PATCH(req:Request){try{
 checkOrigin(req);const token=await staffToken();const {id,status}=await req.json() as {id:number,status:string};
 if(!Number.isInteger(id)||!['Active','Completed'].includes(status))throw new Error('INVALID_INPUT');
 return Response.json(await supabase('/rest/v1/rpc/tide_transition',{p_id:id,p_status:status},token));
 }catch(e){return failure(e)}}
