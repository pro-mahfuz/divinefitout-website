const navToggle = document.querySelector("[data-nav-toggle]");
const mainNav = document.querySelector("[data-main-nav]");
const heroSlider = document.querySelector("[data-hero-slider]");
const siteHeader = document.querySelector(".site-header");
const mobileNavQuery = window.matchMedia("(max-width: 1040px)");
const normalizePath = (pathname) => {
  const normalized = pathname.replace(/\\/g, "/").replace(/\/index\.html$/, "").replace(/\/$/, "");
  return normalized === "" ? "/" : normalized;
};
const safeQuerySelector = (selector, root = document) => {
  try {
    return root.querySelector(selector);
  } catch {
    return null;
  }
};
const getDirectChildByClass = (parent, className) => Array.from(parent.children).find((child) => child.classList?.contains(className));
const getDirectAnchor = (parent) => Array.from(parent.children).find((child) => child.tagName === "A");
const addMediaQueryChangeListener = (mediaQuery, handler) => {
  if (!mediaQuery || typeof handler !== "function") return;

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handler);
    return;
  }

  if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(handler);
  }
};
const queueFrame = (callback) => {
  if (typeof window.requestAnimationFrame === "function") {
    return window.requestAnimationFrame(callback);
  }

  return window.setTimeout(callback, 16);
};
const scheduleIdle = (callback, timeout = 1200) => {
  if (typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(callback, { timeout });
  }

  return window.setTimeout(callback, 180);
};
const scheduleAfterLoad = (callback, timeout = 1200) => {
  if (document.readyState === "complete") {
    return scheduleIdle(callback, timeout);
  }

  const runAfterLoad = () => {
    scheduleIdle(callback, timeout);
  };

  window.addEventListener("load", runAfterLoad, { once: true });
  return null;
};
const isSelectField = (field) => Boolean(field && typeof field.tagName === "string" && field.tagName.toUpperCase() === "SELECT" && field.options);
const setCurrentState = (element, value) => {
  if (!element) return;
  if (value) {
    element.setAttribute("aria-current", value);
    return;
  }
  element.removeAttribute("aria-current");
};

if (mainNav && !mainNav.id) {
  mainNav.id = "site-navigation";
}

if (navToggle && mainNav) {
  navToggle.setAttribute("aria-controls", mainNav.id);
}

