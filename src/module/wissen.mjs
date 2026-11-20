// One set of quantity/accuracy limits for the app and its event replay.
export const KNOWLEDGE_LIMITS=Object.freeze({minAnswers:6,meetsAcc:.8,meetsN:6,extAcc:.7,extN:4});
// Existing last-20 year-level window, shared with historical completeness checks.
export const KNOWLEDGE_YEAR_WINDOW=20;
export function meetsYearLevel(l2){return l2.length>=KNOWLEDGE_LIMITS.meetsN&&l2.reduce((n,r)=>n+r[2],0)/l2.length>=KNOWLEDGE_LIMITS.meetsAcc;}
export function secureEvidence(e){return e.length>=KNOWLEDGE_LIMITS.minAnswers&&meetsYearLevel(e.filter(r=>r[1]===2).slice(-KNOWLEDGE_YEAR_WINDOW));}
