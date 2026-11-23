import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { canonicalMediaSource, discoverBodyMedia, loadEditorPosts, loadPostSettings, validatePostSettings, savePostSettings, stripReferenceBlocks } from '../src/preview/post-settings.mjs';
import { buildPreview } from './build-preview.mjs';
import { buildSite } from './build-site.mjs';
import { createStaticServer } from './serve.mjs';
import { renderMarkdown } from '../src/markdown.mjs';
import { loadPublicPages } from '../src/content.mjs';

const defaultRoot = fileURLToPath(new URL('..', import.meta.url));
const maximumBody = 32 * 1024 * 1024;
const maximumUpload = 25 * 1024 * 1024;
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const videoExtensions = new Set(['.mp4', '.webm']);
const editorFiles = new Map([
  ['/__editor/', ['editor.html', 'text/html; charset=utf-8']],
  ['/__editor/editor.js', ['editor.js', 'application/javascript; charset=utf-8']],
  ['/__editor/editor.css', ['editor.css', 'text/css; charset=utf-8']],
]);

class RequestError extends Error {
  constructor(status, message, options) { super(message, options); this.status = status; }
}

function json(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}

function localHost(value) {
  let url;
  try { url = new URL(`http://${value}`); } catch { return false; }
  return ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) && url.host === value;
}

function checkOrigin(request) {
  if (!localHost(request.headers.host ?? '')) throw new RequestError(403, '로컬 주소에서만 사용할 수 있습니다.');
  const remote = request.socket.remoteAddress;
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote)) throw new RequestError(403, '로컬 연결만 허용합니다.');
  if (request.headers.origin && request.headers.origin !== `http://${request.headers.host}`) {
    throw new RequestError(403, '편집기와 같은 출처에서 요청해야 합니다.');
  }
}

function checkToken(request, csrfToken) {
  const supplied = Buffer.from(typeof request.headers['x-editor-token'] === 'string' ? request.headers['x-editor-token'] : '');
  const expected = Buffer.from(csrfToken);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new RequestError(403, '편집기를 다시 열어 저장 토큰을 받아 주세요.');
}

async function readJson(request) {
  if ((request.headers['content-type'] ?? '').split(';')[0].trim() !== 'application/json') {
    request.resume();
    throw new RequestError(415, 'application/json 요청이 필요합니다.');
  }
  if (Number(request.headers['content-length']) > maximumBody) {
    request.resume();
    throw new RequestError(413, '요청은 32MB 이하여야 합니다.');
  }
  const body = await new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0;
    request.on('data', chunk => {
      length += chunk.length;
      if (length <= maximumBody) chunks.push(chunk);
      else chunks.length = 0;
    });
    request.on('end', () => length > maximumBody ? reject(new RequestError(413, '요청은 32MB 이하여야 합니다.')) : resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
    request.on('aborted', () => reject(new RequestError(400, '요청이 중단됐습니다.')));
  });
  let parsed;
  try { parsed = JSON.parse(body); } catch { throw new RequestError(400, 'JSON을 읽을 수 없습니다.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new RequestError(400, '요청 객체가 필요합니다.');
  return parsed;
}

function safeFile(root, ...segments) {
  const target = path.resolve(root, ...segments);
  const relative = path.relative(root, target);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new RequestError(400, '저장 경로가 잘못되었습니다.');
  let cursor = root;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
    if (fs.existsSync(cursor) && (fs.lstatSync(cursor).isSymbolicLink() || fs.realpathSync(cursor) !== cursor)) throw new RequestError(400, '다른 위치를 가리키는 저장 경로는 허용하지 않습니다.');
  }
  return target;
}

function postFile(root, post) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.meta.id ?? '')) throw new RequestError(400, '게시물 ID가 잘못되었습니다.');
  return safeFile(root, 'content', 'post-settings', `${post.meta.id}.json`);
}

function revision(root, post) {
  const file = postFile(root, post);
  return createHash('sha256').update(fs.existsSync(file) ? fs.readFileSync(file) : JSON.stringify(loadPostSettings(root, post))).digest('hex');
}

function publicPosts(root, mode) {
  const posts = mode === 'preview' ? loadEditorPosts(root) : loadPublicPages(root);
  return posts.filter(post => ['project', 'study', 'review'].includes(post.meta.type));
}

