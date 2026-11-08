<#
.SYNOPSIS
Installs the Stream Deck plugins, the icon pack and, on request, the profiles of a streamdeck-plugins release.

.DESCRIPTION
Considers only the plugins and icon packs that are missing or whose version differs from the installed one.
For each such plugin it asks "Install <name> <version>? [Y/n]" (Enter installs it); declining a plugin leaves
the installed one, if any, untouched. Icon packs are installed without a question.
When something must be installed, closes Stream Deck, removes the dead development links a deleted checkout
left in the Stream Deck folders, refuses live ones, then starts Stream Deck again and opens each package so
that Stream Deck installs it. When there is nothing to do, leaves Stream Deck alone.
Extract the whole zip first, then run this script from the extracted folder.

.PARAMETER WithProfile
Also imports the profiles, each in the variant that matches the plugins installed after this run (those just
installed plus those already there). A profile whose plugins are all missing is skipped. When a profile with the
same name and device model already exists, asks "Replace it? [y/N]" (Enter keeps it), then "Back up the current one first? [Y/n]".
A backup moves the old profile folder to %LOCALAPPDATA%\streamdeck-plugins\profile-backup\<date-time>\; to
restore it, close Stream Deck and move that folder back into the ProfilesV3 (or ProfilesV2) folder of
%APPDATA%\Elgato\StreamDeck. Without a backup the old folder goes to the Recycle Bin (restorable from there while Stream Deck is closed). If a
backup fails, the folders already backed up are put back. Several profiles with that name, or a
profile folder holding a link, are never replaced. Zips without a profiles index import their main profile files.

.PARAMETER Force
Considers every plugin and icon pack whatever its installed version, for example to reinstall a prerelease
that carries the same version as the previous one. Plugins are still asked about. It does not change the
profile handling.
#>
param([switch]$WithProfile, [switch]$Force)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem, Microsoft.VisualBasic

$PackageNamePattern = '^com\.sonny93\.[a-z0-9-]+(\.[a-z0-9-]+)*$'
$StreamDeckProcessName = 'StreamDeck'
$StreamDeckExitTimeoutSeconds = 60
$StreamDeckRelaunchKillLimit = 3
$StreamDeckAbsentPollsRequired = 2
$PluginExitTimeoutSeconds = 20
$StreamDeckStartTimeoutSeconds = 30
$StreamDeckSettleSeconds = 5
$PauseBetweenPackagesSeconds = 3
$PollIntervalMilliseconds = 500
$StreamDeckDataDirectory = Join-Path $env:APPDATA 'Elgato\StreamDeck'
$ProfileBackupDirectory = Join-Path $env:LOCALAPPDATA 'streamdeck-plugins\profile-backup'
$ProfilesIndexFileName = 'profiles-index.json'
$ProfileExtension = '.streamDeckProfile'
$BackupTimestampFormat = 'yyyyMMdd-HHmmss'
$PluginManifestPattern = '^[^/]+\.sdPlugin/manifest\.json$'
$IconPackManifestPattern = '^[^/]+\.sdIconPack/manifest\.json$'
$ProfileManifestPattern = '^Profiles/[^/]+\.sdProfile/manifest\.json$'

function Assert-NotElevated {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if ($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'Do not run this script as Administrator: Stream Deck installs for your own user. Open a normal PowerShell window and run it again.'
    }
}

function ConvertTo-YesNoAnswer {
    param([string]$Text, [bool]$DefaultAnswer)
    $answer = $Text.Trim().ToLowerInvariant()
    if ($answer -eq '') {
        return $DefaultAnswer
    }
    if (@('y', 'yes', 'o', 'oui') -contains $answer) {
        return $true
    }
    if (@('n', 'no', 'non') -contains $answer) {
        return $false
    }
    return $null
}

function Read-YesNo {
    param([string]$Question, [bool]$DefaultAnswer)
    $hint = if ($DefaultAnswer) { '[Y/n]' } else { '[y/N]' }
    while ($true) {
        $answer = ConvertTo-YesNoAnswer -Text ([string](Read-Host "$Question $hint")) -DefaultAnswer $DefaultAnswer
        if ($null -ne $answer) {
            return $answer
        }
        Write-Host 'Please answer yes or no.'
    }
}

