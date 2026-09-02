// 全 workspace 唯一的 Jest 配置（多项目聚合）。
// 子目录不再有任何 jest.config.*；各 project 的具体配置由 jest.shared-config.js
// 的工厂生成，在这里以 projects 内联方式登记。
//   - 单元测试：pnpm test（jest --selectProjects 选中 3 个源码工程）
//   - e2e：由 Nx 的 e2e target 编排（先 build+serve 起服务），再用
//     jest --selectProjects 选中对应 e2e 工程，见各 *-e2e 的 package.json。
const { join } = require('path');
const {
  createUnitJestConfig,
  createE2eJestConfig,
} = require('./jest.shared-config');

const root = __dirname;

module.exports = {
  projects: [
    createUnitJestConfig('api', join(root, 'apps/api')),
    createUnitJestConfig('admin', join(root, 'apps/admin')),
    createUnitJestConfig('@app/common', join(root, 'libs/common')),
    createE2eJestConfig('api-e2e', join(root, 'apps/api-e2e')),
    createE2eJestConfig('admin-e2e', join(root, 'apps/admin-e2e')),
  ],
};
