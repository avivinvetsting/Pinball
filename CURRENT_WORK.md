# CURRENT_WORK — Pinball

## Objective (2026-10-22, latest feedback)
Make five genuinely distinct imaginative machines. Preserve large playfield, realistic 3D hardware and speed selector. User rejected five near-identical layouts and supplied detailed classic/jazz/aviation pinball photos.

## In progress
Generating five original illustrated playfield assets via built-in ImageGen. Replacing universal loop with table-specific geometry: classic open jazz field; pirate ship deck; crossed orbital routes; haunted bell tower; volcano crater circuit. Updating physical layout, model details, instructions and tests.

## Open tasks
Finish and inspect artwork, save assets in project; implement distinct layouts and 3D props; verify all shots/ramps and game flow; inspect five final screenshots and mobile sizing. Previous test results are in log.md and apply to earlier version only.

## Files
render3d.js, render.js, tables.js, game.js, style.css, index.html; assets/ (new artwork), tests/physics-check.cjs and tests/browser-check.js. Historical notes: log.md.

##Limits
Physics is planar with guided raised paths. No physical tablet or audible-sound test. New changes not yet verified.

## Updates
- [Antigravity] 2026-11-11: Planned comprehensive Pinball overhaul in `TASKS.md` (`[Antigravity-planned]`) and executed via custom subagent `pinball-architect`.
- [Antigravity] 2026-11-11: Replaced bright museum-catalog UI with atmospheric Dark Arcade Hall, glowing per-table radial lighting, styled cabinet menu cards with style tags (`ART DECO EM`, `WIREFORM GALLEON`, `CYBERPUNK NEON`, `GOTHIC HORROR`, `MOLTEN TIKI`), and LED/DMD scoreboard with live Mission & Combo panel (`style.css`, `index.html`, `game.js`).
- [Antigravity] 2026-11-11: Redesigned all 5 tables with distinct 3D materials, sleek wireform/neon/iron/lava tracks (`opacity: 0.08–0.18` so center artwork is never obscured), animated 3D centerpiece toys (`propVinyl`, `propShip`, `propReactor`, `propTower`, `propVolcano`), and pulsing guided `shotArrows` (`designs.js`, `render3d.js`, `render.js`).
- [Antigravity] 2026-11-11: Verified 100% pass on `node tests/physics-check.cjs` and full headless Chrome WebGL suite across all 5 tables, cameras, speed modes, ramp elevation (130 units), mobile 390px layout, and refreshed all preview screenshots.
- [Antigravity] 2026-11-11: Executed Phase 2 Radical Structural & Mechanical Overhaul per user feedback (`TASKS.md`): added surprise underground Subway Tunnels (`tunnelTo` + 3D tunnel portals, chasing underground floor windows, and 3D exit turrets/horns/cannons) in `engine.js`, `game.js`, `designs.js`, `render3d.js`, and `render.js`.
- [Antigravity] 2026-11-11: Differentiated table silhouettes and mechanics across all 5 machines: 3-Flipper VIP Balcony & Golden Saxophone Horn Subway on `neon`; Swinging Galleon, moving 3D Kraken Tentacle & Abyss-to-Cannon Subway on `pirate`; Hexagonal Cyber-Grid Arena, Wormhole Teleporter, Gravity Magnet & Twin Boosters on `space`; Gothic Crypt Buttresses, Coffin-to-Altar Subway & patrolling 3D Phantom Ghost on `haunted`; 360° Helical Corkscrew Coaster & Magma Crater Eruption Subway on `volcano`. Verified 100% pass on physics and headless Chrome tunnel/ramp/mobile checks.


