import type { Guid } from './guid';

/** The subset of the Win32 cfgmgr32 API needed to find device interfaces. */
export type Cfgmgr32 = Readonly<{
	/** Lists the paths of the present device interfaces of a class. */
	listDeviceInterfaces: (interfaceClass: Guid) => string[];
}>;
