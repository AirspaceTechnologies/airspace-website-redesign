const navBar = document.querySelector('.nav-bar');

if (navBar) {
  const menuToggle = navBar.querySelector('.nav-menu-toggle');
  const nav = navBar.querySelector('.main-nav');
  const panelItems = Array.from(navBar.querySelectorAll('.nav-item.has-panel'));
  const panelLinks = Array.from(navBar.querySelectorAll('.nav-link--has-panel'));
  const navLinks = Array.from(navBar.querySelectorAll('.nav-link[data-section]'));
  const sections = Array.from(document.querySelectorAll('[data-nav-section]'));
  const sectionRatios = new Map();
  const mobileQuery = window.matchMedia('(max-width: 960px)');

  const closePanels = () => {
    panelItems.forEach((item) => {
      item.dataset.open = 'false';
      const link = item.querySelector('.nav-link--has-panel');
      if (link) {
        link.setAttribute('aria-expanded', 'false');
      }
      const panel = item.querySelector('.nav-panel');
      if (panel) {
        panel.setAttribute('aria-hidden', 'true');
      }
    });
  };

  const setNavOpen = (open) => {
    navBar.dataset.open = open ? 'true' : 'false';
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (nav) {
      const shouldHide = mobileQuery.matches ? !open : false;
      nav.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
    }
    if (!open) {
      closePanels();
    }
  };

  setNavOpen(false);

  if (menuToggle) {
    menuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = navBar.dataset.open === 'true';
      setNavOpen(!isOpen);
    });
  }

  panelLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!mobileQuery.matches) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const item = link.closest('.nav-item');
      const wasOpen = item?.dataset.open === 'true';
      if (wasOpen) {
        setNavOpen(false);
        window.location.href = link.getAttribute('href');
        return;
      }
      closePanels();
      if (item) {
        item.dataset.open = 'true';
        link.setAttribute('aria-expanded', 'true');
        const panel = item.querySelector('.nav-panel');
        if (panel) {
          panel.setAttribute('aria-hidden', 'false');
        }
      }
    });
  });

  if (nav) {
    nav.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) {
        return;
      }
      if (navBar.dataset.open === 'true' && mobileQuery.matches) {
        setNavOpen(false);
      }
    });
  }

  document.addEventListener('click', (event) => {
    if (!navBar.contains(event.target)) {
      setNavOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setNavOpen(false);
    }
  });

  const handleScroll = () => {
    navBar.classList.toggle('is-scrolled', window.scrollY > 6);
  };

  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });

  const setActive = (activeId) => {
    if (!activeId) {
      return;
    }
    navLinks.forEach((link) => {
      const ids = link.dataset.section ? link.dataset.section.split(' ') : [];
      const isActive = ids.includes(activeId);
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  if (sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          sectionRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        let bestId = null;
        let bestRatio = 0;
        sectionRatios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });
        if (bestId) {
          setActive(bestId);
        }
      },
      {
        rootMargin: '-35% 0px -55% 0px',
        threshold: [0, 0.2, 0.4, 0.6],
      }
    );

    sections.forEach((section) => {
      if (section.id) {
        observer.observe(section);
        if (!sectionRatios.has(section.id)) {
          sectionRatios.set(section.id, 0);
        }
      }
    });
  }

  mobileQuery.addEventListener('change', () => {
    setNavOpen(false);
  });
}
