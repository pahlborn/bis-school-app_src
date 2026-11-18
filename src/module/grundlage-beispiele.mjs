import { NEULAND_BEISPIELE } from './neuland-grundlage.mjs';
// EV-3.3: another worked case for each foundation family. No screen or storage.
// Text entries follow the eight families in GRUNDLAGE; maths reuses the SAME family generator
// and its classroom model. Explicit null entries are the approved EV33-CC-M1 exceptions:
// their fixed answers would solve the child's question. The existing tip/answer path remains.
export const GRUNDLAGE_BEISPIELE = {
  forces: [
    ['You press a shopping cart away from you. Push or pull?', 'Push', 'Your hands move the cart away from you. Moving something away is a push.'],
    ['You bring a sled closer using its rope. Push or pull?', 'Pull', 'Follow the movement: the sled comes towards you. Bringing something closer is a pull.'],
    ['A brick feels bumpy and a window feels flat. Which is rough?', 'The brick', 'Compare how they feel. Bumps make the brick rough; the flat window is smooth.'],
    ['A toy car rolls on a smooth tray and on a thick towel. Where does it roll farther?', 'On the smooth tray', 'The towel rubs more against the wheels. The smooth tray rubs less, so the car rolls farther.'],
    ['A sled slows as it slides over snow. What rubs against it?', 'The snow', 'The sled touches the snow. Rubbing between the snow and the sled is friction, which slows the sled.'],
    ['A ball rolls 30 cm on a mat and 70 cm on tiles. Where does it roll farther?', 'On tiles', 'Compare the distances: 70 is more than 30. The longer distance is 70 cm on tiles.'],
    ['You test whether a ball rolls farther on a mat or on tiles. What do you change?', 'Only the surface', 'Use the same ball and the same starting point. Change just the surface, so you can tell what made the difference.'],
    ['You let go of an apple above the grass. Which way does gravity pull it?', 'Down towards the grass', 'The apple falls towards the ground. Gravity pulls it down, so it lands on the grass.']
  ],
  sentences: [
    ['Fix the first letter: “a bird can sing.”', 'A bird can sing.', 'Find the first letter, a. A sentence starts with a capital, so change a to A.'],
    ['Which word needs a capital: “We visit berlin.”?', 'Berlin', 'Berlin names a city. Names start with a capital letter, so write Berlin.'],
    null, // sentences/2: every question-mark example would directly supply the child's fixed answer “?”.
    null, // sentences/3: every telling-sentence example would directly supply the child's fixed answer “.”.
    ['Fix the ending: “Birds have feathers”', 'Birds have feathers.', 'This tells something. Add a full stop after the last word to close the sentence.'],
    ['Fix the day: “We swim on monday.”', 'We swim on Monday.', 'Find the day, monday. Days are names, so give Monday a capital M.'],
    ['Fix the place: “The train goes to rome.”', 'The train goes to Rome.', 'Rome names a city. Change its first letter to a capital: Rome.'],
    ['Fix this sentence: “My brother and i read.”', 'My brother and I read.', 'Find the word for yourself, i. It is always written I, even in the middle of a sentence.']
  ],
  words: [
    ['Find the base word in “unkind”.', 'kind', 'Split the word: un + kind. Cover the prefix un-. The base word left is kind.'],
    ['Find the base word in “playful”.', 'play', 'Split the word: play + ful. Cover the suffix -ful. The base word left is play.'],
    ['Find the prefix in “dislike”.', 'dis', 'Split it into dis + like. The added part at the front is the prefix dis-.'],
    ['Find the suffix in “careless”.', 'less', 'Split it into care + less. The added part at the end is the suffix -less.'],
    ['One dog, two …', 'dogs', 'There is more than one dog. Add -s to dog: dogs.'],
    ['Put un- before “tie”. What word do you make?', 'untie', 'Write the prefix first, then the base word: un + tie = untie.'],
    ['Which has a prefix: “reread” or “reader”?', 'reread', 'Split the words: re + read and read + er. Only reread adds a part at the front: the prefix re-.'],
    ['Which word means “not fair”: “unfair” or “fairer”?', 'unfair', 'The prefix un- means not. Split un + fair: unfair means not fair.']
  ],
  anleitung: [
    ['Du beginnst eine Anleitung zum Falten. Wie beginnt der erste Schritt?', 'Als Erstes faltet man das Papier.', 'Der erste Schritt steht am Anfang. „Als Erstes“ zeigt diesen Anfang. Danach beschreibst du, was man tut.'],
    ['Schreibe „Ich rühre die Farbe.“ in der Man-Form.', 'Man rührt die Farbe.', 'Ersetze „Ich“ durch „Man“. Passe das Verb an: ich rühre → man rührt.'],
    null, // anleitung/2: der nächste Satzanfang wäre wieder die feste eigene Antwort „Als Nächstes“.
    ['Zerlege „zumachen“. Welche Vorsilbe findest du?', 'zu', 'Trenne zu + machen. Vor dem Verb „machen“ steht die Vorsilbe „zu“.'],
    null, // anleitung/4: die Stellung der getrennten Vorsilbe wäre wieder die eigene Antwort „am Satzende“.
    ['Eine Anleitung erklärt das Händewaschen. Was gehört hinein?', 'Die Schritte vom Nassmachen bis zum Abtrocknen', 'Überlege, was man nachmachen soll. Beschreibe die nötigen Handlungen der Reihe nach: nass machen, einseifen, abspülen, abtrocknen.'],
    ['Setze zusammen: „Haus“ + „Tür“. Schreibe den Artikel dazu.', 'die Haustür', 'Schreibe Haus + Tür zusammen: Haustür. Das letzte Wort gibt den Artikel vor: die Tür → die Haustür.'],
    ['Du willst ein Blatt ausschneiden. Was tust du zuerst?', 'Papier und Schere bereitlegen', 'Prüfe, was du für den nächsten Schritt brauchst. Erst legst du Papier und Schere bereit, dann kannst du schneiden.']
  ],
  library: [
    ['A book stands on a shelf. Where do you look for its call number label?', 'On its spine', 'The spine faces out when a book stands on the shelf. Look there for the call number label, then use it to locate the book.'],
    null, // library/1: changing the video topic still supplies the child's fixed source answer “BrainPop”.
    ['Which can you research: “How many legs does an ant have?” or “Are ants the nicest insects?”', 'How many legs does an ant have?', 'You can check the number of legs in a factual book. “Nicest” depends on an opinion, so choose the question with a checkable answer.'],
    ['You need checked facts about planets. An encyclopedia or a space adventure comic?', 'An encyclopedia', 'Choose by purpose: an encyclopedia explains checked facts. An adventure comic tells a story, so use the encyclopedia for your facts.'],
    null, // library/4: changing the search topic still supplies the child's fixed source answer “Kiddle”.
    ['Your poster uses a fact from a book about space. What source note helps someone check it?', 'The book title and page', 'A reader needs to find the same fact. Write down the book title and the page where you found it.'],
    ['A shelf has call numbers 120, 140 and 160. Where does a book labeled 130 go?', 'Between 120 and 140', 'Read the call number on the spine. 130 comes after 120 and before 140, so place it between those books.'],
    ['You want to research melting ice. What do you write before searching?', 'A question, such as “What makes ice melt?”', 'Choose what you want to find out. Write that question, then use it to guide your search for facts.']
  ]
};

