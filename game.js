// DinoWars IO - game.js
'use strict';

const WORLD_W = 3200, WORLD_H = 3200, TILE = 64;
const RESPAWN_SEC = 5, BOT_COUNT = 18, MAX_LEVEL = 15;
const XP_TABLE = Array.from({length: MAX_LEVEL}, (_, i) => Math.floor(100 * Math.pow(1.35, i)));
const RES = { MEAT:'meat', CRYSTAL:'crystal', HERB:'herb', FIRE:'fire' };

const DINOS = [
  { id:'trex',   name:'暴龍 T-Rex',  type:'高攻擊型', emoji:'🦖', color:'#ef4444',
    desc:'每次攻擊有 20% 暴擊機率，暴擊傷害 ×2.5，天生霸主。',
    stats:{hp:80,atk:10,spd:4.5,def:4}, statBars:{HP:65,ATK:100,SPD:60,DEF:40},
    passiveName:'暴擊猛擊', passiveDesc:'20% 暴擊率，暴擊 ×2.5',
    qSkill:{name:'猛咬',icon:'🔥',desc:'造成 250% 傷害的強力撕咬',cd:6,fn:'bite'},
    eSkill:{name:'怒吼',icon:'💢',desc:'範圍恐嚇，敵人減速50%持續3秒',cd:12,fn:'roar'} },
  { id:'trice',  name:'三角龍',      type:'高防禦型', emoji:'🐉', color:'#3b82f6',
    desc:'擁有最高防禦力，被攻擊時護盾效果，持久戰優勢。',
    stats:{hp:140,atk:6,spd:3.5,def:12}, statBars:{HP:100,ATK:50,SPD:40,DEF:100},
    passiveName:'堅甲', passiveDesc:'傷害-20%，每5秒回復3HP',
    qSkill:{name:'衝撞',icon:'🛡️',desc:'向前衝撞造成傷害並擊退',cd:7,fn:'charge'},
    eSkill:{name:'護盾壁',icon:'🔵',desc:'4秒護盾，免疫60%傷害',cd:15,fn:'shield'} },
  { id:'raptor', name:'迅猛龍',      type:'高速度型', emoji:'🦅', color:'#10b981',
    desc:'移動速度最快，連擊時有連鎖加成，閃避率超群。',
    stats:{hp:70,atk:7,spd:8,def:3}, statBars:{HP:55,ATK:65,SPD:100,DEF:30},
    passiveName:'連擊本能', passiveDesc:'連續攻擊加速+15%，最多3層',
    qSkill:{name:'瞬斬',icon:'⚡',desc:'瞬間衝向目標並三連擊',cd:5,fn:'dash'},
    eSkill:{name:'殘影',icon:'🌀',desc:'2秒無敵+加速',cd:14,fn:'ghost'} },
  { id:'ptero',  name:'翼龍',        type:'飛行型',   emoji:'🦇', color:'#a78bfa',
    desc:'可飛越地形，對地面單位有俯衝傷害加成。',
    stats:{hp:75,atk:8,spd:7,def:3}, statBars:{HP:60,ATK:70,SPD:90,DEF:30},
    passiveName:'空中優勢', passiveDesc:'移動中攻擊力+25%',
    qSkill:{name:'俯衝',icon:'🌩️',desc:'空中俯衝造成範圍傷害',cd:6,fn:'divebomb'},
    eSkill:{name:'颶風',icon:'🌪️',desc:'旋風持續推開周圍敵人',cd:13,fn:'tornado'} },
  { id:'brachio',name:'腕龍',        type:'高血量型', emoji:'🦕', color:'#f59e0b',
    desc:'血量最高，每次擊殺回復大量HP，是持久作戰之王。',
    stats:{hp:200,atk:5,spd:3,def:7}, statBars:{HP:100,ATK:40,SPD:30,DEF:65},
    passiveName:'生命之源', passiveDesc:'每次擊殺回復20%最大HP',
    qSkill:{name:'踩踏',icon:'💥',desc:'巨腳踩踏震動範圍內敵人',cd:8,fn:'stomp'},
    eSkill:{name:'狂暴回復',icon:'❤️',desc:'立即回復35%最大HP',cd:20,fn:'heal'} },
  { id:'stego',  name:'劍龍',        type:'反傷型',   emoji:'🦎', color:'#f97316',
    desc:'身上的骨板讓攻擊者受到反彈傷害，近戰剋星。',
    stats:{hp:100,atk:6,spd:3.8,def:9}, statBars:{HP:80,ATK:55,SPD:45,DEF:85},
    passiveName:'骨板反刺', passiveDesc:'被攻擊時造成30%反彈傷害',
    qSkill:{name:'尾刺掃擊',icon:'🌟',desc:'360°尾刺掃擊周圍所有敵人',cd:7,fn:'tailspin'},
    eSkill:{name:'鋼刺壁壘',icon:'⚙️',desc:'反傷提升至80%持續5秒',cd:16,fn:'spikes'} },
];

const RESOURCE_TYPES = [
  {type:RES.MEAT,   emoji:'🥩',color:'#ef4444',xp:8},
  {type:RES.CRYSTAL,emoji:'💎',color:'#818cf8',xp:15},
  {type:RES.HERB,   emoji:'🌿',color:'#10b981',xp:6},
  {type:RES.FIRE,   emoji:'🔥',color:'#f97316',xp:12},
];

