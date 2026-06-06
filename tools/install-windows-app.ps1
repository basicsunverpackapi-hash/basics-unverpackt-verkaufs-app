param(
  [string]$SourceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

$installDir = Join-Path $env:LOCALAPPDATA "Programs\BasicsUnverpacktKasse"
$toolsDir = Join-Path $installDir "tools"
$distSource = Join-Path $SourceRoot "dist"

if (-not (Test-Path (Join-Path $distSource "index.html"))) {
  throw "Die gebaute App fehlt. Bitte zuerst npm run build ausfuehren."
}

New-Item -ItemType Directory -Force -Path $installDir | Out-Null
New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null

$installedDist = Join-Path $installDir "dist"
if (Test-Path $installedDist) {
  Remove-Item -LiteralPath $installedDist -Recurse -Force
}

Copy-Item -LiteralPath $distSource -Destination $installedDist -Recurse -Force
Copy-Item -LiteralPath (Join-Path $SourceRoot "tools\serve-offline-app.mjs") -Destination (Join-Path $toolsDir "serve-offline-app.mjs") -Force
Copy-Item -LiteralPath (Join-Path $SourceRoot "tools\start-installed-app.ps1") -Destination (Join-Path $toolsDir "start-installed-app.ps1") -Force

$cmdPath = Join-Path $installDir "Basics Unverpackt Kasse.cmd"
Set-Content -LiteralPath $cmdPath -Encoding ASCII -Value @"
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\start-installed-app.ps1" -AppRoot "%~dp0."
"@

function New-AppShortcut {
  param(
    [string]$ShortcutPath,
    [string]$TargetPath,
    [string]$WorkingDirectory
  )

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($ShortcutPath)
  $shortcut.TargetPath = $TargetPath
  $shortcut.WorkingDirectory = $WorkingDirectory
  $shortcut.Description = "Basics Unverpackt Kasse"
  $shortcut.Save()
}

$desktop = [Environment]::GetFolderPath("Desktop")
if ([string]::IsNullOrWhiteSpace($desktop)) {
  $desktop = Join-Path $env:USERPROFILE "Desktop"
}

$programs = [Environment]::GetFolderPath("Programs")
if ([string]::IsNullOrWhiteSpace($programs)) {
  $programs = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"
}

New-Item -ItemType Directory -Force -Path $desktop | Out-Null
New-Item -ItemType Directory -Force -Path $programs | Out-Null

New-AppShortcut -ShortcutPath (Join-Path $desktop "Basics Unverpackt Kasse.lnk") -TargetPath $cmdPath -WorkingDirectory $installDir
New-AppShortcut -ShortcutPath (Join-Path $programs "Basics Unverpackt Kasse.lnk") -TargetPath $cmdPath -WorkingDirectory $installDir

& $cmdPath

Write-Host "Installiert: $installDir"
Write-Host "Desktop- und Startmenue-Verknuepfung wurden erstellt."
