import { escapeHtml, renderMarkdown } from './markdown.mjs';
import { resolvePublicLink } from './content.mjs';
import { site } from './site.config.mjs';

function document({ title, route, content, description = site.description, scripts = [] }) {
  const navigation = site.navigation.map(item => {
    const exact = route === item.href;
    const current = exact || (item.activePrefixes ?? []).some(prefix => route.startsWith(prefix));
    return `<li><a href="${item.href}"${current ? ` aria-current="${exact ? 'page' : 'location'}"` : ''}>${item.label}</a></li>`;
  }).join('\n');
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title === site.title ? title : `${title} | ${site.title}`)}</title>
</head>
<body>
  <a href="#main">본문으로 이동</a>
  <header>
    <p><a href="/">${escapeHtml(site.title)}</a></p>
    <nav aria-label="주 메뉴"><ul>${navigation}</ul></nav>
  </header>
  <main id="main" tabindex="-1">
${content}
  </main>
  <footer><p><a href="#main">본문 처음으로</a></p></footer>
${scripts.map(source => `  <script type="module" src="${escapeHtml(source)}"></script>`).join('\n')}
</body>
</html>
`;
}

function entries(pages, { heading = 2, empty }) {
  if (!pages.length) return `<p>${empty}</p>`;
  return `<ul>\n${pages.map(page => `<li><article>
<h${heading}><a href="${page.route}">${escapeHtml(page.meta.title)}</a></h${heading}>
${page.meta.summary ? `<p>${escapeHtml(page.meta.summary)}</p>` : ''}
<p><time datetime="${page.meta.created}">${page.meta.created}</time></p>
</article></li>`).join('\n')}\n</ul>`;
}

function profileBody(profile, pages, renderBody) {
  const html = renderBody ? renderBody(profile, pages) : renderMarkdown(profile.body, { title: profile.meta.title, resolveLink: value => resolvePublicLink(value, profile, pages) });
  const headingIds = new Set([...html.matchAll(/<h[2-6] id="([^"]+)"/g)].map(match => match[1]));
  return html.replace(/(<h[2-6] id=")([^"]+)/g, '$1intro-$2')
    .replace(/href="#([^"]+)"/g, (link, fragment) => {
      let id;
      try { id = decodeURIComponent(fragment); } catch { return link; }
      return headingIds.has(id) ? `href="#intro-${id}"` : link;
    });
}

function article(page, pages, renderBody) {
  const parent = page.meta.type === 'project' ? { label: '프로젝트 목록', href: '/projects/' }
    : page.meta.type === 'study' ? { label: '기술 공부 목록', href: '/study/' }
    : page.meta.type === 'review' ? { label: '취미 감상문 목록', href: '/reviews/' } : null;
  return document({
    title: page.meta.title,
    route: page.route,
    description: page.meta.summary || site.description,
    content: `${parent ? `<p><a href="${parent.href}">${parent.label}</a></p>` : ''}
<article>
<header>
<h1>${escapeHtml(page.meta.title)}</h1>
<p>작성 <time datetime="${page.meta.created}">${page.meta.created}</time>${page.meta.updated !== page.meta.created ? ` · 수정 <time datetime="${page.meta.updated}">${page.meta.updated}</time>` : ''}</p>
${page.meta.summary ? `<p>${escapeHtml(page.meta.summary)}</p>` : ''}
</header>
${renderBody ? renderBody(page, pages) : renderMarkdown(page.body, { title: page.meta.title, resolveLink: value => resolvePublicLink(value, page, pages) })}
</article>`,
  });
}

export function renderSite(pages, { renderBody } = {}) {
  const projects = pages.filter(page => page.meta.type === 'project');
  const newestFirst = (left, right) => right.meta.created.localeCompare(left.meta.created) || left.route.localeCompare(right.route);
  const study = pages.filter(page => page.meta.type === 'study').sort(newestFirst);
  const reviews = pages.filter(page => page.meta.type === 'review').sort(newestFirst);
  const featured = projects.filter(page => page.featured).slice(0, site.featuredLimit);
  const profile = pages.find(page => page.meta.type === 'profile');
  const introduction = profile
    ? `<h1>${escapeHtml(profile.meta.title)}</h1>\n${profile.meta.summary ? `<p>${escapeHtml(profile.meta.summary)}</p>` : profileBody(profile, pages, renderBody)}`
    : '<h1>자기소개</h1>\n<p>소개를 준비하고 있습니다.</p>';
  const output = new Map();
  output.set('/', document({ title: site.title, route: '/', scripts: ['/assets/home-tabs.js'], content: `
