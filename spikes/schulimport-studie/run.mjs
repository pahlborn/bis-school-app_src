import { runFixtureStudy } from './spike.mjs';

const results = await runFixtureStudy();
for (const row of results) {
  console.log(`${row.adapter}: ${row.mappedCount}/${row.studentCount} zugeordnet, current-target=${row.currentTargetValid ? 'ok' : 'offen'}`);
  if (row.unresolved.length) console.log('  offen: ' + JSON.stringify(row.unresolved));
}
