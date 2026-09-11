import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const reverse = value => [...value.normalize('NFC')].reverse().join('');

test('the chosen Roman name heads the poetry and every documented kana palindrome truly reverses', () => {
  assert.ok(readme.normalize('NFKC').startsWith('# kagami-no-migaka\n\nかがみのしきしのみがか\n'));
  assert.ok(readme.includes('https://lilyofashwood.github.io/kagami-no-migaka/'));
  assert.ok(!readme.includes('https://lilyofashwood.github.io/kanotokoyo/'));
  for (const value of [
    'かがみのしきしのみがか',
    'まどかららかどま', 'らかどままどから',
    'きしのみがかがみのしき', 'みがかがみ',
    'かがみのしききしのみがか', 'しきし'
  ]) {
    assert.equal(reverse(value), value);
    assert.ok(readme.includes(value));
  }
});

test('the night-song is a reversal pair, with a separately described kanji face', () => {
  assert.equal(reverse('よことのか'), 'かのとこよ');
  assert.notEqual(reverse('よことのか'), 'よことのか');
  assert.ok(readme.includes('よことのか ⇄ かのとこよ'));
  assert.ok(readme.includes('夜言ノ香 ⇄ 歌ノ常世'));
  assert.ok(readme.includes('<a id="a-song-through-the-mirror"></a>'));
  assert.ok(readme.indexOf('## よことのか ⇄ かのとこよ') < readme.indexOf('<details>'));
  assert.match(readme.normalize('NFKC'), /reversal pair, not a palindrome/);
});

test('the poetry keeps its landscape and working guide', () => {
  for (const text of ['天谷', '雨夜 ⇄ 夜雨', '色紙', '身が鏡', '<a id="open-the-garden">']) {
    assert.ok(readme.includes(text));
  }
  assert.match(readme, /python3 server\.py --port 8767/);
});

test('the pre-existing framed font message is byte-for-byte unchanged', () => {
  const expected = `<!-- stegweb:legacy:two_plains:start -->
A second song sleeps in the ga𝗋d𝖾n. The r𝖺in crosses each leaf, then returns along a path the morning has forgotten. Look once with the lantern, an𝖽 once with its reflection; 𝖻𝗈𝗍𝗁 leave a little light. The 𝗉𝖺per holds a crease where someone once folded i𝗍 into t𝗁e 𝗌hape of a house.
<!-- stegweb:end -->`;
  assert.equal(readme.match(/<!-- stegweb:legacy:two_plains:start -->[\s\S]*?<!-- stegweb:end -->/)?.[0], expected);
  assert.equal(readme.split('<!-- stegweb:legacy:two_plains:start -->').length, 2);
});
