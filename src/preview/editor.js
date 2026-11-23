const $ = id => document.getElementById(id);
const clone = value => JSON.parse(JSON.stringify(value));
const kindLabels = { image: '이미지', video: '영상', youtube: 'YouTube' };
let csrfToken = '';
let basePath = '';
let posts = [];
let post = null;
let settings = { version: 1, media: [], references: [] };
let savedText = '';
let selectedMedia = -1;
let busy = false;
let dirty = false;
const inlineAnchorsByDocument = new WeakMap();

function message(text, state = '') {
  $('status').textContent = text;
  $('status').dataset.state = state;
}

function updateState() {
  dirty = Boolean(post) && JSON.stringify(settings) !== savedText;
  for (const control of document.querySelectorAll('.controls input,.controls select,.controls textarea,.controls button')) control.disabled = busy || !post;
  $('save-state').textContent = busy ? '처리 중' : dirty ? '저장하지 않은 변경 있음' : post ? '파일과 일치' : '선택한 글 없음';
  $('save').disabled = busy || !post || !dirty;
  for (const id of ['post-select', 'upload-file', 'add-external', 'add-reference', 'reload-preview']) $(id).disabled = busy || !post;
  $('upload').disabled = busy || !post || !$('upload-file').files.length;
}

function normalSettings(value) {
  return { version: 1, media: [], references: [], ...clone(value ?? {}) };
}

function postURL(value) {
  const url = new URL(value, location.href);
  if (url.origin !== location.origin || !posts.some(item => new URL(item.route, location.origin).pathname === url.pathname)) throw new Error('편집할 수 있는 글의 주소가 아닙니다.');
  return url;
}

async function request(path, data) {
  const options = data === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json', 'x-editor-token': csrfToken }, body: JSON.stringify(data) };
  const response = await fetch(`/__editor/api${path}`, options);
  let result;
  try { result = await response.json(); } catch { throw new Error('서버 응답을 읽을 수 없습니다. 편집 서버가 실행 중인지 확인해 주세요.'); }
  if (!response.ok || result.error) throw new Error(result.error || '요청을 처리하지 못했습니다.');
  return result;
}

function previewURL(value) {
  const url = postURL(value || post.route);
  if (basePath) url.searchParams.set('font', 'noto-sans-kr');
  url.searchParams.set('editorPreview', String(Date.now()));
  return url.href;
}

function reloadPreview(value) {
  if (post) $('post-preview').src = previewURL(value);
}

function mediaName(media) {
  if (media.alt) return media.alt;
  try { return decodeURIComponent(new URL(media.src, location.href).pathname.split('/').filter(Boolean).at(-1) || media.src); }
  catch { return media.src || '첨부'; }
}

function isInlineMedia(media) {
  return media.position === 'inline' || post.inlineSources?.includes(media.src);
}

function renderMediaList() {
  const list = $('media-list');
  list.replaceChildren();
  $('no-media').hidden = Boolean(settings.media.length);
  settings.media.forEach((media, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(index === selectedMedia));
    const kind = document.createElement('span');
    kind.className = 'media-kind';
    kind.textContent = `${index + 1} · ${kindLabels[media.kind] || '첨부'}`;
    const name = document.createElement('span');
    name.textContent = mediaName(media);
    button.append(kind, name);
    button.addEventListener('click', () => { selectedMedia = index; renderMediaList(); fillMediaControls(); });
    item.append(button);
    list.append(item);
  });
}

function appendOption(select, value, text) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  select.append(option);
}

function fillMediaControls() {
  const media = settings.media[selectedMedia];
  $('media-controls').hidden = !media;
  $('select-media-help').hidden = Boolean(media);
  if (!media) { $('media-sample').replaceChildren(); return; }
  $('selected-source').textContent = media.src;
  $('media-width').value = media.width ?? 100;
  $('media-width-number').value = media.width ?? 100;
  $('media-ratio').value = media.ratio ?? 'auto';
  $('media-fit').value = media.fit ?? 'contain';
  $('media-align').value = media.align ?? 'center';
  $('media-alt').value = media.alt ?? '';
  $('media-caption').value = media.caption ?? '';
  const positions = $('media-position');
  positions.replaceChildren();
  if (isInlineMedia(media)) appendOption(positions, 'inline', '본문에 작성한 위치 유지');
  appendOption(positions, 'start', '본문 앞');
  appendOption(positions, 'end', '본문 뒤');
  const paragraphCount = Math.max(0, Math.min(500, Number(post.paragraphs) || 0));
  for (let index = 1; index <= paragraphCount; index++) appendOption(positions, `after:${index}`, `문단 ${index} 뒤`);
  if (media.position?.startsWith('after:') && ![...positions.options].some(option => option.value === media.position)) appendOption(positions, media.position, '기존 지정 위치');
  positions.value = media.position ?? 'end';
  $('inline-note').hidden = !isInlineMedia(media);
  $('remove-media').hidden = isInlineMedia(media);
  renderSample(media);
}

