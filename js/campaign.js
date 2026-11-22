/* Campaign selection and persistence layer; the existing tactical battle remains the combat engine. */
(() => {
  'use strict';

  const STORAGE_KEY = 'kursk1943-campaign-v1';
  const missions = [
    { id: 1, name: 'El puesto avanzado', mapName: 'EL PUESTO AVANZADO', type: 'RECONOCIMIENTO ARMADO', description: 'Una patrulla alemana bloquea la carretera de abastecimiento. Despeja la zona para asegurar el avance del batallón.', difficulty: 1, duration: '5–8 MIN', objective: 'Destruye al Tiger I enemigo', reward: 150 },
    { id: 2, name: 'Cruce del Psel', mapName: 'CRUCE DEL PSEL', type: 'ASALTO ACORAZADO', description: 'Las fuerzas enemigas protegen un cruce clave. Rompe su defensa y asegura una ruta para las unidades de apoyo.', difficulty: 2, duration: '8–12 MIN', objective: 'Asegura el cruce y elimina al Tiger I', reward: 250 },
    { id: 3, name: 'Camino a Prokhorovka', mapName: 'CAMINO A PROKHOROVKA', type: 'OFENSIVA DECISIVA', description: 'El último cinturón defensivo separa a tu unidad de Prokhorovka. Avanza y neutraliza la resistencia blindada.', difficulty: 3, duration: '10–15 MIN', objective: 'Abre la ruta a Prokhorovka', reward: 400 }
  ];

  let campaign = loadCampaign();
  let selectedMission = 1;
  const $ = (id) => document.getElementById(id);

  function loadCampaign() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.completed)) {
        return { completed: [...new Set(saved.completed.filter((id) => Number.isInteger(id) && id >= 1 && id <= missions.length))] };
      }
    } catch (error) {
      console.warn('No se pudo leer el progreso de campaña; se iniciará una nueva.', error);
    }
    return { completed: [] };
  }

  function saveCampaign() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(campaign)); }
    catch (error) { console.warn('No se pudo guardar el progreso de campaña.', error); }
  }

  function isUnlocked(id) {
    return id === 1 || campaign.completed.includes(id - 1);
  }

  function renderCampaign() {
    const completed = new Set(campaign.completed);
    document.querySelectorAll('.mission-node').forEach((node) => {
      const id = Number(node.dataset.mission);
      const unlocked = isUnlocked(id);
      node.classList.toggle('is-locked', !unlocked);
      node.classList.toggle('is-selected', id === selectedMission);
      node.classList.toggle('is-complete', completed.has(id));
      const caption = node.querySelector('.node-caption small');
      const badge = node.querySelector('.node-ring span');
      if (caption) caption.textContent = completed.has(id) ? 'MISIÓN COMPLETADA' : unlocked ? 'OBJETIVO DISPONIBLE' : 'SECTOR BLOQUEADO';
      if (badge) badge.textContent = completed.has(id) ? '✓' : id === 1 ? '01' : id === 2 ? 'Ⅱ' : 'Ⅲ';
      node.setAttribute('aria-label', `Misión ${id}, ${missions[id - 1].name}, ${completed.has(id) ? 'completada' : unlocked ? 'disponible' : 'bloqueada'}`);
    });

    const mission = missions[selectedMission - 1];
    $('mission-number').textContent = `${String(mission.id).padStart(2, '0')} / 03`;
    $('mission-type').textContent = mission.type;
    $('mission-title').innerHTML = mission.id === 1 ? 'El puesto<br>avanzado' : mission.id === 2 ? 'Cruce del<br>Psel' : 'Camino a<br>Prokhorovka';
    $('mission-description').textContent = mission.description;
    $('mission-duration').textContent = mission.duration;
    $('mission-objective').textContent = mission.objective;
    $('mission-reward').textContent = mission.reward;
    $('mission-type-icon').textContent = mission.id === 1 ? '⌖' : mission.id === 2 ? '⚑' : '✦';
    document.querySelectorAll('.difficulty i').forEach((bar, index) => bar.classList.toggle('active', index < mission.difficulty));
    const launch = $('launch-mission');
    const unlocked = isUnlocked(mission.id);
    launch.disabled = !unlocked;
    launch.querySelector('span').textContent = !unlocked ? 'SECTOR BLOQUEADO' : campaign.completed.includes(mission.id) ? 'REPETIR MISIÓN' : 'INICIAR MISIÓN';
    const progress = campaign.completed.length;
    $('progress-label').textContent = `${progress} / 3 MISIONES`;
    $('progress-fill').style.width = `${(progress / missions.length) * 100}%`;
  }

  function showBattle() {
    if (!isUnlocked(selectedMission)) return;
    $('campaign-screen').classList.add('is-hidden');
    $('battle-screen').classList.remove('is-hidden');
    $('battle-mission-name').textContent = missions[selectedMission - 1].mapName;
    if (typeof resetBattle === 'function') resetBattle();
  }

  function showCampaign() {
    $('battle-screen').classList.add('is-hidden');
    $('campaign-screen').classList.remove('is-hidden');
    $('fin-partida').classList.add('oculto');
    renderCampaign();
  }

  document.querySelectorAll('.mission-node').forEach((node) => {
    node.addEventListener('click', () => {
      const id = Number(node.dataset.mission);
      if (!isUnlocked(id)) {
        const status = node.querySelector('.node-caption small');
        if (status) {
          status.textContent = 'COMPLETA LA MISIÓN ANTERIOR';
          window.setTimeout(renderCampaign, 1600);
        }
        return;
      }
      selectedMission = id;
      renderCampaign();
    });
  });

  $('launch-mission').addEventListener('click', showBattle);
  $('back-to-campaign').addEventListener('click', showCampaign);
  $('battle-result-back').addEventListener('click', showCampaign);
  $('reset-campaign').addEventListener('click', () => {
    if (!window.confirm('¿Reiniciar la campaña? Se borrarán las misiones completadas.')) return;
    campaign = { completed: [] };
    selectedMission = 1;
    saveCampaign();
    renderCampaign();
  });

  // main.js owns the combat rules. Wrap its result screen to record mission wins without
  // modifying the existing battle engine or changing how battles are played.
  if (typeof window.finPartida === 'function') {
    const originalFinish = window.finPartida;
    window.finPartida = function (winner) {
      originalFinish(winner);
      if (winner === 'USSR' && !campaign.completed.includes(selectedMission)) {
        campaign.completed.push(selectedMission);
        campaign.completed.sort((a, b) => a - b);
        saveCampaign();
        renderCampaign();
      }
    };
  }

  renderCampaign();
})();
