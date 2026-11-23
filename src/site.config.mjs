export const site = Object.freeze({
  title: '포트폴리오',
  description: '프로젝트, 기술 공부와 취미 감상문을 모으는 공간입니다.',
  featuredLimit: 3,
  recentStudyLimit: 5,
  recentReviewsLimit: 5,
  navigation: [
    { label: '홈', href: '/' },
    { label: '기술', href: '/tech/', activePrefixes: ['/projects/', '/study/'] },
    { label: '취미', href: '/hobby/', activePrefixes: ['/reviews/'] },
    { label: '소개', href: '/about/' },
  ],
});
