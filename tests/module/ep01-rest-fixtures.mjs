import{execFileSync}from'node:child_process';
import{createHash}from'node:crypto';
import{modulUmwandeln}from'../../werkzeug/module.mjs';
export const REST_BASE='3339da427b423d1353b7c83090728c157fc9a9a5';
export function committedApp(commit=REST_BASE){
  const get=path=>execFileSync('git',['show',`${commit}:${path}`],{encoding:'utf8',maxBuffer:8e6});
  const manifest=JSON.parse(get('src/module/module.json')).module.filter(m=>m.bau==='live');
  return get('index.html').replace('/*BQ_MODULE*/',manifest.map(m=>modulUmwandeln(m.name,get(`src/module/${m.name}.mjs`))).join('\n'));
}
export function foundationDigest(S){
  const questions=[];
  for(let i=0;i<100;i++)for(const[world,count]of[['numbers',6],['combos',5],['wordprob',4],['units',4],['graphs',3]])for(let k=0;k<count;k++)questions.push(S.holen(world+'BaseQ')(k));
  for(let i=0;i<100;i++)for(const world of Object.keys(S.holen('GRUNDLAGE')))questions.push(S.holen('baseQ')(world,{world}));
  for(const step of[10,100,1000])for(let n=0;n<=10000;n+=step/10)for(const family of['round','benchmark','round-explain'])for(const less of[true,false])questions.push(S.holen('roundedQuestion')('round',1,family,step,n,less));
  for(let i=0;i<100;i++)for(const name of['nearestHundredQ','benchmarkQ'])questions.push(S.holen(name)());
  for(let i=0;i<100;i++)questions.push(S.holen('missingPartQuestion')('numbers',1,{total:70,parts:[30]}));
  for(const name of['HYPO','OPINION_MC','OREO_MC'])for(const row of S.holen(name).filter(r=>r[4]===1))questions.push(S.holen('bankMC')([row],{world:'words'})(row));
  for(const step of[10,100,1000])for(const family of['round','benchmark','round-explain'])for(const level of[1,2,3])questions.push(...S.holen('bridgeFor')({world:'round',level,prompt:'canonical bridge',options:['a','b'],answer:0,coach:{family,n:step*2.4,step,less:true}}));
  const json=JSON.stringify(questions.map(q=>({q,id:S.holen('qId')(q),example:S.holen('exampleFor')(q)})));
  return{count:questions.length,sha256:createHash('sha256').update(json).digest('hex')};
}
