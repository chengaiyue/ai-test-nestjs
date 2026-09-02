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
├── tsconfig.base.json      # 所有工程 tsconfig 的统一基准（被各工程 extends）
├── eslint.config.mjs       # 全 workspace 唯一的 ESLint 配置（含 JSON 依赖检查）
├── jest.preset.js          # @nx/jest 预设
├── jest.shared-config.js   # Jest 配置工厂（createUnitJestConfig / createE2eJestConfig）
├── webpack.shared.js       # webpack 配置工厂（createNestAppWebpackConfig）
├── .spec.swcrc             # Jest spec 文件共用的 SWC 编译配置
├── pnpm-workspace.yaml
└── package.json
```

工程配置采用 TS solution 风格：每个工程用自己的 `package.json`（`nx.targets` 内联）描述，
并用各自的 `tsconfig.json` / `jest.config.cts` / `webpack.config.js` 作为 Nx 推断 target 的入口。
这些入口文件只保留几行薄封装，**实际规则全部收口到根目录共享文件**：

- Jest：`jest.config.cts` 仅调用 `jest.shared-config.js` 的工厂（单测传 `createUnitJestConfig`、
  e2e 传 `createE2eJestConfig`），SWC 配置统一读根 `.spec.swcrc`。
- webpack：app 的 `webpack.config.js` 仅调用 `webpack.shared.js` 的 `createNestAppWebpackConfig({ root: __dirname })`。
- ESLint：子工程不再放 `eslint.config.*`，Nx 自动用根 `eslint.config.mjs` 生成 lint target。
- tsconfig：各工程 `extends` 根 `tsconfig.base.json`；`outDir`/`rootDir`/`include` 等路径项
  按 TS 规则必须留在各工程（相对路径相对「定义它的文件」解析）。

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
pnpm build          # 构建（自动先构建依赖库）
pnpm test           # 单元测试
pnpm test:e2e       # e2e（会自动 build + serve 起服务）
pnpm lint           # ESLint
pnpm typecheck      # tsc --build 类型检查

# 针对单个工程
pnpm nx build api
pnpm nx test @app/common
pnpm nx lint admin
pnpm nx e2e api-e2e

# 依赖图 / 受影响的工程
pnpm graph          # 打开可视化任务图
pnpm nx show projects
pnpm nx affected -t build test lint
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
开发时经 TS custom condition 直接解析到 `libs/common/src`，构建时由 webpack/tsc 处理。

## 新增工程

```bash
# 新应用
pnpm nx g @nx/nest:application apps/<name> --unitTestRunner=jest --linter=eslint
# 新共享库（buildable，可自定义 import 别名）
pnpm nx g @nx/nest:library libs/<name> --buildable --importPath=@app/<name> \
  --unitTestRunner=jest --linter=eslint
```

新增库后运行 `pnpm nx sync` 同步 TS project references。

生成器会在每个工程落下各自的 `eslint.config.*`、`.spec.swcrc`、完整 `jest.config.*` / `webpack.config.*`，
为保持「一套配置」，新工程建好后请把它们收敛为薄封装：

- 删除工程内 `eslint.config.*` 与 `.spec.swcrc`（统一走根配置）；
- `jest.config.cts` 改为 `module.exports = createUnitJestConfig('<displayName>', __dirname)`
  （e2e 工程用 `createE2eJestConfig`），从 `../../jest.shared-config` 引入；
- app 的 `webpack.config.js` 改为 `createNestAppWebpackConfig({ root: __dirname })`，
  从 `../../webpack.shared` 引入。

## 已知适配说明

- `@nx/nest@23` 的 peer 依赖范围尚未更新到 Nest 12（声明 `<12.0.0`），插件本身与 Nest 12 兼容，
  已通过根目录 `.npmrc`（`strict-peer-dependencies=false`）放行该 peer 警告。
- Nest 12 以 ESM 发布，而 Nx 的 Jest 模板按 CJS 运行；根 `.spec.swcrc`（输出 commonjs）与
  `jest.shared-config.js`（`transformIgnorePatterns` 转译 `@nestjs`）已相应配置，新工程直接复用工厂即可。
- ESLint 的 `@nx/dependency-checks` 规则：库工程严格校验依赖声明；app 工程因 webpack 外置 node 依赖，
  `@nestjs/platform-express`、`reflect-metadata`、`rxjs`、`tslib` 属隐式运行时依赖（无静态 import），
  已在根 `eslint.config.mjs` 的 `ignoredDependencies` 中放行。
- e2e 工程的 `support/global-teardown.ts` 默认关闭端口需与应用端口一致（api=3000、admin=3001）。