function findPost(root, id, mode) {
  if (typeof id !== 'string') throw new RequestError(400, '게시물 ID가 필요합니다.');
  const post = publicPosts(root, mode).find(post => post.meta.id === id);
  if (!post) throw new RequestError(404, '공개 목록에 등록된 게시물을 찾을 수 없습니다.');
  return post;
}

function paragraphCount(body) {
  return (renderMarkdown(body, { renderMedia: () => '' }).match(/<p>/g) ?? []).length;
}

function validUpload(extension, data) {
  if (['.jpg', '.jpeg'].includes(extension)) return data.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  if (extension === '.png') return data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === '.gif') return /^GIF8[79]a$/.test(data.subarray(0, 6).toString('ascii'));
  if (extension === '.webp') return data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP';
  if (extension === '.mp4') return data.subarray(4, 8).toString('ascii') === 'ftyp';
  return data.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]));
}

/** Local authoring server. Only its CLI listens, and that listener binds to loopback. */
export function createEditorServer({ root = defaultRoot, runChecks = true, rebuild, mode = 'site' } = {}) {
  if (!['site', 'preview'].includes(mode)) throw new Error('편집 모드는 site 또는 preview여야 합니다.');
  const basePath = mode === 'preview' ? '/preview/devblog' : '';
  rebuild ??= mode === 'preview' ? buildPreview : buildSite;
  root = fs.realpathSync(root);
  const output = rebuild({ root, runChecks });
  const directory = output.dist ?? output.directory;
  const staticHandler = createStaticServer(directory).listeners('request')[0];
  const csrfToken = randomBytes(32).toString('base64url');
  let queue = Promise.resolve();
  const enqueue = action => {
    const result = queue.then(action);
    queue = result.catch(() => {});
    return result;
  };

  function persist(post, settings, uploadedFile) {
    const file = postFile(root, post);
    const before = fs.existsSync(file) ? fs.readFileSync(file) : null;
    try {
      savePostSettings(root, post, settings);
      rebuild({ root, runChecks });
    } catch (cause) {
      if (before !== null) fs.writeFileSync(safeFile(root, path.relative(root, file)), before);
      else if (fs.existsSync(file)) fs.unlinkSync(safeFile(root, path.relative(root, file)));
      if (uploadedFile && fs.existsSync(uploadedFile)) fs.unlinkSync(safeFile(root, path.relative(root, uploadedFile)));
      try { rebuild({ root, runChecks }); } catch { /* 다음 저장 또는 명시적 빌드로 재시도할 수 있다. */ }
      throw new RequestError(500, '미리보기 생성에 실패해 저장 내용을 되돌렸습니다.', { cause });
    }
    return { ok: true, settings: loadPostSettings(root, post), revision: revision(root, post), previewUrl: `${basePath}${post.route}` };
  }

  const server = http.createServer(async (request, response) => {
    try {
      checkOrigin(request);
      let url;
      try { url = new URL(request.url, `http://${request.headers.host}`); } catch { throw new RequestError(400, '주소가 잘못되었습니다.'); }
      if (url.pathname === '/__editor/api' && request.method === 'GET') {
        const posts = publicPosts(root, mode).map(post => {
          const settings = loadPostSettings(root, post);
          return { id: post.meta.id, title: post.meta.title, route: `${basePath}${post.route}`, type: post.meta.type, settings, paragraphs: paragraphCount(stripReferenceBlocks(post.body, settings.referenceBlocks)), inlineSources: discoverBodyMedia(post.body).map(media => canonicalMediaSource(post, media.src)), revision: revision(root, post) };
        });
        json(response, 200, { csrfToken, posts, basePath, mode });
        return;
      }
      if (url.pathname.startsWith('/__editor/api')) {
        if (request.method !== 'POST') throw new RequestError(405, 'POST 요청이 필요합니다.');
        if (!['/__editor/api/settings', '/__editor/api/upload'].includes(url.pathname)) throw new RequestError(404, '편집 API를 찾을 수 없습니다.');
        checkToken(request, csrfToken);
        const body = await readJson(request);
        const result = await enqueue(() => {
          const post = findPost(root, body.postId, mode);
          if (body.revision !== undefined && body.revision !== revision(root, post)) throw new RequestError(409, '다른 편집으로 내용이 바뀌었습니다. 새로 고침한 뒤 다시 저장해 주세요.');
          if (url.pathname === '/__editor/api/settings') {
            let settings;
            try { settings = validatePostSettings(root, post, body.settings); }
            catch (cause) { throw new RequestError(400, cause.message); }
            return persist(post, settings);
          }
          if (typeof body.filename !== 'string' || !body.filename.trim() || /[\\/\0]/.test(body.filename) || body.filename !== path.basename(body.filename)) throw new RequestError(400, '파일 이름에 경로를 넣을 수 없습니다.');
          const extension = path.extname(body.filename).toLowerCase();
          if (!imageExtensions.has(extension) && !videoExtensions.has(extension)) throw new RequestError(400, 'JPG·PNG·WebP·GIF 이미지와 MP4·WebM 영상만 업로드할 수 있습니다.');
          if (typeof body.data !== 'string' || !body.data.length || body.data.length % 4 || /[^A-Za-z0-9+/=]/.test(body.data)) throw new RequestError(400, '파일 데이터가 올바른 Base64가 아닙니다.');
          const data = Buffer.from(body.data, 'base64');
          if (data.toString('base64') !== body.data) throw new RequestError(400, '파일 데이터가 올바른 Base64가 아닙니다.');
          if (!data.length || data.length > maximumUpload) throw new RequestError(413, '첨부 파일은 25MB 이하여야 합니다.');
          if (!validUpload(extension, data)) throw new RequestError(400, '확장자와 파일 형식이 일치하지 않습니다.');
          postFile(root, post);
          const name = `${Date.now()}-${randomBytes(8).toString('hex')}${extension}`;
          const upload = safeFile(root, 'content', 'media', post.meta.id, name);
          fs.mkdirSync(path.dirname(upload), { recursive: true });
          safeFile(root, 'content', 'media', post.meta.id, name);
          fs.writeFileSync(upload, data, { flag: 'wx' });
          const src = `/media/${post.meta.id}/${name}`;
          try {
            const settings = structuredClone(loadPostSettings(root, post));
            settings.media.push({ src, kind: imageExtensions.has(extension) ? 'image' : 'video', alt: '', caption: '', width: 100, ratio: 'auto', fit: 'contain', align: 'center', position: 'end' });
            const result = persist(post, validatePostSettings(root, post, settings), upload);
            return { ...result, src, snippet: imageExtensions.has(extension) ? `![이미지 설명](${src})` : `:::video ${src}\n영상 설명\n:::` };
          } catch (cause) {
            if (fs.existsSync(upload)) fs.unlinkSync(safeFile(root, path.relative(root, upload)));
            throw cause;
          }
        });
        json(response, 200, result);
        return;
      }
      if (editorFiles.has(url.pathname)) {
        if (!['GET', 'HEAD'].includes(request.method)) throw new RequestError(405, 'GET 요청이 필요합니다.');
        const [name, mime] = editorFiles.get(url.pathname);
        const file = new URL(`../src/preview/${name}`, import.meta.url);
        if (!fs.existsSync(file)) throw new RequestError(404, '편집기 파일을 찾을 수 없습니다.');
        response.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        let contents = fs.readFileSync(file);
        if (name === 'editor.html') contents = Buffer.from(contents.toString('utf8').replaceAll('href="/assets/', `href="${basePath}/assets/`));
        response.end(request.method === 'HEAD' ? undefined : contents);
        return;
      }
      if (url.pathname === '/__editor') {
        response.writeHead(302, { Location: '/__editor/' }); response.end(); return;
      }
      staticHandler(request, response);
    } catch (cause) {
      if (!cause.status || cause.status >= 500) console.error('로컬 편집 요청 실패:', cause);
      if (!response.headersSent) json(response, cause.status ?? 500, { ok: false, error: cause.status ? cause.message : '편집 요청을 처리할 수 없습니다.' });
      else response.end();
    }
  });
  server.requestTimeout = 30_000;
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = process.argv.includes('--preview') ? 'preview' : 'site';
    const port = Number(process.env.EDITOR_PORT ?? (mode === 'preview' ? 4176 : 4175));
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('EDITOR_PORT는 1부터 65535까지의 정수여야 합니다.');
    const server = createEditorServer({ mode });
    server.on('error', cause => { console.error(`편집 서버 오류: ${cause.message}`); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Local editor: http://127.0.0.1:${port}/__editor/`));
    const stop = () => server.close();
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  } catch (cause) { console.error(`편집 서버 실행 실패: ${cause.message}`); process.exitCode = 1; }
}
