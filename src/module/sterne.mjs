import { KNOWLEDGE_LIMITS, KNOWLEDGE_YEAR_WINDOW } from './wissen.mjs';
// Payment metadata only. Knowledge continues to come exclusively from standOf.
const starList=v=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'))]:[];
export function starLedger(value){const v=value&&typeof value==='object'?value:{};return{secure:starList(v.secure),solved:starList(v.solved),bonuses:starList(v.bonuses),rounds:starList(v.rounds)};}
export function mergeStarLedger(a,b){const x=starLedger(a),y=starLedger(b);return Object.fromEntries(Object.keys(x).map(k=>[k,[...new Set(x[k].concat(y[k]))]]));}
export function starProjection(state,type,p){
 const ledger=starLedger(state.starLedger);
 if(type==='reward_seen')return{starLedger:mergeStarLedger(ledger,p)};
 if(type==='discovery_bonus'){
  if(ledger.bonuses.includes(p.quest))return{};
  ledger.bonuses.push(p.quest);if(!ledger.solved.includes(p.quest))ledger.solved.push(p.quest);
  return{starLedger:ledger,total:(state.total||0)+1};
 }
 if(type==='round_reward'){
  if(ledger.rounds.includes(p.round))return{};
  ledger.rounds.push(p.round);
  return{starLedger:ledger,total:(state.total||0)+p.stars,['best_'+p.skill]:Math.max(state['best_'+p.skill]||0,p.correct)};
 }
 return{};
}
export const STAR_TEXT={
 en:{accuracy:'Correct answers',restoreRetained:'Earned titles and stars stay. A first-solution bonus is never granted again.',normal:'⭐ for a correct answer',secure:'⭐ for challenges',relapse:'⭐ in Practise Today',today:'⭐ for discoveries, gaps, due reviews and challenges; normal tasks in secure quests earn no stars.',one:'⭐ 1 for a correct answer · hints and examples are welcome',zero:'⭐ 0 here · try Practise Today or a challenge for stars',bonus:'First right answer in this discovery: +1 bonus star, once.',earned:n=>`${n} star${n===1?'':'s'} earned`,empty:'You finished this round. For stars, try a discovery in Practise Today or a challenge. Hints and examples are welcome.',courage:'You tried a challenge. You can use help and have another go.',todayButton:'🧭 Practise Today',challengeButton:'⚡ Try a challenge'},
 de:{accuracy:'Richtige Antworten',restoreRetained:'Erreichte Titel und gesammelte Sterne bleiben erhalten. Ein Erstbonus wird nicht erneut vergeben.',normal:'⭐ für eine richtige Antwort',secure:'⭐ für Herausforderungen',relapse:'⭐ in Practise Today',today:'⭐ für Neuland, Lücken, fällige Wiederholungen und Herausforderungen; normale Aufgaben sicherer Quests bringen keine Sterne.',one:'⭐ 1 für eine richtige Antwort · Tipp und Beispiel sind willkommen',zero:'⭐ hier 0 · Sterne gibt es in Practise Today oder bei einer Herausforderung',bonus:'Erste richtige Lösung in diesem Neuland: einmalig +1 Bonusstern.',earned:n=>`${n} Stern${n===1?'':'e'} verdient`,empty:'Du hast diese Runde beendet. Für Sterne probiere Neuland in Practise Today oder eine Herausforderung. Tipp und Beispiel helfen dir dabei.',courage:'Du hast eine Herausforderung ausprobiert. Du kannst Hilfe nutzen und es noch einmal probieren.',todayButton:'🧭 Practise Today',challengeButton:'⚡ Herausforderung probieren'}
};
export function createStarRewards({store,eventHook,canWrite,standOf,eligible,levelOf,evidenceMax}){
 const read=()=>starLedger(store.get('starLedger',null));
 function publish(type,p){
  if(!canWrite())return 0;
  const before=store.get('total',0),state={starLedger:read(),total:before};if(p.skill)state['best_'+p.skill]=store.get('best_'+p.skill,0);
  const patch=starProjection(state,type,p);for(const[k,v]of Object.entries(patch))store.set(k,v);eventHook(type,p);
  return store.get('total',0)-before;
 }
 function observe(){
  const ledger=read();if(!canWrite())return ledger;
  const secure=[],solved=[],ev=store.get('ev',{}),attempts=store.get('attempts',[]);
  for(const quest of eligible()){
   if(!ledger.secure.includes(quest)){const rows=ev[quest]||[],current=['M','E'].includes(standOf(quest)),past=!current&&rows.some((_,i)=>{const prefix=rows.slice(0,i+1);return prefix.length>=KNOWLEDGE_LIMITS.minAnswers&&(rows.length<evidenceMax||prefix.filter(r=>r[1]===2).length>=KNOWLEDGE_YEAR_WINDOW)&&['M','E'].includes(standOf(quest,prefix));});if(current||past)secure.push(quest);}
   // An observed old correct answer prevents retrospective first-solution bonuses.
   // Previously unsuccessful practice is deliberately NOT an exclusion.
   if(!ledger.solved.includes(quest)&&((ev[quest]||[]).some(r=>r[2]===1)||attempts.some(a=>a.skill===quest&&a.ok===true)||store.get('best_'+quest,0)>0))solved.push(quest);
  }
  if(secure.length||solved.length)publish('reward_seen',{secure,solved});return read();
 }
 function offer(q,today){
  const ledger=observe(),wasSecure=ledger.secure.includes(q.world),current=standOf(q.world);
  return{stars:levelOf(q)===3||!!q.gap||today&&!!(q.neuland||q.dueId)||!wasSecure&&!['M','E'].includes(current)?1:0,bonus:!!q.neuland&&!wasSecure&&!ledger.solved.includes(q.world)};
 }
 function correct(q,offer,round){
  const ledger=read();let bonus=0;
  if(offer.bonus&&!ledger.solved.includes(q.world))bonus=publish('discovery_bonus',{quest:q.world,round});
  else if(!ledger.solved.includes(q.world))publish('reward_seen',{secure:[],solved:[q.world]});
  observe();return bonus;
 }
 return{read,observe,offer,correct,finish:p=>publish('round_reward',p),card:(quest,lang)=>{const T=STAR_TEXT[lang],current=standOf(quest),secure=read().secure.includes(quest);return current==='M'||current==='E'?T.secure:secure?T.relapse:T.normal;}};
}