function Get-PackageFiles {
    param([string]$Folder, [string]$Extension, [switch]$Recurse)
    $folderPath = Join-Path $PSScriptRoot $Folder
    if (-not (Test-Path -LiteralPath $folderPath -PathType Container)) {
        return @()
    }
    return @(Get-ChildItem -LiteralPath $folderPath -File -Recurse:$Recurse -Filter "*$Extension" | Sort-Object FullName)
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

function Read-ZipEntryText {
    param([string]$ArchivePath, [string]$EntryPattern)
    $archive = [System.IO.Compression.ZipFile]::OpenRead($ArchivePath)
    try {
        $entry = $archive.Entries | Where-Object { $_.FullName -cmatch $EntryPattern } | Select-Object -First 1
        if (-not $entry) {
            return $null
        }
        $reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
        try {
            return $reader.ReadToEnd()
        } finally {
            $reader.Dispose()
        }
    } finally {
        $archive.Dispose()
    }
}

function Read-JsonField {
    param([string]$Json, [string]$Field)
    try {
        $property = (ConvertFrom-Json -InputObject $Json).PSObject.Properties[$Field]
        if ($null -eq $property -or $null -eq $property.Value) {
            return $null
        }
        return [string]$property.Value
    } catch {
        return $null
    }
}

function Read-JsonDeviceModel {
    param([string]$Json)
    try {
        $device = (ConvertFrom-Json -InputObject $Json).PSObject.Properties['Device']
        if ($null -eq $device -or $null -eq $device.Value) {
            return $null
        }
        $model = $device.Value.PSObject.Properties['Model']
        if ($null -eq $model -or $null -eq $model.Value) {
            return $null
        }
        return [string]$model.Value
    } catch {
        return $null
    }
}

function Read-PackageDeviceModel {
    param([string]$ArchivePath)
    try {
        return Read-JsonDeviceModel -Json (Read-ZipEntryText -ArchivePath $ArchivePath -EntryPattern $ProfileManifestPattern)
    } catch {
        return $null
    }
}

function Read-InstalledDeviceModel {
    param([string]$ManifestPath)
    try {
        return Read-JsonDeviceModel -Json (Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8)
    } catch {
        return $null
    }
}

function Read-PackageManifestField {
    param([string]$ArchivePath, [string]$EntryPattern, [string]$Field)
    try {
        return Read-JsonField -Json (Read-ZipEntryText -ArchivePath $ArchivePath -EntryPattern $EntryPattern) -Field $Field
    } catch {
        return $null
    }
}

function Read-InstalledManifestField {
    param([string]$ManifestPath, [string]$Field)
    try {
        return Read-JsonField -Json (Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8) -Field $Field
    } catch {
        return $null
    }
}

function Get-InstallAction {
    param([string]$State, [string]$PackageVersion, [string]$InstalledVersion)
    if ($State -eq 'Folder' -and $PackageVersion -and $PackageVersion -ceq $InstalledVersion) {
        return 'Skip'
    }
    return 'Install'
}

function New-InstallTarget {
    param([System.IO.FileInfo]$Package, [string]$Kind, [string]$InstallFolder, [string]$InstallExtension, [string]$ManifestPattern)
    $name = [System.IO.Path]::GetFileNameWithoutExtension($Package.Name)
    if ($name -cnotmatch $PackageNamePattern) {
        throw "Unexpected package name: $($Package.Name)"
    }
    $path = Join-Path (Join-Path $StreamDeckDataDirectory $InstallFolder) "$name$InstallExtension"
    $state = Get-InstallState -Path $path
    $packageVersion = Read-PackageManifestField -ArchivePath $Package.FullName -EntryPattern $ManifestPattern -Field 'Version'
    $displayName = Read-PackageManifestField -ArchivePath $Package.FullName -EntryPattern $ManifestPattern -Field 'Name'
    $installedVersion = $null
    if ($state -eq 'Folder') {
        $installedVersion = Read-InstalledManifestField -ManifestPath (Join-Path $path 'manifest.json') -Field 'Version'
    }
    return [pscustomobject]@{
        Name        = $name
        DisplayName = if ($displayName) { $displayName } else { $name }
        Kind        = $Kind
        Path        = $path
        State       = $state
        Package     = $Package
        Version     = $packageVersion
        Action      = Get-InstallAction -State $state -PackageVersion $packageVersion -InstalledVersion $installedVersion
    }
}

function Get-InstallTargets {
    param($PluginPackages, $IconPackPackages)
    $targets = @()
    foreach ($package in $PluginPackages) {
        $targets += New-InstallTarget -Package $package -Kind 'plugin' -InstallFolder 'Plugins' -InstallExtension '.sdPlugin' -ManifestPattern $PluginManifestPattern
    }
    foreach ($package in $IconPackPackages) {
        $targets += New-InstallTarget -Package $package -Kind 'icon pack' -InstallFolder 'IconPacks' -InstallExtension '.sdIconPack' -ManifestPattern $IconPackManifestPattern
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

function Get-StreamDeckProcesses {
    return @(Get-Process -Name $StreamDeckProcessName -ErrorAction SilentlyContinue)
}

function Get-ProcessStartTime {
    param($Process)
    try {
        return $Process.StartTime
    } catch {
        return $null
    }
}

function Stop-ProcessList {
    param($Processes)
    $processIds = @($Processes | ForEach-Object { $_.Id })
    if ($processIds.Count -eq 0) {
        return
    }
    Stop-Process -Id $processIds -Force -ErrorAction SilentlyContinue
}

function Get-RelaunchedProcesses {
    param($Processes, [datetime]$KillTime)
    return @($Processes | Where-Object {
        $startTime = Get-ProcessStartTime -Process $_
        $null -ne $startTime -and $startTime -gt $KillTime
    })
}

function Format-RemainingProcesses {
    param($Processes)
    $lines = foreach ($process in @($Processes)) {
        $startTime = Get-ProcessStartTime -Process $process
        $started = if ($null -eq $startTime) { 'start time unknown' } else { "started $($startTime.ToString('HH:mm:ss'))" }
        "PID $($process.Id) $started"
    }
    return ($lines -join ', ')
}

function Wait-StreamDeckExit {
    param([datetime]$KillTime)
    $deadline = (Get-Date).AddSeconds($StreamDeckExitTimeoutSeconds)
    $absentPolls = 0
    $killsLeft = $StreamDeckRelaunchKillLimit
    $isRelaunchAnnounced = $false
    while ((Get-Date) -lt $deadline) {
        $remaining = @(Get-StreamDeckProcesses)
        $absentPolls = if ($remaining.Count -eq 0) { $absentPolls + 1 } else { 0 }
        if ($absentPolls -ge $StreamDeckAbsentPollsRequired) {
            return
        }
        $relaunched = @(Get-RelaunchedProcesses -Processes $remaining -KillTime $KillTime)
        if ($relaunched.Count -gt 0 -and $killsLeft -gt 0) {
            if (-not $isRelaunchAnnounced) {
                Write-Host 'Stream Deck restarted itself, closing it again...'
                $isRelaunchAnnounced = $true
            }
            Stop-ProcessList -Processes $relaunched
            $killsLeft--
        }
        Start-Sleep -Milliseconds $PollIntervalMilliseconds
    }
    $details = Format-RemainingProcesses -Processes (Get-StreamDeckProcesses)
    throw "Stream Deck is still running or restarted itself within $StreamDeckExitTimeoutSeconds seconds (remaining: $details). Close it from the tray icon and run this script again."
}

function Stop-StreamDeck {
    $processes = @(Get-StreamDeckProcesses)
    if ($processes.Count -eq 0) {
        return $null
    }
    $executablePath = $processes[0].Path
    Write-Host 'Closing Stream Deck...'
    $killTime = Get-Date
    Stop-ProcessList -Processes $processes
    Wait-StreamDeckExit -KillTime $killTime
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

function Get-ProfilesDirectory {
    foreach ($folder in @('ProfilesV3', 'ProfilesV2')) {
        $path = Join-Path $StreamDeckDataDirectory $folder
        if (Test-Path -LiteralPath $path -PathType Container) {
            return $path
        }
    }
    return $null
}

function Get-InstalledProfiles {
    $directory = Get-ProfilesDirectory
    if (-not $directory) {
        return @()
    }
    $profiles = @()
    try {
        foreach ($folder in @(Get-ChildItem -LiteralPath $directory -Directory -Filter '*.sdProfile')) {
            $name = Read-InstalledManifestField -ManifestPath (Join-Path $folder.FullName 'manifest.json') -Field 'Name'
            if ($name) {
                $model = Read-InstalledDeviceModel -ManifestPath (Join-Path $folder.FullName 'manifest.json')
                $profiles += [pscustomobject]@{ Name = $name; Model = $model; Path = $folder.FullName }
            }
        }
    } catch {
        return @($profiles)
    }
    return @($profiles)
}

function ConvertTo-IndexVariant {
    param($Variant)
    $plugins = @($Variant.plugins | ForEach-Object { [string]$_ })
    $file = [string]$Variant.file
    if ($plugins.Count -eq 0 -or -not $file) {
        throw 'Invalid variant in the profiles index.'
    }
    return [pscustomobject]@{ Plugins = $plugins; File = $file }
}

function Read-ProfilesIndex {
    $indexPath = Join-Path (Join-Path $PSScriptRoot 'profiles') $ProfilesIndexFileName
    if (-not (Test-Path -LiteralPath $indexPath -PathType Leaf)) {
        return $null
    }
    try {
        $index = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $entries = @()
        foreach ($entry in @($index.profiles)) {
            $variants = @($entry.variants | ForEach-Object { ConvertTo-IndexVariant -Variant $_ })
            if (-not $entry.name -or $variants.Count -eq 0) {
                throw 'Invalid profile in the profiles index.'
            }
            $entries += [pscustomobject]@{ Name = [string]$entry.name; Variants = $variants }
        }
        if ($entries.Count -eq 0) {
            throw 'The profiles index is empty.'
        }
        return $entries
    } catch {
        Write-Host "The profiles index could not be read ($($_.Exception.Message)): importing the main profile files instead."
        return $null
    }
}

function Get-PresentVariantPlugins {
    param($Variants, [string[]]$PresentPlugins)
    return @($Variants | ForEach-Object { $_.Plugins } | Where-Object { $PresentPlugins -ccontains $_ } | Select-Object -Unique)
}

function Select-ProfileVariant {
    param($Variants, [string[]]$PresentPlugins)
    $wanted = @(Get-PresentVariantPlugins -Variants $Variants -PresentPlugins $PresentPlugins)
    if ($wanted.Count -eq 0) {
        return $null
    }
    foreach ($variant in $Variants) {
        $plugins = @($variant.Plugins)
        $matching = @($plugins | Where-Object { $wanted -ccontains $_ })
        if ($plugins.Count -eq $wanted.Count -and $matching.Count -eq $plugins.Count) {
            return $variant
        }
    }
    return $null
}

function Resolve-ProfileVariantFile {
    param([string]$RelativeFile)
    $root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'profiles'))
    if ([System.IO.Path]::IsPathRooted($RelativeFile) -or $RelativeFile -match '(^|[/\\])\.\.([/\\]|$)') {
        return $null
    }
    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $root $RelativeFile))
    $isInsideRoot = $fullPath.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)
    if (-not $isInsideRoot -or -not $fullPath.EndsWith($ProfileExtension, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $null
    }
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        return $null
    }
    return Get-Item -LiteralPath $fullPath
}