const UPGRADE_POOL = [
  {id:'atk',   icon:'⚔️', name:'強化攻擊',desc:'+20% 攻擊力',fn:p=>{p.atk*=1.2}},
  {id:'hp',    icon:'❤️', name:'強化生命',desc:'+25% 最大HP',fn:p=>{p.maxHp=Math.round(p.maxHp*1.25);p.hp=Math.min(p.hp+Math.round(p.maxHp*.1),p.maxHp)}},
  {id:'spd',   icon:'⚡', name:'強化速度',desc:'+15% 移動速',fn:p=>{p.spd*=1.15}},
  {id:'def',   icon:'🛡️',name:'強化防禦',desc:'+20% 防禦力',fn:p=>{p.def*=1.2}},
  {id:'regen', icon:'💚', name:'再生之力',desc:'每秒回復 2 HP',fn:p=>{p.regen=(p.regen||0)+2}},
  {id:'range', icon:'🎯', name:'攻擊範圍',desc:'+25% 攻擊距',fn:p=>{p.atkRange*=1.25}},
  {id:'xp',    icon:'⭐', name:'經驗加成',desc:'+30% 獲得 XP',fn:p=>{p.xpMult=(p.xpMult||1)*1.3}},
  {id:'loot',  icon:'🎁', name:'掠奪大師',desc:'拾取範圍 ×2',fn:p=>{p.lootRange*=2}},
];

let canvas,ctx,miniCanvas,miniCtx;
let gameState='menu';
let player,bots,resources,drops,particles;
let camera={x:0,y:0};
let keys={},mouse={x:0,y:0,wx:0,wy:0};
let kills=0,score=0,lastTime=0,animId=null;
let respawnInterval=null,skillCDs={q:0,e:0};
let upgradeVisible=false,worldTiles=[];
const floatingTexts=[];

const $=id=>document.getElementById(id);

function showScreen(name){
  ['menu','select','game'].forEach(k=>{const el=$('screen-'+k);if(el)el.classList.remove('active')});
  const el=$('screen-'+name);if(el)el.classList.add('active');
  gameState=name;
}

function spawnMenuParticles(){
  const cont=$('menu-particles');if(!cont)return;cont.innerHTML='';
  for(let i=0;i<40;i++){
    const p=document.createElement('div');p.className='particle';
    p.style.left=Math.random()*100+'%';p.style.bottom=Math.random()*20+'px';
    p.style.animationDuration=(6+Math.random()*10)+'s';
    p.style.animationDelay=-(Math.random()*12)+'s';
    const s=(2+Math.random()*3)+'px';p.style.width=s;p.style.height=s;
    p.style.background=`hsl(${30+Math.random()*40},100%,60%)`;
    cont.appendChild(p);
  }
}

