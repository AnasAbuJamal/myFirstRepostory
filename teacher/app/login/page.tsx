'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {authClient} from '@/lib/auth/client';

export default function Login(){
 const router=useRouter(),[signup,setSignup]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{
   const response=signup?await authClient.signUp.email({email,password,name}):await authClient.signIn.email({email,password});
   if(response.error){setError(response.error.message||'Unable to sign in.');return;}
   router.push('/dashboard');router.refresh();
  }catch{setError('Authentication is currently unavailable. Check the portal configuration.');}
  finally{setBusy(false);}
 }
 return <main className="auth-page"><Link href="/" className="backlink">← LumenVale Teacher Studio</Link>
  <section className="auth-card"><span className="eyebrow">EDUCATOR ACCESS</span><h1>{signup?'Create an account':'Welcome back'}</h1>
   <p>{signup?'Create an account to request teacher access. Registration alone never grants teacher permissions.':'Sign in to manage curriculum and students.'}</p>
   <form onSubmit={submit}>
    {signup&&<label>Full name<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={100} required autoComplete="name"/></label>}
    <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
    <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required autoComplete={signup?'new-password':'current-password'}/></label>
    {error&&<div className="error" role="alert">{error}</div>}
    <button className="button primary" disabled={busy}>{busy?'Please wait…':signup?'Create account':'Sign in'}</button>
   </form>
   <button className="text-button" onClick={()=>{setSignup(!signup);setError('')}}>{signup?'Already have an account? Sign in':'New teacher? Create an account'}</button>
  </section>
 </main>;
}
