param(
  [string]$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [int]$Port = 8787,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$AppRoot = $AppRoot.Trim('"')
$AppRoot = (Resolve-Path $AppRoot).Path

$distRoot = Join-Path $AppRoot "dist"
$serverScript = Join-Path $AppRoot "tools\serve-offline-app.mjs"
$url = "http://127.0.0.1:$Port/"
$manifestUrl = "http://127.0.0.1:$Port/manifest.webmanifest"

function Test-AppServer {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $manifestUrl -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Find-AppBrowser {
  $paths = @(
    (Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe"),
    (Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "Google\Chrome\Application\chrome.exe"),
    (Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe")
  )

  foreach ($path in $paths) {
    if ($path -and (Test-Path $path)) {
      return $path
    }
  }

  foreach ($command in @("msedge", "chrome")) {
    $resolved = Get-Command $command -ErrorAction SilentlyContinue
    if ($resolved) {
      return $resolved.Source
    }
  }

  return $null
}

if (-not (Test-Path (Join-Path $distRoot "index.html"))) {
  throw "Die gebaute App wurde nicht gefunden: $distRoot"
}

if (-not (Test-Path $serverScript)) {
  throw "Der lokale App-Server wurde nicht gefunden: $serverScript"
}

if (-not (Test-AppServer)) {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) {
    throw "Node.js wurde nicht gefunden. Ohne Node kann dieser lokale Starter den App-Server nicht starten."
  }

  $serverArgs = @("`"$serverScript`"", "--root", "`"$distRoot`"", "--port", "$Port")
  Start-Process -FilePath $node.Source -ArgumentList $serverArgs -WindowStyle Hidden

  $ready = $false
  for ($i = 0; $i -lt 40; $i += 1) {
    Start-Sleep -Milliseconds 250
    if (Test-AppServer) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    throw "Die App konnte lokal nicht gestartet werden."
  }
}

if ($NoBrowser) {
  Write-Host $url
  exit 0
}

$browser = Find-AppBrowser
if ($browser) {
  $profileRoot = Join-Path $env:LOCALAPPDATA "BasicsUnverpacktKasse\BrowserProfile"
  New-Item -ItemType Directory -Force -Path $profileRoot | Out-Null
  $browserArgs = @("--app=$url", "--user-data-dir=`"$profileRoot`"", "--no-first-run")
  Start-Process -FilePath $browser -ArgumentList $browserArgs
} else {
  Start-Process $url
}

Write-Host "Basics Unverpackt Kasse gestartet: $url"
