const nextJest = require('next/jest');

// next/jest wires up SWC (TS/TSX support, @/ path alias, .env loading) so tests
// can cover TypeScript modules too, while staying compatible with the existing .test.js files.
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.test.ts'],
};

module.exports = createJestConfig(customJestConfig);
