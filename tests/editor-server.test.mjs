import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createEditorServer } from '../scripts/serve-editor.mjs';
import { buildSite } from '../scripts/build-site.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHfoAAAAASUVORK5CYII=', 'base64');
const blank = () => ({ version: 1, media: [], references: [] });
function addPreviewExample(root) {
  const folder = path.join(root, 'src/preview/examples');
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'media-lab.md'), '---\nid: preview-media-lab\ntitle: 편집 예제\ntype: study\nstatus: draft\nvisibility: public\ncreated: 2026-11-18\nupdated: 2026-11-18\nsources: []\n---\n\n# 편집 예제\n\n테스트 페이지 전용 글입니다.\n');
}

async function fixture(t, options = {}) {
  const { prepare, ...serverOptions } = options;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-editor-'));
  fs.mkdirSync(path.join(root, 'content/study'), { recursive: true });
  fs.mkdirSync(path.join(root, 'raw'));
  const article = `---\nid: test-study\ntitle: 편집 검증 글\ntype: study\nstatus: reviewed\nvisibility: public\ncreated: 2026-11-18\nupdated: 2026-11-18\nsources: ["src-test"]\n---\n\n# 편집 검증 글\n\n첫 문단입니다.\n\n두 번째 문단입니다.\n`;
  fs.writeFileSync(path.join(root, 'content/study/example.md'), article);
  fs.writeFileSync(path.join(root, 'content/profile.md'), '공개하지 않은 프로필');
  fs.writeFileSync(path.join(root, 'raw/secret.txt'), '공개하지 않은 원자료');
  fs.writeFileSync(path.join(root, 'content/manifest.json'), JSON.stringify({ version: 1, pages: [{ path: 'content/study/example.md', slug: '/study/example' }] }));
  prepare?.(root);
  const server = createEditorServer({ root, runChecks: false, ...serverOptions });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const session = await (await fetch(base + '/__editor/api')).json();
  const post = (endpoint, value, headers = {}) => fetch(base + `/__editor/api/${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-editor-token': session.csrfToken, ...headers }, body: JSON.stringify(value) });
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    const target = fs.realpathSync(root);
    assert.equal(path.dirname(target), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('homepage-editor-'));
    fs.rmSync(target, { recursive: true });
  });
  return { root, base, session, post, article };
}

test('로컬 편집 API는 편집 가능한 글만 제공하고 출처 설정을 저장한 뒤 재빌드한다', async t => {
  const { root, base, session, post, article } = await fixture(t);
  assert.equal(session.posts.length, 1);
  assert.equal(session.posts[0].id, 'test-study');
  assert.equal(session.posts[0].paragraphs, 2);
  assert.equal(session.posts[0].route, '/study/example/');
  assert.equal(session.mode, 'site');
  assert.equal(session.basePath, '');
  assert.equal(typeof session.csrfToken, 'string');
  const settings = { ...blank(), references: [{ title: '검증용 링크', url: 'https://example.com/reference', note: '검증용 메모' }] };
  const response = await post('settings', { postId: 'test-study', settings });
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal(saved.ok, true);
  assert.equal(saved.previewUrl, '/study/example/');
  const file = path.join(root, 'content/post-settings/test-study.json');
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).references[0].title, '검증용 링크');
  assert.equal(fs.readFileSync(path.join(root, 'content/study/example.md'), 'utf8'), article);
  const html = await (await fetch(base + saved.previewUrl)).text();
  assert.match(html, /검증용 링크/);
  assert.match(html, /class="article-references"/);
  assert.match(html, /data-preview-font="noto-sans-kr"/);
  assert.match(html, /src="\/assets\/site-font\.js"/);
  assert.doesNotMatch(html, /class="font-comparison"/);
  const fontCss = await fetch(base + '/assets/fonts.css');
  assert.equal(fontCss.status, 200);
  assert.match(await fontCss.text(), /NotoSansKR-Variable\.ttf/);
  const font = await fetch(base + '/assets/NotoSansKR-Variable.ttf');
  assert.equal(font.status, 200);
  assert.deepEqual(Buffer.from(await font.arrayBuffer()).subarray(0, 4), Buffer.from([0, 1, 0, 0]));
  assert.equal((await fetch(base + '/assets/site-font.js')).status, 200);
  assert.equal((await fetch(base + '/', { redirect: 'manual' })).status, 200);
  const editor = await (await fetch(base + '/__editor/')).text();
  assert.match(editor, /href="\/assets\/fonts\.css"/);
  assert.doesNotMatch(editor, /테스트 페이지|LOCAL PREVIEW/);
  for (const target of ['/raw/secret.txt', '/content/profile.md', '/content/post-settings/test-study.json']) assert.equal((await fetch(base + target)).status, 404);
});

test('홈페이지 편집 모드는 미리보기 예제를 노출하거나 편집하지 않는다', async t => {
  const { root, base, session, post } = await fixture(t, { prepare: addPreviewExample });
  assert.deepEqual(session.posts.map(item => item.id), ['test-study']);
  assert.equal((await post('settings', { postId: 'preview-media-lab', settings: blank() })).status, 404);
  for (const route of ['/media-lab/', '/preview/devblog/media-lab/']) assert.equal((await fetch(base + route)).status, 404);
  assert.equal(fs.existsSync(path.join(root, 'dist/__editor')), false);
  assert.equal(fs.existsSync(path.join(root, 'dist/media-lab')), false);
});

test('미리보기 편집 모드는 기존 주소와 전용 예제를 유지한다', async t => {
  const { base, session, post } = await fixture(t, { mode: 'preview', prepare: addPreviewExample });
  assert.equal(session.mode, 'preview');
  assert.equal(session.basePath, '/preview/devblog');
  assert.deepEqual(session.posts.map(item => item.id), ['preview-media-lab', 'test-study']);
  assert.ok(session.posts.every(item => item.route.startsWith('/preview/devblog/')));
  const settings = { ...blank(), references: [{ title: '미리보기 출처', url: 'https://example.com/preview' }] };
  const response = await post('settings', { postId: 'test-study', settings });
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal(saved.previewUrl, '/preview/devblog/study/example/');
  assert.match(await (await fetch(base + saved.previewUrl)).text(), /미리보기 출처/);
  assert.equal((await fetch(base + '/preview/devblog/media-lab/')).status, 200);
  const editor = await (await fetch(base + '/__editor/')).text();
  assert.match(editor, /href="\/preview\/devblog\/assets\/fonts\.css"/);
});

test('편집 API는 CSRF·다른 출처·비로컬 Host와 미등록 게시물 저장을 거부한다', async t => {
  const { base, post } = await fixture(t);
  const value = { postId: 'test-study', settings: blank() };
  const missingToken = await fetch(base + '/__editor/api/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) });
  assert.equal(missingToken.status, 403);
  assert.equal((await post('settings', value, { origin: 'https://other.example' })).status, 403);
  const differentHost = await new Promise((resolve, reject) => {
    const request = http.request(base + '/__editor/api', { headers: { Host: 'attacker.example' } }, response => {
      response.resume();
      response.on('end', () => resolve(response.statusCode));
    });
    request.on('error', reject);
    request.end();
  });
  assert.equal(differentHost, 403);
  assert.equal((await post('settings', { ...value, postId: '../profile' })).status, 404);
  assert.equal((await post('settings', value, { 'content-type': 'text/plain' })).status, 415);
});

test('이미지 업로드는 새 파일과 sidecar를 저장하고 홈페이지의 media 경로로 연결한다', async t => {
  const { root, base, post, article } = await fixture(t);
  const response = await post('upload', { postId: 'test-study', filename: '그림.png', data: png.toString('base64') });
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.match(saved.src, /^\/media\/test-study\/[a-z0-9-]+\.png$/);
  assert.match(saved.snippet, /^!\[이미지 설명\]/);
  assert.equal(saved.settings.media[0].position, 'end');
  const original = path.join(root, 'content', saved.src.slice(1));
  assert.deepEqual(fs.readFileSync(original), png);
  assert.equal(fs.readFileSync(path.join(root, 'content/study/example.md'), 'utf8'), article);
  const second = await post('upload', { postId: 'test-study', filename: '그림.png', data: png.toString('base64') });
  assert.equal(second.status, 200);
  assert.notEqual((await second.json()).src, saved.src);
  assert.deepEqual(fs.readFileSync(path.join(root, 'dist', saved.src.slice(1))), png);
  const image = await fetch(base + saved.src);
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type'), /^image\/png/);
});

test('업로드 경로·확장자·실제 파일 형식·Base64가 잘못되면 파일을 만들지 않는다', async t => {
  const { root, post } = await fixture(t);
  for (const [filename, data] of [
    ['../outside.png', png.toString('base64')],
    ['folder\\outside.png', png.toString('base64')],
    ['code.html', png.toString('base64')],
    ['not-image.png', Buffer.from('not a PNG').toString('base64')],
    ['image.png', 'broken base64'],
  ]) assert.equal((await post('upload', { postId: 'test-study', filename, data })).status, 400);
  assert.equal(fs.existsSync(path.join(root, 'content/media')), false);
});

test('미리보기 생성 실패 시 기존 설정과 업로드 파일을 되돌린다', async t => {
  let failNext = false;
  const rebuild = options => {
    if (failNext) { failNext = false; throw new Error('검증용 빌드 실패'); }
    return buildSite(options);
  };
  const { root, post } = await fixture(t, { rebuild });
  assert.equal((await post('settings', { postId: 'test-study', settings: blank() })).status, 200);
  const file = path.join(root, 'content/post-settings/test-study.json');
  const before = fs.readFileSync(file);
  failNext = true;
  const settings = { ...blank(), references: [{ title: '저장 실패 링크', url: 'https://example.com/fail' }] };
  assert.equal((await post('settings', { postId: 'test-study', settings })).status, 500);
  assert.deepEqual(fs.readFileSync(file), before);
  failNext = true;
  assert.equal((await post('upload', { postId: 'test-study', filename: 'image.png', data: png.toString('base64') })).status, 500);
  assert.deepEqual(fs.readFileSync(file), before);
  assert.deepEqual(fs.readdirSync(path.join(root, 'content/media/test-study')), []);
});

test('revision을 보낸 저장 요청은 외부에서 변경된 설정을 덮어쓰지 않는다', async t => {
  const { root, session, post } = await fixture(t);
  const folder = path.join(root, 'content/post-settings');
  fs.mkdirSync(folder, { recursive: true });
  const changed = { ...blank(), references: [{ title: '파일에서 수정한 링크', url: 'https://example.com/local' }] };
  fs.writeFileSync(path.join(folder, 'test-study.json'), JSON.stringify(changed));
  const response = await post('settings', { postId: 'test-study', settings: blank(), revision: session.posts[0].revision });
  assert.equal(response.status, 409);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(folder, 'test-study.json'), 'utf8')), changed);
});
