import {NextRequest,NextResponse} from 'next/server';
import {database} from '@/lib/roles';

export const dynamic='force-dynamic';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS',
 'Access-Control-Allow-Headers':'Content-Type','X-Content-Type-Options':'nosniff'};

export async function OPTIONS(){return new NextResponse(null,{status:204,headers:cors});}
export async function GET(request:NextRequest,{params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 if(!/^[A-Za-z0-9_-]{8,45}$/.test(code))
  return NextResponse.json({error:'Invalid research code'},{status:400,headers:cors});
 if(!process.env.DATABASE_URL)
  return NextResponse.json({error:'Research service not configured'},{status:503,headers:cors});
 try{
  const sql=database();
  const rows=await sql`SELECT title,field,summary,reading_text,questions,reward,publish_code
 FROM research_projects WHERE publish_code=${code} AND published=true LIMIT 1`;
  if(!rows.length)return NextResponse.json({error:'Research project not found'},{status:404,headers:cors});
  const record=rows[0];
  const data={version:1,projects:[{id:record.publish_code,title:record.title,field:record.field,
    summary:record.summary,text:record.reading_text,questions:record.questions,
    reward:record.reward,teacher:'Approved teacher project'}]};
  const download=request.nextUrl.searchParams.get('download')==='1';
  return NextResponse.json(data,{status:200,headers:{
   ...cors,'Cache-Control':'public, max-age=60, s-maxage=60',
   ...(download?{'Content-Disposition':`attachment; filename="lumenvale-research-${code}.json"`}:{})
  }});
 }catch{
  return NextResponse.json({error:'Research data temporarily unavailable'},{status:503,headers:cors});
 }
}
