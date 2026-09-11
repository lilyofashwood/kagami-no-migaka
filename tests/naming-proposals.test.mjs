import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const record=JSON.parse(readFileSync(new URL('../data/naming-proposals.json',import.meta.url),'utf8'));
const segmenter=new Intl.Segmenter('ja',{granularity:'grapheme'});
const reverse=value=>[...segmenter.segment(value)].map(x=>x.segment).reverse().join('');
function checked(kana){
  assert.equal(typeof kana,'string');assert.ok(kana.length);
  assert.equal(kana,kana.normalize('NFC'));
  assert.match(kana,/^[\u3041-\u3096]+$/u);
  assert.doesNotMatch(kana,/[ぁぃぅぇぉっゃゅょゎゕゖ]/u);
  return reverse(kana);
}

test('the separate description and window inscriptions remain exact kana palindromes',()=>{
  assert.deepEqual(record.palindromes.map(x=>x.kana),['かがみのしきしのみがか','まどかららかどま']);
  for(const item of record.palindromes){
    assert.equal(checked(item.kana),item.kana);
    assert.equal([...item.kana].reverse().join(''),item.kana);
    assert.ok(item.language_status.startsWith('intentional_'));
  }
});

test('the preserved poetic title is an exact kana reversal pair, not a palindrome or reversible kanji',()=>{
  const pair=record.poetic_pair;
  assert.equal(pair.front,'歌ノ常世');assert.equal(pair.reveal,'夜言ノ香');
  assert.equal(pair.kana,'かのとこよ');assert.equal(pair.reverse_kana,'よことのか');
  assert.equal(checked(pair.kana),pair.reverse_kana);
  assert.equal(checked(pair.reverse_kana),pair.kana);
  assert.notEqual(checked(pair.kana),pair.kana);
  assert.notEqual(reverse(pair.front),pair.reveal);
  assert.equal(pair.is_palindrome,false);
  assert.equal(pair.kanji_faces_reverse,false);
  assert.equal(pair.status,'preserved_readme_poetry');
  assert.equal(pair.language_status,'coined_titles_with_supplied_readings');
  assert.ok(pair.reading_note.includes('歌=か'));
});

test('reversal proof never silently repairs voicing, kana size or decomposed input',()=>{
  assert.throws(()=>checked('みか\u3099か'));
  assert.throws(()=>checked('ミガカ'));
  assert.throws(()=>checked('きゃ'));
  assert.throws(()=>checked(''));
  assert.notEqual(reverse('よことのか'),'かのとこ');
  assert.equal(record.reversal_contract.tests_prove_linguistics,false);
  assert.equal(record.brand_review.clearance,'not_established');
});

test('canonical Roman repository identity keeps poetic kana separate and wire formats intact',()=>{
  assert.equal(record.schema_version,3);
  assert.equal(record.project_identity.name,'Kagami-no-Migaka');
  assert.equal(Object.hasOwn(record.project_identity,'kana'),false);
  assert.equal(record.project_identity.description,'かがみのしきしのみがか');
  assert.equal(record.project_identity.repository,'lilyofashwood/kagami-no-migaka');
  assert.equal(record.decision.chosen_title,'Kagami-no-Migaka');
  assert.equal(record.project_identity.repository_name_temporary,false);
  assert.equal(record.decision.repository_rename_authorized,true);
  assert.equal(record.decision.status,'display_title_and_repository_slug_chosen');
  assert.equal(record.project_identity.grid_version,'kasane-uta.grid.v1');
  assert.equal(record.project_identity.exact_payload_version,'kasane-uta.utf8-hex.v1');
});
