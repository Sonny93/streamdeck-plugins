import { describe, expect, it, vi } from 'vitest';

import type { AudioApp } from '../audio/audio_app';
import type { ForegroundApp } from '../audio/foreground_app';
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
		foregroundApp?: ForegroundApp;
	}> = {}
) {
	const mixer = {
		listApps: vi.fn(() => Promise.resolve([...(options.apps ?? [SPOTIFY])])),
		updateApp: vi.fn(() => Promise.resolve(true)),
		readForegroundApp: vi.fn((_options?: unknown) =>
			Promise.resolve(
				options.foregroundApp ??
					(options.foreground === undefined
						? undefined
						: { imageName: options.foreground })
			)
		),
	};
	return { controller: new VolumeController(mixer, 'Spotify.exe'), mixer };
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

	it('should share one mixer listing between reads in flight', async () => {
		const { controller, mixer } = buildController();

		await Promise.all([
			controller.read({ kind: 'spotify' }),
			controller.read({ kind: 'spotify' }),
		]);

		expect(mixer.listApps).toHaveBeenCalledOnce();
	});

	it('should list again once the previous listing is done', async () => {
		const { controller, mixer } = buildController();

		await controller.read({ kind: 'spotify' });
		await controller.read({ kind: 'spotify' });

		expect(mixer.listApps).toHaveBeenCalledTimes(2);
	});

	it('should read the foreground app without the cache when changing a volume', async () => {
		const { controller, mixer } = buildController({
			apps: [DISCORD],
			foreground: 'discord.exe',
		});

		await controller.adjust({ kind: 'focused' }, 1);

		expect(mixer.readForegroundApp).toHaveBeenCalledWith({
			isFresh: true,
		});
	});

	it('should read the foreground app without the cache when toggling mute', async () => {
		const { controller, mixer } = buildController({
			apps: [DISCORD],
			foreground: 'discord.exe',
		});

		await controller.toggleMute({ kind: 'focused' });

		expect(mixer.readForegroundApp).toHaveBeenCalledWith({
			isFresh: true,
		});
	});

	it('should read the foreground app with the cache when drawing', async () => {
		const { controller, mixer } = buildController({
			foreground: 'discord.exe',
		});

		await controller.read({ kind: 'focused' });

		expect(mixer.readForegroundApp).toHaveBeenCalledWith({});
	});

	it('should find the focused app by its process and name it after its audio stream', async () => {
		const game: AudioApp = {
			imageName: 'BeamNG.drive.x64',
			displayName: 'BeamNG.drive',
			volume: 0.4,
			isMuted: false,
			processIds: [49_021],
		};
		const { controller } = buildController({
			apps: [SPOTIFY, game],
			foregroundApp: { imageName: '===>>> BeamNGMa', processId: 49_021 },
		});

		expect(await controller.read({ kind: 'focused' })).toMatchObject({
			name: 'BeamNG.drive',
			volume: 0.4,
		});
	});

	it('should change the volume of the audio app found by process, under its own image name', async () => {
		const game: AudioApp = {
			imageName: 'BeamNG.drive.x64',
			displayName: 'BeamNG.drive',
			volume: 0.4,
			isMuted: false,
			processIds: [49_021],
		};
		const { controller, mixer } = buildController({
			apps: [game],
			foregroundApp: { imageName: '===>>> BeamNGMa', processId: 49_021 },
		});

		await controller.toggleMute({ kind: 'focused' });

		expect(mixer.updateApp).toHaveBeenCalledWith('BeamNG.drive.x64', {
			isMuted: true,
		});
	});
});
