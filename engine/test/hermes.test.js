import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

// Hermes (React Native) has no Intl.Segmenter and no \p{..} regex classes; the engine must avoid both.
test('engine sources avoid Intl.Segmenter and unicode property escapes', () => {
  const dir = new URL('../', import.meta.url);
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const s = fs.readFileSync(new URL(f, dir), 'utf8');
    assert.ok(!/Intl\.Segmenter/.test(s), `${f} uses Intl.Segmenter`);
    assert.ok(!/\p\{/.test(s), `${f} uses \p{..}`);
  }
});
