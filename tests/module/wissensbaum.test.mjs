// Synthetic child data; real answer handlers, store/ChildWriter and replay.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {treeModel,treeTokens,treeSurprise,treeLedger,mergeTreeLedger,treeLegacyVisible} from '../../src/module/wissensbaum.mjs';
import {titleApp,titlePlain as plain,TITLE_PRE,TITLE_KID} from './titel-fixtures.mjs';
import {derive} from '../../src/module/ableitung.mjs';
import {altStand} from '../../src/module/lesen.mjs';
import {mergeLog,newEvent,checkEvent} from '../../src/module/ereignisse.mjs';
import {roleMayWrite} from '../../src/module/annahme.mjs';
import {makeSnapshot,stateFrom} from '../../src/module/schnappschuss.mjs';
import {stellbareUhr} from '../app-sandbox.mjs';
const DAY='2026-11-21',good=(n=6,l=2)=>Array.from({length:n},()=>[DAY,l,1,true]);
const events=S=>plain(S.holen('evKindZielLog')(TITLE_PRE).liste());
const model=S=>plain(treeModel(S.holen('knowledgeTree').read()));
function finish(S){while(S.zustand().screen==='play'){S.frageBeantworten(S.zustand().round[S.zustand().idx]);S.klick('#nextBtn');}}
function home(S){S.holen('show')('home');S.holen('renderHome')();}
for(const bauart of ['live','test'])test(`${bauart}: real firstM, furtherM, E; no growth from opening, repeat, failure or 31-day pause`,async()=>{
 const uhr=stellbareUhr(Date.now()),data={ev:{numbers:good(5),round:good(5)}};
 const S=titleApp(data,{bauart,seite:true,uhr});const start=plain(S.holen('knowledgeTree').read());
 S.holen('startRound')('numbers');assert.deepEqual(plain(S.holen('knowledgeTree').read()),start,'opening supplies no proof');finish(S);home(S);
 assert.equal(model(S)[0].branch,true);assert.equal(model(S)[0].leaves,0);assert.equal(S.holen('knowledgeTree').read().claims.length,0,'first branch has no leaf reward');
 S.holen('startRound')('round');finish(S);home(S);assert.equal(model(S)[0].leaves,1);assert.ok(S.holen('knowledgeTree').read().claims.includes('leaf:maths:2'));
 S.holen('startRound')('round');finish(S);home(S);assert.equal(S.holen('standOf')('round'),'E');assert.equal(model(S)[0].fruits,1);
 const retained=plain(S.holen('knowledgeTree').read());S.holen('startRound')('round');finish(S);home(S);assert.deepEqual(plain(S.holen('knowledgeTree').read()),retained,'secure repeat gives no duplicate');
 if(bauart==='live'){S.setzen(TITLE_PRE+'ev',{numbers:good(20).map(r=>[r[0],2,0,false]),round:good(20).map(r=>[r[0],2,0,false])});home(S);assert.equal(S.holen('standOf')('numbers'),'RS');}
 await uhr.vor(31*864e5);home(S);assert.deepEqual(plain(S.holen('knowledgeTree').read()),retained);
 assert.deepEqual(plain(S.holen('eventErrors')),[]);
});
test('baseline retains only proven current/history M/E and solved-discovery bonus, no retrospective gifts; old size is separately retained',()=>{
 const S=titleApp({ev:{numbers:good().concat(good(4,3)),round:good()},treeStage:6,starLedger:{secure:['numbers','round'],solved:['numbers','round','words'],bonuses:['words']}},{bauart:'test',seite:true});
 assert.equal(model(S)[0].leaves,1);assert.equal(model(S)[0].fruits,1);assert.equal(model(S)[2].flowers,1);assert.equal(S.holen('knowledgeTree').read().claims.length,0);assert.equal(S.holen('knowledgeTree').read().legacyStage,6);assert.equal(treeLegacyVisible(S.holen('knowledgeTree').read()),true);
 S.klick('#treeOpen');assert.match(S.$('#treeLegacy').textContent,/earlier practice-day tree/);assert.equal(S.$('#treeLegacy').querySelectorAll('ellipse').length,8,'exact earlier stage6 foliage remains, never used as knowledge leaves');
 const A=titleApp({ev:{numbers:good(6,1)},best_numbers:8,rankSeen:'Legend',treeStage:5},{seite:true});assert.equal(model(A)[0].branch,false);assert.equal(model(A)[0].flowers,0,'old best and old first correct are not evidence of a solved discovery');
});
test('real Practise Today solved discovery grows a distinct flower with hint and exactly one surprise; reload/result/replay/snapshot stay idempotent',async()=>{
 const E=titleApp(),eligible=E.holen('SUBJECTS').flatMap(s=>E.holen('questsIn')(s));const data={ev:Object.fromEntries(eligible.filter(k=>k!=='numbers').map(k=>[k,good()])),focusMode:'manual',focusManual:['numbers','round','combos']};
 const S=titleApp(data,{bauart:'test',seite:true});S.holen('startRound')('today');let found=false;
 while(S.zustand().screen==='play'){const q=S.zustand().round[S.zustand().idx];if(q.neuland){found=true;assert.equal(q.world,'numbers');assert.equal(model(S)[0].flowers,0);S.holen('showHint')();S.frageBeantworten(q);assert.equal(model(S)[0].flowers,1);assert.ok(S.holen('knowledgeTree').read().claims.includes('flower:maths:1'));}else S.frageBeantworten(q);S.klick('#nextBtn');}
 assert.equal(found,true);home(S);const before=events(S),v=plain(S.holen('knowledgeTree').read());S.holen('showResults')();assert.deepEqual(plain(S.holen('knowledgeTree').read()),v);
 const full=derive(before,{now:Date.now()+1000,base:{upTo:'1970-01-01T00:00:00Z',state:altStand(data)}});assert.deepEqual(plain(full.treeLedger),v);
 const R=titleApp({},{bauart:'test',seite:true,speicher:Object.fromEntries(S.ablage)});assert.deepEqual(plain(R.holen('knowledgeTree').read()),v);assert.equal(events(R).length,before.length);
 const records=before.filter(e=>e.type.startsWith('tree_'));const snap=await makeSnapshot(records,{now:Date.now()+2000,author:'p_parent',device:'d_parent'});assert.deepEqual((await stateFrom([],snap,{now:Date.now()+3000})).state.treeLedger,derive(records,{now:Date.now()+3000}).treeLedger);
 S.klick('#treeOpen');S.klick('#treeSurpriseOpen');const opened=plain(S.holen('knowledgeTree').read());assert.equal(opened.opened.length,1);assert.equal(S.holen('knowledgeTree').open(1),false);assert.match(S.$('#treeSurpriseBody').textContent,/Growth surprise 1/);assert.deepEqual(plain(S.holen('eventErrors')),[]);
});
test('offline same/different growth unions entitlements and numbered opens once across full replay, continuation and backup merge',()=>{
 const e=(payload,i)=>newEvent({type:'tree_record',author:TITLE_KID.id,device:'d_test',at:new Date(Date.parse(DAY+'T10:00:00Z')+i).toISOString(),payload});
 const p={secure:['numbers','round'],extending:['round'],discovered:['forces'],baseline:false,legacy:0,tokens:['leaf:maths:2','fruit:maths:1','flower:science:1']};
 const a=e(p,1),b=e(p,2),c=newEvent({type:'tree_open',author:TITLE_KID.id,device:'d_test',at:DAY+'T10:00:01Z',payload:{ordinal:1}}),full=derive([a,b,c,a],{now:Date.now()});
 assert.equal(full.treeLedger.claims.length,3);assert.deepEqual(full.treeLedger.opened,[1]);assert.deepEqual(derive([b,c],{now:Date.now(),base:{upTo:a.at,state:derive([a],{now:Date.now()})}}).treeLedger,full.treeLedger);
 assert.deepEqual(mergeTreeLedger(full.treeLedger,treeLedger(null)),full.treeLedger);assert.deepEqual(treeTokens(full.treeLedger),p.tokens);
});
test('strict new event fields and child-only writes; catalogue sequence excludes every permanently rejected joke',()=>{
 const p={secure:[],extending:[],discovered:[],baseline:true,legacy:6,tokens:[]},e=newEvent({type:'tree_record',payload:p,author:TITLE_KID.id,device:'d_test',at:DAY+'T10:00:00Z'});assert.deepEqual(checkEvent(e),[]);
 for(const patch of[{legacy:7},{tokens:['not-a-token']},{tokens:['leaf:maths:2']},{extra:1}])assert.ok(checkEvent({...e,payload:{...p,...patch}}).length);
 for(const role of ['parent','teacher','admin'])assert.equal(roleMayWrite(role,e),false);assert.equal(roleMayWrite('child',e),true);
 const jokes=[{id:'a',lang:'en'},{id:'b',lang:'en'},{id:'c',lang:'en'}];for(const [ordinal,id]of [[1,'b'],[2,'c'],[3,'b']])assert.equal(treeSurprise(ordinal,{jokes,rejected:['a']}).item.id,id);
});
test('adult login with missing tree markers projects existing child knowledge read-only, including reload/navigation',()=>{
 const S=titleApp({ev:{numbers:good()}},{bauart:'test',seite:true});S.holen('loginDone')(S.holen('APP_ACCOUNTS').users.find(u=>u.user==='papa'));
 const list=events(S).filter(e=>!e.type.startsWith('tree_'));S.ablage.set(TITLE_PRE+'events',JSON.stringify(list));S.ablage.delete(TITLE_PRE+'treeLedger');S.holen('evLogs').clear();
 const before=JSON.stringify([...S.ablage]);S.holen('renderHome')();S.holen('knowledgeTree').observe();assert.match(S.$('#treeText').textContent,/1 branches/);assert.equal(JSON.stringify([...S.ablage]),before);assert.equal(events(S).filter(e=>e.type.startsWith('tree_')).length,0);
});

test('two actual offline first-M answers in the same subject reconcile one new leaf and exactly one surprise after merge',()=>{
 const devices=[];for(const [skill,seed]of [['numbers',301],['round',303]]){const S=titleApp({ev:{numbers:good(5),round:good(5)}},{bauart:'test',seite:true,seed});S.holen('startRound')(skill);finish(S);home(S);assert.equal(S.holen('knowledgeTree').read().claims.length,0);devices.push(S);}
 const list=mergeLog(devices.map(events),Date.now()+1000).events;const R=titleApp({events:list},{bauart:'test',seite:true,seed:303});
 assert.equal(model(R)[0].leaves,1);assert.deepEqual(plain(R.holen('knowledgeTree').read().claims),['leaf:maths:2']);const saved=events(R);home(R);assert.deepEqual(events(R),saved);
 const reload=titleApp({},{bauart:'test',seite:true,speicher:Object.fromEntries(R.ablage)});assert.deepEqual(plain(reload.holen('knowledgeTree').read().claims),['leaf:maths:2']);assert.deepEqual(events(reload),saved);
});
