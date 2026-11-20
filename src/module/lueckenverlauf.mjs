import {secureEvidence} from './wissen.mjs';
import {schoolStandardsByQuest} from './standardkatalog.mjs';
const GJ_STANDARDS=schoolStandardsByQuest();
// W1 gap journey only. Existing answer/school events supply the observations;
// this is neither another knowledge score nor another event format.
export const GAP_CHECKS=6;
const GJ_RULE='independent-first.v1';
export const gapIndependentCount=answers=>(answers||[]).filter(a=>a.independent===true).length;
export const gapIsHeld=p=>!!p?.held&&p.held.rule===GJ_RULE&&p.checks?.length===GAP_CHECKS&&gapIndependentCount(p.checks)>=5;
export function gapSchoolRatings(data){
  const out={};
  for(const t of data?.tasks||[])if(!t.pending&&!t.manual)for(const [s,value]of Object.entries(t.std||{})){
    const st=value==='N'?'RS':value;
    if(!out[s]||t.day>=out[s].day)out[s]={st,day:t.day};
  }
  return out;
}
const gjClone=x=>JSON.parse(JSON.stringify(x));
const gjEmpty=complete=>({rule:GJ_RULE,total:0,first:[],recent:[],complete,checks:[],groups:[]});
function gjStep(p,entry,before,after){
  const {row,originalLevel,sheet,closed}=entry;
  const help=(row[2]===1&&row[3]===false)||(row[1]===1&&originalLevel>1);
  const independent=row[2]!==1||help?false:typeof row[3]==='boolean'?row[3]===true:null;
  const answer={ok:row[2]===1,independent,level:originalLevel,help,...sheet?{sheet}:{}};
  if(closed&&p.closedAfter===undefined)p.closedAfter=p.total;
  if(p.held||p.closedAfter!==undefined){p.later ||= [];p.later.push(answer);p.later=p.later.slice(-GAP_CHECKS);}
  p.total++;if(p.first.length<GAP_CHECKS)p.first.push(answer);p.recent.push(answer);p.recent=p.recent.slice(-GAP_CHECKS);
  // Keep an earlier stored closure historical; do not relabel its old proof.
  if(closed&&p.held&&!gapIsHeld(p))return;
  if(!p.reached){
    if(before)p.reached={day:row[0],kind:'observed'}; // M was observed BEFORE this answer: it already counts
    else{if(after)p.reached={day:row[0],kind:'reached'};return;} // reaching answer is excluded
  }
  if(!gapIsHeld(p)){
    if(p.checks.length===GAP_CHECKS){(p.groups ||= []).push(p.checks);p.checks=[];}
    p.checks.push(answer);
    if(!p.uncertain&&p.checks.length===GAP_CHECKS&&gapIndependentCount(p.checks)>=5)p.held={day:row[0],rule:GJ_RULE};
  }
}
// Only open derived traces are upgraded. Rebuild explicit independence from
// retained raw rows; an older prefix without those flags stays unclassified.
function gjPrefix(prefix,complete){
  const p=gjClone(prefix||gjEmpty(complete));
  if(p.rule!==GJ_RULE){delete p.held;p.rule=GJ_RULE;}
  p.groups ||= [];p.checks ||= [];return p;
}
function gjRebuild(p){
  if(p.prefix?.total&&p.prefix.rule!==GJ_RULE){
    // The old cut prefix cannot locate R2 group boundaries. Preserve its
    // observed history, and start a provable future group, never a retroactive pass.
    const state=gjPrefix(p,p.complete),ev=gjClone(p.seed||[]);
    for(const entry of p.journal||[]){ev.push(entry.row);if(ev.length>60)ev.shift();}
    if(state.checks.length===GAP_CHECKS)state.groups.push(state.checks);else if(state.checks.length)state.legacyChecks=state.checks;
    state.checks=[];state.complete=false;delete state.seed;delete state.journal;delete state.prefix;
    return {...state,seed:ev,journal:[],prefix:gjClone(state)};
  }
  const prefix=gjPrefix(p.prefix,p.complete),rebuilt=gjClone(prefix),ev=gjClone(p.seed||[]);
  for(const entry of p.journal||[]){const before=secureEvidence(ev);ev.push(entry.row);if(ev.length>60)ev.shift();gjStep(rebuilt,entry,before,secureEvidence(ev));}
  if(p.uncertain){rebuilt.uncertain=true;delete rebuilt.held;}
  return {...rebuilt,seed:p.seed||[],journal:p.journal||[],prefix};
}
// A bounded correction journal belongs only to an open school-gap epoch. It
// preserves the established sheet undo semantics without another response.
export function gapObserve(journeys,{standard,quest,rating,row,originalLevel,secureBefore,secureAfter,complete=false,previous=[],sheet,closed=false,seq,used}){
  if(!standard||!rating||!['RS','C'].includes(rating.st)||row[0]<rating.day)return;
  let g=journeys[standard];
  if(!g||g.schoolDay!==rating.day)g=journeys[standard]={schoolDay:rating.day,quests:{},usedAfter:used&&used.schoolDay<rating.day?JSON.stringify(used):''};
  let p=g.quests[quest];
  if(p&&p.rule!==GJ_RULE&&!closed)p=g.quests[quest]=gjRebuild(p);
  if(!p)p=g.quests[quest]={...gjEmpty(complete),seed:gjClone(previous),journal:[],prefix:gjEmpty(complete)};
  const entry={row:row.slice(),originalLevel,...sheet?{sheet}:{},...closed?{closed:true}:{},...seq?{seq}:{}};
  // A corrected sheet result replaces its original task slot. Later tasks
  // cannot slide into an earlier six-task group during replay.
  if(seq&&p.journal.some(e=>e.seq>seq)){
    p.journal.push(entry);p.journal.sort((a,b)=>a.seq-b.seq);g.quests[quest]=gjRebuild(p);return;
  }
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
  journeys[standard].quests[quest]=gjRebuild(p);
}
export function gapJourneyBest(g){
  const a=Object.entries(g?.quests||{}).map(([k,p])=>({k,...p}));
  return a.sort((a,b)=>Number(gapIsHeld(b))-Number(gapIsHeld(a))||Number(!!b.reached)-Number(!!a.reached)||b.checks.length-a.checks.length||b.total-a.total)[0]||null;
}

