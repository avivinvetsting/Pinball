/* Runs the per-table playability checks for the three blueprint tables (layouts rebuilt 2026-11-18;
   each check covers plunger launch, lane/ramp/saucer reachability with return-to-field, and flipper shots). */
const { execFileSync } = require('node:child_process'), path = require('node:path');
let failed = 0;
for (const id of ['quest', 'spy', 'frenzy']) {
  try { const out = execFileSync(process.execPath, [path.join(__dirname, id + '-check.cjs')]).toString().trim().split('\n'); console.log(id + ': ' + out.at(-1)); }
  catch (e) { failed++; console.log(id + ': FAILED\n' + (e.stdout || '') + (e.stderr || '')); }
}
console.log(failed ? 'FAILURES: ' + failed : 'ALL PASSED'); process.exit(failed ? 1 : 0);