if (heroSlider) {
  let heroSliderInitialized = false;
  let heroSliderInitScheduled = false;
  const heroSliderInitViewport = window.matchMedia("(min-width: 821px)");
  const initHeroSlider = () => {
    if (heroSliderInitialized) return;
    heroSliderInitialized = true;
    heroSlider.classList.add("is-enhanced");

    const heroSlides = Array.from(heroSlider.querySelectorAll("[data-hero-slide]"));
    const heroDots = Array.from(heroSlider.querySelectorAll("[data-hero-dot]"));
    const heroDotList = heroSlider.querySelector(".hero-slider-dots");
    const heroPrev = heroSlider.querySelector("[data-hero-prev]");
    const heroNext = heroSlider.querySelector("[data-hero-next]");
    const heroNote = heroSlider.querySelector("[data-hero-note]");
    const heroNoteTitle = heroNote?.querySelector("[data-hero-note-title]");
    const heroNoteCopy = heroNote?.querySelector("[data-hero-note-copy]");
    const heroNoteLink = heroNote?.querySelector("[data-hero-note-link]");
    const heroSlideFocusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const heroAutoplayViewport = window.matchMedia("(min-width: 821px)");
    let activeHeroIndex = heroSlides.findIndex((slide) => slide.classList.contains("is-active"));
    let heroAutoplay = null;

    if (activeHeroIndex < 0) {
      activeHeroIndex = 0;
    }

    if (heroDotList) {
      heroDotList.setAttribute("role", "tablist");
      heroDotList.setAttribute("aria-label", heroDotList.getAttribute("aria-label") || "Choose a featured service banner");
    }

    heroSlides.forEach((slide, slideIndex) => {
      if (!slide.id) {
        slide.id = `hero-slide-${slideIndex + 1}`;
      }
      slide.setAttribute("role", "tabpanel");
    });

    heroDots.forEach((dot, dotIndex) => {
      if (!dot.id) {
        dot.id = `hero-slide-tab-${dotIndex + 1}`;
      }
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-controls", heroSlides[dotIndex]?.id || "");
      heroSlides[dotIndex]?.setAttribute("aria-labelledby", dot.id);
    });

    const syncHeroSlideInteractivity = (slide, isActive) => {
      if (!slide) return;

      slide.toggleAttribute("inert", !isActive);
      if ("inert" in slide) {
        slide.inert = !isActive;
      }

      Array.from(slide.querySelectorAll(heroSlideFocusableSelector)).forEach((control) => {
        if (isActive) {
          const originalTabIndex = control.dataset.heroSlideTabindex;
          if (originalTabIndex === "__none__") {
            control.removeAttribute("tabindex");
          } else if (originalTabIndex) {
            control.setAttribute("tabindex", originalTabIndex);
          }
          delete control.dataset.heroSlideTabindex;
          return;
        }

        if (!("heroSlideTabindex" in control.dataset)) {
          control.dataset.heroSlideTabindex = control.hasAttribute("tabindex") ? control.getAttribute("tabindex") : "__none__";
        }
        control.setAttribute("tabindex", "-1");
      });
    };

    const syncHeroNote = (slide) => {
      if (!slide || !heroNoteTitle || !heroNoteCopy || !heroNoteLink) return;

      heroNoteTitle.textContent = slide.dataset.heroTitle || "";
      heroNoteCopy.textContent = slide.dataset.heroCopy || "";
      heroNoteLink.href = slide.dataset.heroHref || "#";
      heroNoteLink.textContent = slide.dataset.heroCta || "View service";
    };

    const setHeroSlide = (index) => {
      if (!heroSlides.length) return;

      activeHeroIndex = (index + heroSlides.length) % heroSlides.length;
      const activeSlide = heroSlides[activeHeroIndex];

      heroSlides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeHeroIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
        syncHeroSlideInteractivity(slide, isActive);
      });

      heroDots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeHeroIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", String(isActive));
        dot.removeAttribute("aria-pressed");
        dot.tabIndex = isActive ? 0 : -1;
      });

      syncHeroNote(activeSlide);
    };

    const focusHeroDot = (index) => {
      const nextDot = heroDots[(index + heroDots.length) % heroDots.length];
      nextDot?.focus();
    };

    const stopHeroAutoplay = () => {
      if (!heroAutoplay) return;
      window.clearInterval(heroAutoplay);
      heroAutoplay = null;
    };

    const canAutoplayHero = () => !reduceMotion.matches && heroAutoplayViewport.matches && heroSlides.length >= 2;

    const startHeroAutoplay = () => {
      if (!canAutoplayHero()) return;
      stopHeroAutoplay();
      heroAutoplay = window.setInterval(() => {
        setHeroSlide(activeHeroIndex + 1);
      }, 5200);
    };

    heroPrev?.addEventListener("click", () => {
      setHeroSlide(activeHeroIndex - 1);
      startHeroAutoplay();
    });

    heroNext?.addEventListener("click", () => {
      setHeroSlide(activeHeroIndex + 1);
      startHeroAutoplay();
    });

    heroDots.forEach((dot, dotIndex) => {
      dot.addEventListener("click", () => {
        setHeroSlide(dotIndex);
        startHeroAutoplay();
      });

      dot.addEventListener("keydown", (event) => {
        if (!heroDots.length) return;

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          const nextIndex = (dotIndex + 1) % heroDots.length;
          setHeroSlide(nextIndex);
          focusHeroDot(nextIndex);
          startHeroAutoplay();
        }

        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          const nextIndex = (dotIndex - 1 + heroDots.length) % heroDots.length;
          setHeroSlide(nextIndex);
          focusHeroDot(nextIndex);
          startHeroAutoplay();
        }

        if (event.key === "Home") {
          event.preventDefault();
          setHeroSlide(0);
          focusHeroDot(0);
          startHeroAutoplay();
        }

        if (event.key === "End") {
          event.preventDefault();
          const nextIndex = heroDots.length - 1;
          setHeroSlide(nextIndex);
          focusHeroDot(nextIndex);
          startHeroAutoplay();
        }
      });
    });

    heroSlider.addEventListener("mouseenter", stopHeroAutoplay);
    heroSlider.addEventListener("mouseleave", startHeroAutoplay);
    heroSlider.addEventListener("focusin", stopHeroAutoplay);
    heroSlider.addEventListener("focusout", startHeroAutoplay);

    const syncHeroAutoplayState = () => {
      if (!canAutoplayHero()) {
        stopHeroAutoplay();
        return;
      }
      startHeroAutoplay();
    };

    addMediaQueryChangeListener(reduceMotion, syncHeroAutoplayState);
    addMediaQueryChangeListener(heroAutoplayViewport, syncHeroAutoplayState);

    setHeroSlide(activeHeroIndex);
    syncHeroAutoplayState();
  };

  const requestHeroSliderInit = () => {
    if (heroSliderInitialized || heroSliderInitScheduled) return;
    heroSliderInitScheduled = true;
    queueFrame(initHeroSlider);
  };

  heroSlider.addEventListener("pointerenter", requestHeroSliderInit, { once: true });
  heroSlider.addEventListener("focusin", requestHeroSliderInit, { once: true });
  heroSlider.addEventListener("pointerdown", requestHeroSliderInit, { once: true });
  heroSlider.addEventListener("click", requestHeroSliderInit, { once: true });
  heroSlider.addEventListener("keydown", requestHeroSliderInit, { once: true });

  if (heroSliderInitViewport.matches) {
    scheduleAfterLoad(requestHeroSliderInit, 1800);
  }
}

const currentPath = normalizePath(window.location.pathname);
const servicesSubmenuItems = [
  { href: "/services/wooden-flooring-dubai.html", label: "Wooden Flooring", woodRoot: true },
  { href: "/services/spc-flooring-dubai.html", label: "SPC Flooring", compact: true },
  { href: "/services/lvt-flooring-dubai.html", label: "LVT Flooring", compact: true },
  { href: "/services/wpc-flooring-dubai.html", label: "WPC Flooring", compact: true },
  { href: "/services/carpet-installation-dubai.html", label: "Carpet Installation" },
  { href: "/services/tile-fixing-dubai.html", label: "Tile Fixing" },
  { href: "/services/stone-installation-dubai.html", label: "Stone Installation" },
  { href: "/services/marble-installation-dubai.html", label: "Marble Installation" }
];
const servicesSubmenuMarkup = servicesSubmenuItems.map(({ href, label, compact, woodRoot }) => {
  const className = compact ? ' class="submenu-link--compact"' : "";
  const woodRootAttr = woodRoot ? " data-wood-root" : "";
  return `<a${className} data-nav-link${woodRootAttr} href="${href}">${label}</a>`;
}).join("");
const populateServicesSubmenu = (submenu) => {
  if (!submenu || submenu.children.length || !submenu.hasAttribute("data-services-submenu")) return;
  submenu.innerHTML = servicesSubmenuMarkup;
};
const navLinks = document.querySelectorAll("[data-nav-link]");
const servicesRootLinks = document.querySelectorAll("[data-services-root]");
const woodRootLinks = document.querySelectorAll("[data-wood-root]");
const sectionLinks = Array.from(document.querySelectorAll("[data-section-link]"));

