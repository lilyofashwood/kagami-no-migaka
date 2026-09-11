const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.REVIEW_CHROMIUM});
  const page=await browser.newPage({viewport:{width:1280,height:950}});const errors=[],remote=[],providerRequests=[];
  page.on('request',r=>{if(r.url().includes('/api/compose'))providerRequests.push(r.url());});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:'))remote.push(r.url());});
  try{
    const reviewURL=process.env.KAGAMI_NO_MIGAKA_REVIEW_URL||process.env.KASANE_REVIEW_URL||'http://127.0.0.1:8767/';
    await page.goto(reviewURL);
    const coda=JSON.parse(fs.readFileSync('data/farm-coda.json','utf8'));
    assert.equal(await page.locator('#the-farm').getAttribute('open'),null);
    assert.equal(await page.locator('#adapter-status').evaluate(el=>el.parentElement.contains(document.querySelector('#compose'))),true);
    await page.goto(reviewURL+'#the-farm');
    await page.waitForFunction(()=>document.querySelector('#the-farm').open);
    assert.deepEqual(await page.locator('.farm-plain').allTextContents(),coda.paragraphs);
    assert.equal(await page.locator('.farm-plain').first().evaluate(el=>getComputedStyle(el).clipPath),'inset(50%)');
    const cup=await page.locator('#farm-carrier').textContent();
    const reveal=page.getByRole('button',{name:'Look under the cup'});
    assert.equal(await reveal.getAttribute('aria-expanded'),'false');
    assert.equal(await page.locator('#farm-recovered').isVisible(),false);
    await reveal.click();
    assert.equal(await page.locator('#farm-recovered').textContent(),coda.hiddenMessage);
    assert.equal(await page.locator('#farm-recovered').getAttribute('aria-label'),null);
    assert.equal(await reveal.getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('#farm-carrier').textContent(),cup);
    // A damaged carrier must clear the old result; restoring the wire restores exact output.
    await page.locator('#farm-carrier').evaluate(el=>el.textContent=Array.from(el.textContent).filter(c=>c.codePointAt(0)<0xE0100||c.codePointAt(0)>0xE017F).join(''));
    await reveal.click();
    assert.equal(await page.locator('#farm-recovered').getAttribute('aria-label'),'Hidden characters are absent from this copy.');
    assert.doesNotMatch(await page.locator('#farm-recovered').textContent(),/[A-Za-z]/);
    await page.locator('#farm-carrier').evaluate((el,text)=>el.textContent=text,cup);
    await reveal.click();
    assert.equal(await page.locator('#farm-recovered').textContent(),coda.hiddenMessage);
    assert.equal(await page.locator('#farm-recovered').getAttribute('aria-label'),null);
    fs.mkdirSync('output',{recursive:true});
    await page.locator('#the-farm').screenshot({path:'output/farm-coda-desktop.png'});
    for(const width of [390,320]){
      await page.setViewportSize({width,height:844});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.locator('#the-farm').screenshot({path:'output/farm-coda-'+width+'.png'});
    }
    await page.setViewportSize({width:1280,height:950});
    assert.equal(await page.locator('#compose').isDisabled(),false);
    assert.equal((await page.title()).normalize('NFKC'),'kagami-no-migaka');
    assert.doesNotMatch(await page.title(),/[A-Za-z]/);
    for(const id of ['exact-result','model-result']){
      assert.doesNotMatch(await page.locator('#'+id).textContent(),/[A-Za-z]/);
      assert.match(await page.locator('#'+id).getAttribute('aria-label'),/[A-Za-z]/);
    }
    await page.locator('#forget').click();
    assert.equal(await page.locator('#model-result').getAttribute('aria-label'),'Key cleared from the page.');
    assert.doesNotMatch(await page.locator('#model-result').textContent(),/[A-Za-z]/);
    await page.locator('#compose').click();
    await page.waitForFunction(()=>document.querySelector('#model-result').getAttribute('aria-label')==='Request stopped: Enter a model ID.');
    assert.doesNotMatch(await page.locator('#model-result').textContent(),/[A-Za-z]/);
    await page.locator('#recover').click();
    assert.match(await page.locator('#exact-result').getAttribute('aria-label'),/^Rejected:/);
    assert.doesNotMatch(await page.locator('#exact-result').textContent(),/[A-Za-z]/);
    assert.equal(await page.locator('h1').getAttribute('aria-label'),'Kagami-no-Migaka');
    assert.equal(await page.locator('meta[name="description"]').getAttribute('content'),'かがみのしきしのみがか');
    assert.equal((await page.locator('h1').textContent()).normalize('NFKC'),'kagami-no-migaka かがみのしきしのみがか');
    await page.getByRole('button',{name:'Load recovered Nekomata specimen'}).click();
    const receipt=JSON.parse(await page.locator('#receipt').textContent());
    assert.equal(receipt.readings.migi_yokogaki,'秘猫又今醒隠影爪閃動妖魂夜歌招変相双尾舞起動形真現');
    assert.equal(await page.locator('#grid>span').count(),25);
    assert.equal(receipt.version,'kasane-uta.grid.v1');
    await page.getByRole('button',{name:'Load source-backed Kitsune specimen'}).click();
    const fox=JSON.parse(await page.locator('#receipt').textContent());
    assert.equal(fox.readings.tategaki,'夜稲面白狐霧荷影妖火深山揺九燃露道灯尾夢見遠下舞跡');
    assert.equal(fox.readings.migi_yokogaki,'夜霧深露見稲荷山道遠面影揺灯下白妖九尾舞狐火燃夢跡');
    const exact='\uFEFFhello 🐈‍⬛ e\u0301\t\r\n';
    await page.locator('#exact').fill(exact);await page.locator('#attach').click();
    // Native textarea newline handling is independent of the codec; capture entered bytes.
    const entered=await page.locator('#exact').inputValue();
    assert.equal(JSON.parse(await page.locator('#exact-result').textContent()).payload,entered);
    assert.equal(await page.locator('#exact-result').getAttribute('aria-label'),null);
    await page.locator('#exact').fill('hello');await page.locator('#attach').click();
    const pendingDownload=page.waitForEvent('download');await page.locator('#download').click();
    const download=await pendingDownload;assert.equal(download.suggestedFilename(),'kasane-uta-grid.json');
    const document=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(document.version,'kasane-uta.grid.v1');
    assert.deepEqual(document.exactPayload,{version:'kasane-uta.utf8-hex.v1',length:5,hexadecimal:'68656c6c6f',crc32:'3610a686'});
    for(const name of ['Tamakone','Yotaki','Binetsuki'])await page.getByRole('button',{name:'Turn '+name}).click();
    for(const reveal of ['猫又','来たよ','狐火'])assert.ok((await page.locator('#naming-cards').textContent()).includes(reveal));
    for(const output of await page.locator('#naming-cards [aria-live]').all()){
      assert.doesNotMatch(await output.textContent(),/[A-Za-z]/);
      assert.match(await output.getAttribute('aria-label'),/[A-Za-z]/);
    }
    fs.mkdirSync('output',{recursive:true});await page.locator('#naming-cards').screenshot({path:'output/naming-cards-desktop.png'});
    assert.ok(await page.locator('[data-garden-register]').count()>20);
    const plainNarrative=await page.evaluate(()=>{
      const walker=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT),found=[];
      while(walker.nextNode()){const node=walker.currentNode;if(node.parentElement.closest('code,textarea,input,[data-literal]'))continue;if(/[A-Za-z]/.test(node.nodeValue))found.push(node.nodeValue);}
      return found;
    });
    assert.deepEqual(plainNarrative,[]);
    await page.screenshot({path:'output/workshop-desktop.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.equal(await page.locator('h1').evaluate(node=>getComputedStyle(node).wordBreak),'keep-all');
    await page.locator('#naming-cards').screenshot({path:'output/naming-cards-mobile.png'});
    await page.screenshot({path:'output/workshop-mobile.png',fullPage:true});
    const expected={structural:'庭静映光月路夢葉渡風音水眠影花歌夜星間雲空遠残露朝',nekomata:'秘猫又今醒隠影爪閃動妖魂夜歌招変相双尾舞起動形真現',kitsune:'夜霧深露見稲荷山道遠面影揺灯下白妖九尾舞狐火燃夢跡'};
    for(const specimen of ['structural','nekomata','kitsune','unknown','__proto__']){
      await page.goto(reviewURL+'?specimen='+specimen+'&payload=not-imported&key=not-imported');
      await page.waitForFunction(()=>document.querySelector('#grid').children.length===25);
      assert.equal(JSON.parse(await page.locator('#receipt').textContent()).readings.migi_yokogaki,Object.hasOwn(expected,specimen)?expected[specimen]:expected.structural);
      assert.equal(await page.locator('#key').inputValue(),'');assert.equal((await page.locator('#exact').inputValue()).startsWith('The door remembers.'),true);
    }
    const staticURL=reviewURL+'?static=1';
    await page.route(staticURL,route=>route.fulfill({status:200,contentType:'text/html',body:fs.readFileSync('index.html','utf8')}));
    await page.goto(staticURL);
    assert.equal(await page.locator('#compose').isDisabled(),true);
    assert.equal(await page.locator('#interpret').isDisabled(),true);
    assert.equal(await page.locator('#key').isDisabled(),true);
    assert.match((await page.locator('#adapter-status').textContent()).normalize('NFKC'),/provider buttons are disabled/);
    assert.equal(await page.locator('#grid>span').count(),25);
    await page.locator('#compose').evaluate(element=>element.onclick());
    assert.doesNotMatch(await page.locator('#model-result').textContent(),/[A-Za-z]/);
    assert.match(await page.locator('#model-result').getAttribute('aria-label'),/Static pages do not send/);
    assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);assert.deepEqual(providerRequests,[]);
    console.log('PASS: fictional coda and exact Ghost Hex reveal, chosen Roman identity and separate poetic kana, full-catalog lettering, exact Nekomata/Kitsune paths and envelope downloads, cards, desktop/mobile layout, static provider guards; no provider or remote requests.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
