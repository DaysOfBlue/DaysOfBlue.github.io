import { escapeHtml } from './markdown.mjs';
import { renderSite } from './site.mjs';
import { site } from './site.config.mjs';
import { sectionForType } from './categories.mjs';
import { defaultPreviewSettings } from './preview/settings.mjs';
import { renderPostBody } from './preview/post-settings.mjs';

const previewNavigation = [
  { key: 'home', href: '/', icon: '⌂' },
  { key: 'about', href: '/about/', icon: '○' },
  { key: 'projects', href: '/projects/', icon: '▱', activePrefixes: ['/projects/'] },
  { key: 'tech', href: '/tech/', icon: '⌘', activePrefixes: ['/tech/', '/study/'] },
  { key: 'hobby', href: '/hobby/', icon: '▤', activePrefixes: ['/hobby/', '/reviews/'] },
];
const categoryRoute = (section, id) => `/${section}/categories/${id}/`;
const format = (template, values) => template.replace(/\{([a-z]+)\}/g, (match, key) => values[key] ?? match);

function siteLinks(html, base) {
  return html.replace(/href="(\/(?!\/)[^"]*)"/g, (_, route) => `href="${route.startsWith(base + '/') ? route : base + route}"`);
}

function mainContent(html, base) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);
  if (!main) throw new Error('기본 페이지의 본문을 찾을 수 없습니다.');
  return siteLinks(main[1], base);
}

