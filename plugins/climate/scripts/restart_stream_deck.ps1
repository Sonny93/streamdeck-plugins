# Killing only the plugin process does not reload manifest changes (new actions, layouts, states).
# Restarting the whole Stream Deck app reloads the manifest and starts the plugin with the fresh build.
$defaultExecutable = Join-Path $env:ProgramFiles 'Elgato\StreamDeck\StreamDeck.exe'
$exitTimeoutSeconds = 10

$streamDeckProcesses = @(Get-Process -Name 'StreamDeck' -ErrorAction SilentlyContinue)
$runningExecutable = $streamDeckProcesses | Select-Object -ExpandProperty Path -First 1
$executable = if ($runningExecutable) { $runningExecutable } else { $defaultExecutable }

if (-not (Test-Path $executable)) {
	throw "Stream Deck executable not found at $executable"
}

$streamDeckProcesses | Stop-Process -Force
$streamDeckProcesses | Wait-Process -Timeout $exitTimeoutSeconds -ErrorAction Stop

Start-Process -FilePath $executable
Write-Output "Restarted Stream Deck ($($streamDeckProcesses.Count) process stopped)"
