<#
.SYNOPSIS
    Pilote les boutons MONITOR, VINTAGE et 48V de l'UA Volt 1 depuis le PC.

.DESCRIPTION
    Agit sur les vrais réglages de la carte, comme un appui sur le bouton (retour direct sans latence).
    Protocole déduit par observation de l'interface HID constructeur (VID 2B5A / PID 0020, interface 06) :
      - rapport d'entrée 0x02, octet 1 = état annoncé : 0x08 = 48V, 0x10 = MONITOR, 0x40 = VINTAGE
      - rapport de sortie 0x10, octet 1 = réglages à appliquer : 0x02 = 48V, 0x04 = MONITOR, 0x40 = VINTAGE
    Le rapport 0x10 n'applique qu'un changement à la fois : on recopie l'état actuel et on ne bascule qu'un bit.
    Ne pas utiliser le rapport 0x20 : il change l'état annoncé sans changer le son.

.EXAMPLE
    .\VoltMonitor.ps1                          # bascule MONITOR
    .\VoltMonitor.ps1 -Button Vintage          # bascule VINTAGE
    .\VoltMonitor.ps1 -Button Phantom -State Off
    .\VoltMonitor.ps1 -State Status            # affiche les trois
#>
param(
    [ValidateSet('Monitor', 'Vintage', 'Phantom')]
    [string]$Button = 'Monitor',
    [ValidateSet('Toggle', 'On', 'Off', 'Status')]
    [string]$State = 'Toggle',
    # Petit bip à chaque bascule (aigu = on, grave = off)
    [switch]$Beep
)

$ErrorActionPreference = 'Stop'

# Bit dans le rapport d'état 0x02, bit dans le rapport de réglages 0x10
$buttons = [ordered]@{
    Monitor = @{ Label = 'MONITOR'; State = 0x10; Cfg = 0x04 }
    Vintage = @{ Label = 'VINTAGE'; State = 0x40; Cfg = 0x40 }
    Phantom = @{ Label = '48V';     State = 0x08; Cfg = 0x02 }
}

if (-not ('VoltHw.VoltIo' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Threading.Tasks;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;

namespace VoltHw {
    public static class VoltIo {
        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        static extern SafeFileHandle CreateFile(string name, uint access, uint share, IntPtr sa, uint disp, uint flags, IntPtr tmpl);

        public static FileStream Open(string path) {
            var h = CreateFile(path, 0xC0000000, 3, IntPtr.Zero, 3, 0, IntPtr.Zero);
            if (h.IsInvalid) return null;
            return new FileStream(h, FileAccess.ReadWrite, 40, false);
        }

        // Attend le prochain rapport d'état (0x02) et renvoie son octet d'état, ou -1 si rien n'arrive
        public static int ReadState(FileStream fs, int timeoutMs) {
            var deadline = DateTime.Now.AddMilliseconds(timeoutMs);
            var buf = new byte[40];
            while (DateTime.Now < deadline) {
                Task<int> t = fs.ReadAsync(buf, 0, buf.Length);
                if (!t.Wait(deadline - DateTime.Now)) return -1;
                if (t.Result > 1 && buf[0] == 0x02) return buf[1];
            }
            return -1;
        }

        public static void WriteSettings(FileStream fs, byte settings) {
            var report = new byte[17];
            report[0] = 0x10;
            report[1] = settings;
            fs.Write(report, 0, report.Length);
            fs.Flush();
        }
    }
}
'@
}

# Interface HID constructeur de la Volt 1
$volt = $null
foreach ($dev in Get-ChildItem 'HKLM:\SYSTEM\CurrentControlSet\Enum\HID' | Where-Object PSChildName -like 'VID_2B5A&PID_0020*') {
    foreach ($inst in Get-ChildItem $dev.PSPath) {
        $path = "\\?\HID#$($dev.PSChildName)#$($inst.PSChildName)#{4d1e55b2-f16f-11cf-88cb-001111000030}"
        $volt = [VoltHw.VoltIo]::Open($path)
        if ($volt) { break }
    }
    if ($volt) { break }
}
if (-not $volt) { throw 'Volt 1 introuvable. La carte est-elle branchée ?' }

try {
    $current = [VoltHw.VoltIo]::ReadState($volt, 3000)
    if ($current -lt 0) { throw "La Volt 1 n'a pas envoyé son état, réessaie." }

    if ($State -eq 'Status') {
        foreach ($b in $buttons.Values) {
            Write-Output ("{0,-8}: {1}" -f $b.Label, $(if ($current -band $b.State) { 'ALLUMÉ' } else { 'éteint' }))
        }
        return
    }

    $btn = $buttons[$Button]
    $isOn = [bool]($current -band $btn.State)
    $target = switch ($State) { 'On' { $true } 'Off' { $false } default { -not $isOn } }

    # Recopie l'état actuel des trois boutons, puis change uniquement celui demandé
    $settings = 0
    foreach ($b in $buttons.Values) {
        if ($current -band $b.State) { $settings = $settings -bor $b.Cfg }
    }
    $settings = if ($target) { $settings -bor $btn.Cfg } else { $settings -band (-bnot $btn.Cfg) -band 0xFF }
    [VoltHw.VoltIo]::WriteSettings($volt, [byte]$settings)
} finally {
    $volt.Dispose()
}

if ($Beep) { [Console]::Beep($(if ($target) { 1200 } else { 600 }), 120) }
Write-Output "$($btn.Label) Volt 1 : $(if ($target) { 'ALLUMÉ' } else { 'éteint' })"
