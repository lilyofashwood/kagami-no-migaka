// Chosen presentation; historical method and serialized document IDs stay stable.
export const PROJECT=Object.freeze({name:'Kagami-no-Migaka',description:'かがみのしきしのみがか',nameStatus:'chosen',historicalMethod:'Kasaneuta',historicalKanji:'重ね歌',repository:'lilyofashwood/kagami-no-migaka',repositoryNameTemporary:false});
// A former title now lives in the README's poetry, not in the active project identity.
export const POETIC_REVERSAL=Object.freeze({kana:'かのとこよ',kanji:'歌ノ常世',reverseKana:'よことのか',reverseKanji:'夜言ノ香',status:'preserved_readme_poetry',isPalindrome:false,kanjiFacesReverse:false});
export const VERSION='kasane-uta.grid.v1';
function scalarText(text){
  if(typeof text!=='string')throw new Error('Expected text.');
  for(const c of text)if(c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff)throw new Error('Unpaired surrogate rejected.');
  return text;
}
export function graphemes(text){return [...new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(scalarText(text))].map(x=>x.segment);}
export function validateGrid(grid){
  if(!Array.isArray(grid)||grid.length!==5||grid.some(row=>!Array.isArray(row)||row.length!==5))throw new Error('Grid must contain exactly 5 rows of 5 cells.');
  for(const row of grid)for(const cell of row){
    if(graphemes(cell).length!==1||/[\p{Cc}\p{Cf}]/u.test(cell.replaceAll('\u200d','')))throw new Error('Every cell must contain one visible Unicode grapheme.');
    if(!/[\p{L}\p{N}\p{P}\p{S}]/u.test(cell))throw new Error('Every cell must include a visible letter, number, punctuation mark or symbol.');
  }
  return grid;
}
export function defaultPaths(){
  // Columns right-to-left/top-to-bottom; rows top-to-bottom/right-to-left.
  // Checked against the recovered A–Y geometry; documentary sources remain local.
  return {tategaki:Array.from({length:25},(_,i)=>[i%5,4-Math.floor(i/5)]),
    migi_yokogaki:Array.from({length:25},(_,i)=>[Math.floor(i/5),4-i%5])};
}
export function validatePath(path,name='path'){
  if(!Array.isArray(path)||path.length!==25)throw new Error(`${name} must visit 25 cells.`);
  const seen=new Set();
  for(const pair of path){
    if(!Array.isArray(pair)||pair.length!==2||pair.some(x=>!Number.isInteger(x)||x<0||x>4))throw new Error(`${name} coordinates must be integer [row,column] pairs between 0 and 4.`);
    const key=pair.join(',');if(seen.has(key))throw new Error(`${name} visits a cell more than once.`);seen.add(key);
  }
  return path;
}
export function readGrid(document){
  if(!document||document.version!==VERSION)throw new Error('Missing or unsupported grid format version.');
  const {grid,paths}=document;validateGrid(grid);
  if(!paths||typeof paths!=='object'||Array.isArray(paths)||Object.keys(paths).length<2||Object.keys(paths).length>8)throw new Error('Supply 2–8 explicitly named paths.');
  const readings={};const traversals=new Set();
  for(const [name,path]of Object.entries(paths)){
    if(!/^[a-z][a-z0-9_]{0,39}$/.test(name))throw new Error('Path names must be short ASCII identifiers.');
    validatePath(path,name);const signature=JSON.stringify(path);
    if(traversals.has(signature))throw new Error('Reading paths must be distinct.');traversals.add(signature);
    readings[name]=path.map(([r,c])=>grid[r][c]).join('');
  }
  return {version:VERSION,status:'positions verified',readings,grid,paths,
    meaning:'Exact literal path strings, ready to read alongside the poem’s layered meanings.'};
}
export function gridFromLines(text){
  const rows=scalarText(text).split(/\r?\n/);return validateGrid(rows.map(graphemes));
}
export function assembleCandidate(candidate,paths=defaultPaths()){
  if(!candidate||!Array.isArray(candidate.grid))throw new Error('Model must return a grid array.');
  // Paths are chosen locally. Model-supplied replacements are not adopted.
  const document={version:VERSION,grid:candidate.grid,paths};
  const receipt=readGrid(document);
  if(candidate.literalReadings!==undefined){
    if(!candidate.literalReadings||typeof candidate.literalReadings!=='object')throw new Error('Invalid literal readings.');
    for(const [name,actual] of Object.entries(receipt.readings))
      if(candidate.literalReadings[name]!==actual)throw new Error(`Model literal reading for ${name} disagrees with local traversal.`);
  }
  return {document,receipt,interpretations:candidate.interpretations??null,
    semanticStatus:'model-composed interpretation beside locally verified grid readings'};
}
// Optional exact-byte lane: a NEW envelope carried beside the semantic grid.
// It is deliberately explicit, and does not pretend arbitrary bytes are kanji polysemy.
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
export function attachExactPayload(document,payload){
  readGrid(document);const bytes=new TextEncoder().encode(scalarText(payload));
  if(bytes.length>1048576)throw new Error('Exact payload exceeds 1 MiB.');
  const hexadecimal=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  return {...document,exactPayload:{version:'kasane-uta.utf8-hex.v1',length:bytes.length,hexadecimal,crc32:crc32(bytes).toString(16).padStart(8,'0')}};
}
export function readExactPayload(document){
  readGrid(document);const f=document.exactPayload;
  if(!f||f.version!=='kasane-uta.utf8-hex.v1')throw new Error('No supported exact payload envelope.');
  if(typeof f.hexadecimal!=='string'||!/^(?:[0-9a-f]{2})*$/u.test(f.hexadecimal)||!Number.isSafeInteger(f.length)||f.length<0||f.length>1048576||f.hexadecimal.length!==f.length*2)throw new Error('Malformed exact payload length or hexadecimal.');
  const bytes=Uint8Array.from(f.hexadecimal.match(/../g)??[],x=>parseInt(x,16));
  if(f.crc32!==crc32(bytes).toString(16).padStart(8,'0'))throw new Error('Exact payload checksum mismatch.');
  return {status:'verified',payload:new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes),meaning:'Exact bytes from the explicit envelope; independent of the grid’s poetic interpretation.'};
}
export const DEMO={version:VERSION,grid:[['月','光','映','静','庭'],['風','渡','葉','夢','路'],['花','影','眠','水','音'],['雲','間','星','夜','歌'],['朝','露','残','遠','空']],paths:defaultPaths(),
  provenance:'New structural demonstration, 2026-09-10; not a recovered historical poem. Literary validity has not been established.'};

