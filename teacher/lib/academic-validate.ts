import catalog from '@/public/examples/academic-catalog.json';
import {z} from 'zod';

const CourseIds=new Set(catalog.courses.map(c=>c.id));
const Question=z.object({
 prompt:z.string().trim().min(9).max(700),
 choices:z.array(z.string().trim().min(1).max(250)).min(2).max(5),
 correctIndex:z.number().int().min(0).max(4)
}).superRefine((q,ctx)=>{
 if(q.correctIndex>=q.choices.length)ctx.addIssue({code:'custom',message:'Answer index out of range'});
});
const Card=z.object({front:z.string().trim().min(1).max(180),back:z.string().trim().min(1).max(600)});
const Lesson=z.object({
 id:z.string().regex(/^[a-zA-Z0-9_-]{3,45}$/),
 title:z.string().trim().min(3).max(130),
 reading:z.string().trim().min(175).max(11000),
 objectives:z.array(z.string().trim().max(180)).max(7).default([]),
 flashcards:z.array(Card).max(50).default([]),
 practice:z.array(Question).max(20).default([])
}).superRefine((l,ctx)=>{
 if(l.reading.trim().split(/\s+/).length<35)ctx.addIssue({code:'custom',message:'Reading needs at least 35 words'});
});
const Academic=z.object({
 kind:z.literal('lumenvale.academic-pack'),version:z.literal(1),
 courseId:z.string().max(35),title:z.string().trim().min(3).max(160),
 author:z.string().trim().min(1).max(100),
 source:z.string().trim().max(300).optional(),
 lessons:z.array(Lesson).min(1).max(16),
 exam:z.object({title:z.string().trim().min(3).max(150),questions:z.array(Question).min(3).max(40)}),
 gradePolicy:z.object({passPercent:z.number().int().min(60).max(100)})
}).superRefine((p,ctx)=>{
 const c=catalog.courses.find(x=>x.id===p.courseId);
 if(!c||c.kind==='teacher-recitation')ctx.addIssue({code:'custom',message:'Course ID is not an academic subject'});
 if(new Set(p.lessons.map(l=>l.id)).size!==p.lessons.length)ctx.addIssue({code:'custom',message:'Lesson IDs must be unique'});
});
const Quran=z.object({
 kind:z.literal('lumenvale.quran-plan'),version:z.literal(1),
 courseId:z.enum(['QUR-M1','QUR-H1']),
 title:z.string().trim().min(3).max(130),
 teacher:z.string().trim().min(1).max(100),
 targets:z.array(z.object({
  surah:z.string().trim().min(1).max(100),
  verses:z.string().trim().min(1).max(60),
  notes:z.string().trim().max(300).default('')
 })).min(1).max(30),
 recitationMode:z.literal('teacher-live').optional(),
 teacherApprovalRequired:z.literal(true).optional()
});
const ExamPack=z.object({
 kind:z.literal('lumenvale.exam-pack'),version:z.literal(1),courseId:z.string().max(35),
 title:z.string().trim().min(3).max(130),
 exam:z.object({title:z.string().trim().min(3).max(150),questions:z.array(Question).min(3).max(40)}),
 gradePolicy:z.object({passPercent:z.number().int().min(60).max(100)})
});
const FlashcardPack=z.object({
 kind:z.literal('lumenvale.flashcard-pack'),version:z.literal(1),courseId:z.string().max(35),
 lessonId:z.string().regex(/^[a-zA-Z0-9_-]{3,45}$/),
 title:z.string().trim().min(3).max(130),
 flashcards:z.array(Card).min(1).max(60)
});
export const AcademicPack=z.union([Academic,Quran,ExamPack,FlashcardPack]);
export type ApprovedPack=z.infer<typeof AcademicPack>;
export function validateAcademicPacks(payload:unknown):ApprovedPack[]{
 const source=payload as {packs?:unknown[]}|null;
 const records=Array.isArray(payload)?payload:Array.isArray(source?.packs)?source.packs:[payload];
 if(records.length<1||records.length>20)throw Error('Upload between 1 and 20 academic packs');
 const data=records.map(raw=>AcademicPack.parse(raw));
 for(const entry of data){
  const c=catalog.courses.find(x=>x.id===entry.courseId);
  if(!c)throw Error('Unknown LumenVale course ID');
  if(entry.kind!=='lumenvale.quran-plan'&&c.kind==='teacher-recitation')
   throw Error('Qur’an course must use teacher-led memorization plan.');
 }
 return data;
}