function createView(settings, base, preview) {
  const href = route => base + route;
  const asset = name => href(`/assets/${name}`);
  const sectionLabels = Object.fromEntries(Object.entries(settings.sections).map(([key, value]) => [key, value.title]));
  const labels = { project: settings.sections.projects.title, study: settings.labels.study, review: settings.labels.review };

  function document({ title, route, content, tabs = false, article = false }) {
    const navigation = previewNavigation.map(item => {
      const active = route === item.href || (item.activePrefixes ?? []).some(prefix => route.startsWith(prefix));
      return `<li class="nav-item"><a class="nav-link${active ? ' active' : ''}" href="${href(item.href)}"${active ? ' aria-current="page"' : ''}><span class="menu-icon me-2" aria-hidden="true">${item.icon}</span>${escapeHtml(settings.navigation[item.key])}</a></li>`;
    }).join('\n');
    return `<!doctype html>
  <html lang="ko" data-preview-font="noto-sans-kr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${preview ? '<meta name="robots" content="noindex, nofollow">' : ''}
    <meta name="description" content="${escapeHtml(settings.description)}">
    <title>${escapeHtml(preview ? `${title} · ${settings.sidebar.previewLabel}` : title === settings.title ? title : `${title} | ${settings.title}`)}</title>
    <link rel="stylesheet" href="${asset('theme-8.css')}">
    <link rel="stylesheet" href="${asset(preview ? 'preview.css' : 'site.css')}">
    <link rel="stylesheet" href="${asset('fonts.css')}">
  </head>
  <body class="devblog-site${preview ? ' devblog-preview' : ''}">
    <a class="skip-link" href="#main">${escapeHtml(settings.accessibility.skip)}</a>
    <header class="header text-center">
      <p class="blog-name pt-lg-4 mb-0"><a class="no-text-decoration" href="${href('/')}">${escapeHtml(settings.title)}</a></p>
      <nav class="navbar navbar-expand-lg navbar-dark" aria-label="${escapeHtml(settings.accessibility.navigation)}">
        <button class="navbar-toggler" type="button" data-menu-toggle data-menu-open-label="${escapeHtml(settings.accessibility.menuOpen)}" data-menu-close-label="${escapeHtml(settings.accessibility.menuClose)}" aria-controls="navigation" aria-expanded="true" aria-label="${escapeHtml(settings.accessibility.menuClose)}" hidden><span class="navbar-toggler-icon" aria-hidden="true"></span></button>
        <div id="navigation" class="navbar-collapse flex-column">
          <div class="profile-section pt-3 pt-lg-0">
            <img class="profile-image mb-3 rounded-circle mx-auto" src="${asset('profile.svg')}" width="112" height="112" alt="${escapeHtml(settings.sidebar.profileAlt)}">
            <div class="bio mb-3">${escapeHtml(settings.sidebar.bio)}<br><a href="${href('/about/')}">${escapeHtml(settings.sidebar.aboutLink)}</a></div>
            <hr>
          </div>
          <ul class="navbar-nav flex-column text-start">${navigation}</ul>
          ${preview ? `<p class="preview-label mt-4 mb-0">${escapeHtml(settings.sidebar.previewLabel)}</p>` : ''}
        </div>
      </nav>
    </header>
    <div class="main-wrapper preview-wrapper">
      ${preview ? `<aside class="font-comparison" aria-label="테스트 페이지 글꼴 비교">
        <span class="font-comparison-title">글꼴 비교</span>
        <div class="font-options" role="group" aria-label="글꼴 선택">
          <button type="button" data-font-option="pretendard" aria-pressed="false">Pretendard</button>
          <button type="button" data-font-option="noto-sans-kr" aria-pressed="true">Noto Sans KR</button>
        </div>
        <span class="font-state" data-font-status role="status" aria-live="polite">글꼴을 불러오는 중…</span>
        <noscript>글꼴 전환에는 JavaScript가 필요합니다.</noscript>
      </aside>` : ''}
      <main id="main" tabindex="-1">
  ${tabs ? content : `<section class="${article ? 'blog-post article-view' : 'blog-list'} px-3 py-4 p-md-4"><div class="container single-col-max-width">${content}</div></section>`}
      </main>
      <footer class="footer text-center py-2 theme-bg-dark"><small>DevBlog design by <a href="https://themes.3rdwavemedia.com/">Xiaoying Riley</a></small></footer>
    </div>
  ${tabs ? `  <script type="module" src="${asset('home-tabs.js')}"></script>` : ''}
    <script type="module" src="${asset('navigation.js')}"></script>
    <script type="module" src="${asset(preview ? 'font-comparison.js' : 'site-font.js')}"></script>
  </body>
  </html>
  `;
  }

  function rows(pages, { empty, heading = 3 } = {}) {
    if (!pages.length) return `<div class="empty-state"><p>${escapeHtml(empty)}</p></div>`;
    return `<ul class="post-list">${pages.map(page => `<li class="item post-row">
    <article class="row g-3">
      <div class="col-auto"><img class="img-fluid post-thumb" src="${asset(`${page.meta.type}.svg`)}" width="96" height="72" alt="" loading="lazy"></div>
      <div class="col post-copy">
        <h${heading} class="title mb-1"><a class="text-link" href="${href(page.route)}">${escapeHtml(page.meta.title)}</a></h${heading}>
        <div class="meta mb-1"><span>${escapeHtml(labels[page.meta.type])}</span><span class="post-category"><a href="${href(categoryRoute(sectionForType(page.meta.type), page.meta.category ?? 'uncategorized'))}">${escapeHtml(page.categoryLabel)}</a></span><span class="date"><time datetime="${page.meta.created}">${page.meta.created.replaceAll('-', '.')}</time></span></div>
        ${page.meta.summary ? `<div class="intro post-summary">${escapeHtml(page.meta.summary)}</div>` : ''}
        <a class="text-link more-link" href="${href(page.route)}">${escapeHtml(settings.labels.readMore)} <span aria-hidden="true">→</span></a>
      </div>
    </article>
  </li>`).join('\n')}</ul>`;
  }

  function section(title, pages, route, empty, heading = 2) {
    return `<section class="listing-section"><div class="section-heading"><h${heading}>${escapeHtml(title)}</h${heading}><a class="quiet-link" href="${href(route)}">${escapeHtml(settings.labels.viewAll)} <span aria-hidden="true">↗</span></a></div>${rows(pages, { empty, heading: heading + 1 })}</section>`;
  }

  function categoryChoices(section, pages, categories) {
    const counts = new Map();
    for (const page of pages) {
      const id = page.meta.category ?? 'uncategorized';
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return [
      { id: 'all', label: settings.labels.all, count: pages.length },
      ...categories[section].map(category => ({ ...category, count: counts.get(category.id) ?? 0 })),
      ...(counts.has('uncategorized') ? [{ id: 'uncategorized', label: settings.labels.uncategorized, count: counts.get('uncategorized') }] : []),
    ];
  }

  function categoryNavigation(section, choices, selected = 'all') {
    return `<nav class="category-nav" aria-label="${escapeHtml(format(settings.accessibility.categoryNavigation, { section: sectionLabels[section] }))}">${choices.map(category => `<a class="category-link${category.id === selected ? ' is-current' : ''}" href="${href(category.id === 'all' ? `/${section}/` : categoryRoute(section, category.id))}"${category.id === selected ? ' aria-current="true"' : ''}>${escapeHtml(category.label)} <span class="category-count">(${category.count})</span></a>`).join('\n')}</nav>`;
  }

  function emptyCv() {
    const cv = settings.cv;
    return `<article class="cv-layout" aria-label="${escapeHtml(settings.accessibility.cv)}">
    <header class="cv-header"><p class="eyebrow">${escapeHtml(cv.eyebrow)}</p><h1>${escapeHtml(cv.title)}</h1><p>${escapeHtml(cv.description)}</p></header>
    <section class="cv-identity" aria-labelledby="cv-profile-heading"><h2 id="cv-profile-heading">${escapeHtml(cv.profileTitle)}</h2><p class="cv-placeholder">${escapeHtml(cv.profilePlaceholder)}</p><p>${escapeHtml(cv.profileDescription)}</p></section>
    ${cv.sections.map(({title, english, placeholder, description, period}, index) => `<section class="cv-section" aria-labelledby="cv-section-${index}"><div class="cv-section-label"><h2 id="cv-section-${index}">${escapeHtml(title)}</h2><p>${escapeHtml(english)}</p></div><div class="cv-entry">${period ? `<p class="cv-period">${escapeHtml(period)}</p>` : ''}<h3>${escapeHtml(placeholder)}</h3><p>${escapeHtml(description)}</p></div></section>`).join('\n')}
    <p class="cv-note">${escapeHtml(cv.note)}</p>
    </article>`;
  }

  return { document, rows, section, categoryChoices, categoryNavigation, emptyCv, sectionLabels, href };
}

export function renderDevBlogSite(pages, categories = { projects: [], tech: [], hobby: [] }, settings = defaultPreviewSettings, postSettings = new Map(), examples = [], { base = '', preview = false } = {}) {
  const { document, rows, section, categoryChoices, categoryNavigation, emptyCv, sectionLabels, href } = createView(settings, base, preview);
  pages = pages.map(page => {
    const section = sectionForType(page.meta.type);
    return { ...page, categoryLabel: section ? categories[section].find(category => category.id === page.meta.category)?.label ?? settings.labels.uncategorized : null };
  });
  // 기본 렌더러의 공개 경계와 Markdown 처리 결과를 재사용한다.
  const original = renderSite([...pages, ...examples], { renderBody: (page, all) => renderPostBody(page, all, postSettings.get(page.meta.id) ?? { version: 1, media: [], references: [] }, settings.labels.references, base) });
  const newest = (a, b) => b.meta.created.localeCompare(a.meta.created) || a.route.localeCompare(b.route);
  const projects = pages.filter(page => page.meta.type === 'project').sort(newest);
  const study = pages.filter(page => page.meta.type === 'study').sort(newest);
  const reviews = pages.filter(page => page.meta.type === 'review').sort(newest);
  const choices = {
    projects: categoryChoices('projects', projects, categories),
    tech: categoryChoices('tech', study, categories),
    hobby: categoryChoices('hobby', reviews, categories),
  };
  const profile = pages.find(page => page.meta.type === 'profile');
  const intro = `<h1 class="heading">${escapeHtml(settings.labels.introduction)}</h1><p>${escapeHtml(profile ? profile.meta.summary || settings.labels.profileDetails : settings.labels.profilePending)}</p><p><a href="${href('/about/')}">${escapeHtml(settings.labels.aboutMore)}</a></p>`;
  const home = `<section class="cta-section theme-bg-light py-4"><div class="container text-center single-col-max-width"><section class="home-introduction" aria-label="${escapeHtml(settings.labels.introduction)}">${intro}</section>
</div></section>
<section class="blog-list px-3 py-4 p-md-4"><div class="container single-col-max-width"><div class="feed-heading"><div data-home-tabs aria-label="${escapeHtml(format(settings.accessibility.homeTabs, sectionLabels))}"><a id="home-projects-tab" href="#home-projects">${escapeHtml(sectionLabels.projects)}</a><a id="home-tech-tab" href="#home-tech">${escapeHtml(sectionLabels.tech)}</a><a id="home-hobby-tab" href="#home-hobby">${escapeHtml(sectionLabels.hobby)}</a></div><span class="recent-label">${escapeHtml(settings.labels.recent)}</span></div>
<section id="home-projects" data-home-panel aria-labelledby="home-projects-heading"><h2 id="home-projects-heading" class="visually-hidden">${escapeHtml(sectionLabels.projects)}</h2>${categoryNavigation('projects', choices.projects)}${section(sectionLabels.projects, projects.slice(0, site.recentStudyLimit), '/projects/', settings.sections.projects.empty, 3)}</section>
<section id="home-tech" data-home-panel aria-labelledby="home-tech-heading"><h2 id="home-tech-heading" class="visually-hidden">${escapeHtml(sectionLabels.tech)}</h2>
${categoryNavigation('tech', choices.tech)}
${section(settings.labels.study, study.slice(0, site.recentStudyLimit), '/study/', settings.sections.tech.empty, 3)}
</section>
<section id="home-hobby" data-home-panel aria-labelledby="home-hobby-heading"><h2 id="home-hobby-heading" class="visually-hidden">${escapeHtml(sectionLabels.hobby)}</h2>${categoryNavigation('hobby', choices.hobby)}${section(settings.labels.review, reviews.slice(0, site.recentReviewsLimit), '/reviews/', settings.sections.hobby.empty, 3)}</section></div></section>`;
  const output = new Map();
  const put = (route, title, content, options = {}) => output.set(href(route), document({ route, title, content, ...options }));
  put('/', settings.title, home, { tabs: true });
  for (const [sectionId, items] of [
    ['projects', projects],
    ['tech', study],
    ['hobby', reviews],
  ]) {
    for (const choice of choices[sectionId]) {
      const route = choice.id === 'all' ? `/${sectionId}/` : categoryRoute(sectionId, choice.id);
      const selected = choice.id === 'all' ? items : items.filter(page => (page.meta.category ?? 'uncategorized') === choice.id);
      const title = sectionLabels[sectionId];
      put(route, choice.id === 'all' ? title : `${title} · ${choice.label}`, `<header class="page-heading"><p class="eyebrow">${sectionId.toUpperCase()}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(settings.sections[sectionId].description)}</p></header>${categoryNavigation(sectionId, choices[sectionId], choice.id)}<section class="category-list" aria-label="${escapeHtml(format(settings.accessibility.categoryList, { category: choice.label }))}"><div class="section-heading"><h2>${escapeHtml(choice.id === 'all' ? settings.labels.allPosts : choice.label)}</h2><span class="list-count">${escapeHtml(format(settings.labels.publicCount, { count: selected.length }))}</span></div>${rows(selected, { empty: choice.id === 'all' ? settings.sections[sectionId].empty : settings.labels.categoryEmpty, heading: 3 })}</section>`);
    }
  }
  for (const [route, title, items, empty] of [
    ['/study/', settings.labels.study, study, settings.sections.tech.empty],
    ['/reviews/', settings.labels.review, reviews, settings.sections.hobby.empty],
  ]) put(route, title, `<header class="page-heading"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(format(settings.labels.publicCount, { count: items.length }))}</p></header>${categoryNavigation(route === '/study/' ? 'tech' : 'hobby', route === '/study/' ? choices.tech : choices.hobby)}${rows(items, { empty, heading: 2 })}`);
  put('/about/', settings.navigation.about, profile ? mainContent(original.get('/about/'), base) : emptyCv(), { article: true });
  for (const page of [...pages, ...examples]) {
    const sectionId = sectionForType(page.meta.type);
    const categoryLink = page.example ? `<p class="article-category"><a href="${href('/')}">${escapeHtml(settings.labels.backHome)}</a></p>` : sectionId ? `<p class="article-category"><a href="${href(categoryRoute(sectionId, page.meta.category ?? 'uncategorized'))}">${escapeHtml(sectionLabels[sectionId])} / ${escapeHtml(page.categoryLabel)}</a></p>` : '';
    put(page.route, page.meta.title, categoryLink + mainContent(original.get(page.route), base), { article: true });
  }
  output.set('/404.html', document({ title: settings.labels.notFound, route: '/404.html', content: `<h1>${escapeHtml(settings.labels.notFound)}</h1><p><a href="${href('/')}">${escapeHtml(settings.labels.backHome)}</a></p>` }));
  return output;
}
