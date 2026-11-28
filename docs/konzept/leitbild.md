# Leitbild Big Quest

Stand 28.11.2026 · Peters Entscheidung · **internes Dokument, kommt nicht in die App**

Big Quest nimmt sich den Geist der Schule und des IB Primary Years Programme zum Vorbild. Damit beim Umformulieren nichts verloren geht, steht hier, woher jeder Gedanke kommt. Die App selbst verwendet nur die eigenen Worte von Big Quest: keine Namen, Slogans oder Zitate der Schule, kein IB, kein PYP, kein Learner Profile (Regel für die App, siehe `docs/konzept/textleitlinie.md`, und Punkt „IB-Bezüge entfernen“ im Backlog).

## Motto und Leitsatz

- **Motto:** *Be curious. Be brave. Keep growing.*
- **Leitsatz:** *Every quest makes you grow.* – in der Regelzeile des Wissensbaums (Peter, 28.11.).

## Vorbilder (Quellen, wörtlich)

| Quelle | Wortlaut |
| --- | --- |
| Motto der Schule | „Believe. Inspire. Succeed.“ (Website der Schule, „BIS at a Glance“) |
| Leitbild der Schule | „inspiring and challenging young minds as a caring and committed international community to achieve excellence, assume responsibility and pursue life-long learning“ (Website der Schule) |
| Leitgedanken der Schule (bisher in der App zitiert) | „A place for everyone to grow and flourish“ · „Voice, choice and ownership“ · „We take risks in a supportive culture“ (laut Quellenliste der App von der Website der Schule; Wortlaut am 28.11. nicht erneut geprüft) |
| IB Primary Years Programme | Learner Profile (u. a. Inquirers, Thinkers, Risk-takers, Reflective, Balanced, Principled, Knowledgeable, Open-minded) und Approaches to Learning (denken, forschen, sich austauschen, sich selbst steuern) |
| Schule, Feedback-Kultur | „Glows and Grows“: was gut gelingt, was ich üben will |

## Grundsätze

Jede Änderung an Texten, Belohnungen oder Abläufen wird an der Spalte **Kerngedanke** gemessen. Die Worte dürfen sich ändern, der Kerngedanke nicht.

