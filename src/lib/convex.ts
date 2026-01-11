// Convex client for SvelteKit
const CONVEX_URL =
  import.meta.env.PUBLIC_CONVEX_URL ||
  import.meta.env.CONVEX_URL ||
  (typeof globalThis !== 'undefined' && 'process' in globalThis
    ? (globalThis as any).process?.env?.CONVEX_URL
    : undefined) ||
  'https://rare-panther-467.convex.cloud';

export async function convexQuery<T = unknown>(
  functionPath: string, 
  args: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: functionPath, args, format: 'json' }),
  });
  const data = await response.json();
  if (data.status === 'error') throw new Error(data.errorMessage || 'Query failed');
  return data.value as T;
}

export async function convexMutation<T = unknown>(
  functionPath: string, 
  args: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: functionPath, args, format: 'json' }),
  });
  const data = await response.json();
  if (data.status === 'error') throw new Error(data.errorMessage || 'Mutation failed');
  return data.value as T;
}

export { CONVEX_URL };
