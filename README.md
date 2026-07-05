# MANCUSPIE · Netlify + Decap CMS

Questa è la cartella pulita. Niente sottocartelle-trappola.

## Cosa devi caricare su GitHub

Apri questa cartella e carica **tutti questi file e cartelle nella root del repository**:

- `package.json`
- `netlify.toml`
- `.eleventy.js`
- `src/`
- `.gitignore`
- `README.md`

Quando apri il repository GitHub, `package.json` deve essere visibile subito. Se è dentro una sottocartella, hai caricato il livello sbagliato.

## Impostazioni Netlify

Build command:

```bash
npm run build
```

Publish directory:

```bash
_site
```

Base directory: lascia vuoto.

## Pannello admin

Dopo il primo deploy riuscito:

1. Netlify → sito → Project configuration → Identity → Enable Identity.
2. Identity → Registration → Invite only.
3. Identity → Services → Git Gateway → Enable Git Gateway.
4. Identity → Users → Invite users → inserisci la tua email.
5. Apri `https://nome-sito.netlify.app/admin`.

## Struttura

- `src/index.njk`: homepage a sezioni intere.
- `src/assets/css/style.css`: stile.
- `src/assets/img`: immagini usate come sfondi.
- `src/admin/config.yml`: configurazione Decap CMS.
- `src/content/testi`: testi modificabili.
- `src/content/note`: note modificabili.
- `src/content/call`: call modificabili.
- `src/content/progetti`: progetti modificabili.
