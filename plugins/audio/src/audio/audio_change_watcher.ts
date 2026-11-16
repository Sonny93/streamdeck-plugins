/** Starts telling when the system audio changed and returns the function that stops it; a watcher may report more than needed, never less. */
export type AudioChangeWatcher = (onChange: () => void) => () => void;
