// Static integration contract for the native test wrapper.
// This is not a device/runtime acceptance test; full CI also builds the iOS target.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../ios/BigQuestMVP/BigQuestApp.swift', import.meta.url), 'utf8');

test('native wrapper opens the protected Big Quest parent/child test app, not the local demo', () => {
  assert.match(source, /url: URL\(string: "https:\/\/big-quest-test\.github\.io\/"\)!, persistent: true/);
  assert.doesNotMatch(source, /url: URL\(string: "https:\/\/big-quest-test\.github\.io\/probe-evaluation-local\/"\)!, persistent: true/);
});

test('native Claude message handler stays tied to exact HTTPS test origin and main frame', () => {
  assert.match(source, /message\.frameInfo\.isMainFrame/);
  assert.match(source, /message\.frameInfo\.securityOrigin\.protocol == "https"/);
  assert.match(source, /message\.frameInfo\.securityOrigin\.host == "big-quest-test\.github\.io"/);
  assert.match(source, /isEvaluationPage, !busy/);
  assert.match(source, /return \["\/", "\/index\.html",/);
  assert.match(source, /\bcontext = context; error = nil; showToddle = true/);
});

test('the native wrapper never embeds a Claude credential', () => {
  assert.doesNotMatch(source, /sk-ant-[A-Za-z0-9_-]{20,}/);
  assert.match(source, /ClaudeKey\.read\(\)/);
});
