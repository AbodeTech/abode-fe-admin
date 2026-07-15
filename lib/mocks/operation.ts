import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { print } from "graphql";

const OPERATION_RE = /\b(?:query|mutation|subscription)\s+([A-Za-z_][A-Za-z0-9_]*)/;

export function getOperationNameFromQuery(query: string): string | null {
  const match = query.match(OPERATION_RE);
  return match?.[1] ?? null;
}

export function getOperationNameFromDocument(
  document: TypedDocumentNode<unknown, unknown>
): string | null {
  return getOperationNameFromQuery(print(document));
}
