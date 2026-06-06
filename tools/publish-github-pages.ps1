param(
  [Parameter(Mandatory=$true)]
  [string]$SourceRoot,
  [string]$Owner = "basicsunverpackapi-hash",
  [string]$Repo = "basics-unverpackt-verkaufs-app"
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param(
    [string]$Name,
    [string]$DownloadUrl
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "$Name wurde nicht gefunden." -ForegroundColor Yellow
    Write-Host "Installiere es zuerst und starte diese Datei danach erneut:"
    Write-Host $DownloadUrl
    Start-Process $DownloadUrl
    throw "$Name fehlt."
  }
}

function Run {
  param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    [string[]]$Arguments = @()
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Befehl fehlgeschlagen: $FilePath $($Arguments -join ' ')"
  }
}

$SourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path
Set-Location -LiteralPath $SourceRoot

Write-Host "Basics Unverpackt Kasse: GitHub Pages reparieren" -ForegroundColor Green
Write-Host "Projekt: $SourceRoot"

Require-Command -Name "git" -DownloadUrl "https://git-scm.com/download/win"
Require-Command -Name "gh" -DownloadUrl "https://cli.github.com/"

Write-Host ""
Write-Host "GitHub-Anmeldung pruefen..."
& gh auth status -h github.com *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Bitte im Browser bei GitHub anmelden." -ForegroundColor Yellow
  Run -FilePath "gh" -Arguments @("auth", "login", "-h", "github.com", "-w")
}

Write-Host ""
Write-Host "Berechtigungen fuer Pages und Workflows aktualisieren..."
& gh auth refresh -h github.com -s repo -s workflow *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Berechtigungen konnten nicht automatisch erweitert werden. Wenn GitHub nachfragt, bitte erlauben." -ForegroundColor Yellow
}

if (-not (Test-Path -LiteralPath ".git")) {
  Write-Host ""
  Write-Host "Lokales Git-Repository wird erstellt..."
  Run -FilePath "git" -Arguments @("init")
}

& git config user.email *> $null
if ($LASTEXITCODE -ne 0) {
  Run -FilePath "git" -Arguments @("config", "user.email", "basics-app@local")
}

& git config user.name *> $null
if ($LASTEXITCODE -ne 0) {
  Run -FilePath "git" -Arguments @("config", "user.name", "Basics App Publisher")
}

$remoteUrl = "https://github.com/$Owner/$Repo.git"
& git remote get-url origin *> $null
if ($LASTEXITCODE -ne 0) {
  Run -FilePath "git" -Arguments @("remote", "add", "origin", $remoteUrl)
} else {
  Run -FilePath "git" -Arguments @("remote", "set-url", "origin", $remoteUrl)
}

Run -FilePath "git" -Arguments @("branch", "-M", "main")

Write-Host ""
Write-Host "App-Dateien werden auf GitHub vorbereitet..."
Run -FilePath "git" -Arguments @("add", "-A")

$status = & git status --porcelain
if ($status) {
  Run -FilePath "git" -Arguments @("commit", "-m", "Fix offline app and GitHub Pages deployment")
} else {
  Write-Host "Keine neuen lokalen Aenderungen zum Committen."
}

Write-Host ""
Write-Host "Aenderungen werden auf GitHub hochgeladen..."
Run -FilePath "git" -Arguments @("push", "-u", "origin", "main")

Write-Host ""
Write-Host "GitHub Pages wird auf GitHub Actions gestellt..."
& gh api -X POST "repos/$Owner/$Repo/pages" -f build_type=workflow
if ($LASTEXITCODE -ne 0) {
  & gh api -X PATCH "repos/$Owner/$Repo/pages" -f build_type=workflow
  if ($LASTEXITCODE -ne 0) {
    throw "GitHub Pages konnte nicht automatisch aktiviert werden. Oeffne Settings > Pages und waehle GitHub Actions."
  }
}

Write-Host ""
Write-Host "Deploy-Workflow wird gestartet..."
& gh workflow run "Deploy PWA to GitHub Pages" --repo "$Owner/$Repo" --ref main
if ($LASTEXITCODE -ne 0) {
  Write-Host "Workflow konnte nicht direkt gestartet werden. Der Push auf main startet ihn normalerweise automatisch." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Fertig. Nach 1 bis 3 Minuten diesen Link pruefen:" -ForegroundColor Green
Write-Host "https://$Owner.github.io/$Repo/"
Write-Host ""
Write-Host "Wenn dort noch 404 steht: GitHub > Repository > Actions oeffnen und den letzten Lauf ansehen."
