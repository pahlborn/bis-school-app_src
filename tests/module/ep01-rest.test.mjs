import{test}from'node:test';import assert from'node:assert/strict';
import{execFileSync}from'node:child_process';import fs from'node:fs';
import{appSandbox,text}from'../app-sandbox.mjs';import{appLesen}from'../../werkzeug/module.mjs';
import{discoverBanks,qualityFailures,lengthQuality,PENDING_BANKS}from'./ep01-qualitaet.mjs';
import{REST_BASE,committedApp,foundationDigest}from'./ep01-rest-fixtures.mjs';
const plain=x=>JSON.parse(JSON.stringify(x));
const oldHtml=committedApp();
test('EP01 remaining static banks: complete reviewed row inventory, unique options and <=1/3 longest',t=>{
  const old=process.env.BQ_EP01_REST_CONTROL==='old';
  const S=appSandbox({seed:18112026,...(old?{anpassen:()=>oldHtml}:{})}),source=old?oldHtml:appLesen('utf8');
  const banks=discoverBanks(S,source);
  assert.deepEqual(Object.keys(banks).sort(),[...PENDING_BANKS,'ROUND_MC'].sort());
  const counts={ANL_MC:10,CHAMP_MC:13,COMPLETE_MC:6,COOP_MC:4,HYPO:8,INFER:7,LIB_MC:15,MUS_MC:14,NOW_MC:17,OPFACT:18,OPINION_MC:8,OREO_MC:10,POE_MC:8,PREFIX:7,RESP_MC:6,ROUND_MC:5,SCH_MC:10,SCI:26,SCI_READ:4,SPECIFIC:6,STK_MC:6,SUFFIX:7,TEAM_MC:5,TRIP_MC:6,WPR_MC:4};
  for(const[name,qs]of Object.entries(banks)){
    assert.equal(qs.length,counts[name],name+': new rows require explicit content review');
    for(const q of qs)assert.equal(new Set(q.options).size,q.options.length,name+': unique alternatives');
    t.diagnostic(name+': '+JSON.stringify(lengthQuality(qs)));
  }
  assert.deepEqual(qualityFailures(banks),[]);
});
test('foundation/help remains identical to protected base, including text level1 rows and real examples',()=>{
  const before=appSandbox({seed:18112026,anpassen:()=>oldHtml}),after=appSandbox({seed:18112026});
  const digest=foundationDigest(after);
  assert.deepEqual(digest,{count:69713,sha256:'aab00e3fbad1e9eede3022f366f70fd030297aaa30d73a2a9dc4831029a4468b'});
  assert.deepEqual(digest,foundationDigest(before));
  for(const name of['HYPO','OREO_MC','OPINION_MC'])assert.deepEqual(plain(after.holen(name).filter(r=>r[4]===1)),plain(before.holen(name).filter(r=>r[4]===1)));
  assert.deepEqual(plain(after.holen('SPECIFIC').filter(r=>r[3]===1)),plain(before.holen('SPECIFIC').filter(r=>r[3]===1)));
  assert.deepEqual(plain(after.holen('OPFACT').filter(r=>r.level===1)),plain(before.holen('OPFACT').filter(r=>r.level===1)));
});
test('AM/PM actual example paths survive any non-foundation answer-format revision',()=>{
  const before=appSandbox({seed:7,anpassen:()=>oldHtml}),after=appSandbox({seed:7});
  for(let row=0;row<12;row++){
    before.holen('Math').random=after.holen('Math').random=()=>row/12+.00001;
    const a=before.holen('ampm')(),b=after.holen('ampm')();
    const oldExample=before.holen('exampleFor')(a),newExample=after.holen('exampleFor')(b);
    assert.ok(oldExample,'real base help example');assert.deepEqual(plain(newExample),plain(oldExample));
  }
});
test('all Rounding source except the named open halfwayQ function, and its builder, remain byte-identical',()=>{
  const path='src/module/rundungsfragen.mjs';
  const protect=s=>s.replace(/function halfwayQ\([\s\S]*?\n}/,'/* separately reviewed open halfwayQ family */');
  assert.equal(protect(fs.readFileSync(path,'utf8')),protect(execFileSync('git',['show',`${REST_BASE}:${path}`],{encoding:'utf8'})));
  const slice=s=>s.slice(s.indexOf('const RND='),s.indexOf('/* ======================= PAST · WORD WORKSHOP'));
  assert.equal(slice(fs.readFileSync('index.html','utf8')),slice(execFileSync('git',['show',`${REST_BASE}:index.html`],{encoding:'utf8'})));
});

