import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {appSandbox} from '../app-sandbox.mjs';import {committedApp} from './ep01-rest-fixtures.mjs';import {MODUL_JSON} from '../../werkzeug/module.mjs';
const BASE='ef8d2b0b02c22f6b431f773f3cd68161d9d44c81';
test('CI repairs preserve tree/star/knowledge modules and exact focus/generator behavior outside the approved causes',()=>{
 for(const name of ['wissensbaum','sterne','titel','wissen']){
  let expected=execFileSync('git',['show',`${BASE}:src/module/${name}.mjs`],{encoding:'utf8'});
  if(name==='sterne')for(const [before,after]of[
   ["today:'⭐ for discoveries, gaps, due reviews and challenges; normal tasks in secure quests earn no stars.'","today:'⭐ for discoveries, learning goals, due reviews and challenges; normal tasks in secure quests earn no stars.'"],
   ["today:'⭐ für Neuland, Lücken, fällige Wiederholungen und Herausforderungen; normale Aufgaben sicherer Quests bringen keine Sterne.'","today:'⭐ für Neuland, Learning goals, fällige Wiederholungen und Herausforderungen; normale Aufgaben sicherer Quests bringen keine Sterne.'"]
  ]){assert.ok(expected.includes(before),'exact authorized STAR_TEXT baseline literal');expected=expected.replace(before,after);}
  assert.equal(fs.readFileSync(`src/module/${name}.mjs`,'utf8'),expected,name+' exact module text outside the two authorized C wording literals');
 }
 const html=committedApp(BASE).replace(/\/\*BQ_JSON:(DAILY_WORD_DATA|DAILY_EXPLAIN_DATA)\*\/null/g,(_,name)=>JSON.stringify(JSON.parse(execFileSync('git',['show',`${BASE}:${MODUL_JSON[name]}`],{encoding:'utf8'}))).replace(/</g,'\\u003c'));
 const old=appSandbox({seed:71,anpassen:()=>html}),current=appSandbox({seed:71});
 assert.equal(String(current.holen('focusTopics')).replace(',schoolLogVersion()',''),String(old.holen('focusTopics')));
 for(const name of ['focusAuto','focusNeed','cleanFocus','classTopics','standOf','score','showResults','buildExamples','buildToday','qId','levelOf','rnd','shuffle','pick'])assert.equal(String(current.holen(name)),String(old.holen(name)),name);
 const specific=String(current.holen('specificExampleQ')).replace('function specificExampleQ(r=pick(SPECIFIC)){\n  const swap=','function specificExampleQ(){\n  const r=pick(SPECIFIC), swap=');assert.equal(specific,String(old.holen('specificExampleQ')),'only optional existing-row injection; all default random positions and question content stay exact');
 const worlds=current.holen('WORLDS');for(const k of Object.keys(worlds).filter(k=>k!=='examples'))assert.equal(String(worlds[k].build),String(old.holen('WORLDS')[k].build),k+' original wrapper');
 assert.equal(String(current.holen('examplesRandomRound')),String(old.holen('WORLDS').examples.build),'normal random refills unchanged');
});
