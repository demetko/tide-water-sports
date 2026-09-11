import {config,failure} from '@/lib/server';
export async function GET(){try{return Response.json(config(),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
