

function ssBookTreatmentHref(treatmentId) {
  const u = ssUser();
  if (!u) return "login.html?next=dashboard";
  if (u.role === "admin") return "admin-dashboard.html";
  return "dashboard.html?view=book&treatment=" + encodeURIComponent(treatmentId || "");
}

function ssTreatmentCardHTML(t, opts) {
  opts = opts || {};
  const size = opts.compact ? "aspect-[16/10]" : "aspect-[4/3]";
  return `
<article class="reveal group flex flex-col rounded-3xl overflow-hidden bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 shadow-card card-hover">
  <div class="relative ${size} overflow-hidden">
    <img src="${t.image}" alt="${ssEscape(t.name)} at SereneSpa" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
    <span class="absolute top-3 start-3 rounded-full bg-white/92 dark:bg-forest-900/85 px-3 py-1 text-[11px] font-medium tracking-wide text-forest-700 dark:text-gold-300">${ssEscape(t.category)}</span>
    <span class="absolute bottom-3 end-3 rounded-full bg-forest-700/90 text-cream-50 px-3 py-1 text-[11px] font-medium">From ${ssMoney(t.price)}</span>
  </div>
  <div class="flex flex-col flex-1 p-5">
    <div class="flex items-start justify-between gap-3">
      <h3 class="font-display text-xl font-semibold text-forest-700 dark:text-cream-100">${ssEscape(t.name)}</h3>
      <span class="shrink-0 inline-flex items-center gap-1 text-xs text-sage-600 dark:text-sage-300 whitespace-nowrap"><i data-lucide="clock" class="w-3.5 h-3.5"></i>${t.duration} min</span>
    </div>
    <p class="mt-2 text-sm leading-relaxed text-sage-600 dark:text-sage-300 line-clamp-2">${ssEscape(t.desc)}</p>
    <ul class="mt-3 flex flex-wrap gap-1.5">
      ${(t.benefits || []).slice(0, 3).map(b => `<li class="rounded-full bg-sage-50 dark:bg-sage-700/50 px-2.5 py-1 text-[11px] text-sage-600 dark:text-sage-200">${ssEscape(b)}</li>`).join("")}
    </ul>
    <div class="mt-auto flex flex-wrap items-center gap-2 pt-1">
      <button type="button" data-action="book-treatment" data-id="${t.id}" class="flex-1 min-w-[7rem] whitespace-nowrap inline-flex items-center justify-center gap-1.5 rounded-full bg-forest-700 hover:bg-forest-600 dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-forest-900 text-cream-50 px-3 py-2.5 text-sm font-medium transition-colors">
        <i data-lucide="calendar-plus" class="w-4 h-4"></i>Book Now
      </button>
      <button type="button" data-action="view-treatment" data-id="${t.id}" class="flex-1 min-w-[7rem] whitespace-nowrap inline-flex items-center justify-center gap-1.5 rounded-full border border-sage-300 dark:border-sage-600 text-sage-700 dark:text-sage-200 hover:bg-sage-50 dark:hover:bg-sage-700/60 px-3 py-2.5 text-sm font-medium transition-colors">
        View Details
      </button>
    </div>
  </div>
</article>`;
}

function ssRenderTreatmentsInto(el, list, opts) {
  if (!el) return;
  el.innerHTML = list.map(t => ssTreatmentCardHTML(t, opts)).join("");
  ssIcons();
  requestAnimationFrame(() => {
    el.querySelectorAll(".reveal").forEach(r => r.classList.add("is-visible"));
  });
}

