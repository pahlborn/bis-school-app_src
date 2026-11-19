// Synthetic histories exercise the real common status and gap getters.
import{test}from'node:test';import assert from'node:assert/strict';
import{appSandbox,stellbareUhr}from'../app-sandbox.mjs';import{committedApp}from'./ep01-rest-fixtures.mjs';
import{appLesen}from'../../werkzeug/module.mjs';import{ausV1,kontenEinsetzen}from'../../werkzeug/konten.mjs';import{schuleEinsetzen}from'../../werkzeug/schule.mjs';
const BASE='444a0cf8652ea0e3d2b8cf5f2afb3918827bfb20',DAY='2026-11-19',plain=x=>JSON.parse(JSON.stringify(x));
const rows=(n,level,right=n)=>Array.from({length:n},(_,i)=>[DAY,level,i<right?1:0]);
const set=(S,e,attempts)=>{S.setzen(S.holen('storeKey')('ev'),{numbers:e});if(attempts)S.setzen(S.holen('storeKey')('attempts'),attempts);};
function school(rating='RS'){
 const users=[{user:'mia',role:'student',start:{salt:Array(16).fill(1),hash:'00'.repeat(32)}},{user:'papa',role:'parent',kinder:['mia'],start:{salt:Array(16).fill(2),hash:'11'.repeat(32)}}],accounts=ausV1({users});
 const data={version:1,kinder:{mia:{asOf:'2026-11-18',tasks:[{day:'2026-11-18',area:'math',title:'Synthetic assessment',std:{'M-N1':rating},quests:['numbers'],focusNext:[],good:{de:'',en:''},next:{de:'',en:''}}]}}};
 const html=schuleEinsetzen(kontenEinsetzen(appLesen('utf8'),accounts),data,accounts).toString('utf8');
 const S=appSandbox({seed:19,anpassen:()=>html});S.holen('store').set('session',{user:'mia',id:accounts.users.find(u=>u.user==='mia').id});return S;
}
test('W1 actual common status and parent/gap progress reach M from six same-day year-level successes',()=>{
 const old=process.env.BQ_W1_CONTROL==='old',S=appSandbox({seed:19,...old?{anpassen:()=>committedApp(BASE)}:{}});set(S,rows(6,2));
 assert.equal(S.holen('standOf')('numbers'),'M');assert.equal(S.holen('assessQuest')('numbers').level,'m');assert.equal(S.holen('questProgress')('numbers').frac,1);
});
test('all quantity/accuracy boundaries retain NA/RS/C/M/E, independent of dates and three/four-field records',()=>{
 const cases=[['NA',rows(5,2)],['M',rows(6,2)],['M',rows(10,2,8)],['C',rows(10,2,7)],['C',rows(6,2,3)],['RS',rows(6,2,2)],['C',rows(6,1,5)],['RS',rows(6,1,4)],['E',rows(6,2).concat(rows(10,3,7))],['M',rows(6,2).concat(rows(10,3,6))],['E',rows(6,2).concat(rows(4,3,3))],['M',rows(6,2).concat(rows(3,3))],['C',rows(5,2).concat(rows(4,3))]];
 const S=appSandbox({seed:19});assert.deepEqual(plain(S.holen('KEY')),{minAnswers:6,meetsAcc:.8,meetsN:6,extAcc:.7,extN:4});
 for(const removed of['minDays','meetsDays','extDays'])assert.equal(Object.hasOwn(S.holen('KEY'),removed),false);
 for(const [want,records]of cases)for(const dates of['single','spread','month'])for(const fields of[3,4]){
  const e=records.map((r,i)=>[dates==='spread'?'2026-11-'+String(10+i%3):dates==='month'?'2026-10-19':DAY,r[1],r[2],...(fields===4?[r[2]===1]:[])]);set(S,e);
  assert.equal(S.holen('standOf')('numbers'),want,want+'/'+dates+'/'+fields);assert.equal(S.holen('assessQuest')('numbers').level,want==='NA'?'na':want.toLowerCase());
  assert.equal(S.holen('questProgress')('numbers').frac===1,['M','E'].includes(want));assert.deepEqual(plain(S.holen('store').get('ev',{}).numbers),e,'raw evidence unchanged');
 }
});
test('last20 year-level and last12 challenge windows remain exact',()=>{
 const S=appSandbox({seed:19});
 set(S,rows(1,2).concat(rows(20,2,15)));assert.equal(S.holen('standOf')('numbers'),'C','old correct answer outside last20 cannot raise 75%');
 set(S,rows(20,2,16).concat(rows(1,3),rows(12,3,8)));assert.equal(S.holen('standOf')('numbers'),'M','old challenge outside last12 cannot raise 8/12');
 set(S,rows(20,2,16).concat(rows(12,3,9)));assert.equal(S.holen('standOf')('numbers'),'E');
});
test('school M/E applies through five observations, then six wrong own answers override it immediately',()=>{
 for(const rating of['M','E']){const S=school(rating);for(const n of[0,5,6]){
  set(S,rows(n,2,0));const want=n<6?rating:'RS',a=S.holen('assessQuest')('numbers');assert.equal(S.holen('standOf')('numbers'),want);assert.equal(a.level,want.toLowerCase());assert.equal(a.schoolBase,n<6);
  if(n<6)for(const lang of['de','en']){S.holen('store').set(S.holen('langKey')(),lang);assert.match(S.holen('basisHTML')(a),lang==='de'?/Ausgangspunkt laut Schule/:/Starting point from school/);}
 }}
});
test('real assisted answers remain support and cannot manufacture M/E',()=>{
 const S=appSandbox({seed:19});for(let i=0;i<6;i++)S.holen('recordAnswer')({world:'numbers',level:2,assisted:true},true);
 const e=plain(S.holen('store').get('ev',{}).numbers);assert.ok(e.every(r=>r[1]===1&&r[3]===false));assert.equal(S.holen('standOf')('numbers'),'C');
});
test('parent/gap shares M at six even with few detail records; quantity labels never veto knowledge',()=>{
 const S=school('RS');set(S,rows(5,2));assert.equal(S.holen('openGaps')().length,1);assert.ok(S.holen('questProgress')('numbers').frac<1);assert.ok(!S.holen('focusNeed')().includes('numbers'),'weak school starting point uses the active-gap path');
 set(S,rows(6,2));const a=S.holen('assessQuest')('numbers');assert.equal(a.level,'m');assert.equal(a.sure,'few');assert.equal(a.evidenceN,6);assert.match(S.holen('basisHTML')(a),/6 saved answers|6 gespeicherte Antworten/);
 assert.equal(S.holen('questProgress')('numbers').frac,1);assert.equal(S.holen('openGaps')().length,1,'M alone is not the separate held proof');assert.equal(S.holen('store').get('gaps',{}).closed?.['M-N1'],undefined);
 S.setzen(S.holen('storeKey')('gaps'),{closed:{},hold:{'M-N1':{at:DAY,schoolDay:'2026-11-18'}},active:'M-N1'});
 const g=S.holen('openGaps')()[0];assert.equal(g.held,true);assert.equal(S.holen('gapProgress')(g).frac,1);assert.doesNotMatch(S.holen('gapProgressHTML')(g),/more practice days|Übungstage/);
 set(S,rows(6,2,0));assert.ok(S.holen('focusNeed')().includes('numbers'),'six actual own failures use the existing app-support focus path');
});
test('month pause and reload retain knowledge; dates remain descriptive and saved rewards stay intact',async()=>{
 const uhr=stellbareUhr(Date.parse(DAY+'T12:00:00Z'));const S=appSandbox({seed:19,uhr}),e=rows(6,2).concat(rows(4,3,3));set(S,e,e.map(r=>({day:r[0],skill:'numbers',level:r[1],attempt:1,ok:!!r[2],help:false})));
 const values={total:123,treeStage:5,rankSeen:'Professor',unlocked:['times'],badges:{thinker:7}};for(const[k,v]of Object.entries(values))S.holen('store').set(k,v);
 await uhr.vor(31*864e5);assert.equal(S.holen('standOf')('numbers'),'E');assert.equal(S.holen('assessQuest')('numbers').level,'e');assert.equal(S.holen('assessQuest')('numbers').old,true);
 const R=appSandbox({seed:20,uhr,speicher:Object.fromEntries(S.ablage)});assert.equal(R.holen('standOf')('numbers'),'E');for(const[k,v]of Object.entries(values))assert.deepEqual(plain(R.holen('store').get(k)),v);
});
test('unrelated review/reward/help and EP02 algorithms stay byte-identical to accepted baseline',()=>{
 const old=appSandbox({seed:19,anpassen:()=>committedApp(BASE)}),S=appSandbox({seed:19});
 for(const name of['observeAttempt','logAttempt','score','showResults','rememberWrong','advanceDue','dueToday','queueBridge','bridgeFor','exampleFor','guidance','qId','buildToday','neulandEntry','gapAct'])assert.equal(String(S.holen(name)),String(old.holen(name)),name);
});