const syncMainNavA11yState = () => {
  if (!mainNav) return;

  const isMobile = mobileNavQuery.matches;
  const isOpen = mainNav.classList.contains("is-open");

  if (isMobile && !isOpen) {
    mainNav.setAttribute("hidden", "");
    mainNav.setAttribute("aria-hidden", "true");
    return;
  }

  mainNav.removeAttribute("hidden");
  mainNav.removeAttribute("aria-hidden");
};

const updateNavToggleLabel = () => {
  if (!navToggle || !mainNav) return;
  const isOpen = mainNav.classList.contains("is-open") && mobileNavQuery.matches;
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
};

const applyMobileNavTop = (headerHeight) => {
  if (!mainNav || !siteHeader) return;

  if (!mobileNavQuery.matches) {
    document.documentElement.style.removeProperty("--mobile-nav-top");
    return;
  }

  const nextTop = Math.max(0, Math.round(headerHeight || 0));
  document.documentElement.style.setProperty("--mobile-nav-top", `${nextTop}px`);
};

let cachedSiteHeaderHeight = 0;
let siteHeaderMeasureQueued = false;
const setCachedSiteHeaderHeight = (headerHeight) => {
  const nextHeight = Math.max(0, Math.round(headerHeight || 0));
  if (nextHeight) {
    cachedSiteHeaderHeight = nextHeight;
  }
  return cachedSiteHeaderHeight;
};
const measureSiteHeaderHeight = () => {
  if (!siteHeader) return cachedSiteHeaderHeight;
  return setCachedSiteHeaderHeight(siteHeader.getBoundingClientRect().height || siteHeader.clientHeight);
};

let mobileNavGeometryQueued = false;
const syncMobileNavGeometry = () => {
  if (!mainNav || !siteHeader) return;

  if (!mobileNavQuery.matches) {
    document.documentElement.style.removeProperty("--mobile-nav-top");
    return;
  }

  if (mobileNavGeometryQueued) return;

  mobileNavGeometryQueued = true;
  queueFrame(() => {
    mobileNavGeometryQueued = false;
    applyMobileNavTop(cachedSiteHeaderHeight);
  });
};
const queueSiteHeaderMeasurement = () => {
  if (!siteHeader || siteHeaderMeasureQueued) return;

  siteHeaderMeasureQueued = true;
  queueFrame(() => {
    siteHeaderMeasureQueued = false;
    measureSiteHeaderHeight();
    syncMobileNavGeometry();
  });
};

const mountRelatedServicesBeforeFaq = () => {
  const faqSection = document.querySelector("section.service-anchor#faq");
  const relatedCard = Array.from(document.querySelectorAll(".sticky-panel .contact-card")).find((card) => {
    const label = card.querySelector("strong");
    return label && label.textContent.trim().toLowerCase() === "related services";
  });

  if (!faqSection || !relatedCard) return;
  relatedCard.classList.add("related-services-source");

  let mobileRelatedSection = document.querySelector("[data-related-services-mobile]");
  if (!mobileRelatedSection) {
    mobileRelatedSection = document.createElement("section");
    mobileRelatedSection.className = "section section-tight related-services-mobile";
    mobileRelatedSection.dataset.relatedServicesMobile = "";

    const wrap = document.createElement("div");
    wrap.className = "section-wrap";
    mobileRelatedSection.append(wrap);
    faqSection.before(mobileRelatedSection);
  }

  if (!mobileRelatedSection.firstElementChild?.firstElementChild) {
    const clonedCard = relatedCard.cloneNode(true);
    clonedCard.classList.add("related-services-mobile-card");
    mobileRelatedSection.firstElementChild?.append(clonedCard);
  }
};

const syncBodyScrollLock = () => {
  document.body.classList.toggle("nav-open", Boolean(mainNav && mainNav.classList.contains("is-open") && mobileNavQuery.matches));
  syncMobileNavGeometry();
  syncMainNavA11yState();
  updateNavToggleLabel();
};

const closeMobileNav = (restoreFocus = false) => {
  if (!mainNav || !navToggle) return;
  const wasOpen = mainNav.classList.contains("is-open");
  mainNav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  syncBodyScrollLock();
  if (restoreFocus && wasOpen && mobileNavQuery.matches) {
    navToggle.focus();
  }
};

const expandableMenuItems = mainNav
  ? Array.from(mainNav.querySelectorAll(".has-submenu")).filter((item) => getDirectChildByClass(item, "submenu"))
  : [];
const desktopHoverMenus = mainNav
  ? Array.from(mainNav.querySelectorAll(".has-submenu")).filter((item) => getDirectChildByClass(item, "submenu"))
  : [];
const desktopHoverCloseTimers = new WeakMap();

const setSubmenuExpanded = (item, isExpanded) => {
  item.classList.toggle("is-expanded", isExpanded);
  const toggle = getDirectChildByClass(item, "submenu-toggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(isExpanded));
    const label = getDirectAnchor(item)?.textContent.trim() || "submenu";
    toggle.setAttribute("aria-label", `${isExpanded ? "Collapse" : "Expand"} ${label} menu`);
  }
};

