// Module textfragen - the text questions of Specific Examples (A7) and Opinion Writing (A8), Peter 02.11.
// Data only. No screen, no storage: tested in Node (tests/module/textfragen.test.mjs). Inserted into the app by
// werkzeug/module.mjs; the app turns the entries into questions (bankMC, specificExampleQ).
//
// Finding from the practice test (02.11.): the right answer was nearly always the longest and most exact one,
// the wrong ones short and silly - a child could pick the right answer without reading. So now:
//  - every answer of a question is about the same length (the module test measures it);
//  - wrong answers are almost right: no reason, a reason that goes in a circle, cannot be measured,
//    the reversed prediction, a fact that sounds like an opinion;
//  - every entry has a level (school key, used only to choose questions, never shown to the child):
//    1 = support: the wrong answers are clearly wrong,
//    2 = year level: the wrong answers are almost right,
//    3 = extending: "what is missing?" or two good answers - pick the better one.
//
// A bank question: [prompt, right answer, wrong answers, explanation, level].

/** Hypotheses and predictions (quest Specific Examples). */
export const HYPO=[
 // level 1 - the wrong answers cannot be tested or say nothing
 ["Which prediction could you actually test?","The car will roll farther on wood than on carpet.",["The car will feel happy on the shiny wooden floor.","Carpet is my favourite thing to play on at home.","The red ramp looks prettier than the blue ramp."],"You can test this one: roll the car and measure. ‘Happy’, ‘favourite’ and ‘prettier’ cannot be measured.",1],
 ["Which prediction could you actually test?","Ice will melt faster in the sun than in the shade.",["Ice cubes are the most beautiful shape of water.","The sun will feel proud when the ice melts away.","Shade is a nicer place to sit than a hot window."],"Put one ice cube in the sun and one in the shade, then watch. The others are feelings – you cannot measure them.",1],
 ["Your hypothesis says ‘The car will go far.’ How can you make it better?","Say on which surface it goes farther and why",["Write it again in big, bold capital letters","Add a colourful drawing of the car next to it","Make it shorter so it is quicker to read"],"Add the surface and the reason. Then it is a real guess you can test.",1],
 ["Which hypothesis is the most <b>specific</b>?","On sandpaper the car will stop sooner than on tiles, because sandpaper is rough.",["Something really interesting will happen when we let the car go down the ramp.","I think the car will be very, very fast, because it is a shiny new red race car.","The car will roll down the ramp and then, after a little while, it will stop again."],"A good guess says what will happen, on which surface, and why.",1],
 // level 2 - almost right: no reason, cannot be measured, reversed
 ["Which hypothesis is the most <b>specific</b>?","The car will roll a shorter distance on carpet than on wood, because carpet has more friction.",["The car will roll a different distance on carpet than on wood, because carpet is not the same.","The car will roll a shorter distance on carpet than on wood, and that will be very interesting.","The car will roll a longer distance on carpet than on wood, because carpet has more friction."],"The best one says what will happen (shorter), where (carpet and wood) and why (more friction). Careful: more friction makes the car stop sooner, not later.",2],
 ["Which prediction could you actually test?","A heavier car will roll farther off the ramp than a lighter car.",["A heavier car will enjoy the ramp a lot more than a lighter car.","A heavier car is a much better car to own than a lighter car.","A heavier car will look a lot cooler on the ramp than a light one."],"You can measure how far each car rolls with a metre stick. ‘Enjoy’, ‘better’ and ‘cooler’ cannot be measured.",2],
 ["Which hypothesis is the most <b>specific</b>?","If we make the ramp steeper, the car will roll farther, because gravity pulls it faster.",["If we make the ramp steeper, the car will roll differently, because the ramp has changed.","If we make the ramp steeper, the car will roll less far, because gravity pulls it faster.","If we make the ramp steeper, the car will roll farther, and we will all be very excited."],"It says what changes (steeper), what will happen (farther) and why (gravity pulls it faster). ‘Differently’ does not say how, and ‘excited’ is not a reason.",2],
 ["Your hypothesis says ‘The plant will grow.’ How can you make it better?","Say what you compare and what you measure",["Say that it grows, because plants can grow","Say that the plant will grow a lot, very fast","Say what you really hope will happen to it"],"Compare two plants (for example by the window and in a dark cupboard) and measure how tall they get.",2],
 // level 3 - what is missing, or several good answers: pick the best one
 ["What is missing in this hypothesis? <b>‘The car will roll a shorter distance on carpet than on wood.’</b>","A reason why it will happen",["What will happen to the car","Which surfaces you compare","What you are going to measure"],"It already says what happens (shorter), on which surfaces (carpet and wood) and what you measure (the distance). The ‘because …’ part is missing: carpet has more friction.",3],
 ["What is missing in this hypothesis? <b>‘If we use a steeper ramp, something will happen to the car, because gravity pulls harder.’</b>","What exactly will happen",["What we change in the test","Which thing rolls down","A reason why it happens"],"It says what you change (a steeper ramp) and why (gravity). But ‘something will happen’ is not a prediction. Say what: the car will roll farther.",3],
 ["What is missing in this hypothesis? <b>‘The car will roll farther, because the surface is smooth.’</b>","Which surfaces you compare",["What will happen to the car","A reason why it will happen","What you are going to measure"],"Farther than what? Name both surfaces, for example: farther on tiles than on carpet.",3],
 ["Which hypothesis is the most <b>specific</b>?","On carpet the car will roll a shorter distance than on wood, because carpet has more friction.",["On carpet the car will roll a shorter distance, because carpet has lots more friction than wood.","On carpet the car will roll a different distance than on wood, because carpet has more friction.","On carpet the car will roll a shorter distance than on wood, because carpet is a kind of floor."],"All four sound good. The best one says what happens (shorter), compares two surfaces (carpet and wood) and gives the real reason (friction).",3]
];

