'use server';
import {randomBytes} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireTeacher} from '@/lib/roles';
import {TeacherCourse} from '@/lib/lms-course-validate';
export async function publishTeacherCourse(form:FormData){
 const {user,sql}=await requireTeacher();
 const file=form.get('file');
 if(!(file instanceof File)||file.size<2||file.size>1024*1024)throw Error('Upload a JSON course under 1 MB.');
 let data:unknown;
 try{data=JSON.parse(await file.text());}catch{throw Error('Invalid JSON file.');}
 const validated=TeacherCourse.parse(data);
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
