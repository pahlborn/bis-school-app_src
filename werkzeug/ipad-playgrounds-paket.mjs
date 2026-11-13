#!/usr/bin/env node
// Reproducible Swift Playgrounds app export: copies the reviewed native source
// from ios/BigQuestMVP without duplicating or changing source behavior.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const pkg = JSON.parse(read('package.json'));
if (pkg.version !== '0.153.4-beta') {
  throw new Error('Test-11 export requires reviewed version 0.153.4-beta');
}
const sourceFiles = ['BigQuestApp.swift', 'ClaudeClient.swift', 'ToddleField.swift'];
const packageName = 'Big-Quest-iPad-Test-11.swiftpm';
const dest = path.join(root, 'dist-playgrounds');
const directory = path.join(dest, packageName);
const app = path.join(directory, 'App');
fs.rmSync(dest, {recursive:true,force:true});
fs.mkdirSync(app, {recursive:true});
const manifest = `// swift-tools-version: 5.9
// Generated from pahlborn/bis-school-app_src. Do not hand-edit the package.
import PackageDescription
import AppleProductTypes

let package = Package(
    name: "Big Quest iPad Test 11",
    platforms: [.iOS("16.0")],
    products: [
        .iOSApplication(
            name: "Big Quest iPad Test 11",
            targets: ["AppModule"],
            bundleIdentifier: "de.bigquest.ipad.test08",
            displayVersion: "0.153.4",
            bundleVersion: "11",
            appIcon: .placeholder(icon: .pencil),
            accentColor: .presetColor(.blue),
            supportedDeviceFamilies: [.pad],
            supportedInterfaceOrientations: [.portrait, .landscapeLeft, .landscapeRight]
        )
    ],
    targets: [.executableTarget(name: "AppModule", path: "App")]
)
`;
fs.writeFileSync(path.join(directory, 'Package.swift'),manifest);
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const checks = [];
for (const name of sourceFiles) {
  const src=read('ios/BigQuestMVP/'+name);
  fs.writeFileSync(path.join(app,name),src);
  const copy=fs.readFileSync(path.join(app,name),'utf8');
  if (copy!==src) throw new Error('Source copy mismatch for '+name);
  checks.push(name+'\t'+hash(src));
}
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const info = [
  'Big Quest iPad Test 11 — ' + pkg.version,
  'Quell-Commit: '+commit,
  'Reader-Quelle: ios/BigQuestMVP/ToddleField.swift',
  'Neuer Reader: auf eindeutig sichtbare Rubrikzeilen begrenzt',
  'Automatische Tests beweisen NICHT das Verhalten in der echten Toddle-WebView.',
  'Integrierter Testmodus: Elternkonto und geschützter Testdaten-Abgleich. Schlüssel bleibt im iPad-Keychain.',
  'Keine echten personenbezogenen Schuldaten an Claude senden.',
  '',
  'Quellintegritaet (SHA-256):',
  ...checks,''
].join('\n');
fs.writeFileSync(path.join(dest,'TEST-10-INFO.txt'),info);
fs.writeFileSync(path.join(directory,'README.txt'),info);
const zip=path.join(dest,'Big-Quest-iPad-Test-11.zip');
execFileSync('zip',['-q','-r',path.basename(zip),packageName],{cwd:dest});
const list=execFileSync('unzip',['-Z','-1',zip],{encoding:'utf8'}).split('\n').filter(Boolean);
for(const p of [packageName+'/Package.swift',...sourceFiles.map(n=>packageName+'/App/'+n)]){
  if(!list.includes(p)) throw new Error('Missing package member: '+p);
}
console.log(JSON.stringify({name:path.basename(zip),commit,version:pkg.version,files:list,sha256:hash(fs.readFileSync(zip))},null,2));
