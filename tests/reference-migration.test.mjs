import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPublicPages } from '../src/content.mjs';
import { loadPostSettings, savePostSettings, stripReferenceBlocks, renderPostBody, validatePostSettings } from '../src/preview/post-settings.mjs';
import { buildPreview } from '../scripts/build-preview.mjs';
import { buildSite } from '../scripts/build-site.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-reference-migration-'));
  fs.mkdirSync(path.join(root, 'content/study'), { recursive: true });
  const citation = '[참고 자료](https://example.com/source), 확인된 작성자. 본문을 읽었다. 실험을 재현하지 않았다.';
  fs.writeFileSync(path.join(root, 'content/study/example.md'), `---\nid: test-references\ntitle: 출처 이동 검사\ntype: study\nstatus: reviewed\nvisibility: public\ncreated: 2026-11-18\nupdated: 2026-11-18\nsources: ["src-test"]\n---\n\n# 출처 이동 검사\n\n[본문 근거](https://example.com/inline)를 설명한다.\n\n최종 설명 문장은 남긴다.\n\n${citation}\n`);
  fs.writeFileSync(path.join(root, 'content/manifest.json'), JSON.stringify({ version: 1, pages: [{ path: 'content/study/example.md', slug: '/study/example' }] }));
  t.after(() => {
    const target = fs.realpathSync(root);
    assert.equal(path.dirname(target), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('homepage-reference-migration-'));
    fs.rmSync(target, { recursive: true });
  });
  return { root, citation, post: loadPublicPages(root)[0] };
}

test('기존 말미 출처를 기본 사이트와 테스트 페이지의 하단에 표시하고 본문과 Markdown은 보존한다', t => {
  const { root, post, citation } = fixture(t);
  const beforeMarkdown = fs.readFileSync(post.file);
  const settings = { version: 1, media: [], references: [{ title: '참고 자료', url: 'https://example.com/source', author: '확인된 작성자', note: '본문을 읽었다. 실험을 재현하지 않았다.' }], referenceBlocks: [citation] };
  savePostSettings(root, post, settings);
  const production = buildSite({ root, runChecks: false });
  const mainHtml = production.pages.get('/study/example/');
  const previewHtml = buildPreview({ root, runChecks: false }).pages.get('/preview/devblog/study/example/');
  for (const html of [mainHtml, previewHtml]) {
    const body = html.match(/<div class="article-body" data-article-body>([\s\S]*?)<\/div><footer/)[1];
    assert.match(body, /href="https:\/\/example.com\/inline">본문 근거/);
    assert.match(body, /최종 설명 문장은 남긴다/);
    assert.doesNotMatch(body, /참고 자료|실험을 재현하지 않았다/);
    assert.equal((html.match(/https:\/\/example.com\/source/g) ?? []).length, 1);
    assert.match(html, /<footer class="article-references"[\s\S]*확인된 작성자[\s\S]*실험을 재현하지 않았다/);
  }
  assert.doesNotMatch(mainHtml, /\/preview\/devblog\//);
  assert.equal(fs.readFileSync(path.join(production.dist, 'study/example/index.html'), 'utf8'), mainHtml);
  assert.deepEqual(fs.readFileSync(post.file), beforeMarkdown);
});

test('같은 문단에 섞인 설명은 남기고 명시한 접미 문장만 옮긴다', t => {
  const { root, post } = fixture(t);
  post.body = '# 출처 이동 검사\n\n회귀 보고 안내는 본문에 남긴다. 본문을 재독했다. 실행 검증은 하지 않았다.\n';
  const settings = validatePostSettings(root, post, { version: 1, media: [], references: [{ title: '자료', url: 'https://example.com', note: '본문을 재독했다. 실행 검증은 하지 않았다.' }], referenceBlocks: ['본문을 재독했다. 실행 검증은 하지 않았다.'] });
  const html = renderPostBody(post, [post], settings);
  assert.match(html, /회귀 보고 안내는 본문에 남긴다\.<\/p>/);
  assert.equal((html.match(/실행 검증은 하지 않았다/g) ?? []).length, 1);
});

test('일반 편집 저장은 이동 설정을 유지하며 변경된 원문과 대체 출처 누락은 오류로 알린다', t => {
  const { root, post, citation } = fixture(t);
  const settings = { version: 1, media: [], references: [{ title: '자료', url: 'https://example.com' }], referenceBlocks: [citation] };
  savePostSettings(root, post, settings);
  const loaded = loadPostSettings(root, post);
  loaded.references[0].note = '수정한 확인 범위';
  savePostSettings(root, post, loaded);
  assert.deepEqual(loadPostSettings(root, post).referenceBlocks, [citation]);
  assert.throws(() => validatePostSettings(root, post, { ...loaded, references: [] }), /출처를 하나 이상/);
  assert.throws(() => stripReferenceBlocks(post.body + '\n새 결론을 작성했다.', [citation]), /출처 문구가 변경/);
  assert.throws(() => validatePostSettings(root, post, { ...loaded, referenceBlocks: '임의 문장' }), /배열/);
});

test('공개 기술 글 모두 출처를 하단 영역에 등록하고 기존 말미 확인 문구를 제외한다', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const posts = loadPublicPages(root).filter(post => post.meta.type === 'study');
  assert.equal(posts.length, 21);
  for (const post of posts) {
    const settings = loadPostSettings(root, post);
    assert.ok(settings.references.length > 0, post.meta.id);
    assert.ok(settings.referenceBlocks?.length > 0, post.meta.id);
    const html = renderPostBody(post, posts, settings);
    assert.match(html, /<footer class="article-references"/);
    assert.doesNotMatch(html, /src-web-/);
    for (const reference of settings.references) assert.ok(reference.note, `${post.meta.id}: 확인 범위가 필요합니다.`);
  }
});
