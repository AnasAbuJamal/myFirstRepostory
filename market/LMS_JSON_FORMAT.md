# LumenVale Teacher-Created School — JSON Course Format

## Empty school at startup

Students see **no preinstalled courses, exams, lessons, careers or laboratory subjects**. All official-looking curriculum must originate from a teacher JSON upload or a published share code. `lms-demo.json` is an optional downloadable test example and is never automatically installed. Existing unchanged demo seeds are migrated out of old browser learning saves.

The Reading Library building is no longer separate. Its 3D study area, bookshelves and interactive book station are inside LumenVale School.

## Teacher workflow

1. Visit the authenticated Teacher Studio at `/dashboard/courses` and open **AI Course + Chapter Prompt Builder**.
2. Enter any original class name, code, subject and chapter count (1–24). Copy the generated prompt to your preferred AI assistant.
3. Review all generated readings, flashcards and answers; upload the strict JSON file. The server validates required structure and unique chapter IDs.
4. The Teacher Studio publishes reviewed curriculum and provides a share code. Students can import it through School > Import Chapters, or import a course JSON file offline.
5. To revise the course, update the course JSON and republish. Student reimport replaces that matching course ID in their browser without automatically deleting recorded local grades.

## JSON schema

Single course: `{"kind":"lumenvale.lms-course","version":1,"id":"MY-COURSE","title":"...","subject":"...","teacher":"...","description":"...","published":true,"modules":[...],"assignments":[],"announcements":[]}`

- Every chapter is an item in `modules`, with a unique lowercase ID, title, objectives[], lesson:{title,content}, flashcards:[{front,back}], practice questions, and exam.
- Questions use `{prompt,choices,correctIndex,explanation}` with 2–5 choices and a numeric zero-based correctIndex.
- Exams support timeLimitMinutes (1–90) and attemptLimit (1–5).
- Assignments support id, title, moduleId, prompt, points and optional YYYY-MM-DD dueDate.
- Up to 24 chapters, 80 assignments, 40 exam questions per chapter, and a 1 MB upload limit.

**Important security limitation:** The student LMS is local/offline. Scores, assignments and student identities are not synchronized into the authenticated Teacher Studio database. Do not treat browser-local scores as verified records or upload private student information into public course JSON. The teacher portal requires the `teacher_course_packs` table in the database.

## Tests

Rebuild the game with `python3 market/build.py --output dist/index.html` and run the GitHub Actions academic workflow. It validates source logic, browser interactions, school room reachability and uploads exterior/interior/library screenshots for review. The Teacher Studio typecheck runs separately.
