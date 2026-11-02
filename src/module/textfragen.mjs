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
