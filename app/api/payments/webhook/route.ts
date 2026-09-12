import {createHmac,timingSafeEqual} from 'node:crypto';
import {mockCheckout,failure} from '@/lib/server';
// Stripe-shaped, signed TEST webhook. No actual card processing occurs.
export async function POST(req:Request){
 try{
  const secret=process.env.MOCK_WEBHOOK_SECRET;
  if(!secret)return Response.json({error:'NOT_CONFIGURED'},{status:503});
  const signature=req.headers.get('stripe-signature')||'';
  const parts=Object.fromEntries(signature.split(',').map(s=>s.split('=')));
  const timestamp=Number(parts.t);
  if(!Number.isFinite(timestamp)||Math.abs(Date.now()/1000-timestamp)>300)throw new Error('FORBIDDEN');
  const raw=await req.text();if(raw.length>8192)throw new Error('INVALID_INPUT');
  const expected=createHmac('sha256',secret).update(parts.t+'.'+raw).digest();
  const supplied=Buffer.from(parts.v1||'','hex');
  if(expected.length!==supplied.length||!timingSafeEqual(expected,supplied))throw new Error('FORBIDDEN');
  const event=JSON.parse(raw);
  if(event.type!=='payment_intent.succeeded'||event.livemode!==false||event.data?.object?.currency!=='eur')throw new Error('INVALID_INPUT');
  const booking=event.data.object.metadata?.booking;
  if(!booking||event.data.object.amount_received!==Math.round(booking.amount*100))throw new Error('PRICE_CHANGED');
  return Response.json(await mockCheckout(booking));
 }catch(e){return failure(e)}
}
