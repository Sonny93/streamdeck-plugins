# Troubleshooting

## Stream Deck says "Unable to install" after I deleted my development checkout

`streamdeck link` and `pnpm link-pack` leave junctions in `%APPDATA%\Elgato\StreamDeck\Plugins` and `IconPacks`. Once the checkout is gone they point nowhere, and Stream Deck cannot install over them. `install.ps1` removes them. To remove them by hand, from PowerShell:

```powershell
Get-ChildItem "$env:APPDATA\Elgato\StreamDeck\Plugins","$env:APPDATA\Elgato\StreamDeck\IconPacks" -Filter 'com.sonny93.*' -Force | Where-Object { $_.LinkType -eq 'Junction' -and -not (Test-Path -LiteralPath $_.Target) } | ForEach-Object { cmd /c rmdir $_.FullName }
```

## The build fails with `EPERM` on `koffi-win32-x64`

A running plugin locks the native koffi module, so a build that updates koffi cannot replace it. Close the Stream Deck app, build, then start Stream Deck again.

## A plugin stops after linking it from a new folder

Stream Deck can fail to start a freshly linked plugin a few times before it starts it. Restart the plugin with `mise x -- pnpm restart` from its folder.