/** Specific Examples: [reason, specific example, vague example, level]. Both examples are about the same length -
 *  the specific one is NOT the longer one by default. Level 1: the vague one says nothing; 2: it sounds full but
 *  has no who, when or where; 3: both sound personal - the better one tells one real moment. */
export const SPECIFIC=[
 ["The park is a place for play.","Last Sunday I climbed the big oak tree in the park with my brother.","Lots of people do lots of fun things there on many different days.",1],
 ["Dogs are loyal.","My dog Bruno waits by the door every day at four o’clock until I come home.","Dogs are animals that lots of people like, and they like people too.",1],
 ["Reading before bed is calming.","When I read my dinosaur book, I feel sleepy after ten minutes.","Reading is a nice thing to do, and lots of people like to read books.",1],
 ["The park is good for nature.","On Tuesday I saw a woodpecker and two squirrels near the pond.","Lots of birds and animals live in many parts of the park.",2],
 ["The park is good for exercise.","Every Saturday morning my dad and I run three laps around the park.","Some people go running or play football there when the weather is nice.",2],
 ["Experiments help us learn.","In our ramp test the car went 120 cm on wood but only 40 cm on carpet.","When we do experiments in class, we find out lots of new things.",2],
 ["The park brings people together.","At the summer picnic my family met our new neighbours by the slide.","In summer, some families have picnics in the park and meet new people there.",3],
 ["Swimming keeps you safe.","Last summer my cousin swam back to the boat when he fell into the lake.","Children who swim well can get back to the side if they fall in.",3],
 ["Recess helps us focus.","After a long recess on Friday, I finished my maths sheet before lunch.","After a long recess, lots of children in my class can finish their work faster.",3]
];
/** Explanation for the Specific Examples question, by level. */
export const SPECIFIC_EXPLAIN={
  1:"A good example says who, when and where. Then the reader can see it in their head.",
  2:"Both sound full, but only one says who, when and where. That is the specific one.",
  3:"Both sound good. The better one tells ONE real moment: who, when and where. The other one is true in general – that is more like a reason."
};

/* ---------- A8: Opinion Writing ---------- */

/** Opinion questions (quest Opinion Writing). Almost-right wrong answers: an opinion without a reason, a reason
 *  that goes in a circle ("… because it is the best"), a fact that sounds like an opinion. */
