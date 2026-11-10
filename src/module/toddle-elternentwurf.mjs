// Native iPad handoff to the existing school evaluation form in the test build.
export function toddleEntwurfKontext() {
  const target = schoolEvaluationTarget();
  const form = document.getElementById('pSchoolEvaluation');
  return target && form?.getClientRects().length ? JSON.stringify([target.author, target.id]) : null;
}

export function toddleEntwurfOeffnen(context, transfer, standard, rating) {
  if (!context || toddleEntwurfKontext() !== context) return 'context';
  if (typeof transfer !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(transfer) ||
      !Object.hasOwn(SCHOOL_EVALUATION_TARGETS, standard) || !['RS', 'C', 'M', 'E'].includes(rating)) return 'invalid';
  const target = schoolEvaluationTarget();
  if (schoolEvaluationDraft) return schoolEvaluationDraft.evaluation === transfer ? 'opened' : 'busy';
  if (schoolFromAccount(target.id)?.tasks.some(task => task.manual?.evaluation === transfer)) return 'saved';
  schoolEvaluationNotice = null;
  schoolEvaluationDraft = {
    child: target.id, author: target.author, title: '', day: '', standard, rating,
    evaluation: transfer, revision: crypto.randomUUID(), preview: false, focus: schoolEvaluationNeedsPractice(rating),
  };
  renderSheets();
  document.querySelector('#pSchoolEvaluation input[name="title"]')?.focus();
  return 'opened';
}