<section id="home-introduction" aria-label="자기소개">
${introduction}
<p><a href="/about/">소개 자세히 보기</a></p>
</section>
<div data-home-tabs aria-label="기술과 취미 선택">
<a id="home-tech-tab" href="#home-tech">기술</a>
<a id="home-hobby-tab" href="#home-hobby">취미</a>
</div>
<section id="home-tech" data-home-panel aria-labelledby="home-tech-heading">
<h2 id="home-tech-heading">기술</h2>
<p><a href="/tech/">기술 페이지로 이동</a></p>
<section aria-labelledby="featured-projects">
<h3 id="featured-projects">대표 프로젝트</h3>
${entries(featured, { heading: 4, empty: projects.length ? '프로젝트 목록에서 작업을 확인할 수 있습니다.' : '아직 공개한 프로젝트가 없습니다.' })}
<p><a href="/projects/">프로젝트 전체 보기</a></p>
</section>
<section aria-labelledby="recent-study">
<h3 id="recent-study">최근 기술 공부</h3>
${entries(study.slice(0, site.recentStudyLimit), { heading: 4, empty: '아직 공개한 기술 공부 글이 없습니다.' })}
<p><a href="/study/">기술 공부 전체 보기</a></p>
</section>
</section>
<section id="home-hobby" data-home-panel aria-labelledby="home-hobby-heading">
<h2 id="home-hobby-heading">취미</h2>
<p><a href="/hobby/">취미 페이지로 이동</a></p>
<section aria-labelledby="recent-reviews">
<h3 id="recent-reviews">최근 취미 감상문</h3>
${entries(reviews.slice(0, site.recentReviewsLimit), { heading: 4, empty: '아직 공개한 취미 감상문이 없습니다.' })}
<p><a href="/reviews/">취미 감상문 전체 보기</a></p>
</section>
</section>` }));
  output.set('/tech/', document({ title: '기술', route: '/tech/', content: `
<h1>기술</h1>
<section aria-labelledby="tech-projects">
<h2 id="tech-projects">프로젝트</h2>
${entries(projects, { heading: 3, empty: '아직 공개한 프로젝트가 없습니다.' })}
<p><a href="/projects/">프로젝트 목록 보기</a></p>
</section>
<section aria-labelledby="tech-study">
<h2 id="tech-study">기술 공부</h2>
${entries(study, { heading: 3, empty: '아직 공개한 기술 공부 글이 없습니다.' })}
<p><a href="/study/">기술 공부 목록 보기</a></p>
</section>` }));
  output.set('/hobby/', document({ title: '취미', route: '/hobby/', content: `
<h1>취미</h1>
<section aria-labelledby="hobby-reviews">
<h2 id="hobby-reviews">감상문</h2>
${entries(reviews, { heading: 3, empty: '아직 공개한 취미 감상문이 없습니다.' })}
<p><a href="/reviews/">감상문 목록 보기</a></p>
</section>` }));
  output.set('/projects/', document({ title: '프로젝트', route: '/projects/', content: `
<h1>프로젝트</h1>
<p>프로젝트별 문제와 접근, 결과를 정리합니다.</p>
${entries(projects, { empty: '아직 공개한 프로젝트가 없습니다.' })}` }));
  output.set('/study/', document({ title: '기술 공부', route: '/study/', content: `
<h1>기술 공부</h1>
<p>기술 개념과 학습·실험 과정을 정리합니다.</p>
${entries(study, { empty: '아직 공개한 기술 공부 글이 없습니다.' })}` }));
  output.set('/reviews/', document({ title: '취미 감상문', route: '/reviews/', content: `
<h1>취미 감상문</h1>
<p>취미로 접한 작품과 활동의 감상을 남깁니다.</p>
${entries(reviews, { empty: '아직 공개한 취미 감상문이 없습니다.' })}` }));
  output.set('/about/', document({ title: '소개', route: '/about/', content: '<h1>소개</h1>\n<p>소개를 준비하고 있습니다.</p>' }));
  for (const page of pages) output.set(page.route, article(page, pages, renderBody));
  output.set('/404.html', document({ title: '페이지를 찾을 수 없습니다', route: '/404.html', content: '<h1>페이지를 찾을 수 없습니다</h1>\n<p>주소를 확인하거나 <a href="/">홈으로 이동</a>해 주세요.</p>' }));
  return output;
}
