// Module grundlage - foundation tasks (level 1) for the text quests with a main standard (Auftrag 1, Peter 03.11.):
// Forces & Friction (S-F1), Capital Letters & Full Stops (E-W1), Word Building (E-R1), Anleitung schreiben (D-W1),
// Library & Research (E-W2). Maths quests build their foundation tasks in the app (pictures and number models).
// Data only. No screen, no storage: tested in Node (tests/module/grundlage.test.mjs). Inserted into the app by
// werkzeug/module.mjs; the app turns the entries into questions (baseQ).
//
// Foundation = ONE step, the wrong answers are clearly wrong (like level 1 in module textfragen), and the right answer
// is not the longest or the shortest by default (the module test measures it). Every entry has its own tip
// ("Show me how"); a task at the foundation level gets no easier example (nothing is easier).
//
// An entry: [prompt, right answer, wrong answers, explanation, level (always 1), tip, picture text (optional)].

export const GRUNDLAGE = {
  forces: [
    ["Which one is a <b>push</b>?", "Kicking a ball", ["Opening a drawer", "Lifting a cup up"], "Your foot moves the ball away from you. Moving something away is a push.", 1, "A push moves something away from you. A pull brings it closer to you."],
    ["Which one is a <b>pull</b>?", "Opening a door towards you", ["Throwing a ball far away from you", "Kicking a stone"], "You bring the door closer to you. That is a pull.", 1, "A pull brings something closer to you. A push moves it away."],
    ["Which surface is <b>rough</b>?", "Sandpaper", ["Glass", "A shiny mirror"], "Sandpaper feels bumpy. Glass and a mirror are smooth.", 1, "Think of touching it. Rough things feel bumpy, smooth things feel flat."],
    ["On which floor does a toy car roll <b>farther</b>?", "Smooth tiles", ["Thick carpet", "Soft sand"], "Smooth tiles rub less, so the car keeps rolling.", 1, "Smooth surfaces rub less. Less rubbing means the car rolls farther."],
    ["What slows a rolling ball down?", "Friction with the ground", ["A song on the radio", "The colour of the ball"], "The ground rubs against the ball. That rubbing is friction, and it slows the ball down.", 1, "Something has to rub against the ball. What touches it while it rolls?"],
    ["A car rolled <b>20 cm</b> on carpet and <b>80 cm</b> on wood. Where did it roll farther?", "On wood", ["On carpet", "Both the same"], "80 cm is more than 20 cm, so the car rolled farther on wood.", 1, "Compare the two numbers. The bigger number is the longer distance."],
    ["In a fair test you change…", "only one thing", ["everything at once", "nothing at all, ever"], "Change one thing. Then you know what made the difference.", 1, "Fair means: everything stays the same, except the one thing you test."],
    ["Gravity pulls things…", "down to the ground", ["up into the sky", "to the left side"], "Gravity pulls everything down. That is why a dropped ball falls.", 1, "Think of dropping a ball. Which way does it go?"]
  ],
  sentences: [
    ["Which sentence starts with a <b>capital letter</b>?", "The dog is big.", ["the dog is big.", "the Dog is big."], "A sentence always starts with a capital letter: The.", 1, "Look only at the very first letter of each sentence."],
    ["Which word is a <b>name</b> and needs a capital letter?", "Lucas", ["apple", "chair"], "Lucas is the name of a person. Names always start with a capital letter.", 1, "Names of people, places and days always get a capital letter. Which word is a name?"],
    ["Which end mark does this sentence need?", "?", [".", "!"], "It asks something, so it ends with a question mark.", 1, "Read the sentence. Does it ask something, tell something, or show a strong feeling?", "Where is my bag ___"],
    ["Which end mark does this sentence need?", ".", ["?", "!"], "It tells something, so it ends with a full stop.", 1, "Read the sentence. Does it ask something, tell something, or show a strong feeling?", "I have a red bike ___"],
    ["Which sentence ends correctly?", "We like ice cream.", ["We like ice cream", "We like ice cream,"], "A sentence that tells something ends with a full stop.", 1, "Look only at the very end of each sentence. Which mark closes a sentence?"],
    ["Which day of the week is written correctly?", "Friday", ["friday", "fRiday"], "Days of the week are names. They start with a capital letter: Friday.", 1, "Only the first letter of a day is a capital letter."],
    ["Which place is written correctly?", "London", ["london", "lONDON"], "London is the name of a city. Names start with a capital letter.", 1, "Names of places start with ONE capital letter, the rest is small."],
    ["Which word is <b>always</b> a capital letter, even in the middle of a sentence?", "I", ["a", "the"], "When you write about yourself, “I” is always a capital letter.", 1, "Think of the word you use for yourself: “… like apples.”"]
  ],
  words: [
    ["What is the <b>base word</b> in <b>unhappy</b>?", "happy", ["unhap", "ppy"], "un + happy. The base word is happy.", 1, "Cover the part at the front (un). Which word is left?"],
    ["What is the <b>base word</b> in <b>helpful</b>?", "help", ["ful", "helpf"], "help + ful. The base word is help.", 1, "Cover the part at the end (ful). Which word is left?"],
    ["Which part of <b>redo</b> is the <b>prefix</b>?", "re", ["do", "edo"], "re + do. The prefix re- is at the front.", 1, "A prefix is the small part added at the FRONT of a word."],
    ["Which part of <b>kindness</b> is the <b>suffix</b>?", "ness", ["kind", "dness"], "kind + ness. The suffix -ness is at the end.", 1, "A suffix is the small part added at the END of a word."],
    ["One cat, two …", "cats", ["cat", "caties"], "For more than one cat, add -s: cats.", 1, "More than one? Most words just add -s at the end."],
    ["Add <b>un-</b> to the front of <b>lock</b>. What word do you get?", "unlock", ["lockun", "relock"], "un + lock = unlock.", 1, "Put the prefix first, then the word."],
    ["Which word has a <b>prefix</b> at the front?", "replay", ["player", "plays"], "re + play. The prefix re- is at the front. The other words have an ending.", 1, "Look at the start of each word. Was something added before “play”?"],
    ["Which word means <b>not happy</b>?", "unhappy", ["happier", "happily"], "un- means not. Unhappy = not happy.", 1, "Which small part at the front means “not”?"]
  ],
  anleitung: [
    ["Schritt 1 einer Anleitung. Welcher Satzanfang passt?", "Als Erstes", ["Zum Schluss", "Gestern"], "„Als Erstes“ zeigt: Hier beginnt die Anleitung.", 1, "Welcher Satzanfang sagt: Das ist der Anfang?"],
    ["Welcher Satz steht in der <b>Man-Form</b>?", "Man klebt das Papier.", ["Ich klebe das Papier.", "Klebst du das Papier?"], "In einer Anleitung schreibt man: Man klebt … Nicht ich oder du.", 1, "Suche den Satz, der mit „Man“ anfängt."],
    ["Was kommt nach <b>Als Erstes</b>?", "Als Nächstes", ["Zum Schluss", "Es war einmal"], "Als Erstes → Als Nächstes → Danach → Zum Schluss.", 1, "Sage die Reihe laut: Als Erstes, …"],
    ["Welches Verb hat eine <b>Vorsilbe</b>?", "aufmachen", ["schreiben", "malen"], "auf + machen. Die Vorsilbe „auf“ steht vorne.", 1, "Suche das Verb, vor dem noch ein kleines Wort steht: auf, an, aus …"],
    ["Wo steht die Vorsilbe <b>an</b> im Satz?", "am Satzende", ["am Anfang", "in der Mitte"], "Man schaltet das Licht an. Die Vorsilbe wandert ans Satzende.", 1, "Lies den Satz und schau, wo das kleine Wort „an“ steht.", "Man schaltet das Licht an."],
    ["Was braucht eine Anleitung?", "Schritte der Reihe nach", ["einen Bösewicht", "einen Drachen und einen Schatz"], "Eine Anleitung erklärt Schritt für Schritt, wie etwas geht.", 1, "Eine Anleitung ist keine Geschichte. Was braucht man, um etwas nachzumachen?"],
    ["Welches zusammengesetzte Wort entsteht? <b>Zahn</b> + <b>Bürste</b>", "die Zahnbürste", ["die Bürstezahn", "der Zahnbürste"], "Zahn + Bürste = Zahnbürste. Das letzte Wort bestimmt den Artikel: die Bürste.", 1, "Erst „Zahn“, dann „Bürste“. Der Artikel kommt vom letzten Wort."],
    ["Beim Zähneputzen: Was macht man <b>zuerst</b>?", "Zahnpasta auf die Bürste", ["den Mund mit Wasser ausspülen", "die Zahnbürste wegstellen"], "Zuerst kommt die Zahnpasta auf die Bürste, dann putzt man, dann spült man aus.", 1, "Stell dir vor, du putzt gerade Zähne. Was tust du ganz am Anfang?"]
  ],
  library: [
    ["Where is the <b>call number</b> on a library book?", "On the spine of the book", ["Inside the last page", "In the middle of every page"], "The call number sticks on the spine. You can read it when the book stands on the shelf.", 1, "Think of a book standing on a shelf. Which part can you see?"],
    ["You want to <b>watch</b> a short video about volcanoes. Which source?", "BrainPop", ["A map", "A dictionary"], "BrainPop has short videos that explain things.", 1, "Which source shows videos?"],
    ["Which question can you <b>look up</b> in a book?", "How tall is a giraffe?", ["Do you like giraffes?", "Is my pet the best pet ever?"], "You can find facts about giraffes. “Like” and “best” are opinions – no book knows them.", 1, "A book has facts. Which question has ONE answer that you can check?"],
    ["Where do you find <b>checked facts</b> about animals?", "In an encyclopedia", ["In a joke book", "In a comic about superheroes"], "An encyclopedia like Britannica has checked facts.", 1, "Which book is made to explain true facts?"],
    ["Which website helps kids <b>search the internet safely</b>?", "Kiddle", ["BrainPop", "A map"], "Kiddle is a search website made for kids.", 1, "Which one is a search website, not a video or a map?"],
    ["You used a fact from a book in your work. What do you write down too?", "Where you found the fact", ["Your favourite colour", "The date of your birthday"], "Say where you found it. Then others can check the fact.", 1, "Others want to check your fact. What do they need to know?"],
    ["Books on a library shelf are in order by…", "their call numbers", ["the colour of the cover", "how heavy they are"], "The call number is the book’s address on the shelf.", 1, "Every book has a little label on its spine. What is written on it?"],
    ["What do you do <b>first</b> when you research?", "Write down your question", ["Copy a whole page from the web", "Close all the books"], "First know what you want to find out. Then look it up.", 1, "Before you look anything up, what must you know?"]
  ]
};
