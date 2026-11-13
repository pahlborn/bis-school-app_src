import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClaudeEvaluationGateway as create, validateClaudeEvaluation } from '../server/claude-evaluation-gateway.mjs';
const url='https://test.invalid/v1/evaluation/extract';
const source='Assessment Criteria\nRounds whole numbers to nearest 100 C';
const row={criterion:'Rounds whole numbers to nearest 100',rating:'C',evidence:'Rounds whole numbers to nearest 100 C'};
const evaluation={title:'Rounding',date:'',goal:'',instructions:'',feedback:'',criteria:[row],missing:[]};
const req=(body={childId:'p_child',source})=>new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
function fixture(overrides={}){
 const calls=[];
 const options={authorize:async()=>({role:'parent',parentId:'p_parent',children:['p_child']}),
   reserveQuota:async()=>true,privacyGate:async s=>s,
   apiKey:['sk','ant','dummy-for-local-test'].join('-'),
   fetchClaude:async (url,opts)=>{calls.push({url,opts});return new Response(JSON.stringify({stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(evaluation)}]}),{status:200});},...overrides};
 return {handle:create(options),calls,options};
}
test('missing trusted security adapters fails closed',async()=>{
 assert.equal((await create()(req())).status,503);
 for(const field of ['authorize','reserveQuota','privacyGate','apiKey']){
   const f=fixture({[field]:undefined});assert.equal((await f.handle(req())).status,503);assert.equal(f.calls.length,0);
 }
});
test('parent verification and membership block untrusted claims',async()=>{
 for(const authorize of [async()=>{throw Error('invalid');},async()=>({role:'child',parentId:'p_parent',children:['p_child']}),
 async()=>({role:'parent',parentId:'p_parent',children:['p_other']})]){
  const f=fixture({authorize});assert.ok([401,403].includes((await f.handle(req())).status));assert.equal(f.calls.length,0);
 }
 const f=fixture();assert.equal((await f.handle(req({childId:'p_other',source}))).status,403);
 assert.equal((await f.handle(req({childId:'p_child',source,role:'parent'}))).status,400);
});
test('server privacy and quota checks precede provider call',async()=>{
 const a=fixture({privacyGate:async()=>null});
 assert.equal((await a.handle(req())).status,422);assert.equal(a.calls.length,0);
 const b=fixture({reserveQuota:async()=>false});
 assert.equal((await b.handle(req())).status,429);assert.equal(b.calls.length,0);
 const c=fixture({reserveQuota:async()=>{throw Error('unavailable');}});
 assert.equal((await c.handle(req())).status,503);assert.equal(c.calls.length,0);
 const d=fixture();assert.equal((await d.handle(req({childId:'p_child',source:'Student ID: 123\n'+source}))).status,422);
});
test('success: fixed provider endpoint and secret only in upstream header',async()=>{
 const f=fixture();const r=await f.handle(req());assert.equal(r.status,200);
 assert.deepEqual((await r.json()).evaluation,evaluation);
 assert.equal(f.calls.length,1);
 assert.equal(f.calls[0].url,'https://api.anthropic.com/v1/messages');
 assert.equal(f.calls[0].opts.headers.authorization,'Bearer '+f.options.apiKey);
 assert.equal(r.headers.get('cache-control'),'no-store');
});
test('unsupported rating and invented evidence are rejected',async()=>{
 assert.equal(validateClaudeEvaluation(evaluation,source),true);
 for(const changes of [{rating:'E'},{rating:'F'},{evidence:'Absent evidence'},{criterion:'Invented criterion'}])
  assert.equal(validateClaudeEvaluation({...evaluation,criteria:[{...row,...changes}]},source),false);
});
test('bounded inputs and upstream errors do not leak source',async()=>{
 const f=fixture({fetchClaude:async()=>new Response('provider diagnostic',{status:500})});
 assert.equal((await f.handle(req({childId:'p_child',source:'x'.repeat(49000)}))).status,400);
 const r=await f.handle(req());assert.equal(r.status,502);
 assert.doesNotMatch(await r.text(),/Assessment Criteria|provider diagnostic/);
});
