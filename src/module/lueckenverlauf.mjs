import {secureEvidence} from './wissen.mjs';
// W1 gap journey only. Existing answer/school events supply the observations;
// this is neither another knowledge score nor another event format.
export const GAP_CHECKS=6;
export function gapSchoolRatings(data){
  const out={};
  for(const t of data?.tasks||[])if(!t.pending&&!t.manual)for(const [s,value]of Object.entries(t.std||{})){
    const st=value==='N'?'RS':value;
    if(!out[s]||t.day>=out[s].day)out[s]={st,day:t.day};
  }
  return out;
}
export function gapMergeRatings(out,incoming){
  for(const [s,r]of Object.entries(incoming))if(!out[s]||r.day>=out[s].day)out[s]=r;
  return out;
}
const gjClone=x=>JSON.parse(JSON.stringify(x));
const gjEmpty=complete=>({total:0,first:[],recent:[],complete,checks:[]});
function gjStep(p,entry,before,after){
  const {row,originalLevel,sheet}=entry;
  const answer={ok:row[2]===1,level:originalLevel,help:row[1]===1&&originalLevel>1,...sheet?{sheet}:{}};
  p.total++;if(p.first.length<GAP_CHECKS)p.first.push(answer);p.recent.push(answer);p.recent=p.recent.slice(-GAP_CHECKS);
  if(!p.reached){
    if(before)p.reached={day:row[0],kind:'observed'}; // M was observed BEFORE this answer: it already counts
    else{if(after)p.reached={day:row[0],kind:'reached'};return;} // reaching answer is excluded
  }
  if(p.checks.length<GAP_CHECKS)p.checks.push(answer);
  if(!p.uncertain&&!p.held&&p.checks.length===GAP_CHECKS&&p.checks.filter(x=>x.ok).length>=5)p.held={day:row[0]};
}
// A bounded correction journal belongs only to an open school-gap epoch. It
// preserves the established sheet undo semantics without another response.
export function gapObserve(journeys,{standard,quest,rating,row,originalLevel,secureBefore,secureAfter,complete=false,previous=[],sheet}){
  if(!standard||!rating||!['RS','C'].includes(rating.st)||row[0]<rating.day)return;
  let g=journeys[standard];
  if(!g||g.schoolDay!==rating.day)g=journeys[standard]={schoolDay:rating.day,quests:{}};
  let p=g.quests[quest];
  if(!p)p=g.quests[quest]={...gjEmpty(complete),seed:gjClone(previous),journal:[],prefix:gjEmpty(complete)};
  const entry={row:row.slice(),originalLevel,...sheet?{sheet}:{}};
  gjStep(p,entry,secureBefore,secureAfter);p.journal.push(entry);
  if(p.journal.length>200){
    const first=p.journal.shift(),before=secureEvidence(p.seed);p.seed.push(first.row);p.seed=p.seed.slice(-60);
    gjStep(p.prefix,first,before,secureEvidence(p.seed));
  }
}
export function gapUndo(journeys,standard,quest,sheet){
  const p=journeys?.[standard]?.quests?.[quest];if(!p)return;
  const at=p.journal.findIndex(x=>x.sheet===sheet);
  if(at<0){p.uncertain=true;delete p.held;return;} // beyond retained source: never invent proof
  p.journal.splice(at,1);
  const rebuilt=gjClone(p.prefix),ev=gjClone(p.seed);
  for(const entry of p.journal){const before=secureEvidence(ev);ev.push(entry.row);if(ev.length>60)ev.shift();gjStep(rebuilt,entry,before,secureEvidence(ev));}
  journeys[standard].quests[quest]={...rebuilt,seed:p.seed,journal:p.journal,prefix:p.prefix};
}
export function gapJourneyBest(g){
  const a=Object.entries(g?.quests||{}).map(([k,p])=>({k,...p}));
  return a.sort((a,b)=>Number(!!b.held)-Number(!!a.held)||Number(!!b.reached)-Number(!!a.reached)||b.checks.length-a.checks.length||b.total-a.total)[0]||null;
}

export function gapHeldQuest(journeys,standard,schoolDay,quests){
  const g=journeys?.[standard];
  return g?.schoolDay===schoolDay&&quests.find(k=>g.quests[k]?.held);
}
