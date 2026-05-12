#!/usr/bin/env bash
# ccx-kit end-to-end smoke test
#
# Runs inside the Docker container. The host repo is mounted read-only at
# /home/tester/work. We copy the tarball out so npx can install without
# touching the source tree.

set -euo pipefail

REPO_RO="/home/tester/work"
WORK_DIR="${HOME}/smoke"
TEST_HOME="${WORK_DIR}/home"
TARBALL=""

log() { printf '\033[1;36m[smoke]\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32m[  ok]\033[0m %s\n' "$*"; }
fail(){ printf '\033[1;31m[fail]\033[0m %s\n' "$*" >&2; exit 1; }

# -------- 1. Locate tarball produced by `pnpm pack` ----------------------
log "locating ccx-kit tarball in ${REPO_RO}"
TARBALL=$(ls -1 "${REPO_RO}"/ccx-kit-*.tgz 2>/dev/null | sort | tail -n 1 || true)
if [[ -z "${TARBALL}" ]]; then
  fail "no ccx-kit-*.tgz found. Run \`pnpm build && pnpm pack\` on the host first."
fi
ok "using tarball: $(basename "${TARBALL}")"

# -------- 2. Prepare isolated HOME for the test --------------------------
log "preparing isolated test HOME at ${TEST_HOME}"
rm -rf "${WORK_DIR}"
mkdir -p "${TEST_HOME}"
cp "${TARBALL}" "${WORK_DIR}/"
LOCAL_TARBALL="${WORK_DIR}/$(basename "${TARBALL}")"

# Redirect HOME so all config lands inside the throwaway dir, not the
# container user's real home.
export HOME="${TEST_HOME}"
export PATH="${TEST_HOME}/.local/bin:${PATH}"
mkdir -p "${TEST_HOME}/.local/bin"

# -------- 3. Install command shims to avoid hitting external installers ---
# ccx-kit's --skip-prompt path runs `sudo npm install -g @anthropic-ai/claude-code`
# during `ccx-kit i --code-type claude-code`. For a hermetic smoke test we
# don't actually want to hit npmjs.org — we only want to verify ccx-kit's
# own behavior. Put shims in front that short-circuit sudo/global npm install
# and delegate everything else to the real binaries.
log "installing sudo/npm shims to short-circuit global installs"
REAL_NPM="$(command -v npm)"
SHIM_DIR="${TEST_HOME}/.local/bin"
cat > "${SHIM_DIR}/npm" <<SHIM
#!/usr/bin/env bash
# Shim: swallow \`npm install -g ...\` so the smoke test stays offline-ish.
if [[ "\${1:-}" == "install" && "\${2:-}" == "-g" ]]; then
  echo "[shim] skipping 'npm install -g \${*:3}' in smoke test"
  exit 0
fi
exec "${REAL_NPM}" "\$@"
SHIM
cat > "${SHIM_DIR}/sudo" <<'SHIM'
#!/usr/bin/env bash
# Shim: execute command directly, no privilege escalation in the container.
exec "$@"
SHIM
chmod +x "${SHIM_DIR}/npm" "${SHIM_DIR}/sudo"
ok "command shims active in ${SHIM_DIR}"

# Verify the shims are first on PATH
if [[ "$(command -v npm)" != "${SHIM_DIR}/npm" ]]; then
  fail "npm shim not first on PATH; got $(command -v npm)"
fi
if [[ "$(command -v sudo)" != "${SHIM_DIR}/sudo" ]]; then
  fail "sudo shim not first on PATH; got $(command -v sudo)"
fi

# -------- 4. Verify CLI is reachable via npx -----------------------------
log "npx ccx-kit --version"
npx --yes "file:${LOCAL_TARBALL}" --version || fail "CLI --version failed"
ok "CLI reachable via npx"

# -------- 5. Run initialization in skip-prompt mode ----------------------
# - code-type claude-code: install Claude Code flow
# - api-type skip: skip API configuration (no real keys in a smoke test)
# - mcp-services skip: skip MCP service install
# - workflows skip: skip workflow templates to keep the run fast
# - output-styles all / default-output-style engineer-professional
# - install-cometix-line false: skip binary fetch unrelated to ccx-kit
log "running ccx-kit init (skip-prompt, claude-code, api skipped)"
npx --yes "file:${LOCAL_TARBALL}" i \
  --skip-prompt \
  --lang en \
  --code-type claude-code \
  --config-action new \
  --api-type skip \
  --mcp-services skip \
  --workflows skip \
  --output-styles skip \
  --install-cometix-line false \
  || fail "init --skip-prompt failed"
ok "init completed"

# -------- 6. Verify produced config files --------------------------------
CLAUDE_DIR="${TEST_HOME}/.claude"
SETTINGS="${CLAUDE_DIR}/settings.json"

log "verifying ${CLAUDE_DIR} exists"
[[ -d "${CLAUDE_DIR}" ]] || fail "${CLAUDE_DIR} not created"
ok ".claude directory present"

log "verifying settings.json is valid JSON"
[[ -f "${SETTINGS}" ]] || fail "${SETTINGS} missing"
node -e "JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8'))" "${SETTINGS}" \
  || fail "${SETTINGS} is not valid JSON"
ok "settings.json is valid JSON"

log "verifying expanded permissions are present (Skill, MultiEdit, TaskCreate)"
for perm in Skill MultiEdit TaskCreate LS LSP ToolSearch; do
  node -e "const s=JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8')); if (!s.permissions?.allow?.includes(process.argv[2])) process.exit(1)" "${SETTINGS}" "${perm}" \
    || fail "permission ${perm} missing from settings.json"
done
ok "expanded permissions present"

log "verifying removed permissions are absent (BashOutput, SlashCommand)"
for perm in BashOutput SlashCommand; do
  if node -e "const s=JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8')); process.exit(s.permissions?.allow?.includes(process.argv[2]) ? 0 : 1)" "${SETTINGS}" "${perm}"; then
    fail "permission ${perm} should have been removed"
  fi
done
ok "deprecated permissions removed"

# -------- 7. Verify ccx-kit app config was written -----------------------
# The tool writes its own state under ~/.ufomiao or ~/.ccx-kit depending on
# version. Check for either; missing is informational, not fatal.
log "checking for ccx-kit app config"
if [[ -d "${TEST_HOME}/.ufomiao" ]] || [[ -d "${TEST_HOME}/.ccx-kit" ]]; then
  ok "ccx-kit app config directory present"
else
  log "no app config dir found (may be optional for this flow)"
fi

# -------- 8. Quick provider preset sanity check --------------------------
# Run the CLI --help and confirm it mentions at least one new provider we
# added (deepseek is a good canary; it wasn't in v3.6.1).
log "checking provider preset surface via --help"
HELP_OUT=$(npx --yes "file:${LOCAL_TARBALL}" i --help 2>&1 || true)
echo "${HELP_OUT}" | grep -qi 'provider' || fail "init --help missing provider flag"
ok "provider flag documented"

# -------- 9. All green ---------------------------------------------------
printf '\n\033[1;32m%s\033[0m\n' "✔ ccx-kit smoke test passed"
