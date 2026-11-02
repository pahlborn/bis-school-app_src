// Module witze - jokes after a round, in the morning greeting and behind the advent doors (A3, Peter 02.11.).
// No screen, no storage: tested in Node (tests/module/witze.test.mjs). Inserted into the app by werkzeug/module.mjs.
//
// Peter, 02.11.: one joke per round (pressing "Joke" again shows the same one); children get English jokes -
// German ones only after a round in the Deutsch subject (the same rule as for the Pisolala stories).
// No joke comes back before all jokes of that language were shown once.
//
// A joke: id (unique, never reused), q (question), a (answer), lang 'en' | 'de', theme (optional:
// 'halloween' | 'advent' | 'christmas' - only shown in that time).

export const JOKE_LIST=[
  {id:'maths-book', lang:'en', q:'Why did the maths book look sad?', a:'It had too many problems.'},
  {id:'dino-snore', lang:'en', q:'What do you call a sleeping dinosaur?', a:'A dino-snore!'},
  {id:'two-tired', lang:'en', q:'Why can’t a bicycle stand up by itself?', a:'Because it is two-tired.'},
  {id:'clock-hands', lang:'en', q:'What has hands but cannot clap?', a:'A clock.'},
  {id:'fish-schools', lang:'en', q:'Why are fish so clever?', a:'Because they live in schools.'},
  {id:'wall-corner', lang:'en', q:'What did one wall say to the other wall?', a:'I’ll meet you at the corner!'},
  {id:'octopus', lang:'en', q:'How do you make an octopus laugh?', a:'With ten-tickles!'},
  {id:'ocean-waved', lang:'en', q:'What did the ocean say to the beach?', a:'Nothing, it just waved.'},
  {id:'cookie-crummy', lang:'en', q:'Why did the cookie go to the doctor?', a:'Because it felt crummy.'},
  {id:'gummy-bear', lang:'en', q:'What do you call a bear with no teeth?', a:'A gummy bear!'},
  {id:'ghost-food', lang:'en', theme:'halloween', q:'What is a ghost’s favourite food?', a:'Spook-hetti!'},
  {id:'sand-witch', lang:'en', theme:'halloween', q:'What do you call a witch at the beach?', a:'A sand-witch!'},
  {id:'living-room', lang:'en', theme:'halloween', q:'What room does a ghost not need?', a:'A living room.'},
  {id:'snowflakes', lang:'en', theme:'advent', q:'What do snowmen eat for breakfast?', a:'Snowflakes!'},
  {id:'elf-abet', lang:'en', theme:'advent', q:'What do elves learn at school?', a:'The elf-abet.'},
  {id:'snowman-carrots', lang:'en', theme:'advent', q:'Why was the snowman looking through the carrots?', a:'He was picking his nose!'},
  {id:'no-eye-deer', lang:'en', theme:'christmas', q:'What do you call a reindeer with no eyes?', a:'No idea! (No-eye-deer)'},
  {id:'de-klopfsalat', lang:'de', q:'Was ist grün und klopft an die Tür?', a:'Ein Klopfsalat!'},
  {id:'de-pirat', lang:'de', q:'Was macht ein Pirat am Computer?', a:'Er drückt die Enter-Taste.'},
  {id:'de-geister', lang:'de', q:'Warum können Geister so schlecht lügen?', a:'Weil man durch sie hindurchsieht.'},
  {id:'de-null-acht', lang:'de', q:'Was sagt die Null zur Acht?', a:'Schicker Gürtel!'},
  {id:'de-spukhetti', lang:'de', theme:'halloween', q:'Was essen Gespenster am liebsten?', a:'Spukhetti!'},
  {id:'de-pfuetze', lang:'de', theme:'advent', q:'Wie nennt man einen Schneemann im Sommer?', a:'Eine Pfütze.'},
  {id:'de-schneehase', lang:'de', theme:'christmas', q:'Was ist weiß und hüpft durch den Wald?', a:'Ein Schneehase.'}
];

/** All jokes that may be shown now: the language, no theme or the current theme. */
export function jokesFor(lang, theme){
  return JOKE_LIST.filter(j=>j.lang===lang && (!j.theme || j.theme===theme));
}

/** The next joke. seen: ids already shown (any language). In a theme time a theme joke comes first while
    there is an unseen one. Once every joke of this moment was shown, it starts again (but not with the
    last one). rnd(n) gives 0..n-1. Returns {joke, seen} - the caller stores seen. */
export function jokeNext(lang, theme, seen, rnd){
  const pool=jokesFor(lang, theme), had=Array.isArray(seen)?seen:[];
  if(!pool.length) return {joke:null, seen:had};
  let open=pool.filter(j=>!had.includes(j.id)), next=had;
  if(!open.length){
    const last=had[had.length-1];
    next=had.filter(id=>!pool.some(j=>j.id===id));            // forget only this moment's jokes
    open=pool.length>1 ? pool.filter(j=>j.id!==last) : pool;
  }
  const themed=theme ? open.filter(j=>j.theme===theme) : [];
  const from=themed.length ? themed : open;
  const joke=from[rnd(from.length)];
  return {joke, seen:next.concat(joke.id)};
}

/** Advent door n (1-24): always the same joke behind the same door (English). */
export function jokeForDoor(n){
  const pool=jokesFor('en','advent'), themed=pool.filter(j=>j.theme==='advent'), list=themed.concat(pool.filter(j=>!j.theme));
  return list[(n*7)%list.length];
}
