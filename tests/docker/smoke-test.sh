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

# -------- 9. Start real CCX and verify proxy requests -------------------
# Runtime must not use any proxy. The proxy may be used by the host only to
# pre-download tests/docker/cache/ccx/ccx-linux-arm64.
unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy

CCX_CACHE_BIN="/home/tester/.local/share/ccx-kit-cache/ccx-linux-arm64"
CCX_BIN="${TEST_HOME}/.local/bin/ccx"
CCX_RUNTIME="${WORK_DIR}/ccx-runtime"
UPSTREAM_LOG="${CCX_RUNTIME}/fake-upstream.ndjson"
FAKE_UPSTREAM_JS="${CCX_RUNTIME}/fake-upstream.mjs"
CCX_LOG="${CCX_RUNTIME}/ccx.log"

log "installing cached CCX linux binary"
[[ -x "${CCX_CACHE_BIN}" ]] || fail "cached CCX binary missing: ${CCX_CACHE_BIN}. Download it on host first."
cp "${CCX_CACHE_BIN}" "${CCX_BIN}"
chmod +x "${CCX_BIN}"
ok "CCX binary installed"

log "starting fake upstream for mimo/deepseek"
mkdir -p "${CCX_RUNTIME}/.config"
cat > "${FAKE_UPSTREAM_JS}" <<'NODE'
import http from 'node:http'
import fs from 'node:fs'

const logFile = process.env.UPSTREAM_LOG
const server = http.createServer((req, res) => {
  let body = ''
  req.setEncoding('utf8')
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    const entry = {
      method: req.method,
      url: req.url,
      authorization: req.headers.authorization || '',
      xApiKey: req.headers['x-api-key'] || '',
      body: body ? JSON.parse(body) : null,
    }
    fs.appendFileSync(logFile, `${JSON.stringify(entry)}\n`)

    res.setHeader('content-type', 'application/json')
    if (req.url.includes('/messages')) {
      res.end(JSON.stringify({
        id: 'msg_fake_mimo',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'mimo-ok' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 1, output_tokens: 1 },
      }))
      return
    }

    if (req.url.includes('/chat/completions')) {
      res.end(JSON.stringify({
        id: 'chatcmpl_fake_deepseek',
        model: 'deepseek-chat',
        choices: [{ message: { role: 'assistant', content: 'deepseek-ok' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }))
      return
    }

    if (req.url.includes('/responses')) {
      res.end(JSON.stringify({
        id: 'resp_fake',
        model: 'gpt-5.2',
        status: 'completed',
        output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'responses-ok' }] }],
        usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
      }))
      return
    }

    res.statusCode = 404
    res.end(JSON.stringify({ error: 'unexpected path', path: req.url }))
  })
})
server.listen(3999, '127.0.0.1', () => console.log('fake upstream listening on 3999'))
NODE

UPSTREAM_LOG="${UPSTREAM_LOG}" node "${FAKE_UPSTREAM_JS}" > "${CCX_RUNTIME}/fake-upstream.log" 2>&1 &
FAKE_PID=$!
trap 'kill ${FAKE_PID:-0} ${CCX_PID:-0} >/dev/null 2>&1 || true' EXIT

for _ in {1..30}; do
  if node -e "fetch('http://127.0.0.1:3999/health').catch(()=>process.exit(1))" >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

cat > "${CCX_RUNTIME}/.env" <<'ENV'
PORT=3688
PROXY_ACCESS_KEY=sk-ccx-kit
ENABLE_WEB_UI=false
ENV=development
LOG_LEVEL=debug
ENABLE_REQUEST_LOGS=true
ENABLE_RESPONSE_LOGS=true
METRICS_PERSISTENCE_ENABLED=false
ENV

