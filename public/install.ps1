# DevLoom CLI Windows PowerShell Installer
# Usage: irm https://devloom.app/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  DevLoom CLI Installer for Windows" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor DarkGray

# 1. Verify Node.js prerequisite
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "❌ Error: Node.js is required but was not found in your PATH." -ForegroundColor Red
    Write-Host "Please install Node.js (v18+) from https://nodejs.org or run: winget install OpenJS.NodeJS" -ForegroundColor Yellow
    exit 1
}

# 2. Setup install directories
$devloomDir = Join-Path $HOME ".devloom"
$installDir = Join-Path $devloomDir "bin"

if (-not (Test-Path -Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

$origin = if ($env:DEVLOOM_URL) { $env:DEVLOOM_URL } else { "https://devloom.app" }

# 3. Download CLI executable
Write-Host "⬇️  Downloading DevLoom executable from $origin..." -ForegroundColor White
$devloomTarget = Join-Path $installDir "devloom"

try {
    Invoke-WebRequest -Uri "$origin/devloom" -OutFile $devloomTarget -UseBasicParsing
} catch {
    Write-Host "❌ Failed to download CLI from $origin/devloom: $_" -ForegroundColor Red
    exit 1
}

# 4. Create devloom.cmd for Windows Command Prompt (CMD) & Run Dialog
$cmdPath = Join-Path $installDir "devloom.cmd"
$cmdScript = "@echo off`r`nnode `"%~dp0devloom`" %*"
Set-Content -Path $cmdPath -Value $cmdScript -Encoding ASCII -Force

# 5. Create devloom.ps1 for Windows PowerShell
$ps1Path = Join-Path $installDir "devloom.ps1"
$ps1Script = @"
`$basedir = Split-Path `$MyInvocation.MyCommand.Path -Parent
& node "`$basedir/devloom" `$args
exit `$LASTEXITCODE
"@
Set-Content -Path $ps1Path -Value $ps1Script -Encoding UTF8 -Force

# 6. Create PowerShell Aliases script (devloom.ps1 helper)
$aliasPath = Join-Path $devloomDir "devloom.ps1"
$aliasScript = @"
# DevLoom PowerShell Shortcuts
function dt { devloom task @args }
function db { devloom bug @args }
function dg { devloom gotcha @args }
function dc { devloom capture @args }
function ds { devloom standup @args }
"@
Set-Content -Path $aliasPath -Value $aliasScript -Encoding UTF8 -Force

# 7. Add to User PATH if not already present
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$installDir*") {
    $newPath = if ([string]::IsNullOrWhiteSpace($userPath)) { $installDir } else { "$userPath;$installDir" }
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    $env:Path = "$env:Path;$installDir"
    Write-Host "✅ Added $installDir to your User PATH" -ForegroundColor Green
} else {
    Write-Host "✅ $installDir is already in your PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 DevLoom CLI successfully installed!" -ForegroundColor Green
Write-Host ""
Write-Host "Quick Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run: devloom login" -ForegroundColor White
Write-Host "  2. Test: devloom whoami" -ForegroundColor White
Write-Host ""
Write-Host "Optional: To enable fast 2-letter aliases (dt, db, dg, dc, ds), add this to your `$PROFILE:" -ForegroundColor DarkGray
Write-Host "  . `"$aliasPath`"" -ForegroundColor Yellow
Write-Host ""
