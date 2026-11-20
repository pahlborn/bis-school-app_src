// Canonical JSON is embedded by the existing single-file module build.
// These placeholders are resolved from docs/inhalte, never fetched at runtime.
export const DAILY_WORD_DATA=/*BQ_JSON:DAILY_WORD_DATA*/null;
export const DAILY_EXPLAIN_DATA=/*BQ_JSON:DAILY_EXPLAIN_DATA*/null;
export function dailyContent(items,day){
  const year=String(day).slice(0,4),ordinal=Math.floor((Date.parse(day+'T00:00:00Z')-Date.parse(year+'-01-01T00:00:00Z'))/864e5);
  return Array.isArray(items)&&items.length&&Number.isFinite(ordinal)?items[((ordinal%items.length)+items.length)%items.length]:null;
}

export const DAILY_TEXT={
 en:{word:'Word of the Day',open:'Explore today’s word',close:'Close',prompt:'What does this word mean?',correct:'Yes!',try:'Here is what it means:',example:'In a sentence',invitation:'A little word to explore.',explain:'Explain it · a question to talk about',conversation:'Ask your child and explore the idea together.'},
 de:{word:'Word of the Day',open:'Das heutige Wort entdecken',close:'Schließen',prompt:'Was bedeutet dieses Wort?',correct:'Ja!',try:'Das bedeutet es:',example:'In einem Satz',invitation:'Ein kleines Wort zum Entdecken.',explain:'Explain it · eine Frage zum Gespräch',conversation:'Fragen Sie Ihr Kind und erkunden Sie die Idee gemeinsam.'}
};
export function createDailyContentUI({day,language,parentLanguage,canParentRead,feedbackHTML,bindFeedback,escape:esc}){
 function wordHTML(){const T=DAILY_TEXT[language()];return `<section class="pcard" id="dailyWord"><h2>${T.word}</h2><p class="small">${T.invitation}</p><button type="button" class="btn small" data-open-word>${T.open}</button><div data-word-body hidden></div></section>`;}
 function bindWord(root){
  root.querySelectorAll('[data-open-word]').forEach(button=>button.addEventListener('click',()=>{
   const lang=language(),T=DAILY_TEXT[lang],w=dailyContent(DAILY_WORD_DATA.items,day()),box=button.parentElement.querySelector('[data-word-body]');
   if(!box.hidden){box.hidden=true;button.textContent=T.open;return;}
   button.textContent=T.close;box.hidden=false;
   box.innerHTML=`<h3 lang="en">${esc(w.word)}</h3><p>${T.prompt}</p><div class="word-options">${w.options.map((option,i)=>`<button type="button" class="btn small" data-word-option="${i}" lang="en">${esc(option)}</button>`).join('')}</div><div data-word-answer></div>${feedbackHTML('word',String(w.day),lang)}`;
   box.querySelectorAll('[data-word-option]').forEach(answer=>answer.addEventListener('click',()=>{
    box.querySelector('[data-word-answer]').innerHTML=`<p>${Number(answer.dataset.wordOption)===w.answer?T.correct:T.try} <b lang="en">${esc(w.options[w.answer])}</b></p><p>${T.example}: <span lang="en">${esc(w.example)}</span></p>`;
    box.querySelectorAll('[data-word-option]').forEach(b=>b.disabled=true);
   }));bindFeedback(box);
  }));
 }
 function explainHTML(){
  if(!canParentRead())return '';
  const T=DAILY_TEXT[parentLanguage()],q=dailyContent(DAILY_EXPLAIN_DATA.items,day());
  return `<section class="pcard" id="pDailyExplain"><h2>${T.explain}</h2><p lang="en">${esc(q.question)}</p><p class="small">${T.conversation}</p></section>`;
 }
 return{wordHTML,bindWord,explainHTML};
}
