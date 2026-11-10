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
    @State private var toddleContext: String?

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
                        Button("Toddle-Feld prüfen") {
                            Task {
                                toddleContext = await currentToddleContext()
                                showToddle = true
                            }
                        }
                    }
                }
        }
        .sheet(isPresented: $showKey) { ClaudeKeyScreen() }
        .sheet(isPresented: $showToddle) {
            ToddleFieldScreen(
                page: toddle, canImport: toddleContext != nil, openDraft: openToddleDraft
            )
        }
    }

    private func currentToddleContext() async -> String? {
        guard bigQuest.view.url?.scheme == "https", bigQuest.view.url?.host == "big-quest-test.github.io" else {
            return nil
        }
        return (try? await bigQuest.view.evaluateJavaScript(
            "window.bigQuestSchoolRow?.context() ?? null"
        )) as? String
    }

    private func openToddleDraft(_ row: ToddleField.AssessmentRow, standard: String) async throws {
        guard let context = toddleContext, await currentToddleContext() == context else {
            throw MVPError.message("Öffne zuerst Schulische Einstufungen für das richtige Kind in Big Quest.")
        }
        let result = try await bigQuest.view.callAsyncJavaScript(
            """
            if (location.origin !== 'https://big-quest-test.github.io') return 'context';
            return window.bigQuestSchoolRow?.open(context, transfer, standard, rating) ?? 'context';
            """,
            arguments: ["context": context, "transfer": row.transfer, "standard": standard, "rating": row.rating],
            in: nil, contentWorld: .page
        ) as? String
        guard result == "opened" || result == "saved" else {
            throw MVPError.message(result == "busy"
                ? "In Big Quest ist bereits ein Bewertungsentwurf offen."
                : "Das ausgewählte Kind oder die Big-Quest-Ansicht hat sich geändert.")
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
    let canImport: Bool
    let openDraft: (ToddleField.AssessmentRow, String) async throws -> Void
    @State private var row: ToddleField.AssessmentRow?
    @State private var field: String?
    @State private var returnedValue: String?
    @State private var error: String?
    @State private var reading = false
    @State private var sending = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                BrowserPane(view: page.view)
                    .frame(maxHeight: .infinity)
                Divider()
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("In Toddle als Familienmitglied anmelden. Einen einzelnen sichtbaren Feldwert markieren, zum Beispiel den Titel einer Evaluation.")
                        Button("Markierten Wert aus Toddle lesen") {
                            Task { await readField() }
                        }
                        .disabled(reading || sending)
                        if canImport {
                            Button("Bewertungszeile lesen") { Task { await readRow() } }
                                .disabled(reading || sending)
                        }
                        if let row {
                            Text(row.criterion)
                            Text("Lehrkraft-Einstufung: " + row.rating)
                            Text("An Claude geht nur der Kriterientext. Bitte prüfe ihn auf persönliche Angaben.")
                                .font(.footnote)
                            Button("Lernziel vorschlagen und Entwurf öffnen") {
                                Task { await suggest(row) }
                            }
                            .buttonStyle(.borderedProminent)
                            .disabled(reading || sending)
                        }
                        if let field {
                            Text("Gelesener Feldwert").font(.headline)
                            Text(field).textSelection(.enabled)
                            Text("Sende nur einen Wert ohne Namen, Kennungen oder andere persönliche Angaben an Anthropic.")
                                .font(.footnote)
                            Button(sending ? "Claude wird aufgerufen …" : "Diesen Wert an Claude senden") {
                                Task { await send(field) }
                            }
                            .buttonStyle(.borderedProminent)
                            .disabled(reading || sending)
                        }
                        if let returnedValue {
                            Label("Claude hat den Wert unverändert zurückgegeben", systemImage: "checkmark.circle")
                                .font(.headline)
                            Text(returnedValue).textSelection(.enabled)
                        }
                        if let error { Text(error).foregroundStyle(.red) }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                }
                .frame(height: row != nil || field != nil ? 255 : 150)
            }
            .navigationTitle("Toddle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fertig") { dismiss() }.disabled(sending)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Zurück") { page.view.goBack() }
                        .disabled(reading || sending)
                }
            }
        }
        .interactiveDismissDisabled(sending)
    }

    private func readField() async {
        guard !reading, !sending else { return }
        reading = true
        defer { reading = false }
        row = nil
        field = nil
        returnedValue = nil
        error = nil
        do {
            field = try await ToddleField.read(from: page.view)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func readRow() async {
        guard !reading, !sending else { return }
        reading = true
        defer { reading = false }
        row = nil
        field = nil
        returnedValue = nil
        error = nil
        do {
            row = try await ToddleField.readAssessmentRow(from: page.view)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func suggest(_ row: ToddleField.AssessmentRow) async {
        guard !sending, !reading else { return }
        sending = true
        defer { sending = false }
        error = nil
        do {
            let standard = try await ClaudeClient.suggestStandard(for: row.criterion, key: ClaudeKey.read())
            try await openDraft(row, standard)
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func send(_ value: String) async {
        guard !sending, !reading else { return }
        sending = true
        defer { sending = false }
        error = nil
        returnedValue = nil
        do {
            returnedValue = try await ClaudeClient.echo(value, key: ClaudeKey.read())
        } catch {
            self.error = error.localizedDescription
        }
    }
}
