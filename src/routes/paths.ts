import type { CollectionKind } from '../data/types';

export function homePath(kind: CollectionKind): string {
  return kind === 'drivers' ? '/' : `/${kind}`;
}

export function itemPath(kind: CollectionKind, id: string): string {
  return `/${kind}/${encodeURIComponent(id)}`;
}

export const COLLECTION_KINDS: readonly CollectionKind[] = ['drivers', 'teams'];

export function isCollectionKind(value: string | undefined): value is CollectionKind {
  return COLLECTION_KINDS.includes(value as CollectionKind);
}
