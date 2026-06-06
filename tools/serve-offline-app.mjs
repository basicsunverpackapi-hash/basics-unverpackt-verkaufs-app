import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, extname, join, relative, resolve } from 'node:path';

const readArg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};

const root = resolve(readArg('--root', join(process.cwd(), 'dist')));
const host = readArg('--host', '127.0.0.1');
const port = Number(readArg('--port', '8787'));

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const isInsideRoot = (filePath) => {
  const pathFromRoot = relative(root, filePath);
  return pathFromRoot === '' || (!pathFromRoot.startsWith('..') && !resolve(pathFromRoot).startsWith('..'));
};

const sendText = (response, status, text) => {
  response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(text);
};

const server = createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method || '')) {
    sendText(response, 405, 'Method not allowed');
    return;
  }

  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || `${host}:${port}`}`);
  let pathname;
  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    sendText(response, 400, 'Bad request');
    return;
  }

  if (pathname === '/') pathname = '/index.html';

  let filePath = resolve(root, `.${pathname}`);
  if (!isInsideRoot(filePath)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, 'index.html');
  }

  if (!existsSync(filePath)) {
    sendText(response, 404, 'App build not found');
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const headers = {
    'content-type': mimeTypes[ext] || 'application/octet-stream',
    'x-content-type-options': 'nosniff',
    'cache-control': basename(filePath) === 'sw.js'
      ? 'no-cache'
      : ext === '.js' || ext === '.css'
        ? 'public, max-age=31536000, immutable'
        : 'no-cache'
  };

  if (basename(filePath) === 'sw.js') {
    headers['service-worker-allowed'] = '/';
  }

  response.writeHead(200, headers);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Basics Unverpackt Kasse laeuft auf http://${host}:${port}/`);
});