| Nr. | Vorbild | Kerngedanke | Grundsatz von Big Quest | Umsetzung in Big Quest |
| --- | --- | --- | --- | --- |
| 1 | Believe · „grow and flourish“ | Selbstvertrauen; jeder wächst in seinem Tempo | **Fortschritt wird gefeiert, ohne zu vergleichen.** Keine Ranglisten, keine Punktabzüge, nichts verfällt, erreichte Titel bleiben. | Titel, Wissensbaum, Sterne ohne Abzug; keine Rangliste |
| 2 | „We take risks in a supportive culture“ · Risk-takers | Mut zählt mehr als das Ergebnis; Fehler gehören zum Lernen | **Wer etwas wagt, bekommt Anerkennung, auch wenn es nicht klappt.** Hilfe ist willkommen und kein Makel. | Abzeichen Brave Spark (auch bei falscher Antwort), Hilfe-Leiter, Text „You tried a challenge“ |
| 3 | Inspire · Inquirers | Neugier wecken und belohnen | **Neues ausprobieren lohnt sich.** Neuland bringt einen Bonusstern und eine Blüte, unabhängig vom Können. | Neuland, Mystery Question, Word of the Day, Pisolala; Abzeichen Curiosity Champion |
| 4 | „Voice, choice and ownership“ | Das Kind bestimmt mit | **Das Kind wählt Fach, Thema und Herausforderung selbst.** Challenges werden angeboten, nie erzwungen („Not today“). | Questwahl, Challenge-Angebot, „Choose your treat“ |
| 5 | Succeed · „achieve excellence“ | Können wirklich aufbauen | **Üben, bis es sitzt, und es halten.** Sicher ist erst, was ohne Hilfe gelingt; ein Learning goal ist erst „gehalten“, wenn es 5 von 6 Aufgaben selbst richtig sind. | Übungsstand nach erstem Versuch, Wiederholung nach 1, 3, 7 Tagen, Learning goals |
| 6 | Thinkers · Approaches to Learning | Denken und Begründen statt Raten | **Erklären, prüfen, einen zweiten Weg finden.** Hinweise stellen Fragen, statt die Lösung zu verraten. | Niveau „Herausforderung“, Hinweise im Modell der Schule |
| 7 | Reflective · „Glows and Grows“ | Über das eigene Lernen nachdenken | **Nach dem Üben kurz zurückschauen: Was ist gut gelungen?** | Glow-Frage nach Practise Today; Abzeichen Amazing Attitude (Name noch offen) |
| 8 | Balanced | Lernen auch ohne Bildschirm | **Big Quest ist ein freiwilliger Zusatz, nie Ersatz für Unterricht, Hausaufgaben oder Spielen draußen.** | Ideen ohne Bildschirm, Übungsblätter, Kalender-Erinnerung freiwillig; Abzeichen Unplugged Hero |
| 9 | „caring … community“ · „assume responsibility“ | Erwachsene begleiten, die Schule bleibt maßgeblich | **Eltern helfen so, wie die Schule es macht, und tragen die Verantwortung.** Die Bewertung macht die Schule, nicht Big Quest. | „So können Sie Mia helfen“, Hinweis „Übungsstand ist keine Bewertung“, Evaluations aus Toddle |
| 10 | „life-long learning“ | Freude am Lernen bleibt | **Belohnungen beschreiben die Tat und übertreiben nicht.** Lob nennt, was das Kind getan hat; Steigerung kommt über Stufen, nicht über große Worte. | Lob-Texte in `motivationsworte.mjs` (heute schon tatbezogen); Abzeichen schlicht → Silber → Gold |
| 11 | „caring … community“ | unterstützen, die Entscheidung bleibt bei der Familie | **Big Quest unterstützt Familien beim Üben. Die Entscheidungen bleiben bei Schule, Eltern und Kindern.** | Textleitlinie Regel 8; Empfehlungen als Angebot („Sie können …“); Hinweis „Die Anzeigen in Big Quest sind lediglich Hinweise …“ |

## Regeln für Texte und Code

1. **In der App** nur Big-Quest-Worte. Ein Gedanke aus der Schule oder der IB wird über seinen Grundsatz übernommen, nicht über das Zitat.
2. **Im Code** verweisen Kommentare auf dieses Dokument (z. B. `/* Leitbild, Grundsatz 2 */`) und zitieren weder Schule noch IB. Auch Kommentare liegen im ausgelieferten, verschlüsselten `index.html` und sind für alle mit Zugang lesbar.
3. **Neue Texte und Funktionen** nennen im Auftrag oder PR den Grundsatz, dem sie dienen. Widerspricht eine Änderung einem Kerngedanken, entscheidet Peter.
4. **Quellen** (Schule, IB) dürfen in der Quellenliste der App als Zitat stehen, nicht als Name eines Angebots oder einer Auszeichnung.

## Textdurchsicht: was in Big Quest zu ändern ist

Stand `main` 81b5a96 (0.152.8). Umsetzung über Atlas, erst nach Peters Freigabe.

