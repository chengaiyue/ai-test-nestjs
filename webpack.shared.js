// 根目录共享的 webpack 配置工厂。
// 各 NestJS 应用的 webpack.config.js 仅保留 Nx 推断所需的入口（2 行），
// 实际配置由这里生成。全仓库只有根目录一个 tsconfig.json，通过 context 锚定
// 各应用目录，使 main/assets 等相对路径相对应用目录解析、output 落到各应用 dist。
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

// 本文件位于 workspace 根目录，唯一的 tsconfig 在这里
const workspaceRoot = __dirname;

function createNestAppWebpackConfig({ root }) {
  return {
    context: root,
    output: {
      path: join(root, 'dist'),
      clean: true,
      ...(process.env.NODE_ENV !== 'production' && {
        devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      }),
    },
    resolve: {
      // 让 @app/common 等 workspace 库走自定义条件直接解析到 TS 源码（由 webpack 编译），
      // 不依赖库预先 tsc 产出 dist（单一 tsconfig 后库不再独立构建）。
      conditionNames: ['ai-test-nestjs'],
    },
    plugins: [
      new NxAppWebpackPlugin({
        target: 'node',
        compiler: 'tsc',
        main: './src/main.ts',
        tsConfig: join(workspaceRoot, 'tsconfig.json'),
        assets: ['./src/assets'],
        optimization: false,
        outputHashing: 'none',
        generatePackageJson: false,
        sourceMap: true,
      }),
    ],
  };
}

module.exports = { createNestAppWebpackConfig };
