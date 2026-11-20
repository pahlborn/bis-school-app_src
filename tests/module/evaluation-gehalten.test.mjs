// Invented criterion evaluations through the existing event, app and snapshot paths.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {newEvent,checkEvent} from '../../src/module/ereignisse.mjs';
import {derive,deriveSchool} from '../../src/module/ableitung.mjs';
import {gapSchoolRatings} from '../../src/module/lueckenverlauf.mjs';
import {makeSnapshot,stateFrom} from '../../src/module/schnappschuss.mjs';
import {appSandbox,stellbareUhr} from '../app-sandbox.mjs';
import {appLesen,modulUmwandeln} from '../../werkzeug/module.mjs';
import {ausV1,kontenEinsetzen} from '../../werkzeug/konten.mjs';
import {schuleEinsetzen} from '../../werkzeug/schule.mjs';

const DAY='2026-11-20',NOW=Date.parse(DAY+'T12:00:00Z'),plain=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const uuid=n=>'7d97af5e-6e19-46b8-85c6-'+String(n).padStart(12,'0');
const BEFORE_FIX='04323435adc92253397d0ef56f278d1d964fde69';
let prior;
function oldApp(){
  if(!prior){
    const get=path=>execFileSync('git',['show',BEFORE_FIX+':'+path],{encoding:'utf8',maxBuffer:8e6});
    const modules=JSON.parse(get('src/module/module.json')).module;
    const source=get('index.html').replace('/*BQ_MODULE*/',()=>modules.map(m=>modulUmwandeln(m.name,get('src/module/'+m.name+'.mjs'))).join('\n'));
    prior=appSandbox({bauart:'test',uhr:stellbareUhr(NOW),anpassen:()=>source});
  }
  return prior;
}
const document=(fields={})=>({child:'p_kind',evaluation:uuid(1),revision:uuid(2),title:'Invented criterion assessment',day:'2026-11-19',
  assessment:{area:'maths',goal:'',instructions:'',feedback:'',criteria:[{criterion:'Invented place value',rating:'C',standard:'M-N1'}]},...fields});
function history(){
  let n=0;const list=[];
  const add=(type,payload)=>{const e=newEvent({type,payload,author:'p_kind',device:'d_held',at:new Date(NOW+(++n)*10).toISOString()},{rand:k=>new Uint8Array(k).fill(n)});assert.deepEqual(checkEvent(e),[]);list.push(e);return e;};
  return {list,add,answer:(fields={})=>add('answer',{day:DAY,skill:'numbers',level:2,attempt:1,ok:true,qid:'invented-'+n,help:false,...fields})};
}
const proof=s=>s.gaps?.journey?.['M-N1']?.quests.numbers;
const users=[{user:'mia',role:'student',start:{salt:Array(16).fill(1),hash:'00'.repeat(32)}},{user:'papa',role:'parent',kinder:['mia'],start:{salt:Array(16).fill(2),hash:'11'.repeat(32)}}],accounts=ausV1({users});
function app(data,bauart='live',speicher={}){
  const html=schuleEinsetzen(kontenEinsetzen(appLesen('utf8',{bauart}),accounts),{version:1,kinder:{mia:data}},accounts).toString('utf8');
  const S=appSandbox({seed:19,bauart,uhr:stellbareUhr(NOW),speicher,anpassen:()=>html});
  S.holen('store').set('session',{user:'mia',id:accounts.users[0].id});return S;
}

test('criteria held: twelve genuine first answers reach M then held in app and replay',()=>{
  const v=history();v.add('school_evaluation',document());const S=app(deriveSchool(v.list,{now:NOW+1000}));
  for(let i=0;i<12;i++){
    S.holen('recordAnswer')({world:'numbers',level:2},true);v.answer();
    const p=proof(derive(v.list,{now:NOW+1000}));
    if(i===5){assert.ok(p?.reached,'criterion school source observes the actual reaching answer');assert.equal(p.checks.length,0);assert.equal(S.holen('standOf')('numbers'),'M');assert.equal(S.holen('openGaps')().length,1);}
    assert.deepEqual(plain(S.holen('gapData')().journey?.['M-N1']?.quests.numbers),p,'live projection and replay after answer '+i);
  }
  assert.ok(proof(derive(v.list,{now:NOW+1000})).held);assert.equal(S.holen('openGaps')().length,0);
  const R=app(deriveSchool(v.list,{now:NOW+1000}),'live',Object.fromEntries(S.ablage));assert.equal(R.holen('openGaps')().length,0);
  assert.deepEqual(plain(R.holen('gapData')().closed),plain(S.holen('gapData')().closed));
});

test('criteria held: four independent answers stay open; five of the next separate six hold',async()=>{
  const v=history();v.add('school_evaluation',document());for(let i=0;i<6;i++)v.answer();
  for(let i=0;i<6;i++)v.answer({help:i>=4});
  const early=derive(v.list,{now:NOW+1000}),p=proof(early);
  assert.equal(p.checks.length,6);assert.equal(p.checks.filter(x=>x.independent).length,4);assert.equal(p.held,undefined);
  const snap=await makeSnapshot(v.list,{now:NOW+500,author:'p_parent',device:'d_parent',rand:n=>new Uint8Array(n).fill(80)});
  const cut=v.list.length;for(let i=0;i<6;i++)v.answer({help:i===5});
  const full=derive(v.list,{now:NOW+1000}),held=proof(full);assert.ok(held.held);assert.equal(held.groups.length,1);assert.equal(held.groups[0].filter(x=>x.independent).length,4);assert.equal(held.checks.filter(x=>x.independent).length,5);
  const out=await stateFrom(v.list.slice(cut),snap,{now:NOW+1000});assert.equal(out.weg,'schnappschuss');assert.deepEqual(out.state,full);
});

