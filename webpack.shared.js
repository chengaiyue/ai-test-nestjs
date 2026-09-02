// 根目录共享的 webpack 配置工厂。
// 各 NestJS 应用的 webpack.config.js 仅保留 Nx 推断所需的入口（2 行），
// 实际配置由这里生成。main/tsConfig/assets 保持相对路径，由 webpack 以
// 构建时的 cwd（各应用目录）解析；output.path 用传入的 root 计算，避免依赖 cwd。
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

function createNestAppWebpackConfig({ root }) {
  return {
    output: {
      path: join(root, 'dist'),
      clean: true,
      ...(process.env.NODE_ENV !== 'production' && {
        devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      }),
    },
    plugins: [
      new NxAppWebpackPlugin({
        target: 'node',
        compiler: 'tsc',
        main: './src/main.ts',
        tsConfig: './tsconfig.app.json',
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
