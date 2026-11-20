// EP03-QA-F01: preserve the independently supplied real arrival/write sequence.
import{test}from'node:test';import assert from'node:assert/strict';
import{titleApp,titlePlain,TITLE_PRE,TITLE_KID,TITLE_DAY,TITLE_ACCOUNTS}from'./titel-fixtures.mjs';import{stellbareUhr}from'../app-sandbox.mjs';
import{evSchreiber}from'../../src/module/schreiber.mjs';import{derive}from'../../src/module/ableitung.mjs';
import{newEvent,checkEvent}from'../../src/module/ereignisse.mjs';import{evProtokoll,altStand}from'../../src/module/lesen.mjs';
import{makeSnapshot,stateFrom}from'../../src/module/schnappschuss.mjs';import{newPersonKeys,publicKeysOf}from'../../src/module/krypto.mjs';import{signEvent,acceptAll}from'../../src/module/annahme.mjs';
import{TITLE_TEXT}from'../../src/module/titel.mjs';
const AT=Date.parse('2026-11-20T12:00:00Z'),NOW=AT+1000;
function boot(total=0,offset=0){const S=titleApp({total},{bauart:'test',uhr:stellbareUhr(AT+offset)});return titlePlain(S.holen('evKindZielLog')(TITLE_PRE).liste());}
function later(initial,titlePolicy,secondMigration=true){let list=initial.slice();const writer=evSchreiber({read:()=>list,write:l=>list=l,device:'d_QA2',who:()=>({person:TITLE_KID.id,role:'child'}),now:()=>AT-100,...titlePolicy?{titlePolicy}:{} });
 for(const[type,payload]of[['round_done',{day:TITLE_DAY,skill:'numbers',stars:8,count:8}],['rank_seen',{rank:'Legend'}],...secondMigration?[['rank_seen',{rank:'Legend',policy:'legacy.v1'}]]:[]])assert.equal(writer.write(type,payload).ok,true);
 return list;
}
test('F01 original actual boot + current writer: known cut, -100ms, 8 stars, unmarked Legend, second conversion; cold replay stays Explorer',async()=>{
 const initial=boot();assert.equal(initial.length,1);assert.deepEqual(initial[0].payload,{rank:'Explorer',policy:'legacy.v1'});const all=later(initial);
 assert.equal(all.at(-1).payload.after,initial[0].id);assert.equal(all[1].at,'2026-11-20T11:59:59.900Z');assert.equal(all[3].at,'2026-11-20T11:59:59.902Z','the device clock is not moved');for(const e of all)assert.deepEqual(checkEvent(e),[]);
 for(const order of[all,all.toReversed(),all.slice(2).concat(all.slice(0,2))]){const cold=derive(order,{now:NOW});assert.equal(cold.rankSeen,'Explorer');assert.equal(cold.total,8);}
 let local=initial;const reader=evProtokoll({laden:()=>local,speichern:x=>local=x,now:()=>NOW});assert.equal(reader.stand().rankSeen,'Explorer');for(const e of all.slice(1)){reader.schreiben([...local,e]);assert.equal(reader.stand().rankSeen,'Explorer');}reader.neuLaden();assert.equal(reader.stand().rankSeen,'Explorer');
 const snap=await makeSnapshot(initial,{now:NOW,author:'p_parent',device:'d_parent'}),restored=await stateFrom(all,snap,{now:NOW+1000});assert.equal(restored.state.rankSeen,'Explorer');assert.equal(restored.state.total,8,'late events remain raw learning data');
});
test('F01/F02 signed snapshot-only current writer: known policy acts before projection, with/without another migration and with legitimate knowledge upgrades',async()=>{
 const initial=boot(130);assert.equal(initial[0].payload.rank,'Professor');const parent=TITLE_ACCOUNTS.users.find(u=>u.user==='papa').id;
 const snapshot=await makeSnapshot(initial,{now:NOW,author:parent,device:'d_parent'}),keys=await newPersonKeys(),admission={area:'kind:lern:'+TITLE_KID.id,members:{[parent]:{role:'parent',pub:await publicKeysOf(keys),devices:['d_parent']}}};
 const accepted=await acceptAll([await signEvent(snapshot,admission.area,keys)],admission);assert.equal(accepted.angenommen.length,1);assert.equal(accepted.verworfen.length,0);
 const raw=s=>{const copy={...s};delete copy.rankSeen;delete copy.rankPolicy;return copy;};
 for(const secondMigration of[false,true]){
  const all=later([snapshot],null,secondMigration);if(secondMigration)assert.equal(all.at(-1).payload.after,snapshot.id);for(const e of all)assert.deepEqual(checkEvent(e),[]);
  const restored=await stateFrom(all,snapshot,{now:NOW+1000});assert.equal(restored.weg,'voll');assert.equal(restored.state.rankSeen,'Professor','known snapshot policy suppresses unmarked star titles without needing another migration');assert.equal(restored.state.rankPolicy,'knowledge.v1');assert.equal(restored.state.total,8);assert.deepEqual(raw(restored.state),raw(derive(all,{now:NOW+1000})),'raw fields and the full path stay unchanged');
  const earned=newEvent({type:'rank_seen',author:TITLE_KID.id,device:'d_QA2',at:new Date(NOW+10).toISOString(),payload:{rank:'Legend',policy:'knowledge.v1'}});
  assert.equal((await stateFrom([...all,earned],snapshot,{now:NOW+1000})).state.rankSeen,'Legend','legitimate knowledge promotions remain a maximum');
 }
 // The valid policy alone is a cutover even when the remembered title is lost,
 // lower, or unknown. Do not use an unknown title as a valid retained title.
 for(const seen of[undefined,'Explorer','NotARealTitle']){
  const state={...snapshot.payload.state};if(seen===undefined)delete state.rankSeen;else state.rankSeen=seen;
  const partial=newEvent({...snapshot,payload:{...snapshot.payload,state}}),accepted=await acceptAll([await signEvent(partial,admission.area,keys)],admission);assert.equal(accepted.angenommen.length,1);
  const all=later([partial],null,false),result=await stateFrom(all,partial,{now:NOW+1000});assert.equal(result.weg,'voll');assert.equal(result.state.total,8);assert.equal(result.state.rankPolicy,'knowledge.v1');assert.equal(result.state.rankSeen,seen==='Explorer'?'Explorer':undefined);assert.deepEqual(raw(result.state),raw(derive(all,{now:NOW+1000})));
 }
});
test('F01 actual app writer with legacy persisted converted base uses that existing policy, without a fabricated event ID',()=>{
 const S=titleApp({rankPolicy:'knowledge.v1',rankSeen:'Professor',total:130},{bauart:'test',uhr:stellbareUhr(AT)});assert.equal(S.holen('evKindZielLog')(TITLE_PRE).liste().length,0);
 S.holen('eventHook')('round_done',{day:TITLE_DAY,skill:'numbers',stars:8,count:8});S.holen('eventHook')('rank_seen',{rank:'Legend',policy:'legacy.v1'});
 const all=titlePlain(S.holen('evKindZielLog')(TITLE_PRE).liste());assert.equal(all.at(-1).payload.after,'base');assert.equal(S.holen('store').get('rankSeen'),'Professor');
 const base=altStand({rankPolicy:'knowledge.v1',rankSeen:'Professor',total:130});assert.equal(derive(all,{now:NOW,base:{upTo:'1970-01-01T00:00:00Z',state:base}}).rankSeen,'Professor');
 const R=titleApp({}, {bauart:'test',uhr:stellbareUhr(AT),speicher:Object.fromEntries(S.ablage)});assert.equal(R.$('#rankName').textContent,'Professor');assert.equal(R.holen('store').get('total'),138);
});
test('F01 title reference accepts only actual event-ID syntax or existing base, only on migration; no validator loosening',()=>{
 const first=boot()[0],valid={...first,payload:{rank:'Legend',policy:'legacy.v1',after:'base'}};assert.deepEqual(checkEvent(valid),[]);assert.deepEqual(checkEvent({...valid,payload:{...valid.payload,after:'e_'+'1'.repeat(24)}}),[]);
 for(const after of['','missing','e_short',false,7,null])assert.ok(checkEvent({...valid,payload:{...valid.payload,after}}).includes('payload.after: invalid'));
 for(const policy of[undefined,'knowledge.v1']){const payload={rank:'Legend',after:'base',...policy?{policy}:{}};assert.ok(checkEvent({...valid,payload}).includes('payload.after: requires a preceding title policy'));}
 assert.ok(checkEvent({...valid,payload:{...valid.payload,after:valid.id}}).includes('payload.after: requires a preceding title policy'));
 assert.ok(checkEvent({...valid,payload:{...valid.payload,extra:true}}).includes('payload.extra: unknown field'));
 assert.equal(TITLE_TEXT.en.current({secure:1,subjects:1,extending:1}),'1 secure quest · 1 subject · 1 on E');assert.equal(TITLE_TEXT.de.current({secure:1,subjects:1,extending:1}),'1 sichere Quest · 1 Fach · 1 auf E');
});

