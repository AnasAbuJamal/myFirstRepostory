# Jungle Miner · Market Office

A first-person story game about opening a tiny garden-kit business. The playable chapter takes place in an office on an empty lot. Read realistic customer emails, compose your own replies, receive visitors, restock the shelf, and build a pickup stand outside.

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

The **City coins** HUD is a separate expansion economy from the original shop's chapter wallet, so the scripted opening story remains playable without rebalancing. Progress is stored in localStorage under jungle-miner-city-v1. On a private browser or blocked storage, the play session still works but may not persist.

**Controls:** WASD to walk; hover/move mouse to look in regular mode; E to interact; **F** or the fullscreen button to request fullscreen + pointer lock. The cursor is hidden during fullscreen exploration. Press **Esc** to release pointer lock, and approach objects or use the City Guide for help. Touch and arrow controls from the office remain available.

**Implementation:** Built with the existing bundled Three.js r180 renderer, with a lightweight procedural world and character rigs rather than large model downloads. Modules: city.js (reading, persistence, economy), city-world.js (3D geometry and animation), and city.css (HUD and library panels). No new runtime packages or network access are required. This is a gameplay expansion, not a completed collection of textbook lessons.

The default build command still produces a fully offline page with the expansion included. Run node --test test-market.cjs test-city.cjs to check both existing office progression and city logic.

## First-person controls and land ownership update

**Mouse and first-person camera:** Click **Play** once to capture the mouse. Moving the mouse then rotates the 3D camera continuously without holding any button or seeing a mouse cursor. Press **Escape** to release the cursor, then click Play or the 3D canvas to recapture it. Browsers require an initial user interaction for mouse capture, and opening book/management dialogs must release the pointer so you can click their controls. Press **G** for the City Guide and adjustable mouse sensitivity, **M** for properties, **F** to toggle fullscreen, **Shift** to sprint outdoors, and **E** to interact.

**Real estate progression:** Earn coins from books, **purchase land**, **construct buildings on owned land**, and **improve land quality** (four levels) to increase automated factory output. Factory machinery can be upgraded separately (ten levels), and up to six employees work at each factory. Six plots have different land prices and reading unlock requirements, and each purchase is visualized in the 3D scene with property boundaries and progressive landscaping. The Properties panel shows a portfolio with land ownership, buildings, staff, and production.

**Compatibility:** Existing city saves are migrated in place: previously built factories automatically gain land ownership. The original Market Office campaign and its separate shop wallet remain unchanged. Coin totals, purchases, and upgrades stay in localStorage for offline gameplay. The City Builder does not use cloud accounts or real-money payments.