const clearDesktopHoverTimer = (item) => {
  const existingTimer = desktopHoverCloseTimers.get(item);
  if (!existingTimer) return;
  window.clearTimeout(existingTimer);
  desktopHoverCloseTimers.delete(item);
};

const setDesktopHoverOpen = (item, isOpen) => {
  if (!item) return;

  clearDesktopHoverTimer(item);

  if (mobileNavQuery.matches) {
    item.classList.remove("is-hover-open");
    return;
  }

  if (isOpen) {
    item.classList.add("is-hover-open");
    return;
  }

  const closeTimer = window.setTimeout(() => {
    item.classList.remove("is-hover-open");
    desktopHoverCloseTimers.delete(item);
  }, 140);

  desktopHoverCloseTimers.set(item, closeTimer);
};

desktopHoverMenus.forEach((item) => {
  const link = getDirectAnchor(item);
  const submenu = getDirectChildByClass(item, "submenu");

  link?.addEventListener("mouseenter", () => {
    populateServicesSubmenu(submenu);
    setDesktopHoverOpen(item, true);
  });

  submenu?.addEventListener("mouseenter", () => {
    populateServicesSubmenu(submenu);
    setDesktopHoverOpen(item, true);
  });

  item.addEventListener("mouseleave", () => {
    setDesktopHoverOpen(item, false);
  });

  item.addEventListener("focusin", () => {
    populateServicesSubmenu(submenu);
    setDesktopHoverOpen(item, true);
  });

  item.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!item.contains(document.activeElement)) {
        setDesktopHoverOpen(item, false);
      }
    }, 0);
  });
});

expandableMenuItems.forEach((item, index) => {
  const link = getDirectAnchor(item);
  const submenu = getDirectChildByClass(item, "submenu");

  if (!link || !submenu) return;

  if (!submenu.id) {
    submenu.id = `nav-submenu-${index + 1}`;
  }

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "submenu-toggle";
  toggle.setAttribute("aria-controls", submenu.id);
  toggle.setAttribute("aria-expanded", "false");
  link.insertAdjacentElement("afterend", toggle);

  link.addEventListener("click", (event) => {
    if (!mobileNavQuery.matches) return;
    populateServicesSubmenu(submenu);
    if (!item.classList.contains("is-expanded")) {
      event.preventDefault();
      setSubmenuExpanded(item, true);
    }
  });

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    populateServicesSubmenu(submenu);
    setSubmenuExpanded(item, !item.classList.contains("is-expanded"));
  });
});

const applyMobileMenuState = (reset = false) => {
  if (!mainNav) return;

  if (!mobileNavQuery.matches) {
    closeMobileNav();
    expandableMenuItems.forEach((item) => setSubmenuExpanded(item, true));
    return;
  }

  expandableMenuItems.forEach((item) => {
    const initialized = item.dataset.mobileMenuReady === "true";
    const shouldExpand = currentPath.includes("/services");

    if (reset || !initialized) {
      setSubmenuExpanded(item, shouldExpand);
      item.dataset.mobileMenuReady = "true";
    }
  });

  syncBodyScrollLock();
};

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      applyMobileMenuState(true);
    }
    syncBodyScrollLock();
  });
}

navLinks.forEach((link) => {
  const target = link.getAttribute("href");
  if (!target) return;

  const normalizedTarget = normalizePath(new URL(target, window.location.href).pathname);
  if (normalizedTarget === currentPath) {
    link.classList.add("is-active");
    setCurrentState(link, "page");
    return;
  }

  setCurrentState(link, null);
});

if (currentPath.includes("/services")) {
  servicesRootLinks.forEach((link) => {
    link.classList.add("is-active");
    if (!link.hasAttribute("aria-current")) {
      setCurrentState(link, "location");
    }
  });
}

if (["/wooden-flooring-dubai", "/spc-flooring-dubai", "/lvt-flooring-dubai", "/wpc-flooring-dubai"].some((match) => currentPath.includes(match))) {
  woodRootLinks.forEach((link) => {
    link.classList.add("is-active");
    if (!link.hasAttribute("aria-current")) {
      setCurrentState(link, "location");
    }
  });
}

if (mainNav) {
  mainNav.querySelectorAll("a, .button").forEach((control) => {
    control.addEventListener("click", (event) => {
      if (mobileNavQuery.matches) {
        if (event.defaultPrevented) {
          return;
        }
        closeMobileNav();
      }
    });
  });
}

const handleMobileNavViewportChange = () => {
  if (mobileNavQuery.matches) {
    desktopHoverMenus.forEach((item) => {
      clearDesktopHoverTimer(item);
      item.classList.remove("is-hover-open");
    });
  }

  syncMobileNavGeometry();
  applyMobileMenuState(true);
};

addMediaQueryChangeListener(mobileNavQuery, handleMobileNavViewportChange);
window.addEventListener("resize", queueSiteHeaderMeasurement);
if (siteHeader && typeof window.ResizeObserver === "function") {
  const headerResizeObserver = new window.ResizeObserver((entries) => {
    const nextEntry = entries[0];
    applyMobileNavTop(setCachedSiteHeaderHeight(nextEntry?.borderBoxSize?.[0]?.blockSize || nextEntry?.contentRect?.height || cachedSiteHeaderHeight));
  });
  headerResizeObserver.observe(siteHeader);
} else if (siteHeader) {
  queueSiteHeaderMeasurement();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileNav(true);
  }
});

