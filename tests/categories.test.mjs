import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { loadCategories, sectionForType, validatePageCategory } from '../src/categories.mjs';
import { loadPublicPages } from '../src/content.mjs';
import { buildSite } from '../scripts/build-site.mjs';

const config = () => ({ version: 1, sections: {
  projects: [{ id: 'tools', label: '도구' }],
  tech: [{ id: 'rendering', label: '렌더링' }, { id: 'tools', label: '개발 도구' }],
  hobby: [{ id: 'books', label: '독서' }],
} });

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-categories-'));
  for (const directory of ['content/projects', 'content/study', 'content/reviews', 'scripts', 'src', 'raw', 'wiki']) {
    fs.mkdirSync(path.join(root, directory), { recursive: true });
  }
  fs.copyFileSync(new URL('../src/categories.mjs', import.meta.url), path.join(root, 'src/categories.mjs'));
  fs.copyFileSync(new URL('../scripts/check.mjs', import.meta.url), path.join(root, 'scripts/check.mjs'));
  for (const file of ['README.md', 'AGENTS.md', 'agent.md', 'wiki/index.md', 'wiki/log.md']) {
    fs.writeFileSync(path.join(root, file), '# 검증용 문서\n');
  }
  const evidence = '카테고리 동작 검증용 자료';
  fs.writeFileSync(path.join(root, 'raw/source.txt'), evidence);
  fs.writeFileSync(path.join(root, 'raw/manifest.json'), JSON.stringify({ version: 1, sources: [{
    id: 'src-test', title: '검증용 자료', path: 'raw/source.txt', sha256: createHash('sha256').update(evidence).digest('hex'),
    acquired: '2026-11-18', author: null, published: null, url: null, ingest_status: 'pending', verification: 'unverified', wiki_page: null,
  }] }));
  const manifest = [];
  const writeManifest = () => fs.writeFileSync(path.join(root, 'content/manifest.json'), JSON.stringify({ version: 1, pages: manifest }));
  writeManifest();
  const categories = value => fs.writeFileSync(path.join(root, 'content/categories.json'), JSON.stringify(value));
  const page = (type, category, { publish = true } = {}) => {
    const folder = { project: 'projects', study: 'study', review: 'reviews' }[type];
    const file = folder ? `content/${folder}/example.md` : 'content/profile.md';
    fs.writeFileSync(path.join(root, file), `---\nid: test-${type}\ntitle: 검증용 문서\ntype: ${type}\nstatus: ${publish ? 'reviewed' : 'draft'}\nvisibility: public\ncreated: 2026-11-18\nupdated: 2026-11-18\nsources: ["src-test"]\n${category === undefined ? '' : `category: ${JSON.stringify(category)}\n`}---\n\n# 검증용 문서\n\n검증용 본문입니다.\n`);
    if (publish) {
      manifest.push({ path: file, slug: folder ? `/${folder}/example` : '/about' });
      writeManifest();
    }
  };
  const check = () => spawnSync(process.execPath, [path.join(root, 'scripts/check.mjs')], { encoding: 'utf8' });
  t.after(() => {
    const target = fs.realpathSync(root);
    assert.equal(path.dirname(target), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('homepage-categories-'));
    fs.rmSync(target, { recursive: true });
  });
  return { root, categories, page, check };
}

test('카테고리 설정이 없어도 기존 문서의 공개 경계와 빌드를 유지한다', t => {
  const { root, page, check } = fixture(t);
  assert.deepEqual(loadCategories(root), { projects: [], tech: [], hobby: [] });
  page('study');
  assert.equal(loadPublicPages(root).length, 1);
  assert.doesNotThrow(() => buildSite({ root, runChecks: false }));
  assert.equal(check().status, 0);
});

