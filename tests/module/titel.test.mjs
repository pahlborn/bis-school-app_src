import{test}from'node:test';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';
import{RANKS,RANK_POLICY,RANK_MIGRATION,knowledgeRankFor,titleKnowledge,titleNext}from'../../src/module/titel.mjs';
import{derive}from'../../src/module/ableitung.mjs';import{newEvent,checkEvent}from'../../src/module/ereignisse.mjs';
import{makeSnapshot,stateFrom}from'../../src/module/schnappschuss.mjs';import{evProtokoll,altStand}from'../../src/module/lesen.mjs';
import{appSandbox,stellbareUhr}from'../app-sandbox.mjs';import{committedApp}from'./ep01-rest-fixtures.mjs';
import{titleApp,titleRows,titlePlain,TITLE_PRE,TITLE_KID,TITLE_DAY}from'./titel-fixtures.mjs';
const BASE='f7e9ce66ba70ec366b82e1a80ec60d80b63ab79f';
const p=(secure,subjects=0,extending=0)=>({secure,subjects,extending});
const evFor=keys=>Object.fromEntries(keys.map(k=>[k,titleRows()]));
const events=S=>titlePlain(S.holen('evKindZielLog')(TITLE_PRE).liste());
const event=(payload,ms=0,type='rank_seen')=>newEvent({type,payload,author:TITLE_KID.id,device:'d_test',at:new Date(Date.parse('2026-11-20T07:00:00Z')+ms).toISOString()});

