import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildPreview } from '../scripts/build-preview.mjs';
import { buildSite } from '../scripts/build-site.mjs';
import { createStaticServer } from '../scripts/serve.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-preview-'));
  fs.mkdirSync(path.join(root, 'content/study'), { recursive: true });
  fs.mkdirSync(path.join(root, 'content/reviews'));
  fs.mkdirSync(path.join(root, 'content/projects'));
  const manifest = [];
  for (const [folder, type, title] of [['study', 'study', '공개 기술 글'], ['reviews', 'review', '공개 감상문'], ['projects', 'project', '공개 프로젝트']]) {
    fs.writeFileSync(path.join(root, `content/${folder}/example.md`), `---\nid: example-${type}\ntitle: ${title}\nsummary: "제목과 함께 보여 줄 요약 <script>"\ntype: ${type}\nstatus: reviewed\nvisibility: public\ncreated: 2026-11-18\nupdated: 2026-11-18\nsources: ["src-test"]\n---\n\n# ${title}\n\n본문과 [기술 글](/study/example/#내용)을 읽습니다.\n\n## 내용\n\n본문입니다.\n`);
    manifest.push({ path: `content/${folder}/example.md`, slug: `/${folder}/example`, ...(type === 'project' ? { featured: true } : {}) });
  }
  fs.writeFileSync(path.join(root, 'content/profile.md'), '공개되지 않은 소개와 비밀');
  fs.mkdirSync(path.join(root, 'raw'));
  fs.writeFileSync(path.join(root, 'raw/secret.txt'), '공개되지 않은 원자료');
  fs.writeFileSync(path.join(root, 'content/manifest.json'), JSON.stringify({ version: 1, pages: manifest }));
  t.after(() => {
    const target = fs.realpathSync(root);
    assert.equal(path.dirname(target), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('homepage-preview-'));
    fs.rmSync(target, { recursive: true });
  });
  return root;
}

