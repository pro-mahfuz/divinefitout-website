const navToggle = document.querySelector("[data-nav-toggle]");
const mainNav = document.querySelector("[data-main-nav]");
const heroSlider = document.querySelector("[data-hero-slider]");
const mobileNavQuery = window.matchMedia("(max-width: 820px)");
const normalizePath = (pathname) => {
  const normalized = pathname.replace(/\\/g, "/").replace(/\/index\.html$/, "").replace(/\/$/, "");
  return normalized === "" ? "/" : normalized;
};
const getDirectChildByClass = (parent, className) => Array.from(parent.children).find((child) => child.classList?.contains(className));
const getDirectAnchor = (parent) => Array.from(parent.children).find((child) => child.tagName === "A");
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
  const heroSlides = Array.from(heroSlider.querySelectorAll("[data-hero-slide]"));
  const heroDots = Array.from(heroSlider.querySelectorAll("[data-hero-dot]"));
  const heroDotList = heroSlider.querySelector(".hero-slider-dots");
  const heroPrev = heroSlider.querySelector("[data-hero-prev]");
  const heroNext = heroSlider.querySelector("[data-hero-next]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
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

  const setHeroSlide = (index) => {
    if (!heroSlides.length) return;

    activeHeroIndex = (index + heroSlides.length) % heroSlides.length;

    heroSlides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeHeroIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    heroDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeHeroIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-selected", String(isActive));
      dot.removeAttribute("aria-pressed");
      dot.tabIndex = isActive ? 0 : -1;
    });
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

  const startHeroAutoplay = () => {
    if (reduceMotion.matches || heroSlides.length < 2) return;
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

  const handleReduceMotionChange = () => {
    if (reduceMotion.matches) {
      stopHeroAutoplay();
      return;
    }
    startHeroAutoplay();
  };

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", handleReduceMotionChange);
  } else if (typeof reduceMotion.addListener === "function") {
    reduceMotion.addListener(handleReduceMotionChange);
  }

  setHeroSlide(activeHeroIndex);
  startHeroAutoplay();
}

const currentPath = normalizePath(window.location.pathname);
const navLinks = document.querySelectorAll("[data-nav-link]");
const servicesRootLinks = document.querySelectorAll("[data-services-root]");
const woodRootLinks = document.querySelectorAll("[data-wood-root]");
const sectionLinks = Array.from(document.querySelectorAll("[data-section-link]"));
const woodServicePaths = ["/wooden-flooring-dubai", "/spc-flooring-dubai", "/lvt-flooring-dubai", "/wpc-flooring-dubai"];

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

const syncBodyScrollLock = () => {
  document.body.classList.toggle("nav-open", Boolean(mainNav && mainNav.classList.contains("is-open") && mobileNavQuery.matches));
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
  ? Array.from(mainNav.querySelectorAll(".has-submenu, .submenu-group")).filter((item) => getDirectChildByClass(item, "submenu"))
  : [];

const setSubmenuExpanded = (item, isExpanded) => {
  item.classList.toggle("is-expanded", isExpanded);
  const toggle = getDirectChildByClass(item, "submenu-toggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(isExpanded));
    const label = getDirectAnchor(item)?.textContent.trim() || "submenu";
    toggle.setAttribute("aria-label", `${isExpanded ? "Collapse" : "Expand"} ${label} menu`);
  }
};

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

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
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
    const shouldExpand = item.classList.contains("has-submenu")
      ? currentPath.includes("/services")
      : woodServicePaths.some((match) => currentPath.includes(match));

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
      applyMobileMenuState();
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
    control.addEventListener("click", () => {
      if (mobileNavQuery.matches) {
        closeMobileNav();
      }
    });
  });
}

const handleMobileNavViewportChange = () => {
  applyMobileMenuState(true);
};

if (typeof mobileNavQuery.addEventListener === "function") {
  mobileNavQuery.addEventListener("change", handleMobileNavViewportChange);
} else if (typeof mobileNavQuery.addListener === "function") {
  mobileNavQuery.addListener(handleMobileNavViewportChange);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileNav(true);
  }
});

applyMobileMenuState(true);

document.querySelectorAll(".breadcrumb > span").forEach((node) => {
  node.setAttribute("aria-hidden", "true");
});

