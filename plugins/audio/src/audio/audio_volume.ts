/** Master volume of a device, `level` going from 0 to 1. */
export type AudioVolume = Readonly<{ level: number; isMuted: boolean }>;
