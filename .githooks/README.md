# Git Hooks

启用项目提供的轻量提交检查：

```sh
git config core.hooksPath .githooks
```

默认 Hook 只检查暂存区空白错误。需要在每次提交前做类型检查时：

```sh
YEAH_BOOT_RUN_TYPECHECK_ON_COMMIT=1 git commit -m "..."
```

生产构建、ESLint、SonarQube 和依赖漏洞扫描应由 CI 或交付安全流程执行。
