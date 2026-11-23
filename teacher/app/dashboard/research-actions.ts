'use server';
import {randomBytes} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {requireTeacher} from '@/lib/roles';
import {z} from 'zod';

const ResearchSchema=z.object({
 title:z.string().trim().min(4).max(130),
 field:z.string().trim().min(2).max(70),
 summary:z.string().trim().min(20).max(1200),
 text:z.string().trim().min(100).max(12000),
 questions:z.array(z.object({
  prompt:z.string().trim().min(10).max(600),
  choices:z.array(z.string().trim().min(1).max(250)).min(2).max(5),
  correctIndex:z.number().int().min(0).max(4)
 })).min(2).max(8),
 reward:z.number().int().min(50).max(220)
}).superRefine((data,ctx)=>{
 for(let i=0;i<data.questions.length;i++){
  if(data.questions[i].correctIndex>=data.questions[i].choices.length)
   ctx.addIssue({code:'custom',message:'Answer index outside choices',path:['questions',i,'correctIndex']});
 }
 if(data.text.split(/\s+/).length<55)
  ctx.addIssue({code:'custom',message:'Research reading must have at least 55 words',path:['text']});
});
type Research=z.infer<typeof ResearchSchema>;
function val(form:FormData,name:string){return String(form.get(name)||'').trim();}
function validate(raw:unknown):Research{return ResearchSchema.parse(raw);}
function formProject(form:FormData){
 const questions=[1,2,3].map(i=>{
  const prompt=val(form,'prompt'+i);
  const choices=[val(form,'q'+i+'a'),val(form,'q'+i+'b'),val(form,'q'+i+'c')].filter(Boolean);
  return {prompt,choices,correctIndex:Number(val(form,'correct'+i)||0)};
 }).filter(q=>q.prompt.length>0);
 return validate({title:val(form,'title'),field:val(form,'field')||'Science',
  summary:val(form,'summary'),text:val(form,'readingText'),
  questions,reward:Number(val(form,'reward')||100)});
}
async function insertResearch(userId:string,sql:Awaited<ReturnType<typeof requireTeacher>>['sql'],project:Research){
 const code=randomBytes(12).toString('base64url');
 await sql`INSERT INTO research_projects
 (teacher_user_id,title,field,summary,reading_text,questions,reward,publish_code,published)
 VALUES (${userId},${project.title},${project.field},${project.summary},${project.text},
 ${JSON.stringify(project.questions)}::jsonb,${project.reward},${code},true)`;
}
export async function createResearch(form:FormData){
 const {user,sql}=await requireTeacher(),project=formProject(form);
 await insertResearch(user.id,sql,project);revalidatePath('/dashboard');
}
export async function importResearchPack(form:FormData){
 const {user,sql}=await requireTeacher(),file=form.get('file');
 if(!(file instanceof File)||file.size<2||file.size>1024*1024)throw Error('Choose a JSON file smaller than 1 MB.');
 let raw:unknown;
 try{raw=JSON.parse(await file.text());}catch{throw Error('Invalid research JSON file.');}
 const source=raw as Record<string,unknown>;
 const list=Array.isArray(raw)?raw:Array.isArray(source?.projects)?source.projects:[raw];
 if(list.length<1||list.length>15)throw Error('Import between 1 and 15 projects at once.');
 const items=list.map(item=>{
  const p=item as Record<string,unknown>;
  return validate({title:p.title,field:p.field,summary:p.summary,text:p.text||p.readingText||p.passage,
   questions:p.questions,reward:p.reward??100});
 });
 for(const project of items)await insertResearch(user.id,sql,project);
 revalidatePath('/dashboard');
}
export async function toggleResearch(form:FormData){
 const {user,sql}=await requireTeacher(),id=z.string().uuid().parse(val(form,'id'));
 await sql`UPDATE research_projects SET published=NOT published WHERE id=${id} AND teacher_user_id=${user.id}`;
 revalidatePath('/dashboard');
}
