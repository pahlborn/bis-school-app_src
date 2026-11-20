// EP04: authorized synthetic fixtures; no production family or remote service.
import{test}from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import{createHash}from'node:crypto';
import{dailyContent}from'../../src/module/tagesinhalte.mjs';
import{contentVoteState}from'../../src/module/inhaltsfeedback.mjs';
import{JOKE_LIST,jokeNext,jokeForDoor}from'../../src/module/witze.mjs';
import{newEvent,checkEvent}from'../../src/module/ereignisse.mjs';
import{derive}from'../../src/module/ableitung.mjs';
import{altStand}from'../../src/module/lesen.mjs';
import{makeSnapshot,stateFrom}from'../../src/module/schnappschuss.mjs';
import{roleMayWrite}from'../../src/module/annahme.mjs';
import{titleApp,titlePlain as plain,TITLE_PRE,TITLE_KID}from'./titel-fixtures.mjs';
import{stellbareUhr}from'../app-sandbox.mjs';
const words=JSON.parse(fs.readFileSync(new URL('../../docs/inhalte/words-trivia-365.json',import.meta.url))),explainFile=fs.readFileSync(new URL('../../docs/inhalte/explain-it-daily-365.json',import.meta.url)),explain=JSON.parse(explainFile);
const hash=x=>createHash('sha256').update(x).digest('hex');
test('joke rejection is permanent across a later upvote, duplicate events, rotation and the 200-entry seen boundary',()=>{
 const rejected=JOKE_LIST[0].id,p={kind:'joke',item:rejected,value:'down'};let s=contentVoteState({},[],p);
 s=contentVoteState(s.votes,s.rejected,{...p,value:'up'});s=contentVoteState(s.votes,s.rejected,p);
 assert.deepEqual(s.rejected,[rejected]);let seen=Array.from({length:200},(_,i)=>'old'+i);
 for(let i=0;i<600;i++){const r=jokeNext('en',null,seen,()=>0,s.rejected);assert.notEqual(r.joke?.id,rejected);seen=r.seen.slice(-200);}
 assert.equal(jokeNext('en',null,[],()=>0,JOKE_LIST.map(j=>j.id)).joke,null);
 for(let i=1;i<=24;i++)assert.ok(!s.rejected.includes(jokeForDoor(i,s.rejected)?.id));
 const other=contentVoteState({},[],{kind:'story',item:'s1',value:'down'});assert.deepEqual(other.rejected,[]);
 assert.deepEqual(contentVoteState({},[],{kind:'word',item:'16',value:'down'}).rejected,[]);
});
test('only a child may write private content votes; strict kind/value fields reject task ratings',()=>{
 const event=newEvent({type:'content_vote',author:'p_child',device:'d_A',at:'2026-11-20T10:00:00Z',payload:{kind:'joke',item:'j1',value:'down'}});
 assert.deepEqual(checkEvent(event),[]);assert.equal(roleMayWrite('child',event,'kind:privat:p_child'),true);
 for(const role of['parent','teacher','admin'])assert.equal(roleMayWrite(role,event,'kind:privat:p_child'),false);
 for(const payload of[{...event.payload,kind:'task'},{...event.payload,value:'clear'},{...event.payload,extra:true}])assert.ok(checkEvent({...event,payload}).length);
});
for(const bauart of['live','test'])test(`${bauart}: actual word and story/joke thumb handlers produce no learning score; parent reads without writing`,()=>{
 const S=titleApp({}, {bauart,seite:true}),store=S.holen('store'),before=plain({ev:store.get('ev',{}),total:store.get('total',0),tried:store.get('tried',[])});
 S.holen('renderHome')();S.klick('[data-open-word]');const w=dailyContent(words.items,S.holen('dayKey')());
 assert.deepEqual(S.$('#dailyWord').querySelectorAll('[data-word-option]').map(b=>b.textContent),w.options);
 S.klick(`[data-word-option="${w.answer}"]`);assert.ok(S.$('#dailyWord').textContent.includes(w.example));S.klick('#dailyWord [data-content-vote="up"]');
 const box=S.$('#treatBody'),joke=S.holen('JOKE_LIST')[0];box.innerHTML=S.holen('contentFeedbackHTML')('joke',joke.id);S.holen('bindContentFeedback')(box);S.klick('#treatBody [data-content-vote="down"]');S.klick('#treatBody [data-content-vote="up"]');
 S.holen('showTreat')('story','content-proof');S.klick('[data-story]');assert.equal(S.$('#storyText').querySelectorAll('[data-content-vote]').length,2);S.klick('#storyText [data-content-vote="down"]');
 assert.deepEqual(plain({ev:store.get('ev',{}),total:store.get('total',0),tried:store.get('tried',[])}),before);
 assert.ok(store.get('jokeRejected',[]).includes(joke.id));assert.equal(S.$('#home').querySelectorAll('#pDailyExplain').length,0);
 S.holen('loginDone')(S.holen('APP_ACCOUNTS').users.find(u=>u.user==='papa'));
 const beforeRead=JSON.stringify([...S.ablage]),html=S.holen('parentHomeHTML')();
 assert.ok(html.includes('pContentFeedback'));assert.ok(html.includes(joke.q));assert.ok(html.includes('pDailyExplain'));assert.ok(html.includes(dailyContent(explain.items,S.holen('dayKey')()).question));
 assert.equal(JSON.stringify([...S.ablage]),beforeRead);assert.deepEqual(plain(S.holen('eventErrors')),[]);
});
test('actual ChildWriter votes survive replay, base, snapshot/new device and a mismatching-full fallback',async()=>{
 const S=titleApp({}, {bauart:'test',seite:true}),box=S.$('#treatBody'),id=S.holen('JOKE_LIST')[0].id;
 box.innerHTML=S.holen('contentFeedbackHTML')('joke',id);S.holen('bindContentFeedback')(box);S.klick('[data-content-vote="down"]');
 const all=plain(S.holen('evKindZielLog')(TITLE_PRE).liste()),vote=all.find(e=>e.type==='content_vote');assert.equal(vote.author,TITLE_KID.id);
 const now=Date.parse(vote.at)+10000,full=derive(all,{now}),base=altStand(full),snapshot=await makeSnapshot(all,{now,author:'p_parent',device:'d_parent'});
 assert.deepEqual(base.jokeRejected,[id]);assert.deepEqual(derive([],{now,base:{upTo:snapshot.payload.upTo,state:base}}).jokeRejected,[id]);
 assert.deepEqual((await stateFrom([],snapshot,{now:now+1000})).state.jokeRejected,[id]);
 // A valid known snapshot retains its monotonic ban even if raw replacement forces full derivation.
 const replacements=all.map((e,i)=>({...e,id:e.id.slice(0,-1)+(e.id.endsWith('0')?'1':'0'),type:'joke_seen',payload:{joke:'other'+i}}));
 const fallback=await stateFrom(replacements,snapshot,{now:now+1000});assert.equal(fallback.weg,'voll');assert.deepEqual(fallback.state.jokeRejected,[id]);
 assert.deepEqual(plain(S.holen('eventErrors')),[]);
});
test('greeting and freshly opened Advent door attach real thumb handlers and never choose a rejected joke again',()=>{
 for(const bauart of['live','test']){
  const S=titleApp({}, {bauart,seite:true,uhr:stellbareUhr(Date.parse('2026-12-01T10:00:00Z'))}),store=S.holen('store');
  S.holen('greetGo')('joke');const id=S.$('#greetJoke [data-content-vote]').dataset.contentItem;
  S.klick('#greetJoke [data-content-vote="down"]');assert.ok(store.get('jokeRejected',[]).includes(id));
  S.holen('greetGo')('joke');assert.notEqual(S.$('#greetJoke [data-content-vote]').dataset.contentItem,id);
  S.holen('openDoor')(1);S.klick('#doorBody [data-a]');const doorID=S.$('#doorBody [data-content-vote]').dataset.contentItem;
  S.klick('#doorBody [data-content-vote="down"]');assert.ok(store.get('jokeRejected',[]).includes(doorID),'newly created Advent DOM must have an active child vote handler');
  S.holen('openDoor')(1);assert.notEqual(S.$('#doorBody [data-content-vote]').dataset.contentItem,doorID);assert.deepEqual(plain(S.holen('eventErrors')),[]);
 }
});
