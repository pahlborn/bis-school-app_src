# Big Quest – UI-Testmatrix ab 12. November 2026

## Beschluss und Geltung
Die verbindliche **Standardprüfung der Weboberfläche** nutzt nur noch fünf zeitgemäße **CSS-Viewportformate**, nicht einzelne Hardwaregenerationen. Browser-Emulation ersetzt keine Prüfung auf einem echten Gerät. Diese Matrix ändert **nicht** die technischen Zugangsbeschränkungen oder die Unterstützung älterer Geräte. Die Tests bleiben inhaltlich erhalten; alte, überschneidende Viewports werden ersetzt. Eine einmalige reale Prüfung des nativen iPad-Piloten ist weiterhin Pflicht.

| Klasse | CSS-Viewport Breite × Höhe | Zweck |
| --- | --- | --- |
| Kompaktes Smartphone | 360 × 800 | schmale, noch verbreitete Android-Smartphones; untere aktuelle Größenklasse |
| Normales Smartphone | 390 × 844 | verbreitetes iPhone-Layout |
| Breites Smartphone | 414 × 896 | verbreitetes breiteres Handy-Layout |
| Tablet | 820 × 1180 | aktuelles 11-Zoll-iPad A16 / iPad Air |
| Notebook/Desktop | 1366 × 768 | kompakter Desktop / Notebook |

Einzeltests verwenden nur die für die jeweilige Funktion relevanten Formate. **Nicht jeder Test wird fünfmal ausgeführt.**

## Abgelöste Formate
- 320 × 568 (iPhone SE 1. Generation) und 320 × 640 (künstlicher Kleinbildschirm): keine Standard-Freigabebedingung mehr; **kein absichtlicher Funktionsausschluss**.
- 768 × 1024 und 810 × 1080 (ältere iPad-Größen): zusammengefasst zu 820 × 1180.
- 1000 × 900, 1200 × 900 und 1280 × 720: auf 1366 × 768 als Desktop-Referenz vereinheitlicht.
- 1024 × 768 in `tests/app-sandbox.mjs` ist ein **simulierter Laufzeitwert**, kein browsergestützter Geräte-Abnahmetest; wird nicht als sechstes Testgerät gezählt.

## Qualitätsregeln
1. Keine neuen Einzelmodellprofile wie „iPhone SE“ als globale Freigabebedingung hinzufügen; neue Formate nur mit belegtem Bedarf (Nutzungsdaten, Accessibility, Fehler aus realem Gerät).
2. Testzweck erhalten: Touch-Zielgrößen, keine abgeschnittenen Dialogaktionen, Scrolling, Tastaturfokus, Eltern- und Kinderansichten bleiben prüfpflichtig.
3. Keine Aussage „auf iPad getestet“ aus einem generischen `xcodebuild -destination generic/platform=iOS Simulator` ableiten; dies ist nur ein Build-Nachweis.
4. Bei der Erstabnahme zusätzlich ein **echtes iPad** (Swift Playgrounds + Safari + Toddle) prüfen; Orientierung, Textvergrößerung und Betriebssystem-WebView sind separat von CSS-Abmessungen zu bewerten.
5. Diese Änderung betrifft nur den isolierten Entwicklungsbranch; keine automatische Freigabe der Produktivinstanz.

## Quellen (Abruf am 12.11.2026)
- Deutschland, Oktober 2026, mobile Browser-Auflösungen: https://gs.statcounter.com/screen-resolution-stats/mobile/germany
- iPhone- und iPad-Formate in Points/CSS-Pixeln: https://www.screensizes.app/ ; https://www.wishkit.io/free-tools/ipad-screen-sizes
- Playwright-Geräteprofile: https://github.com/microsoft/playwright/blob/main/packages/isomorphic/deviceDescriptorsSource.json
