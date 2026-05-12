---
name: version-bump
description: 升级项目版本号并提交git，支持patch/minor/major版本升级或指定具体版本号
version: 1.0.0
author: BenedictKing
allowed-tools: Bash, Read, Edit
context: fork
user-invocable: true
---

# 版本号升级技能

## 触发条件

- "升级版本"、"版本号"、"发布版本"、"更新版本"、"bump"、"release"

## 参数说明

- 无参数或 `patch`: patch +1
- `minor`: minor +1, patch 归零
- `major`: major +1, minor/patch 归零
- 具体版本号 (如 `1.2.0`): 直接使用

## 发布选项

> 默认创建 tag 并推送。除非用户明确说"不要 tag"或"--no-tag"。

- `--no-tag`: 不创建 git tag
- `--no-push`: 不推送到远程
- `--no-publish`: 不发布到 npm

## 项目版本文件

- **位置**: `package.json` 中的 `version` 字段
- **格式**: `{major}.{minor}.{patch}` (无 `v` 前缀)
- **当前**: 通过 `node -p "require('./package.json').version"` 读取

## 执行步骤

### 1. 读取当前版本号

```bash
node -p "require('./package.json').version"
```

### 2. 计算新版本号

| 当前版本 | 升级类型     | 新版本 |
| -------- | ------------ | ------ |
| 0.1.2    | patch (默认) | 0.1.3  |
| 0.1.2    | minor        | 0.2.0  |
| 0.1.2    | major        | 1.0.0  |
| 0.1.2    | 0.3.0        | 0.3.0  |

### 3. 更新 package.json

使用 `npm version {新版本号} --no-git-tag-version` 更新版本号。

### 4. 更新 CHANGELOG.md

将 `[Unreleased]` 替换为新版本号和当前日期：

```markdown
# 替换前
## [Unreleased]

# 替换后
## [{新版本号}] - YYYY-MM-DD
```

然后在下方补充本次变更的双语内容（英文在前，中文在后），格式参考已有条目。

### 5. 构建验证

```bash
pnpm lint && pnpm typecheck && pnpm build
```

确保版本更新后项目仍可正常编译。

### 6. 查看变更并确认

```bash
git status
git diff --stat
```

向用户展示待提交的变更，等待确认。

### 7. 提交变更

```bash
git add package.json package-lock.json pnpm-lock.yaml CHANGELOG.md
git commit -m "chore: bump version to {新版本号}"
```

### 8. 创建 Tag（默认执行）

> 除非用户明确说"不要 tag"，否则必须创建 tag。

```bash
git tag v{新版本号}
```

注意：tag 使用 `v` 前缀（如 `v0.2.0`），package.json 中不带前缀。

### 9. 推送到远程（默认执行）

```bash
git push
git push origin v{新版本号}
```

### 10. 提醒用户发布到 npm

> npm publish 需要 OTP 认证，无法自动完成。此步骤仅提醒用户手动执行。

在所有 git 操作完成后，输出提醒：

```
请手动执行 `pnpm publish` 完成 npm 发布。
```

除非用户明确说"--no-publish"或"不要发布"，否则必须输出此提醒。

## 示例场景

### 场景 1：默认 patch 升级

**输入**: "升级版本号"

1. 读取 package.json: `0.1.2`
2. 计算: `0.1.3`
3. `npm version 0.1.3 --no-git-tag-version`
4. 更新 CHANGELOG.md
5. `pnpm lint && pnpm typecheck && pnpm build`
6. git commit + tag `v0.1.3` + push
7. 提醒用户手动执行 `pnpm publish`

### 场景 2：minor 升级

**输入**: "升级 minor 版本"

1. 读取: `0.1.2` → 计算: `0.2.0`
2. 同上流程

### 场景 3：仅升级不发布

**输入**: "升级版本 --no-publish"

1. 同场景 1 的步骤 1-6
2. 跳过 npm publish 提醒

## 注意事项

- package.json 版本号无 `v` 前缀，git tag 有 `v` 前缀
- 提交前必须通过 `pnpm lint && pnpm typecheck && pnpm build`
- 遵循 Conventional Commits: `chore: bump version to {版本号}`
- CHANGELOG.md 中 `[Unreleased]` 节必须存在才会替换
- CHANGELOG 使用双语格式：英文在前，中文在后
