import { describe, expect, it } from 'vitest';

import { readVolumeTarget } from './read_volume_target';

describe('readVolumeTarget', () => {
	it('should default to Spotify', () => {
		expect(readVolumeTarget({})).toEqual({ kind: 'spotify' });
	});

	it('should default to Spotify for invalid settings', () => {
		expect(readVolumeTarget({ target: 'radio' })).toEqual({ kind: 'spotify' });
	});

	it('should read the foreground app target', () => {
		expect(readVolumeTarget({ target: 'focused' })).toEqual({
			kind: 'focused',
		});
	});

	it('should read the picked app', () => {
		expect(
			readVolumeTarget({ target: 'app', appImageName: ' Discord.exe ' })
		).toEqual({ kind: 'app', imageName: 'Discord.exe' });
	});

	it('should read an app target without a picked app', () => {
		expect(readVolumeTarget({ target: 'app', appImageName: '' })).toEqual({
			kind: 'app',
			imageName: undefined,
		});
	});
});
