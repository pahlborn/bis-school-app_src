# EV-2: Kriterien, Einstufungen und gemeinsame Revision

## Anliegen

EV-2.1–2.4 und die im Datenmodul prüfbaren Schutzregeln aus EV-2.5 umsetzen. Grundlage ist `main@bb10457ade11490b785ab16e6f231c442e3affd2`; der bestehende Kriteriencontainer wurde direkt mit `feature/bq-evaluation-end-to-end-test11@f88e82ab013daf6f8a095224af6cd4d7ef0dc880` verglichen. Tatsächlicher Autor: native Atlas-Instanz `/root/dev_ev2_direct`, kein Claude-/Forge-Lauf.

Abhängigkeit: Atlas hat den echten EV-3-Katalogcommit `853967c2a30c0f52bcdaeb0788e33ed77ec4e118` in diesen Produktzweig integriert. Es gibt keine zweite Standardliste und keinen Dummy.

## Umgesetzt

- Neue `school_evaluation`-Ereignisse enthalten `assessment.criteria` mit `criterion`, `rating` (`RS/C/M/E` oder `''`) und `standard` (Katalogcode oder `none`). `evidence` ist optional; die anderen Felder des bisherigen `assessment`-Containers bleiben erhalten. Höchstens 50 Kriterien, entsprechend der Test-11-Grenze. Unbekannte Codes, leere Kriterientexte, ungültige Noten und teilweise zugeordnete Kriterienlisten werden abgewiesen. Die alten Top-Level-Felder `standard/rating/focus` gehören ausschließlich zur alten Ereignisform; eine Vermischung beider Formen wird abgewiesen.
- `deriveSchool` erzeugt je Evaluation `std` aus allen bewerteten Kriterien mit Bereich. Datum und Revision gelten gemeinsam. `none` und leere Einstufungen bleiben als Originaltext erhalten. Der reine Export `schoolEvaluationStandards(criteria, {ratingOrder, standardOverrides})` kann auch von EV-4 für die Vorschau verwendet werden.
- Die schwächere Einstufung gilt in der Reihenfolge `RS, C, M, E`. Ein Vergleich mit umgekehrter Regel verarbeitet dieselben gespeicherten Originalkriterien erneut. Für O3 liegt eine ausdrücklich bestätigte Elternkorrektur als `standardOverrides: {code: rating}` im selben Ereignis und Revisionsverlauf. Erlaubt sind ausschließlich bereits bewertete Kriterienstandards; Originalkriterien und Originalnoten werden nicht geändert.
- `school_import`, alte Einstandard-Ereignisse und Test-11-Ereignisse mit `unmapped/N` bleiben lesbar. Der alte Einstandard-Ergebnisstand wird vollständig verglichen. Keine Migration oder Schreiboperation beim Lesen.
- Bestehende Revisionen, Rücknahmen und ausdrückliche Konfliktauflösung gelten ebenso für die Kriterienform. Zwei Geräteereignisse mit verschiedenen Evaluationskennungen bleiben erhalten; erneute Lieferung derselben Revision erzeugt keinen zweiten abgeleiteten Eintrag. Signatur-, Elternrollen- und Kindbereichsschutz nutzen die unveränderte Annahmekette.
- Katalog-Questbezüge werden für schwache Kriterien als Metadaten abgeleitet. Ein Standard ohne Quest bleibt mit Einstufung gespeichert und erzeugt keine Quest. Das abgeleitete `manual.focus='none'` verhindert Sonderkarten des bisherigen Einstandard-Piloten; es schreibt keinen erfundenen Legacy-Wert in das neue Ereignis.

## Prüfung

- Unveränderte Baseline: 79/79 Tests aus `ereignisse`, `ableitung`, `school-evaluation` und `annahme` bestanden.
- Gegenprobe auf `bb10457`: sieben relevante Tests des fertigen Kriterien-Testmoduls waren rot (gültige Kriterien, Mehrstandardableitung, schwächere Regel, austauschbare Regel, `unmapped`, zwei Geräte, gültige Nutzlast vor Signatur). Beide alten Module wurden direkt per `git show` in einem Speicher-Loader geladen; keine Quellkopien oder neuen Worktrees. Sieben fachliche Assertions, keine Import-/Setupfehler oder `TypeError`.
- Gezielte Verletzungen im Speicher-Loader: unbekannte Codes zulassen, Kriteriengrenze entfernen, stärkere statt schwächere Note wählen. Der jeweils zugehörige neue Test wird rot; Produktdateien bleiben unverändert.
- Fokuslauf: `node --test tests/module/evaluation-kriterien.test.mjs tests/module/school-evaluation.test.mjs tests/module/ereignisse.test.mjs tests/module/ableitung.test.mjs tests/module/annahme.test.mjs tests/module/standardkatalog.test.mjs` — 99/99 bestanden, darunter 15 neue Kriterienfälle. Ein vorheriger Lauf hatte einen unveränderten Reinheitstest wegen des Wortes `document` in einem Kommentar ausgelöst; der Kommentar wurde berichtigt, der Test nicht geändert.
- Gesamtlauf `CHROMIUM_PATH=/usr/bin/chromium npm test`: offen, gemeinsamer Laufslot bei Atlas angefragt.

## Gefunden / offen

Die neue Formularbestätigung, doppelte Betätigung im echten Formular und ein Kind-/Kontowechsel während eines neuen Kriterienentwurfs benötigen EV-4. Browser/iPad-Parität und die vollständige Kette bis Lücke, Fokus, Übung und Neustart benötigen EV-7. Diese Kriterien sind mit diesem Datenabschnitt nicht abgenommen. Der bestehende Browser-/Schulorigin-Schutz wird durch den Gesamtlauf geschützt; neue UI oder Swift-Code ist nicht Bestandteil dieser Änderung.

Keine alte Erwartung wurde abgeschwächt. Die bisher generisch erforderlichen Top-Level-Felder sind wegen der zweiten gültigen Ereignisform jetzt bedingt erforderlich; eigene Tests prüfen diese Pflicht für die alte Form weiterhin ausdrücklich.
