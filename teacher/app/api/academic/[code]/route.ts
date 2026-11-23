import {NextResponse} from 'next/server';
import {database} from '@/lib/roles';

export const dynamic='force-dynamic';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS',
 'Access-Control-Allow-Headers':'Content-Type','X-Content-Type-Options':'nosniff'};
export async function OPTIONS(){return new NextResponse(null,{status:204,headers:cors});}
export async function GET(_request:Request,{params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 if(!/^[A-Za-z0-9_-]{8,45}$/.test(code))return NextResponse.json({error:'Invalid code'},{status:400,headers:cors});
 if(!process.env.DATABASE_URL)return NextResponse.json({error:'Academic service unavailable'},{status:503,headers:cors});
 try{
  const sql=database();
  const rows=await sql`SELECT payload FROM academic_packs WHERE share_code=${code} AND published=true LIMIT 1`;
  if(!rows.length)return NextResponse.json({error:'No published course found'},{status:404,headers:cors});
  return NextResponse.json(rows[0].payload,{status:200,headers:{...cors,'Cache-Control':'public,max-age=60,s-maxage=60'}});
 }catch{
  return NextResponse.json({error:'Academic service unavailable'},{status:503,headers:cors});
 }
}
