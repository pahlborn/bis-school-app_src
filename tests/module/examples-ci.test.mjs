// Exact inherited CI counterexample; all fallback questions use the existing catalogue.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {appLesen} from '../../werkzeug/module.mjs';
import {discoverMcCallsites,MC_CALLSITE_INVENTORY} from './ep01-qualitaet.mjs';
import {poolConsumers} from './ep01-consumer-coverage.mjs';
import {appSandbox} from '../app-sandbox.mjs';
const WRAPPER='WORLDS.examples.build=()=>ohneDoppelte(examplesRandomRound(),()=>[],{id:qId,level:levelOf,tries:0,fallback:exampleFallbackPool});';
test('seed1 round30622: the existing 12 random refills exhaust, finite catalogue repairs only the duplicate at the same level',()=>{
 const results=[];
 for(const control of [true,false]){const S=appSandbox({seed:1,...control?{anpassen:h=>{assert.ok(h.includes(WRAPPER));return h.replace(WRAPPER,'');}}:{}});results.push(JSON.parse(JSON.stringify(S.holen(`(()=>{let rd;for(let i=0;i<=30622;i++)rd=WORLDS.examples.build();const ids=rd.map(qId);return{ids,levels:rd.map(levelOf),length:rd.length,unique:new Set(ids).size};})()`))));}
 const [before,after]=results;assert.equal(before.unique,7);assert.equal(after.unique,8);assert.equal(after.length,8);assert.deepEqual(after.levels,before.levels);assert.deepEqual(after.levels,[1,1,1,1,1,1,2,1]);
 const changed=after.ids.map((id,i)=>id===before.ids[i]?null:i).filter(i=>i!==null);assert.equal(changed.length,1);assert.equal(before.ids.indexOf(before.ids[changed[0]])<changed[0],true,'only the repeated occurrence is replaced');
 const S=appSandbox({seed:6}),pool=Array.from(S.holen('exampleFallbackPool')()),id=S.holen('qId'),level=S.holen('levelOf');assert.equal(pool.length,21);assert.equal(new Set(pool.map(id)).size,21);for(const lv of [1,2,3])assert.equal(pool.filter(q=>level(q)===lv).length,7,'complete existing same-level MC supply');
});

test('EP01 consumer inventory accounts for exactly one existing-bank fallback callsite',()=>{assert.deepEqual(discoverMcCallsites(appLesen('utf8')),MC_CALLSITE_INVENTORY);assert.ok(poolConsumers.includes('exampleFallbackPool'));});
