// Complete current EP01 audit. No OPEN consumer is silently accepted.
// Run: node tests/module/ep01-audit.mjs
import{appSandbox}from'../app-sandbox.mjs';import{appLesen}from'../../werkzeug/module.mjs';
import{discoverBanks,lengthQuality,qualityFailures,PENDING_BANKS,discoverMcCallsites,MC_CALLSITE_INVENTORY}from'./ep01-qualitaet.mjs';
import{generatorCases}from'./ep01-generator-cases.mjs';
import{uncoveredConsumers,protectedSourceFailures,protectedRounding,foundationConsumers,sharedConstructors,poolConsumers}from'./ep01-consumer-coverage.mjs';
const source=appLesen('utf8'),S=appSandbox({seed:18112026}),banks=discoverBanks(S,source),known=new Set([...PENDING_BANKS,'ROUND_MC']);
const unknown=Object.keys(banks).filter(n=>!known.has(n));
for(const[name,qs]of Object.entries(banks)){const m=lengthQuality(qs),fail=!known.has(name)||qualityFailures({[name]:qs}).length;console.log(`${fail?'FAIL':'PASS'} bank ${name}: ${m.strict}/${m.count} strict; ${m.tied} shared-longest; weighted ${(100*m.longestShare).toFixed(4)}%`);}
const generated=generatorCases(S),uncovered=uncoveredConsumers(source,generated),changed=protectedSourceFailures(S);
for(const[name,qs]of Object.entries(generated.collections)){const m=lengthQuality(qs),fail=qualityFailures({[name]:qs}).length;console.log(`${fail?'FAIL':'PASS'} generator ${name}: ${m.strict}/${m.count} strict; ${m.tied} shared-longest; weighted ${(100*m.longestShare).toFixed(4)}%; inputs=${generated.inputCounts[name]} | ${generated.domains[name]}`);}
const newSites=discoverMcCallsites(source).filter(n=>!MC_CALLSITE_INVENTORY.includes(n));
console.log('Unknown banks:',unknown);console.log('Unknown callsites:',newSites);console.log('Uncovered current consumers:',uncovered);console.log('Protected-source differences:',changed);console.log('Independent answer-oracle failures:',generated.failures);
console.log('Protected Rounding families (existing finite tests, byte-correlated):',protectedRounding.join(', '));
console.log('Foundation consumers (unchanged, exempt from EP01 length target):',foundationConsumers.join(', '));
console.log('Shared constructors (source-correlated):',sharedConstructors.join(', '));
console.log('Pool consumers (reviewed static/generator inputs; app-round tests):',poolConsumers.join(', '));
console.log('Word of the Day/trivia: expressly outside EP01. Independent review and final-head CI are separate acceptance gates.');
const failed=unknown.length||newSites.length||uncovered.length||changed.length||generated.failures.length||qualityFailures(banks).length||qualityFailures(generated.collections).length;
console.log(failed?'EP01 CURRENT CONTENT AUDIT FAIL':'EP01 CURRENT CONTENT AUDIT PASS');process.exitCode=failed?1:0;
