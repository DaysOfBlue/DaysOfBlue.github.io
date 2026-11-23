const container = document.querySelector('[data-home-tabs]');

if (container) {
  const tabs = [...container.querySelectorAll('a[href^="#"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('href').slice(1)));

  if (tabs.length && panels.every(Boolean)) {
    container.setAttribute('role', 'tablist');
    container.setAttribute('aria-orientation', 'horizontal');
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panels[index].id);
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].setAttribute('aria-labelledby', tab.id);
      panels[index].tabIndex = 0;
    });

    const select = (index, { focus = false, updateHash = false } = {}) => {
      tabs.forEach((tab, position) => {
        const active = position === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[position].hidden = !active;
      });
      if (focus) tabs[index].focus();
      if (updateHash) window.history.replaceState(null, '', `#${panels[index].id}`);
    };

    const indexFromHash = () => {
      let target;
      try { target = document.getElementById(decodeURIComponent(window.location.hash.slice(1))); }
      catch { return -1; }
      return panels.findIndex(panel => target && (panel === target || panel.contains(target)));
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        select(index, { updateHash: true });
      });
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else if (event.key === ' ' || event.key === 'Enter') next = index;
        else return;
        event.preventDefault();
        select(next, { focus: true, updateHash: true });
      });
    });

    window.addEventListener('hashchange', () => {
      const index = indexFromHash();
      if (index !== -1) select(index);
    });
    const initial = indexFromHash();
    select(initial === -1 ? 0 : initial);
  }
}
