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
        <p>Benvenuto ${playerName()}, lo scopo, come ben sai se hai familiarità con HxH, è quello di collezionare tutte le carte e andare alla capitale per incontrarti con il creatore del gioco. Ma attento! Ci sono altri giocatori e mostri temibili... ce la farai a battere tutti?</p>
      </section>

      <section class="guide-chapter">
        <h3>2. Livello ed esperienza</h3>
        <p>Il personaggio parte dal livello 1. Per ora c'è un tasto provvisorio Level-up test che regala un livello per provare il sistema.</p>
        <p>Ogni level up dà 3 punti parametro da distribuire. Se non li spendi subito, si accumulano.</p>
        <p>La soglia esperienza cresce così: dal livello 1 al 2 servono 10 XP, poi ogni nuova soglia aumenta della metà del valore precedente arrotondata per eccesso.</p>
      </section>

      <section class="guide-chapter">
        <h3>3. Statistiche generali</h3>
        <p>La scheda STAT mostra livello, esperienza, punti parametro, Jenny, energia, salute generale e Nen.</p>
        <ul>
          <li><strong>Energia:</strong> al livello 1 vale 3. Ogni livello aggiunge 2.</li>
          <li><strong>Nen:</strong> se il parametro Nen è 0, la statistica vale 1. Ogni punto in Nen aggiunge 4.</li>
          <li><strong>Salute generale:</strong> media arrotondata delle statistiche salute.</li>
        </ul>
        <p>Energia, Nen e salute generale appaiono come valore attuale / valore massimo. Per ora sono uguali perché non sono ancora stati aggiunti danni, consumo energia o consumo Nen.</p>
      </section>

      <section class="guide-chapter">
        <h3>4. Salute e robustezza</h3>
        <p>La salute è divisa in testa, corpo, braccio dx, braccio sx, gamba dx e gamba sx.</p>
        <p>La Robustezza modifica questi valori. Con Robustezza 0 restano i valori base. Con Robustezza 1 si aggiunge 4. Da Robustezza 2 in poi il valore base viene moltiplicato per la Robustezza.</p>
        <p>Ogni level up aggiunge anche un bonus salute basato sul valore base della parte del corpo.</p>
      </section>

      <section class="guide-chapter">
        <h3>5. Mappa e movimento</h3>
        <p>La mappa può essere zoomata con la rotella del mouse. Quando sei zoomato puoi spostare la visuale trascinando la mappa. Se torni a 1x, la visuale si resetta al centro.</p>
        <ul>
          <li><strong>Verde:</strong> location in cui ti trovi.</li>
          <li><strong>Giallo:</strong> location raggiungibile a piedi dalla tua posizione.</li>
          <li><strong>Bianco:</strong> location non raggiungibile da dove sei ora.</li>
        </ul>
        <p>Se provi a raggiungere una location non collegata alla tua posizione, il gioco ti dice perché non puoi andarci.</p>
      </section>

      <section class="guide-chapter">
        <h3>6. Tipi di location</h3>
        <p>Esistono tre tipi di location, indicati da icone vicino al nome.</p>
        <ul>
          <li><strong>● Città:</strong> centri abitati come Masadora, Antokiba o Aiai.</li>
          <li><strong>♣ Zone selvagge:</strong> aree pericolose o esplorative. Il numero vicino all'icona indica la difficoltà da 1 a 5.</li>
          <li><strong>★ Zone neutre:</strong> aree speciali, non ancora legate a combattimento diretto.</li>
        </ul>
      </section>

      <section class="guide-chapter">
        <h3>7. Location attuali</h3>
        <p>Le location attuali includono città, zone selvagge e zone neutre distribuite sulla mappa: Masadora, Antokiba, Aiai, Limeiro, Foresta Oscura, Badlands, Rovine infestate, Plateau Bye Bye, Shiso tree, Accampamento misterioso, Isola sul lago, Casa senile e altre.</p>
        <p>Limeiro è la capitale: da Masadora sarà accessibile solo con tutte le carte collezionate.</p>
      </section>

      <section class="guide-chapter">
        <h3>8. Jenny</h3>
        <p>Il Jenny, indicato con Ｊ, è la valuta ingame. Per ora ogni personaggio parte da 0 Ｊ.</p>
        <p>In futuro servirà per acquisti, ricompense, città, carte o altre meccaniche economiche.</p>
      </section>

      <section class="guide-chapter">
        <h3>9. Salvataggio</h3>
        <p>Il personaggio, la location, i parametri, il livello, l'esperienza e i Jenny vengono salvati nell'archivio server.</p>
        <p class="guide-note">L'unico modo per cancellare tutto è usare il tasto Elimina personaggio.</p>
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
