import { describe, expect, it } from 'vitest';

import { parseDefaultExecutionContextId } from './parse_default_execution_context_id';

const CONTEXT_ID = 12;

function buildContextCreated(isDefault: boolean | undefined) {
	return {
		context: {
			id: CONTEXT_ID,
			auxData: isDefault === undefined ? undefined : { isDefault },
		},
	};
}

describe('parseDefaultExecutionContextId', () => {
	it('should return the context id when the context is a default one', () => {
		expect(parseDefaultExecutionContextId(buildContextCreated(true))).toBe(
			CONTEXT_ID
		);
	});

	it('should return undefined when the context is not a default one', () => {
		expect(
			parseDefaultExecutionContextId(buildContextCreated(false))
		).toBeUndefined();
	});

	it('should return undefined when the context has no auxiliary data', () => {
		expect(
			parseDefaultExecutionContextId(buildContextCreated(undefined))
		).toBeUndefined();
	});

	it('should return undefined when the params have an unexpected shape', () => {
		expect(parseDefaultExecutionContextId('nope')).toBeUndefined();
	});
});
