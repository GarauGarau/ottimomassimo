$ErrorActionPreference = 'Stop'

$projectDirectory = [IO.Path]::GetFullPath($PSScriptRoot)
$distDirectory = [IO.Path]::GetFullPath((Join-Path $projectDirectory 'dist'))

if (-not $distDirectory.StartsWith($projectDirectory + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'La cartella di destinazione non è valida.'
}

& (Join-Path $projectDirectory 'genera-catalogo.ps1')

if ([IO.Directory]::Exists($distDirectory)) {
    [IO.Directory]::Delete($distDirectory, $true)
}

[IO.Directory]::CreateDirectory($distDirectory) | Out-Null
[IO.Directory]::CreateDirectory((Join-Path $distDirectory 'server')) | Out-Null
[IO.Directory]::CreateDirectory((Join-Path $distDirectory 'assets')) | Out-Null
[IO.Directory]::CreateDirectory((Join-Path $distDirectory '.openai')) | Out-Null

foreach ($file in @('index.html', 'styles.css', 'script.js')) {
    Copy-Item -LiteralPath (Join-Path $projectDirectory $file) -Destination (Join-Path $distDirectory $file)
}

foreach ($asset in @('logo.png', 'og.png', 'ottimo-1.jpg', 'ottimo-2.jpg', 'ottimo-3.jpg')) {
    Copy-Item -LiteralPath (Join-Path $projectDirectory "assets\$asset") -Destination (Join-Path $distDirectory "assets\$asset")
}
Copy-Item -LiteralPath (Join-Path $projectDirectory 'libri') -Destination $distDirectory -Recurse
Copy-Item -LiteralPath (Join-Path $projectDirectory 'site-worker.js') -Destination (Join-Path $distDirectory 'server\index.js')
Copy-Item -LiteralPath (Join-Path $projectDirectory '.openai\hosting.json') -Destination (Join-Path $distDirectory '.openai\hosting.json')
[IO.File]::WriteAllText((Join-Path $distDirectory '.nojekyll'), '')

Write-Host 'Sito preparato nella cartella dist.'
