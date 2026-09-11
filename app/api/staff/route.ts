import {cookies} from 'next/headers';
import {checkOrigin,staffToken,supabase,failure} from '@/lib/server';
export async function GET(){try{await staffToken();return Response.json({staff:true})}catch(e){return failure(e)}}
export async function POST(req:Request){
 try{checkOrigin(req);const {email,password}=await req.json() as Record<string,unknown>;
 if(typeof email!=='string'||typeof password!=='string'||email.length>255||password.length>256)throw new Error('INVALID_INPUT');
 const session=await supabase<{user:{id:string},access_token:string,expires_in:number}>('/auth/v1/token?grant_type=password',{email,password}).catch(()=>{throw new Error('UNAUTHORIZED')});
 const staff=await supabase<{user_id:string}[]>('/rest/v1/staff?user_id=eq.'+encodeURIComponent(session.user.id)+'&select=user_id',undefined,session.access_token);
 if(!staff.length)throw new Error('FORBIDDEN');
 (await cookies()).set('tide_access',session.access_token,{httpOnly:true,secure:new URL(req.url).protocol==='https:',sameSite:'strict',path:'/',maxAge:Math.min(session.expires_in,3600)});
 return Response.json({staff:true});
 }catch(e){return failure(e)}
}
export async function DELETE(req:Request){try{checkOrigin(req);(await cookies()).delete('tide_access');return Response.json({staff:false})}catch(e){return failure(e)}}