export const OPINION_MC=[
 // level 1 - the wrong answers are plain facts or have nothing to do with it
 ["Which sentence states a <b>clear opinion</b> about the park?","I strongly believe our park must stay open.",["The park opens at eight o’clock every day.","There are six wooden benches by the pond.","The park has a big pond, a slide and swings."],"An opinion says what someone thinks. The others are facts – you can check them.",1],
 ["Which sentence <b>restates</b> the opinion at the end?","That is why the council must keep our park open!",["For example, I saw a woodpecker by the pond.","One reason is that children can play there.","The park opened a long time ago, in 1950."],"The last O says the opinion again, with power: ‘That is why …’.",1],
 ["Which reason supports ‘the park is good for exercise’?","People can run, climb and play football there.",["The council meets in the town hall on Mondays.","I got a pair of new red shoes for my birthday.","The grass is green and the sky above is blue."],"A reason says WHY. Running, climbing and football are exercise.",1],
 ["Which sentence is an opinion with a reason?","Dogs are the best pets because they are loyal.",["Dogs have four legs, a tail and a wet nose.","My dog is called Bruno and he is three.","Dogs often bark when someone knocks at the door."],"Opinion + because + reason. That persuades!",1],
 // level 2 - almost right: no reason, a reason in a circle, a fact
 ["Which sentence is an opinion with a reason?","Cats are great pets because they keep themselves clean.",["Cats are great pets because they are the best pets.","Cats are great pets, and I really, really love them.","Most cats sleep for more than twelve hours a day."],"‘Because they are the best pets’ just says the opinion again – that is not a reason. ‘I love them’ has no because. The last one is a fact.",2],
 ["Which sentence states a <b>clear opinion</b> about school lunch?","School lunch should have more fresh fruit.",["School lunch is served at twelve o’clock.","Some children have school lunch every day.","School lunch might be nice, or it might not."],"‘Should’ shows a clear opinion. ‘Might be nice, or might not’ does not say what you think.",2],
 ["Which sentence <b>restates</b> the opinion at the end?","That is why recess should be longer for everyone!",["For example, after recess I finish my maths faster.","One reason is that running helps us to focus.","Some people think recess is already long enough."],"‘That is why …’ brings the reader back to the opinion. ‘For example’ starts an example, ‘One reason’ starts a reason.",2],
 ["Which reason supports ‘everyone should learn to swim’?","Swimming keeps you safe when you are near water.",["Swimming is good, because everyone should swim.","Swimming pools are usually blue and full of water.","Lots of people go swimming on hot summer days."],"A reason explains WHY. ‘Because everyone should swim’ just says the opinion again.",2],
 // level 3 - several answers sound good: pick the strongest
 ["Which reason supports ‘our park must stay open’ <b>best</b>?","It is the only place nearby where children can play outside.",["It is a nice place, and lots of people like it a lot.","It has a pond with ducks, and the ducks are very cute.","It is the very best park, because no park is better."],"The strongest reason shows why the park really matters: without it, children have nowhere to play. ‘No park is better’ goes in a circle.",3],
 ["Which sentence is an opinion with a reason that <b>really</b> explains why?","Everyone should read before bed, because it helps you relax.",["Everyone should read before bed, because reading is good.","Everyone should read before bed, because I say they should.","Everyone should read before bed. It is a really great idea."],"All four have the same opinion. Only one reason tells the reader something new: reading helps you relax.",3],
 ["Which sentence <b>restates</b> the opinion at the end in the <b>strongest</b> way?","That is why every town must protect its park!",["So maybe the park could stay open, if possible.","That is why I wrote about our park for you today.","In conclusion, the park has lots of trees in it."],"A strong ending says the opinion again with power words like ‘must’. ‘Maybe … if possible’ sounds unsure.",3],
 ["Which reason supports ‘dogs are the best pets’ <b>best</b>?","Dogs stay by your side and help you feel safe.",["Dogs are the best pets, because they are great.","Dogs are animals with fur, paws and a long tail.","Lots of my friends have a dog at their house."],"The strongest reason tells WHY dogs are great pets. ‘Because they are great’ goes in a circle; the others are facts.",3]
];

