import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildPreview } from '../scripts/build-preview.mjs';
import { loadPublicPages } from '../src/content.mjs';
import { loadPostSettings, savePostSettings, validatePostSettings, renderPostBody, youtubeEmbed } from '../src/preview/post-settings.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-media-'));
  fs.mkdirSync(path.join(root, 'content/study'), { recursive: true });
  fs.mkdirSync(path.join(root, 'content/media/test-media'), { recursive: true });
  fs.writeFileSync(path.join(root, 'content/media/test-media/a.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  fs.writeFileSync(path.join(root, 'content/media/test-media/unused.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  fs.writeFileSync(path.join(root, 'content/media/test-media/demo.mp4'), Buffer.from('테스트용 경로 검증 데이터'));
  fs.writeFileSync(path.join(root, 'content/manifest.json'), JSON.stringify({ version: 1, pages: [{ path: 'content/study/media.md', slug: '/study/media' }] }));
  const file = path.join(root, 'content/study/media.md');
  fs.writeFileSync(file, `---\nid: test-media\ntitle: 미디어 검사\ntype: study\nstatus: reviewed\nvisibility: public\ncreated: 2026-11-18\nupdated: 2026-11-18\nsources: ["src-test"]\n---\n\n# 미디어 검사\n\n첫 문단.\n\n![대체 설명](../media/test-media/a.svg "이미지 캡션")\n\n두 번째 문단.\n\n:::video /media/test-media/demo.mp4\n영상 캡션\n:::\n`);
  const post = loadPublicPages(root)[0];
  t.after(() => {
    const target = fs.realpathSync(root);
    assert.equal(path.dirname(target), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('homepage-media-'));
    fs.rmSync(target, { recursive: true });
  });
  return { root, post };
}

test('본문의 상대 이미지·영상과 캡션을 읽고 참조한 첨부만 별도 빌드한다', t => {
  const { root, post } = fixture(t);
  const original = fs.readFileSync(post.file);
  const settings = loadPostSettings(root, post);
  assert.equal(settings.media.length, 2);
  assert.equal(settings.media[0].src, '/media/test-media/a.svg');
  assert.equal(settings.media[0].caption, '이미지 캡션');
  assert.equal(settings.media[1].caption, '영상 캡션');
  const { directory, pages } = buildPreview({ root, runChecks: false });
  const html = pages.get('/preview/devblog/study/media/');
  assert.match(html, /<figure[^>]*data-media-src="\/media\/test-media\/a.svg"/);
  assert.match(html, /<video[^>]*controls preload="metadata"/);
  assert.match(html, /href="\/preview\/devblog\/media\/test-media\/demo.mp4"/);
  assert.doesNotMatch(html, /\/preview\/devblog\/preview\/devblog/);
  assert.equal(fs.existsSync(path.join(directory, 'preview/devblog/media/test-media/a.svg')), true);
  assert.equal(fs.existsSync(path.join(directory, 'preview/devblog/media/test-media/unused.svg')), false);
  assert.deepEqual(fs.readFileSync(post.file), original);
});

test('파일에 저장한 비율·위치·출처는 다시 불러와도 유지하고 원문과 HTML을 실행하지 않는다', t => {
  const { root, post } = fixture(t);
  const settings = loadPostSettings(root, post);
  Object.assign(settings.media[0], { width: 50, ratio: '1:1', fit: 'cover', align: 'right', position: 'after:1', caption: '<script>실행 금지</script>' });
  settings.references = [{ title: '<출처>', url: 'https://example.com/source', author: '저자', published: '2026-11-18', note: '본문 확인 범위' }];
  savePostSettings(root, post, settings);
  assert.deepEqual(loadPostSettings(root, post), settings);
  const html = renderPostBody(post, [post], settings);
  assert.equal((html.match(/data-media-src="\/media\/test-media\/a.svg"/g) ?? []).length, 1);
  assert.ok(html.indexOf('첫 문단.</p>') < html.indexOf('data-media-src'));
  assert.ok(html.indexOf('data-media-src') < html.indexOf('두 번째 문단'));
  assert.match(html, /width:50%;--media-ratio:1 \/ 1/);
  assert.match(html, /&lt;script&gt;실행 금지&lt;\/script&gt;/);
  assert.match(html, /<footer class="article-references"/);
  assert.match(html, /&lt;출처&gt;/);
  assert.ok(html.indexOf('article-references') > html.indexOf('</video>'));
});

test('누락된 첨부·다른 게시물 경로·임의 HTML 주소·잘못된 설정을 거부한다', t => {
  const { root, post } = fixture(t);
  const base = loadPostSettings(root, post);
  for (const src of ['/raw/secret.png', '/media/other/a.png', '/media/test-media/../a.svg', '/media/test-media/missing.png', 'javascript:alert(1)', 'https://example.com/file.html']) {
    assert.throws(() => validatePostSettings(root, post, { ...base, media: [{ ...base.media[0], src }] }));
  }
  for (const update of [{ width: -1 }, { ratio: 'url(javascript:1)' }, { align: 'absolute' }, { position: '../secret' }]) {
    assert.throws(() => validatePostSettings(root, post, { ...base, media: [{ ...base.media[0], ...update }] }));
  }
  assert.throws(() => validatePostSettings(root, post, { ...base, references: [{ title: '링크', url: 'javascript:alert(1)' }] }));
  assert.throws(() => validatePostSettings(root, post, { ...base, references: [{ title: '링크', url: 'https://example.com', published: '2026-02-30' }] }));
});

test('YouTube 임베드는 허용한 제공자와 영상 ID만 사용한다', () => {
  assert.equal(youtubeEmbed('https://youtu.be/abcdefghijk'), 'https://www.youtube-nocookie.com/embed/abcdefghijk');
  for (const url of ['https://evil.example/embed/abcdefghijk', 'https://youtube.com.evil.example/watch?v=abcdefghijk', 'javascript:alert(1)', 'https://youtu.be/../../etc/passwd']) assert.throws(() => youtubeEmbed(url));
});

test('긴 코드 펜스 안의 이미지 작성 예시는 실제 첨부로 수집하지 않는다', t => {
  const { root, post } = fixture(t);
  post.body += '\n````markdown\n```\n![예제](/media/test-media/not-a-real-file.png)\n```\n````\n';
  const settings = loadPostSettings(root, post);
  assert.equal(settings.media.length, 2);
  assert.doesNotThrow(() => renderPostBody(post, [post], settings));
});

test('요약 없는 공개 프로필의 이미지도 메인 CV 노출 없이 미리보기에서 렌더링한다', t => {
  const { root, post } = fixture(t);
  const contentRoot = path.join(root, 'content');
  fs.mkdirSync(path.join(contentRoot, 'media/public-profile'));
  fs.copyFileSync(path.join(contentRoot, 'media/test-media/a.svg'), path.join(contentRoot, 'media/public-profile/profile.svg'));
  fs.writeFileSync(path.join(contentRoot, 'profile.md'), `---\nid: public-profile\ntitle: 소개\ntype: profile\nstatus: reviewed\nvisibility: public\ncreated: 2026-11-18\nupdated: 2026-11-18\nsources: ["src-test"]\n---\n\n# 소개\n\n![프로필 이미지](/media/public-profile/profile.svg)\n`);
  const manifestFile = path.join(contentRoot, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile));
  manifest.pages.push({ path: 'content/profile.md', slug: '/about' });
  fs.writeFileSync(manifestFile, JSON.stringify(manifest));
  const { pages } = buildPreview({ root, runChecks: false });
  assert.match(pages.get('/preview/devblog/about/'), /alt="프로필 이미지"/);
  assert.doesNotMatch(pages.get('/preview/devblog/'), /alt="프로필 이미지"/);
});
