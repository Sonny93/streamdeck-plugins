# `streamdeck restart` is acknowledged by Stream Deck 7.5 but does not respawn the plugin process.
# Killing the process makes Stream Deck start it again with the fresh build.
$pluginProcesses = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
	Where-Object CommandLine -match 'com\.sonny93\.display\.sdPlugin'
$pluginProcesses | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Write-Output "Restarted com.sonny93.display ($(@($pluginProcesses).Count) process stopped)"
