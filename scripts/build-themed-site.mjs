import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadPublicPages } from '../src/content.mjs';
import { loadCategories } from '../src/categories.mjs';
import { renderDevBlogSite } from '../src/devblog.mjs';
import { loadPreviewSettings } from '../src/preview/settings.mjs';
import { loadPostSettings, loadPreviewExample, localMediaFile } from '../src/preview/post-settings.mjs';

const defaultRoot = fileURLToPath(new URL('..', import.meta.url));

export function buildThemedSite({ root = defaultRoot, runChecks = true, preview = false } = {}) {
  root = fs.realpathSync(root);
  if (runChecks) {
    const check = spawnSync(process.execPath, [path.join(root, 'scripts/check.mjs')], { cwd: root, stdio: 'inherit' });
    if (check.status !== 0) throw new Error('구조 검사 실패로 빌드를 중단했습니다.');
  }
  const base = preview ? '/preview/devblog' : '';
  const publicPages = loadPublicPages(root);
  const example = preview ? loadPreviewExample(root) : null;
  const examples = example ? [example] : [];
  const postSettings = new Map([...publicPages, ...examples].map(page => [page.meta.id, loadPostSettings(root, page)]));
  const pages = renderDevBlogSite(publicPages, loadCategories(root), loadPreviewSettings(root), postSettings, examples, { base, preview });
  const mediaFiles = new Map();
  for (const page of [...publicPages, ...examples]) for (const media of postSettings.get(page.meta.id).media) {
    if (media.src.startsWith('/')) mediaFiles.set(media.src, localMediaFile(root, page, media.src));
  }
  const assetSources = new Map([
    ['theme-8.css', new URL('../src/preview/vendor/devblog/theme-8.css', import.meta.url)],
    [preview ? 'preview.css' : 'site.css', new URL('../src/preview/preview.css', import.meta.url)],
    ['home-tabs.js', new URL('../src/home-tabs.js', import.meta.url)],
    ['navigation.js', new URL('../src/preview/navigation.js', import.meta.url)],
    [preview ? 'font-comparison.js' : 'site-font.js', new URL(preview ? '../src/preview/font-comparison.js' : '../src/site-font.js', import.meta.url)],
    ...['study', 'project', 'review', 'profile'].map(type => [`${type}.svg`, new URL(`../src/preview/${type}.svg`, import.meta.url)]),
  ]);
  const fontRoot = new URL('../src/preview/fonts/', import.meta.url);
  const bootstrapLicense = fs.readFileSync(new URL('../src/preview/vendor/devblog/BOOTSTRAP-LICENSE.txt', import.meta.url), 'utf8');
  const fontCss = `/*\n${bootstrapLicense}\n*/\n` + ['OFL-Pretendard.txt', 'OFL-NotoSansKR.txt'].map(name => `/*\n${fs.readFileSync(new URL(name, fontRoot), 'utf8')}\n*/\n`).join('\n')
    + fs.readFileSync(new URL('../src/preview/fonts.css', import.meta.url), 'utf8');
  const files = [
    ...[...assetSources].map(([name, source]) => [name, fs.readFileSync(source)]),
    ['fonts.css', fontCss],
    ...['PretendardVariable.woff2', 'NotoSansKR-Variable.ttf'].map(name => [name, fs.readFileSync(new URL(name, fontRoot))]),
  ];

  // 모든 입력을 확인한 뒤 저장소 내부의 해당 생성물만 교체한다.
  const directory = path.join(root, ...(preview ? ['build', 'devblog-preview'] : ['dist']));
  const relative = path.relative(root, directory);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('출력 폴더가 저장소 밖을 가리킵니다.');
  if (preview) {
    const build = path.join(root, 'build');
    fs.mkdirSync(build, { recursive: true });
    if (fs.realpathSync(build) !== build) throw new Error('build/가 다른 위치를 가리킵니다.');
  }
  if (fs.existsSync(directory) && (fs.lstatSync(directory).isSymbolicLink() || fs.realpathSync(directory) !== directory)) throw new Error('출력 폴더가 다른 위치를 가리킵니다.');
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory);
  for (const [route, html] of pages) {
    const target = route === '/404.html' ? path.join(directory, '404.html') : path.join(directory, route.slice(1), 'index.html');
    const relativeTarget = path.relative(directory, target);
    if (relativeTarget === '..' || relativeTarget.startsWith(`..${path.sep}`) || path.isAbsolute(relativeTarget)) throw new Error(`잘못된 출력 경로: ${route}`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html, 'utf8');
  }
  const assetDirectory = path.join(directory, base, 'assets');
  fs.mkdirSync(assetDirectory, { recursive: true });
  for (const [name, bytes] of files) fs.writeFileSync(path.join(assetDirectory, name), bytes);
  for (const [src, source] of mediaFiles) {
    const target = path.join(directory, base, src.slice(1));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
  console.log(`${preview ? 'DevBlog 미리보기' : '홈페이지 정적 빌드'}: ${pages.size - 1}개 페이지와 404 → ${preview ? 'build/devblog-preview/' : 'dist/'}`);
  return { directory, pages };
}
