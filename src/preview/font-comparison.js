const choices = [...document.querySelectorAll('[data-font-option]')];
const status = document.querySelector('[data-font-status]');
const fonts = {
  pretendard: { name: 'Pretendard', family: 'Pretendard Preview' },
  'noto-sans-kr': { name: 'Noto Sans KR', family: 'Noto Sans KR Preview' },
};
let selection = 0;

async function selectFont(key) {
  if (!Object.hasOwn(fonts, key)) return;
  const current = ++selection;
  const { name, family } = fonts[key];
  document.documentElement.dataset.previewFont = key;
  choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.fontOption === key)));
  const url = new URL(window.location.href);
  url.searchParams.set('font', key);
  window.history.replaceState(null, '', url);
  // 탭 앵커는 그대로 두고 미리보기의 페이지 이동 링크에만 선택을 전달한다.
  for (const link of document.querySelectorAll('a[href]')) {
    if (link.getAttribute('href').startsWith('#')) continue;
    const destination = new URL(link.href);
    if (destination.origin === url.origin && destination.pathname.startsWith('/preview/devblog/')) {
      destination.searchParams.set('font', key);
      link.setAttribute('href', destination.pathname + destination.search + destination.hash);
    }
  }
  status.textContent = `${name} 불러오는 중…`;
  status.dataset.fontState = 'loading';
  try {
    const loaded = await Promise.all([400, 700].map(weight => document.fonts.load(`${weight} 16px "${family}"`, '한글 ABC 123')));
    if (loaded.some(faces => !faces.length || faces.some(face => face.status !== 'loaded'))) throw new Error('글꼴을 확인할 수 없습니다.');
    if (selection !== current) return;
    status.textContent = `${name} 적용됨`;
    status.dataset.fontState = 'loaded';
  } catch {
    if (selection !== current) return;
    status.textContent = `${name} 로드 실패. 새로고침해 주세요.`;
    status.dataset.fontState = 'error';
  }
}

if (choices.length && status) {
  choices.forEach(button => button.addEventListener('click', () => selectFont(button.dataset.fontOption)));
  const key = new URL(window.location.href).searchParams.get('font');
  selectFont(Object.hasOwn(fonts, key) ? key : 'noto-sans-kr');
}
