// Pure question collections, using the existing app helpers. No storage or UI state.

export const VARCTRL=[
 ["The surfaces on the ramp","Variable","The surfaces are the one thing you change."],
 ["The toy car","Control","You use the same car every time."],
 ["Where the ramp stands","Control","The ramp stays in the same place."],
 ["The slope of the ramp","Control","The ramp stays at the same steepness."],
 ["Letting the car go without pushing","Control","You release the car the same way every time."],
 ["Measuring from the back of the car","Control","You measure the same way every time."]
];

export const OREO_PARTS=['Opinion','Reason','Example','Opinion restated'];

export const SENT=[
 ["I think recess should be longer.",0],["One reason is that playing outside helps us focus in class.",1],["For example, after a long recess I finish my maths faster.",2],["So that is why recess should be longer!",3],
 ["Our park must not be closed.",0],["One reason is that it is the only place nearby to ride bikes.",1],["For instance, every Saturday my brother and I ride around the pond.",2],["In conclusion, the park has to stay open.",3],
 ["In my opinion, everyone should learn to swim.",0],["Another reason is that swimming keeps you safe near water.",1],["For instance, my cousin swam to the side when he fell off the boat.",2],["In conclusion, learning to swim is really important.",3]
];

export const SOURCES=[
 ["You need a quick fact about how magnets work.","Britannica","An encyclopedia is perfect for checked facts."],
 ["You want to watch how a parachute slows down.","BrainPop","BrainPop shows topics in short videos."],
 ["You want to search the internet safely for ‘gravity for kids’.","Kiddle","Kiddle is a search website made for kids."],
 ["You want to see friction happen in a cartoon explanation.","BrainPop","Videos show movement best."],
 ["You need the exact meaning of the word ‘motion’.","Britannica","Encyclopedias and dictionaries give careful definitions."],
 ["You want to find several kid-friendly websites about ramps.","Kiddle","A kids’ search engine finds safe websites."]
];

export const PACK=[
 ["Your phone","Leave","Phones and electronic devices stay at home so nothing gets lost."],
 ["A favourite toy","Leave","Toys stay at home. We don’t want anything special to get lost!"],
 ["Jewellery","Leave","Jewellery stays at home too."],
 ["Comfortable clothes","Bring","Wear comfortable clothes, there is lots of walking."],
 ["Good walking shoes","Bring","Good shoes for a day full of walking."],
 ["A packed lunch","Bring","Bring a packed lunch."],
 ["Two snacks","Bring","Two snacks keep your energy up."],
 ["A labelled water bottle","Bring","A water bottle with your name on it."],
 ["A light backpack","Bring","A light backpack for just your food and water."],
 ["Your school folder","Leave","No books or school folders, only food and water."],
 ["Your Emergency Contact Card","Bring","Your teacher gives you this card. Keep it safe all day."],
 ["A tablet","Leave","Electronic devices stay at home."]
];

export const SENTS=[
 ["On Monday we went to the theme park.",["Monday"]],
 ["In the story, the teacher Mr. Puddle wears a funny hat.",["Mr","Puddle"]],
 ["Paris is a big city in France.",["Paris","France"]],
 ["The park in Greenfield has a big pond.",["Greenfield"]],
 ["In October we decorated pumpkins for the library.",["October"]],
 ["Peter Pan flies to Neverland with Tinker Bell.",["Peter","Pan","Neverland","Tinker","Bell"]],
 ["Ms. Marmalade showed us Britannica on the tablets.",["Ms","Marmalade","Britannica"]],
 ["Did you read Matilda by Roald Dahl?",["Matilda","Roald","Dahl"]],
 ["Captain Hook is afraid of the crocodile.",["Captain","Hook"]],
 ["Our park must stay open!",[]],
 ["Where is the metre stick?",[]],
 ["Every Friday we have music with Mr. Puddle.",["Friday","Mr","Puddle"]]
];

export const ENDS=[["What time does school start","?"],["Watch out for the crocodile","!"],["The park has a pond","."],["Can we go to the theme park again","?"],["Please pass the metre stick","."],["How far did your car roll","?"],["Hooray, we won the pumpkin contest","!"],["Peter Pan can fly","."],["Who wrote Matilda","?"],["Stop pushing the car","!"]];

