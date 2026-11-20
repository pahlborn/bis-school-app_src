// Directly revised parent texts; no storage or clock.
export const PARENT_REWARD_COPY={
 de:{secondRight:'<b>Zweiter Versuch richtig:</b> Die vor der Aufgabe angezeigte Sternbelohnung gilt auch mit Hilfe. Dazu gibt es eine kurze Erklärung.',titles:'<b>Beförderungen zu neuen Titeln</b> richten sich nach sicheren Quests, nicht nach Sternen. Bereits erreichte Titel bleiben erhalten, auch wenn die neuen Anforderungen noch nicht erfüllt sind. <b>Lernbaum und Abzeichen</b> würdigen weiter Ausdauer und Verhalten.'},
 en:{secondRight:'<b>Second try right:</b> The star reward shown before the task also applies with help, followed by a short explanation.',titles:'<b>New title promotions</b> depend on secure quests, not stars. Earned titles stay, even if the new requirements are not met. <b>The learning tree and badges</b> continue to recognize persistence and behavior.'}
};
export const PT={
  de:{home:'🏠 Übersicht',sheets:'📄 Übungsblätter',settings:'👧 Für das Kind',help:'💡 Helfen wie die Schule',
    
    howSheets:'Ihr Kind trägt die Antworten selbst ein: Startseite → „My sheets“. Hier sehen Sie, wie jede Aufgabe lief.',
    back:'← Alle Fächer',focus:'Im Fokus',fm:'🎯 Fokus',pvT:'Ausblick: Themen für später',pvTxt:'Diese Themen kommen meist später im Schuljahr. Ihr Kind sieht sie erst, wenn Sie sie hier freigeben. Zum Beispiel, wenn sie in der Schule drankommen oder Ihr Kind neugierig ist.',pvBtn:'Für das Kind freigegeben',pvOn:'freigegeben',pvOff:'nicht freigegeben',fAuto:'Automatisch',fMan:'Manuell',school:'nächster Schritt laut Schule',need:'braucht Übung',gap:d=>'Lücke laut Schule ('+d+')',gapWait:'wartet',how:'💡 So helfen Sie',
    basis:'Worauf beruht das?',trend:'Tendenz',recent:'Aktualität',sure:'Belegumfang',when:'Breitere Belege ab etwa 20 ersten Versuchen; der Quest-Stand gilt schon vorher.',
    tasks:(n,d)=>`${n} Aufgaben an ${d} ${d===1?'Tag':'Tagen'}`,self:'selbst gelöst',hint:'mit Hilfe',ex:n=>`davon ${n} mit Beispiel`,seen:'Lösungsweg angesehen',due:n=>`${n} Wiederholung${n===1?'':'en'} offen`,
    none:'noch nicht geübt',ago:n=>n===0?'heute geübt':n===1?'gestern geübt':`vor ${n} Tagen geübt`,old:'Ältere Belege – bei Gelegenheit neu prüfen',
    tr:{up:'↗ steigend',flat:'→ gleichbleibend',down:'↘ fallend',none:'noch keine verlässliche Tendenz'},
    sw:{few:'wenig Belege',provisional:'erste Belege',confirmed:'breitere Belege'},
    sumT:'Einschätzung',sumIntro:(nm,d)=>`${nm} hat in den letzten 14 Tagen an ${d} ${d===1?'Tag':'Tagen'} geübt.`,noData:'Auf diesem Gerät wurde noch nicht geübt.',
    good:'⭐ Das gelingt schon gut',support:'🤝 Hier hilft Unterstützung',few:'👀 Noch nicht einschätzbar',oldT:'🕰️ Länger nicht geübt',
    goodLine:(q,a)=>a.n?`<b>${q}:</b> ${a.self} von ${a.n} Aufgaben selbst gelöst (${PT.de.sw[a.sure]}).`:`<b>${q}:</b> ${a.schoolBase?'Stand laut Schule':a.evidenceN+' gespeicherte Antworten'}.`,
    fewLine:'Zu wenige Aufgaben für eine Einschätzung – das sagt nichts Schlechtes.',
    disc:'Übungsstand der App, keine schulische Beurteilung. Das Kind sieht diese Einschätzung nicht.',child:'Ihr Kind',focusN:n=>`${n} im Fokus`,quests:n=>`${n} Quests`},
  en:{home:'🏠 Overview',sheets:'📄 Practice sheets',settings:'👧 For your child',help:'💡 Help like the school',
    
    howSheets:'Your child enters the answers: start page → “My sheets”. Here you see how each task went.',
    back:'← All subjects',focus:'In focus',fm:'🎯 Focus',pvT:'Coming up: topics for later',pvTxt:'These topics usually come later in the school year. Your child only sees them once you turn them on here. For example, when they come up at school or your child is curious.',pvBtn:'Visible to your child',pvOn:'turned on',pvOff:'turned off',fAuto:'Automatic',fMan:'Manual',school:'next step per school',need:'needs practice',gap:d=>'gap per school ('+d+')',gapWait:'waiting',how:'💡 How you can help',
    basis:'What is this based on?',trend:'Trend',recent:'How recent',sure:'Evidence amount',when:'Broader evidence from about 20 first tries; the quest status already applies before that.',
    tasks:(n,d)=>`${n} tasks on ${d} ${d===1?'day':'days'}`,self:'on own',hint:'with help',ex:n=>`${n} of them with an example`,seen:'solution viewed',due:n=>`${n} review${n===1?'':'s'} open`,
    none:'not practiced yet',ago:n=>n===0?'practiced today':n===1?'practiced yesterday':`practiced ${n} days ago`,old:'Older evidence – check again when convenient',
    tr:{up:'↗ rising',flat:'→ steady',down:'↘ falling',none:'no reliable trend yet'},
    sw:{few:'little evidence',provisional:'initial evidence',confirmed:'broader evidence'},
    sumT:'Summary',sumIntro:(nm,d)=>`${nm} practiced on ${d} ${d===1?'day':'days'} in the last 14 days.`,noData:'No practice on this device yet.',
    good:'⭐ Going well',support:'🤝 Where support helps',few:'👀 Not yet possible to judge',oldT:'🕰️ Not practiced for a while',
    goodLine:(q,a)=>a.n?`<b>${q}:</b> ${a.self} of ${a.n} tasks on own (${PT.en.sw[a.sure]}).`:`<b>${q}:</b> ${a.schoolBase?'Starting point from school':a.evidenceN+' saved answers'}.`,
    fewLine:'Too few tasks to tell yet – that says nothing bad.',
    disc:'App practice status, not a school assessment. The child does not see this summary.',child:'your child',focusN:n=>`${n} in focus`,quests:n=>`${n} quests`}
};
