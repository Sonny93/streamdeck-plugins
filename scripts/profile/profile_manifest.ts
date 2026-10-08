/** The `manifest.json` of a profile: its device, name and pages. */
export type ProfileManifest = Readonly<{
	Device: Readonly<{ Model: string; UUID: string }>;
	Name: string;
	Pages: Readonly<{
		Current: string;
		Default: string;
		Pages: readonly string[];
	}>;
	Version: string;
}>;
