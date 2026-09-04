# Ottimo massimo

Il catalogo del sito nasce dalle cartelle contenute in `libri`.

## Aggiungere un libro

1. Crea una nuova cartella dentro `libri` usando un nome breve senza spazi né accenti.
2. Copia nella cartella il file `modello-scheda.md` e compilalo.
3. Aggiungi una sola copertina in formato PNG, JPG o JPEG.
4. Avvia il sito con `./serve.ps1`.

All'avvio il catalogo viene ricreato automaticamente. Le schede sono ordinate in base al numero scritto nella sezione `Ordine`.

La sezione `Citazione` deve contenere un solo passaggio tratto dal libro, senza virgolette e di non più di 25 parole. Il generatore interrompe l'aggiornamento se la citazione manca, contiene più passaggi o supera il limite.

La copertina può avere dimensioni diverse dalle altre. Il sito la inserisce in un riquadro con proporzioni uniformi e la mostra interamente, senza deformarla.

Se vuoi soltanto aggiornare il catalogo senza avviare il sito, esegui `./genera-catalogo.ps1`.
