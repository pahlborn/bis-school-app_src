// Shared EP01 audit: all longest ties are visible, and a k-way tie gives the
// right answer 1/k of a longest-answer guess. Counting every equal-length number
// as a full win would call four indistinguishable numbers 100% guessable.
import {text} from '../app-sandbox.mjs';
export const EP01_MAX_LONGEST=1/3; // 25% chance with four options + 8 1/3pp tolerance, no rounding up.
export function lengthQuality(questions){
  let strict=0,tied=0,share=0;
  for(const q of questions){
    const lengths=q.options.map(x=>Array.from(text(x)).length), right=lengths[q.answer], max=Math.max(...lengths);
    if(right===max){const count=lengths.filter(x=>x===max).length; if(count===1) strict++; else tied++; share+=1/count;}
  }
  return {count:questions.length,strict,tied,strictRate:strict/questions.length,longestShare:share/questions.length};
}
export function qualityFailures(collections){
  return Object.entries(collections).flatMap(([name,questions])=>{
    const q=lengthQuality(questions);
    return q.strictRate>EP01_MAX_LONGEST+1e-12 || q.longestShare>EP01_MAX_LONGEST+1e-12 ? [{name,...q}]:[];
  });
}
// Auto-discover actual static MC banks, including read-then-answer tuples.
// No list of bank names can silently miss a future uppercase bank.
export function discoverBanks(S,source){
  const result={};
  for(const name of new Set([...source.matchAll(/\b(?:const|let)\s+([A-Z][A-Z_0-9]*)\s*=/g)].map(m=>m[1]).concat('ROUND_MC'))){
    let value; try{value=S.holen(name);}catch{continue;}
    if(!Array.isArray(value)||!value.length) continue;
    let rows=value.filter(r=>Array.isArray(r)&&typeof r[0]==='string'&&typeof r[1]==='string'&&Array.isArray(r[2])&&r[2].every(w=>typeof w==='string')&&typeof r[3]==='string').map(r=>({kind:'mc',prompt:r[0],options:[r[1],...r[2]],answer:0,level:typeof r[4]==='number'?r[4]:2}));
    if(!rows.length) rows=value.filter(r=>Array.isArray(r)&&typeof r[1]==='string'&&typeof r[2]==='string'&&Array.isArray(r[3])&&r[3].every(w=>typeof w==='string')&&typeof r[4]==='string').map(r=>({kind:'mc',prompt:r[1],options:[r[2],...r[3]],answer:0,level:2}));
    if(rows.length) result[name]=rows.filter(r=>r.level!==1);
  }
  // OPFACT and SPECIFIC use their own tuple/object shape, not a standard MC bank.
  result.OPFACT=S.holen('OPFACT').filter(s=>s.level!==1).flatMap(s=>[[s.op,s.fact],[s.fact,s.op]].flatMap(([right,wrong])=>right.map(r=>({options:[r,...wrong],answer:0}))));
  result.SPECIFIC=S.holen('SPECIFIC').filter(r=>r[3]!==1).map(r=>({options:[r[1],r[2]],answer:0}));
  return result;
}
// Pending is explicit debt, NOT acceptance or an exemption. The standalone audit
// exits nonzero for these failures. Only foundation and Word of the Day are exempt.
export const PENDING_BANKS=['ANL_MC','CHAMP_MC','COMPLETE_MC','COOP_MC','HYPO','INFER','LIB_MC','MUS_MC','NOW_MC','OPFACT','OPINION_MC','OREO_MC','POE_MC','PREFIX','RESP_MC','SCH_MC','SCI','SCI_READ','SPECIFIC','STK_MC','SUFFIX','TEAM_MC','TRIP_MC','WPR_MC'];

// Conservative direct-MC callsite inventory; arrows after a function can be
// attributed to that preceding function. Extra entries are safe; a new callsite
// never silently passes. This inventory proves discovery, not generator quality.
export const MC_CALLSITE_INVENTORY=["nearestHundredQ","benchmarkQ","roundWordQ","roundThousandQ","addendsQ","estimateQ","threeAddendsQ","distanceExplainQ","halfwayQ","tenVsHundredQ","roundTenQ","mc","two","takeFrom","varCtrlQ","clockRead","clockPick","ampm","numberLine","placeValue","expandedZeroQ","oddEven","mental","buildRounding","oreoMC","opinionFact","affixQ","inferenceQ","buildWords","buildLibrary","packQ","buildTrip","buildMusic","unitPickQ","convertQ","rulerQ","barReadQ","barMissingQ","tableConclusionQ","scaleStepQ","lineGraphQ","massRecordQ","buildGraphs","buildFinish","capitalFixQ","properNounQ","specificExampleQ","buildExamples","combosQ","anotherWayQ","reasonableQ","frictionTableQ","buildChampion","travelTableQ","estimateTotalQ","betweenHundredsQ","splitQ","buildOpinion","buildTeam","stickerComboQ","roundTenAddQ","buildStickers","findTotalQ","operationQ","calcCheckQ","buildWordProb","trennbarQ","zusammenQ","buildAnleitung","buildPoetry","buildSchool","baseQ","numbersBaseQ","combosBaseQ","wordprobBaseQ","unitsBaseQ","graphsBaseQ","arrayQ","shadedQ","unitCompareQ","areaWhichQ","laterQ","massUnitQ","kitchenScaleQ","roundedQuestion","bridgeFor"];
export function discoverMcCallsites(source){
  const f=[...source.matchAll(/^function (\w+)\(/gm)];
  return f.filter((m,i)=>/\b(?:mc|two|bankMC|fromBank)\(/.test(source.slice(m.index,f[i+1]?.index))).map(m=>m[1]);
}
