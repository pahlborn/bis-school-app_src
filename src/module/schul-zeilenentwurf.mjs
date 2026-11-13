// Native iPad handoff to the existing school evaluation form in the test build.
export function schulZeilenKontext() {
  const target = schoolEvaluationTarget();
  const form = document.getElementById('pSchoolEvaluation');
  return target && form?.getClientRects().length ? JSON.stringify([target.author, target.id]) : null;
}

export function schulZeilenOeffnen(context, transfer, standard, rating) {
  if (!context || schulZeilenKontext() !== context) return 'context';
  if (typeof transfer !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(transfer) ||
      !Object.hasOwn(SCHOOL_EVALUATION_TARGETS, standard) || !['RS', 'C', 'M', 'E'].includes(rating)) return 'invalid';
  const target = schoolEvaluationTarget();
  if (schoolEvaluationDraft?.child === target.id && schoolEvaluationDraft.author === target.author) {
    return schoolEvaluationDraft.evaluation === transfer ? 'opened' : 'busy';
  }
  if (schoolFromAccount(target.id)?.tasks.some(task => task.manual?.evaluation === transfer)) return 'saved';
  schoolEvaluationNotice = null;
  schoolEvaluationDraft = {
    child: target.id, author: target.author, title: '', day: '', standard, rating,
    evaluation: transfer, revision: crypto.randomUUID(), preview: false, focus: schoolEvaluationNeedsPractice(rating),
  };
  const form = document.getElementById('pSchoolEvaluation');
  const area = form.parentElement;
  form.outerHTML = schoolEvaluationHTML();
  bindSchoolEvaluation(area);
  area.querySelector('#pSchoolEvaluation input[name="title"]')?.focus();
  return 'opened';
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'bigQuestSchoolRow', {
    value: Object.freeze({ context: schulZeilenKontext, open: schulZeilenOeffnen }),
  });
}

// The native app opens the same draft used by manual entry; saving remains in Big Quest.
export function schulFormularQuelle(context, transfer, source) {
  if (!context || schulZeilenKontext() !== context) return 'context';
  if (typeof transfer !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(transfer) || typeof source !== 'string' || !source.trim() || new TextEncoder().encode(source).length > 48000) return 'invalid';
  const target = schoolEvaluationTarget();
  if (schoolFromAccount(target.id)?.tasks.some(t => t.manual?.evaluation === transfer)) return 'saved';
  if (schoolEvaluationDraft?.child === target.id && schoolEvaluationDraft.author === target.author) {
    return schoolEvaluationDraft.evaluation === transfer ? 'opened' : 'busy';
  }
  schoolEvaluationNotice = null;
  schoolEvaluationDraft = {child:target.id,author:target.author,title:'',day:'',standard:'unmapped',rating:'N',assessment:schoolDocumentNew(),source,
    evaluation:transfer,revision:crypto.randomUUID(),preview:false,focus:false};
  const area=document.getElementById('pSchoolEvaluation').parentElement;
  document.getElementById('pSchoolEvaluation').outerHTML=schoolEvaluationHTML();
  bindSchoolEvaluation(area);
  return 'opened';
}
if(typeof window!=='undefined') Object.defineProperty(window,'bigQuestEvaluationForm',{value:Object.freeze({context:schulZeilenKontext,source:schulFormularQuelle})});
