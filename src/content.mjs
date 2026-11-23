import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from './markdown.mjs';
import { loadCategories, validatePageCategory } from './categories.mjs';

export const baseRoutes = new Set(['/', '/tech/', '/hobby/', '/projects/', '/study/', '/reviews/', '/about/']);

function inside(base, file) {
  const relative = path.relative(base, file);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export function loadPublicPages(root) {
  const categories = loadCategories(root);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/manifest.json'), 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.pages)) throw new Error('공개 목록의 형식이 잘못되었습니다.');
  const contentRoot = fs.realpathSync(path.join(root, 'content'));
  const files = new Set();
  const routes = new Set();
  return manifest.pages.map(item => {
    if (!item || typeof item.path !== 'string' || path.isAbsolute(item.path) || path.win32.isAbsolute(item.path)) {
      throw new Error('공개 문서는 content/ 안의 상대경로로 지정해야 합니다.');
    }
    const file = path.resolve(root, item.path.replace(/\\/g, '/'));
    if (!inside(contentRoot, file) || path.extname(file) !== '.md' || path.basename(file).toLowerCase() === 'readme.md') {
      throw new Error(`공개할 수 없는 파일 경로: ${item.path}`);
    }
    if (!inside(contentRoot, fs.realpathSync(file)) || files.has(file)) throw new Error(`공개 파일 경로가 중복되거나 범위를 벗어났습니다: ${item.path}`);
    files.add(file);
    const { meta, body } = parseDocument(fs.readFileSync(file, 'utf8'));
    validatePageCategory(meta, categories, item.path);
    const contentPath = path.relative(contentRoot, file).split(path.sep).join('/');
    const location = meta.type === 'project' ? /^projects\/.+\.md$/
      : meta.type === 'study' ? /^study\/.+\.md$/
      : meta.type === 'review' ? /^reviews\/.+\.md$/
      : meta.type === 'profile' ? /^profile\.md$/ : null;
    if (!location?.test(contentPath)) throw new Error(`문서 종류에 맞지 않는 저장 위치: ${item.path}`);
    if (meta.status !== 'reviewed' || meta.visibility !== 'public' || !Array.isArray(meta.sources) || !meta.sources.length) {
      throw new Error(`검토 완료된 공개 문서와 출처가 필요합니다: ${item.path}`);
    }
    if (typeof meta.title !== 'string' || !meta.title.trim()) throw new Error(`제목이 없습니다: ${item.path}`);
    for (const key of ['created', 'updated']) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(meta[key] ?? '')) throw new Error(`날짜가 잘못되었습니다: ${item.path}`);
    }
    if (typeof item.slug !== 'string') throw new Error(`공개 경로가 없습니다: ${item.path}`);
    const route = item.slug.replace(/\/$/, '') + '/';
    const expected = meta.type === 'project' ? /^\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/
      : meta.type === 'study' ? /^\/study\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/
      : meta.type === 'review' ? /^\/reviews\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/
      : meta.type === 'profile' ? /^\/about\/$/ : null;
    if (!expected?.test(route) || routes.has(route)) throw new Error(`문서 종류에 맞지 않거나 중복된 공개 경로: ${item.slug}`);
    routes.add(route);
    if (item.featured !== undefined && typeof item.featured !== 'boolean') throw new Error(`featured는 true 또는 false여야 합니다: ${item.path}`);
    if (item.featured && meta.type !== 'project') throw new Error(`대표 작업에는 프로젝트만 지정할 수 있습니다: ${item.path}`);
    if (meta.summary !== undefined && typeof meta.summary !== 'string') throw new Error(`summary는 문자열이어야 합니다: ${item.path}`);
    return { file, route, meta, body, featured: item.featured === true };
  });
}

export function resolvePublicLink(target, page, pages) {
  if (/^(?:https?:\/\/|mailto:|tel:|#)/i.test(target)) return target;
  if (target.startsWith('//') || target.includes('\\')) throw new Error(`지원하지 않는 링크: ${target}`);
  const parts = target.match(/^([^?#]*)([?#].*)?$/);
  if (!parts) throw new Error(`잘못된 링크: ${target}`);
  let pathname;
  try { pathname = decodeURIComponent(parts[1]); }
  catch { throw new Error(`잘못된 링크 인코딩: ${target}`); }
  const suffix = parts[2] ?? '';
  if (pathname.startsWith('/')) {
    const route = pathname === '/' ? '/' : pathname.replace(/\/$/, '') + '/';
    if (!baseRoutes.has(route) && !pages.some(item => item.route === route)) throw new Error(`사이트에 없는 경로: ${target}`);
    return route + suffix;
  }
  const file = path.resolve(path.dirname(page.file), pathname);
  const linked = pages.find(item => item.file === file);
  if (!linked) throw new Error(`공개 목록에 없는 문서 링크: ${target}`);
  return linked.route + suffix;
}
