const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.REVIEW_CHROMIUM});
  const page=await browser.newPage({viewport:{width:1280,height:950}});const errors=[],remote=[],providerRequests=[];
  page.on('request',r=>{if(r.url().includes('/api/compose'))providerRequests.push(r.url());});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:'))remote.push(r.url());});
  try{
    const reviewURL=process.env.KANOTOKOYO_REVIEW_URL||process.env.KASANE_REVIEW_URL||'http://127.0.0.1:8767/';
    await page.goto(reviewURL);
    assert.equal(await page.locator('#compose').isDisabled(),false);
    assert.equal(await page.title(),'かのとこよ · 歌ノ常世');
    assert.equal(await page.locator('meta[name="description"]').getAttribute('content'),'かがみのしきしのみがか');
    assert.equal((await page.locator('h1').textContent()).normalize('NFKC'),'かのとこよ · 歌ノ常世 かがみのしきしのみがか');
    await page.getByRole('button',{name:'Load recovered Nekomata specimen'}).click();
    const receipt=JSON.parse(await page.locator('#receipt').textContent());
    assert.equal(receipt.readings.migi_yokogaki,'秘猫又今醒隠影爪閃動妖魂夜歌招変相双尾舞起動形真現');
    assert.equal(await page.locator('#grid>span').count(),25);
    assert.equal(receipt.version,'kasane-uta.grid.v1');
    await page.getByRole('button',{name:'Load source-backed Kitsune specimen'}).click();
    const fox=JSON.parse(await page.locator('#receipt').textContent());
    assert.equal(fox.readings.tategaki,'夜稲面白狐霧荷影妖火深山揺九燃露道灯尾夢見遠下舞跡');
    assert.equal(fox.readings.migi_yokogaki,'夜霧深露見稲荷山道遠面影揺灯下白妖九尾舞狐火燃夢跡');
    await page.locator('#exact').fill('hello');await page.locator('#attach').click();
    const pendingDownload=page.waitForEvent('download');await page.locator('#download').click();
    const download=await pendingDownload;assert.equal(download.suggestedFilename(),'kasane-uta-grid.json');
    const document=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(document.version,'kasane-uta.grid.v1');
    assert.deepEqual(document.exactPayload,{version:'kasane-uta.utf8-hex.v1',length:5,hexadecimal:'68656c6c6f',crc32:'3610a686'});
    for(const name of ['Tamakone','Yotaki','Binetsuki'])await page.getByRole('button',{name:'Turn '+name}).click();
    for(const reveal of ['猫又','来たよ','狐火'])assert.ok((await page.locator('#naming-cards').textContent()).includes(reveal));
    fs.mkdirSync('output',{recursive:true});await page.locator('#naming-cards').screenshot({path:'output/naming-cards-desktop.png'});
    assert.ok(await page.locator('[data-garden-register]').count()>20);
    const plainNarrative=await page.evaluate(()=>{
      const walker=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT),found=[];
      while(walker.nextNode()){const node=walker.currentNode;if(node.parentElement.closest('pre,code,textarea,input,[data-literal],[aria-live]'))continue;if(/[A-Za-z]/.test(node.nodeValue))found.push(node.nodeValue);}
      return found;
    });
    assert.deepEqual(plainNarrative,[]);
    await page.screenshot({path:'output/workshop-desktop.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.equal(await page.locator('h1').evaluate(node=>getComputedStyle(node).wordBreak),'keep-all');
    await page.locator('#naming-cards').screenshot({path:'output/naming-cards-mobile.png'});
    await page.screenshot({path:'output/workshop-mobile.png',fullPage:true});
    const staticURL=reviewURL+'?static=1';
    await page.route(staticURL,route=>route.fulfill({status:200,contentType:'text/html',body:fs.readFileSync('index.html','utf8')}));
    await page.goto(staticURL);
    assert.equal(await page.locator('#compose').isDisabled(),true);
    assert.equal(await page.locator('#interpret').isDisabled(),true);
    assert.equal(await page.locator('#key').isDisabled(),true);
    assert.match((await page.locator('#adapter-status').textContent()).normalize('NFKC'),/provider buttons are disabled/);
    assert.equal(await page.locator('#grid>span').count(),25);
    assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);assert.deepEqual(providerRequests,[]);
    console.log('PASS: chosen kana identity, full-catalog lettering, exact Nekomata/Kitsune paths and envelope downloads, cards, desktop/mobile layout, static provider guards; no provider or remote requests.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
