

(function () {
  const IS_DARK = () => document.documentElement.classList.contains("dark");
  const getDir = () => (document.documentElement.dir || "ltr").toLowerCase() === "rtl" ? "rtl" : "ltr";

  const NAV_LINKS = [
    { href: "treatments.html", label: "Treatments", match: "treatments.html" },
    { href: "membership.html", label: "Membership Plans", match: "membership.html" },
    { href: "therapists.html", label: "Therapists", match: "therapists.html" },
    { href: "index.html#contact", label: "Contact", match: "contact" }
  ];

  function currentPage() {
    const f = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    return f === "" ? "index.html" : f;
  }

  function activeAttr(file) { return currentPage() === file ? ' aria-current="page"' : ""; }
  function isActive(file) { return currentPage() === file; }

  function headerHTML() {
    const cur = currentPage();
    const homeActive = cur === "index.html" || cur === "home2.html";
    const dashActive = cur === "dashboard.html" || cur === "admin-dashboard.html";
    const links = NAV_LINKS.map(l => {
      const isContact = l.match === "contact";
      const active = isContact ? false : isActive(l.match);
      return '<a href="' + l.href + '" class="px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
        (active
          ? "text-forest-700 dark:text-gold-300 bg-sage-100 dark:bg-sage-800/60"
          : "text-sage-700 dark:text-sage-200 hover:text-forest-700 dark:hover:text-gold-300 hover:bg-sage-50 dark:hover:bg-sage-800/50") +
        '"' + (active ? ' aria-current="page"' : "") + ">" + l.label + "</a>";
    }).join("");

    return `
<header id="site-header" class="fixed top-0 inset-x-0 z-50 transition-all duration-300">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <nav id="navbar" class="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-sage-200/70 dark:border-sage-700/60 bg-cream-50/85 dark:bg-forest-800/85 backdrop-blur-md px-4 sm:px-5 py-2.5 shadow-card transition-all duration-300" aria-label="Main">
      <a href="index.html" class="flex items-center gap-2.5 shrink-0 group">
        <span class="grid place-items-center w-9 h-9 rounded-xl bg-forest-700 dark:bg-gold-500 text-cream-50 dark:text-forest-900 shadow-soft">
          <i data-lucide="leaf" class="w-5 h-5"></i>
        </span>
        <span class="leading-none">
          <span class="block font-display text-xl sm:text-2xl font-semibold tracking-wide text-forest-700 dark:text-cream-100">SereneSpa</span>
          <span class="block text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-sage-600 dark:text-sage-300">Relax. Restore. Rejuvenate.</span>
        </span>
      </a>

      <div class="hidden lg:flex items-center gap-1">
        <div class="dropdown relative" data-dropdown>
          <button type="button" class="dropdown-btn px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${homeActive ? "text-forest-700 dark:text-gold-300 bg-sage-100 dark:bg-sage-800/60" : "text-sage-700 dark:text-sage-200 hover:bg-sage-50 dark:hover:bg-sage-800/50"}" aria-haspopup="true" aria-expanded="false">
            Home <i data-lucide="chevron-down" class="w-4 h-4 transition-transform"></i>
          </button>
          <div class="dropdown-menu absolute top-full start-0 mt-2 w-48 rounded-xl border border-sage-200 dark:border-sage-700 bg-white dark:bg-forest-800 p-1.5 shadow-lift">
            <a href="index.html" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sage-700 dark:text-sage-200 hover:bg-sage-50 dark:hover:bg-sage-700/60"${activeAttr("index.html")}><i data-lucide="home" class="w-4 h-4 text-sage-500"></i>Home 1</a>
            <a href="home2.html" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sage-700 dark:text-sage-200 hover:bg-sage-50 dark:hover:bg-sage-700/60"${activeAttr("home2.html")}><i data-lucide="layout-grid" class="w-4 h-4 text-sage-500"></i>Home 2</a>
          </div>
        </div>

        ${links}

        <div class="dropdown relative" data-dropdown>
          <button type="button" class="dropdown-btn px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${dashActive ? "text-forest-700 dark:text-gold-300 bg-sage-100 dark:bg-sage-800/60" : "text-sage-700 dark:text-sage-200 hover:bg-sage-50 dark:hover:bg-sage-800/50"}" aria-haspopup="true" aria-expanded="false">
            Dashboard <i data-lucide="chevron-down" class="w-4 h-4 transition-transform"></i>
          </button>
          <div class="dropdown-menu absolute top-full start-0 mt-2 w-52 rounded-xl border border-sage-200 dark:border-sage-700 bg-white dark:bg-forest-800 p-1.5 shadow-lift">
            <a href="dashboard.html" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sage-700 dark:text-sage-200 hover:bg-sage-50 dark:hover:bg-sage-700/60"${activeAttr("dashboard.html")}><i data-lucide="user-round" class="w-4 h-4 text-sage-500"></i>Client Dashboard</a>
            <a href="admin-dashboard.html" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sage-700 dark:text-sage-200 hover:bg-sage-50 dark:hover:bg-sage-700/60"${activeAttr("admin-dashboard.html")}><i data-lucide="shield-check" class="w-4 h-4 text-sage-500"></i>Admin Dashboard</a>
          </div>
        </div>
      </div>

      <div class="hidden lg:flex items-center gap-2">
        <button type="button" id="dir-toggle" title="Switch text direction" aria-label="Switch text direction" class="grid place-items-center w-9 h-9 rounded-full border border-sage-200 dark:border-sage-700 text-sage-600 dark:text-sage-300 hover:bg-sage-100 dark:hover:bg-sage-700 transition-colors">
          <i data-lucide="arrow-left-right" class="w-4 h-4"></i>
        </button>
        <button type="button" id="theme-toggle" title="Toggle dark mode" aria-label="Toggle dark mode" class="grid place-items-center w-9 h-9 rounded-full border border-sage-200 dark:border-sage-700 text-sage-600 dark:text-sage-300 hover:bg-sage-100 dark:hover:bg-sage-700 transition-colors">
          <i data-lucide="${IS_DARK() ? "moon" : "sun"}" class="w-4 h-4"></i>
        </button>
        <a href="${bookHref()}" class="book-btn inline-flex items-center gap-2 rounded-full bg-forest-700 hover:bg-forest-600 dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-forest-900 text-cream-50 px-4 py-2.5 text-sm font-medium shadow-soft transition-colors">
          <i data-lucide="calendar-check" class="w-4 h-4"></i>Book Appointment
        </a>
      </div>

      <div class="flex lg:hidden items-center gap-1.5">
        <button type="button" id="theme-toggle-m" title="Toggle dark mode" aria-label="Toggle dark mode" class="grid place-items-center w-9 h-9 rounded-full border border-sage-200 dark:border-sage-700 text-sage-600 dark:text-sage-300">
          <i data-lucide="${IS_DARK() ? "moon" : "sun"}" class="w-4 h-4"></i>
        </button>
        <button type="button" id="mobile-toggle" aria-label="Open menu" aria-expanded="false" class="grid place-items-center w-10 h-10 rounded-xl bg-forest-700 dark:bg-gold-500 text-cream-50 dark:text-forest-900">
          <i data-lucide="menu" class="w-5 h-5" id="mobile-icon"></i>
        </button>
      </div>
    </nav>

    <div id="mobile-panel" class="mobile-panel lg:hidden mt-2 rounded-2xl border border-sage-200 dark:border-sage-700 bg-cream-50 dark:bg-forest-800 shadow-lift overflow-hidden">
      <div class="p-3 space-y-1">
        <div class="mobile-group">
          <button type="button" class="mobile-acc w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60" aria-expanded="false">
            <span class="flex items-center gap-2"><i data-lucide="home" class="w-4 h-4 text-sage-500"></i>Home</span>
            <i data-lucide="chevron-down" class="w-4 h-4 transition-transform"></i>
          </button>
          <div class="mobile-sub ps-4">
            <a href="index.html" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-sage-600 dark:text-sage-300 hover:bg-sage-100 dark:hover:bg-sage-700/60">Home 1</a>
            <a href="home2.html" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-sage-600 dark:text-sage-300 hover:bg-sage-100 dark:hover:bg-sage-700/60">Home 2</a>
          </div>
        </div>

        ${NAV_LINKS.map(l => '<a href="' + l.href + '" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60"><i data-lucide="' + iconFor(l.label) + '" class="w-4 h-4 text-sage-500"></i>' + l.label + "</a>").join("")}

        <div class="mobile-group">
          <button type="button" class="mobile-acc w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60" aria-expanded="false">
            <span class="flex items-center gap-2"><i data-lucide="gauge" class="w-4 h-4 text-sage-500"></i>Dashboard</span>
            <i data-lucide="chevron-down" class="w-4 h-4 transition-transform"></i>
          </button>
          <div class="mobile-sub ps-4">
            <a href="dashboard.html" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-sage-600 dark:text-sage-300 hover:bg-sage-100 dark:hover:bg-sage-700/60">Client Dashboard</a>
            <a href="admin-dashboard.html" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-sage-600 dark:text-sage-300 hover:bg-sage-100 dark:hover:bg-sage-700/60">Admin Dashboard</a>
          </div>
        </div>

        <a href="${bookHref()}" class="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold bg-forest-700 dark:bg-gold-500 text-cream-50 dark:text-forest-900">
          <i data-lucide="calendar-check" class="w-4 h-4"></i>Book Appointment
        </a>

        <div class="flex items-center gap-2 pt-1">
          <button type="button" id="dir-toggle-m" class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-sage-200 dark:border-sage-700 text-sm text-sage-700 dark:text-sage-200">
            <i data-lucide="arrow-left-right" class="w-4 h-4"></i><span id="dir-label-m">LTR</span>
          </button>
          <button type="button" id="theme-toggle-m2" class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-sage-200 dark:border-sage-700 text-sm text-sage-700 dark:text-sage-200">
            <i data-lucide="${IS_DARK() ? "moon" : "sun"}" class="w-4 h-4"></i><span>Theme</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</header>`;
  }

  function iconFor(label) {
    if (label === "Treatments") return "sparkles";
    if (label === "Membership Plans") return "gem";
    if (label === "Therapists") return "users-round";
    return "mail";
  }

  function bookHref() {
    const u = ssUser();
    if (!u) return "login.html?next=dashboard";
    if (u.role === "admin") return "admin-dashboard.html";
    return "dashboard.html#book";
  }

  function footerHTML() {
    const treatments = ssTreatments().slice(0, 5);
    const prefs = ssPreferences();
    const s = prefs.adminSettings || {};
    return `
<footer id="site-footer" class="mt-24 bg-forest-800 dark:bg-forest-900 text-sage-200">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 py-14">
    <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
      <div>
        <a href="index.html" class="flex items-center gap-2.5">
          <span class="grid place-items-center w-10 h-10 rounded-xl bg-gold-500 text-forest-900"><i data-lucide="leaf" class="w-5 h-5"></i></span>
          <span class="font-display text-2xl font-semibold text-cream-50">SereneSpa</span>
        </a>
        <p class="mt-4 text-sm leading-relaxed text-sage-300">A sanctuary of calm in the heart of the city. Therapeutic massage, aromatherapy and wellness rituals tailored to you.</p>
        <div class="mt-5 flex items-center gap-2">
          ${["instagram", "facebook", "twitter", "youtube"].map(ic =>
            '<a href="#" aria-label="' + ic + '" class="grid place-items-center w-9 h-9 rounded-full border border-sage-600 hover:bg-gold-500 hover:border-gold-500 hover:text-forest-900 transition-colors"><i data-lucide="' + ic + '" class="w-4 h-4"></i></a>'
          ).join("")}
        </div>
      </div>

      <div>
        <h4 class="font-display text-lg font-semibold text-cream-50 mb-4">Explore</h4>
        <ul class="space-y-2.5 text-sm">
          <li><a class="hover:text-gold-300 transition-colors" href="index.html">Home 1</a></li>
          <li><a class="hover:text-gold-300 transition-colors" href="home2.html">Home 2</a></li>
          <li><a class="hover:text-gold-300 transition-colors" href="treatments.html">Treatments</a></li>
          <li><a class="hover:text-gold-300 transition-colors" href="membership.html">Membership Plans</a></li>
          <li><a class="hover:text-gold-300 transition-colors" href="therapists.html">Therapists</a></li>
          <li><a class="hover:text-gold-300 transition-colors" href="login.html">Client Login</a></li>
        </ul>
      </div>

      <div>
        <h4 class="font-display text-lg font-semibold text-cream-50 mb-4">Signature Treatments</h4>
        <ul class="space-y-2.5 text-sm">
          ${treatments.map(t => '<li><a class="hover:text-gold-300 transition-colors" href="treatments.html">' + ssEscape(t.name) + "</a></li>").join("")}
        </ul>
      </div>

      <div>
        <h4 class="font-display text-lg font-semibold text-cream-50 mb-4">Visit Us</h4>
        <ul class="space-y-3 text-sm">
          <li class="flex gap-2.5"><i data-lucide="map-pin" class="w-4 h-4 mt-0.5 shrink-0 text-gold-400"></i><span>${ssEscape(s.address || "14 Willow Court, Riverside District")}</span></li>
          <li class="flex gap-2.5"><i data-lucide="phone" class="w-4 h-4 mt-0.5 shrink-0 text-gold-400"></i><span>${ssEscape(s.phone || "+1 (555) 018-2244")}</span></li>
          <li class="flex gap-2.5"><i data-lucide="mail" class="w-4 h-4 mt-0.5 shrink-0 text-gold-400"></i><span>${ssEscape(s.email || "hello@serenespa.com")}</span></li>
          <li class="flex gap-2.5"><i data-lucide="clock" class="w-4 h-4 mt-0.5 shrink-0 text-gold-400"></i><span>${ssEscape(s.hours || "Mon–Sat 9:00–20:00 · Sun 10:00–18:00")}</span></li>
        </ul>
        <form id="newsletter-form" class="mt-5 flex gap-2">
          <input type="email" required placeholder="Email for wellness tips" class="w-full min-w-0 rounded-full bg-forest-700 border border-sage-600 px-4 py-2.5 text-sm placeholder:text-sage-400 focus:outline-none focus:border-gold-400" />
          <button type="submit" aria-label="Subscribe" class="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-gold-500 text-forest-900 hover:bg-gold-400 transition-colors"><i data-lucide="send" class="w-4 h-4"></i></button>
        </form>
      </div>
    </div>

    <div class="mt-12 pt-6 border-t border-sage-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-sage-400">
      <p>© ${new Date().getFullYear()} SereneSpa. Crafted for calm — demo experience.</p>
      <p class="flex items-center gap-4"><a href="index.html#contact" class="hover:text-gold-300">Contact</a><a href="404.html" class="hover:text-gold-300">404</a><span>All treatments are illustrative demo services.</span></p>
    </div>
  </div>
</footer>`;
  }

  function applyTheme(mode, silent) {
    document.documentElement.classList.toggle("dark", mode === "dark");
    try { localStorage.setItem("serenespa_theme", mode); } catch (e) {}
    refreshThemeIcons();
    if (!silent) ssToast(mode === "dark" ? "Dark mode on — lights dimmed." : "Light mode on — sunshine restored.");
  }
  function refreshThemeIcons() {
    const name = IS_DARK() ? "moon" : "sun";
    ["theme-toggle", "theme-toggle-m", "theme-toggle-m2"].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const ic = btn.querySelector("[data-lucide]");
      if (ic) ic.setAttribute("data-lucide", name);
    });
    ssIcons();
  }
  function applyDirection(dir, silent) {
    document.documentElement.dir = dir;
    try { localStorage.setItem("serenespa_direction", dir); } catch (e) {}
    const lbl = document.getElementById("dir-label-m");
    if (lbl) lbl.textContent = dir.toUpperCase();
    if (!silent) ssToast(dir === "rtl" ? "Right-to-left layout enabled." : "Left-to-right layout enabled.");
  }

  function bindToggles(root) {
    const t = id => root.querySelector("#" + id);
    const toggleTheme = () => applyTheme(IS_DARK() ? "light" : "dark");
    const toggleDir = () => applyDirection(getDir() === "rtl" ? "ltr" : "rtl");
    ["theme-toggle", "theme-toggle-m", "theme-toggle-m2"].forEach(id => { const b = t(id); if (b) b.addEventListener("click", toggleTheme); });
    ["dir-toggle", "dir-toggle-m"].forEach(id => { const b = t(id); if (b) b.addEventListener("click", toggleDir); });
    const dl = t("dir-label-m");
    if (dl) dl.textContent = getDir().toUpperCase();
  }

  function bindMenus(root) {
    const header = root.querySelector("#site-header");
    const navbar = root.querySelector("#navbar");
    const panel = root.querySelector("#mobile-panel");
    const mBtn = root.querySelector("#mobile-toggle");
    const mIcon = root.querySelector("#mobile-icon");

    root.querySelectorAll("[data-dropdown]").forEach(dd => {
      const btn = dd.querySelector(".dropdown-btn");
      const chev = dd.querySelector(".dropdown-btn [data-lucide]");
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const open = dd.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        if (chev) chev.style.transform = open ? "rotate(180deg)" : "";
        root.querySelectorAll("[data-dropdown].open").forEach(o => {
          if (o !== dd) {
            o.classList.remove("open");
            const ob = o.querySelector(".dropdown-btn");
            if (ob) ob.setAttribute("aria-expanded", "false");
            const oc = o.querySelector(".dropdown-btn [data-lucide]");
            if (oc) oc.style.transform = "";
          }
        });
      });
    });
    document.addEventListener("click", e => {
      if (!e.target.closest("[data-dropdown]")) {
        root.querySelectorAll("[data-dropdown].open").forEach(o => {
          o.classList.remove("open");
          const ob = o.querySelector(".dropdown-btn");
          if (ob) ob.setAttribute("aria-expanded", "false");
          const oc = o.querySelector(".dropdown-btn [data-lucide]");
          if (oc) oc.style.transform = "";
        });
      }
    });

    if (mBtn && panel) {
      mBtn.addEventListener("click", () => {
        const open = panel.classList.toggle("open");
        mBtn.setAttribute("aria-expanded", open ? "true" : "false");
        if (mIcon) mIcon.setAttribute("data-lucide", open ? "x" : "menu");
        ssIcons();
      });
      panel.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
        panel.classList.remove("open");
        mBtn.setAttribute("aria-expanded", "false");
        if (mIcon) mIcon.setAttribute("data-lucide", "menu");
        ssIcons();
      }));
    }

    root.querySelectorAll(".mobile-acc").forEach(btn => {
      btn.addEventListener("click", () => {
        const group = btn.closest(".mobile-group");
        const sub = group.querySelector(".mobile-sub");
        const open = sub.classList.contains("open");
        root.querySelectorAll(".mobile-group .mobile-sub.open").forEach(s => {
          s.classList.remove("open");
          const b = s.parentElement.querySelector(".mobile-acc");
          if (b) b.setAttribute("aria-expanded", "false");
          const c = b && b.querySelector("[data-lucide]");
          if (c) c.style.transform = "";
        });
        if (!open) {
          sub.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
          const c = btn.querySelector("[data-lucide]");
          if (c) c.style.transform = "rotate(180deg)";
        }
      });
    });

    const onScroll = () => {
      if (!navbar) return;
      if (window.scrollY > 18) navbar.classList.add("shadow-lift", "bg-white/95", "dark:bg-forest-800/95");
      else navbar.classList.remove("shadow-lift", "bg-white/95", "dark:bg-forest-800/95");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        if (panel) panel.classList.remove("open");
        root.querySelectorAll("[data-dropdown].open").forEach(o => o.classList.remove("open"));
      }
    });
    if (header) {
      header.querySelectorAll("a").forEach(a => {
        const href = a.getAttribute("href") || "";
        if (href.startsWith("#") && href.length > 1) {
          a.addEventListener("click", () => {
            if (panel) panel.classList.remove("open");
          });
        }
      });
    }
  }

  function bindNewsletter(root) {
    const f = root.querySelector("#newsletter-form");
    if (!f) return;
    f.addEventListener("submit", e => {
      e.preventDefault();
      f.reset();
      ssToast("You are on the list — wellness notes arrive monthly.", "success");
    });
  }

  function render() {
    const headerMount = document.getElementById("site-header-mount");
    const footerMount = document.getElementById("site-footer-mount");
    if (headerMount) headerMount.outerHTML = headerHTML();
    if (footerMount) footerMount.outerHTML = footerHTML();

    const root = document;
    bindToggles(root);
    bindMenus(root);
    bindNewsletter(root);

    const dl = document.getElementById("dir-label-m");
    if (dl) dl.textContent = getDir().toUpperCase();
    ssIcons();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
