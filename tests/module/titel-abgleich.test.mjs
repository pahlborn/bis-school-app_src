// Synthetic valid family: actual child writer, signed/encrypted local transport,
// second device with a slower clock, and a new-device snapshot. No live service.
import{test}from'node:test';import assert from'node:assert/strict';
import{titleApp,titlePlain,TITLE_PRE,TITLE_KID,TITLE_DAY}from'./titel-fixtures.mjs';
import{newPersonKeys,publicKeysOf,newAreaKey}from'../../src/module/krypto.mjs';
import{signEvent}from'../../src/module/annahme.mjs';import{evSchreiber}from'../../src/module/schreiber.mjs';
import{abgleichStand,vormerken,senden,holen}from'../../src/module/abgleich.mjs';
import{lokalerSpeicher}from'../../src/module/speicher.mjs';import{derive}from'../../src/module/ableitung.mjs';
import{makeSnapshot,stateFrom}from'../../src/module/schnappschuss.mjs';

test('EP03 actual child writer -> encrypted sync -> slower second device -> full replay/new-device snapshot: future stars never promote',async()=>{
 const S=titleApp({}, {bauart:'test'});
 for(const skill of['numbers','round','combos'])for(let i=0;i<6;i++)S.holen('eventHook')('answer',{day:TITLE_DAY,skill,level:2,attempt:1,ok:true,help:false,qid:skill+i});
 S.holen('renderHome')();assert.equal(S.$('#rankName').textContent,'Investigator');assert.equal(S.holen('store').get('total',0),0);
 const original=titlePlain(S.holen('evKindZielLog')(TITLE_PRE).liste()),device=original[0].device,area='kind:lern:'+TITLE_KID.id;
 const keys=await newPersonKeys(),pub=await publicKeysOf(keys),key=await newAreaKey(),storage=lokalerSpeicher();
 const schluessel={aktuell:1,keys:new Map([[1,key]])},zulassung={area,members:{[TITLE_KID.id]:{role:'child',pub,devices:[device,'d_B1']}}},now=Date.now()+1000;
 const A=abgleichStand(area,device),B=abgleichStand(area,'d_B1');
 for(const e of original)vormerken(A,await signEvent(e,area,keys));
 await senden(A,{zugang:storage.geraet(device),schluessel});const first=await holen(B,{zugang:storage.geraet('d_B1'),schluessel,zulassung,now});assert.deepEqual(first.verworfen,[]);
 let local=B.log.map(i=>i.event);const clock=Date.parse(original[0].at)-10;
 const writer=evSchreiber({read:()=>local,write:l=>local=l,device:'d_B1',who:()=>({person:TITLE_KID.id,role:'child'}),now:()=>clock});
 for(let i=0;i<40;i++)assert.equal(writer.write('round_done',{day:TITLE_DAY,skill:'numbers',stars:8,count:8}).ok,true);
 assert.equal(writer.write('rank_seen',{rank:'Legend'}).ok,true,'an unchanged old-client title event is still valid wire data');
 assert.equal(writer.write('rank_seen',{rank:'Legend',policy:'legacy.v1'}).ok,true,'a stale second conversion is valid but must not promote');
 for(const e of local.slice(original.length))vormerken(B,await signEvent(e,area,keys));
 await senden(B,{zugang:storage.geraet('d_B1'),schluessel});const second=await holen(A,{zugang:storage.geraet(device),schluessel,zulassung,now});assert.deepEqual(second.verworfen,[]);
 const a=derive(A.log.map(i=>i.event),{now}),b=derive(B.log.map(i=>i.event),{now});assert.deepEqual(a,b);assert.equal(a.total,320);assert.equal(a.rankSeen,'Investigator');assert.equal(a.rankPolicy,'knowledge.v1');
 const snapshot=await makeSnapshot(A.log.map(i=>i.event),{now:now+1000,author:'p_adult',device:'d_P1'}),C=await stateFrom([],snapshot,{now:now+2000});assert.equal(C.weg,'schnappschuss');assert.deepEqual(C.state,a);
 assert.deepEqual(titlePlain(S.holen('eventErrors')),[]);
});
