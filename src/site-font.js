const status = document.querySelector('[data-font-status]');
document.documentElement.dataset.previewFont = 'noto-sans-kr';

try {
  const faces = await Promise.all([400, 700].map(weight => document.fonts.load(`${weight} 16px "Noto Sans KR Preview"`, '한글 ABC 123')));
  if (faces.some(group => !group.length || group.some(face => face.status !== 'loaded'))) throw new Error('글꼴 로드 실패');
  document.documentElement.dataset.fontState = 'loaded';
  if (status) status.textContent = 'Noto Sans KR 적용됨';
} catch {
  document.documentElement.dataset.fontState = 'error';
  if (status) status.textContent = 'Noto Sans KR 로드 실패. 기본 글꼴로 표시합니다.';
}