const foundationAnswer = q => q.kind === 'mc' ? String(q.options[q.answer]).replace(/<[^>]+>/g, '') : String(q.answer);
const foundationStimulus = q => String(q.prompt) + '|' + (q.visual || '');

// Enumerate alternative stimuli independently of the app's random source.
// The first draw changes with the case; subsequent draws move seven places along each finite range.
// N2: answer-option mixing in the existing mc()/shuffle() still consumes app random values.
export function foundationDraw(seed) {
  let cursor = 0;
  return n => (seed + 7 * cursor++) % n;
}

export function foundationShuffle(items, draw) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = draw(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** Separate task; build(family, {draw, variant}) reuses its quest's model and exact learning step. */
export function foundationExample(q, build) {
  if (q.level !== 1 || !Number.isInteger(q.foundationFamily)) return null;
  // units/3, longer: all available cm lengths are below 1 m, so every matching example
  // would directly supply the same fixed answer. Shorter/cm cases retain other results.
  if (q.world === 'units' && q.foundationFamily === 3 && foundationAnswer(q) === '1 m') return null;
  const row = GRUNDLAGE_BEISPIELE[q.world]?.[q.foundationFamily] || NEULAND_BEISPIELE[q.world]?.[q.foundationFamily];
  if (row) return { kind: 'type', level: 1, world: q.world, foundationFamily: q.foundationFamily, prompt: row[0], answer: row[1], explain: row[2] };
  if (!build) return null;
  let fallback = null;
  for (let i = 0; i < 24; i++) {
    const ex = build(q.foundationFamily, { draw: foundationDraw(i), variant: q.foundationVariant || {} });
    if (ex.level !== 1 || ex.world !== q.world || ex.foundationFamily !== q.foundationFamily || foundationStimulus(ex) === foundationStimulus(q)) continue;
    if (foundationAnswer(ex) !== foundationAnswer(q)) return ex;
    // A different categorical case may have the same answer (odd/even, cm/m, etc.).
    // Numeric tasks always use another result; do not print the child's numeric solution.
    if (!/^\d+(?: cm)?$/.test(foundationAnswer(q))) fallback = ex;
  }
  return fallback;
}
