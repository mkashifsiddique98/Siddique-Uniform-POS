const fs = require('fs');
const path = require('path');

function routeFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return routeFiles(entryPath);
    return entry.name === 'route.ts' ? [entryPath] : [];
  });
}

test('every API route except login has an explicit auth guard', () => {
  const apiRoot = path.join(process.cwd(), 'src', 'app', 'api');
  const unguarded = routeFiles(apiRoot)
    .filter((filePath) => !filePath.endsWith(path.join('users', 'login', 'route.ts')))
    .filter((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8');
      return !source.includes('requireAuth') && !source.includes('getVerifiedUser');
    });

  expect(unguarded).toEqual([]);
});
