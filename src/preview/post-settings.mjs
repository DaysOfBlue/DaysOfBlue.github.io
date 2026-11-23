import fs from 'node:fs';
import path from 'node:path';
import { parseDocument, renderMarkdown, escapeHtml } from '../markdown.mjs';
import { loadPublicPages, resolvePublicLink } from '../content.mjs';

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const videoExtensions = new Set(['.mp4', '.webm']);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const inside = (base, target) => { const rel = path.relative(base, target); return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel); };
const validId = id => typeof id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
const text = (value, label, required = false) => {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > 10000 || (required && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error(`${label}: 올바른 문자열이 필요합니다.`);
  return value;
};

function webUrl(value) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('HTTP(S) 주소만 사용할 수 있습니다.');
  return url;
}

export function youtubeEmbed(value) {
  const url = webUrl(value);
  if (url.protocol !== 'https:') throw new Error('YouTube에는 HTTPS 주소를 사용하세요.');
  let id;
  if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
  else if (['youtube.com', 'www.youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
    id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)$/)?.[1];
  }
  if (!/^[\w-]{11}$/.test(id ?? '')) throw new Error('올바른 YouTube 영상 주소가 필요합니다.');
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

export function localMediaFile(root, post, src) {
  if (!validId(post.meta.id) || typeof src !== 'string' || !src.startsWith(`/media/${post.meta.id}/`) || /[\\%?#\u0000-\u0020]/.test(src) || src.split('/').some(part => part === '.' || part === '..')) throw new Error('첨부는 해당 게시물의 /media/<게시물-id>/ 경로를 사용하세요.');
  const mediaRoot = path.resolve(root, 'content/media');
  const postRoot = path.join(mediaRoot, post.meta.id);
  const file = path.resolve(root, 'content', src.slice(1));
  if (!inside(postRoot, file) || !fs.existsSync(file) || !fs.statSync(file).isFile() || fs.realpathSync(file) !== file) throw new Error(`첨부 파일이 없거나 허용되지 않은 경로입니다: ${src}`);
  // 중간 디렉터리의 junction도 허용하지 않는다.
  for (let directory = path.dirname(file); inside(mediaRoot, directory); directory = path.dirname(directory)) {
    if (fs.realpathSync(directory) !== directory || fs.lstatSync(directory).isSymbolicLink()) throw new Error('첨부 폴더가 다른 경로를 가리킵니다.');
    if (directory === mediaRoot) break;
  }
  return file;
}

function validateMedia(root, post, value) {
  if (!object(value)) throw new Error('첨부 설정은 객체여야 합니다.');
  const src = text(value.src, '첨부 주소', true);
  const kind = value.kind ?? 'image';
  if (!['image', 'video', 'youtube'].includes(kind)) throw new Error('지원하지 않는 첨부 종류입니다.');
  if (kind === 'youtube') youtubeEmbed(src);
  else {
    let extension;
    if (src.startsWith('/')) extension = path.extname(localMediaFile(root, post, src)).toLowerCase();
    else {
      const url = webUrl(src);
      if (url.protocol !== 'https:') throw new Error('외부 첨부는 HTTPS를 사용하세요.');
      extension = path.extname(url.pathname).toLowerCase();
    }
    if (!(kind === 'image' ? imageExtensions : videoExtensions).has(extension)) throw new Error('지원하는 이미지 또는 MP4·WebM 파일을 사용하세요.');
  }
  const media = { src, kind, alt: text(value.alt, '대체 설명'), caption: text(value.caption, '캡션'), width: value.width ?? 100, ratio: value.ratio ?? 'auto', fit: value.fit ?? 'contain', align: value.align ?? 'center', position: value.position ?? 'end' };
  if (typeof media.width !== 'number' || !Number.isFinite(media.width) || media.width < 25 || media.width > 100) throw new Error('첨부 너비는 25~100 사이여야 합니다.');
  if (!['auto', '16:9', '4:3', '1:1'].includes(media.ratio) || !['contain', 'cover'].includes(media.fit) || !['left', 'center', 'right'].includes(media.align) || !/^(?:start|end|inline|after:[1-9]\d{0,2})$/.test(media.position)) throw new Error('첨부 비율·정렬·위치 설정이 잘못되었습니다.');
  return media;
}

export function validatePostSettings(root, post, value) {
  if (!validId(post.meta.id) || !object(value) || value.version !== 1 || !Array.isArray(value.media) || !Array.isArray(value.references)) throw new Error('version: 1, media와 references 배열이 필요합니다.');
  const media = value.media.map(item => validateMedia(root, post, item));
  if (new Set(media.map(item => item.src)).size !== media.length) throw new Error('같은 첨부 주소를 중복 등록할 수 없습니다.');
  const references = value.references.map(item => {
    if (!object(item)) throw new Error('출처는 객체여야 합니다.');
    const reference = { title: text(item.title, '출처 제목', true), url: text(item.url, '출처 URL', true) };
    webUrl(reference.url);
    for (const key of ['author', 'published', 'note']) if (item[key]) reference[key] = text(item[key], `출처 ${key}`);
    if (reference.published && (!/^\d{4}-\d{2}-\d{2}$/.test(reference.published) || Number.isNaN(Date.parse(reference.published)) || new Date(reference.published).toISOString().slice(0, 10) !== reference.published)) throw new Error('출처 날짜는 확인한 YYYY-MM-DD 값 또는 빈칸을 사용하세요.');
    return reference;
  });
  const normalized = { version: 1, media, references };
  if (value.referenceBlocks !== undefined) {
    if (!Array.isArray(value.referenceBlocks)) throw new Error('referenceBlocks는 기존 말미 출처 문구의 배열이어야 합니다.');
    const blocks = value.referenceBlocks.map(block => text(block, '이전 출처 문구', true).replace(/\r\n?/g, '\n').trim());
    if (blocks.length && !references.length) throw new Error('기존 출처 문구를 옮기려면 하단 출처를 하나 이상 남겨 주세요.');
    stripReferenceBlocks(post.body, blocks);
    normalized.referenceBlocks = blocks;
  }
  return normalized;
}

// 원본 파일은 유지하며, 명시적으로 대조한 말미 문구만 미리보기 본문에서 제외한다.
export function stripReferenceBlocks(body, blocks = []) {
  if (!blocks.length) return body;
  let remaining = body.replace(/\r\n?/g, '\n').trimEnd();
  for (const block of [...blocks].reverse()) {
    if (!remaining.endsWith(block)) throw new Error('기존 말미 출처 문구가 변경되었습니다. referenceBlocks와 원문을 대조해 주세요.');
    remaining = remaining.slice(0, -block.length).trimEnd();
  }
  return remaining;
}

export function discoverBodyMedia(body) {
  const media = [];
  let codeFence = null;
  const lines = body.replace(/\r/g, '').split('\n');
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const code = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (codeFence) {
      if (code && code[1][0] === codeFence[0] && code[1].length >= codeFence.length && !code[2].trim()) codeFence = null;
      continue;
    }
    if (code) { codeFence = code[1]; continue; }
    const image = line.match(/^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)\s*$/);
    const video = line.match(/^:::(video|youtube)\s+(\S+)\s*$/);
    if (image) media.push({ src: image[2], kind: 'image', alt: image[1], caption: image[3] ?? '', position: 'inline' });
    if (video) {
      const caption = [];
      while (++index < lines.length && lines[index].trim() !== ':::') caption.push(lines[index]);
      if (index === lines.length) throw new Error('영상 블록은 :::로 닫아 주세요.');
      media.push({ src: video[2], kind: video[1], caption: caption.join(' ').trim(), position: 'inline' });
    }
  }
  return media;
}

