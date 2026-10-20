$ErrorActionPreference = "Stop"

$url = "https://raw.githubusercontent.com/NarimanKhaleghi/opencode-hotkeys/main/desktop/install.mjs"
$tmp = Join-Path $env:TEMP "opencode-hotkeys-desktop-install-$PID.mjs"
$code = 1

try {
  Invoke-WebRequest -Uri $url -OutFile $tmp
  node $tmp @args
  $code = $LASTEXITCODE
} finally {
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}

exit $code