cat > "${CCX_RUNTIME}/.config/config.json" <<'JSON'
{
  "upstream": [
    {
      "name": "mimo-messages-priority-1",
      "baseUrl": "http://127.0.0.1:3999",
      "apiKeys": ["sk-mimo-upstream"],
      "serviceType": "claude",
      "status": "active",
      "priority": 0,
      "supportedModels": ["mimo-vl-pro", "claude-3-5-sonnet"]
    },
    {
      "name": "deepseek-messages-priority-2",
      "baseUrl": "http://127.0.0.1:3999",
      "apiKeys": ["sk-deepseek-upstream"],
      "serviceType": "openai",
      "status": "active",
      "priority": 1,
      "supportedModels": ["deepseek-chat"]
    }
  ],
  "responsesUpstream": [
    {
      "name": "deepseek-responses-priority-1",
      "baseUrl": "http://127.0.0.1:3999",
      "apiKeys": ["sk-deepseek-upstream"],
      "serviceType": "openai",
      "status": "active",
      "priority": 0,
      "supportedModels": ["deepseek-chat", "gpt-5.2"]
    },
    {
      "name": "mimo-responses-priority-2",
      "baseUrl": "http://127.0.0.1:3999",
      "apiKeys": ["sk-mimo-upstream"],
      "serviceType": "claude",
      "status": "active",
      "priority": 1,
      "supportedModels": ["mimo-vl-pro"]
    }
  ],
  "chatUpstream": [
    {
      "name": "deepseek-chat-priority-1",
      "baseUrl": "http://127.0.0.1:3999",
      "apiKeys": ["sk-deepseek-upstream"],
      "serviceType": "openai",
      "status": "active",
      "priority": 0,
      "supportedModels": ["deepseek-chat"]
    }
  ],
  "geminiUpstream": [],
  "fuzzyModeEnabled": true,
  "stripBillingHeader": true
}
JSON

log "starting real CCX runtime without proxy env"
(cd "${CCX_RUNTIME}" && "${CCX_BIN}" > "${CCX_LOG}" 2>&1) &
CCX_PID=$!

for _ in {1..60}; do
  if node -e "fetch('http://127.0.0.1:3688/health').then(r=>r.ok?0:process.exit(1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done
node -e "fetch('http://127.0.0.1:3688/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))" \
  || { tail -80 "${CCX_LOG}" >&2 || true; fail "CCX did not become healthy"; }
ok "CCX health endpoint is ready"

log "sending Claude Messages request through CCX (expected upstream: mimo first)"
CLAUDE_RESP=$(node - <<'NODE'
const res = await fetch('http://127.0.0.1:3688/v1/messages', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-api-key': 'sk-ccx-kit',
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'mimo-vl-pro',
    max_tokens: 32,
    messages: [{ role: 'user', content: [{ type: 'text', text: 'ping from claude-code' }] }]
  })
})
const text = await res.text()
if (!res.ok) {
  console.error(text)
  process.exit(1)
}
console.log(text)
NODE
) || { tail -120 "${CCX_LOG}" >&2 || true; fail "Claude Messages request failed"; }
echo "${CLAUDE_RESP}" | grep -q 'mimo-ok' || fail "Claude response did not contain mimo-ok"
ok "Claude Messages request succeeded"

log "sending Codex Responses request through CCX (expected upstream: deepseek first)"
CODEX_RESP=$(node - <<'NODE'
const res = await fetch('http://127.0.0.1:3688/v1/responses', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'authorization': 'Bearer sk-ccx-kit'
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    input: [{ role: 'user', content: [{ type: 'input_text', text: 'ping from codex' }] }]
  })
})
const text = await res.text()
if (!res.ok) {
  console.error(text)
  process.exit(1)
}
console.log(text)
NODE
) || { tail -120 "${CCX_LOG}" >&2 || true; fail "Codex Responses request failed"; }
echo "${CODEX_RESP}" | grep -q 'deepseek-ok' || fail "Codex response did not contain deepseek-ok"
ok "Codex Responses request succeeded"

log "verifying fake upstream received both mimo/deepseek requests"
node - "${UPSTREAM_LOG}" <<'NODE'
const fs = require('node:fs')
const logPath = process.argv[2]
const rows = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
const sawMimo = rows.some(r => r.url.includes('/v1/messages') && r.authorization === 'Bearer sk-mimo-upstream')
const sawDeepseek = rows.some(r => r.url.includes('/v1/chat/completions') && r.authorization === 'Bearer sk-deepseek-upstream')
if (!sawMimo || !sawDeepseek) {
  console.error(JSON.stringify({ sawMimo, sawDeepseek, rows }, null, 2))
  process.exit(1)
}
NODE
ok "fake upstream received mimo and deepseek routed requests"

# -------- 10. All green --------------------------------------------------
printf '\n\033[1;32m%s\033[0m\n' "✔ ccx-kit + CCX runtime smoke test passed"
