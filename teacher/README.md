# LumenVale Teacher Studio (Next.js + Neon)

This is a dedicated teacher web app, separate from the Three.js game. Login uses managed Neon Auth / Better Auth with an HTTP-only session. Every server action checks that the current authenticated user is approved in the `teacher_memberships` table. Each classroom, course, assignment and grade read or write is scoped to the teacher's authenticated user ID.

## Initial deployment

1. Configure Vercel root directory `teacher` and framework Next.js.
2. Add `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` (32+ random characters), and `DATABASE_URL` as Vercel environment variables. Do not commit secrets.
3. Add the deployed origin as a trusted domain in Neon Auth.
4. Create the Neon tables (see `teacher/schema.sql`).
5. Sign up at the teacher portal. New accounts show "pending approval" and **cannot access teacher records**.
6. In Neon SQL, after verifying the account owner, approve **by auth user ID**:
   `INSERT INTO teacher_memberships(auth_user_id,role) VALUES ('VERIFIED_USER_ID','teacher') ON CONFLICT(auth_user_id) DO UPDATE SET role='teacher';`
   Do not grant roles solely based on an unverified email address.

Imported teacher course packs are stored server-side. Teacher signups are not automatically approved. The game is still a local-save experience, not a student portal backed by the teacher DB. No automatic student data sync or real school accreditation should be inferred.

Run `npm install && npm run dev` inside the `teacher` directory.
