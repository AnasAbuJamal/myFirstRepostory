# LumenVale Learning Hub — School LMS

The City Phone **School LMS** application and the physical school desks open a Canvas-inspired local teaching/learning workflow.

## Student functions

- Select a local student demo profile and enroll in published courses.
- Read teacher lessons and mark modules complete.
- Review flashcards and answer ungraded practice questions.
- Take timed module exams with attempt limits and automatic scores.
- Read announcements, submit written assignments, and view teacher feedback and grades.
- Use City Phone → Pathways for the separate academic progression and teacher-published content.

## Teacher functions

- Open City Phone → Teacher to use the LOCAL preview. This is **not** an authenticated educator identity.
- Create courses with subject, teacher name, description, and publish toggle.
- Add modules containing lessons, objectives, flashcards, practice questions, and timed exams.
- Create written assignments and announcements; review student answers and record feedback.
- Import/export versioned JSON to transfer content between browsers.
- Export compatible Academic Pathways JSON from eligible courses, then publish it through the approved, separate Teacher Studio.
- Approved teacher portal: https://lumenvale-teachers.vercel.app/dashboard/academics

## Important privacy and security limits

Local teacher preview has NO access controls. Anyone at the same browser can use it. All students, grades, submissions, and scores here are LOCAL DEMO data, stored in localStorage, not a real shared school gradebook. Do not enter actual student records, confidential personal information, or high-stakes test results. Local exams are not secure/proctored. Content JSON can be exported and imported, but student submissions and teacher feedback do not sync across devices. A real school backend requires authenticated student identities, server-checked permissions, data retention policies, and consent appropriate to minors.

Academic Pathways is separate: approved educators can publish academic packs through the authenticated Teacher Studio with publication codes. Students can fetch such published content in-game via Pathways → Teacher JSON Import. Qur'an recitation still requires teacher assessment and one-time server verification. None of the game scores represent accredited education.

## LMS JSON contract

- Single course: kind = lumenvale.lms-course, version = 1.
- Bundle: kind = lumenvale.lms-bundle, version = 1, courses = array of course objects.
- Course: id, title, subject, teacher, description, published, modules, assignments, announcements.
- Module: id, title, objectives[], lesson:{title,content}, flashcards:[{front,back}], practice:[{prompt,choices,correctIndex,explanation}], exam:{title,questions,timeLimitMinutes,attemptLimit}.
- Assignment: {id,title,moduleId,prompt,points,dueDate}.
- Announcement: {id,title,body,date}.
- Question correctIndex is zero-based, and choices must contain 2–5 answers.
- Teacher form flashcard shorthand: one per line, Term | Definition.
- Teacher form question shorthand: one per line, Question | Choice A | Choice B | ... | zero-based-correct-index.
- Full downloadable starter examples are available in market/lms-demo.json.
- Import file limit: 1 MB. Course and question content is validated before replacing local content.

## Build and test

Run python3 market/build.py --output dist/index.html, then node --test market/test-academics.cjs market/test-districts.cjs market/test-school.cjs market/test-lms.cjs. The CI workflow also runs a real Chromium browser test of school walking, lesson completion, timed exams, assignment submission, teacher grading, and the local gradebook.