let selectedDino=null;
function buildDinoSelect(){
  const grid=$('dino-grid');if(!grid)return;grid.innerHTML='';
  DINOS.forEach(d=>{
    const card=document.createElement('div');
    card.className='dino-card';card.id='dino-card-'+d.id;
    card.style.setProperty('--dino-color',d.color);
    card.innerHTML=`<span class="dino-emoji">${d.emoji}</span>
      <div class="dino-name">${d.name}</div>
      <div class="dino-type-label">${d.type}</div>
      <div class="dino-stat-bars">${Object.entries(d.statBars).map(([k,v])=>`
        <div class="stat-row"><span class="stat-label">${k}</span>
        <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${v}%;background:${d.color}"></div></div></div>`).join('')}
      </div>`;
    card.addEventListener('click',()=>selectDino(d));
    grid.appendChild(card);
  });
}

function selectDino(d){
  selectedDino=d;
  document.querySelectorAll('.dino-card').forEach(c=>c.classList.remove('selected'));
  const card=$('dino-card-'+d.id);if(card)card.classList.add('selected');
  const btn=$('btn-enter');if(btn)btn.disabled=false;
  const info=$('selected-info');
  if(info)info.innerHTML=`<div class="info-box"><div class="info-big-emoji">${d.emoji}</div>
    <div class="info-text"><h3>${d.name} · <span style="color:${d.color}">${d.passiveName}</span></h3>
    <p>${d.desc}</p>
    <p style="margin-top:6px;color:#a78bfa"><b>Q</b> ${d.qSkill.name} (CD:${d.qSkill.cd}s) — ${d.qSkill.desc}<br>
    <b>E</b> ${d.eSkill.name} (CD:${d.eSkill.cd}s) — ${d.eSkill.desc}</p></div></div>`;
}

function clamp(v,mn,mx){return Math.max(mn,Math.min(mx,v))}

function initGame(){
  canvas=$('game-canvas');ctx=canvas.getContext('2d');
  miniCanvas=$('minimap');miniCtx=miniCanvas.getContext('2d');
  resizeCanvas();window.addEventListener('resize',resizeCanvas);

  const name=($('player-name').value.trim()||'Player').substring(0,12);
  player=mkEntity(name,selectedDino,WORLD_W/2,WORLD_H/2,true);

  bots=[];
  for(let i=0;i<BOT_COUNT;i++){
    const bd=DINOS[Math.floor(Math.random()*DINOS.length)];
    bots.push(mkEntity('Bot_'+(i+1),bd,200+Math.random()*(WORLD_W-400),200+Math.random()*(WORLD_H-400),false));
  }

  resources=[];for(let i=0;i<200;i++)spawnRes();
  drops=[];particles=[];floatingTexts.length=0;
  kills=0;score=0;skillCDs={q:0,e:0};upgradeVisible=false;
  genTiles();
  camera={x:player.x-canvas.width/2,y:player.y-canvas.height/2};

  $('hud-dino-icon').textContent=selectedDino.emoji;
  $('hud-name').textContent=name;
  $('skill-q-icon').textContent=selectedDino.qSkill.icon;
  $('skill-e-icon').textContent=selectedDino.eSkill.icon;
  setupControls();updateHUD();
  $('death-screen').style.display='none';
  $('upgrade-panel').style.display='none';
  lastTime=performance.now();
  if(animId)cancelAnimationFrame(animId);
  animId=requestAnimationFrame(loop);
}

function mkEntity(name,dino,x,y,isPlayer){
  const s=dino.stats;
  return{name,dino,x,y,isPlayer,emoji:dino.emoji,color:dino.color,
    maxHp:s.hp,hp:s.hp,atk:s.atk,spd:s.spd,def:s.def,
    atkRange:55,lootRange:70,xp:0,level:1,regen:0,xpMult:1,
    resources:{meat:0,crystal:0,herb:0,fire:0},kills:0,radius:22,
    atkCd:0,regenTimer:0,invincible:0,shieldActive:false,spikeActive:false,
    speedBoost:0,comboStack:0,comboTimer:0,
    target:null,aiState:'wander',aiTimer:0,aiAngle:Math.random()*Math.PI*2,
    dead:false,flashTimer:0,_fx:[]};
}

function genTiles(){
  worldTiles=[];
  const cols=Math.ceil(WORLD_W/TILE)+1,rows=Math.ceil(WORLD_H/TILE)+1;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const v=Math.random();
    worldTiles.push({x:c*TILE,y:r*TILE,
      type:v<.08?'tree':v<.14?'rock':'grass',
      variant:Math.floor(Math.random()*3)});
  }
}

function spawnRes(){
  const rt=RESOURCE_TYPES[Math.floor(Math.random()*RESOURCE_TYPES.length)];
  resources.push({x:80+Math.random()*(WORLD_W-160),y:80+Math.random()*(WORLD_H-160),
    type:rt.type,emoji:rt.emoji,color:rt.color,xp:rt.xp,
    radius:14,alive:true,bob:Math.random()*Math.PI*2});
}

function setupControls(){
  document.onkeydown=e=>{
    keys[e.key.toLowerCase()]=true;
    if(e.key.toLowerCase()==='q')useSkill('q');
    if(e.key.toLowerCase()==='e')useSkill('e');
    if(e.key==='Tab'){e.preventDefault();openLB();}
  };
  document.onkeyup=e=>{keys[e.key.toLowerCase()]=false};
  canvas.onmousemove=e=>{
    const r=canvas.getBoundingClientRect();
    mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;
    mouse.wx=mouse.x+camera.x;mouse.wy=mouse.y+camera.y;
  };
  canvas.onclick=e=>{
    if(upgradeVisible)return;
    const r=canvas.getBoundingClientRect();
    mouse.wx=(e.clientX-r.left)+camera.x;mouse.wy=(e.clientY-r.top)+camera.y;
    atk();
  };
  $('skill-q').onclick=()=>useSkill('q');
  $('skill-e').onclick=()=>useSkill('e');
  $('btn-menu-from-death').onclick=()=>{
    clearInterval(respawnInterval);$('death-screen').style.display='none';
    cancelAnimationFrame(animId);showScreen('menu');
  };
  $('btn-close-lb').onclick=()=>{$('modal-leaderboard').style.display='none'};
}

function resizeCanvas(){if(canvas){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}}

function useSkill(slot){
  if(upgradeVisible||!player||player.dead||skillCDs[slot]>0)return;
  const sk=slot==='q'?player.dino.qSkill:player.dino.eSkill;
  skillCDs[slot]=sk.cd;execSkill(sk.fn,player);updateSkillUI();
}

function execSkill(fn,e){
  switch(fn){
    case'bite': aoe(e,e.atkRange*1.5,e.atk*2.5,'#ef4444');burst(e.x,e.y,'#ef4444',12);break;
    case'roar': near(e,180).forEach(t=>fx(t,'slow',3));burst(e.x,e.y,'#ff8800',20);ft('💢怒吼！',e.x,e.y,'#ff8800');break;
    case'charge':{const a=Math.atan2(mouse.wy-e.y,mouse.wx-e.x);
      e.x=clamp(e.x+Math.cos(a)*100,20,WORLD_W-20);e.y=clamp(e.y+Math.sin(a)*100,20,WORLD_H-20);
      aoe(e,60,e.atk*1.8,'#3b82f6');burst(e.x,e.y,'#3b82f6',12);break;}
    case'shield': fx(e,'shield',4);e.shieldActive=true;burst(e.x,e.y,'#60a5fa',15);ft('🛡️護盾！',e.x,e.y,'#60a5fa');
      setTimeout(()=>{if(e)e.shieldActive=false},4000);break;
    case'dash':{const a=Math.atan2(mouse.wy-e.y,mouse.wx-e.x);
      e.x=clamp(e.x+Math.cos(a)*120,20,WORLD_W-20);e.y=clamp(e.y+Math.sin(a)*120,20,WORLD_H-20);
      for(let i=0;i<3;i++)setTimeout(()=>aoe(e,e.atkRange,e.atk*.9,'#10b981'),i*120);
      burst(e.x,e.y,'#10b981',15);break;}
    case'ghost': fx(e,'inv',2);e.invincible=2;e.speedBoost=1.8;burst(e.x,e.y,'#a78bfa',18);ft('🌀殘影！',e.x,e.y,'#a78bfa');
      setTimeout(()=>{if(e){e.speedBoost=0;e.invincible=0}},2000);break;
    case'divebomb': aoe(e,e.atkRange*2,e.atk*2,'#a78bfa');burst(e.x,e.y,'#a78bfa',20);ft('🌩️俯衝！',e.x,e.y,'#a78bfa');break;
    case'tornado':{ burst(e.x,e.y,'#818cf8',25);ft('🌪️颶風！',e.x,e.y,'#818cf8');
      for(let i=0;i<3;i++)setTimeout(()=>near(e,160).forEach(t=>{
        const a=Math.atan2(t.y-e.y,t.x-e.x);
        t.x=clamp(t.x+Math.cos(a)*40,20,WORLD_W-20);t.y=clamp(t.y+Math.sin(a)*40,20,WORLD_H-20);
      }),i*1000);break;}
    case'stomp': aoe(e,e.atkRange*2.2,e.atk*1.6,'#f59e0b');burst(e.x,e.y,'#f59e0b',22);ft('💥踩踏！',e.x,e.y,'#f59e0b');break;
    case'heal':{const h=Math.round(e.maxHp*.35);e.hp=Math.min(e.hp+h,e.maxHp);burst(e.x,e.y,'#10b981',18);ft('+'+h+' ❤️',e.x,e.y,'#10b981');break;}
    case'tailspin': aoe(e,e.atkRange*1.8,e.atk*1.5,'#f97316');burst(e.x,e.y,'#f97316',20);ft('🌟尾刺！',e.x,e.y,'#f97316');break;
    case'spikes': e.spikeActive=true;burst(e.x,e.y,'#f97316',16);ft('⚙️鋼刺！',e.x,e.y,'#f97316');
      setTimeout(()=>{if(e)e.spikeActive=false},5000);break;
  }
}

function dmg(att,tgt,base){
  if(!tgt||tgt.dead||tgt.invincible>0)return 0;
  let d=Math.max(1,base-tgt.def*.5);
  if(tgt.shieldActive)d*=.4;
  if(tgt.dino.id==='trice')d*=.8;
  let crit=false;
  if(att.dino.id==='trex'&&Math.random()<.2){d*=2.5;crit=true;}
  if(att.dino.id==='ptero'&&att._mv)d*=1.25;
  d=Math.round(d);tgt.hp-=d;tgt.flashTimer=.15;
  if(tgt.isPlayer||att.isPlayer)dmgNum(d,tgt.x,tgt.y,crit?'#f59e0b':'#ef4444',crit);
  if(tgt.dino.id==='stego'){
    const rp=tgt.spikeActive?.8:.3,rd=Math.round(d*rp);
    if(rd>0){att.hp-=rd;if(att.isPlayer)dmgNum(rd,att.x,att.y,'#f97316',false);
      if(att.hp<=0&&!att.dead)died(att,tgt);}
  }
  if(tgt.hp<=0&&!tgt.dead)died(tgt,att);
  return d;
}

function aoe(att,range,d,color){
  const all=att.isPlayer?bots:[...bots,player];
  all.forEach(t=>{if(!t.dead&&Math.hypot(t.x-att.x,t.y-att.y)<range)dmg(att,t,d)});
  burst(att.x,att.y,color,10);
}

function near(e,range){
  const all=e.isPlayer?bots:[...bots,player];
  return all.filter(t=>!t.dead&&Math.hypot(t.x-e.x,t.y-e.y)<range);
}

function atk(){
  if(!player||player.dead||player.atkCd>0)return;
  player.atkCd=.6;
  let cl=null,md=player.atkRange+50;
  bots.forEach(b=>{if(b.dead)return;
    if(Math.hypot(b.x-mouse.wx,b.y-mouse.wy)<60&&Math.hypot(b.x-player.x,b.y-player.y)<md){
      md=Math.hypot(b.x-player.x,b.y-player.y);cl=b;}
  });
  if(cl){dmg(player,cl,player.atk);
    if(player.dino.id==='raptor'){player.comboStack=Math.min(3,(player.comboStack||0)+1);player.comboTimer=2;}
    burst(cl.x,cl.y,player.color,5);
  }else{
    const a=Math.atan2(mouse.wy-player.y,mouse.wx-player.x);
    burst(player.x+Math.cos(a)*40,player.y+Math.sin(a)*40,player.color,4);
  }
}

function died(e,killer){
  e.dead=true;e.hp=0;
  const dc=3+Math.floor(e.level*.8);
  for(let i=0;i<dc;i++){
    const rt=RESOURCE_TYPES[Math.floor(Math.random()*RESOURCE_TYPES.length)];
    drops.push({x:e.x+(Math.random()-.5)*60,y:e.y+(Math.random()-.5)*60,
      type:rt.type,emoji:rt.emoji,color:rt.color,xp:rt.xp,
      radius:12,alive:true,bob:Math.random()*Math.PI*2,lifetime:18});
  }
  drops.push({x:e.x,y:e.y,type:'xp',emoji:'✨',color:'#facc15',
    xp:20+e.level*10,radius:14,alive:true,bob:Math.random()*Math.PI*2,lifetime:18});
  burst(e.x,e.y,e.color,25);
  if(killer){
    if(killer.isPlayer){kills++;score+=100+e.level*20;killer.kills=(killer.kills||0)+1;
      kf(killer.name+' 🗡️ '+e.name);
      if(killer.dino.id==='brachio'){killer.hp=Math.min(killer.hp+Math.round(killer.maxHp*.2),killer.maxHp);ft('❤️+生命',killer.x,killer.y,'#10b981');}
    }else if(e.isPlayer)kf(killer.name+' 🗡️ '+e.name);
  }
  if(e.isPlayer)deathScreen(killer);
  else setTimeout(()=>respawnBot(e),6000+Math.random()*4000);
}

function respawnBot(b){
  if(gameState!=='playing')return;
  b.x=200+Math.random()*(WORLD_W-400);b.y=200+Math.random()*(WORLD_H-400);
  b.hp=b.maxHp;b.dead=false;b.target=null;b.aiState='wander';b._fx=[];
}

function gainXP(amt){
  if(!player||player.dead)return;
  const a=Math.round(amt*(player.xpMult||1));
  player.xp+=a;score+=Math.round(a*.5);
  while(player.level<MAX_LEVEL&&player.xp>=XP_TABLE[player.level-1]){
    player.xp-=XP_TABLE[player.level-1];player.level++;showUpgrade();
  }
}

function showUpgrade(){
  upgradeVisible=true;const panel=$('upgrade-panel');panel.style.display='block';
  const opts=$('upgrade-options');opts.innerHTML='';
  const pool=[...UPGRADE_POOL].sort(()=>Math.random()-.5).slice(0,3);
  pool.forEach(u=>{
    const btn=document.createElement('div');btn.className='upgrade-opt';
    btn.innerHTML=`<div class="opt-icon">${u.icon}</div><div class="opt-name">${u.name}</div><div class="opt-desc">${u.desc}</div>`;
    btn.onclick=()=>{u.fn(player);panel.style.display='none';upgradeVisible=false;};
    opts.appendChild(btn);
  });
}

function deathScreen(killer){
  $('death-screen').style.display='flex';
  $('death-killer').innerHTML='被 <strong style="color:#f59e0b">'+(killer?killer.name:'???')+'</strong> 擊殺';
  $('death-stats').innerHTML=`<div class="ds-item"><div class="ds-val">${kills}</div><div class="ds-lbl">擊殺</div></div>
    <div class="ds-item"><div class="ds-val">${score}</div><div class="ds-lbl">分數</div></div>
    <div class="ds-item"><div class="ds-val">${player.level}</div><div class="ds-lbl">等級</div></div>`;
  let rem=RESPAWN_SEC;const circ=$('respawn-circle');
  $('respawn-count').textContent=rem;circ.style.strokeDashoffset=0;
  clearInterval(respawnInterval);
  respawnInterval=setInterval(()=>{
    rem--;$('respawn-count').textContent=Math.max(0,rem);
    circ.style.strokeDashoffset=(1-rem/RESPAWN_SEC)*163;
    if(rem<=0){clearInterval(respawnInterval);$('death-screen').style.display='none';respawnPlayer();}
  },1000);
}

function respawnPlayer(){
  player.x=200+Math.random()*(WORLD_W-400);player.y=200+Math.random()*(WORLD_H-400);
  player.hp=player.maxHp;player.dead=false;player.invincible=2;player._fx=[];
  camera.x=player.x-canvas.width/2;camera.y=player.y-canvas.height/2;
  burst(player.x,player.y,player.color,20);ft('👁️重生！',player.x,player.y,'#a78bfa');
}

function updateBot(b,dt){
  if(b.dead)return;
  b.atkCd=Math.max(0,(b.atkCd||0)-dt);
  b.regenTimer=(b.regenTimer||0)+dt;
  if(b.regenTimer>1){if((b.regen||0)>0)b.hp=Math.min(b.hp+b.regen,b.maxHp);
    if(b.dino.id==='trice')b.hp=Math.min(b.hp+3,b.maxHp);b.regenTimer=0;}
  b.aiTimer=(b.aiTimer||0)-dt;
  if(b.aiTimer<=0){
    b.aiTimer=1.5+Math.random()*1.5;
    const pd=player.dead?Infinity:Math.hypot(player.x-b.x,player.y-b.y);
    if(!player.dead&&pd<350){b.target=player;b.aiState='chase';}
    else{
      let nr=null,md=9999;
      resources.forEach(r=>{if(!r.alive)return;const d=Math.hypot(r.x-b.x,r.y-b.y);if(d<md){md=d;nr=r;}});
      if(nr&&md<250){b.target=nr;b.aiState='gather';}
      else{b.aiState='wander';b.aiAngle=Math.random()*Math.PI*2;}
    }
    if(b.hp/b.maxHp<.25){b.aiState='wander';b.aiAngle=Math.atan2(WORLD_H/2-b.y,WORLD_W/2-b.x)+(Math.random()-.5);}
  }
  const sl=hasFx(b,'slow')?.5:1;const spd=b.spd*sl;
  if(b.aiState==='chase'&&b.target&&!b.target.dead){
    const a=Math.atan2(b.target.y-b.y,b.target.x-b.x);
    b.x+=Math.cos(a)*spd;b.y+=Math.sin(a)*spd;
    if(Math.hypot(b.target.x-b.x,b.target.y-b.y)<b.atkRange&&b.atkCd<=0){
      b.atkCd=.8+Math.random()*.4;dmg(b,b.target,b.atk);}
  }else if(b.aiState==='gather'&&b.target&&b.target.alive){
    const a=Math.atan2(b.target.y-b.y,b.target.x-b.x);
    b.x+=Math.cos(a)*spd;b.y+=Math.sin(a)*spd;
    if(Math.hypot(b.target.x-b.x,b.target.y-b.y)<30)collectR(b,b.target);
  }else{b.x+=Math.cos(b.aiAngle)*spd*.6;b.y+=Math.sin(b.aiAngle)*spd*.6;}
  b.x=clamp(b.x,b.radius,WORLD_W-b.radius);b.y=clamp(b.y,b.radius,WORLD_H-b.radius);
  drops.forEach(d=>{
    if(!d.alive)return;
    if(Math.hypot(d.x-b.x,d.y-b.y)<b.lootRange){
      d.alive=false;b.xp=(b.xp||0)+(d.xp||5);
      while(b.level<MAX_LEVEL&&b.xp>=XP_TABLE[b.level-1]){
        b.xp-=XP_TABLE[b.level-1];b.level++;
        b.maxHp=Math.round(b.maxHp*1.1);b.hp=Math.min(b.hp+20,b.maxHp);
        b.atk*=1.08;b.def*=1.05;
      }
    }
  });
}

function updatePlayer(dt){
  if(!player||player.dead)return;
  player.atkCd=Math.max(0,player.atkCd-dt);
  if(player.invincible>0)player.invincible-=dt;
  if(player.flashTimer>0)player.flashTimer-=dt;
  player.regenTimer=(player.regenTimer||0)+dt;
  if(player.regenTimer>=1){
    player.regenTimer=0;
    const r=(player.dino.id==='trice'?3:0)+(player.regen||0);
    if(r>0)player.hp=Math.min(player.hp+r,player.maxHp);
  }
  if(player.comboTimer>0){player.comboTimer-=dt;if(player.comboTimer<=0)player.comboStack=0;}
  skillCDs.q=Math.max(0,skillCDs.q-dt);skillCDs.e=Math.max(0,skillCDs.e-dt);updateSkillUI();
  let dx=0,dy=0;
  if(keys['w']||keys['arrowup'])dy-=1;if(keys['s']||keys['arrowdown'])dy+=1;
  if(keys['a']||keys['arrowleft'])dx-=1;if(keys['d']||keys['arrowright'])dx+=1;
  if(dx!==0&&dy!==0){dx*=.707;dy*=.707;}
  let spd=player.spd;
  if(player.dino.id==='raptor')spd*=(1+(player.comboStack||0)*.15);
  player._mv=(dx!==0||dy!==0);
  if((player.speedBoost||0)>0)spd*=(1+player.speedBoost);
  if(hasFx(player,'slow'))spd*=.5;
  player.x=clamp(player.x+dx*spd,player.radius,WORLD_W-player.radius);
  player.y=clamp(player.y+dy*spd,player.radius,WORLD_H-player.radius);
  resources.forEach(r=>{if(!r.alive)return;if(Math.hypot(r.x-player.x,r.y-player.y)<player.lootRange)collectR(player,r);});
  drops.forEach(d=>{
    if(!d.alive)return;
    if(Math.hypot(d.x-player.x,d.y-player.y)<player.lootRange){
      d.alive=false;
      if(d.type==='xp')gainXP(d.xp);
      else{player.resources[d.type]=(player.resources[d.type]||0)+1;gainXP(d.xp||5);}
    }
  });
  const tcx=player.x-canvas.width/2,tcy=player.y-canvas.height/2;
  camera.x+=(tcx-camera.x)*.1;camera.y+=(tcy-camera.y)*.1;
  camera.x=clamp(camera.x,0,Math.max(0,WORLD_W-canvas.width));
  camera.y=clamp(camera.y,0,Math.max(0,WORLD_H-canvas.height));
}

function collectR(ent,r){
  r.alive=false;
  if(ent.isPlayer){player.resources[r.type]=(player.resources[r.type]||0)+1;gainXP(r.xp);score+=r.xp;}
  burst(r.x,r.y,r.color,5);setTimeout(spawnRes,4000+Math.random()*4000);
}

function fx(e,type,dur){if(!e._fx)e._fx=[];e._fx=e._fx.filter(f=>f.t!==type);e._fx.push({t:type,end:performance.now()/1000+dur});}
function hasFx(e,type){if(!e._fx)return false;const n=performance.now()/1000;return e._fx.some(f=>f.t===type&&f.end>n);}

function burst(x,y,color,n){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,s=1.5+Math.random()*4,l=.5+Math.random()*.5;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:2+Math.random()*4,color,life:l,ml:l});
  }
}
function ft(text,x,y,color='#fff',size=20){floatingTexts.push({text,x,y,color,size,life:1.2,ml:1.2,vy:-1.5});}
function dmgNum(d,x,y,color,crit){floatingTexts.push({text:(crit?'💥 ':'')+d,x:x+(Math.random()-.5)*30,y:y-20,color,size:crit?24:18,life:1,ml:1,vy:-2});}

function kf(text){
  const feed=$('kill-feed');if(!feed)return;
  const item=document.createElement('div');item.className='kill-feed-item';item.textContent=text;
  feed.prepend(item);setTimeout(()=>item.remove(),4000);
}

function updateHUD(){
  if(!player)return;
  const p=Math.max(0,player.hp/player.maxHp*100);
  $('hp-bar').style.width=p+'%';
  $('hp-bar').style.background=p>50?'linear-gradient(90deg,#10b981,#34d399)':p>25?'linear-gradient(90deg,#f59e0b,#fbbf24)':'linear-gradient(90deg,#ef4444,#f87171)';
  $('hp-text').textContent=Math.max(0,Math.round(player.hp))+' / '+player.maxHp;
  const xpMax=XP_TABLE[Math.min(player.level-1,MAX_LEVEL-1)];
  $('xp-bar').style.width=Math.min(100,player.xp/xpMax*100)+'%';
  $('xp-label').textContent='Lv.'+player.level+' — '+player.xp+' / '+xpMax+' XP';
  $('hud-kill').textContent='💀 擊殺: '+kills;$('hud-score').textContent='⭐ 分數: '+score;
  $('res-meat').textContent=player.resources.meat||0;$('res-crystal').textContent=player.resources.crystal||0;
  $('res-herb').textContent=player.resources.herb||0;$('res-fire').textContent=player.resources.fire||0;
}

function updateSkillUI(){
  ['q','e'].forEach(slot=>{
    const el=$('skill-'+slot+'-cd');if(!el)return;
    if(skillCDs[slot]>0){el.classList.add('active');el.textContent=Math.ceil(skillCDs[slot]);}
    else{el.classList.remove('active');el.textContent='';}
  });
}

function openLB(){
  const all=[player,...bots];all.sort((a,b)=>((b.kills||0)*100+b.level)-((a.kills||0)*100+a.level));
  const tb=$('lb-body');tb.innerHTML='';
  all.slice(0,12).forEach((e,i)=>{
    const tr=document.createElement('tr');if(e.isPlayer)tr.style.color='#f59e0b';
    tr.innerHTML=`<td>${i+1}</td><td>${e.name}</td><td>${e.dino.emoji}</td><td>${e.kills||0}</td><td>${e.level}</td>`;
    tb.appendChild(tr);
  });
  $('modal-leaderboard').style.display='flex';
}

function drawMinimap(){
  const mw=150,mh=150;miniCtx.clearRect(0,0,mw,mh);
  miniCtx.fillStyle='rgba(10,20,40,.9)';miniCtx.fillRect(0,0,mw,mh);
  const sx=mw/WORLD_W,sy=mh/WORLD_H;
  resources.forEach(r=>{if(!r.alive)return;miniCtx.fillStyle=r.color;miniCtx.fillRect(r.x*sx-1,r.y*sy-1,2,2);});
  drops.forEach(d=>{if(!d.alive)return;miniCtx.fillStyle=d.color;miniCtx.fillRect(d.x*sx-1,d.y*sy-1,2,2);});
  bots.forEach(b=>{if(b.dead)return;miniCtx.fillStyle=b.color;miniCtx.beginPath();miniCtx.arc(b.x*sx,b.y*sy,2,0,Math.PI*2);miniCtx.fill();});
  miniCtx.fillStyle='#fff';miniCtx.beginPath();miniCtx.arc(player.x*sx,player.y*sy,3.5,0,Math.PI*2);miniCtx.fill();
  miniCtx.strokeStyle='rgba(255,255,255,.3)';miniCtx.lineWidth=1;
  miniCtx.strokeRect(camera.x*sx,camera.y*sy,canvas.width*sx,canvas.height*sy);
}

function drawWorld(now){
  ctx.fillStyle='#0d1a0d';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='rgba(255,255,255,.02)';ctx.lineWidth=1;
  const ox=-(camera.x%TILE),oy=-(camera.y%TILE);
  for(let x=ox;x<canvas.width;x+=TILE){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
  for(let y=oy;y<canvas.height;y+=TILE){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
  ctx.save();ctx.translate(-camera.x,-camera.y);
  ctx.strokeStyle='rgba(239,68,68,.5)';ctx.lineWidth=8;ctx.shadowColor='#ef4444';ctx.shadowBlur=20;
  ctx.strokeRect(10,10,WORLD_W-20,WORLD_H-20);ctx.shadowBlur=0;
  ctx.textAlign='center';ctx.textBaseline='middle';
  worldTiles.forEach(t=>{
    if(t.x+TILE<camera.x||t.x>camera.x+canvas.width+TILE)return;
    if(t.y+TILE<camera.y||t.y>camera.y+canvas.height+TILE)return;
    if(t.type==='tree'){ctx.globalAlpha=.4;ctx.font='20px serif';ctx.fillText(['🌲','🌳','🌴'][t.variant],t.x,t.y);}
    else if(t.type==='rock'){ctx.globalAlpha=.3;ctx.font='18px serif';ctx.fillText(['🪨','🗿','⛰️'][t.variant],t.x,t.y);}
    ctx.globalAlpha=1;
  });
  ctx.textAlign='center';ctx.textBaseline='middle';
  resources.forEach(r=>{if(!r.alive)return;const b=Math.sin(now*2.5+r.bob)*3;ctx.shadowColor=r.color;ctx.shadowBlur=10;ctx.font='22px serif';ctx.fillText(r.emoji,r.x,r.y+b);});
  ctx.shadowBlur=0;
  drops.forEach(d=>{if(!d.alive)return;const b=Math.sin(now*3+d.bob)*3;ctx.shadowColor=d.color;ctx.shadowBlur=12;ctx.font='18px serif';ctx.fillText(d.emoji,d.x,d.y+b);});
  ctx.shadowBlur=0;ctx.restore();
}

function drawEntities(now){
  ctx.save();ctx.translate(-camera.x,-camera.y);
  [...bots,player].forEach(e=>{
    if(e.dead)return;
    ctx.globalAlpha=.25;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(e.x,e.y+e.radius-2,e.radius*.75,e.radius*.28,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    if(e.invincible>0&&Math.floor(now*10)%2===0)ctx.globalAlpha=.4;
    if(e.shieldActive){ctx.strokeStyle='#60a5fa';ctx.lineWidth=3;ctx.shadowColor='#60a5fa';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(e.x,e.y,e.radius+9,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
    if(e.spikeActive){ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='11px serif';for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2+now*2;ctx.fillText('⚡',e.x+Math.cos(a)*(e.radius+11),e.y+Math.sin(a)*(e.radius+11));}}
    ctx.font=`${e.radius*1.85}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor=e.flashTimer>0?'#ef4444':e.color;ctx.shadowBlur=e.flashTimer>0?22:10;
    ctx.fillText(e.emoji,e.x,e.y);ctx.shadowBlur=0;ctx.globalAlpha=1;
    const bw=e.radius*2.6,bh=6,bx=e.x-bw/2,by=e.y-e.radius-20;
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.beginPath();ctx.roundRect(bx,by,bw,bh,3);ctx.fill();
    const hp=Math.max(0,e.hp/e.maxHp);
    ctx.fillStyle=hp>.5?'#10b981':hp>.25?'#f59e0b':'#ef4444';
    ctx.beginPath();ctx.roundRect(bx,by,bw*hp,bh,3);ctx.fill();
    ctx.font='bold 11px "Segoe UI",sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
    ctx.fillStyle=e.isPlayer?'#f59e0b':'#e2e8f0';ctx.shadowColor='#000';ctx.shadowBlur=5;
    ctx.fillText(e.name,e.x,by-3);ctx.fillStyle=e.color;ctx.font='bold 10px "Segoe UI",sans-serif';
    ctx.fillText('Lv.'+e.level,e.x,by-14);ctx.shadowBlur=0;
  });
  floatingTexts.forEach(f=>{
    ctx.globalAlpha=f.life/f.ml;ctx.font=`bold ${f.size||20}px Impact,"Arial Black",sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=f.color;
    ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=4;ctx.fillText(f.text,f.x,f.y);ctx.shadowBlur=0;
  });
  ctx.globalAlpha=1;ctx.restore();
}

function drawParticles(){
  ctx.save();ctx.translate(-camera.x,-camera.y);
  particles.forEach(p=>{
    ctx.globalAlpha=p.life/p.ml;ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=6;
    ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.5,p.r*(p.life/p.ml)),0,Math.PI*2);ctx.fill();
  });
  ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.restore();
}

function loop(ts){
  if(gameState!=='playing')return;
  animId=requestAnimationFrame(loop);
  const dt=Math.min((ts-lastTime)/1000,.05);lastTime=ts;const now=ts/1000;
  if(!player.dead)updatePlayer(dt);
  bots.forEach(b=>updateBot(b,dt));
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.91;p.vy*=.91;p.life-=dt;if(p.life<=0)particles.splice(i,1);}
  for(let i=floatingTexts.length-1;i>=0;i--){const f=floatingTexts[i];f.y+=f.vy;f.life-=dt;if(f.life<=0)floatingTexts.splice(i,1);}
  drops.forEach(d=>{if(d.lifetime!==undefined){d.lifetime-=dt;if(d.lifetime<=0)d.alive=false;}});
  drawWorld(now);drawParticles();drawEntities(now);drawMinimap();updateHUD();
}

window.addEventListener('DOMContentLoaded',()=>{
  spawnMenuParticles();buildDinoSelect();
  $('btn-play').onclick=()=>showScreen('select');
  $('btn-leaderboard').onclick=()=>{if(gameState==='playing')openLB();else alert('進入遊戲後按 TAB 查看排行榜！');};
  $('btn-enter').onclick=()=>{if(!selectedDino)return;showScreen('game');gameState='playing';initGame();};
});
