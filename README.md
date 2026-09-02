# ai-test-nestjs

NestJS 12 monorepo 工作区（Nest CLI 标准 monorepo 模式），采用 `apps/` + `libs/` 结构。

## 目录结构

```
.
├── apps/
│   ├── api/        # 主应用（默认项目，端口 3000）
│   └── admin/      # 后台应用（端口 3001）
├── libs/
│   └── common/     # 共享库，通过 @app/common 引用
├── nest-cli.json   # monorepo 项目注册（projects）
└── tsconfig.json   # 路径别名 @app/common -> libs/common
```

## 常用命令

```bash
# 安装依赖
npm install

# 开发（默认 api）
npm run start:dev          # watch 模式启动默认应用 (api)
npm run start:api:dev      # watch 模式启动 api
npm run start:admin:dev    # watch 模式启动 admin

# 构建
npm run build              # 构建默认应用 (api)
npm run build:all          # 构建全部 apps + libs
npm run build:api          # 仅构建 api
npm run build:admin        # 仅构建 admin

# 测试
npm test                   # 单元测试 (vitest)
npm run test:watch
npm run test:cov           # 覆盖率
npm run test:e2e           # e2e 测试

# 代码质量
npm run lint               # oxlint
npm run format             # prettier
```

应用监听端口可通过环境变量 `PORT` 覆盖，例如 `PORT=4000 npm run start:admin`。

## 新增 app / lib

```bash
npx nest generate app <name>        # 生成 apps/<name>
npx nest generate library <name>    # 生成 libs/<name>，别名 @app/<name>
```

> 注：当前 @nestjs/schematics 的 library 生成器要求指定库前缀，已在 `nest-cli.json`
> 中配置 `"defaultLibraryPrefix": "@app"`；新增库后需把 `libs/<name>/tsconfig.lib.json`
> 加入根 `tsconfig.json` 的 `references`，否则 vitest 下装饰器等 tsconfig 设置不会对该库生效。

## 在应用中使用共享库

```ts
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule],
})
export class AppModule {}
```

## 技术栈

- NestJS 12（ESM，`"type": "module"`）
- TypeScript 6 / Node 20+
- 构建：Rspack（`nest build`）
- 测试：Vitest + supertest
- Lint/Format：oxlint + Prettier
