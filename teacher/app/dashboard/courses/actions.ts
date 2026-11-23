'use server';
import {randomBytes} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireTeacher} from '@/lib/roles';
import {TeacherCourse} from '@/lib/lms-course-validate';

const Code=z.string().regex(/^[A-Z][A-Z0-9-]{2,30}$/);
const ChapterUpload=z.object({
 kind:z.literal('lumenvale.lms-chapter'),version:z.literal(1),
 courseId:Code,chapter:z.unknown()
});
const ExamUpload=z.object({
 kind:z.literal('lumenvale.lms-exam'),version:z.literal(1),
 courseId:Code,chapterId:z.string().regex(/^[a-z0-9-]{2,46}$/),exam:z.unknown()
});
const ContentUpdate=z.discriminatedUnion('kind',[ChapterUpload,ExamUpload]);

export async function publishTeacherCourse(form:FormData){
 const {user,sql}=await requireTeacher();
 const file=form.get('file');
 if(!(file instanceof File)||file.size<2||file.size>1024*1024)throw Error('Upload a JSON course, chapter, or exam under 1 MB.');
 let data:unknown;
 try{data=JSON.parse(await file.text());}catch{throw Error('Invalid JSON file.');}
 let validated;
 if(data&&typeof data==='object'&&'kind' in data&&data.kind==='lumenvale.lms-course'){
  validated=TeacherCourse.parse(data);
 }else{
  const patch=ContentUpdate.parse(data);
  // Never accept arbitrary course IDs or editor-supplied teacher identity:
  // only a course created by the authenticated teacher can be changed.
  const current=await sql`SELECT payload FROM teacher_course_packs
   WHERE teacher_user_id=${user.id} AND course_code=${patch.courseId}
   ORDER BY created_at DESC,id DESC LIMIT 1`;
  if(!current.length)throw Error('Create a course before adding its chapters or exams.');
  const course=TeacherCourse.parse(current[0].payload);
  if(patch.kind==='lumenvale.lms-chapter'){
   if(!patch.chapter||typeof patch.chapter!=='object'||Array.isArray(patch.chapter))
    throw Error('Chapter must be an object.');
   const id=(patch.chapter as {id?:unknown}).id;
   if(typeof id!=='string'||course.modules.some(m=>m.id===id))
    throw Error('Chapter needs a new unique ID. To edit it, upload the full course JSON.');
   validated=TeacherCourse.parse({...course,modules:[...course.modules,patch.chapter]});
  }else{
   if(!course.modules.some(m=>m.id===patch.chapterId))
    throw Error('The selected chapter does not exist in this teacher course.');
   validated=TeacherCourse.parse({...course,modules:course.modules.map(m=>
    m.id===patch.chapterId?{...m,exam:patch.exam}:m)});
  }
 }
 const code=randomBytes(18).toString('base64url');
 await sql`INSERT INTO teacher_course_packs(teacher_user_id,course_code,title,payload,share_code)
  VALUES(${user.id},${validated.id},${validated.title},${JSON.stringify(validated)}::jsonb,${code})`;
 revalidatePath('/dashboard/courses');
}
export async function toggleTeacherCourse(form:FormData){
 const {user,sql}=await requireTeacher();
 const id=z.string().uuid().parse(String(form.get('id')||''));
 await sql`UPDATE teacher_course_packs SET published=NOT published WHERE id=${id} AND teacher_user_id=${user.id}`;
 revalidatePath('/dashboard/courses');
}
