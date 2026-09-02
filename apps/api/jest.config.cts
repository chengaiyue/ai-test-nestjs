 
const { readFileSync } = require('fs')

// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(
  readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8')
);

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

module.exports = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig]
  },
  // Nest 12 ships ESM; under pnpm its real path is node_modules/.pnpm/@nestjs+...
  // Transform @nestjs packages (and the @app workspace lib) from ESM to CJS.
  transformIgnorePatterns: [
    '/node_modules/\\.pnpm/(?!@nestjs\\+)',
    '/node_modules/(?!\\.pnpm/|@nestjs/|@app/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: 'test-output/jest/coverage'
};
