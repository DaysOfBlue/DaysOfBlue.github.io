import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { loadCategories, validatePageCategory } from '../src/categories.mjs';

const root = fs.realpathSync(new URL('..', import.meta.url));
const strictSources = process.argv.includes('--strict-sources');
const errors = [];
const warnings = [];
const pages = new Map();
const sources = new Map();
const sourceFiles = new Set();
let categories = null;
const publicRoutes = new Set(['/', '/tech/', '/hobby/', '/projects/', '/study/', '/reviews/', '/about/']);
const required = ['id', 'title', 'type', 'status', 'visibility', 'created', 'updated', 'sources'];
const relative = value => path.relative(root, value).split(path.sep).join('/');
const error = message => errors.push(message);
const warn = message => warnings.push(message);
const sourceIssue = message => (strictSources ? error : warn)(message);
const exists = file => fs.existsSync(file);
const inside = (base, file) => {
  const rel = path.relative(base, file);
  return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel));
};
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const kebab = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

function safePath(value, label, base = root) {
  if (typeof value !== 'string' || !value || value.includes('\0') || path.isAbsolute(value) || path.win32.isAbsolute(value)) {
    error(`${label}: 저장소 기준 상대경로가 필요합니다.`);
    return null;
  }
  const file = path.resolve(base, value.replace(/[\\/]/g, path.sep));
  if (!inside(root, file) || (exists(file) && !inside(root, fs.realpathSync(file)))) {
    error(`${label}: 저장소 밖을 가리킵니다.`);
    return null;
  }
  return file;
}

function readJson(name) {
  try { return JSON.parse(fs.readFileSync(path.join(root, name), 'utf8')); }
  catch (cause) { error(`${name}: JSON을 읽을 수 없습니다 (${cause.message}).`); return null; }
}

function walk(directory) {
  if (!exists(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) { error(`${relative(file)}: 심볼릭 링크는 검사 대상에서 허용하지 않습니다.`); return []; }
    return entry.isDirectory() ? walk(file) : entry.isFile() && entry.name.endsWith('.md') ? [file] : [];
  }).sort();
}

function readPage(file) {
  if (pages.has(file)) return pages.get(file);
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const page = { text, body: text, meta: null };
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (match) {
    page.meta = {};
    page.body = text.slice(match[0].length);
    for (const line of match[1].split(/\r?\n/)) {
      if (!line.trim() || line.trimStart().startsWith('#')) continue;
      const field = line.match(/^([a-z_]+):\s*(.*?)\s*$/);
      if (!field || Object.hasOwn(page.meta, field[1])) { error(`${relative(file)}: frontmatter 형식 또는 중복 키 오류 (${line}).`); continue; }
      const [, key, raw] = field;
      try {
        page.meta[key] = key === 'sources' || raw.startsWith('"') ? JSON.parse(raw)
          : raw.startsWith("'") && raw.endsWith("'") ? raw.slice(1, -1).replace(/''/g, "'") : raw;
      } catch { error(`${relative(file)}: ${key} 값을 해석할 수 없습니다.`); }
    }
  }
  pages.set(file, page);
  return page;
}

