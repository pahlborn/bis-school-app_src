// EP01 first slice, NOT full EP01 acceptance. All numeric source domains are
// finite and enumerated; sum generators use a proven sufficient-state quotient.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {appSandbox} from '../app-sandbox.mjs';
import {appLesen,moduleEinsetzen} from '../../werkzeug/module.mjs';
import {createRoundingQuestions,estimateWrongs,roundingWrongs,roundingReasonChoices} from '../../src/module/rundungsfragen.mjs';
import {discoverBanks,lengthQuality,qualityFailures,PENDING_BANKS,discoverMcCallsites,MC_CALLSITE_INVENTORY} from './ep01-qualitaet.mjs';
const BASE='c2ed934bf867bef58ae1c9338a414c9e23de5372';
const S=appSandbox({seed:18112026});
const names=['rnd','pick','shuffle','uniq','fmt','round10','round100','mc','two','fill3','benchLineSVG','randNotMid','retag','bankMC','RND','EXP'];
const deps=Object.fromEntries(names.map(n=>[n,S.holen(n)]));
const make=(extra={})=>createRoundingQuestions({...deps,...extra});
const number=s=>Number(String(s).replaceAll(',',''));
const numeric=(right,wrongs)=>({options:[right,...wrongs].map(n=>Number(n).toLocaleString('en-GB')),answer:0});
// Independently compare the two distances; this deliberately does not call round10/100.
function nearest(n,step){const below=n-n%step;return n-below<step/2?below:below+step;}
const domain=Array.from({length:799},(_,i)=>101+i).filter(n=>n%100!==0&&n%100!==50);
function checkNumeric(q,right,close){
  assert.equal(q.options.length,4,q.prompt);
  assert.equal(new Set(q.options.map(number)).size,4,q.prompt);
  assert.equal(number(q.options[q.answer]),right,q.prompt);
  assert.equal(q.options.filter(x=>number(x)===right).length,1,q.prompt);
  assert.ok(q.options.some((x,i)=>i!==q.answer&&number(x)===close),`missing opposite-neighbour/one-addend error: ${q.prompt}`);
}
const collections={ROUND_MC:make().ROUND_MC.map(r=>({options:[r[1],...r[2]],answer:0}))};
test('ROUND_MC: exactly one reviewed answer and a serious near miss in every row',()=>{
  const rows=make().ROUND_MC;
  assert.deepEqual(rows.map(r=>r[1]),['To estimate quickly and check the real answer','Find the halfway point 350: 347 is before it, so 300','400 and 500','582','350']);
  for(const r of rows){assert.equal(new Set([r[1],...r[2]]).size,4);assert.equal(r[2].length,3);}
  assert.match(rows[0][2][0],/exact total/); // estimate mistaken for an exact result
  assert.match(rows[1][2][0],/before it, so 400/); // correct midpoint, reversed decision
  assert.ok(rows[2][2].includes('400 and 600')); // skip a benchmark
  assert.ok(rows[3][2].includes('549')); // just below the 550 boundary
  assert.ok(rows[4][2].includes('349')); // one below the midpoint
});
for(const [name,step,inputs] of [
  ['roundWordQ',100,domain],
  ['roundTenQ',10,domain.filter(n=>n%10!==0&&n%10!==5)],
  ['roundThousandQ',1000,Array.from({length:8000},(_,i)=>1000+i).filter(n=>n%1000!==0&&n%1000!==500)]
]){
  test(`${name}: every permitted input, exact answer, four unique numeric options and a real opposite-neighbour error`,()=>{
    collections[name]=inputs.map(n=>{
      const q=make({randNotMid:()=>n,rnd:()=>n-1000})[name]();
      const right=nearest(n,step), below=n-n%step;
      checkNumeric(q,right,right===below?below+step:below);
      assert.equal(q.coach.n,n);assert.equal(q.coach.step,step);
      return q;
    });
    assert.equal(inputs.length,{roundWordQ:784,roundTenQ:640,roundThousandQ:7984}[name]);
  });
}
test('distance strategy: every input, swapped-distance and farther-neighbour errors, school model and no joke',()=>{
  collections.distanceExplainQ=domain.map(n=>{
    const q=make({randNotMid:()=>n}).distanceExplainQ(), c=roundingReasonChoices(n,100);
    assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
    assert.equal(q.options[q.answer],c.right);
    const lo=n-n%100,hi=lo+100,near=nearest(n,100),far=near===lo?hi:lo;
    assert.ok(c.right.endsWith(`so ${near} is nearer.`));
    assert.ok(c.wrongs.includes(`${n} is ${hi-n} from ${lo} and ${n-lo} from ${hi}, so ${far} is nearer.`));
    assert.ok(c.wrongs.includes(`${n} is ${n-lo} from ${lo} and ${hi-n} from ${hi}, so ${far} is nearer.`));
    assert.match(q.explain,/distance.*smaller distance.*halfway/s);
    assert.equal(q.coach.family,'round-explain');
    return q;
  });
});
// Quotient proof: estimateWrongs depends ONLY on exact sum, sum of independently
// rounded addends, and whether the first addend rounded up. Exhaustively fold the
// 784 possible addends into each distinct state (retain one real representative).
// Thus every attainable output of the 784^2 and 784^3 tuples is checked, including
// all collisions/fallbacks, without 482 million duplicate three-addend examples.
function sumStates(count){
  let states=domain.map(n=>({nums:[n],sum:n,right:nearest(n,100),up:nearest(n,100)>n}));
  for(let k=1;k<count;k++){
    const next=new Map();
    for(const a of states)for(const n of domain){
      const sum=a.sum+n,right=a.right+nearest(n,100),key=`${sum}/${right}/${a.up}`;
      if(!next.has(key))next.set(key,{nums:[...a.nums,n],sum,right,up:a.up});
    }
    states=[...next.values()];
  }
  return states;
}
for(const count of [2,3])test(`estimate of ${count} addends: exhaustive attainable states, round-each semantics and one-addend near miss`,t=>{
  const states=sumStates(count), qs=[];
  for(const s of states){
    const right=s.nums.map(n=>nearest(n,100)).reduce((a,b)=>a+b), wrongs=estimateWrongs(s.nums);
    assert.equal(wrongs.length,3);assert.equal(new Set(wrongs).size,3);assert.ok(!wrongs.includes(right));
    assert.ok(wrongs.includes(right+(s.up?-100:100)),'one addend rounded in the opposite direction');
    qs.push(numeric(right,wrongs));
  }
  // The real factory must wire those choices into the app question, not a dead helper.
  for(const s of [states[0],states[Math.floor(states.length/2)],states.at(-1)]){
    let i=0;const q=make({randNotMid:()=>s.nums[i++]} )[count===2?'estimateQ':'threeAddendsQ']();
    checkNumeric(q,s.right,s.right+(s.up?-100:100));
    assert.deepEqual([...q.options].sort(),[s.right,...estimateWrongs(s.nums)].map(deps.fmt).sort());
  }
  collections[count===2?'estimateQ':'threeAddendsQ']=qs;
  t.diagnostic(`attainable output states=${states.length}; source tuples=${domain.length**count}`);
});
test('ten-vs-hundred comparison: every input pair has one closer choice; equal-distance counterexample is rejected',t=>{
  const states=new Map();let checked=0,ties=0;
  for(const a of domain)for(const b of domain){
    if(a%10===5||b%10===5)continue;
    const exact=a+b,ta=nearest(a,10),tb=nearest(b,10),ha=nearest(a,100),hb=nearest(b,100);
    const td=Math.abs(ta+tb-exact),hd=Math.abs(ha+hb-exact);
    if(ta+tb===ha+hb)continue;
    if(td===hd){ties++;continue;}
    const key=[ta,tb,ha,hb,td<hd].join('/');
    if(!states.has(key))states.set(key,{a,b,answer:td<hd?0:1});
    checked++;
  }
  const qs=[];
  for(const {a,b,answer}of states.values()){
    let i=0;const q=make({randNotMid:()=>[a,b][i++]}).tenVsHundredQ();
    assert.equal(q.options.length,2);assert.equal(q.answer,answer);
    qs.push(q);
  }
  let i=0;const q=make({randNotMid:()=>[348,357,348,356][i++]}).tenVsHundredQ();
  assert.equal(i,4,'ambiguous 348+357 must be retried');assert.match(q.prompt,/348 \+ 356/);
  assert.equal(q.answer,1,'700 is closer to 704 than 710');
  collections.tenVsHundredQ=qs;
  t.diagnostic(`valid input pairs=${checked}; equal-distance exclusions=${ties}; distinct options/answer states=${states.size}`);
});
test('shared level2/3 reasons: zero, exact multiples, both sides, midpoint and every bridge number',()=>{
  const qs=[];
  for(const step of [10,100,1000])for(let n=0;n<=10000;n+=step/10){
    for(const level of [2,3]){
      const q=S.holen('roundedQuestion')('round',level,'round-explain',step,n);
      assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
      assert.equal(q.options[q.answer],roundingReasonChoices(n,step).right);
      if(n%step===step/2)assert.match(q.options[q.answer],/choose the higher multiple/);
      qs.push(q);
    }
    const wrongs=roundingWrongs(n,step);
    assert.equal(wrongs.length,3);assert.equal(new Set(wrongs).size,3);assert.ok(!wrongs.includes(nearest(n,step)));
  }
  collections.bridgeReasons=qs;
});
test('revised collections: <=1/3 strict longest AND fractional longest including ties (no humour/padding)',t=>{
  assert.equal(Object.keys(collections).length,9,'all finite collections ran before guard');
  if(process.env.BQ_EP01_COUNTERPROBE==='short-wrongs')collections.distanceExplainQ=collections.distanceExplainQ.map(q=>({options:[q.options[q.answer],'Wrong distance.','Always higher.','Always lower.'],answer:0}));
  for(const [name,qs]of Object.entries(collections))t.diagnostic(`${name}: ${JSON.stringify(lengthQuality(qs))}`);
  assert.deepEqual(qualityFailures(collections),[]);
});
test('quality guard distinguishes strict longest, ties and a short-wrong regression',()=>{
  assert.deepEqual(lengthQuality([{options:['123','456','789','012'],answer:0}]),{count:1,strict:0,tied:1,strictRate:0,longestShare:.25});
  assert.equal(lengthQuality([{options:['long','same','x','y'],answer:0}]).longestShare,.5);
  assert.equal(qualityFailures({bad:[{options:['The distances explain the nearer hundred.','Bigger.','Like it.','Guess.'],answer:0}]}).length,1);
});
test('future static MC collections cannot be silently unclassified; untouched violations stay explicit OPEN debt',t=>{
  const source=appLesen('utf8'), banks=discoverBanks(S,source);
  assert.deepEqual(Object.keys(banks).sort(),[...PENDING_BANKS,'ROUND_MC'].sort());
  assert.deepEqual(discoverMcCallsites(source),MC_CALLSITE_INVENTORY,'new MC generator needs explicit classification and coverage');
  assert.ok(discoverMcCallsites(source+'\nfunction futureQuest(){ return mc("New?","A",["B","C","D"],"Why"); }').includes('futureQuest'));
  const probe={holen:name=>name==='FUTURE_MC'?[['New?','A',['B','C','D'],'Why']]:S.holen(name)};
  assert.ok(discoverBanks(probe,source+'\nconst FUTURE_MC=[];').FUTURE_MC);
  t.diagnostic(`OPEN banks=${PENDING_BANKS.length}; measured violations=${qualityFailures(banks).length}. Run node tests/module/ep01-audit.mjs (expected exit1).`);
});
test('foundation and extraction-only generators match pinned original byte for byte, including qId and level wrappers',()=>{
  const oldSource=execFileSync('git',['show',`${BASE}:index.html`],{encoding:'utf8',maxBuffer:5e6});
  // New module exports are unused by the old source; its original local generators remain intact.
  const before=appSandbox({seed:18112026,anpassen:()=>moduleEinsetzen(oldSource)});
  const after=appSandbox({seed:18112026});
  const pack=(app,q)=>JSON.parse(JSON.stringify({q,id:app.holen('qId')(q)}));
  for(const step of [10,100,1000])for(let n=0;n<=10000;n+=step/10)for(const family of ['round','benchmark','round-explain'])for(const less of [true,false]){
    assert.deepEqual(pack(after,after.holen('roundedQuestion')('round',1,family,step,n,less)),pack(before,before.holen('roundedQuestion')('round',1,family,step,n,less)));
  }
  for(let i=0;i<100;i++)for(const name of ['nearestHundredQ','benchmarkQ','addendsQ','halfwayQ']){
    assert.deepEqual(pack(after,after.holen(name)()),pack(before,before.holen(name)()),name);
  }
  for(const step of [10,100,1000])for(const family of ['round','benchmark','round-explain'])for(const level of [1,2,3]){
    const q={world:'round',level,prompt:'baseline',options:['a','b'],answer:0,coach:{family,n:step*2.4,step,less:true}};
    const a=after.holen('bridgeFor')(q),b=before.holen('bridgeFor')(q);
    assert.deepEqual(pack(after,a[0]),pack(before,b[0]));assert.deepEqual(pack(after,a[1]),pack(before,b[1]));
    if(level===1||family!=='round-explain')assert.deepEqual(pack(after,a[2]),pack(before,b[2]));
  }
});
