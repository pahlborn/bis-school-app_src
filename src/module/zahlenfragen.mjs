// Pure question collections, using the existing app helpers. No storage or UI state.

export const AMPM=[
 ["Amir eats breakfast at 7:30.","AM"],["Lena goes to bed at 8:00.","PM"],["School starts at 8:15.","AM"],["Dinner is at 6:30.","PM"],
 ["The sun rises at 6:45.","AM"],["Football practice is at 4:00 in the afternoon.","PM"],["Lunch break is at 12:30.","PM"],["Noah wakes up at 6:50.","AM"],
 ["The stars come out at 9:00 at night.","PM"],["Morning assembly is at 9:10.","AM"],["The school bus leaves home at 7:40.","AM"],["Bedtime story at 7:45 in the evening.","PM"]
];

export const SURF=['Wood','Tiles','Carpet','Sandpaper','Grass','Foil'];

export const DAYS5=['Mon','Tue','Wed','Thu','Fri'];

export const COMBO_SETS={
 900:[["400 + 400 + 100","500 + 200 + 200","300 + 300 + 300"],["450 + 250 + 200","600 + 200 + 100","350 + 350 + 200"]],
 600:[["200 + 200 + 200","300 + 200 + 100","400 + 100 + 100"],["250 + 250 + 100","350 + 150 + 100","500 + 50 + 50"]],
 1000:[["500 + 300 + 200","400 + 400 + 200","700 + 200 + 100"],["450 + 350 + 200","600 + 300 + 100","800 + 100 + 100"]]
};

export const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday'];

export const AREA_WHICH=[["You put a fence all the way around a garden.","Perimeter"],["You cover a floor with a carpet.","Area"],["You put a ribbon around the edge of a card.","Perimeter"],["You paint a whole wall.","Area"],["You tile a bathroom floor.","Area"],["You walk once around the playground.","Perimeter"]];

export const MASS_UNITS=[["An apple weighs about 150 ___.","g"],["A dog weighs about 20 ___.","kg"],["A big bottle of water holds about 1 ___.","l"],["A spoon of medicine is about 5 ___.","ml"],["A bag of potatoes weighs about 2 ___.","kg"],["A cup of tea holds about 250 ___.","ml"],["A bathtub holds about 150 ___.","l"],["A pencil weighs about 5 ___.","g"]];

export function numberMistakes(right,candidates){
  const unique=[...new Set(candidates)].filter(n=>Number.isInteger(n)&&n>=0&&n!==right);
  for(const delta of[1,-1,10,-10,100,-100])if(unique.length<3&&right+delta>=0&&!unique.includes(right+delta)&&delta!==0)unique.push(right+delta);
  return unique.slice(0,3);
}