function Get-IndexedProfileCandidates {
    param($Entries, [string[]]$PresentPlugins)
    $candidates = @()
    foreach ($entry in $Entries) {
        $present = @(Get-PresentVariantPlugins -Variants $entry.Variants -PresentPlugins $PresentPlugins)
        if ($present.Count -eq 0) {
            Write-Host "Skipped the profile '$($entry.Name)': none of its plugins is installed."
            continue
        }
        $variant = Select-ProfileVariant -Variants $entry.Variants -PresentPlugins $PresentPlugins
        if (-not $variant) {
            Write-Host "Skipped the profile '$($entry.Name)': no variant matches the installed plugins ($($present -join ', '))."
            continue
        }
        $package = Resolve-ProfileVariantFile -RelativeFile $variant.File
        if (-not $package) {
            Write-Host "Skipped the profile '$($entry.Name)': the file '$($variant.File)' is missing or outside the profiles folder."
            continue
        }
        $candidates += [pscustomobject]@{ Name = $entry.Name; Model = (Read-PackageDeviceModel -ArchivePath $package.FullName); Package = $package }
    }
    return $candidates
}

function Get-LegacyProfileCandidates {
    $candidates = @()
    foreach ($package in @(Get-PackageFiles -Folder 'profiles' -Extension $ProfileExtension)) {
        $name = Read-PackageManifestField -ArchivePath $package.FullName -EntryPattern $ProfileManifestPattern -Field 'Name'
        $candidates += [pscustomobject]@{ Name = $name; Model = (Read-PackageDeviceModel -ArchivePath $package.FullName); Package = $package }
    }
    return $candidates
}

