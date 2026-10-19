import { parse } from 'graphql';

/**
 * The v1 admin is a read-only archive: nothing on this branch may write to the API.
 * Pages hide their actions behind this flag, and the API clients refuse to send
 * mutations as a backstop for anything the UI misses.
 */
export const READ_ONLY = true;

export const READ_ONLY_MESSAGE = 'This admin is read-only. Changes are disabled.';

export class ReadOnlyError extends Error {
  constructor() {
    super(READ_ONLY_MESSAGE);
    this.name = 'ReadOnlyError';
  }
}

/** True when the GraphQL document contains a mutation operation. */
export function isMutation(query: string): boolean {
  try {
    return parse(query).definitions.some(
      (def) => def.kind === 'OperationDefinition' && def.operation === 'mutation'
    );
  } catch {
    // Unparseable documents fall back to a keyword check so nothing slips through.
    return /^\s*mutation\b/m.test(query);
  }
}

/** Throws when a mutation is attempted while the app is read-only. */
export function assertNotMutation(query: unknown): void {
  if (READ_ONLY && typeof query === 'string' && isMutation(query)) {
    throw new ReadOnlyError();
  }
}
