// EP03: one title policy, fed by the app's existing common quest status.
// The old star ladder is used ONLY for the once-only legacy conversion.
export const RANKS = [[0,'Explorer',0,0],[3,'Investigator',0,0],[6,'Scientist',2,0],[12,'Professor',4,2],[18,'Legend',5,5]];
export const RANK_META={Explorer:{icon:'🧭',bg:'#D5F5EF',fg:'#0A5C52'},Investigator:{icon:'🔍',bg:'#DDE6FF',fg:'#1E3A9E'},Scientist:{icon:'🔬',bg:'#ECDFFF',fg:'#55259F'},Professor:{icon:'🎓',bg:'#FFE3CC',fg:'#833700'},Legend:{icon:'🌟',bg:'#FFF1B8',fg:'#634700'}};
export const RANK_POLICY='knowledge.v1';
export const RANK_MIGRATION='legacy.v1';
export const rankIdx=name=>RANKS.findIndex(r=>r[1]===name);
export const higherRank=(a,b)=>rankIdx(a)>rankIdx(b)?a:b;
export const legacyRankFor=stars=>RANKS[[0,25,60,120,250].filter(n=>(Number(stars)||0)>=n).length-1]?.[1]||'Explorer';
export function titleKnowledge(subjects,stand,hasQuest=()=>true){
  const seen=new Set(),breadth=new Set();let secure=0,extending=0;
  for(const subject of subjects)for(const quest of subject.items){
    if(quest.startsWith('studio:')||!hasQuest(quest))continue;
    const status=stand(quest);if(status!=='M'&&status!=='E')continue;
    if(seen.has(quest))continue;seen.add(quest);
    if(subject.key!=='learner'&&subject.key!=='events')breadth.add(subject.key);
    secure++;if(status==='E')extending++;
  }
  return{secure,subjects:breadth.size,extending};
}
export const knowledgeRankFor=p=>RANKS.filter(r=>p.secure>=r[0]&&p.subjects>=r[2]&&p.extending>=r[3]).at(-1)[1];
export const TITLE_TEXT={
  en:{path:'Your path to the next title',close:'Close',chip:n=>`Your title: ${n}. Show your path to the next title.`,new:n=>`New title: ${RANK_META[n].icon} ${n}!`,end:'You are a Legend! Keep exploring.',start:'Explorer · your starting title',secure:n=>`${n} secure quest${n===1?'':'s'}`,subjects:n=>`${n} subject${n===1?'':'s'}`,extending:n=>`${n} on E`,more:n=>n.replace(/^(\d+) /,'$1 more '),to:n=>`Next: ${n}`,current:p=>`${p.secure} secure quest${p.secure===1?'':'s'} · ${p.subjects} subject${p.subjects===1?'':'s'} · ${p.extending} on E`,rule:'Secure means M or E, including the school starting point. Me as a Learner and Events quests count, but these areas do not add subjects. Earned titles stay. Stars are collected separately.'},
  de:{path:'Dein Weg zum nächsten Titel',close:'Schließen',chip:n=>`Dein Titel: ${n}. Zeige deinen Weg zum nächsten Titel.`,new:n=>`Neuer Titel: ${RANK_META[n].icon} ${n}!`,end:'Du hast den Titel Legend erreicht. Entdecke weiter.',start:'Explorer · dein Starttitel',secure:n=>`${n} sichere Quest${n===1?'':'s'}`,subjects:n=>`${n} ${n===1?'Fach':'Fächer'}`,extending:n=>`${n} auf E`,more:n=>`Noch ${n}`,to:n=>`Nächstes Ziel: ${n}`,current:p=>`${p.secure} sichere Quest${p.secure===1?'':'s'} · ${p.subjects} ${p.subjects===1?'Fach':'Fächer'} · ${p.extending} auf E`,rule:'Sicher heißt M oder E, einschließlich des schulischen Startwerts. Quests aus Me as a Learner und Events zählen mit, diese Bereiche erhöhen aber nicht die Fächerzahl. Erreichte Titel bleiben. Sterne werden getrennt gesammelt.'}
};
export function titleRequirement(rank,lang='en'){
  const T=TITLE_TEXT[lang],r=RANKS[rankIdx(rank)];if(!r||!r[0])return T.start;
  return[T.secure(r[0]),r[2]?T.subjects(r[2]):'',r[3]?T.extending(r[3]):''].filter(Boolean).join(' · ');
}
export function titleNext(show,p,lang='en'){
  const T=TITLE_TEXT[lang],r=RANKS[rankIdx(show)+1];if(!r)return T.end;
  const parts=[p.secure<r[0]?T.secure(r[0]-p.secure):'',p.subjects<r[2]?T.subjects(r[2]-p.subjects):'',p.extending<r[3]?T.extending(r[3]-p.extending):''].filter(Boolean);
  return T.to(r[1])+(parts.length?' · '+parts.map(T.more).join(' · '):'');
}
export const TITLE_ABOUT={
 de:'<b>Titel des Kindes (Explorer …):</b> Explorer ist der Start. Investigator: 3 sichere Quests; Scientist: 6 aus mindestens 2 Fächern; Professor: 12 aus 4 Fächern, davon 2 auf E; Legend: 18 aus 5 Fächern, davon 5 auf E. Sicher heißt M oder E nach dem gemeinsamen Quest-Stand, einschließlich des schulischen Startwerts. Quests aus Me as a Learner und Events zählen mit, beide Bereiche jedoch nicht als Fächer. Erreichte Titel bleiben, auch bei der Umstellung. Sterne entscheiden keinen Titel mehr. Beim Antippen sieht das Kind, was zum nächsten Titel noch fehlt.',
 en:'<b>The child’s title (Explorer …):</b> Explorer is the starting title. Investigator: 3 secure quests; Scientist: 6 across at least 2 subjects; Professor: 12 across 4 subjects, including 2 on E; Legend: 18 across 5 subjects, including 5 on E. Secure means M or E in the common quest status, including the school starting point. Me as a Learner and Events quests count, but these areas do not count as subjects. Earned titles stay, including during the switch. Stars no longer decide titles. Tapping the title shows what remains for the next one.'
};