export const TRENNBAR=[
 ["ausschneiden","Man schneidet das Papier aus.",["Man ausschneidet das Papier.","Man schneidet aus das Papier.","Man das Papier schneidet aus."]],
 ["aufstellen","Man stellt das Gerät auf.",["Man aufstellt das Gerät.","Man stellt auf das Gerät.","Man das Gerät stellt auf."]],
 ["anschalten","Man schaltet die Maschine an.",["Man anschaltet die Maschine.","Man schaltet an die Maschine.","Man die Maschine schaltet an."]],
 ["zusammenbauen","Man baut die Teile zusammen.",["Man zusammenbaut die Teile.","Man baut zusammen die Teile.","Man die Teile baut zusammen."]],
 ["einfüllen","Man füllt das Wasser ein.",["Man einfüllt das Wasser.","Man füllt ein das Wasser.","Man das Wasser füllt ein."]],
 ["umdrehen","Man dreht die Kurbel um.",["Man umdreht die Kurbel.","Man dreht um die Kurbel.","Man die Kurbel dreht um."]]
];

export const ZUSAMMEN=[["Dreh","Kurbel","Drehkurbel"],["Geschenk","Papier","Geschenkpapier"],["Buch","Seite","Buchseite"],["Wort","Schatz","Wortschatz"],["Wasser","Flasche","Wasserflasche"],["Schul","Tasche","Schultasche"],["Traum","Gerät","Traumgerät"],["Hand","Schuh","Handschuh"]];

export const SPECIFIC_NEAR=[null,null,null,
 ["Last Tuesday I noticed something interesting somewhere in the park.","I often see birds near the pond when I visit our town park."],
 ["My dad and I exercise in the park whenever we have some free time.","On Saturday I went to the park and did something that made me tired."],
 ["Our ramp test showed that one surface worked differently from another.","When we tested our car, we wrote some interesting results in our book."],
 ["My family meets new neighbours whenever we go out together in our town.","Our neighbours have children who enjoy the park."],
 ["When I go swimming, I practise the strokes that I learnt at school.","Swimming lessons teach children how to get back to a boat."],
 ["When we play outside, most of us usually work better afterwards.","I often feel ready to work again after a good long break outdoors."]
];

