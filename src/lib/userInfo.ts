// Shares one /api/users/user-info request between components that mount together (nav + page).
const TTL_MS = 60 * 1000;

let cached: { promise: Promise<any | null>; at: number } | null = null;

export function fetchUserInfo(): Promise<any | null> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.promise;
  const promise = fetch("/api/users/user-info")
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
  cached = { promise, at: Date.now() };
  // Do not keep failures around
  promise.then((data) => {
    if (data === null && cached?.promise === promise) cached = null;
  });
  return promise;
}

export function clearUserInfoCache(): void {
  cached = null;
}
