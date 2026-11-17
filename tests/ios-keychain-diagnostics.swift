import Foundation
import Security

// Only synthetic values and injected Security operations. No Keychain or API calls.
@main struct KeychainDiagnosticsRegression {
    private static let fakeKey = "sk-ant-synthetic-test-value"
    private static let group = "EXAMPLE.de.bigquest.ipad"

    private final class Mock {
        var calls: [String] = []
        var updateCode = errSecSuccess
        var addCode = errSecSuccess
        var readCode = errSecSuccess
        var readKey: String? = KeychainDiagnosticsRegression.fakeKey
        var readGroup: String? = KeychainDiagnosticsRegression.group
        var probeCode = errSecSuccess
        var probeAccount: String?

        var store: ClaudeKey.Store {
            ClaudeKey.Store(update: { query, values in
                self.calls.append("update")
                precondition(query[kSecAttrAccount as String] as? String == "anthropic")
                precondition(values[kSecValueData as String] is Data)
                return self.updateCode
            }, add: { query in
                let account = query[kSecAttrAccount as String] as! String
                if account.hasPrefix("access-group-diagnostic-") {
                    self.calls.append("probe")
                    self.probeAccount = account
                    precondition(query[kSecValueData as String] as? Data == Data())
                    return (self.probeCode, self.probeCode == errSecSuccess ? [kSecAttrAccessGroup as String: KeychainDiagnosticsRegression.group] : nil)
                }
                self.calls.append("add")
                precondition(account == "anthropic")
                return (self.addCode, nil)
            }, copy: { query in
                self.calls.append("read")
                precondition(query[kSecAttrAccount as String] as? String == "anthropic")
                precondition(query[kSecReturnData as String] as? Bool == true)
                precondition(query[kSecReturnAttributes as String] as? Bool == true)
                var attributes: [String: Any] = [:]
                if let key = self.readKey { attributes[kSecValueData as String] = Data(key.utf8) }
                if let value = self.readGroup { attributes[kSecAttrAccessGroup as String] = value }
                return (self.readCode, self.readCode == errSecSuccess ? attributes : nil)
            }, delete: { query in
                self.calls.append("cleanup")
                precondition(query[kSecAttrAccount as String] as? String == self.probeAccount)
                precondition(query[kSecAttrAccount as String] as? String != "anthropic")
                precondition(query[kSecReturnAttributes as String] == nil)
                return errSecSuccess
            })
        }
    }

    static func main() throws {
        let updated = Mock()
        let success = try ClaudeKey.save(fakeKey, store: updated.store)
        precondition(updated.calls == ["update", "read"])
        precondition(success.saveCode == 0 && success.diagnostics.readCode == 0 && success.verified)
        precondition(success.diagnostics.accessGroup == group)

        let added = Mock()
        added.updateCode = errSecItemNotFound
        let addedResult = try ClaudeKey.save(fakeKey, store: added.store)
        precondition(addedResult.verified)
        precondition(added.calls == ["update", "add", "read"])

        // A failed add must preserve the add's actual status, not the update status.
        let denied = Mock()
        denied.updateCode = errSecItemNotFound
        denied.addCode = errSecMissingEntitlement
        let failed = try ClaudeKey.save(fakeKey, store: denied.store)
        precondition(failed.saveCode == -34018 && failed.diagnostics.readCode == 0 && !failed.verified)
        precondition(denied.calls == ["update", "add", "read"])

        let different = Mock()
        different.readKey = "sk-ant-synthetic-older-value"
        let differentResult = try ClaudeKey.save(fakeKey, store: different.store)
        precondition(!differentResult.verified)

        let unreadable = Mock()
        unreadable.readKey = nil
        let unreadableResult = try ClaudeKey.save(fakeKey, store: unreadable.store)
        precondition(!unreadableResult.verified)

        for code in [errSecItemNotFound, errSecMissingEntitlement, errSecInteractionNotAllowed, OSStatus(-50)] {
            let missing = Mock()
            missing.readCode = code
            missing.readGroup = nil
            let report = ClaudeKey.startupDiagnostics(store: missing.store)
            precondition(report.readCode == code && report.accessGroup == group)
            precondition(missing.calls == ["read", "probe", "cleanup"])
            let savedButUnreadable = Mock()
            savedButUnreadable.readCode = code
            savedButUnreadable.readGroup = nil
            let unverified = try ClaudeKey.save(fakeKey, store: savedButUnreadable.store)
            precondition(unverified.saveCode == 0 && unverified.diagnostics.readCode == code && !unverified.verified)
            precondition(savedButUnreadable.calls == ["update", "read", "probe", "cleanup"])
            for language in ["de-DE", "en-US"] {
                let text = KeychainText.status(code, locale: Locale(identifier: language))
                precondition(text.contains(String(code)) && !text.contains(fakeKey))
            }
            do {
                _ = try ClaudeKey.read(store: missing.store)
                preconditionFailure("Failed Keychain reads must throw")
            } catch {
                precondition(error.localizedDescription.contains(String(code)))
                precondition(!error.localizedDescription.contains(fakeKey))
            }
        }

        let locked = Mock()
        locked.readCode = errSecInteractionNotAllowed
        locked.readGroup = nil
        locked.probeCode = errSecMissingEntitlement
        let unavailable = ClaudeKey.startupDiagnostics(store: locked.store)
        precondition(unavailable.readCode == -25308 && unavailable.accessGroup == nil)
        precondition(locked.calls == ["read", "probe", "cleanup"])
        precondition(unavailable.groupDescription(locale: Locale(identifier: "en-US")).contains("-34018"))

        let invalid = Mock()
        do {
            _ = try ClaudeKey.save("invalid synthetic value", store: invalid.store)
            preconditionFailure("Invalid keys must be rejected before Keychain access")
        } catch { precondition(invalid.calls.isEmpty) }

        for (code, de, enUS) in [
            (OSStatus(-25300), "Nicht gefunden", "Not found"),
            (OSStatus(-34018), "Keine Berechtigung", "Missing entitlement"),
            (OSStatus(-25308), "Gerät gesperrt", "Device locked"),
            (OSStatus(-50), "Sonstiger", "Other"),
        ] {
            precondition(KeychainText.status(code, locale: Locale(identifier: "de-DE")).contains(de))
            precondition(KeychainText.status(code, locale: Locale(identifier: "en-US")).contains(enUS))
        }
        print("EV-1.2: save/readback, status codes, access group, cleanup and DE/en-US diagnostics passed with synthetic storage")
    }
}
