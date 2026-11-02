// Modul krypto ohne Browser (S12 P1, EP6: US6.1-US6.6).
//   node --test tests/module/krypto.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodeCrypto from 'node:crypto';
import {
  PBKDF2_ROUNDS, bytesToB64, b64ToBytes, entryAad, newAreaKey, sealEntry, openEntry, openEntryText, pbkdf2Bits,
  newPersonKeys, publicKeysOf, lockPersonKeys, unlockPersonKeys, keyFingerprint, wrapKeyFor, unwrapKey,
  signBytes, verifyBytes, createKeyring, addKeyHolder, rotateKeyring, keysForHolder,
} from '../../src/module/krypto.mjs';
import { PW_WORDS } from '../../src/module/passwort.mjs';

const hex = (u8) => Buffer.from(u8).toString('hex');
const R = 1000;   // few rounds in tests; the app value is checked separately
async function person(id) { const keys = await newPersonKeys(); return { id, keys, pub: await publicKeysOf(keys) }; }

test('Pruefwert AES-256-GCM: gleiches Ergebnis wie Node-crypto (unabhaengige Umsetzung)', async () => {
  const rawKey = new Uint8Array(32).map((_, i) => i), iv = new Uint8Array(12).map((_, i) => 200 + i), aad = entryAad('kid:p_k1', 3, 'e_7');
  const key = await globalThis.crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt', 'decrypt']);
  const s = await sealEntry(key, 'Tiger stars: 13', aad, () => iv);
  const c = nodeCrypto.createCipheriv('aes-256-gcm', rawKey, iv); c.setAAD(aad);
  const ref = Buffer.concat([c.update('Tiger stars: 13', 'utf8'), c.final(), c.getAuthTag()]);
  assert.equal(hex(b64ToBytes(s.ct)), ref.toString('hex'));
  assert.equal(await openEntryText(key, s, aad), 'Tiger stars: 13');
});

test('Pruefwerte PBKDF2-HMAC-SHA-256 (bekannte Referenzwerte)', async () => {
  const salt = new TextEncoder().encode('salt');
  assert.equal(hex(await pbkdf2Bits('password', salt, 1)), '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');
  assert.equal(hex(await pbkdf2Bits('password', salt, 2)), 'ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43');
  assert.equal(hex(await pbkdf2Bits('password', salt, 4096)), 'c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a');
  assert.equal(PBKDF2_ROUNDS, 600000, 'app value (concept 8.1)');
});

test('US6.1: vertauschter Bereich, andere Version, anderer Eintrag oder ein veraendertes Byte -> Entschluesseln schlaegt fehl', async () => {
  const key = await newAreaKey(), aad = entryAad('kid:p_k1', 1, 'e_1');
  const s = await sealEntry(key, 'stars 5', aad);
  assert.equal(await openEntryText(key, s, aad), 'stars 5');
  for (const falsch of [entryAad('kid:p_k2', 1, 'e_1'), entryAad('kid:p_k1', 2, 'e_1'), entryAad('kid:p_k1', 1, 'e_2')]) await assert.rejects(openEntry(key, s, falsch));
  const ct = b64ToBytes(s.ct); ct[3] ^= 1;
  await assert.rejects(openEntry(key, { iv: s.iv, ct: bytesToB64(ct) }, aad));
  await assert.rejects(openEntry(await newAreaKey(), s, aad), 'other key');
  const s2 = await sealEntry(key, 'stars 5', aad);
  assert.notEqual(s2.iv, s.iv, 'fresh IV per entry');
});

test('US6.2: Personenschluessel nur mit Passwort oder Wiederherstellungscode; falsch -> neutrale Meldung; nicht exportierbar', async () => {
  const p = await person('p_e1');
  const locked = await lockPersonKeys(p.keys, 'p_e1', ['Tiger-Lamp-River-4271', 'RC-ABCD-EFGH-JKLM'], { rounds: R });
  assert.equal(locked.locks.length, 2);
  assert.ok(!JSON.stringify(locked).includes('Tiger'), 'no password in the stored form');
  const k1 = await unlockPersonKeys(locked, 'p_e1', 'Tiger-Lamp-River-4271');
  const k2 = await unlockPersonKeys(locked, 'p_e1', 'RC-ABCD-EFGH-JKLM');
  assert.equal(k1.ecdh.privateKey.extractable, false); assert.equal(k1.ecdsa.privateKey.extractable, false);
  await assert.rejects(unlockPersonKeys(locked, 'p_e1', 'tiger-lamp-river-4271'), /^Error: Anmeldung fehlgeschlagen$/);
  await assert.rejects(unlockPersonKeys(locked, 'p_e2', 'Tiger-Lamp-River-4271'), /^Error: Anmeldung fehlgeschlagen$/, 'locked key of one person cannot pass as another');
  const sig = await signBytes(k2, 'hello');
  assert.equal(await verifyBytes(p.pub, 'hello', sig), true, 'unlocked keys are the real ones');
  assert.ok(k1);
});

