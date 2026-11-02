// Module witze - jokes after a round, in the morning greeting and behind the advent doors (A3, Peter 02.11.).
// No screen, no storage: tested in Node (tests/module/witze.test.mjs). Inserted into the app by werkzeug/module.mjs.
//
// Peter, 02.11.: one joke per round (pressing "Joke" again shows the same one); children get English jokes -
// German ones only after a round in the Deutsch subject (the same rule as for the Pisolala stories).
// No joke comes back before all jokes of that language were shown once.
//
// A joke: id (unique, never reused), q (question), a (answer), lang 'en' | 'de', theme (optional:
// 'halloween' | 'advent' | 'christmas' - only shown in that time).
// A4 (Peter, 02.11.): real jokes from English-speaking countries, shown with flag and country. from = country
// code, only if a children's source FROM that country published the joke (src = the page; spelling as there).
// note = a short explanation of a word a child learning English may not know (shown after the answer).
// Jokes without from are shared everywhere ("a joke from around the world"). Australia, New Zealand, Ireland and
// South Africa follow as soon as a source from there is found (02.11.: none could be checked).

export const JOKE_COUNTRY={GB:['🇬🇧','the UK'], US:['🇺🇸','the USA'], CA:['🇨🇦','Canada'], IN:['🇮🇳','India'], AU:['🇦🇺','Australia'], NZ:['🇳🇿','New Zealand'], IE:['🇮🇪','Ireland'], ZA:['🇿🇦','South Africa']};
/** Line above a joke: flag and country, or the globe. */
export const jokeOrigin = j => j && JOKE_COUNTRY[j.from] ? `${JOKE_COUNTRY[j.from][0]} A joke from ${JOKE_COUNTRY[j.from][1]}` : '🌍 A joke from around the world';

const BEANO='https://www.beano.com/kids-zone/jokes/animal-jokes', SCOUT='https://www.scoutlife.org/jokes', SNOW='https://jokes.scoutlife.org/topics/snow-jokes/',
  XMAS='https://boyslife.org/features/24222/25-days-of-funny-christmas-jokes/', CBC='https://www.cbc.ca/kids/articles/nine-chuckle-worthy-canada-day-jokes-eh', TINKLE='https://www.tinkle.in/10-riotous-jokes-for-the-rains/';

