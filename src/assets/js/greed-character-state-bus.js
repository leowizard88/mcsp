(() => {
  if (window.__greedCharacterStateBus) return;
  window.__greedCharacterStateBus = true;

  let lastSignature = '';
  let lastAt = 0;
  let requestSeq = 0;
  let latestPublishedSeq = 0;
  const relevant = url => /\/api\/hxh-(character|explore|explore-claim|special-materialize)/.test(String(url || ''));
  const signature = character => {
    if (!character) return '';
    const g = character.stats?.generali || {};
    const health = character.health || character.stats?.salute || {};
    return JSON.stringify({
      level: character.level,
      xp: character.xp,
      nextXp: character.nextXp,
      paramPoints: character.paramPoints,
      setupPoints: character.setupPoints,
      jenny: character.jenny,
      energy: character.energy,
      energyUpdatedAt: character.energyUpdatedAt,
      updatedAt: character.updatedAt,
      location: character.location,
      fatigue: character.fatigue,
      restPenaltySecondsLeft: character.restPenaltySecondsLeft,
      restCooldownSecondsLeft: character.restCooldownSecondsLeft,
      exhaustionSecondsLeft: character.exhaustionSecondsLeft,
      activeExploration: character.activeExploration?.id || null,
      criticalState: !!character.criticalState,
      health,
      generali: {
        energia: g.energia,
        energiaMax: g.energiaMax,
        saluteGenerale: g.saluteGenerale,
        saluteGeneraleMax: g.saluteGeneraleMax,
        esperienza: g.esperienza,
        prossimoLivello: g.prossimoLivello,
        puntiParametro: g.puntiParametro,
        jenny: g.jenny,
        stato: g.stato
      }
    });
  };
  const publish = (character, seq = ++requestSeq) => {
    if (!character) return;
    if (seq < latestPublishedSeq) return;
    const sig = signature(character);
    const now = Date.now();
    if (sig === lastSignature && now - lastAt < 250) return;
    latestPublishedSeq = seq;
    lastSignature = sig;
    lastAt = now;
    window.__greedCurrentCharacter = character;
    window.dispatchEvent(new CustomEvent('greed-character-updated', { detail: character }));
  };
  window.greedPublishCharacter = character => publish(character, ++requestSeq);

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const isRelevant = relevant(url);
    const seq = isRelevant ? ++requestSeq : 0;
    const response = await originalFetch(...args);
    try {
      if (response.ok && isRelevant) {
        response.clone().json().then(data => {
          if (data?.character) publish(data.character, seq);
        }).catch(() => {});
      }
    } catch {}
    return response;
  };
})();