test('fixed title boundaries, subject breadth and E counts are all required',()=>{
 const cases=[[p(2,5,5),'Explorer'],[p(3),'Investigator'],[p(5,2),'Investigator'],[p(6,1),'Investigator'],[p(6,2),'Scientist'],[p(11,4,2),'Scientist'],[p(12,3,2),'Scientist'],[p(12,4,1),'Scientist'],[p(12,4,2),'Professor'],[p(17,5,5),'Professor'],[p(18,4,5),'Professor'],[p(18,5,4),'Professor'],[p(18,5,5),'Legend']];
 for(const[progress,want]of cases)assert.equal(knowledgeRankFor(progress),want,JSON.stringify(progress));
 assert.deepEqual(RANKS.map(r=>r.slice(0,2)),[[0,'Explorer'],[3,'Investigator'],[6,'Scientist'],[12,'Professor'],[18,'Legend']]);
});
test('Me/Events count secure quests, never breadth; studios, unknown/duplicate quests and overlapping school standards are not extra quests',()=>{
 const subjects=[{key:'maths',items:['a','b','studio:x']},{key:'science',items:['a','c']},{key:'learner',items:['d']},{key:'events',items:['e','missing']}];
 assert.deepEqual(titleKnowledge(subjects,k=>k==='e'?'E':'M',k=>k!=='missing'),p(5,2,1));
 const S=titleApp({rankPolicy:RANK_POLICY,rankSeen:'Explorer'}),all=S.holen('SUBJECTS').flatMap(s=>s.items).filter(k=>S.holen('WORLDS')[k]);
 S.setzen(TITLE_PRE+'ev',evFor(all));const progress=titlePlain(S.holen('rankProgress')());assert.equal(progress.secure,new Set(all).size);assert.equal(progress.subjects,5);assert.equal(progress.extending,0);
});
test('actual standOf drives titles: school M/E fallback, <M exclusion and same-session own evidence',()=>{
 const S=titleApp({rankPolicy:RANK_POLICY,rankSeen:'Explorer',ev:evFor(['numbers','round','combos'])});
 assert.equal(S.holen('rankFor')(),'Investigator');assert.equal(S.holen('store').get('total',0),0);
 const school={asOf:TITLE_DAY,tasks:[{day:TITLE_DAY,area:'math',title:'Synthetic assessment',std:{'M-N1':'E','M-N3':'M'},quests:['numbers','round'],focusNext:[],good:{de:'',en:''},next:{de:'',en:''}}]};
 const T=titleApp({rankPolicy:RANK_POLICY,rankSeen:'Explorer'},{school});
 assert.equal(T.holen('standOf')('numbers'),'E');assert.equal(T.holen('standOf')('round'),'M');assert.deepEqual(titlePlain(T.holen('rankProgress')()),p(2,1,1));
 T.setzen(TITLE_PRE+'ev',{numbers:Array.from({length:6},()=>[TITLE_DAY,2,0,false])});
 assert.equal(T.holen('standOf')('numbers'),'RS');assert.deepEqual(titlePlain(T.holen('rankProgress')()),p(1,1,0));
});
for(const[total,seen,want]of[[0,null,'Explorer'],[130,null,'Professor'],[130,'Explorer','Professor'],[13,'Professor','Professor'],[250,'Investigator','Legend'],[0,'Legend','Legend']])test(`one-time legacy conversion: ${total} stars / ${seen} -> ${want}`,()=>{
 const S=titleApp({total,...seen?{rankSeen:seen}:{}});assert.equal(S.$('#rankName').textContent,want);assert.equal(S.holen('store').get('rankPolicy'),RANK_POLICY);assert.equal(S.$('#rankNote').hidden,true);
 const R=titleApp({}, {speicher:Object.fromEntries(S.ablage)});assert.equal(R.$('#rankName').textContent,want);assert.equal(R.$('#rankNote').hidden,true);
});
test('real child writer: knowledge promotes at zero stars, only once; future stars and late old-client titles cannot promote',()=>{
 const S=titleApp({total:0,rankSeen:'Explorer',ev:evFor(['numbers','round','combos'])},{bauart:'test'}),base=altStand({total:0,rankSeen:'Explorer',ev:evFor(['numbers','round','combos'])});
 assert.equal(S.$('#rankName').textContent,'Investigator');assert.equal(S.$('#rankNote').hidden,false);assert.deepEqual(events(S).map(e=>e.payload),[{rank:'Explorer',policy:RANK_MIGRATION},{rank:'Investigator',policy:RANK_POLICY}]);
 assert.ok(events(S).every(e=>e.author===TITLE_KID.id&&checkEvent(e).length===0));
 for(let i=0;i<40;i++)S.holen('eventHook')('round_done',{day:TITLE_DAY,skill:'numbers',stars:8,count:8});
 S.holen('eventHook')('rank_seen',{rank:'Legend'});S.holen('eventHook')('rank_seen',{rank:'Legend',policy:RANK_MIGRATION});S.holen('renderHome')();
 assert.equal(S.holen('store').get('total'),320);assert.equal(S.$('#rankName').textContent,'Investigator');assert.equal(S.$('#rankNote').hidden,true);
 const replay=derive(events(S),{now:Date.now(),base:{upTo:'1970-01-01T00:00:00Z',state:base}});assert.equal(replay.rankSeen,'Investigator');assert.equal(replay.rankPolicy,RANK_POLICY);
 const R=titleApp({}, {bauart:'test',speicher:Object.fromEntries(S.ablage)});assert.equal(R.$('#rankName').textContent,'Investigator');assert.deepEqual(events(R),events(S));assert.deepEqual(titlePlain(S.holen('eventErrors')),[]);
});
test('converted profile with a missing/lower seen value never reopens the legacy star ladder',()=>{
 for(const seen of[null,'Explorer']){const S=titleApp({rankPolicy:RANK_POLICY,total:1000,...seen?{rankSeen:seen}:{}});assert.equal(S.$('#rankName').textContent,'Explorer');assert.equal(S.$('#rankNote').hidden,true);}
});
test('base/full replay/snapshot/late second-device migration retain cutoff and highest earned knowledge title',async()=>{
 const old=event({rank:'Professor'}),cut=event({rank:'Professor',policy:RANK_MIGRATION},10),star=event({day:TITLE_DAY,skill:'numbers',stars:8,count:8},20,'round_done'),late=event({rank:'Legend'},30),conversion=event({rank:'Legend',policy:RANK_MIGRATION},40),earned=event({rank:'Legend',policy:RANK_POLICY},50);
 const first=[old,cut],remaining=[star,late,conversion],all=[...first,...remaining];
 const full=derive(all,{now:Date.now()});assert.equal(full.rankSeen,'Professor');assert.equal(full.rankPolicy,RANK_POLICY);
 const snap=await makeSnapshot(first,{now:'2026-11-20T07:00:00.015Z',author:'p_adult',device:'d_P1'});const restored=await stateFrom(remaining,snap,{now:Date.now()});assert.equal(restored.weg,'schnappschuss');assert.deepEqual(restored.state,full);
 assert.deepEqual(derive(remaining,{now:Date.now(),base:{upTo:snap.payload.upTo,state:snap.payload.state}}),full);
 const upgraded=derive([...all,earned],{now:Date.now()});assert.equal(upgraded.rankSeen,'Legend');assert.equal(derive([event({rank:'Explorer',policy:RANK_POLICY},60)],{now:Date.now(),base:{upTo:earned.at,state:upgraded}}).rankSeen,'Legend');
 // Even an old-looking later round cannot re-evaluate stars at conversion.
 const before=event({day:TITLE_DAY,skill:'numbers',stars:8,count:8},-10,'round_done');assert.equal(derive([cut,before],{now:Date.now()}).rankSeen,'Professor');
});
test('already received conversion ignores future stars and old-client promotions with a slower second-device clock',()=>{
 const cut=event({rank:'Explorer',policy:RANK_MIGRATION},20);let list=[cut];
 const reader=evProtokoll({laden:()=>list,speichern:x=>list=x,now:()=>Date.now()});assert.equal(reader.stand().rankSeen,'Explorer');
 for(let i=0;i<4;i++)reader.schreiben([...list,event({day:TITLE_DAY,skill:'numbers',stars:8,count:8},i,'round_done')]);
 reader.schreiben([...list,event({rank:'Legend'},5)]);
 assert.equal(reader.stand().total,32);assert.equal(reader.stand().rankSeen,'Explorer');reader.neuLaden();assert.equal(reader.stand().rankSeen,'Explorer');
 assert.equal(derive([...list,event({rank:'Legend',policy:RANK_MIGRATION},30)],{now:Date.now()}).rankSeen,'Explorer');
});
test('earned title survives falling knowledge, a month pause and next-goal deficits stay nonnegative',async()=>{
 const uhr=stellbareUhr(Date.now()),S=titleApp({rankPolicy:RANK_POLICY,rankSeen:'Professor',total:1,ev:evFor(['numbers'])},{uhr});
 assert.equal(S.holen('shownRank')(),'Professor');S.setzen(TITLE_PRE+'ev',{});await uhr.vor(31*864e5);S.holen('renderHome')();assert.equal(S.holen('shownRank')(),'Professor');
 assert.match(titleNext('Professor',p(0),'de'),/Noch 18 sichere Quests/);assert.doesNotMatch(titleNext('Professor',p(50,7,10)),/-\d/);assert.match(titleNext('Legend',p(0)),/Legend/);
});
test('rank policy extends only the existing title payload; old validator rejects this entry selectively (encrypted transport proof retained separately)',async()=>{
 const catalog='data:text/javascript;base64,'+Buffer.from(execFileSync('git',['show',BASE+':src/module/standardkatalog.mjs'])).toString('base64');
 const source=execFileSync('git',['show',BASE+':src/module/ereignisse.mjs'],{encoding:'utf8'}).replace("'./standardkatalog.mjs'",JSON.stringify(catalog));
 const old=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const policy of[RANK_POLICY,RANK_MIGRATION]){const e=event({rank:'Professor',policy});assert.deepEqual(checkEvent(e),[]);assert.deepEqual(old.checkEvent(e),['payload.policy: unknown field']);}
 assert.deepEqual(old.checkEvent(event({rank:'Professor'})),[]);assert.deepEqual(checkEvent(event({rank:'Professor',policy:'unknown'})),['payload.policy: invalid']);
});
test('questions, guidance, Today, W1 held/R2, star amounts, treats and tree algorithms remain byte-identical to accepted W1',()=>{
 const S=appSandbox({seed:203}),B=appSandbox({seed:203,anpassen:()=>committedApp(BASE)});
 for(const name of['standOf','yearLevelEv','meetsOf','qId','recordAnswer','observeAttempt','logAttempt','score','showResults','guidance','exampleFor','bridgeFor','buildToday','neulandEntry','gapAct','gapProgress','openGaps','treeSVG','storyFor','jokeFor'])assert.equal(String(S.holen(name)),String(B.holen(name)),name);
 const quests=S.holen('SUBJECTS').flatMap(s=>s.items).filter(k=>S.holen('WORLDS')[k]);
 for(const k of quests){const a=S.holen('WORLDS')[k].build,b=B.holen('WORLDS')[k].build;assert.equal(String(a),String(b),k);}
});
test('actual common statuses reach Legend at zero stars across five subjects; one highest-title write and no repeated celebration',()=>{
 const keys=['numbers','round','combos','wordprob','detective','times','fractions','area','forces','units','graphs','opinion','sentences','examples','words','anleitung','library','poetry'];
 const ev=Object.fromEntries(keys.map((k,i)=>[k,titleRows(i<5?'E':'M')]));
 const S=titleApp({ev,total:0,rankPolicy:RANK_POLICY,rankSeen:'Explorer'},{bauart:'test'});
 assert.deepEqual(titlePlain(S.holen('rankProgress')()),p(18,5,5));assert.equal(S.$('#rankName').textContent,'Legend');assert.equal(S.holen('store').get('total',0),0);assert.equal(S.$('#rankNote').hidden,false);
 assert.deepEqual(events(S).map(e=>e.payload),[{rank:'Legend',policy:RANK_POLICY}]);S.holen('renderHome')();assert.equal(S.$('#rankNote').hidden,true);assert.equal(events(S).length,1);
 const R=titleApp({}, {bauart:'test',speicher:Object.fromEntries(S.ablage)});assert.equal(R.$('#rankName').textContent,'Legend');assert.equal(events(R).length,1);assert.equal(R.$('#rankNote').hidden,true);
});