test('confirmed Dahl counterexample: NOW/POE author choices contain exactly one Dahl book',()=>{
  const dahl=new Set(['Charlie and the Chocolate Factory','The BFG','Matilda','The Witches','The Twits','George’s Marvellous Medicine']);
  const app=appSandbox({seed:1});
  for(const name of['NOW_MC','POE_MC'])for(const index of[2,3]){
    const row=app.holen(name)[index],titles=[row[1],...row[2]];
    assert.equal(titles.filter(t=>dahl.has(t)).length,1,name+': exactly one Roald Dahl title');
  }
  const prior=appSandbox({seed:1,anpassen:()=>committedApp('68edad04b1fc70e407ff42694f6ddc947b7ad6fb')});
  const wrong=prior.holen('NOW_MC')[3];
  assert.equal([wrong[1],...wrong[2]].filter(t=>dahl.has(t)).length,2,'real rejected checkpoint had both BFG and Matilda');
});

test('revised numeric halfwayQ preserves every original worked-example availability and body',()=>{
  const before=appSandbox({seed:8,anpassen:()=>oldHtml}),after=appSandbox({seed:8});
  for(let interval=0;interval<8;interval++)for(let position=0;position<8;position++){
    const values=[(interval+.001)/8,.75,(position+.001)/8];
    for(const app of[before,after]){let i=0;app.holen('Math').random=()=>values[i++]??0;}
    const oldQ=before.holen('halfwayQ')(),newQ=after.holen('halfwayQ')();
    assert.deepEqual(plain(after.holen('exampleFor')(newQ)),plain(before.holen('exampleFor')(oldQ)));
  }
});

test('unit comparison removes the confirmed shortest/position cue and preserves its help and other conversions',()=>{
  const before=appSandbox({seed:1,anpassen:()=>committedApp('cbb3711f2b4c3fb1518d9d98348c2310e333925e')}),after=appSandbox({seed:1});
  const build=(app,draws)=>{let i=0;app.holen('Math').random=()=>draws[i++]??.123;return app.holen('convertQ')();};
  const measure=s=>{const m=/^(\d+) (cm|m)$/.exec(s);assert.ok(m,'actual length operand');return +m[1]*(m[2]==='m'?100:1);};
  const positions=new Set(),relations=new Set(),qs=[];
  for(let n=0;n<6;n++){
    const old=build(before,[.8,(n+.001)/6]),oldHelp=plain(before.holen('exampleFor')(old));
    assert.equal(old.answer,1,'rejected checkpoint fixed the solution at position two');
    assert.ok(old.options[old.answer].length<old.options[0].length,'rejected checkpoint had a uniquely shortest solution');
    for(let side=0;side<2;side++)for(let j3=0;j3<3;j3++)for(let j2=0;j2<2;j2++){
      const q=build(after,[.8,(n+.001)/6,(side+.001)/2,(j3+.001)/3,(j2+.001)/2]);
      const m=/^Compare lengths: (\d+ (?:cm|m)) ___ (\d+ (?:cm|m))\./.exec(text(q.prompt));assert.ok(m);
      const a=measure(m[1]),b=measure(m[2]),sign=a<b?'<':a>b?'>':'=';
      assert.equal(q.options.filter(o=>o===sign).length,1);assert.equal(q.options[q.answer],sign);
      assert.deepEqual([...q.options].sort(),['<','=','>']);assert.ok(q.options.every(o=>o.length===1));
      assert.deepEqual(plain(after.holen('exampleFor')(q)),oldHelp,'same original 150cm/1m example');
      positions.add(q.answer);relations.add(sign);qs.push(q);
    }
  }
  assert.equal(qs.length,72);assert.equal(positions.size,3);assert.equal(relations.size,2);
  assert.deepEqual(qualityFailures({comparison:qs}),[]);assert.ok(Math.abs(lengthQuality(qs).longestShare-1/3)<1e-12);
  // All 43 cases in the other branches retain their exact task, id and help.
  for(const draws of[[.01],...Array.from({length:4},(_,i)=>[.3,(i+.001)/4]),...Array.from({length:38},(_,i)=>[.6,(i+.001)/38])]){
    const a=build(before,draws),b=build(after,draws);
    assert.deepEqual(plain(b),plain(a));assert.equal(after.holen('qId')(b),before.holen('qId')(a));
    assert.deepEqual(plain(after.holen('exampleFor')(b)),plain(before.holen('exampleFor')(a)));
  }
});
