// Flat frontmatter and a deliberately limited, escaped Markdown subset.
export function parseDocument(input) {
  if (typeof input !== 'string') throw new TypeError('문서는 문자열이어야 합니다.');
  const text = input.replace(/^\uFEFF/, '');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('문서 맨 앞에 frontmatter가 필요합니다.');
  const fields = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const field = line.match(/^([a-z_]+):\s*(.*?)\s*$/);
    if (!field) throw new Error(`지원하지 않는 frontmatter 형식입니다: ${line}`);
    const [, key, raw] = field;
    if (fields.has(key)) throw new Error(`frontmatter 키가 중복되었습니다: ${key}`);
    let value = raw;
    try {
      if (key === 'sources' || key === 'references' || raw.startsWith('"')) value = JSON.parse(raw);
      else if (raw.startsWith("'")) {
        if (!raw.endsWith("'") || raw.length < 2) throw new Error();
        value = raw.slice(1, -1).replace(/''/g, "'");
      }
    } catch { throw new Error(`frontmatter 값을 읽을 수 없습니다: ${key}`); }
    if (key === 'sources' && !Array.isArray(value)) throw new Error('sources는 JSON 배열이어야 합니다.');
    fields.set(key, value);
  }
  return { meta: Object.fromEntries(fields), body: text.slice(match[0].length) };
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function safeHref(value) {
  if (typeof value !== 'string' || !value || /[\u0000-\u0020\u007f\\]/.test(value) || value.startsWith('//')) {
    throw new Error('안전하지 않거나 지원하지 않는 링크입니다.');
  }
  if (value.startsWith('#')) return value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (!url.hostname) throw new Error();
      return value;
    } catch { throw new Error('HTTP 링크의 형식이 잘못되었습니다.'); }
  }
  if (/^(?:mailto|tel):[^:]+$/i.test(value)) return value;
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) throw new Error('허용하지 않는 링크 프로토콜입니다.');
  return value;
}

function closing(text, start, open, close) {
  let depth = 1;
  for (let index = start + 1; index < text.length; index++) {
    if (text[index] === '\\') { index++; continue; }
    if (text[index] === open) depth++;
    if (text[index] === close && --depth === 0) return index;
  }
  return -1;
}

