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

