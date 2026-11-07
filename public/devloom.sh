#!/usr/bin/env bash

# ==============================================================================
# DevLoom Terminal & Shell Suite
# Personal Developer Command Center Integration for Zsh & Bash
# ==============================================================================
# Usage:
#   Add the following line to your ~/.zshrc or ~/.bashrc:
#     source <(curl -s http://localhost:3000/devloom.sh)
#   Or source locally from the repository:
#     source /path/to/devloom/public/devloom.sh
# ==============================================================================

# Ensure DEVLOOM_URL is defined (defaults to localhost:3000)
export DEVLOOM_API_URL="${DEVLOOM_API_URL:-http://localhost:3000}"

# Auto-locate devloom binary
DEVLOOM_BIN=""
if command -v devloom >/dev/null 2>&1; then
  DEVLOOM_BIN="devloom"
elif [ -f "./bin/devloom" ]; then
  DEVLOOM_BIN="./bin/devloom"
fi

_devloom_exec() {
  if [ -n "$DEVLOOM_BIN" ]; then
    "$DEVLOOM_BIN" "$@"
  elif [ -f "$HOME/.devloom/bin/devloom" ]; then
    "$HOME/.devloom/bin/devloom" "$@"
  else
    npx devloom "$@" 2>/dev/null || node ./bin/devloom "$@"
  fi
}

# DevLoom CLI Shortcut functions
devloom-task() {
  _devloom_exec task "$@"
}

devloom-bug() {
  _devloom_exec bug "$@"
}

devloom-gotcha() {
  _devloom_exec gotcha "$@"
}

devloom-capture() {
  _devloom_exec capture "$@"
}

devloom-standup() {
  _devloom_exec standup
}

devloom-branch() {
  _devloom_exec branch "$@"
}

devloom-checkout() {
  _devloom_exec branch "$@" -c
}

devloom-whoami() {
  _devloom_exec whoami
}
