import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { buildSite } from './build-site.mjs';

export function createStaticServer(directory) {
  const root = fs.realpathSync(directory);
  const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm' };
  return http.createServer((request, response) => {
    const headers = { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { ...headers, Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { response.writeHead(400, headers); response.end('잘못된 주소입니다.'); return; }
    if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part === '..' || part === '.')) {
      response.writeHead(400, headers); response.end('잘못된 주소입니다.'); return;
    }
    let file = path.join(root, pathname);
    const relative = path.relative(root, file);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      response.writeHead(400, headers); response.end('잘못된 주소입니다.'); return;
    }
    let status = 200;
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!pathname.endsWith('/')) {
        response.writeHead(308, { Location: pathname + '/' }); response.end(); return;
      }
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile() || !Object.hasOwn(contentTypes, path.extname(file)) || fs.realpathSync(file) !== file) {
      file = path.join(root, '404.html'); status = 404;
    }
    const svgPolicy = path.extname(file) === '.svg' ? { 'Content-Security-Policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'" } : {};
    response.writeHead(status, { ...headers, ...svgPolicy, 'Content-Type': contentTypes[path.extname(file)] });
    if (request.method === 'HEAD') response.end();
    else response.end(fs.readFileSync(file));
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { dist } = buildSite();
    const port = Number(process.env.PORT ?? 4173);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT는 1부터 65535까지의 정수여야 합니다.');
    const server = createStaticServer(dist);
    server.on('error', cause => { console.error(`서버 오류: ${cause.message}`); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => {
      console.log(`Local: http://127.0.0.1:${port}/`);
      console.log('콘텐츠 수정 후 npm run build를 실행하고 브라우저를 새로 고침하세요.');
    });
    const stop = () => server.close();
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  } catch (cause) { console.error(`실행 실패: ${cause.message}`); process.exitCode = 1; }
}
