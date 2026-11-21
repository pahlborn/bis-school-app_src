// Small reader/cache contract under a pending child view. The real signed form/receive path
// is covered by the unchanged EV4/EV7 integration case; this fixture supplies only school data.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {appSandbox} from '../app-sandbox.mjs';import {kontenEinsetzen} from '../../werkzeug/konten.mjs';
import {TITLE_ACCOUNTS,TITLE_KID,TITLE_PRE} from './titel-fixtures.mjs';
import {newEvent,checkEvent} from '../../src/module/ereignisse.mjs';
test('school source version invalidates focus while the pending learning-view version stays unchanged; old-key control stays stale',()=>{
 for(const oldKey of [true,false]){
  const S=appSandbox({bauart:'test',anpassen:h=>{let source=kontenEinsetzen(h,TITLE_ACCOUNTS).toString().replace('const KONTO_UI=','APP_ACCOUNTS.konto=true;\nconst KONTO_UI=');if(oldKey){assert.ok(source.includes(',schoolLogVersion()'));source=source.replace(',schoolLogVersion()','');}return source;},speicher:{bq2_session:JSON.stringify({user:TITLE_KID.user,id:TITLE_KID.id})}});
  S.setzen('bq2_pendingAdmission',{[TITLE_KID.id]:true});const before={focus:Array.from(S.holen('focusTopics')()),learning:S.holen('evVersion')(),school:S.holen('schoolLogVersion')()};assert.ok(!before.focus.includes('numbers'));
  const data={asOf:'2026-11-21',tasks:[{day:'2026-11-21',area:'math',title:'Synthetic received school rating',std:{'M-N1':'C'},quests:['numbers'],focusNext:[],good:{de:'',en:''},next:{de:'',en:''}}]},parent=TITLE_ACCOUNTS.users.find(u=>u.user==='papa').id;
  const event=newEvent({type:'school_import',payload:{asOf:data.asOf,data},author:parent,device:'d_parent',at:new Date().toISOString()});assert.deepEqual(checkEvent(event),[]);
  const log=S.holen('evKindLog')(TITLE_PRE);log.schreiben([...log.liste(),event]);assert.equal(S.holen('evVersion')(),before.learning);assert.equal(S.holen('schoolLogVersion')(),before.school+1);
  assert.deepEqual(JSON.parse(JSON.stringify(S.holen('schoolStandFor')('numbers'))),{st:'C',day:'2026-11-21'});assert.ok(S.holen('focusAuto')().includes('numbers'),'unchanged automatic policy already includes the school gap');assert.equal(S.holen('focusTopics')().includes('numbers'),!oldKey);
 }
});
