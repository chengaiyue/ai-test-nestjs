// 根目录共享的 Jest 配置工厂。
// 各工程的 jest.config.cts 仅保留 Nx 推断所需的入口，调用这里的工厂生成实际配置。
// 注意：jest 的 preset 路径必须相对「工程 rootDir」且以 '.' 开头
// （绝对路径会被 jest 当作模块名解析，见 jest-config 的 setupPreset），
// 因此工厂需要接收工程目录 projectRoot 来计算相对路径。
const { readFileSync } = require('fs');
const { join, relative } = require('path');

// 本文件位于 workspace 根目录
const workspaceRoot = __dirname;

function loadSwcJestConfig() {
  // 读取根目录共享的 SWC 编译配置（spec 文件用），并禁用 SWC 自身的 .swcrc 查找
  const swcJestConfig = JSON.parse(
    readFileSync(join(workspaceRoot, '.spec.swcrc'), 'utf-8')
  );
  swcJestConfig.swcrc = false;
  return swcJestConfig;
}

// 计算从工程目录到根 jest.preset.js 的相对路径（保证以 './' 或 '../' 开头）
function resolvePreset(projectRoot) {
  const rel = relative(projectRoot, join(workspaceRoot, 'jest.preset.js'));
  return rel.startsWith('.') ? rel : `./${rel}`;
}

// Nest 12 以 ESM 发布；pnpm 下真实路径在 node_modules/.pnpm，
// 需让 @swc/jest 转译 @nestjs 包（及 @app workspace 库）从 ESM 到 CJS。
const nestEsmTransformIgnorePatterns = [
  '/node_modules/\\.pnpm/(?!@nestjs\\+)',
  '/node_modules/(?!\\.pnpm/|@nestjs/|@app/)',
];

function createBaseJestConfig(displayName, projectRoot) {
  return {
    displayName,
    preset: resolvePreset(projectRoot),
    testEnvironment: 'node',
    transform: {
      '^.+\\.[tj]s$': ['@swc/jest', loadSwcJestConfig()],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: 'test-output/jest/coverage',
  };
}

// 单元测试工程（apps/*、libs/*）：需要转译 Nest 12 的 ESM 产物
function createUnitJestConfig(displayName, projectRoot) {
  return {
    ...createBaseJestConfig(displayName, projectRoot),
    transformIgnorePatterns: nestEsmTransformIgnorePatterns,
  };
}

// e2e 工程：针对真实启动的服务发 HTTP 请求，附带全局 setup/teardown
function createE2eJestConfig(displayName, projectRoot) {
  return {
    ...createBaseJestConfig(displayName, projectRoot),
    globalSetup: '<rootDir>/src/support/global-setup.ts',
    globalTeardown: '<rootDir>/src/support/global-teardown.ts',
    setupFiles: ['<rootDir>/src/support/test-setup.ts'],
  };
}

module.exports = { createUnitJestConfig, createE2eJestConfig };
