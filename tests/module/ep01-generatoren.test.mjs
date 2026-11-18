import{test}from'node:test';import assert from'node:assert/strict';
import{appSandbox}from'../app-sandbox.mjs';import{generatorCases}from'./ep01-generator-cases.mjs';
import{qualityFailures,lengthQuality}from'./ep01-qualitaet.mjs';
import{appLesen}from'../../werkzeug/module.mjs';
import{uncoveredConsumers,protectedSourceFailures}from'./ep01-consumer-coverage.mjs';
import{committedApp}from'./ep01-rest-fixtures.mjs';
test('remaining EP01 generator families: finite domains/classes, unique correct answers and <=1/3 longest',t=>{
  const S=appSandbox({seed:18112026}),result=generatorCases(S);
  assert.deepEqual(uncoveredConsumers(appLesen('utf8'),result),[]);
  assert.deepEqual(protectedSourceFailures(S),[]);
  if(process.env.BQ_EP01_GENERATOR_CONTROL==='old-ampm'){
    const old=appSandbox({seed:1,anpassen:()=>committedApp()});result.collections.ampm=[];
    for(let i=0;i<12;i++){old.holen('Math').random=()=>i/12+.00001;result.collections.ampm.push(old.holen('ampm')());}
  }
  for(const[name,qs]of Object.entries(result.collections))t.diagnostic(name+': '+JSON.stringify(lengthQuality(qs))+' | inputs='+result.inputCounts[name]+' | '+result.domains[name]);
  assert.deepEqual(result.failures.slice(0,30),[],`independent oracle failures=${result.failures.length}`);
  assert.deepEqual(qualityFailures(result.collections),[]);
  assert.ok(result.consumers.length>=45,'complete named real generator families');
});

test('genuine inherited counterexamples distinguish containing intervals and equivalent fraction values',()=>{
  const old=appSandbox({seed:1,anpassen:()=>committedApp()});
  old.holen('Math').random=()=>(147-101+.001)/799;
  const interval=old.holen('betweenHundredsQ')();
  assert.equal(interval.options.filter(o=>{const[a,b]=o.split(' and ').map(Number);return a<147&&147<b;}).length,2,'the old broad prompt admitted 100/200 and 100/300');
  old.holen('Math').random=()=>0;const q=old.holen('shadedQ')();
  const values=q.options.map(o=>{const[a,b]=o.split('/').map(Number);return a/b;});
  assert.ok(new Set(values).size<q.options.length,'old 1/2 bar offered both 1/1 and 2/2');
});