test('US6.2: Standard-Rundenzahl beim Sperren ist 600 000', async () => {
  const p = await person('p_x');
  const t = Date.now();
  const locked = await lockPersonKeys(p.keys, 'p_x', ['Owl-Cake-Moon-1357']);
  assert.equal(locked.locks[0].rounds, 600000);
  console.log(`  PBKDF2 600 000 Runden (Node, dieser Rechner): ${Date.now() - t} ms`);
});

test('US6.3: nur der Empfaenger entpackt den Bereichsschluessel (Test mit drittem Schluessel)', async () => {
  const anna = await person('p_e2'), dritte = await person('p_l1');
  const key = await newAreaKey(), aad = entryAad('kid:p_k1', 1, 'e_1'), s = await sealEntry(key, 'progress', aad);
  const w = await wrapKeyFor(key, anna, 'kid:p_k1', 1);
  const k = await unwrapKey(w, anna.keys, 'p_e2', 'kid:p_k1', 1);
  assert.equal(await openEntryText(k, s, aad), 'progress');
  await assert.rejects(unwrapKey(w, dritte.keys, 'p_l1', 'kid:p_k1', 1), 'third key');
  await assert.rejects(unwrapKey(w, dritte.keys, 'p_e2', 'kid:p_k1', 1), 'third key, pretending the id');
  await assert.rejects(unwrapKey(w, anna.keys, 'p_e2', 'kid:p_k2', 1), 'other area');
  await assert.rejects(unwrapKey(w, anna.keys, 'p_e2', 'kid:p_k1', 2), 'other version');
});

test('US6.4: Unterschrift - ein veraendertes Byte oder ein anderer Schluessel -> verworfen', async () => {
  const a = await person('p_e1'), b = await person('p_e2');
  const bytes = new TextEncoder().encode('{"ev":"answer","ok":true}');
  const sig = await signBytes(a.keys, bytes);
  assert.equal(await verifyBytes(a.pub, bytes, sig), true);
  const anders = bytes.slice(); anders[5] ^= 1;
  assert.equal(await verifyBytes(a.pub, anders, sig), false);
  assert.equal(await verifyBytes(b.pub, bytes, sig), false);
  assert.equal(await verifyBytes(a.pub, bytes, 'kaputt'), false);
  assert.equal(await verifyBytes(a.pub, bytes, '%%%nicht-base64%%%'), false, 'unreadable signature');
  assert.equal(await verifyBytes({ ecdsa: 'AAAA' }, bytes, sig), false, 'unreadable public key');
});

test('US6.5: Fingerabdruck - 6 Woerter, fest je Schluessel; abweichender Schluessel -> nichts verpackt', async () => {
  const anna = await person('p_e2'), fremd = await person('p_e2');
  const fp = await keyFingerprint(anna.pub);
  assert.match(fp, /^[a-z]+(-[a-z]+){5}$/);
  assert.ok(fp.split('-').every((w) => PW_WORDS.includes(w)));
  assert.equal(await keyFingerprint(anna.pub), fp, 'stable');
  assert.notEqual(await keyFingerprint(fremd.pub), fp);
  const key = await newAreaKey();
  await assert.rejects(wrapKeyFor(key, fremd, 'kid:p_k1', 1, { expectedFingerprint: fp }), /Fingerabdruck passt nicht/);
  assert.ok(await wrapKeyFor(key, anna, 'kid:p_k1', 1, { expectedFingerprint: fp }));
  assert.ok(6 * Math.log2(new Set(PW_WORDS).size) >= 55, 'at least 55 bits');
});

test('US6.6 / E6: nach Widerruf liest die Lehrkraft alte Eintraege, aber keine neuen; Eltern lesen alles', async () => {
  const peter = await person('p_e1'), anna = await person('p_e2'), frau = await person('p_l1');
  const area = 'kid:p_k1';
  let { ring, key } = await createKeyring(area, [peter, anna]);
  await addKeyHolder(ring, key, frau);                                  // grant
  const alt = await sealEntry(key, 'old', entryAad(area, ring.current, 'e_1'));
  ({ ring, key } = await rotateKeyring(ring, [peter, anna]));          // grant ended -> key change
  const neu = await sealEntry(key, 'new', entryAad(area, ring.current, 'e_2'));
  assert.equal(ring.current, 2);
  const kf = await keysForHolder(ring, frau.keys, 'p_l1');
  assert.deepEqual([...kf.keys()], [1]);
  assert.equal(await openEntryText(kf.get(1), alt, entryAad(area, 1, 'e_1')), 'old', 'what was seen stays seen');
  await assert.rejects(openEntry(kf.get(1), neu, entryAad(area, 2, 'e_2')), 'no new data for the former holder');
  const kp = await keysForHolder(ring, peter.keys, 'p_e1');
  assert.deepEqual([...kp.keys()].sort(), [1, 2]);
  assert.equal(await openEntryText(kp.get(2), neu, entryAad(area, 2, 'e_2')), 'new');
  assert.ok(JSON.parse(JSON.stringify(ring)).versions['2'].p_e2, 'keyring is plain JSON');
});

test('Zufall nur aus crypto.getRandomValues; kein Math.random im Modul', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../../src/module/krypto.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random/);
});
