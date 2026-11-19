import{test}from'node:test';import{ausV1,kontenEinsetzen}from'../../werkzeug/konten.mjs';import{appLesen}from'../../werkzeug/module.mjs';import{execFileSync}from'node:child_process';import assert from'node:assert/strict';
import{neulandCandidates,neulandLevel,withNeuland,createTodayRound}from'../../src/module/practise-heute.mjs';
import{appSandbox}from'../app-sandbox.mjs';import{committedApp}from'./ep01-rest-fixtures.mjs';
import{newEvent,checkEvent}from'../../src/module/ereignisse.mjs';import{derive}from'../../src/module/ableitung.mjs';
import{altStand,evProtokoll}from'../../src/module/lesen.mjs';
const BASE='2c1b1a434fd122efdae66222d49a49044782a554',plain=x=>JSON.parse(JSON.stringify(x));
const catalogURL='data:text/javascript;base64,'+Buffer.from(execFileSync('git',['show',BASE+':src/module/standardkatalog.mjs'])).toString('base64');
const eventSource=execFileSync('git',['show',BASE+':src/module/ereignisse.mjs'],{encoding:'utf8'}).replace("'./standardkatalog.mjs'",JSON.stringify(catalogURL));
const baselineEvents=await import('data:text/javascript;base64,'+Buffer.from(eventSource).toString('base64'));
const DAY='2026-11-18',secure=()=>Array.from({length:10},(_,i)=>['2026-11-'+(16+i%3),2,1]);
const eligible=S=>Array.from(S.holen('SUBJECTS')).flatMap(s=>Array.from(S.holen('questsIn')(s)));
function onlyNew(quest='numbers',options={}){
 const S=appSandbox({seed:18112026,...options}),ev=Object.fromEntries(eligible(S).filter(k=>k!==quest).map(k=>[k,secure()]));
 S.setzen('bq2_ev',ev);S.setzen('bq2_focusMode','manual');S.setzen('bq2_focusManual',['graphs']);return S;
}
function reachDiscovery(S){S.klick('#todayBtn');let q;for(let i=0;i<8;i++){q=S.zustand().round[S.zustand().idx];if(q.neuland)return q;S.frageBeantworten(q);S.klick('#nextBtn');}assert.fail('real Today round has no discovery');}
function again(S){S.klick('#quitBtn');S.klick('#todayBtn');return S.zustand().round.find(q=>q.neuland);}

