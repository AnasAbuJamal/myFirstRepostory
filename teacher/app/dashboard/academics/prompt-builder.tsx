'use client';
import {useState} from 'react';

const types=[
 {id:'academic',label:'Full course and lessons',file:'academic-pack.json'},
 {id:'exam',label:'Graded exam questions',file:'exam-pack.json'},
 {id:'cards',label:'Vocabulary flashcards',file:'flashcard-pack.json'},
 {id:'quran',label:'Qur’an memorization plan',file:'quran-plan.json'}
] as const;
const courseChoices=[
 {id:'SCI-M1',title:'Middle School General Science'},
 {id:'ENG-M1',title:'Middle School English'},
 {id:'MAT-M1',title:'Middle School Mathematics'},
 {id:'BIO-M1',title:'Middle School Biology'},
 {id:'BIO-H1',title:'High School Biology'},
 {id:'CHM-H1',title:'High School Chemistry'},
 {id:'BIO-U1',title:'University General Biology'},
 {id:'CHM-U1',title:'University General Chemistry'},
 {id:'BCH-U1',title:'University Biochemistry'},
 {id:'BEN-U1',title:'Biomedical Engineering'},
 {id:'QUR-M1',title:'Middle School Qur’an'},
 {id:'QUR-H1',title:'High School Qur’an'}
];
export default function PromptBuilder(){
 const [kind,setKind]=useState<(typeof types)[number]['id']>('academic');
 const [courseId,setCourseId]=useState('SCI-M1');
 const [topic,setTopic]=useState('The scientific method and evidence');
 const [feedback,setFeedback]=useState('');
 const selected=types.find(t=>t.id===kind)||types[0];
 const effectiveCourse=kind==='quran'?(courseId==='QUR-H1'?'QUR-H1':'QUR-M1'):
  courseId.startsWith('QUR-')?'SCI-M1':courseId;
 const prompt=[
  'Create ONE original, teacher-reviewable LumenVale learning JSON file.',
  'Content type: '+selected.label+'.',
  'Course ID: '+effectiveCourse+'.',
  'Topic: '+topic+'.',
  'Use precisely the same JSON object structure as the downloadable example: '+selected.file+'.',
  'Set version to 1 and keep the exact required kind string from that example.',
  'For academic lessons: write at least 35 words of meaningful reading per lesson, clear objectives, detailed explanations, and accurate flashcards.',
  'For examinations: provide at least three meaningful multiple-choice questions, 2–5 choices each, and a ZERO-BASED correctIndex. Choose an appropriate passing percentage.',
  'For flashcards: include an existing lessonId, and provide accurate front and back descriptions.',
  'For Qur’an plans: provide surah and verse-range assignments only; a human teacher must hear and approve live recitation. Do not invent Qur’an quotations or claim AI can verify tajweed.',
  'Do not add student names, medical details, private data, or fabricated citations.',
  'Output strict VALID JSON only, without Markdown or commentary. The teacher must review every item before publication.'
 ].join('\n');
 async function copy(){
  try{await navigator.clipboard.writeText(prompt);setFeedback('Prompt copied. Paste it into your preferred AI tool.');}
  catch{setFeedback('Select and copy the prompt from the box below.');}
 }
 return <section className="academic-prompt">
  <h2>AI JSON Prompt Builder</h2>
  <p>Choose the content type and topic. Copy this prompt into ChatGPT or another AI, review its output, and upload the resulting JSON file.</p>
  <div className="research-form-row">
   <label>Content format<select value={kind} onChange={e=>setKind(e.target.value as typeof kind)}>
    {types.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}</select></label>
   <label>Academic course<select value={courseId} onChange={e=>setCourseId(e.target.value)}>
    {courseChoices.map(c=><option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}</select></label>
  </div>
  <label>Lesson or exam topic<input value={topic} onChange={e=>setTopic(e.target.value)} maxLength={180}/></label>
  <label>Copy-ready prompt<textarea readOnly rows={12} value={prompt}/></label>
  <div className="actions"><button type="button" className="button primary" onClick={copy}>Copy AI prompt</button>
   <a className="button secondary" href={'/examples/'+selected.file} download>Download matching JSON example</a></div>
  {feedback&&<p role="status">{feedback}</p>}
  <small>Generated questions and Qur’an plans require teacher review before publishing. JSON files are data, not executable game code.</small>
 </section>;
}
