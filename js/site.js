const navToggle = document.querySelector("[data-nav-toggle]");
const mainNav = document.querySelector("[data-main-nav]");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const currentPath = window.location.pathname.replace(/\/$/, "");
const navLinks = document.querySelectorAll("[data-nav-link]");
const servicesRootLinks = document.querySelectorAll("[data-services-root]");

navLinks.forEach((link) => {
  const target = link.getAttribute("href");
  if (!target) return;

  const normalizedTarget = new URL(target, window.location.href).pathname.replace(/\/$/, "");
  if (normalizedTarget === currentPath || (currentPath === "" && normalizedTarget === "/index.html")) {
    link.classList.add("is-active");
  }
});

if (currentPath.includes("/services/")) {
  servicesRootLinks.forEach((link) => {
    link.classList.add("is-active");
  });
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
