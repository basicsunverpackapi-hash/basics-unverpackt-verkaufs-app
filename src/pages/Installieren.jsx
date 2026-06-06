import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Laptop, MonitorSmartphone, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const APP_LINK = 'https://basicsunverpackapi-hash.github.io/basics-unverpackt-verkaufs-app/';
const CHROMEBOOK_LINK = `${APP_LINK}chromebook-installieren.html`;
const ANDROID_LINK = `${APP_LINK}handy-installieren.html`;

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Link kopiert');
  } catch {
    toast.info(text);
  }
};

const LinkRow = ({ label, href }) => (
  <div className="rounded-lg border border-green-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 p-4 space-y-3">
    <div className="text-sm font-bold text-green-900 dark:text-green-300">{label}</div>
    <div className="text-sm break-all text-slate-700 dark:text-slate-300">{href}</div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={() => copyText(href)}>
        <Copy className="w-4 h-4 mr-2" />
        Link kopieren
      </Button>
      <Button type="button" variant="outline" asChild>
        <a href={href} target="_blank" rel="noreferrer">
          <ExternalLink className="w-4 h-4 mr-2" />
          Oeffnen
        </a>
      </Button>
    </div>
  </div>
);

export default function Installieren() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-700 to-emerald-700 rounded-2xl p-6 shadow-lg text-white">
        <h2 className="text-3xl font-bold">App installieren und verschicken</h2>
        <p className="text-green-50 mt-2">
          Dies ist der feste HTTPS-Weg fuer Chromebook, Android-Handy und Laptop.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorSmartphone className="w-5 h-5 text-green-700" />
              Chromebook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>Den Chromebook-Link in Chrome oeffnen.</li>
              <li>In der Adressleiste oder im Chrome-Menue auf App installieren klicken.</li>
              <li>Danach liegt Basics Kasse im Chromebook-Launcher.</li>
            </ol>
            <LinkRow label="Chromebook-Link" href={CHROMEBOOK_LINK} />
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-700" />
              Android-Handy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>Den Android-Link in Chrome oeffnen.</li>
              <li>Chrome-Menue oeffnen.</li>
              <li>App installieren oder Zum Startbildschirm waehlen.</li>
            </ol>
            <LinkRow label="Android-Link" href={ANDROID_LINK} />
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-green-700" />
              Windows-Laptop
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>Der HTTPS-Link bleibt immer gleich.</li>
              <li>Wenn die App geaendert wurde, muss die neue Version auf GitHub Pages veroeffentlicht werden.</li>
              <li>Danach diesen Link an Handy oder Chromebook schicken.</li>
            </ol>
            <LinkRow label="Fester App-Link" href={APP_LINK} />
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle>Wenn der HTTPS-Link 404 zeigt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            Dann ist der Link richtig, aber GitHub Pages ist noch nicht veroeffentlicht. Auf dem Windows-Laptop im
            GitHub-Repository diese Schritte ausfuehren:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>GitHub oeffnen und in das Repository basics-unverpackt-verkaufs-app gehen.</li>
            <li>Settings oeffnen, dann Pages waehlen.</li>
            <li>Bei Source GitHub Actions einstellen und speichern.</li>
            <li>Actions oeffnen und Deploy PWA to GitHub Pages starten oder die Aenderungen auf main hochladen.</li>
            <li>Nach ein paar Minuten den festen App-Link erneut oeffnen.</li>
          </ol>
          <p className="font-bold text-slate-900 dark:text-white">
            Auf dem Windows-Laptop gibt es dafuer auch die Datei GitHub-Pages-reparieren-Windows.cmd im App-Ordner.
            Diese Datei laedt die korrigierte App auf GitHub hoch und startet GitHub Pages.
          </p>
        </CardContent>
      </Card>

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-6 space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p className="font-bold text-slate-900 dark:text-white">Wichtig</p>
          <p>
            Nicht den GitHub-Code-Link mit github.com verschicken. Installieren geht ueber den github.io-Link oben.
            Nach dem ersten Oeffnen speichert die App ihre Dateien offline und die Verkaufsdaten bleiben lokal auf dem Geraet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
