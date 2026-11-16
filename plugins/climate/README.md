# Climate Deck

Control a Daikin air conditioner from Stream Deck over your local network: turn it on and off, change its target temperature with a dial, switch between presets and set the fan.

Install and develop it as described in the [root README](../../README.md).

## Supported units

Only Daikin units with the **local HTTP API** work: the ones with a wifi module of the `aircon` type. Newer modules (type `GPF`, driven by the Daikin cloud) answer nothing on the local network and are refused when you save their address. The plugin talks to the unit directly, with no cloud account.

The text the plugin draws on the keys and strips, and the settings in Stream Deck, are in French. This documentation is in English.

## Set the address of the unit

Every action has an **Air conditioner address** field in its settings:

1. Type the IPv4 address of the unit on your network (a private address, like 192.168.x.x).
2. Press **Save address**. The field does not save while you type.

The plugin checks that the address is private, then asks the unit who it is, and only saves the address when it answers as a Daikin unit with the local API. The message under the button tells why an address was refused. The address is stored once, in the global settings of the plugin on this computer, and shared by every action. It is never written in the settings of an action, so an exported profile does not carry it.

Give the unit a fixed address in your router (a DHCP reservation for its MAC address), or it can change and the keys will say the unit is unreachable.

## Actions

- **Climate** (dial): rotate to choose a target temperature, by 0.5 or 1 degree per notch (settings), kept in the range of the current mode. Nothing is sent while you rotate: the strip shows the choice in color under "À VALIDER", with the current target in small. Push the dial briefly to apply it, or hold it for 600 ms to cancel it; a choice left alone is cancelled after 10 seconds, when the unit changes mode, and when the dial goes away. Pushing without a choice does nothing, and the dial never turns the unit on or off. The strip shows the room temperature, the target (a dash in dry and fan mode), the mode and the outdoor temperature. Tapping it does nothing.
- **Ventilation** (dial): rotate to move the fan rate through auto, silent, 1 to 5, stopping at both ends; several notches make one change. Push the dial to switch the swing between fixed and both directions. The strip shows the fan rate and the swing state.
- **Info** (dial): shows the outdoor temperature, whether the compressor runs, and the special modes that are active. It reacts to nothing.
- **Energy** (dial): shows the energy used today and over the last 7 days in kWh, with the heat and cool split of each. The unit is asked at most every 10 minutes. It reacts to nothing.
- **Power**: turns the unit on or off, lights up while it is on and shows the room temperature.
- **Preset**: sets a mode, a temperature and a fan rate, each optional. With a mode, a press turns the unit on in that mode; without one it only sets the temperature and the fan rate of the current mode and leaves the power alone. It lights up while the unit is on and matches every field of the preset. A temperature outside the range of the mode (18 to 32 in cool, 10 to 30 in heat, 18 to 30 in auto), or a temperature with dry or fan, makes the key unavailable. The default label is the mode and the temperature.
- **Special mode**: switches the powerful or the econo mode (settings). It lights up while the mode is active and the unit is on. While the unit is off, a press only shows an alert.
- **Fan**: with the **Fan rate** control, each press goes to the next rate (auto, silent, 1 to 5, then auto again) and several presses in a row become one change; it shows the displayed rate. With the **Swing** control, a press switches the swing on (both directions) and off, and the key lights up while the unit swings.

The strips of the dials have a background tinted by what the unit does: warm in heat, blue in cool, teal in auto, dry and fan, grey while the unit is off or not reachable.

After 5 seconds without touching a dial, the four dials show one dashboard across the whole touch strip while the unit is reachable: the room temperature, the mode and target (or that the unit is off) with the active special modes, the outdoor temperature and the compressor, and the fan rate with today's energy. The first touch on a dial only brings the dials back, without changing anything; keys do not count as activity. A column with no dial of this plugin is left as it is, and a target being chosen with the Climate dial is cancelled when the dashboard shows.

Every press sends an absolute value computed from what the key shows, never a toggle the unit resolves later. While the unit is not ready (no address, still reading, or no answer) the keys show as unavailable and a press shows an alert.

## How it talks to the unit

The plugin reads the unit every 15 seconds while a key or dial is visible, and backs off up to one minute while the unit does not answer. Changes asked in a burst (turning the dial, pressing the fan key several times) are shown at once and sent as one write after a short pause. The protocol is described in [docs/daikin_local_api.md](docs/daikin_local_api.md).
