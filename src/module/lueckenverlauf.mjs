import {secureEvidence} from './wissen.mjs';
import {schoolStandardsByQuest} from './standardkatalog.mjs';
const GJ_STANDARDS=schoolStandardsByQuest();
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
const gjClone=x=>JSON.parse(JSON.stringify(x));
const gjEmpty=complete=>({total:0,first:[],recent:[],complete,checks:[]});
function gjStep(p,entry,before,after){
  const {row,originalLevel,sheet,closed}=entry;
  const answer={ok:row[2]===1,level:originalLevel,help:(row[2]===1&&row[3]===false)||(row[1]===1&&originalLevel>1),...sheet?{sheet}:{}};
  if(closed&&p.closedAfter===undefined)p.closedAfter=p.total;
  if(p.held||p.closedAfter!==undefined){p.later ||= [];p.later.push(answer);p.later=p.later.slice(-GAP_CHECKS);}
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
export function gapObserve(journeys,{standard,quest,rating,row,originalLevel,secureBefore,secureAfter,complete=false,previous=[],sheet,closed=false,seq,used}){
  if(!standard||!rating||!['RS','C'].includes(rating.st)||row[0]<rating.day)return;
  let g=journeys[standard];
  if(!g||g.schoolDay!==rating.day)g=journeys[standard]={schoolDay:rating.day,quests:{},usedAfter:used&&used.schoolDay<rating.day?JSON.stringify(used):''};
  let p=g.quests[quest];
  if(!p)p=g.quests[quest]={...gjEmpty(complete),seed:gjClone(previous),journal:[],prefix:gjEmpty(complete)};
  const entry={row:row.slice(),originalLevel,...sheet?{sheet}:{},...closed?{closed:true}:{},...seq?{seq}:{}};
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
  if(p.uncertain){rebuilt.uncertain=true;delete rebuilt.held;}
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
  }
  for(const [quest,codes]of Object.entries(GJ_STANDARDS)){
    const standard=codes[0],r=ratings[standard],h=data.history?.[quest];
    if(!r||!['RS','C'].includes(r.st)||journeys[standard]?.quests[quest]||!h)continue;
    if(data.closed?.[standard]?.schoolDay>=r.day)continue;
    // A cut source cannot prove where the first post-assessment group began.
    // Future actual answers can anchor an observed current M, without a fake date.
    if(h.cut&&h.seed.some(row=>row[0]>=r.day))continue;
    const ev=gjClone(h.seed);
    for(const entry of h.rows){
      const before=secureEvidence(ev),previous=ev.slice();ev.push(entry.row);if(ev.length>60)ev.shift();
      if(entry.seq<=gapConsumed(data,standard,quest,r))continue;
      gapObserve(journeys,{standard,quest,rating:r,row:entry.row,originalLevel:entry.originalLevel,sheet:entry.sheet,closed:entry.closed,secureBefore:before,secureAfter:secureEvidence(ev),complete:!h.seed.some(row=>row[0]>=r.day),previous,seq:entry.seq,used:data.used?.[standard]});
    }
    if(journeys[standard]){const u=data.used?.[standard];journeys[standard].usedAfter=u&&u.schoolDay<r.day?JSON.stringify(u):'';}
    if(h.uncertain&&journeys[standard]?.quests[quest]){journeys[standard].quests[quest].uncertain=true;delete journeys[standard].quests[quest].held;}
  }
  return data;
}