test('미리보기 빌드는 기본 사이트를 보존하고 명시한 공개 문서와 자산만 별도 출력한다', t => {
  const root = fixture(t);
  const { dist } = buildSite({ root, runChecks: false });
  const before = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const { directory, pages } = buildPreview({ root, runChecks: false });
  assert.equal(fs.readFileSync(path.join(dist, 'index.html'), 'utf8'), before);
  assert.ok(!fs.existsSync(path.join(dist, 'preview')));
  assert.equal(pages.size, 14);
  assert.equal(fs.existsSync(path.join(directory, 'raw')), false);
  assert.equal(fs.existsSync(path.join(directory, 'content')), false);
  const assets = path.join(directory, 'preview/devblog/assets');
  assert.deepEqual(fs.readdirSync(assets).sort(), ['NotoSansKR-Variable.ttf', 'PretendardVariable.woff2', 'font-comparison.js', 'fonts.css', 'home-tabs.js', 'navigation.js', 'preview.css', 'profile.svg', 'project.svg', 'review.svg', 'study.svg', 'theme-8.css']);
  const html = [...pages.values()].join('\n');
  assert.doesNotMatch(html, /공개되지 않은|<input|<form|type="email"|<script>/);
  assert.match(html, /요약 &lt;script&gt;/);
  for (const content of pages.values()) {
    assert.match(content, /name="robots" content="noindex, nofollow"/);
    assert.match(content, /data-font-option="pretendard"/);
    assert.match(content, /data-font-option="noto-sans-kr"/);
    assert.match(content, /DevBlog design by <a href="https:\/\/themes\.3rdwavemedia\.com\/">Xiaoying Riley/);
    assert.equal((content.match(/<h1(?:\s|>)/g) ?? []).length, 1);
    for (const [, link] of content.matchAll(/href="(\/(?!\/)[^"]*)"/g)) assert.ok(link.startsWith('/preview/devblog/'), link);
  }
  assert.match(pages.get('/preview/devblog/study/example/'), /href="\/preview\/devblog\/study\/example\/#내용"/);
  const home = pages.get('/preview/devblog/');
  const main = home.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
  const projects = home.slice(home.indexOf('id="home-projects"'), home.indexOf('id="home-tech"'));
  const tech = home.slice(home.indexOf('id="home-tech"'), home.indexOf('id="home-hobby"'));
  const hobby = home.slice(home.indexOf('id="home-hobby"'));
  assert.match(tech, /공개 기술 글/);
  assert.match(projects, /공개 프로젝트/);
  assert.doesNotMatch(projects, /공개 기술 글|공개 감상문/);
  assert.doesNotMatch(tech, /공개 감상문|공개 프로젝트/);
  assert.match(hobby, /공개 감상문/);
  assert.doesNotMatch(hobby, /공개 기술 글|공개 프로젝트/);
  assert.match(home, /소개를 준비하고 있습니다/);
  assert.ok(main.indexOf('자기소개') < main.indexOf('data-home-tabs'));
  assert.doesNotMatch(home, /대표 프로젝트|featured-section/);
  const intro = main.slice(0, main.indexOf('data-home-tabs'));
  assert.doesNotMatch(intro, /공개 프로젝트|공개 기술 글|공개 감상문/);
  for (const id of ['home-projects', 'home-tech', 'home-hobby']) assert.doesNotMatch(home.match(new RegExp(`<section[^>]*id="${id}"[^>]*>`))[0], /hidden/);
  const navigation = home.match(/<ul class="navbar-nav[\s\S]*?<\/ul>/)[0];
  assert.deepEqual([...navigation.matchAll(/href="\/preview\/devblog([^\"]*)"/g)].map(match => match[1]), ['/', '/about/', '/projects/', '/tech/', '/hobby/']);
  const techMain = pages.get('/preview/devblog/tech/').match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
  assert.doesNotMatch(techMain, /공개 프로젝트/);
  const cv = pages.get('/preview/devblog/about/');
  assert.match(cv, /CV 작성 양식/);
  assert.match(cv, /학력/);
  assert.match(cv, /경력 · 연구 경험/);
  assert.doesNotMatch(cv, /공개되지 않은 소개와 비밀/);
});

test('공개한 프로필은 CV 빈 양식 대신 소개와 메인에 표시한다', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'content/profile.md'), `---\nid: public-profile\ntitle: 검토한 소개\nsummary: 검토한 한 줄 소개\ntype: profile\nstatus: reviewed\nvisibility: public\ncreated: 2026-11-18\nupdated: 2026-11-18\nsources: ["src-test"]\n---\n\n# 검토한 소개\n\n## 학력\n\n검토한 학력 내용\n`);
  const manifestFile = path.join(root, 'content/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.pages.push({ path: 'content/profile.md', slug: '/about' });
  fs.writeFileSync(manifestFile, JSON.stringify(manifest));
  const { pages } = buildPreview({ root, runChecks: false });
  assert.match(pages.get('/preview/devblog/about/'), /검토한 학력 내용/);
  assert.doesNotMatch(pages.get('/preview/devblog/about/'), /CV 작성 양식|기간 미입력/);
  assert.match(pages.get('/preview/devblog/'), /검토한 한 줄 소개/);
  assert.doesNotMatch(pages.get('/preview/devblog/'), /검토한 학력 내용/);
  const profileFile = path.join(root, 'content/profile.md');
  fs.writeFileSync(profileFile, fs.readFileSync(profileFile, 'utf8').replace('summary: 검토한 한 줄 소개\n', ''));
  const withoutSummary = buildPreview({ root, runChecks: false }).pages;
  assert.match(withoutSummary.get('/preview/devblog/about/'), /검토한 학력 내용/);
  assert.doesNotMatch(withoutSummary.get('/preview/devblog/'), /검토한 학력 내용/);
});

