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
}
