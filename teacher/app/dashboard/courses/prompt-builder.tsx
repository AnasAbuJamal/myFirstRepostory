'use client';
import {useState} from 'react';
type ContentKind='course'|'chapter'|'exam';
export default function CoursePromptBuilder(){
 const [kind,setKind]=useState<ContentKind>('course');
 const [title,setTitle]=useState('');
 const [code,setCode]=useState('');
 const [subject,setSubject]=useState('');
 const [chapters,setChapters]=useState(0);
 const [chapterId,setChapterId]=useState('');
 const [topic,setTopic]=useState('');
 const [feedback,setFeedback]=useState('');
 const fixed=[
  'Create ORIGINAL, teacher-reviewed learning content for LumenVale.',
  'Return one strict VALID JSON object only, without Markdown code fences.',
  'No student private data, fabricated citations, careers or labs.',
  'Every multiple-choice question uses 2–5 choices and zero-based correctIndex.',
  'The teacher will verify accuracy and test every answer before publishing.'
 ];
 const idLine='Course ID: '+(code||'[EXISTING/NEW COURSE CODE]');
 const moduleSchema='A chapter needs id (unique lowercase-hyphen slug), title, objectives[], lesson:{title,content (30+ characters)}, flashcards:[{front,back}], practice:[{prompt,choices,correctIndex,explanation}], exam:{title,questions:[{prompt,choices,correctIndex,explanation}],timeLimitMinutes:15,attemptLimit:3}.';
 const examSchema='Exam fields: title, questions:[{prompt,choices,correctIndex,explanation}], timeLimitMinutes:15, attemptLimit:3.';
 const prompt=[
  ...fixed,idLine,
  ...(kind==='course'?[
   'Create a new course JSON with kind "lumenvale.lms-course" and version 1.',
   'Title: '+(title||'[NEW COURSE NAME]'),
   'Subject: '+(subject||'[SUBJECT]'),
   'Topics: '+(topic||'[TEACHER CHOSEN TOPICS]'),
   'Set published=true; include: id, title, subject, teacher, description, published, modules, assignments, announcements.',
   'Create exactly '+chapters+' initial chapters inside the modules array. An empty modules array is permitted.',
   moduleSchema,
   'Assignments and announcements may be empty arrays.'
  ]:kind==='chapter'?[
   'Create ONE additional chapter JSON with kind "lumenvale.lms-chapter" and version 1.',
   'Root object: {kind,version,courseId,chapter}. The chapter property holds exactly one NEW chapter object.',
   'Chapter title/topic: '+(topic||'[NEW CHAPTER TOPIC]'),
   moduleSchema,
   'Do not use an ID already existing in the course. The teacher must first publish the course.'
  ]:[
   'Create a replacement chapter exam JSON with kind "lumenvale.lms-exam" and version 1.',
   'Root object: {kind,version,courseId,chapterId,exam}.',
   'Existing chapterId: '+(chapterId||'[EXISTING CHAPTER ID]'),
   'Exam topic: '+(topic||'[ASSESSMENT TOPIC]'),
   examSchema,
   'The chapter must already exist in a course owned by the publishing teacher.'
  ])
 ].join('\n');
 async function copy(){try{await navigator.clipboard.writeText(prompt);setFeedback('Prompt copied. Review the generated JSON before uploading.');}
 catch{setFeedback('Select the prompt and copy it manually.');}}
 return <div className="academic-prompt">
  <h2>Teacher JSON Prompt Builder</h2>
  <p>Create a course, add a chapter or replace an exam. Select a format, review its generated JSON, and upload it.</p>
  <label>JSON operation<select value={kind} onChange={e=>setKind(e.target.value as ContentKind)}>
   <option value="course">Create new course</option><option value="chapter">Add chapter to course</option><option value="exam">Replace an existing chapter exam</option>
  </select></label>
  <div className="research-form-row">
   <label>Course code<input value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,''))} placeholder="COURSE-101" maxLength={31}/></label>
   {kind==='course'&&<><label>Course name<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Teacher-defined name" maxLength={120}/></label>
    <label>Subject<input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Any subject" maxLength={70}/></label></>}
   {kind==='exam'&&<label>Existing chapter ID<input value={chapterId} onChange={e=>setChapterId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} placeholder="chapter-one" maxLength={46}/></label>}
  </div>
  <label>{kind==='course'?'Course topics':kind==='chapter'?'New chapter topic':'Exam topic'}
   <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Topics or outcomes to cover" maxLength={250}/></label>
  {kind==='course'&&<label>Initial chapters (0–24)<input type="number" value={chapters} min={0} max={24} onChange={e=>setChapters(Math.max(0,Math.min(24,Number(e.target.value)||0)))}/></label>}
  <label>Copy-ready JSON generation prompt<textarea value={prompt} readOnly rows={15}/></label>
  <div className="actions"><button type="button" className="button primary" onClick={copy}>Copy JSON Prompt</button>
   <a className="button secondary" href={'/examples/lms-'+(kind==='course'?'course':kind)+'.json'} download>Download Matching JSON Example</a></div>
  {feedback&&<p role="status">{feedback}</p>}
  <small>Upload only reviewed curriculum. Changes create a new published snapshot and share code; student grades are not synchronized.</small>
 </div>;
}
