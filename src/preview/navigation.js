const toggle = document.querySelector('[data-menu-toggle]');
const navigation = document.getElementById('navigation');

if (toggle && navigation) {
  const desktop = window.matchMedia('(min-width: 992px)');
  const setOpen = open => {
    navigation.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? toggle.dataset.menuCloseLabel ?? '메뉴 닫기' : toggle.dataset.menuOpenLabel ?? '메뉴 열기');
  };
  const resize = () => {
    toggle.hidden = desktop.matches;
    setOpen(desktop.matches);
  };
  toggle.addEventListener('click', () => setOpen(navigation.hidden));
  navigation.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !desktop.matches) {
      setOpen(false);
      toggle.focus();
    }
  });
  desktop.addEventListener('change', resize);
  resize();
}
