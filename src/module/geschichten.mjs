// Module geschichten - which Pisolala story comes next (A5, Peter 02.11.).
// No screen, no storage: tested in Node (tests/module/geschichten.test.mjs). Inserted into the app by werkzeug/module.mjs.
//
// Peter, 02.11.: every time a new story, fitting special days (Halloween, Advent, Christmas, birthday).
// The app cannot invent stories (no server; every story needs Peter's approval) - so the stock grows in
// approved batches, and this module picks from it:
//   1. on the child's birthday an unread birthday story, in a theme time an unread story of that theme;
//   2. otherwise the next unread story without an occasion (in list order - stories can be a series);
//   3. when all were read: the one read longest ago (occasion stories only in their time).
//   An occasion story outside its time comes only if there is no other story at all.
// One story per round, like the jokes (the app keeps the round key).
//
// Pisolala: a family character. Never shown, never described – only what happens around Pisolala.
// New stories go in only after a grown-up approved them (approved:true). Excitement: 1 cozy, 2 a bit exciting, 3 adventurous.
// Language (Peter, 30.10.): English; German only in the Deutsch subject. Each story has en and de.
// occasion: 'halloween' | 'advent' | 'christmas' | 'birthday' (optional).

export const STORY_LIST=[
  {id:'halloween-2026', occasion:'halloween', approved:true /* freigegeben von Peter am 30.10.2026 (de); en = wortgetreue Übersetzung */,
   title:{en:'Pisolala and the Giggling Pumpkins', de:'Pisolala und die kichernden Kürbisse'},
   en:{
    1:'On Halloween night a warm little wind blew through the garden. It smelled of cocoa and cinnamon – that is how it always smells when Pisolala is near. Nobody can see Pisolala. But if you listen carefully, you can hear a soft giggle between the leaves.\n\nNofretete was already waiting in her pumpkin costume, and Hoppel, the cuddly bunny, carried a tiny lantern.\n\n“Trick or joke?” the wind whispered at the first door. The neighbour laughed: “A joke, please!” Then something rustled: “What is a ghost’s favourite food? Spook-ghetti!”\n\nLittle pumpkins stood by the fence. Nofretete counted: “… 36, 37, 38!” The wind hummed: “About 40!” Because 38 is closer to 40 than to 30.\n\nAt home there was cocoa. Nofretete fell asleep with Hoppel in her arms, and outside a soft wind song was humming. “Good night, Pisolala.” And somewhere something giggled: “Good night.”',
    2:'On Halloween night a warm little wind blew through the garden. It smelled of cocoa and cinnamon – that is how it always smells when Pisolala is near. Nobody can see Pisolala. But if you listen carefully, you can hear a soft giggle between the leaves.\n\nNofretete was waiting in her pumpkin costume, and Hoppel carried a tiny lantern. “Trick or joke?” the wind whispered at the first door. “What is a ghost’s favourite food? Spook-ghetti!” The neighbour laughed out loud.\n\nThen the path grew dark. Something creaked behind the fence. A long shadow slipped across the stones. Nofretete stopped. “I’m a little bit scared.” Then it became very warm beside her. “Take a deep breath,” something whispered, “and imagine the little lantern in your heart.”\n\nNofretete breathed in and out. Hoppel’s lantern shone brighter – and the shadow was … a cat with a pumpkin hat! It meowed and ran away. Everyone had to laugh.\n\nAt home there was cocoa. “Good night, Pisolala.” And somewhere something giggled: “Good night.”'
   },
   de:{
    1:'Am Halloween-Abend wehte ein warmer, kleiner Wind durch den Garten. Er roch nach Kakao und Zimt – so riecht es immer, wenn Pisolala in der Nähe ist. Sehen kann Pisolala niemand. Aber wer genau hinhört, hört ein leises Kichern zwischen den Blättern.\n\nNofretete wartete schon in ihrem Kürbiskostüm, und Hoppel, der Kuschelhase, trug eine winzige Laterne.\n\n„Süßes oder Witz?“, flüsterte der Wind an der ersten Tür. Die Nachbarin lachte: „Einen Witz, bitte!“ Da raschelte es: „Was essen Gespenster am liebsten? Spukhetti!“\n\nAm Zaun standen kleine Kürbisse. Nofretete zählte: „… 36, 37, 38!“ Der Wind summte: „Ungefähr 40!“ Denn 38 liegt näher an 40 als an 30.\n\nZu Hause gab es Kakao. Nofretete schlief mit Hoppel im Arm ein, und draußen summte ein leises Windlied. „Gute Nacht, Pisolala.“ Und irgendwo kicherte es: „Gute Nacht.“',
    2:'Am Halloween-Abend wehte ein warmer, kleiner Wind durch den Garten. Er roch nach Kakao und Zimt – so riecht es immer, wenn Pisolala in der Nähe ist. Sehen kann Pisolala niemand. Aber wer genau hinhört, hört ein leises Kichern zwischen den Blättern.\n\nNofretete wartete in ihrem Kürbiskostüm, und Hoppel trug eine winzige Laterne. „Süßes oder Witz?“, flüsterte der Wind an der ersten Tür. „Was essen Gespenster am liebsten? Spukhetti!“ Die Nachbarin lachte laut.\n\nDann wurde der Weg dunkel. Hinter dem Zaun knarrte etwas. Ein langer Schatten huschte über die Steine. Nofretete blieb stehen. „Ich hab ein bisschen Angst.“ Da wurde es neben ihr ganz warm. „Atme tief ein“, flüsterte es, „und stell dir die kleine Laterne in deinem Herzen vor.“\n\nNofretete atmete ein und aus. Hoppels Laterne leuchtete heller – und der Schatten war … eine Katze mit einem Kürbishut! Sie miaute und lief davon. Alle mussten lachen.\n\nZu Hause gab es Kakao. „Gute Nacht, Pisolala.“ Und irgendwo kicherte es: „Gute Nacht.“'
   }}
];

/** Approved stories that can be told in this language within the excitement limit. */
export function storiesUsable(stories, lang, cap){
  return stories.filter(s=>s.approved && s[lang] && Object.keys(s[lang]).some(l=>+l<=cap));
}

/** The story for now. ctx: {lang, cap, theme (themeNow), birthday (true on the day), read (ids, oldest first)}.
    Returns a story or null. */
export function storyNext(stories, ctx){
  const read=Array.isArray(ctx.read)?ctx.read:[];
  const all=storiesUsable(stories, ctx.lang, ctx.cap);
  const now=s=>s.occasion==='birthday' ? !!ctx.birthday : s.occasion===ctx.theme;
  const unread=s=>!read.includes(s.id);
  if(ctx.birthday){ const b=all.find(s=>s.occasion==='birthday' && unread(s)); if(b) return b; }
  if(ctx.theme){ const t=all.find(s=>s.occasion===ctx.theme && unread(s)); if(t) return t; }
  const plain=all.find(s=>!s.occasion && unread(s)); if(plain) return plain;
  const allowed=all.filter(s=>!s.occasion || now(s));
  const pool=allowed.length ? allowed : all;                     // no other story at all: an occasion story is better than none
  if(!pool.length) return null;
  const rank=s=>{ const i=read.lastIndexOf(s.id); return i<0 ? -1 : i; };
  return pool.slice().sort((a,b)=>rank(a)-rank(b))[0];           // never read first, then the one read longest ago
}

/** Remember a story as read: it moves to the end (newest). */
export function storyMarkRead(read, id){
  return (Array.isArray(read)?read:[]).filter(x=>x!==id).concat(id);
}
