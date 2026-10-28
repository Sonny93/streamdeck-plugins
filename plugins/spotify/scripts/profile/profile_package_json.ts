/** The `package.json` at the root of a `.streamDeckProfile`: the app that wrote it, the device and the plugins it needs. */
export type ProfilePackageJson = Readonly<{
	AppVersion: string;
	DeviceModel: string;
	DeviceSettings: null;
	FormatVersion: number;
	OSType: string;
	OSVersion: string;
	RequiredPlugins: readonly string[];
}>;
