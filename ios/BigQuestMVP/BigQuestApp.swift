import SwiftUI
import WebKit

@main
@MainActor
struct BigQuestApp: App {
    var body: some Scene {
        WindowGroup { BigQuestScreen() }
    }
}

@MainActor
private final class BrowserPage: ObservableObject {
    private let url: URL
    private let persistent: Bool

    init(url: URL, persistent: Bool) {
        self.url = url
        self.persistent = persistent
    }

    lazy var view: WKWebView = {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = persistent ? .default() : .nonPersistent()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.load(URLRequest(url: url))
        return webView
    }()
}

private struct BrowserPane: UIViewRepresentable {
    let view: WKWebView

    func makeUIView(context: Context) -> WKWebView { view }
    func updateUIView(_ view: WKWebView, context: Context) {}
}

@MainActor
private struct BigQuestScreen: View {
    @StateObject private var bigQuest = BrowserPage(
        url: URL(string: "https://big-quest-test.github.io/")!, persistent: true
    )
    @StateObject private var toddle = BrowserPage(
        url: URL(string: "https://web.toddleapp.com/")!, persistent: false
    )
    @State private var showToddle = false
    @State private var showKey = false

    var body: some View {
        NavigationStack {
            BrowserPane(view: bigQuest.view)
                .navigationTitle("Big Quest")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Claude-Schlüssel") { showKey = true }
                    }
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Evaluation aus Toddle") {
                            showToddle = true
                        }
                    }
                }
        }
        .sheet(isPresented: $showKey) { ClaudeKeyScreen() }
        .sheet(isPresented: $showToddle) {
            ToddleFieldScreen(page: toddle)
        }
    }
}


private struct ClaudeKeyScreen: View {
    @Environment(\.dismiss) private var dismiss
    @State private var key = ""
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                SecureField("Anthropic-API-Schlüssel", text: $key)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                Text("Der Schlüssel wird nur auf diesem iPad im Schlüsselbund gespeichert.")
                if let error { Text(error).foregroundStyle(.red) }
                Button("Im Schlüsselbund speichern") {
                    do {
                        try ClaudeKey.save(key.trimmingCharacters(in: .whitespacesAndNewlines))
                        key = ""
                        dismiss()
                    } catch {
                        self.error = error.localizedDescription
                    }
                }
                .disabled(key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .navigationTitle("Claude-Zugriff")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
            }
        }
    }
}

@MainActor
private struct ToddleFieldScreen: View {
    @Environment(\.dismiss) private var dismiss
    let page: BrowserPage
    @State private var source: SourceCapture?
    @State private var error: String?
    @State private var reading = false

    struct SourceCapture: Identifiable {
        let id = UUID()
        let text: String
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                BrowserPane(view: page.view).frame(maxHeight: .infinity)
                VStack(alignment: .leading, spacing: 12) {
                    Text("Öffne die Evaluation in Toddle. Die erfassten Inhalte werden im Formular angezeigt.")
                    Button(reading ? "Wird gelesen …" : "Evaluation ins Formular übernehmen") {
                        Task {
                            reading = true
                            error = nil
                            defer { reading = false }
                            do { source = SourceCapture(text: try await ToddleField.readSource(from: page.view)) }
                            catch { self.error = error.localizedDescription }
                        }
                    }.disabled(reading)
                    if let error { Text(error).foregroundStyle(.red) }
                }.padding()
            }
            .navigationTitle("Toddle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Fertig") { dismiss() } }
                ToolbarItem(placement: .navigationBarTrailing) { Button("Zurück") { page.view.goBack() } }
            }
            .sheet(item: $source) { capture in EvaluationFormScreen(source: capture.text) }
        }
    }
}

@MainActor
private struct EvaluationFormScreen: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var page: EvaluationFormPage

    init(source: String) {
        _page = StateObject(wrappedValue: EvaluationFormPage(source: source))
    }

    var body: some View {
        NavigationStack {
            BrowserPane(view: page.view)
                .navigationTitle("Evaluation übernehmen")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Fertig") { dismiss() }.disabled(page.busy) } }
        }.interactiveDismissDisabled(page.busy)
    }
}

@MainActor
private final class EvaluationFormPage: NSObject, ObservableObject, WKNavigationDelegate, WKScriptMessageHandlerWithReply {
    @Published private(set) var busy = false
    private let source: String
    private let handler = FormMessageHandler()

    init(source: String) {
        self.source = source
        super.init()
        handler.owner = self
    }