test('세부 카테고리는 분야별로 분리하며 전체 글 기준의 개수와 정적 목록을 만든다', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'content/categories.json'), JSON.stringify({ version: 1, sections: {
    projects: [{ id: 'tools', label: '도구' }],
    tech: [{ id: 'rendering', label: '렌더링 <분류>' }, { id: 'empty', label: '빈 카테고리' }],
    hobby: [{ id: 'books', label: '독서' }],
  } }));
  for (const [folder, category] of [['projects', 'tools'], ['study', 'rendering'], ['reviews', 'books']]) {
    const file = path.join(root, `content/${folder}/example.md`);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('status: reviewed', `category: ${category}\nstatus: reviewed`));
  }
  const manifestFile = path.join(root, 'content/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const source = fs.readFileSync(path.join(root, 'content/study/example.md'), 'utf8');
  for (let i = 0; i < 6; i++) {
    fs.writeFileSync(path.join(root, `content/study/more-${i}.md`), source.replaceAll('공개 기술 글', `추가 기술 ${i}`));
    manifest.pages.push({ path: `content/study/more-${i}.md`, slug: `/study/more-${i}` });
  }
  fs.writeFileSync(path.join(root, 'content/study/unassigned.md'), source.replace('category: rendering\n', '').replaceAll('공개 기술 글', '미분류 기술 글'));
  manifest.pages.push({ path: 'content/study/unassigned.md', slug: '/study/unassigned' });
  fs.writeFileSync(manifestFile, JSON.stringify(manifest));
  const { pages } = buildPreview({ root, runChecks: false });
  const main = route => pages.get(`/preview/devblog${route}`).match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
  const rendering = main('/tech/categories/rendering/');
  assert.match(rendering, /렌더링 &lt;분류&gt;/);
  assert.match(rendering, /\(7\)/);
  assert.match(rendering, /추가 기술 5/); // 메인의 최신 5개에 포함되지 않은 글도 카테고리 목록에서 접근 가능하다.
  assert.doesNotMatch(rendering, /미분류 기술 글|공개 감상문|공개 프로젝트|렌더링 <분류>/);
  assert.match(main('/tech/categories/uncategorized/'), /미분류 기술 글/);
  assert.doesNotMatch(main('/tech/categories/uncategorized/'), /추가 기술/);
  assert.match(main('/tech/categories/empty/'), /이 카테고리에는 아직 공개한 글이 없습니다/);
  assert.match(main('/projects/categories/tools/'), /공개 프로젝트/);
  assert.doesNotMatch(main('/projects/categories/tools/'), /공개 기술 글|공개 감상문/);
  assert.match(main('/hobby/categories/books/'), /공개 감상문/);
  const home = main('/');
  assert.match(home, /href="\/preview\/devblog\/tech\/categories\/rendering\/"/);
  assert.match(home, /\(7\)/);
  assert.equal((home.match(/<li class="item post-row">/g) ?? []).length, 7); // 프로젝트 1 + 기술 5 + 감상문 1
  assert.match(main('/study/example/'), /기술 \/ 렌더링 &lt;분류&gt;/);
  for (const html of pages.values()) for (const [, link] of html.matchAll(/href="(\/preview\/devblog\/[^"#?]*)/g)) {
    if (!link.includes('/assets/')) assert.ok(pages.has(link), `생성되지 않은 링크: ${link}`);
  }
});

test('미리보기 서버는 CSS·SVG를 올바르게 제공하고 원자료는 노출하지 않는다', async t => {
  const root = fixture(t);
  const { directory } = buildPreview({ root, runChecks: false });
  const server = createStaticServer(directory);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const [file, mime] of [['preview.css', /^text\/css/], ['theme-8.css', /^text\/css/], ['fonts.css', /^text\/css/], ['PretendardVariable.woff2', /^font\/woff2$/], ['NotoSansKR-Variable.ttf', /^font\/ttf$/], ['study.svg', /^image\/svg\+xml/], ['home-tabs.js', /^application\/javascript/]]) {
      const response = await fetch(`${base}/preview/devblog/assets/${file}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), mime);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    }
    assert.equal((await fetch(base + '/preview/devblog/study/example/')).status, 200);
    for (const file of ['/raw/secret.txt', '/content/profile.md', '/preview/devblog/assets/UPSTREAM-README.md']) assert.equal((await fetch(base + file)).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
