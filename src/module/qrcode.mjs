// Module qrcode - a QR code for the start links (stage 3b, task "Einladungen - Oberflaeche"; concept 10.2, 10.3).
// Test build only (module.json: bau "test"). Pure functions: text -> matrix of dark/light modules -> SVG. No network, no
// library: the start code must never leave the device, so the code is drawn here (ISO/IEC 18004, byte mode, error
// correction L or M, version 1-40, mask by the penalty rules of the standard).
//
//   qrMatrix(text, { ecc = 'M', version, mask }) -> { version, ecc, mask, size, dunkel: (x, y) -> boolean, zeilen: [[0|1]] }
//     version/mask: fixed for tests; otherwise the smallest version that fits and the mask with the lowest penalty.
//   qrSvg(text, { ecc, rand = 4, titel }) -> '<svg ...>' (one path; black on white, quiet zone of "rand" modules)
//
// Names: every helper starts with "qr"/"QR_" because all modules and index.html share one scope in the app.

/* error correction: codewords per block and number of blocks, index = version (0 unused) */
const QR_ECC = Object.freeze({
  L: {
    bits: 1,
    proBlock: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    bloecke: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  },
  M: {
    bits: 0,
    proBlock: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    bloecke: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  },
});
export const QR_STUFEN = Object.freeze(Object.keys(QR_ECC));

const qrBit = (x, i) => ((x >>> i) & 1) !== 0;
function qrFalsch(text) { return new Error('qrcode: ' + text); }

/* modules that carry data in a version (all minus function patterns) */
function qrRohModule(v) {
  let r = (16 * v + 128) * v + 64;
  if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
  return r;
}
const qrDatenWorte = (v, e) => Math.floor(qrRohModule(v) / 8) - QR_ECC[e].proBlock[v] * QR_ECC[e].bloecke[v];
const qrZaehlerBits = (v) => (v <= 9 ? 8 : 16);

/* ---------- Reed-Solomon over GF(256), polynomial 0x11D ---------- */
function qrMal(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; }
  return z & 0xff;
}
function qrTeiler(grad) {
  const r = new Array(grad).fill(0); r[grad - 1] = 1;
  let wurzel = 1;
  for (let i = 0; i < grad; i++) {
    for (let j = 0; j < r.length; j++) { r[j] = qrMal(r[j], wurzel); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
    wurzel = qrMal(wurzel, 0x02);
  }
  return r;
}
function qrRest(daten, teiler) {
  const r = teiler.map(() => 0);
  for (const b of daten) { const f = b ^ r.shift(); r.push(0); teiler.forEach((c, i) => { r[i] ^= qrMal(c, f); }); }
  return r;
}

/* ---------- data: byte mode (UTF-8), terminator, padding, blocks with error correction, interleaved ---------- */
function qrDaten(bytes, v, e) {
  const bits = [];
  const an = (wert, n) => { for (let i = n - 1; i >= 0; i--) bits.push((wert >>> i) & 1); };
  an(4, 4); an(bytes.length, qrZaehlerBits(v));
  for (const b of bytes) an(b, 8);
  const kap = qrDatenWorte(v, e) * 8;
  an(0, Math.min(4, kap - bits.length));
  an(0, (8 - (bits.length % 8)) % 8);
  for (let p = 0xec; bits.length < kap; p ^= 0xec ^ 0x11) an(p, 8);
  const worte = [];
  for (let i = 0; i < bits.length; i += 8) worte.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  // blocks
  const nb = QR_ECC[e].bloecke[v], ecl = QR_ECC[e].proBlock[v], roh = Math.floor(qrRohModule(v) / 8);
  const kurz = nb - (roh % nb), kurzLang = Math.floor(roh / nb), teiler = qrTeiler(ecl), bloecke = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const d = worte.slice(k, k + kurzLang - ecl + (i < kurz ? 0 : 1)); k += d.length;
    const r = qrRest(d, teiler);
    if (i < kurz) d.push(0);
    bloecke.push(d.concat(r));
  }
  const out = [];
  for (let i = 0; i < bloecke[0].length; i++) for (let j = 0; j < bloecke.length; j++) if (i !== kurzLang - ecl || j >= kurz) out.push(bloecke[j][i]);
  return out;
}

