import nx from "@nx/eslint-plugin";

export default [
    ...nx.configs["flat/base"],
    ...nx.configs["flat/typescript"],
    ...nx.configs["flat/javascript"],
    {
        ignores: [
            "**/dist",
            "**/out-tsc"
        ]
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx"
        ],
        rules: {
            "@nx/enforce-module-boundaries": [
                "error",
                {
                    enforceBuildableLibDependency: true,
                    allow: [
                        "^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$",
                        "^(\\.\\./)+(webpack\\.shared|jest\\.shared-config)(\\.[cm]?[jt]s)?$"
                    ],
                    depConstraints: [
                        {
                            sourceTag: "*",
                            onlyDependOnLibsWithTags: [
                                "*"
                            ]
                        }
                    ]
                }
            ]
        }
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.cts",
            "**/*.mts",
            "**/*.js",
            "**/*.jsx",
            "**/*.cjs",
            "**/*.mjs"
        ],
        // Override or add rules here
        rules: {}
    },
    {
        // 库工程：严格校验 package.json 声明依赖与源码实际 import 一致
        files: [
            "**/libs/**/*.json"
        ],
        rules: {
            "@nx/dependency-checks": [
                "error",
                {
                    ignoredFiles: [
                        "{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}"
                    ]
                }
            ]
        },
        languageOptions: {
            parser: await import("jsonc-eslint-parser")
        }
    },
    {
        // 应用工程：webpack 以 node 外置依赖运行，下列包为 NestJS 隐式运行时依赖
        // （platform-express 由 NestFactory 动态加载、tslib 由 importHelpers 注入、
        // reflect-metadata / rxjs 为 Nest 传递依赖），源码中无静态 import，故忽略。
        files: [
            "**/apps/**/*.json"
        ],
        rules: {
            "@nx/dependency-checks": [
                "error",
                {
                    ignoredFiles: [
                        "{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}"
                    ],
                    ignoredDependencies: [
                        "@nestjs/platform-express",
                        "reflect-metadata",
                        "rxjs",
                        "tslib"
                    ]
                }
            ]
        },
        languageOptions: {
            parser: await import("jsonc-eslint-parser")
        }
    },
    {
        ignores: [
            "**/out-tsc"
        ]
    }
];
