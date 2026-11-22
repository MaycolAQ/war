// Chess-like campaign configuration hook for js/main.js.
// If CAMPAIGN_MISSION is selected, setupBoard(), Unit stats, and mission names are read dynamically.
window.applyCampaignBattleConfig = function () {
  const mission = window.CAMPAIGN_MISSION;
  if (!mission) return null;
  return {
    soviet: {
      id: 't34-1', faction: 'USSR', name: mission.soviet,
      maxHp: mission.maxHp, moveRange: mission.moveRange,
      attackRange: mission.attackRange, damage: mission.damage,
      col: mission.positions.soviet[0], row: mission.positions.soviet[1]
    },
    german: {
      id: 'tiger-1', faction: 'GER', name: mission.german,
      maxHp: mission.enemyHp, moveRange: mission.enemyMove,
      attackRange: mission.enemyAttack, damage: mission.enemyDamage,
      col: mission.positions.german[0], row: mission.positions.german[1]
    }
  };
};
