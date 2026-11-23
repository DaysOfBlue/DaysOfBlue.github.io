import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createStaticServer } from '../scripts/serve.mjs';
import { baseRoutes, resolvePublicLink } from '../src/content.mjs';

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-assets-'));
  const dist = path.join(root, 'dist');
  fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(dist, 'tech'));
  fs.mkdirSync(path.join(dist, 'hobby'));
  fs.writeFileSync(path.join(dist, 'index.html'), '<h1>홈</h1>');
  fs.writeFileSync(path.join(dist, 'tech/index.html'), '<h1>기술</h1>');
  fs.writeFileSync(path.join(dist, 'hobby/index.html'), '<h1>취미</h1>');
  fs.writeFileSync(path.join(dist, '404.html'), '<h1>없는 페이지</h1>');
  fs.writeFileSync(path.join(dist, 'assets/home-tabs.js'), 'document.documentElement.dataset.tabs = "ready";\n');
  for (const [name, contents] of [
    ['site.css', 'body { color: #17181a; }'],
    ['profile.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>'],
    ['NotoSansKR-Variable.ttf', Buffer.from('글꼴 응답 경로 검사')],
    ['PretendardVariable.woff2', Buffer.from('비교 글꼴 응답 경로 검사')],
  ]) fs.writeFileSync(path.join(dist, 'assets', name), contents);
  fs.mkdirSync(path.join(dist, 'media/test-media'), { recursive: true });
  for (const name of ['photo.png', 'clip.mp4', 'clip.webm']) fs.writeFileSync(path.join(dist, 'media/test-media', name), Buffer.from('첨부 응답 경로 검사'));
  fs.writeFileSync(path.join(dist, 'private.json'), '{"secret":"내부 데이터"}');
  fs.writeFileSync(path.join(root, 'source.js'), 'const secret = "저장소 원본";');
  const server = createStaticServer(dist);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    const target = fs.realpathSync(root);
    assert.equal(path.dirname(target), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('homepage-assets-'));
    fs.rmSync(target, { recursive: true });
  });
  return { root, base: `http://127.0.0.1:${server.address().port}` };
}

function rawRequest(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    request.on('error', reject);
  });
}

test('탭 모듈은 JavaScript로 제공하고 HEAD는 본문 없이 반환한다', async t => {
  const { base } = await fixture(t);
  const script = await fetch(base + '/assets/home-tabs.js');
  assert.equal(script.status, 200);
  assert.match(script.headers.get('content-type'), /^application\/javascript; charset=utf-8$/);
  assert.equal(script.headers.get('x-content-type-options'), 'nosniff');
  assert.match(await script.text(), /dataset\.tabs/);
  const head = await fetch(base + '/assets/home-tabs.js', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.match(head.headers.get('content-type'), /^application\/javascript/);
  assert.equal(await head.text(), '');
});

test('디자인·글꼴·공개 첨부는 각 파일 형식으로 제공하고 SVG 실행을 제한한다', async t => {
  const { base } = await fixture(t);
  for (const [route, contentType] of [
    ['/assets/site.css', 'text/css; charset=utf-8'],
    ['/assets/profile.svg', 'image/svg+xml'],
    ['/assets/NotoSansKR-Variable.ttf', 'font/ttf'],
    ['/assets/PretendardVariable.woff2', 'font/woff2'],
    ['/media/test-media/photo.png', 'image/png'],
    ['/media/test-media/clip.mp4', 'video/mp4'],
    ['/media/test-media/clip.webm', 'video/webm'],
  ]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.equal(response.headers.get('content-type'), contentType, route);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff', route);
    assert.ok((await response.arrayBuffer()).byteLength > 0, route);
    if (route.endsWith('.svg')) assert.match(response.headers.get('content-security-policy'), /sandbox; default-src 'none'/);
    const head = await fetch(base + route, { method: 'HEAD' });
    assert.equal(head.status, 200, route);
    assert.equal(head.headers.get('content-type'), contentType, route);
    assert.equal(await head.text(), '', route);
  }
});

test('기술·취미 HTML 경로와 HTML 404 응답을 구분한다', async t => {
  const { base } = await fixture(t);
  for (const route of ['/tech/', '/hobby/']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/html/);
  }
  const missingScript = await fetch(base + '/assets/missing.js');
  assert.equal(missingScript.status, 404);
  assert.match(missingScript.headers.get('content-type'), /^text\/html/);
  assert.match(await missingScript.text(), /없는 페이지/);
});

test('저장소 원본·허용하지 않은 확장자·인코딩된 경로 이탈은 제공하지 않는다', async t => {
  const { base } = await fixture(t);
  for (const route of ['/source.js', '/private.json', '/raw/manifest.json']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 404);
    assert.doesNotMatch(await response.text(), /내부 데이터|저장소 원본/);
  }
  for (const route of ['/%2e%2e%2fsource.js', '/assets/..%5c..%5csource.js']) {
    const response = await rawRequest(base + route);
    assert.equal(response.status, 400);
    assert.doesNotMatch(response.body, /저장소 원본/);
  }
  const post = await fetch(base + '/assets/home-tabs.js', { method: 'POST' });
  assert.equal(post.status, 405);
});

test('공개 글의 기술·취미 링크를 정규 경로로 바꾸고 미등록 경로는 거부한다', () => {
  const page = { file: path.resolve('content/study/example.md'), route: '/study/example/' };
  for (const route of ['/tech/', '/hobby/']) {
    assert.ok(baseRoutes.has(route));
    assert.equal(resolvePublicLink(route.slice(0, -1), page, []), route);
    assert.equal(resolvePublicLink(route + '#recent', page, []), route + '#recent');
  }
  assert.throws(() => resolvePublicLink('/private', page, []), /사이트에 없는 경로/);
});