test('F01 two actual offline first boots merge their legitimate retained root titles as a maximum; known later after-conversion remains ineffective',async()=>{
 const A=boot(),B=boot(130,100);assert.deepEqual(A[0].payload,{rank:'Explorer',policy:'legacy.v1'});assert.deepEqual(B[0].payload,{rank:'Professor',policy:'legacy.v1'});
 const merged=later([...A,...B]);assert.equal(merged.at(-1).payload.after,A[0].id);
 for(const list of[merged,merged.toReversed(),B.concat(A,merged.slice(2))]){const state=derive(list,{now:NOW});assert.equal(state.rankSeen,'Professor');assert.equal(state.total,8);}
 const base=derive(A,{now:NOW});assert.equal(derive(B.concat(merged.slice(2)),{now:NOW,base:{upTo:'1970-01-01T00:00:00Z',state:base}}).rankSeen,'Professor');
 const snap=await makeSnapshot(A,{now:NOW,author:'p_parent',device:'d_parent'});const restored=await stateFrom(B,snap,{now:NOW+1000});assert.equal(restored.state.rankSeen,'Professor');
 const earned=newEvent({type:'rank_seen',author:TITLE_KID.id,device:'d_QA3',at:new Date(AT-200).toISOString(),payload:{rank:'Legend',policy:'knowledge.v1'}});assert.equal(derive([...merged,earned],{now:NOW}).rankSeen,'Legend');
});
