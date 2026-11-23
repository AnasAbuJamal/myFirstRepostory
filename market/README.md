# LumenVale · Market Office

A first-person story game about opening a tiny garden-kit business. The playable chapter takes place in the ground floor of the Market Office downtown. Read realistic customer emails, compose your own replies, receive visitors, restock the shelf, and build a pickup stand outside.

## Play

The standalone HTML needs no install or internet connection. Download it and open it in a current browser. WebGL displays the 3D office and lot. A Canvas software renderer can display the same 3D geometry when WebGL is unavailable.

Walk with **WASD** and look by moving the mouse or using the arrow keys. Approach the desk and press **E** to sit down. Use **Stand up** or Escape to return to the office. Press **E** near the front door to open it, close it, or meet a waiting visitor. Touch screens have movement buttons and drag-to-look.

The computer contains the Inbox, Orders, Inventory, Wordbook, Reports, and Cameras. Reports include a wallet balance graph and kit counts. The three cameras display the entrance, pickup lot, and road in the same 3D scene as the player. The software renderer also draws the live camera feeds.

## Build

Run `python3 build.py` from this folder and open `dist/index.html`. The build includes its JavaScript, styles, and the bundled Three.js library. To choose a different destination, run `python3 build.py --output path/to/index.html`.

Run `node --test test-market.cjs` to check story progression, written reply checks, order timing, accounting, and both endings.

## First chapter

- Lina orders three kits for Friday. She asks about plant labels and her total.
- The following Monday, Omar emails for six kits. The shelf holds five after Lina’s pickup.
- One pack of four kits costs 16 coins and arrives on Wednesday morning. Omar can collect all six that noon.
- Omar pays after asking what his club members need to bring from home. The chapter ends with 67 coins and three kits before the optional 25-coin stand.
- Nadia’s gift bundle email introduces the next chapter.

## Source structure

| File | Purpose |
|---|---|
| `story.js` | Story messages, visitors, products, and English–Arabic words |
| `rules.js` | Progress, reply feedback, inventory, and wallet |
| `app.js` | Computer, order screens, writing interface, and visits |
| `walk.js` | Movement, collision boundaries, interaction points, and camera locations |
| `software.js` | Canvas projection and drawing of the same 3D world when WebGL is unavailable |
| `view.js` | 3D office and grounds, security cameras, construction, and Canvas fallback |
| `reports.js` | Wallet graph, inventory breakdown, and security camera controls |
| `template.html`, `style.css`, and `walking.css` | Page layout, controls, and visual design |
| `vendor/three.js` | Three.js r180, bundled from the existing Jungle Miner project |

The game uses scripted story feedback and stores progress in this browser. It needs no model API. Speech playback uses available local English voices. Dictation needs an on-device English language pack and a browser that supports it. On a hosted build, add `?practice=1` to the address to replay without writing to your saved game.

Three.js is distributed under its MIT license in `vendor/THREE-LICENSE.txt`.


## City Builder expansion (playable)

This branch now adds a connected 3D town around the original office. Walk east to the **Reading Library**, approach its open shelves, and press **E**. Six short *sample* books demonstrate the page-turning, reading timer, comprehension question, and coin reward flow; their lesson text is deliberately minimal and can be replaced later.

At an empty construction plot, press **E** to pay the construction cost. New plot types unlock as you complete unique books. Return to a completed factory and press **E** to hire employees, upgrade machinery, or manually help the production line. Workers appear as animated 3D characters, generate coins every five seconds, and can produce for up to one hour while the browser is closed. The city also has a worker housing block, plaza, roads, gardens, benches, and signs.

The **City wallet** on the City Phone is a separate expansion economy from the original shop's chapter wallet, so the scripted opening story remains playable without rebalancing. Progress is stored in localStorage under jungle-miner-city-v1. On a private browser or blocked storage, the play session still works but may not persist.

**Controls:** WASD to walk; click Play to capture the mouse, then move it to look; E to interact; **F** or the fullscreen button to request fullscreen + pointer lock. The cursor is hidden during fullscreen exploration. Press **Esc** to release pointer lock, and approach objects or use the City Guide for help. Touch and arrow controls from the office remain available.

**Implementation:** Built with the existing bundled Three.js r180 renderer, with a lightweight procedural world and character rigs rather than large model downloads. Modules: city.js (reading, persistence, economy), city-world.js (3D geometry and animation), and city.css (HUD and library panels). No new runtime packages or network access are required. This is a gameplay expansion, not a completed collection of textbook lessons.

