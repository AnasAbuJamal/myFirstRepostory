# LumenVale Academic Pathways — JSON package format

This is the v1 contract for the **formal school**. The free-reading Library uses its existing independent book format and remains separate.

## School design

The academic catalog `market/academic-catalog.json` defines:
- middle-school foundations: English, mathematics, general science, biology, teacher-assessed Qur'an memorization
- high-school requirements: English, mathematics, biology, chemistry, physics, teacher-assessed Qur'an memorization
- university-inspired goals: Biology, Biochemistry, Biomedical Engineering

Course IDs, simulated credits, prerequisites and stages are data, not scattered hard-coded UI. Catalog course titles and pathways are **fictional game structures inspired by** published University of Maine programs, not actual enrollment or accredited credits. Links to the relevant university sources are stored in the catalog.

The game embeds the catalog at build time from its JSON file and keeps the existing single-file offline design.

## Four independent JSON package types

1. **Academic course** `lumenvale.academic-pack`: `courseId`, `lessons` with reading, objectives, flashcards and optional practice questions, `exam.questions`, `gradePolicy.passPercent`. Download `teacher/public/examples/academic-pack.json`.
2. **Graded examination** `lumenvale.exam-pack`: `courseId`, `exam.questions`, `gradePolicy.passPercent`. Download `teacher/public/examples/exam-pack.json`.
3. **Flashcard deck** `lumenvale.flashcard-pack`: `courseId`, `lessonId`, `flashcards: [{front,back}]`. Download `teacher/public/examples/flashcard-pack.json`.
4. **Qur'an teacher plan** `lumenvale.quran-plan`: `courseId` (QUR-M1 or QUR-H1), `teacher`, `targets` with `surah`, `verses`, and `notes`. Download `teacher/public/examples/quran-plan.json`.

Each uses `version: 1` and the exact `kind` above. Multiple packs can be grouped as `{"kind":"lumenvale.academic-bundle","version":1,"packs":[...]}`. A full academic pack must exist before separate exam or flashcard packs can be applied. The `lessonId` must refer to a lesson in that course. Teachers must review AI-generated content and answer keys before publishing. Do not include student personal information in content JSON.

## Teacher workflow

1. An **approved** teacher signs in to the separate `/dashboard/academics` page. Managed authentication and server-side roles are mandatory.
2. Pick a course ID from the published catalog. Use the AI Prompt Builder and download a matching JSON example.
3. Create and review the JSON content. Upload it. The server validates version, course code, reading length, flashcard structure, correct answer indices, and exam size.
4. Publish the file and copy the code. Students import it inside **City Phone → Pathways → Teacher JSON Import** (or from the school).
5. The student enrolls in their course, completes the lesson reading and flashcards, and takes the practice exam.

All exam marks saved in the local game are explicitly **unverified practice grades**, not official academic grades. The transcript displays game credits, weighted GPA, and course history. Existing Library reading/word saving remains separate.

## Qur'an teacher verification

- An approved teacher must hear a student's recitation directly (in person or during a supervised live session).
- From Teacher Studio, select a student enrolled in the teacher's classroom; enter surah, verses, memorization accuracy, tajweed, fluency, and whether the assigned targets for the **whole course** are complete.
- Approved students receive an unpredictable, one-time reward token and must enter both that token and their **private classroom code** in the game.
- The server checks the student code matches the original teacher assessment, atomically redeems the token exactly once, and returns only course ID, points, and completion status.
- The game awards the coins and unlocks the next academic stage only if the teacher marked the course complete.
- Failed/unapproved recitations never issue reward codes. **No AI pronunciation grading, microphone capture, audio uploads, or child recordings** are added in v1.

Current limitations: there is no authenticated student login or cross-device transcript sync yet. Class codes and redemption tokens are transitional game mechanics, not identity-proofing. Teachers' actual classroom records remain server-side and permissioned. Do not regard game credits or transcript exports as accredited records.

## Example usage

- Local starter bundle: `market/example-academic-pack.json`
- Downloadable teacher academic catalog: `teacher/public/examples/academic-catalog.json`
- JSON templates: `teacher/public/examples/{academic-pack,exam-pack,flashcard-pack,quran-plan}.json`

The Teacher Studio also supports the pre-existing Library and Research JSON workflows.

## Verification and release

- Run `node --test market/test-academics.cjs` for catalog and pack logic.
- Rebuild `dist/index.html` from source using `python3 market/build.py --output dist/index.html`.
- Deploy **preview first**, test the complete student UI in an actual browser, and promote only after a successful smoke test. Preserve the previous production game if verification is not available.
