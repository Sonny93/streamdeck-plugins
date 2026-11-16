# Audio Deck

Control the PC audio from Stream Deck: the MONITOR and VINTAGE buttons of a Universal Audio Volt 1, the default output, device mute, and device volume on a dial. It runs on Windows 11 and, through OpenDeck, on Linux.

Install and develop it as described in the [root README](../../README.md).

## Volt 1 keys

The Volt 1 keys show the state of the button on the device: lit when on, grey when off, dimmed while the state is unknown.

- **The state stays unknown until the Volt 1 talks.** The Volt 1 sends its state only when something happens on it, so the keys stay dimmed after the plugin starts. Play some audio or press a button on the Volt 1, and the keys light up. They refuse to switch anything while the state is unknown.
- **The plugin never switches 48V.** Phantom power can damage microphones and other gear that do not expect it. Each change the plugin sends keeps the current 48V setting.

The Volt 1 has no public protocol. [`docs/volt1_hid_protocol.md`](docs/volt1_hid_protocol.md) describes the one the plugin uses, deduced with the PowerShell scripts in [`tools/volt1/`](tools/volt1).

## Audio actions

- **Default Output**: makes the picked output the system default (on Windows, for media and communications), and lights up while it is.
- **Mute**: mutes or unmutes a device, the default input unless another one is picked.
- **Device Volume** (dial): rotate to change the volume, press or tap the screen to mute. The default output unless another one is picked.

On Windows there is no public API to change the default device. Default Output uses the same undocumented interface as the Windows sound settings, so a Windows update could break it.

## Elgato audio

- **Restart Elgato Audio**: kills the Elgato audio server (`ElgatoAudioControlServer.exe`) and waits up to 15 seconds for it to run again, then shows a check mark, or the alert when it does not come back. A second press during a restart is ignored. If the server was not running, the key only waits for it.

The key never starts the server itself: it relies on the server starting again by itself after it was killed, as it does on a standard Elgato install.

## Linux

The plugin runs on Linux under [OpenDeck](https://github.com/ninjadev64/OpenDeck), with the system `node` on the `PATH`.

- **Audio** goes through `pactl`, so it needs PipeWire with `pipewire-pulse` (or PulseAudio). The keys follow device changes through `pactl subscribe`, and a slow read every few seconds catches whatever it misses.
- **Volt 1** is reached through its `/dev/hidraw` node, which a regular user cannot open by default. Add a udev rule, then replug the Volt 1:

  ```
  # /etc/udev/rules.d/70-volt1.rules
  SUBSYSTEM=="hidraw", ATTRS{idVendor}=="2b5a", ATTRS{idProduct}=="0020", TAG+="uaccess"
  ```

  Reload the rules with `sudo udevadm control --reload && sudo udevadm trigger`. Without the rule the plugin logs `Cannot open the Volt 1 (EACCES)` and the keys stay dimmed.

- **Restart Elgato Audio** is unavailable: Elgato has no audio server on Linux. The key is drawn dark and a press shows the alert.

## Labels

Every key draws its label in the color of its icon, at the top or the bottom of the key. Set the text and position in the action settings. Leave the text empty to use the default label, or no label for Default Output.
