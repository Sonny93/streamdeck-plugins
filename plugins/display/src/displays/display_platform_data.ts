import type { LinuxDisplayData } from './linux_display_data';
import type { WindowsDisplayData } from './windows_display_data';

/** The part of a monitor that belongs to the adapter that listed it; the shared code never reads it. */
export type DisplayPlatformData = WindowsDisplayData | LinuxDisplayData;
