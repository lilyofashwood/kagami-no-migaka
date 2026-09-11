import test from 'node:test';
import assert from 'node:assert/strict';
import {NEKOMATA_REPORT,KITSUNE_SPECIMEN,NAMING_CARDS,turnNamingCard,readGrid} from '../core.js';

test('reported canonical grid matches both independently specified strings',()=>{
  const result=readGrid(NEKOMATA_REPORT);
  assert.equal(result.readings.tategaki,'秘隠妖変起猫影魂相動又爪夜双形今閃歌尾真醒動招舞現');
  assert.equal(result.readings.migi_yokogaki,'秘猫又今醒隠影爪閃動妖魂夜歌招変相双尾舞起動形真現');
  assert.equal(NEKOMATA_REPORT.grid[2][1],'歌');
});
test('A–Y geometry correction preserves every label exactly once',()=>{
  const base=[...'ABCDEFGHIJKLMNOPQRSTUVWXY'];
  const printed=Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>base[(4-c)*5+r]));
  const record=readGrid({...NEKOMATA_REPORT,grid:printed});
  assert.equal(record.readings.tategaki,base.join(''));
  assert.equal(record.readings.migi_yokogaki,'AFKPUBGLQVCHMRWDINSXEJOTY');
  const original='AFKPUBGLQVCHMRWDIMSXEJNTY';
  assert.equal([...original].filter(c=>c==='M').length,2);
  assert.equal([...original].filter(c=>c==='N').length,1);
  assert.ok(!original.includes('O'));
});
test('all three naming cards reverse exact supplied kana without renaming',()=>{
  assert.deepEqual(NAMING_CARDS.map(c=>turnNamingCard(c.id).reversed),['ねこまた','きたよ','きつねび']);
  assert.throws(()=>turnNamingCard('invented'));
});
test('source-backed Kitsune specimen preserves all 25 glyphs and both exact traversals',()=>{
  const result=readGrid(KITSUNE_SPECIMEN);
  assert.deepEqual(result.grid.map(row=>row.join('')),['見露深霧夜','遠道山荷稲','下灯揺影面','舞尾九妖白','跡夢燃火狐']);
  assert.equal(new Set(result.grid.flat()).size,25);
  assert.equal(result.readings.tategaki,'夜稲面白狐霧荷影妖火深山揺九燃露道灯尾夢見遠下舞跡');
  assert.equal(result.readings.migi_yokogaki,'夜霧深露見稲荷山道遠面影揺灯下白妖九尾舞狐火燃夢跡');
  assert.ok(KITSUNE_SPECIMEN.provenance.includes('8aef3136a8e967753e279d7a471467c647281e2f06d71e5da644013e2bf83354'));
});
