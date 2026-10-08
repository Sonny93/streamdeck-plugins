/** Constants of the `.streamDeckProfile` format, as the Stream Deck app writes it for a Stream Deck +. */
export const ProfileFormat = {
	appVersion: '7.5.0.22885',
	deviceModel: '20GBD9901',
	deviceSettings: null,
	formatVersion: 1,
	osType: 'Windows',
	osVersion: '10.0.26200',
	profileVersion: '3.0',
	currentPageUuid: '00000000-0000-0000-0000-000000000000',
	profilesDirectory: 'Profiles',
	profileDirectorySuffix: '.sdProfile',
	imagesDirectory: 'Images',
	manifestFile: 'manifest.json',
	packageFile: 'package.json',
	keypadType: 'Keypad',
	encoderType: 'Encoder',
} as const;
