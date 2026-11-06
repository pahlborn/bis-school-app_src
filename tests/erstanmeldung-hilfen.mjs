// Hilfen fuer Sandbox-Tests (tests/app-sandbox.mjs) mit Einladungslinks (Aufgabe "Erstanmeldung per QR-Code", 06.11.):
// Ein Startlink fuehrt ohne Rollenwahl zum Passwortformular, das fest im HTML steht (#kontoNeu, ausserhalb von
// #loginBody). G = ein Geraet der Tests ({ S: appSandbox(...), name }).

/* das Passwortformular der Einladung, solange es in der Seite und sichtbar ist (sel: ein Element darin) - sonst null */
export const neuFormular = (G, sel) => G.S.lauf(() => {
  const w = G.S.$('#kontoNeu');
  if (!w || !w.parentNode || w.hidden) return null;
  return sel ? w.querySelector(sel) : w;
});

/* wartet auf das Passwortformular, nimmt das Merkpasswort (oder pw) und schickt ab -> das Passwort */
export async function registrieren(G, pw, ms = 30000) {
  const t0 = Date.now();
  while (!neuFormular(G, '#kontoNeuForm')) {
    if (Date.now() - t0 > ms) throw new Error(G.name + ': kein Passwortformular der Einladung - Seite: ' + G.S.lauf(() => G.S.$('#loginBody').textContent).slice(0, 300));
    await new Promise((r) => setTimeout(r, 15));
  }
  G.S.lauf(() => { if (pw) neuFormular(G, '#kontoNeuPw').value = pw; else neuFormular(G, '#kontoNeuUse').click(); });
  const wert = G.S.lauf(() => neuFormular(G, '#kontoNeuPw').value);
  G.S.lauf(() => { const f = neuFormular(G, '#kontoNeuForm'); f.dispatchEvent({ type: 'submit', target: f, currentTarget: f, preventDefault() {}, stopPropagation() {} }); });
  return wert;
}

/* wartet auf die Zeile ueber der Rollenwahl (#loginMeldung, z. B. "❌ Dieser Startcode gilt nicht (mehr)") -> ihr Text */
export async function linkMeldung(G, ms = 30000) {
  const t0 = Date.now();
  for (;;) {
    const t = G.S.lauf(() => { const m = G.S.$('#loginBody').querySelector('#loginMeldung'); return m ? m.textContent : null; });
    if (t) return t;
    if (Date.now() - t0 > ms) throw new Error(G.name + ': keine Meldung - Seite: ' + G.S.lauf(() => G.S.$('#loginBody').textContent).slice(0, 300));
    await new Promise((r) => setTimeout(r, 15));
  }
}