function Get-ProfileCandidates {
    param([string[]]$PresentPlugins)
    $entries = Read-ProfilesIndex
    if ($null -eq $entries) {
        return @(Get-LegacyProfileCandidates)
    }
    return @(Get-IndexedProfileCandidates -Entries $entries -PresentPlugins $PresentPlugins)
}

function Find-ReparsePoint {
    param([string]$Path)
    $attributes = [System.IO.File]::GetAttributes($Path)
    if ($attributes -band [System.IO.FileAttributes]::ReparsePoint) {
        return $Path
    }
    if (-not ($attributes -band [System.IO.FileAttributes]::Directory)) {
        return $null
    }
    foreach ($child in [System.IO.Directory]::EnumerateFileSystemEntries($Path)) {
        $found = Find-ReparsePoint -Path $child
        if ($found) {
            return $found
        }
    }
    return $null
}

function Assert-NoReparsePoint {
    param([string]$Path)
    $found = Find-ReparsePoint -Path $Path
    if ($found) {
        throw "Cannot replace the profile folder $Path because $found is a link. Nothing was changed. Remove it in Stream Deck instead."
    }
}

function Test-SameProfile {
    param($Candidate, $Installed)
    return $Candidate.Name -and $Installed.Name -eq $Candidate.Name -and ([string]$Installed.Model -ceq [string]$Candidate.Model)
}