document.addEventListener("click", (event) => {
  if (!mobileNavQuery.matches || !mainNav || !navToggle) return;
  if (!mainNav.classList.contains("is-open")) return;
  if (!(event.target instanceof Node)) return;
  if (mainNav.contains(event.target) || navToggle.contains(event.target)) return;
  closeMobileNav();
});

applyMobileMenuState(true);

const initSectionLinkTracking = () => {
  if (!sectionLinks.length) return;

  const sectionTargets = sectionLinks.map((link) => {
    const hash = link.getAttribute("href");
    if (!hash || !hash.startsWith("#")) return null;

    const section = safeQuerySelector(hash);
    if (!section) return null;

    return { hash, link, section };
  }).filter(Boolean);
  let sectionPositions = [];

  const setActiveSectionLink = (activeHash) => {
    sectionTargets.forEach(({ hash, link }) => {
      const isActive = hash === activeHash;
      link.classList.toggle("is-active", isActive);
      setCurrentState(link, isActive ? "location" : null);
    });
  };

  const getSectionOffset = () => (window.innerWidth < 720 ? 170 : 220);
  const refreshSectionPositions = () => {
    const nextSectionPositions = sectionTargets.map((item) => ({
      hash: item.hash,
      top: item.section.getBoundingClientRect().top + window.scrollY
    }));
    sectionPositions = nextSectionPositions;
  };

  const updateActiveSectionLink = () => {
    if (!sectionTargets.length) return;

    const scrollMarker = window.scrollY + getSectionOffset();
    let activeSection = sectionTargets[0];

    sectionPositions.forEach((item, index) => {
      if (item.top <= scrollMarker) {
        activeSection = sectionTargets[index];
      }
    });

    setActiveSectionLink(activeSection.hash);
  };

  if (window.location.hash) {
    const matchingHash = sectionTargets.find((item) => item.hash === window.location.hash);
    if (matchingHash) {
      setActiveSectionLink(matchingHash.hash);
    }
  } else if (sectionTargets[0]) {
    setActiveSectionLink(sectionTargets[0].hash);
  }

  let sectionScrollTicking = false;
  const handleSectionScroll = () => {
    if (sectionScrollTicking) return;

    sectionScrollTicking = true;
    queueFrame(() => {
      updateActiveSectionLink();
      sectionScrollTicking = false;
    });
  };
  const handleSectionLayoutChange = () => {
    queueFrame(() => {
      refreshSectionPositions();
      updateActiveSectionLink();
    });
  };

  sectionLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const hash = link.getAttribute("href");
      if (hash && hash.startsWith("#")) {
        setActiveSectionLink(hash);
      }
    });
  });

  window.addEventListener("scroll", handleSectionScroll, { passive: true });
  window.addEventListener("resize", handleSectionLayoutChange);
  window.addEventListener("load", handleSectionLayoutChange, { once: true });
  if (typeof window.ResizeObserver === "function") {
    const sectionResizeObserver = new window.ResizeObserver(handleSectionLayoutChange);
    sectionTargets.forEach(({ section }) => {
      sectionResizeObserver.observe(section);
    });
  }
  window.addEventListener("hashchange", () => {
    const matchingHash = sectionTargets.find((item) => item.hash === window.location.hash);
    if (matchingHash) {
      setActiveSectionLink(matchingHash.hash);
    }
  });

  refreshSectionPositions();
  updateActiveSectionLink();
};

const loadDeferredIframe = (iframe) => {
  if (!iframe || iframe.dataset.loaded === "true") return;

  const deferredSrc = iframe.dataset.src;
  if (!deferredSrc) return;

  iframe.src = deferredSrc;
  iframe.hidden = false;
  iframe.dataset.loaded = "true";

  const frame = iframe.closest(".map-card-frame");
  frame?.classList.add("is-loaded");
  frame?.querySelector("[data-iframe-placeholder]")?.setAttribute("hidden", "");
};
const initDeferredPageEnhancements = () => {
  if (initDeferredPageEnhancements.ready) return;
  initDeferredPageEnhancements.ready = true;

  mountRelatedServicesBeforeFaq();

  document.querySelectorAll(".breadcrumb > span").forEach((node) => {
    node.setAttribute("aria-hidden", "true");
  });

  initSectionLinkTracking();

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  document.querySelectorAll("[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = form.querySelector("[data-demo-message]");
      if (message) {
        message.classList.add("is-visible");
        message.textContent = "Preview mode: this form is styled and validated, but you still need to connect it to your email inbox or CRM before launch.";
      }
    });
  });

  document.querySelectorAll("[data-load-iframe]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;
      const iframe = targetId
        ? document.getElementById(targetId)
        : button.closest(".map-card-frame")?.querySelector("[data-deferred-iframe]");

      if (!(iframe instanceof HTMLIFrameElement)) return;
      loadDeferredIframe(iframe);
    });
  });
};
scheduleAfterLoad(initDeferredPageEnhancements, 1600);

const serviceOptions = [
  { value: "", label: "Select a service" },
  { value: "Wooden Flooring", label: "Wooden Flooring" },
  { value: "SPC Flooring", label: "SPC Flooring" },
  { value: "LVT Flooring", label: "LVT Flooring" },
  { value: "WPC Flooring", label: "WPC Flooring" },
  { value: "Tile Fixing", label: "Tile Fixing" },
  { value: "Marble Installation", label: "Marble Installation" },
  { value: "Stone Installation", label: "Stone Installation" },
  { value: "Carpet Installation", label: "Carpet Installation" },
  { value: "Multiple Services", label: "Multiple Services" }
];
const serviceOptionsMarkup = serviceOptions
  .map((option) => `<option value="${option.value}">${option.label}</option>`)
  .join("");

