(() => {
  const form = document.querySelector('[data-chrollo-form]');
  const log = document.querySelector('[data-chrollo-log]');
  if (!form || !log) return;

  const norm = s => String(s || '').toLowerCase();
  const hash = s => Math.abs([...s].reduce((n, c) => ((n << 5) - n + c.charCodeAt(0)) | 0, 31));
  const one = (arr, seed) => arr[hash(seed) % arr.length];

  const parens = [
    '(questa cosa nel novecento la chiamavano crisi del soggetto ma vabe)',
    '(tipo fenomenologia ma senza fare il professore)',
    '(qui heidegger avrebbe fatto casino pero il punto resta)',
    '(deleuze ci avrebbe visto una macchina desiderante, forse troppo comodo)',
    '(adorno direbbe che pure il gusto e gia amministrato)',
    '(wittgenstein qui starebbe zitto e avrebbe quasi ragione)',
    '(il novecento e tutto qui: forma rotta e bisogno di ordine)',
    '(non e nichilismo, e manutenzione del vuoto)',
    '(benjamin avrebbe cercato le rovine, non la morale)',
    '(freud entra sempre quando qualcuno dice io so cosa voglio)'
  ];

  const genericOpen = ['la domanda e imprecisa ma una direzione ce l ha', 'il centro non e dove lo hai messo', 'prima separerei il fatto dal desiderio', 'la risposta semplice sarebbe povera', 'la premessa conta piu della conclusione'];
  const genericMid = ['ogni scelta mostra cosa sei disposto a perdere', 'il valore appare quando una cosa smette di essere garantita', 'il controllo migliore sembra naturale', 'la memoria taglia prima ancora di raccontare', 'il vuoto non e assenza e spazio non ancora disciplinato'];
  const genericEnd = ['da qui si puo pensare meglio', 'non e consolazione e diagnosi', 'il resto e decorazione', 'tienilo fermo e guarda cosa cambia', 'forse cercavi permesso non risposta'];

  const topics = [
    { r:/amore|ama|innamor|relazione|fidanz|gelosia|tradimento|desiderio/i, a:['sull amore non mi fiderei delle parole dolci', 'l amore diventa serio quando smette di dichiararsi innocente'], b:['non rivela una verita pura ma una gerarchia cosa scegli cosa sacrifichi cosa fai finta di non vedere', 'e attenzione selettiva illumina un punto e lascia il resto nell ombra'], c:['quindi chiediti cosa perdi senza chiamarlo martirio', 'il sentimento conta meno della forma che prende contro un limite'] },
    { r:/paura|ansia|panico|spavento|temo|terrore|preoccup/i, a:['la paura raramente e stupida', 'l ansia non e un oracolo ma nemmeno rumore puro'], b:['sta proteggendo qualcosa reputazione corpo futuro immagine di te il punto e capire cosa sorveglia', 'esagera le forme ma non inventa sempre il contenuto ti mostra dove sei esposto'], c:['nomina l oggetto e perde prestigio', 'non devi obbedirle devi interrogarla senza inginocchiarti'] },
    { r:/soldi|denaro|povero|ricco|lavoro|stipendio|comprare|costo|pagare/i, a:['il denaro ha il pregio della brutalita', 'sul lavoro conviene essere meno romantici'], b:['traduce desideri tempo e dipendenze in cifre non dice tutto ma svela parecchie menzogne', 'non misura il valore di una persona misura pero quanto spazio le viene concesso per sbagliare'], c:['la domanda vera e quale liberta vendi e a quale prezzo', 'non moralizzarlo troppo guarda chi puo farne a meno e chi no'] },
    { r:/scuola|studio|universit|esame|tesi|leggere|prof|lezione/i, a:['studiare non significa accumulare frasi', 'un esame e spesso una piccola macchina di obbedienza'], b:['il punto e trasformare cio che leggi in strumenti non in decorazioni', 'la conoscenza vale quando cambia il modo in cui tagli un problema'], c:['se dopo aver studiato pensi uguale hai solo archiviato carta', 'comincia da una distinzione chiara poi il resto segue'] },
    { r:/morte|morire|morto|fine|funerale|uccid|sparire/i, a:['la morte rende tutto piu netto ma troppo tardi', 'parlare della fine obbliga a togliere ornamenti'], b:['rivela cosa credevi necessario cosa era abitudine cosa era possesso', 'il problema non e che tutto finisca ma che molti vivono come se non li riguardasse'], c:['da li nasce disciplina non per forza disperazione', 'non serve venerarla basta non mentire davanti alla sua ombra'] },
    { r:/amici|amicizia|gruppo|compagn|solitudine|solo/i, a:['un gruppo non elimina la solitudine', 'l amicizia e meno pura di come viene raccontata'], b:['la distribuisce la organizza a volte la rende sopportabile pero non la cancella', 'tiene insieme cura utilita abitudine e una quota di cecita volontaria'], c:['guarda cosa resta quando non c e piu vantaggio', 'non chiedere se e vera chiedi cosa regge alla prova'] },
    { r:/futuro|destino|caso|scelta|decidere|domani|vita/i, a:['il futuro non e profondo solo perche e nascosto', 'il destino e spesso una parola troppo elegante'], b:['molte cose che chiami caso sono traiettorie viste troppo da vicino', 'decidere significa tagliare possibilita non celebrarle tutte'], c:['non cercare garanzie cerca un taglio che riconosci tuo', 'la liberta comincia quando smetti di travestire l esitazione da prudenza'] },
    { r:/politica|stato|governo|potere|legge|destra|sinistra|fasc|capital/i, a:['la politica non e il teatro delle opinioni', 'il potere va visto nei meccanismi non negli slogan'], b:['conta chi decide il quadro entro cui gli altri discutono', 'le idee diventano serie quando trovano corpi denaro istituzioni e paura'], c:['diffida delle parole che non indicano mai un costo', 'chiedi sempre chi paga la coerenza degli altri'] },
    { r:/corpo|fisico|dieta|peso|muscolo|pancia|mangiare|allen/i, a:['il corpo non e un progetto morale', 'sul corpo mentono quasi tutti specialmente quando sembrano sinceri'], b:['e materia abitudine disciplina vanita e paura della forma separarle e gia qualcosa', 'volerlo cambiare non e vergognoso diventa ridicolo quando finge di essere pura salute'], c:['misura il gesto non la fantasia', 'la costanza e meno teatrale del desiderio ma lascia piu tracce'] },
    { r:/arte|film|libro|musica|scrivere|stile|immagine|poesia/i, a:['l arte non serve a rendere le cose belle', 'uno stile non e una decorazione'], b:['serve a rendere percepibile una forma di esperienza che prima restava confusa', 'e un metodo di selezione decide cosa appare e cosa resta fuori campo'], c:['quando funziona non consola cambia la temperatura della stanza', 'la domanda giusta non e se piace ma cosa costringe a vedere'] }
  ];

  const breakIt = (s, seed) => {
    let out = s.replace(/[.]/g, '').replace(/è/g, 'e').replace(/é/g, 'e').replace(/ò/g, 'o').replace(/à/g, 'a').replace(/ù/g, 'u').replace(/ì/g, 'i');
    if (hash(seed) % 2 === 0) out += ' ' + one(parens, seed + 'p');
    if (hash(seed) % 5 === 0) out = out.replace(/perché/g, 'perche').replace(/cio/g, 'cioe');
    if (hash(seed) % 7 === 0) out = out.replace(/,/g, '');
    return out;
  };

  const reply = text => {
    const t = norm(text);
    const topic = topics.find(x => x.r.test(t));
    const raw = topic ? `${one(topic.a, t)} ${one(topic.b, t + 'b')} ${one(topic.c, t + 'c')}` : `${one(genericOpen, t)} ${one(genericMid, t + 'b')} ${one(genericEnd, t + 'c')}`;
    return breakIt(raw, t + Date.now());
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
