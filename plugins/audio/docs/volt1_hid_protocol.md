# Universal Audio Volt 1: vendor HID protocol

Deduced by observation (no official documentation). The PowerShell scripts in `tools/volt1/` are the original experiments.

## Device

- USB `VID_2B5A&PID_0020`, vendor HID collection on interface `MI_06` (usage page `0xFF01`).
- Found through `CM_Get_Device_Interface_ListW` on `GUID_DEVINTERFACE_HID`, then opened with `CreateFileW`.
- Input reports are 40 bytes, output reports 17 bytes, no feature reports.
- The plugin opens one read-only and one write-only handle: a synchronous `ReadFile` blocks its handle until the next report.

## State report (input `0x02`)

| Byte  | Meaning                                                                                              |
| ----- | ---------------------------------------------------------------------------------------------------- |
| 0     | Report id `0x02`                                                                                     |
| 1     | Button states: `0x08` = 48V, `0x10` = MONITOR, `0x40` = VINTAGE (`0x01` always set, meaning unknown) |
| 12–13 | Change on their own while sound plays, probably meter bits                                           |
| 14–20 | ASCII serial number                                                                                  |

The Volt 1 sends this report **only when something changes**: its meters while sound plays, and every button change.
A silent Volt 1 sends nothing, and `HidD_GetInputReport` is refused (Win32 error 31): the state cannot be asked for.
The plugin therefore stays in a `waitingForState` status, keys dimmed, until the first report.

Every button change, pressed on the Volt 1 or applied by a settings report, sends input report `0x01` and then a state report.
Byte 1 of report `0x01` holds the settings in the layout of the settings report below (`0x04` = MONITOR, `0x40` = VINTAGE).

## Settings report (output `0x10`)

| Byte | Meaning                                                             |
| ---- | ------------------------------------------------------------------- |
| 0    | Report id `0x10`                                                    |
| 1    | Settings to apply: `0x02` = 48V, `0x04` = MONITOR, `0x40` = VINTAGE |

- The report sets **every** button at once, and the Volt 1 applies a single change per report.
  Copy the current state and flip one bit only; never send it without a known state (it could switch 48V).
- Output report `0x20` changes the announced state without changing the sound: do not use it.
- Other output report ids exist (`0x18`, `0x28`, `0x48`, `0xE0`–`0xE4`, `0xE8`, `0xF0`) and are untested.