test('EP02 actual Today replaces one normal card: one foundation discovery, eight distinct tasks, outside manual focus',()=>{
 const old=process.env.BQ_EP02_CONTROL==='old',S=onlyNew('numbers',old?{anpassen:()=>committedApp(BASE)}:{});
 S.klick('#todayBtn');const round=S.zustand().round;
 assert.equal(round.length,8);assert.equal(new Set(round.map(S.holen('qId'))).size,8);
 const discoveries=round.filter(q=>q.neuland);assert.equal(discoveries.length,1);
 assert.equal(discoveries[0].world,'numbers');assert.equal(S.holen('levelOf')(discoveries[0]),1);
 assert.equal(round[0].warmup,true);assert.ok(round.at(-1).challenge);
});
test('selection uses unpractised first, then the existing weakest stand; no secure fallback or clock',()=>{
 const h={ev:{old:[[DAY,1,0]],c:[[DAY,2,0]],m:secure()},attempts:[],tried:[],best:{}};
 const stand=k=>({old:'RS',c:'C',m:'M',fresh:'E'}[k]);
 assert.deepEqual(neulandCandidates(['m','c','old','fresh'],h,stand),['fresh','old','c']);
 assert.deepEqual(neulandCandidates(['m'],h,stand),[]);
 assert.deepEqual(neulandCandidates(['visited'],{tried:['visited']},()=> 'C'),['visited']);
 assert.equal(neulandLevel('visited',{tried:['visited']}),1,'a visit is no proof');
});
test('only explicit independent evidence advances; legacy/missing level or help never invents success',()=>{
 for(const a of[{ok:true,attempt:1},{level:1,ok:true,attempt:1},{level:1,ok:true,attempt:1,help:true},{level:1,ok:true,attempt:2,help:false},{level:1,ok:true,attempt:1,help:false,example:true}])assert.equal(neulandLevel('q',{attempts:[{skill:'q',...a}]}),1);
 assert.equal(neulandLevel('q',{ev:{q:[[DAY,1,1],[DAY,2,1]]}}),1,'legacy evidence has no independent marker');
 for(const level of[1,2,3])assert.equal(neulandLevel('q',{attempts:[{skill:'q',level,attempt:1,ok:true,help:false}]}),2,'demonstrated prior knowledge');
 assert.equal(neulandLevel('q',{ev:{q:[[DAY,1,1,true]]}}),2);
});
test('actual independent success survives reload and the 200-attempt cutoff; helped/retried success stays foundation',()=>{
 for(const mode of['self','hint','retry','answer']){
  const S=onlyNew(),q=reachDiscovery(S);
  if(mode==='hint')S.klick('#helpBtn');
  if(mode==='retry')S.klick('#qAnswers .opt[data-i="'+((q.answer+1)%q.options.length)+'"]');
  if(mode==='answer'){S.klick('#helpBtn');S.klick('#answerBtn');}else S.frageBeantworten(q);
  const ev=plain(S.holen('store').get('ev',{})).numbers;
  assert.equal(ev[0][3],mode==='self');
  const attempts=plain(S.holen('store').get('attempts',[]));assert.ok(attempts.some(a=>a.skill==='numbers'&&a.qid===S.holen('qId')(q)));
  assert.ok(attempts.every(a=>!Object.hasOwn(a,'neuland')),'no new wire field');
  if(mode!=='self')assert.ok(attempts.filter(a=>a.skill==='numbers'&&a.ok).every(a=>a.help));
  const reload=appSandbox({seed:7,speicher:Object.fromEntries(S.ablage)});
  reload.setzen('bq2_attempts',Array.from({length:200},()=>({skill:'graphs',level:2,attempt:1,ok:true,help:false})));
  reload.klick('#todayBtn');const next=reload.zustand().round.find(q=>q.neuland);
  assert.ok(next);assert.equal(next.world,'numbers');assert.equal(reload.holen('levelOf')(next),mode==='self'?2:1);
  const due=plain(S.holen('store').get('due',[]));assert.ok(due.every(d=>!d.q.neuland),'review copies do not get a second discovery badge');
 }
});
test('a resumed helped discovery keeps its assistance even when render resets transient hint state',()=>{
 const S=onlyNew(),q=reachDiscovery(S);S.klick('#helpBtn');assert.equal(q.assisted,true);
 S.holen('renderQuestion')();S.frageBeantworten(q);
 assert.equal(S.holen('store').get('ev',{}).numbers[0][3],false);
 assert.equal(S.holen('store').get('attempts',[]).at(-1).help,true);
});
test('all-M has normal fill; excluded subjects and locked previews cannot become discovery, also with manual focus',()=>{
 const S=onlyNew();S.setzen('bq2_ev',Object.fromEntries(eligible(S).map(k=>[k,secure()])));
 assert.equal(S.holen('buildToday')().filter(q=>q.neuland).length,0);
 // Isolated catalog fixture: only Science is a subject of this child. Focus
 // remains Maths deliberately; discovery eligibility must still use the catalog.
 S.holen('SUBJECTS').splice(0,S.holen('SUBJECTS').length,{key:'science',items:['forces','units','graphs']});
 S.setzen('bq2_ev',{});S.setzen('bq2_focusManual',['round','times']);
 for(let i=0;i<12;i++){
  const q=S.holen('buildToday')().find(q=>q.neuland);assert.ok(q);assert.ok(['forces','units','graphs'].includes(q.world));assert.notEqual(q.world,'times');
 }
});
// Isolated composition fixtures exercise the exact protected occupancy reported
// by Sentinel. They are not substituted for the actual app path tests above.
function mixerFixture(challenge=true,duplicateDue=false){
 let serial=0;const make=(world,level=2,flags={})=>({prompt:'fixture'+serial++,world,level,...flags});
 const worlds={};for(const k of['focus','new','gap'])worlds[k]={build:()=>[make(k,1),...Array.from({length:6},()=>make(k)),make(k,3)]};
 const subject={items:['focus','new','gap']},id=q=>q.prompt;
 return createTodayRound({focusTopics:()=>['focus','gap'],SUBJECTS:[subject],questsIn:s=>s.items,gapLaneQuests:()=>['gap'],standOf:k=>k==='focus'?(challenge?'M':'C'):'NA',pick:a=>a[0],WORLDS:worlds,levelOf:q=>q.level,dueToday:()=>[duplicateDue?{prompt:'fixture0',world:'focus',level:1,dueId:'d1'}:make('focus',2,{dueId:'d1'}),make('focus',2,{dueId:'d2'})],reshuffled:q=>q,schoolEvaluationQuestions:()=>[make('focus',2,{schoolRevision:'s1'}),make('focus',2,{schoolRevision:'s2'})],gapTasks:()=>[make('gap',1,{gap:true}),make('gap',2,{gap:true})],shuffle:a=>a.slice(),adaptRound:(k,r)=>r,insertInOrder:(a,b)=>a.concat(b),ohneDoppelte:r=>r,qId:id,neutralQ:q=>q,history:()=>({tried:['focus','gap']})});
}
test('eight protected cards defer; seven protected cards leave exactly one discovery slot',()=>{
 for(const challenge of[true,false]){
  const {round}=mixerFixture(challenge)();assert.equal(round.length,8);assert.equal(round.filter(q=>q.neuland).length,challenge?0:1);
  assert.equal(round.filter(q=>q.warmup).length,1);assert.equal(round.filter(q=>q.dueId).length,2);assert.equal(round.filter(q=>q.schoolRevision).length,2);assert.equal(round.filter(q=>q.gap).length,2);assert.equal(round.filter(q=>q.challenge).length,challenge?1:0);
 }
});
test('discovery never duplicates warm-up or crosses the gap quota; only a free normal slot is used',()=>{
 const round=[{id:'same',world:'new',level:1,warmup:true},{id:'n',world:'focus',level:2},...Array.from({length:6},(_,i)=>({id:'p'+i,world:i<2?'gap':'focus',level:2,gap:i<2,bridge:i>=2}))];
 const before=plain(round),result=withNeuland(round,{candidates:['gap','new'],history:{},build:k=>[{id:'same',world:k,level:1},{id:'different',world:k,level:1}],foundation:()=>null,level:q=>q.level,id:q=>q.id,gapQuests:['gap']});
 assert.deepEqual(round,before);assert.equal(result[0].id,'same');assert.equal(result[1].id,'different');assert.equal(result[1].world,'new');assert.equal(result.filter(q=>q.neuland).length,1);assert.equal(new Set(result.map(q=>q.id)).size,8);
});
test('pending bridges are placed before discovery; school tasks and final qIds survive',()=>{
 const pending=[{prompt:'help-a',world:'focus',level:1,bridge:true},{prompt:'help-b',world:'focus',level:1,bridge:true},{prompt:'help-c',world:'focus',level:2,bridge:true}];
 const plan=mixerFixture(false)(pending);assert.equal(plan.bridgesUsed,3);assert.equal(plan.round.length,8);assert.equal(plan.round.filter(q=>q.schoolRevision).length,2);assert.equal(plan.round.filter(q=>q.bridge).length,3);assert.equal(new Set(plan.round.map(q=>q.prompt)).size,8);
 assert.ok(plan.round.filter(q=>q.neuland).length<=1);
});
test('optional discovery evidence is valid, replayed and retained by legacy-base and incremental readers',()=>{
 const now=Date.parse('2026-11-18T12:00:00Z'),payload={day:DAY,skill:'numbers',level:1,attempt:1,ok:true,help:false,example:false,qid:'real-observation'};
 const event=newEvent({type:'answer',author:'p_k1',device:'d_a1',payload,at:'2026-11-18T11:00:00Z'},{rand:n=>new Uint8Array(n)});
 assert.deepEqual(checkEvent(event),[]);assert.deepEqual(baselineEvents.checkEvent(event),[],'the unchanged baseline validator accepts the new observation');
 const st=derive([event],{now});assert.deepEqual(st.ev.numbers,[[DAY,1,1,true]]);assert.equal(st.attempts[0].help,false);
 const base=altStand({ev:st.ev});assert.equal(base.ev.numbers[0][3],true);
 let events=[];const reader=evProtokoll({laden:()=>events,speichern:x=>events=x,now:()=>now});reader.stand();reader.schreiben([event]);assert.equal(reader.wert('ev').wert.numbers[0][3],true);reader.neuLaden();assert.equal(reader.wert('ev').wert.numbers[0][3],true);
 const helped={...event,payload:{...payload,help:true}};assert.equal(derive([helped],{now}).ev.numbers[0][3],false);
 const legacy={...event,payload:{...payload}};delete legacy.payload.help;assert.deepEqual(derive([legacy],{now}).ev.numbers,[[DAY,1,1]]);
});

