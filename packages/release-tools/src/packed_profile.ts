/** A profile packed in several variants: its name, and for each variant the plugins it needs and its file, relative to the folder the profiles ship in. */
export type PackedProfile = Readonly<{
	name: string;
	variants: readonly Readonly<{
		plugins: readonly string[];
		file: string;
	}>[];
}>;
