(() => {
  if (window.__greedCharacterStateBus) return;
  window.__greedCharacterStateBus = true;

  let lastSignature = '';
  let lastAt = 0;
  let requestSeq = 0;
  let latestPublishedSeq = 0;

  const isCharacterEndpoint = url => /\/api\/hxh-character(?:\?|$)/.test(String(url || ''));

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
      fatigueLabel: character.fatigueLabel,
      restPenaltyUntil: character.restPenaltyUntil,
      restPenaltySecondsLeft: character.restPenaltySecondsLeft,
      restCooldownUntil: character.restCooldownUntil,
      restCooldownSecondsLeft: character.restCooldownSecondsLeft,
      sleepUntil: character.sleepUntil,
      sleepSecondsLeft: character.sleepSecondsLeft,
      exhaustionUntil: character.exhaustionUntil,
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
        stato: g.stato,
        statoValore: g.statoValore,
        costoExtraEnergia: g.costoExtraEnergia,
        costoMovimento: g.costoMovimento
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

  window.greedPublishCharacter = character => {
    // Deprecated escape hatch: only accepted for fully normalized characters.
    if (character?.stats?.generali && Object.prototype.hasOwnProperty.call(character, 'restPenaltySecondsLeft')) publish(character, ++requestSeq);
  };

  window.greedRefreshCharacter = async () => {
    const token = localStorage.getItem('mancuspieAuthToken') || '';
    const seq = ++requestSeq;
    const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token}` }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore personaggio');
    if (data.character) publish(data.character, seq);
    return data.character;
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const shouldPublish = isCharacterEndpoint(url);
    const seq = shouldPublish ? ++requestSeq : 0;
    const response = await originalFetch(...args);
    try {
      if (response.ok && shouldPublish) {
        response.clone().json().then(data => {
          if (data?.character) publish(data.character, seq);
        }).catch(() => {});
      }
    } catch {}
    return response;
  };
})();