if (sectionLinks.length) {
  const sectionTargets = sectionLinks.map((link) => {
    const hash = link.getAttribute("href");
    if (!hash || !hash.startsWith("#")) return null;

    const section = document.querySelector(hash);
    if (!section) return null;

    return { hash, link, section };
  }).filter(Boolean);

  const setActiveSectionLink = (activeHash) => {
    sectionTargets.forEach(({ hash, link }) => {
      const isActive = hash === activeHash;
      link.classList.toggle("is-active", isActive);
      setCurrentState(link, isActive ? "location" : null);
    });
  };

  const getSectionOffset = () => (window.innerWidth < 720 ? 170 : 220);

  const updateActiveSectionLink = () => {
    if (!sectionTargets.length) return;

    const sectionOffset = getSectionOffset();
    let activeSection = sectionTargets[0];

    sectionTargets.forEach((item) => {
      if (item.section.getBoundingClientRect().top - sectionOffset <= 0) {
        activeSection = item;
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
    window.requestAnimationFrame(() => {
      updateActiveSectionLink();
      sectionScrollTicking = false;
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
  window.addEventListener("resize", handleSectionScroll);
  window.addEventListener("hashchange", () => {
    const matchingHash = sectionTargets.find((item) => item.hash === window.location.hash);
    if (matchingHash) {
      setActiveSectionLink(matchingHash.hash);
    }
  });

  updateActiveSectionLink();
}

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

document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
  link.setAttribute("href", "https://wa.me/971568163016");
});

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

const floatingUi = document.createElement("div");
floatingUi.innerHTML = `
  <div class="floating-tools" aria-label="Quick actions">
    <button class="floating-action floating-action--scroll" type="button" data-scroll-top aria-label="Scroll to top">
      <span class="floating-icon">&#8593;</span>
    </button>
    <button class="floating-action floating-action--whatsapp" type="button" data-open-whatsapp aria-label="Open WhatsApp request form" aria-haspopup="dialog" aria-controls="whatsapp-backdrop">
      <span class="floating-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path fill="currentColor" d="M12.04 2C6.52 2 2.04 6.48 2.04 12c0 1.76.46 3.49 1.34 5.02L2 22l5.12-1.34A9.93 9.93 0 0 0 12.04 22C17.56 22 22.04 17.52 22.04 12S17.56 2 12.04 2Zm0 18.1c-1.51 0-2.98-.4-4.28-1.15l-.31-.18-3.04.8.81-2.96-.2-.31A8.07 8.07 0 0 1 3.94 12c0-4.47 3.63-8.1 8.1-8.1 2.17 0 4.2.84 5.74 2.37a8.05 8.05 0 0 1 2.36 5.73c0 4.47-3.63 8.1-8.1 8.1Zm4.44-6.08c-.24-.12-1.42-.7-1.64-.77-.22-.08-.38-.12-.54.12-.16.23-.62.77-.76.92-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.18-.7-.62-1.17-1.39-1.31-1.62-.14-.23-.01-.36.1-.48.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43-.06-.12-.54-1.29-.74-1.76-.2-.48-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.68 2.56 4.06 3.59.57.25 1.02.39 1.37.5.58.19 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.03.14-1.14-.06-.11-.22-.18-.46-.3Z"/>
        </svg>
      </span>
    </button>
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
          <label for="wa-name">Full name</label>
          <input id="wa-name" name="name" type="text" required>
        </div>
        <div class="field">
          <label for="wa-phone">Phone number</label>
          <input id="wa-phone" name="phone" type="tel" required>
        </div>
        <div class="field">
          <label for="wa-service">Service</label>
          <select id="wa-service" name="service" required>
            ${serviceOptions.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")}
          </select>
        </div>
        <p class="whatsapp-note">After you submit, WhatsApp opens with your details prefilled and ready to send.</p>
        <button class="button button-primary" type="submit">Continue to WhatsApp</button>
      </form>
    </div>
  </div>
`;

document.body.appendChild(floatingUi);

const scrollTopButton = document.querySelector("[data-scroll-top]");
const openWhatsappButtons = document.querySelectorAll("[data-open-whatsapp]");
const whatsappTriggerButtons = document.querySelectorAll("[data-whatsapp-trigger]");
const whatsappBackdrop = document.querySelector("[data-whatsapp-backdrop]");
const closeWhatsappButtons = document.querySelectorAll("[data-close-whatsapp]");
const whatsappForms = document.querySelectorAll("[data-whatsapp-form]");
const whatsappModalNameField = document.querySelector("#wa-name");
const whatsappModalForm = document.querySelector(".whatsapp-modal .whatsapp-form");
const whatsappModalTitle = document.querySelector("#whatsapp-title");
const whatsappModalIntro = document.querySelector(".whatsapp-modal-head p");
const whatsappModalSubmitButton = whatsappModalForm?.querySelector("button[type='submit']");
const whatsappModalServiceField = whatsappModalForm?.querySelector('[name="service"]');
const whatsappModalServiceLabel = whatsappModalForm?.querySelector('label[for="wa-service"]');
const modalFocusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
let whatsappModalRequestType = "quote";
let lastFocusedElement = null;

const configureWhatsappFormAccessibility = (form) => {
  const fieldRules = [
    { name: "name", attributes: { autocomplete: "name" } },
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

const setWhatsappServiceDefault = (form) => {
  const serviceField = form.querySelector('[name="service"]');
  if (!serviceField) return;

  const preferredService = form.dataset.whatsappDefault || currentService || "";
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
window.addEventListener("scroll", toggleScrollButton, { passive: true });

if (scrollTopButton) {
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const openWhatsappMessage = (message) => {
  window.open(`https://wa.me/971568163016?text=${encodeURIComponent(message)}`, "_blank", "noopener");
};

const buildSiteVisitMessage = (button) => {
  const preferredService = button.dataset.whatsappService || currentService || "";
  const pageName = document.title;

  return [
    "Hello, I would like to request a free site visit.",
    preferredService ? `Service: ${preferredService}` : "",
    `Page: ${pageName}`
  ].filter(Boolean).join("\n");
};

const setWhatsappModalMode = ({ requestType = "quote", preferredService = "", forceServiceSelection = false } = {}) => {
  whatsappModalRequestType = requestType;

  if (whatsappModalTitle && whatsappModalIntro && whatsappModalSubmitButton) {
    if (requestType === "service-request") {
      whatsappModalTitle.textContent = "Request Service on WhatsApp";
      whatsappModalIntro.textContent = "Select the service you need, add your details, and continue to WhatsApp.";
      whatsappModalSubmitButton.textContent = "Request on WhatsApp";
      if (whatsappModalServiceLabel) {
        whatsappModalServiceLabel.textContent = "Service Needed";
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

  if (forceServiceSelection) {
    whatsappModalServiceField.value = "";
    return;
  }

  const fallbackService = preferredService || currentService || "";
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
  setWhatsappModalMode(options);
  whatsappBackdrop.classList.add("is-open");
  whatsappBackdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  const preferredFocusField = options.requestType === "service-request" && whatsappModalServiceField
    ? whatsappModalServiceField
    : whatsappModalNameField;
  if (preferredFocusField) {
    window.setTimeout(() => preferredFocusField.focus(), 50);
  }
};

const closeWhatsappModal = () => {
  if (!whatsappBackdrop) return;
  whatsappBackdrop.classList.remove("is-open");
  whatsappBackdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
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

    openWhatsappMessage(buildSiteVisitMessage(button));
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
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const area = String(formData.get("area") || "").trim();
    const service = String(formData.get("service") || "").trim();
    const details = String(formData.get("message") || "").trim();
    const requestType = form.dataset.whatsappRequest || whatsappModalRequestType;

    if (!name || !phone || !service) {
      return;
    }

    const pageName = document.title;
    const message = [
      requestType === "service-request"
        ? "Hello, I would like to request a service."
        : "Hello, I would like to request a quote.",
      `Name: ${name}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : "",
      area ? `Area: ${area}` : "",
      `Service: ${service}`,
      details ? `Details: ${details}` : "",
      `Page: ${pageName}`
    ].filter(Boolean).join("\n");

    openWhatsappMessage(message);
    closeWhatsappModal();
  });
});