const serviceDefaults = [
  { match: "/wooden-flooring-dubai", value: "Wooden Flooring" },
  { match: "/spc-flooring-dubai", value: "SPC Flooring" },
  { match: "/lvt-flooring-dubai", value: "LVT Flooring" },
  { match: "/wpc-flooring-dubai", value: "WPC Flooring" },
  { match: "/tile-fixing-dubai", value: "Tile Fixing" },
  { match: "/marble-installation-dubai", value: "Marble Installation" },
  { match: "/stone-installation-dubai", value: "Stone Installation" },
  { match: "/carpet-installation-dubai", value: "Carpet Installation" }
];

const currentService = serviceDefaults.find((item) => currentPath.includes(item.match))?.value || "";

const initFloatingUiAndWhatsapp = () => {
  if (initFloatingUiAndWhatsapp.ready) return;
  initFloatingUiAndWhatsapp.ready = true;

const floatingUi = document.querySelector("[data-floating-ui-root]") || document.createElement("div");
if (!floatingUi.hasAttribute("data-floating-ui-root")) {
  floatingUi.setAttribute("data-floating-ui-root", "");
  floatingUi.innerHTML = `
  <div class="floating-tools" aria-label="Quick actions">
    <button class="floating-action floating-action--scroll" type="button" data-scroll-top data-icon="↑" aria-label="Scroll to top"></button>
    <a class="floating-action floating-action--call" href="tel:+971566363850" data-call-action data-icon="☎" aria-label="Call +971 56 636 3850"></a>
    <button class="floating-action floating-action--whatsapp" type="button" data-open-whatsapp data-icon="WA" aria-label="Open WhatsApp request form" aria-haspopup="dialog" aria-controls="whatsapp-backdrop"></button>
  </div>
  <div class="whatsapp-backdrop" id="whatsapp-backdrop" data-whatsapp-backdrop aria-hidden="true">
    <div class="whatsapp-modal" role="dialog" aria-modal="true" aria-labelledby="whatsapp-title" aria-describedby="whatsapp-description">
      <div class="whatsapp-modal-head">
        <div>
          <h2 id="whatsapp-title">WhatsApp Request</h2>
          <p id="whatsapp-description">Send your service enquiry directly to our Dubai team on WhatsApp.</p>
        </div>
        <button class="whatsapp-close" type="button" aria-label="Close WhatsApp form" data-close-whatsapp>&times;</button>
      </div>
      <form class="whatsapp-form" data-whatsapp-form>
        <div class="field">
          <label for="wa-phone">Phone number</label>
          <input id="wa-phone" name="phone" type="tel" required>
        </div>
        <div class="field">
          <label for="wa-service">Service</label>
          <select id="wa-service" name="service" required data-service-options></select>
        </div>
        <p class="whatsapp-note">After you submit, WhatsApp opens with your details prefilled and ready to send.</p>
        <button class="button button-primary" type="submit">Continue to WhatsApp</button>
      </form>
    </div>
  </div>
`;
  const floatingUiHost = document.querySelector(".site-footer") || document.querySelector("#main") || document.body;
  floatingUiHost.appendChild(floatingUi);
}

const floatingTools = floatingUi.querySelector(".floating-tools");
if (floatingTools && !floatingTools.querySelector("[data-call-action]")) {
  const callAction = document.createElement("a");
  callAction.className = "floating-action floating-action--call";
  callAction.href = "tel:+971566363850";
  callAction.setAttribute("data-call-action", "");
  callAction.setAttribute("data-icon", "☎");
  callAction.setAttribute("aria-label", "Call +971 56 636 3850");
  const whatsappAction = floatingTools.querySelector("[data-open-whatsapp]");
  floatingTools.insertBefore(callAction, whatsappAction || null);
}

const scrollTopButton = document.querySelector("[data-scroll-top]");
const openWhatsappButtons = document.querySelectorAll("[data-open-whatsapp]");
const whatsappTriggerButtons = document.querySelectorAll("[data-whatsapp-trigger]");
const whatsappBackdrop = document.querySelector("[data-whatsapp-backdrop]");
const closeWhatsappButtons = document.querySelectorAll("[data-close-whatsapp]");
const whatsappForms = document.querySelectorAll("[data-whatsapp-form]");
const whatsappModalPhoneField = document.querySelector("#wa-phone");
const whatsappModalForm = document.querySelector(".whatsapp-modal .whatsapp-form");
const whatsappModalTitle = document.querySelector("#whatsapp-title");
const whatsappModalIntro = document.querySelector(".whatsapp-modal-head p");
const whatsappModalSubmitButton = whatsappModalForm?.querySelector("button[type='submit']");
const whatsappModalServiceField = whatsappModalForm?.querySelector('[name="service"]');
const whatsappModalServiceFieldWrap = whatsappModalServiceField?.closest(".field");
const whatsappModalServiceLabel = whatsappModalForm?.querySelector('label[for="wa-service"]');
const modalFocusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
let whatsappModalRequestType = "quote";
let lastFocusedElement = null;

const configureWhatsappFormAccessibility = (form) => {
  const fieldRules = [
    { name: "phone", attributes: { autocomplete: "tel", inputmode: "tel" } },
    { name: "email", attributes: { autocomplete: "email", inputmode: "email" } },
    { name: "area", attributes: { autocomplete: "address-level2" } }
  ];

  fieldRules.forEach(({ name, attributes }) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (!field) return;

    Object.entries(attributes).forEach(([attribute, value]) => {
      field.setAttribute(attribute, value);
    });
  });

  const note = form.querySelector(".whatsapp-note");
  if (note) {
    if (!note.id) {
      const fieldId = form.querySelector("[id]")?.id || `whatsapp-form-${Math.random().toString(36).slice(2, 8)}`;
      note.id = `${fieldId}-note`;
    }
    form.setAttribute("aria-describedby", note.id);
  }
};