export function canonicalMediaSource(post, src) {
  if (src.startsWith('/') || /^https?:\/\//i.test(src)) return src;
  if (/[\\%?#\u0000-\u0020]/.test(src)) throw new Error('첨부의 상대경로를 확인하세요.');
  let contentRoot = path.dirname(post.file);
  while (path.basename(contentRoot) !== 'content' && path.dirname(contentRoot) !== contentRoot) contentRoot = path.dirname(contentRoot);
  const mediaRoot = path.join(contentRoot, 'media');
  const file = path.resolve(path.dirname(post.file), src);
  if (path.basename(contentRoot) !== 'content' || !inside(mediaRoot, file)) throw new Error('첨부의 상대경로는 content/media/ 안을 가리켜야 합니다.');
  return '/media/' + path.relative(mediaRoot, file).split(path.sep).join('/');
}

export function postSettingsPath(root, post) {
  if (!validId(post.meta.id)) throw new Error('게시물 ID가 잘못되었습니다.');
  const directory = path.resolve(root, 'content/post-settings');
  if (fs.existsSync(directory) && fs.realpathSync(directory) !== directory) throw new Error('설정 폴더가 다른 경로를 가리킵니다.');
  const file = path.join(directory, `${post.meta.id}.json`);
  if (fs.existsSync(file) && (fs.realpathSync(file) !== file || !fs.statSync(file).isFile())) throw new Error('설정 파일 경로를 확인하세요.');
  return file;
}

export function loadPostSettings(root, post) {
  const file = postSettingsPath(root, post);
  const settings = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { version: 1, media: [], references: post.meta.references ?? [] };
  if (!Array.isArray(settings.media)) throw new Error(`${file}: media 배열이 필요합니다.`);
  for (const item of discoverBodyMedia(post.body)) {
    item.src = canonicalMediaSource(post, item.src);
    if (!settings.media.some(media => media.src === item.src)) settings.media.push(item);
  }
  return validatePostSettings(root, post, settings);
}

export function savePostSettings(root, post, settings) {
  const normalized = validatePostSettings(root, post, settings);
  const file = postSettingsPath(root, post);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(normalized, null, 2) + '\n', 'utf8');
  return normalized;
}

export function loadPreviewExample(root) {
  const file = path.join(root, 'src/preview/examples/media-lab.md');
  if (!fs.existsSync(file)) return null;
  const { meta, body } = parseDocument(fs.readFileSync(file, 'utf8'));
  return { file, route: '/media-lab/', meta, body, featured: false, example: true };
}

export function loadEditorPosts(root) {
  const posts = loadPublicPages(root).filter(post => ['project', 'study', 'review'].includes(post.meta.type));
  const example = loadPreviewExample(root);
  return example ? [example, ...posts] : posts;
}

export function renderMedia(media, base = '/preview/devblog') {
  const src = media.src.startsWith('/') ? base + media.src : media.src;
  const ratio = media.ratio === 'auto' ? 'auto' : media.ratio.replace(':', ' / ');
  const style = `width:${media.width}%;--media-ratio:${ratio};--media-fit:${media.fit}`;
  const title = escapeHtml(media.alt || media.caption || (media.kind === 'image' ? '이미지' : '영상'));
  const content = media.kind === 'image' ? `<img class="media-content" src="${escapeHtml(src)}" alt="${escapeHtml(media.alt)}" loading="lazy">`
    : media.kind === 'video' ? `<video class="media-content" src="${escapeHtml(src)}" controls preload="metadata" aria-label="${title}"><a href="${escapeHtml(src)}">영상 파일 열기</a></video>`
    : `<iframe class="media-content" src="${escapeHtml(youtubeEmbed(media.src))}" title="${title}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  return `<figure class="post-media media-align-${media.align}${media.ratio === 'auto' ? ' media-natural' : ''}${media.kind === 'youtube' ? ' media-youtube' : ''}" data-media-src="${escapeHtml(media.src)}" style="${style}">${content}${media.caption ? `<figcaption>${escapeHtml(media.caption)}</figcaption>` : ''}</figure>`;
}

export function renderPostBody(post, pages, settings, referencesTitle = '출처', base = '/preview/devblog') {
  const items = new Map(settings.media.map(item => [item.src, item]));
  let html = renderMarkdown(stripReferenceBlocks(post.body, settings.referenceBlocks), {
    title: post.meta.title,
    resolveLink: target => resolvePublicLink(target, post, pages),
    renderMedia: input => {
      const item = items.get(canonicalMediaSource(post, input.src));
      if (!item) throw new Error(`첨부 설정이 없습니다: ${input.src}`);
      const marker = `<span hidden data-inline-media-anchor="${escapeHtml(item.src)}"></span>`;
      return marker + (item.position === 'inline' ? renderMedia(item, base) : '');
    },
  });
  const placed = new Set();
  let paragraph = 0;
  html = html.replace(/<\/p>/g, closing => {
    paragraph++;
    return closing + settings.media.filter(item => item.position === `after:${paragraph}`).map(item => { placed.add(item.src); return renderMedia(item, base); }).join('');
  });
  const at = position => settings.media.filter(item => item.position === position).map(item => renderMedia(item, base)).join('\n');
  const remaining = settings.media.filter(item => item.position.startsWith('after:') && !placed.has(item.src)).map(item => renderMedia(item, base)).join('\n');
  const references = settings.references.length ? `<footer class="article-references" aria-label="${escapeHtml(referencesTitle)}"><h2>${escapeHtml(referencesTitle)}</h2><ol>${settings.references.map(reference => `<li><a href="${escapeHtml(reference.url)}">${escapeHtml(reference.title)}</a>${reference.author ? `<span class="reference-author"> · ${escapeHtml(reference.author)}</span>` : ''}${reference.published ? ` · <time datetime="${reference.published}">${reference.published}</time>` : ''}${reference.note ? `<p>${escapeHtml(reference.note)}</p>` : ''}</li>`).join('\n')}</ol></footer>` : '';
  return `<div class="article-body" data-article-body>${at('start')}${html}${at('end')}${remaining}</div>${references}`;
}