function Get-ProfileReplacement {
    param($Candidate, $InstalledProfiles)
    $name = $Candidate.Name
    $existing = @($InstalledProfiles | Where-Object { Test-SameProfile -Candidate $Candidate -Installed $_ })
    $plan = [pscustomobject]@{ Name = $name; Package = $Candidate.Package; ExistingPath = $null; IsBackupWanted = $false }
    if ($existing.Count -eq 0) {
        return $plan
    }
    if ($existing.Count -gt 1) {
        Write-Host "Skipped the profile '$name': several profiles have that name. Remove the extras in Stream Deck, then run this script again:"
        $existing | ForEach-Object { Write-Host "  $($_.Path)" }
        return $null
    }
    if (-not (Read-YesNo -Question "The profile '$name' is already installed ($($existing[0].Path)). Replace it?" -DefaultAnswer $false)) {
        Write-Host "Kept the profile '$name' as it is."
        return $null
    }
    Assert-NoReparsePoint -Path $existing[0].Path
    $plan.ExistingPath = $existing[0].Path
    $plan.IsBackupWanted = Read-YesNo -Question 'Back up the current one first?' -DefaultAnswer $true
    return $plan
}

function Get-ProfilePlans {
    param([string[]]$PresentPlugins)
    $installedProfiles = @(Get-InstalledProfiles)
    $plans = @()
    foreach ($candidate in @(Get-ProfileCandidates -PresentPlugins $PresentPlugins)) {
        $plan = Get-ProfileReplacement -Candidate $candidate -InstalledProfiles $installedProfiles
        if ($plan) {
            $plans += $plan
        }
    }
    return $plans
}

function Move-ProfileToBackup {
    param([string]$Path, [string]$BackupFolder)
    $destination = Join-Path $BackupFolder (Split-Path -Leaf $Path)
    [void][System.IO.Directory]::CreateDirectory($BackupFolder)
    [System.IO.Directory]::Move($Path, $destination)
    Write-Host "Backed up the profile to $destination"
    return [pscustomobject]@{ Original = $Path; Backup = $destination }
}

function Restore-MovedProfiles {
    param($MovedProfiles)
    $notRestored = @()
    foreach ($moved in @($MovedProfiles)) {
        try {
            [System.IO.Directory]::Move($moved.Backup, $moved.Original)
        } catch {
            $notRestored += $moved.Backup
        }
    }
    return $notRestored
}

function Backup-ProfileFolders {
    param($ProfilePlans, [string]$BackupFolder)
    $moved = @()
    foreach ($plan in @($ProfilePlans | Where-Object { $_.IsBackupWanted })) {
        try {
            $moved += Move-ProfileToBackup -Path $plan.ExistingPath -BackupFolder $BackupFolder
        } catch {
            $reason = $_.Exception.Message
            $notRestored = @(Restore-MovedProfiles -MovedProfiles $moved)
            if ($notRestored.Count -gt 0) {
                throw "Could not back up $($plan.ExistingPath) ($reason). These backups could not be put back and stay where they are: $($notRestored -join ', ')."
            }
            throw "Could not back up $($plan.ExistingPath) ($reason). The profiles already backed up were put back: no profile was changed."
        }
    }
}

