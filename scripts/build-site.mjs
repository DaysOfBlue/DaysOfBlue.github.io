import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildThemedSite } from './build-themed-site.mjs';

export function buildSite(options = {}) {
  const { directory, pages } = buildThemedSite({ ...options, preview: false });
  return { dist: directory, pages };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { buildSite(); }
  catch (cause) { console.error('빌드 실패: ' + cause.message); process.exitCode = 1; }
}
