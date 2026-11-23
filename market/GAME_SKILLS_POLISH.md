# LumenVale — skill-guided game cohesion pass

Applied to the existing Three.js-style engine and standalone HTML build, **not** an engine migration.

## Source and approach

Skills sourced from https://github.com/gamedev-skills/awesome-gamedev-agent-skills

- `router`: keep the project's existing custom, tree-shaken Three.js runtime; do not copy unbundled r187 examples.
- `threejs-scene-setup`: retain a single scene, WebGL fallback and capped device pixel ratio.
- `game-ui-ux`: one navigation hierarchy, focus-visible styles, mobile safe areas and clear student vs teacher tools.
- `level-design`: one authoritative workstation map with distinct render positions and reachable approach positions; collision and reachability tests.
- `save-systems`: explicit allowlist for portable versioned local JSON backups, validation before writes and rollback on storage failures.
- `performance-optimization`: provide per-mode read-only renderer statistics; allow a reduced-detail graphics profile without changing educational progress.

## What changed

1. **City Phone:** grouped into Learn, City, Work and Tools. The Learn screen shows enrolled course counts, lesson progress, outstanding assignments, a Continue shortcut and direct teacher-content importing.
2. **School:** visual desks and their usable interaction targets now come from shared `SCHOOL_STATIONS` data. Workstation approaches remain outside furniture collisions.
3. **Progress safety:** Tools > Save Backup downloads or restores a JSON snapshot of the existing twelve browser save areas, not private cloud grades. The backup importer validates type, size and key allowlist and rolls back if a write fails. Keep the backup file private.
4. **Graphics quality:** Detailed (unchanged default) and Balanced (reduced pixel ratio, no dynamic shadows, no optional full school and road texture overlays). The setting persists with mouse preferences and applies after a reload.
5. **QA:** school co-ordinates, save corruption/rollback, phone navigation, balanced graphics and a browser end-to-end workflow get regression coverage.

## User experience principles

- Leave the actual 3D world visible during gameplay; show work in a phone or school desk, not persistent heavy overlays.
- Prioritize clear routes and physically reachable interactions over denser decorative props.
- Keep school grades and teacher feedback labeled as browser-local practice until authenticated student synchronization exists.
- All source changes must rebuild into `dist/index.html`. A passing source-only test does not prove the uploaded standalone game is current.
- Test both real WebGL and fallback rendering, mobile sizing, keyboard interaction and teacher/content navigation.

## Known limitations and next work

This is a game-wide coherence and reliability pass, **not** a completed AAA art remake. The authenticated Teacher Studio still has a separate database from local student submissions and grades. Follow-on work must add student authentication, scoped assignment and submission APIs, server-gradebook reconciliation and common identity across the LMS, Academic Pathways and jobs. Do not claim verified grade sync in the meantime.

Art-direction work should proceed through reference boards and shared material/asset families, with profiling and screenshots before production publication.
