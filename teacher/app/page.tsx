import Link from 'next/link';
export default function Welcome(){
 return <main className="welcome">
  <div className="welcome-panel">
   <span className="eyebrow">LUMENVALE EDUCATOR PORTAL</span>
   <div className="emblem">✦</div>
   <h1>A classroom built around curiosity.</h1>
   <p>Organize your books by genre, plan lessons, manage classes, and keep every student's progress in one focused dashboard. Teachers get a workspace—not a game.</p>
   <div className="actions"><Link className="button primary" href="/login">Teacher sign in</Link>
    <Link className="button secondary" href="/dashboard">Go to dashboard</Link></div>
   <p className="fine">An authenticated account must be approved as a teacher before accessing classroom data.</p>
  </div>
  <div className="welcome-art"><div className="stack stack-one">BOOKS <b>01</b></div><div className="stack stack-two">COURSES <b>02</b></div><div className="stack stack-three">CLASSROOMS <b>03</b></div></div>
 </main>;
}
