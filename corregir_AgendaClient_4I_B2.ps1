$ErrorActionPreference = "Stop"

$archivo = Join-Path (Get-Location) "src\app\(sistema)\agenda\AgendaClient.tsx"

if (-not (Test-Path -LiteralPath $archivo)) {
    throw "No se encontro: $archivo"
}

$contenido = Get-Content -LiteralPath $archivo -Raw -Encoding UTF8

$viejo = @'
                            } as CitaAgenda),
'@

$nuevo = @'
                            } as unknown as CitaAgenda),
'@

if ($contenido.Contains($nuevo.Trim())) {
    Write-Host "AgendaClient.tsx ya estaba corregido." -ForegroundColor Yellow
    exit 0
}

if (-not $contenido.Contains($viejo.Trim())) {
    throw "No se encontro el bloque esperado de la leyenda en AgendaClient.tsx."
}

$respaldo = "$archivo.bak-build-4I-B2"

if (-not (Test-Path -LiteralPath $respaldo)) {
    Copy-Item -LiteralPath $archivo -Destination $respaldo
}

$contenido = $contenido.Replace(
    $viejo.Trim(),
    $nuevo.Trim()
)

Set-Content -LiteralPath $archivo -Value $contenido -Encoding UTF8

Write-Host ""
Write-Host "AgendaClient.tsx corregido." -ForegroundColor Green
Write-Host "Respaldo: $respaldo" -ForegroundColor Cyan
