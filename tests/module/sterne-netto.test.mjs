// Fixed Numbers-only case promoted from Sentinel's reported counterexample after Peter's explicit acceptance.
// This is the author's implementation regression, not independent QA or a universal two-star cap.
import{test}from'node:test';import assert from'node:assert/strict';
import{titleApp,titlePlain as plain}from'./titel-fixtures.mjs';import{stellbareUhr}from'../app-sandbox.mjs';
const DAY='2026-11-20',catalogue=titleApp(),eligible=Array.from(catalogue.holen('SUBJECTS')).flatMap(s=>Array.from(catalogue.holen('questsIn')(s)));
const history=Object.fromEntries(eligible.map(k=>[k,Array.from({length:6},()=>[DAY,2,1,true])])),initial={ev:history,total:0,treeStage:1,rankPolicy:'knowledge.v1',rankSeen:'Explorer',focusMode:'manual',focusManual:['numbers']};
function round(S,quest,errors=[]){S.holen('startRound')(quest);const trace=[];while(S.zustand().screen==='play'){
 const st=S.zustand(),q=st.round[st.idx],at=st.idx,before=S.holen('earnedRound')(),first={id:S.holen('qId')(q),level:S.holen('levelOf')(q),roles:plain(Object.fromEntries(['dueId','neuland','gap','challenge','bridge'].map(k=>[k,q[k]??null])))};
 if(errors.includes(at)){
  if(q.kind==='mc')S.klick('#qAnswers .opt[data-i="'+((q.answer+1)%q.options.length)+'"]');else if(q.kind==='type'){for(const c of String(Number(q.answer)+1))S.klick('#qAnswers .key[aria-label="'+c+'"]');S.klick('#qAnswers .key.go');}else{for(const i of q.correct.slice().reverse())S.klick('#qAnswers .ord[data-i="'+i+'"]');S.klick('#checkOrder');}
  if(!st.answered)S.klick('#answerBtn');assert.equal(st.results[at],false);
 }else S.frageBeantworten(q);
 trace.push({...first,earned:S.holen('earnedRound')()-before});S.klick('#nextBtn');assert.ok(trace.length<=8);
 }assert.equal(trace.length,8);return{trace,earned:S.holen('earnedRound')()};}
test('accepted direct0 + following-day PT0vs2: actual due schedule, full reload, help bridges, unchanged commonM and no new first bonus',()=>{
 const output=[];
 for(const errors of[[],[0,1]]){
  const S=titleApp(initial,{seed:404,bauart:'test',seite:true,uhr:stellbareUhr(Date.parse(DAY+'T12:00:00Z'))}),direct=round(S,'numbers',errors);
  assert.equal(direct.earned,0);assert.equal(S.holen('standOf')('numbers'),'M');assert.equal(S.holen('dueToday')().length,0);assert.equal(S.holen('store').get('bridgeNext',[]).length,0);
  const due=plain(S.holen('store').get('due',[]));assert.equal(due.length,errors.length);assert.ok(due.every(d=>d.at==='2026-11-21'));
  const fullStorage=Object.fromEntries(S.ablage);
  const R=titleApp({}, {seed:505,bauart:'test',seite:true,uhr:stellbareUhr(Date.parse('2026-11-21T12:00:00Z')),speicher:fullStorage});
  const pt=round(R,'today');assert.equal(R.holen('standOf')('numbers'),'M');assert.equal(pt.trace.filter(q=>q.roles.dueId).length,errors.length);assert.equal(pt.trace.filter(q=>q.roles.neuland||q.roles.gap||q.roles.challenge||q.level===3).length,0);
  assert.equal(R.holen('starRewards').read().bonuses.length,0);assert.equal(R.holen('store').get('total'),errors.length);assert.deepEqual(plain(R.holen('eventErrors')),[]);output.push({direct,pt});
 }
 assert.deepEqual(output.map(a=>a.pt.earned),[0,2]);assert.deepEqual(output[0].direct.trace.slice(0,2).map(q=>q.id),output[1].direct.trace.slice(0,2).map(q=>q.id));assert.equal(output[1].direct.trace.filter(q=>q.roles.bridge).length,3);
});
