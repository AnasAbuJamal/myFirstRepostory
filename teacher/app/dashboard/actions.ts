'use server';
import {requireTeacher} from '@/lib/roles';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';

const uuid=z.string().uuid();
function text(form:FormData,key:string,max=150){return String(form.get(key)||'').trim().slice(0,max);}
async function teacher(){return await requireTeacher();}
export async function createClassroom(form:FormData){
 const {user,sql}=await teacher(),title=text(form,'title',120),grade=text(form,'gradeLevel',40)||'General';
 if(title.length<2)throw Error('Class title is required');
 await sql`INSERT INTO classrooms(teacher_user_id,title,grade_level) VALUES (${user.id},${title},${grade})`;
 revalidatePath('/dashboard');
}
export async function createCourse(form:FormData){
 const {user,sql}=await teacher(),title=text(form,'title',120),subject=text(form,'subject',80);
 if(title.length<2||subject.length<2)throw Error('Course and subject required');
 await sql`INSERT INTO courses(teacher_user_id,title,subject) VALUES(${user.id},${title},${subject})`;
 revalidatePath('/dashboard');
}
function parseLesson(raw:unknown){
 if(!raw||typeof raw!=='object')throw Error('Expected lesson JSON object');
 const b=raw as Record<string,unknown>;
 const title=String(b.title||'').trim().slice(0,120);
 const genre=String(b.genre||b.genera||'General').trim().slice(0,60);
 const pages=Array.isArray(b.pages)?b.pages.map(x=>String(x).slice(0,2500)):typeof b.text==='string'?[b.text.slice(0,16000)]:[];
 if(!title||!pages.length||pages.length>14||pages.some(x=>!x.trim())||pages.join('').length>18000)throw Error('Invalid book title or pages');
 const rawQuestions=Array.isArray(b.questions)?b.questions:[];
 if(!rawQuestions.length||rawQuestions.length>30)throw Error('Provide 1–30 reviewed questions');
 const questions=rawQuestions.map(item=>{
  if(!item||typeof item!=='object')throw Error('Invalid question');
  const q=item as Record<string,unknown>;
  const prompt=String(q.prompt||q.question||'').trim().slice(0,700);
  const choices=Array.isArray(q.choices)?q.choices:Array.isArray(q.answers)?q.answers:[];
  const answer=Number(q.correctIndex??q.correct);
  if(prompt.length<8||choices.length<2||choices.length>5||choices.some(x=>typeof x!=='string'||!x.trim()||x.length>300)||!Number.isInteger(answer)||answer<0||answer>=choices.length)throw Error('Question is missing valid choices or correctIndex');
  return {prompt,choices,correctIndex:answer};
 });
 return {title,genre,pages,questions,wordCount:pages.join(' ').trim().split(/\s+/).length};
}
export async function importBook(form:FormData){
 const {user,sql}=await teacher();
 const courseId=uuid.parse(text(form,'courseId',40));
 const check=await sql`SELECT id FROM courses WHERE id=${courseId} AND teacher_user_id=${user.id}`;
 if(!check.length)throw Error('Course not found');
 const file=form.get('file');
 if(!(file instanceof File)||file.size>2*1024*1024||file.size<2)throw Error('File is missing or larger than 2 MB');
 const decoded=JSON.parse(await file.text());
 const list=Array.isArray(decoded)?decoded:Array.isArray(decoded?.books)?decoded.books:[decoded];
 if(!list.length||list.length>30)throw Error('Import 1–30 lessons per upload');
 const lessons=list.map(parseLesson);
 for(const item of lessons)await sql`INSERT INTO lessons(course_id,teacher_user_id,title,genre,word_count,pages,questions)
 VALUES(${courseId},${user.id},${item.title},${item.genre},${item.wordCount},${JSON.stringify(item.pages)}::jsonb,${JSON.stringify(item.questions)}::jsonb)`;
 revalidatePath('/dashboard');
}
export async function createAssignment(form:FormData){
 const {user,sql}=await teacher();
 const classroomId=uuid.parse(text(form,'classroomId',40)),lessonId=uuid.parse(text(form,'lessonId',40));
 const permitted=await sql`SELECT c.id FROM classrooms c JOIN lessons l ON l.id=${lessonId} WHERE c.id=${classroomId} AND c.teacher_user_id=${user.id} AND l.teacher_user_id=${user.id}`;
 if(!permitted.length)throw Error('Not authorized for this classroom or lesson');
 const date=text(form,'dueDate',10);
 const due=date&&/^\d{4}-\d{2}-\d{2}$/.test(date)?date:null;
 await sql`INSERT INTO assignments(classroom_id,lesson_id,teacher_user_id,due_date) VALUES(${classroomId},${lessonId},${user.id},${due})`;
 revalidatePath('/dashboard');
}
export async function addStudent(form:FormData){
 const {user,sql}=await teacher(),classroomId=uuid.parse(text(form,'classroomId',40));
 const displayName=text(form,'displayName',80),studentCode=text(form,'studentCode',40);
 if(!displayName||studentCode.length<3)throw Error('Student nickname and code required');
 const permitted=await sql`SELECT id FROM classrooms WHERE id=${classroomId} AND teacher_user_id=${user.id}`;
 if(!permitted.length)throw Error('Not authorized for this class');
 await sql`INSERT INTO class_enrollments(classroom_id,student_code,display_name) VALUES(${classroomId},${studentCode},${displayName}) ON CONFLICT(classroom_id,student_code) DO UPDATE SET display_name=excluded.display_name`;
 revalidatePath('/dashboard');
}
export async function recordGrade(form:FormData){
 const {user,sql}=await teacher(),assignmentId=uuid.parse(text(form,'assignmentId',40));
 const enrollmentId=uuid.parse(text(form,'enrollmentId',40));
 const earned=Number(form.get('pointsEarned'));
 if(!Number.isFinite(earned)||earned<0)throw Error('Invalid score');
 const assignment=await sql`SELECT a.id,a.points FROM assignments a JOIN class_enrollments e ON e.classroom_id=a.classroom_id
 WHERE a.id=${assignmentId} AND a.teacher_user_id=${user.id} AND e.id=${enrollmentId} LIMIT 1`;
 if(!assignment.length||earned>Number(assignment[0].points))throw Error('Not authorized or points exceed maximum');
 await sql`INSERT INTO grade_entries(assignment_id,enrollment_id,points_earned) VALUES(${assignmentId},${enrollmentId},${earned}) ON CONFLICT(assignment_id,enrollment_id) DO UPDATE SET points_earned=excluded.points_earned,graded_at=now()`;
 revalidatePath('/dashboard');
}
