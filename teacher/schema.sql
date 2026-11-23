-- LumenVale Teacher Portal data schema
-- Teacher privilege is granted only after an administrator verifies the auth user ID.
CREATE TABLE IF NOT EXISTS teacher_memberships (
 auth_user_id text PRIMARY KEY, role text NOT NULL CHECK(role IN ('teacher','admin')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS classrooms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), teacher_user_id text NOT NULL REFERENCES teacher_memberships(auth_user_id),
 title text NOT NULL CHECK(length(title) BETWEEN 2 AND 120),grade_level text NOT NULL DEFAULT 'General',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS courses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),teacher_user_id text NOT NULL REFERENCES teacher_memberships(auth_user_id),
 title text NOT NULL,subject text NOT NULL,description text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lessons (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
 teacher_user_id text NOT NULL REFERENCES teacher_memberships(auth_user_id),title text NOT NULL,
 genre text NOT NULL DEFAULT 'General',word_count integer NOT NULL DEFAULT 0,
 pages jsonb NOT NULL DEFAULT '[]',questions jsonb NOT NULL DEFAULT '[]',created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS class_enrollments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
 student_code text NOT NULL,display_name text NOT NULL,UNIQUE(classroom_id,student_code)
);
CREATE TABLE IF NOT EXISTS assignments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
 lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,teacher_user_id text NOT NULL REFERENCES teacher_memberships(auth_user_id),
 due_date date,points integer NOT NULL DEFAULT 100,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS grade_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
 enrollment_id uuid NOT NULL REFERENCES class_enrollments(id) ON DELETE CASCADE,points_earned numeric(8,2) NOT NULL,
 graded_at timestamptz NOT NULL DEFAULT now(),UNIQUE(assignment_id,enrollment_id)
);


-- Public research packs contain lesson content only, never teacher account records or student grades.
CREATE TABLE IF NOT EXISTS research_projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 teacher_user_id text NOT NULL REFERENCES teacher_memberships(auth_user_id),
 title text NOT NULL CHECK(length(title) BETWEEN 4 AND 130),
 field text NOT NULL DEFAULT 'General Science',
 summary text NOT NULL CHECK(length(summary) BETWEEN 20 AND 1200),
 reading_text text NOT NULL CHECK(length(reading_text) BETWEEN 100 AND 12000),
 questions jsonb NOT NULL DEFAULT '[]'::jsonb,
 reward integer NOT NULL DEFAULT 100 CHECK(reward BETWEEN 20 AND 300),
 publish_code text NOT NULL UNIQUE,
 published boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS research_projects_teacher_idx ON research_projects(teacher_user_id);

-- Academic Pathways packages: JSON content is public only when approved teachers publish it.
CREATE TABLE IF NOT EXISTS academic_packs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 teacher_user_id text NOT NULL REFERENCES teacher_memberships(auth_user_id),
 course_id text NOT NULL CHECK(course_id ~ '^[A-Z]+-[MHU][0-9]+$'),
 kind text NOT NULL CHECK(kind IN ('lumenvale.academic-pack','lumenvale.quran-plan','lumenvale.exam-pack','lumenvale.flashcard-pack')),
 title text NOT NULL CHECK(length(title) BETWEEN 3 AND 160),
 payload jsonb NOT NULL,
 share_code text NOT NULL UNIQUE,
 published boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS academic_packs_teacher_idx ON academic_packs(teacher_user_id,created_at DESC);

-- Only teachers who own an enrolled student's classroom may review their recitations.
CREATE TABLE IF NOT EXISTS quran_recitation_reviews(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 teacher_user_id text NOT NULL REFERENCES teacher_memberships(auth_user_id),
 enrollment_id uuid NOT NULL REFERENCES class_enrollments(id) ON DELETE CASCADE,
 course_id text NOT NULL CHECK(course_id IN ('QUR-M1','QUR-H1')),
 surah text NOT NULL CHECK(length(surah) BETWEEN 1 AND 100),
 verses text NOT NULL CHECK(length(verses) BETWEEN 1 AND 60),
 accuracy integer NOT NULL CHECK(accuracy BETWEEN 0 AND 100),
 tajweed integer NOT NULL CHECK(tajweed BETWEEN 0 AND 100),
 fluency integer NOT NULL CHECK(fluency BETWEEN 0 AND 100),
 approved boolean NOT NULL DEFAULT false,
 reward_coins integer NOT NULL DEFAULT 0 CHECK(reward_coins BETWEEN 0 AND 100),
 redeem_code text UNIQUE,
 redeemed_at timestamptz,
 course_complete boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quran_recitation_teacher_idx ON quran_recitation_reviews(teacher_user_id,created_at DESC);

-- Teacher-defined school courses. Public codes expose reviewed curriculum only.
CREATE TABLE IF NOT EXISTS teacher_course_packs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 teacher_user_id text NOT NULL REFERENCES teacher_memberships(auth_user_id),
 course_code text NOT NULL CHECK(course_code ~ '^[A-Z][A-Z0-9-]{2,30}$'),
 title text NOT NULL CHECK(length(title) BETWEEN 3 AND 120),
 payload jsonb NOT NULL,
 share_code text NOT NULL UNIQUE,
 published boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS teacher_course_packs_teacher_idx
 ON teacher_course_packs(teacher_user_id,created_at DESC);