function allowedMediaURL(source) {
  const url = new URL(source, location.href);
  if (url.origin === location.origin && url.pathname.startsWith('/media/')) { url.pathname = basePath + url.pathname; return url.href; }
  if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
  throw new Error('첨부는 /media/ 경로 또는 HTTPS 주소여야 합니다.');
}

function youtubeURL(source) {
  const url = new URL(source);
  const hosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com']);
  if (url.protocol !== 'https:' || !hosts.has(url.hostname)) throw new Error('YouTube 동영상 주소를 입력해 주세요.');
  const pieces = url.pathname.split('/').filter(Boolean);
  const id = url.hostname === 'youtu.be' ? pieces[0] : ['embed', 'shorts'].includes(pieces[0]) ? pieces[1] : url.searchParams.get('v');
  if (!/^[A-Za-z0-9_-]{11}$/.test(id ?? '')) throw new Error('YouTube 동영상 ID를 확인할 수 없습니다.');
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

function mediaElement(media, doc = document) {
  let element;
  if (media.kind === 'youtube') {
    element = doc.createElement('iframe');
    element.src = youtubeURL(media.src);
    element.title = media.alt || 'YouTube 동영상';
    element.allowFullscreen = true;
    element.referrerPolicy = 'strict-origin-when-cross-origin';
  } else if (media.kind === 'video') {
    element = doc.createElement('video');
    element.src = allowedMediaURL(media.src);
    element.controls = true;
    element.preload = 'metadata';
    element.setAttribute('aria-label', media.alt || '첨부 영상');
  } else {
    element = doc.createElement('img');
    element.src = allowedMediaURL(media.src);
    element.alt = media.alt || '';
  }
  element.className = 'media-content';
  return element;
}

function applyMediaStyle(figure, media) {
  figure.style.width = `${media.width ?? 100}%`;
  figure.style.maxWidth = '100%';
  figure.style.marginLeft = media.align === 'left' ? '0' : 'auto';
  figure.style.marginRight = media.align === 'right' ? '0' : 'auto';
  const content = figure.querySelector('.media-content') || figure.querySelector('img,video,iframe');
  if (content) {
    const ratio = media.ratio === 'auto' || !media.ratio ? '' : media.ratio.replace(':', ' / ');
    content.style.display = 'block';
    content.style.width = '100%';
    content.style.maxWidth = '100%';
    content.style.aspectRatio = ratio || (media.kind === 'youtube' ? '16 / 9' : 'auto');
    content.style.height = 'auto';
    content.style.objectFit = media.fit || 'contain';
    if (content.tagName === 'IMG') content.alt = media.alt || '';
    if (content.tagName === 'IFRAME') content.title = media.alt || '첨부 동영상';
    if (content.tagName === 'VIDEO') content.setAttribute('aria-label', media.alt || '첨부 영상');
  }
  let caption = figure.querySelector('figcaption');
  if (media.caption) {
    if (!caption) { caption = figure.ownerDocument.createElement('figcaption'); figure.append(caption); }
    caption.textContent = media.caption;
  } else caption?.remove();
}

function renderSample(media) {
  const sample = $('media-sample');
  sample.replaceChildren();
  try {
    const figure = document.createElement('figure');
    figure.style.margin = '0';
    figure.append(mediaElement(media));
    applyMediaStyle(figure, media);
    sample.append(figure);
  } catch (error) { sample.textContent = error.message; }
}

function inlineAnchors(doc, body) {
  let anchors = inlineAnchorsByDocument.get(doc);
  if (!anchors) { anchors = new Map(); inlineAnchorsByDocument.set(doc, anchors); }
  for (const marker of body.querySelectorAll('[data-inline-media-anchor]')) {
    anchors.set(marker.dataset.inlineMediaAnchor, marker);
  }
  for (const figure of body.querySelectorAll('figure.post-media[data-media-src]')) {
    const src = figure.dataset.mediaSrc;
    const media = settings.media.find(item => item.src === src);
    if (!media || !isInlineMedia(media) || anchors.get(src)?.isConnected) continue;
    const marker = doc.createComment('editor-inline-media-anchor');
    figure.before(marker);
    anchors.set(src, marker);
  }
  return anchors;
}

function updateLivePreview() {
  if (!post) return;
  let doc;
  try { doc = $('post-preview').contentDocument; } catch { return; }
  const body = doc?.querySelector('[data-article-body],.article-body');
  if (!body) return;
  const originals = inlineAnchors(doc, body);
  for (const added of body.querySelectorAll('[data-editor-preview]')) if (!settings.media.some(media => media.src === added.dataset.mediaSrc)) added.remove();
  const paragraphs = [...body.querySelectorAll('p')].filter(paragraph => !paragraph.closest('figure'));
  const afterAnchors = new Map();
  settings.media.forEach(media => {
    let figure = [...body.querySelectorAll('figure.post-media[data-media-src]')].find(element => element.dataset.mediaSrc === media.src);
    if (!figure) {
      try {
        figure = doc.createElement('figure');
        figure.className = 'post-media';
        figure.dataset.mediaSrc = media.src;
        figure.dataset.editorPreview = 'true';
        figure.append(mediaElement(media, doc));
      } catch { return; }
    }
    applyMediaStyle(figure, media);
    if (media.position === 'start') {
      const anchor = afterAnchors.get('start');
      if (anchor) { if (anchor.nextSibling !== figure) anchor.after(figure); }
      else if (body.firstChild !== figure) body.prepend(figure);
      afterAnchors.set('start', figure);
    } else if (media.position?.startsWith('after:')) {
      const index = Number(media.position.slice(6)) - 1;
      const anchor = afterAnchors.get(media.position) || paragraphs[index];
      if (anchor) { if (anchor.nextSibling !== figure) anchor.after(figure); }
      else if (body.lastChild !== figure) body.append(figure);
      afterAnchors.set(media.position, figure);
    } else if (media.position === 'inline') {
      const anchor = originals.get(media.src);
      if (anchor?.isConnected) { if (anchor.nextSibling !== figure) anchor.after(figure); }
      else if (!figure.isConnected) body.append(figure);
    } else if (body.lastChild !== figure) body.append(figure);
  });
  updateLiveReferences(doc, body);
}

function updateLiveReferences(doc, body) {
  const article = body.closest('article') || body.parentElement;
  let footer = article.querySelector('.article-references');
  if (!settings.references.length) { footer?.remove(); return; }
  if (!footer) { footer = doc.createElement('footer'); footer.className = 'article-references'; article.append(footer); }
  const headingText = footer.querySelector('h2')?.textContent || '출처';
  footer.replaceChildren();
  const heading = doc.createElement('h2');
  heading.textContent = headingText;
  footer.append(heading);
  const list = doc.createElement('ol');
  settings.references.forEach(reference => {
    const item = doc.createElement('li');
    const title = reference.title || '출처 제목';
    try {
      const url = new URL(reference.url);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
      const link = doc.createElement('a');
      link.href = url.href;
      link.textContent = title;
      item.append(link);
    } catch { item.append(doc.createTextNode(title)); }
    const details = [reference.author, reference.published].filter(Boolean).join(' · ');
    if (details) item.append(doc.createTextNode(`, ${details}`));
    if (reference.note) { const note = doc.createElement('p'); note.textContent = reference.note; item.append(note); }
    list.append(item);
  });
  footer.append(list);
}

function changeMedia(field, value) {
  const media = settings.media[selectedMedia];
  if (!media) return;
  media[field] = value;
  if (field === 'width') { $('media-width').value = value; $('media-width-number').value = value; }
  if (field === 'alt') renderMediaList();
  if (field === 'position') { $('inline-note').hidden = !isInlineMedia(media); $('remove-media').hidden = isInlineMedia(media); }
  updateState();
  updateLivePreview();
  renderSample(media);
}

function renderReferences() {
  const list = $('references-list');
  list.replaceChildren();
  settings.references.forEach((reference, index) => {
    const card = document.createElement('fieldset');
    card.className = 'reference-card';
    const legend = document.createElement('legend');
    legend.textContent = `출처 ${index + 1}`;
    card.append(legend);
    for (const [field, label, type] of [['title', '제목', 'text'], ['url', 'URL', 'url'], ['author', '작성자 (선택)', 'text'], ['published', '발행일 (선택)', 'text'], ['note', '참고한 범위·메모 (선택)', 'textarea']]) {
      const id = `reference-${index}-${field}`;
      const caption = document.createElement('label');
      caption.htmlFor = id;
      caption.textContent = label;
      const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
      input.id = id;
      if (type !== 'textarea') input.type = type;
      else input.rows = 2;
      input.value = reference[field] || '';
      input.maxLength = field === 'note' ? 3000 : 2000;
      if (field === 'published') input.placeholder = 'YYYY-MM-DD';
      input.addEventListener('input', () => { reference[field] = input.value; updateState(); updateLivePreview(); });
      card.append(caption, input);
    }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'quiet-danger';
    remove.textContent = '이 출처 제거';
    remove.addEventListener('click', () => { settings.references.splice(index, 1); renderReferences(); updateState(); updateLivePreview(); });
    card.append(remove);
    list.append(card);
  });
}

function selectPost(id) {
  const next = posts.find(item => item.id === id);
  if (!next) return;
  if (dirty && !window.confirm('저장하지 않은 변경이 있습니다. 변경을 버리고 다른 글을 열까요?')) { $('post-select').value = post.id; return; }
  post = next;
  settings = normalSettings(post.settings);
  post.inlineSources = [...new Set([...(post.inlineSources ?? []), ...settings.media.filter(media => media.position === 'inline').map(media => media.src)])];
  savedText = JSON.stringify(settings);
  selectedMedia = settings.media.length ? 0 : -1;
  $('post-select').value = id;
  $('settings-path').textContent = `저장: content/post-settings/${id}.json`;
  $('preview-title').textContent = post.title;
  $('upload-file').value = '';
  const url = new URL(location.href);
  url.searchParams.set('post', id);
  history.replaceState(null, '', url);
  $('site-link').href = postURL(post.route).href;
  renderMediaList();
  fillMediaControls();
  renderReferences();
  reloadPreview();
  updateState();
  message('첨부를 선택해 크기와 비율을 조절할 수 있습니다.');
}

async function saveSettings({ announce = true } = {}) {
  if (!post || busy || !dirty) return false;
  busy = true;
  updateState();
  message('설정을 파일에 저장하고 미리보기를 다시 만드는 중입니다.');
  try {
    const result = await request('/settings', { postId: post.id, settings, revision: post.revision });
    settings = normalSettings(result.settings || settings);
    post.settings = clone(settings);
    post.revision = result.revision ?? post.revision;
    savedText = JSON.stringify(settings);
    reloadPreview(result.previewUrl);
    renderMediaList();
    fillMediaControls();
    renderReferences();
    if (announce) message('파일에 저장했습니다. 다시 빌드해도 이 배치와 출처가 유지됩니다.');
    return true;
  } catch (error) { message(error.message, 'error'); throw error; }
  finally { busy = false; updateState(); }
}

function fileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('선택한 파일을 읽지 못했습니다.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(file);
  });
}

