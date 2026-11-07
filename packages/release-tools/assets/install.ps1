<#
.SYNOPSIS
Installs the Stream Deck plugins, the icon pack and, on request, the profile of a streamdeck-plugins release.

.DESCRIPTION
Closes Stream Deck, removes the dead development links a deleted checkout left in the Stream Deck folders,
refuses live ones, then starts Stream Deck again and opens each package so that Stream Deck installs it.
Extract the whole zip first, then run this script from the extracted folder.

.PARAMETER WithProfile
Also opens the profiles. Each import adds a profile, so it is opt-in.
#>
param([switch]$WithProfile)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$PackageNamePattern = '^com\.sonny93\.[a-z0-9-]+(\.[a-z0-9-]+)*$'
$StreamDeckProcessName = 'StreamDeck'
$StreamDeckExitTimeoutSeconds = 20
$PluginExitTimeoutSeconds = 20
$StreamDeckStartTimeoutSeconds = 30
$StreamDeckSettleSeconds = 5
$PauseBetweenPackagesSeconds = 3
$PollIntervalMilliseconds = 500
$StreamDeckDataDirectory = Join-Path $env:APPDATA 'Elgato\StreamDeck'

function Assert-NotElevated {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if ($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'Do not run this script as Administrator: Stream Deck installs for your own user. Open a normal PowerShell window and run it again.'
    }
}

function Get-PackageFiles {
    param([string]$Folder, [string]$Extension)
    $folderPath = Join-Path $PSScriptRoot $Folder
    if (-not (Test-Path -LiteralPath $folderPath -PathType Container)) {
        return @()
    }
    return @(Get-ChildItem -LiteralPath $folderPath -File -Filter "*$Extension" | Sort-Object Name)
}

function Get-InstallState {
    param([string]$Path)
    try {
        $attributes = [System.IO.File]::GetAttributes($Path)
    } catch [System.IO.FileNotFoundException], [System.IO.DirectoryNotFoundException] {
        return 'Missing'
    }
    if (-not ($attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
        return 'Folder'
    }
    if (Test-Path -LiteralPath $Path) {
        return 'LiveLink'
    }
    return 'DeadLink'
}

function New-InstallTarget {
    param([System.IO.FileInfo]$Package, [string]$Kind, [string]$InstallFolder, [string]$InstallExtension)
    $name = [System.IO.Path]::GetFileNameWithoutExtension($Package.Name)
    if ($name -cnotmatch $PackageNamePattern) {
        throw "Unexpected package name: $($Package.Name)"
    }
    $path = Join-Path (Join-Path $StreamDeckDataDirectory $InstallFolder) "$name$InstallExtension"
    return [pscustomobject]@{
        Name  = $name
        Kind  = $Kind
        Path  = $path
        State = Get-InstallState -Path $path
    }
}

function Get-InstallTargets {
    param($PluginPackages, $IconPackPackages)
    $targets = @()
    foreach ($package in $PluginPackages) {
        $targets += New-InstallTarget -Package $package -Kind 'plugin' -InstallFolder 'Plugins' -InstallExtension '.sdPlugin'
    }
    foreach ($package in $IconPackPackages) {
        $targets += New-InstallTarget -Package $package -Kind 'icon pack' -InstallFolder 'IconPacks' -InstallExtension '.sdIconPack'
    }
    return $targets
}

function Assert-NoLiveLinks {
    param($Targets)
    $liveLinks = @($Targets | Where-Object { $_.State -eq 'LiveLink' })
    if ($liveLinks.Count -eq 0) {
        return
    }
    $lines = foreach ($link in $liveLinks) {
        if ($link.Kind -eq 'plugin') {
            "  $($link.Path): run 'streamdeck unlink $($link.Name)' from the plugin folder first"
        } else {
            "  $($link.Path): remove the link with 'cmd /c rmdir ""$($link.Path)""', which keeps the folder it points to"
        }
    }
    throw ("These are live development links, installing over them could write into your checkout. Nothing was changed.`n" + ($lines -join "`n"))
}

function Stop-StreamDeck {
    $processes = @(Get-Process -Name $StreamDeckProcessName -ErrorAction SilentlyContinue)
    if ($processes.Count -eq 0) {
        return $null
    }
    $executablePath = $processes[0].Path
    Write-Host 'Closing Stream Deck...'
    foreach ($process in $processes) {
        Stop-Process -Id $process.Id -Force
        Wait-Process -Id $process.Id -Timeout $StreamDeckExitTimeoutSeconds -ErrorAction SilentlyContinue
        if (Get-Process -Id $process.Id -ErrorAction SilentlyContinue) {
            throw "Stream Deck did not close within $StreamDeckExitTimeoutSeconds seconds. Close it from the tray icon and run this script again."
        }
    }
    return $executablePath
}

function Get-PluginProcesses {
    return @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
        Where-Object { $_.CommandLine -match 'com\.sonny93\.' })
}

