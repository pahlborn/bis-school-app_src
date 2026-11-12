import Foundation
import WebKit

enum ToddleField {
    private static let host = "web.toddleapp.com"

    // Called only by the native read button. The script reads one visible selection in one element.
    @MainActor
    static func read(from webView: WKWebView) async throws -> String {
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
          return selection.toString().trim();
        })()
        """
        let result = try await webView.evaluateJavaScript(script)
        guard let value = result as? String, !value.isEmpty,
              value.utf8.count <= 240, value.rangeOfCharacter(from: .controlCharacters) == nil,
              webView.url?.scheme == "https", webView.url?.host == host else {
            throw MVPError.message("Markiere einen einzelnen sichtbaren Wert in Toddle und versuche es erneut.")
        }
        return value
    }
}
