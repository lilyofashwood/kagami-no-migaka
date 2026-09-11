import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {PROJECT,VERSION,DEMO,readGrid,attachExactPayload,readExactPayload} from '../core.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('chosen reversal-pair title and exact description use the canonical repository',()=>{
  const pkg=JSON.parse(read('package.json')),research=JSON.parse(read('data/naming-proposals.json'));
  assert.equal(PROJECT.name,'かのとこよ · 歌ノ常世');
  assert.equal(PROJECT.kana,'かのとこよ');
  assert.equal(PROJECT.kanji,'歌ノ常世');
  assert.equal(PROJECT.reverseKana,'よことのか');
  assert.equal(PROJECT.reverseKanji,'夜言ノ香');
  assert.equal(PROJECT.description,'かがみのしきしのみがか');
  assert.equal(PROJECT.nameStatus,'chosen');
  assert.equal(PROJECT.historicalMethod,'Kasaneuta');
  assert.equal(PROJECT.historicalKanji,'重ね歌');
  assert.equal(PROJECT.repository,'lilyofashwood/kanotokoyo');
  assert.equal(PROJECT.repositoryNameTemporary,false);
  assert.equal(Object.hasOwn(PROJECT,'temporaryRepository'),false);
  assert.equal(pkg.name,'kanotokoyo');
  assert.equal(pkg.title,PROJECT.name);
  assert.equal(pkg.description,PROJECT.description);
  assert.equal(pkg.repository.url,'https://github.com/'+PROJECT.repository+'.git');
  assert.equal(pkg.homepage,'https://lilyofashwood.github.io/kanotokoyo/');
  assert.ok(read('index.html').includes('<title>'+PROJECT.name+'</title>'));
  assert.ok(read('index.html').includes('aria-label="'+PROJECT.name+'"'));
  assert.ok(read('index.html').includes('name="description" content="かがみのしきしのみがか"'));
  assert.equal(research.project_identity.name,PROJECT.name);
  assert.equal(research.project_identity.repository,PROJECT.repository);
  assert.ok(read('app.js').includes("a.download='kasane-uta-grid.json'"));
  const spec=read('specs/grid-v1.md');
  assert.ok(spec.includes('The chosen display title is '+PROJECT.name));
  assert.doesNotMatch(spec,/project name pending|name is pending|traversal remains unverified|unresolved choice/iu);
  assert.ok(spec.includes('Both reproduce the exact source-backed Nekomata and Kitsune specimen readings'));
  for(const path of ['NAMING-JAPANESE.md','PROVENANCE.md','specs/grid-v1.md']){
    assert.ok(read(path).includes('lilyofashwood/kanotokoyo'));
    assert.doesNotMatch(read(path),/URL remains? pending|URL remain pending/iu);
  }
  assert.match(read('NAMING-JAPANESE.md'),/not a palindrome/iu);
  assert.ok(read('NAMING-JAPANESE.md').includes('歌=か'));
});

test('literal pre-rename grid identifier remains accepted without a renamed wire alias',()=>{
  const old={version:'kasane-uta.grid.v1',grid:[...'ABCDEFGHIJKLMNOPQRSTUVWXY'].reduce((rows,c,i)=>{if(i%5===0)rows.push([]);rows.at(-1).push(c);return rows;},[]),paths:{
    rows:Array.from({length:25},(_,i)=>[Math.floor(i/5),i%5]),
    columns:Array.from({length:25},(_,i)=>[i%5,Math.floor(i/5)])}};
  assert.equal(VERSION,'kasane-uta.grid.v1');
  assert.equal(readGrid(old).readings.rows,'ABCDEFGHIJKLMNOPQRSTUVWXY');
  assert.equal(readGrid(old).readings.columns,'AFKPUBGLQVCHMRWDINSXEJOTY');
  assert.throws(()=>readGrid({...old,version:'renamed.grid.v1'}),/unsupported grid format/);
});

test('literal UTF-8 envelopes remain byte-compatible after display naming',()=>{
  const literal={version:'kasane-uta.utf8-hex.v1',length:5,hexadecimal:'68656c6c6f',crc32:'3610a686'};
  assert.equal(readExactPayload({...DEMO,exactPayload:literal}).payload,'hello');
  assert.deepEqual(attachExactPayload(DEMO,'hello').exactPayload,literal);
  const exact='\uFEFF歌 🐈‍⬛ e\u0301\t\r\n\0';
  assert.equal(readExactPayload(attachExactPayload(DEMO,exact)).payload,exact);
});

test('published source list excludes private documentary directories and account metadata',()=>{
  // Source ZIPs have no Git index; inspect all supplied application-owned text in that case.
  const root=new URL('../',import.meta.url);
  const paths=existsSync(new URL('.git',root))?execFileSync('git',['ls-files','-z'],{cwd:root}).toString().split('\0').filter(Boolean):
    ['core.js','app.js','index.html','PROVENANCE.md','NAMING-JAPANESE.md','data/naming-proposals.json'];
  assert.ok(paths.every(path=>!path.startsWith('historical/')&&!path.startsWith('private-source/')));
  for(const path of paths){
    const body=read(path).normalize('NFKC');
    assert.doesNotMatch(body,/https?:\/\/(?:chatgpt\.com|claude\.ai)\/(?:c|chat)\/[a-z0-9-]+/iu,path);
    assert.doesNotMatch(body,/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/iu,path);
  }
  assert.ok(read('.gitignore').split('\n').includes('/historical/'));
});

test('generic generator imposes no specimen identity and keeps literary text inert',()=>{
  const app=read('app.js');
  const prompt=app.slice(app.indexOf("const candidate=await ask("),app.indexOf("const result=assembleCandidate"));
  assert.doesNotMatch(prompt,/Nekomata|Kitsune|猫又|狐/iu);
  assert.ok(prompt.includes('Do not impose a particular creature, identity or theme'));
  assert.ok(prompt.includes('inert literary data'));
});
