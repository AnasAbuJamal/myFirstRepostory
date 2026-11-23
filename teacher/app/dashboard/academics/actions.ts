'use server';
import {randomBytes} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireTeacher} from '@/lib/roles';
import {validateAcademicPacks} from '@/lib/academic-validate';

function val(data:FormData,name:string,max=150){return String(data.get(name)||'').trim().slice(0,max);}
function authCode(){return randomBytes(18).toString('base64url');}
export async function publishAcademicPack(form:FormData){
 const {user,sql}=await requireTeacher(),file=form.get('file');
 if(!(file instanceof File)||file.size<2||file.size>1024*1024)
  throw Error('Upload a JSON file smaller than 1 MB.');
 let data:unknown;
 try{data=JSON.parse(await file.text());}catch{throw Error('Invalid JSON file.');}
 const packs=validateAcademicPacks(data);
 for(const p of packs){
  const code=authCode();
  await sql`INSERT INTO academic_packs(teacher_user_id,course_id,kind,title,payload,share_code)
  VALUES(${user.id},${p.courseId},${p.kind},${p.title},${JSON.stringify(p)}::jsonb,${code})`;
 }
 revalidatePath('/dashboard/academics');
}
export async function toggleAcademicPack(form:FormData){
 const {user,sql}=await requireTeacher();
 const id=z.string().uuid().parse(val(form,'id',50));
 await sql`UPDATE academic_packs SET published=NOT published WHERE id=${id} AND teacher_user_id=${user.id}`;
 revalidatePath('/dashboard/academics');
}
export async function recordRecitation(form:FormData){
 const {user,sql}=await requireTeacher();
 const enrollmentId=z.string().uuid().parse(val(form,'enrollmentId',50));
 const courseId=z.enum(['QUR-M1','QUR-H1']).parse(val(form,'courseId',35));
 const surah=val(form,'surah',100),verses=val(form,'verses',60);
 const accuracy=Number(form.get('accuracy')),tajweed=Number(form.get('tajweed')),fluency=Number(form.get('fluency'));
 const points=Number(form.get('rewardCoins'));
 const approved=val(form,'approved')==='yes';
 const courseComplete=approved&&val(form,'courseComplete')==='yes';
 if(!surah||!verses||![accuracy,tajweed,fluency].every(n=>Number.isInteger(n)&&n>=0&&n<=100))
  throw Error('Enter the surah, verses, and valid assessment scores.');
 if(!Number.isInteger(points)||points<0||points>100)throw Error('Reward must be 0–100 coins.');
 if(approved&&Math.min(accuracy,tajweed,fluency)<70)throw Error('Approval requires at least 70 in each assessed skill.');
 const canReview=await sql`SELECT e.id FROM class_enrollments e
  JOIN classrooms c ON c.id=e.classroom_id WHERE e.id=${enrollmentId} AND c.teacher_user_id=${user.id} LIMIT 1`;
 if(!canReview.length)throw Error('Student is not enrolled in one of your classes.');
 const token=approved?authCode():null;
 await sql`INSERT INTO quran_recitation_reviews
 (teacher_user_id,enrollment_id,course_id,surah,verses,accuracy,tajweed,fluency,approved,reward_coins,redeem_code,course_complete)
 VALUES(${user.id},${enrollmentId},${courseId},${surah},${verses},${accuracy},${tajweed},${fluency},
 ${approved},${approved?points:0},${token},${courseComplete})`;
 revalidatePath('/dashboard/academics');
}
