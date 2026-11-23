import {signedInUser,teacherAccess} from '@/lib/roles';
import Link from 'next/link';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Pending(){
 const {user,role}=await teacherAccess();
 if(role)redirect('/dashboard');
 return <main className="auth-page"><div className="auth-card"><span className="eyebrow">APPROVAL REQUIRED</span>
  <h1>Teacher access is pending.</h1><p>Your account has signed in successfully, but it does not have a teacher role. An administrator must approve the account before you can access classroom records.</p>
  <div className="info">Signed in as <strong>{user.email}</strong><small>Account ID: {user.id}</small></div>
  <Link className="button secondary" href="/">Back to welcome</Link></div></main>;
}
