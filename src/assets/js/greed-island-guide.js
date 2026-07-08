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
    .guide-warn{border-left:3px solid #ff7474;padding-left:9px;color:#ffb0b0!important}
  `;
  document.head.appendChild(css);

  const playerName = () => document.querySelector('[data-hxh-name]')?.textContent?.trim() || document.querySelector('[data-location-label]')?.dataset?.playerName || 'giocatore';
  const html = () => `
    <h2>Guida</h2>
    <div class="guide-book">
      <section class="guide-chapter">
        <h3>1. Benvenuto a Greed Island</h3>
        <p>Benvenuto ${playerName()}, lo scopo è esplorare Greed Island, gestire energia, salute, carte, inventario e interazioni con altri giocatori. Il gioco è salvato lato server.</p>
        <p>Appena entri ricevi una carta libera starter: <strong>Maiale di Greed Island</strong>, rarità E, limite globale infinito.</p>
      </section>
      <section class="guide-chapter">
        <h3>2. Creazione personaggio e parametri</h3>
        <p>Dopo aver creato il personaggio devi distribuire 10 punti iniziali tra Forza, Robustezza, Nen, Intelligenza, Malizia, Agilità, Oratoria e Percezione.</p>
        <p>Quando i punti rimasti arrivano a 0 compare il tasto ENTRA IN GREED ISLAND. Da lì parte la mappa.</p>
      </section>
      <section class="guide-chapter">
        <h3>3. Livello, XP e punti parametro</h3>
        <p>Il personaggio parte dal livello 1. Ogni level up assegna 3 punti parametro da distribuire.</p>
        <p>La soglia XP parte da 10 e poi cresce aggiungendo ogni volta metà della soglia precedente, arrotondata per eccesso.</p>
      </section>
      <section class="guide-chapter">
        <h3>4. Energia, salute e Nen</h3>
        <ul>
          <li><strong>Energia:</strong> al livello 1 vale 3. Ogni livello aggiunge 2. Si ricarica di 1 ogni 10 minuti, tranne durante esaurimento o sonno attivo.</li>
          <li><strong>Salute generale:</strong> è la media arrotondata delle parti del corpo.</li>
          <li><strong>Nen:</strong> se il parametro Nen è 0, la statistica vale 1. Ogni punto in Nen aggiunge 4.</li>
        </ul>
        <p>La salute è divisa in testa, corpo, braccio dx, braccio sx, gamba dx e gamba sx. Formula: base parte corpo + Robustezza×2 + bonus livello.</p>
      </section>
      <section class="guide-chapter">
        <h3>5. Mappa e movimento</h3>
        <p>Puoi muoverti solo verso location collegate a quella in cui ti trovi. Cliccando una location raggiungibile compare il popup con ENTRA.</p>
        <ul>
          <li><strong>Verde:</strong> location in cui sei.</li>
          <li><strong>Giallo:</strong> location raggiungibile.</li>
          <li><strong>Bianco:</strong> location non raggiungibile.</li>
        </ul>
        <p>Cliccando la location in cui sei già si apre direttamente la box location. Quando la box location è aperta sta sopra la chat.</p>
      </section>
      <section class="guide-chapter">
        <h3>6. Stato, fatica ed esaurimento</h3>
        <p>Ogni movimento aumenta Stato di 1. Se non ti sposti per 30 minuti, Stato torna automaticamente a 0.</p>
        <ul>
          <li><strong>0-9 Normale:</strong> costo energia base.</li>
          <li><strong>10-19 Affaticato:</strong> azioni con energia +1.</li>
          <li><strong>20-29 Stanco:</strong> azioni con energia +2.</li>
          <li><strong>30+ Esausto:</strong> non puoi muoverti.</li>
        </ul>
        <p>Quando sei Esausto compare in STAT il tasto Collassa a terra. Il collasso attiva Esaurimento: 10 minuti inattivo, timer gigante, attività bloccate. Alla fine recuperi energia piena e Stato 0.</p>
      </section>
      <section class="guide-chapter">
        <h3>7. Valori</h3>
        <p>Dentro STAT c’è la sezione Valori, sotto le statistiche salute. Per ora contiene Vulnerabilità.</p>
        <ul>
          <li><strong>Bassa:</strong> default.</li>
          <li><strong>Media:</strong> valore intermedio per eventi futuri.</li>
          <li><strong>Alta:</strong> valore pericoloso. Dormire imposta Vulnerabilità alta per 6 ore.</li>
        </ul>
      </section>
      <section class="guide-chapter">
        <h3>8. Location e azioni</h3>
        <ul>
          <li><strong>● Città:</strong> Attività, Riposa, Dormi, Usa carta.</li>
          <li><strong>♣ Zone selvagge:</strong> Esplora e Usa carta. Il numero indica difficoltà 1-5.</li>
          <li><strong>★ Zone neutre:</strong> Attività, Riposa, Usa carta.</li>
        </ul>
        <p>La box location può essere chiusa con la X. Durante il sonno la box è in sola visualizzazione: niente Riposa, Attività, Usa carta, Esplora o Dormi.</p>
      </section>
      <section class="guide-chapter">
        <h3>9. Riposa</h3>
        <p>Riposa è disponibile nelle città e nelle zone neutre. Ripristina energia piena, azzera Stato e cura circa il 30% della salute massima di ogni parte del corpo.</p>
        <p>Dopo il riposo hai cooldown globale di 3 ore e penalità temporanea: -1 a tutti i parametri per 10 minuti. La chat mostra una notifica di riposo.</p>
      </section>
      <section class="guide-chapter">
        <h3>10. Dormi</h3>
        <p>Dormi è disponibile solo nelle città. Ha cooldown di 6 ore e non dà penalità ai parametri.</p>
        <p>Quando dormi recuperi vita piena, energia piena e Stato 0. Per 6 ore resti bloccato nella città, Vulnerabilità diventa alta, la mappa si scurisce come notte e il menu è solo in visualizzazione.</p>
      </section>
      <section class="guide-chapter">
        <h3>11. Binder Book e tipi di carte</h3>
        <p>Il Binder Book ha tre blocchi separati:</p>
        <ul>
          <li><strong>000-099:</strong> carte numerate. Hanno bordo dorato luccicante.</li>
          <li><strong>100-149:</strong> carte libere. Oggetti o creature estraibili e ritrasformabili in carta.</li>
          <li><strong>S01-S50:</strong> carte incantesimo. Hanno effetto, non diventano oggetti o creature.</li>
        </ul>
        <p>Cliccando una carta piena si apre la scheda a destra, stile Greed Island: disegno, descrizione, rango, limite, tipo e usi.</p>
      </section>
      <section class="guide-chapter">
        <h3>12. Rarità e limiti globali</h3>
        <p>Le rarità valide sono: SS, S, A, B, C, D, E. Non esiste rarità H.</p>
        <ul>
          <li><strong>SS:</strong> 1-5 copie.</li>
          <li><strong>S:</strong> 6-13 copie.</li>
          <li><strong>A:</strong> 11-23 copie.</li>
          <li><strong>B:</strong> 20-30 copie.</li>
          <li><strong>C:</strong> 40-50 copie.</li>
          <li><strong>D:</strong> 60-70 copie.</li>
          <li><strong>E:</strong> infinito.</li>
        </ul>
        <p>Il limite globale indica quante copie possono esistere contemporaneamente tra tutti i giocatori.</p>
      </section>
      <section class="guide-chapter">
        <h3>13. Materializzare e trasformare</h3>
        <p>Le carte libere possono essere materializzate: escono dal Binder e diventano oggetti nell’inventario.</p>
        <p>Nell’inventario puoi cliccare un oggetto per aprire la finestra dettagli a destra. L’opzione <strong>Trasforma in carta</strong> rimette l’oggetto nel Binder se lo slot è disponibile.</p>
      </section>
      <section class="guide-chapter">
        <h3>14. Inventario, Jenny e Maiale</h3>
        <p>L’inventario conserva oggetti, creature materializzate, strumenti e altri elementi futuri. Il Jenny, indicato con Ｊ, è la valuta ingame.</p>
        <p>La carta starter Maiale di Greed Island occupa lo slot libero 100. Se la materializzi ottieni nell’inventario: Maiale di Greed Island, descrizione: “Un... maiale!?”.</p>
      </section>
      <section class="guide-chapter">
        <h3>15. Chat globale e notifiche</h3>
        <p>In basso a destra c’è la chat globale per giocatori e notifiche. Puoi scrivere agli altri giocatori e ricevere notifiche personali.</p>
        <ul>
          <li><strong>Verde:</strong> eventi positivi o neutri, come carte ottenute e riposo.</li>
          <li><strong>Rosso:</strong> eventi negativi, come sonno bloccante, danni o esaurimento.</li>
          <li><strong>Blu:</strong> messaggi sistema.</li>
        </ul>
        <p>Se scorri verso l’alto, la chat carica messaggi globali più vecchi fino a 100 messaggi indietro.</p>
      </section>
      <section class="guide-chapter">
        <h3>16. Menu e livelli visuali</h3>
        <p>Quando apri il menu, il menu sovrasta location, energia, welcome e HUD. Su mobile la chat sparisce mentre il menu è aperto.</p>
      </section>
      <section class="guide-chapter">
        <h3>17. Salvataggio e cancellazione</h3>
        <p>Personaggio, location, parametri, energia, salute, Stato, Valori, sonno, riposo, esaurimento, carte, inventario, livello, XP e Jenny sono salvati lato server.</p>
        <p class="guide-warn">Elimina personaggio è stato spostato nel menu, in fondo, dentro la sezione rossa Zona pericolosa. Cancella il personaggio dopo conferma.</p>
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
