// Reproducible global audit: deliberately exits 1 while untouched banks violate EP01.
// Run: node tests/module/ep01-audit.mjs
import {appSandbox} from '../app-sandbox.mjs';
import {appLesen} from '../../werkzeug/module.mjs';
import {discoverBanks,lengthQuality,qualityFailures,PENDING_BANKS,discoverMcCallsites,MC_CALLSITE_INVENTORY} from './ep01-qualitaet.mjs';
const source=appLesen('utf8'), banks=discoverBanks(appSandbox({seed:18112026}),source);
const known=new Set([...PENDING_BANKS,'ROUND_MC']);
const unknown=Object.keys(banks).filter(n=>!known.has(n));
for(const [name,questions] of Object.entries(banks)){
  const q=lengthQuality(questions), fail=!known.has(name)||qualityFailures({[name]:questions}).length>0;
  console.log(`${fail?'FAIL':'PASS'} ${name}: ${q.strict}/${q.count} strict; ${q.tied} shared-longest; weighted ${(100*q.longestShare).toFixed(2)}%; ${name==='ROUND_MC'?'revised slice':'OPEN: content/misconceptions not reviewed in this slice'}`);
}
console.log('Unclassified new banks:',unknown);
const newCallsites=discoverMcCallsites(source).filter(n=>!MC_CALLSITE_INVENTORY.includes(n));
console.log('Unclassified new MC callsites:',newCallsites);
console.log('OPEN generator/callsite inventory (apart from revised helpers and unchanged foundation):',MC_CALLSITE_INVENTORY.filter(n=>!['roundWordQ','roundThousandQ','roundTenQ','distanceExplainQ','estimateQ','threeAddendsQ','tenVsHundredQ','nearestHundredQ','benchmarkQ','baseQ','numbersBaseQ','combosBaseQ','wordprobBaseQ','unitsBaseQ','graphsBaseQ','mc','two'].includes(n)&&!n.startsWith('direct-MC-sites=')).join(', '));
console.log('Generated families outside revised Rounding helpers remain OPEN; this static-bank audit is not full EP01 acceptance.');
process.exitCode=unknown.length||newCallsites.length||qualityFailures(banks).length?1:0;
