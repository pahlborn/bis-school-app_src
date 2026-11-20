import{test}from'node:test';
import assert from'node:assert/strict';
import{PRAISE_TEXT}from'../../src/module/motivationsworte.mjs';
import{titleApp}from'./titel-fixtures.mjs';
test('challenge praise distinguishes an actual answer attempt from merely choosing/revealing; both child languages',()=>{
 for(const lang of['de','en']){
  const S=titleApp({kidLang:lang},{seite:true}),state=S.holen('state');
  state.noteShown=false;state.attempts=0;assert.equal(S.holen('maybeNote')('brave',1),PRAISE_TEXT[lang].chosen[0]);
  state.noteShown=false;state.attempts=1;assert.equal(S.holen('maybeNote')('brave',1),PRAISE_TEXT[lang].brave[0]);
  for(const key of['start','wrong','brave','chosen','tree'])for(const line of PRAISE_TEXT[lang][key])assert.doesNotMatch(line,/brain grows|risk-taker|intelligen|smarter|nearly perfect/i);
 }
});