const populateServiceOptions = (field) => {
  if (!isSelectField(field) || !field.hasAttribute("data-service-options")) return;

  const selectedValue = field.value;
  field.innerHTML = serviceOptionsMarkup;

  if (selectedValue && Array.from(field.options).some((option) => option.value === selectedValue)) {
    field.value = selectedValue;
  }
};

const setWhatsappServiceDefault = (form) => {
  const serviceField = form.querySelector('[name="service"]');
  if (!serviceField) return;

  const preferredService = form.dataset.whatsappDefault || currentService || "";
  if (!isSelectField(serviceField)) {
    if (preferredService) {
      serviceField.value = preferredService;
    }
    return;
  }

  const hasOption = Array.from(serviceField.options).some((option) => option.value === preferredService);

  if (preferredService && hasOption) {
    serviceField.value = preferredService;
  }
};

whatsappForms.forEach((form) => {
  configureWhatsappFormAccessibility(form);
  setWhatsappServiceDefault(form);
});

whatsappTriggerButtons.forEach((button) => {
  if (button.dataset.whatsappTrigger === "service-request") {
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-controls", "whatsapp-backdrop");
  }
});

const toggleScrollButton = () => {
  if (!scrollTopButton) return;
  scrollTopButton.classList.toggle("is-visible", window.scrollY > 320);
};

toggleScrollButton();
let scrollButtonQueued = false;
const queueScrollButtonUpdate = () => {
  if (scrollButtonQueued) return;
  scrollButtonQueued = true;
  queueFrame(() => {
    scrollButtonQueued = false;
    toggleScrollButton();
  });
};
window.addEventListener("scroll", queueScrollButtonUpdate, { passive: true });

if (scrollTopButton) {
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const shouldOpenWhatsappApp = () => {
  const mobileUserAgent = navigator.userAgent || "";
  const mobilePlatform = navigator.platform || "";
  return mobileNavQuery.matches && (
    Boolean(navigator.userAgentData?.mobile) ||
    /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(mobileUserAgent) ||
    (mobilePlatform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1)
  );
};

const openWhatsappMessage = (message, popupWindow = null) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/971566363850?text=${encodedMessage}`;
  const whatsappAppUrl = `whatsapp://send?phone=971566363850&text=${encodedMessage}`;

  if (shouldOpenWhatsappApp()) {
    window.location.assign(whatsappAppUrl);
    window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        window.location.assign(whatsappUrl);
      }
    }, 900);
    return;
  }

  if (popupWindow && !popupWindow.closed) {
    try {
      popupWindow.opener = null;
      popupWindow.location.replace(whatsappUrl);
      return;
    } catch (error) {
      console.error("Unable to reuse pending WhatsApp tab.", error);
    }
  }

  if (typeof window.open === "function") {
    const popup = window.open(whatsappUrl, "_blank", "noopener");
    if (popup) {
      return;
    }
  }

  const fallbackLink = document.createElement("a");
  fallbackLink.href = whatsappUrl;
  fallbackLink.target = "_blank";
  fallbackLink.rel = "noopener noreferrer";
  fallbackLink.click();
};

const openPendingWhatsappTab = () => {
  if (shouldOpenWhatsappApp()) return null;
  if (typeof window.open !== "function") return null;

  const popup = window.open("about:blank", "_blank");
  if (!popup || popup.closed) {
    return null;
  }

  try {
    popup.document.title = "Opening WhatsApp...";
    popup.document.body.textContent = "Opening WhatsApp...";
  } catch (error) {
    console.error("Unable to prepare pending WhatsApp tab.", error);
  }

  return popup;
};