$('post-select').addEventListener('change', event => selectPost(event.target.value));
$('save').addEventListener('click', () => { saveSettings().catch(() => {}); });
$('reload-preview').addEventListener('click', () => { reloadPreview(); message(dirty ? '저장된 글을 다시 불러온 뒤 현재 조절값을 표시합니다.' : '글 미리보기를 새로 고쳤습니다.'); });
$('post-preview').addEventListener('load', updateLivePreview);
$('upload-file').addEventListener('change', updateState);
for (const id of ['media-width', 'media-width-number']) $(id).addEventListener('input', event => {
  const value = Number(event.target.value);
  if (Number.isFinite(value) && value >= 25 && value <= 100) changeMedia('width', Math.round(value));
});
for (const field of ['ratio', 'fit', 'align', 'position']) $(`media-${field}`).addEventListener('change', event => changeMedia(field, event.target.value));
for (const field of ['alt', 'caption']) $(`media-${field}`).addEventListener('input', event => changeMedia(field, event.target.value));
$('remove-media').addEventListener('click', () => {
  if (selectedMedia < 0) return;
  if (isInlineMedia(settings.media[selectedMedia])) { message('본문에 삽입된 첨부는 Markdown 파일에서 삭제해 주세요.'); return; }
  const removed = settings.media.splice(selectedMedia, 1)[0];
  try {
    const doc = $('post-preview').contentDocument;
    for (const figure of doc.querySelectorAll('figure.post-media[data-media-src]')) if (figure.dataset.mediaSrc === removed.src) figure.remove();
  } catch { /* 미리보기를 아직 불러오는 중이면 저장 후 반영한다. */ }
  selectedMedia = settings.media.length ? Math.min(selectedMedia, settings.media.length - 1) : -1;
  renderMediaList(); fillMediaControls(); updateState(); updateLivePreview();
  message('첨부 목록에서 제거했습니다. 파일에 반영하려면 저장하세요.');
});
$('add-external').addEventListener('click', () => {
  try {
    const src = $('external-src').value.trim();
    const kind = $('external-kind').value;
    const url = new URL(src);
    if (url.protocol !== 'https:') throw new Error('HTTPS 주소를 입력해 주세요.');
    if (kind === 'youtube') youtubeURL(src);
    else allowedMediaURL(src);
    if (settings.media.some(media => media.src === src)) throw new Error('이미 이 글에 추가한 첨부입니다.');
    settings.media.push({ src, kind, alt: '', caption: '', width: 100, ratio: 'auto', fit: 'contain', align: 'center', position: 'end' });
    selectedMedia = settings.media.length - 1;
    $('external-src').value = '';
    renderMediaList(); fillMediaControls(); updateState(); updateLivePreview();
    message('외부 링크를 추가했습니다. 설명과 배치를 확인하고 저장하세요.');
  } catch (error) { message(error.message, 'error'); }
});
$('add-reference').addEventListener('click', () => {
  settings.references.push({ title: '', url: '' });
  renderReferences(); updateState(); updateLivePreview();
  $(`reference-${settings.references.length - 1}-title`).focus();
});
$('upload').addEventListener('click', async () => {
  const file = $('upload-file').files[0];
  if (!file || !post || busy) return;
  if (file.size > 20 * 1024 * 1024) { message('파일 크기가 20MB를 넘습니다. 더 작은 파일이나 외부 영상 링크를 사용해 주세요.', 'error'); return; }
  try {
    if (dirty) await saveSettings({ announce: false });
    busy = true; updateState(); message('파일을 첨부하고 미리보기를 다시 만드는 중입니다.');
    const result = await request('/upload', { postId: post.id, filename: file.name, data: await fileBase64(file), revision: post.revision });
    settings = normalSettings(result.settings);
    post.settings = clone(settings);
    post.revision = result.revision ?? post.revision;
    savedText = JSON.stringify(settings);
    selectedMedia = Math.max(0, settings.media.findIndex(media => media.src === result.src));
    $('upload-file').value = '';
    renderMediaList(); fillMediaControls(); renderReferences(); reloadPreview(result.previewUrl);
    message('파일을 첨부했습니다. 크기·비율·설명을 조절한 뒤 저장하세요.');
  } catch (error) { message(error.message, 'error'); }
  finally { busy = false; updateState(); }
});
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });

try {
  const result = await request('');
  csrfToken = result.csrfToken;
  basePath = result.basePath ?? '';
  const previewMode = result.mode === 'preview';
  document.querySelector('.eyebrow').textContent = previewMode ? 'LOCAL PREVIEW' : 'LOCAL EDITOR';
  document.title = previewMode ? '미디어 배치 편집 · 디자인 미리보기' : '미디어 배치 편집 · 홈페이지';
  $('site-link').textContent = previewMode ? '테스트 페이지 열기' : '홈페이지 열기';
  $('site-link').href = `${basePath}/`;
  posts = Array.isArray(result.posts) ? result.posts : [];
  const picker = $('post-select');
  picker.replaceChildren();
  posts.forEach(item => appendOption(picker, item.id, item.title));
  if (!posts.length) { message('편집할 공개 글이 없습니다. 공개 목록에 검토한 글을 등록해 주세요.'); updateState(); }
  else {
    const requested = new URL(location.href).searchParams.get('post');
    selectPost(posts.some(item => item.id === requested) ? requested : posts[0].id);
  }
} catch (error) { message(error.message, 'error'); updateState(); }
