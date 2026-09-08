const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = 8000;
const host = '127.0.0.1';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function safePath(urlPath) {
  const clean = decodeURIComponent((urlPath || '/').split('?')[0]);
  const requested = clean === '/' ? '/index.html' : clean;
  const filePath = path.normalize(path.join(root, requested));
  if (!filePath.startsWith(path.normalize(root + path.sep))) return null;
  return filePath;
}

const server = http.createServer((req, res) => {
  let filePath = safePath(req.url);
  if (!filePath) {
    res.writeHead(403); res.end('Acesso negado'); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Arquivo nao encontrado');
        return;
      }
      res.writeHead(200, {
        'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  });
});

server.on('error', (err) => {
  console.error('\nNao foi possivel iniciar o servidor na porta 8000.');
  console.error(err.message);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log('==============================================================');
  console.log(' DLSN IMPORTS - SERVIDOR LOCAL');
  console.log('==============================================================');
  console.log(` Site: http://localhost:${port}`);
  console.log(' Mantenha esta janela aberta enquanto estiver usando o site.');
  console.log(' Para encerrar: Ctrl + C');
});
