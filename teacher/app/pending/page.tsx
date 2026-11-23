import {signedInUser,teacherAccess} from '@/lib/roles';
import Link from 'next/link';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Pending(){
 const {user,role,setupRequired}=await teacherAccess();
 if(role)redirect('/dashboard');
 return <main className="auth-page"><div className="auth-card"><span className="eyebrow">APPROVAL REQUIRED</span>
  <h1>{setupRequired?'Database connection pending':'Teacher access is pending.'}</h1><p>{setupRequired?'The school database credential has not been connected to this portal in Vercel yet. An administrator must configure DATABASE_URL before teacher roles and records can be checked.':'Your account has signed in successfully, but it does not have a teacher role. An administrator must approve the account before you can access classroom records.'}</p>
  <div className="info">Signed in as <strong>{user.email}</strong><small>Account ID: {user.id}</small></div>
  <Link className="button secondary" href="/">Back to welcome</Link></div></main>;
}
