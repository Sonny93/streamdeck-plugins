---
paths:
  - plugins/audio/**
---

# Audio Deck

- Never change the Volt 1's 48V setting: phantom power can damage gear. Each settings report copies the last known state and flips one button, and `VoltHub` refuses writes until a state report has arrived.
- The Volt 1 sends reports only on activity (meters, button presses), and `HidD_GetInputReport` fails with error 31, so the state cannot be polled: wait for the next report.
- Protocol facts live in `plugins/audio/docs/volt1_hid_protocol.md`: update it with any protocol change.
- koffi returns `void *` as a bigint. `koffi.decode(pointer, 'str16')` dereferences a pointer stored at `pointer` and crashes on a direct string pointer: use `koffi.decode.string16(pointer)` for that.
- Default Output relies on the undocumented `IPolicyConfig` COM interface, because Windows has no public API to change the default device.
