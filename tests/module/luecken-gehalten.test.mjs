// Synthetic histories; real app getters and existing event/snapshot format.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {appSandbox,stellbareUhr} from '../app-sandbox.mjs';
import {appLesen} from '../../werkzeug/module.mjs';
import {committedApp} from './ep01-rest-fixtures.mjs';
import {ausV1,kontenEinsetzen} from '../../werkzeug/konten.mjs';import {schuleEinsetzen} from '../../werkzeug/schule.mjs';
import {derive} from '../../src/module/ableitung.mjs';import {newEvent,checkEvent} from '../../src/module/ereignisse.mjs';
import {makeSnapshot,stateFrom} from '../../src/module/schnappschuss.mjs';
const DAY='2026-11-19',NOW=Date.parse(DAY+'T12:00:00Z'),plain=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const users=[{user:'mia',role:'student',start:{salt:Array(16).fill(1),hash:'00'.repeat(32)}},{user:'papa',role:'parent',kinder:['mia'],start:{salt:Array(16).fill(2),hash:'11'.repeat(32)}}],accounts=ausV1({users});
const school=(day='2026-11-18',rating='RS')=>({asOf:day,tasks:[{day,area:'math',title:'Synthetic held regression',std:{'M-N1':rating},quests:['numbers'],focusNext:[],good:{de:'',en:''},next:{de:'',en:''}}]});
function fixture({data=school(),speicher={},bauart='live',uhr=stellbareUhr(NOW)}={}){
 const source=process.env.BQ_HELD_CONTROL==='old'?committedApp('dfd354f131260dae12de6ad9dfd06a5c1708d04a'):appLesen('utf8',{bauart});
 const html=schuleEinsetzen(kontenEinsetzen(source,accounts),{version:1,kinder:{mia:data}},accounts).toString('utf8');
 const S=appSandbox({seed:19,uhr,speicher,bauart,anpassen:()=>html});S.holen('store').set('session',{user:'mia',id:accounts.users.find(u=>u.user==='mia').id});return S;
}
const answer=(S,ok=true,extra={})=>S.holen('recordAnswer')({world:'numbers',level:2,...extra},ok);
const proof=S=>plain(S.holen('gapData')().journey?.['M-N1']?.quests.numbers);
function events(data=school()){
 let id=0;const list=[];const add=(type,payload)=>{const e=newEvent({type,payload,author:'p_kind',device:'d_test',at:new Date(NOW+(++id)*10).toISOString()},{rand:n=>new Uint8Array(n).fill(id%255)});list.push(e);assert.deepEqual(checkEvent(e),[]);return e;};
 add('school_import',{asOf:data.asOf,data});return{list,add,answer:(ok=true,extra={})=>add('answer',{day:DAY,skill:'numbers',level:2,attempt:1,ok,qid:'synthetic-'+id,help:false,...extra})};
}
test('M reaching answer is excluded; live/replay at every step and snapshot continuation agree at 5/6',async()=>{
 const S=fixture(),v=events();for(let i=0;i<12;i++){
  const ok=i!==9;answer(S,ok);v.answer(ok);const st=derive(v.list,{now:NOW+1e4});assert.deepEqual(proof(S),st.gaps.journey['M-N1'].quests.numbers);
  if(i===5){assert.equal(S.holen('standOf')('numbers'),'M');assert.equal(S.holen('openGaps')().length,1);assert.equal(proof(S).checks.length,0);}
  if(i===10)assert.equal(S.holen('openGaps')().length,1);
 }
 assert.equal(proof(S).checks.filter(x=>x.ok).length,5);assert.equal(S.holen('openGaps')().length,0);
 const full=derive(v.list,{now:NOW+1e4}),snap=await makeSnapshot(v.list.slice(0,9),{now:NOW+500,author:'p_eltern',device:'d_parent',rand:n=>new Uint8Array(n).fill(99)});
 const restored=await stateFrom(v.list.slice(9),snap,{now:NOW+1e4});assert.equal(restored.weg,'schnappschuss');assert.deepEqual(restored.state,full);
});
test('four correct of the next six stay open without a date or pause gate',async()=>{
 const S=fixture();for(let i=0;i<6;i++)answer(S);for(let i=0;i<6;i++)answer(S,i<4);
 assert.equal(proof(S).checks.length,6);assert.equal(proof(S).held,undefined);assert.equal(S.holen('openGaps')().length,1);
 await S.uhr.vor(31*864e5);const R=fixture({speicher:Object.fromEntries(S.ablage),uhr:S.uhr});assert.deepEqual(proof(R),proof(S));assert.equal(R.holen('openGaps')().length,1);
});
test('original L1 and assisted first answers count; hints/examples/retries add no task',()=>{
 const v=events();for(let i=0;i<6;i++)v.answer();v.answer(false,{attempt:0,hintShown:true,help:true});v.answer(false,{attempt:0,exampleShown:true,help:true});
 for(let i=0;i<6;i++){v.answer(true,{level:i%2?2:1,help:i%2===1});v.answer(true,{attempt:2,help:true});}
 const p=derive(v.list,{now:NOW+1e4}).gaps.journey['M-N1'].quests.numbers;assert.equal(p.total,12);assert.equal(p.checks.length,6);assert.ok(p.held);assert.equal(p.checks.filter(x=>x.help).length,3);
});
test('legacy three/four-field evidence does not invent reaching time or held proof',()=>{
 for(const fields of[3,4]){const S=fixture();S.setzen(S.holen('storeKey')('ev'),{numbers:Array.from({length:60},()=>[DAY,2,1,...fields===4?[true]:[]])});
  assert.equal(S.holen('standOf')('numbers'),'M');assert.equal(S.holen('openGaps')().length,1);assert.equal(proof(S),undefined);
  answer(S);assert.deepEqual(proof(S).reached,{day:DAY,kind:'observed'});assert.equal(proof(S).complete,false);assert.equal(proof(S).checks.length,1,'M was known before the first new answer');
  for(let i=0;i<5;i++)answer(S);assert.equal(S.holen('openGaps')().length,0,'six, not seven, new answers after observed legacy M');
 }
});
test('closed remains closed after later errors; only a newer weak school rating reopens',()=>{
 const S=fixture();for(let i=0;i<12;i++)answer(S);assert.equal(S.holen('openGaps')().length,0);const c=plain(S.holen('gapData')().closed['M-N1']);
 for(let i=0;i<25;i++)answer(S,false);assert.equal(S.holen('openGaps')().length,0);assert.deepEqual(plain(S.holen('gapData')().closed['M-N1']),c);assert.equal(S.holen('standOf')('numbers'),'RS');
 const R=fixture({data:school('2026-11-19'),speicher:Object.fromEntries(S.ablage)});assert.equal(R.holen('openGaps')().length,1);
 const M=fixture({data:school('2026-11-19','M'),speicher:Object.fromEntries(S.ablage)});assert.equal(M.holen('openGaps')().length,0);
});
test('legacy closures and parent holds remain readable and block automatic closing',()=>{
 for(const by of['app','parents']){const S=fixture();S.holen('store').set('gaps',{closed:{'M-N1':{at:DAY,by,schoolDay:'2026-11-18'}},active:null});assert.equal(S.holen('openGaps')().length,0);assert.equal(proof(S),undefined);}
 const S=fixture();S.holen('store').set('gaps',{closed:{},hold:{'M-N1':{at:DAY,schoolDay:'2026-11-18'}},active:'M-N1'});for(let i=0;i<12;i++)answer(S);
 assert.ok(proof(S).held);assert.equal(S.holen('openGaps')()[0].held,true);assert.equal(S.holen('gapData')().closed['M-N1'],undefined);
});
test('actual event-reading app replays existing answer events into the same held trace',()=>{
 const S=fixture({bauart:'test'}),v=events();for(let i=0;i<12;i++)v.answer();S.setzen(S.holen('evPre')()+'events',v.list);
 assert.equal(S.holen('standOf')('numbers'),'M');assert.equal(proof(S).checks.length,6);assert.ok(proof(S).held);assert.equal(S.holen('openGaps')().length,0);
 assert.deepEqual(plain(S.holen('store').get('ev',{})),derive(v.list,{now:NOW+1e4}).ev);assert.deepEqual(plain(S.holen('eventErrors')),[]);
});

