import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';

const IMAGES_FOLDER = 'Images';

/** Deletes the files of a page's `Images/` folder that its manifest text no longer mentions. */
export async function removeUnusedPageImages(
	options: Readonly<{ pageDirectory: string; manifestText: string }>
): Promise<void> {
	const imagesDirectory = path.join(options.pageDirectory, IMAGES_FOLDER);
	const images = await readdir(imagesDirectory).catch(() => []);
	await Promise.all(
		images
			.filter(
				(image) => !options.manifestText.includes(`${IMAGES_FOLDER}/${image}`)
			)
			.map((image) => rm(path.join(imagesDirectory, image), { force: true }))
	);
}