test('all ten added entry families have three real distinct L1 cases, matching help and separate examples',()=>{
 const S=appSandbox({seed:17}),make=S.holen('neulandEntry'),ids=new Set();
 const keys=['poetry','finish','team','school','music','times','fractions','area','elapsed','mass'];
 for(const k of keys)for(let variant=0;variant<3;variant++){
  const q=make(k,variant);assert.equal(q.level,1);assert.equal(q.world,k);assert.ok(q.tip&&q.explain);
  assert.equal(new Set(q.options).size,q.options.length);const id=S.holen('qId')(q);assert.ok(!ids.has(id));ids.add(id);
  assert.equal(S.holen('guidance')(q,null,false).text,q.tip);
  const ex=S.holen('exampleFor')(q);assert.ok(ex,k+' example');assert.notEqual(ex.prompt,q.prompt);assert.notEqual(String(ex.answer),q.options[q.answer]);
  let expected;
  if(k==='times'){const m=/aria-label="(\d+) rows of (\d+) dots"/.exec(q.visual);expected=String(+m[1]* +m[2]);}
  if(k==='poetry')expected=String(q.prompt.split('<br>').length-2);
  if(k==='area')expected=String((q.visual.match(/<rect /g)||[]).length);
  if(k==='elapsed'){const m=/from (\d+):(\d+) to (\d+):(\d+)/.exec(q.prompt);expected=String(60*(+m[3]- +m[1])+ +m[4]- +m[2]);}
  if(k==='fractions'){const m=/bar in (\d+) equal parts, (\d+) coloured/.exec(q.visual);expected=m[2]+'/'+m[1];}
  if(expected!==undefined)assert.equal(q.options[q.answer],expected,'independent picture/prompt arithmetic');
 }
 assert.equal(ids.size,30);
});
test('new active/preview entries use the real Today slot and three variants survive two protected due collisions',()=>{
 for(const k of['poetry','finish','team','school','music','times','fractions','area','elapsed','mass']){
  const S=onlyNew(k);if(S.holen('isLocked')(k)){S.setzen('bq2_unlocked',[k]);S.setzen('bq2_ev',Object.fromEntries(eligible(S).filter(x=>x!==k).map(x=>[x,secure()])));}
  const make=S.holen('neulandEntry'),a=make(k,0),b=make(k,1);
  S.setzen('bq2_due',[a,b].map(q=>({id:S.holen('qId')(q),box:0,at:'2000-01-01',q})));
  S.klick('#todayBtn');const rd=S.zustand().round,q=rd.find(q=>q.neuland);
  assert.ok(q,k+': free genuine variant');assert.equal(q.world,k);assert.equal(q.level,1);assert.equal(q.foundationFamily,2);
  assert.equal(rd.filter(q=>q.dueId).length,2);assert.equal(rd.length,8);assert.equal(new Set(rd.map(S.holen('qId'))).size,8);
 }
});
test('all existing quest questions, IDs and help stay unchanged; W1 keeps numeric thresholds',()=>{
 const html=committedApp(BASE),before=appSandbox({seed:49,anpassen:()=>html}),after=appSandbox({seed:49});
 for(const k of Object.keys(before.holen('WORLDS')).filter(k=>k!=='today'&&!k.startsWith('mix_')))for(let round=0;round<6;round++){
  const a=before.holen('WORLDS')[k].build(),b=after.holen('WORLDS')[k].build();assert.deepEqual(plain(b),plain(a));assert.deepEqual(Array.from(b,after.holen('qId')),Array.from(a,before.holen('qId')));
 }
 for(const fn of['yearLevelEv','qId','guidance','exampleFor','bridgeFor','roundedQuestion'])assert.equal(String(after.holen(fn)),String(before.holen(fn)),fn+' protected code');
 assert.deepEqual(plain(after.holen('KEY')),{minAnswers:6,meetsAcc:.8,meetsN:6,extAcc:.7,extN:4},'W1 keeps quantity/accuracy, removes only days');
});
test('real event-writing build accepts new answers in the baseline validator and replays the same independent proof',()=>{
 const S=onlyNew('numbers',{bauart:'test'}),q=reachDiscovery(S);S.frageBeantworten(q);
 const events=plain(S.holen('evKindLog')(S.holen('evPre')()).liste()),answer=events.find(e=>e.type==='answer'&&e.payload.qid===S.holen('qId')(q));
 assert.ok(answer);assert.deepEqual(baselineEvents.checkEvent(answer),[]);
 const st=derive(events,{now:Date.now()});assert.deepEqual(plain(S.holen('store').get('ev',{})).numbers,st.ev.numbers);
 assert.equal(st.ev.numbers.at(-1)[3],true);assert.equal(neulandLevel('numbers',st),2);
});


