import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildThemedSite } from './build-themed-site.mjs';

export function buildPreview(options = {}) {
  return buildThemedSite({ ...options, preview: true });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { buildPreview(); }
  catch (cause) { console.error('미리보기 빌드 실패: ' + cause.message); process.exitCode = 1; }
}
