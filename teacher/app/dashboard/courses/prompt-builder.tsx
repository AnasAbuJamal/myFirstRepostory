'use client';
import {useState} from 'react';
export default function CoursePromptBuilder(){
 const [title,setTitle]=useState('');
 const [code,setCode]=useState('');
 const [subject,setSubject]=useState('');
 const [chapters,setChapters]=useState(3);
 const [topic,setTopic]=useState('');
 const [feedback,setFeedback]=useState('');
 const prompt=[
  'Create one original educational course for the LumenVale school game.',
  'The school currently has NO existing classes. Do not assume a preset curriculum.',
  'Return ONLY strict valid JSON (no Markdown code fences).',
  'Use kind "lumenvale.lms-course", version 1, and published true.',
  'Course id (uppercase letters, digits and dashes, 3–31 characters): '+(code||'[TEACHER COURSE CODE]'),
  'Title: '+(title||'[TEACHER COURSE NAME]'),
  'Subject: '+(subject||'[SUBJECT]'),
  'Main course topics: '+(topic||'[TOPICS]'),
  'Create exactly '+chapters+' chapters inside the "modules" array.',
  'Root fields: kind, version, id, title, subject, teacher, description, published, modules, assignments, announcements.',
  'Every module/chapter: id (unique lowercase-hyphen slug), title, objectives (array of strings), lesson:{title,content (at least 30 characters)}, flashcards:[{front,back}], practice:[{prompt,choices,correctIndex,explanation}], exam:{title,questions:[{prompt,choices,correctIndex,explanation}],timeLimitMinutes:15,attemptLimit:3}.',
  'Exam and practice questions need 2–5 distinct choices and a ZERO-BASED numeric correctIndex. Check all correct answers, explanations and factual claims.',
  'Assignments may be an empty array or contain {id,title,moduleId,prompt,points,dueDate}; announcements may be empty.',
  'Do not add careers, labs, student personal data, real grades, fabricated citations or unsupported claims.',
  'The teacher reviews all content and answers before publishing. Make it student-appropriate and educationally accurate.'
 ].join('\n');
 async function copy(){try{await navigator.clipboard.writeText(prompt);setFeedback('Prompt copied. Review the generated JSON before uploading.');}
 catch{setFeedback('Select the prompt and copy it manually.');}}
 return <div className="academic-prompt">
  <h2>AI Course + Chapter Prompt Builder</h2>
  <p>Choose any course. Copy the prompt into ChatGPT or another AI tool, review its JSON, then publish the file above.</p>
  <div className="research-form-row">
   <label>Course name<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Your course name" maxLength={120}/></label>
   <label>Course code<input value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,''))} placeholder="EXAMPLE-101" maxLength={31}/></label>
   <label>Subject<input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Any subject" maxLength={70}/></label>
  </div>
  <label>Learning topics<input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Topics or outcomes for the teacher to define" maxLength={250}/></label>
  <label>Number of chapters (1–24)<input type="number" value={chapters} min={1} max={24} onChange={e=>setChapters(Math.max(1,Math.min(24,Number(e.target.value)||1)))}/></label>
  <label>Copy-ready course generation prompt<textarea value={prompt} readOnly rows={16}/></label>
  <div className="actions"><button type="button" className="button primary" onClick={copy}>Copy JSON Prompt</button>
   <a className="button secondary" href="/examples/lms-course.json" download>Download Valid JSON Example</a></div>
  {feedback&&<p role="status">{feedback}</p>}
  <small>JSON does not execute code. Verify assessment answers. Publishing does not create an accredited course or automatically synchronize student records.</small>
 </div>;
}