## Progress Update (2026-11-11) [Antigravity]
- [Antigravity] Overhauled `style.css` and `index.html` to a Dark Arcade Hall theme (`#070914` to `#141c3f`) with dynamic table ambient glow (`--glow`, `--bg1`, `--bg2`), dark glass cabinet menu cards with style tags, and an LED/DMD scoreboard HUD featuring an Active Mission / Combo box (`#liveCombo`, `#liveMission`) and DMD callout banner (`#liveMessage`).
- [Antigravity] Upgraded all 5 table definitions in `designs.js` with distinct `styleTag`, `cabinetStyle`, `shotArrows`, spinning `vinyl` centerpiece on `neon` (JAZZ BOULEVARD), perimeter `wireform` coaster ramp on `pirate` (KRAKEN COVE) that keeps the central Kraken artwork unobstructed, crossed `neon` laser ramps on `space` (ORBITAL ACE), wrought-`iron` Bell Tower track on `haunted` (MIDNIGHT MANOR), and perimeter `lava` track on `volcano` (INFERNO TEMPLE).
- [Antigravity] Enhanced `render3d.js` and `render.js` with distinct 3D cabinet/rail materials per table, dynamic playfield point-light pulsing, multi-rail 3D wireform/neon/iron/lava ramps with translucent beds (`opacity: 0.08–0.18`), animated 3D centerpiece props (`propVinyl`, `propShip`, `propReactor`, `propTower`, `propVolcano`), pulsing 3D/2D `shotArrows`, and custom bumper cap styles.
- [Antigravity] Verified `node tests/physics-check.cjs` passes 100% across all 5 tables and ramps.
## Phase 2 Progress Update (2026-11-11) [Antigravity]
- [Antigravity] Implemented Surprise Underground Tunnels / Subways (`tb.tunnels` + `saucer.tunnelTo`) in `engine.js` and `game.js`: balls entering a tunnel saucer smoothly travel underground from `(s.x, s.y)` to `(s.tunnelTo.x, s.tunnelTo.y)` (`b.tunnelProg`), award `+15,000` with `SUBWAY TELEPORT +15,000` callouts, and eject from the 3D exit turret (`SAXOPHONE HORN!`, `CANNON BLAST!`, `WORMHOLE WARP!`, `CRYPT ELEVATOR!`, `VOLCANO ERUPTION!`).
- [Antigravity] Redesigned all 5 table physical structures in `designs.js` so each machine has a distinct playfield silhouette, custom 3D inner architectural walls (`tb.structures`), custom floor treatments (`tb.floorStyle`), moving bash toys (`tb.movers`), magnets (`tb.magnets`), speed boost pads (`tb.boosts`), and 3D ramp arches (`rp.arches`).
- [Antigravity] Added 3D & 2D rendering and dynamic animations in `render3d.js` and `render.js` for `tb.structures`, `tb.tunnels` (3D Golden Saxophone Horn, Ship Bow Cannon, Stone Coffin arch, Quantum Portal, Magma Cave, and chasing underground subway windows), `tb.movers` (3D Kraken Tentacle, Phantom Ghost, Jazz Spotlight), `tb.magnets`, `tb.boosts`, and 3D ramp arches.
- [Antigravity] Verified 100% pass on `node tests/physics-check.cjs` and verified tunnel capture + teleport ejection across all 5 tables.

## Update (2026-11-18) [Claude]
- [Claude] Fixed flipper strike physics (`engine.js` flipper contact + `tables.js` flipper defaults): old flipper (15 rad/s, e=0.35) launched the ball weakly and then re-hit/carried it 2–3 times through the swing, so mid-flipper shots went straight up or even back toward the same side. Now wUp=21 and a swinging flipper uses `eHit=0.72` (resting flipper stays e=0.35 for catches) → one clean strike, mid-flipper shot exits ~−62° (up and across) and reaches the top.
- [Claude] Fixed ball stuck behind upper (mini) flippers: ORBITAL ACE mini-flipper pivots left a 16px gap to the side wall (ball is 20px) → added sealing guide walls (`designs.js`). `game.js` stuck guard is now displacement-based (ball within 6px for 2s → kicked toward centre) so balls jittering in a wedge or balanced on a pivot top are freed; balls cradled on a held flipper are ignored.
- [Claude] 2026-11-18: Blueprint tables rebuilt to trace the drawings (user said the first version was far simpler than the blueprints). DARK QUEST: castle U-lanes (Drawbridge/Dungeon/Armory/Keep), Keep Ramp, banks on inner walls. SPY: S-shaped escape route + top escape lane, radar island, enclosed bumper bowl fed by the orbit, spiral wire ramp, C-I-A/S-P-Y banks. FRENZY: two crossing S-ramps fed by hook lanes, side orbits, bumper diamond. Code: `tables/{quest,spy,frenzy}.js` (load before designs.js, use `P.kit`), helpers `t.lane/t.bank/t.bez` in tables.js, `tools/overlay.cjs <id>` overlays physics on the art. Checks: `tests/{quest,spy,frenzy}-check.cjs` (run all via `tests/new-tables-check.cjs`). Verified: all checks pass, 3D render of all three in browser, zero console errors. Not verified: human play-feel; 2D fallback renderer; Hebrew wording. Known deviations: Dark Quest's 'upper flipper' omitted (label points at the sling) and its arrow triangles are floor inserts; Frenzy's left bank and triangles shifted 15-40px off the art for playability.
