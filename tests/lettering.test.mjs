import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {UI_REGISTERS,gardenCatalog,letterText} from '../lettering.js';

test('the offline interface includes the complete 78-entry Font Garden catalog',()=>{
  assert.equal(gardenCatalog().length,78);
  for(const id of UI_REGISTERS)assert.ok(gardenCatalog().some(style=>style.id===id));
  assert.equal(new Set(UI_REGISTERS).size,8);
  assert.ok(gardenCatalog().some(style=>style.id==='coral-asemic-specimen'));
});

test('house body and varied registers preserve the literal non-ASCII suffix',()=>{
  assert.equal(letterText('LILY'),'𝗅𝐢𝗅𝗒');
  const suffix=' · 重ね歌 🐈‍⬛ e\u0301';
  for(const id of UI_REGISTERS){
    const output=letterText('Garden',id);
    assert.doesNotMatch(output,/[A-Za-z]/u);
    assert.equal(output.normalize('NFKC'),'garden');
    const mixed=letterText('A'+suffix,id);
    assert.ok(mixed.includes(' · 重ね歌 🐈‍⬛ '));
    assert.ok(mixed.endsWith('\u0301'));
    assert.equal(mixed.normalize('NFKD'),('a'+suffix).normalize('NFKD'));
  }
  assert.throws(()=>letterText('text','unknown'));
});

test('static HTML has no local-adapter capability marker and data nodes are excluded from lettering',()=>{
  const root=new URL('../',import.meta.url);
  assert.doesNotMatch(readFileSync(new URL('index.html',root),'utf8'),/name="layered-song-local-adapter"/);
  const app=readFileSync(new URL('app.js',root),'utf8');
  assert.match(app,/disabled=!localAdapter/u);
  assert.match(app,/if\(!localAdapter\)throw new Error/u);
  const lettering=readFileSync(new URL('lettering.js',root),'utf8');
  assert.ok(lettering.includes('pre,code,textarea,input,[data-literal],[aria-live]'));
});
