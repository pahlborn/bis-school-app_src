import Foundation
import WebKit

enum ToddleField {
    // Captures rendered text only. No table semantics, account state or network endpoints.
    static let evaluationScript = #"""
    (() => {
      if (location.origin !== 'https://web.toddleapp.com') return { error: 'origin' };
      const rendered = element => {
        if (!element || !element.getClientRects().length) return false;
        for (let parent = element; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (parent.hidden || parent.hasAttribute('inert') || style.display === 'none' ||
              style.visibility !== 'visible' || Number(style.opacity) === 0) return false;
        }
        return true;
      };
      const dialogs = [...document.querySelectorAll('[role="dialog"], dialog[open]')].filter(rendered);
      // Nested dialogs are normal. A hit test identifies the foreground view.
      const hits = document.elementsFromPoint(innerWidth / 2, innerHeight / 2);
      const front = dialogs.find(dialog => hits[0] && dialog.contains(hits[0]));
      const roots = dialogs.filter(dialog => !dialogs.some(other => other !== dialog && other.contains(dialog)));
      let scope;
      if (front) scope = roots.find(root => root.contains(front)) || front;
      else if (roots.length === 1) scope = roots[0];
      else if (!roots.length) scope = document.querySelector('main, [role="main"]');
      if (!scope || !rendered(scope)) return {error: 'scope'};
      const lines = [];
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || parent.closest('script, style, noscript, input, textarea, select, button, nav, [role="navigation"], [contenteditable="true"]') || !rendered(parent)) continue;
        if (parent.closest('[aria-hidden="true"]')) continue;
        const text = node.textContent.replace(/\s+/g, ' ').trim();
        if (text) lines.push(text);
      }
      const text = lines.join('\n');
      if (!text || !/Learning intentions|Learning experience description|Assessment|Evaluation/i.test(text)) return {error: 'content'};
      if (new TextEncoder().encode(text).length > 48000) return {error: 'size'};
      return {text};
    })()
    """#

    @MainActor
    static func readSource(from view: WKWebView) async throws -> String {
        let url = view.url
        guard url?.scheme == "https", url?.host == "web.toddleapp.com" else {
            throw MVPError.message("Öffne die gewünschte Evaluation in Toddle.")
        }
        let result = try await view.evaluateJavaScript(evaluationScript)
        guard view.url == url else {
            throw MVPError.message("Die Seite hat sich während des Lesens geändert. Bitte erneut lesen.")
        }
        guard let data = result as? [String: Any], let text = data["text"] as? String,
              !text.isEmpty, text.utf8.count <= 48000 else {
            throw MVPError.message("Der Text der Evaluation konnte nicht erfasst werden. Bitte die geöffnete Ansicht prüfen.")
        }
        return text
    }
}
