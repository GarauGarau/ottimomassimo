$ErrorActionPreference = 'Stop'

$booksDirectory = Join-Path $PSScriptRoot 'libri'
$outputFile = Join-Path $booksDirectory 'catalogo.js'
$requiredSections = @('Ordine', 'Titolo', 'Autore', 'Anno', 'Voto', 'Citazione', 'Temi')
$allowedCoverExtensions = @('.jpg', '.jpeg', '.png')

function Read-BookSheet {
    param(
        [Parameter(Mandatory)]
        [System.IO.DirectoryInfo]$BookDirectory
    )

    $markdownFiles = @(Get-ChildItem -LiteralPath $BookDirectory.FullName -File -Filter '*.md')
    if ($markdownFiles.Count -ne 1) {
        throw "La cartella '$($BookDirectory.Name)' deve contenere un solo file Markdown."
    }

    $coverFiles = @(
        Get-ChildItem -LiteralPath $BookDirectory.FullName -File |
            Where-Object { $allowedCoverExtensions -contains $_.Extension.ToLowerInvariant() }
    )
    if ($coverFiles.Count -ne 1) {
        throw "La cartella '$($BookDirectory.Name)' deve contenere una sola copertina PNG o JPEG."
    }

    $sections = [ordered]@{}
    $currentSection = $null

    foreach ($line in Get-Content -LiteralPath $markdownFiles[0].FullName -Encoding UTF8) {
        if ($line -match '^#{1,2}\s+(.+?)\s*$') {
            $currentSection = $Matches[1].Trim()
            if ($sections.Contains($currentSection)) {
                throw "Nella scheda '$($markdownFiles[0].Name)' la sezione '$currentSection' compare più di una volta."
            }
            $sections[$currentSection] = [System.Collections.Generic.List[string]]::new()
            continue
        }

        if ($null -ne $currentSection) {
            $sections[$currentSection].Add($line)
        }
    }

    foreach ($section in $requiredSections) {
        if (-not $sections.Contains($section)) {
            throw "Nella scheda '$($markdownFiles[0].Name)' manca la sezione '$section'."
        }
    }

    function Get-SectionText([string]$Name) {
        return (($sections[$Name] -join "`n").Trim())
    }

    foreach ($section in @('Titolo', 'Autore', 'Citazione')) {
        if ([string]::IsNullOrWhiteSpace((Get-SectionText $section))) {
            throw "La sezione '$section' nella cartella '$($BookDirectory.Name)' non può essere vuota."
        }
    }

    $quote = Get-SectionText 'Citazione'
    $quoteParagraphs = @(
        $quote -split '(?:\r?\n){2,}' |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
    if ($quoteParagraphs.Count -ne 1) {
        throw "La sezione 'Citazione' nella cartella '$($BookDirectory.Name)' deve contenere un solo passaggio."
    }

    $quoteWordCount = @($quote -split '\s+' | Where-Object { $_ }).Count
    if ($quoteWordCount -gt 25) {
        throw "La citazione nella cartella '$($BookDirectory.Name)' non può superare 25 parole."
    }

    $themes = @(
        $sections['Temi'] |
            ForEach-Object { $_.Trim() } |
            Where-Object { $_ -match '^[-*]\s+\S' } |
            ForEach-Object { $_ -replace '^[-*]\s+', '' }
    )

    if ($themes.Count -eq 0) {
        throw "Nella scheda '$($markdownFiles[0].Name)' inserisci almeno un tema come voce di elenco."
    }

    $order = 0
    $year = 0
    $rating = 0
    if (-not [int]::TryParse((Get-SectionText 'Ordine'), [ref]$order)) {
        throw "Il valore di 'Ordine' nella cartella '$($BookDirectory.Name)' deve essere un numero intero."
    }
    if (-not [int]::TryParse((Get-SectionText 'Anno'), [ref]$year)) {
        throw "Il valore di 'Anno' nella cartella '$($BookDirectory.Name)' deve essere un numero intero."
    }
    if (-not [int]::TryParse((Get-SectionText 'Voto'), [ref]$rating) -or $rating -lt 1 -or $rating -gt 5) {
        throw "Il valore di 'Voto' nella cartella '$($BookDirectory.Name)' deve essere compreso tra 1 e 5."
    }

    $coverHash = (Get-FileHash -LiteralPath $coverFiles[0].FullName -Algorithm SHA256).Hash.Substring(0, 12).ToLowerInvariant()
    $webCoverPath = "libri/$($BookDirectory.Name)/$($coverFiles[0].Name)?v=$coverHash"

    return [PSCustomObject]@{
        order = $order
        id = $BookDirectory.Name
        title = Get-SectionText 'Titolo'
        author = Get-SectionText 'Autore'
        year = $year
        stars = $rating
        quote = ($quote -replace '\s+', ' ')
        themes = $themes
        cover = $webCoverPath
    }
}

$books = @(
    Get-ChildItem -LiteralPath $booksDirectory -Directory |
        Sort-Object Name |
        ForEach-Object { Read-BookSheet -BookDirectory $_ } |
        Sort-Object order
)

if ($books.Count -eq 0) {
    throw 'Non è stata trovata alcuna scheda libro.'
}

$duplicateOrders = @($books | Group-Object order | Where-Object Count -gt 1)
if ($duplicateOrders.Count -gt 0) {
    $values = ($duplicateOrders.Name -join ', ')
    throw "Ogni libro deve avere un ordine diverso. Valori ripetuti $values."
}

$json = $books | ConvertTo-Json -Depth 5
$javascript = "window.BOOKS = $json;`n"
Set-Content -LiteralPath $outputFile -Value $javascript -Encoding UTF8

Write-Host "Catalogo aggiornato con $($books.Count) libri."