test('existing child namespaces isolate discovery proof and survive a session switch and reload',()=>{
 const users=['alpha','beta'].map(user=>({user,role:'student',start:{salt:Array(16).fill(1),hash:'00'.repeat(32)}}));
 users.push({user:'parent',role:'parent',kinder:['alpha','beta'],start:{salt:Array(16).fill(2),hash:'11'.repeat(32)}});
 const accounts=ausV1({users}),html=kontenEinsetzen(appLesen('utf8'),accounts).toString('utf8');
 const S=appSandbox({seed:34,anpassen:()=>html});
 const session=user=>S.holen('store').set('session',{user,id:accounts.users.find(u=>u.user===user).id});
 session('alpha');const a=S.holen('childNs')();assert.ok(a);
 S.holen('recordAnswer')({world:'numbers',level:1},true);assert.equal(neulandLevel('numbers',{ev:S.holen('store').get('ev',{})}),2);
 session('beta');const b=S.holen('childNs')();assert.notEqual(a,b);assert.equal(neulandLevel('numbers',{ev:S.holen('store').get('ev',{})}),1);
 S.holen('recordAnswer')({world:'numbers',level:1,assisted:true},true);assert.equal(neulandLevel('numbers',{ev:S.holen('store').get('ev',{})}),1);
 session('alpha');assert.equal(neulandLevel('numbers',{ev:S.holen('store').get('ev',{})}),2);
 const reload=appSandbox({seed:35,anpassen:()=>html,speicher:Object.fromEntries(S.ablage)});
 assert.equal(reload.holen('childNs')(),a);assert.equal(neulandLevel('numbers',{ev:reload.holen('store').get('ev',{})}),2);
});


test('a warm-up/due duplicate is played once with both protected roles, never silently dropped by dedup',()=>{
 const {round}=mixerFixture(false,true)();assert.equal(round.length,8);assert.equal(new Set(round.map(q=>q.prompt)).size,8);
 assert.equal(round[0].warmup,true);assert.equal(round[0].dueId,'d1');assert.equal(round.filter(q=>q.dueId).length,2);
 assert.equal(round.filter(q=>q.schoolRevision).length,2);assert.equal(round.filter(q=>q.gap).length,2);
});
