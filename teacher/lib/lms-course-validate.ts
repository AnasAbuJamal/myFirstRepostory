import {z} from 'zod';
const Question=z.object({
 prompt:z.string().trim().min(9).max(700),
 choices:z.array(z.string().trim().min(1).max(260)).min(2).max(5),
 correctIndex:z.number().int().min(0),
 explanation:z.string().trim().max(650).optional()
}).refine(q=>q.correctIndex<q.choices.length,{message:'correctIndex must be a zero-based choice index'});
const Chapter=z.object({
 id:z.string().regex(/^[a-z0-9-]{2,46}$/),
 title:z.string().trim().min(3).max(120),
 objectives:z.array(z.string().trim().max(240)).max(10).default([]),
 lesson:z.object({title:z.string().trim().min(3).max(120),content:z.string().trim().min(30).max(12000)}),
 flashcards:z.array(z.object({front:z.string().trim().min(1).max(180),back:z.string().trim().min(1).max(650)})).max(60).default([]),
 practice:z.array(Question).max(25).default([]),
 exam:z.object({title:z.string().trim().min(3).max(120),
  questions:z.array(Question).max(40),
  timeLimitMinutes:z.number().int().min(1).max(90).default(15),
  attemptLimit:z.number().int().min(1).max(5).default(3)})
});
export const TeacherCourse=z.object({
 kind:z.literal('lumenvale.lms-course'),version:z.literal(1),
 id:z.string().regex(/^[A-Z][A-Z0-9-]{2,30}$/),
 title:z.string().trim().min(3).max(120),
 subject:z.string().trim().min(1).max(70),
 teacher:z.string().trim().min(1).max(100),
 description:z.string().trim().max(700).default(''),
 published:z.literal(true),
 modules:z.array(Chapter).max(24),
 assignments:z.array(z.object({
  id:z.string().regex(/^[a-z0-9-]{2,46}$/),title:z.string().trim().min(1).max(120),
  moduleId:z.string().max(46).optional(),
  prompt:z.string().trim().min(1).max(3000),
  points:z.number().int().min(1).max(1000),
  dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
 })).max(80).default([]),
 announcements:z.array(z.object({id:z.string().min(1).max(65),
  title:z.string().trim().min(1).max(140),body:z.string().trim().min(1).max(3000),
  date:z.string().max(10).optional()})).max(80).default([])
}).superRefine((course,ctx)=>{
 const ids=course.modules.map(m=>m.id);
 if(ids.length!==new Set(ids).size)ctx.addIssue({code:'custom',message:'Chapter IDs must be unique'});
 const assignments=course.assignments.map(a=>a.id);
 if(assignments.length!==new Set(assignments).size)ctx.addIssue({code:'custom',message:'Assignment IDs must be unique'});
 if(course.assignments.some(a=>a.moduleId&&!ids.includes(a.moduleId)))
  ctx.addIssue({code:'custom',message:'An assignment refers to a missing chapter'});
});