| Stelle | heute | neu |
| --- | --- | --- |
| Startbildschirm, Zeile über dem Motto (`index.html:548`) | „Grade 3 · International Baccalaureate Primary Years Programme“ | entfällt (Tests `neutral.test.mjs`, `huelle.test.mjs` anpassen) |
| Startbildschirm, Motto (`index.html:550`) | „Believe. Inspire. Succeed.“ | „Be curious. Be brave. Keep growing.“ |
| Geburtstag (`index.html:3207`) | „Happy birthday, Name! Believe. Inspire. Succeed.“ | „Happy birthday, Name! Keep growing.“ |
| Übungsblatt, Fußzeile HTML und PDF (`index.html:3668`, `3786`) | „Believe. Inspire. Succeed.“ | „Be curious. Be brave. Keep growing.“ |
| Wissensbaum, Regelzeile (`wissensbaum.mjs`, `TREE_TEXT.rule`) | „Grows through knowledge. Everything you have grown stays.“ | „Every quest makes you grow. Everything you have grown stays.“ (DE: „Jede Quest lässt dich wachsen. Alles Gewachsene bleibt.“) |
| Konzept „Grundidee“, Liste „Leitgedanken der Schule und des IB Primary Years Programme“ (`index.html:7129–7134`, EN `7222–7227`) | drei Zitate der Schule, „IB Learner Profile und Approaches to Learning“ | Überschrift „Leitgedanken von Big Quest“; Grundsätze 1, 4, 2 und 6/7 in eigenen Worten: „Fortschritt wird gefeiert, ohne zu vergleichen.“ · „Das Kind wählt Fach, Thema und Herausforderung selbst.“ · „Fehler gehören zum Lernen; eine angenommene Herausforderung zählt, gleich wie sie ausgeht.“ · „Denken, begründen, zurückschauen: Was ist gut gelungen (Glow), was will ich üben (Grow)?“ |
| Über Big Quest, erster Absatz (DE/EN) | „… für ein Kind der 3. Klasse an einer IB-Schule (Primary Years Programme) …“ | „Big Quest ist ein spielerisches Übungsangebot für Kinder im Grundschulalter. Es begleitet die Inhalte des Schuljahres und lädt ein, zwischendurch und überall freiwillig zu üben – ergänzend zum Unterricht und zu den Hausaufgaben, nie an ihrer Stelle.“ |
| Wichtiger Hinweis, Satz 1 | „Es handelt sich um eine Spaß- und Lernanwendung ohne pädagogische Herkunft und ohne fachliche Beratung.“ | unverändert |
| Wichtiger Hinweis, Satz 2 | „Sie wurde weder von der Schule noch vom International Baccalaureate beauftragt, geprüft oder unterstützt.“ | „Big Quest ist ein unabhängiges, privat entwickeltes Angebot.“ |
| Wichtiger Hinweis, Satz 3 | „Aufgaben und Programmierung sind mit Unterstützung eines KI-Assistenten entstanden und von den Eltern durchgesehen; Fehler sind dennoch möglich.“ | „Aufgaben und Programmierung sind mit Unterstützung von KI entstanden, Fehler sind möglich.“ |
| Wichtiger Hinweis, Sätze 4 und 5 | „Ein in Big Quest ermittelter Übungsstand …“, „Big Quest weiß nicht, wer …“ | unverändert |
| Wichtiger Hinweis, Satz 6 | „Die Anzeige ist ein Hinweis; die Verantwortung für das Lernen und für Entscheidungen liegt bei den Eltern.“ | „Die Anzeigen in Big Quest sind lediglich Hinweise; die Verantwortung für den Lernerfolg und für Entscheidungen kann Big Quest nicht übernehmen.“ |
| Rückmeldung Glow (`index.html:3561`) | „🌟 Glow noted. Reflective!“ | „🌟 Glow noted!“ |
| Rückmeldung ohne Bildschirm (`index.html:3565`) | „Balanced! 🌿“ | „Unplugged! 🌿“ |
| Abzeichen (`index.html:3090`, Konzepttexte `7193`, `7286`) | Learner-Profile-Namen | neue Namen (Backlog), Regel „Name ohne Steigerung“ noch offen |
| Code-Kommentar (`index.html:3087–3088`) | „school mottos“, „school mission: …“ | Verweis auf Leitbild, Grundsätze 1–3 |

Bereits im Sinne des Leitbilds und unverändert zu übernehmen: die Grundidee („Üben soll Freude machen, Neugier wecken und Selbstvertrauen stärken … Gewürdigt werden Ausdauer, Mut und Wachstum.“), die tatbezogenen Lob-Texte in `src/module/motivationsworte.mjs` und „Helfen wie die Schule“.