export function createNumberQuestions({Math,rnd,pick,shuffle,uniq,fmt,round10,round100,mc,two,typed,fill3,pad,timeWords,clockSVG,numberLineSVG,quote,itemCard,tableHTML,barChartSVG,rulerSVG,scaleSVG,lineSVG,arraySVG,fracSVG,randNotMid,takeFrom,NUM,UNT,GRA,EXP,CHA,DET,STK,WPR,TIM,FRA,ARE,ELA,MAS,NAMES,THINGS}){
function clockRead(){
  const h=1+rnd(12), m=5*rnd(12);
  const useWords=[0,15,30,45].indexOf(m)>=0 && Math.random()<.5;
  const f=useWords?timeWords:(hh,mm)=>hh+":"+pad(mm);
  const right=f(h,m);
  const sh=m/5===0?12:m/5, sm=(h%12)*5;
  const cands=[f(sh,sm), f(h,(m+5)%60), f(h,(m+55)%60), f(h%12+1,m), f((h+10)%12+1,m), f(h,(60-m)%60), f(h,(m+30)%60)];
  const wrongs=shuffle(uniq(cands).filter(x=>x!==right)).slice(0,3);
  return mc("What time does the clock show?", right, wrongs,
    "The short hand shows the hour ("+h+") and the long hand shows the minutes ("+m+"). That is "+h+":"+pad(m)+", or "+timeWords(h,m)+".",
    Object.assign({visual:clockSVG(h,m,210)}, NUM));
}

function clockPick(){
  const h=1+rnd(12), m=pick([0,15,30,45,0,15,30,45,10,20,40,50]);
  const target=timeWords(h,m);
  const key=(a,b)=>a+":"+b;
  const cands=[[m/5===0?12:m/5,(h%12)*5],[h,(m+30)%60],[h%12+1,m],[h,(m+15)%60],[(h+10)%12+1,m],[h,(m+45)%60]];
  const seen={}; seen[key(h,m)]=1; const wrongs=[];
  shuffle(cands).forEach(c=>{ if(wrongs.length<3 && !seen[key(c[0],c[1])]){ seen[key(c[0],c[1])]=1; wrongs.push(clockSVG(c[0],c[1],130)); } });
  return mc("Which clock shows <b>"+target+"</b>?", clockSVG(h,m,130), wrongs,
    target+" is "+h+":"+pad(m)+". The long hand points to the "+(m/5||12)+" and the short hand is "+(m===0?"exactly on":"past")+" the "+h+".",
    Object.assign({htmlOptions:true, grid:true, vis:true}, NUM));
}

function ampm(){
  const r=pick(AMPM),time=r[0].match(/(\d{1,2}):(\d{2})/),hour=+time[1],minute=+time[2];
  const alternate=minute===0?30:0,other=r[1]==='AM'?'PM':'AM';
  return mc(r[0]+" Is that <b>AM</b> or <b>PM</b>? Choose the <b>whole time</b>.",hour+":"+pad(minute)+" "+r[1],
    [hour+":"+pad(minute)+" "+other,hour+":"+pad(alternate)+" "+r[1],hour+":"+pad(alternate)+" "+other],
    "AM is from midnight to noon (the morning). PM is from noon to midnight (afternoon, evening and night).",NUM);
}

function numberLine(){
  const jumps=pick([[10,10,5],[10,10,10],[20,5],[10,5,1],[-10,-10],[-10,-5],[-20,-3],[30,2],[10,10,-5],[-10,-10,-5],[20,20,1]]);
  const sum=jumps.reduce((a,b)=>a+b,0);
  const start=sum<0?40+rnd(55):11+rnd(60);
  const end=start+sum;
  const wrongs=numberMistakes(end,[end+10,end-10,end+5,end-5,end+1,end-1,start+jumps[0],start-sum]);
  const steps=jumps.map(j=>(j<0?"− ":"+ ")+Math.abs(j)).join(" ");
  return mc("Start at <b>"+start+"</b> and follow the jumps. Where do you land?", String(end), wrongs.map(String),
    start+" "+steps+" = "+end+".", Object.assign({visual:numberLineSVG(start,jumps), grid:true}, NUM));
}

function placeValue(){
  const v=rnd(4);
  if(v===0){
    let n, s, pos;
    do { n=1000+rnd(9000); s=String(n); const one=[0,1,2,3].filter(i=>s[i]!=='0' && s.split(s[i]).length===2); pos=one.length?pick(one):-1; } while(pos<0);
    const d=+s[pos], place=[1000,100,10,1][pos], right=d*place, names=['thousands','hundreds','tens','ones'];
    const wrongs=numberMistakes(right,[d, d*place*10, d*place/10, place, d*1000, d*100, d*10].filter(Number.isInteger));
    return mc("What is the value of the <b>"+d+"</b> in <b>"+fmt(n)+"</b>?", fmt(right), wrongs.map(fmt),
      "The "+d+" is in the "+names[pos]+" place, so it is worth "+fmt(right)+".", Object.assign({grid:true, coach:{family:'place-value', n:n, pos:pos}}, NUM));
  }
  if(v===1){
    const base=1500+rnd(7000);
    const nums=uniq([base, base+1+rnd(900), base-1-rnd(900), base+(rnd(2)?10:-100), base+1000, base-1000]).slice(0,4);
    const big=rnd(2)===0, right=big?Math.max.apply(null,nums):Math.min.apply(null,nums);
    return mc("Which number is the <b>"+(big?"largest":"smallest")+"</b>?", fmt(right), nums.filter(x=>x!==right).map(fmt),
      "Compare the thousands first, then the hundreds, tens and ones.", Object.assign({grid:true}, NUM));
  }
  if(v===2){
    const th=1+rnd(9), hu=rnd(10), te=rnd(10), on=rnd(10), n=th*1000+hu*100+te*10+on;
    const wrongs=numberMistakes(n,[th*1000+te*100+hu*10+on, th*100+hu*10+on, th*1000+hu*100+on*10+te, n+100, n-10, n+1000]);
    return mc(th+" thousands, "+hu+" hundreds, "+te+" tens and "+on+" ones. What number is that?", fmt(n), wrongs.map(fmt),
      "Write each digit in its place: "+th+" | "+hu+" | "+te+" | "+on+" makes "+fmt(n)+".", Object.assign({grid:true}, NUM));
  }
  const n=1000+rnd(8500);
  const p=pick([[100,"100 more than"],[-100,"100 less than"],[10,"10 more than"],[-10,"10 less than"],[1000,"1,000 more than"],[-1000,"1,000 less than"]]);
  const right=n+p[0];
  const wrongs=numberMistakes(right,[n+p[0]*10, n-p[0], n+p[0]/10, n+1, n-1, n+p[0]*2].filter(Number.isInteger));
  return mc("What is <b>"+p[1]+" "+fmt(n)+"</b>?", fmt(right), wrongs.map(fmt),
    fmt(n)+" "+(p[0]>0?"+":"−")+" "+fmt(Math.abs(p[0]))+" = "+fmt(right)+".", Object.assign({grid:true}, NUM));
}

function expandedZeroQ(){
  const z=1+rnd(2), d=[1+rnd(9),1+rnd(9),1+rnd(9),1+rnd(9)]; d[z]=0;
  const n=d[0]*1000+d[1]*100+d[2]*10+d[3];
  const parts=dd=>dd.map((x,i)=>x*10**(3-i)).filter(x=>x).map(fmt).join(' + ');
  const right=parts(d), names=['thousands','hundreds','tens','ones'];
  const why=fmt(n)+" has "+d.map((x,i)=>x+" "+names[i]).join(", ")+". The 0 holds the "+names[z]+" place: there are no "+names[z]+", so that part is left out.";
  if(rnd(2)===0) return typed("What number is <b>"+right+"</b>? Type your answer.", n, why+" "+right+" = "+fmt(n)+".", Object.assign({}, NUM));
  const nz=d.filter(x=>x), shifted=nz.slice(); while(shifted.length<4) shifted.unshift(0);
  const sw=d.slice(); sw[z]=d[z+1]; sw[z+1]=0;
  const last=right.split(' + '), tenfold=last.slice(0,-1).concat([fmt(Number(last[last.length-1].replace(/,/g,''))*10)]).join(' + ');
  const sum=t=>t.split(' + ').reduce((a,b)=>a+Number(b.replace(/,/g,'')),0);
  const cands=uniq([parts(shifted), parts(sw), tenfold]).filter(t=>t!==right && sum(t)!==n);
  return mc("Which shows <b>"+fmt(n)+"</b> in expanded form?", right, cands, why, Object.assign({grid:true}, NUM));
}

function oddEven(){
  const n=pick([10+rnd(90),100+rnd(900),1000+rnd(9000)]),even=n%2===0;
  const offsets=n%4<2?[-1,1,3,-3,5,-5]:[-3,-1,1,3,-5,5];
  const wrongs=offsets.map(d=>n+d).filter(x=>x>=10&&x<=9999).slice(0,3);
  return mc("Think about odd or even. Which number is <b>"+(even?'even':'odd')+"</b>?",fmt(n),wrongs.map(fmt),
    "Only look at the last digit. 0, 2, 4, 6 and 8 are even; 1, 3, 5, 7 and 9 are odd.",NUM);
}

function mental(){
  const a=pick([120,150,230,260,340,410,450,520,610,730])+rnd(5)*10, b=pick([110,150,200,250,300,340,380,420])+rnd(5)*10;
  const plus=rnd(2)===0; const right=plus?a+b:Math.abs(a-b), x=Math.max(a,b), y=Math.min(a,b);
  const prompt=plus?"<b>"+a+" + "+b+"</b> = ?":"<b>"+x+" − "+y+"</b> = ?";
  const wrongs=numberMistakes(right,[right+10,right-10,right+100,right-100,right+20,right-1]);
  return mc(prompt, fmt(right), wrongs.map(fmt), (plus?a+" + "+b:x+" − "+y)+" = "+right+". Add or take away the hundreds first, then the tens.", Object.assign({grid:true}, NUM));
}

function unitPickQ(){
  const items=[
   ["The toy car rolled","cm",40,180,"Distances in the Friction Roll are measured in centimetres (cm). Always write the unit!"],
   ["The toy car weighs","g",60,160,"The mass of a small toy car is measured in grams (g)."],
   ["The ramp is","m",1,2,"Long things like a ramp are measured in metres (m)."],
   ["The classroom door is about","m",2,2,"Tall things are measured in metres (m)."],
   ["A pencil is about","cm",12,19,"Short lengths are measured in centimetres (cm)."],
   ["A bag of flour weighs","kg",1,2,"Heavy things are measured in kilograms (kg)."],
   ["The water bottle holds","ml",300,750,"Liquids are measured in millilitres (ml) or litres (l)."]
  ];
  const r=pick(items), n=r[2]+rnd(r[3]-r[2]+1);
  return mc(r[0]+" <b>"+n+" ___</b>. Which unit is right?", r[1], [({cm:'m',m:'cm',g:'kg',kg:'g',ml:'l',l:'ml'})[r[1]],...['cm','kg','ml'].filter(u=>({cm:'length',kg:'mass',ml:'capacity'})[u]!==({cm:'length',m:'length',g:'mass',kg:'mass',ml:'capacity',l:'capacity'})[r[1]])], r[4], Object.assign({grid:true}, UNT));
}

function convertQ(){
  const v=rnd(4);
  if(v===0) return mc("How many centimetres are in <b>1 metre</b>?","100",["10","1,000","50"],"1 m = 100 cm. The metre stick has 100 little centimetre marks.",Object.assign({grid:true},UNT));
  if(v===1){ const m=2+rnd(4); return mc("<b>"+m+" m</b> = how many cm?", String(m*100), numberMistakes(m*100,[m*10,m*1000,m*100+10,m*100-10]).map(String), m+" m = "+m+" × 100 cm = "+(m*100)+" cm.", Object.assign({grid:true},UNT)); }
  if(v===2){
    let cm=105+5*rnd(38); if(cm%100===0) cm+=5;
    const m=Math.floor(cm/100), r=cm%100, right=m+" m "+r+" cm";
    const wrongs=uniq([m+" m "+(r+10)+" cm",(m+1)+" m "+r+" cm", m+" m "+(100-r)+" cm", (m+1)+" m "+(r+5)+" cm"]).filter(x=>x!==right).slice(0,3);
    return mc("The car rolled <b>"+cm+" cm</b>. How much is that in metres and centimetres?", right, wrongs, cm+" cm = "+m+" m and "+r+" cm, because 100 cm make 1 m.", Object.assign({grid:true},UNT));
  }
  const a=70+5*rnd(6), metresFirst=rnd(2)===1;
  return mc("Compare lengths: <b>"+(metresFirst?"1 m ___ "+a+" cm":a+" cm ___ 1 m")+"</b>. Which sign is correct?", metresFirst?">":"<", ["=",metresFirst?"<":">"], "1 m = 100 cm, and 100 is more than "+a+".", Object.assign({grid:true},UNT));
}

function rulerQ(){
  const mark=15+5*rnd(17);
  const wrongs=numberMistakes(mark,[mark+5,mark-5,mark+10,mark-10,100-mark]).map(x=>x+" cm");
  return mc("The back of the car stopped at the arrow. How far did it roll?", mark+" cm", wrongs, "Read the big numbers (tens) first, then count the small 5 cm marks. The arrow is at "+mark+" cm.", Object.assign({visual:rulerSVG(mark), grid:true}, UNT));
}

function barData(){ const names=takeFrom(SURF,4); const vals=shuffle([30,45,60,75,90,105,120,135,150,165]).slice(0,4); return names.map((n,i)=>({label:n,v:vals[i]})); }

function barReadQ(){
  const d=barData(), v=rnd(3);
  const max=d.reduce((p,c)=>c.v>p.v?c:p), min=d.reduce((p,c)=>c.v<p.v?c:p);
  if(v===0) return mc("Read the graph. On which surface did the car roll the <b>farthest</b>?", max.label, d.filter(x=>x!==max).map(x=>x.label), "The tallest bar is "+max.label+" at "+max.v+" cm.", Object.assign({visual:barChartSVG(d), grid:true}, UNT));
  if(v===1) return mc("Read the graph. Which surface had the <b>most friction</b>?", min.label, d.filter(x=>x!==min).map(x=>x.label), "Most friction means the shortest distance. The shortest bar is "+min.label+" at "+min.v+" cm.", Object.assign({visual:barChartSVG(d), grid:true}, UNT));
  const t=pick(d);
  return mc("Read the graph. How far did the car roll on <b>"+t.label+"</b>?", t.v+" cm", numberMistakes(t.v,[t.v+15,t.v-15,t.v+30,t.v-30]).map(x=>x+" cm"), "Follow the top of the "+t.label+" bar across to the scale: "+t.v+" cm.", Object.assign({visual:barChartSVG(d), grid:true}, UNT));
}

function barMissingQ(){
  const d=barData(), miss=pick(['title','labels','scale','none']);
  const o={title:miss!=='title', labels:miss!=='labels', scale:miss!=='scale', values:miss==='none'};
  const names={title:"The title", labels:"The surface names under the bars", scale:"The numbers on the side (the scale)", none:"Nothing, it is complete"};
  const right=names[miss], wrongs=Object.keys(names).filter(k=>k!==miss).map(k=>names[k]);
  const why={title:"Without a title nobody knows what the graph shows.", labels:"Without labels nobody can tell which bar is which surface.", scale:"Without the scale nobody can read how many centimetres each bar means.", none:"Title, labels and scale are all there. Well done!"};
  return mc("This bar graph is "+(miss==='none'?"finished. What is missing?":"not finished. What is <b>missing</b>?"), right, wrongs, why[miss]+" A finished graph needs a title, labels and a scale.", Object.assign({visual:barChartSVG(d,o)}, UNT));
}

function tableConclusionQ(){
  const d=barData().slice(0,3),min=d.reduce((p,c)=>c.v<p.v?c:p),max=d.reduce((p,c)=>c.v>p.v?c:p),middle=d.find(x=>x!==min&&x!==max);
  const line=(label,amount,distance)=>label+" has "+amount+" friction because its distance is the "+distance+".";
  return mc("Look at the data. Which conclusion fits?",line(min.label,'most','smallest'),
    [line(max.label,'most','greatest'),line(min.label,'least','smallest'),line(middle.label,'most','smallest')],
    "Short distance = lots of friction. "+min.label+" stopped the car after only "+min.v+" cm.",
    Object.assign({visual:tableHTML(['Surface','Distance'],d.map(x=>[x.label,x.v+' cm']))},UNT));
}

function scaleStepQ(){
  const step=pick([2,5,10]), mark=step*(1+2*rnd(5)), below=mark-step;
  const wrongs=numberMistakes(mark,[below+1, mark+1, below, mark+step, mark-1].filter(x=>x>=0));
  return mc("Only every second mark has a number. What number does the arrow show?", String(mark), wrongs.map(String),
    "From "+below+" to "+(below+2*step)+" there are two steps, so each step is "+step+". The arrow is one step after "+below+": "+below+" + "+step+" = "+mark+".",
    Object.assign({visual:scaleSVG(step,mark), grid:true, tip:"Look at two numbers next to each other. How many steps are between them? Work out how much one step is, then count on in those steps."}, UNT));
}

function lineGraphQ(){
  let vals; do { vals=DAYS5.map(()=>5*(2+rnd(5))); } while(vals.filter(v=>v===Math.max(...vals)).length>1 || vals.filter(v=>v===Math.min(...vals)).length>1);
  const d=DAYS5.map((l,i)=>({label:l,v:vals[i]})), vis=lineSVG(d,{title:'Temperature at noon (°C)'}), v=rnd(3);
  const tip="Find the day at the bottom. Go straight up to the dot, then across to the numbers on the side.";
  if(v<2){ const hot=v===0, t=d.reduce((p,c)=>(hot?c.v>p.v:c.v<p.v)?c:p);
    return mc("Read the line graph. On which day was it <b>"+(hot?"warmest":"coldest")+"</b>?", t.label, shuffle(d.filter(x=>x!==t).map(x=>x.label)).slice(0,3), "The "+(hot?"highest":"lowest")+" dot is on "+t.label+": "+t.v+" °C.", Object.assign({visual:vis, grid:true, tip:tip}, GRA)); }
  const t=pick(d);
  return mc("Read the line graph. How warm was it on <b>"+t.label+"</b>?", t.v+" °C", numberMistakes(t.v,[t.v+5,t.v-5,t.v+10,t.v-10].filter(x=>x>0)).map(x=>x+" °C"), "Go up from "+t.label+" to the dot, then across to the scale: "+t.v+" °C.", Object.assign({visual:vis, grid:true, tip:tip}, GRA));
}

function massRecordQ(){
  const g=55+rnd(110);
  return mc("The scale shows the car’s mass: <b>"+g+" g</b>. What do you write in the mass column of your table?", g+" g", [String(g), g+" cm", g+" kg"], "Write the number AND the unit. Mass is in grams (g), distance is in centimetres (cm).", Object.assign({grid:true}, UNT));
}

function combosQ(){
  const target=pick([900,600,1000]), good=pick(COMBO_SETS[target]);
  const right=good.join("<br>");
  const same=good[0]+"<br>"+good[0]+"<br>"+good[0];
  const parts=good[1].split(" + ").map(Number); parts[0]+=100;
  const wrongSum=good[0]+"<br>"+parts.join(" + ")+"<br>"+good[2];
  const repeat=good[0]+"<br>"+good[1]+"<br>"+good[1];
  return mc("Which answer shows <b>three different</b> ways to make "+fmt(target)+"?", right, [same, wrongSum, repeat],
    "Each line must add up to "+fmt(target)+" AND be a different combination. Try big and small numbers, not just the same number three times.", Object.assign({htmlOptions:true}, EXP));
}

function anotherWayQ(){
  const sets=[[900,"300 + 300 + 300","450 + 250 + 200",["300 + 300 + 300","400 + 400 + 200","500 + 500 + 100"]],[600,"200 + 200 + 200","350 + 150 + 100",["200 + 200 + 200","300 + 300 + 300","400 + 200 + 200"]],[1000,"500 + 500","650 + 350",["500 + 500","600 + 500","450 + 450"]]];
  const r=pick(sets);
  return mc("Mia split "+fmt(r[0])+" km into "+r[1]+". Which is <b>another</b> way to make "+fmt(r[0])+"?", r[2], r[3], r[2]+" also makes "+fmt(r[0])+", and it is different from Mia’s way. The others repeat her way or give the wrong total.", Object.assign({grid:true}, EXP));
}

function reasonableQ(){
  const a=randNotMid(),b=randNotMid(),ok=rnd(2)===0,shown=ok?a+b:a+b+pick([1000,-200,500,300]);
  const estimate=round100(a)+round100(b),gap=Math.abs(shown-estimate);
  const line=(yes,distance)=>(yes?'Yes':'No')+": estimate "+fmt(estimate)+", distance "+fmt(distance)+".";
  return mc("Leo says <b>"+a+" + "+b+" = "+fmt(shown)+"</b>. Is that reasonable? Choose the correct check.",line(ok,gap),
    [line(!ok,gap),line(ok,gap+100),line(!ok,gap+100)],
    "Estimate first: "+round100(a)+" + "+round100(b)+" = "+fmt(estimate)+". The exact answer is "+fmt(a+b)+". "+(ok?"Leo’s answer is close to the estimate, so it is reasonable.":"Leo’s answer is far from the estimate, so something went wrong."),EXP);
}

function frictionTableQ(){
  const d=barData().slice(0,4), min=d.reduce((p,c)=>c.v<p.v?c:p);
  return mc("Three trials gave these average distances. Which surface had the <b>most friction</b>?", min.label, d.filter(x=>x!==min).map(x=>x.label), "Most friction = shortest distance. "+min.label+" let the car roll only "+min.v+" cm.", Object.assign({visual:tableHTML(['Surface','Average distance'], d.map(x=>[x.label,x.v+' cm'])), grid:true}, CHA));
}

function travelData(){ const vals=shuffle([120,160,210,250,290,330,370,410,460]).slice(0,5); return DAYS.map((d,i)=>({label:d,v:vals[i]})); }

function travelTableQ(){
  const d=travelData(), least=rnd(2)===0, t=d.reduce((p,c)=>(least?c.v<p.v:c.v>p.v)?c:p);
  return mc("Travel for Work: on which day did the driver travel the <b>"+(least?"least":"most")+"</b>?", t.label, uniq([d[d.indexOf(t)===0?1:d.indexOf(t)-1].label,...d.filter(x=>x!==t).map(x=>x.label)]).slice(0,3), t.label+" has the "+(least?"smallest":"biggest")+" number: "+t.v+" km.", Object.assign({visual:tableHTML(['Day','Kilometres'], d.map(x=>[x.label,x.v+' km'])), grid:true}, DET));
}

function estimateTotalQ(){
  const d=travelData().slice(0,3), right=d.reduce((p,c)=>p+round100(c.v),0);
  return mc("About how many kilometres in these three days? Round each to the nearest hundred first.", fmt(right), numberMistakes(right,[right+100,right-100,right+200,right-200]).map(fmt), d.map(x=>round100(x.v)).join(" + ")+" = "+fmt(right)+". Exact: "+fmt(d.reduce((p,c)=>p+c.v,0))+" km.", Object.assign({visual:tableHTML(['Day','Kilometres'], d.map(x=>[x.label,x.v+' km'])), grid:true}, DET));
}

function betweenHundredsQ(){
  const n=randNotMid(), lo=Math.floor(n/100)*100, hi=lo+100;
  return mc("Between which two hundreds does <b>"+n+"</b> sit on the number line? Choose <b>neighbouring</b> hundreds.", lo+" and "+hi, [(lo-100)+" and "+lo, hi+" and "+(hi+100), lo+" and "+(hi+100)], n+" is bigger than "+lo+" and smaller than "+hi+".", Object.assign({grid:true}, DET));
}

function splitQ(){
  const sets=[["900 km over three days","300 + 300 + 300 = 900",["300 + 300 + 200 = 900","300 + 300 + 400 = 900","300 + 300 + 30 = 900"]],["600 stickers in two packs","250 + 350 = 600",["250 + 250 = 600","600 + 600 = 600","350 − 250 = 600"]],["1,000 metres in four laps","250 + 250 + 250 + 250 = 1,000",["250 + 250 + 250 + 240 = 1,000","250 + 250 + 250 + 350 = 1,000","250 + 250 + 250 + 25 = 1,000"]]];
  const r=pick(sets);
  return mc("Which equation correctly splits <b>"+r[0]+"</b>?", r[1], r[2], "Check: the addends must add up to the total.", DET);
}

function compareQ(){
  const a=1000+rnd(9000); let b; do { b=1000+rnd(9000); } while(b===a);
  const sym=a>b?'>':'<';
  return Object.assign({kind:'mc', prompt:"Which symbol makes this true? <b>"+fmt(a)+" ___ "+fmt(b)+"</b>", options:['>','<','='], answer:['>','<','='].indexOf(sym), grid3:true, visual:'',
    explain:fmt(a)+" is "+(a>b?"bigger":"smaller")+" than "+fmt(b)+", so "+fmt(a)+" "+sym+" "+fmt(b)+". The open side of the symbol faces the bigger number."}, DET);
}

function stickerComboQ(){
  const target=905, a=100+5*rnd(140), b=target-a, right=a+" + "+b;
  const wrongs=uniq([a+" + "+(b-5), (a+50)+" + "+b, a+" + "+(b+100), (a-5)+" + "+(b-5)]).filter(x=>x!==right).slice(0,3);
  return mc("Which sticker combination adds up to <b>905</b>?", right, wrongs, a+" + "+b+" = 905. Check every combination by adding.", Object.assign({grid:true}, STK));
}

function roundTenAddQ(){
  let nums; do { nums=[40+rnd(60), 60+rnd(80), 100+rnd(60)]; } while(nums.some(n=>n%10===5));
  const r=nums.map(round10), right=r.reduce((p,c)=>p+c,0);
  return mc("Round each number to the nearest <b>ten</b>, then add: <b>"+nums.join(" + ")+"</b> ≈ ?", fmt(right), numberMistakes(right,[right+10,right-10,right+20,right-20,right+100]).map(fmt), r.join(" + ")+" = "+right+". Exact: "+nums.reduce((p,c)=>p+c,0)+", so about "+right+" stickers is a good estimate.", Object.assign({grid:true}, STK));
}

function wpSetup(){
  const n=pick(NAMES), t=pick(THINGS), a=100+5*rnd(40), b=50+5*rnd(30), rest=100+5*rnd(60), total=a+b+rest;
  return {n:n,t:t,total:total,a:a,b:b,rest:rest,text:n+" has "+total+" "+t[0]+". "+a+" are "+t[1]+" and "+b+" are "+t[2]+". The rest are "+t[3]+"."};
}

function findTotalQ(){
  const s=wpSetup();
  return mc("Read carefully. Which number is the <b>total</b> number of "+s.t[0]+"?", String(s.total), [String(s.a),String(s.b),String(s.a+s.b)], "The total is the number of ALL the "+s.t[0]+": "+s.total+". The other numbers are only parts.", Object.assign({visual:quote(s.text), grid:true}, WPR));
}

function operationQ(){
  const n=pick(NAMES), start=300+10*rnd(30), plus=20+5*rnd(16), minus=10+5*rnd(10);
  const text=n+" had "+start+" stickers. Then "+n+" got "+plus+" more and gave "+minus+" away.";
  const right=start+" + "+plus+" − "+minus;
  return mc("Which calculation finds how many stickers "+n+" has now?", right, [start+" − "+plus+" − "+minus, start+" + "+plus+" + "+minus, plus+" − "+minus], "Got more = add. Gave away = subtract. "+right+" = "+(start+plus-minus)+".", Object.assign({visual:quote(text)}, WPR));
}

function calcCheckQ(){
  const a=2000+rnd(7000), b=1000+rnd(Math.min(4000,a-1100)), r=a-b;
  if(rnd(2)===0) return mc("You worked out <b>"+fmt(a)+" − "+fmt(b)+" = "+fmt(r)+"</b>. Which calculator keys check your answer?", r+" + "+b+" =", [r+" − "+b+" =", a+" + "+b+" =", b+" − "+r+" ="],
    "Adding undoes taking away: "+fmt(r)+" + "+fmt(b)+" must give "+fmt(a)+" again. If it does, your answer is right.", Object.assign({tip:"Which calculation undoes taking away? Start with your answer."}, WPR));
  const ok=rnd(2)===0, wrote=ok?r:r+pick([10,100,-10,-100]);
  return mc("You wrote <b>"+fmt(a)+" − "+fmt(b)+" = "+fmt(wrote)+"</b>. To check, you type <b>"+wrote+" + "+b+" =</b> and the calculator shows <b>"+fmt(wrote+b)+"</b>. What does that tell you?",
    ok?"The check matches the starting total; the answer is right.":"The check differs from the starting total; the answer is wrong.",
    ok?["The check differs from the starting total; the answer is right.","The check matches the starting total; the answer is wrong.","A close estimate alone proves that this exact answer is right."]:["The check matches the starting total; the answer is right.","The check differs from the starting total; the answer is right.","A close estimate alone proves that this exact answer is right."],
    ok?"The check gives "+fmt(a)+" again – the number you started with. So the answer is right.":"The check should give "+fmt(a)+", but it gives "+fmt(wrote+b)+". So something went wrong: the right answer is "+fmt(r)+".", Object.assign({tip:"A check must give back the number you started with. Compare the calculator number with it."}, WPR));
}

function arrayQ(){
  const r=2+rnd(4), c=3+rnd(4);
  return mc("Which multiplication fits the dots?", r+" × "+c, [r+" + "+c, r+" × "+(c+1), (r+1)+" × "+c],
    r+" rows with "+c+" dots in each row: "+r+" × "+c+" = "+(r*c)+".", Object.assign({visual:arraySVG(r,c), grid:true, tip:"Count the rows. Then count the dots in one row."}, TIM));
}

function shadedQ(){
  const n=pick([2,3,4,6,8]),k=1+rnd(n-1),right=k+"/"+n;
  const seen=new Set([k/n]),wrongs=[];
  for(const [top,bottom]of[[n-k,n],[n,k],[k,n-k],[1,n],[k+1,n],[k,n+1]]){
    const value=top/bottom;
    if(bottom>0&&!seen.has(value)){seen.add(value);wrongs.push(top+"/"+bottom);}
  }
  return mc("What fraction of the bar is coloured?",right,wrongs.slice(0,3),"The bar has "+n+" equal parts. "+k+" of them are coloured: "+right+".",Object.assign({visual:fracSVG(n,k),grid:true,tip:"Count all the equal parts first – that is the bottom number. Then count the coloured parts – the top number."},FRA));
}

function unitCompareQ(){
  const[a,b]=shuffle([2,3,4,8]).slice(0,2),lo=Math.min(a,b),hi=Math.max(a,b),denominators=[a,b,a+b,a+b+1];
  return mc("Which is bigger? Choose the <b>largest unit fraction</b>. All fractions use the same whole.","1/"+lo,denominators.filter(n=>n!==lo).map(n=>'1/'+n),
    "Cut the same bar into "+lo+" and into "+hi+" parts. Fewer parts means bigger pieces, so 1/"+lo+" is bigger.",Object.assign({visual:fracSVG(a,1)+fracSVG(b,1),tip:"Picture the same chocolate bar. Do you get a bigger piece when you share it with fewer or with more people?"},FRA));
}

function areaWhichQ(){
  const r=pick(AREA_WHICH),opts=['Area in square units','Perimeter in units','Volume in cubic units','Length of one side'];
  return two(r[0]+" Which measure do you need?",opts,r[1]==='Area'?0:1,r[1]==='Area'?"You cover the whole inside – that is the area.":"You go around the edge – that is the perimeter.",Object.assign({tip:"Around the edge = perimeter. Covering the inside = area."},ARE));
}

function laterQ(){
  const h=1+rnd(12), m=5*rnd(12), d=pick([10,15,20,30,45]), t=m+d, eh=(h+Math.floor(t/60)-1)%12+1, em=t%60, right=eh+":"+pad(em);
  const cands=uniq([h+":"+pad(em), eh+":"+pad((em+5)%60), (h%12+1)+":"+pad(m), h+":"+pad(d)]).filter(x=>x!==right).slice(0,3);
  return mc("It is <b>"+h+":"+pad(m)+"</b>. What time is it <b>"+d+" minutes later</b>?", right, cands, h+":"+pad(m)+" + "+d+" minutes = "+right+(eh!==h?" – the hour changes when you pass the full hour.":"."), Object.assign({visual:clockSVG(h,m,170), grid:true, tip:"Jump to the next full hour first if you pass it. Then add the minutes that are left."}, ELA));
}

function massUnitQ(){
  const r=pick(MASS_UNITS), opts=['g','kg','ml','l'];
  return two(r[0]+" Which unit is right?", opts, opts.indexOf(r[1]), "g and kg tell how heavy something is; ml and l tell how much fits inside. Small amounts: g or ml. Big amounts: kg or l.", Object.assign({tip:"Is it about how heavy it is (g, kg) or how much fits inside (ml, l)? Is it small or big?"}, MAS));
}

function kitchenScaleQ(){
  const mark=100*(1+2*rnd(5)), below=mark-100;
  return mc("The kitchen scale counts in grams. Only every second mark has a number. How heavy is the flour?", mark+" g", [(below+1)+" g", below+" g", (mark+100)+" g"],
    "From "+below+" to "+(below+200)+" there are two steps, so each step is 100 g. The arrow is one step after "+below+": "+mark+" g.", Object.assign({visual:scaleSVG(100,mark), grid:true, tip:"How many steps are between two numbers? How much is one step?"}, MAS));
}
return {clockRead,clockPick,ampm,numberLine,placeValue,expandedZeroQ,oddEven,mental,unitPickQ,convertQ,rulerQ,barData,barReadQ,barMissingQ,tableConclusionQ,scaleStepQ,lineGraphQ,massRecordQ,combosQ,anotherWayQ,reasonableQ,frictionTableQ,travelData,travelTableQ,estimateTotalQ,betweenHundredsQ,splitQ,compareQ,stickerComboQ,roundTenAddQ,wpSetup,findTotalQ,operationQ,calcCheckQ,arrayQ,shadedQ,unitCompareQ,areaWhichQ,laterQ,massUnitQ,kitchenScaleQ};
}
