/* Campaign mission definitions and map/battle integration. */
(() => {
  'ng strict';
  const KEY = 'kursk1943-campaign-v1';
  const missions = [
    { id:1, title:'El puesto<br>avanzado', name:'EL PUESTO AVANZADO', type:'RECONOCIMIENTO ARMADO', description:'Una patrulla alemana bloquea la carretera. Despeja la zona para asegurar el avance del batallón.', difficulty:1, duration:'5–8 MIN', objective:'Destruye al Tiger I enemigo', reward:150, soviet:'T-34/76', german:'Tiger I', maxHp:100, enemyHp:150, moveRange:2, enemyMove:1, attackRange:2, enemyAttack:2, damage:28, enemyDamage:48, positions:{soviet:[1,3],german:[6,4]} },
    { id:2, title:'Cruce del<br>Psel', name:'CRUCE DEL PSEL', type:'ASALTO ACORAZADO', description:'Protege el cruce del río y elimina la patrulla blindada que controla el paso.', difficulty:2, duration:'8–12 MIN', objective:'Asegura el cruce y destruye al Panther', reward:250, soviet:'T-34-85', german:'Panther', maxHp:120, enemyHp:160, moveRange:2, enemyMove:2, attackRange:3, enemyAttack:3, damage:34, enemyDamage:52, positions:{soviet:[1,5],german:[6,2]} },
    { id:3, title:'Camino a<br>Prokhorovka', name:'CAMINO A PROKHOROVKA', type:'OFENSIVA DECISIVA', description:'Rompe el último anillo defensivo y abre la ruta hacia Prokhorovka.', difficulty:3, duration:'10–15 MIN', objective:'Destruye al Jagdtiger y toma el sector', reward:400, soviet:'IS-2', german:'Jagdtiger', maxHp:160, enemyHp:210, moveRange:2, enemyMove:1, attackRange:3, enemyAttack:3, damage:46, enemyDamage:58, positions:{soviet:[1,4],german:[6,3]} }
  ];
  let campaign = load();
  let selected = 1;
  const $ = id => document.getElementById(id);

  function load(){try{const data=JSON.parse(localStorage.getItem(KEY));if(data&&Array.isArray(data.completed))return data}catch(e){console.warn(e)}return {completed:[]}}
  function save(){localStorage.setItem(KEY,JSON.stringify(campaign))}
  function unlocked(id){return id===1||campaign.completed.includes(id-1)}

  function render(){
    document.querySelectorAll('.mission-node').forEach(node=>{
      const id=Number(node.dataset.mission),complete=campaign.completed.includes(id),lock=!unlocked(id);
      node.classList.toggle('is-locked',lock);node.classList.toggle('is-selected',id===selected);node.classList.toggle('is-complete',complete);
      node.querySelector('.node-caption small').textContent=complete?'MISIÓN COMPLETADA':lock?'SECTOR BLOQUEADO':'OBJETIVO DISPONIBLE';
      node.querySelector('.node-ring span').textContent=complete?'✓':id===1?'01':id===2?'Ⅱ':'Ⅲ';
    });
    const m=missions[selected-1];
    $('mission-number').textContent=`${String(m.id).padStart(2,'0')} / 03`;$('mission-type').textContent=m.type;$('mission-title').innerHTML=m.title;$('mission-description').textContent=m.description;$('mission-duration').textContent=m.duration;$('mission-objective').textContent=m.objective;$('mission-reward').textContent=m.reward;$('mission-type-icon').textContent=m.id===1?'⌖':m.id===2?'⚑':'✦';
    document.querySelectorAll('.difficulty i').forEach((bar,i)=>bar.classList.toggle('active',i<m.difficulty));
    const launch=$('launch-mission');launch.disabled=!unlocked(m.id);launch.querySelector('span').textContent=!unlocked(m.id)?'SECTOR BLOQUEADO':campaign.completed.includes(m.id)?'REPETIR MISIÓN':'INICIAR MISIÓN';
    $('progress-label').textContent=`${campaign.completed.length} / 3 MISIONES`;$('progress-fill').style.width=`${campaign.completed.length/3*100}%`;
    $('active-tank-name').innerHTML=`${m.soviet} <span class="ready-tag">LISTO</span>`;$('active-tank-stats').innerHTML=`<span><b>${m.maxHp}</b> HP</span><span><b>${m.attackRange}</b> ALCANCE</span><span><b>${m.damage}</b> DAÑO</span>`;
  }

  function configureBattle(){
    if(typeof setupBoard!=='function')return;
    const m=missions[selected-1];
    window.CAMPAIGN_MISSION=m;
    $('hud-soviet-name').textContent=`USSR · ${m.soviet}`;$('hud-german-name').textContent=`GER · ${m.german}`;$('battle-mission-name').textContent=m.name;
  }

  function openBattle(){if(!unlocked(selected))return;configureBattle();$('campaign-screen').classList.add('is-hidden');$('battle-screen').classList.remove('is-hidden');if(typeof resetBattle==='function')resetBattle();}
  function closeBattle(){document.querySelectorAll('#fin-partida').forEach(el=>el.classList.add('oculto'));$('battle-screen').classList.add('is-hidden');$('campaign-screen').classList.remove('is-hidden');render()}

  document.querySelectorAll('.mission-node').forEach(node=>node.addEventListener('click',()=>{const id=Number(node.dataset.mission);if(!unlocked(id)){node.querySelector('.node-caption small').textContent='COMPLETA LA MISIÓN ANTERIOR';return}selected=id;render()}));
  $('launch-mission').addEventListener('click',openBattle);$('back-to-campaign').addEventListener('click',closeBattle);$('battle-result-back').addEventListener('click',closeBattle);
  $('reset-campaign').addEventListener('click',()=>{if(!confirm('¿Reiniciar la campaña?'))return;campaign={completed:[]};selected=1;save();render()});

  // Wrap the battle result once it exists, so a Soviet victory unlocks the next map mission.
  window.addEventListener('load',()=>{
    if(typeof window.finPartida==='function'&&!window.__campaignFinWrapped){
      window.__campaignFinWrapped=true;const original=window.finPartida;
      window.finPartida=function(winner){original(winner);if(winner==='USSR'&&!campaign.completed.includes(selected)){campaign.completed.push(selected);campaign.completed.sort((a,b)=>a-b);save();render()}};
    }
  });

  render();
})();
