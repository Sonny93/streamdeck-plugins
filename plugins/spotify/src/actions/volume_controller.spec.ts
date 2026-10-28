import { describe, expect, it, vi } from 'vitest';

import type { AudioApp } from '../audio/audio_app';
import { VolumeController } from './volume_controller';

const SPOTIFY: AudioApp = {
	imageName: 'Spotify.exe',
	displayName: 'Spotify',
	volume: 0.5,
	isMuted: false,
};
const DISCORD: AudioApp = {
	imageName: 'Discord.exe',
	displayName: 'Discord',
	volume: 0.3,
	isMuted: true,
};

function buildController(
	options: Readonly<{
		apps?: readonly AudioApp[];
		foreground?: string;
	}> = {}
) {
	const mixer = {
		listApps: vi.fn(() => Promise.resolve([...(options.apps ?? [SPOTIFY])])),
		updateApp: vi.fn(() => Promise.resolve(true)),
		readForegroundImageName: vi.fn(() => Promise.resolve(options.foreground)),
	};
	return { controller: new VolumeController(mixer), mixer };
}

describe('VolumeController', () => {
	it('should read the volume of Spotify', async () => {
		const { controller } = buildController();

		expect(await controller.read({ kind: 'spotify' })).toEqual({
			caption: 'SPOTIFY',
			name: 'Spotify',
			volume: 0.5,
			isMuted: false,
		});
	});

	it('should read the volume of the app in the foreground', async () => {
		const { controller } = buildController({
			apps: [SPOTIFY, DISCORD],
			foreground: 'discord.exe',
		});

		expect(await controller.read({ kind: 'focused' })).toEqual({
			caption: 'FOCUSED APP',
			name: 'Discord',
			volume: 0.3,
			isMuted: true,
		});
	});

	it('should name the foreground app even when it plays no sound', async () => {
		const { controller } = buildController({ foreground: 'explorer.exe' });

		expect(await controller.read({ kind: 'focused' })).toMatchObject({
			name: 'Explorer',
			volume: undefined,
		});
	});

	it('should ask to pick an app when none is picked', async () => {
		const { controller } = buildController();

		expect(
			await controller.read({ kind: 'app', imageName: undefined })
		).toMatchObject({ caption: 'APP', name: 'Pick an app', volume: undefined });
	});

	it('should move the volume by one step per tick and unmute', async () => {
		const { controller, mixer } = buildController();

		await controller.adjust({ kind: 'spotify' }, 3);

		expect(mixer.updateApp).toHaveBeenCalledWith('Spotify.exe', {
			volume: 0.56,
			isMuted: false,
		});
	});

	it('should snap the volume to the step grid', async () => {
		const { controller, mixer } = buildController({
			apps: [{ ...SPOTIFY, volume: 0.137 }],
		});

		await controller.adjust({ kind: 'spotify' }, -1);

		expect(mixer.updateApp).toHaveBeenCalledWith('Spotify.exe', {
			volume: 0.12,
			isMuted: false,
		});
	});

	it('should keep the volume within 0 and 1', async () => {
		const { controller, mixer } = buildController({
			apps: [{ ...SPOTIFY, volume: 0.99 }],
		});

		await controller.adjust({ kind: 'spotify' }, 5);

		expect(mixer.updateApp).toHaveBeenCalledWith('Spotify.exe', {
			volume: 1,
			isMuted: false,
		});
	});

	it('should not change an app that plays no sound', async () => {
		const { controller, mixer } = buildController({ apps: [] });

		expect(await controller.adjust({ kind: 'spotify' }, 1)).toBe(false);
		expect(mixer.updateApp).not.toHaveBeenCalled();
	});

	it('should toggle the mute state of the picked app', async () => {
		const { controller, mixer } = buildController({ apps: [DISCORD] });

		await controller.toggleMute({ kind: 'app', imageName: 'Discord.exe' });

		expect(mixer.updateApp).toHaveBeenCalledWith('Discord.exe', {
			isMuted: false,
		});
	});

	it('should not toggle anything when no app is picked', async () => {
		const { controller, mixer } = buildController();

		expect(
			await controller.toggleMute({ kind: 'app', imageName: undefined })
		).toBe(false);
		expect(mixer.updateApp).not.toHaveBeenCalled();
	});
});
