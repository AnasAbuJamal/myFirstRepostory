import Link from 'next/link';
import {requireTeacher} from '@/lib/roles';
import {publishAcademicPack,toggleAcademicPack,recordRecitation} from './actions';
import PromptBuilder from './prompt-builder';

export const dynamic='force-dynamic';
export default async function Academics(){
 const {user,sql}=await requireTeacher();
 const packs=await sql`SELECT id,course_id,kind,title,share_code,published,created_at
 FROM academic_packs WHERE teacher_user_id=${user.id} ORDER BY created_at DESC LIMIT 100`;
 const students=await sql`SELECT e.id,e.display_name,c.title AS classroom
 FROM class_enrollments e JOIN classrooms c ON c.id=e.classroom_id
 WHERE c.teacher_user_id=${user.id} ORDER BY c.title,e.display_name LIMIT 250`;
 const reviews=await sql`SELECT r.id,r.course_id,r.surah,r.verses,r.accuracy,r.tajweed,r.fluency,
 r.approved,r.course_complete,r.reward_coins,r.redeem_code,r.redeemed_at,r.created_at,
 e.display_name,e.student_code
 FROM quran_recitation_reviews r JOIN class_enrollments e ON e.id=r.enrollment_id
 WHERE r.teacher_user_id=${user.id} ORDER BY r.created_at DESC LIMIT 75`;
 return <main className="academic-teacher-page">
  <nav className="academic-topnav"><Link className="logo" href="/dashboard">✦ LumenVale Teacher Studio</Link>
   <Link className="button secondary" href="/dashboard">Back to Dashboard</Link></nav>
  <header className="academic-hero"><span className="eyebrow">TEACHER ONLY · CURRICULUM CONTROL</span>
   <h1>Academic Pathways Studio</h1>
   <p>Control the school curriculum, publish JSON lessons and assessments, and verify Qur’an memorization after hearing students recite directly.</p>
   <div className="research-form-row">
    <a className="button secondary" href="/examples/academic-catalog.json" download>Download Course Catalog</a>
    <a className="button secondary" href="/examples/academic-pack.json" download>Academic JSON Example</a>
    <a className="button secondary" href="/examples/quran-plan.json" download>Qur’an Plan Example</a>
   </div>
  </header>
  <div className="academic-panel-grid">
   <section className="panel wide">
    <PromptBuilder/>
   </section>
   <section className="panel">
    <div className="section-head"><h2>Publish JSON content</h2><span>{packs.length} packages</span></div>
    <p>Import a complete academic course, a separate exam, a flashcard deck, or a Qur’an plan. Every file is checked against version 1 before publishing.</p>
    <form className="stack-form" action={publishAcademicPack}>
     <label>Academic JSON file<input type="file" name="file" accept=".json,application/json" required/></label>
     <button className="button primary">Validate and Publish</button>
    </form>
    <p className="fine">Publishing creates a share code. Give the code to students to import the lesson into their game. Unpublish to disable future imports.</p>
    <div className="records">{packs.map(p=><div key={String(p.id)} className="academic-published">
     <div><strong>{p.title}</strong><small>{p.course_id} · {String(p.kind).replace('lumenvale.','')} · {p.published?'Published':'Unpublished'}</small>
      <p>Student share code: <code>{String(p.share_code)}</code></p></div>
     <div className="research-entry-actions">
      <a className="button secondary" href={'/api/academic/'+p.share_code}>Preview JSON</a>
      <form action={toggleAcademicPack}><input name="id" type="hidden" value={String(p.id)}/>
       <button className="button">{p.published?'Unpublish':'Publish again'}</button></form>
     </div>
    </div>)}
    {!packs.length&&<p className="empty">No course packages published yet. Download an example to get started.</p>}</div>
   </section>
   <section className="panel">
    <div className="section-head"><h2>Qur’an Teacher Assessment</h2><span>Live recitation</span></div>
    <p>Listen to the student's recitation yourself (in person or during a supervised live session). Then enter the result, assess tajweed, and optionally award game coins.</p>
    <form action={recordRecitation} className="stack-form">
     <label>Student in your classroom<select name="enrollmentId" required defaultValue=""><option value="" disabled>Choose student</option>
      {students.map(s=><option key={String(s.id)} value={String(s.id)}>{s.display_name} · {s.classroom}</option>)}</select></label>
     <label>Memorization course<select name="courseId" required defaultValue="QUR-M1">
      <option value="QUR-M1">Middle School · Qur’an Memorization I</option><option value="QUR-H1">High School · Qur’an Memorization II</option></select></label>
     <div className="research-form-row"><label>Surah<input name="surah" required maxLength={100} placeholder="Al-Fatihah"/></label>
      <label>Verses<input name="verses" required maxLength={60} placeholder="1–7"/></label></div>
     <div className="research-form-row">
      <label>Memorization accuracy (0–100)<input name="accuracy" type="number" min={0} max={100} defaultValue={90} required/></label>
      <label>Tajweed (0–100)<input name="tajweed" type="number" min={0} max={100} defaultValue={90} required/></label>
      <label>Fluency (0–100)<input name="fluency" type="number" min={0} max={100} defaultValue={90} required/></label></div>
     <label>Approved game coins<input name="rewardCoins" type="number" min={0} max={100} defaultValue={30} required/></label>
     <label className="academic-check"><input name="approved" type="checkbox" value="yes"/> I personally reviewed this recitation and approve it.</label>
     <label className="academic-check"><input name="courseComplete" type="checkbox" value="yes"/> All memorization targets for this course are complete.</label>
     <p className="fine">Approving requires at least 70 points in each skill. If you do not approve, the review is saved without a game reward or redemption code.</p>
     <button className="button primary">Save teacher assessment</button>
    </form>
   </section>
   <section className="panel wide">
    <div className="section-head"><h2>Recitation records and reward codes</h2><span>{reviews.length} reviews</span></div>
    <p>Approved students receive an unpredictable, one-time code. Share it privately with the matching student along with their classroom code. The game redeems it on the teacher server before awarding coins. A code cannot be reused.</p>
    <div className="records">{reviews.map(r=><div className="academic-published" key={String(r.id)}>
     <div><strong>{r.display_name} · {r.surah} ({r.verses})</strong>
      <small>{r.course_id} · Accuracy {r.accuracy}% · Tajweed {r.tajweed}% · Fluency {r.fluency}%</small>
      <p>Private classroom code: <code>{String(r.student_code)}</code></p><p>{r.approved?'✓ Approved':'Not approved'} · {r.course_complete?'Course complete':'Course still in progress'} · {r.reward_coins} coins</p>
      {r.approved&&<p>{r.redeemed_at?'Redeemed':'Private one-time code'}: <code>{r.redeemed_at?'Used':String(r.redeem_code)}</code></p>}
     </div>
    </div>)}{!reviews.length&&<p className="empty">No recitations assessed yet.</p>}</div>
    <p className="fine">This is an in-game learning record, not an official Qur’an certification. Do not publish student names, grades or approval codes on a public webpage.</p>
   </section>
  </div>
 </main>;
}
