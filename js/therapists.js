

function ssBookTherapistHref(therapistId) {
  const u = ssUser();
  if (!u) return "login.html?next=dashboard";
  if (u.role === "admin") return "admin-dashboard.html";
  return "dashboard.html?view=book&therapist=" + encodeURIComponent(therapistId || "");
}

function ssTherapistCardHTML(t, opts) {
  opts = opts || {};
  const onDark = !!opts.onDark;
  const nameCls = onDark ? "text-cream-50" : "text-forest-700 dark:text-cream-100";
  const bodyCls = onDark ? "text-sage-300" : "text-sage-600 dark:text-sage-300";
  const cardCls = onDark
    ? "bg-white/8 dark:bg-forest-900/60 border-white/10"
    : "bg-white dark:bg-forest-800 border-sage-100 dark:border-sage-700/60";
  const pillCls = onDark
    ? "bg-white/10 text-sage-200"
    : "bg-sage-50 dark:bg-sage-700/50 text-sage-600 dark:text-sage-200";
  return `
<article class="reveal group rounded-3xl overflow-hidden border ${cardCls} shadow-card card-hover flex flex-col">
  <div class="relative h-60 shrink-0 overflow-hidden">
    <img src="${t.image}" alt="${ssEscape(t.name)} — ${ssEscape(t.specialty)}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
    <div class="absolute inset-0 bg-gradient-to-t from-forest-900/70 via-transparent to-transparent"></div>
    <span class="absolute top-3 start-3 inline-flex items-center gap-1 rounded-full bg-white/92 dark:bg-forest-900/85 px-2.5 py-1 text-[11px] font-medium text-forest-700 dark:text-gold-300">
      <i data-lucide="star" class="w-3 h-3 fill-gold-500 text-gold-500"></i>${Number(t.rating || 5).toFixed(1)}
    </span>
    <div class="absolute inset-x-0 bottom-0 p-4">
      <h3 class="font-display text-2xl font-semibold text-cream-50">${ssEscape(t.name)}</h3>
      <p class="text-xs uppercase tracking-wider text-gold-300">${ssEscape(t.specialty)}</p>
    </div>
  </div>
  <div class="p-5 flex flex-col flex-1">
    <div class="flex items-center gap-3 text-xs ${bodyCls}">
      <span class="inline-flex items-center gap-1.5"><i data-lucide="briefcase" class="w-3.5 h-3.5"></i>${t.experience} yrs experience</span>
      <span class="inline-flex items-center gap-1.5"><i data-lucide="calendar-days" class="w-3.5 h-3.5"></i>${(t.days || []).length} days/week</span>
    </div>
    <p class="mt-3 text-sm ${bodyCls} line-clamp-2">${ssEscape(t.bio || "")}</p>
    <ul class="mt-3 flex flex-wrap gap-1.5">
      ${(t.expertise || []).slice(0, 3).map(x => `<li class="rounded-full px-2.5 py-1 text-[11px] ${pillCls}">${ssEscape(x)}</li>`).join("")}
    </ul>
    <div class="mt-4 flex items-center gap-2 text-xs ${bodyCls}">
      <i data-lucide="calendar-check-2" class="w-4 h-4 text-sage-500"></i>
      <span>${(t.days || []).join(" · ") || "By appointment"}</span>
    </div>
    <div class="mt-auto"></div>
    <button type="button" data-action="book-therapist" data-id="${t.id}" class="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-forest-700 hover:bg-forest-600 dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-forest-900 text-cream-50 px-4 py-2.5 text-sm font-medium transition-colors">
      <i data-lucide="calendar-plus" class="w-4 h-4"></i>Book with Therapist
    </button>
  </div>
</article>`;
}

document.addEventListener("click", e => {
  const btn = e.target.closest('[data-action="book-therapist"]');
  if (!btn) return;
  e.preventDefault();
  if (!ssUser()) ssToast("Please sign in to book with a therapist.");
  location.href = ssBookTherapistHref(btn.dataset.id);
});

document.addEventListener("DOMContentLoaded", () => {
  const all = ssTherapists();

  const preview = document.getElementById("therapist-preview-grid");
  if (preview) {
    preview.innerHTML = all.filter(t => t.active !== false).slice(0, 3).map(t => ssTherapistCardHTML(t, { onDark: true })).join("");
    ssIcons();
    requestAnimationFrame(() => preview.querySelectorAll(".reveal").forEach(r => r.classList.add("is-visible")));
  }

  const grid = document.getElementById("therapist-grid");
  if (grid) {
    const render = list => {
      const empty = document.getElementById("therapist-empty");
      if (empty) empty.classList.toggle("hidden", list.length > 0);
      grid.innerHTML = list.map(t => ssTherapistCardHTML(t)).join("");
      ssIcons();
      requestAnimationFrame(() => grid.querySelectorAll(".reveal").forEach(r => r.classList.add("is-visible")));
    };
    render(all.filter(t => t.active !== false));

    const filterWrap = document.getElementById("therapist-filters");
    if (filterWrap) {
      const specs = ["All"].concat(Array.from(new Set(all.map(t => t.specialty.split(" & ")[0]))));
      filterWrap.innerHTML = specs.map((s, i) =>
        `<button type="button" data-spec="${ssEscape(s)}" class="therapist-chip rounded-full border px-4 py-2 text-sm font-medium transition-colors ${i === 0 ? "border-forest-700 bg-forest-700 text-cream-50 dark:bg-gold-500 dark:border-gold-500 dark:text-forest-900" : "border-sage-300 dark:border-sage-600 text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60"}">${ssEscape(s)}</button>`
      ).join("");
      filterWrap.addEventListener("click", ev => {
        const chip = ev.target.closest(".therapist-chip");
        if (!chip) return;
        const spec = chip.dataset.spec;
        filterWrap.querySelectorAll(".therapist-chip").forEach(c => {
          const on = c.dataset.spec === spec;
          c.className = "therapist-chip rounded-full border px-4 py-2 text-sm font-medium transition-colors " +
            (on ? "border-forest-700 bg-forest-700 text-cream-50 dark:bg-gold-500 dark:border-gold-500 dark:text-forest-900"
                : "border-sage-300 dark:border-sage-600 text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60");
        });
        render(spec === "All" ? all.filter(t => t.active !== false) : all.filter(t => t.active !== false && t.specialty.indexOf(spec) > -1));
      });
    }
  }
});
