import { mockDelay } from "./delay";
import { getOperationNameFromQuery } from "./operation";
import { mockHandlers } from "./handlers";

/**
 * Resolve a GraphQL operation against the mock handler registry.
 * Returns the same shape as a live `data` payload from execute()/executeRaw().
 */
export async function resolveMockGraphql<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const operationName = getOperationNameFromQuery(query);
  if (!operationName) {
    throw new Error("Mock GraphQL: could not determine operation name from query");
  }

  const handler = mockHandlers[operationName];
  if (!handler) {
    throw new Error(
      `Mock GraphQL: no handler for operation "${operationName}". Add one under lib/mocks/handlers.`
    );
  }

  await mockDelay();
  return handler(variables) as T;
}
