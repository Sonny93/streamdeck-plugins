/** The app owning the foreground window: its executable name and, when the OS tells, the id of its process. */
export type ForegroundApp = Readonly<{
	imageName: string;
	processId?: number;
}>;