/* ---------- the symbol ---------- */
function qrAusrichtung(v, size) {
  if (v === 1) return [];
  const n = Math.floor(v / 7) + 2, schritt = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2, r = [6];
  for (let p = size - 7; r.length < n; p -= schritt) r.splice(1, 0, p);
  return r;
}
function qrGrund(v, e) {
  const size = v * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  const fest = Array.from({ length: size }, () => new Array(size).fill(false));
  const setz = (x, y, d) => { m[y][x] = d; fest[y][x] = true; };
  for (let i = 0; i < size; i++) { setz(6, i, i % 2 === 0); setz(i, 6, i % 2 === 0); }
  const finder = (x, y) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy;
      if (xx >= 0 && xx < size && yy >= 0 && yy < size) setz(xx, yy, d !== 2 && d !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const a = qrAusrichtung(v, size), n = a.length;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setz(a[i] + dx, a[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  qrFormat(m, fest, size, e, 0);
  if (v >= 7) {
    let r = v;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const bits = (v << 12) | r;
    for (let i = 0; i < 18; i++) { const b = qrBit(bits, i), p = size - 11 + (i % 3), q = Math.floor(i / 3); setz(p, q, b); setz(q, p, b); }
  }
  return { size, m, fest };
}
function qrFormat(m, fest, size, e, maske) {
  const setz = (x, y, d) => { m[y][x] = d; fest[y][x] = true; };
  const d = (QR_ECC[e].bits << 3) | maske;
  let r = d;
  for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
  const bits = ((d << 10) | r) ^ 0x5412;
  for (let i = 0; i <= 5; i++) setz(8, i, qrBit(bits, i));
  setz(8, 7, qrBit(bits, 6)); setz(8, 8, qrBit(bits, 7)); setz(7, 8, qrBit(bits, 8));
  for (let i = 9; i < 15; i++) setz(14 - i, 8, qrBit(bits, i));
  for (let i = 0; i < 8; i++) setz(size - 1 - i, 8, qrBit(bits, i));
  for (let i = 8; i < 15; i++) setz(8, size - 15 + i, qrBit(bits, i));
  setz(8, size - 8, true);
}
function qrWorteSetzen(g, worte) {
  const { size, m, fest } = g;
  let i = 0;
  for (let rechts = size - 1; rechts >= 1; rechts -= 2) {
    if (rechts === 6) rechts = 5;
    for (let s = 0; s < size; s++) for (let j = 0; j < 2; j++) {
      const x = rechts - j, hoch = ((rechts + 1) & 2) === 0, y = hoch ? size - 1 - s : s;
      if (!fest[y][x] && i < worte.length * 8) { m[y][x] = qrBit(worte[i >>> 3], 7 - (i & 7)); i++; }
    }
  }
}
const QR_MASKEN = [
  (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];
function qrMaske(g, k) {
  for (let y = 0; y < g.size; y++) for (let x = 0; x < g.size; x++) if (!g.fest[y][x] && QR_MASKEN[k](x, y)) g.m[y][x] = !g.m[y][x];
}
/* penalty of a finished symbol (N1 = 3, N2 = 3, N3 = 40, N4 = 10) */
function qrStrafe(m) {
  const size = m.length;
  let r = 0;
  const finder = (h) => { const n = h[1], kern = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n; return (kern && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (kern && h[6] >= n * 4 && h[0] >= n ? 1 : 0); };
  const merk = (lauf, h) => { if (h[0] === 0) lauf += size; h.pop(); h.unshift(lauf); };
  const linie = (get) => {
    let farbe = false, lauf = 0; const h = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < size; i++) {
      if (get(i) === farbe) { lauf++; if (lauf === 5) r += 3; else if (lauf > 5) r++; }
      else { merk(lauf, h); if (!farbe) r += finder(h) * 40; farbe = get(i); lauf = 1; }
    }
    if (farbe) { merk(lauf, h); lauf = 0; }
    lauf += size; merk(lauf, h); r += finder(h) * 40;
  };
  for (let y = 0; y < size; y++) linie((x) => m[y][x]);
  for (let x = 0; x < size; x++) linie((y) => m[y][x]);
  for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) r += 3; }
  let dunkel = 0;
  for (const z of m) for (const c of z) if (c) dunkel++;
  const total = size * size;
  r += (Math.ceil(Math.abs(dunkel * 20 - total * 10) / total) - 1) * 10;
  return r;
}

/* text -> matrix; see the head of this file */
export function qrMatrix(text, { ecc = 'M', version, mask } = {}) {
  if (typeof text !== 'string') throw qrFalsch('Text erwartet.');
  if (!QR_ECC[ecc]) throw qrFalsch('Fehlerkorrektur L oder M.');
  if (mask !== undefined && !(Number.isInteger(mask) && mask >= 0 && mask <= 7)) throw qrFalsch('Maske 0-7.');
  const bytes = [...new TextEncoder().encode(text)];
  const passt = (v) => 4 + qrZaehlerBits(v) + bytes.length * 8 <= qrDatenWorte(v, ecc) * 8;
  let v = version;
  if (v === undefined) { for (v = 1; v <= 40 && !passt(v); v++); }
  if (!(Number.isInteger(v) && v >= 1 && v <= 40) || !passt(v)) throw qrFalsch('Text zu lang fuer diese Version.');
  const worte = qrDaten(bytes, v, ecc);
  const bauen = (k) => { const g = qrGrund(v, ecc); qrWorteSetzen(g, worte); qrMaske(g, k); qrFormat(g.m, g.fest, g.size, ecc, k); return g; };
  let best = null, beste = -1;
  for (const k of mask === undefined ? [0, 1, 2, 3, 4, 5, 6, 7] : [mask]) {
    const g = bauen(k), s = mask === undefined ? qrStrafe(g.m) : 0;
    if (best === null || s < best.s) { best = { g, s }; beste = k; }
  }
  const m = best.g.m;
  return { version: v, ecc, mask: beste, size: best.g.size, dunkel: (x, y) => !!(m[y] && m[y][x]), zeilen: m.map((z) => z.map((c) => (c ? 1 : 0))) };
}

/* text -> SVG (one path, black on white; a quiet zone of "rand" modules) */
export function qrSvg(text, { ecc = 'M', rand = 4, titel = '' } = {}) {
  const q = qrMatrix(text, { ecc }), n = q.size + 2 * rand;
  let d = '';
  for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.dunkel(x, y)) d += 'M' + (x + rand) + ' ' + (y + rand) + 'h1v1h-1z';
  const t = String(titel).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" role="img"' + (t ? ' aria-label="' + t.replace(/"/g, '&quot;') + '"' : '') + '>'
    + '<rect width="' + n + '" height="' + n + '" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>';
}
