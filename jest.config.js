module.exports = {
  // Only look for tests in the current directory
  roots: ['<rootDir>'],
  
  // Ignore these directories to prevent naming collisions and avoid scanning external projects
  modulePathIgnorePatterns: [
    '<rootDir>/.antigravity',
    '<rootDir>/.cursor',
    '<rootDir>/.vscode',
    'C:/Users/chara/Desktop/smart-weather-dashboard-project'
  ],

  // Also ignore them for test discovery
  testPathIgnorePatterns: [
    '/node_modules/',
    'full-suite.test.js',
    '\\.antigravity',
    '\\.cursor',
    '\\.vscode'
  ],

  // Ensure Jest doesn't try to crawl too high or index duplicate modules
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },

  // Coverage and display options
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  
  // Explicitly set the test environment
  testEnvironment: 'node',

  // Run these files after the environment has been set up
  setupFilesAfterEnv: ['<rootDir>/tests/setup/globalSetup.js'],

  // Global timeout for each test
  testTimeout: 30000
};
