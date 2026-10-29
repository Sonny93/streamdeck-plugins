import type { KeyState } from './key_state';

/** One of the manifest state indexes of the keys of the plugin. */
export type KeyStateValue = (typeof KeyState)[keyof typeof KeyState];
