# Display Deck

Control the PC monitors from Stream Deck: turn them off without moving the windows, change their brightness, and switch HDR.

Install and develop it as described in the [root README](../../README.md).

## Actions

Every action works on the main monitor unless another one is picked in its settings. Screen Power and the brightness actions can also work on all monitors at once.

- **Screen Power**: turns monitors off, and on again on the next press. It lights up while its monitors are on.
- **Brightness** (key): sets the brightness to a value, or moves it up or down by a step. A key that sets a value lights up while its monitors are at it.
- **Brightness Dial**: rotate to change the brightness by the step of the settings, press the dial to go to the preset brightness, tap the screen to turn the monitors off or on. The strip shows the monitor name, its brightness with a bar, an HDR badge while HDR is on, and the word "Off" (with the picture dimmed) while the monitors are off, over a background shared with the other dials of the strip.
- **HDR**: turns the HDR of a monitor on or off, like the "Use HDR" switch of the Windows display settings or the HDR toggle of the KDE display settings. It lights up while HDR is on, and dims when the monitor cannot show HDR.

## Idle panel

After 5 seconds without touching a dial, every Brightness Dial of the strip shows one panel across the whole touch strip: one slot per monitor, the main one first, with its name, brightness, HDR badge, and "Off" while it is in standby or under a black screen. A column without a dial of the plugin is left as it is. If the monitors cannot be read, the slots say "Unavailable" instead of showing an old value. The first touch on a dial only brings the dials back, and the gesture that woke them does nothing until the dials are left alone for a moment. The panel only uses what the plugin already reads: it adds no request to the monitors.

## Language

The plugin exists in English and French: the keys, the strips, the idle panel and the property inspectors. Every property inspector has a **Language / Langue** select with three choices: follow the system (the default), French, or English. The choice is kept in the global settings of the plugin and redraws every key and strip at once. Following the system reads the locale from the environment of the plugin (`LC_ALL`, then `LC_MESSAGES`, then `LANG`), then from the runtime when none is set; any locale that is not French gives English. The place in a monitor name, such as "(top)", stays in English. The names and tooltips of the actions in the Stream Deck app follow the language of that app (`fr.json` next to the manifest); OpenDeck shows them in English.

## Turn a monitor off without moving the windows

Many monitors leave the desktop when they turn off, like an unplugged cable, so the system moves the windows of the other screens around. Screen Power gives two ways to turn a monitor off:

- **Black screen** (default): a black window covers the monitor, and its backlight goes down to 0 when it takes a DDC/CI brightness. The system keeps the monitor, so no window moves. Windows only: see [Linux](#linux) for why it is missing there. An OLED panel turns its black pixels off; an LCD keeps a dim backlight. The mouse can still move over the black screen.
- **Monitor standby**: the monitor really turns off over DDC/CI, and turns on again the same way. Monitors that leave the desktop in standby make the system move the windows.

The black screens and the backlights they lowered are given back when the plugin turns the monitors on again. A DDC/CI brightness change on a monitor under a black screen keeps it dark: the monitor takes that brightness when it wakes. If the plugin restarts while a monitor is black, its black screen goes away and its backlight stays at 0: raise it with a brightness action.

## Brightness control

The brightness actions change one of these, picked in their settings:

- **Monitor (DDC/CI)**: the backlight or panel brightness of the monitor, as its own menu does, over the video cable.
- **System**: the picture the system sends. On Windows in SDR, a gamma ramp dims it from 100 down to 50 %, the lowest Windows allows. On Windows in HDR, it is the "SDR content brightness" slider of the Windows HDR settings. On Linux, see [Linux](#linux). The setting is stored as `windows`, as it was named when first saved.
- **Auto** (default): the monitor, unless it has no DDC/CI brightness or is known to ignore it; the system otherwise.

The Samsung Odyssey OLED G9 G95SD takes a DDC/CI brightness and reads it back, yet keeps its picture as it was, so Auto uses the system brightness for it. To let the gamma ramp go below 50 %, set the `GdiICMGammaRange` DWORD value to `256` under `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ICM`, then restart Windows.

Windows resets the gamma ramp when the display mode changes and when it restarts. The SDR content brightness uses an undocumented Windows call, so a Windows update could break it.

## Linux

The plugin also runs on Linux under [OpenDeck](https://github.com/ninjadev64/OpenDeck), with the system `node` (20 or later) on the `PATH`. It needs:

- **KDE Plasma 6** and its `kscreen-doctor`: it lists the monitors, switches HDR and sets brightness. On another desktop no monitor is listed.
- **`ddcutil`** with access to `/dev/i2c-*` (the `i2c` group, or a udev `uaccess` rule): it turns monitors off over DDC/CI (standby), and sets the brightness of monitors KWin does not drive. Without it, standby is unavailable.

How the actions differ from Windows:

- **Black screen is unavailable.** Wayland lets no program draw a window over a monitor. A Screen Power key or dial that was never set uses the standby there. One explicitly set to black screen shows as unavailable and flashes an alert when pressed. The standby writes the DDC/CI power mode, so the monitor may leave the desktop and move the windows.
- **KWin keeps control of the DDC/CI backlight** of the monitors where `kscreen-doctor -o` shows `DDC/CI: allowed`. On them the Monitor brightness goes through KWin, never through `ddcutil`, so both do not fight over the bus, and the System brightness has nothing to change. Other monitors take the Monitor brightness over `ddcutil`.
- **System brightness** is the dimming of KWin on monitors it does not drive over DDC/CI. While HDR is on it is the SDR brightness of KWin, 100 nits shown as 0 % and 1000 nits as 100 %.
- **Monitors are told apart by their EDID** (manufacturer, product code and serial), so a monitor keeps its settings when its connector changes.
- Reading a monitor over `ddcutil` is slow. The brightness of a monitor KWin does not drive is read again every 15 seconds at most. The power mode is read once, then only while the plugin has the monitor in standby (to see it wake), so a power change made with the monitor buttons is not noticed.

## Labels

Every key draws its label in the color of its icon, at the top or the bottom of the key. Set the text and position in the action settings. Leave the text empty to use the default label: "Screen" for Screen Power, the value or step for Brightness, none for HDR.
