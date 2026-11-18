// Prueft die Fragen der App im Browser: je Fach ein kurzer Bedienweg (eine Runde mit den richtigen Antworten, echte
// Klicks) und Practise Today. Die langen Durchlaeufe (alle Quests, viele Runden: Widersprueche, 8 von 8, Practise
// Today und Fach-Mixe) laufen seit 04.11. ohne Browser in tests/aufgaben-node.test.mjs.
//   node --test tests/fragen.test.mjs

import { test, before, after } from 'node:test';
import { appLesen } from '../werkzeug/module.mjs';
import assert from 'node:assert/strict';
import {
  appServer, browserStarten, appOeffnen, zustand, klick, sichtbar, textAus,
  alleKarten, karteOeffnen, zurStart, frageBeantworten
} from './app-hilfen.mjs';

const quelltext = await appLesen('utf8');

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const app = () => appOeffnen(browser, server.url);

/** Spielt die laufende Runde mit den richtigen Antworten durch. */
async function durchspielen(page, fehler) {
  for (let f = 0; f < 8; f++) {
    const s = await zustand(page);
    const q = s.round[s.idx];
    assert.equal(s.idx, f, `${s.world}: Frage ${f + 1} wurde nicht angezeigt (haengt)`);
    await frageBeantworten(page, q);
    assert.ok(await page.evaluate(() => { const fb = document.querySelector('#feedback'); return !fb.hidden && fb.classList.contains('good'); }),
      `${s.world}: richtige Antwort nicht als richtig gewertet: ${textAus(q.prompt)}`);
    await klick(page, '#nextBtn');
    assert.deepEqual(fehler, [], `${s.world}: Fehler nach Frage ${f + 1}`);
  }
  assert.ok(await sichtbar(page, '#results'), 'Ergebnisseite nach Frage 8');
  assert.equal(await page.textContent('#resScore'), '8');
  await klick(page, '#homeBtn');
}

test('Bedienweg je Fach: erste Quest eine Runde mit richtigen Antworten (8 von 8), dazu Practise Today', async () => {
  const { ctx, page, fehler } = await app();
  const karten = (await alleKarten(page)).filter((k) => !k.studio);
  const faecher = [...new Set(karten.map((k) => k.fach))];
  assert.ok(faecher.length >= 7, `nur ${faecher.length} Faecher mit Quests`);
  for (const fach of faecher) {
    await karteOeffnen(page, karten.find((k) => k.fach === fach));
    await durchspielen(page, fehler);
  }
  await zurStart(page);
  await klick(page, '#todayBtn');
  await durchspielen(page, fehler);
  await ctx.close();
});

test('EP01 Rounding Road: real quest card scores 8/8; help keeps the neighbouring-number bridge playable', async () => {
  const {ctx,page,fehler}=await app();
  try {
    const rounding=(await alleKarten(page)).find(k=>k.item==='round');
    assert.ok(rounding,'actual Rounding Road card');
    await karteOeffnen(page,rounding);
    await durchspielen(page,fehler);
    // Use a fresh round and the real "show answer" action to schedule two
    // foundation tasks and the same-level return; never replace the app's round.
    await karteOeffnen(page,rounding);
    let found=false;
    for(let i=0;i<8;i++){
      const s=await zustand(page),q=s.round[s.idx];
      if(q.coach && ['round','round-explain','benchmark'].includes(q.coach.family)){
        await klick(page,'#helpBtn');
        assert.match(await page.textContent('#feedback'),/halfway|neighbouring/);
        await klick(page,'#answerBtn');
        const changed=await zustand(page);
        const bridge=changed.round.slice(changed.idx+1).filter(x=>x.bridge);
        const queued=await page.evaluate(()=>JSON.parse(localStorage.getItem('bq2_bridgeNext')||'[]'));
        const all=[...bridge,...queued];
        assert.ok(all.length>=3,'two easier tasks plus return are scheduled');
        assert.equal(all[0].level,1);assert.equal(all[1].level,1);
        assert.equal(all[0].bridgePart,'practice');assert.equal(all[1].bridgePart,'practice');
        assert.equal(all[2].bridgePart,'return');
        await klick(page,'#nextBtn');
        found=true;
        break;
      }
      await frageBeantworten(page,q);await klick(page,'#nextBtn');
    }
    assert.ok(found,'rounding coach available in merged quest');
    while(await sichtbar(page,'#play')){
      const s=await zustand(page);await frageBeantworten(page,s.round[s.idx]);
      assert.ok(await page.evaluate(()=>document.querySelector('#feedback').classList.contains('good')));
      await klick(page,'#nextBtn');
    }
    assert.ok(await sichtbar(page,'#results'));assert.deepEqual(fehler,[]);
  } finally {await ctx.close();}
});

// Strategie- und Verstaendnisfragen (01.11.): falsche Antworten sollen typische
// Denkfehler sein, keine Scherzantworten, die man ohne Nachdenken ausschliesst;
// Runden nach dem Schulmodell (Nachbarzahlen und Mitte), nicht "ab 5 aufrunden".
test('Strategiefragen: keine Scherz-Ablenker, Runden nach dem Schulmodell', () => {
  const SCHERZ = ['Take a selfie', 'Ask the sticker', 'Colour the page', 'The first letter', 'Draw a map',
    'Ask a stranger', 'Hide it', 'Throw it away', 'Write it bigger', 'So the numbers look pretty',
    'Tens look nicer', 'Erase the question', 'Draw on the back', 'Fold it', 'Because it is a rule for colouring'];
  for (const s of SCHERZ) assert.ok(!quelltext.includes(`"${s}"`), `Scherz-Ablenker noch da: ${s}`);
  assert.ok(!/digit 5 or more: round up/i.test(quelltext), 'Rundungsregel "ab 5" statt Nachbarzahlen und Mitte');
  assert.match(quelltext, /Round 347 to the nearest hundred\. How do you decide\?","Find the halfway point 350/);
  assert.match(quelltext, /You made 905 as 500 \+ 400 \+ 5\. Which is ANOTHER correct way\?","600 \+ 300 \+ 5"/);
});

// EP01: exercise the actual card/pool/render/score path across the revised
// collections. The finite Node oracles independently establish their answers.
test('EP01 remaining content: real subject cards, help and complete 8/8 rounds',async()=>{
  const {ctx,page,fehler}=await app();
  try{
    const cards=await alleKarten(page);
    for(const world of['numbers','examples','units','combos','anleitung','wordprob']){
      const card=cards.find(k=>k.item===world);assert.ok(card,world+': actual visible quest card');
      await karteOeffnen(page,card);
      for(let i=0;i<8;i++){
        const s=await zustand(page),q=s.round[s.idx];assert.equal(s.idx,i);
        if(i===0){
          await klick(page,'#helpBtn');
          assert.ok(await sichtbar(page,'#feedback'),world+': real help appears');
          if(await sichtbar(page,'#helpBtn')&&/example|Beispiel/.test(await page.textContent('#helpBtn')))await klick(page,'#helpBtn');
        }
        await frageBeantworten(page,q);
        assert.ok(await page.evaluate(()=>document.querySelector('#feedback').classList.contains('good')),world+': correct selected answer is scored');
        await klick(page,'#nextBtn');
      }
      assert.ok(await sichtbar(page,'#results'));assert.equal(await page.textContent('#resScore'),'8');
      await klick(page,'#homeBtn');
    }
    assert.deepEqual(fehler,[]);
  }finally{await ctx.close();}
});