export function createLanguageQuestions({rnd,pick,shuffle,uniq,mc,two,bankMC,quote,itemCard,stripP,FOR,WRD,LIB,TRIP,SEN,ANL,OREO_MC,OPFACT,INFER,SPECIFIC,SPECIFIC_EXPLAIN}){
function varCtrlQ(){
  const r=pick(VARCTRL),options=['Variable','Control','Result','Prediction'];
  return two("In the Friction Roll experiment, is this a variable or a control, a measured result or a prediction?",options,r[1]==='Variable'?0:1,
    r[2]+" A variable is the thing you change. Controls stay exactly the same.",Object.assign({visual:itemCard(r[0])},FOR));
}

function oreoMC(){ return bankMC(OREO_MC,WRD)(pick(OREO_MC)); }

function opinionFact(){
  const s=pick(OPFACT), askOp=rnd(2)===0, tag=Object.assign({level:s.level||2}, WRD), note=s.note?' '+s.note:'';
  return askOp
    ? mc("Which sentence is an <b>opinion</b>?", pick(s.op), s.fact, "An opinion is what someone thinks or feels. Other people might disagree."+note, tag)
    : mc("Which sentence is a <b>fact</b>?", pick(s.fact), s.op, "A fact is true for everyone and can be checked."+note, tag);
}

function sentenceType(){
  const r=pick(SENT);
  return Object.assign({kind:'mc', prompt:"Which part of the OREO plan is this sentence?", visual:quote(r[0]), options:OREO_PARTS.slice(), answer:r[1],
    explain:"Opinions say what you think. Reasons often start with ‘One reason is…’. Examples start with ‘For example…’. The last O restates the opinion with ‘That is why…’ or ‘In conclusion…’."}, WRD);
}

function affixQ(bank){ const r=bank.shift(); return mc(r[0], r[1], r[2], r[3], WRD); }

function inferenceQ(){ const r=pick(INFER); return mc(r[1], r[2], r[3], r[4], Object.assign({visual:quote(r[0])}, WRD)); }

function sourceQ(){
  const r=pick(SOURCES);
  return Object.assign({kind:'mc', prompt:"Which research source fits best?", visual:quote(r[0]), options:['Britannica','Kiddle','BrainPop'], answer:['Britannica','Kiddle','BrainPop'].indexOf(r[1]), grid3:true, explain:r[2]}, LIB);
}

function packQ(r){
  return two("School trip to the theme park! Which plan follows the packing list?",['Bring it with you','Leave it at home','Leave it on the bus','Borrow it at the park'],r[1]==='Bring'?0:1,r[2],Object.assign({visual:itemCard(r[0])},TRIP));
}

function capitalFixQ(){
  const r=pick(SENTS), s=r[0], words=s.split(' ');
  const v1=s.charAt(0).toLowerCase()+s.slice(1);
  const v2=s.slice(0,-1);
  let v3;
  if(r[1].length){ const pn=pick(r[1]); v3=words.map((w,i)=>i>0&&stripP(w)===pn?w.toLowerCase():w).join(' '); if(v3===s) v3=null; }
  if(!v3){ const candidates=words.map((w,i)=>i>0&&/^[a-z]/.test(w)?i:-1).filter(i=>i>=0),i=pick(candidates); v3=words.map((w,k)=>k===i?w.charAt(0).toUpperCase()+w.slice(1):w).join(' '); }
  const wrongs=uniq([v1,v2,v3]).filter(x=>x!==s);
  return mc("Which sentence is written <b>correctly</b>?", s, wrongs, "Start with a capital letter, give names, places, days and months a capital letter, and end with . ? or !", SEN);
}

function properNounQ(){
  const r=pick(SENTS.filter(x=>x[1].length)),s=r[0],words=s.split(' ').map(stripP);
  const pn=pick(r[1].filter(p=>words.indexOf(p)>0))||r[1][0];
  const lowerName=s.split(' ').map(w=>stripP(w)===pn?w.toLowerCase():w).join(' ');
  const common=s.split(' ').findIndex((w,i)=>i>0&&/^[a-z]/.test(w));
  const extraCapital=s.split(' ').map((w,i)=>i===common?w[0].toUpperCase()+w.slice(1):w).join(' ');
  return mc("Which sentence correctly shows the words that MUST have a capital letter, even in the middle of a sentence?",s,[lowerName,s.toLowerCase(),extraCapital],
    "‘"+pn+"’ is a name, place, day or title. Those always get a capital letter.",Object.assign({visual:quote(s.toLowerCase())},SEN));
}

function endMarkQ(){
  const r=pick(ENDS);
  return Object.assign({kind:'mc', prompt:"Which end mark does this sentence need? Read it as "+(r[1]==='?'?'a question':r[1]==='!'?'a strong warning or celebration':'a calm statement or request')+".", visual:quote(r[0]+" ___"), options:['.','?','!'], answer:['.','?','!'].indexOf(r[1]), grid3:true,
    explain:(r[1]==='?'?"It asks a question, so it needs a question mark.":r[1]==='!'?"It is exciting or a command, so it needs an exclamation mark.":"It is a plain statement, so it ends with a full stop.")}, SEN);
}

function specificExampleQ(){
  const r=pick(SPECIFIC), swap=rnd(2)===0, level=r[3]||2;
  if(level>1)return mc("Which example is more <b>specific and personal</b>? "+(level===3?'Choose one particular event.':'Look for a person, an activity and concrete details.'),r[1],[r[2],...SPECIFIC_NEAR[SPECIFIC.indexOf(r)]],SPECIFIC_EXPLAIN[level],Object.assign({visual:quote("Reason: "+r[0]),level:level},SEN));
  return two("Which example is more <b>specific and personal</b>?", swap?[r[2],r[1]]:[r[1],r[2]], swap?1:0,
    SPECIFIC_EXPLAIN[level], Object.assign({visual:quote("Reason: "+r[0]), level:level}, SEN));
}

function trennbarQ(){ const r=pick(TRENNBAR); return mc("Welcher Satz verwendet das trennbare Verb <b>"+r[0]+"</b> richtig?", r[1], r[2], "Bei trennbaren Verben wandert die Vorsilbe ans Satzende: Man schneidet … aus.", ANL); }

function zusammenQ(){
  const r=pick(ZUSAMMEN), others=shuffle(ZUSAMMEN.filter(x=>x!==r)).slice(0,3).map(x=>x[0]+x[2].slice(x[0].length===x[2].length?0:x[0].length).replace(x[1].toLowerCase(),'')+r[1].toLowerCase());
  const wrongs=uniq([r[1]+r[0].toLowerCase(), r[0]+" "+r[1], r[0]+"-"+r[1].toLowerCase()+"e"]).filter(x=>x!==r[2]).concat(others).slice(0,3);
  return mc("<b>"+r[0]+"</b> + <b>"+r[1]+"</b> = ? Bilde das zusammengesetzte Wort.", r[2], wrongs, r[0]+" + "+r[1]+" = "+r[2]+". Das letzte Wort bestimmt den Artikel: die Kurbel → die Drehkurbel.", Object.assign({grid:true}, ANL));
}
return {varCtrlQ,oreoMC,opinionFact,sentenceType,affixQ,inferenceQ,sourceQ,packQ,capitalFixQ,properNounQ,endMarkQ,specificExampleQ,trennbarQ,zusammenQ};
}
