#!/usr/bin/env node
// Versioned static pilot build. No credential or production school data is embedded.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const raw=fs.readFileSync(path.join(root,'pilot/local-evaluation/index.html'),'utf8');
const expected=pkg.version.replace('-beta',' Beta');
if(!raw.includes(expected))throw new Error('Pilot HTML display version differs from package.json: '+expected);
if(/(?:github_pat_|ghp_[a-zA-Z0-9]{15,}|sk-ant-[a-zA-Z0-9]{15,})/.test(raw))throw new Error('Secret-like value found in public pilot');
const sha=execFileSync('git',['rev-parse','--short=7','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const stamp=new Date().toISOString();
const mark=expected+' · ausschließlich lokale Testdaten';
if(raw.split(mark).length!==2)throw new Error('Single version display anchor required');
const built=raw.replace(mark,expected+' · Build '+stamp+' UTC · '+sha+' · ausschließlich lokale Testdaten');
const dest=path.join(root,'dist-local');fs.mkdirSync(dest,{recursive:true});
fs.writeFileSync(path.join(dest,'index.html'),built);
fs.writeFileSync(path.join(dest,'build.json'),JSON.stringify({version:pkg.version,sha,builtAt:stamp},null,2)+'\n');
console.log(JSON.stringify({version:pkg.version,sha,builtAt:stamp,htmlBytes:Buffer.byteLength(built)}));
