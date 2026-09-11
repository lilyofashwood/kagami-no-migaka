import test from 'node:test';import assert from 'node:assert/strict';
import {DEMO,VERSION,readGrid,assembleCandidate,attachExactPayload,readExactPayload,defaultPaths,gridFromLines} from '../core.js';
const clone=x=>structuredClone(x);
test('literal traversal has independently specified expected values',()=>{
  const r=readGrid(DEMO);assert.equal(r.readings.tategaki,'庭路音歌空静夢水夜遠映葉眠星残光渡影間露月風花雲朝');
  assert.equal(r.readings.migi_yokogaki,'庭静映光月路夢葉渡風音水眠影花歌夜星間雲空遠残露朝');
});
test('graphemes preserve emoji ZWJ, existing accents and supplementary symbols',()=>{
  const d=clone(DEMO);d.grid[0][0]='🐈‍⬛';d.grid[0][1]='e\u0301';d.grid[0][2]='𠮷';
  assert.match(readGrid(d).readings.tategaki,/𠮷/u);assert.ok(readGrid(d).readings.migi_yokogaki.endsWith('朝'));
  assert.equal(gridFromLines(d.grid.map(r=>r.join('')).join('\n'))[0][0],'🐈‍⬛');
});
test('malformed grid/path/version inputs reject',()=>{
  for(const cell of ['','ab','\n','\u200b','\u200d','\u0301','\ud800',' ']){const d=clone(DEMO);d.grid[0][0]=cell;assert.throws(()=>readGrid(d));}
  const short=clone(DEMO);short.grid.pop();assert.throws(()=>readGrid(short));
  for(const coordinate of [[-1,0],[5,0],[0.5,0],['0',0],[0]]){const d=clone(DEMO);d.paths.tategaki[0]=coordinate;assert.throws(()=>readGrid(d));}
  const dup=clone(DEMO);dup.paths.tategaki[0]=dup.paths.tategaki[1];assert.throws(()=>readGrid(dup));
  const same=clone(DEMO);same.paths.tategaki=same.paths.migi_yokogaki;assert.throws(()=>readGrid(same));
  assert.throws(()=>readGrid({...DEMO,version:'unknown'}));
});
test('model cannot replace paths or claim mismatching literal recovery',()=>{
  const r=assembleCandidate({grid:DEMO.grid,paths:{evil:[]}});assert.deepEqual(r.document.paths,defaultPaths());
  assert.throws(()=>assembleCandidate({grid:DEMO.grid,literalReadings:{tategaki:'a plausible invention'}}));
  assert.match(r.semanticStatus,/model-composed interpretation beside locally verified grid readings/);
});
test('exact envelope independent of semantic reading and strict on malformed data',()=>{
  const payload='\uFEFF𝓛𝓲𝓵𝔂 🐈‍⬛\n e\u0301\t\r\n\u0000';const d=attachExactPayload(DEMO,payload);
  assert.equal(readExactPayload(d).payload,payload);const changed=clone(d);changed.grid[0][0]='夢';assert.equal(readExactPayload(changed).payload,payload);
  for(const mutation of [f=>f.length++,f=>f.crc32='00000000',f=>f.hexadecimal+='00',f=>f.hexadecimal='gg',f=>f.version='unknown']){const broken=clone(d);mutation(broken.exactPayload);assert.throws(()=>readExactPayload(broken));}
  assert.equal(readExactPayload(attachExactPayload(DEMO,'')).payload,'');
  assert.throws(()=>attachExactPayload(DEMO,'\ud800'));
});
