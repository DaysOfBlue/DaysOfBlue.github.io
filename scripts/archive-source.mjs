import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const value = key => args[args.indexOf(key) + 1];
const id = value('--id');
const inputUrl = value('--url');

try {
  if (!args.includes('--id') || !args.includes('--url') || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id ?? '')) {
    throw new Error('사용법: node scripts/archive-source.mjs --id 출처-id --url https://원문주소');
  }
  const url = new URL(inputUrl);
  if (url.protocol !== 'https:') throw new Error('HTTPS 원문만 수집합니다.');
  const directory = path.join(root, 'raw/web/game-ai/2026-11-18', id);
  if (fs.existsSync(directory)) throw new Error(`이미 보관된 출처입니다. 덮어쓰지 않습니다: ${id}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(40000), headers: { 'User-Agent': 'HomepageSourceArchive/1.0 (personal reading archive)' } });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) throw new Error(`원문 응답 실패: HTTP ${response.status} (${response.url})`);
  const contentType = response.headers.get('content-type') ?? '';
  const extension = bytes.subarray(0, 5).toString('ascii') === '%PDF-' || contentType.includes('pdf') ? 'pdf' : contentType.includes('html') ? 'html' : contentType.includes('json') ? 'json' : 'txt';
  fs.mkdirSync(directory, { recursive: true });
  const original = path.join(directory, `original.${extension}`);
  fs.writeFileSync(original, bytes, { flag: 'wx' });
  const metadata = {
    id, requested_url: inputUrl, final_url: response.url, fetched_at: new Date().toISOString(), status: response.status,
    content_type: contentType, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
    original_path: path.relative(root, original).split(path.sep).join('/'),
    response_headers: Object.fromEntries(response.headers),
    capture_scope: 'HTTP response body only; linked images, scripts, styles and videos are not bundled.',
  };
  fs.writeFileSync(path.join(directory, 'capture.json'), JSON.stringify(metadata, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ id, status: metadata.status, url: metadata.final_url, path: metadata.original_path, bytes: metadata.bytes, sha256: metadata.sha256 }));
} catch (cause) {
  console.error(cause.message);
  process.exitCode = 1;
}