test('영역별 카테고리를 로드하고 서로 다른 영역에서는 같은 id를 허용한다', t => {
  const { root, categories, page, check } = fixture(t);
  const settings = config();
  categories(settings);
  page('project', 'tools');
  page('study', 'tools');
  page('review', 'books');
  assert.deepEqual(loadCategories(root), settings.sections);
  assert.deepEqual(loadPublicPages(root).map(page => page.meta.category), ['tools', 'tools', 'books']);
  assert.equal(check().status, 0);
  assert.equal(sectionForType('project'), 'projects');
  assert.equal(sectionForType('study'), 'tech');
  assert.equal(sectionForType('review'), 'hobby');
  assert.equal(sectionForType('profile'), null);
  assert.equal(sectionForType('__proto__'), null);
});

test('카테고리 설정의 중복·예약어·잘못된 구조를 거부한다', t => {
  const { root, categories } = fixture(t);
  const invalid = [
    { ...config(), version: 2 },
    { version: 1, sections: [] },
    { version: 1, sections: { tech: [] } },
    { version: 1, sections: { ...config().sections, other: [] } },
    { version: 1, sections: { ...config().sections, tech: 'rendering' } },
    ...[
      [{ id: 'one', label: '하나' }, { id: 'one', label: '둘' }],
      [{ id: 'one', label: '하나' }, { id: 'two', label: '하나' }],
      [{ id: 'all', label: '전체' }],
      [{ id: 'uncategorized', label: '미분류' }],
      [{ id: '../outside', label: '경로 이탈' }],
      [{ id: 'UpperCase', label: '대문자' }],
      [{ id: 'empty', label: ' ' }],
      [{ id: 'blank', label: ' 앞 공백' }],
      [{ id: 'array', label: ['목록'] }],
      [null],
    ].map(tech => ({ version: 1, sections: { ...config().sections, tech } })),
  ];
  for (const value of invalid) {
    categories(value);
    assert.throws(() => loadCategories(root), /content\/categories\.json/);
  }
  fs.writeFileSync(path.join(root, 'content/categories.json'), '{ invalid');
  assert.throws(() => loadCategories(root), /JSON을 읽을 수 없습니다/);
});

test('글의 category는 해당 종류에 등록된 id 하나만 허용한다', () => {
  const sections = config().sections;
  assert.doesNotThrow(() => validatePageCategory({ type: 'study' }, sections));
  assert.doesNotThrow(() => validatePageCategory({ type: 'study', category: 'rendering' }, sections));
  for (const category of ['', null, 1, ['rendering'], 'all', 'uncategorized', 'books', 'unknown']) {
    assert.throws(() => validatePageCategory({ type: 'study', category }, sections), /category/);
  }
  assert.throws(() => validatePageCategory({ type: 'profile', category: 'tools' }, sections), /category/);
});

test('다른 영역의 카테고리를 지정하면 공개 로더와 전체 빌드·구조 검사에서 실패한다', t => {
  const { root, categories, page, check } = fixture(t);
  categories(config());
  page('study', 'books');
  assert.throws(() => loadPublicPages(root), /tech에 등록되지 않은 category/);
  assert.throws(() => buildSite({ root, runChecks: false }), /tech에 등록되지 않은 category/);
  const result = check();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /tech에 등록되지 않은 category/);
});

test('구조 검사는 미등록 초안의 카테고리도 검사하며 공개 로더는 초안을 읽지 않는다', t => {
  const { root, categories, page, check } = fixture(t);
  categories(config());
  page('review', 'rendering', { publish: false });
  assert.deepEqual(loadPublicPages(root), []);
  const result = check();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /hobby에 등록되지 않은 category/);
});

test('공개 글이 없어도 잘못된 카테고리 설정은 검사와 빌드에서 실패한다', t => {
  const { root, categories, check } = fixture(t);
  categories({ version: 1, sections: { projects: [], tech: [] } });
  assert.throws(() => loadPublicPages(root), /hobby/);
  assert.throws(() => buildSite({ root, runChecks: false }), /hobby/);
  const result = check();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /hobby/);
});
