set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-Command"]

# Kill the plugin process so Stream Deck respawns it with the fresh build
restart:
	powershell -NoProfile -ExecutionPolicy Bypass -File scripts/restart_plugin.ps1
