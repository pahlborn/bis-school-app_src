import Foundation
import WebKit

enum ToddleField {
    private static let host = "web.toddleapp.com"

    struct AssessmentRow {
        let criterion: String
        let rating: String
        let transfer = UUID().uuidString.lowercased()
    }

    // Read only the rendered assessment table, never selection, account data or hidden state.
    static let evaluationScript = #"""
    (() => {
      if (location.origin !== 'https://web.toddleapp.com') return { error: 'origin' };
      const rendered = el => {
        if (!el || !el.getClientRects().length || el.closest('[hidden], [aria-hidden="true"], [inert]')) return false;
        for (let p = el; p; p = p.parentElement) {
          const s = getComputedStyle(p);
          if (s.display === 'none' || s.visibility !== 'visible' || Number(s.opacity) === 0) return false;
        }
        return true;
      };
      const selector = 'table, [role="table"], [role="grid"]';
      // Structural counts only. Never return source URLs, HTML, titles or account text.
      const count = (scope, query) => Math.min(999, [...scope.querySelectorAll(query)].filter(rendered).length);
      const diagnostic = {
        tables: count(document, selector),
        dialogs: count(document, '[role="dialog"], dialog[open]'),
        frames: count(document, 'iframe, frame'),
        embedded: count(document, 'embed, object'),
        canvases: count(document, 'canvas'),
        rows: count(document, 'tr, [role="row"]'),
        cells: count(document, 'td, th, [role="cell"], [role="gridcell"], [role="columnheader"]'),
        candidates: 0, skipped: 0, accepted: 0
      };
      const fail = stage => ({ error: stage, diagnostic });
      const active = [...document.querySelectorAll('[role="dialog"], dialog[open]')].filter(rendered);
      if (active.length > 1) return fail('dialogs');
      const scope = active[0] || document;
      const tables = [...scope.querySelectorAll(selector)].filter(table => rendered(table) &&
        [...table.querySelectorAll('th, td, [role="columnheader"], [role="cell"], [role="gridcell"]')]
          .some(cell => rendered(cell) && /^Assessment(?: Criteria)?$/i.test(cell.innerText.trim())));
      diagnostic.candidates = Math.min(999, tables.length);
      if (tables.length !== 1) return fail(tables.length ? 'ambiguous' : 'header');
      const table = tables[0];
      const rows = [];
      let skipped = 0;
      for (const tr of table.querySelectorAll('tr, [role="row"]')) {
        if (tr.closest(selector) !== table || !rendered(tr)) continue;
        const cells = [...tr.children].filter(c => c.matches('td, th, [role="cell"], [role="gridcell"], [role="rowheader"], [role="columnheader"]'));
        if (cells.some(c => /^Assessment(?: Criteria)?$/i.test(c.innerText.trim()))) continue;
        if (cells.length !== 2 || cells.some(c => !rendered(c) || [...c.querySelectorAll('*')].some(el => !rendered(el)) || c.querySelector('input, textarea, select, [contenteditable="true"]'))) {
          skipped++; continue;
        }
        const criterion = cells[0].innerText.trim();
        const rating = cells[1].innerText.trim();
        if (rating === '-' || rating === '–' || rating === '—') { skipped++; continue; }
        if (!criterion || new TextEncoder().encode(criterion).length > 800 || !['RS','C','M','E'].includes(rating)) {
          skipped++; continue;
        }
        rows.push({criterion, rating});
      }
      diagnostic.skipped = Math.min(999, skipped);
      diagnostic.accepted = Math.min(999, rows.length);
      if (!rows.length || rows.length > 60) return fail('rows');
      return { rows, skipped };
    })()
    """#

    struct Assessment {
        let rows: [AssessmentRow]
        let skipped: Int
    }

    @MainActor
    static func readAssessment(from webView: WKWebView) async throws -> Assessment {
        let url = webView.url
        guard url?.scheme == "https", url?.host == host else {
            throw MVPError.message("Öffne zuerst die gewünschte Evaluation in Toddle.")
        }
        let result = try await webView.evaluateJavaScript(evaluationScript)
        guard webView.url == url else {
            throw MVPError.message("Die Seite hat sich geändert. Bitte die Evaluation erneut lesen.")
        }
        guard let data = result as? [String: Any], let raw = data["rows"] as? [[String: String]],
              !raw.isEmpty, raw.count <= 60, let skipped = data["skipped"] as? Int else {
            let data = result as? [String: Any]
            let stage = data?["error"] as? String ?? "format"
            let reasons = [
                "dialogs": "Mehrere überlagerte Ansichten erkannt.",
                "header": "Die erwartete Tabellenüberschrift wurde nicht erkannt.",
                "ambiguous": "Mehrere mögliche Bewertungstabellen erkannt.",
                "rows": "Die Tabellenzeilen konnten nicht eindeutig zugeordnet werden.",
                "origin": "Die Ansicht liegt nicht auf der erwarteten Toddle-Adresse."
            ]
            let counts = data?["diagnostic"] as? [String: Any] ?? [:]
            let keys = ["tables", "dialogs", "frames", "embedded", "canvases", "rows", "cells", "candidates", "skipped", "accepted"]
            let code = keys.map { key in
                let number = counts[key] as? Int ?? 0
                return "\(key)=\(min(999, max(0, number)))"
            }.joined(separator: ", ")
            throw MVPError.message((reasons[stage] ?? "Das Leseergebnis konnte nicht verarbeitet werden.")
                + " Es wurde nichts übernommen.\nDiagnose (nur Strukturzahlen): " + code)
        }
        let rows = try raw.map { entry -> AssessmentRow in
            guard let criterion = entry["criterion"], !criterion.isEmpty, criterion.utf8.count <= 800,
                  let rating = entry["rating"], ["RS", "C", "M", "E"].contains(rating) else {
                throw MVPError.message("Die Bewertungstabelle konnte nicht vollständig gelesen werden.")
            }
            return AssessmentRow(criterion: criterion, rating: rating)
        }
        return Assessment(rows: rows, skipped: skipped)
    }

}
