// Shadowshift dependency-free smoke tests. Run: node tests/smoke.js
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const script=html.split('<script>').pop().split('</script>')[0];
function run(width,height){
 const elements=new Map(),handlers={};
 const canvasContext=new Proxy({}, {get:(_,key)=>key==='createRadialGradient'||key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true});
 function element(){
  const classes=new Set(['hidden']);
  return {style:{},dataset:{},classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(k,force){if(force??!classes.has(k))classes.add(k);else classes.delete(k)}},setAttribute(){},appendChild(){},addEventListener(){},getContext(){return canvasContext},querySelector(){return element()}};
 }
 const document={hidden:false,getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element,querySelectorAll:()=>[],addEventListener(k,cb){handlers[k]=cb}};
 const storage=new Map();
 const window={innerWidth:width,innerHeight:height,matchMedia:()=>({matches:false}),addEventListener(){},setInterval(){},clearInterval(){}};
 const sandbox={document,window,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame(){},setInterval(){return 1},clearInterval(){},console,Math,Set,Map};
 vm.createContext(sandbox);
 vm.runInContext(script,sandbox,{timeout:2000});
 // Damaged save files should not prevent the game from booting.
 const malformed=[
  '{"floor":-9,"coins":"oops","owned":null,"facts":[]}',
  '{"floor":2,"owned":["lamp",42,"lamp"],"loot":false,"holidayStarts":null}',
  '{"floor":3,"facts":{"2+2":null,"3+4":{"right":"bad","wrong":2}}}',
  'null'
 ];
 for(const raw of malformed){
  storage.set('shadowshift_survival_v1',raw);
  const restored=vm.runInContext('restoreProgress(JSON.parse(localStorage.getItem("shadowshift_survival_v1")))',sandbox);
  assert.ok(restored.floor>=1&&Number.isFinite(restored.coins)&&Array.isArray(restored.owned));
 }
 const missedGeometry=vm.runInContext('restoreProgress({mastery:{circles:3,algebra:2},facts:{"circles:Find the circumference. Diameter = 8 units. Use π = 3.14. Round to 2 decimals.":{right:1,wrong:2},"algebra:Solve for x: 2x + 3 = 13":{right:0,wrong:1}}})',sandbox);
 assert.equal(missedGeometry.mastery.circles,3);
 assert.equal(missedGeometry.mastery.algebra,2);
 assert.equal(Object.keys(missedGeometry.facts).length,2,'Geometry and algebra retries must survive reload');
 const inconsistent=vm.runInContext('restoreProgress({floor:4,cells:3,loot:["floor4term0","floor4term2"]})',sandbox);
 assert.equal(inconsistent.cells,2,'Recovered cell count must match restored terminals');
 storage.delete('shadowshift_survival_v1');
 const checks=`
 let problems=[];
 for(let floor=1;floor<=18;floor++){
  s.floor=floor;configureFloor();spawnMonsters();
  if(floor===1&&monsters.length!==2)problems.push('intro enemy count');
  for(let i=0;i<monsters.length;i++){
   const m=monsters[i];
   if(!traversable(Math.floor(m.x),Math.floor(m.y)))problems.push('wall spawn '+floor);
   for(let j=i+1;j<monsters.length;j++)if(Math.hypot(m.x-monsters[j].x,m.y-monsters[j].y)<1.5)problems.push('overlap '+floor);
  }
  for(const item of [...terminals,...chests,exit,missionPoint(),...hidingSpots]){
   if(!traversable(item.x,item.y)||!findPath(1.5,1.5,item.x+.5,item.y+.5).length)problems.push('unreachable '+floor);
  }
  for(const effects of [true,false]){visualEffects=effects;update(.016);draw()}
  if(!nextObjective().route)problems.push('compass '+floor);
 }
 s.floor=1;s.cells=0;configureFloor();activeTerminal=0;openMath();
 const incorrect=q.options.find(n=>n!==q.result),before=s.coins;
 answer(incorrect);
 if(s.coins!==before||s.cells!==0)problems.push('wrong answer reward');
 answer(q.result);const after=s.coins;answer(q.result);
 if(s.coins!==after||s.cells!==1)problems.push('duplicate answer reward');
 // Game simulation must freeze behind math puzzles and menus.
 const frozenTick=tick;
 $('mathOverlay').classList.remove('hidden');paused=false;
 update(.25);
 if(tick!==frozenTick)problems.push('simulation advanced under math overlay');
 $('mathOverlay').classList.add('hidden');
 view('shop');const menuTick=tick;
 update(.25);
 if(tick!==menuTick)problems.push('simulation advanced in shop');
 view('game');
 // A floor can be rewarded once, even after repeated interaction.
 s.cells=3;paused=false;
 const cleared=s.clears,clearCoins=s.coins;
 clearFloor();
 if(s.clears!==cleared+1||s.coins!==clearCoins+75)problems.push('floor reward missing');
 const savedAfterWin=JSON.parse(localStorage.getItem('shadowshift_survival_v1'));
 if(savedAfterWin.lastRewardedFloor!==1)problems.push('floor reward marker missing');
 const recovered=restoreProgress(savedAfterWin);
 if(recovered.lastRewardedFloor!==1)problems.push('floor reward marker lost on reload');
 const paid=s.coins;clearFloor();
 if(s.coins!==paid||s.clears!==cleared+1)problems.push('duplicate floor reward');
 advance();const advanced=s.floor;advance();
 if(advanced!==2||s.floor!==2||s.cells!==0)problems.push('floor advance repeated');
 // Confirm progress was persisted and can be parsed.
 if(!JSON.parse(localStorage.getItem('shadowshift_survival_v1')).floor)problems.push('save missing');
 // Teacher-aligned geometry and pre-algebra generate valid answer choices.
 for(const topic of ['circles','algebra']){
  for(let i=0;i<50;i++){
   const question=makeLearningQ(topic);
   if(!question.options.includes(question.result)||new Set(question.options).size!==4||!question.hint)problems.push('invalid '+topic+' question');
  }
 }
 // Rare mastery skins require the goal and a correct final answer.
 const relic=masteryRelics[0];s.mastery.circles=0;
 startMastery(relic);
 if(masteryChallenge)problems.push('rare unlocked too early');
 s.mastery.circles=relic.goal;view('shop');startMastery(relic);
 if(masteryChallenge!==relic)problems.push('rare challenge did not open');
 else {
  answer(q.options.find(n=>n!==q.result));
  if(s.owned.includes(relic.id))problems.push('wrong rare answer unlocked skin');
  answer(q.result);
  if(!s.owned.includes(relic.id)||s.skin!==relic.id)problems.push('rare skin not equipped');
  const restoredRare=restoreProgress(JSON.parse(localStorage.getItem('shadowshift_survival_v1')));
  if(!restoredRare.owned.includes(relic.id)||restoredRare.mastery.circles!==relic.goal)problems.push('rare save failed');
 }
 // Seasonal challenge unlocks once, and cannot be completed twice.
 const holiday=holidays[0];s.correct=holiday.goal;s.holidayStarts[holiday.id]=0;
 holidayStart(holiday);
 if(!holidayChallenge)problems.push('seasonal challenge did not open');
 else {
  answer(q.result);
  if(!s.owned.includes(holiday.id))problems.push('seasonal unlock missing');
  const ownedCount=s.owned.filter(id=>id===holiday.id).length;
  answer(q.result);holidayStart(holiday);
  if(s.owned.filter(id=>id===holiday.id).length!==ownedCount)problems.push('seasonal duplicate');
 }
 problems;`;
 const problems=vm.runInContext(checks,sandbox,{timeout:5000});
 assert.equal(problems.length,0,problems.join('; '));
 console.log('PASS',width+'x'+height,'18 floors, pathfinding, enemy placement, effects, math rewards');
}
run(390,844);run(1280,800);
