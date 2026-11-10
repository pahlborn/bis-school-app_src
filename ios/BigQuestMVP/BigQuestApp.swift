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
                        Button("Evaluation aus Toddle") {
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
    @State private var assessment: ToddleField.Assessment?
    @State private var suggestions: [String: String] = [:]
    @State private var error: String?
    @State private var reading = false
    @State private var sending = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                BrowserPane(view: page.view)
                    .frame(maxHeight: .infinity)
                    .allowsHitTesting(!reading && !sending && assessment == nil)
                Divider()
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Öffne in Toddle die gewünschte Evaluation mit ihren Bewertungskriterien.")
                        Button(reading ? "Wird gelesen …" : "Geöffnete Evaluation lesen") {
                            Task { await readAssessment() }
                        }
                        .disabled(reading || sending)
                        if let assessment {
                            Text("Gelesene Kriterien: \(assessment.rows.count)").font(.headline)
                            Text("Lokale Aufnahme der gelesenen Kriterien. Vollständigkeit noch nicht bestätigt; es wird nichts gespeichert.")
                            Button("Andere Evaluation öffnen") {
                                self.assessment = nil
                                suggestions = [:]
                                error = nil
                            }.disabled(reading || sending)
                            Text("Dieser Entwicklungsstand prüft nur die Lernziele Runden (M-N3) und Subtraktionsstrategien (M-N5).")
                            if assessment.skipped > 0 {
                                Text("\(assessment.skipped) Tabellenzeilen ohne eindeutig lesbare Einstufung. Die Übernahme ist gesperrt, bis die Vollständigkeit geklärt ist.")
                                    .foregroundStyle(.orange)
                            }
                            ForEach(assessment.rows, id: \.transfer) { row in
                                VStack(alignment: .leading) {
                                    Text(row.criterion)
                                    Text("Lehrkraft-Einstufung: " + row.rating).bold()
                                    if let suggestion = suggestions[row.transfer] {
                                        Text("Lernzielvorschlag: " + suggestion)
                                    }
                                }
                                Divider()
                            }
                            Text("An Claude gehen nur die angezeigten Kriterientexte. Bitte vorher auf persönliche Angaben prüfen.")
                                .font(.footnote)
                            Button(sending ? "Lernziele werden geprüft …" : "Lernziele mit Claude zuordnen") {
                                Task { await classify(assessment) }
                            }
                            .disabled(reading || sending)
                            Text("Die gemeinsame Übernahme in Big Quest ist noch nicht freigeschaltet. Zuerst muss die Vollständigkeit an der echten Evaluation geprüft werden.")
                        }
                        if let error { Text(error).foregroundStyle(.red) }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                }
                .frame(height: assessment == nil ? 150 : 330)
            }
            .navigationTitle("Toddle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fertig") { dismiss() }.disabled(reading || sending)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Zurück") {
                        assessment = nil
                        suggestions = [:]
                        error = nil
                        page.view.goBack()
                    }.disabled(reading || sending)
                }
            }
        }
        .interactiveDismissDisabled(reading || sending)
    }

    private func readAssessment() async {
        guard !reading, !sending else { return }
        reading = true
        defer { reading = false }
        assessment = nil
        suggestions = [:]
        error = nil
        do { assessment = try await ToddleField.readAssessment(from: page.view) }
        catch { self.error = error.localizedDescription }
    }

    private func classify(_ assessment: ToddleField.Assessment) async {
        guard !sending, !reading else { return }
        sending = true
        defer { sending = false }
        error = nil
        do {
            let key = try ClaudeKey.read()
            for row in assessment.rows where suggestions[row.transfer] == nil {
                let result = try await ClaudeClient.classifyStandard(for: row.criterion, key: key)
                suggestions[row.transfer] = result == "unmatched" ? "Kein passendes Lernziel" : result
            }
        } catch { self.error = error.localizedDescription }
    }

}
