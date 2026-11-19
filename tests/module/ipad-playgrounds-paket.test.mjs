import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '../..');
const sourceFiles = ['BigQuestApp.swift', 'ClaudeClient.swift', 'ToddleField.swift'];
const hash = data => crypto.createHash('sha256').update(data).digest('hex');

test('EV-1.1: real CLI exports N and N+1 with stable identity, current version and byte-identical ZIP sources', () => {
  // Keep generated product packages inside this product worktree and remove them.
  const output = fs.mkdtempSync(path.join(root, '.ev1-export-'));
  try {
    const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version;
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    for (const number of [12, 13]) {
      const metadata = JSON.parse(execFileSync(process.execPath, [
        'werkzeug/ipad-playgrounds-paket.mjs', '--test-number', String(number), '--output', output,
      ], { cwd: root, encoding: 'utf8' }));
      const directory = path.join(output, metadata.packageName);
      const manifest = fs.readFileSync(path.join(directory, 'Package.swift'), 'utf8');
      assert.match(manifest, /bundleIdentifier: "de\.bigquest\.ipad"/, 'fixed app identity must survive a new test number');
      assert.match(manifest, new RegExp(`name: "Big Quest iPad Test ${number}"`));
      assert.match(manifest, new RegExp(`bundleVersion: "${number}"`));
      assert.ok(manifest.includes(`displayVersion: "${version.split('-')[0]}"`));
      assert.equal(metadata.version, version);
      assert.equal(metadata.commit, commit);
      assert.equal(metadata.nativeSourceOrigin, 'f88e82ab013daf6f8a095224af6cd4d7ef0dc880');
      const zip = path.join(output, metadata.name);
      assert.equal(metadata.sha256, hash(fs.readFileSync(zip)));
      execFileSync('unzip', ['-t', zip]);
      const members = execFileSync('unzip', ['-Z', '-1', zip], { encoding: 'utf8' }).trim().split('\n');
      assert.deepEqual(metadata.files, members);
      assert.deepEqual(members.filter(p => !p.endsWith('/')).sort(), [
        'Package.swift', 'README.txt', ...sourceFiles.map(p => 'App/' + p),
      ].map(p => metadata.packageName + '/' + p).sort());
      assert.deepEqual(execFileSync('unzip', ['-p', zip, metadata.packageName + '/Package.swift']), Buffer.from(manifest));
      const info = fs.readFileSync(path.join(output, metadata.infoName), 'utf8');
      assert.ok(info.includes('Quell-Commit: ' + commit));
      assert.ok(info.includes('Quellstand: ' + metadata.sourceState));
      assert.ok(info.includes('App-Kennung: de.bigquest.ipad'));
      assert.equal(fs.readFileSync(path.join(directory, 'README.txt'), 'utf8'), info);
      assert.deepEqual(execFileSync('unzip', ['-p', zip, metadata.packageName + '/README.txt']), Buffer.from(info));
      for (const file of sourceFiles) {
        const source = fs.readFileSync(path.join(root, 'ios/BigQuestMVP', file));
        assert.deepEqual(fs.readFileSync(path.join(directory, 'App', file)), source);
        assert.deepEqual(execFileSync('unzip', ['-p', zip, metadata.packageName + '/App/' + file]), source);
        assert.ok(info.includes(file + '\t' + hash(source)));
      }
    }
    // Exporting N+1 must not delete N or unrelated files in the chosen destination.
    assert.ok(fs.existsSync(path.join(output, 'Big-Quest-iPad-Test-12.zip')));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
