(() => {
  const form = document.querySelector('[data-chrollo-form]');
  const log = document.querySelector('[data-chrollo-log]');
  const box = document.querySelector('.chrollo-box');
  if (!form || !log || !box) return;

  let portrait;
  (() => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:flex-end;justify-content:center;gap:36px;width:min(1040px,calc(100vw - var(--side,44px) - 28px))';
    box.parentNode.insertBefore(wrap, box);
    wrap.appendChild(box);
    portrait = document.createElement('img');
    const name = ['cadd18066d65865e8f75faaa72b9d8d7','removebg','preview.png'].join('-');
    portrait.src = '/assets/img/' + name;
    portrait.alt = '';
    portrait.style.cssText = 'width:280px;max-width:26vw;height:auto;filter:drop-shadow(7px 7px 0 rgba(0,0,0,.72));pointer-events:none;transition:transform .08s linear';
    wrap.appendChild(portrait);
    const fit = () => { if (innerWidth <= 760) { wrap.style.flexDirection = 'column-reverse'; portrait.style.width = '220px'; portrait.style.maxWidth = '58vw'; } else { wrap.style.flexDirection = 'row'; portrait.style.width = '280px'; portrait.style.maxWidth = '26vw'; } };
    addEventListener('resize', fit, { passive: true });
    fit();
  })();

  const talk = () => { [0,4,0,5,0,3,0].forEach((y,i)=>setTimeout(()=>{ if (portrait) portrait.style.transform = `translateY(${y}px)`; }, i*85)); };

  const norm = s => String(s || '').toLowerCase();
  const hash = s => Math.abs([...s].reduce((n, c) => ((n << 5) - n + c.charCodeAt(0)) | 0, 31));
  const one = (arr, seed) => arr[hash(seed) % arr.length];

  const extras = Array.isArray(window.RF_EXTRA_LINES) ? window.RF_EXTRA_LINES : [];
  const random = ['THE POWER TO OVERCOME!', 'gasa', 'hard', 'duro', 'ci sta', 'cartesio cosa risponderebbe...', 'non saprei che dirti', 'per ora io voto partito comunista zingaro', 'risposta breve no', 'ok ma non basta', 'questa e una cosa da corridoio universitario', 'frase troppo pulita sospetta', 'molto male ma interessante', 'si pero piano', 'qua serve un bicchiere d acqua e marx sotto il tavolo', ...extras];
  const parens = ['(novecento proprio: soggetto rotto e tutti che fanno finta)', '(Heidegger qui avrebbe dissentito)', '(Adorno avrebbe parlato di forma amministrata)', '(Wittgenstein qui avrebbe chiesto come usi la parola)', '(Deleuze avrebbe visto una linea di fuga)', '(Freud non la chiamerebbe coincidenza)', '(Benjamin avrebbe cercato il frammento storico)', '(fenomenologia ma fatta male sul divano)', '(Cartesio qui sospenderebbe il giudizio)', '(Nietzsche forse direbbe di non chiedere permesso)'];

  const generic = [
    ['boh il punto forse non e quello', 'stai chiedendo una cosa ma ne vuoi un altra', 'la domanda sembra semplice solo perche e vestita male', 'non saprei che dirti ma la direzione c e'],
    ['qui conta il gesto piu della teoria', 'se togli la posa resta una paura piccola', 'il desiderio fa sempre finta di essere ragione', 'sta cosa ha odore di scelta rinviata'],
    ['ci sta ma non chiamarla verita', 'duro pero utile', 'gasa in modo sbagliato', 'io la lascerei marcire ancora un po']
  ];

  const topics = [
    { r:/amore|ama|innamor|relazione|fidanz|gelosia|tradimento|desiderio/i, p:['amore'], a:['amore hard ma spesso e solo amministrazione della mancanza', 'sull amore cartesio cosa risponderebbe... forse dubiterei anche del buongiorno', 'ci sta amare pero poi devi vedere cosa ti mangia'], b:['non e una verita pura e tipo una torcia puntata male illumina una cosa e ne brucia tre', 'se diventa gelosia non e profondita e proprieta col profumo addosso', 'desiderio vuol dire che qualcosa ti comanda sorridendo'], c:['gasa solo se non ti inginocchia', 'duro dirlo ma meglio saperlo prima', 'non saprei che dirti ma non chiamarlo destino'] },
    { r:/paura|ansia|panico|spavento|temo|terrore|preoccup/i, p:['paura'], a:['la paura non e scema e solo vestita da mostro', 'ansia hard proprio ma almeno indica un punto', 'panico gasa zero pero informa'], b:['sta proteggendo reputazione corpo futuro o qualche immagine miserabile di te', 'la paura esagera ma non inventa sempre il contenuto', 'se la nomini perde un po di teatro'], c:['THE POWER TO OVERCOME!', 'duro ma fattibile', 'respira e non fare il martire'] },
    { r:/soldi|denaro|povero|ricco|lavoro|stipendio|comprare|costo|pagare/i, p:['soldi'], a:['soldi duro argomento senza poesia', 'il lavoro e quella cosa dove la metafisica timbra il cartellino', 'per ora io voto partito comunista zingaro'], b:['il denaro traduce tempo paura desideri e umiliazioni in cifre piccole', 'non dice quanto vali ma quanto margine hai per sbagliare', 'se non puoi rifiutare allora non stai scegliendo stai gestendo'], c:['ci sta volerli ma almeno non farne religione', 'hard ma vero', 'cartesio cosa risponderebbe... penso fattura elettronica'] },
    { r:/scuola|studio|universit|esame|tesi|leggere|prof|lezione/i, p:['studio'], a:['studiare non e collezionare frasi belle', 'tesi duro ma anche gasa se non la fai diventare arredamento', 'universita cioe parcheggio spirituale con bibliografia'], b:['se dopo aver letto pensi uguale hai solo spostato pdf da una cartella all altra', 'il sapere serve se taglia meglio i problemi non se fa rumore in bocca', 'un esame spesso misura obbedienza con qualche citazione sopra'], c:['ci sta ma scrivi', 'non saprei che dirti apri il file', 'cartesio cosa risponderebbe... metodo e panico'] },
    { r:/morte|morire|morto|fine|funerale|uccid|sparire/i, p:['fine'], a:['la morte toglie i fronzoli purtroppo anche male', 'argomento duro non facciamo teatro', 'la fine e una maestra senza tatto'], b:['fa vedere cosa chiamavi necessario e cosa era solo abitudine con cappotto elegante', 'il punto non e che tutto finisce ma che vivi come se fosse una nota a pie pagina', 'davanti alla fine le frasi educate diventano cartone bagnato'], c:['non e nichilismo e manutenzione del vuoto', 'ci sta avere paura', 'THE POWER TO OVERCOME! ma sottovoce'] },
    { r:/amici|amicizia|gruppo|compagn|solitudine|solo/i, p:['amici'], a:['amicizia bella pero non santificarla', 'un gruppo non cancella la solitudine la mette in comune tipo bolletta', 'essere soli hard ma almeno preciso'], b:['guarda cosa resta quando non c e vantaggio li si vede qualcosa', 'molta compagnia e solo panico organizzato bene', 'la lealta senza prova e arredamento verbale'], c:['ci sta volergli bene ma verifica', 'non saprei che dirti dipende chi paga il prezzo', 'gasa se regge al brutto'] },
    { r:/futuro|destino|caso|scelta|decidere|domani|vita/i, p:['futuro'], a:['il futuro non e profondo solo perche non si vede', 'destino parola elegante per non firmare certe conseguenze', 'decidere e tagliare non fare buffet delle possibilita'], b:['molte cose che chiami caso sono traiettorie viste troppo da vicino', 'se aspetti garanzie stai gia scegliendo di non scegliere', 'la prudenza ogni tanto e solo vigliaccheria con giacca buona'], c:['duro ma libera', 'THE POWER TO OVERCOME!', 'cartesio cosa risponderebbe... intanto dubita poi compila'] },
    { r:/politica|stato|governo|potere|legge|destra|sinistra|fasc|capital/i, p:['politica'], a:['politica hard perche tutti parlano e pochi pagano', 'il potere non urla sempre a volte fa modulistica', 'per ora io voto partito comunista zingaro'], b:['conta chi decide il quadro entro cui gli altri litigano', 'le idee diventano vere quando trovano corpi soldi istituzioni paura', 'la morale senza costo e solo merchandising'], c:['ci sta ma segui i soldi', 'duro e abbastanza ovvio', 'non saprei che dirti ma diffida degli slogan belli'] },
    { r:/corpo|fisico|dieta|peso|muscolo|pancia|mangiare|allen/i, p:['corpo'], a:['il corpo non e un progetto morale pero insiste', 'dieta hard argomento da monaco nervoso', 'muscolo gasa ma non salva'], b:['e materia abitudine disciplina vanita e paura della forma tutto insieme nel frullatore', 'voler cambiare corpo ci sta farne una religione no', 'la costanza e brutta da vedere ma lascia tracce'], c:['duro ma semplice ripeti il gesto', 'THE POWER TO OVERCOME!', 'non saprei che dirti pesa meno la fantasia'] },
    { r:/arte|film|libro|musica|scrivere|stile|immagine|poesia/i, p:['arte'], a:['arte non vuol dire bello vuol dire taglio', 'stile e quando una ferita impara la grammatica', 'scrivere gasa ma solo se non fai il museo di te stesso'], b:['una forma riuscita cambia cosa riesci a vedere non solo cosa ti piace', 'il brutto fatto bene spesso dice piu del bello educato', 'ogni immagine sceglie cosa lasciare fuori'], c:['ci sta ma togli ornamenti', 'hard ma vero', 'cartesio cosa risponderebbe... penso una brutta recensione'] }
  ];

  const damage = (s, seed) => {
    let out = s.replace(/[.]/g,'').replace(/è|é/g,'e').replace(/ò/g,'o').replace(/à/g,'a').replace(/ù/g,'u').replace(/ì/g,'i');
    if (hash(seed) % 3 === 0) out += ' ' + one(parens, seed + 'p');
    if (hash(seed) % 4 === 0) out = out.replace(/,/g, '');
    return out;
  };

  const reply = text => {
    const t = norm(text);
    if (extras.length && hash(t + Date.now()) % 3 === 0) return one(extras, t + Date.now());
    if (hash(t + Date.now()) % 7 === 0) return one(random, t + 'r');
    const topic = topics.find(x => x.r.test(t));
    if (topic) return damage(`${one(topic.a,t)} ${one(topic.b,t+'b')} ${one(topic.c,t+'c')}`, t + Date.now());
    if (hash(t) % 5 === 0) return one(random, t + 'rr');
    return damage(`${one(generic[0],t)} ${one(generic[1],t+'b')} ${one(generic[2],t+'c')}`, t + Date.now());
  };

  const add = (role, text) => { const node = document.createElement('div'); node.className = `chrollo-message ${role === 'user' ? 'user' : 'bot'}`; node.textContent = text; log.appendChild(node); log.scrollTop = log.scrollHeight; };

  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = form.elements.message;
    const text = String(input.value || '').trim();
    if (!text) return;
    input.value = '';
    add('user', text);
    setTimeout(() => { talk(); add('bot', reply(text)); }, 120 + Math.random() * 260);
  });
})();