test('criteria held: revision, withdrawal and later replacement import agree across every snapshot cut',async()=>{
  const v=history(),root=document();v.add('school_evaluation',root);for(let i=0;i<8;i++)v.answer();
  v.add('school_import',{asOf:'2026-11-18',data:{asOf:'2026-11-18',tasks:[{day:'2026-11-18',std:{'M-N3':'RS'}}]}});
  const edit=document({revision:uuid(3),base:root.revision,assessment:{...root.assessment,criteria:[{...root.assessment.criteria[0],rating:'RS'}]}});
  v.add('school_evaluation',edit);for(let i=0;i<4;i++)v.answer();
  const strong=document({revision:uuid(4),base:edit.revision,assessment:{...root.assessment,criteria:[{...root.assessment.criteria[0],rating:'M'}]}});
  v.add('school_evaluation',strong);v.answer();
  v.add('school_evaluation',{...strong,revision:uuid(5),base:strong.revision,withdrawn:true});
  v.add('school_import',{asOf:DAY,data:{asOf:DAY,tasks:[]}});
  const full=derive(v.list,{now:NOW+1000});assert.deepEqual(full.gaps.school,{});assert.equal(proof(full),undefined);
  for(let cut=1;cut<v.list.length;cut++){
    const prefix=derive(v.list.slice(0,cut),{now:NOW+1000});
    const part=derive(v.list.slice(cut),{now:NOW+1000,base:{upTo:v.list[cut-1].at,state:prefix}});
    assert.deepEqual(part,full,'snapshot cut '+cut);
  }
  const beforeStrong=derive(v.list.slice(0,15),{now:NOW+1000});assert.ok(proof(beforeStrong)?.held,'active corrected criterion remains the school source');
  const withStrong=derive(v.list.slice(0,16),{now:NOW+1000});assert.equal(withStrong.gaps.school['M-N1'].st,'M');assert.equal(proof(withStrong),undefined);
});

test('criteria held: legacy pilot, pending and withdrawn rows remain outside the regular source',()=>{
  const v=history();v.add('school_evaluation',{child:'p_kind',evaluation:uuid(11),revision:uuid(12),title:'Invented pilot',day:'2026-11-19',standard:'M-N5',rating:'C',focus:'two-step'});
  for(let i=0;i<12;i++)v.answer();const st=derive(v.list,{now:NOW+1000});assert.equal(st.gaps?.school?.['M-N5'],undefined);assert.equal(proof(st),undefined);
  const task=deriveSchool([history().add('school_evaluation',document())],{now:NOW+1000}).tasks[0];
  assert.deepEqual(gapSchoolRatings({tasks:[{...task,pending:true},{...task,manual:{...task.manual,withdrawn:true}}]}),{});
});

test('criteria held: actual pre-fix snapshots hydrate available roots before a later correction or withdrawal',async()=>{
  for(const withdrawn of[false,true]){
    const v=history(),root=document();v.add('school_evaluation',root);for(let i=0;i<8;i++)v.answer();
    if(withdrawn)v.add('gap_state',{standard:'M-N1',state:'closed',by:'parents',schoolDay:root.day,day:DAY});
    const snap=plain(await oldApp().holen('makeSnapshot')(v.list,{now:NOW+500,author:'p_parent',device:'d_parent',rand:n=>new Uint8Array(n).fill(81)}));
    assert.equal(snap.payload.state.gaps.schoolSource,undefined,'prefix is produced by the actual accepted pre-fix implementation');
    assert.equal(snap.payload.state.ev.numbers.length,8);
    v.add('school_evaluation',document({revision:uuid(3),base:root.revision,withdrawn,assessment:{...root.assessment,criteria:[{...root.assessment.criteria[0],rating:'RS'}]}}));
    for(let i=0;i<4;i++)v.answer();
    const full=derive(v.list,{now:NOW+1000}),out=await stateFrom(v.list,snap,{now:NOW+1000});
    assert.equal(out.weg,'schnappschuss');assert.deepEqual(out.state,full,'pre-fix prefix and available original source remain equivalent');
    assert.equal(out.state.ev.numbers.length,12,'old answers are not replayed twice');
    if(withdrawn){assert.equal(proof(out.state),undefined);assert.equal(out.state.gaps.closed['M-N1'].by,'parents','a historical parent closure is preserved');}
    else{assert.equal(out.state.gaps.school['M-N1'].st,'RS');assert.equal(proof(out.state).total,12);assert.equal(proof(out.state).checks.length,6);assert.ok(proof(out.state).held);}
  }
});

test('criteria held: an old prefix plus an orphan correction never invents a source or holding proof',async()=>{
  const v=history();for(let i=0;i<8;i++)v.answer();
  const snap=plain(await oldApp().holen('makeSnapshot')(v.list,{now:NOW+500,author:'p_parent',device:'d_parent',rand:n=>new Uint8Array(n).fill(82)}));
  const cut=v.list.length,root=document();v.add('school_evaluation',document({revision:uuid(3),base:root.revision}));for(let i=0;i<4;i++)v.answer();
  const out=await stateFrom(v.list.slice(cut),snap,{now:NOW+1000});assert.equal(out.weg,'schnappschuss');
  assert.deepEqual(out.state.gaps.school,{});assert.equal(proof(out.state),undefined);assert.equal(out.state.ev.numbers.length,12);
  const last=v.list.at(-1).at,knownRoot=v.add('school_evaluation',root);
  const recovered=derive([knownRoot],{now:NOW+1000,base:{upTo:last,state:out.state}});
  assert.equal(recovered.gaps.school['M-N1'].st,'C','a later actual root makes the real source usable');assert.equal(recovered.ev.numbers.length,12);
});