function checkSources() {
  const registry = readJson('raw/manifest.json');
  if (!registry) return;
  if (registry.version !== 1 || !Array.isArray(registry.sources)) { error('raw/manifest.json: version: 1과 sources 배열이 필요합니다.'); return; }
  const paths = new Set();
  for (const source of registry.sources) {
    if (!source || typeof source !== 'object') { error('raw/manifest.json: 잘못된 원자료 항목입니다.'); continue; }
    const label = `원자료 ${source.id ?? '(id 없음)'}`;
    if (!kebab(source.id) || sources.has(source.id)) error(`${label}: id 형식이 잘못되었거나 중복되었습니다.`);
    else sources.set(source.id, source);
    if (typeof source.title !== 'string' || !source.title.trim()) error(`${label}: title이 필요합니다.`);
    if (!date(source.acquired)) error(`${label}: acquired 날짜가 잘못되었습니다.`);
    for (const key of ['author', 'published', 'url']) {
      if (!Object.hasOwn(source, key) || !(source[key] === null || typeof source[key] === 'string')) error(`${label}: ${key}는 문자열 또는 null이어야 합니다.`);
    }
    if (source.published !== null && !date(source.published)) error(`${label}: published는 날짜 또는 null이어야 합니다.`);
    if (!['pending', 'ingested'].includes(source.ingest_status)) error(`${label}: ingest_status가 잘못되었습니다.`);
    if (!['provided-text', 'web-text', 'unverified'].includes(source.verification)) error(`${label}: verification이 잘못되었습니다.`);
    if (!Object.hasOwn(source, 'wiki_page') || !(source.wiki_page === null || typeof source.wiki_page === 'string')) error(`${label}: wiki_page는 경로 또는 null이어야 합니다.`);
    const file = safePath(source.path, `${label} path`);
    if (!/^[a-fA-F0-9]{64}$/.test(source.sha256 ?? '')) error(`${label}: sha256 형식이 잘못되었습니다.`);
    if (file) {
      sourceFiles.add(file.toLowerCase());
      if (!inside(path.join(root, 'raw'), file)) error(`${label}: 원본은 raw/ 안에 있어야 합니다.`);
      if (paths.has(file.toLowerCase())) error(`${label}: 원본 경로가 중복되었습니다.`);
      paths.add(file.toLowerCase());
      if (!exists(file)) sourceIssue(`${label}: 원본이 없습니다 (${source.path}).`);
      else if (!fs.statSync(file).isFile()) error(`${label}: 원본 경로가 파일이 아닙니다.`);
      else if (createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== String(source.sha256).toLowerCase()) error(`${label}: 원본 SHA-256이 일치하지 않습니다.`);
    }
    if (source.ingest_status === 'ingested' && !source.wiki_page) error(`${label}: ingested에는 wiki_page가 필요합니다.`);
    if (source.wiki_page) {
      const wiki = safePath(source.wiki_page, `${label} wiki_page`);
      if (wiki && (!exists(wiki) || !fs.statSync(wiki).isFile() || !inside(path.join(root, 'wiki'), wiki))) error(`${label}: wiki_page 파일이 wiki/ 안에 존재해야 합니다.`);
    }
  }
}

function checkMetadata(files) {
  const ids = new Set();
  for (const file of files) {
    const name = relative(file);
    const meta = readPage(file).meta;
    if (!meta) { error(`${name}: frontmatter가 없습니다.`); continue; }
    for (const key of required) if (!Object.hasOwn(meta, key)) error(`${name}: ${key}가 없습니다.`);
    if (!kebab(meta.id) || ids.has(meta.id)) error(`${name}: id 형식이 잘못되었거나 중복되었습니다.`);
    ids.add(meta.id);
    for (const key of ['title', 'type']) if (typeof meta[key] !== 'string' || !meta[key].trim()) error(`${name}: ${key}는 빈 문자열일 수 없습니다.`);
    if (!['source', 'concept', 'project', 'decision', 'profile', 'study', 'review'].includes(meta.type)) error(`${name}: type이 잘못되었습니다.`);
    if (name.startsWith('content/')) {
      const location = { project: /^content\/projects\/.+\.md$/, study: /^content\/study\/.+\.md$/, review: /^content\/reviews\/.+\.md$/, profile: /^content\/profile\.md$/ }[meta.type];
      if (!location?.test(name)) error(`${name}: 문서 종류와 저장 위치가 맞지 않습니다.`);
      if (categories) {
        try { validatePageCategory(meta, categories, name); }
        catch (cause) { error(cause.message); }
      }
    }
    if (!['draft', 'reviewed', 'archived'].includes(meta.status)) error(`${name}: status가 잘못되었습니다.`);
    const visibility = name.startsWith('content/') ? 'public' : 'internal';
    if (meta.visibility !== visibility) error(`${name}: visibility는 ${visibility}이어야 합니다.`);
    if (!date(meta.created) || !date(meta.updated) || meta.updated < meta.created) error(`${name}: created/updated 날짜 또는 순서가 잘못되었습니다.`);
    if (!Array.isArray(meta.sources) || meta.sources.some(id => typeof id !== 'string' || !sources.has(id))) error(`${name}: sources는 등록된 원자료 ID의 JSON 배열이어야 합니다.`);
  }
}

