import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { loadPublicPages, resolvePublicLink } from '../src/content.mjs';
import { renderSite } from '../src/site.mjs';
import { buildSite } from '../scripts/build-site.mjs';
import { createStaticServer } from '../scripts/serve.mjs';
import { loadPostSettings, savePostSettings } from '../src/preview/post-settings.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-test-'));
  fs.mkdirSync(path.join(root, 'content/projects'), { recursive: true });
  fs.mkdirSync(path.join(root, 'content/study'));
  fs.mkdirSync(path.join(root, 'content/reviews'));
  const manifest = pages => fs.writeFileSync(path.join(root, 'content/manifest.json'), JSON.stringify({ version: 1, pages }));
  const page = (file, { title = '검증용 문서', summary, category, type = 'project', status = 'reviewed', created = '2026-11-18', body = '테스트용 본문입니다.' } = {}) => {
    const description = summary === undefined ? '' : `summary: ${JSON.stringify(summary)}\n`;
    const classification = category === undefined ? '' : `category: ${JSON.stringify(category)}\n`;
    fs.writeFileSync(path.join(root, file), `---\nid: test-${type}-${path.basename(file, '.md')}\ntitle: ${JSON.stringify(title)}\n${description}type: ${type}\n${classification}status: ${status}\nvisibility: public\ncreated: ${created}\nupdated: 2026-11-18\nsources: ["src-test"]\n---\n\n# ${title}\n\n${body}\n`);
  };
  manifest([]);
  t.after(() => {
    const target = fs.realpathSync(root);
    const temp = fs.realpathSync(os.tmpdir());
    const relative = path.relative(temp, target);
    assert.ok(relative.startsWith('homepage-test-') && !path.isAbsolute(relative) && path.dirname(target) === temp);
    fs.rmSync(target, { recursive: true });
  });
  return { root, manifest, page };
}

test('공개 목록이 비어 있으면 초안·원자료를 제외한 기본 경로만 생성한다', t => {
  const { root, page } = fixture(t);
  page('content/projects/draft.md', { title: '노출되면 안 되는 초안', status: 'draft' });
  page('content/profile.md', { title: '비공개 프로필', type: 'profile', status: 'draft', summary: '노출되면 안 되는 소개', body: '노출되면 안 되는 프로필 본문' });
  fs.mkdirSync(path.join(root, 'raw'));
  fs.writeFileSync(path.join(root, 'raw/secret.txt'), '노출되면 안 되는 원자료');
  const { dist, pages } = buildSite({ root, runChecks: false });
  assert.equal(pages.size, 8);
  assert.ok(fs.existsSync(path.join(dist, 'tech/index.html')));
  assert.ok(fs.existsSync(path.join(dist, 'hobby/index.html')));
  assert.ok(fs.existsSync(path.join(dist, 'projects/index.html')));
  assert.ok(fs.existsSync(path.join(dist, 'study/index.html')));
  assert.ok(fs.existsSync(path.join(dist, 'reviews/index.html')));
  assert.ok(fs.existsSync(path.join(dist, 'about/index.html')));
  const html = [...pages.values()].join('\n');
  assert.doesNotMatch(html, /노출되면 안 되는|비공개 프로필|src-test/);
  assert.doesNotMatch(html, /\/preview\/devblog\/|font-comparison|data-font-option|noindex|디자인 미리보기/);
  assert.match(html, /아직 공개한 프로젝트가 없습니다/);
  for (const [route, output] of pages) {
    assert.equal((output.match(/<h1(?:\s|>)/g) ?? []).length, 1);
    assert.match(output, /<html\b[^>]*\blang="ko"/);
    assert.match(output, /<nav\b[^>]*\baria-label="주 메뉴"/);
    assert.match(output, /href="\/assets\/site\.css"/);
    assert.match(output, /href="https:\/\/themes\.3rdwavemedia\.com\/">Xiaoying Riley<\/a>/);
    if (route === '/') {
      assert.match(output, /<script\b(?=[^>]*\btype="module")(?=[^>]*\bsrc="\/assets\/home-tabs\.js")[^>]*><\/script>/);
    } else assert.doesNotMatch(output, /src="\/assets\/home-tabs\.js"/);
    assert.match(output, /src="\/assets\/navigation\.js"/);
    assert.match(output, /src="\/assets\/site-font\.js"/);
  }
});

