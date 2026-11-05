# Schriftarten einbetten (05.11.2026)

Vorgabe Peter (05.11., Datenschutz-Entwurf, offener Punkt 2): „ja, einbetten“. Die App lädt nichts mehr von Google Fonts; die Schriften sehen gleich aus. Betrifft die echte App – **nicht veröffentlicht** (macht die Koordination nach Peters Freigabe).

## Umgesetzt

- `index.html`: die zwei Google-Zeilen sind weg, an ihrer Stelle die Marke `<style>/*BQ_SCHRIFTEN*/</style>`.
- `werkzeug/schriften/schriften.json`: Fredoka und Nunito als Base64-Text (kein Binärdatei-Push). Je Familie **eine** variable WOFF2-Datei, nur der lateinische Teilsatz – genau die Dateien, die Google Fonts für die bisherige Bestellung (Fredoka 500/600/700, Nunito 400/600/700/800) ausgeliefert hat. Zeichen: Grundlatein, Latin-1 (Umlaute, ß), U+2000–206F (typografische Anführungszeichen, Striche), €. Mit Größe und SHA-256 je Datei.
- `werkzeug/schriften.mjs`: setzt beim Bauen `@font-face` mit `data:`-Adressen ein (`font-weight` 500–700 bzw. 400–800, `font-display:swap`); Marke nicht genau einmal → Abbruch. `appZusammensetzen` (Kathies App, Testinstanz, künftige Familienfassung) setzt die Schriften immer ein.
- Suchlauf `schriftenPruefen`: kein `fonts.googleapis.com`/`fonts.gstatic.com`, Marke ersetzt, jede Schrift genau einmal und vollständig. `distBauen` bricht bei einem Fund ab, bevor etwas geschrieben wird; die Testinstanz hat ihn als 17. Prüfung „Schriften eingebettet, nichts von Google Fonts“.
- Testinstanz: Wortsuche ohne die rund 90 KB Base64 (sonst träfen kurze verbotene Wörter zufällig); die Umwandlung (Ersetzungen ohne Rücksicht auf Groß/klein) lässt die Schriftdaten unberührt.
- Lizenz: `werkzeug/schriften/OFL.txt` (SIL Open Font License 1.1, beide Urheber). In „Über die App → Quellen“ (Gruppe „Technik und Datenschutz“, DE/EN) genannt, mit Link auf openfontlicense.org.
- Datenschutz in „Über die App“: Satz zu Google Fonts entfernt (DE/EN); der Abschnitt beginnt mit „**Vorläufige Fassung, noch nicht DSGVO-konform.**“ / „**Preliminary version, not yet GDPR-compliant.**“

## Größe

| | vorher | nachher | Zuwachs |
|---|---|---|---|
| Kathies App im Tresor (Klartext, mit Konten und Schuldaten) | 796 075 B (777 KB) | 888 118 B (867 KB) | +92 043 B (+11,6 %) |
| Veröffentlichte Datei (verschlüsselt) | 1 068 691 B (1 044 KB) | 1 191 424 B (1 164 KB) | +122 733 B (+11,5 %) |
| Testinstanz (Klartext) | – | 1 175 050 B | +92 KB |

Bisher lud jedes Gerät die beiden Schriften zusätzlich von Google (≈ 69 KB). Unterm Strich wächst die Übertragung also um rund 54 KB; dafür sieht Google keine Adresse mehr und die Schrift ist auch ohne Netz sofort da.

Nicht gemacht (bewusst): die Gewichtsachse der variablen Schriften weiter einkürzen (bringt wenige KB, braucht ein zusätzliches Werkzeug).

## Prüfung

- Vorab: kein Zeichen der App, das bisher aus einem anderen Google-Teilsatz (latin-ext, kyrillisch …) kam – alles, was nicht im lateinischen Satz liegt (Emoji, Pfeile), kam schon vorher aus der Systemschrift.
- Neu `tests/schriften.test.mjs` (6 Tests): Quelle (Marke, keine Google-Adresse, Prüfsummen, Lizenztext, Texte DE/EN), Kathies App (Tresor entschlüsselt: beide Schriften genau einmal, Größe), Testinstanz (Suchlauf, Schutz bei der Umwandlung), Gegenproben im Test (Google-Zeile → Suchlauf und Bau rot; Marke fehlt/doppelt → Bau bricht ab, nichts geschrieben; beschädigte Schriftdatei), **Browser**: berechnete Schrift Überschrift Fredoka, Text Nunito; mit `CSS.getPlatformFontsForNode` geprüft, dass jedes Zeichen – auch „Größe Übung Ärger Öl Maß „Quest“ – 5 €“ – mit der eingebetteten Schrift gezeichnet wird; jede Stärke hat eine andere Breite; jede Anfrage außerhalb der Testseite zählt als Fehler (keine). Gegenprobe im Browser: ohne eingebettete Schriften zeichnet Chromium „Segoe UI“.
- Angepasst: `testinstanz.test` (17 Prüfungen), `elternbereich-f4.test` (56 Quellen), `kern.test` (Schriftdatei in der Test-Kopie); `aufnahme`, `pdf`, `profil`, `version`, `testinstanz-veroeffentlichen` lassen Google-Adressen nicht mehr durch – jede fremde Anfrage ist jetzt ein Fehler.
- 15 Gegenproben rot (`%TEMP%\opencode\gegenproben-schriften.mjs`): Google-Zeile zurück, Marke fehlt, Suchlauf meldet Google nicht, Anzahl je Schrift ungeprüft, `distBauen` ohne Suchlauf, `appZusammensetzen` ohne Schriften, Testinstanz ohne die neue Prüfung, Umwandlung ohne Schutz, Prüfsumme ungeprüft, falscher Familienname (Browser zeichnet Ersatzschrift), Nunito fehlt, Kennzeichnung DE/EN fehlt, Google-Satz zurück, Schriften fehlen in den Quellen.
- Volle Reihe nach dem Einmergen von `main` (#139–#141): **809/809** (477 s).
