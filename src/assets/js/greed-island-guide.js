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

  const html = `
    <h2>Guida</h2>
    <div class="guide-book">
      <section class="guide-chapter">
        <h3>1. Accesso a Greed Island</h3>
        <p>Per giocare devi prima essere loggato su Mancuspie. Se entri senza account attivo, la pagina ti blocca e ti chiede di creare o usare il profilo Mancuspie.</p>
        <p>Ogni personaggio HxH è collegato al tuo account Mancuspie e non al browser.</p>
      </section>

      <section class="guide-chapter">
        <h3>2. Creazione del personaggio</h3>
        <p>Il personaggio richiede nome, cognome, età, sesso, storia, abilità Nen e autore preferito.</p>
        <p>Dopo la creazione il personaggio viene salvato nell'archivio server e resta disponibile anche dopo refresh, uscita dal sito o nuovo deploy.</p>
      </section>

      <section class="guide-chapter">
        <h3>3. Scheda parametri iniziale</h3>
        <p>Prima di entrare nella mappa devi distribuire 10 punti iniziali tra otto parametri.</p>
        <ul>
          <li>Forza</li>
          <li>Robustezza</li>
          <li>Nen</li>
          <li>Intelligenza</li>
          <li>Malizia</li>
          <li>Agilità</li>
          <li>Oratoria</li>
          <li>Percezione</li>
        </ul>
        <p>Puoi mettere anche tutti e 10 i punti su un solo parametro. Durante questa fase puoi usare + e - per correggere la distribuzione.</p>
      </section>

      <section class="guide-chapter">
        <h3>4. Menu e schede</h3>
        <p>Il tasto Menù apre il menu laterale. Quando lo apri non compare nessuna scheda già aperta: scegli tu cosa vedere.</p>
        <ul>
          <li><strong>Giocatori:</strong> mostra i personaggi HxH salvati dagli utenti Mancuspie.</li>
          <li><strong>Esplora:</strong> sezione ancora da costruire.</li>
          <li><strong>Info:</strong> mostra le informazioni narrative del tuo personaggio.</li>
          <li><strong>STAT:</strong> mostra parametri, statistiche generali e salute.</li>
          <li><strong>Guida:</strong> questa sezione.</li>
        </ul>
      </section>

      <section class="guide-chapter">
        <h3>5. Livello ed esperienza</h3>
        <p>Il personaggio parte dal livello 1. Per ora c'è un tasto provvisorio Level-up test che regala un livello per provare il sistema.</p>
        <p>Ogni level up dà 3 punti parametro da distribuire. Se non li spendi subito, si accumulano.</p>
        <p>La soglia esperienza cresce così: dal livello 1 al 2 servono 10 XP, poi ogni nuova soglia aumenta della metà del valore precedente arrotondata per eccesso.</p>
      </section>

      <section class="guide-chapter">
        <h3>6. Statistiche generali</h3>
        <p>La scheda STAT mostra livello, esperienza, punti parametro, Jenny, energia, salute generale e Nen.</p>
        <ul>
          <li><strong>Energia:</strong> al livello 1 vale 3. Ogni livello aggiunge 2.</li>
          <li><strong>Nen:</strong> se il parametro Nen è 0, la statistica vale 1. Ogni punto in Nen aggiunge 4.</li>
          <li><strong>Salute generale:</strong> media arrotondata delle statistiche salute.</li>
        </ul>
        <p>Energia, Nen e salute generale appaiono come valore attuale / valore massimo. Per ora sono uguali perché non sono ancora stati aggiunti danni, consumo energia o consumo Nen.</p>
      </section>

      <section class="guide-chapter">
        <h3>7. Salute e robustezza</h3>
        <p>La salute è divisa in testa, corpo, braccio dx, braccio sx, gamba dx e gamba sx.</p>
        <p>La Robustezza modifica questi valori. Con Robustezza 0 restano i valori base. Con Robustezza 1 si aggiunge 4. Da Robustezza 2 in poi il valore base viene moltiplicato per la Robustezza.</p>
        <p>Ogni level up aggiunge anche un bonus salute basato sul valore base della parte del corpo.</p>
      </section>

      <section class="guide-chapter">
        <h3>8. Mappa e movimento</h3>
        <p>La mappa può essere zoomata con la rotella del mouse e spostata trascinandola. I nomi delle location si muovono insieme alla mappa.</p>
        <ul>
          <li><strong>Verde:</strong> location in cui ti trovi.</li>
          <li><strong>Giallo:</strong> location raggiungibile a piedi dalla tua posizione.</li>
          <li><strong>Bianco:</strong> location non raggiungibile da dove sei ora.</li>
        </ul>
        <p>Se provi a raggiungere una location non collegata alla tua posizione, il gioco ti dice che non puoi arrivarci a piedi da dove sei ora.</p>
      </section>

      <section class="guide-chapter">
        <h3>9. Tipi di location</h3>
        <p>Esistono tre tipi di location, indicati da icone vicino al nome.</p>
        <ul>
          <li><strong>⌂ Città:</strong> centri abitati come Masadora, Antokiba o Aiai.</li>
          <li><strong>♣ Zone selvagge:</strong> aree pericolose o esplorative, come la Foresta Oscura.</li>
          <li><strong>★ Zone neutre:</strong> aree speciali o non ostili, ancora da aggiungere.</li>
        </ul>
      </section>

      <section class="guide-chapter">
        <h3>10. Location attuali</h3>
        <p>Le location già presenti sono Masadora, Aiai, Soufrabi, Antokiba, Dorias, Rubicuta, Limeiro, Bunzen e Foresta Oscura.</p>
        <p>Limeiro è la capitale e per ora risulta bloccata: sarà accessibile solo con tutte le carte collezionate.</p>
      </section>

      <section class="guide-chapter">
        <h3>11. Jenny</h3>
        <p>Il Jenny, indicato con Ｊ, è la valuta ingame. Per ora ogni personaggio parte da 0 Ｊ.</p>
        <p>In futuro servirà per acquisti, ricompense, città, carte o altre meccaniche economiche.</p>
      </section>

      <section class="guide-chapter">
        <h3>12. Salvataggio</h3>
        <p>Il personaggio, la location, i parametri, il livello, l'esperienza e i Jenny vengono salvati nell'archivio server.</p>
        <p class="guide-note">L'unico modo per cancellare tutto è usare il tasto Elimina personaggio.</p>
      </section>
    </div>
  `;

  guideButton.addEventListener('click', () => {
    setTimeout(() => {
      panel.innerHTML = html;
      panel.classList.add('is-active');
    }, 0);
  });
})();
