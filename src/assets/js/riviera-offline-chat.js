(() => {
  const form = document.querySelector('[data-chrollo-form]');
  const log = document.querySelector('[data-chrollo-log]');
  if (!form || !log) return;

  const norm = s => String(s || '').toLowerCase();
  const hash = s => Math.abs([...s].reduce((n, c) => ((n << 5) - n + c.charCodeAt(0)) | 0, 31));
  const one = (arr, seed) => arr[hash(seed) % arr.length];

  const genericOpen = ['La domanda e imprecisa, ma contiene una direzione.', 'Il centro non e dove lo hai indicato.', 'Prima separerei il fatto dal desiderio.', 'La risposta semplice sarebbe troppo povera.', 'La premessa merita piu attenzione della conclusione.'];
  const genericMid = ['Ogni scelta rivela cio che sei disposto a perdere.', 'Il valore di una cosa appare quando smette di essere garantita.', 'Il controllo piu efficace spesso sembra naturale.', 'La memoria seleziona prima ancora di raccontare.', 'Il vuoto non e assenza: e spazio non ancora disciplinato.'];
  const genericEnd = ['Da qui si puo pensare con piu precisione.', 'Non e consolazione, e diagnosi.', 'Il resto e decorazione.', 'Tienilo fermo e guarda cosa cambia.', 'Forse cercavi permesso, non risposta.'];

  const topics = [
    { r:/amore|ama|innamor|relazione|fidanz|gelosia|tradimento|desiderio/i, a:['Sull amore non mi fiderei delle parole piu dolci.', 'L amore diventa interessante quando smette di dichiararsi innocente.'], b:['Di solito non rivela una verita pura, ma una gerarchia: cosa scegli, cosa sacrifichi, cosa pretendi di non vedere.', 'E una forma di attenzione selettiva: illumina un punto e lascia il resto nell ombra.'], c:['Quindi chiediti non quanto senti, ma cosa sei disposto a perdere senza chiamarlo martirio.', 'Il sentimento conta meno della forma che prende quando incontra un limite.'] },
    { r:/paura|ansia|panico|spavento|temo|terrore|preoccup/i, a:['La paura e raramente stupida.', 'L ansia non e un oracolo, ma nemmeno rumore puro.'], b:['Sta proteggendo qualcosa: reputazione, corpo, futuro, immagine di te. Il punto e capire quale possesso sta sorvegliando.', 'Esagera le forme, ma non inventa sempre il contenuto. Ti mostra dove ti senti esposto.'], c:['Nomina l oggetto con precisione e perdera parte del suo prestigio.', 'Non devi obbedirle; devi interrogarla senza inginocchiarti.'] },
    { r:/soldi|denaro|povero|ricco|lavoro|stipendio|comprare|costo|pagare/i, a:['Il denaro ha il pregio della brutalita.', 'Sul lavoro conviene essere meno romantici.'], b:['Traduce desideri, tempo e dipendenze in cifre. Non dice tutto, ma svela molte menzogne.', 'Non misura il valore di una persona; misura pero quanto spazio le viene concesso per sbagliare.'], c:['La domanda vera e quale liberta stai vendendo e a quale prezzo.', 'Non moralizzarlo troppo: osserva chi puo farne a meno e chi no.'] },
    { r:/scuola|studio|universit|esame|tesi|leggere|prof|lezione/i, a:['Studiare non significa accumulare frasi.', 'Un esame e spesso una piccola macchina di obbedienza.'], b:['Il punto e trasformare cio che leggi in strumenti, non in decorazioni da esibire.', 'La conoscenza vale quando modifica il modo in cui tagli un problema.'], c:['Se dopo aver studiato pensi nello stesso modo, hai solo archiviato carta.', 'Comincia da una distinzione chiara: il resto segue.'] },
    { r:/morte|morire|morto|fine|funerale|uccid|sparire/i, a:['La morte rende tutto piu netto, ma troppo tardi.', 'Parlare della fine costringe a togliere ornamenti.'], b:['Non rivela solo fragilita: rivela cosa credevi necessario, cosa era abitudine, cosa era possesso.', 'Il problema non e che tutto finisca, ma che molti vivano come se questo non dovesse mai riguardarli.'], c:['Da li nasce una certa disciplina, non per forza disperazione.', 'Non serve venerarla. Basta non mentire davanti alla sua ombra.'] },
    { r:/amici|amicizia|gruppo|compagn|solitudine|solo/i, a:['Un gruppo non elimina la solitudine.', 'L amicizia e meno pura di come viene raccontata.'], b:['La distribuisce, la organizza, a volte la rende sopportabile. Ma non la cancella.', 'Tiene insieme cura, utilita, abitudine e una quota di cecita volontaria.'], c:['Guarda cosa resta quando non c e piu vantaggio: li comincia la risposta.', 'Non chiedere se e vera; chiedi che cosa regge quando viene messa alla prova.'] },
    { r:/futuro|destino|caso|scelta|decidere|domani|vita/i, a:['Il futuro non e profondo solo perche e nascosto.', 'Il destino e spesso una parola troppo elegante.'], b:['Molte cose che chiami caso sono traiettorie viste da troppo vicino.', 'Decidere significa tagliare possibilita, non celebrarle tutte.'], c:['Non cercare garanzie: cerca un taglio che tu possa riconoscere come tuo.', 'La liberta comincia quando smetti di travestire l esitazione da prudenza.'] },
    { r:/politica|stato|governo|potere|legge|destra|sinistra|fasc|capital/i, a:['La politica non e il teatro delle opinioni.', 'Il potere va osservato nei suoi meccanismi, non nei suoi slogan.'], b:['Conta chi puo decidere il quadro entro cui gli altri discutono.', 'Le idee diventano serie quando trovano corpi, denaro, istituzioni e paura.'], c:['Diffida delle parole che non indicano mai un costo.', 'Chiedi sempre chi paga la coerenza degli altri.'] },
    { r:/corpo|fisico|dieta|peso|muscolo|pancia|mangiare|allen/i, a:['Il corpo non e un progetto morale.', 'Sul corpo mentono quasi tutti, soprattutto quando sembrano sinceri.'], b:['E materia, abitudine, disciplina, vanita e paura della forma. Separare questi elementi e gia un progresso.', 'Volerlo cambiare non e vergognoso; diventa ridicolo solo quando finge di essere pura salute.'], c:['Misura il gesto, non la fantasia.', 'La costanza e meno spettacolare del desiderio, ma lascia piu tracce.'] },
    { r:/arte|film|libro|musica|scrivere|stile|immagine|poesia/i, a:['L arte non serve a rendere le cose belle.', 'Uno stile non e una decorazione.'], b:['Serve a rendere percepibile una forma di esperienza che prima restava confusa.', 'E un metodo di selezione: decide cosa puo apparire e cosa deve restare fuori campo.'], c:['Quando funziona, non consola: cambia la temperatura della stanza.', 'La domanda giusta non e se piace, ma cosa costringe a vedere.'] }
  ];

  const reply = text => {
    const t = norm(text);
    const topic = topics.find(x => x.r.test(t));
    if (topic) return `${one(topic.a, t)} ${one(topic.b, t + 'b')} ${one(topic.c, t + 'c')}`;
    return `${one(genericOpen, t)} ${one(genericMid, t + 'b')} ${one(genericEnd, t + 'c')}`;
  };

  const add = (role, text) => {
    const node = document.createElement('div');
    node.className = `chrollo-message ${role === 'user' ? 'user' : 'bot'}`;
    node.textContent = text;
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = form.elements.message;
    const text = String(input.value || '').trim();
    if (!text) return;
    input.value = '';
    add('user', text);
    setTimeout(() => add('bot', reply(text)), 120 + Math.random() * 260);
  });
})();