function ssEnsureTreatmentModal() {
  let modal = document.getElementById("treatment-modal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "treatment-modal";
  modal.className = "modal-backdrop hidden";
  modal.innerHTML = `
  <div class="modal-panel w-full max-w-3xl rounded-3xl bg-cream-50 dark:bg-forest-800 overflow-hidden shadow-lift border border-sage-100 dark:border-sage-700" role="dialog" aria-modal="true" aria-labelledby="tm-title">
    <div class="relative">
      <img id="tm-img" src="" alt="" class="w-full h-52 sm:h-64 object-cover" />
      <button type="button" data-action="close-modal" aria-label="Close" class="absolute top-3 end-3 grid place-items-center w-9 h-9 rounded-full bg-white/90 dark:bg-forest-900/85 text-forest-700 dark:text-cream-100 hover:bg-white"><i data-lucide="x" class="w-5 h-5"></i></button>
      <span id="tm-badge" class="absolute bottom-3 start-4 rounded-full bg-forest-700/90 text-cream-50 px-3 py-1 text-xs"></span>
    </div>
    <div class="p-5 sm:p-7">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <h3 id="tm-title" class="font-display text-2xl sm:text-3xl font-semibold text-forest-700 dark:text-cream-100"></h3>
        <div class="flex items-center gap-3 text-sm text-sage-600 dark:text-sage-300">
          <span class="inline-flex items-center gap-1.5"><i data-lucide="clock" class="w-4 h-4"></i><span id="tm-duration"></span></span>
          <span class="inline-flex items-center gap-1.5 text-gold-600 dark:text-gold-300 font-medium"><i data-lucide="badge-dollar-sign" class="w-4 h-4"></i><span id="tm-price"></span></span>
        </div>
      </div>
      <p id="tm-desc" class="mt-3 text-sm sm:text-base leading-relaxed text-sage-600 dark:text-sage-300"></p>
      <h4 class="mt-5 font-display text-lg font-semibold text-forest-700 dark:text-cream-100">Benefits</h4>
      <ul id="tm-benefits" class="mt-2 grid gap-2 sm:grid-cols-2"></ul>
      <div class="mt-6 flex flex-col sm:flex-row gap-3">
        <a id="tm-book" href="#" class="inline-flex items-center justify-center gap-2 rounded-full bg-forest-700 hover:bg-forest-600 dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-forest-900 text-cream-50 px-6 py-3 text-sm font-medium transition-colors">
          <i data-lucide="calendar-check" class="w-4 h-4"></i>Book This Treatment
        </a>
        <button type="button" data-action="close-modal" class="rounded-full border border-sage-300 dark:border-sage-600 px-6 py-3 text-sm font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60 transition-colors">Close</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener("click", e => { if (e.target === modal) ssCloseTreatmentModal(); });
  ssIcons();
  return modal;
}

function ssOpenTreatmentModal(t) {
  if (!t) return;
  const modal = ssEnsureTreatmentModal();
  modal.querySelector("#tm-img").src = t.image;
  modal.querySelector("#tm-img").alt = t.name + " treatment at SereneSpa";
  modal.querySelector("#tm-title").textContent = t.name;
  modal.querySelector("#tm-badge").textContent = t.category;
  modal.querySelector("#tm-duration").textContent = t.duration + " minutes";
  modal.querySelector("#tm-price").textContent = "from " + ssMoney(t.price);
  modal.querySelector("#tm-desc").textContent = t.desc;
  modal.querySelector("#tm-benefits").innerHTML = (t.benefits || [])
    .map(b => `<li class="flex items-start gap-2 text-sm text-sage-600 dark:text-sage-300"><i data-lucide="circle-check" class="w-4 h-4 mt-0.5 shrink-0 text-sage-500"></i><span>${ssEscape(b)}</span></li>`).join("");
  modal.querySelector("#tm-book").href = ssBookTreatmentHref(t.id);
  modal.querySelector("#tm-book").onclick = e => {
    if (ssUser() && ssUser().role === "client") ssToast("Great choice — complete your booking in the dashboard.", "success");
    ssCloseTreatmentModal();
  };
  modal.classList.remove("hidden");
  requestAnimationFrame(() => modal.classList.add("open"));
  document.body.style.overflow = "hidden";
  ssIcons();
}

function ssCloseTreatmentModal() {
  const modal = document.getElementById("treatment-modal");
  if (!modal) return;
  modal.classList.remove("open");
  document.body.style.overflow = "";
  setTimeout(() => modal.classList.add("hidden"), 220);
}

document.addEventListener("click", e => {
  const viewBtn = e.target.closest('[data-action="view-treatment"]');
  if (viewBtn) {
    e.preventDefault();
    ssOpenTreatmentModal(ssGetTreatment(viewBtn.dataset.id));
    return;
  }
  const bookBtn = e.target.closest('[data-action="book-treatment"]');
  if (bookBtn) {
    e.preventDefault();
    const href = ssBookTreatmentHref(bookBtn.dataset.id);
    if (!ssUser()) ssToast("Please sign in to book an appointment.");
    location.href = href;
    return;
  }
  if (e.target.closest('[data-action="close-modal"]')) {
    e.preventDefault();
    ssCloseTreatmentModal();
  }
});
document.addEventListener("keydown", e => { if (e.key === "Escape") ssCloseTreatmentModal(); });

document.addEventListener("DOMContentLoaded", () => {
  const treatments = ssTreatments();

  const featured = document.getElementById("featured-grid");
  if (featured) {
    ssRenderTreatmentsInto(featured, treatments.filter(t => t.featured).slice(0, 4), { compact: false });
  }

  const grid = document.getElementById("treatment-grid");
  const chipWrap = document.getElementById("treatment-filters");
  if (grid) {
    let active = "All";
    const categories = ["All"].concat(Array.from(new Set(treatments.map(t => t.category))));
    if (chipWrap) {
      chipWrap.innerHTML = categories.map(c =>
        `<button type="button" data-filter="${ssEscape(c)}" class="filter-chip rounded-full border px-4 py-2 text-sm font-medium transition-colors ${c === "All" ? "border-forest-700 bg-forest-700 text-cream-50 dark:bg-gold-500 dark:border-gold-500 dark:text-forest-900" : "border-sage-300 dark:border-sage-600 text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60"}">${ssEscape(c)}</button>`
      ).join("");
      chipWrap.addEventListener("click", ev => {
        const chip = ev.target.closest(".filter-chip");
        if (!chip) return;
        active = chip.dataset.filter;
        chipWrap.querySelectorAll(".filter-chip").forEach(c => {
          const on = c.dataset.filter === active;
          c.className = "filter-chip rounded-full border px-4 py-2 text-sm font-medium transition-colors " +
            (on ? "border-forest-700 bg-forest-700 text-cream-50 dark:bg-gold-500 dark:border-gold-500 dark:text-forest-900"
                : "border-sage-300 dark:border-sage-600 text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60");
        });
        renderGrid();
      });
    }
    function renderGrid() {
      const list = active === "All" ? treatments : treatments.filter(t => t.category === active);
      const empty = document.getElementById("treatment-empty");
      if (empty) empty.classList.toggle("hidden", list.length > 0);
      ssRenderTreatmentsInto(grid, list);
    }
    renderGrid();
  }

  document.querySelectorAll('[data-scroll="treatments"]').forEach(a => {
    a.addEventListener("click", ev => {
      if (currentPageIs("index.html")) { ev.preventDefault(); document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" }); }
    });
  });

  function currentPageIs(f) {
    return (location.pathname.split("/").pop() || "index.html").toLowerCase() === f;
  }
});