function withoutCode(text) {
  let fence = null;
  const lines = text.split(/\r?\n/).map(line => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      return '';
    }
    return fence ? '' : line;
  }).join('\n');
  return lines.replace(/(`+)[\s\S]*?\1/g, '');
}

function localLinks(file) {
  const text = withoutCode(readPage(file).body);
  if (/\[\[[^\]\n]+\]\]/.test(text)) error(`${relative(file)}: Obsidian 링크 대신 일반 Markdown 링크를 사용하세요.`);
  const targets = [...text.matchAll(/!?\[[^\]\n]*\]\((<[^>\n]+>|[^)\n]+)\)/g)].map(match => match[1]);
  targets.push(...[...text.matchAll(/^ {0,3}\[[^\]\n]+\]:\s*(<[^>\n]+>|\S+)/gm)].map(match => match[1]));
  return targets.flatMap(raw => {
    const target = raw.startsWith('<') ? raw.slice(1, raw.indexOf('>')) : raw.replace(/\s+["'][\s\S]*$/, '').trim();
    if (!target || /^(?:https?:|mailto:|tel:|data:|#)/i.test(target)) return [];
    let clean;
    try { clean = decodeURIComponent(target.split(/[?#]/, 1)[0]); }
    catch { error(`${relative(file)}: 링크 인코딩이 잘못되었습니다 (${target}).`); return []; }
    if (!clean) return [];
    if (clean.startsWith('/') && relative(file).startsWith('content/')) {
      if (clean.startsWith('/media/')) {
        const media = safePath(`content${clean}`, `${relative(file)} 첨부 ${target}`);
        return media ? [media] : [];
      }
      const route = clean === '/' ? '/' : clean.replace(/\/$/, '') + '/';
      if (!publicRoutes.has(route)) error(`${relative(file)}: 사이트에 없는 경로입니다 (${target}).`);
      return [];
    }
    const linked = safePath(clean, `${relative(file)} 링크 ${target}`, path.dirname(file));
    return linked ? [linked] : [];
  });
}

function checkPublicPages() {
  const manifest = readJson('content/manifest.json');
  if (!manifest) return 0;
  if (manifest.version !== 1 || !Array.isArray(manifest.pages)) { error('content/manifest.json: version: 1과 pages 배열이 필요합니다.'); return 0; }
  for (const item of manifest.pages) if (typeof item?.slug === 'string') publicRoutes.add(item.slug === '/' ? '/' : item.slug.replace(/\/$/, '') + '/');
  const paths = new Set();
  const slugs = new Set();
  for (const item of manifest.pages) {
    if (!item || typeof item !== 'object') { error('content/manifest.json: 잘못된 공개 항목입니다.'); continue; }
    const file = safePath(item.path, '공개 문서 path');
    if (!file) continue;
    if (!inside(path.join(root, 'content'), file) || !file.endsWith('.md') || path.basename(file).toLowerCase() === 'readme.md') { error(`${item.path}: 공개 콘텐츠 Markdown 경로가 필요합니다.`); continue; }
    if (paths.has(file.toLowerCase())) error(`${item.path}: 공개 경로가 중복되었습니다.`);
    paths.add(file.toLowerCase());
    if (typeof item.slug !== 'string' || !/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9-]*$/.test(item.slug) || slugs.has(item.slug)) error(`${item.path}: slug 형식이 잘못되었거나 중복되었습니다.`);
    const route = typeof item.slug === 'string' ? item.slug.replace(/\/$/, '') + '/' : '';
    if (slugs.has(route)) error(`${item.path}: 공개 경로가 중복되었습니다.`);
    slugs.add(route);
    if (item.featured !== undefined && typeof item.featured !== 'boolean') error(`${item.path}: featured는 true 또는 false여야 합니다.`);
    if (!exists(file) || !fs.statSync(file).isFile()) { error(`${item.path}: 공개 파일이 없습니다.`); continue; }
    const { meta, body } = readPage(file);
    if (!meta || meta.status !== 'reviewed' || meta.visibility !== 'public' || !Array.isArray(meta.sources) || meta.sources.length < 1) error(`${item.path}: 공개에는 reviewed, public, 출처 1개 이상이 필요합니다.`);
    const expected = { project: /^\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/, study: /^\/study\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/, review: /^\/reviews\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/, profile: /^\/about\/$/ }[meta?.type];
    if (!expected?.test(route)) error(`${item.path}: 문서 종류에 맞는 공개 경로가 필요합니다.`);
    if (item.featured && meta?.type !== 'project') error(`${item.path}: 대표 작업에는 프로젝트만 지정할 수 있습니다.`);
    if (/\b(?:TODO|TBD)\b|\{\{[\s\S]*?\}\}|미작성/i.test(body)) error(`${item.path}: 미완성 표시가 남아 있습니다.`);
    for (const linked of localLinks(file)) {
      const target = relative(linked);
      if (sourceFiles.has(linked.toLowerCase()) || /^(?:raw|wiki|templates|docs)(?:\/|$)/i.test(target) || /^(?:AGENTS|agent)\.md$/i.test(target)) error(`${item.path}: 내부 자료 링크를 공개할 수 없습니다 (${target}).`);
    }
  }
  return manifest.pages.length;
}

async function checkPreviewInputs() {
  if (!['content/site.json', 'content/post-settings', 'content/media'].some(name => exists(path.join(root, name)))) return;
  try {
    const { loadPreviewSettings } = await import('../src/preview/settings.mjs');
    const { loadEditorPosts, loadPostSettings } = await import('../src/preview/post-settings.mjs');
    loadPreviewSettings(root);
    for (const post of loadEditorPosts(root)) loadPostSettings(root, post);
  } catch (cause) { error(`미리보기 설정: ${cause.message}`); }
}

async function main() {
  try { categories = loadCategories(root); }
  catch (cause) { error(cause.message); }
  checkSources();
  await checkPreviewInputs();
  const wiki = walk(path.join(root, 'wiki'));
  const content = walk(path.join(root, 'content'));
  checkMetadata([...wiki.filter(file => /^wiki\/(?:sources|concepts|projects|decisions)\//.test(relative(file))), ...content.filter(file => path.basename(file).toLowerCase() !== 'readme.md')]);
  const publicCount = checkPublicPages();
  const markdown = [...new Set(['README.md', 'AGENTS.md', 'agent.md'].map(name => path.join(root, name)).concat(wiki, content, walk(path.join(root, 'docs')), walk(path.join(root, 'templates'))))];
  for (const file of markdown) {
    if (!exists(file)) { error(`${relative(file)}: 필수 파일이 없습니다.`); continue; }
    for (const linked of localLinks(file)) if (!exists(linked)) {
      const message = `${relative(file)}: 링크 대상이 없습니다 (${relative(linked)}).`;
      if (inside(path.join(root, 'raw'), linked)) sourceIssue(message); else error(message);
    }
  }
  const index = path.join(root, 'wiki', 'index.md');
  if (!exists(index)) error('wiki/index.md: 파일이 없습니다.');
  else {
    const indexed = new Set(localLinks(index));
    for (const file of wiki.filter(file => !['wiki/index.md', 'wiki/log.md'].includes(relative(file)))) if (!indexed.has(file)) error(`wiki/index.md: ${relative(file)} 링크가 없습니다.`);
  }
  const log = path.join(root, 'wiki', 'log.md');
  if (!exists(log)) error('wiki/log.md: 파일이 없습니다.');
  else {
    let previous = '';
    for (const line of withoutCode(readPage(log).body).split(/\r?\n/).filter(line => line.startsWith('## '))) {
      const entry = line.match(/^## \[(\d{4}-\d{2}-\d{2})\] [a-z][a-z-]* \| .+$/);
      if (!entry || !date(entry[1]) || entry[1] < previous) error(`wiki/log.md: 기록 헤더 형식 또는 날짜 순서 오류 (${line}).`);
      if (entry) previous = entry[1];
    }
  }
  for (const message of [...new Set(warnings)]) console.warn(`경고: ${message}`);
  for (const message of [...new Set(errors)]) console.error(`오류: ${message}`);
  console.log(`검사: 원자료 ${sources.size}개, Markdown ${markdown.length}개, 공개 목록 ${publicCount}개. 오류 ${new Set(errors).size}개, 경고 ${new Set(warnings).size}개.`);
  console.log('이 검사는 구조·경로·해시를 확인하며, 의미나 사실의 정확성을 검증하지 않습니다.');
}

try { await main(); }
catch (cause) { error(`검사를 완료하지 못했습니다: ${cause.message}`); console.error(errors.at(-1)); }
process.exitCode = errors.length ? 1 : 0;
