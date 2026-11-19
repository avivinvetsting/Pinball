# TASKS — Radical Structural & Mechanical Overhaul (Phase 2) [Antigravity-planned]

## Why the user was not satisfied with Phase 1
All 5 tables still shared the same fundamental skeleton:
- Identical outer rectangle + semicircle arch (`base(tb)`)
- Same 2 bottom flippers at `195, 885` and `370, 885`, same symmetric slingshots, same inlanes/outlanes
- Same painted AI illustration covering the whole floor (`P.Art[tb.id]`), making all 5 tables look like the same wooden box with different stickers!
- Ramps were just simple curves, with no **Surprise Underground Subways/Tunnels**, no **Upper Mini-Playfields**, no **Moving Bash-Toy Defenders**, no **Gravity Wells / Magnets**, and no **Radically Different Table Shapes** (like Hexagonal Cyber-Arena, Hourglass Waist, Catacomb Lifts, or Helical Corkscrews).

## Phase 2 Objective: Truly Distinct Table Architectures, Surprising Tunnels & Ramps

### 1. New Physics & Mechanical Capabilities (`designs.js`, `game.js`, `render3d.js`, `render.js`)
1. **Surprise Underground Tunnels / Subways (`tunnels`):**
   - A ball enters a glowing 3D **Tunnel Portal / Subway Arch** at `(x1, y1)`, travels through an underground/glass-windowed subway tube (or teleports with subterranean rumble + chaser lights along the floor), and bursts out of a completely unexpected **Exit Turret / Subway Ejector** at `(x2, y2)` with high velocity and a `SUBWAY TUNNEL! +15,000` callout!
   - Implemented cleanly using saucers with `tunnelTo: { x, y, ang, speed, label, col, path }` (or custom handling in `game.js` / `designs.js` when `saucer` event triggers or in `world.eject`), plus 3D arched tunnel portals and glowing subterranean glass floor windows in `render3d.js`!
