import {supabase,failure} from '@/lib/server';
export async function GET(){try{return Response.json(await supabase('/rest/v1/equipment?select=*&order=id'),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
