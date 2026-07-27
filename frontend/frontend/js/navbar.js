"use strict";

import { $, $$ } from "./utils.js";

export function initNav() {
  const header = $("#siteHeader");
  const burger = $("#burger");
  const menu = $("#mobileMenu");
  const links = $$(".nav-links a, .mobile-menu a[href^='#']");
  const navShell = $(".nav-shell");
  const sections = $$("main section[id]");
  const navItems = $$(".nav-links a");

  function onScroll() {
    header?.classList.toggle("scrolled", window.scrollY > 24);
  }

  function closeMenu() {
    burger?.classList.remove("open");
    burger?.setAttribute("aria-expanded", "false");
    menu?.classList.remove("open");
    menu?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
  }

  function toggleMenu() {
    if (!burger || !menu) return;

    const open = !menu.classList.contains("open");
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
  }

  function setActiveLink() {
    const y = window.scrollY + 150;
    let current = "home";

    sections.forEach((section) => {
      if (section.offsetTop <= y) current = section.id;
    });

    navItems.forEach((link) => {
      link.classList.toggle(
        "active",
        link.getAttribute("href") === `#${current}`,
      );
    });
  }

  burger?.addEventListener("click", toggleMenu);
  links.forEach((link) => link.addEventListener("click", closeMenu));

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", setActiveLink, { passive: true });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) closeMenu();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  navShell?.addEventListener("mousemove", (event) => {
    const rect = navShell.getBoundingClientRect();
    navShell.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    navShell.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  });

  navShell?.addEventListener("mouseleave", () => {
    navShell.style.setProperty("--spot-x", "120px");
    navShell.style.setProperty("--spot-y", "36px");
  });

  onScroll();
  setActiveLink();
}