export function gapHeldQuest(journeys,standard,schoolDay,quests){
  const g=journeys?.[standard];
  return g?.schoolDay===schoolDay&&quests.find(k=>gapIsHeld(g.quests[k]));
}

// Raw bounded inputs for gap reprojection when a school source arrives later.
// No second score: the seed is the existing evidence window, followed by real observations.
export function gapRemember(data,quest,previous,row,originalLevel,sheet,closed=false){
  data.history ||= {};
  const h=data.history[quest] ||= {seed:gjClone(previous),rows:[],cut:false,total:0};
  const old=sheet&&h.replacing?.[sheet],seq=old||((h.total||0)+1);if(!old)h.total=seq;else delete h.replacing[sheet];
  h.rows.push({row:row.slice(),originalLevel,seq,...sheet?{sheet}:{},...closed?{closed:true}:{}});
  if(h.rows.length>200){const first=h.rows.shift();h.seed.push(first.row);h.seed=h.seed.slice(-60);h.cut=true;}
  return seq;
}
export function gapForget(data,quest,sheet){
  const h=data.history?.[quest];if(!h)return;
  const at=h.rows.findIndex(e=>e.sheet===sheet);
  if(at<0)h.uncertain=true;else{h.replacing ||= {};h.replacing[sheet]=h.rows[at].seq;h.rows.splice(at,1);}
}
// Answers already consumed by a previous closure cannot close a newer weak
// assessment again. This is an observed sequence boundary, never a date gate.
export function gapUse(data,standard,schoolDay){
  if(!data.history)return;
  data.used ||= {};
  const quests=Object.fromEntries(Object.entries(GJ_STANDARDS).filter(([,codes])=>codes[0]===standard).map(([k])=>[k,data.history?.[k]?.total||0]));
  data.used[standard]={schoolDay,quests};
}
export function gapConsumed(data,standard,quest,rating){
  const u=data.used?.[standard];return u&&u.schoolDay<rating?.day?(u.quests[quest]||0):0;
}
// Project OPEN derived traces against the currently authoritative school data.
// The assessment day, never its receipt timestamp, bounds applicable answers.
export function gapProjectSource(data,ratings){
  if(!data.journey&&!data.history)return data;
  const journeys=data.journey||(data.journey={});
  for(const [standard,old]of Object.entries(journeys)){
    const r=ratings[standard],closed=data.closed?.[standard];
    if(closed&&(!r||closed.schoolDay>=r.day))continue;
    const used=data.used?.[standard],token=used&&used.schoolDay<r?.day?JSON.stringify(used):'';
    if(!r||!['RS','C'].includes(r.st)||old.schoolDay!==r.day||old.usedAfter!==token)delete journeys[standard];
    else for(const [k,p]of Object.entries(old.quests||{}))if(p.rule!==GJ_RULE)old.quests[k]=gjRebuild(p);
  }
  for(const [quest,codes]of Object.entries(GJ_STANDARDS)){
    const standard=codes[0],r=ratings[standard],h=data.history?.[quest];
    if(!r||!['RS','C'].includes(r.st)||journeys[standard]?.quests[quest]||!h)continue;
    if(data.closed?.[standard]?.schoolDay>=r.day)continue;
    // A cut source cannot prove where the first post-assessment group began.
    // Future actual answers can anchor an observed current M, without a fake date.
    if(h.cut&&h.seed.some(row=>row[0]>=r.day))continue;
    const ev=gjClone(h.seed);
    for(const entry of h.rows.slice().sort((a,b)=>(a.seq||0)-(b.seq||0))){
      const before=secureEvidence(ev),previous=ev.slice();ev.push(entry.row);if(ev.length>60)ev.shift();
      if(entry.seq<=gapConsumed(data,standard,quest,r))continue;
      gapObserve(journeys,{standard,quest,rating:r,row:entry.row,originalLevel:entry.originalLevel,sheet:entry.sheet,closed:entry.closed,secureBefore:before,secureAfter:secureEvidence(ev),complete:!h.seed.some(row=>row[0]>=r.day),previous,seq:entry.seq,used:data.used?.[standard]});
    }
    if(journeys[standard]){const u=data.used?.[standard];journeys[standard].usedAfter=u&&u.schoolDay<r.day?JSON.stringify(u):'';}
    if(h.uncertain&&journeys[standard]?.quests[quest]){journeys[standard].quests[quest].uncertain=true;delete journeys[standard].quests[quest].held;}
  }
  return data;
}
