// Authorized synthetic family, never production activity.
import{ausV1,kontenEinsetzen}from'../../werkzeug/konten.mjs';
import{schuleEinsetzen}from'../../werkzeug/schule.mjs';
import{appLesen}from'../../werkzeug/module.mjs';
import{appSandbox}from'../app-sandbox.mjs';
export const TITLE_DAY='2026-11-20';
export const titlePlain=x=>JSON.parse(JSON.stringify(x));
export const titleRows=(status='M')=>Array.from({length:6},()=>[TITLE_DAY,2,1,true]).concat(status==='E'?Array.from({length:4},()=>[TITLE_DAY,3,1,true]):[]);
export const TITLE_ACCOUNTS=ausV1({users:[{user:'mia',role:'student',start:{salt:Array(16).fill(1),hash:'00'.repeat(32)}},{user:'papa',role:'parent',kinder:['mia'],start:{salt:Array(16).fill(2),hash:'11'.repeat(32)}}]});
export const TITLE_KID=TITLE_ACCOUNTS.users.find(u=>u.user==='mia');
export const TITLE_PRE='bq2_'+TITLE_KID.id+'__';
export function titleApp(data={},options={}){
 const{bauart='live',school=null,...rest}=options,html=schuleEinsetzen(kontenEinsetzen(appLesen('utf8',{bauart}),TITLE_ACCOUNTS),school?{version:1,kinder:{mia:school}}:null,TITLE_ACCOUNTS).toString('utf8');
 return appSandbox({seed:203,bauart,anpassen:()=>html,speicher:{bq2_session:JSON.stringify({id:TITLE_KID.id,user:TITLE_KID.user}),...Object.fromEntries(Object.entries(data).map(([k,v])=>[TITLE_PRE+k,JSON.stringify(v)]))},...rest});
}
