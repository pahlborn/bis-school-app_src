// Voluntary content choices, never task ratings or learning evidence.
export function contentVoteState(votes,rejected,vote){
  const next={...(votes&&typeof votes==='object'&&!Array.isArray(votes)?votes:{})};
  next[vote.kind+':'+vote.item]={kind:vote.kind,item:vote.item,value:vote.value};
  const banned=Array.isArray(rejected)?rejected.slice():[];
  if(vote.kind==='joke'&&vote.value==='down'&&!banned.includes(vote.item))banned.push(vote.item);
  return{votes:next,rejected:banned};
}
export const FEEDBACK_TEXT={
 en:{up:'I like this',down:'Not for me',optional:'Your choice',hide:'👎 means this joke will not be shown again.',hidden:'This joke will not be shown again.',heading:'What your child likes',empty:'No content choices are saved here yet.',kinds:{joke:'Joke',story:'Pisolala',word:'Word of the Day'},none:'There is no joke to show here. You can choose something else.'},
 de:{up:'Das gefällt mir',down:'Nicht so meins',optional:'Deine Wahl',hide:'Mit 👎 wird dieser Witz nicht noch einmal gezeigt.',hidden:'Dieser Witz wird nicht noch einmal gezeigt.',heading:'Was deinem Kind gefällt',empty:'Hier sind noch keine Inhaltsdaumen gespeichert.',kinds:{joke:'Witz',story:'Pisolala',word:'Word of the Day'},none:'Hier gibt es gerade keinen Witz. Du kannst etwas anderes wählen.'}
};

export function createContentFeedbackUI({store,eventHook,canVote,language,parentLanguage,canParentRead,jokes,stories,words,escape:esc}){
 const rejected=()=>{const v=store.get('jokeRejected',[]);return Array.isArray(v)?v:[];};
 function html(kind,item,lang=language()){
  if(!canVote())return '';
  const T=FEEDBACK_TEXT[lang],vote=store.get('contentFeedback',{})[kind+':'+item],hidden=kind==='joke'&&rejected().includes(item);
  return `<div class="content-feedback"><span class="small">${T.optional}</span> ${['up','down'].map(value=>`<button type="button" class="btn small" data-content-vote="${value}" data-content-kind="${kind}" data-content-item="${esc(item).replace(/"/g,'&quot;')}" aria-label="${value==='up'?T.up:T.down}" aria-pressed="${vote?.value===value}">${value==='up'?'👍':'👎'}</button>`).join('')}${kind==='joke'?`<p class="small">${hidden?T.hidden:T.hide}</p>`:''}</div>`;
 }
 function bind(root){
  root.querySelectorAll('[data-content-vote]').forEach(button=>{if(button.dataset.contentBound)return;button.dataset.contentBound='1';button.addEventListener('click',()=>{
   if(!canVote())return;
   const payload={kind:button.dataset.contentKind,item:button.dataset.contentItem,value:button.dataset.contentVote},votes=store.get('contentFeedback',{});
   if(votes[payload.kind+':'+payload.item]?.value===payload.value)return;
   const next=contentVoteState(votes,store.get('jokeRejected',[]),payload);store.set('contentFeedback',next.votes);store.set('jokeRejected',next.rejected);eventHook('content_vote',payload);
   button.closest('.content-feedback').outerHTML=html(payload.kind,payload.item);bind(root);
  });});
 }
 function parentHTML(){
  if(!canParentRead())return '';
  const lang=parentLanguage(),T=FEEDBACK_TEXT[lang],votes=Object.values(store.get('contentFeedback',{}));
  for(const item of rejected())if(!votes.some(v=>v.kind==='joke'&&v.item===item))votes.push({kind:'joke',item,value:'down'});
  const label=v=>v.kind==='joke'?(jokes.find(j=>j.id===v.item)?.q||v.item):v.kind==='story'?(stories.find(s=>s.id===v.item)?.title[lang]||v.item):(words.find(w=>String(w.day)===v.item)?.word||v.item);
  return `<section class="pcard" id="pContentFeedback"><h2>${T.heading}</h2>${votes.length?`<ul>${votes.slice(-6).reverse().map(v=>`<li>${v.value==='up'?'👍':'👎'} ${T.kinds[v.kind]||''}: ${esc(label(v))}${v.kind==='joke'&&rejected().includes(v.item)?` · ${T.hidden}`:''}</li>`).join('')}</ul>`:`<p>${T.empty}</p>`}</section>`;
 }
 return{html,bind,parentHTML};
}
