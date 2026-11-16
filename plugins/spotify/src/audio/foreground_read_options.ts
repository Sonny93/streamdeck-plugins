/** `isFresh` asks for a reading that skips any cache, for the changes that must hit the app in the foreground right now. */
export type ForegroundReadOptions = Readonly<{ isFresh?: boolean }>;
