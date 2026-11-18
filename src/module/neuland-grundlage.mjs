// EP02-only one-step entries. The normal quest builders and their question IDs
// are unchanged. Three genuine stimuli leave a free entry beside two due reviews.
export const NEULAND_GRUNDLAGE={
 poetry:[
  ['Read this short poem:<br>Rain drops fall.<br>Birds sing.<br>How many poem lines are there?','2',['1','3'],'Count the poem lines from top to bottom. The question itself is not a poem line.','The poem has two lines: “Rain drops fall.” and “Birds sing.”'],
  ['Read this short poem:<br>A small seed.<br>A green shoot.<br>A tall tree.<br>How many poem lines are there?','3',['2','4'],'Each new poem line is one line. Count only the three lines of the poem.','Count the poem lines: seed, shoot, tree. That is three lines.'],
  ['Read this short poem:<br>One bright star.<br>A quiet night.<br>The moon above.<br>A silver light.<br>How many poem lines are there?','4',['2','3'],'Count each visible poem line once. Do not count the question.','There are four poem lines: star, night, moon, light.']
 ],
 finish:[
  ['Your worksheet has two questions. You answered only the first. What must you do before handing it in?','Answer the second question',['Hand it in with one answer missing','Write only the title again'],'Check every question. Finished means every question has an answer.','The first question is done. The second question still needs an answer.'],
  ['Your worksheet has three answer boxes. The first two are filled in. What is still left to do?','Fill in the third answer box',['Fill in the first box again','Hand it in with the last box empty'],'Look for the answer box that is still empty.','The first two boxes are done. The third box still needs its answer.'],
  ['A worksheet asks you to draw a graph and write one sentence about it. The graph is done. What is left?','Write the sentence about the graph',['Draw the same graph again','Hand it in without the sentence'],'Check both parts of the instruction, one at a time.','The drawing part is done. The writing part is still needed.']
 ],
 team:[
  ['Your partner is explaining an idea. What helps your team?','Listen, then take your turn',['Talk over your partner','Leave without telling your partner'],'Both people need a turn to share their idea. Let your partner finish.','Listen to the idea first. Then it is your turn to add something.'],
  ['You have shared your idea. Your partner has not had a turn yet. What helps your team?','Invite your partner to share an idea',['Keep talking so they cannot start','Say that only your idea matters'],'Make room for both people to contribute.','You have had a turn. Invite your partner to have a turn too.'],
  ['Your group has agreed that you will collect the pencils. What helps your team now?','Collect the pencils as agreed',['Wait for someone else to do your job','Take every pencil for yourself'],'Doing your agreed part helps the whole group.','Collecting the pencils is your part of the shared task.']
 ],
 school:[
  ['You can solve these sums on your own. Is that a glow or a grow?','A glow',['A grow'],'A glow is something you can already do well. A grow is a next step to practise.','Solving the sums on your own is a strength you can show: a glow.'],
  ['You still need help remembering the unit after a measurement. Is that a glow or a grow?','A grow',['A glow'],'A grow is a next step to practise. Asking for help is allowed.','Remembering the unit is the next step you can practise: a grow.'],
  ['You can read this page clearly on your own. Is that a glow or a grow?','A glow',['A grow'],'A glow is something that is already going well.','Reading the page clearly on your own is a strength: a glow.']
 ],
 music:[
  ['You clap “clap, clap, pause” again and again. What pattern are you practising?','A rhythm',['A melody','A lyric'],'Rhythm is the timing of sounds and pauses. Melody uses different pitches; lyrics are song words.','The pattern tells you when to clap and when to pause. That is rhythm.'],
  ['You sing a high note, then a low note, then a high note. What is this pattern of pitches?','A melody',['A rhythm','A lyric'],'Listen for changes in how high or low the notes sound.','A tune made from high and low notes is a melody.'],
  ['You read the words that you will sing in a song. What are those words called?','Lyrics',['A rhythm','A melody'],'Separate the words from their tune and timing.','The words of a song are its lyrics. The melody is the tune.']
 ],
 times:[
  ['Two plates each have two apples. How many apples altogether?','4',['2','3'],'Count both equal groups: 2 and another 2.','2 + 2 = 4 apples.',['groups',2,2]],
  ['Three plates each have two apples. How many apples altogether?','6',['3','5'],'Count the three equal groups in twos.','2 + 2 + 2 = 6 apples.',['groups',3,2]],
  ['Four plates each have two apples. How many apples altogether?','8',['4','6'],'Each plate adds two apples. Count all four groups.','2 + 2 + 2 + 2 = 8 apples.',['groups',4,2]]
 ],
 fractions:[
  ['A bar has two equal parts. One is coloured. What fraction is coloured?','1/2',['2/2','1/3'],'The bottom number counts all equal parts; the top counts the coloured parts.','One coloured part out of two equal parts is 1/2.',['fraction',2,1]],
  ['A bar has three equal parts. One is coloured. What fraction is coloured?','1/3',['3/3','1/2'],'Count all equal parts first, then the coloured parts.','One coloured part out of three equal parts is 1/3.',['fraction',3,1]],
  ['A bar has four equal parts. One is coloured. What fraction is coloured?','1/4',['4/4','1/3'],'There is one coloured part. Count all four equal parts.','One coloured part out of four equal parts is 1/4.',['fraction',4,1]]
 ],
 area:[
  ['This rectangle has two rows of two unit squares. How many squares cover it?','4',['2','8'],'Count the squares inside: two in the first row and two in the second.','2 + 2 = 4 unit squares inside.',['area',2,2]],
  ['This rectangle has two rows of three unit squares. How many squares cover it?','6',['3','10'],'Count the squares in both rows, not the outside edge.','3 + 3 = 6 unit squares inside.',['area',3,2]],
  ['This rectangle has two rows of four unit squares. How many squares cover it?','8',['4','12'],'Each of the two rows has four squares. Count both rows.','4 + 4 = 8 unit squares inside.',['area',4,2]]
 ],
 elapsed:[
  ['How many minutes pass from 2:00 to 2:05?','5',['2','10'],'The hour stays 2. Count the minutes from 00 to 05.','The minute number moves from 00 to 05: 5 minutes pass.',['time',2,0]],
  ['How many minutes pass from 3:00 to 3:10?','10',['3','5'],'The hour stays 3. Count from 00 to 10 minutes.','The minute number moves from 00 to 10: 10 minutes pass.',['time',3,0]],
  ['How many minutes pass from 4:00 to 4:15?','15',['4','10'],'The hour stays 4. Count from 00 to 15 minutes.','The minute number moves from 00 to 15: 15 minutes pass.',['time',4,0]]
 ],
 mass:[
  ['A pencil has a mass of 8 ___. Which unit fits?','g',['l','min'],'Mass tells you how heavy something is. A pencil is light, so grams fit.','A pencil is light. Its mass can be 8 grams (g).'],
  ['A bag of potatoes has a mass of 2 ___. Which unit fits?','kg',['ml','min'],'A heavy bag is measured in kilograms. Millilitres measure capacity and minutes measure time.','The bag has a mass of 2 kilograms (kg).'],
  ['A small bottle holds 250 ___ of water. Which unit fits?','ml',['kg','min'],'How much a bottle holds is its capacity. A small amount of liquid uses millilitres.','The bottle holds 250 millilitres (ml).']
 ]
};
// Another genuine case of the same family, with a different answer. Shared
// categorical answers are avoided without padding or inventing extra meanings.
export const NEULAND_BEISPIELE=Object.fromEntries(Object.entries(NEULAND_GRUNDLAGE).map(([quest,rows])=>[quest,rows.map((row,i)=>{
 const next=rows.slice(i+1).concat(rows.slice(0,i)).find(other=>other[1]!==row[1]);
 return[next[0],next[1],next[4]];
})]));
export function createNeulandFoundation({mc,visuals,label}){
function neulandFoundation(quest,variant=0){
  const rows=NEULAND_GRUNDLAGE[quest];if(!rows)return null;
  const i=variant%rows.length,r=rows[i],v=r[5];
  return mc(r[0],r[1],r[2],r[4],{world:quest,label:label(quest),level:1,foundationFamily:i,tip:r[3],grid:true,visual:v?visuals[v[0]](v[1],v[2]):''});
 }
 return neulandFoundation;
}
