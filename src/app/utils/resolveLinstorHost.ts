/**
 * Parse and store the host parameter from URL.
 * @param hostParam The host string from query.
 * @param baseOrigin The base origin, usually window.location.origin.
 * @returns The resolved absolute host string, or undefined if invalid.
 */
export function resolveAndStoreLinstorHost(
  hostParam: string,
  baseOrigin: string = window.location.origin,
): string | undefined {
  if (!hostParam) return undefined;
  let host = hostParam;
  try {
    try {
      host = decodeURIComponent(host);
    } catch {
      // ignore decode error
      console.log('Failed to decode host parameter, using raw value:', host);
    }
    let resolvedHost = new URL(host, baseOrigin).toString();
    // Remove trailing slash if exists
    resolvedHost = resolvedHost.endsWith('/') ? resolvedHost.slice(0, -1) : resolvedHost;
    window.localStorage.setItem('LINSTOR_HOST', resolvedHost);
    return resolvedHost;
  } catch {
    // invalid host
    return undefined;
  }
}
