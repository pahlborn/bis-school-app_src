// Classification binds current callsites to actual finite generator evidence,
// unchanged shared/foundation source, or pool composition over those questions.
// It does not accept a new consumer solely because its name looks familiar.
import fs from'node:fs';import{execFileSync}from'node:child_process';
import{appSandbox}from'../app-sandbox.mjs';
import{committedApp,REST_BASE}from'./ep01-rest-fixtures.mjs';
import{discoverMcCallsites}from'./ep01-qualitaet.mjs';
import{createNumberQuestions}from'../../src/module/zahlenfragen.mjs';
import{createLanguageQuestions}from'../../src/module/sprachfragen.mjs';
export const protectedRounding=['roundWordQ','roundThousandQ','roundTenQ','distanceExplainQ','estimateQ','threeAddendsQ','tenVsHundredQ'];
export const foundationConsumers=['nearestHundredQ','benchmarkQ','baseQ','numbersBaseQ','combosBaseQ','wordprobBaseQ','unitsBaseQ','graphsBaseQ','neulandFoundation'];
export const sharedConstructors=['mc','two','takeFrom'];
export const poolConsumers=['buildRounding','buildWords','buildLibrary','buildTrip','buildMusic','buildGraphs','buildFinish','buildExamples','buildChampion','buildOpinion','buildTeam','buildStickers','buildWordProb','buildAnleitung','buildPoetry','buildSchool'];
export function uncoveredConsumers(source,result){
  const covered=new Set([...result.consumers,...protectedRounding,...foundationConsumers,...sharedConstructors,...poolConsumers]);
  const factoryConsumers=[...Object.keys(createNumberQuestions({})).filter(n=>!['barData','travelData','wpSetup'].includes(n)),...Object.keys(createLanguageQuestions({}))];
  return [...new Set([...discoverMcCallsites(source),...factoryConsumers])].filter(n=>!n.startsWith('direct-MC-sites=')&&!covered.has(n));
}
export function protectedSourceFailures(S){
  const old=appSandbox({seed:18112026,anpassen:()=>committedApp()});
  const functions=['mc','two','fill3','rnd','pick','shuffle','takeFrom','round10','round100','timeWords','qId','bridgeFor','roundedQuestion','guidance','exampleFor','baseQ','numbersBaseQ','combosBaseQ','wordprobBaseQ','unitsBaseQ','graphsBaseQ'];
  const failures=functions.filter(name=>String(S.holen(name))!==String(old.holen(name))).map(name=>'changed protected function '+name);
  const path='src/module/rundungsfragen.mjs',removeHalfway=s=>s.replace(/function halfwayQ\([\s\S]*?\n}/,'/* separately checked halfwayQ */');
  if(removeHalfway(fs.readFileSync(path,'utf8'))!==removeHalfway(execFileSync('git',['show',`${REST_BASE}:${path}`],{encoding:'utf8'})))failures.push('changed protected Rounding source outside halfwayQ');
  return failures;
}