const createLeadBeforeWhatsapp = async ({ clientName, phoneNumber, serviceNeeded }) => {
  const leadEndpoint = "https://api.divinefitout.com/lead/public/create/1";
  const payload = {
    websiteName: "Divine Fit-Out & Renovation",
    clientName,
    phoneNumber,
    serviceNeeded
  };
  
  try {
    const response = await fetch(leadEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
      mode: "cors",
      keepalive: true
    });

    if (!response.ok) {
      throw new Error(`Lead request failed with status ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Lead capture failed before WhatsApp redirect.", error);
    return false;
  }
};

const setWhatsappModalMode = ({ requestType = "quote", preferredService = "", forceServiceSelection = false } = {}) => {
  whatsappModalRequestType = requestType;

  if (whatsappModalServiceFieldWrap && whatsappModalServiceField) {
    const hideServiceField = requestType === "site-visit";
    whatsappModalServiceFieldWrap.hidden = hideServiceField;
    whatsappModalServiceFieldWrap.style.display = hideServiceField ? "none" : "";
    whatsappModalServiceFieldWrap.setAttribute("aria-hidden", String(hideServiceField));
    whatsappModalServiceField.disabled = hideServiceField;
    whatsappModalServiceField.required = !hideServiceField;

    if (hideServiceField) {
      whatsappModalServiceField.value = "Request Site Visit";
    }
  }

  if (whatsappModalTitle && whatsappModalIntro && whatsappModalSubmitButton) {
    if (requestType === "service-request") {
      whatsappModalTitle.textContent = "Request Service on WhatsApp";
      whatsappModalIntro.textContent = "Select the service you need, add your details, and continue to WhatsApp.";
      whatsappModalSubmitButton.textContent = "Request on WhatsApp";
      if (whatsappModalServiceLabel) {
        whatsappModalServiceLabel.textContent = "Service Needed";
      }
    } else if (requestType === "site-visit") {
      whatsappModalTitle.textContent = "Request Site Visit on WhatsApp";
      whatsappModalIntro.textContent = "Confirm your details and continue to WhatsApp to request a site visit.";
      whatsappModalSubmitButton.textContent = "Request Site Visit";
      if (whatsappModalServiceLabel) {
        whatsappModalServiceLabel.textContent = "Service";
      }
    } else {
      whatsappModalTitle.textContent = "WhatsApp Request";
      whatsappModalIntro.textContent = "Send your service enquiry directly to our Dubai team on WhatsApp.";
      whatsappModalSubmitButton.textContent = "Continue to WhatsApp";
      if (whatsappModalServiceLabel) {
        whatsappModalServiceLabel.textContent = "Service";
      }
    }
  }

  if (!whatsappModalServiceField) return;

  if (requestType === "site-visit") {
    return;
  }

  if (forceServiceSelection) {
    whatsappModalServiceField.value = "";
    return;
  }

  const fallbackService = preferredService || currentService || "";
  if (!isSelectField(whatsappModalServiceField)) {
    whatsappModalServiceField.value = fallbackService;
    return;
  }

  const hasOption = Array.from(whatsappModalServiceField.options).some((option) => option.value === fallbackService);
  whatsappModalServiceField.value = hasOption ? fallbackService : "";
};

const getWhatsappModalFocusables = () => {
  if (!whatsappBackdrop || !whatsappBackdrop.classList.contains("is-open")) return [];

  return Array.from(whatsappBackdrop.querySelectorAll(modalFocusableSelector)).filter((element) => {
    if (element.hasAttribute("hidden")) return false;
    if (element.closest("[hidden]")) return false;
    return true;
  });
};

const openWhatsappModal = (options = {}) => {
  if (!whatsappBackdrop) return;
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  populateServiceOptions(whatsappModalServiceField);
  setWhatsappModalMode(options);
  whatsappBackdrop.classList.add("is-open");
  whatsappBackdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  const preferredFocusField = options.requestType === "service-request" && whatsappModalServiceField
    ? whatsappModalServiceField
    : whatsappModalPhoneField;
  if (preferredFocusField) {
    window.setTimeout(() => preferredFocusField.focus(), 50);
  }
};

const closeWhatsappModal = () => {
  if (!whatsappBackdrop) return;
  whatsappBackdrop.classList.remove("is-open");
  whatsappBackdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (isSelectField(whatsappModalServiceField) && whatsappModalServiceField.hasAttribute("data-service-options")) {
    whatsappModalServiceField.innerHTML = "";
  }
  if (lastFocusedElement?.isConnected) {
    lastFocusedElement.focus();
  }
};

openWhatsappButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openWhatsappModal();
  });
});

whatsappTriggerButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    if (button.dataset.whatsappTrigger === "service-request") {
      const forceServiceSelection = button.dataset.whatsappForceSelection !== "false";
      openWhatsappModal({
        requestType: "service-request",
        preferredService: button.dataset.whatsappService || "",
        forceServiceSelection
      });
      return;
    }

    openWhatsappModal({
      requestType: "site-visit",
      preferredService: button.dataset.whatsappService || currentService || "Multiple Services"
    });
  });
});

closeWhatsappButtons.forEach((button) => {
  button.addEventListener("click", closeWhatsappModal);
});

if (whatsappBackdrop) {
  whatsappBackdrop.addEventListener("click", (event) => {
    if (event.target === whatsappBackdrop) {
      closeWhatsappModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && whatsappBackdrop?.classList.contains("is-open")) {
    const focusables = getWhatsappModalFocusables();
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (event.key === "Escape") {
    closeWhatsappModal();
  }
});

whatsappForms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (typeof form.reportValidity === "function" && !form.reportValidity()) {
      return;
    }

    if (typeof form.reportValidity !== "function" && typeof form.checkValidity === "function" && !form.checkValidity()) {
      return;
    }

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const area = String(formData.get("area") || "").trim();
    const requestType = form.dataset.whatsappRequest || whatsappModalRequestType;
    const service = requestType === "site-visit"
      ? "Request Site Visit"
      : String(formData.get("service") || "").trim();
    const details = String(formData.get("message") || "").trim();

    if (!phone || !service) {
      return;
    }

    const pendingWhatsappTab = openPendingWhatsappTab();

    const pageName = document.title;
    const message = [
      requestType === "service-request"
        ? "Hello, I would like to request a service."
        : requestType === "site-visit"
          ? "Hello, I would like to request a free site visit."
          : "Hello, I would like to request a quote.",
      name ? `Name: ${name}` : "",
      `Phone: ${phone}`,
      email ? `Email: ${email}` : "",
      area ? `Area: ${area}` : "",
      `Service: ${service}`,
      details ? `Details: ${details}` : "",
      `Page: ${pageName}`
    ].filter(Boolean).join("\n");

    await createLeadBeforeWhatsapp({
      clientName: name || "Website Visitor",
      phoneNumber: phone,
      serviceNeeded: service
    });
    openWhatsappMessage(message, pendingWhatsappTab);
    closeWhatsappModal();
  });
});
};

["pointerdown", "keydown"].forEach((eventName) => {
  document.addEventListener(eventName, initFloatingUiAndWhatsapp, { once: true, passive: eventName === "pointerdown" });
});
