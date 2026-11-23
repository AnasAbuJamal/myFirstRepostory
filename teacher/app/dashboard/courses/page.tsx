import Link from 'next/link';
import {requireTeacher} from '@/lib/roles';
import {publishTeacherCourse,toggleTeacherCourse} from './actions';
import CoursePromptBuilder from './prompt-builder';
export const dynamic='force-dynamic';
export default async function TeacherCoursePage(){
 const {user,sql}=await requireTeacher();
 const courses=await sql`SELECT id,course_code,title,share_code,published,created_at
 FROM teacher_course_packs WHERE teacher_user_id=${user.id}
 ORDER BY created_at DESC LIMIT 100`;
 return <main className="academic-teacher-page">
  <nav className="academic-topnav"><Link className="logo" href="/dashboard">✦ LumenVale Teacher Studio</Link>
   <Link className="button secondary" href="/dashboard">Back to Dashboard</Link></nav>
  <header className="academic-hero"><span className="eyebrow">TEACHER-CREATED · NO PREINSTALLED CLASSES</span>
   <h1>School Course JSON Studio</h1>
   <p>The student school begins empty. Create a course, then append chapters or replace chapter exams with separate teacher-reviewed JSON files. Laboratories and careers never appear automatically.</p>
  </header>
  <div className="academic-panel-grid">
   <section className="panel wide"><CoursePromptBuilder/></section>
   <section className="panel">
    <div className="section-head"><h2>Publish a course JSON</h2><span>{courses.length} uploads</span></div>
    <p>Publish a new <code>lumenvale.lms-course</code> JSON (zero or more chapters), append one <code>lumenvale.lms-chapter</code> JSON to an existing course, or replace one chapter exam with <code>lumenvale.lms-exam</code> JSON. Every upload validates the entire resulting course and issues a new share code.</p>
    <form className="stack-form" action={publishTeacherCourse}>
     <label>Reviewed course file<input type="file" name="file" accept=".json,application/json" required/></label>
     <button className="button primary">Validate and Publish JSON</button>
    </form>
    <p className="fine">Each revision creates a new course version and share code. Share the newest code with students; older versions remain listed until unpublished. Student grades and submissions remain browser-local and are not synchronized with the teacher database.</p>
    <div className="records">{courses.map(c=><div className="academic-published" key={String(c.id)}>
     <div><strong>{String(c.title)}</strong><small>{String(c.course_code)} · {c.published?'Published':'Unpublished'}</small>
      <p>Student course code: <code>{String(c.share_code)}</code></p></div>
     <div className="research-entry-actions">
      <a className="button secondary" href={'/api/courses/'+c.share_code}>Preview JSON</a>
      <form action={toggleTeacherCourse}><input type="hidden" name="id" value={String(c.id)}/>
       <button className="button">{c.published?'Unpublish':'Publish again'}</button></form>
     </div>
    </div>)}{!courses.length&&<p className="empty">No courses published. The school is waiting for your first curriculum.</p>}</div>
   </section>
  </div>
 </main>;
}