The default build command still produces a fully offline page with the expansion included. Run node --test test-market.cjs test-city.cjs to check both existing office progression and city logic.

## First-person controls and land ownership update

**Mouse and first-person camera:** Click **Play** once to capture the mouse. Moving the mouse then rotates the 3D camera continuously without holding any button or seeing a mouse cursor. Press **Escape** to release the cursor, then click Play or the 3D canvas to recapture it. Browsers require an initial user interaction for mouse capture, and opening book/management dialogs must release the pointer so you can click their controls. Press **G** for the City Guide and adjustable mouse sensitivity, **M** for properties, **F** to toggle fullscreen, **Shift** to sprint outdoors, and **E** to interact.

**Real estate progression:** Earn coins from books, **purchase land**, **construct buildings on owned land**, and **improve land quality** (four levels) to increase automated factory output. Factory machinery can be upgraded separately (ten levels), and up to six employees work at each factory. Six plots have different land prices and reading unlock requirements, and each purchase is visualized in the 3D scene with property boundaries and progressive landscaping. The Properties panel shows a portfolio with land ownership, buildings, staff, and production.

**Compatibility:** Existing city saves are migrated in place: previously built factories automatically gain land ownership. The original Market Office campaign and its separate shop wallet remain unchanged. Coin totals, purchases, and upgrades stay in localStorage for offline gameplay. The City Builder does not use cloud accounts or real-money payments.

## LumenVale: City of Knowledge — Learning Studio update

The game has been rebranded to **LumenVale: City of Knowledge**. The playable browser game now includes these additional systems:

- **Teacher Studio (local prototype):** The earlier development build included a local content dashboard. Import a JSON file (up to 2 MB), review imported books, publish/unpublish or remove them, author a basic book, and export a portable lesson pack. Each lesson can specify `title`, `genre` (also accepts `genera`), `pages` or `text`, `readingLevel`, `wordCount`, `reward`, and `questions` with `prompt`, `choices`, and zero-based `correctIndex`. A `questionCount` requests 1–10 locally generated **draft fill-in-the-blank questions** when explicit questions are absent. Teachers should review draft questions for quality and accuracy; this is not AI-generated deep comprehension assessment.
- **Genre library:** Library books are grouped by genre, show calculated word counts and question counts, and award coins after all questions are correctly answered. Books may have several questions, and attempts are recorded for local student nicknames. The teacher dashboard summarizes books, genres, words, question totals and locally recorded student progress. An example file is at `market/example-course-pack.json`.
- **Mailbox and city dashboard:** Visit the roadside mailbox near the office or press **N**. Read messages from citizens and business clients. Press **B** to open City Hall's overview, contracts, warehouse, employees, research, civic upgrades, newspaper, exploration clues, and achievements.
- **Meaningful expenses and investments:** Workers generate factory income but cost wages and maintenance every production cycle. Building/land costs, research, employee training, warehouse resupply, public gardens, streetlights, power, delivery van, headquarters, home, and a laboratory all consume in-game coins. Factories make inventory; delivering contract goods provides payouts and reputation. Training and technology improve output.
- **Expanded 3D world:** A physical mailbox, city hall, warehouse, moving vehicles, several NPCs, a day–night cycle, visible purchased upgrades, hidden treasure caches, and a basic first-person delivery van are integrated into the original world. This is an interactive prototype with procedural 3D geometry, not a full commercial-quality simulation.

### Keyboard controls

| Key | Action |
|---|---|
| Click Play | Lock the mouse for free first-person camera movement |
| Esc | Release mouse and show cursor |
| WASD | Walk or drive |
| Shift | Sprint while walking |
| E | Interact, collect discovered rewards, enter/exit nearby van |
| F | Fullscreen |
| G | Guide and adjustable sensitivity |
| M | Property portfolio |
| N | Mailbox |
| B | Business / City Hall dashboard |
| V | Enter/exit the delivery van (once purchased, approach the warehouse) |

### Teacher JSON example

```json
{
  "books": [
    {
      "title": "Our First Factory",
      "genre": "Business",
      "readingLevel": "Elementary",
      "pages": ["The new factory opens near the river. Workers inspect the equipment before making products."],
      "questions": [
        {
          "prompt": "What do workers do before making products?",
          "choices": ["Inspect equipment", "Go home", "Close the road"],
          "correctIndex": 0
        }
      ]
    }
  ]
}
```

