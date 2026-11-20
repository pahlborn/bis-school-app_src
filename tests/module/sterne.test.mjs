import{test}from'node:test';import assert from'node:assert/strict';
import{starLedger,starProjection,mergeStarLedger}from'../../src/module/sterne.mjs';
import{newEvent,checkEvent}from'../../src/module/ereignisse.mjs';import{derive}from'../../src/module/ableitung.mjs';
import{makeSnapshot,stateFrom}from'../../src/module/schnappschuss.mjs';import{altStand}from'../../src/module/lesen.mjs';
import{titleApp,titlePlain as plain,TITLE_PRE}from'./titel-fixtures.mjs';
const DAY='2026-11-20',good=(n=6)=>Array.from({length:n},()=>[DAY,2,1,true]);
function complete(S){while(S.zustand().screen==='play'){S.frageBeantworten(S.zustand().round[S.zustand().idx]);S.klick('#nextBtn');}}
function discoveryApp(bauart='test'){
 const A=titleApp({}, {bauart,seite:true}),eligible=Array.from(A.holen('SUBJECTS')).flatMap(s=>Array.from(A.holen('questsIn')(s)));
 return titleApp({total:7,ev:Object.fromEntries(eligible.map(k=>[k,k==='numbers'?[[DAY,2,0,false]]:good()])),focusMode:'manual',focusManual:['numbers','round','combos']},{bauart,seite:true});
}
function reachDiscovery(S){S.holen('startRound')('today');for(let i=0;i<8;i++){const q=S.zustand().round[S.zustand().idx];if(q.neuland)return q;S.frageBeantworten(q);S.klick('#nextBtn');}assert.fail('actual Today round must contain its existing discovery slot');}
for(const bauart of['live','test'])test(`${bauart}: safe normal8/8 keeps raw best8, old13 stars, no currency/treat/rain; paid results are idempotent`,()=>{
 const S=titleApp({total:13,ev:{numbers:good()}},{bauart,seite:true});S.holen('startRound')('numbers');complete(S);
 assert.equal(S.zustand().stars,8);assert.equal(S.holen('store').get('best_numbers'),8);assert.equal(S.holen('store').get('total'),13);assert.equal(S.$('#resScore').textContent,'8');assert.equal(S.$('#resEarned').textContent,'0 stars earned');assert.equal(S.$('#treat').querySelectorAll('[data-treat]').length,0);assert.ok(S.$('#treat [data-star-next]'));assert.equal(S.$('#treat [data-star-challenge]'),null,'no ready L3 family: offer the actual PT route only');assert.equal(S.$('#confetti').dataset.runs,undefined);
 const count=bauart==='test'?S.holen('evKindZielLog')(TITLE_PRE).liste().length:0;S.holen('showResults')();assert.equal(S.holen('store').get('total'),13);if(bauart==='test')assert.equal(S.holen('evKindZielLog')(TITLE_PRE).liste().length,count);
 const A=titleApp({}, {bauart,seite:true});A.holen('startRound')('numbers');complete(A);const paid=A.holen('store').get('total'),ledger=plain(A.holen('store').get('starLedger'));assert.ok(paid>=6);assert.ok(A.$('#treat [data-treat="word"]'));A.holen('showResults')();assert.equal(A.holen('store').get('total'),paid);assert.deepEqual(plain(A.holen('store').get('starLedger')),ledger);
});
test('migration uses common M/E, complete old evidence and known full windows; no best/title shortcut or invented cut history',()=>{
 for(const [rows,expected]of[[good().concat([[DAY,2,0],[DAY,2,0]]),true],[good(20).concat(Array.from({length:20},()=>[DAY,2,0]),Array.from({length:20},()=>[DAY,1,0])),true],[good().concat(Array.from({length:14},()=>[DAY,2,0]),Array.from({length:40},()=>[DAY,1,0])),false],[Array.from({length:60},()=>[DAY,1,1]),false],[Array.from({length:8},()=>[DAY,2,0]),false]]){
  const S=titleApp({ev:{numbers:rows},best_numbers:8,rankSeen:'Legend'},{seite:true});assert.equal(S.holen('starRewards').read().secure.includes('numbers'),expected);
  if(expected&&S.holen('standOf')('numbers')!=='M')assert.equal(S.holen('starRewards').card('numbers','de'),'⭐ in Practise Today');
 }
});
test('previous unsuccessful discovery remains bonus-eligible; first real right discovery pays exactly once with help',()=>{
 for(const bauart of['live','test']){
  const S=discoveryApp(bauart),q=reachDiscovery(S);assert.equal(q.world,'numbers');assert.equal(S.zustand().starOffer.bonus,true);const before=S.holen('store').get('total');S.holen('showHint')();S.frageBeantworten(q);
  assert.equal(S.zustand().bonusStars,1);assert.equal(S.holen('store').get('total'),before+1);assert.ok(S.holen('starRewards').read().bonuses.includes('numbers'));S.klick('#nextBtn');complete(S);
  const total=S.holen('store').get('total');assert.ok(total>before+1);S.holen('showResults')();assert.equal(S.holen('store').get('total'),total);assert.equal(S.holen('starRewards').offer({...q,neuland:true},true).bonus,false);assert.deepEqual(plain(S.holen('eventErrors')),[]);
 }
});
test('two actual offline first-solution claims merge once; replay/base/snapshot never repay; old answers alone grant no bonus',async()=>{
 const claims=[];for(let i=0;i<2;i++){const S=discoveryApp(),q=reachDiscovery(S);S.frageBeantworten(q);claims.push(...plain(S.holen('evKindZielLog')(TITLE_PRE).liste()).filter(e=>e.type==='discovery_bonus'));}
 assert.equal(claims.length,2);assert.notEqual(claims[0].id,claims[1].id);const now=Date.now()+10000,full=derive(claims,{now});assert.equal(full.total,1);assert.deepEqual(full.starLedger.bonuses,['numbers']);
 assert.equal(derive(claims.concat(claims),{now}).total,1);const base=altStand({...full,total:14}),later={...claims[1],id:'e_'+'a'.repeat(24),at:new Date(now+1).toISOString()};assert.equal(derive([later],{now:now+10,base:{upTo:new Date(now).toISOString(),state:base}}).total,14);
 const snapshot=await makeSnapshot(claims,{now,author:'p_parent',device:'d_parent'});assert.equal((await stateFrom([],snapshot,{now:now+1000})).state.total,1);
 const old=newEvent({type:'answer',author:claims[0].author,device:claims[0].device,at:claims[0].at,payload:{day:DAY,skill:'numbers',level:1,attempt:1,ok:true,help:false}});assert.equal(derive([old],{now}).total,0);assert.equal(derive([old],{now}).starLedger,undefined);
});
test('original L3 and gap/PT roles pay once even with help; normal fallen direct stays0, reveal pays0',()=>{
 const S=titleApp({ev:{round:good()},starLedger:{secure:['round']}},{seite:true}),R=S.holen('starRewards');
 for(const q of[{world:'round',level:3,assisted:true},{world:'round',level:1,gap:true,assisted:true},{world:'round',level:2,dueId:'due',neuland:true}])assert.equal(R.offer(q,true).stars,1);
 assert.equal(R.offer({world:'round',level:2,dueId:'due'},false).stars,0);assert.equal(R.offer({world:'round',level:1},false).stars,0);
 S.holen('startRound')('round');S.holen('showHint')();S.holen('showWorked')();assert.equal(S.zustand().stars,0);assert.equal(S.holen('earnedRound')(),0);
});
test('reward schema stays strict; only observed payment metadata is unioned',()=>{
 const round='r_'+'a'.repeat(24),event=newEvent({type:'round_reward',author:'p_kid',device:'d_kid',at:DAY+'T10:00:00Z',payload:{day:DAY,round,skill:'numbers',correct:8,stars:0,count:8}});assert.deepEqual(checkEvent(event),[]);
 for(const payload of[{...event.payload,stars:9},{...event.payload,correct:9},{...event.payload,round:'x'},{...event.payload,extra:true}])assert.ok(checkEvent({...event,payload}).length);
 const old={total:13,best_numbers:7},one=starProjection(old,'round_reward',event.payload);assert.equal(one.total,13);assert.equal(one.best_numbers,8);assert.deepEqual(starProjection({...old,...one},'round_reward',event.payload),{});
 assert.deepEqual(mergeStarLedger({secure:['numbers'],bonuses:['numbers']},{secure:['round'],bonuses:['numbers']}),{secure:['numbers','round'],solved:[],bonuses:['numbers'],rounds:[]});assert.deepEqual(starLedger(null),{secure:[],solved:[],bonuses:[],rounds:[]});
});
test('challenge shortcut respects eligible focus and pending help; declining its first offer writes no invalid empty reward',()=>{
 const S=titleApp({ev:{numbers:good(),round:good()},focusMode:'manual',focusManual:['numbers']},{bauart:'test',seite:true});
 assert.equal(S.holen('readyRewardChallenge')(),null,'Numbers-only focus offers no unavailable L3');
 S.setzen(TITLE_PRE+'focusManual',['round']);const choice=S.holen('readyRewardChallenge')();assert.equal(choice.quest,'round');assert.equal(choice.question.level,3);
 S.setzen(TITLE_PRE+'bridgeNext',[S.holen('bridgeFor')(choice.question)[0]]);assert.equal(S.holen('readyRewardChallenge')(),null,'pending help keeps priority');S.setzen(TITLE_PRE+'bridgeNext',[]);
 S.holen('startRewardChallenge')(choice);S.klick('#skipChallenge');assert.equal(S.holen('earnedRound')(),0);assert.deepEqual(plain(S.holen('eventErrors')),[]);
});
test('school M/E is observed through the common getter; parent reading never emits reward markers or grants currency',()=>{
 for(const st of['M','E']){
  const school={asOf:DAY,tasks:[{day:DAY,area:'math',title:'Synthetic school starting value',std:{'M-N1':st},quests:['numbers'],focusNext:[],good:{de:'',en:''},next:{de:'',en:''}}]},S=titleApp({}, {school,bauart:'test',seite:true});
  assert.equal(S.holen('standOf')('numbers'),st);assert.ok(S.holen('starRewards').read().secure.includes('numbers'));assert.equal(S.holen('starRewards').offer({world:'numbers',level:2},false).stars,0);
  S.holen('loginDone')(S.holen('APP_ACCOUNTS').users.find(u=>u.user==='papa'));const events=plain(S.holen('evKindZielLog')(TITLE_PRE).liste()),before=JSON.stringify([...S.ablage]);S.holen('starRewards').observe();S.holen('renderHome')();assert.equal(JSON.stringify([...S.ablage]),before);assert.deepEqual(plain(S.holen('evKindZielLog')(TITLE_PRE).liste()),events);
 }
});
test('EP04 parent guide copy describes offered help rewards and knowledge titles in DE/US-EN',()=>{
 const S=titleApp();for(const lang of['de','en']){
  const html=S.holen(lang==='de'?'ABOUT_DE':'ABOUT_EN')(),copy=S.holen('PARENT_REWARD_COPY')[lang];assert.ok(html.includes(copy.secondRight));assert.ok(html.includes(copy.titles));
  assert.doesNotMatch(html,/<b>Zweiter Versuch richtig:<\/b> ein Stern|<b>Second try right:<\/b> a star/);assert.doesNotMatch(html,/Titel, Lernbaum und Abzeichen<\/b>.*nie Ergebnisse|Titles, learning tree and badges<\/b>.*never results/);
  assert.match(copy.secondRight,lang==='de'?/vor der Aufgabe.*auch mit Hilfe/:/shown before the task.*with help/);assert.match(copy.titles,lang==='de'?/neuen Titeln.*sicheren Quests.*nicht nach Sternen.*Titel bleiben.*neuen Anforderungen/:/New title promotions.*secure quests.*not stars.*Earned titles stay.*requirements are not met/);
 }
});
