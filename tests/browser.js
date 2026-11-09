// Real Chromium browser smoke test (desktop + phone emulation).
// Run after: npm install --no-save playwright && npx playwright install chromium
// Start a local server at http://127.0.0.1:8765 before running.
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
fs.mkdirSync('test-results',{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
   const page=await browser.newPage({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
   await page.locator('#world').waitFor({state:'visible'});
   await page.waitForTimeout(150);
   assert.equal(await page.locator('#floor').innerText(),'1');
   const dims=await page.locator('#world').evaluate(c=>({width:c.width,height:c.height}));
   assert.equal(dims.width,viewport.width<600?360:720);
   await page.locator('#nav-shop').click();
   assert.equal(await page.locator('#shop').isVisible(),true);
   await page.locator('#nav-locker').click();
   assert.equal(await page.locator('#locker').isVisible(),true);
   await page.locator('#nav-progress').click();
   assert.equal(await page.locator('#progress').isVisible(),true);
   await page.locator('#nav-game').click();
   await page.screenshot({path:'test-results/shadowshift-'+viewport.width+'-initial.png',fullPage:true});
   await page.getByRole('button',{name:/30-sec Safe Room/}).click();
   assert.equal(await page.locator('#breakOverlay').isVisible(),true);
   assert.equal(await page.evaluate(()=>paused),true);
   await page.getByRole('button',{name:'Return when ready'}).click();
   assert.equal(await page.locator('#breakOverlay').isVisible(),false);
   await page.evaluate(()=>{p={x:terminals[0].x+.5,y:terminals[0].y+.5};monsters=[];});
   if(viewport.width<600)await page.locator('#interactMobile').click();
   else await page.keyboard.press('e');
   assert.equal(await page.locator('#mathOverlay').isVisible(),true);
   const result=await page.evaluate(()=>q.result);
   await page.locator('#nav-shop').evaluate(b=>b.click());
   assert.equal(await page.locator('#shop').isVisible(),false,'Shop must not interrupt math');
   const wrong=await page.evaluate(()=>q.options.find(n=>n!==q.result));
   await page.evaluate(value=>answer(value),wrong);
   assert.equal(await page.locator('#keys').innerText(),'0','Wrong answer cannot restore a cell');
   await page.evaluate(value=>answer(value),result);
   assert.equal(await page.locator('#mathOverlay').isVisible(),false);
   assert.equal(await page.locator('#keys').innerText(),'1');
   await page.reload({waitUntil:'load'});
   assert.equal(await page.locator('#keys').innerText(),'1');
   // Complete a floor through its three terminals and the exit.
   await page.evaluate(()=>{monsters=[];});
   for(let i=1;i<3;i++){
    await page.evaluate(i=>{p={x:terminals[i].x+.5,y:terminals[i].y+.5};},i);
    if(viewport.width<600)await page.locator('#interactMobile').click();
    else await page.keyboard.press('e');
    assert.equal(await page.locator('#mathOverlay').isVisible(),true);
    await page.evaluate(()=>answer(q.result));
    assert.equal(await page.locator('#keys').innerText(),String(i+1));
   }
   await page.evaluate(()=>{p={x:exit.x+.5,y:exit.y+.5};});
   if(viewport.width<600)await page.locator('#interactMobile').click();
   else await page.keyboard.press('e');
   assert.equal(await page.locator('#winOverlay').isVisible(),true);
   const rewardCoins=await page.locator('#coins').innerText();
   if(viewport.width<600){
    await page.reload({waitUntil:'load'});
    assert.equal(await page.locator('#floor').innerText(),'2','Reloading on win must resume at next floor');
    assert.equal(await page.locator('#coins').innerText(),rewardCoins,'Reload must not duplicate rewards');
   }else{
    await page.locator('#winOverlay button').click();
    assert.equal(await page.locator('#floor').innerText(),'2');
   }
   await page.reload({waitUntil:'load'});
   assert.equal(await page.locator('#floor').innerText(),'2');
   await page.screenshot({path:'test-results/shadowshift-'+viewport.width+'-floor2.png',fullPage:true});
   await page.locator('#effectsToggle').click();
   assert.match(await page.locator('#effectsToggle').innerText(),/LOW/);
   await page.reload({waitUntil:'load'});
   assert.match(await page.locator('#effectsToggle').innerText(),/LOW/);
   await page.screenshot({path:'test-results/shadowshift-'+viewport.width+'-saved.png',fullPage:true});
   // A malformed save must not break startup or strand the player.
   await page.evaluate(()=>localStorage.setItem('shadowshift_survival_v1',JSON.stringify({floor:-5,coins:'broken',owned:null,loot:null,facts:[]})));
   await page.reload({waitUntil:'load'});
   assert.equal(await page.locator('#floor').innerText(),'1','Corrupt save must recover to floor 1');
   assert.equal(await page.locator('#coins').innerText(),'0','Invalid coins must recover safely');
   await page.evaluate(()=>localStorage.removeItem('shadowshift_survival_v1'));
   assert.deepEqual(errors,[],'Browser JavaScript errors: '+errors.join(', '));
   await page.close();
   console.log('PASS Chromium',viewport.width+'x'+viewport.height,'navigation, break, math, modal safety, save/reload, graphics');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