function Remove-ProfileToRecycleBin {
    param([string]$Path)
    [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($Path, [Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs, [Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)
    Write-Host "Moved the profile folder $Path to the Recycle Bin"
}

function Assert-StreamDeckNotRunning {
    if (Get-Process -Name $StreamDeckProcessName -ErrorAction SilentlyContinue) {
        throw 'Stream Deck is running again. No profile was changed. Close it from the tray icon and run this script again.'
    }
}

function Remove-ReplacedProfiles {
    param($ProfilePlans)
    $replaced = @($ProfilePlans | Where-Object { $_.ExistingPath })
    foreach ($plan in $replaced) {
        Assert-NoReparsePoint -Path $plan.ExistingPath
    }
    if ($replaced.Count -eq 0) {
        return
    }
    Assert-StreamDeckNotRunning
    $backupFolder = Join-Path $ProfileBackupDirectory (Get-Date -Format $BackupTimestampFormat)
    Backup-ProfileFolders -ProfilePlans $replaced -BackupFolder $backupFolder
    foreach ($plan in @($replaced | Where-Object { -not $_.IsBackupWanted })) {
        Remove-ProfileToRecycleBin -Path $plan.ExistingPath
    }
}

function Write-SkippedTargets {
    param($Targets)
    foreach ($target in @($Targets | Where-Object { $_.Action -eq 'Skip' })) {
        Write-Host "$($target.Name) $($target.Version) is already installed"
    }
}

function Select-TargetsToInstall {
    param($Targets)
    $candidates = @($Targets)
    if (-not $Force) {
        Write-SkippedTargets -Targets $Targets
        $candidates = @($Targets | Where-Object { $_.Action -eq 'Install' })
    }
    $selected = @()
    foreach ($target in $candidates) {
        $isWanted = $target.Kind -ne 'plugin' -or (Read-YesNo -Question "Install $($target.DisplayName) $($target.Version)?" -DefaultAnswer $true)
        if ($isWanted) {
            $selected += $target
        }
    }
    return $selected
}

function Get-PresentPlugins {
    param($Targets, $SelectedTargets)
    $selectedNames = @($SelectedTargets | ForEach-Object { $_.Name })
    $present = $Targets | Where-Object { $_.Kind -eq 'plugin' -and ($_.State -eq 'Folder' -or $selectedNames -ccontains $_.Name) }
    return @($present | ForEach-Object { $_.Name })
}

function Clear-StreamDeckForInstall {
    param($Targets, $ProfilePlans)
    $knownPath = Stop-StreamDeck
    try {
        Wait-PluginProcessesExit
        Remove-DeadLinks -Targets $Targets
        Remove-ReplacedProfiles -ProfilePlans $ProfilePlans
    } finally {
        Start-StreamDeck -KnownPath $knownPath
    }
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
    $profileFiles = @(Get-PackageFiles -Folder 'profiles' -Extension $ProfileExtension -Recurse)
    @($pluginPackages) + @($iconPackPackages) + @($profileFiles) | Unblock-File
    if ($pluginPackages.Count -eq 0) {
        throw 'No .streamDeckPlugin file in the plugins folder.'
    }
    $targets = @(Get-InstallTargets -PluginPackages $pluginPackages -IconPackPackages $iconPackPackages)
    Assert-NoLiveLinks -Targets $targets
    $targetsToInstall = @(Select-TargetsToInstall -Targets $targets)
    $profilePlans = @()
    if ($WithProfile) {
        $presentPlugins = @(Get-PresentPlugins -Targets $targets -SelectedTargets $targetsToInstall)
        $profilePlans = @(Get-ProfilePlans -PresentPlugins $presentPlugins)
    }
    if ($targetsToInstall.Count -eq 0 -and $profilePlans.Count -eq 0) {
        Write-Host 'Nothing to install or import. Stream Deck was left as it is.'
        return
    }

    $isStopNeeded = $targetsToInstall.Count -gt 0 -or @($profilePlans | Where-Object { $_.ExistingPath }).Count -gt 0
    if ($isStopNeeded) {
        Clear-StreamDeckForInstall -Targets $targetsToInstall -ProfilePlans $profilePlans
    } else {
        Start-StreamDeck -KnownPath $null
    }
    Wait-StreamDeckReady

    Open-Packages -Packages (@($targetsToInstall | ForEach-Object { $_.Package }) + @($profilePlans | ForEach-Object { $_.Package }))
    Write-Host 'Done. Stream Deck may ask you to confirm each install: accept every prompt.'
    if (-not $WithProfile -and $profileFiles.Count -gt 0) {
        Write-Host 'The profile was not opened. Run this script again with -WithProfile to import it.'
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    try {
        Invoke-Install
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
