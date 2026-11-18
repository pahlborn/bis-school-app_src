// Shared EP01 audit: all longest ties are visible, and a k-way tie gives the
// right answer 1/k of a longest-answer guess. Counting every equal-length number
// as a full win would call four indistinguishable numbers 100% guessable.
import {text,appSandbox} from '../app-sandbox.mjs';
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
    return !q.count || q.strictRate>EP01_MAX_LONGEST+1e-12 || q.longestShare>EP01_MAX_LONGEST+1e-12 ? [{name,...q,...(!q.count?{reason:'unreachable or unparsable collection'}:{})}]:[];
  });
}
// Only this small, existing consumer grammar is accepted. Anything else remains
// an explicit unknown collection, even when the branch was not reached at runtime.
const consumerCalls=source=>[...source.matchAll(/\b(?:bankMC|fromBank)\s*\(\s*([^,\n]+)/g)].map(m=>m[1].trim());
function bankRows(value){
  if(!Array.isArray(value)||!value.length)return [];
  let rows=value.filter(r=>Array.isArray(r)&&typeof r[0]==='string'&&typeof r[1]==='string'&&Array.isArray(r[2])&&r[2].every(w=>typeof w==='string')&&typeof r[3]==='string').map(r=>({kind:'mc',prompt:r[0],options:[r[1],...r[2]],answer:0,level:typeof r[4]==='number'?r[4]:2}));
  if(!rows.length)rows=value.filter(r=>Array.isArray(r)&&typeof r[1]==='string'&&typeof r[2]==='string'&&Array.isArray(r[3])&&r[3].every(w=>typeof w==='string')&&typeof r[4]==='string').map(r=>({kind:'mc',prompt:r[1],options:[r[2],...r[3]],answer:0,level:2}));
  return rows;
}
export function discoverBanks(S,source){
  const result={},known=new Set([...PENDING_BANKS,'ROUND_MC']);
  // Case is irrelevant. This also sees unconsumed global banks; local/multiple
  // declarations are covered by the consumers below, not guessed via eval.
  for(const name of new Set([...source.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/g)].map(m=>m[1]).concat('ROUND_MC'))){
    let value;try{value=S.holen(name);}catch{continue;}
    const rows=bankRows(value);if(rows.length)result[name]=rows.filter(r=>r.level!==1);
  }
  // Keep EVERY distinct observed array, including earlier bad arrays under an
  // expression that is later used for a legitimate forwarding. Names are not proof.
  const seen=[];
  const instrumented=source.replace(/\b(bankMC|fromBank)\s*\(\s*([^,\n]+)/g,(whole,fn,expr)=>{
    // Known simple identifiers and .concat(otherBank) are the existing grammar.
    if(!/^\w+(?:\.concat\(\w+\))?$/.test(expr.trim()))return whole;
    return `${fn}(__ep01BankConsumer(${JSON.stringify(expr.trim())},${expr})`;
  });
  const observed=appSandbox({seed:18112026,anpassen:()=>instrumented,globale:{__ep01BankConsumer:(name,bank)=>{seen.push({name,bank});return bank;}}});
  for(const [name,world]of Object.entries(observed.holen('WORLDS'))){
    if(name==='today'||name.startsWith('mix_')||typeof world.build!=='function')continue;
    observed.lauf(()=>world.build());
  }
  // Compare references in THIS observed app, never across the two VM contexts.
  const globals=new Map([...known].map(name=>[name,observed.holen(name)]));
  const allowedArrays=new Set(globals.values());
  // A concat creates a new array. Certify it only when its complete ordered row
  // identities are exactly those of the actual classified global inputs.
  for(const {name,bank}of seen){
    const concat=/^(\w+)\.concat\((\w+)\)$/.exec(name);
    if(!concat||!globals.has(concat[1])||!globals.has(concat[2])||!Array.isArray(bank))continue;
    const expected=globals.get(concat[1]).concat(globals.get(concat[2]));
    if(bank.length===expected.length&&bank.every((row,i)=>row===expected[i]))allowedArrays.add(bank);
  }
  for(const expr of new Set(consumerCalls(source))){
    const grammar=/^(\w+)(?:\.concat\((\w+)\))?$/.exec(expr);
    const refs=grammar?[grammar[1],grammar[2]].filter(Boolean):[];
    const arrays=[...new Set(seen.filter(record=>record.name===expr).map(record=>record.bank))];
    const foreign=arrays.filter(bank=>!allowedArrays.has(bank));
    if(foreign.length){
      // A familiar identifier may shadow a global. Its foreign values must be
      // unknown keys; do not overwrite or silently classify the genuine global.
      const key=known.has(expr)||expr==='bank'?'FOREIGN:'+expr:expr;
      foreign.forEach((bank,i)=>{result[key+(i?'#'+(i+1):'')]=bankRows(bank).filter(r=>r.level!==1);});
    }else if(!grammar || refs.some(name=>name!=='bank'&&!known.has(name))){
      // Unreached or unparsable unknown consumers remain explicit failures.
      // `bank` is only the existing helper parameter: every observed value above
      // still requires real global/concat identity, with no generic-name waiver.
      result[expr]=bankRows(arrays[0]).filter(r=>r.level!==1);
    }
  }
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
export const MC_CALLSITE_INVENTORY=["nearestHundredQ","benchmarkQ","roundWordQ","roundThousandQ","addendsQ","estimateQ","threeAddendsQ","distanceExplainQ","halfwayQ","tenVsHundredQ","roundTenQ","mc","two","takeFrom","varCtrlQ","clockRead","clockPick","ampm","numberLine","placeValue","expandedZeroQ","oddEven","mental","buildRounding","oreoMC","opinionFact","affixQ","inferenceQ","buildWords","buildLibrary","packQ","buildTrip","buildMusic","unitPickQ","convertQ","rulerQ","barReadQ","barMissingQ","tableConclusionQ","scaleStepQ","lineGraphQ","massRecordQ","buildGraphs","buildFinish","capitalFixQ","properNounQ","specificExampleQ","buildExamples","combosQ","anotherWayQ","reasonableQ","frictionTableQ","buildChampion","travelTableQ","estimateTotalQ","betweenHundredsQ","splitQ","buildOpinion","buildTeam","stickerComboQ","roundTenAddQ","buildStickers","findTotalQ","operationQ","calcCheckQ","buildWordProb","trennbarQ","zusammenQ","buildAnleitung","buildPoetry","buildSchool","baseQ","numbersBaseQ","combosBaseQ","wordprobBaseQ","unitsBaseQ","graphsBaseQ","arrayQ","shadedQ","unitCompareQ","areaWhichQ","laterQ","massUnitQ","kitchenScaleQ","roundedQuestion","bridgeFor","direct-MC-sites=116"];
export function discoverMcCallsites(source){
  const f=[...source.matchAll(/^function (\w+)\(/gm)];
  const names=f.filter((m,i)=>/\b(?:mc|two|bankMC|fromBank)\(/.test(source.slice(m.index,f[i+1]?.index))).map(m=>m[1]);
  // New arrows, methods, or a second call inside an old function must not hide
  // behind the same conservative function name. Count all direct consumer sites.
  return names.concat('direct-MC-sites='+[...source.matchAll(/\b(?:mc|two|bankMC|fromBank)\s*\(/g)].length);
}
