import 'server-only';
import { auth } from './auth/server';
import { neon } from '@neondatabase/serverless';
import { redirect } from 'next/navigation';

export function database(){
 if(!process.env.DATABASE_URL)throw Error('Database not configured');
 return neon(process.env.DATABASE_URL);
}
export async function signedInUser(){
 const {data:session,error}=await auth.getSession();
 if(error||!session?.user)redirect('/login');
 return session.user;
}
export async function teacherAccess(){
 const user=await signedInUser();
 if(!process.env.DATABASE_URL)return {user,role:null as null|'teacher'|'admin',sql:null,setupRequired:true};
 const sql=database();
 const rows=await sql`SELECT role FROM teacher_memberships WHERE auth_user_id=${user.id} LIMIT 1`;
 if(!rows.length)return {user,role:null as null|'teacher'|'admin',sql};
 const role=rows[0].role==='admin'?'admin':'teacher';
 return {user,role:role as 'teacher'|'admin',sql};
}
export async function requireTeacher(){
 const result=await teacherAccess();
 if(!result.role||!result.sql)redirect('/pending');
 return {user:result.user,role:result.role,sql:result.sql};
}
