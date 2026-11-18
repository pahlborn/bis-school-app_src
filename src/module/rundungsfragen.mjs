// Rounding Road questions. Dependencies are the existing app helpers; no storage or screen changes.
// The factory is used by both the built app and deterministic Node tests.
// Each candidate has a teaching reason: the other neighbour, the wrong rounding
// place, or a skipped interval. Selection is deterministic, not lucky sampling.
export function roundingWrongs(n,step){
  const lo=Math.floor(n/step)*step, hi=lo+step, right=Math.round(n/step)*step;
  const candidates=[right===lo?hi:lo, Math.round(n/(step/10))*(step/10), right===lo?lo-step:hi+step, right+step, right-step, right+2*step, right+3*step];
  return [...new Set(candidates)].filter(x=>x>=0 && x!==right).slice(0,3);
}

// Wrong 1 rounds one addend in the opposite direction (one interval out).
// Wrong 2 rounds the sum instead of each addend, where that changes the answer.
// Wrong 3 keeps the exact sum instead of estimating. Collisions fall back to
// another single-addend error, then two intervals out; never a second answer.
export function estimateWrongs(nums){
  const rounded=nums.map(n=>Math.round(n/100)*100), right=rounded.reduce((a,b)=>a+b,0);
  const exact=nums.reduce((a,b)=>a+b,0), direction=rounded[0]>nums[0]?-100:100;
  return [...new Set([right+direction,Math.round(exact/100)*100,exact,right-direction,right+2*direction])].filter(x=>x>=0 && x!==right).slice(0,3);
}

// The same sentence form makes children compare the distances and conclusion.
// First near miss: the two distances are assigned to the wrong neighbours.
// Second: the distances are right but the farther neighbour is selected.
// Third: a neighbouring interval is skipped. No joke or filler is needed.
export function roundingReasonChoices(n,step){
  const lo=Math.floor(n/step)*step, hi=lo+step, d1=n-lo, d2=hi-n;
  const right=Math.round(n/step)*step, far=right===lo?hi:lo;
  if(d1===d2) return {
    right:`${n} is halfway between ${lo} and ${hi}; choose the higher multiple ${hi}.`,
    wrongs:[`${n} is halfway between ${lo} and ${hi}; choose the lower multiple ${lo}.`,`${n} is halfway between ${lo} and ${hi}; keep the halfway number ${n}.`,`${n} is halfway between ${lo} and ${hi}; skip the higher multiple ${hi+step}.`]
  };
  const line=(a,b,result)=>`${n} is ${a} from ${lo} and ${b} from ${hi}, so ${result} is nearer.`;
  return {right:line(d1,d2,right),wrongs:[line(d2,d1,far),line(d1,d2,far),line(d1,d2,hi+step)]};
}

