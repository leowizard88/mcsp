# Archivio privato membri PCZ

Questa cartella è destinata ai dati completi dei tesseramenti PCZ.

Ogni nuovo tesseramento può generare un file JSON in questa cartella con:

- nome
- cognome
- email
- note personali
- consenso
- numero tessera
- data tessera
- data tecnica di registrazione

Questi dati sono personali. La repository deve restare privata.

## Attivazione salvataggio automatico

Il codice della funzione `/api/tessera` può scrivere automaticamente qui dentro solo se in Cloudflare Pages viene aggiunto un secret:

```text
GITHUB_MEMBERS_TOKEN
```

Il token deve avere permesso di scrittura sulla repository `leowizard88/mcsp`.

Se il secret manca, il tesseramento funziona comunque: email e lista pubblica continuano a funzionare, ma il file JSON non viene scritto in GitHub.