**Important limitations:** Teacher and student roles are local browser views, **not secure account roles**. Teacher content and student progress are stored in this browser's local storage and **do not automatically synchronize** across students' computers. Teachers can export lesson packs and progress, but school-wide assignments, login authentication and centrally hosted records require a future backend with real account management and appropriate data protection. The example content and game are educational prototypes. Future expansions to new regions and random city events are intentionally postponed.

### Additional interactive city features

- **NPC reading conversations:** Three named citizens explain a city problem, ask a short comprehension question, and offer a one-time coin reward for a correct answer.
- **Factory supply chains:** A staffed lumber mill supplies lumber used by a staffed workshop to produce additional furniture. The City Hall overview tracks combined production.
- **Personal home customization:** Once the home is purchased, spend coins on flower planters, patio seating, or solar-roof decorations. Purchased objects appear in the 3D world.
- **Construction animation:** New factories show a short crane and building-growth animation when first constructed. Previously owned buildings persist and remain visible.
- **Vehicle and hidden chests:** Purchase the delivery van from City Hall and approach it near the warehouse to drive. Read books to unlock exploration clues and collect one-time treasure rewards.

The local teacher course-pack example is available at `market/example-course-pack.json`; its files are never uploaded to a server by the game itself.

## Campus, City Architect, and separate teacher portal

**Student game:** The student can open **School** on the City Phone or walk to the school building in the western district. The player chooses classes in English, Math, Science, and Business, completes three lessons per course, and takes final exams. Latest course exam percentages determine a game-only 4.0 GPA. Students can explore four career paths; passing the matching subject unlocks a career. **Words** is a local vocabulary journal, and the reading book view supports selecting a word and saving it.

**City Architect:** The **Build** button opens a top-down town grid. Players can spend in-game coins to place trees, parks, roads, lamps, and small houses, or move purchased factory plots. Buildings can rotate in quarter turns. All objects render in the Three.js world and persist in localStorage. The **Map** is a pin map of world buildings, not geographic GPS.

**Factory interiors:** Built factories have entry interactions that load a shared 3D walkable factory interior with machine and worker stations. Enter with E near the factory front, walk using the FPS controls, and exit at the marked doorway. Factory machinery can be helped/upgraded, and workers hired from the interior.

**Authenticated educator portal:** The teacher interface is **not inside the game**. A separate Next.js application lives in `teacher/`, using Neon Auth and a PostgreSQL teacher-membership allowlist checked on the server. It contains courses, classes, JSON lesson imports, assignments, student roster, and a gradebook. Signing up does not grant teacher privileges. An administrator must verify and approve each account's auth user ID. The portal requires a secure `DATABASE_URL` Vercel environment variable before it can connect to school records. These credentials must never be committed or shared through the game.

**Current limitations:** Player saves and GPA are local to their browser and do not yet synchronize to the teacher database. Classes and exams are fictional educational content; they are not accredited courses. City Architect uses a bounded grid and decorative road pieces, not a full traffic pathfinding simulation. Factory interiors are an initial interactive interior, shared by factory types, rather than unique full industrial layouts.

The original main branch remains untouched. No banking, loans, world expansion, or random events were introduced.

## Districts and interiors

The city now has a shared street plan used by the first-person world, door
interactions, collision checks, and City Map. Learn at the west campus, do
business at Civic Square or the east market, and follow Park Avenue south to
Lumen Park and Orchard Row. Existing factory plot coordinates and saved plot
placements remain compatible.

Approach a signed entrance and press **E**. The school contains class and career
stations, the library has reading and vocabulary desks, City Hall has city
services and City Architect, and Eastbank Warehouse has inventory and
contracts. Fern & Finch and Eastbank Outfitters have trade noticeboards.
Factories gain production floors and worker stations when built. Find the
marked exit to return to the same door. The teacher portal remains a separate
app under teacher/.

Run `node --test market/test-*.cjs` from the repository root.


## Downtown and City Phone

Use **P** or the bottom-right Phone button to see land owned, estimated
production income per five seconds, the city wallet, and goods in stock.
The Properties app shows progress by parcel. Production opens the warehouse.
School, Library, the reading journal, My Words, Careers, City Architect,
Mail, the map, and display controls are accessible from the phone. The
Market Office computer still handles story orders, customer messages,
reports, and live security cameras.

`districts.js` owns the street plan and public building proportions.
`district-world.js` builds shared instanced streets, facade details, and
interiors. WebGL uses a cached local directional shadow map. The Canvas
fallback renders the same geometry with simpler lighting.
