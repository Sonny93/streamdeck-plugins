# Test à l'oreille : allume MONITOR, puis bascule VINTAGE lentement en annonçant chaque étape.
$volt = Join-Path $PSScriptRoot 'VoltMonitor.ps1'

function Step([string]$text, [string]$button, [string]$state, [int]$seconds) {
    $result = $null
    for ($i = 0; $i -lt 3 -and -not $result; $i++) {
        try { $result = & $volt -Button $button -State $state }
        catch { Write-Host "  ($($_.Exception.Message))" -ForegroundColor DarkGray }
    }
    if (-not $result) { Write-Host "  ÉCHEC : $button $state" -ForegroundColor Red }
    Write-Host ('{0:HH:mm:ss}  {1}   [{2}]' -f (Get-Date), $text, $result) -ForegroundColor Yellow
    Start-Sleep $seconds
}

Write-Host 'Mets le casque et parle en continu (compte, lis un texte...). Départ dans 3 secondes.'
Start-Sleep 3
Step 'MONITOR allumé — tu dois t''entendre'  Monitor On  5
Step '>>> VINTAGE ALLUMÉ'                     Vintage On  6
Step '>>> VINTAGE ÉTEINT'                     Vintage Off 6
Step '>>> VINTAGE ALLUMÉ'                     Vintage On  6
Step '>>> VINTAGE ÉTEINT'                     Vintage Off 3
Step 'MONITOR éteint — fin du test'           Monitor Off 0
