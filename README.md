# ai-test-nestjs

基于 **Nx** 构建系统的 NestJS 12 monorepo，使用 **pnpm** workspace 管理依赖。

## 技术栈

- **Nx 23**（`@nx/nest` / `@nx/webpack` / `@nx/jest` / `@nx/eslint`，crystal 插件自动推断 target）
- **NestJS 12**（ESM）
- **pnpm 9**（corepack 固定版本，workspace 协议链接内部库）
- TypeScript solution 布局（project references + `tsconfig.base.json`）
- 构建：apps 用 **webpack**（`@nx/webpack`），libs 用 **tsc**
- 测试：**Jest + @swc/jest**；Lint：**ESLint**

## 目录结构

```
.
├── apps/
│   ├── api/          # 主应用（默认端口 3000，全局前缀 /api）
│   ├── api-e2e/      # api 的 e2e 测试工程
│   ├── admin/        # 后台应用（默认端口 3001，全局前缀 /api）
│   └── admin-e2e/    # admin 的 e2e 测试工程
├── libs/
│   └── common/       # 共享库（CommonModule / CommonService），别名 @app/common
├── nx.json                 # Nx 配置（插件、targetDefaults、namedInputs、缓存）
├── tsconfig.json           # 全 workspace 唯一的 TS 配置（编译选项 + @app/common paths）
├── eslint.config.mjs       # 全 workspace 唯一的 ESLint 配置（含 JSON 依赖检查）
├── jest.config.js          # 全 workspace 唯一的 Jest 配置（projects 内联全部 5 个测试工程）
├── jest.preset.js          # @nx/jest 预设
├── jest.shared-config.js   # Jest 配置工厂（createUnitJestConfig / createE2eJestConfig）
├── webpack.shared.js       # webpack 配置工厂（createNestAppWebpackConfig）
├── .spec.swcrc             # Jest spec 文件共用的 SWC 编译配置
├── pnpm-workspace.yaml
└── package.json
```

每个工程用自己的 `package.json`（`nx.targets` 内联）描述，app 只保留 Nx 推断 build/serve 所必需的
`webpack.config.js` 薄入口。**tsconfig / jest / eslint 的配置全部收口到根目录，子目录一个都没有**：

- tsconfig：全仓库只有根目录一个 `tsconfig.json`（含编译选项与 `@app/common` 的 `paths`）。
  类型检查直接 `tsc --noEmit -p tsconfig.json`；webpack 的 `tsConfig` 也指向它。
- Jest：全仓库只有根目录一个 `jest.config.js`，用 `projects` 内联登记全部测试工程（每个工程的
  具体配置由 `jest.shared-config.js` 的工厂生成），SWC 配置统一读根 `.spec.swcrc`。单测
  `jest --selectProjects api admin @app/common`；e2e 由 Nx 的 `e2e` target 编排（先 build+serve
  起服务）再 `jest --selectProjects <name>-e2e`。
- webpack：app 的 `webpack.config.js` 仅调用 `webpack.shared.js` 的 `createNestAppWebpackConfig({ root: __dirname })`。
- ESLint：子工程不放 `eslint.config.*`，Nx 自动用根 `eslint.config.mjs` 生成 lint target。
- workspace 库 `@app/common` 为**源码直接消费**：不再独立 tsc 产出 dist，而是由 webpack / jest
  通过 `ai-test-nestjs` 自定义条件直接编译 TS 源码（webpack 的 `resolve.conditionNames`、
  jest 的 `testEnvironmentOptions.customExportConditions`），因此库无需自己的 tsconfig / build target。

## 快速开始

```bash
# 安装依赖（corepack 会自动使用 pnpm 9）
pnpm install

# 开发（watch 模式启动，带热重载）
pnpm serve:api      # 或：pnpm nx serve api
pnpm serve:admin    # 或：pnpm nx serve admin
```

应用默认端口：api `3000`、admin `3001`，可通过 `PORT` 环境变量覆盖（如 `PORT=4000 pnpm nx serve admin`）。
服务示例：`GET /api`（Hello API）、`GET /api/health`（来自 @app/common 的健康检查）。

## 常用命令

