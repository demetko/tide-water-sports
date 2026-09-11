import {checkOrigin,mockCheckout,failure} from '@/lib/server';
export async function POST(req:Request){try{checkOrigin(req);if(Number(req.headers.get('content-length'))>8192)throw new Error('INVALID_INPUT');const raw=await req.text();if(raw.length>8192)throw new Error('INVALID_INPUT');return Response.json(await mockCheckout(JSON.parse(raw)))}catch(e){return failure(e)}}
