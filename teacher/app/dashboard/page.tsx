import {requireTeacher} from '@/lib/roles';
import {createClassroom,createCourse,importBook,createAssignment,addStudent,recordGrade} from './actions';
import {createResearch,importResearchPack,toggleResearch} from './research-actions';
import Link from 'next/link';
export const dynamic='force-dynamic';
export default async function Dashboard(){
 const {user,role,sql}=await requireTeacher();
 const classrooms=await sql`SELECT id,title,grade_level FROM classrooms WHERE teacher_user_id=${user.id} ORDER BY created_at DESC`;
 const courses=await sql`SELECT id,title,subject,description FROM courses WHERE teacher_user_id=${user.id} ORDER BY created_at DESC`;
 const lessons=await sql`SELECT l.id,l.title,l.genre,l.word_count,c.title AS course FROM lessons l JOIN courses c ON c.id=l.course_id WHERE l.teacher_user_id=${user.id} ORDER BY l.created_at DESC`;
 const assignments=await sql`SELECT a.id,a.classroom_id,a.points,a.due_date,l.title AS lesson,cl.title AS classroom FROM assignments a JOIN lessons l ON l.id=a.lesson_id JOIN classrooms cl ON cl.id=a.classroom_id WHERE a.teacher_user_id=${user.id} ORDER BY a.created_at DESC`;
 const learners=await sql`SELECT e.id,e.display_name,e.student_code,e.classroom_id,cl.title AS classroom FROM class_enrollments e JOIN classrooms cl ON cl.id=e.classroom_id WHERE cl.teacher_user_id=${user.id} ORDER BY e.display_name`;
 const research=await sql`SELECT id,title,field,publish_code,published,reward,created_at FROM research_projects WHERE teacher_user_id=${user.id} ORDER BY created_at DESC`;
 const grades=await sql`SELECT e.display_name,cl.title AS classroom,l.title AS lesson,a.points,ge.points_earned FROM grade_entries ge JOIN assignments a ON a.id=ge.assignment_id JOIN class_enrollments e ON e.id=ge.enrollment_id JOIN classrooms cl ON cl.id=a.classroom_id JOIN lessons l ON l.id=a.lesson_id WHERE a.teacher_user_id=${user.id} ORDER BY ge.graded_at DESC LIMIT 30`;
 return <div className="dashboard">
  <aside className="sidebar"><Link className="logo" href="/">✦ <span>LumenVale<small>TEACHER STUDIO</small></span></Link>
   <nav><a href="#overview">Overview</a><a href="#classes">Classrooms</a><a href="#courses">Curriculum</a><a href="#books">Lesson Library</a><a href="#assignments">Assignments</a><a href="#grades">Gradebook</a><a href="#research">Research Studio</a></nav>
   <div className="sidebar-foot"><small>Authenticated role</small><strong>{role.toUpperCase()}</strong><span>{user.email}</span></div>
  </aside>
  <main className="workspace">
   <header className="workspace-head"><div><span className="eyebrow">TEACHER WORKSPACE</span><h1>Good morning, {user.name||'Educator'}.</h1><p>Manage curriculum, assignments and classroom progress without leaving your dashboard.</p></div><Link href="/" className="button secondary">Home</Link></header>
   <section className="summary" id="overview">{[{n:classrooms.length,t:'Classrooms',icon:'⌂'},{n:courses.length,t:'Courses',icon:'▤'},{n:lessons.length,t:'Books & lessons',icon:'▧'},{n:learners.length,t:'Students',icon:'◉'}].map(k=><div className="metric" key={k.t}><span>{k.icon}</span><strong>{k.n}</strong><small>{k.t}</small></div>)}</section>
   <section className="panels">
    <div className="panel" id="classes"><div className="section-head"><h2>Classrooms</h2><span>{classrooms.length} active</span></div>
     <form action={createClassroom} className="inline-form"><input name="title" placeholder="Class name" required minLength={2} maxLength={120}/><input name="gradeLevel" placeholder="Grade level" defaultValue="Level C" maxLength={40}/><button className="button primary">Create class</button></form>
     <div className="records">{classrooms.map(c=><div className="record" key={String(c.id)}><b>{c.title}</b><small>{c.grade_level}</small></div>)}{!classrooms.length&&<p className="empty">Create your first classroom.</p>}</div>
    </div>
    <div className="panel" id="courses"><div className="section-head"><h2>Curriculum</h2><span>{courses.length} courses</span></div>
     <form action={createCourse} className="inline-form"><input name="title" placeholder="Course title" required maxLength={120}/><input name="subject" placeholder="Subject (English, Math…)" required maxLength={80}/><button className="button primary">Add course</button></form>
     <div className="records">{courses.map(c=><div className="record" key={String(c.id)}><b>{c.title}</b><small>{c.subject}</small></div>)}{!courses.length&&<p className="empty">Create a course to start your curriculum.</p>}</div>
    </div>
    <div className="panel wide" id="books"><div className="section-head"><h2>Reading library</h2><span>Import JSON books</span></div><p>Use the same book format as the game: title, genre, pages, wordCount and questions. Word count is checked from the actual text.</p>
     <form action={importBook} className="inline-form"><select name="courseId" required defaultValue=""><option value="" disabled>Choose a course</option>{courses.map(c=><option value={String(c.id)} key={String(c.id)}>{c.title}</option>)}</select><input type="file" name="file" accept=".json,application/json" required/><button className="button primary">Import book</button></form>
     <div className="records">{lessons.map(l=><div className="record book-record" key={String(l.id)}><b>{l.title}</b><small>{l.genre} · {l.word_count} words · {l.course}</small></div>)}{!lessons.length&&<p className="empty">Your imported books will appear here.</p>}</div>
    </div>
    <div className="panel" id="assignments"><div className="section-head"><h2>Assignments</h2><span>{assignments.length} created</span></div>
     <form action={createAssignment} className="stack-form"><select name="classroomId" required defaultValue=""><option value="" disabled>Choose classroom</option>{classrooms.map(c=><option key={String(c.id)} value={String(c.id)}>{c.title}</option>)}</select><select name="lessonId" required defaultValue=""><option value="" disabled>Choose reading</option>{lessons.map(l=><option value={String(l.id)} key={String(l.id)}>{l.title}</option>)}</select><input type="date" name="dueDate"/><button className="button primary">Assign reading</button></form>
     <div className="records">{assignments.map(a=><div className="record" key={String(a.id)}><b>{a.lesson}</b><small>{a.classroom} · {a.due_date?String(a.due_date).slice(0,10):'No due date'}</small></div>)}{!assignments.length&&<p className="empty">Create your first reading assignment.</p>}</div>
    </div>
    <div className="panel"><div className="section-head"><h2>Student roster</h2><span>{learners.length} enrolled</span></div>
     <form action={addStudent} className="stack-form"><select name="classroomId" required defaultValue=""><option value="" disabled>Choose classroom</option>{classrooms.map(c=><option value={String(c.id)} key={String(c.id)}>{c.title}</option>)}</select><input name="displayName" placeholder="Student name or alias" required maxLength={80}/><input name="studentCode" placeholder="Private class reference code" required minLength={3} maxLength={40}/><button className="button primary">Add student</button></form>
     <div className="records">{learners.map(e=><div className="record" key={String(e.id)}><b>{e.display_name}</b><small>{e.classroom}</small></div>)}{!learners.length&&<p className="empty">Add students to a classroom.</p>}</div>
    </div>
    <div className="panel wide" id="grades"><div className="section-head"><h2>Gradebook</h2><span>Assignments and percentages</span></div>
     <form action={recordGrade} className="inline-form"><select name="assignmentId" required defaultValue=""><option value="" disabled>Assignment</option>{assignments.map(a=><option key={String(a.id)} value={String(a.id)}>{a.classroom} · {a.lesson}</option>)}</select><select name="enrollmentId" required defaultValue=""><option value="" disabled>Student</option>{learners.map(l=><option key={String(l.id)} value={String(l.id)}>{l.display_name} · {l.classroom}</option>)}</select><input type="number" name="pointsEarned" min="0" max="1000" step=".5" placeholder="Points earned" required/><button className="button primary">Record grade</button></form>
     <table className="grade-table"><thead><tr><th>Student</th><th>Class</th><th>Lesson</th><th>Score</th><th>Grade</th></tr></thead><tbody>{grades.map((g,i)=>{const percentage=Math.min(100,100*Number(g.points_earned)/Number(g.points)),letter=percentage>=90?'A':percentage>=80?'B':percentage>=70?'C':percentage>=60?'D':'F';return <tr key={i}><td>{g.display_name}</td><td>{g.classroom}</td><td>{g.lesson}</td><td>{g.points_earned}/{g.points}</td><td><span className="grade-pill">{letter} · {percentage.toFixed(0)}%</span></td></tr>})}{!grades.length&&<tr><td colSpan={5}>No grades recorded yet.</td></tr>}</tbody></table>
    </div>
    <div className="panel wide" id="research"><div className="section-head"><h2>Research Studio</h2><span>{research.length} projects</span></div>
     <p>Create original research readings with reviewed questions. Approved teachers can publish a code for students to enter in the Research Scientist job. Students cannot edit teacher projects through the game.</p>
     <form action={createResearch} className="stack-form research-form">
      <div className="research-form-row"><label>Research title<input name="title" placeholder="Investigating Water Quality" required minLength={4} maxLength={130}/></label>
       <label>Research field<input name="field" placeholder="Biology, Chemistry, Engineering…" required maxLength={70}/></label>
       <label>Reward (coins)<input type="number" name="reward" min={50} max={220} defaultValue={110} required/></label></div>
      <label>Research summary<textarea name="summary" minLength={20} maxLength={1200} required placeholder="Describe the main research question and why it matters."/></label>
      <label>Full reading passage<textarea name="readingText" rows={8} minLength={100} maxLength={12000} required placeholder="Write the research article or investigation, including evidence, methods and findings. Students must read this before taking the assessment."/></label>
      <div className="research-questions">{[1,2,3].map(i=><fieldset key={i}><legend>Question {i}{i===3?' (optional)':''}</legend>
       <input name={'prompt'+i} placeholder="Write your multiple-choice question" required={i<3} minLength={i<3?10:undefined}/>
       <div className="research-form-row"><input name={'q'+i+'a'} placeholder="Answer A" required={i<3}/><input name={'q'+i+'b'} placeholder="Answer B" required={i<3}/><input name={'q'+i+'c'} placeholder="Answer C (optional)"/></div>
       <label>Correct answer<select name={'correct'+i} defaultValue="0"><option value="0">A</option><option value="1">B</option><option value="2">C</option></select></label>
      </fieldset>)}</div>
      <button className="button primary">Publish research project</button>
     </form>
     <div className="research-import"><h3>Import a research JSON pack</h3><p>For teachers who prefer creating questions in a file first.</p>
      <form action={importResearchPack} className="inline-form"><input type="file" name="file" accept=".json,application/json" required/>
       <button className="button secondary">Import and publish</button></form></div>
     <div className="records">{research.map(p=><article className="research-entry" key={String(p.id)}>
       <div><strong>{String(p.title)}</strong><small>{String(p.field)} · {p.reward} coins · {p.published?'Published':'Unpublished'}</small>
       <span>Share code: <code>{String(p.publish_code)}</code></span></div>
       <div className="research-entry-actions"><a className="button secondary" href={'/api/research/'+p.publish_code+'?download=1'}>Export JSON</a>
        <form action={toggleResearch}><input type="hidden" name="id" value={String(p.id)}/><button className="button">{p.published?'Unpublish':'Publish'}</button></form></div>
      </article>)}{!research.length&&<p className="empty">Your research projects will appear here.</p>}</div>
    </div>
   </section>
   <footer className="footnote">Classroom records are protected by the teacher's server-side user ID. Student data does not automatically sync from the 3D game yet.</footer>
  </main>
 </div>;
}