function Wait-PluginProcessesExit {
    $deadline = (Get-Date).AddSeconds($PluginExitTimeoutSeconds)
    while (@(Get-PluginProcesses).Count -gt 0) {
        if ((Get-Date) -gt $deadline) {
            throw "A com.sonny93 plugin process is still running after $PluginExitTimeoutSeconds seconds. End its node.exe in Task Manager and run this script again."
        }
        Start-Sleep -Milliseconds $PollIntervalMilliseconds
    }
}

function Remove-DeadLinks {
    param($Targets)
    foreach ($target in @($Targets | Where-Object { $_.State -eq 'DeadLink' })) {
        [System.IO.Directory]::Delete($target.Path)
        Write-Host "Removed the dead link $($target.Path)"
    }
}

function Resolve-StreamDeckPath {
    param([string]$KnownPath)
    $candidates = @(
        $KnownPath,
        $(if ($env:ProgramW6432) { Join-Path $env:ProgramW6432 'Elgato\StreamDeck\StreamDeck.exe' }),
        $(if ($env:ProgramFiles) { Join-Path $env:ProgramFiles 'Elgato\StreamDeck\StreamDeck.exe' })
    )
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            return $candidate
        }
    }
    throw 'StreamDeck.exe was not found. Install Stream Deck 7.1 or later first.'
}

function Start-StreamDeck {
    param([string]$KnownPath)
    if (Get-Process -Name $StreamDeckProcessName -ErrorAction SilentlyContinue) {
        return
    }
    Write-Host 'Starting Stream Deck...'
    Start-Process -FilePath (Resolve-StreamDeckPath -KnownPath $KnownPath)
}

function Wait-StreamDeckReady {
    $deadline = (Get-Date).AddSeconds($StreamDeckStartTimeoutSeconds)
    while (-not (Get-Process -Name $StreamDeckProcessName -ErrorAction SilentlyContinue)) {
        if ((Get-Date) -gt $deadline) {
            throw "Stream Deck did not start within $StreamDeckStartTimeoutSeconds seconds."
        }
        Start-Sleep -Milliseconds $PollIntervalMilliseconds
    }
    Start-Sleep -Seconds $StreamDeckSettleSeconds
}

function Open-Packages {
    param($Packages)
    foreach ($package in $Packages) {
        Write-Host "Opening $($package.Name)"
        Start-Process -FilePath $package.FullName
        Start-Sleep -Seconds $PauseBetweenPackagesSeconds
    }
}

function Invoke-Install {
    Assert-NotElevated
    if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'plugins') -PathType Container)) {
        throw 'The plugins folder is missing next to this script. Extract the whole zip first, then run the script from the extracted folder.'
    }
    $pluginPackages = @(Get-PackageFiles -Folder 'plugins' -Extension '.streamDeckPlugin')
    $iconPackPackages = @(Get-PackageFiles -Folder 'icons' -Extension '.streamDeckIconPack')
    $profilePackages = @(Get-PackageFiles -Folder 'profiles' -Extension '.streamDeckProfile')
    @($pluginPackages) + @($iconPackPackages) + @($profilePackages) | Unblock-File
    if ($pluginPackages.Count -eq 0) {
        throw 'No .streamDeckPlugin file in the plugins folder.'
    }
    $targets = @(Get-InstallTargets -PluginPackages $pluginPackages -IconPackPackages $iconPackPackages)
    Assert-NoLiveLinks -Targets $targets

    $streamDeckPath = Stop-StreamDeck
    try {
        Wait-PluginProcessesExit
        Remove-DeadLinks -Targets $targets
    } finally {
        Start-StreamDeck -KnownPath $streamDeckPath
    }
    Wait-StreamDeckReady

    Open-Packages -Packages ($pluginPackages + $iconPackPackages)
    if ($WithProfile) {
        Open-Packages -Packages $profilePackages
    }
    Write-Host 'Done. Stream Deck may ask you to confirm each install: accept every prompt.'
    if (-not $WithProfile -and $profilePackages.Count -gt 0) {
        Write-Host 'The profile was not opened. Run this script again with -WithProfile to import it.'
    }
}

try {
    Invoke-Install
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