test('a valid partial school_evaluation preserves the imported gap context through a snapshot',()=>{
 const v=events();for(let i=0;i<8;i++)v.answer();const early=derive(v.list,{now:NOW+1e4}),cut=v.list.at(-1).at;
 v.add('school_evaluation',{child:'p_kind',evaluation:'7d97af5e-6e19-46b8-85c6-d3c950a77680',revision:'7d97af5e-6e19-46b8-85c6-d3c950a77681',title:'Synthetic manual school update',day:DAY,standard:'M-N5',rating:'C',focus:'two-step'});
 for(let i=0;i<4;i++)v.answer();
 const full=derive(v.list,{now:NOW+1e4}),part=derive(v.list.filter(e=>e.at>cut),{now:NOW+1e4,base:{upTo:cut,state:early}});
 assert.deepEqual(part,full);assert.equal(full.gaps.school['M-N1'].st,'RS');assert.equal(full.gaps.school['M-N5'],undefined,'existing manual ratings do not open standard gaps');assert.ok(full.gaps.journey['M-N1'].quests.numbers.held);
});
test('a complete replacement school import stops removed-topic tracking in live, full and snapshot replay',()=>{
 const S=fixture(),v=events();for(let i=0;i<2;i++){answer(S);v.answer();}
 const early=derive(v.list,{now:NOW+1e4}),cut=v.list.at(-1).at,oldProof=proof(S),replacement={asOf:DAY,tasks:[]};
 const R=fixture({data:replacement,speicher:Object.fromEntries(S.ablage)});answer(R);
 v.add('school_import',{asOf:DAY,data:replacement});v.answer();
 const full=derive(v.list,{now:NOW+1e4}),part=derive(v.list.filter(e=>e.at>cut),{now:NOW+1e4,base:{upTo:cut,state:early}});
 assert.deepEqual(part,full);assert.deepEqual(full.gaps.school,{});assert.deepEqual(full.gaps.journey['M-N1'].quests.numbers,oldProof);assert.deepEqual(proof(R),oldProof,'removed source gets no new live/replayed observation');assert.equal(R.holen('openGaps')().length,0);
});
test('correcting the same historical sheet item replaces its gap observation and survives a snapshot cut',async()=>{
 const v=events();for(let i=0;i<6;i++)v.answer();
 const q={world:'numbers',kind:'type',prompt:'Synthetic sheet item',answer:'4',level:2};
 v.add('sheet_created',{sheet:'s1',day:DAY,no:1,items:[{q}],writing:'en'});
 v.add('sheet_result',{sheet:'s1',index:0,res:'no',day:DAY,qid:'sheet-q'});
 const before=derive(v.list,{now:NOW+1e4}),cut=v.list.at(-1).at;assert.equal(before.gaps.journey['M-N1'].quests.numbers.total,7);
 v.add('sheet_result',{sheet:'s1',index:0,res:'help',day:DAY,qid:'sheet-q'});
 const full=derive(v.list,{now:NOW+1e4}),p=full.gaps.journey['M-N1'].quests.numbers;
 assert.equal(p.total,7);assert.equal(p.checks.length,1);assert.equal(p.checks[0].ok,true);assert.equal(full.ev.numbers.length,7);assert.equal(full.attempts.filter(a=>a.sheet).length,1);
 assert.deepEqual(derive(v.list.filter(e=>e.at>cut),{now:NOW+1e4,base:{upTo:cut,state:before}}),full);
});
test('the actual child writer uses unchanged wire fields and reload preserves the six following answers',async()=>{
 const S=fixture({bauart:'test'}),v=events();S.setzen(S.holen('evPre')()+'events',v.list);
 await S.uhr.vor(100); // the imported assessment precedes this device's real writer clock
 for(let i=0;i<12;i++){
  answer(S);S.holen('logAttempt')({day:DAY,skill:'numbers',level:2,attempt:1,ok:true,qid:'actual-writer-'+i,help:false});
 }
 const all=plain(S.holen('evKindLog')(S.holen('evPre')()).liste());assert.equal(all.filter(e=>e.type==='answer').length,12);
 for(const e of all.filter(e=>e.type==='answer'))assert.deepEqual(checkEvent(e),[]);
 assert.equal(proof(S).checks.length,6);assert.ok(proof(S).held);assert.deepEqual(plain(S.holen('eventErrors')),[]);
 const R=fixture({bauart:'test',speicher:Object.fromEntries(S.ablage)});assert.deepEqual(proof(R),proof(S));
});

test('parent closure before M records later errors as later, never as a new opening',()=>{
 const v=events();v.answer();v.add('gap_state',{standard:'M-N1',state:'closed',by:'parents',schoolDay:'2026-11-18',day:DAY});v.answer(false);
 const st=derive(v.list,{now:NOW+1e4});assert.equal(st.gaps.closed['M-N1'].by,'parents');assert.equal(st.gaps.journey['M-N1'].quests.numbers.later.length,1);assert.equal(st.gaps.journey['M-N1'].quests.numbers.later[0].ok,false);
});
test('assisted correct original L1 is described as help and counts as one following task',()=>{
 const S=fixture();for(let i=0;i<6;i++)answer(S);answer(S,true,{level:1,assisted:true});assert.equal(proof(S).checks.length,1);assert.equal(proof(S).checks[0].help,true);
});

test('held baseline control: six actual first answers reach M but must leave the gap open',()=>{
 const S=fixture();for(let i=0;i<6;i++)answer(S);assert.equal(S.holen('standOf')('numbers'),'M');assert.equal(S.holen('openGaps')().length,1,'M reaching is not holding');
});