export const JOKE_LIST=[
  {id:'gb-bored-goat', lang:'en', from:'GB', src:BEANO, q:'What did the bored goat say?', a:'Mehhh!', note:'“Meh” means “not very exciting” – and it sounds like a goat.'},
  {id:'gb-just-kidding', lang:'en', from:'GB', src:BEANO, q:'What did the goat say when it pranked the cow?', a:'Just kidding!', note:'A baby goat is called a kid.'},
  {id:'gb-goat-charging', lang:'en', from:'GB', src:BEANO, q:'How do you stop a goat from charging?', a:'You unplug it!', note:'“Charging” means running at something – or filling a battery.'},
  {id:'gb-goat-talent', lang:'en', from:'GB', src:BEANO, q:'What’s a goat’s favourite TV show?', a:'Britain’s Goat Talent!', note:'“Britain’s Got Talent” is a TV show in the UK.'},
  {id:'gb-mewseum', lang:'en', from:'GB', src:BEANO, q:'Where do kittens go on school trips?', a:'The mewseum!', note:'Kittens say “mew”.'},
  {id:'gb-watchdog', lang:'en', from:'GB', src:BEANO, q:'What goes tick-tock woof-woof?', a:'A watchdog!', note:'A watchdog guards a house. A watch tells the time.'},
  {id:'gb-pup-eroni', lang:'en', from:'GB', src:BEANO, q:'What’s a dog’s favourite kind of pizza?', a:'Pup-eroni!', note:'A pup is a young dog.'},
  {id:'gb-dog-circles', lang:'en', from:'GB', src:BEANO, q:'Why do dogs run in circles?', a:'It’s too hard to run in squares!'},
  {id:'gb-count-on', lang:'en', from:'GB', src:BEANO, q:'What do you get if you cross a dog with a calculator?', a:'A best friend you can really count on!', note:'“Count on” someone means you can trust them.'},
  {id:'gb-dino-box', lang:'en', from:'GB', src:BEANO, q:'How many dinosaurs can you fit in an empty box?', a:'One – after that, the box isn’t empty!'},
  {id:'gb-dino-umbrella', lang:'en', from:'GB', src:BEANO, q:'When can three giant dinosaurs get under an umbrella and not get wet?', a:'When it’s not raining!'},
  {id:'gb-dr-moo', lang:'en', from:'GB', src:BEANO, q:'What’s a cow’s favourite sci-fi TV programme?', a:'Dr. Moo!', note:'“Doctor Who” is a space adventure show from the UK.'},
  {id:'us-you-who', lang:'en', from:'US', src:SCOUT, q:'Knock, knock. Who’s there? You. You, who?', a:'Why are you looking for me? I’m right in front of you.', note:'“Yoo-hoo!” is what you call to get someone’s attention.'},
  {id:'us-banana-split', lang:'en', from:'US', src:SCOUT, q:'Why couldn’t the monkey catch the banana?', a:'Because the banana split.', note:'“Split” can mean “ran away”. A banana split is an ice-cream dessert.'},
  {id:'us-squeaky', lang:'en', from:'US', src:SCOUT, q:'What do you call a mouse after a bath?', a:'Squeaky clean.', note:'“Squeaky clean” means very clean – and mice squeak.'},
  {id:'us-booked-up', lang:'en', from:'US', src:SCOUT, q:'Why didn’t the bookshelf go to the party?', a:'Because it was all booked up.', note:'“Booked up” means having no free time.'},
  {id:'us-24-carrots', lang:'en', from:'US', src:SCOUT, q:'Why did the bankers think the rabbit was rich?', a:'Because it said it had 24 carrots.', note:'“Carrots” sounds like “carats” – the word for very pure gold.'},
  {id:'us-finland', lang:'en', from:'US', src:SCOUT, q:'Where do fish go on vacation?', a:'Finland.', note:'Finland is a country. Fish swim with their fins.'},
  {id:'us-monkeys', lang:'en', from:'US', src:SCOUT, q:'What keys unlock a banana?', a:'Monkeys.'},
  {id:'us-twick-or-tweet', lang:'en', from:'US', src:SCOUT, theme:'halloween', q:'What do the birds say on Halloween night?', a:'“Twick-or-tweet!”', note:'Birds tweet. Children say “trick or treat”.'},
  {id:'us-boo-who', lang:'en', from:'US', src:SCOUT, theme:'halloween', q:'Knock, knock. Who’s there? Boo. Boo, who?', a:'Don’t be sad. It’s just a joke!', note:'“Boo-hoo” is the sound of crying.'},
  {id:'us-snow-use', lang:'en', from:'US', src:SNOW, theme:'advent', q:'Knock, knock. Who’s there? Snow. Snow, who?', a:'It’s snow use. This door will never open.', note:'“Snow use” sounds like “no use”.'},
  {id:'us-snow-fakes', lang:'en', from:'US', src:SNOW, theme:'advent', q:'What does an artificial snow machine make?', a:'Snow fakes!', note:'“Snow fakes” sounds like “snowflakes”.'},
  {id:'us-snowbank', lang:'en', from:'US', src:SNOW, theme:'advent', q:'Where do snowmen keep their money?', a:'The snowbank.', note:'A snowbank is a big pile of snow.'},
  {id:'us-jungle-bells', lang:'en', from:'US', src:XMAS, theme:'christmas', q:'What do tigers sing at Christmas?', a:'“Jungle Bells!”', note:'“Jingle Bells” is a Christmas song.'},
  {id:'us-cookie-sheet', lang:'en', from:'US', src:XMAS, theme:'christmas', q:'What did the gingerbread man put on his bed?', a:'A cookie sheet.', note:'A cookie sheet is a baking tray.'},
  {id:'ca-worm-ups', lang:'en', from:'CA', src:CBC, q:'How do blue jays stay fit?', a:'By doing worm-ups!', note:'A blue jay is a bird. Before sport you do warm-ups.'},
  {id:'ca-rockies', lang:'en', from:'CA', src:CBC, q:'What did the snow say to the Rocky Mountains?', a:'We’ve got you covered.', note:'The Rocky Mountains are big mountains in Canada and the USA.'},
  {id:'ca-sappy', lang:'en', from:'CA', src:CBC, q:'Why is maple syrup always so sad?', a:'Because it’s sappy.', note:'Maple syrup comes from the sap of maple trees. “Sappy” also means “very emotional”.'},
  {id:'ca-gnawing', lang:'en', from:'CA', src:CBC, q:'What did the beaver say to the maple tree?', a:'It’s been nice gnawing you.', note:'Beavers gnaw (chew) trees. It sounds like “nice knowing you”.'},
  {id:'ca-curlers', lang:'en', from:'CA', src:CBC, q:'Why shouldn’t curlers tell jokes on the ice?', a:'Because they’ll crack up.', note:'Curling is a sport on ice. “Crack up” means laugh a lot – ice can crack, too.'},
  {id:'ca-cn-tower', lang:'en', from:'CA', src:CBC, q:'What can jump higher than the CN Tower?', a:'Nothing. The CN Tower can’t jump.', note:'The CN Tower is a very tall tower in Toronto.'},
  {id:'ca-boo-tine', lang:'en', from:'CA', src:CBC, theme:'halloween', q:'What’s a Canadian ghost’s favourite food?', a:'Boo-tine!', note:'Poutine is a Canadian dish: fries with cheese and gravy.'},
  {id:'in-cloud', lang:'en', from:'IN', src:TINKLE, q:'What did one raindrop say to the other?', a:'Two’s company, but three is a cloud!', note:'The saying goes: “Two’s company, three’s a crowd.”'},
  {id:'in-bagels', lang:'en', from:'IN', src:TINKLE, q:'Why do seagulls fly over the sea?', a:'Because if they flew over the bay, they’d be called bagels.', note:'A bay is a part of the sea. A bagel is a round bread roll.'},
  {id:'in-moo-dy', lang:'en', from:'IN', src:TINKLE, q:'How do cows feel when they’re stuck in the rain?', a:'Moo-dy.', note:'“Moody” means grumpy.'},
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