/** OREO writing plan (Opinion – Reason – Example – Opinion restated). */
export const OREO_MC=[
 // level 1 - what the letters mean, what comes first
 ["In the OREO writing plan, what does the first <b>O</b> stand for?","Opinion",["Opening","Outline","Order"],"O is for Opinion. That is what you think.",1],
 ["In the OREO writing plan, what does <b>R</b> stand for?","Reason",["Report","Result","Rhyme"],"R is for Reason. That is why you think it.",1],
 ["In the OREO writing plan, what does <b>E</b> stand for?","Example",["Ending","Explain","Extra idea"],"E is for Example. A real thing that shows your reason is true.",1],
 ["In the OREO writing plan, what does the last <b>O</b> stand for?","Opinion restated",["Other opinions","Outline of ideas","Our own ending"],"The last O says your opinion again. Like ‘That is why…’.",1],
 ["In ‘Persuade for the Park’, who needs to hear why the park should stay open?","The local council",["The fire brigade","The football club","The ice cream van"],"The council decides about the park. Your words must convince them.",1],
 ["What should you do FIRST before writing your persuasive text?","Plan it with the OREO sheet",["Start writing straight away","Write the ending first","Choose a nice title first"],"Plan first: opinion, reasons, examples. With a plan, the text has a clear order.",1],
 // level 2 - sentence starters and what persuasive writing needs
 ["Which words are a good start for a <b>reason</b> sentence?","One reason is…",["For example…","In conclusion…","I think that…"],"A reason often starts with ‘One reason is…’ or ‘because…’.",2],
 ["Which words are a good start for an <b>example</b> sentence?","For example…",["One reason is…","I think that…","That is why…"],"An example often starts with ‘For example…’.",2],
 ["Which words are a good start for <b>restating your opinion</b>?","That is why…",["For example…","One reason is…","Another reason…"],"‘That is why…’ tells the reader: I am finishing now.",2],
 ["What is persuasive writing for?","To make the reader agree with you",["To tell the reader a funny story","To list facts about a topic","To describe what a thing looks like"],"Persuade means: make someone agree with you. A list of facts informs, but it does not persuade.",2],
 ["How many reasons should you brainstorm on your OREO planning sheet for the park?","At least three",["Just one good one","Exactly two","As many as ten"],"Three reasons with three examples make a strong letter.",2],
 ["Which is a REASON why the park is valuable?","It is a place where the community can meet.",["I went to the park last Tuesday after school.","The council wants to close the park next year.","The park is the best place in the whole town."],"A reason says WHY. ‘The best place in town’ is an opinion, not a reason. ‘Last Tuesday’ is an example.",2],
 ["Which words make your writing more persuasive?","must, important, everyone",["maybe, sort of, perhaps","nice, good, okay, fine","the, and, a, of, to"],"Strong words convince people. ‘Maybe’ and ‘sort of’ sound unsure.",2],
 ["How do you finish an OREO text?","Say your opinion again, strongly",["Give one more example from life","Start a brand new reason there","Say thank you and sign it"],"Say your opinion again at the end. Then the reader remembers it.",2],
 // level 3 - reason or example? what is missing?
 ["Your OREO paragraph has an opinion, a reason and an example. What is still <b>missing</b>?","The opinion said again at the end",["A second example from your life","A reason why you like the topic","A title written in capitals"],"O-R-E-O: Opinion, Reason, Example, Opinion restated. The last O is missing.",3],
 ["Which sentence is a <b>reason</b>, not an example?","Parks give children a safe place to play.",["Last week I played tag by the big oak tree.","For example, my sister learnt to ride there.","On Sunday we fed the ducks at the pond."],"A reason is true in general – it explains WHY. An example tells one real moment: last week, on Sunday.",3]
];

/** "Opinion or fact?" - sets of three opinions and three facts, all about the same length.
 *  Level 1: clear opinion words (best, yummiest); 2: opinions without those words; 3: facts with ‘biggest’ or
 *  ‘highest’ (you can check them) and opinions that sound like facts. note = extra sentence for the explanation. */
export const OPFACT=[
 {level:1, op:["Chocolate is the best ice cream flavour.","Ice cream tastes better in a cone.","Strawberry ice cream is the yummiest."], fact:["Ice cream melts quickly in the hot sun.","Ice cream is made with milk or cream.","Most ice cream is kept in a freezer."]},
 {level:1, op:["Puppies are the cutest animals of all.","Rainy days are the most boring days.","Pizza is the yummiest food in the world."], fact:["Puppies are born with their eyes shut.","Rain falls from clouds in the sky.","Pizza is usually baked in a hot oven."]},
 {level:2, op:["The park is too small for our town.","Parks are more fun than cinemas.","Every town should have a bigger park."], fact:["The park has a pond with ten ducks.","Trees and flowers grow in the park.","The park has two swings and a slide."]},
 {level:2, op:["Homework should be banned for children.","Summer holidays are far too short.","Football is more exciting than tennis."], fact:["Homework is school work you do at home.","Summer holidays usually start in July.","A football team has eleven players."]},
 {level:3, note:"Careful: ‘biggest’ or ‘highest’ can be a fact – you can check it in a book.", op:["Dogs are much smarter than cats are.","Winter is a better season than summer.","Maths is a lot harder than reading is."], fact:["The blue whale is the biggest animal.","Mount Everest is the highest mountain.","Paris is the capital city of France."]}
];
