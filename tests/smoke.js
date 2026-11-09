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
 // A floor can be rewarded once, even after repeated interaction.
 s.cells=3;paused=false;
 const cleared=s.clears,clearCoins=s.coins;
 clearFloor();
 if(s.clears!==cleared+1||s.coins!==clearCoins+75)problems.push('floor reward missing');
 const paid=s.coins;clearFloor();
 if(s.coins!==paid||s.clears!==cleared+1)problems.push('duplicate floor reward');
 advance();const advanced=s.floor;advance();
 if(advanced!==2||s.floor!==2||s.cells!==0)problems.push('floor advance repeated');
 // Confirm progress was persisted and can be parsed.
 if(!JSON.parse(localStorage.getItem('shadowshift_survival_v1')).floor)problems.push('save missing');
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
