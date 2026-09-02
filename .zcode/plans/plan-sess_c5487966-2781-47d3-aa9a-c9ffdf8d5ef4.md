## 先回答：admin-e2e 是什么

`apps/admin-e2e` 是 **`apps/admin` 这个 NestJS 后端应用（端口 3001）的端到端测试工程**，与 `apps/api-e2e`（对应 `apps/api`，端口 3000）成对，由 Nx 的 `@nx/nest` 生成器自动产出。它用 Jest + axios 对**真实启动的服务**打 HTTP 请求（`e2e` target 会先 `build` + `serve` 起服务，`global-setup` 等待端口开放，`global-teardown` 关闭端口）。注意：当前 `admin`/`api` 都是 NestJS 后端（不是前端管理后台），两者结构几乎重复。

顺带发现一个 bug：`apps/admin-e2e/src/support/global-teardown.ts` 关闭端口写死 `3000`，但 admin 实际端口是 `3001`（setup/test-setup 都用 3001，只有 teardown 错），导致 e2e 跑完后 admin 服务端口不会被正确清理。本次一并修复。

## 配置统一方案（深度统一）

机制依据（已读 Nx 插件源码确认）：
- ESLint 插件 glob 含 `**/package.json`，且源码明确「子项目无 eslint 配置时，自动用根配置生成 lint target」→ 子项目 eslint 文件**可全删**。
- Jest 插件靠 `**/jest.config.*` 推断 test target、webpack 插件靠 `**/webpack.config.*` 推断 build/serve → 这些入口文件**不能删**，但内容可收敛为几行薄封装。
- tsconfig 的 `outDir/rootDir/include` 等相对路径按 TS 规则相对「定义它们的文件」解析，上提到根会错误解析到根目录 → **tsconfig 维持现状**（本就统一 `extends tsconfig.base.json`）。

### 新增（根目录，3 个共享文件）
1. **`jest.shared-config.js`**（CJS）：导出
   - `createUnitJestConfig(displayName)`：含 preset、`testEnvironment:'node'`、`@swc/jest` transform、Nest12 ESM 适配的 `transformIgnorePatterns`、moduleFileExtensions、coverageDirectory；preset 用 `require.resolve('./jest.preset.js')`，swc 配置读根 `.spec.swcrc`。
   - `createE2eJestConfig(displayName)`：额外含 `globalSetup/globalTeardown/setupFiles`（用 `<rootDir>/src/support/...`，`<rootDir>` 仍指向各 e2e 工程目录）。
2. **`.spec.swcrc`**（根）：现有 5 份内容完全相同，合一放到根（工厂用 `__dirname` 读取根这份）。
3. **`webpack.shared.js`**（CJS）：导出 `createNestAppWebpackConfig({ root })`，内含 `NxAppWebpackPlugin`（target node、main `./src/main.ts`、tsConfig `./tsconfig.app.json`、assets 等），`output.path` 用 `join(root,'dist')` 并显式设 `context: root`，避免依赖 `process.cwd()`。

### 修改根配置
4. **`eslint.config.mjs`**：把 `libs/common` 独有的 JSON `@nx/dependency-checks` 规则块上移到根（改为 async flat config，`languageOptions.parser` 用 `jsonc-eslint-parser`），全 workspace 统一生效。
5. **`README.md`**：更新「已知适配说明」与目录结构，说明共享配置位置（新工程引用根工厂即可）。

### 子项目改为薄封装
6. `apps/admin/jest.config.cts` → `module.exports = createUnitJestConfig('admin')`（3 行）
7. `apps/api/jest.config.cts` → `createUnitJestConfig('api')`
8. `libs/common/jest.config.cts` → `createUnitJestConfig('@app/common')`
9. `apps/admin-e2e/jest.config.cts` → 改用 CJS `module.exports = createE2eJestConfig('admin-e2e')`（当前 .cts 里混用 `export default`，统一为 CJS）
10. `apps/api-e2e/jest.config.cts` → `createE2eJestConfig('api-e2e')`
11. `apps/admin/webpack.config.js` → 2 行：`createNestAppWebpackConfig({ root: __dirname })`
12. `apps/api/webpack.config.js` → 同上
13. `apps/admin-e2e/src/support/global-teardown.ts`：默认端口 `3000` → `3001`（bug 修复）

### 删除（20 个重复文件中的 10 个）
- 5 个子项目 `eslint.config.mjs`：`apps/admin`、`apps/api`、`apps/admin-e2e`、`apps/api-e2e`、`libs/common`
- 5 个子项目 `.spec.swcrc`：`apps/admin`、`apps/api`、`apps/admin-e2e`、`apps/api-e2e`、`libs/common`

### 可能的连带修正
- ESLint `@nx/dependency-checks` 上移根后会检查 e2e 的 package.json；`admin-e2e`/`api-e2e` 的 support 文件 import 了 `@nx/node/utils` 但未在各自 package.json 声明。若 lint 报缺失，给这两个 e2e package.json 的 devDependencies 补 `"@nx/node": "23.1.3"`（根已安装该版本）。

### 不动
- 所有 `tsconfig*.json`（已统一 extends base；路径项无法安全上移）
- 各 `package.json` 的 `nx.targets`、`nx.json`、`jest.preset.js`（被共享工厂复用）

## 验证（实施后依次执行）
1. `pnpm nx run-many -t lint` —— 验证删 eslint 文件后 lint target 仍由根配置生成、dependency-checks 通过
2. `pnpm nx run-many -t test` —— 验证 jest 工厂 + 根 swcrc 生效
3. `pnpm nx run-many -t build` —— 验证 webpack 共享工厂产出到各 app `dist/`
4. `pnpm nx run-many -t typecheck` —— 验证 tsconfig 未受影响
5. `pnpm nx e2e api-e2e`（smoke）—— 验证 e2e 配置改 CJS 后仍能起服务跑通

统一后每个子项目只剩 Nx 推断必需的薄入口（jest.config 约 3 行、webpack.config 约 2 行、tsconfig 路径项），所有规则/预设/swc 配置都收口到根目录一份。