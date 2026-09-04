# Ottimo massimo

Il catalogo del sito nasce dalle cartelle contenute in `libri`. Ogni cartella corrisponde a un libro e contiene una scheda Markdown e una sola copertina.

## Aggiungere un libro

1. Crea una cartella dentro `libri` con un nome breve, senza spazi né accenti, per esempio `il-barone-rampante`.
2. Copia `modello-scheda.md` nella nuova cartella e compilalo. Puoi rinominare il file, purché mantenga l'estensione `.md`.
3. Inserisci nella stessa cartella una sola copertina in formato PNG, JPG o JPEG.
4. Avvia il sito con `./serve.ps1` e aggiorna la pagina nel browser.

Il catalogo viene rigenerato automaticamente all'avvio. Le schede sono ordinate in base al numero inserito nella sezione `Ordine`.

La sezione `Citazione` deve contenere un solo passaggio tratto dal libro, senza virgolette e con un massimo di 25 parole. Se la scheda non rispetta queste regole, il generatore segnala il problema e interrompe l'aggiornamento.

Le copertine possono avere dimensioni diverse. Il sito le adatta al riquadro senza deformarle. Quando sostituisci un'immagine lasciandole lo stesso nome, il catalogo aggiunge un nuovo identificatore all'indirizzo del file, così il browser non mostra la versione precedente dalla memoria temporanea.

Per rigenerare il solo catalogo esegui `./genera-catalogo.ps1`.

## Pubblicare con GitHub Pages

Il progetto include il flusso `.github/workflows/pages.yml`, che prepara e pubblica il sito a ogni aggiornamento del ramo `main`.

1. Crea su GitHub un nuovo repository vuoto.
2. Collega questa cartella al repository e invia il ramo `main`.
3. Nelle impostazioni del repository apri `Pages` e scegli `GitHub Actions` come origine della pubblicazione.
4. Attendi il completamento del flusso `Pubblica su GitHub Pages` nella sezione `Actions`.

Dopo aver aggiunto o modificato un libro, controllalo in locale, crea un commit e invialo su GitHub. La nuova versione verrà pubblicata automaticamente.
