// Finite input/behaviour classes for the actual EP01 generators. This helper is
// also run by the standalone audit; inventories alone never prove quality.
import assert from'node:assert/strict';
import{createNumberQuestions,AMPM,SURF,DAYS5,DAYS,COMBO_SETS,AREA_WHICH,MASS_UNITS}from'../../src/module/zahlenfragen.mjs';
import{createLanguageQuestions,VARCTRL,SENT,SOURCES,PACK,SENTS,ENDS,TRENNBAR,ZUSAMMEN,OREO_PARTS}from'../../src/module/sprachfragen.mjs';
import{createRoundingQuestions}from'../../src/module/rundungsfragen.mjs';
import{text}from'../app-sandbox.mjs';
const mathNames='Math rnd pick shuffle uniq fmt round10 round100 mc two typed fill3 pad timeWords clockSVG numberLineSVG quote itemCard tableHTML barChartSVG rulerSVG scaleSVG lineSVG arraySVG fracSVG randNotMid takeFrom NUM UNT GRA EXP CHA DET STK WPR TIM FRA ARE ELA MAS NAMES THINGS'.split(' ');
const langNames='rnd pick shuffle uniq mc two bankMC quote itemCard stripP FOR WRD LIB TRIP SEN ANL OREO_MC OPFACT INFER SPECIFIC SPECIFIC_EXPLAIN'.split(' ');
const roundNames='rnd pick shuffle uniq fmt round10 round100 mc two fill3 benchLineSVG randNotMid retag bankMC RND EXP'.split(' ');
const num=s=>Number(text(s).replaceAll(',','').replace('−','-'));
const round=(n,step)=>{const lo=n-n%step;return n-lo<step/2?lo:lo+step;};
const pickSum=s=>{const lhs=text(s).split('=')[0].replaceAll(',','').trim();assert.match(lhs,/^[\d\s+−-]+$/,'supported exact expression grammar');let total=0,sign=1;for(const t of lhs.match(/\d+|[+−-]/g)||[]){if(t==='+')sign=1;else if(t==='−'||t==='-')sign=-1;else total+=sign*Number(t);}return total;};
const perms=(a,n=a.length)=>n===0?[[]]:a.flatMap((x,i)=>perms(a.filter((_,j)=>j!==i),n-1).map(rest=>[x,...rest]));
const combinations=(a,n)=>n===0?[[]]:a.flatMap((x,i)=>combinations(a.slice(i+1),n-1).map(rest=>[x,...rest]));
function clockValue(s){
  s=text(s);let m;if((m=/^(\d+):(\d\d)$/.exec(s)))return (+m[1]%12)*60+ +m[2];
  if((m=/^(\d+) o’clock$/.exec(s)))return(+m[1]%12)*60;
  if((m=/^(quarter|half|five|ten|twenty|twenty-five) (past|to) (\d+)$/.exec(s))){const amount={quarter:15,half:30,five:5,ten:10,twenty:20,'twenty-five':25}[m[1]];return((+m[3]%12)*60+(m[2]==='past'?amount:-amount)+720)%720;}
  throw Error('unrecognised clock answer '+s);
}
function svgTime(svg){
  const hand=width=>{const m=new RegExp('<line x1="100" y1="100" x2="([\\d.]+)" y2="([\\d.]+)"[^>]*stroke-width="'+width+'"').exec(svg);assert.ok(m,'actual clock hand');return(Math.atan2(+m[1]-100,100- +m[2])*180/Math.PI+360)%360;};
  const minute=Math.round(hand(5)/6)%60,hour=Math.round((hand(7)-minute*.5)/30+12)%12;return hour*60+minute;
}
export function generatorCases(S){
  const collections={},domains={},checked=new Set(),failures=[],inputCounts={},responseClasses=new Map();
  const env=names=>Object.fromEntries(names.map(n=>[n,S.holen(n)]));
  const M=env(mathNames),L=env(langNames),R=env(roundNames);
  function controls(draw=[],choices=[],extra={}){let d=0,p=0;return{rnd:range=>{const value=draw[d++]??0;assert.ok(value>=0&&value<range,`invalid finite draw ${value}/${range}`);return value;},pick:a=>a[choices[p++]??0],shuffle:a=>a.slice(),takeFrom:(a,n)=>a.slice(0,n),...extra};}
  const math=(name,draw=[],choices=[],extra={})=>createNumberQuestions({...M,...controls(draw,choices,extra)})[name]();
  const lang=(name,draw=[],choices=[],extra={})=>createLanguageQuestions({...L,...controls(draw,choices,extra)})[name]();
  function put(name,q,predicate,domain,responseClass){
    inputCounts[name]=(inputCounts[name]||0)+1;
    assert.equal(q.kind,'mc',name);assert.ok(q.options.length>=2,name);assert.equal(new Set(q.options).size,q.options.length,name+': duplicate strings');
    assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,name);
    if(predicate){const correct=q.options.map(predicate).flatMap((yes,i)=>yes?[i]:[]);if(correct.length!==1||correct[0]!==q.answer)failures.push(name+': '+text(q.prompt)+' | '+q.options.join(' | ')+' | independently correct='+Array.from(correct).join(',')+', app='+q.answer);}
    const canonical=JSON.stringify([[...q.options].sort(),q.options[q.answer]]),classKey=name+'/'+responseClass;
    if(responseClass!==undefined&&responseClasses.has(classKey))assert.equal(canonical,responseClasses.get(classKey),'response class must have exactly the same visible alternatives and solution');
    else{(collections[name]??=[]).push({options:[...q.options],answer:q.answer});if(responseClass!==undefined)responseClasses.set(classKey,canonical);}
    checked.add(name.split('/')[0]);if(domain)domains[name]=domain;
    return q;
  }
  const integer=(name,q,want,domain)=>put(name,q,o=>num(o)===want,domain);
  // Full 12-hour/5-minute domain, both available textual formats. SVG hands
  // are decoded geometrically, rather than trusting the answer index/renderer.
  for(let h=1;h<=12;h++)for(let m=0;m<60;m+=5)for(const words of[false,true]){
    const q=math('clockRead',[h-1,m/5],[],{Math:Object.assign(Object.create(M.Math),{random:()=>words?0:.99})});
    put('clockRead',q,o=>clockValue(o)===(h%12)*60+m,'12 hours × 12 minute positions × both format branches');
  }
  const clockMinutes=[0,15,30,45,0,15,30,45,10,20,40,50];
  for(let h=1;h<=12;h++)for(let i=0;i<clockMinutes.length;i++)put('clockPick',math('clockPick',[h-1],[i]),o=>svgTime(o)===(h%12)*60+clockMinutes[i],'all 144 source hour/minute-choice cases');
  for(let i=0;i<AMPM.length;i++){const match=AMPM[i][0].match(/\d+:\d\d/)[0],want=match+' '+AMPM[i][1];put('ampm',math('ampm',[],[i]),o=>o===want,'all 12 canonical situations, including noon/bedtime');}
  const jumps=[[10,10,5],[10,10,10],[20,5],[10,5,1],[-10,-10],[-10,-5],[-20,-3],[30,2],[10,10,-5],[-10,-10,-5],[20,20,1]];
  for(let j=0;j<jumps.length;j++){const delta=jumps[j].reduce((a,b)=>a+b),limit=delta<0?55:60;for(let n=0;n<limit;n++)integer('numberLine',math('numberLine',[n],[j]),(delta<0?40:11)+n+delta,'all 11 jump sequences and every permitted start');}
  for(let n=1000;n<10000;n++)for(let pos=0;pos<4;pos++){
    const digits=String(n),digit=digits[pos],valid=[0,1,2,3].filter(i=>digits[i]!=='0'&&digits.split(digits[i]).length===2);
    if(!valid.includes(pos))continue;
    integer('placeValue/value',math('placeValue',[0,n-1000],[valid.indexOf(pos)]),Number(digit)*10**(3-pos),'every 4-digit number and each permitted unique nonzero digit');
  }
  // Compare behaviour classes: the base and >=2 other choices are four-digit
  // numbers (even after duplicate fallback); all order/equality and digit-width
  // transitions are represented. The maximum therefore ties >=3 ways per case.
  for(const base of[1500,1899,1900,1999,2000,7999,8000,8499])for(const up of[1,9,10,11,99,100,899,900])for(const down of[1,499,500,899,900])for(const sign of[0,1])for(const big of[0,1]){
    const q=math('placeValue',[1,base-1500,up-1,down-1,sign,big]);
    const vals=q.options.map(num),want=big===0?Math.max(...vals):Math.min(...vals);
    integer('placeValue/compare',q,want,'all ordering/collision/digit-width classes; 3 four-digit choices prove pointwise length bound');
    assert.ok(vals.filter(v=>v>=1000&&v<10000).length>=3);
  }
  for(let n=1000;n<10000;n++){const d=String(n).split('').map(Number);integer('placeValue/compose',math('placeValue',[2,d[0]-1,...d.slice(1)]),n,'all 9000 four-digit combinations');}
  for(let n=1000;n<9500;n++)for(let delta=0;delta<6;delta++){const change=[100,-100,10,-10,1000,-1000][delta];integer('placeValue/change',math('placeValue',[3,n-1000],[delta]),n+change,'all 8500 bases × 6 place changes, including zero and five-digit carry');}
  for(const z of[1,2])for(let a=1;a<=9;a++)for(let b=1;b<=9;b++)for(let c=1;c<=9;c++){
    const digits=z===1?[a,0,b,c]:[a,b,0,c],n=Number(digits.join('')),draw=[z-1,...digits.map(x=>(x||1)-1),1];
    put('expandedZeroQ',math('expandedZeroQ',draw),o=>pickSum(o)===n,'all 1458 zero-placeholder MC states');
    const typed=math('expandedZeroQ',[...draw.slice(0,-1),0]);assert.equal(Number(typed.answer),n);
  }
  // Every possible source n, with a balanced representative of the other two
  // ignored random draws; the branch identity affects no returned field.
  for(let n=10;n<10000;n++){const slot=n<100?0:n<1000?1:2,draw=[0,0,0];draw[slot]=n-[10,100,1000][slot];const q=math('oddEven',draw,[slot]);put('oddEven',q,o=>num(o)%2===n%2,'all 9990 n values; the four numbers are genuine opposite-parity near misses');}
  const as=[120,150,230,260,340,410,450,520,610,730],bs=[110,150,200,250,300,340,380,420];
  for(let ai=0;ai<as.length;ai++)for(let bi=0;bi<bs.length;bi++)for(let x=0;x<5;x++)for(let y=0;y<5;y++)for(let op=0;op<2;op++){const a=as[ai]+10*x,b=bs[bi]+10*y;integer('mental',math('mental',[x,y,op],[ai,bi]),op===0?a+b:Math.abs(a-b),'all 4000 source arithmetic cases, including zero');}
  const units=[['cm',40,180],['g',60,160],['m',1,2],['m',2,2],['cm',12,19],['kg',1,2],['ml',300,750]];
  for(let i=0;i<units.length;i++)for(let n=units[i][1];n<=units[i][2];n++){const q=put('unitPickQ',math('unitPickQ',[n-units[i][1]],[i]),o=>o===units[i][0],'every item/value pair; same-quantity unit mismatch always retained');const pair={cm:'m',m:'cm',g:'kg',kg:'g',ml:'l',l:'ml'}[units[i][0]];assert.ok(q.options.includes(pair));}
  integer('convertQ/cm',math('convertQ',[0]),100,'single definition 1m=100cm');
  for(let m=2;m<=5;m++)integer('convertQ/metres',math('convertQ',[1,m-2]),100*m,'all 4 metre values');
  for(let i=0;i<38;i++){let cm=105+5*i;if(cm%100===0)cm+=5;put('convertQ/mixed',math('convertQ',[2,i]),o=>{const m=/^(\d+) m (\d+) cm$/.exec(o);return m&&100* +m[1]+ +m[2]===cm;},'all 38 source mixed-unit cases, numeric-equivalence oracle');}
  for(let i=0;i<6;i++)put('convertQ/compare',math('convertQ',[3,i]),o=>o==='1 m','all 70–95cm comparisons; the cm alternative is the close unit-conversion error');
  for(let i=0;i<17;i++)put('rulerQ',math('rulerQ',[i]),o=>o===(15+5*i)+' cm','all 17 half-ten marks');
  // Surface labels are independent of scalar distances. For label questions,
  // only the target rank matters: all label permutations and all target slots.
  const baseVals=[30,60,90,120];
  for(const names of perms(SURF,4))for(let slot=0;slot<4;slot++)for(const v of[0,1]){
    const vals=v===0?[30,60,90]:[60,90,120];vals.splice(slot,0,v===0?120:30);
    const extra={takeFrom:(a,n)=>names.slice(0,n),shuffle:a=>typeof a[0]==='number'?[...vals,...a.filter(x=>!vals.includes(x))]:a.slice()};
    put('barReadQ/label',math('barReadQ',[v],[],extra),o=>o===names[slot],'all 360 label tuples × 4 target positions × min/max; scalar ranks are the complete invariant');
    if(v===1)put('frictionTableQ',math('frictionTableQ',[],[],extra),o=>o===names[slot],'same full label/min-position domain; shortest-distance friction model');
  }
  const barValues=[30,45,60,75,90,105,120,135,150,165];
  for(const value of barValues)for(let slot=0;slot<4;slot++){
    const vals=barValues.filter(x=>x!==value).slice(0,3);vals.splice(slot,0,value);
    put('barReadQ/value',math('barReadQ',[2],[slot],{shuffle:a=>typeof a[0]==='number'?[...vals,...a.filter(x=>!vals.includes(x))]:a.slice()}),o=>o===value+' cm','all 10 possible values and 4 row positions; labels only identify the row');
  }
  for(let missing=0;missing<4;missing++)put('barMissingQ',math('barMissingQ',[],[missing]),o=>o===['The title','The surface names under the bars','The numbers on the side (the scale)','Nothing, it is complete'][missing],'all 4 actual missing-element branches');
  for(const names of perms(SURF,3))for(const vals of perms([30,60,90])){
    const min=vals.indexOf(30),max=vals.indexOf(90),extra={takeFrom:()=>[...names,'Unused'],shuffle:a=>typeof a[0]==='number'?[...vals,120,...a.filter(x=>![...vals,120].includes(x))]:a.slice()};
    put('tableConclusionQ',math('tableConclusionQ',[],[],extra),o=>o===names[min]+' has most friction because its distance is the smallest.','all 120 ordered label triples × 6 rank permutations');
    assert.notEqual(min,max);
  }
  for(let st=0;st<3;st++)for(let i=0;i<5;i++)integer('scaleStepQ',math('scaleStepQ',[i],[st]),[2,5,10][st]*(1+2*i),'all 15 unlabeled-mark states');
  // 5^5 temperature tuples is small; reject only the original non-unique extrema.
  for(let code=0;code<3125;code++){let k=code;const draws=[];for(let i=0;i<5;i++){draws.push(k%5);k=Math.floor(k/5);}const vals=draws.map(x=>5*(2+x)),min=Math.min(...vals),max=Math.max(...vals);if(vals.filter(x=>x===min).length>1||vals.filter(x=>x===max).length>1)continue;
    for(let kind=0;kind<3;kind++){
      if(kind<2)put('lineGraphQ/day',math('lineGraphQ',[...draws,kind]),o=>o===DAYS5[vals.indexOf(kind===0?max:min)],'every attainable temperature vector with unique max/min, both day queries');
      else for(let day=0;day<5;day++)put('lineGraphQ/value',math('lineGraphQ',[...draws,kind],[day]),o=>o===vals[day]+' °C','all values at all five day positions in every valid vector');
    }
  }
  for(let i=0;i<110;i++)put('massRecordQ',math('massRecordQ',[i]),o=>o===(55+i)+' g','all 110 masses; omitted/wrong units remain distinct false responses');
  for(let ti=0;ti<3;ti++)for(let si=0;si<2;si++){const target=[900,600,1000][ti];put('combosQ',math('combosQ',[],[ti,si]),o=>{const lines=o.split('<br>');return lines.length===3&&new Set(lines).size===3&&lines.every(x=>pickSum(x)===target);},'all 6 original combination sets; three different correct sums required');}
  for(let i=0;i<3;i++){const target=[900,600,1000][i],first=['300 + 300 + 300','200 + 200 + 200','500 + 500'][i];put('anotherWayQ',math('anotherWayQ',[],[i]),o=>pickSum(o)===target&&o!==first,'all 3 sets: equal total AND different decomposition');}
  const roundingDomain=Array.from({length:799},(_,i)=>101+i).filter(n=>n%100!==0&&n%100!==50),states=new Map();
  for(const a of roundingDomain)for(const b of roundingDomain){const estimate=round(a,100)+round(b,100),sum=a+b,key=estimate+'/'+sum;if(!states.has(key))states.set(key,{a,b,estimate,sum});}
  for(const {a,b,estimate,sum}of states.values())for(const offset of[0,1000,-200,500,300]){
    let i=0;const q=math('reasonableQ',[offset===0?0:1],[Math.max(0,[1000,-200,500,300].indexOf(offset))],{randNotMid:()=>[a,b][i++]});
    const gap=Math.abs(sum+offset-estimate);assert.equal(gap<100,offset===0);
    put('reasonableQ',q,o=>{const m=/^(Yes|No): estimate ([\d,]+), distance ([\d,]+)\.$/.exec(o);return m&&num(m[2])===estimate&&num(m[3])===gap&&(m[1]==='Yes')===(gap<100);},'all exact-sum/rounded-sum states attained by 784² source pairs × five shown-total classes');
  }
  const travelVals=[120,160,210,250,290,330,370,410,460];
  for(let slot=0;slot<5;slot++)for(const least of[true,false]){const vals=least?[160,210,250,290]:[120,160,210,250];vals.splice(slot,0,least?120:290);const q=put('travelTableQ',math('travelTableQ',[least?0:1],[],{shuffle:a=>[...vals,...a.filter(x=>!vals.includes(x))]}),o=>o===DAYS[slot],'all 5 target row positions × min/max; non-target ranks cannot change the answer');assert.ok(q.options.includes(DAYS[slot===0?1:slot-1]),'adjacent-row misconception must remain available');}
  for(const triple of combinations(travelVals,3)){const rest=travelVals.filter(x=>!triple.includes(x)),q=math('estimateTotalQ',[],[],{shuffle:()=>[...triple,...rest]});integer('estimateTotalQ',q,triple.reduce((a,b)=>a+round(b,100),0),'all 84 distinct value triples; addition/answer choices are permutation invariant');}
  for(const n of roundingDomain)put('betweenHundredsQ',math('betweenHundredsQ',[],[],{randNotMid:()=>n}),o=>{const [lo,hi]=o.split(' and ').map(Number);return hi-lo===100&&lo<n&&n<hi;},'all 784 source n; consecutive bounds, not merely a containing interval');
  for(let i=0;i<3;i++)put('splitQ',math('splitQ',[],[i]),o=>pickSum(o)===[900,600,1000][i],'all 3 decompositions with independent sum arithmetic');
  for(const a of[1000,1001,9998,9999])for(const b of[1000,1001,9998,9999])if(a!==b)put('compareQ',math('compareQ',[a-1000,b-1000]),o=>o===(a>b?'>':'<'),'strict greater/less classes and both four-digit boundaries; integer ordering proof');
  for(let i=0;i<140;i++)put('stickerComboQ',math('stickerComboQ',[i]),o=>pickSum(o)===905,'all 140 first-addend values');
  const possible=[[],[],[]];for(let slot=0;slot<3;slot++){const base=[40,60,100][slot],limit=[60,80,60][slot],map=new Map();for(let n=base;n<base+limit;n++)if(n%10!==5&&!map.has(round(n,10)))map.set(round(n,10),n);possible[slot]=[...map.values()];}
  const sums=new Map();for(const a of possible[0])for(const b of possible[1])for(const c of possible[2]){const sum=round(a,10)+round(b,10)+round(c,10);if(!sums.has(sum))sums.set(sum,[a,b,c]);}
  for(const [sum,nums]of sums)integer('roundTenAddQ',math('roundTenAddQ',nums.map((n,i)=>n-[40,60,100][i])),sum,'all attained rounded-sum states; options depend ONLY on the sum. Every 1D rounding class is represented');
  for(const a of[100,195,200,295])for(const b of[50,95,100,195])for(const rest of[100,105,395])integer('findTotalQ',math('findTotalQ',[(a-100)/5,(b-50)/5,(rest-100)/5]),a+b+rest,'all response-width/equality classes: total,a,a+b always 3 digits; b is 2/3 digits; a=b collision. Positive remainder proof');
  for(const start of[300,590])for(const plus of[20,50,95])for(const minus of[10,30,55])put('operationQ',math('operationQ',[(start-300)/10,(plus-20)/5,(minus-10)/5]),o=>pickSum(o)===start+plus-minus,'3-digit start, positive 2-digit changes: wrong results differ by 2×plus,2×minus or start; boundary representatives');
  for(const a of[2000,2100,2999,3000,5000,8999]){const limit=Math.min(4000,a-1100),maxB=1000+limit-1;for(const b of new Set([1000,maxB,a-999,a-1000]))if(b>=1000&&b<=maxB){
    const r=a-b;put('calcCheckQ/keys',math('calcCheckQ',[a-2000,b-1000,0]),o=>pickSum(o)===a,'3/4-digit result classes, 4-digit operands; inverse-operation proof and boundary representatives');
    for(const offset of[0,10,100,-10,-100])put('calcCheckQ/verdict',math('calcCheckQ',[a-2000,b-1000,1,offset===0?0:1],[Math.max(0,[10,100,-10,-100].indexOf(offset))]),o=>o.includes('matches')===(offset===0)&&/answer is right/.test(o)===(offset===0),'two equally probable visible-response classes (match/differ); all four error offsets and every result-width/boundary class independently checked',offset===0?'matches':'differs');
  }}
  for(let r=2;r<=5;r++)for(let c=3;c<=6;c++)put('arrayQ',math('arrayQ',[r-2,c-3]),o=>{const parts=o.split(' × ');return parts.length===2&&+parts[0]===r&&+parts[1]===c;},'all 16 row/column arrays; one-off count and addition errors');
  for(let ni=0;ni<5;ni++)for(let k=1;k<[2,3,4,6,8][ni];k++){const n=[2,3,4,6,8][ni],q=put('shadedQ',math('shadedQ',[k-1],[ni]),o=>{const[a,b]=o.split('/').map(Number);return a*n===b*k;},'all 18 bar fractions; cross-multiply every option pair to reject equivalent false choices');for(let i=0;i<q.options.length;i++)for(let j=0;j<i;j++){const[a,b]=q.options[i].split('/').map(Number),[c,d]=q.options[j].split('/').map(Number);assert.notEqual(a*d,c*b);}}
  for(const pair of perms([2,3,4,8],2)){const [a,b]=pair;put('unitCompareQ',math('unitCompareQ',[],[],{shuffle:()=>[...pair,...[2,3,4,8].filter(n=>!pair.includes(n))]}),o=>o==='1/'+Math.min(a,b),'all 12 ordered original denominator pairs; two additional genuine smaller unit fractions');}
  for(let i=0;i<AREA_WHICH.length;i++)put('areaWhichQ',math('areaWhichQ',[],[i]),o=>o===(AREA_WHICH[i][1]==='Area'?'Area in square units':'Perimeter in units'),'all 6 canonical inside/edge situations; genuine volume/one-side alternatives');
  for(let h=1;h<=12;h++)for(let m=0;m<60;m+=5)for(let di=0;di<5;di++){const d=[10,15,20,30,45][di],want=((h%12)*60+m+d)%720;put('laterQ',math('laterQ',[h-1,m/5],[di]),o=>clockValue(o)===want,'all 720 hour/minute/duration combinations, including 12→1 and minute carry');}
  for(let i=0;i<MASS_UNITS.length;i++)put('massUnitQ',math('massUnitQ',[],[i]),o=>o===MASS_UNITS[i][1],'all 8 original quantity/unit situations');
  for(let i=0;i<5;i++)put('kitchenScaleQ',math('kitchenScaleQ',[i]),o=>o===100*(1+2*i)+' g','all 5 unlabeled gram marks');
  // Language/source wrappers are measured in the real factory path, not accepted
  // merely because the underlying static bank has passed.
  for(let i=0;i<VARCTRL.length;i++)put('varCtrlQ',lang('varCtrlQ',[],[i]),o=>o===VARCTRL[i][1],'all 6 experimental roles; original variable/control distinction retained');
  const oreo=S.holen('OREO_MC');for(let i=0;i<oreo.length;i++)if(oreo[i][4]>1)put('oreoMC',lang('oreoMC',[],[i]),o=>o===oreo[i][1],'all 10 non-foundation source rows');
  const op=S.holen('OPFACT');for(let i=0;i<op.length;i++)if(op[i].level>1)for(const ask of[0,1])for(let j=0;j<3;j++)put('opinionFact',lang('opinionFact',[ask],[i,j]),o=>o===(ask===0?op[i].op[j]:op[i].fact[j]),'every selected opinion/fact at both levels; foundation rows excluded and protected separately');
  for(let i=0;i<SENT.length;i++)put('sentenceType',lang('sentenceType',[],[i]),o=>o===OREO_PARTS[SENT[i][1]],'all 12 sentences and their annotated OREO role');
  for(const name of['PREFIX','SUFFIX'])for(const row of S.holen(name)){const f=createLanguageQuestions(L);put('affixQ/'+name,f.affixQ([row]),o=>o===row[1],'all canonical morphology rows through the actual consuming wrapper');}
  const inf=S.holen('INFER');for(let i=0;i<inf.length;i++)put('inferenceQ',lang('inferenceQ',[],[i]),o=>o===inf[i][2],'all 7 textual inference rows');
  for(let i=0;i<SOURCES.length;i++)put('sourceQ',lang('sourceQ',[],[i]),o=>o===SOURCES[i][1],'all 6 research-source situations');
  for(const row of PACK)put('packQ',createLanguageQuestions(L).packQ(row),o=>o===(row[1]==='Bring'?'Bring it with you':'Leave it at home'),'all 12 unchanged packing-list facts, four genuine handling plans');
  for(let i=0;i<SENTS.length;i++){
    const row=SENTS[i],words=row[0].split(' '),pns=row[1].length?row[1]:[null],common=words.flatMap((w,k)=>k>0&&/^[a-z]/.test(w)?[k]:[]);
    for(let pn=0;pn<pns.length;pn++)for(let ci=0;ci<Math.max(1,common.length);ci++)put('capitalFixQ',lang('capitalFixQ',[],row[1].length?[i,pn,ci]:[i,ci]),o=>o===row[0],'all source sentences/name choices/common-word capitalization positions, including formerly duplicate v3');
  }
  const named=SENTS.filter(r=>r[1].length);for(let i=0;i<named.length;i++){const words=named[i][0].split(' ').map(w=>w.replace(/[.,!?]/g,'')),pns=named[i][1].filter(p=>words.indexOf(p)>0);for(let p=0;p<Math.max(1,pns.length);p++)put('properNounQ',lang('properNounQ',[],[i,p]),o=>o===named[i][0],'every sentence and eligible target name; four full sentences differ only in meaningful capitalization');}
  for(let i=0;i<ENDS.length;i++)put('endMarkQ',lang('endMarkQ',[],[i]),o=>o===ENDS[i][1],'all 10 sentence/explicit voice pairs; three real punctuation meanings');
  const specific=S.holen('SPECIFIC');for(let i=0;i<specific.length;i++)if(specific[i][3]>1)put('specificExampleQ',lang('specificExampleQ',[0],[i]),o=>o===specific[i][1],'all 6 non-foundation reasons, four real examples with the precise requested detail/event distinction');
  for(let i=0;i<TRENNBAR.length;i++)put('trennbarQ',lang('trennbarQ',[],[i]),o=>o===TRENNBAR[i][1],'all 6 separable verbs; three substantive prefix/verb-position mistakes');
  for(let i=0;i<ZUSAMMEN.length;i++)put('zusammenQ',lang('zusammenQ',[],[i]),o=>o===ZUSAMMEN[i][2],'all 8 directed noun compounds; reverse head and spelling errors');
  // The still-open rounding families: exact finite domains, no changes to the
  // already accepted families or shared foundation/helper branches.
  for(const target of[100,100,200,500,500,1000,300])for(let a=10;a<target;a+=10){const b=target-a,candidates=[[a+10,b],[a,b+10],[a-10,b],[a+100,b],[a+1,b],[a,b-1]].filter(p=>p[0]>0&&p[1]>0).map(p=>p.join(' + '));for(const choices of combinations([...new Set(candidates)],3)){const q=createRoundingQuestions({...R,pick:()=>target,rnd:()=>a/10-1,shuffle:()=>choices}).addendsQ();put('addendsQ',q,o=>pickSum(o)===target,'every target/addend and every possible three-candidate subset of the unchanged generator');}}
  for(let lo=100;lo<=800;lo+=100){
    for(let omitted=0;omitted<4;omitted++){let call=0;const q=createRoundingQuestions({...R,rnd:()=>call++===0?lo/100-1:0,fill3:(right,cands)=>cands.filter((_,i)=>i!==omitted)}).halfwayQ();integer('halfwayQ/midpoint',q,lo+50,'all 8 intervals × 4 numeric distractor subsets');}
    for(const off of[10,20,30,40,60,70,80,90]){let call=0;const q=createRoundingQuestions({...R,rnd:()=>call++===0?lo/100-1:1,pick:()=>off}).halfwayQ();integer('halfwayQ/round',q,round(lo+off,100),'all 8 intervals × 8 non-midpoint positions');}
  }
  for(const step of[10,100,1000])for(let n=0;n<=10000;n+=step/10){
    integer('roundedQuestion/round',S.holen('roundedQuestion')('round',2,'round',step,n),round(n,step),'all step/10 positions from 0 to10000; unchanged shared level2/3 choice branch');
    for(const less of[true,false])integer('roundedQuestion/benchmark',S.holen('roundedQuestion')('round',2,'benchmark',step,n,less),less?n-n%step:n-n%step+step,'all step/10 positions, below/above, including zero/exact multiples; unchanged branch');
  }
  const bridgeData=[];for(const pos of[0,1,2,3])for(const n of[1234,5678,6789]){const q={kind:'mc',world:'numbers',level:2,prompt:'canonical place value bridge',options:['a','b'],answer:0,coach:{family:'place-value',n,pos}};const ret=S.holen('bridgeFor')(q).at(-1);put('bridgeFor/place-value',ret,o=>num(o)===Number(String(n===5678?6789:5678)[pos])*10**(3-pos),'all 4 return positions and both possible fixed bridge numbers; source unchanged');bridgeData.push(ret);}
  return{collections,domains,consumers:[...checked].sort(),failures,inputCounts};
}
