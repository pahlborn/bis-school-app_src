// Practise Today composition and its one discovery slot. No new status store or clock.
export function neulandLevel(quest,{ev={},attempts=[]}={}){
  const proved=(ev[quest]||[]).some(e=>e[2]===1&&e[3]===true)
    || attempts.some(a=>a.skill===quest&&[1,2,3].includes(a.level)&&a.attempt===1&&a.ok===true&&a.help===false&&!a.example&&!a.hintShown&&!a.exampleShown&&!a.solutionShown);
  return proved?2:1;
}
export function neulandCandidates(eligible,history,stand){
  const {ev={},attempts=[],tried=[],best={},due=[]}=history;
  // A legacy visit/result is conservative evidence of having met the quest,
  // never evidence of an independent success. Current answer/help rows count too.
  const practised=k=>(ev[k]||[]).length>0||attempts.some(a=>a.skill===k)||tried.includes(k)||best[k]!==null&&best[k]!==undefined||due.some(d=>d.q?.world===k);
  const unseen=eligible.filter(k=>!practised(k));
  const order=['NA','RS','C'];
  const weak=eligible.filter(k=>practised(k)&&order.includes(stand(k)));
  weak.sort((a,b)=>order.indexOf(stand(a))-order.indexOf(stand(b)));
  return unseen.concat(weak);
}
const protectedToday=q=>!!(q.warmup||q.dueId||q.gap||q.challenge||q.schoolRevision||q.bridge);
export function withNeuland(round,{candidates,history,build,foundation,level,id,gapQuests=[]}){
  const at=round.findIndex(q=>!protectedToday(q));
  if(at<0)return round;
  const used=new Set(round.filter((_,i)=>i!==at).map(id));
  for(const quest of candidates){
    if(gapQuests.includes(quest)&&round.filter(q=>gapQuests.includes(q.world)).length>=2)continue;
    const want=neulandLevel(quest,history);
    for(let attempt=0;attempt<12;attempt++){
      const pool=build(quest),extra=want===1?foundation(quest,attempt):null;
      if(extra)pool.push(extra);
      const q=pool.find(q=>level(q)===want&&!used.has(id(q)));
      if(!q)continue;
      const out=round.slice();out[at]=Object.assign({},q,{neuland:true});return out;
    }
  }
  return round;
}
// Pending help is composed before discovery. A task shared by two protected
// roles is shown once, retaining those roles; the spare position is normal fill.
function uniqueToday(round,more,{id,level}){
  const out=round.slice(),groups=new Map(),roles=['warmup','dueId','gap','challenge','bridge','bridgePart','bridgeSource','assisted'];
  out.forEach((q,i)=>{const key=id(q);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);});
  const used=new Set(out.map(id));
  for(const indexes of groups.values()){
    const keep=indexes.find(i=>out[i].warmup)??indexes.find(i=>out[i].schoolRevision)??indexes.find(i=>out[i].bridge)??indexes.find(i=>out[i].dueId)??indexes[0];
    for(const i of indexes){
      if(i===keep)continue;
      const duplicate=out[i];
      for(const role of roles)if(duplicate[role]!==undefined&&out[keep][role]===undefined)out[keep][role]=duplicate[role];
      if(duplicate.schoolRevision&&!out[keep].schoolRevision)Object.defineProperty(out[keep],'schoolRevision',{value:duplicate.schoolRevision});
      for(let attempt=0;attempt<12;attempt++){
        const q=more().find(q=>level(q)===level(duplicate)&&!used.has(id(q)));
        if(q){out[i]=q;used.add(id(q));break;}
      }
    }
  }
  return out;
}
export function createTodayRound({focusTopics,SUBJECTS,questsIn,gapLaneQuests,standOf,pick,WORLDS,levelOf,dueToday,reshuffled,schoolEvaluationQuestions,gapTasks,shuffle,adaptRound,insertInOrder,ohneDoppelte,qId,neutralQ,history,foundation=()=>null}){
function buildToday(pending=[]){
  const focus=focusTopics();
  const all=focus.length ? focus : SUBJECTS.flatMap(questsIn);
  // concept 6.5 (D2): two lanes - the current topics stay in front, the active gap gets at most 2 of 8 tasks;
  // without current topics the gap fills the round
  let gq=gapLaneQuests(focus), topics=all.filter(k=>!gq.includes(k));
  if(!topics.length){ topics=all; gq=[]; }
  const out=[];
  const solid=SUBJECTS.flatMap(questsIn).filter(k=>['M','E'].includes(standOf(k)) && topics.indexOf(k)<0 && gq.indexOf(k)<0);
  const warmFrom=solid.length?pick(solid):pick(topics);
  const warm=WORLDS[warmFrom].build().find(q=>levelOf(q)<3);
  if(warm){ warm.warmup=true; out.push(warm); }
  dueToday().slice(0,2).forEach(q=>out.push(reshuffled(q)));
  const ready=topics.filter(k=>['M','E'].includes(standOf(k)));
  let challenge=null;
  if(ready.length){ const k=pick(ready); challenge=WORLDS[k].build().concat(WORLDS[k].build()).find(q=>levelOf(q)===3) || null; if(challenge) challenge.challenge=true; }
  const schoolTasks=schoolEvaluationQuestions(out);
  const lane=gapTasks(gq, Math.min(2, 8-out.length-schoolTasks.length-(challenge?1:0)));
  lane.unshift(...schoolTasks);
  const pools=shuffle(topics).map(k=>adaptRound(k, WORLDS[k].build()).filter(q=>levelOf(q)<3 || standOf(k)!=='NA'));
  const middle=[]; let i=0;
  while(out.length+lane.length+middle.length+(challenge?1:0)<8 && pools.some(p=>p.length)){ const p=pools[i%pools.length]; if(p.length) middle.push(p.shift()); i++; }
  const round=out.concat(insertInOrder(shuffle(middle), lane), challenge?[challenge]:[]).slice(0,8);
  // Compose help first, then resolve duplicate roles without losing their flags.
  const more=()=>{const k=pick(topics);return adaptRound(k,WORLDS[k].build());};
  let composed=round.slice();
  const slots=composed.map((q,i)=>q.schoolRevision?-1:i).filter(i=>i>=0),use=pending.slice(0,Math.min(3,slots.length));
  use.map(neutralQ).filter(Boolean).forEach((q,i)=>composed[slots[i]]=q);
  composed=uniqueToday(composed,more,{id:qId,level:levelOf});
  const evidence=history(),eligible=SUBJECTS.flatMap(questsIn);
  const discovered=withNeuland(composed,{candidates:neulandCandidates(eligible,evidence,standOf),history:evidence,build:k=>WORLDS[k].build(),foundation,level:levelOf,id:qId,gapQuests:gq});
  return {round:discovered,bridgesUsed:use.length};
}
return buildToday;
}
