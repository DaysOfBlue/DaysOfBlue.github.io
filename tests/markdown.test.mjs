import assert from 'node:assert/strict';
import test from 'node:test';
import { escapeHtml, parseDocument, renderMarkdown } from '../src/markdown.mjs';

test('flat frontmatter parses supported scalar forms and source arrays', () => {
  const document = parseDocument('\uFEFF---\r\nid: sample\r\ntitle: "제목: 예시"\r\nsummary: \'It\'\'s a note\'\r\nsources: ["src-example"]\r\n---\r\n# 본문');
  assert.deepEqual(document.meta, { id: 'sample', title: '제목: 예시', summary: "It's a note", sources: ['src-example'] });
  assert.equal(document.body, '# 본문');
});

test('missing, duplicate and malformed frontmatter are rejected', () => {
  assert.throws(() => parseDocument('# title'), /frontmatter/);
  assert.throws(() => parseDocument('---\nid: one\nid: two\n---\n'), /중복/);
  assert.throws(() => parseDocument('---\nsources: no-array\n---\n'), /frontmatter/);
  assert.throws(() => parseDocument('---\nsources: "text"\n---\n'), /JSON 배열/);
  assert.throws(() => parseDocument('---\ntitle: "unterminated\n---\n'), /frontmatter/);
});

test('sections, simple lists, quotes, inline formatting and tables become semantic HTML', () => {
  const html = renderMarkdown('# 예시\n\n문장 **강조**와 *기울임*, `code`.\n\n## 작업 내용\n\n- 하나\n- 둘\n\n3. 세 번째\n4. 네 번째\n\n> 인용문\n> 다음 줄\n\n| 항목 | 값 |\n| --- | --- |\n| 작업 | 완료 |', { title: '예시' });
  assert.doesNotMatch(html, /<h1/);
  assert.match(html, /<h2 id="작업-내용">작업 내용<\/h2>/);
  assert.match(html, /<strong>강조<\/strong>/);
  assert.match(html, /<em>기울임<\/em>/);
  assert.match(html, /<ul><li>하나<\/li><li>둘<\/li><\/ul>/);
  assert.match(html, /<ol start="3"><li>세 번째<\/li>/);
  assert.match(html, /<blockquote><p>인용문 다음 줄<\/p><\/blockquote>/);
  assert.match(html, /<th scope="col">항목<\/th>/);
  assert.match(html, /<td>완료<\/td>/);
});

test('document title has one h1 and repeated section anchors are unique', () => {
  assert.match(renderMarkdown('# 독립 문서'), /<h1 id="독립-문서">독립 문서<\/h1>/);
  assert.equal(renderMarkdown('# 일치\n\n본문', { title: '일치' }), '<p>본문</p>');
  assert.throws(() => renderMarkdown('# 다름', { title: '제목' }), /title/);
  assert.throws(() => renderMarkdown('# 제목\n\n# 두 번째'), /h1/);
  assert.throws(() => renderMarkdown('첫 문단\n\n# 제목'), /h1/);
  assert.match(renderMarkdown('## 제목\n\n## 제목'), /id="제목-2"/);
});

test('HTML, attributes, code and metadata characters are escaped', () => {
  assert.equal(escapeHtml('<&"\'>'), '&lt;&amp;&quot;&#39;&gt;');
  const html = renderMarkdown('<script>alert("x")</script>\n\n```html\n<img src=x onerror=alert(1)>\n```\n\n`<b>&</b>`');
  assert.doesNotMatch(html, /<script|<img|<b>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<pre><code class="language-html">&lt;img/);
  assert.match(html, /<code>&lt;b&gt;&amp;&lt;\/b&gt;<\/code>/);
  const link = renderMarkdown('[검색](https://example.com/?a=1&b=2 "말: \'인용\'")');
  assert.match(link, /href="https:\/\/example.com\/\?a=1&amp;b=2"/);
  assert.match(link, /title="말: &#39;인용&#39;"/);
  assert.equal(renderMarkdown('first_name_last'), '<p>first_name_last</p>');
});

test('relative links are rewritten through the resolver; external links and anchors remain', () => {
  const calls = [];
  const html = renderMarkdown('[프로젝트](../projects/work.md#결과) [홈](/) [원문](https://example.com) [절](#결과)', {
    resolveLink: value => { calls.push(value); return value === '/' ? '/' : '/projects/work/#결과'; }
  });
  assert.deepEqual(calls, ['../projects/work.md#결과', '/']);
  assert.match(html, /href="\/projects\/work\/#결과"/);
  assert.match(html, /href="https:\/\/example.com"/);
  assert.match(html, /href="#결과"/);
});

test('unsafe input and unsafe rewritten link protocols are rejected', () => {
  for (const target of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,test', '//example.com/path', 'file:///etc/passwd', 'https:\\example.com', 'java\nscript:alert(1)']) {
    assert.throws(() => renderMarkdown(`[링크](<${target}>)`), /링크|프로토콜/);
  }
  assert.throws(() => renderMarkdown('[링크](project.md)', { resolveLink: () => 'javascript:alert(1)' }), /프로토콜/);
  assert.throws(() => renderMarkdown('[링크](project.md)', { resolveLink: () => '//example.com' }), /링크/);
  assert.throws(() => renderMarkdown('[링크](project.md)', { resolveLink: () => undefined }), /링크/);
});

test('unsupported images, nested lists, malformed tables and unclosed code fail explicitly', () => {
  assert.throws(() => renderMarkdown('![이미지](https://example.com/image.png)'), /이미지/);
  assert.throws(() => renderMarkdown('- 부모\n  - 자식'), /중첩/);
  assert.throws(() => renderMarkdown('| 제목 | 값 |\n| --- | --- |\n| 한 칸 |'), /열 수/);
  assert.throws(() => renderMarkdown('```js\nconst n = 1;'), /닫히지/);
});
