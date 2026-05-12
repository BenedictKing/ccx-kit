---
description: 升级版本号并发布，使用 version-bump skill 流程
allowed-tools: Bash, Read, Edit
argument-hint: [-p|--patch] [-mi|--minor] [-ma|--major] [<version>]
# examples:
#   - /ccx-kit-release                     # Default patch version bump
#   - /ccx-kit-release -p                  # Patch version bump (2.9.11 → 2.9.12)
#   - /ccx-kit-release -mi                 # Minor version bump (2.9.11 → 2.10.0)
#   - /ccx-kit-release -ma                 # Major version bump (2.9.11 → 3.0.0)
#   - /ccx-kit-release 1.5.0               # Exact version (→ 1.5.0)
#   - /ccx-kit-release 3.0.0-alpha.1       # Pre-release version (→ 3.0.0-alpha.1)
---

# CCX-Kit Version Bump & Release

## Usage

```bash
/ccx-kit-release [-p|-mi|-ma|<version>]
```

## Parameters

- `-p` or `--patch`: Patch version (default) - bug fixes, minor changes
- `-mi` or `--minor`: Minor version - new features, backward compatible
- `-ma` or `--major`: Major version - breaking changes, incompatible
- `<version>`: Specific version number (e.g., 1.2.3) - directly use provided version

## Execution Flow

Parse arguments: $ARGUMENTS

### 1. Parameter Parsing

```bash
VERSION_TYPE="patch"  # Default to patch version
SPECIFIC_VERSION=""

if [[ "$ARGUMENTS" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-].*)?$ ]]; then
  SPECIFIC_VERSION="$ARGUMENTS"
  VERSION_TYPE="custom"
  echo "Preparing to release exact version: $SPECIFIC_VERSION"
else
  case "$ARGUMENTS" in
    -p|--patch)  VERSION_TYPE="patch" ;;
    -mi|--minor) VERSION_TYPE="minor" ;;
    -ma|--major) VERSION_TYPE="major" ;;
    "")          VERSION_TYPE="patch" ;;
    *)
      echo "Unknown parameter: $ARGUMENTS"
      echo "Usage: /ccx-kit-release [-p|-mi|-ma|<version>]"
      exit 1
      ;;
  esac
  echo "Preparing to release $VERSION_TYPE version"
fi
```

### 2. Read Current Version

```bash
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"
```

### 3. Calculate New Version

- patch: increment patch number
- minor: increment minor, reset patch
- major: increment major, reset minor and patch
- custom: use the specified version directly

### 4. Update package.json

```bash
npm version $NEW_VERSION --no-git-tag-version
```

### 5. Update CHANGELOG.md

Replace `[Unreleased]` with the new version and date:

```markdown
# Before
## [Unreleased]

# After
## [$NEW_VERSION] - YYYY-MM-DD
```

Then add bilingual change content (English first, Chinese second) based on git log since the last tag.

### 6. Build Verification

```bash
pnpm lint && pnpm typecheck && pnpm build
```

### 7. Review Changes

```bash
git status
git diff --stat
```

Show the user pending changes and wait for confirmation.

### 8. Commit

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to $NEW_VERSION"
```

### 9. Create Tag

```bash
git tag v$NEW_VERSION
```

Note: tag uses `v` prefix (e.g., `v1.0.0`), package.json does not.

### 10. Push

```bash
git push
git push origin v$NEW_VERSION
```

### 11. Remind about npm publish

npm publish requires OTP authentication, cannot be automated. Output reminder:

```
请手动执行 `pnpm publish` 完成 npm 发布。
```

## Important Notes

- package.json version has no `v` prefix, git tag has `v` prefix
- Must pass `pnpm lint && pnpm typecheck && pnpm build` before commit
- Follow Conventional Commits: `chore: bump version to {version}`
- CHANGELOG uses bilingual format: English first, Chinese second
- `[Unreleased]` section must exist in CHANGELOG.md for replacement to work
- GitHub Actions will auto-publish to npm when a `v*` tag is pushed

---

**Now starting release process...**