    lazy var view: WKWebView = {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.userContentController.addScriptMessageHandler(handler, contentWorld: .page, name: "evaluation")
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = self
        view.loadHTMLString(Self.html, baseURL: nil)
        return view
    }()

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        Task { try? await webView.callAsyncJavaScript("window.setSource(source)", arguments: ["source": source], in: nil, contentWorld: .page) }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(navigationAction.request.url?.absoluteString == "about:blank" ? .allow : .cancel)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard message.webView === view, message.frameInfo.isMainFrame,
              view.url?.absoluteString == "about:blank", !busy,
              let body = message.body as? [String: Any], let text = body["source"] as? String,
              !text.isEmpty, text.utf8.count <= 48000 else {
            replyHandler(nil, "Der Formularaufruf ist ungültig oder bereits aktiv.")
            return
        }
        busy = true
        Task {
            defer { busy = false }
            do {
                let evaluation = try await ClaudeClient.extractEvaluation(source: text, key: ClaudeKey.read())
                let data = try JSONEncoder().encode(evaluation)
                replyHandler(try JSONSerialization.jsonObject(with: data), nil)
            } catch { replyHandler(nil, error.localizedDescription) }
        }
    }

    @MainActor
    private final class FormMessageHandler: NSObject, WKScriptMessageHandlerWithReply {
        weak var owner: EvaluationFormPage?
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage,
                                   replyHandler: @escaping (Any?, String?) -> Void) {
            guard let owner else { replyHandler(nil, "Das Formular wurde geschlossen."); return }
            owner.userContentController(userContentController, didReceive: message, replyHandler: replyHandler)
        }
    }

    static let html = #"""
    <!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><title>Big Quest – Übergabetest</title><style>
        :root { color-scheme: light; --ink: #18283c; --muted: #4e5d70; --line: #d5dee9; --blue: #2454a0; --paper: #fff; }
        * { box-sizing: border-box; }
        [hidden] { display: none !important; }
        body { margin: 0; background: #edf3fa; color: var(--ink); font: 1rem/1.55 system-ui, sans-serif; }
        main { max-width: 54rem; margin: auto; padding: clamp(1rem, 4vw, 2.5rem); }
        header { margin-bottom: 1.5rem; }
        h1 { font-size: clamp(2rem, 5vw, 3rem); line-height: 1.1; margin: .4rem 0 .65rem; letter-spacing: -.025em; }
        h2 { font-size: 1.2rem; margin: 0 0 .55rem; }
        p { margin: .5rem 0 .8rem; }
        .eyebrow { color: var(--blue); font-size: .8rem; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
        .panel { background: var(--paper); border: 1px solid var(--line); border-radius: .9rem; padding: clamp(1rem, 3vw, 1.4rem); margin: 1rem 0; }
        .muted, small { color: var(--muted); }
        .actions { display: flex; flex-wrap: wrap; gap: .6rem; margin: .8rem 0; }
        button, .button { font: inherit; font-weight: 650; display: inline-flex; align-items: center; min-height: 2.75rem; border-radius: .5rem; padding: .4rem .8rem; border: 1px solid #8ea7c8; background: #fff; color: #18417c; cursor: pointer; text-decoration: none; }
        button.primary { background: var(--blue); border-color: var(--blue); color: white; }
        a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, summary:focus-visible { outline: 3px solid #a05e00; outline-offset: 3px; }
        label, dt { display: block; margin: .8rem 0 .3rem; font-weight: 680; }
        input, select, textarea { display: block; width: 100%; padding: .65rem; border: 1px solid #8fa1b8; border-radius: .45rem; color: var(--ink); background: #fff; font: inherit; }
        textarea { resize: vertical; }
        textarea[readonly] { background: #f4f7fb; }
        summary { cursor: pointer; color: var(--blue); font-weight: 650; }
        code { overflow-wrap: anywhere; }
        dd { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
        .message { margin: .5rem 0; }
        .exercise-list li { margin: .85rem 0; }
        .solution { white-space: pre-wrap; }
      </style></head><body><main>
    <header><h1>Evaluation übernehmen</h1></header>
    <section class="panel"><h2>Erfasste Quelle prüfen</h2><p>Prüfe den Text auf Vollständigkeit und entferne persönliche Angaben. Nur dieser Text wird beim nächsten Schritt an Claude gesendet.</p><label for="source">Inhalt aus Toddle</label><textarea id="source" rows="7" maxlength="48000"></textarea><button class="primary" id="extract">Mit Claude ins Formular übertragen</button><p id="status" role="status"></p></section>
    <section class="panel"><h2>Übernommene Inhalte ansehen</h2><form id="evaluation">
    <label for="title">Titel der Evaluation</label><input id="title" maxlength="160">
    <label for="date">Datum der Evaluation</label><input id="date" type="date">
    <label for="goal">Lernziel</label><textarea id="goal" rows="3"></textarea>
    <label for="instructions">Arbeitsanweisung</label><textarea id="instructions" rows="4"></textarea>
    <label for="feedback">Lehrkraft-Rückmeldung</label><textarea id="feedback" rows="4"></textarea>
    <h2>Kriterien und Lehrkraft-Einstufungen</h2><div id="criteria"></div><p id="missing" role="status"></p>
    <button type="submit" class="primary">Vorschau anzeigen</button>
    </form></section>
    <section class="panel" id="preview" hidden><h2>Übergabe prüfen</h2><dl id="preview-fields"></dl><div id="preview-criteria"></div><button id="confirm" class="primary">Übergabe bestätigen</button><p id="confirmation" role="status"></p></section>
    <p class="muted">Diese Übergabe bleibt in der geöffneten Vorschau. Die gemeinsame Speicherung in Big Quest folgt nach der Prüfung dieses Leseschritts.</p>
    </main><script>
    const byId = id => document.getElementById(id);
    const fieldNames = ['title', 'date', 'goal', 'instructions', 'feedback'];
    const labels = ['Titel', 'Datum', 'Lernziel', 'Arbeitsanweisung', 'Lehrkraft-Rückmeldung'];
    let rows = [], busy = false;
    function textNode(tag, text) { const node = document.createElement(tag); node.textContent = text; return node; }
    function invalidate() { byId('preview').hidden = true; byId('confirmation').textContent = ''; }
    window.setSource = text => { byId('source').value = text; };
    function showCriteria(criteria) {
     rows = criteria;
     byId('criteria').replaceChildren(...criteria.map((row, index) => {
      const group = document.createElement('div');
      const label = textNode('label', row.criterion);
      label.htmlFor = `rating-${index}`;
      const select = document.createElement('select'); select.id = label.htmlFor;
      for (const value of ['', 'RS', 'C', 'M', 'E']) {
       const option = textNode('option', value || 'Einstufung offen'); option.value = value; select.append(option);
      }
      select.value = row.rating;
      select.addEventListener('change', () => { row.rating = select.value; invalidate(); });
      const evidence = document.createElement('details'); evidence.append(textNode('summary','Quellenbeleg'), textNode('p',row.evidence));
      group.append(label,select,evidence); return group;
     }));
    }
    window.fillEvaluation = evaluation => {
     for (const name of fieldNames) byId(name).value = evaluation[name] || '';
     showCriteria(evaluation.criteria || []);
     byId('missing').textContent = (evaluation.missing || []).join(' · ');
     invalidate();
    };
    byId('source').addEventListener('input', () => { window.fillEvaluation({}); });
    byId('extract').addEventListener('click', async () => {
     if (busy) return;
     const source = byId('source').value.trim();
     if (!source) { byId('status').textContent = 'Die Quelle ist leer.'; return; }
     busy = true; byId('extract').disabled = true; byId('source').readOnly = true;
     byId('evaluation').inert = true; invalidate(); byId('status').textContent = 'Claude überträgt die Inhalte …';
     try {
      const result = await window.webkit.messageHandlers.evaluation.postMessage({source});
      window.fillEvaluation(result);
      byId('status').textContent = 'Formular befüllt. Bitte Angaben und Quellenbelege prüfen.';
      byId('evaluation').scrollIntoView({behavior:'smooth'});
     } catch (error) { byId('status').textContent = String(error.message || error); }
     finally { busy = false; byId('extract').disabled = false; byId('source').readOnly = false; byId('evaluation').inert = false; }
    });
    byId('evaluation').addEventListener('input', invalidate);
    byId('evaluation').addEventListener('submit', event => {
     event.preventDefault();
     byId('preview-fields').replaceChildren(...fieldNames.flatMap((name,index) => [textNode('dt',labels[index]),textNode('dd',byId(name).value || 'Keine Angabe')]));
     byId('preview-criteria').replaceChildren(...rows.map(row => textNode('p',row.criterion + ' — ' + (row.rating || 'Einstufung offen'))));
     byId('preview').hidden = false; byId('preview').scrollIntoView({behavior:'smooth'});
    });
    byId('confirm').addEventListener('click', () => { byId('confirmation').textContent = 'Übergabe bestätigt. Der Testdatensatz bleibt bis zum Schließen in dieser Vorschau.'; });
    </script></body></html>
    """#
}
