import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const origin = `${proto}://${host}`;

  const token = url.searchParams.get("token") || "";

  const script = `#!/usr/bin/env bash
set -e

# Determine target installation directory
INSTALL_DIR="$HOME/.devloom/bin"
mkdir -p "$INSTALL_DIR"

echo "⬇️  Downloading DevLoom CLI executable from ${origin}..."
curl -fsSL "${origin}/devloom" -o "$INSTALL_DIR/devloom"
chmod +x "$INSTALL_DIR/devloom"

# Ensure ~/.devloom exists with secure permissions
mkdir -p "$HOME/.devloom"
chmod 700 "$HOME/.devloom"

${
  token
    ? `# Pre-configure authentication token
cat << 'EOF' > "$HOME/.devloom/config.json"
{
  "apiUrl": "${origin}",
  "token": "${token}"
}
EOF
chmod 600 "$HOME/.devloom/config.json"
echo "🔑 Configured authentication token for ${origin}"
`
    : ""
}
# Configure PATH in shell profile
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
echo ""
echo "To get started:"
echo "  1. Run in this terminal: export PATH=\"\\$HOME/.devloom/bin:\\$PATH\""
${
  token
    ? `echo "  2. Test your session:   devloom whoami"`
    : `echo "  2. Authenticate:        devloom login"`
}
echo "  3. Create your first task: devloom task \\"My First Task\\" -p high"
echo ""
`;

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