export function createRoundingQuestions({rnd,pick,shuffle,uniq,fmt,round10,round100,mc,two,fill3,benchLineSVG,randNotMid,retag,bankMC,RND,EXP}){
function nearestHundredQ(tag){
  const n=randNotMid(), lo=Math.floor(n/100)*100, hi=lo+100, near=(n-lo<50)?lo:hi;
  return two("Which hundred is <b>closest</b> to <b>"+n+"</b>?", [String(lo),String(hi)], near===lo?0:1,
    n+" sits between "+lo+" and "+hi+". It is "+(n-lo)+" away from "+lo+" and "+(hi-n)+" away from "+hi+", so the nearest hundred is "+near+".",
    Object.assign({visual:benchLineSVG(n,lo,hi), coach:{family:'round', n:n, step:100}}, tag||RND));
}
function benchmarkQ(){
  const n=randNotMid(), lo=Math.floor(n/100)*100, hi=lo+100, less=rnd(2)===0;
  const right=less?lo:hi;
  const wrongs=fill3(right,[less?hi:lo, lo-100, hi+100, round10(n)]);
  return mc("Which benchmark hundred is just <b>"+(less?"less than":"greater than")+"</b> <b>"+n+"</b>?", String(right), wrongs.map(String),
    "The hundreds around "+n+" are "+lo+" (less) and "+hi+" (greater).", Object.assign({grid:true, coach:{family:'benchmark', n:n, step:100, less:less}}, RND));
}
function roundWordQ(){
  const n=randNotMid(), lo=Math.floor(n/100)*100, hi=lo+100, near=(n-lo<50)?lo:hi;
  const wrongs=roundingWrongs(n,100);
  return mc("Round <b>"+n+"</b> to the nearest hundred.", String(near), wrongs.map(String),
    n+" is between "+lo+" and "+hi+". Compare its distances from the two hundreds, or use the halfway point "+(lo+50)+".", Object.assign({grid:true, coach:{family:'round', n:n, step:100}}, RND));
}
/* Gap from the school standards (01.11.): round to the nearest 1,000 - same model as for 10 and 100
   (neighbouring thousands, halfway point 500). */
function roundThousandQ(){
  let n; do { n=1000+rnd(8000); } while(n%1000===0 || n%1000===500);
  const lo=Math.floor(n/1000)*1000, hi=lo+1000, near=(n-lo<500)?lo:hi;
  const wrongs=roundingWrongs(n,1000);
  return mc("Round <b>"+fmt(n)+"</b> to the nearest thousand.", fmt(near), wrongs.map(fmt),
    fmt(n)+" is between "+fmt(lo)+" and "+fmt(hi)+". The halfway point is "+fmt(lo+500)+". "+fmt(n)+" comes "+(near===lo?"before":"after")+" it, so it rounds to "+fmt(near)+".",
    Object.assign({grid:true, coach:{family:'round', n:n, step:1000}}, RND));
}
function addendsQ(){
  const target=pick([100,100,200,500,500,1000,300]);
  const a=10*(1+rnd(target/10-1)), b=target-a;
  const right=a+" + "+b;
  const bad=[[a+10,b],[a,b+10],[a-10,b],[a+100,b],[a+1,b],[a,b-1]].filter(p=>p[0]>0&&p[1]>0).map(p=>p[0]+" + "+p[1]);
  return mc("Which two addends make <b>"+fmt(target)+"</b>?", right, shuffle(uniq(bad).filter(x=>x!==right)).slice(0,3),
    a+" + "+b+" = "+target+". Addends are the numbers you add together.", Object.assign({grid:true}, RND));
}
function estimateQ(){
  const a=randNotMid(), b=randNotMid();
  const ra=round100(a), rb=round100(b), right=ra+rb;
  const wrongs=estimateWrongs([a,b]);
  return mc("Round each number to the nearest hundred, then add. About how much is <b>"+a+" + "+b+"</b>?", fmt(right), wrongs.map(fmt),
    a+" is about "+ra+" and "+b+" is about "+rb+". "+ra+" + "+rb+" = "+fmt(right)+". The exact answer is "+fmt(a+b)+", so the estimate is close!", Object.assign({grid:true}, RND));
}
function threeAddendsQ(){
  const nums=[randNotMid(),randNotMid(),randNotMid()];
  const rounded=nums.map(round100), right=rounded.reduce((p,c)=>p+c,0);
  const wrongs=estimateWrongs(nums);
  return mc("Travel for Work: estimate <b>"+nums.join(" + ")+"</b> by rounding each number to the nearest hundred.", fmt(right), wrongs.map(fmt),
    rounded.join(" + ")+" = "+fmt(right)+". Rounding first makes big sums quick to estimate.", Object.assign({grid:true}, RND));
}
const ROUND_MC=[
 ["Why do we round numbers before adding?","To estimate quickly and check the real answer",["To find the exact total without adding the original numbers","To make the exact total equal to the rounded total","To round the total after adding the original numbers"],"Rounding gives a quick estimate, not an exact total. If the real answer is far away from it, check again."],
 ["Round 347 to the nearest hundred. How do you decide?","Find the halfway point 350: 347 is before it, so 300",["Find the halfway point 350: 347 is before it, so 400","Find the halfway point 350: 347 is after it, so 400","Find the neighbouring tens 340 and 350, so use 350"],"300 and 400 are the neighbouring hundreds. The halfway point is 350. 347 comes before 350, so it is closer to 300."],
 ["What are the two benchmark hundreds around 470?","400 and 500",["400 and 600","470 and 480","450 and 550"],"400 is just below 470. 500 is just above; they are consecutive multiples of 100."],
 ["Which number rounds to 600?","582",["549","651","509"],"582 is close to 600. Only 18 away. 549 is just below the halfway point 550, so it rounds to 500."],
 ["Which number is exactly halfway between 300 and 400?","350",["349","360","305"],"300 and 400 are 100 apart. Half of 100 is 50, so halfway is 350. At halfway we round to the higher hundred."]
];

function distanceExplainQ(){
  const n=randNotMid(), lo=Math.floor(n/100)*100, hi=lo+100;
  const {right,wrongs}=roundingReasonChoices(n,100);
  return mc("Which explanation shows <b>how you know</b> which hundred is closest to "+n+"?", right, wrongs, "Explain with distances: count how far the number is from each hundred, then pick the smaller distance. The halfway point "+(lo+50)+" helps too.", Object.assign({visual:benchLineSVG(n,lo,hi), coach:{family:'round-explain', n:n, step:100}}, EXP));
}
function halfwayQ(){
  const lo=100*(1+rnd(8)), hi=lo+100;
  if(rnd(2)===0) return mc("What is the <b>halfway point</b> between "+lo+" and "+hi+"?", String(lo+50), fill3(lo+50,[lo+40,lo+60,lo+5,hi+50]).map(String), lo+" and "+hi+" are 100 apart. Half of 100 is 50, so halfway is "+(lo+50)+".", Object.assign({grid:true}, EXP));
  const n=lo+pick([10,20,30,40,60,70,80,90]);
  return mc(n+" is between "+lo+" and "+hi+". The halfway point is "+(lo+50)+". Round "+n+" to the nearest hundred.",String(n<lo+50?lo:hi),[String(n<lo+50?hi:lo),String(n),String(lo+50)],
    n+" is "+(n<lo+50?"below":"above")+" the halfway point "+(lo+50)+", so it rounds "+(n<lo+50?"down to "+lo:"up to "+hi)+".",Object.assign({visual:benchLineSVG(n,lo,hi)},EXP));
}
function tenVsHundredQ(){
  let a,b,tens,hund,exact;
  // Equal distances would make BOTH answers true for "closer" (348 + 357).
  do { a=randNotMid(); b=randNotMid(); exact=a+b; tens=round10(a)+round10(b); hund=round100(a)+round100(b); } while(tens===hund || Math.abs(tens-exact)===Math.abs(hund-exact) || a%10===5 || b%10===5);
  const tensCloser=Math.abs(tens-exact)<=Math.abs(hund-exact);
  const optT="Nearest ten: "+round10(a)+" + "+round10(b)+" = "+fmt(tens), optH="Nearest hundred: "+round100(a)+" + "+round100(b)+" = "+fmt(hund);
  return two("Which estimate is <b>closer</b> to the exact answer of <b>"+a+" + "+b+"</b>?", [optT,optH], tensCloser?0:1,
    "Exact: "+fmt(exact)+". The nearest-ten estimate is "+Math.abs(tens-exact)+" away, the nearest-hundred estimate is "+Math.abs(hund-exact)+" away. Rounding to tens is usually closer, rounding to hundreds is quicker.", EXP);
}
function roundTenQ(){
  let n; do { n=randNotMid(); } while(n%10===0||n%10===5);
  const right=round10(n);
  return mc("Round <b>"+n+"</b> to the nearest <b>ten</b>.", String(right), roundingWrongs(n,10).map(String),
    "Compare the distances to the neighbouring tens. At halfway, choose the higher ten.", Object.assign({grid:true, coach:{family:'round', n:n, step:10}}, EXP));
}
  return {nearestHundredQ,benchmarkQ,roundWordQ,roundThousandQ,addendsQ,estimateQ,threeAddendsQ,distanceExplainQ,halfwayQ,tenVsHundredQ,roundTenQ,ROUND_MC};
}
