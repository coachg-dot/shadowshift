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
  for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:320,height:700}]){
   const page=await browser.newPage({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
   await page.locator('#world').waitFor({state:'visible'});
   await page.waitForTimeout(150);
   const overflow=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:window.innerWidth}));
   assert.ok(overflow.document<=overflow.viewport+2,'Horizontal overflow at '+viewport.width+'px: '+JSON.stringify(overflow));
   assert.equal(await page.locator('#floor').innerText(),'1');
   const dims=await page.locator('#world').evaluate(c=>({width:c.width,height:c.height}));
   assert.equal(dims.width,viewport.width<600?360:720);
   if(viewport.width<600){
    const controls=await page.locator('[data-move]').count();
    assert.equal(controls,4,'Mobile must have four directional controls');
    const touchSize=await page.locator('[data-move="up"]').boundingBox();
    assert.ok(touchSize&&touchSize.width>=44&&touchSize.height>=44,'Movement targets must be touch-friendly');
   }
   await page.locator('#nav-shop').click();
   assert.equal(await page.locator('#shop').isVisible(),true);
   await page.locator('#nav-locker').click();
   assert.equal(await page.locator('#locker').isVisible(),true);
   await page.locator('#nav-progress').click();
   assert.equal(await page.locator('#progress').isVisible(),true);
   await page.locator('#nav-game').click();
   await page.screenshot({path:'test-results/shadowshift-'+viewport.width+'-initial.png',fullPage:true});
   // Check actual movement input, not only direct game functions.
   await page.evaluate(()=>{monsters=[];p={x:1.5,y:1.5};});
   const beforeMove=await page.evaluate(()=>({x:p.x,y:p.y}));
   if(viewport.width<600){
    const right=page.locator('[data-move="right"]');
    const box=await right.boundingBox();
    assert.ok(box,'Right movement control must be visible');
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.up();
   }else{
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowRight');
   }
   const afterMove=await page.evaluate(()=>({x:p.x,y:p.y}));
   assert.ok(afterMove.x>beforeMove.x,'Right movement must actually move the character');

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
   await page.locator('#answers button').getByText(String(wrong),{exact:true}).click();
   assert.equal(await page.locator('#keys').innerText(),'0','Wrong answer cannot restore a cell');
   await page.locator('#answers button').getByText(String(result),{exact:true}).click();
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
    const correct=await page.evaluate(()=>q.result);
    await page.locator('#answers button').getByText(String(correct),{exact:true}).click();
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
   // Real browser interaction: Mega Cell, all four guardian gates, and final campaign.
   await page.evaluate(()=>{s.floor=9;s.cells=0;s.loot=[];s.lastRewardedFloor=8;configureFloor();spawnMonsters();monsters=[];paused=false;p={x:megaPoint().x+.5,y:megaPoint().y+.5};save();});
   if(viewport.width<600)await page.locator('#interactMobile').click();
   else await page.keyboard.press('e');
   assert.equal(await page.locator('#mathOverlay').isVisible(),true,'Mega Cell should open');
   assert.equal(await page.evaluate(()=>q.topic),'circles');
   const megaAnswer=await page.evaluate(()=>q.result);
   await page.locator('#answers button').getByText(String(megaAnswer),{exact:true}).click();
   assert.equal(await page.locator('#keys').innerText(),'3','Mega Cell restores all power');
   for(const floor of [10,20,30,40]){
    await page.evaluate(f=>{s.floor=f;s.cells=3;s.loot=[];s.lastRewardedFloor=f-1;configureFloor();spawnMonsters();monsters=[];paused=false;p={x:exit.x+.5,y:exit.y+.5};save();},floor);
    if(viewport.width<600)await page.locator('#interactMobile').click();
    else await page.keyboard.press('e');
    assert.equal(await page.locator('#mathOverlay').isVisible(),true,'Guardian '+floor+' should gate exit');
    for(let seal=0;seal<3;seal++){
     const correct=await page.evaluate(()=>q.result);
     await page.locator('#answers button').getByText(String(correct),{exact:true}).click();
    }
    assert.equal(await page.locator('#mathOverlay').isVisible(),false,'Guardian seals completed');
    if(viewport.width<600)await page.locator('#interactMobile').click();
    else await page.keyboard.press('e');
    assert.equal(await page.locator('#winOverlay').isVisible(),true,'Guardian '+floor+' cleared');
    assert.equal(await page.evaluate(f=>s.owned.includes(milestones[f].skin),floor),true,'Permanent milestone skin');
    await page.locator('#winOverlay button').click();
    if(floor===40){
     assert.equal(await page.locator('#floor').innerText(),'40','Campaign must stop at 40');
     assert.match(await page.locator('#winText').innerText(),/YOU DID IT/);
    }else{
     assert.equal(await page.locator('#floor').innerText(),String(floor+1));
    }
   }
   await page.evaluate(()=>{s.floor=2;s.cells=0;s.loot=[];s.lastRewardedFloor=1;configureFloor();spawnMonsters();monsters=[];paused=false;$('winOverlay').classList.add('hidden');$('winOverlay').querySelector('button').disabled=false;save();});
   // Unlock a super-rare relic through the visible shop challenge.
   await page.evaluate(()=>{s.mastery.circles=3;save();});
   await page.locator('#nav-shop').click();
   assert.equal(await page.locator('#masteryPreview').isVisible(),true);
   await page.locator('#masteryPreview button').first().click();
   assert.equal(await page.locator('#mathOverlay').isVisible(),true);
   const rareAnswer=await page.evaluate(()=>q.result);
   await page.locator('#answers button').getByText(String(rareAnswer),{exact:true}).click();
   assert.equal(await page.locator('#mathOverlay').isVisible(),false);
   assert.equal(await page.evaluate(()=>s.owned.includes('orbit')),true);
   await page.locator('#nav-locker').click();
   assert.equal(await page.evaluate(()=>s.skin),'orbit');
   await page.locator('#nav-game').click();
   await page.reload({waitUntil:'load'});
   assert.equal(await page.evaluate(()=>s.owned.includes('orbit')),true,'Rare unlock must persist');
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
