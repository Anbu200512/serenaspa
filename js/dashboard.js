

(function () {
  "use strict";

  var VIEWS = ["overview", "book", "appointments", "preferences", "history", "membership", "payments", "notifications", "profile"];
  var MODALS = ["appt-modal", "member-modal", "receipt-modal"];
  var U = null;
  var currentView = "overview";
  var selectedTime = "";
  var apptFilter = "All";
  var pick = { appt: null, plan: null, receipt: null };
  var pendingPlan = "";

  function $(id) { return document.getElementById(id); }
  function esc(v) { return ssEscape(v); }
  function me() { var u = ssUser(); return u || U; }
  function today() { return ssTodayISO(); }

  function myAppts() {
    return ssAppointments().filter(function (a) { return a.userId === me().email; });
  }
  function myPayments() {
    return ssPayments().filter(function (p) { return p.userId === me().email; });
  }
  function myNotifs() {
    return ssNotifications().filter(function (n) { return n.userId === me().email; });
  }
  function unreadCount() {
    return myNotifs().filter(function (n) { return !n.read; }).length;
  }
  function sortApptsDesc(list) {
    return list.slice().sort(function (a, b) {
      if ((a.date || "") !== (b.date || "")) return a.date < b.date ? 1 : -1;
      if ((a.time || "") !== (b.time || "")) return (a.time || "") < (b.time || "") ? 1 : -1;
      return 0;
    });
  }
  function sortApptsAsc(list) {
    return list.slice().sort(function (a, b) {
      if ((a.date || "") !== (b.date || "")) return a.date > b.date ? 1 : -1;
      if ((a.time || "") !== (b.time || "")) return (a.time || "") > (b.time || "") ? 1 : -1;
      return 0;
    });
  }
  function isUpcoming(a) {
    return a.date >= today() && (a.status === "Confirmed" || a.status === "Pending");
  }
  function isHistoryRow(a) {
    return a.date < today() || a.status === "Completed" || a.status === "Cancelled";
  }
  function nextAppointment() {
    return sortApptsAsc(myAppts().filter(isUpcoming))[0] || null;
  }

  function apptBadge(status) {
    var s = String(status || "Pending");
    var cls = "bg-sage-100 text-sage-700 dark:bg-sage-700/70 dark:text-sage-100";
    if (s === "Confirmed") cls = "bg-forest-700 text-cream-50 dark:bg-forest-600 dark:text-cream-50";
    else if (s === "Pending") cls = "bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300";
    else if (s === "Cancelled") cls = "bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-300";
    return '<span class="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ' + cls + '">' + esc(s) + "</span>";
  }
  function payBadge(status) {
    var s = String(status || "Paid");
    var cls = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300";
    if (s === "Pending") cls = "bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300";
    else if (s === "Failed") cls = "bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-300";
    return '<span class="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ' + cls + '">' + esc(s) + "</span>";
  }
  function iconBox(icon) {
    return '<span class="grid place-items-center w-10 h-10 rounded-xl bg-sage-100 dark:bg-sage-700 text-forest-700 dark:text-gold-300"><i data-lucide="' + icon + '" class="w-5 h-5"></i></span>';
  }
  function statCard(icon, value, label) {
    return '<div class="rounded-2xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-4 shadow-card">' +
      iconBox(icon) +
      '<p class="mt-3 font-display text-3xl font-semibold text-forest-700 dark:text-cream-100">' + esc(value) + "</p>" +
      '<p class="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400">' + esc(label) + "</p>" +
      "</div>";
  }
  function detailRow(label, value) {
    return '<div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-sage-100 dark:border-sage-700/60 pb-2.5">' +
      '<dt class="text-xs font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400">' + esc(label) + "</dt>" +
      '<dd class="text-sm font-medium text-forest-700 dark:text-cream-100 text-end">' + value + "</dd></div>";
  }
  function emptyCard(icon, title, body, btnLabel, btnView) {
    return '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-8 text-center shadow-card">' +
      '<span class="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-sage-100 dark:bg-sage-700 text-forest-700 dark:text-gold-300"><i data-lucide="' + icon + '" class="w-6 h-6"></i></span>' +
      '<h2 class="mt-4 font-display text-xl font-semibold text-forest-700 dark:text-cream-100">' + esc(title) + "</h2>" +
      '<p class="mt-1 text-sm text-sage-600 dark:text-sage-300">' + esc(body) + "</p>" +
      (btnLabel ? '<button type="button" data-view="' + btnView + '" class="mt-5 inline-flex items-center gap-2 rounded-full bg-forest-700 hover:bg-forest-600 dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-forest-900 text-cream-50 px-6 py-3 text-sm font-medium transition-colors"><i data-lucide="calendar-plus" class="w-4 h-4"></i>' + esc(btnLabel) + "</button>" : "") +
      "</div>";
  }

  function memInfo() {
    var m = ssAccountMembership(me().email);
    if (!m) return { has: false };
    var plan = ssGetPlan(m.planId);
    var t = today();
    var remaining = Math.max(0, (m.sessions || 0) - (m.used || 0));
    var active = !!(m.expiry && m.expiry >= t);
    var daysLeft = m.expiry ? Math.max(0, Math.round((Date.parse(m.expiry) - Date.parse(t)) / 864e5)) : 0;
    return { has: true, m: m, plan: plan, sessions: m.sessions || 0, used: m.used || 0, remaining: remaining, active: active, daysLeft: daysLeft, expiry: m.expiry || "" };
  }
  function pricingInfo(t) {
    var info = memInfo();
    var covered = !!(info.has && info.plan && info.active && info.remaining > 0);
    var pct = covered ? (info.plan.discount || 0) : 0;
    var final = Math.round((t.price || 0) * (100 - pct) / 100);
    return { covered: covered, pct: pct, final: final, info: info };
  }

  function greetingWord() {
    var h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }
  function firstName() {
    var n = String(me().name || "there").trim().split(/\s+/)[0];
    return n || "there";
  }
  function initials(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "SS";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  function renderShell() {
    var u = me();
    var info = memInfo();
    var av = $("dash-avatar");
    if (av) av.textContent = initials(u.name);
    var un = $("dash-username");
    if (un) un.textContent = u.name || "Client";
    var plan = $("dash-plan");
    if (plan) plan.textContent = info.has && info.plan ? info.plan.name + " member" : "Pay as you go";
    var g = $("dash-greeting");
    if (g) g.textContent = greetingWord() + ", " + firstName();
    var d = $("dash-date");
    if (d) d.textContent = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    var badge = $("bell-badge");
    if (badge) badge.classList.toggle("hidden", unreadCount() === 0);
    var bell = $("bell-btn");
    if (bell) bell.setAttribute("aria-label", unreadCount() + " unread notifications");
  }
  function openDrawer() {
    var sb = $("dash-sidebar");
    var bd = $("dash-backdrop");
    var btn = $("sidebar-open");
    if (sb) sb.classList.add("open");
    if (bd) bd.classList.remove("hidden");
    if (btn) btn.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    var sb = $("dash-sidebar");
    var bd = $("dash-backdrop");
    var btn = $("sidebar-open");
    if (sb) sb.classList.remove("open");
    if (bd) bd.classList.add("hidden");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  function renderView(name) {
    if (name === "overview") renderOverview();
    else if (name === "book") renderBook();
    else if (name === "appointments") renderAppointments();
    else if (name === "preferences") renderPreferences();
    else if (name === "history") renderHistory();
    else if (name === "membership") renderMembership();
    else if (name === "payments") renderPayments();
    else if (name === "notifications") renderNotifications();
    else if (name === "profile") renderProfile();
  }
  function setView(name) {
    if (name === "logout") { doLogout(); return; }
    if (VIEWS.indexOf(name) === -1) name = "overview";
    currentView = name;
    document.querySelectorAll(".dash-view").forEach(function (sec) {
      sec.classList.toggle("hidden", sec.getAttribute("data-view") !== name);
    });
    document.querySelectorAll(".sidebar-link").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-view") === name);
    });
    closeDrawer();
    renderView(name);
    ssIcons();
    window.scrollTo(0, 0);
  }
  function renderAll() {
    renderShell();
    renderOverview();
    renderBook();
    renderAppointments();
    renderPreferences();
    renderHistory();
    renderMembership();
    renderPayments();
    renderNotifications();
    renderProfile();
    ssIcons();
  }

  var modalTimers = {};
  function openModal(id) {
    var m = $(id);
    if (!m) return;
    if (modalTimers[id]) { clearTimeout(modalTimers[id]); modalTimers[id] = null; }
    m.classList.remove("hidden");
    requestAnimationFrame(function () { m.classList.add("open"); });
    document.body.style.overflow = "hidden";
    ssIcons();
  }
  function closeModal(id) {
    var m = $(id);
    if (!m || m.classList.contains("hidden")) return;
    m.classList.remove("open");
    document.body.style.overflow = "";
    if (modalTimers[id]) clearTimeout(modalTimers[id]);
    modalTimers[id] = setTimeout(function () { modalTimers[id] = null; m.classList.add("hidden"); }, 220);
  }
  function closeAnyModal() {
    MODALS.forEach(function (id) { closeModal(id); });
  }

  function downloadText(filename, text) {
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  function defaultDateFor(therapistId) {
    var t = today();
    if (therapistId && ssDaySlots(therapistId, t).length) return t;
    for (var i = 1; i <= 14; i++) {
      var d = ssAddDaysISO(i);
      if (therapistId && ssDaySlots(therapistId, d).length) return d;
    }
    return t;
  }
  function doLogout() {
    try { localStorage.removeItem(SS_KEYS.user); } catch (e) {}
    location.href = "login.html";
  }

  function ovBanner(next) {
    var snippet;
    if (next) {
      snippet = '<div class="flex items-center gap-3">' +
        '<span class="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-white/15"><i data-lucide="calendar-check" class="w-5 h-5"></i></span>' +
        '<div class="min-w-0"><p class="text-sm font-semibold">Next: ' + esc(next.treatmentName) + " with " + esc(next.therapistName) + "</p>" +
        '<p class="text-xs text-sage-200">' + ssFmtDate(next.date) + " at " + esc(next.time) + "</p></div></div>";
    } else {
      snippet = '<div class="flex flex-wrap items-center gap-3">' +
        '<span class="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-white/15"><i data-lucide="calendar-x" class="w-5 h-5"></i></span>' +
        '<div class="min-w-0"><p class="text-sm font-semibold">No session booked yet</p>' +
        '<p class="text-xs text-sage-200">Your next quiet hour is one click away.</p></div>' +
        '<button type="button" data-view="book" class="ms-auto inline-flex items-center gap-2 rounded-full bg-gold-500 hover:bg-gold-400 text-forest-900 px-5 py-2.5 text-sm font-semibold transition-colors"><i data-lucide="calendar-plus" class="w-4 h-4"></i>Book now</button>' +
        "</div>";
    }
    return '<div class="rounded-3xl bg-gradient-to-br from-forest-700 via-forest-600 to-sage-500 dark:from-forest-800 dark:via-forest-700 dark:to-sage-700 p-6 sm:p-8 text-cream-50 shadow-lift">' +
      '<p class="text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">Your wellness plan</p>' +
      '<h2 class="mt-2 font-display text-3xl sm:text-4xl font-semibold">' + esc(greetingWord()) + ", " + esc(firstName()) + "</h2>" +
      '<div class="mt-4">' + snippet + "</div></div>";
  }

  function ovNextCard(next) {
    var head = '<div class="flex flex-wrap items-center justify-between gap-3">' +
      '<p class="text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 dark:text-sage-400">Next appointment</p>' +
      (next ? apptBadge(next.status) : "") + "</div>";
    if (!next) {
      return '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-5 sm:p-6 shadow-card">' + head +
        '<p class="mt-4 font-display text-xl font-semibold text-forest-700 dark:text-cream-100">Nothing on the calendar</p>' +
        '<p class="mt-1 text-sm text-sage-600 dark:text-sage-300">Book a treatment and your confirmed slot will appear here.</p>' +
        '<button type="button" data-view="book" class="mt-4 inline-flex items-center gap-2 rounded-full bg-forest-700 hover:bg-forest-600 dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-forest-900 text-cream-50 px-5 py-2.5 text-sm font-medium transition-colors"><i data-lucide="calendar-plus" class="w-4 h-4"></i>Book appointment</button>' +
        "</div>";
    }
    return '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-5 sm:p-6 shadow-card">' + head +
      '<p class="mt-3 font-display text-2xl font-semibold text-forest-700 dark:text-cream-100">' + esc(next.treatmentName) + "</p>" +
      '<div class="mt-3 grid gap-2.5 sm:grid-cols-2">' +
      '<p class="flex items-center gap-2 text-sm text-sage-600 dark:text-sage-300"><i data-lucide="user-round" class="w-4 h-4 text-sage-500"></i>' + esc(next.therapistName) + "</p>" +
      '<p class="flex items-center gap-2 text-sm text-sage-600 dark:text-sage-300"><i data-lucide="calendar-days" class="w-4 h-4 text-sage-500"></i>' + ssFmtDate(next.date) + "</p>" +
      '<p class="flex items-center gap-2 text-sm text-sage-600 dark:text-sage-300"><i data-lucide="clock-3" class="w-4 h-4 text-sage-500"></i>' + esc(next.time) + " · " + next.duration + " min</p>" +
      '<p class="flex items-center gap-2 text-sm text-sage-600 dark:text-sage-300"><i data-lucide="badge-dollar-sign" class="w-4 h-4 text-sage-500"></i>' + ssMoney(next.price) + "</p>" +
      "</div>" +
      '<div class="mt-5 flex flex-wrap gap-3">' +
      '<button type="button" data-view="appointments" class="rounded-full border border-sage-300 dark:border-sage-600 px-5 py-2.5 text-sm font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60 transition-colors">View appointments</button>' +
      '<button type="button" data-view="book" data-treatment="' + esc(next.treatmentId) + '" data-therapist="' + esc(next.therapistId) + '" class="inline-flex items-center gap-2 rounded-full bg-forest-700 hover:bg-forest-600 dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-forest-900 text-cream-50 px-5 py-2.5 text-sm font-medium transition-colors"><i data-lucide="refresh-cw" class="w-4 h-4"></i>Rebook</button>' +
      "</div></div>";
  }

  function ovMembershipCard() {
    var info = memInfo();
    var link = '<button type="button" data-view="membership" class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-forest-700 dark:text-gold-300 hover:underline">Open membership<i data-lucide="arrow-right" class="w-4 h-4"></i></button>';
    if (!info.has || !info.plan) {
      return '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-5 sm:p-6 shadow-card">' +
        '<p class="text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 dark:text-sage-400">Membership</p>' +
        '<p class="mt-3 font-display text-xl font-semibold text-forest-700 dark:text-cream-100">Pay as you go</p>' +
        '<p class="mt-1 text-sm text-sage-600 dark:text-sage-300">Link a monthly plan to unlock included sessions and member discounts.</p>' + link + "</div>";
    }
    var pct = info.sessions ? Math.round((info.used / info.sessions) * 100) : 0;
    var pill = info.active
      ? '<span class="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300 px-2.5 py-1 text-[11px] font-semibold">Active</span>'
      : '<span class="inline-flex items-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-300 px-2.5 py-1 text-[11px] font-semibold">Expired</span>';
    return '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-5 sm:p-6 shadow-card">' +
      '<div class="flex flex-wrap items-center justify-between gap-3">' +
      '<p class="text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 dark:text-sage-400">Membership</p>' + pill + "</div>" +
      '<div class="mt-3 flex flex-wrap items-baseline justify-between gap-2">' +
      '<p class="font-display text-2xl font-semibold text-forest-700 dark:text-cream-100">' + esc(info.plan.name) + "</p>" +
      '<p class="text-sm text-sage-600 dark:text-sage-300">' + info.sessions + " included · " + info.used + " used · " + info.remaining + " left</p></div>" +
      '<div class="mt-3 h-2 rounded-full bg-sage-100 dark:bg-sage-700 overflow-hidden"><div class="h-full rounded-full bg-gold-500 transition-all" style="width:' + pct + '%"></div></div>' +
      '<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-sage-600 dark:text-sage-300">' +
      '<span class="inline-flex items-center gap-1.5"><i data-lucide="calendar-clock" class="w-4 h-4 text-sage-500"></i>Expires ' + ssFmtDate(info.expiry) + "</span>" +
      "<span>" + info.daysLeft + " day" + (info.daysLeft === 1 ? "" : "s") + " left</span></div>" + link + "</div>";
  }

  function ovPendingCard(pending, total) {
    if (!pending.length) return "";
    return '<div class="rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-4 flex flex-wrap items-center gap-3">' +
      '<span class="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300"><i data-lucide="circle-alert" class="w-5 h-5"></i></span>' +
      '<div class="min-w-0 flex-1"><p class="text-sm font-semibold text-amber-800 dark:text-amber-200">Pending payment: ' + ssMoney(total) + "</p>" +
      '<p class="text-xs text-amber-700 dark:text-amber-300">Pay at spa - settle at the front desk after your visit.</p></div>' +
      '<button type="button" data-view="payments" class="rounded-full border border-amber-400/70 dark:border-amber-400/50 px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">View payments</button>' +
      "</div>";
  }

  function ovNotifList(list) {
    var head = '<div class="flex flex-wrap items-center justify-between gap-3">' +
      '<p class="text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 dark:text-sage-400">Recent notifications</p>' +
      '<button type="button" data-view="notifications" class="text-sm font-medium text-forest-700 dark:text-gold-300 hover:underline">View all</button></div>';
    if (!list.length) {
      return '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-5 shadow-card">' + head +
        '<p class="mt-3 text-sm text-sage-600 dark:text-sage-300">Nothing yet - your updates will show up here.</p></div>';
    }
    var rows = list.map(function (n) {
      return '<div class="flex items-start gap-3 rounded-2xl border border-sage-100 dark:border-sage-700/60 bg-sage-50 dark:bg-forest-900/50 p-3.5">' +
        '<span class="mt-1.5 w-2 h-2 shrink-0 rounded-full ' + (n.read ? "bg-sage-300 dark:bg-sage-600" : "bg-gold-500") + '"></span>' +
        '<div class="min-w-0"><p class="text-sm ' + (n.read ? "text-sage-600 dark:text-sage-300" : "font-semibold text-forest-700 dark:text-cream-100") + '">' + esc(n.title) + "</p>" +
        '<p class="mt-0.5 text-xs text-sage-500 dark:text-sage-400 line-clamp-2">' + esc(n.body) + "</p>" +
        '<p class="mt-1 text-[11px] text-sage-400 dark:text-sage-500">' + ssTimeAgo(n.ts) + "</p></div></div>";
    }).join("");
    return '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-5 shadow-card space-y-3">' + head + rows + "</div>";
  }

  function renderOverview() {
    var root = $("ov-body");
    if (!root) return;
    var appts = myAppts();
    var next = nextAppointment();
    var info = memInfo();
    var pays = myPayments();
    var completed = appts.filter(function (a) { return a.status === "Completed"; });
    var upcoming = appts.filter(isUpcoming);
    var paid = pays.filter(function (p) { return p.status === "Paid"; });
    var pending = pays.filter(function (p) { return p.status === "Pending"; });
    var spend = paid.reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);
    var pendingTotal = pending.reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);
    var recent = myNotifs().slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 3);

    root.innerHTML =
      ovBanner(next) +
      '<div class="grid gap-5 lg:grid-cols-2">' + ovNextCard(next) + ovMembershipCard() + "</div>" +
      '<div class="grid gap-4 grid-cols-2 xl:grid-cols-4">' +
      statCard("calendar-clock", String(upcoming.length), "Upcoming appointments") +
      statCard("circle-check", String(completed.length), "Completed sessions") +
      statCard("gem", info.has ? String(info.remaining) : "0", "Sessions remaining") +
      statCard("wallet", ssMoney(spend), "Total spend") +
      "</div>" +
      ovPendingCard(pending, pendingTotal) +
      ovNotifList(recent);
    ssIcons();
  }

  function renderBook() {
    var tSel = $("bk-treatment");
    var thSel = $("bk-therapist");
    var dateEl = $("bk-date");
    if (!tSel || !thSel || !dateEl) return;
    var tVal = tSel.value;
    var thVal = thSel.value;
    var treatments = ssTreatments();
    var active = ssTherapists().filter(function (t) { return t.active !== false; });
    tSel.innerHTML = '<option value="">Choose a treatment</option>' + treatments.map(function (t) {
      return '<option value="' + t.id + '">' + esc(t.name) + " - " + t.duration + " min - from " + ssMoney(t.price) + "</option>";
    }).join("");
    thSel.innerHTML = '<option value="">Choose a therapist</option>' + active.map(function (t) {
      return '<option value="' + t.id + '">' + esc(t.name) + " - " + esc(t.specialty) + "</option>";
    }).join("");
    if (tVal && ssGetTreatment(tVal)) tSel.value = tVal;
    if (thVal && ssGetTherapist(thVal)) thSel.value = thVal;
    dateEl.min = today();
    if (!dateEl.value) dateEl.value = defaultDateFor(thSel.value);
    renderTreatmentSummary();
    renderTherapistCard();
    renderSlots();
    renderPrice();
    ssIcons();
  }

  function initBook(pTreat, pTher) {
    var tSel = $("bk-treatment");
    var thSel = $("bk-therapist");
    var dateEl = $("bk-date");
    if (!tSel || !thSel || !dateEl) return;
    renderBook();
    var prefs = ssPreferences();
    var active = ssTherapists().filter(function (t) { return t.active !== false; });
    var thId = "";
    if (pTher && active.some(function (t) { return t.id === pTher; })) thId = pTher;
    else if (prefs.therapistId && active.some(function (t) { return t.id === prefs.therapistId; })) thId = prefs.therapistId;
    else if (active.length) thId = active[0].id;
    if (thId) thSel.value = thId;
    if (pTreat && ssGetTreatment(pTreat)) tSel.value = pTreat;
    dateEl.value = defaultDateFor(thSel.value);
    tSel.addEventListener("change", function () { selectedTime = ""; renderBook(); });
    thSel.addEventListener("change", function () { selectedTime = ""; renderBook(); });
    dateEl.addEventListener("change", function () { selectedTime = ""; renderBook(); });
    renderBook();
  }

  function prefillBook(treatmentId, therapistId) {
    var tSel = $("bk-treatment");
    var thSel = $("bk-therapist");
    var dateEl = $("bk-date");
    if (!tSel || !thSel || !dateEl) return;
    if (treatmentId && ssGetTreatment(treatmentId)) tSel.value = treatmentId;
    if (therapistId && ssGetTherapist(therapistId)) thSel.value = therapistId;
    selectedTime = "";
    if (!dateEl.value || (thSel.value && !ssDaySlots(thSel.value, dateEl.value).length)) {
      dateEl.value = defaultDateFor(thSel.value);
    }
    renderBook();
  }

  function slotHint(text) {
    return '<div class="rounded-xl border border-dashed border-sage-300 dark:border-sage-600 bg-sage-50 dark:bg-forest-900/50 px-4 py-3 text-sm text-sage-600 dark:text-sage-300">' + esc(text) + "</div>";
  }

  function renderTreatmentSummary() {
    var wrap = $("bk-treatment-summary");
    if (!wrap) return;
    var t = ssGetTreatment($("bk-treatment").value);
    if (!t) {
      wrap.innerHTML = slotHint("Choose a treatment to see its description, benefits and price.");
      return;
    }
    wrap.innerHTML = '<div class="rounded-2xl border border-sage-100 dark:border-sage-700/60 bg-sage-50 dark:bg-forest-900/50 p-4 flex flex-col sm:flex-row gap-4">' +
      '<img src="' + t.image + '" alt="' + esc(t.name) + '" loading="lazy" class="w-full sm:w-32 h-40 sm:h-auto rounded-xl object-cover shrink-0" />' +
      '<div class="min-w-0">' +
      '<div class="flex flex-wrap items-center gap-2">' +
      '<h3 class="font-display text-xl font-semibold text-forest-700 dark:text-cream-100">' + esc(t.name) + "</h3>" +
      '<span class="rounded-full bg-white dark:bg-forest-800 px-2.5 py-1 text-[11px] font-medium text-sage-600 dark:text-sage-300">' + t.duration + " min</span>" +
      '<span class="rounded-full bg-forest-700 dark:bg-gold-500 text-cream-50 dark:text-forest-900 px-2.5 py-1 text-[11px] font-medium">' + ssMoney(t.price) + "</span>" +
      "</div>" +
      '<p class="mt-2 text-sm leading-relaxed text-sage-600 dark:text-sage-300">' + esc(t.desc) + "</p>" +
      '<ul class="mt-3 flex flex-wrap gap-1.5">' + (t.benefits || []).map(function (b) {
        return '<li class="rounded-full bg-white dark:bg-forest-800 px-2.5 py-1 text-[11px] text-sage-600 dark:text-sage-200">' + esc(b) + "</li>";
      }).join("") + "</ul></div></div>";
  }

  function renderTherapistCard() {
    var wrap = $("bk-therapist-card");
    if (!wrap) return;
    var th = ssGetTherapist($("bk-therapist").value);
    if (!th) {
      wrap.innerHTML = slotHint("Choose a therapist to see their profile and availability.");
      return;
    }
    var t = ssGetTreatment($("bk-treatment").value);
    var match = !!(t && (th.expertise || []).indexOf(t.name) > -1);
    wrap.innerHTML = '<div class="rounded-2xl border border-sage-100 dark:border-sage-700/60 bg-sage-50 dark:bg-forest-900/50 p-4 flex flex-col sm:flex-row gap-4">' +
      '<img src="' + th.image + '" alt="' + esc(th.name) + '" loading="lazy" class="w-full sm:w-32 h-40 sm:h-auto rounded-xl object-cover shrink-0" />' +
      '<div class="min-w-0">' +
      '<div class="flex flex-wrap items-center gap-2">' +
      '<h3 class="font-display text-xl font-semibold text-forest-700 dark:text-cream-100">' + esc(th.name) + "</h3>" +
      (match ? '<span class="inline-flex items-center gap-1 rounded-full bg-gold-500/20 dark:bg-gold-500/25 px-2.5 py-1 text-[11px] font-semibold text-gold-700 dark:text-gold-300"><i data-lucide="sparkles" class="w-3 h-3"></i>Great match</span>' : "") +
      "</div>" +
      '<p class="mt-1 text-xs uppercase tracking-wider text-sage-500 dark:text-sage-400">' + esc(th.specialty) + "</p>" +
      '<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-sage-600 dark:text-sage-300">' +
      '<span class="inline-flex items-center gap-1.5"><i data-lucide="briefcase" class="w-3.5 h-3.5"></i>' + th.experience + " yrs experience</span>" +
      '<span class="inline-flex items-center gap-1.5"><i data-lucide="star" class="w-3.5 h-3.5 fill-gold-500 text-gold-500"></i>' + Number(th.rating || 5).toFixed(1) + "</span>" +
      "</div>" +
      '<p class="mt-2 text-xs text-sage-500 dark:text-sage-400">Available: ' + esc((th.days || []).join(" · ") || "By appointment") + "</p>" +
      '<ul class="mt-3 flex flex-wrap gap-1.5">' + (th.expertise || []).map(function (x) {
        return '<li class="rounded-full bg-white dark:bg-forest-800 px-2.5 py-1 text-[11px] text-sage-600 dark:text-sage-200">' + esc(x) + "</li>";
      }).join("") + "</ul></div></div>";
  }

  function renderSlots() {
    var wrap = $("bk-slots");
    var thSel = $("bk-therapist");
    var dateEl = $("bk-date");
    if (!wrap || !thSel || !dateEl) return;
    var thId = thSel.value;
    var date = dateEl.value;
    if (!thId) { wrap.innerHTML = slotHint("Choose a therapist to see available times."); return; }
    if (!date) { wrap.innerHTML = slotHint("Pick a date to see available times."); return; }
    if (!ssIsDayAvailable(thId, date)) {
      wrap.innerHTML = slotHint("Therapist is off on " + ssDayName(date) + " - pick another date.");
      return;
    }
    var slots = ssDaySlots(thId, date);
    if (selectedTime && slots.indexOf(selectedTime) === -1) selectedTime = "";
    if (!slots.length) {
      wrap.innerHTML = slotHint("No free slots left on " + ssFmtDate(date) + " - try another date.");
      return;
    }
    wrap.innerHTML = '<div class="flex flex-wrap gap-2">' + slots.map(function (s) {
      var on = s === selectedTime;
      return '<button type="button" data-action="pick-slot" data-time="' + s + '" class="rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ' +
        (on
          ? "border-forest-700 bg-forest-700 text-cream-50 dark:border-gold-500 dark:bg-gold-500 dark:text-forest-900"
          : "border-sage-200 dark:border-sage-600 text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60") +
        '">' + s + "</button>";
    }).join("") + "</div>";
  }

  function renderPrice() {
    var wrap = $("bk-price");
    if (!wrap) return;
    var t = ssGetTreatment($("bk-treatment").value);
    if (!t) {
      wrap.innerHTML = '<p class="text-sm text-sage-500 dark:text-sage-400">Select a treatment to see the price breakdown.</p>';
      return;
    }
    var p = pricingInfo(t);
    var rows = detailRow("Treatment", ssMoney(t.price));
    if (p.covered) rows += detailRow("Member discount (" + esc(p.info.plan.name) + " " + p.pct + "%)", "-" + ssMoney(t.price - p.final));
    rows += detailRow("Total due", '<span class="font-display text-2xl font-semibold text-forest-700 dark:text-gold-300">' + ssMoney(p.final) + "</span>");
    var note;
    if (p.covered) {
      var left = p.info.remaining - 1;
      note = "A membership session will be used - " + left + " session" + (left === 1 ? "" : "s") + " remaining after this booking.";
    } else if (p.info.has && !p.info.active) {
      note = "Your membership expired on " + ssFmtDate(p.info.expiry) + " - renew to unlock member pricing.";
    } else if (p.info.has && p.info.remaining === 0) {
      note = "All sessions used this cycle - they refresh on " + ssFmtDate(p.info.expiry) + ".";
    } else {
      note = "Pay at spa after your visit.";
    }
    wrap.innerHTML = '<dl class="space-y-2.5">' + rows + "</dl>" +
      '<p class="mt-3 rounded-xl bg-sage-50 dark:bg-forest-900/50 border border-sage-100 dark:border-sage-700/60 px-3.5 py-2.5 text-xs leading-relaxed text-sage-600 dark:text-sage-300">' + esc(note) + "</p>";
  }

  function confirmBooking() {
    var tSel = $("bk-treatment");
    var thSel = $("bk-therapist");
    var dateEl = $("bk-date");
    var noteEl = $("bk-note");
    var tId = tSel ? tSel.value : "";
    var thId = thSel ? thSel.value : "";
    var date = dateEl ? dateEl.value : "";
    var time = selectedTime;
    if (!tId) { ssToast("Please choose a treatment.", "error"); return; }
    if (!thId) { ssToast("Please choose a therapist.", "error"); return; }
    if (!date) { ssToast("Please pick a date.", "error"); return; }
    if (date < today()) { ssToast("Please pick a date from today onwards.", "error"); return; }
    if (!time) { ssToast("Please pick a time slot.", "error"); return; }
    var t = ssGetTreatment(tId);
    var th = ssGetTherapist(thId);
    if (!t || !th) { ssToast("Something went wrong - please try again.", "error"); return; }
    if (!ssIsDayAvailable(thId, date)) {
      ssToast("Therapist is off on " + ssDayName(date) + " - pick another date.", "error");
      selectedTime = "";
      renderSlots();
      return;
    }
    if (ssDaySlots(thId, date).indexOf(time) === -1) {
      ssToast("That slot was just taken - please pick another time.", "error");
      selectedTime = "";
      renderSlots();
      return;
    }
    var price = pricingInfo(t);
    var covered = price.covered;
    var appt = {
      id: ssId("APT"),
      userId: me().email,
      clientName: me().name,
      treatmentId: t.id,
      treatmentName: t.name,
      therapistId: th.id,
      therapistName: th.name,
      date: date,
      time: time,
      duration: t.duration,
      price: price.final,
      status: "Confirmed",
      preference: noteEl ? noteEl.value.trim() : "",
      coveredByMembership: covered,
      createdAt: Date.now()
    };
    var list = ssAppointments();
    list.push(appt);
    ssSet(SS_KEYS.appointments, list);

    if (covered) {
      var m = ssAccountMembership(me().email);
      if (m) {
        var updated = Object.assign({}, m, { used: (m.used || 0) + 1 });
        ssUpdateAccount(me().email, { membership: updated });
        var left = Math.max(0, (updated.sessions || 0) - updated.used);
        ssAddNotification(me().email, "Membership session used", left + " session" + (left === 1 ? "" : "s") + " remaining this cycle.");
      }
    } else {
      ssAddPayment({
        userId: me().email,
        clientName: me().name,
        date: today(),
        service: t.name + " · " + t.duration + " min",
        amount: price.final,
        method: "Pay at spa",
        status: "Pending",
        type: "treatment"
      });
    }
    ssAddNotification(me().email, "Appointment confirmed", t.name + " with " + th.name + " is booked for " + ssFmtDate(date) + " at " + time + ".");
    ssToast("Appointment confirmed - see you at the spa.", "success");
    selectedTime = "";
    if (noteEl) noteEl.value = "";
    renderAll();
    setView("appointments");
  }

  function apptMatchesFilter(a) {
    if (apptFilter === "Upcoming") return isUpcoming(a);
    if (apptFilter === "Past") return a.date < today() && a.status !== "Cancelled";
    if (apptFilter === "Cancelled") return a.status === "Cancelled";
    return true;
  }
  function apptRow(a) {
    var canCancel = isUpcoming(a) && (a.status === "Confirmed" || a.status === "Pending");
    var actions = '<div class="flex flex-wrap justify-end gap-2">';
    if (canCancel) {
      actions += '<button type="button" data-action="cancel-appt" data-id="' + a.id + '" class="rounded-full border border-red-200 dark:border-red-500/40 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Cancel</button>';
    }
    actions += '<button type="button" data-action="appt-details" data-id="' + a.id + '" class="rounded-full border border-sage-300 dark:border-sage-600 px-4 py-2 text-xs font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60 transition-colors">Details</button></div>';
    return "<tr>" +
      '<td data-label="Date">' + ssFmtDate(a.date) + "</td>" +
      '<td data-label="Time">' + esc(a.time) + "</td>" +
      '<td data-label="Treatment">' + esc(a.treatmentName) + "</td>" +
      '<td data-label="Therapist">' + esc(a.therapistName) + "</td>" +
      '<td data-label="Price">' + ssMoney(a.price) + "</td>" +
      '<td data-label="Status">' + apptBadge(a.status) + "</td>" +
      '<td data-label="Actions">' + actions + "</td></tr>";
  }
  function renderAppointments() {
    var wrap = $("appt-rows");
    if (!wrap) return;
    var all = sortApptsDesc(myAppts());
    var rows = all.filter(apptMatchesFilter);
    wrap.innerHTML = rows.map(apptRow).join("");
    var isEmpty = rows.length === 0;
    var table = $("appt-table-wrap");
    var empty = $("appt-empty");
    if (table) table.classList.toggle("hidden", isEmpty);
    if (empty) empty.classList.toggle("hidden", !isEmpty);
    document.querySelectorAll("#appt-filters .appt-chip").forEach(function (chip) {
      var on = chip.getAttribute("data-filter") === apptFilter;
      chip.className = "appt-chip rounded-full border px-4 py-2 text-sm font-medium transition-colors " +
        (on
          ? "border-forest-700 bg-forest-700 text-cream-50 dark:bg-gold-500 dark:border-gold-500 dark:text-forest-900"
          : "border-sage-300 dark:border-sage-600 text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60");
    });
    ssIcons();
  }
  function cancelAppt(id) {
    var list = ssAppointments();
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { idx = i; break; } }
    if (idx === -1) { ssToast("That appointment no longer exists.", "error"); return; }
    var a = list[idx];
    if (!(a.date >= today() && (a.status === "Confirmed" || a.status === "Pending"))) {
      ssToast("This appointment can no longer be cancelled.", "error");
      return;
    }
    list[idx] = Object.assign({}, a, { status: "Cancelled" });
    ssSet(SS_KEYS.appointments, list);
    ssAddNotification(me().email, "Appointment cancelled", a.treatmentName + " on " + ssFmtDate(a.date) + " at " + a.time + " was cancelled. The slot is free again.");
    ssToast("Appointment cancelled.", "success");
    renderAll();
  }
  function openApptModal(id) {
    var list = myAppts();
    var a = null;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { a = list[i]; break; } }
    if (!a) { ssToast("Appointment details are unavailable.", "error"); return; }
    pick.appt = a;
    var title = $("am-title");
    if (title) title.textContent = a.treatmentName;
    var body = $("am-body");
    if (body) {
      body.innerHTML =
        detailRow("Booking ID", esc(a.id)) +
        detailRow("Date", ssFmtDate(a.date)) +
        detailRow("Time", esc(a.time) + " · " + a.duration + " min") +
        detailRow("Therapist", esc(a.therapistName)) +
        detailRow("Price", ssMoney(a.price)) +
        detailRow("Covered by membership", a.coveredByMembership ? "Yes - one session used" : "No") +
        detailRow("Status", apptBadge(a.status)) +
        detailRow("Preference", a.preference ? esc(a.preference) : "<span class='text-sage-500 dark:text-sage-400'>None given</span>") +
        detailRow("Booked", ssTimeAgo(a.createdAt || Date.now()));
    }
    openModal("appt-modal");
  }

  function renderPreferences() {
    var sel = $("pf-therapist");
    var timeEl = $("pf-time");
    var notes = $("pf-notes");
    var prefs = ssPreferences();
    if (sel) {
      var current = sel.value || prefs.therapistId || "";
      var active = ssTherapists().filter(function (t) { return t.active !== false; });
      sel.innerHTML = '<option value="">No preference</option>' + active.map(function (t) {
        return '<option value="' + t.id + '">' + esc(t.name) + " - " + esc(t.specialty) + "</option>";
      }).join("");
      if (current && ssGetTherapist(current)) sel.value = current;
    }
    if (timeEl && prefs.preferredTime) timeEl.value = prefs.preferredTime;
    if (notes && document.activeElement !== notes) notes.value = prefs.notes || "";

    var favWrap = $("pf-fav");
    if (favWrap) {
      var th = ssGetTherapist(prefs.therapistId);
      if (!th) {
        favWrap.innerHTML = slotHint("No favourite therapist saved yet - pick one in the form and your bookings will pre-select them.");
      } else {
        favWrap.innerHTML = '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 overflow-hidden shadow-card">' +
          '<img src="' + th.image + '" alt="' + esc(th.name) + '" loading="lazy" class="w-full h-44 object-cover" />' +
          '<div class="p-5">' +
          '<h2 class="font-display text-xl font-semibold text-forest-700 dark:text-cream-100">' + esc(th.name) + "</h2>" +
          '<p class="text-xs uppercase tracking-wider text-sage-500 dark:text-sage-400">' + esc(th.specialty) + "</p>" +
          '<p class="mt-3 flex items-center gap-2 text-sm text-sage-600 dark:text-sage-300"><i data-lucide="calendar-check-2" class="w-4 h-4 text-sage-500"></i>' + esc((th.days || []).join(" · ") || "By appointment") + "</p>" +
          '<p class="mt-3 text-sm leading-relaxed text-sage-600 dark:text-sage-300 line-clamp-3">' + esc(th.bio || "") + "</p>" +
          '<button type="button" data-view="book" data-therapist="' + th.id + '" class="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-forest-700 hover:bg-forest-600 dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-forest-900 text-cream-50 px-4 py-2.5 text-sm font-medium transition-colors"><i data-lucide="calendar-plus" class="w-4 h-4"></i>Book</button>' +
          "</div></div>" +
          '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-5 shadow-card">' +
          '<p class="text-xs font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400">How this helps</p>' +
          '<p class="mt-2 text-sm leading-relaxed text-sage-600 dark:text-sage-300">Bookings pre-select this therapist for you, so reserving your usual slot takes two clicks. Change your favourite any time and the next booking will follow it.</p>' +
          "</div>";
      }
    }
    ssIcons();
  }
  function savePreferences() {
    var sel = $("pf-therapist");
    var timeEl = $("pf-time");
    var notes = $("pf-notes");
    var prefs = ssPreferences();
    var next = Object.assign({}, prefs, {
      therapistId: sel ? sel.value : "",
      preferredTime: timeEl ? timeEl.value : "",
      notes: notes ? notes.value.trim() : ""
    });
    ssSet(SS_KEYS.preferences, next);
    ssToast("Preferences saved - your therapist is pre-selected when you book.", "success");
    renderPreferences();
  }

  function renderHistory() {
    var rowsWrap = $("hist-rows");
    if (!rowsWrap) return;
    var rows = sortApptsDesc(myAppts().filter(isHistoryRow));
    var completed = rows.filter(function (a) { return a.status === "Completed"; });
    var counts = {};
    rows.forEach(function (a) { counts[a.treatmentName] = (counts[a.treatmentName] || 0) + 1; });
    var favourite = "—";
    var best = 0;
    Object.keys(counts).forEach(function (k) {
      if (counts[k] > best) { best = counts[k]; favourite = k; }
    });
    if (favourite.length > 22) favourite = favourite.slice(0, 21) + "...";
    var minutes = completed.reduce(function (s, a) { return s + Number(a.duration || 0); }, 0);
    var hours = Math.round((minutes / 60) * 10) / 10;

    var summary = $("hist-summary");
    if (summary) {
      summary.innerHTML =
        statCard("circle-check", String(completed.length), "Sessions completed") +
        statCard("heart", String(rows.length), "Archived sessions") +
        statCard("sparkles", favourite, "Favourite treatment") +
        statCard("clock-3", hours + " h", "Total hours");
    }

    rowsWrap.innerHTML = rows.map(function (a) {
      return "<tr>" +
        '<td data-label="Treatment">' + esc(a.treatmentName) + "</td>" +
        '<td data-label="Therapist">' + esc(a.therapistName) + "</td>" +
        '<td data-label="Date">' + ssFmtDate(a.date) + "</td>" +
        '<td data-label="Duration">' + a.duration + " min</td>" +
        '<td data-label="Status">' + apptBadge(a.status) + "</td>" +
        '<td data-label="Action"><div class="flex flex-wrap justify-end">' +
        '<button type="button" data-view="book" data-treatment="' + esc(a.treatmentId) + '" data-therapist="' + esc(a.therapistId) + '" class="inline-flex items-center gap-1.5 rounded-full bg-forest-700 hover:bg-forest-600 dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-forest-900 text-cream-50 px-4 py-2 text-xs font-medium transition-colors"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>Rebook</button>' +
        "</div></td></tr>";
    }).join("");

    var isEmpty = rows.length === 0;
    var table = $("hist-table-wrap");
    var empty = $("hist-empty");
    if (table) table.classList.toggle("hidden", isEmpty);
    if (empty) empty.classList.toggle("hidden", !isEmpty);
    ssIcons();
  }

  function memCurrentCard(info) {
    var plan = info.plan;
    var pct = info.sessions ? Math.round((info.used / info.sessions) * 100) : 0;
    var pill = info.active
      ? '<span class="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300 px-3 py-1 text-[11px] font-semibold">Active</span>'
      : '<span class="inline-flex items-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-300 px-3 py-1 text-[11px] font-semibold">Expired</span>';
    return '<div class="rounded-3xl bg-gradient-to-br from-forest-700 to-sage-600 dark:from-forest-800 dark:to-sage-700 p-6 sm:p-7 text-cream-50 shadow-lift">' +
      '<div class="flex flex-wrap items-start justify-between gap-3">' +
      '<div><p class="text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">Current plan</p>' +
      '<h2 class="mt-1 font-display text-3xl font-semibold">' + esc(plan ? plan.name : "Membership") + "</h2></div>" + pill + "</div>" +
      '<div class="mt-4 grid gap-3 sm:grid-cols-3">' +
      '<div class="rounded-2xl bg-white/10 p-3.5"><p class="text-[11px] uppercase tracking-wider text-sage-200">Price</p>' +
      '<p class="mt-1 font-display text-2xl font-semibold">' + ssMoney(plan ? plan.price : 0) + '<span class="text-xs font-sans text-sage-300">/mo</span></p></div>' +
      '<div class="rounded-2xl bg-white/10 p-3.5"><p class="text-[11px] uppercase tracking-wider text-sage-200">Validity</p>' +
      '<p class="mt-1 font-display text-2xl font-semibold">' + esc(plan ? plan.validity : "30 days per cycle") + "</p></div>" +
      '<div class="rounded-2xl bg-white/10 p-3.5"><p class="text-[11px] uppercase tracking-wider text-sage-200">Discount</p>' +
      '<p class="mt-1 font-display text-2xl font-semibold">' + (plan ? plan.discount : 0) + '% off</p></div>' +
      "</div>" +
      '<div class="mt-5"><div class="flex flex-wrap items-baseline justify-between gap-2 text-sm">' +
      "<span>" + info.sessions + " included · " + info.used + " used · <strong>" + info.remaining + " remaining</strong></span>" +
      "<span>Expires " + ssFmtDate(info.expiry) + " · " + info.daysLeft + " day" + (info.daysLeft === 1 ? "" : "s") + " left</span></div>" +
      '<div class="mt-2 h-2.5 rounded-full bg-white/20 overflow-hidden"><div class="h-full rounded-full bg-gold-400 transition-all" style="width:' + pct + '%"></div></div></div>' +
      "</div>";
  }
  function memUpsellCard() {
    return '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-6 sm:p-7 shadow-card">' +
      '<p class="text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 dark:text-sage-400">Membership</p>' +
      '<h2 class="mt-2 font-display text-2xl sm:text-3xl font-semibold text-forest-700 dark:text-cream-100">You are on pay-as-you-go</h2>' +
      '<p class="mt-2 max-w-xl text-sm leading-relaxed text-sage-600 dark:text-sage-300">Pick a monthly plan below to lock in included sessions, member pricing on extras and priority booking. You can switch or renew any time.</p>' +
      "</div>";
  }
  function planCard(p) {
    var info = memInfo();
    var isCurrent = !!(info.has && info.m && info.m.planId === p.id);
    return '<div id="plan-' + p.id + '" class="rounded-3xl bg-white dark:bg-forest-800 border ' +
      (p.popular ? "border-gold-400 ring-2 ring-gold-400/60 dark:ring-gold-500/60 " : "border-sage-100 dark:border-sage-700/60 ") +
      'p-5 shadow-card flex flex-col">' +
      '<div class="flex items-center justify-between gap-2">' +
      '<h3 class="font-display text-xl font-semibold text-forest-700 dark:text-cream-100">' + esc(p.name) + "</h3>" +
      (p.popular ? '<span class="rounded-full bg-gold-500 text-forest-900 px-2.5 py-0.5 text-[11px] font-semibold">Popular</span>' : "") +
      (isCurrent ? '<span class="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-semibold">Current</span>' : "") +
      "</div>" +
      '<p class="mt-2 font-display text-3xl font-semibold text-gold-600 dark:text-gold-300">' + ssMoney(p.price) + '<span class="text-xs font-sans text-sage-500 dark:text-sage-400">/mo</span></p>' +
      '<p class="mt-1 text-xs text-sage-500 dark:text-sage-400">' + p.sessions + " sessions · " + p.discount + "% off extras · " + esc(p.validity) + "</p>" +
      '<ul class="mt-3 space-y-1.5 text-sm text-sage-600 dark:text-sage-300">' +
      (p.benefits || []).slice(0, 4).map(function (b) {
        return '<li class="flex items-start gap-2"><i data-lucide="check" class="w-4 h-4 mt-0.5 shrink-0 text-sage-500"></i><span>' + esc(b) + "</span></li>";
      }).join("") + "</ul>" +
      '<button type="button" data-action="choose-plan" data-id="' + p.id + '" class="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full ' +
      (isCurrent
        ? "border border-sage-300 dark:border-sage-600 text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60"
        : "bg-forest-700 hover:bg-forest-600 dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-forest-900 text-cream-50") +
      ' px-4 py-2.5 text-sm font-medium transition-colors"><i data-lucide="' + (isCurrent ? "refresh-cw" : "arrow-right") + '" class="w-4 h-4"></i>' +
      (isCurrent ? "Renew" : "Switch to this plan") + "</button></div>";
  }
  function renderMembership() {
    var cur = $("mem-current");
    var grid = $("mem-plans");
    if (!cur || !grid) return;
    var info = memInfo();
    cur.innerHTML = info.has ? memCurrentCard(info) : memUpsellCard();
    grid.innerHTML = ssMemberships().map(planCard).join("");
    ssIcons();
    if (pendingPlan && currentView === "membership") {
      var target = $("plan-" + pendingPlan);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("ring-4", "ring-gold-500/70");
        setTimeout(function () { target.classList.remove("ring-4", "ring-gold-500/70"); }, 2600);
      }
      pendingPlan = "";
    }
  }
  function openMemberModal(planId) {
    var plan = ssGetPlan(planId);
    if (!plan) { ssToast("That plan is unavailable.", "error"); return; }
    pick.plan = plan;
    var title = $("mm-title");
    if (title) title.textContent = plan.name + " plan";
    var body = $("mm-body");
    if (body) {
      body.innerHTML =
        detailRow("Price", ssMoney(plan.price) + " / month") +
        detailRow("Sessions included", String(plan.sessions)) +
        detailRow("Member discount", plan.discount + "% off extras") +
        detailRow("Validity", esc(plan.validity)) +
        detailRow("New expiry", ssFmtDate(ssAddDaysISO(30)));
    }
    openModal("member-modal");
  }
  function confirmPlan() {
    var plan = pick.plan;
    if (!plan) return;
    var membership = { planId: plan.id, sessions: plan.sessions, used: 0, expiry: ssAddDaysISO(30), joined: today() };
    ssUpdateAccount(me().email, { membership: membership });
    ssAddPayment({
      userId: me().email,
      clientName: me().name,
      date: today(),
      service: plan.name + " Membership — Monthly",
      amount: plan.price,
      method: "Card",
      status: "Paid",
      type: "membership"
    });
    ssAddNotification(me().email, "Membership activated", plan.name + " plan is active - " + plan.sessions + " sessions for the next 30 days.");
    ssToast(plan.name + " membership activated.", "success");
    pick.plan = null;
    closeModal("member-modal");
    renderAll();
  }

  function openReceipt(id) {
    var list = myPayments();
    var p = null;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { p = list[i]; break; } }
    if (!p) { ssToast("That invoice is unavailable.", "error"); return; }
    pick.receipt = p;
    var body = $("rc-body");
    if (body) {
      body.innerHTML =
        detailRow("Invoice", esc(p.id)) +
        detailRow("Date", ssFmtDate(p.date)) +
        detailRow("Client", esc(p.clientName || me().name)) +
        detailRow("Service", esc(p.service)) +
        detailRow("Amount", ssMoney(p.amount)) +
        detailRow("Method", esc(p.method || "Card")) +
        detailRow("Status", payBadge(p.status));
    }
    openModal("receipt-modal");
  }
  function receiptText(p) {
    return [
      "SereneSpa",
      "Relax. Restore. Rejuvenate.",
      "",
      "Invoice: " + p.id,
      "Date: " + ssFmtDate(p.date),
      "Client: " + (p.clientName || me().name),
      "Service: " + p.service,
      "Amount: " + ssMoney(p.amount),
      "Method: " + (p.method || "Card"),
      "Status: " + p.status,
      "",
      "Demo - no real payment was processed.",
      "14 Willow Court, Riverside District · +1 (555) 018-2244"
    ].join("\n");
  }
  function downloadReceipt() {
    if (!pick.receipt) return;
    downloadText(pick.receipt.id + ".txt", receiptText(pick.receipt));
    ssToast("Receipt downloaded.", "success");
  }
  function renderPayments() {
    var rowsWrap = $("pay-rows");
    if (!rowsWrap) return;
    var list = myPayments().slice().sort(function (a, b) {
      if ((a.date || "") !== (b.date || "")) return a.date < b.date ? 1 : -1;
      return 0;
    });
    var paid = list.filter(function (p) { return p.status === "Paid"; });
    var pending = list.filter(function (p) { return p.status === "Pending"; });
    var failed = list.filter(function (p) { return p.status === "Failed"; });
    var paidTotal = paid.reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);
    var pendingTotal = pending.reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);

    var summary = $("pay-summary");
    if (summary) {
      summary.innerHTML =
        statCard("wallet", ssMoney(paidTotal), "Total paid") +
        statCard("hourglass", ssMoney(pendingTotal), "Pending amount") +
        statCard("receipt", String(list.length), "Invoices") +
        statCard("triangle-alert", String(failed.length), "Failed payments");
    }

    rowsWrap.innerHTML = list.map(function (p) {
      return "<tr>" +
        '<td data-label="Invoice">' + esc(p.id) + "</td>" +
        '<td data-label="Date">' + ssFmtDate(p.date) + "</td>" +
        '<td data-label="Service">' + esc(p.service) + "</td>" +
        '<td data-label="Amount">' + ssMoney(p.amount) + "</td>" +
        '<td data-label="Status">' + payBadge(p.status) + "</td>" +
        '<td data-label="Action"><div class="flex flex-wrap justify-end">' +
        '<button type="button" data-action="receipt" data-id="' + p.id + '" class="inline-flex items-center gap-1.5 rounded-full border border-sage-300 dark:border-sage-600 px-4 py-2 text-xs font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60 transition-colors"><i data-lucide="download" class="w-3.5 h-3.5"></i>Receipt</button>' +
        "</div></td></tr>";
    }).join("");

    var isEmpty = list.length === 0;
    var table = $("pay-table-wrap");
    var empty = $("pay-empty");
    if (table) table.classList.toggle("hidden", isEmpty);
    if (empty) empty.classList.toggle("hidden", !isEmpty);
    ssIcons();
  }

  function renderNotifications() {
    var wrap = $("notif-list");
    if (!wrap) return;
    var list = myNotifs().slice().sort(function (a, b) { return b.ts - a.ts; });
    if (!list.length) {
      wrap.innerHTML = emptyCard("bell-off", "No notifications", "Booking confirmations and membership updates will show up here.", "Book an appointment", "book");
    } else {
      wrap.innerHTML = list.map(function (n) {
        return '<button type="button" data-action="read-notif" data-id="' + n.id + '" class="w-full text-start flex items-start gap-3 rounded-2xl border p-4 shadow-card transition-colors ' +
          (n.read
            ? "border-sage-100 dark:border-sage-700/60 bg-white dark:bg-forest-800 hover:bg-sage-50 dark:hover:bg-forest-900/60"
            : "border-gold-400/70 bg-white dark:bg-forest-800 hover:bg-sage-50 dark:hover:bg-forest-900/60") + '">' +
          '<span class="mt-1.5 w-2 h-2 shrink-0 rounded-full ' + (n.read ? "bg-sage-300 dark:bg-sage-600" : "bg-gold-500") + '"></span>' +
          '<span class="min-w-0 flex-1">' +
          '<span class="block text-sm ' + (n.read ? "text-sage-600 dark:text-sage-300" : "font-semibold text-forest-700 dark:text-cream-100") + '">' + esc(n.title) + "</span>" +
          '<span class="mt-0.5 block text-sm text-sage-600 dark:text-sage-300">' + esc(n.body) + "</span>" +
          '<span class="mt-1 block text-xs text-sage-400 dark:text-sage-500">' + ssTimeAgo(n.ts) + (n.read ? "" : " · New") + "</span>" +
          "</span></button>";
      }).join("");
    }
    var markAll = $("notif-mark-all");
    if (markAll) {
      var allRead = list.every(function (n) { return n.read; });
      markAll.classList.toggle("opacity-50", allRead);
      markAll.classList.toggle("pointer-events-none", allRead);
    }
    ssIcons();
  }
  function setNotifRead(id) {
    var list = ssNotifications();
    var changed = false;
    list.forEach(function (n) {
      if (n.id === id && n.userId === me().email && !n.read) { n.read = true; changed = true; }
    });
    if (changed) {
      ssSet(SS_KEYS.notifications, list);
      renderNotifications();
      renderShell();
    }
  }
  function setAllNotifsRead() {
    var list = ssNotifications();
    var changed = false;
    list.forEach(function (n) {
      if (n.userId === me().email && !n.read) { n.read = true; changed = true; }
    });
    if (!changed) { ssToast("Everything is already read."); return; }
    ssSet(SS_KEYS.notifications, list);
    ssToast("All notifications marked as read.", "success");
    renderNotifications();
    renderShell();
  }

  function renderProfile() {
    var u = me();
    var nameEl = $("pf-name");
    var emailEl = $("pf-email");
    var mobileEl = $("pf-mobile");
    if (nameEl && document.activeElement !== nameEl) nameEl.value = u.name || "";
    if (emailEl) emailEl.value = u.email || "";
    if (mobileEl && document.activeElement !== mobileEl) mobileEl.value = u.mobile || "";
    var chip = $("profile-chip");
    if (chip) {
      var info = memInfo();
      var manage = '<button type="button" data-view="membership" class="mt-4 inline-flex items-center gap-2 rounded-full border border-sage-300 dark:border-sage-600 px-4 py-2 text-sm font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60 transition-colors"><i data-lucide="gem" class="w-4 h-4"></i>Membership</button>';
      if (info.has && info.plan) {
        chip.innerHTML = '<p class="text-xs font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400">Membership status</p>' +
          '<div class="mt-2 flex flex-wrap items-center gap-2">' +
          '<p class="font-display text-xl font-semibold text-forest-700 dark:text-cream-100">' + esc(info.plan.name) + "</p>" +
          (info.active
            ? '<span class="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300 px-2.5 py-1 text-[11px] font-semibold">Active</span>'
            : '<span class="inline-flex items-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-300 px-2.5 py-1 text-[11px] font-semibold">Expired</span>') +
          "</div>" +
          '<p class="mt-1 text-sm text-sage-600 dark:text-sage-300">' + info.remaining + " of " + info.sessions + " sessions remaining</p>" +
          '<p class="text-sm text-sage-600 dark:text-sage-300">Expires ' + ssFmtDate(info.expiry) + "</p>" + manage;
      } else {
        chip.innerHTML = '<p class="text-xs font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400">Membership status</p>' +
          '<p class="mt-2 font-display text-xl font-semibold text-forest-700 dark:text-cream-100">Pay as you go</p>' +
          '<p class="mt-1 text-sm text-sage-600 dark:text-sage-300">No plan linked yet.</p>' + manage;
      }
    }
    ssIcons();
  }
  function saveProfile() {
    var nameEl = $("pf-name");
    var mobileEl = $("pf-mobile");
    var currentEl = $("pf-current");
    var newEl = $("pf-new");
    var name = nameEl ? nameEl.value.trim() : "";
    var mobile = mobileEl ? mobileEl.value.trim() : "";
    var current = currentEl ? currentEl.value : "";
    var newPw = newEl ? newEl.value : "";
    if (!name) { ssToast("Please enter your name.", "error"); return; }
    var accounts = ssAccounts();
    var acc = null;
    for (var i = 0; i < accounts.length; i++) { if (accounts[i].email === me().email) { acc = accounts[i]; break; } }
    var patch = { name: name, mobile: mobile };
    if (newPw) {
      var stored = acc ? acc.password : U.password;
      if (!current || current !== stored) { ssToast("Your current password is incorrect.", "error"); return; }
      if (newPw.length < 4) { ssToast("New password needs at least 4 characters.", "error"); return; }
      patch.password = newPw;
    }
    ssUpdateAccount(me().email, patch);
    ssSaveUser(me());
    if (currentEl) currentEl.value = "";
    if (newEl) newEl.value = "";
    ssToast("Profile saved.", "success");
    renderShell();
    renderProfile();
  }
  function downloadData() {
    var u = Object.assign({}, me());
    delete u.password;
    var payload = {
      exportedAt: new Date().toISOString(),
      source: "SereneSpa demo dashboard",
      profile: u,
      appointments: myAppts(),
      payments: myPayments(),
      notifications: myNotifs()
    };
    downloadText("serenespa-my-data.json", JSON.stringify(payload, null, 2));
    ssToast("Your data export has been downloaded.", "success");
  }

  function bindDelegates() {
    document.addEventListener("click", function (e) {
      if (!e.target || !e.target.closest) return;
      var vb = e.target.closest("button[data-view], a[data-view]");
      if (vb) {
        e.preventDefault();
        var v = vb.getAttribute("data-view");
        if (v === "logout") { doLogout(); return; }
        if (v === "book") prefillBook(vb.getAttribute("data-treatment"), vb.getAttribute("data-therapist"));
        setView(v);
        return;
      }
      var ab = e.target.closest("[data-action]");
      if (!ab) return;
      var action = ab.getAttribute("data-action");
      var id = ab.getAttribute("data-id");
      if (action === "pick-slot") {
        selectedTime = ab.getAttribute("data-time");
        renderSlots();
      } else if (action === "refresh-slots") {
        renderSlots();
        ssToast("Slots refreshed.");
      } else if (action === "appt-filter") {
        apptFilter = ab.getAttribute("data-filter") || "All";
        renderAppointments();
      } else if (action === "cancel-appt") {
        cancelAppt(id);
      } else if (action === "appt-details") {
        openApptModal(id);
      } else if (action === "close-modal") {
        var m = ab.closest(".modal-backdrop");
        if (m) closeModal(m.id);
      } else if (action === "modal-rebook") {
        var a = pick.appt;
        closeAnyModal();
        if (a) {
          prefillBook(a.treatmentId, a.therapistId);
          setView("book");
        }
      } else if (action === "choose-plan") {
        openMemberModal(id);
      } else if (action === "confirm-plan") {
        confirmPlan();
      } else if (action === "receipt") {
        openReceipt(id);
      } else if (action === "download-receipt") {
        downloadReceipt();
      } else if (action === "read-notif") {
        setNotifRead(id);
      } else if (action === "read-all") {
        setAllNotifsRead();
      } else if (action === "download-data") {
        downloadData();
      } else if (action === "confirm-booking") {
        confirmBooking();
      }
    });
  }

  function bindShell() {
    var openBtn = $("sidebar-open");
    if (openBtn) openBtn.addEventListener("click", openDrawer);
    var backdrop = $("dash-backdrop");
    if (backdrop) backdrop.addEventListener("click", closeDrawer);
    MODALS.forEach(function (id) {
      var m = $(id);
      if (m) m.addEventListener("click", function (e) { if (e.target === m) closeModal(id); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeDrawer(); closeAnyModal(); }
    });
  }

  function bindForms() {
    var prefsForm = $("prefs-form");
    if (prefsForm) prefsForm.addEventListener("submit", function (e) { e.preventDefault(); savePreferences(); });
    var profileForm = $("profile-form");
    if (profileForm) profileForm.addEventListener("submit", function (e) { e.preventDefault(); saveProfile(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    U = ssUser();
    if (!U || U.role !== "client") { location.replace("login.html?next=dashboard"); return; }
    ssSeed();
    var params = new URLSearchParams(location.search);
    var hash = (location.hash || "").replace("#", "");
    var startView = params.get("view") || hash || "overview";
    var pTreat = params.get("treatment") || "";
    var pTher = params.get("therapist") || "";
    pendingPlan = params.get("plan") || "";
    bindShell();
    bindForms();
    bindDelegates();
    initBook(pTreat, pTher);
    renderAll();
    setView(startView);
  });

})();
