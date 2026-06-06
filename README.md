# Basics Unverpackt Verkaufs-App

Offlinefaehige PWA fuer Verkauf, Kasse, Merkzettel und Buchhaltung.

## Lokal starten

```bash
npm ci
npm run dev
```

## Pruefen

```bash
npm run lint
npm run typecheck
npm run test:calc
npm run build
```

## Installation als App

In der App gibt es die Seite `Installieren`. Dort stehen die festen HTTPS-Links
fuer Chromebook und Android sowie der Windows-Hinweis zum Verschicken.

Wenn der feste HTTPS-Link `404 Site not found` zeigt, ist GitHub Pages noch
nicht aktiv. In GitHub unter `Settings > Pages` die Source `GitHub Actions`
auswaehlen und danach unter `Actions` den Workflow
`Deploy PWA to GitHub Pages` starten oder neue Aenderungen auf `main`
hochladen.

Auf Windows liegt im Ordner darueber `GitHub-Pages-reparieren-Windows.cmd`.
Diese Datei meldet dich mit GitHub CLI an, laedt die korrigierte App auf GitHub
hoch, aktiviert GitHub Pages fuer GitHub Actions und startet den Deploy.

### Windows

Im Ordner darueber liegt `Basics-App-installieren-Windows.cmd`.

Dieser Starter installiert die gebaute Offline-App in das Windows-Benutzerprofil,
erstellt Desktop- und Startmenue-Verknuepfungen und startet die App in einem
eigenen Chrome/Edge-App-Fenster ohne normales Browserfenster.

Der feste HTTPS-Link bleibt:

```text
https://basicsunverpackapi-hash.github.io/basics-unverpackt-verkaufs-app/
```

Nach jeder Aenderung muss die neue Version auf GitHub Pages veroeffentlicht
werden. Danach wird derselbe HTTPS-Link an Chromebook oder Android geschickt.

### Chromebook mit Linux

Empfohlen ist die direkte ChromeOS-App ueber den HTTPS-Link:

- `https://basicsunverpackapi-hash.github.io/basics-unverpackt-verkaufs-app/` ist die App.
- `https://basicsunverpackapi-hash.github.io/basics-unverpackt-verkaufs-app/chromebook-installieren.html` ist die Chromebook-Anleitung.

Auf dem Chromebook den `github.io`-Link in Chrome oeffnen, dann in der
Adressleiste oder im Chrome-Menue `App installieren` waehlen. Danach liegt
`Basics Kasse` im Chromebook-Launcher.

Optional liegt im Ordner darueber `install-linux-app.sh`. Nur wenn die
Chromebook-Linux-Umgebung genutzt werden soll:

```bash
bash install-linux-app.sh
```

Danach erscheint `Basics Unverpackt Kasse` im Linux-App-Menue.

### Handy / Tablet

Fuer Android/iPhone braucht die PWA einen HTTPS-Link. Wichtig:

- `https://github.com/...` zeigt nur den Code.
- `https://basicsunverpackapi-hash.github.io/basics-unverpackt-verkaufs-app/` ist die App.
- `https://basicsunverpackapi-hash.github.io/basics-unverpackt-verkaufs-app/handy-installieren.html` ist die Handy-Anleitung.
- `https://basicsunverpackapi-hash.github.io/basics-unverpackt-verkaufs-app/chromebook-installieren.html` ist die Chromebook-Anleitung.

Nach dem Push auf `main` baut `.github/workflows/deploy-pages.yml` die App fuer
GitHub Pages. Danach den `github.io`-Link auf dem Handy oeffnen und
`App installieren` bzw. `Zum Home-Bildschirm` waehlen.

## Offline-Daten

Die App arbeitet lokal-only:

- keine Base44- oder Server-Anmeldung
- keine Synchronisation
- Datenhaltung in IndexedDB mit Migration aus altem localStorage
- Service Worker cached App-Shell und gebaute Assets
- Backups koennen in der App exportiert und importiert werden
