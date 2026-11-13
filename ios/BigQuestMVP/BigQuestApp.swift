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
private final class BrowserPage: NSObject, ObservableObject, WKScriptMessageHandlerWithReply {
    private var busy = false
    private let url: URL
    private let persistent: Bool

    init(url: URL, persistent: Bool) {
        self.url = url
        self.persistent = persistent
        super.init()
    }

    lazy var view: WKWebView = {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = persistent ? .default() : .nonPersistent()
        if url.host == "big-quest-test.github.io" { configuration.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "bigQuestEvaluation") }
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.load(URLRequest(url: url))
        return webView
    }()
    var isEvaluationPage: Bool {
        guard let activeURL = view.url, activeURL.scheme == "https",
              activeURL.host == "big-quest-test.github.io",
              activeURL.port == nil || activeURL.port == 443 else { return false }
        return ["/probe-evaluation-form", "/probe-evaluation-form/", "/probe-evaluation-form/index.html", "/probe-evaluation-local", "/probe-evaluation-local/", "/probe-evaluation-local/index.html"].contains(activeURL.path)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard message.webView === view, message.frameInfo.isMainFrame,
              message.frameInfo.securityOrigin.protocol == "https", message.frameInfo.securityOrigin.host == "big-quest-test.github.io",
              isEvaluationPage, !busy,
              let body = message.body as? [String: Any], let source = body["source"] as? String,
              !source.isEmpty, source.utf8.count <= 48000 else { replyHandler(nil, "Ungültiger Formularaufruf."); return }
        busy = true
        Task {
            defer { busy = false }
            do {
                let result = try await ClaudeClient.extractEvaluation(source: source, key: ClaudeKey.read())
                replyHandler(try JSONSerialization.jsonObject(with: JSONEncoder().encode(result)), nil)
            } catch { replyHandler(nil, error.localizedDescription) }
        }
    }

}

private struct BrowserPane: UIViewRepresentable {
    let view: WKWebView

    func makeUIView(context: Context) -> WKWebView { view }
    func updateUIView(_ view: WKWebView, context: Context) {}
}

@MainActor
private struct BigQuestScreen: View {
    @StateObject private var bigQuest = BrowserPage(
        url: URL(string: "https://big-quest-test.github.io/probe-evaluation-local/")!, persistent: true
    )
    @StateObject private var toddle = BrowserPage(
        url: URL(string: "https://web.toddleapp.com/")!, persistent: false
    )
    @State private var showToddle = false
    @State private var showKey = false
    @State private var evaluationContext: String?
    @State private var error: String?

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
                            Task {
                                do {
                                    guard bigQuest.isEvaluationPage, let context = try await bigQuest.view.callAsyncJavaScript("return window.bigQuestEvaluationForm?.context()", arguments: [:], in: nil, contentWorld: .page) as? String else {
                                        error = "Bitte als Elternteil das Kind und den Bereich Schulische Einstufungen öffnen."; return
                                    }
                                    evaluationContext = context; error = nil; showToddle = true
                                } catch { self.error = error.localizedDescription }
                            }
                        }
                    }
                }
        }
        .alert("Evaluation", isPresented: Binding(get: { error != nil }, set: { if !$0 { error = nil } })) { Button("OK") { error = nil } } message: { Text(error ?? "") }
        .sheet(isPresented: $showKey) { ClaudeKeyScreen() }
        .sheet(isPresented: $showToddle) {
            ToddleFieldScreen(page: toddle) { source in
                guard bigQuest.isEvaluationPage, let context = evaluationContext else { throw NSError(domain:"BigQuest",code:1,userInfo:[NSLocalizedDescriptionKey:"Kindzuordnung fehlt."]) }
                let result = try await bigQuest.view.callAsyncJavaScript("return window.bigQuestEvaluationForm?.source(context, transfer, source)", arguments:["context":context,"transfer":UUID().uuidString.lowercased(),"source":source], in:nil, contentWorld:.page) as? String
                guard result == "opened" || result == "saved" else { throw NSError(domain:"BigQuest",code:2,userInfo:[NSLocalizedDescriptionKey:"Das Kind wurde gewechselt oder ein Formular ist bereits offen. Bitte zuerst in Big Quest prüfen."]) }
                showToddle = false
            }
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
    let onCapture: (String) async throws -> Void
    @State private var error: String?
    @State private var reading = false

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
                            do {
                                let source = try await ToddleField.readSource(from: page.view)
                                try await onCapture(source)
                            }
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

        }
    }
}
