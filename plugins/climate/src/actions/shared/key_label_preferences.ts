/** What the user typed for the label of a key, read from its settings: the text, if any, and where it goes. The default text depends on the language, so it is resolved when the key is drawn. */
export type KeyLabelPreferences = Readonly<{
	typedText: string | undefined;
	position: 'top' | 'bottom';
}>;
