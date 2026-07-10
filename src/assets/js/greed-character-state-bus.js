(() => {
  if (window.__greedCharacterStateBus) return;
  window.__greedCharacterStateBus = true;

  let lastSignature = '';
  let lastAt = 0;
  let requestSeq = 0;
  let latestPublishedSeq = 0;
  let lastAuthoritativeAt = 0;
  const relevant = url => /\/api\/hxh-(character|explore|explore-claim|special-materialize)/.test(String(url || ''));
  const sourceOf = url => {
    const s = String(url || '');
    if (/\/api\/hxh-character(?:\?|$)/.test(s)) return 'character';
    if (/\/api\/hxh-explore(?:\?|$)/.test(s)) return 'explore';
    if (/\/api\/hxh-explore-claim(?:\?|$)/.test(s)) return 'explore-claim';
    if (/\/api\/hxh-special-materialize(?:\?|$)/.test(s)) return 'special-materialize';
    return 'unknown';
  };
  const statusFields = [
    'restPenaltyUntil','restCooldownUntil','restPenaltyActive','restPenaltySecondsLeft','restCooldownActive','restCooldownSecondsLeft',
    'sleepUntil','sleepCooldownUntil','sleepActive','sleepSecondsLeft','sleepCooldownActive','sleepCooldownSecondsLeft','sleepLocation',
    'exhaustionUntil','exhaustionActive','exhaustionSecondsLeft','fatigue','fatigueUpdatedAt','fatigueTier','fatigueLabel','energySurcharge','moveEnergyCost',
    'vulnerability','vulnerabilityEffective'
  ];
  const mergeNonAuthoritative = character => {
    const base = window.__greedCurrentCharacter;
    if (!base) return character;
    const merged = { ...base, ...character };
    for (const key of statusFields) if (Object.prototype.hasOwnProperty.call(base, key)) merged[key] = base[key];
    const baseGenerali = base.stats?.generali || {};
    const incomingGenerali = character.stats?.generali || {};
    merged.stats = {
      ...(base.stats || {}),
      ...(character.stats || {}),
      generali: {
        ...incomingGenerali,
        stato: baseGenerali.stato,
        statoValore: baseGenerali.statoValore,
        costoExtraEnergia: baseGenerali.costoExtraEnergia,
        costoMovimento: baseGenerali.costoMovimento
      },
      valori: {
        ...(character.stats?.valori || {}),
        ...(base.stats?.valori || {})
      }
    };
    return merged;
  };
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
        stato: g.stato,
        statoValore: g.statoValore
      }
    });
  };
  const publish = (character, seq = ++requestSeq, source = 'manual') => {
    if (!character) return;
    if (seq < latestPublishedSeq) return;
    const authoritative = source === 'character';
    let next = authoritative ? character : mergeNonAuthoritative(character);
    if (authoritative) lastAuthoritativeAt = Date.now();
    const sig = signature(next);
    const now = Date.now();
    if (sig === lastSignature && now - lastAt < 250) return;
    latestPublishedSeq = seq;
    lastSignature = sig;
    lastAt = now;
    window.__greedCurrentCharacter = next;
    window.dispatchEvent(new CustomEvent('greed-character-updated', { detail: next }));
  };
  window.greedPublishCharacter = (character, source = 'manual') => publish(character, ++requestSeq, source);

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const isRelevant = relevant(url);
    const source = sourceOf(url);
    const seq = isRelevant ? ++requestSeq : 0;
    const response = await originalFetch(...args);
    try {
      if (response.ok && isRelevant) {
        response.clone().json().then(data => {
          if (data?.character) publish(data.character, seq, source);
        }).catch(() => {});
      }
    } catch {}
    return response;
  };
})();