export const NEKOMATA_REPORT={version:VERSION,
  grid:[['醒','今','又','猫','秘'],['動','閃','爪','影','隠'],['招','歌','夜','魂','妖'],['舞','尾','双','相','変'],['現','真','形','動','起']],
  paths:defaultPaths(),
  provenance:'Recovered selected Nekomata grid, R=歌; checked against the subsequently supplied primary capture. Local tests verify exact geometry, not authorship metadata or grammatical meaning.'};

export const KITSUNE_SPECIMEN={version:VERSION,
  grid:[['見','露','深','霧','夜'],['遠','道','山','荷','稲'],['下','灯','揺','影','面'],['舞','尾','九','妖','白'],['跡','夢','燃','火','狐']],
  paths:defaultPaths(),
  provenance:'Exact grid from the supplied 狐火重ね詩 — Kitsune Kasaneuta React artifact. Original source SHA-256: 8aef3136a8e967753e279d7a471467c647281e2f06d71e5da644013e2bf83354. Geometry is verified; supplied English glosses accompany the poem as literary interpretations.'};

export const NAMING_CARDS=Object.freeze([
  Object.freeze({id:'tamakone',front:'魂こね',alternative:'魂捏ね',kana:'たまこね',romanization:'Tamakone',gloss:'Soul-kneading',reverseKana:'ねこまた',reveal:'猫又',revealGloss:'Nekomata'}),
  Object.freeze({id:'yotaki',front:'夜滝',kana:'よたき',romanization:'Yotaki',gloss:'Night waterfall',reverseKana:'きたよ',reveal:'来たよ',revealGloss:"I've arrived / It has arrived; subject unstated"}),
  Object.freeze({id:'binetsuki',front:'微熱記',kana:'びねつき',romanization:'Binetsuki',gloss:'A chronicle of slight fever',reverseKana:'きつねび',reveal:'狐火',revealGloss:'Foxfire'})
]);
export function turnNamingCard(id){
  const card=NAMING_CARDS.find(card=>card.id===id);
  if(!card)throw new Error('Unknown preserved naming card.');
  const reversed=graphemes(card.kana).reverse().join('');
  if(reversed!==card.reverseKana)throw new Error('Stored kana reversal does not match.');
  return {...card,reversed,status:'exact supplied kana reversal verified',
    boundary:'A preserved naming card with an exact kana reversal and its chosen poetic reveal. The selected title is Kagami-no-Migaka; Kasaneuta remains the historical method.'};
}
