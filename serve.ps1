# Avvia il sito e aggiorna prima il catalogo a partire dalle schede Markdown.

$ErrorActionPreference = 'Continue'
$dir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765
$bind = '0.0.0.0'

Set-Location $dir
& (Join-Path $dir 'genera-catalogo.ps1')
Write-Host "[serve] Partenza server su http://$bind`:$port/  (ctrl+c per fermare)"

while ($true) {
    Write-Host "[serve] Avvio python http.server...  $(Get-Date -Format 'HH:mm:ss')"
    python -m http.server $port --bind $bind
    $code = $LASTEXITCODE
    Write-Host "[serve] Server terminato (exit $code). Riprovo tra 2 secondi."
    Start-Sleep -Seconds 2
}
