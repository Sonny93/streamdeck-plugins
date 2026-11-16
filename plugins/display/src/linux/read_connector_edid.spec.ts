import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { readConnectorEdid } from './read_connector_edid';

describe('readConnectorEdid', () => {
	let directory: string | undefined;

	afterEach(async () => {
		if (directory !== undefined) {
			await rm(directory, { recursive: true, force: true });
		}
	});

	async function createDrm(
		entries: Readonly<Record<string, Uint8Array>>
	): Promise<string> {
		directory = await mkdtemp(path.join(tmpdir(), 'drm-'));
		for (const [name, bytes] of Object.entries(entries)) {
			await mkdir(path.join(directory, name));
			await writeFile(path.join(directory, name, 'edid'), bytes);
		}
		return directory;
	}

	it('should read the EDID of the card that has the connector', async () => {
		const drm = await createDrm({
			'card2-DP-4': Uint8Array.of(1, 2, 3),
			'card2-DP-5': Uint8Array.of(9),
		});

		expect(await readConnectorEdid('DP-4', drm)).toEqual(
			Uint8Array.of(1, 2, 3)
		);
	});

	it('should skip a card whose connector has an empty EDID', async () => {
		const drm = await createDrm({
			'card1-DP-1': new Uint8Array(),
			'card2-DP-1': Uint8Array.of(7),
		});

		expect(await readConnectorEdid('DP-1', drm)).toEqual(Uint8Array.of(7));
	});

	it('should give nothing for an unknown connector or a missing folder', async () => {
		const drm = await createDrm({ 'card2-DP-4': Uint8Array.of(1) });

		expect(await readConnectorEdid('DP-9', drm)).toBeUndefined();
		expect(await readConnectorEdid('DP-4', `${drm}/missing`)).toBeUndefined();
	});
});
