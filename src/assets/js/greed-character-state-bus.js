(() => {
  if (window.__greedCharacterStateBus) return;
  window.__greedCharacterStateBus = true;

  let lastSignature = '';
  let lastAt = 0;
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
      location: character.location,
      fatigue: character.fatigue,
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
        jenny: g.jenny
      }
    });
  };
  const publish = character => {
    if (!character) return;
    const sig = signature(character);
    const now = Date.now();
    if (sig === lastSignature && now - lastAt < 250) return;
    lastSignature = sig;
    lastAt = now;
    window.__greedCurrentCharacter = character;
    window.dispatchEvent(new CustomEvent('greed-character-updated', { detail: character }));
  };
  window.greedPublishCharacter = publish;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      if (response.ok && relevant(url)) {
        response.clone().json().then(data => {
          if (data?.character) publish(data.character);
        }).catch(() => {});
      }
    } catch {}
    return response;
  };
})();
