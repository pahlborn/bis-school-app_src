# Zwei Altfehler aus dem Main-Abschlusslauf

Status: vorgeschlagen, nicht zur Umsetzung beauftragt; beide aufe17 und2c6d143 deterministisch nachgewiesen, kein neues R2-Problem.
1. BQ-LEGACY-PDF-01: Mathematikoperatoren im Übungsblatt-PDF erhalten; insbesondere `−` darf nicht als `?` erscheinen. Fester PDF-Gegenbeleg und vorhandene Umlaute-/Layoutprüfungen bleiben erforderlich.
2. BQ-LEGACY-EXAMPLE-01: Bei Subtraktionsergebnis4200 ein passendes anderes Beispiel anbieten; der Schutz gegen das Verraten derselben Lösung bleibt bestehen. Fester Generator-/Hilfebeleg statt zufälliger Treffer.
3. Änderungen an Aufgaben-/PDF-Code liegen außerhalb des konkret auf vier Runtime-Module begrenzten unsigned-Auftrags. Vor Umsetzung Umfang und tatsächlichen Entwickler festlegen; die bestehende Codex-Freigabe nicht ausweiten.
4. Peter hat Release0.152.7 am23.11. mit ausdrücklich auf diese beiden Altfehler begrenzter Ausnahme freigegeben ([Beleg](https://github.com/pahlborn/agentarium/issues/2#issuecomment-7091830558)); die Beta ist veröffentlicht. Keine neue Ausnahme für spätere Versionen und keinen zusätzlichen Entwicklerauftrag daraus ableiten.
5. [Nachweise und Auswirkungen](../pruefung/2026-11-22-evaluationen-restabschluss.md#integration-bestanden-veröffentlichung-wartet-auf-entscheidung-zu-altfehlern); R1 bleibt davon getrennt offen.
