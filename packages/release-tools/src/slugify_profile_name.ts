import { InvalidProfileError } from './invalid_profile_error.ts';

const ACCENT_MARKS = /\p{M}/gu;
const NON_ALPHANUMERIC_RUNS = /[^a-z0-9]+/gu;
const EDGE_DASHES = /^-+|-+$/gu;

/** Turns a profile name such as "Spotify Deck" into a folder name such as `spotify-deck`. */
export function slugifyProfileName(
	options: Readonly<{ name: string }>
): string {
	const slug = options.name
		.normalize('NFKD')
		.replace(ACCENT_MARKS, '')
		.toLowerCase()
		.replace(NON_ALPHANUMERIC_RUNS, '-')
		.replace(EDGE_DASHES, '');
	if (slug === '') {
		throw new InvalidProfileError({
			reason: `The profile name ${JSON.stringify(options.name)} gives an empty folder name, pass a name`,
		});
	}
	return slug;
}
