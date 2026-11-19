# Pinball Collection

Open index.html directly in Chrome or Edge. All scripts are local; no build or server is needed.

- Left/right arrows: flippers.
- Hold Space or Down, then release: launch.
- P: pause. Q / E / Up: nudge. M / N: music / effects.
- Camera button: large playing view, overhead, full cabinet side view.
- Speed button: 1 / 1.2 / 1.4; default is 1.2.
- Upper level: shoot upward into the illuminated left entrance marked UPPER LOOP. The ball climbs a raised guided circuit and returns to the main board. Completed circuits award 5,000 points, with existing combo/multiball bonuses.
- Touch: left/right half for flippers; hold and release the launch button.

The original artwork, audio and five-table rules are retained. Rendering uses local Three.js 0.160.1 (MIT; vendor/THREE-LICENSE.txt). Gameplay uses the existing planar physics engine with constrained elevated paths, not free rigid-body simulation on a second playfield. If WebGL is unavailable, the original Canvas renderer is used.

Checks:
- node tests/physics-check.cjs
- node tests/new-tables-check.cjs (playability of the blueprint tables)
- node tools/overlay.cjs <tableId> (draws physics geometry over the playfield art)
- tests/browser-check.js is an async Playwright page function, executed through browser_run_code_unsafe. It covers five tables, real keyboard events, synthetic touch, ramp height/scoring, speed/cameras and game flow.

Physical tablet and audio listening have not been verified. See log.md and CURRENT_WORK.md for current status.
