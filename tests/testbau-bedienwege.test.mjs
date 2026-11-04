// Aufgabe 3b-2a (US7.2): dieselben Tests noch einmal gegen den TESTBAU - die langen Aufgaben-Durchlaeufe in der
// Node-Sandbox und einige Bedienwege im Browser. Die Browser-Tests lesen und legen den Speicher dabei ueber
// tests/testbau-leser.mjs (der Testbau speichert die abzugleichenden Werte nicht mehr, er liest sie aus den Ereignissen).
//
// Die ganze Reihe gegen den Testbau (einmal je Aufgabe, nicht in npm test): BQ_BAUART=test npm test
// Bewusst nicht gegen den Testbau (Pruefbericht 2026-11-04-stufe2-3b2a-lesen.md, "Ausschluesse"): Tests, die die
// Ablage des Live-Baus selbst pruefen (welche Schluessel physisch dastehen, Sicherung/Zurueckspielen - Aufgabe 6),
// und Tests, die als Kind Eltern-Funktionen direkt aufrufen bzw. die alte Fokus-Form uebernehmen (3c).
//   node --test tests/testbau-bedienwege.test.mjs

process.env.BQ_BAUART = 'test';
for (const datei of ['aufgaben-node', 'aufgaben-anpassung', 'showme', 'blaetter', 'profil', 'titel', 'spass']) await import(`./${datei}.test.mjs`);
