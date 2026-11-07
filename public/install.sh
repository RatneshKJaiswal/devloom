#!/usr/bin/env bash
set -e

INSTALL_DIR="$HOME/.devloom/bin"
mkdir -p "$INSTALL_DIR"

# Allow custom origin via DEVLOOM_URL, default to current origin or prompt
ORIGIN="${DEVLOOM_URL:-http://localhost:3000}"

echo "⬇️  Downloading DevLoom CLI executable..."
curl -fsSL "$ORIGIN/devloom" -o "$INSTALL_DIR/devloom"
chmod +x "$INSTALL_DIR/devloom"

mkdir -p "$HOME/.devloom"
chmod 700 "$HOME/.devloom"

SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
  SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
  SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
  if ! grep -q "\.devloom/bin" "$SHELL_RC" 2>/dev/null; then
    echo '' >> "$SHELL_RC"
    echo '# DevLoom CLI' >> "$SHELL_RC"
    echo 'export PATH="$HOME/.devloom/bin:$PATH"' >> "$SHELL_RC"
  fi
fi

echo ""
echo "✨ DevLoom CLI installed successfully to $INSTALL_DIR/devloom"
echo "Run: export PATH=\"\$HOME/.devloom/bin:\$PATH\""
echo "Then authenticate: devloom login"
