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
test('accepted Rounding module and app builder are byte-identical to the protected base',()=>{
  const path='src/module/rundungsfragen.mjs';
  assert.equal(fs.readFileSync(path,'utf8'),execFileSync('git',['show',`${REST_BASE}:${path}`],{encoding:'utf8'}));
  const slice=s=>s.slice(s.indexOf('const RND='),s.indexOf('/* ======================= PAST · WORD WORKSHOP'));
  assert.equal(slice(fs.readFileSync('index.html','utf8')),slice(execFileSync('git',['show',`${REST_BASE}:index.html`],{encoding:'utf8'})));
});