```bash
# 全量操作（所有工程）
pnpm build          # 构建（webpack 打包 app，自动连带源码库）
pnpm test           # 单元测试（jest --selectProjects 三个源码工程）
pnpm test:e2e       # e2e（会自动 build + serve 起服务）
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit 全仓库类型检查

# 针对单个工程
pnpm nx build api
npx jest --selectProjects @app/common   # 只跑某个工程的单测
pnpm nx lint admin
pnpm nx e2e api-e2e

# 依赖图 / 受影响的工程
pnpm graph          # 打开可视化任务图
pnpm nx show projects
pnpm nx affected -t build lint
```

## 在应用中使用共享库

```ts
// apps/api/src/app/app.module.ts
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule],
})
export class AppModule {}
```

`@app/common` 通过 pnpm `workspace:*` 协议链接（见 `apps/api/package.json`），
开发与构建时都经 `ai-test-nestjs` 自定义条件直接解析、编译 `libs/common/src` 的 TS 源码，
不预先产出 dist。

## 新增工程

```bash
# 新应用
pnpm nx g @nx/nest:application apps/<name> --unitTestRunner=jest --linter=eslint
# 新共享库（源码直接消费、非 buildable，自定义 import 别名）
pnpm nx g @nx/nest:library libs/<name> --importPath=@app/<name> \
  --unitTestRunner=jest --linter=eslint
```

生成器会在每个工程落下各自的 `tsconfig*.json`、`eslint.config.*`、`.spec.swcrc`、
`jest.config.*`、`webpack.config.*`。为保持「一套配置」，新工程建好后请做以下收敛：

- 删除工程内所有 `tsconfig*.json`、`eslint.config.*`、`.spec.swcrc`、`jest.config.*`
  （统一走根配置，子目录不留任何 ts/jest/eslint 配置）；
- 在根 `tsconfig.json` 的 `compilerOptions.paths` 中登记新库别名（如
  `"@app/<name>": ["libs/<name>/src/index.ts"]`），无需 `pnpm nx sync`；
- 在根 `jest.config.js` 的 `projects` 数组登记一行（单测工程用
  `createUnitJestConfig('<displayName>', join(root, '<projectRoot>'))`，
  e2e 工程用 `createE2eJestConfig`）；
- app 的 `webpack.config.js` 改为 `createNestAppWebpackConfig({ root: __dirname })`，
  从 `../../webpack.shared` 引入（这是 app 唯一保留的工程级薄入口，供 Nx 推断 build/serve）；
- e2e 工程的 `e2e` target 用 `nx:run-commands` 跑
  `jest --selectProjects <displayName> --passWithNoTests`，`dependsOn` 指向对应 app 的 build+serve。

## 已知适配说明

- `@nx/nest@23` 的 peer 依赖范围尚未更新到 Nest 12（声明 `<12.0.0`），插件本身与 Nest 12 兼容，
  已通过根目录 `.npmrc`（`strict-peer-dependencies=false`）放行该 peer 警告。
- Nest 12 以 ESM 发布，而 Jest 按 CJS 运行；根 `.spec.swcrc`（输出 commonjs）与
  `jest.shared-config.js`（`transformIgnorePatterns` 转译 `@nestjs`、`customExportConditions`
  解析 workspace 库源码）已相应配置。Jest 不经 Nx 的 `@nx/jest` 插件推断（`nx.json` 中未启用）：
  单测直接用根 `jest.config.js` 以 `projects` 多项目方式运行，e2e 由 `e2e` target 编排。
- ESLint 的 `@nx/dependency-checks` 规则：库工程严格校验依赖声明；app 工程因 webpack 外置 node 依赖，
  `@nestjs/platform-express`、`reflect-metadata`、`rxjs`、`tslib` 属隐式运行时依赖（无静态 import），
  且 `@app/common` 是源码直接消费、无独立 build target 的 workspace 库，均已在根
  `eslint.config.mjs` 的 app 段 `ignoredDependencies` 中放行（库仍严格校验）。
- `@nx/js/typescript` 插件在 `nx.json` 中保留（用于分析 TS import 构建项目图依赖边），
  但关闭了它的 target 推断（`typecheck: false`、`build: false`）——类型检查统一走根 `tsc`，
  库不再独立 tsc 构建。
- e2e 工程的 `support/global-teardown.ts` 默认关闭端口需与应用端口一致（api=3000、admin=3001）。
