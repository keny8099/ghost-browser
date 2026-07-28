# Fix BOM en package.json
$content = Get-Content -Path "package.json" -Raw
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText("$PWD\package.json", $content, $utf8NoBom)
Write-Host "package.json arreglado (BOM removido)" -ForegroundColor Green
