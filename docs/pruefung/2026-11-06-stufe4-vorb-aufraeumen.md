# 2026-11-06 - Vorbereitung Stufe 4: andere Geraete raeumen nach "Mein Konto loeschen" auf (Folgeaufgabe aus #145)

## Auftrag
Vault: "Stufe 4 - Familienbetrieb (Plan)", Abschnitt "Vorbereitung erledigt", Punkt "Noch vor dem echten Einsatz":
Loescht ein Elternteil sein Konto und der andere Elternteil bleibt, raeumen **seine anderen Geraete** beim naechsten
Abgleich die alte Kopie der Kinderdaten (und ihre Schluessel) selbst weg - sie erkennen das eigene Austreten. Nur
Testbau/Familienfassung; Kathies App (Live-Bau) bleibt unveraendert. Nicht veroeffentlicht.

**Erfolgskriterium:** Nach dem naechsten Abgleich liegt auf einem anderen Geraet des austretenden Elternteils nichts
mehr, das ein Kind oder ihn selbst nennt (Schluessel oder Wert); Anna, das Kindergeraet und der Speicher behalten die
Kinderdaten; ein Austreten, das noch nicht gesendet ist, raeumt nichts weg. **Ergebnis:** erfuellt (Belege unten).

## Befund vorher
- Das andere Geraet (Peters iPhone) bemerkte nur, dass Peters eigener Bereich fehlt, und meldete ihn ab - die Kopie von
  Kathies Daten, der Bereichsstand ihrer Bereiche und das Familienprotokoll blieben liegen.
- **Auch das loeschende Geraet** behielt sie (Kathies Protokoll `bq2_<Kind>__events`, `bq_abgleich`,
  `bq2_familyEvents`) - der Test hat es gleich mit gezeigt.

## Was neu ist (nur Module und Tests; `index.html` unveraendert)
- **Modul `einladung`:**
  - `elternAusgetreten({ ablage, konto, now })`: hat dieser Elternteil sich selbst aus der Familie ausgetragen
    (`family_set` mit `removed` ueber ihn, von ihm geschrieben) - und zwar **auf einem anderen Geraet**? Ein Eintrag eines
    anderen Elternteils ueber ihn zaehlt nicht; der eigene Eintrag dieses Geraets auch nicht (das ist der loeschende Aufruf
    selbst, der noch senden muss - ohne Netz bleibt alles).
  - `elternLokalEntfernen({ ablage, konto, now, behalten })`: alle Kinder der Familie (wie `kindLokalEntfernen`), den
    Familienbereich (Stand, Protokoll, Verworfenes) und seinen eigenen Bereich (Stand, Protokoll, vorgemerkte Geraete).
    `behalten` = was ein anderes Konto auf diesem Geraet noch braucht. Ein Kind einer anderen Familie bleibt unberuehrt.
  - `abgleichMitVerbindungen`: vor dem ersten Abgleich und nach jeder Runde - ein Elternteil, der ausgetreten ist oder
    dessen eigener Bereich geloescht ist, wird nicht weiter abgeglichen; seine Kinder kommen in `geloescht`, er selbst in
    `kontoGeloescht`. Andere Konten auf dem Geraet laufen weiter.
- **Modul `kinddaten`:** `kontoDatenLoeschen` mit bleibendem Elternteil raeumt auch das loeschende Geraet sofort
  (`kinder`: Eintraege mit `nurLokal: true` - im Speicher wird vom Kind nichts geloescht).
- **App (unveraendert):** `kontoNachAbgleich` behandelt `geloescht`/`kontoGeloescht` schon (Liste, Schluesselkopie,
  Sitzungen, Leseaufnahmen, Abmelden); der Knopf "Mein Konto loeschen" ruft fuer jedes `kinder`-Element `kontoLokalWeg`.

## Belege
- `tests/module/kinddaten.test.mjs` (je Simulation + GitHub-Nachbau), neu:
  - Peter loescht, Anna bleibt: Peters zweites Geraet raeumt beim naechsten Abgleich alles weg, weitere Abgleiche legen
    nichts neu an; das loeschende Geraet ebenso; Kathie uebt weiter, Anna sieht alles; Kinderdaten im Speicher bleiben.
  - Speicher laesst sich nach dem Austreten nicht leeren: das Austreten allein genuegt.
  - Peters Bereich fehlt, ohne dass das Austreten ankam: auch dann wird aufgeraeumt.
  - Gegenprobe: Anna loescht - Peters Geraete behalten alles, melden nichts als geloescht.
  - Gegenprobe: Loeschen bricht vor dem Senden ab - nichts weg, der Abgleich sendet, zweiter Versuch geht durch.
  - Ein Geraet mit Peter und Anna: nur Peters Teil geht.
  - `elternAusgetreten`/`elternLokalEntfernen` direkt (fremder Autor, eigenes Geraet, fremdes Kind, `behalten`).
  - Angepasst: "Konto loeschen, Anna" erwartet jetzt Kathie als `nurLokal` auf Annas Geraet.
- `tests/konto-einladungen.test.mjs` Test 5 (Testbau in der Sandbox, Klicks): vier Geraete - Peters Laptop und iPhone,
  Annas iPhone, Kathies iPad. Peter loescht am Laptop; iPhone vor dem Abgleich noch mit Daten, danach abgemeldet und
  nichts mehr von Kathie oder Peter, kein Bereichsstand; Kathie bleibt angemeldet, uebt weiter, Anna sieht es.
- Gegenproben: `%TEMP%\opencode\gegenproben-aufraeumen.mjs` - **10/10 rot** (Austritt nie erkannt, eigenes Geraet zaehlt
  mit, fremder Autor zaehlt, loeschendes Geraet raeumt nicht (Modul und App), anderes Geraet raeumt nicht (App),
  `behalten` ignoriert, Bereich-weg zaehlt nicht, Familie bleibt liegen, fremdes Kind mitgeloescht).
- Volle Reihe: siehe PR.

## Entscheidungen (Peter kann widersprechen)
- Nur das **eigene** Austreten zaehlt, und nur von einem anderen Geraet - sonst koennte ein fehlgeschlagenes Loeschen
  (kein Netz) dieses Geraet leerraeumen, obwohl Konto und Familie noch bestehen.
- Auch "eigener Bereich ist weg" fuehrt zum Aufraeumen der Kinder (falls das Austreten nie ankam).
- Das loeschende Geraet raeumt sofort mit auf; die App zeigt dafuer keine eigene Meldung (Peter wird abgemeldet).

## Restrisiken
- Ein Geraet, das bis zur Loeschung nie die alte Familienversion gelesen hat und dessen eigener Bereich noch da ist,
  erfaehrt das Austreten nicht (praktisch nur, wenn das Leeren des Speichers fehlschlug und das Geraet sehr alt ist).
- Git-Historie bei GitHub behaelt verschluesselte alte Staende (wie bisher: `docs/endgueltig-loeschen.md`).
