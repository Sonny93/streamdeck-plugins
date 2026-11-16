import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DRM_DIRECTORY = '/sys/class/drm';
const CARD_CONNECTOR = /^card\d+-(.+)$/u;

async function readEdidFile(file: string): Promise<Uint8Array | undefined> {
	try {
		const bytes = await readFile(file);
		return bytes.length === 0 ? undefined : Uint8Array.from(bytes);
	} catch {
		return undefined;
	}
}

/**
 * Reads the EDID the kernel exposes for a connector, such as `/sys/class/drm/card2-DP-4/edid`; `undefined` when there is none.
 * The path comes from the directory listing, not from the connector name, and the first card that has an EDID wins.
 */
export async function readConnectorEdid(
	connector: string,
	drmDirectory: string = DRM_DIRECTORY
): Promise<Uint8Array | undefined> {
	let entries: string[];
	try {
		entries = await readdir(drmDirectory);
	} catch {
		return undefined;
	}
	const candidates = await Promise.all(
		entries
			.filter((entry) => CARD_CONNECTOR.exec(entry)?.[1] === connector)
			.map((entry) => readEdidFile(path.join(drmDirectory, entry, 'edid')))
	);
	return candidates.find((bytes) => bytes !== undefined);
}
