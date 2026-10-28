# Test : le 48V est-il vraiment piloté par la commande HID 0x10 ?
# Allume MONITOR, puis coupe / rallume le 48V en annonçant chaque étape.
$ErrorActionPreference = 'Stop'

$path = $null
foreach ($dev in Get-ChildItem 'HKLM:\SYSTEM\CurrentControlSet\Enum\HID' | Where-Object PSChildName -like 'VID_2B5A&PID_0020*') {
    foreach ($inst in Get-ChildItem $dev.PSPath) {
        $path = "\\?\HID#$($dev.PSChildName)#$($inst.PSChildName)#{4d1e55b2-f16f-11cf-88cb-001111000030}"
    }
}
if (-not $path) { throw 'Volt 1 introuvable.' }

Add-Type -TypeDefinition @'
using System; using System.IO; using System.Runtime.InteropServices; using Microsoft.Win32.SafeHandles;
public static class Volt48 {
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern SafeFileHandle CreateFile(string n, uint a, uint s, IntPtr sa, uint d, uint f, IntPtr t);
    public static void Send(string path, byte settings) {
        using (var fs = new FileStream(CreateFile(path, 0xC0000000, 3, IntPtr.Zero, 3, 0, IntPtr.Zero), FileAccess.ReadWrite, 40, false)) {
            var r = new byte[17]; r[0] = 0x10; r[1] = settings; fs.Write(r, 0, r.Length); fs.Flush();
        }
    }
}
'@

function Step([string]$text, [byte]$settings, [int]$seconds) {
    Write-Host ('{0:HH:mm:ss}  {1}' -f (Get-Date), $text) -ForegroundColor Yellow
    [Volt48]::Send($path, $settings)
    Start-Sleep $seconds
}

Write-Host 'Mets le casque. Départ dans 3 secondes...'
Start-Sleep 3
Step 'MONITOR allumé, 48V éteint'          0x04 4
Step '>>> 48V ALLUMÉ  (écoute le bruit)'     0x06 4
Step '>>> 48V ÉTEINT  (écoute le bruit)'     0x04 4
Step '>>> 48V ALLUMÉ  (écoute le bruit)'     0x06 4
Step '>>> 48V ÉTEINT  (écoute le bruit)'     0x04 3
Step 'MONITOR éteint, fin du test'          0x00 0
Write-Host 'Maintenant appuie toi-même 2 fois sur le bouton 48V pour comparer le bruit.'
