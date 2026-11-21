// Actual child handler log, signed/encrypted local receive; no remote service.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {titleApp,titlePlain as plain,TITLE_PRE,TITLE_KID} from './titel-fixtures.mjs';
import {newPersonKeys,publicKeysOf,newAreaKey} from '../../src/module/krypto.mjs';
import {signEvent} from '../../src/module/annahme.mjs';
import {abgleichStand,vormerken,senden,holen} from '../../src/module/abgleich.mjs';
import {lokalerSpeicher} from '../../src/module/speicher.mjs';
import {derive} from '../../src/module/ableitung.mjs';
import {makeSnapshot,stateFrom} from '../../src/module/schnappschuss.mjs';
test('real child answers -> tree claims/open -> signed encrypted local receive/replay/snapshot, including duplicate delivery and invalid signature',async()=>{
 const S=titleApp({ev:{numbers:Array.from({length:5},()=>['2026-11-21',2,1,true]),round:Array.from({length:5},()=>['2026-11-21',2,1,true])}},{bauart:'test',seite:true});
 for(const skill of ['numbers','round','round']){S.holen('startRound')(skill);while(S.zustand().screen==='play'){S.frageBeantworten(S.zustand().round[S.zustand().idx]);S.klick('#nextBtn');}}S.holen('renderHome')();
 assert.ok(S.holen('knowledgeTree').pending().length>=2);S.klick('#treeOpen');S.klick('#treeSurpriseOpen');
 const original=plain(S.holen('evKindZielLog')(TITLE_PRE).liste()),device=original[0].device,area='kind:lern:'+TITLE_KID.id;
 const keys=await newPersonKeys(),pub=await publicKeysOf(keys),key=await newAreaKey(),storage=lokalerSpeicher(),schluessel={aktuell:1,keys:new Map([[1,key]])},zulassung={area,members:{[TITLE_KID.id]:{role:'child',pub,devices:[device,'d_B1']}}},now=Date.now()+10000;
 const A=abgleichStand(area,device),B=abgleichStand(area,'d_B1');
 for(const e of original.filter(e=>e.type.startsWith('tree_')))vormerken(A,await signEvent(e,area,keys));
 const bad=await signEvent({...original.find(e=>e.type==='tree_open'),id:'e_'+'f'.repeat(24)},area,keys);bad.event.payload.ordinal=99;vormerken(A,bad);
 await senden(A,{zugang:storage.geraet(device),schluessel});const first=await holen(B,{zugang:storage.geraet('d_B1'),schluessel,zulassung,now});assert.ok(first.verworfen.some(r=>r.grund==='unterschrift'));
 const actual=B.log.map(i=>i.event),expected=derive(original.filter(e=>e.type.startsWith('tree_')),{now}).treeLedger;assert.deepEqual(derive(actual,{now}).treeLedger,expected);
 await holen(B,{zugang:storage.geraet('d_B1'),schluessel,zulassung,now});assert.deepEqual(derive(B.log.map(i=>i.event),{now}).treeLedger,expected);
 const snapshot=await makeSnapshot(actual,{now:now+1000,author:'p_adult',device:'d_P1'});assert.deepEqual((await stateFrom([],snapshot,{now:now+2000})).state.treeLedger,expected);
 assert.equal(expected.opened.length,1);assert.deepEqual(plain(S.holen('eventErrors')),[]);
});
