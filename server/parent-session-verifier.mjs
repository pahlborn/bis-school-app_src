// Signed, short-lived parent session verification (ES256 JWS/JWT).
// Identity must be issued by a trusted BACKEND, never by client JavaScript.
// Enrolment and current family membership must be checked by an authoritative backend.
// No issuer, verification key or membership registry is configured in this repository.
const te = new TextEncoder();
const td = new TextDecoder('utf-8', {fatal:true});
const PID = /^p_[0-9A-Za-z]{1,40}$/;
function obj(x){return !!x && typeof x==='object' && !Array.isArray(x);}
function decode(segment){
  if(typeof segment!=='string' || segment.length<1 || !/^[A-Za-z0-9_-]+$/.test(segment)) throw Error('invalid token');
  const base=segment.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-segment.length%4)%4);
  return Uint8Array.from(atob(base),x=>x.charCodeAt(0));
}
const json = s=>JSON.parse(td.decode(decode(s)));

/**
 * The session-issuing identity service MUST:
 * - Authenticate Big Quest parents independently of web-supplied role/claims.
 * - Sign tokens with its private P-256 key; only its PUBLIC JWK is passed here.
 * - Issue exp <= 5 min after iat and include approved child IDs.
 * - Use an authoritative, revocable family membership registry for fresh checks.
 *
 * This verifier does NOT issue tokens and cannot be used as a login bypass.
 */
export function createParentSessionVerifier({publicJwk,keyId,issuer,audience,membershipIsCurrent,now=()=>Math.floor(Date.now()/1000)}={}){
  const configured=obj(publicJwk) && publicJwk.kty==='EC' && publicJwk.crv==='P-256'
    && typeof publicJwk.x==='string' && typeof publicJwk.y==='string' && !('d' in publicJwk)
    && typeof keyId==='string' && keyId.length>0
    && typeof issuer==='string' && issuer.length>0 && typeof audience==='string' && audience.length>0
    && typeof membershipIsCurrent==='function';
  let keyPromise;
  return async function verify(request,childId){
    if(!configured) throw Error('not configured');
    if(!PID.test(childId)) throw Error('invalid child');
    const auth=request.headers.get('authorization')||'';
    if(!auth.startsWith('Bearer ') || auth.length>8199) throw Error('invalid authorization');
    const parts=auth.slice(7).split('.');
    if(parts.length!==3 || parts.some(p=>!p || p.length>4096)) throw Error('invalid token');
    let header,payload,signature;
    try {header=json(parts[0]);payload=json(parts[1]);signature=decode(parts[2]);}
    catch{throw Error('invalid token');}
    if(!obj(header)||header.alg!=='ES256'||header.typ!=='JWT'||header.kid!==keyId
      ||!obj(payload)||payload.iss!==issuer||payload.aud!==audience
      ||payload.role!=='parent'||!PID.test(payload.sub)||!Array.isArray(payload.children)
      ||payload.children.length>100||!payload.children.includes(childId)
      ||!Number.isInteger(payload.iat)||!Number.isInteger(payload.exp)
      ||!Number.isInteger(payload.nbf)||payload.exp-payload.iat>300
      ||payload.exp<=payload.iat||signature.length!==64) throw Error('invalid claims');
    const clock=now();
    if(payload.exp<=clock || payload.iat>clock+30 || payload.nbf>clock+30
      ||payload.iat<clock-300) throw Error('expired token');
    if(!keyPromise) keyPromise=crypto.subtle.importKey('jwk',publicJwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
    let valid=false;
    try {valid=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},await keyPromise,
      signature,te.encode(parts[0]+'.'+parts[1]));} catch { valid=false; }
    if(!valid) throw Error('invalid signature');
    // An otherwise valid old token MUST NOT re-enable a recently revoked child.
    if(await membershipIsCurrent(payload.sub,childId)!==true) throw Error('membership revoked');
    return {role:'parent',parentId:payload.sub,children:[childId]};
  };
}
