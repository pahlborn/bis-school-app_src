import Foundation
import WebKit

enum ToddleField {
    private static let host = "web.toddleapp.com"

    struct AssessmentRow {
        let criterion: String
        let rating: String
        let transfer = UUID().uuidString.lowercased()
    }

    @MainActor
    private static func selected(from webView: WKWebView, row: Bool) async throws -> Any? {
        guard webView.url?.scheme == "https", webView.url?.host == host else {
            throw MVPError.message("Öffne die Evaluation zuerst im Toddle-Familienbereich.")
        }
        let script = """
        (() => {
          if (location.origin !== 'https://web.toddleapp.com') return null;
          const selection = window.getSelection();
          if (!selection || selection.rangeCount !== 1 || selection.isCollapsed) return null;
          const range = selection.getRangeAt(0);
          const element = range.startContainer.parentElement;
          if (!element || element !== range.endContainer.parentElement
              || element.isContentEditable || element.closest('input, textarea, select, [role="textbox"]')) return null;
          if (![...range.getClientRects()].some(rect =>
              rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 &&
              rect.top < innerHeight && rect.left < innerWidth)) return null;
          const text = selection.toString().trim();
          if (!\(row ? "true" : "false")) return text;
          const cell = element.closest('td, [role="cell"], [role="gridcell"]');
          const tableRow = cell?.closest('tr, [role="row"]');
          if (!tableRow) return null;
          const cells = [...tableRow.children].filter(c => c.matches('th, td, [role="cell"], [role="gridcell"], [role="rowheader"]'));
          if (cells.length !== 2 || cells[1] !== cell || cell.innerText.trim() !== text) return null;
          return [cells[0].innerText.trim(), text];
        })()
        """
        let result = try await webView.evaluateJavaScript(script)
        guard webView.url?.scheme == "https", webView.url?.host == host else {
            throw MVPError.message("Die Toddle-Seite hat sich geändert. Markiere den Wert erneut.")
        }
        return result
    }

    @MainActor
    static func read(from webView: WKWebView) async throws -> String {
        guard let value = try await selected(from: webView, row: false) as? String, !value.isEmpty,
              value.utf8.count <= 240, value.rangeOfCharacter(from: .controlCharacters) == nil else {
            throw MVPError.message("Markiere einen einzelnen sichtbaren Wert in Toddle und versuche es erneut.")
        }
        return value
    }

    @MainActor
    static func readAssessmentRow(from webView: WKWebView) async throws -> AssessmentRow {
        guard let values = try await selected(from: webView, row: true) as? [String], values.count == 2,
              !values[0].isEmpty, values[0].utf8.count <= 800, ["RS", "C", "M", "E"].contains(values[1]) else {
            throw MVPError.message("Markiere die Einstufung in einer sichtbaren Toddle-Zeile mit genau einem Kriterium.")
        }
        return AssessmentRow(criterion: values[0], rating: values[1])
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
      const active = [...document.querySelectorAll('[role="dialog"], dialog[open]')].filter(rendered);
      if (active.length > 1) return { error: 'ambiguous' };
      const scope = active[0] || document;
      const tables = [...scope.querySelectorAll(selector)].filter(table => rendered(table) &&
        [...table.querySelectorAll('th, td, [role="columnheader"], [role="cell"], [role="gridcell"]')]
          .some(cell => rendered(cell) && /^Assessment(?: Criteria)?$/i.test(cell.innerText.trim())));
      if (tables.length !== 1) return { error: tables.length ? 'ambiguous' : 'missing' };
      const table = tables[0];
      const rows = [];
      let skipped = 0;
      for (const tr of table.querySelectorAll('tr, [role="row"]')) {
        if (tr.closest(selector) !== table || !rendered(tr)) continue;
        const cells = [...tr.children].filter(c => c.matches('td, th, [role="cell"], [role="gridcell"], [role="rowheader"], [role="columnheader"]'));
        if (cells.some(c => /^Assessment(?: Criteria)?$/i.test(c.innerText.trim()))) continue;
        if (cells.length !== 2 || cells.some(c => !rendered(c) || c.querySelector('input, textarea, select, [contenteditable="true"]'))) {
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
      if (!rows.length || rows.length > 60) return { error: 'missing' };
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
            throw MVPError.message("Keine eindeutige Bewertungstabelle erkannt. Öffne die Evaluation mit ihren Kriterien. Es wurde nichts übernommen.")
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