function linkDestination(raw) {
  const value = raw.trim();
  const match = value.startsWith('<')
    ? value.match(/^<([^<>]+)>(?:\s+["']([^\r\n]*)["'])?$/)
    : value.match(/^(\S+?)(?:\s+["']([^\r\n]*)["'])?$/);
  if (!match) throw new Error('링크 대상은 URL과 선택적인 따옴표 제목이어야 합니다.');
  return { href: match[1], title: match[2] };
}

function inline(text, resolveLink, depth = 0, inLink = false) {
  if (depth > 12) throw new Error('인라인 구문의 중첩이 너무 깊습니다.');
  let output = '';
  for (let index = 0; index < text.length;) {
    if (text[index] === '\\' && /[\\`*_[\]{}()#+.!|>-]/.test(text[index + 1] ?? '')) {
      output += escapeHtml(text[index + 1]); index += 2; continue;
    }
    if (text[index] === '`') {
      const marker = text.slice(index).match(/^`+/)[0];
      const end = text.indexOf(marker, index + marker.length);
      if (end !== -1) {
        output += `<code>${escapeHtml(text.slice(index + marker.length, end))}</code>`;
        index = end + marker.length; continue;
      }
    }
    if (text.startsWith('![', index)) throw new Error('이미지는 현재 Markdown 렌더러에서 지원하지 않습니다.');
    if (text[index] === '[') {
      const labelEnd = closing(text, index, '[', ']');
      if (labelEnd !== -1 && text[labelEnd + 1] === '(') {
        const targetEnd = closing(text, labelEnd + 1, '(', ')');
        if (targetEnd === -1) throw new Error('Markdown 링크가 닫히지 않았습니다.');
        if (inLink) throw new Error('링크 안에 링크를 넣을 수 없습니다.');
        const destination = linkDestination(text.slice(labelEnd + 2, targetEnd));
        const href = safeHref(destination.href);
        const external = /^(?:https?:\/\/|mailto:|tel:|#)/i.test(href);
        const resolved = external ? href : safeHref(resolveLink(href));
        const title = destination.title === undefined ? '' : ` title="${escapeHtml(destination.title)}"`;
        output += `<a href="${escapeHtml(resolved)}"${title}>${inline(text.slice(index + 1, labelEnd), resolveLink, depth + 1, true)}</a>`;
        index = targetEnd + 1; continue;
      }
    }
    const marker = ['**', '__', '*', '_'].find(value => text.startsWith(value, index)
      && !(value[0] === '_' && /[\p{L}\p{N}]/u.test(text[index - 1] ?? '')));
    if (marker) {
      const end = text.indexOf(marker, index + marker.length);
      const inner = end < 0 ? '' : text.slice(index + marker.length, end);
      const closesWord = marker[0] === '_' && /[\p{L}\p{N}]/u.test(text[end + marker.length] ?? '');
      if (inner.trim() && !closesWord) {
        const tag = marker.length === 2 ? 'strong' : 'em';
        output += `<${tag}>${inline(inner, resolveLink, depth + 1, inLink)}</${tag}>`;
        index = end + marker.length; continue;
      }
    }
    output += escapeHtml(text[index]); index++;
  }
  return output;
}

const heading = line => line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*$/);
const fence = line => line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
const listItem = line => line.match(/^(?:([-+*])|(\d+)[.)])\s+(.+)$/);
const quote = line => line.match(/^ {0,3}>\s?(.*)$/);
const rule = line => /^ {0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line);
const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(value => value.trim());
const tableRule = line => line.includes('|') && cells(line).every(value => /^:?-{3,}:?$/.test(value));

export function renderMarkdown(input, { title, resolveLink = value => value, renderMedia } = {}) {
  if (typeof input !== 'string' || typeof resolveLink !== 'function') throw new TypeError('본문과 링크 변환 함수를 확인하세요.');
  const lines = input.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  const ids = new Map();
  let foundTitle = false;
  const format = text => inline(text, resolveLink);
  const newBlock = index => !lines[index].trim() || heading(lines[index]) || fence(lines[index]) || listItem(lines[index])
    || quote(lines[index]) || rule(lines[index]) || (renderMedia && /^(?:!\[|:::(?:video|youtube)\s)/.test(lines[index])) || (lines[index].includes('|') && index + 1 < lines.length && tableRule(lines[index + 1]));
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) { index++; continue; }
    if (/^\s+(?:[-+*]|\d+[.)])\s+/.test(line)) throw new Error('중첩하거나 들여쓴 목록은 현재 지원하지 않습니다.');
    const code = fence(line);
    if (code) {
      const contents = [];
      const close = new RegExp(`^ {0,3}${code[1][0] === '`' ? '`' : '~'}{${code[1].length},}\\s*$`);
      const language = code[2].trim();
      if (language && !/^[a-z\d_-]+$/i.test(language)) throw new Error('코드 블록에는 단순 언어 이름만 지정할 수 있습니다.');
      index++;
      while (index < lines.length && !close.test(lines[index])) contents.push(lines[index++]);
      if (index === lines.length) throw new Error('코드 블록이 닫히지 않았습니다.');
      const attribute = language ? ` class="language-${escapeHtml(language)}"` : '';
      blocks.push(`<pre><code${attribute}>${escapeHtml(contents.join('\n'))}</code></pre>`); index++; continue;
    }
    if (renderMedia) {
      const image = line.match(/^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)\s*$/);
      const video = line.match(/^:::(video|youtube)\s+(\S+)\s*$/);
      if (image) { blocks.push(renderMedia({ src: image[2], kind: 'image', alt: image[1], caption: image[3] ?? '' })); index++; continue; }
      if (video) {
        const caption = [];
        index++;
        while (index < lines.length && lines[index].trim() !== ':::') caption.push(lines[index++]);
        if (index === lines.length) throw new Error('영상 블록은 :::로 닫아 주세요.');
        blocks.push(renderMedia({ src: video[2], kind: video[1], caption: caption.join(' ').trim() })); index++; continue;
      }
    }
    const section = heading(line);
    if (section) {
      const level = section[1].length;
      const text = section[2].replace(/\s+#+\s*$/, '');
      if (level === 1) {
        if (foundTitle || blocks.length) throw new Error('h1 제목은 본문 맨 앞에 한 번만 사용할 수 있습니다.');
        foundTitle = true;
        if (title !== undefined) {
          if (text !== title) throw new Error('본문 h1과 문서 title이 다릅니다.');
          index++; continue;
        }
      }
      const base = text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s+/g, '-') || 'section';
      const count = (ids.get(base) ?? 0) + 1;
      ids.set(base, count);
      const id = count === 1 ? base : `${base}-${count}`;
      blocks.push(`<h${level} id="${escapeHtml(id)}">${format(text)}</h${level}>`); index++; continue;
    }
    if (rule(line)) { blocks.push('<hr>'); index++; continue; }
    if (line.includes('|') && index + 1 < lines.length && tableRule(lines[index + 1])) {
      const headers = cells(line);
      if (headers.length !== cells(lines[index + 1]).length) throw new Error('표의 머리글과 구분선 열 수가 다릅니다.');
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
        const values = cells(lines[index++]);
        if (values.length !== headers.length) throw new Error('표의 열 수가 다릅니다.');
        rows.push(`<tr>${values.map(value => `<td>${format(value)}</td>`).join('')}</tr>`);
      }
      blocks.push(`<table><thead><tr>${headers.map(value => `<th scope="col">${format(value)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`); continue;
    }
    const item = listItem(line);
    if (item) {
      const ordered = item[2] !== undefined;
      const tag = ordered ? 'ol' : 'ul';
      const start = ordered && item[2] !== '1' ? ` start="${escapeHtml(item[2])}"` : '';
      const items = [];
      while (index < lines.length) {
        const current = listItem(lines[index]);
        if (!current || (current[2] !== undefined) !== ordered) break;
        items.push(`<li>${format(current[3])}</li>`); index++;
      }
      if (index < lines.length && /^\s+\S/.test(lines[index])) throw new Error('중첩 목록과 여러 줄 목록 항목은 현재 지원하지 않습니다.');
      blocks.push(`<${tag}${start}>${items.join('')}</${tag}>`); continue;
    }
    if (quote(line)) {
      const quoted = [];
      while (index < lines.length && quote(lines[index])) quoted.push(quote(lines[index++])[1]);
      blocks.push(`<blockquote>${quoted.join('\n').split(/\n\s*\n/).filter(Boolean).map(text => `<p>${format(text.replace(/\n/g, ' '))}</p>`).join('')}</blockquote>`); continue;
    }
    const paragraph = [line.trim()];
    index++;
    while (index < lines.length && !newBlock(index)) {
      if (/^\s+(?:[-+*]|\d+[.)])\s+/.test(lines[index])) throw new Error('중첩하거나 들여쓴 목록은 현재 지원하지 않습니다.');
      paragraph.push(lines[index++].trim());
    }
    blocks.push(`<p>${format(paragraph.join(' '))}</p>`);
  }
  return blocks.join('\n');
}