2. **Upper Mini-Playfields / Raised Platforms (`platforms`):**
   - Elevated 3D second-floor decks (e.g., Captain's Upper Deck on Table 2, Penthouse Stage on Table 1, Catacomb Balcony on Table 4) rendered with 3D railings, elevated floor plates, and upper flippers!
3. **Dramatic 3D Ramps (Corkscrew Helix, Jump/Loop, Elevated Skybridge, Dual Crossovers):**
   - Ramps with multi-loop 3D helices (spiral corkscrew around the Volcano!), arched suspension bridges, and glowing tunnel hoods at ramp entrances/exits.
4. **Active Moving Obstacles (`mover`), Speed Boosters (`boost`), and Gravity Magnets (`magnet`):**
   - Already supported in `engine.js`! Activate and render them in 3D (`render3d.js`):
     - Moving 3D Kraken Tentacle / Patrolling Ghost / Orbiting Drone (`tb.mover(...)` rendered in 3D and animated in `dynamics`!).
     - Pulsing Magnetic Core (`tb.magnet(...)`) & Accelerator Boost Pads (`tb.boost(...)`) rendered as glowing 3D energy pads on the board!
5. **Custom Outer Hulls & Asymmetric Aprons (`hullMode`):**
   - Instead of every table looking like the same flat rectangle with the same full-bleed sticker:
     - Sculpt distinct 3D inner walls/bumpers/dividers and custom architectural playfield surfaces in `render3d.js` & `render.js` so each table has an unmistakable silhouette!

---

### 2. The 5 Radically Different Table Architectures (`designs.js`)

#### Table 1 — `neon`: **JAZZ PENTHOUSE (Asymmetric Split-Level Club & Saxophone Brass Funnel)**
- **Silhouette & Structure:** Asymmetric **Penthouse Split-Level** with an angled left acoustic wall, a raised **VIP Upper Balcony** on the upper-left with its own **Upper Flipper (`x: 92, y: 365`)**, and a giant 3D **Golden Saxophone Bell / Gramophone Horn** funnel on the right!
- **Surprise Tunnel:** **BACKSTAGE SUBWAY (`x: 115, y: 465` → exits out of the VIP Saxophone Horn at `x: 468, y: 235`)** — shoot the backstage trapdoor tunnel and watch the ball travel under the stage lights and blast out of the golden horn at the top!
- **Toys & Mechanics:** Spinning 3D Vinyl Turntable in the center (`x: 282, y: 310`), 3 sunburst chime bumpers, moving **Jazz Spotlight Mover** (`tb.mover(282, 515, 75, 0, 2.4, 14)`), 0 upper ramps (`ramps.length === 0` & `bumpers.length === 3` preserved for `physics-check.cjs`!).

#### Table 2 — `pirate`: **KRAKEN GALLEON (Swinging Ship Deck, Kraken Tentacle & Whirlpool Subway)**
- **Silhouette & Structure:** Asymmetric **Cove & Galleon Hull** — the left side is a raised 3D **Pirate Galleon Deck** with wooden ribs and cannons; the right side is a turbulent open sea with a **Whirlpool Maelstrom**.
- **Surprise Tunnel:** **MAELSTROM ABYSS TUNNEL (`x: 475, y: 535` → `x: 145, y: 195`)** — shoot the swirling Whirlpool Cave on the right; the ball gets sucked underwater along a glowing bioluminescent trench and fires straight out of the **Ship's Upper Bow Cannon**!
- **Ramps & Toys:**
  - **High-Arch Suspension Bridge & Plank Ramp (`CAPTAIN’S DECK`)**: Climbs from right-mid (`412, 628`), crosses a 3D wooden & brass rope-bridge over the top arch (`height: 118`), and drops down the port side.
  - **Moving Kraken Tentacle (`tb.mover(285, 455, 58, 18, 2.8, 16)`)**: A 3D animated Kraken tentacle emerging from the sea that physically deflects the ball and awards `KRAKEN BASH! +2,500`!

#### Table 3 — `space`: **CYBERPUNK PINBALL 2099 (Hexagonal Neon Arena, 4 Flippers, Wormhole Teleporter & Gravity Core)**
- **Silhouette & Structure:** **Angular Hexagonal Cyber-Grid Arena** with chamfered neon bumper-walls along the sides creating an hourglass/octagon waist, 4 flippers (2 main + 2 mid-arena cyber flippers), and a dark holographic laser grid floor!
- **Surprise Tunnel & Magnet:**
  - **QUANTUM WORMHOLE TELEPORTER (`x: 282, y: 490` → `x: 282, y: 160` and vice versa!)**: Enter the glowing Quantum Gate in the center; lightning arcs across the board and the ball warps out of the Upper Reactor Core at hyper-speed!
  - **GRAVITY MAGNET & HYPER-BOOSTERS**: Active `tb.magnet(282, 315, 95, 1100, 7, 2.8)` in the center that curves ball trajectories + 2 glowing `tb.boost` speed pads on the wings!
- **Ramps:** Dual crossed neon laser skyways (`HYPERDRIVE` cyan `height: 126` & `ORBIT RETURN` magenta `height: 78`) with 3D glowing neon portal arches at their entrances!

#### Table 4 — `haunted`: **CATACOMB MANOR (Narrow Waist, Elevator Crypt Tunnel, Patrolling Ghost & Spiral Bell-Tower)**
- **Silhouette & Structure:** **Gothic Hourglass / Catacomb Layout** with protruding stone crypt buttresses on both sides, an upper-left **Gargoyle Flipper (`x: 82, y: 625`)**, and a towering 3D **Gothic Cathedral & Bell Tower** on the right.
- **Surprise Tunnel:** **CATACOMB COFFIN TUNNEL (`x: 90, y: 490` → `x: 420, y: 370`)** — shoot the open 3D Stone Coffin on the left; the coffin lid slams shut, subterranean skulls light up across the floor, and the ball erupts from the **Cathedral Altar Crypt** on the right!
- **Ramps & Toys:**
  - **Wrought-Iron Spiral Viaduct (`BELL TOWER`, `height: 148`)**: Steep gothic viaduct climbing through a 3D stone archway into the belfry.
  - **Patrolling Phantom (`tb.mover(235, 395, 65, 22, 2.2, 15)`)**: A glowing 3D translucent green Ghost that glides across the haunted courtyard!

#### Table 5 — `volcano`: **INFERNO CALDERA (360° Helical Corkscrew Ramp, Lava Tube Subway & Erupting Crater)**
- **Silhouette & Structure:** **Circular Volcanic Caldera & Obsidian Temple** with angled obsidian walls, short high-tension flippers (`len: 70`), and a massive central 3D **Smoking Volcano Cone** surrounded by 5 ring bumpers.
- **Surprise Tunnel:** **MAGMA TUBE SUBWAY (`x: 335, y: 510` → `x: 282, y: 205`)** — shoot the glowing Lava Cave entrance below the volcano; the ball travels underground into the magma chamber and **ERUPTS vertically out of the Volcano Crater** in a shower of sparks!
- **Ramps & Toys:**
  - **360° Helical Corkscrew Coaster (`CRATER RUN`, `height: 112`)**: A multi-curve spiraling magma-rail coaster that wraps all the way around the volcano cone with glowing fire-rings along the tunnel entrance!
  - **Dual Lava Accelerator Boosts (`tb.boost`)** on the left and right temple lanes!

---

### 3. Visual Architecture Differentiation (`render3d.js` & `render.js`)
To ensure the 5 tables look **immediately different in structure** (not just color):
1. **3D Tunnel Portals & Underground Subway Windows (`render3d.js`):**
   - Every `tb.tunnels` entry renders:
     - A 3D **Entrance Tunnel Hood / Archway** (Brass Saxophone Horn, Kraken Whirlpool Cave, Quantum Wormhole Gate, Gothic Stone Coffin Arch, Molten Lava Cave) with glowing interior darkness and pulsing chevron lights.
     - A **Subterranean Glowing Track** (series of sequential floor-window chase lights between entrance and exit) that lights up when a ball is traveling through the tunnel!
     - A 3D **Exit Ejector Turret** at the destination.
2. **3D Moving Toys (`mover`), Magnet Fields (`magnet`), and Boost Pads (`boost`) in `render3d.js`:**
   - Render every `tb.movers` item as a custom 3D animated character/toy (Spotlight/Mute-Bell on Jazz, Kraken Tentacle on Pirate, Cyber Drone on Space, Glowing Ghost on Haunted) that moves in real-time with `c.x, c.y`!
   - Render `tb.magnets` as pulsing 3D concentric energy rings on the playfield.
   - Render `tb.boosts` as glowing 3D speed-chevron strips.
3. **3D Architectural Walls / Bumpers / Upper Decks (`tb.structures`):**
   - Add 3D sculpted side-walls, upper balcony decks, hexagonal cyber-bumpers, and stone gothic buttresses per table so the board geometry itself looks completely unique on each machine!
4. **Distinct Playfield Floor Treatment (`render3d.js` & `render.js`):**
   - Tone down the uniform rectangular sticker look by overlaying table-specific architectural 3D floor zones (e.g., holographic grid & dark obsidian floor on `space`, wooden plank deck & deep water trench on `pirate`, stone catacomb tiles on `haunted`, basalt lava cracks on `volcano`, Art Deco parquet & brass inlays on `neon`).

### 4. Verification Requirements
- `node tests/physics-check.cjs` MUST pass 100%.
- Headless Chrome verification script (`verify-browser.cjs`) MUST pass 100%, including testing the new **Subway Tunnels**, **Moving Toys**, **Ramps**, and capturing updated screenshots of all 5 tables so we can visually confirm the radical difference.