test('기본 빌드는 자기소개·세 목록·카테고리·편집 설정을 정식 경로에 반영하고 공개 자산만 만든다', t => {
  const { root, manifest, page } = fixture(t);
  const citation = '[원문 자료](https://example.com/source). 원문을 읽었으며 실행 검증은 하지 않았다.';
  fs.writeFileSync(path.join(root, 'content/categories.json'), JSON.stringify({ version: 1, sections: {
    projects: [{ id: 'tools', label: '제작 도구' }],
    tech: [{ id: 'rendering', label: '렌더링' }],
    hobby: [{ id: 'books', label: '독서' }],
  } }));
  fs.writeFileSync(path.join(root, 'content/site.json'), JSON.stringify({ version: 1, title: '공개 기록 검사', labels: { references: '참고 자료' } }));
  page('content/profile.md', { type: 'profile', title: '소개', summary: '공개할 자기소개 요약입니다.', body: '상세 CV 본문입니다.' });
  page('content/projects/tool.md', { title: '도구 프로젝트', category: 'tools', summary: '프로젝트 요약입니다.' });
  page('content/study/guide.md', { title: '렌더링 학습 기록', type: 'study', category: 'rendering', body: [
    '[프로젝트 보기](../projects/tool.md)', '',
    '![렌더링 과정 설명](../media/test-study-guide/diagram.svg "과정 이미지")', '',
    ':::video /media/test-study-guide/clip.mp4', '영상 설명', ':::', '',
    '최종 설명 문장입니다.', '', citation,
  ].join('\n') });
  page('content/reviews/book.md', { title: '독서 감상 기록', type: 'review', category: 'books' });
  page('content/projects/draft.md', { title: '비공개 초안 표시 금지', status: 'draft' });
  manifest([
    { path: 'content/profile.md', slug: '/about' },
    { path: 'content/projects/tool.md', slug: '/projects/tool', featured: true },
    { path: 'content/study/guide.md', slug: '/study/guide' },
    { path: 'content/reviews/book.md', slug: '/reviews/book' },
  ]);
  const mediaDirectory = path.join(root, 'content/media/test-study-guide');
  fs.mkdirSync(mediaDirectory, { recursive: true });
  fs.writeFileSync(path.join(mediaDirectory, 'diagram.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  fs.writeFileSync(path.join(mediaDirectory, 'clip.mp4'), Buffer.from('미디어 경로 검사 데이터'));
  fs.writeFileSync(path.join(mediaDirectory, 'unused.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  fs.mkdirSync(path.join(root, 'src/preview/examples'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/preview/examples/media-lab.md'), '정식 빌드에서 읽으면 안 되는 미리보기 예제');
  fs.mkdirSync(path.join(root, 'raw'));
  fs.writeFileSync(path.join(root, 'raw/secret.txt'), '원자료 표시 금지');
  fs.mkdirSync(path.join(root, 'wiki'));
  fs.writeFileSync(path.join(root, 'wiki/secret.md'), '지식 기록 표시 금지');
  const post = loadPublicPages(root).find(item => item.meta.type === 'study');
  const originalMarkdown = fs.readFileSync(post.file);
  const settings = loadPostSettings(root, post);
  Object.assign(settings.media[0], { width: 50, ratio: '4:3', fit: 'cover', align: 'right' });
  settings.references = [{ title: '원문 자료', url: 'https://example.com/source', note: '원문을 읽었으며 실행 검증은 하지 않았다.' }];
  settings.referenceBlocks = [citation];
  savePostSettings(root, post, settings);
  const { dist, pages } = buildSite({ root, runChecks: false });
  const home = pages.get('/');
  assert.match(home, /<title>공개 기록 검사<\/title>/);
  assert.match(home, /공개할 자기소개 요약입니다/);
  assert.doesNotMatch(home, /상세 CV 본문|대표 프로젝트/);
  assert.ok(home.indexOf('home-introduction') < home.indexOf('data-home-tabs'));
  const navigation = home.match(/<nav\b[^>]*aria-label="주 메뉴"[^>]*>([\s\S]*?)<\/nav>/)[1];
  const menu = [...navigation.matchAll(/<a\b[^>]*class="nav-link[^"]*"[^>]*href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(menu, ['/', '/about/', '/projects/', '/tech/', '/hobby/']);
  const panels = ['projects', 'tech', 'hobby'];
  for (const [index, section] of panels.entries()) {
    assert.match(home, new RegExp(`<a\\b[^>]*id="home-${section}-tab"[^>]*href="#home-${section}"`));
    const start = home.indexOf(`<section id="home-${section}"`);
    const end = index + 1 < panels.length ? home.indexOf(`<section id="home-${panels[index + 1]}"`) : home.indexOf('</main>');
    const panel = home.slice(start, end);
    assert.ok(start >= 0 && end > start, `${section} 목록이 있어야 합니다.`);
    assert.doesNotMatch(panel.match(/^<section\b[^>]*>/)[0], /\bhidden(?:\s|=|>)/);
    const titles = ['도구 프로젝트', '렌더링 학습 기록', '독서 감상 기록'];
    assert.match(panel, new RegExp(titles[index]));
    for (const other of titles.filter((_, item) => item !== index)) assert.doesNotMatch(panel, new RegExp(other));
  }
  for (const [section, category, title] of [
    ['projects', 'tools', '도구 프로젝트'], ['tech', 'rendering', '렌더링 학습 기록'], ['hobby', 'books', '독서 감상 기록'],
  ]) {
    assert.match(pages.get(`/${section}/`), new RegExp(title));
    assert.match(pages.get(`/${section}/categories/${category}/`), new RegExp(title));
    assert.match(pages.get(`/${section}/categories/${category}/`), /class="category-count">\(1\)/);
  }
  assert.doesNotMatch(pages.get('/tech/'), /도구 프로젝트|독서 감상 기록/);
  assert.match(pages.get('/about/'), /상세 CV 본문입니다/);
  const article = pages.get('/study/guide/');
  const body = article.match(/<div class="article-body" data-article-body>([\s\S]*?)<\/div><footer/)[1];
  assert.match(body, /href="\/projects\/tool\/">프로젝트 보기/);
  assert.match(body, /src="\/media\/test-study-guide\/diagram\.svg"[^>]*alt="렌더링 과정 설명"/);
  assert.match(body, /width:50%;--media-ratio:4 \/ 3/);
  assert.match(body, /<video[^>]*controls preload="metadata"/);
  assert.match(body, /src="\/media\/test-study-guide\/clip\.mp4"/);
  assert.match(body, /최종 설명 문장입니다/);
  assert.doesNotMatch(body, /원문 자료|실행 검증은 하지 않았다/);
  assert.match(article, /<footer class="article-references"[\s\S]*참고 자료/);
  assert.equal((article.match(/https:\/\/example.com\/source/g) ?? []).length, 1);
  assert.deepEqual(fs.readFileSync(post.file), originalMarkdown);
  for (const file of ['diagram.svg', 'clip.mp4']) assert.ok(fs.existsSync(path.join(dist, 'media/test-study-guide', file)));
  assert.equal(fs.existsSync(path.join(dist, 'media/test-study-guide/unused.svg')), false);
  assert.ok(fs.existsSync(path.join(dist, 'assets/NotoSansKR-Variable.ttf')));
  assert.match(fs.readFileSync(path.join(dist, 'assets/fonts.css'), 'utf8'), /Noto Sans KR/);
  for (const [route, html] of pages) {
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, route);
    assert.doesNotMatch(html, /\/preview\/devblog\/|font-comparison|data-font-option|noindex|디자인 미리보기|비공개 초안 표시 금지|원자료 표시 금지|지식 기록 표시 금지|media-lab|src-test/);
    assert.match(html, /DevBlog design by[\s\S]*Xiaoying Riley/);
    for (const match of html.matchAll(/\b(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
      const target = match[1];
      if (target.startsWith('//')) continue;
      const file = path.join(dist, target === '/' ? 'index.html' : target.slice(1), target.endsWith('/') && target !== '/' ? 'index.html' : '');
      assert.ok(fs.existsSync(file) && fs.statSync(file).isFile(), `${route}의 링크 대상이 없습니다: ${target}`);
    }
  }
  const files = fs.readdirSync(dist, { recursive: true }).map(file => String(file).replaceAll('\\', '/'));
  assert.ok(files.every(file => !/(?:^|\/)(?:raw|wiki|content|__editor|media-lab)(?:\/|$)|\.json$/.test(file)));
});

test('의미 구조 렌더러: 홈은 자기소개로 시작하고 JavaScript 없이도 두 영역과 독립 페이지로 이동할 수 있다', t => {
  const { root } = fixture(t);
  const home = renderSite(loadPublicPages(root)).get('/');
  const main = home.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
  assert.match(main, /^\s*<section\b[^>]*\bid="home-introduction"/);
  assert.match(main, /<h1\b[^>]*>자기소개<\/h1>/);
  assert.match(main, /소개를 준비하고 있습니다\./);
  assert.ok(main.indexOf('id="home-introduction"') < main.indexOf('data-home-tabs'));
  assert.match(main, /<a\b(?=[^>]*\bid="home-tech-tab")(?=[^>]*\bhref="#home-tech")[^>]*>기술<\/a>/);
  assert.match(main, /<a\b(?=[^>]*\bid="home-hobby-tab")(?=[^>]*\bhref="#home-hobby")[^>]*>취미<\/a>/);
  for (const id of ['home-tech', 'home-hobby']) {
    const opening = main.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>`))?.[0];
    assert.ok(opening, `전환 링크의 대상 ${id}가 있어야 합니다.`);
    assert.doesNotMatch(opening, /\bhidden(?:\s|=|>)/);
  }
  assert.match(main, /href="\/tech\/"/);
  assert.match(main, /href="\/hobby\/"/);
});

test('의미 구조 렌더러: 공개 프로필의 제목과 요약을 홈 최상단에 안전하게 표시한다', t => {
  const { root, manifest, page } = fixture(t);
  page('content/profile.md', {
    type: 'profile', title: '공개 <프로필>', summary: '짧은 소개 <script>alert(1)</script>', body: '상세 소개에만 표시할 본문입니다.',
  });
  manifest([{ path: 'content/profile.md', slug: '/about' }]);
  const output = renderSite(loadPublicPages(root));
  const home = output.get('/');
  assert.match(home, /<h1\b[^>]*>공개 &lt;프로필&gt;<\/h1>/);
  assert.match(home, /짧은 소개 &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(home, /<script>alert|상세 소개에만 표시할 본문/);
  assert.equal((home.match(/<script\b/g) ?? []).length, 1);
  assert.match(output.get('/about/'), /상세 소개에만 표시할 본문입니다\./);
  assert.doesNotMatch(home, /src-test|sources:/);
});

test('의미 구조 렌더러: 공개 프로필에 요약이 없으면 소개 본문을 제목 중복 없이 홈에 표시한다', t => {
  const { root, manifest, page } = fixture(t);
  page('content/profile.md', { type: 'profile', title: '공개 소개', body: '첫 소개 문단입니다.\n\n## 활동\n\n공개한 활동입니다.' });
  manifest([{ path: 'content/profile.md', slug: '/about' }]);
  const home = renderSite(loadPublicPages(root)).get('/');
  assert.equal((home.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.match(home, /<p>첫 소개 문단입니다\.<\/p>/);
  assert.match(home, /<h2\b[^>]*>활동<\/h2>/);
  assert.match(home, /공개한 활동입니다\./);
  assert.ok(home.indexOf('공개한 활동입니다.') < home.indexOf('data-home-tabs'));
});

test('의미 구조 렌더러: 홈에 넣은 프로필의 제목과 내부 링크가 전환 패널 ID와 충돌하지 않는다', t => {
  const { root, manifest, page } = fixture(t);
  page('content/profile.md', {
    type: 'profile', title: '공개 소개',
    body: [
      '## home-tech', '', '[절 보기](#home-tech)', '',
      '```html', '<h2 id="home-tech">코드 제목</h2>', '<a href="#home-tech">코드 링크</a>', '```',
    ].join('\n'),
  });
  manifest([{ path: 'content/profile.md', slug: '/about' }]);
  const output = renderSite(loadPublicPages(root));
  const home = output.get('/');
  const about = output.get('/about/');
  assert.equal((home.match(/\bid="home-tech"/g) ?? []).length, 1);
  assert.match(home, /<section\b[^>]*\bid="home-tech"/);
  assert.match(home, /<h2\b[^>]*\bid="intro-home-tech"[^>]*>home-tech<\/h2>/);
  assert.match(home, /<a href="#intro-home-tech">절 보기<\/a>/);
  assert.match(home, /<a\b(?=[^>]*\bid="home-tech-tab")(?=[^>]*\bhref="#home-tech")[^>]*>기술<\/a>/);
  assert.match(about, /<h2\b[^>]*\bid="home-tech"[^>]*>home-tech<\/h2>/);
  assert.match(about, /<a href="#home-tech">절 보기<\/a>/);
  assert.doesNotMatch(about, /(?:id="|href="#)intro-home-tech/);
  for (const html of [home, about]) {
    assert.match(html, /&lt;h2 id=&quot;home-tech&quot;&gt;코드 제목&lt;\/h2&gt;/);
    assert.match(html, /&lt;a href=&quot;#home-tech&quot;&gt;코드 링크&lt;\/a&gt;/);
    assert.doesNotMatch(html, /&quot;(?:#)?intro-home-tech&quot;/);
  }
});

test('의미 구조 렌더러: 대표 작업 선택과 최신 공부 정렬을 반영하며 공개 문서 링크를 사이트 주소로 바꾼다', t => {
  const { root, manifest, page } = fixture(t);
  page('content/projects/selected.md', { title: '선택한 작업', body: '[참고 기록](../study/recent.md)' });
  page('content/projects/other.md', { title: '목록에만 있는 작업' });
  page('content/study/old.md', { title: '이전 기록', type: 'study', created: '2026-11-16' });
  page('content/study/recent.md', { title: '최근 기록 테스트', type: 'study', created: '2026-11-18' });
  manifest([
    { path: 'content/projects/selected.md', slug: '/projects/selected', featured: true },
    { path: 'content/projects/other.md', slug: '/projects/other' },
    { path: 'content/study/old.md', slug: '/study/old' },
    { path: 'content/study/recent.md', slug: '/study/recent' },
  ]);
  const pages = renderSite(loadPublicPages(root));
  assert.match(pages.get('/'), /선택한 작업/);
  assert.doesNotMatch(pages.get('/'), /목록에만 있는 작업/);
  assert.match(pages.get('/projects/'), /목록에만 있는 작업/);
  assert.match(pages.get('/tech/'), /목록에만 있는 작업/);
  assert.ok(pages.get('/study/').indexOf('최근 기록 테스트') < pages.get('/study/').indexOf('이전 기록'));
  assert.match(pages.get('/projects/selected/'), /href="\/study\/recent\/"/);
  assert.equal((pages.get('/projects/selected/').match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.doesNotMatch(pages.get('/projects/selected/'), /src-test|sources:/);
});

test('의미 구조 렌더러: 기술·취미 허브는 내용을 구분하고 기존 목록과 상세의 돌아가기를 유지한다', t => {
  const { root, manifest, page } = fixture(t);
  page('content/projects/work.md', { title: '프로젝트 테스트 항목' });
  page('content/study/old.md', { title: '이전 기술 공부 항목', type: 'study', created: '2026-11-15' });
  page('content/study/new.md', { title: '새 기술 공부 항목', type: 'study' });
  page('content/reviews/old.md', { title: '이전 취미 감상문 항목', type: 'review', created: '2026-11-16' });
  page('content/reviews/new.md', { title: '새 취미 감상문 항목', type: 'review' });
  manifest([
    { path: 'content/reviews/old.md', slug: '/reviews/old' },
    { path: 'content/projects/work.md', slug: '/projects/work', featured: true },
    { path: 'content/study/old.md', slug: '/study/old' },
    { path: 'content/reviews/new.md', slug: '/reviews/new' },
    { path: 'content/study/new.md', slug: '/study/new' },
  ]);
  const output = renderSite(loadPublicPages(root));
  const projectList = output.get('/projects/');
  const studyList = output.get('/study/');
  const reviewList = output.get('/reviews/');
  const tech = output.get('/tech/');
  const hobby = output.get('/hobby/');
  assert.match(tech, /프로젝트 테스트 항목/);
  assert.match(tech, /새 기술 공부 항목/);
  assert.match(tech, /이전 기술 공부 항목/);
  assert.doesNotMatch(tech, /취미 감상문 항목/);
  assert.match(tech, /href="\/projects\/"/);
  assert.match(tech, /href="\/study\/"/);
  assert.match(hobby, /취미 감상문 항목/);
  assert.doesNotMatch(hobby, /프로젝트 테스트 항목|기술 공부 항목/);
  assert.match(hobby, /href="\/reviews\/"/);
  assert.match(projectList, /프로젝트 테스트 항목/);
  assert.doesNotMatch(projectList, /기술 공부 항목|취미 감상문 항목/);
  assert.match(studyList, /기술 공부 항목/);
  assert.doesNotMatch(studyList, /프로젝트 테스트 항목|취미 감상문 항목/);
  assert.match(reviewList, /취미 감상문 항목/);
  assert.doesNotMatch(reviewList, /프로젝트 테스트 항목|기술 공부 항목/);
  assert.ok(studyList.indexOf('새 기술 공부 항목') < studyList.indexOf('이전 기술 공부 항목'));
  assert.ok(reviewList.indexOf('새 취미 감상문 항목') < reviewList.indexOf('이전 취미 감상문 항목'));
  const home = output.get('/');
  const homeStudy = home.match(/<section aria-labelledby="recent-study">([\s\S]*?)<\/section>/)[1];
  const homeReviews = home.match(/<section aria-labelledby="recent-reviews">([\s\S]*?)<\/section>/)[1];
  assert.match(homeStudy, /새 기술 공부 항목/);
  assert.doesNotMatch(homeStudy, /취미 감상문 항목|프로젝트 테스트 항목/);
  assert.match(homeReviews, /새 취미 감상문 항목/);
  assert.doesNotMatch(homeReviews, /기술 공부 항목|프로젝트 테스트 항목/);
  const techStart = home.indexOf('id="home-tech"');
  const hobbyStart = home.indexOf('id="home-hobby"');
  assert.ok(techStart >= 0 && hobbyStart > techStart);
  const homeTech = home.slice(techStart, hobbyStart);
  const homeHobby = home.slice(hobbyStart, home.indexOf('</main>'));
  assert.match(homeTech, /프로젝트 테스트 항목/);
  assert.match(homeTech, /새 기술 공부 항목/);
  assert.doesNotMatch(homeTech, /취미 감상문 항목/);
  assert.match(homeHobby, /새 취미 감상문 항목/);
  assert.doesNotMatch(homeHobby, /기술 공부 항목|프로젝트 테스트 항목/);
  assert.match(output.get('/projects/work/'), /href="\/projects\/">프로젝트 목록/);
  assert.match(output.get('/study/new/'), /href="\/study\/">기술 공부 목록/);
  assert.match(output.get('/reviews/new/'), /href="\/reviews\/">취미 감상문 목록/);
  assert.match(output.get('/reviews/new/'), /href="\/hobby\/" aria-current="location"/);
  assert.match(output.get('/study/new/'), /href="\/tech\/" aria-current="location"/);
  assert.match(output.get('/projects/work/'), /href="\/tech\/" aria-current="location"/);
  assert.match(tech, /href="\/tech\/" aria-current="page"/);
  assert.match(hobby, /href="\/hobby\/" aria-current="page"/);
});

test('의미 구조 렌더러: 홈에서 기술 공부와 취미 감상문은 각각 최신 다섯 개만 표시한다', t => {
  const { root, manifest, page } = fixture(t);
  const items = [];
  for (const type of ['study', 'review']) {
    const folder = type === 'study' ? 'study' : 'reviews';
    for (let index = 1; index <= 6; index++) {
      const file = `content/${folder}/item-${index}.md`;
      page(file, { title: `${type} 테스트 항목 ${index}`, type, created: `2026-11-${11 + index}` });
      items.push({ path: file, slug: `/${folder}/item-${index}` });
    }
  }
  manifest(items);
  const output = renderSite(loadPublicPages(root));
  const home = output.get('/');
  for (const type of ['study', 'review']) {
    assert.doesNotMatch(home, new RegExp(`${type} 테스트 항목 1`));
    assert.match(home, new RegExp(`${type} 테스트 항목 6`));
    const folder = type === 'study' ? 'study' : 'reviews';
    assert.match(output.get(`/${folder}/`), new RegExp(`${type} 테스트 항목 1`));
    assert.match(output.get(type === 'study' ? '/tech/' : '/hobby/'), new RegExp(`${type} 테스트 항목 1`));
  }
});

test('공개 목록에 등록된 초안과 맞지 않는 경로·종류를 거부한다', t => {
  const { root, manifest, page } = fixture(t);
  page('content/projects/example.md', { status: 'draft' });
  manifest([{ path: 'content/projects/example.md', slug: '/projects/example' }]);
  assert.throws(() => loadPublicPages(root), /검토 완료/);
  page('content/projects/example.md');
  manifest([{ path: 'content/projects/example.md', slug: '/study/example' }]);
  assert.throws(() => loadPublicPages(root), /종류/);
  manifest([{ path: 'content/projects/example.md', slug: '/projects/example' }, { path: 'content/projects/example.md', slug: '/projects/duplicate' }]);
  assert.throws(() => loadPublicPages(root), /중복/);
});

test('문서 종류와 저장 폴더·공개 경로가 서로 다르면 거부한다', t => {
  const { root, manifest, page } = fixture(t);
  page('content/study/misfiled.md', { type: 'review' });
  manifest([{ path: 'content/study/misfiled.md', slug: '/reviews/misfiled' }]);
  assert.throws(() => loadPublicPages(root), /저장 위치/);
  page('content/reviews/valid.md', { type: 'review' });
  manifest([{ path: 'content/reviews/valid.md', slug: '/study/valid' }]);
  assert.throws(() => loadPublicPages(root), /공개 경로/);
  page('content/study/legacy.md', { type: 'article' });
  manifest([{ path: 'content/study/legacy.md', slug: '/notes/legacy' }]);
  assert.throws(() => loadPublicPages(root), /종류/);
  page('content/reviews/profile.md', { type: 'profile' });
  manifest([{ path: 'content/reviews/profile.md', slug: '/about' }]);
  assert.throws(() => loadPublicPages(root), /저장 위치/);
  page('content/profile.md', { type: 'profile' });
  manifest([{ path: 'content/profile.md', slug: '/about' }]);
  assert.equal(loadPublicPages(root)[0].route, '/about/');
});

test('구조 검사부터 공개 Markdown 링크 변환까지 전체 빌드를 실행한다', t => {
  const { root, manifest, page } = fixture(t);
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.copyFileSync(new URL('../scripts/check.mjs', import.meta.url), path.join(root, 'scripts/check.mjs'));
  fs.mkdirSync(path.join(root, 'src'));
  fs.copyFileSync(new URL('../src/categories.mjs', import.meta.url), path.join(root, 'src/categories.mjs'));
  fs.mkdirSync(path.join(root, 'wiki'));
  fs.mkdirSync(path.join(root, 'raw'));
  for (const file of ['README.md', 'AGENTS.md', 'agent.md', 'wiki/index.md', 'wiki/log.md']) fs.writeFileSync(path.join(root, file), '# 검증용 문서\n');
  const evidence = '빌드 검증용 원자료';
  fs.writeFileSync(path.join(root, 'raw/source.txt'), evidence);
  fs.writeFileSync(path.join(root, 'raw/manifest.json'), JSON.stringify({ version: 1, sources: [{
    id: 'src-test', title: '검증용 출처', path: 'raw/source.txt', sha256: createHash('sha256').update(evidence).digest('hex'),
    acquired: '2026-11-18', author: null, published: null, url: null, ingest_status: 'pending', verification: 'unverified', wiki_page: null,
  }] }));
  page('content/projects/one.md', { body: '[소개](/about/)와 [기록](../study/one.md)을 확인합니다.' });
  page('content/study/one.md', { type: 'study' });
  manifest([
    { path: 'content/projects/one.md', slug: '/projects/one' },
    { path: 'content/study/one.md', slug: '/study/one' },
  ]);
  const { dist } = buildSite({ root });
  const output = fs.readFileSync(path.join(dist, 'projects/one/index.html'), 'utf8');
  assert.match(output, /href="\/about\/"/);
  assert.match(output, /href="\/study\/one\/"/);
  assert.doesNotMatch(output, /빌드 검증용 원자료|src-test/);
});

test('사이트 밖 원본 경로와 미등록 문서 링크를 거부한다', t => {
  const { root, manifest, page } = fixture(t);
  fs.mkdirSync(path.join(root, 'raw'));
  fs.writeFileSync(path.join(root, 'raw/source.md'), '내부 자료');
  manifest([{ path: 'raw/source.md', slug: '/study/source' }]);
  assert.throws(() => loadPublicPages(root), /공개할 수 없는/);
  page('content/projects/one.md');
  page('content/projects/unlisted.md');
  manifest([{ path: 'content/projects/one.md', slug: '/projects/one' }]);
  const pages = loadPublicPages(root);
  assert.throws(() => resolvePublicLink('unlisted.md', pages[0], pages), /공개 목록에 없는/);
  assert.throws(() => resolvePublicLink('/raw/source.md', pages[0], pages), /사이트에 없는/);
  assert.equal(resolvePublicLink('/about', pages[0], pages), '/about/');
});

test('출력 교체 시 예전에 공개했던 문서도 제거한다', t => {
  const { root, manifest, page } = fixture(t);
  page('content/projects/one.md');
  manifest([{ path: 'content/projects/one.md', slug: '/projects/one' }]);
  const { dist } = buildSite({ root, runChecks: false });
  assert.ok(fs.existsSync(path.join(dist, 'projects/one/index.html')));
  manifest([]);
  buildSite({ root, runChecks: false });
  assert.equal(fs.existsSync(path.join(dist, 'projects/one/index.html')), false);
});

test('로컬 서버는 빌드 결과만 제공하고 없는 경로에는 404를 반환한다', async t => {
  const { root } = fixture(t);
  const { dist } = buildSite({ root, runChecks: false });
  const server = createStaticServer(dist);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base + '/')).status, 200);
  assert.equal((await fetch(base + '/tech/')).status, 200);
  assert.equal((await fetch(base + '/hobby/')).status, 200);
  assert.equal((await fetch(base + '/projects/')).status, 200);
  assert.equal((await fetch(base + '/study/')).status, 200);
  assert.equal((await fetch(base + '/reviews/')).status, 200);
  assert.equal((await fetch(base + '/notes/')).status, 404);
  assert.equal((await fetch(base + '/projects', { redirect: 'manual' })).status, 308);
  assert.equal((await fetch(base + '/raw/manifest.json')).status, 404);
  assert.equal((await fetch(base + '/AGENTS.md')).status, 404);
  assert.equal((await fetch(base + '/missing')).status, 404);
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
  const head = await fetch(base + '/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
