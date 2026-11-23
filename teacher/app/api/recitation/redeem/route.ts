import {NextResponse} from 'next/server';
import {database} from '@/lib/roles';

export const dynamic='force-dynamic';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS',
 'Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};
export async function OPTIONS(){return new NextResponse(null,{status:204,headers:cors});}
export async function POST(request:Request){
 if(!process.env.DATABASE_URL)return NextResponse.json({error:'Verification not configured'},{status:503,headers:cors});
 const size=Number(request.headers.get('content-length')||0);
 if(size>4096)return NextResponse.json({error:'Request too large'},{status:413,headers:cors});
 let payload:unknown;
 try{payload=await request.json();}catch{return NextResponse.json({error:'Invalid request'},{status:400,headers:cors});}
 const code=String((payload as {code?:unknown})?.code||'').trim();
 if(!/^[A-Za-z0-9_-]{20,48}$/.test(code))
  return NextResponse.json({error:'Invalid or already redeemed code'},{status:400,headers:cors});
 try{
  const sql=database();
  // Single-use redemption is atomic; the token is issued by a verified teacher.
  const result=await sql`UPDATE quran_recitation_reviews
   SET redeemed_at=now()
   WHERE redeem_code=${code} AND approved=true AND redeemed_at IS NULL
   RETURNING course_id,reward_coins,course_complete`;
  if(!result.length)return NextResponse.json({error:'Invalid or already redeemed code'},{status:404,headers:cors});
  const row=result[0];
  return NextResponse.json({verified:true,courseId:row.course_id,
   coins:row.reward_coins,courseComplete:row.course_complete},{status:200,headers:cors});
 }catch{
  return NextResponse.json({error:'Verification service temporarily unavailable'},{status:503,headers:cors});
 }
}
