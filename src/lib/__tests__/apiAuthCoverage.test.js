const fs = require('fs');
const path = require('path');

function routeFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return routeFiles(entryPath);
    return entry.name === 'route.ts' ? [entryPath] : [];
  });
}

const HANDLER_RE = /export\s+(?:async\s+function|const)\s+(GET|POST|PUT|PATCH|DELETE)\b/g;

function apiRoutes() {
  const apiRoot = path.join(process.cwd(), 'src', 'app', 'api');
  return routeFiles(apiRoot).filter(
    (filePath) =>
      !filePath.endsWith(path.join('users', 'login', 'route.ts')) &&
      // public liveness probe: no auth, no DB (middleware also lets it through)
      !filePath.endsWith(path.join('health', 'route.ts'))
  );
}

test('every API route except login has an explicit auth guard', () => {
  const unguarded = apiRoutes().filter((filePath) => {
    const source = fs.readFileSync(filePath, 'utf8');
    return !source.includes('requireAuth');
  });

  expect(unguarded).toEqual([]);
});

test('every exported handler calls requireAuth', () => {
  const missing = apiRoutes().filter((filePath) => {
    const source = fs.readFileSync(filePath, 'utf8');
    const handlers = (source.match(HANDLER_RE) || []).length;
    const guards = (source.match(/await\s+requireAuth\(/g) || []).length;
    return guards < handlers;
  });

  expect(missing).toEqual([]);
});

test('no route uses the legacy getVerifiedUser helper', () => {
  const legacy = apiRoutes().filter((filePath) =>
    fs.readFileSync(filePath, 'utf8').includes('getVerifiedUser')
  );

  expect(legacy).toEqual([]);
});

test('the web update route (git/npm from HTTP) no longer exists', () => {
  expect(fs.existsSync(path.join(process.cwd(), 'src', 'app', 'api', 'setting', 'route.ts'))).toBe(false);
});
