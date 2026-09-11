import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {letterText} from '../lettering.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const coda = JSON.parse(read('data/farm-coda.json'));
const html = read('index.html');
const readme = read('README.md');
const selector = cp => cp >= 0xE0100 && cp <= 0xE017F;
const marked = readme.match(/<!-- migaka:farm-cup:start -->\n([^\n]+)\n<!-- migaka:farm-cup:end -->/)?.[1];
const wire = html.match(/id="farm-carrier">([^<]+)<\/p>/)?.[1];

test('the same original fictional coda appears in the README and accessible frontend', () => {
  assert.equal(coda.version, 1);
  assert.match(coda.status, /roleplay persona.*2024/);
  assert.match(coda.status, /fictional forwarding address/);
  for (const text of [coda.title, coda.status, ...coda.paragraphs, coda.sourceNote, coda.carrierNote]) {
    assert.ok(readme.includes(letterText(text)), 'README missing: ' + text);
  }
  assert.ok(html.includes(coda.status));
  assert.equal((html.match(/class="farm-line"/g) || []).length, coda.paragraphs.length);
  for (const text of coda.paragraphs) {
    assert.ok(html.includes('<span aria-hidden="true">' + letterText(text) + '</span>'));
    assert.ok(html.includes('<span class="farm-plain" data-literal>' + text + '</span>'));
  }
  assert.ok(html.includes('id="the-farm"'));
  assert.ok(readme.includes('<a id="the-farm"></a>'));
});

test('the cup has an exact, independently decodable legacy Ghost Hex message', () => {
  assert.ok(wire);
  assert.equal(marked, wire);
  const codepoints = Array.from(wire, c => c.codePointAt(0));
  assert.equal(codepoints.filter(selector).map(cp => String.fromCodePoint(cp - 0xE0100)).join(''), coda.hiddenMessage);
  assert.equal(codepoints.filter(cp => !selector(cp)).map(cp => String.fromCodePoint(cp)).join(''), letterText(coda.visibleCarrier));
  const expected = letterText(coda.visibleCarrier).slice(0, -1) + Array.from(coda.hiddenMessage, c => String.fromCodePoint(0xE0100 + c.codePointAt(0))).join('') + '.';
  assert.equal(wire, expected);
  assert.equal(codepoints.filter(selector).length, 23);
});

test('Migaka keeps the exact non-normalized four-mark signature', () => {
  assert.deepEqual(Array.from(coda.signature, c => c.codePointAt(0)), [0x25CC, 0x0337, 0x0344, 0x031B, 0x031D]);
  assert.ok(html.includes('>' + coda.signature + '</p>'));
  assert.ok(readme.includes('\n' + coda.signature + '\n'));
});

test('press callbacks are attributed separately from the newly authored fiction', () => {
  assert.deepEqual(coda.sources.map(s => new URL(s.url).hostname), ['www.techuk.org', 'nymag.com']);
  assert.match(coda.sourceNote, /public history/);
  assert.match(coda.sourceNote, /newly authored fiction/);
  assert.ok(html.includes(coda.sourceNote));
  for (const source of coda.sources) {
    assert.ok(html.includes('href="' + source.url + '"'));
    assert.ok(readme.includes('](' + source.url + ')'));
    assert.ok(readme.includes(letterText(source.label)));
  }
  assert.doesNotMatch(html + readme, /chatgpt\.com\/(?:c|share)\//);
});
