// EV-1.3: coordination of the optional native device-access bridge. The browser
// remains responsible for checking access. No provider API key belongs here.
export const ANM_NATIVE_ZUGANG = /^[\x21-\x7e]{8,255}$/;
export function anmNativeZugangGueltig(value) {
  return typeof value === 'string' && ANM_NATIVE_ZUGANG.test(value) && !/^sk-ant-/i.test(value);
}

export function anmNativeGeraet({ postMessage, verbunden, pruefen, uebernehmen } = {}) {
  let gestartet = false, generation = 0;
  const verfuegbar = typeof postMessage === 'function';
  const verbundenJetzt = () => !!verbunden();
  return {
    async merken(code) {
      generation++;
      if (!verfuegbar) return 'ohne-native';
      if (!anmNativeZugangGueltig(code)) return 'fehler';
      try { return (await postMessage({ action: 'remember', code }))?.status === 'ok' ? 'ok' : 'fehler'; }
      catch { return 'fehler'; }
    },
    async starten() {
      if (gestartet) return 'uebersprungen';
      gestartet = true;
      if (!verfuegbar || verbundenJetzt()) return 'uebersprungen';
      const stand = generation;
      const veraltet = () => stand !== generation || verbundenJetzt();
      let reply;
      try { reply = await postMessage({ action: 'read' }); }
      catch { return veraltet() ? 'uebersprungen' : 'fehler'; }
      if (veraltet()) return 'uebersprungen';
      if (reply?.status === 'missing') return 'leer';
      if (reply?.status !== 'ok' || !anmNativeZugangGueltig(reply.code)) return 'fehler';
      const code = reply.code;
      let result;
      try { result = await pruefen(code); }
      catch { result = 'offline'; }
      if (veraltet()) return 'uebersprungen';
      if (result !== 'ok') {
        // Conditional deletion must not erase a newer native value if a manual
        // connection succeeds while the old restore is finishing.
        if (result === 'falsch') {
          try { await postMessage({ action: 'forget', code }); } catch { /* normal connection remains available */ }
        }
        return veraltet() ? 'uebersprungen' : result;
      }
      uebernehmen(code);
      return 'verbunden';
    },
  };
}
