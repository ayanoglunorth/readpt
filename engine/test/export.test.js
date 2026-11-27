import test from 'node:test';
import assert from 'node:assert';
import DS from '../export.js';

const AT = Date.UTC(2026, 10, 18);
const W = [
  { word: 'break', translation: 'kırmak', from: 'en', to: 'tr', context: 'Don\'t "break" it, ok?', at: AT },
  { word: 'run', translation: 'koşmak', from: 'en', to: 'tr', context: 'line1\nline2\tx', at: AT },
];

test('toCsv: header, BOM, quotes doubled, fields with commas quoted', () => {
  const lines = DS.toCsv(W).slice(1).split('\r\n');
  assert.strictEqual(lines[0], 'Kelime,Çeviri,Cümle,Dil çifti,Tarih');
  assert.strictEqual(lines[1], 'break,kırmak,"Don\'t ""break"" it, ok?",en-tr,2026-11-18');
  assert.ok(DS.toCsv(W).startsWith('﻿'));
});

test('toCsv: a field starting with a formula character gets a quote prefix', () => {
  const rows = DS.toCsv([{ word: 'x', translation: '=1+1', context: '- Hello', from: 'en', to: 'tr', at: AT }]).slice(1).split('\r\n');
  assert.strictEqual(rows[1], "x,'=1+1,'- Hello,en-tr,2026-11-18");
});

test('toAnki: tab separated, header lines, no stray tabs or line breaks in a field', () => {
  const lines = DS.toAnki(W).split('\n');
  assert.strictEqual(lines[0], '#separator:tab');
  assert.ok(lines.slice(2, 4).every(l => l.split('\t').length === 5));
  assert.strictEqual(lines[3].split('\t')[2], 'line1 line2 x');
});
