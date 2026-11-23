import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadPreviewSettings, defaultPreviewSettings, validatePreviewSettings } from '../src/preview/settings.mjs';
import { renderDevBlogPreview } from '../src/preview/devblog.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-copy-'));
  fs.mkdirSync(path.join(root, 'content'));
  t.after(() => {
    const target = fs.realpathSync(root);
    assert.equal(path.dirname(target), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('homepage-copy-'));
    fs.rmSync(target, { recursive: true });
  });
  const write = value => fs.writeFileSync(path.join(root, 'content/site.json'), JSON.stringify(value));
  return { root, write };
}

test('문구 설정이 없어도 기존 기본 문구를 사용하며 기본값을 공유해서 변경하지 않는다', t => {
  const { root } = fixture(t);
  const one = loadPreviewSettings(root);
  assert.deepEqual(one, defaultPreviewSettings);
  one.labels.readMore = '변경';
  assert.equal(loadPreviewSettings(root).labels.readMore, '계속 읽기');
});

test('필요한 문구만 덮어쓰고 CV 항목은 지정한 목록으로 대체한다', t => {
  const { root, write } = fixture(t);
  write({ version: 1, title: '나의 기록', labels: { recent: '새 글' }, cv: { sections: [{ title: '활동', english: 'Activities', placeholder: '활동명', description: '활동 내용을 입력합니다.' }] } });
  const settings = loadPreviewSettings(root);
  assert.equal(settings.title, '나의 기록');
  assert.equal(settings.labels.recent, '새 글');
  assert.equal(settings.labels.viewAll, defaultPreviewSettings.labels.viewAll);
  assert.equal(settings.cv.sections.length, 1);
  assert.equal(settings.cv.sections[0].period, '');
});

test('잘못된 문구 설정과 오타 난 키를 거부한다', t => {
  const { root, write } = fixture(t);
  for (const value of [null, [], { version: 2 }, { titles: '오타' }, { title: '' }, { title: 123 }, { labels: null }, { sidebar: { secret: 'unknown' } }, { cv: { sections: [] } }, { cv: { sections: [{ title: '불완전한 항목' }] } }]) {
    write(value);
    assert.throws(() => loadPreviewSettings(root), /content\/site\.json/);
  }
  fs.writeFileSync(path.join(root, 'content/site.json'), '{');
  assert.throws(() => loadPreviewSettings(root), /JSON을 읽을 수 없습니다/);
});

test('설정한 문구를 화면과 접근성 이름에 반영하고 HTML은 실행하지 않는다', () => {
  const settings = validatePreviewSettings({
    title: '<script>제목</script>', description: '설명 " autofocus="true',
    sidebar: { bio: '<img src=x onerror=alert(1)>', aboutLink: '더 알아보기', previewLabel: '테스트 화면' },
    navigation: { projects: '작업 목록', tech: '학습 목록' },
    labels: { recent: '새로 쓴 글', profilePending: '소개 작성 중', introduction: '작성자 소개' },
    sections: { tech: { title: '공부 기록', description: '<b>학습 내용</b>' } },
    accessibility: { navigation: '페이지 메뉴', cv: '빈 이력 양식' },
    cv: { title: '이력', note: '<script>메모</script>' },
  });
  const pages = renderDevBlogPreview([], undefined, settings);
  const home = pages.get('/preview/devblog/');
  assert.match(home, /&lt;script&gt;제목&lt;\/script&gt;/);
  assert.match(home, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(home, /aria-label="페이지 메뉴"/);
  assert.match(home, /작업 목록/);
  assert.match(home, /공부 기록/);
  assert.match(home, /새로 쓴 글/);
  assert.match(home, /소개 작성 중/);
  assert.match(home, /aria-label="작성자 소개"/);
  assert.match(pages.get('/preview/devblog/tech/'), /&lt;b&gt;학습 내용&lt;\/b&gt;/);
  assert.match(pages.get('/preview/devblog/about/'), /aria-label="빈 이력 양식"/);
  assert.match(pages.get('/preview/devblog/about/'), /<h1>이력<\/h1>/);
  assert.doesNotMatch([...pages.values()].join(''), /<script>|<img src=x| autofocus="true/);
  const unchanged = renderDevBlogPreview([]).get('/preview/devblog/');
  assert.match(unchanged, /기술과 취미의 기록을 모읍니다/);
  assert.doesNotMatch(unchanged, /새로 쓴 글/);
});
