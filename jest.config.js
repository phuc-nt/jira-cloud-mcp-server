/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**/*.ts',
  ],
  testMatch: [
    '**/src/tests/unit/**/*.test.ts',
    '**/src/tests/integration/**/*.test.ts',
    '**/src/tests/e2e/**/*.test.ts'
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
}; 