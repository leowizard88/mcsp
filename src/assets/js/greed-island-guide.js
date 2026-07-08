(() => {
  const panel = document.querySelector('[data-menu-panel]');
  const guideButton = document.querySelector('[data-panel="guide"]');
  if (!panel || !guideButton) return;

  const css = document.createElement('style');
  css.textContent = `
    .guide-book{display:grid;gap:14px;font-family:Arial,Helvetica,sans-serif;color:#f4ffe8}
    .guide-chapter{border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.42);padding:12px 13px}
    .guide-chapter h3{margin:0 0 7px;color:#ffe16a;font:800 16px/1.15 Arial,Helvetica,sans-serif;text-transform:none;letter-spacing:0;text-shadow:1px 1px 0 #000}
    .guide-chapter p{margin:0 0 7px;font:400 14px/1.38 Arial,Helvetica,sans-serif;color:#f4ffe8}
    .guide-chapter ul{margin:7px 0 0 18px;padding:0;display:grid;gap:5px}
    .guide-chapter li{font:400 14px/1.35 Arial,Helvetica,sans-serif;color:#f4ffe8}
    .guide-note{border-left:3px solid #dfff73;padding-left:9px;color:#dfff73!important}
  `;
  document.head.appendChild(css);

  const playerName = () => document.querySelector('[data-hxh-name]')?.textContent?.trim() || document.querySelector('[data-location-label]')?.dataset?.playerName || 'giocatore';
  const html = () => `
    <h2>Guida</h2>
    <div class="guide-book">
      <section class="guide-chapter">
        <h3>1. Benvenuto a Greed Island!</h3>
        <p>Benvenuto ${playerName()}, lo scopo è collezionare le carte specifiche di Greed Island e raggiungere Limeiro, la capitale, per incontrare il creatore del gioco. Ci sono altri giocatori, mostri, zone selvagge, città strane e parecchie occasioni per farsi scavallare.</p>
      </section>
      <section class="guide-chapter">
        <h3>2. Creazione personaggio e parametri</h3>
        <p>Dopo aver creato il personaggio devi distribuire 10 punti iniziali tra Forza, Robustezza, Nen, Intelligenza, Malizia, Agilità, Oratoria e Percezione.</p>
        <p>Quando i punti rimasti arrivano a 0 compare il tasto ENTRA IN GREED ISLAND. Premendolo parte l’ingresso nel gioco.</p>
      </section>
      <section class="guide-chapter">
        <h3>3. Livello, XP e punti parametro</h3>
        <p>Il personaggio parte dal livello 1. Ogni level up assegna 3 punti parametro da distribuire. Se non li spendi subito, si accumulano.</p>
        <p>La soglia XP parte da 10 e poi cresce aggiungendo ogni volta metà della soglia precedente, arrotondata per eccesso.</p>
      </section>
      <section class="guide-chapter">
        <h3>4. Energia, salute e Nen</h3>
        <ul>
          <li><strong>Energia:</strong> al livello 1 vale 3. Ogni livello aggiunge 2. Si ricarica di 1 ogni 10 minuti.</li>
          <li><strong>Salute generale:</strong> è la media arrotondata delle parti del corpo.</li>
          <li><strong>Nen:</strong> se il parametro Nen è 0, la statistica vale 1. Ogni punto in Nen aggiunge 4.</li>
        </ul>
        <p>La salute è divisa in testa, corpo, braccio dx, braccio sx, gamba dx e gamba sx. La Robustezza modifica i valori salute.</p>
      </section>
      <section class="guide-chapter">
        <h3>5. Mappa e movimento</h3>
        <p>Puoi muoverti solo verso location collegate a quella in cui ti trovi. Cliccando una location raggiungibile compare il popup con ENTRA.</p>
        <ul>
          <li><strong>Verde:</strong> location in cui sei.</li>
          <li><strong>Giallo:</strong> location raggiungibile.</li>
          <li><strong>Bianco:</strong> location non raggiungibile.</li>
        </ul>
        <p>Cliccando la location in cui sei già si apre direttamente la box location.</p>
      </section>
      <section class="guide-chapter">
        <h3>6. Stato, fatica ed esaurimento</h3>
        <p>Ogni movimento aumenta il valore Stato di 1. Se non ti sposti per 30 minuti, il valore Stato torna automaticamente a 0.</p>
        <ul>
          <li><strong>0-9 Normale:</strong> costo energia base.</li>
          <li><strong>10-19 Affaticato:</strong> tutte le azioni che consumano energia costano +1.</li>
          <li><strong>20-29 Stanco:</strong> tutte le azioni che consumano energia costano +2.</li>
          <li><strong>30+ Esausto:</strong> non puoi muoverti.</li>
        </ul>
        <p>Quando sei Esausto compare in STAT il tasto rosso Collassa a terra. Il collasso attiva Esaurimento: per 10 minuti sei inattivo, appare un timer gigante e ogni attività è bloccata. Alla fine recuperi tutta l’energia e Stato torna a 0.</p>
      </section>
      <section class="guide-chapter">
        <h3>7. Tipi di location e azioni</h3>
        <ul>
          <li><strong>● Città:</strong> hanno Attività, Riposa e Usa carta.</li>
          <li><strong>♣ Zone selvagge:</strong> hanno Esplora e Usa carta. Il numero indica la difficoltà da 1 a 5.</li>
          <li><strong>★ Zone neutre:</strong> hanno azioni più limitate e funzioni speciali.</li>
        </ul>
        <p>La box location può essere chiusa con la X. Si apre quando entri in una nuova location o quando clicchi la location in cui ti trovi già.</p>
      </section>
      <section class="guide-chapter">
        <h3>8. Riposa</h3>
        <p>Riposa è disponibile solo nelle città. Ripristina tutta l’energia, tutta la vita e azzera Stato.</p>
        <p>Dopo il riposo hai un cooldown globale di 3 ore. Inoltre subisci una penalità temporanea: -1 a tutti i parametri per 10 minuti.</p>
      </section>
      <section class="guide-chapter">
        <h3>9. Binder Book</h3>
        <p>Il Binder Book è l’album delle carte. Ha 150 slot totali, divisi in pagine da 10 slot.</p>
        <ul>
          <li><strong>000-099:</strong> carte specifiche necessarie per finire Greed Island.</li>
          <li><strong>100-149:</strong> carte libere, non necessarie al completamento.</li>
        </ul>
      </section>
      <section class="guide-chapter">
        <h3>10. Jenny e inventario</h3>
        <p>Il Jenny, indicato con Ｊ, è la valuta ingame. Per ora ogni personaggio parte da 0 Ｊ.</p>
        <p>L’inventario conserva oggetti, carte e strumenti del giocatore. Le carte possono poi essere lette dal Binder Book quando avranno numero o slot.</p>
      </section>
      <section class="guide-chapter">
        <h3>11. Salvataggio e cancellazione</h3>
        <p>Personaggio, location, parametri, energia, salute, Stato, riposo, esaurimento, inventario, livello, XP e Jenny sono salvati lato server.</p>
        <p class="guide-note">Il tasto Elimina personaggio cancella il personaggio dopo conferma.</p>
      </section>
    </div>
  `;

  guideButton.addEventListener('click', () => {
    setTimeout(() => {
      panel.innerHTML = html();
      panel.classList.add('is-active');
    }, 0);
  });
})();
