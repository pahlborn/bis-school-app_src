import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createParentSessionVerifier} from '../server/parent-session-verifier.mjs';

const bytes=s=>new TextEncoder().encode(s);
function b64(input){const ar=typeof input==='string'?bytes(input):new Uint8Array(input);
  let s='';for(const n of ar)s+=String.fromCharCode(n);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function fixture(){
  const keys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  const publicJwk=await crypto.subtle.exportKey('jwk',keys.publicKey);
  const now=1800000000;
  const claims={iss:'bigquest-trusted-issuer',aud:'bigquest-claude',sub:'p_parent',role:'parent',
    children:['p_child'],iat:now-10,nbf:now-10,exp:now+180};
  const header={alg:'ES256',typ:'JWT',kid:'active-v1'};
  let member=true,calls=0;
  const verify=createParentSessionVerifier({publicJwk,keyId:'active-v1',issuer:claims.iss,
    audience:claims.aud,now:()=>now,membershipIsCurrent:async(parent,child)=>{
      calls++;return member&&parent==='p_parent'&&child==='p_child';}});
  const token=async (payload=claims,h=header)=>{
    const text=b64(JSON.stringify(h))+'.'+b64(JSON.stringify(payload));
    const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,bytes(text));
    return text+'.'+b64(signature);
  };
  const request=token=>new Request('https://service.invalid/v1/evaluation/extract',{headers:{authorization:'Bearer '+token}});
  return {claims,header,verify,token,request,revoke:()=>{member=false;},calls:()=>calls,publicJwk,now};
}
test('genuine, short-lived signed parent session for this child is accepted',async()=>{
 const f=await fixture();const signed=await f.token();
 assert.deepEqual(await f.verify(f.request(signed),'p_child'),{role:'parent',parentId:'p_parent',children:['p_child']});
 assert.equal(f.calls(),1);
});
test('tampering or a mismatched issuer, audience, role or child is rejected',async()=>{
 const f=await fixture();const legit=await f.token();
 await assert.rejects(f.verify(f.request(legit),'p_other'));
 const sections=legit.split('.');
 await assert.rejects(f.verify(f.request(sections[0]+'.'+b64(JSON.stringify({...f.claims,children:['p_other']}))+'.'+sections[2]),'p_other'));
 for(const edit of [
  {iss:'different'},{aud:'different'},{role:'child'},{sub:'p_stranger'},{exp:f.now-1},
  {exp:f.now+1000},{iat:f.now+70},{nbf:f.now+70}
 ]) await assert.rejects(f.verify(f.request(await f.token({...f.claims,...edit})),'p_child'));
 await assert.rejects(f.verify(f.request(await f.token(f.claims,{...f.header,alg:'none'})),'p_child'));
 assert.equal(f.calls(),0);
});
test('revocation is checked against current server-side family registry',async()=>{
 const f=await fixture();const signed=await f.token();
 assert.deepEqual((await f.verify(f.request(signed),'p_child')).children,['p_child']);
 f.revoke();
 await assert.rejects(f.verify(f.request(signed),'p_child'));
 assert.equal(f.calls(),2);
});
test('fails closed without a trusted issuer key or family registry',async()=>{
 const f=await fixture();const signed=await f.token();
 const unconfigured=createParentSessionVerifier({publicJwk:f.publicJwk,keyId:'active-v1',issuer:f.claims.iss,audience:f.claims.aud});
 await assert.rejects(unconfigured(f.request(signed),'p_child'));
 await assert.rejects(f.verify(new Request('https://service.invalid/'),'p_child'));
});
