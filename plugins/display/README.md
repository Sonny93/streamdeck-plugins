# Display Deck

Control the PC monitors from Stream Deck: turn them off without moving the windows, change their brightness, and switch HDR.

Install and develop it as described in the [root README](../../README.md).

## Actions

Every action works on the main monitor unless another one is picked in its settings. Screen Power and the brightness actions can also work on all monitors at once.

- **Screen Power**: turns monitors off, and on again on the next press. It lights up while its monitors are on.
- **Brightness** (key): sets the brightness to a value, or moves it up or down by a step. A key that sets a value lights up while its monitors are at it.
- **Brightness Dial**: rotate to change the brightness by the step of the settings, press the dial to go to the preset brightness, tap the screen to turn the monitors off or on.
- **HDR**: turns the HDR of a monitor on or off, like the "Use HDR" switch of the Windows display settings. It lights up while HDR is on, and dims when the monitor cannot show HDR.

## Turn a monitor off without moving the windows

Many monitors leave Windows when they turn off, like an unplugged cable, so Windows moves the windows of the other screens around. Screen Power gives two ways to turn a monitor off:

- **Black screen** (default): a black window covers the monitor, and its backlight goes down to 0 when it takes a DDC/CI brightness. Windows keeps the monitor, so no window moves. An OLED panel turns its black pixels off; an LCD keeps a dim backlight. The mouse can still move over the black screen.
- **Monitor standby**: the monitor really turns off over DDC/CI, and turns on again the same way. Monitors that leave Windows in standby make it move the windows.

The black screens and the backlights they lowered are given back when the plugin turns the monitors on again. If the plugin restarts while a monitor is black, its black screen goes away and its backlight stays at 0: raise it with a brightness action.

## Brightness control

The brightness actions change one of two things, picked in their settings:

- **Monitor (DDC/CI)**: the backlight or panel brightness of the monitor, as its own menu does, over the video cable.
- **Windows**: the picture Windows sends. In SDR, a gamma ramp dims it from 100 down to 50 %, the lowest Windows allows. In HDR, it is the "SDR content brightness" slider of the Windows HDR settings.
- **Auto** (default): the monitor, unless it has no DDC/CI brightness or is known to ignore it; Windows otherwise.

The Samsung Odyssey OLED G9 G95SD takes a DDC/CI brightness and reads it back, yet keeps its picture as it was, so Auto uses Windows for it. To let the gamma ramp go below 50 %, set the `GdiICMGammaRange` DWORD value to `256` under `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ICM`, then restart Windows.

Windows resets the gamma ramp when the display mode changes and when it restarts. The SDR content brightness uses an undocumented Windows call, so a Windows update could break it.

## Labels

Every key draws its label in the color of its icon, at the top or the bottom of the key. Set the text and position in the action settings. Leave the text empty to use the default label: "Screen" for Screen Power, the value or step for Brightness, none for HDR.
