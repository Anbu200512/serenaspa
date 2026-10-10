(function () {
  "use strict";

  var VIEWS = ["overview", "clients", "therapists", "treatments", "appointments", "memberships", "payments", "availability", "enquiries", "settings"];
  var MODALS = ["confirm-modal", "ther-modal", "treat-modal", "client-modal", "appt-modal", "receipt-modal", "pay-modal", "plan-modal"];
  var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var DEFAULT_THER_IMAGE = "https://images.pexels.com/photos/37524408/pexels-photo-37524408.jpeg?auto=compress&cs=tinysrgb&w=600";
  var DEFAULT_TREAT_IMAGE = "https://images.pexels.com/photos/6560291/pexels-photo-6560291.jpeg?auto=compress&cs=tinysrgb&w=900";

  var U = null;
  var currentView = "overview";
  var apptFilter = "All";
  var payFilter = "All";
  var clientQuery = "";
  var treatQuery = "";
  var therEditId = null;
  var treatEditId = null;
  var planEditId = null;
  var confirmCb = null;
  var pick = { client: null, receipt: null };
  var modalTimers = {};

  function $(id) { return document.getElementById(id); }
  function esc(v) { return ssEscape(v); }
  function today() { return ssTodayISO(); }

  function addDays(iso, n) {
    var d = new Date((iso || today()) + "T00:00:00");
    if (isNaN(d)) d = new Date();
    d.setDate(d.getDate() + n);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function splitList(v) {
    return String(v || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function initials(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "SS";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function clientAccounts() {
    return ssAccounts().filter(function (a) { return a.role === "client"; });
  }
  function isSelfOrAdmin(a) {
    return a.role === "admin" || (U && a.email === U.email);
  }
  function sortDescByDate(list, key) {
    return list.slice().sort(function (a, b) {
      var av = a[key] || "", bv = b[key] || "";
      if (av === bv) return 0;
      return av < bv ? 1 : -1;
    });
  }

  function apptBadge(status) {
    var s = String(status || "Pending");
    var cls = "bg-sage-100 text-sage-700 dark:bg-sage-700/70 dark:text-sage-100";
    if (s === "Confirmed") cls = "bg-forest-700 text-cream-50 dark:bg-forest-600 dark:text-cream-50";
    else if (s === "Pending") cls = "bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300";
    else if (s === "Cancelled") cls = "bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-300";
    else if (s === "Completed") cls = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300";
    return '<span class="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ' + cls + '">' + esc(s) + "</span>";
  }
  function payBadge(status) {
    var s = String(status || "Paid");
    var cls = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300";
    if (s === "Pending") cls = "bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300";
    else if (s === "Failed") cls = "bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-300";
    return '<span class="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ' + cls + '">' + esc(s) + "</span>";
  }
  function enqBadge(status) {
    var s = String(status || "New");
    var cls = "bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300";
    if (s === "Replied") cls = "bg-forest-700 text-cream-50 dark:bg-forest-600";
    else if (s === "Closed") cls = "bg-sage-100 text-sage-700 dark:bg-sage-700/70 dark:text-sage-100";
    return '<span class="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ' + cls + '">' + esc(s) + "</span>";
  }
  function statCard(icon, value, label) {
    return '<div class="rounded-2xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-4 shadow-card">' +
      '<span class="grid place-items-center w-10 h-10 rounded-xl bg-sage-100 dark:bg-sage-700 text-forest-700 dark:text-gold-300"><i data-lucide="' + icon + '" class="w-5 h-5"></i></span>' +
      '<p class="mt-3 font-display text-3xl font-semibold text-forest-700 dark:text-cream-100">' + esc(value) + "</p>" +
      '<p class="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400">' + esc(label) + "</p>" +
      "</div>";
  }
  function detailRow(label, value) {
    return '<div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-sage-100 dark:border-sage-700/60 pb-2.5">' +
      '<dt class="text-xs font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400">' + esc(label) + "</dt>" +
      '<dd class="text-sm font-medium text-forest-700 dark:text-cream-100 text-end">' + value + "</dd></div>";
  }
  function cardWrap(inner, extra) {
    return '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-5 sm:p-6 shadow-card' + (extra ? " " + extra : "") + '">' + inner + "</div>";
  }
  function sectionLabel(text) {
    return '<p class="text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 dark:text-sage-400">' + esc(text) + "</p>";
  }
  function statusSelect(action, id, current, options) {
    var opts = options.map(function (o) {
      return '<option value="' + o + '"' + (o === current ? " selected" : "") + ">" + o + "</option>";
    }).join("");
    return '<select data-action="' + action + '" data-id="' + esc(id) + '" class="rounded-lg border border-sage-200 dark:border-sage-600 bg-white dark:bg-forest-900 dark:[color-scheme:dark] px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sage-400">' + opts + "</select>";
  }

  function renderShell() {
    var av = $("dash-avatar");
    if (av) av.textContent = initials(U.name);
    var un = $("dash-username");
    if (un) un.textContent = U.name || "Admin";
    var g = $("dash-greeting");
    if (g) g.textContent = "Welcome, " + String(U.name || "Admin").split(/\s+/)[0];
    var d = $("dash-date");
    if (d) d.textContent = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    var se = $("set-admin-email");
    if (se) se.textContent = U.email || "";
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
    else if (name === "clients") renderClients();
    else if (name === "therapists") renderTherapists();
    else if (name === "treatments") renderTreatments();
    else if (name === "appointments") renderAppointments();
    else if (name === "memberships") renderMemberships();
    else if (name === "payments") renderPayments();
    else if (name === "availability") renderAvailability();
    else if (name === "enquiries") renderEnquiries();
    else if (name === "settings") renderSettings();
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
    renderClients();
    renderTherapists();
    renderTreatments();
    renderAppointments();
    renderMemberships();
    renderPayments();
    renderAvailability();
    renderEnquiries();
    renderSettings();
    ssIcons();
  }

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
  function confirmModal(title, text, label, cb) {
    var t = $("cm-title");
    if (t) t.textContent = title;
    var x = $("cm-text");
    if (x) x.textContent = text;
    var l = $("cm-confirm-label");
    if (l) l.textContent = label || "Confirm";
    confirmCb = cb || null;
    openModal("confirm-modal");
  }

  function doLogout() {
    try { localStorage.removeItem(SS_KEYS.user); } catch (e) {}
    location.href = "login.html";
  }
  function resetDemoData() {
    Object.keys(SS_KEYS).forEach(function (k) {
      try { localStorage.removeItem(SS_KEYS[k]); } catch (e) {}
    });
    location.reload();
  }

  function revenueMonths() {
    var now = new Date();
    var months = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"),
        label: d.toLocaleDateString("en-US", { month: "short" }),
        total: 0
      });
    }
    ssPayments().forEach(function (p) {
      if (p.status !== "Paid") return;
      var k = String(p.date || "").slice(0, 7);
      for (var j = 0; j < months.length; j++) {
        if (months[j].key === k) { months[j].total += Number(p.amount || 0); break; }
      }
    });
    return months;
  }
  function revenueChartHTML() {
    var months = revenueMonths();
    var max = 0;
    months.forEach(function (m) { if (m.total > max) max = m.total; });
    if (!max) {
      return '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 p-6 shadow-card">' +
        sectionLabel("Revenue - last 6 months") +
        '<div class="mt-6 rounded-2xl border border-dashed border-sage-300 dark:border-sage-600 bg-sage-50 dark:bg-forest-900/50 px-4 py-10 text-center text-sm text-sage-600 dark:text-sage-300">No paid invoices yet - revenue bars appear once payments are marked Paid.</div>' +
        "</div>";
    }
    var bars = months.map(function (m) {
      var pct = m.total ? Math.max(6, Math.round((m.total / max) * 100)) : 0;
      return '<div class="flex-1 min-w-0 flex flex-col items-center gap-2">' +
        '<div class="w-full flex items-end justify-center" style="height:120px">' +
        '<div class="w-full max-w-[46px] rounded-t-lg ' + (pct ? "bg-forest-700 dark:bg-gold-500" : "bg-sage-200 dark:bg-sage-700") + '" style="height:' + pct + '%"></div>' +
        "</div>" +
        '<span class="text-[11px] font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400">' + esc(m.label) + "</span>" +
        '<span class="text-xs font-medium text-forest-700 dark:text-cream-100 truncate max-w-full">' + (m.total ? ssMoney(m.total) : "—") + "</span>" +
        "</div>";
    }).join("");
    return cardWrap(sectionLabel("Revenue - last 6 months") +
      '<div class="mt-5 flex items-end gap-2 sm:gap-4">' + bars + "</div>");
  }
  function todayScheduleHTML(list) {
    var body;
    if (!list.length) {
      body = '<p class="mt-3 text-sm text-sage-600 dark:text-sage-300">No sessions booked for today.</p>';
    } else {
      body = '<ul class="mt-4 space-y-2.5">' + list.map(function (a) {
        return '<li class="flex flex-wrap items-center gap-3 rounded-2xl border border-sage-100 dark:border-sage-700/60 bg-sage-50 dark:bg-forest-900/50 p-3.5">' +
          '<span class="grid place-items-center w-11 h-11 shrink-0 rounded-xl bg-forest-700 dark:bg-gold-500 text-cream-50 dark:text-forest-900 text-xs font-semibold">' + esc(a.time) + "</span>" +
          '<div class="min-w-0 flex-1">' +
          '<p class="text-sm font-semibold text-forest-700 dark:text-cream-100 truncate">' + esc(a.treatmentName) + "</p>" +
          '<p class="text-xs text-sage-500 dark:text-sage-400 truncate">' + esc(a.clientName) + " with " + esc(a.therapistName) + "</p></div>" +
          apptBadge(a.status) +
          "</li>";
      }).join("") + "</ul>";
    }
    return cardWrap(sectionLabel("Today's schedule") + body);
  }
  function recentEnquiriesHTML() {
    var list = ssGet(SS_KEYS.enquiries, []).slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).slice(0, 3);
    var body;
    if (!list.length) {
      body = '<p class="mt-3 text-sm text-sage-600 dark:text-sage-300">No enquiries yet.</p>';
    } else {
      body = '<ul class="mt-4 space-y-2.5">' + list.map(function (e) {
        return '<li class="rounded-2xl border border-sage-100 dark:border-sage-700/60 bg-sage-50 dark:bg-forest-900/50 p-3.5">' +
          '<div class="flex flex-wrap items-center justify-between gap-2">' +
          '<p class="text-sm font-semibold text-forest-700 dark:text-cream-100">' + esc(e.name) + "</p>" + enqBadge(e.status) + "</div>" +
          '<p class="mt-1 text-xs text-sage-600 dark:text-sage-300 line-clamp-2">' + esc(e.message) + "</p>" +
          '<p class="mt-1.5 text-[11px] text-sage-400 dark:text-sage-500">' + ssTimeAgo(e.ts || 0) + "</p>" +
          "</li>";
      }).join("") + "</ul>";
    }
    return cardWrap(
      '<div class="flex flex-wrap items-center justify-between gap-3">' +
      sectionLabel("Recent enquiries") +
      '<button type="button" data-view="enquiries" class="text-sm font-medium text-forest-700 dark:text-gold-300 hover:underline">View all</button></div>' + body);
  }
  function recentSignupsHTML(clients) {
    var list = clients.slice(-3).reverse();
    var body;
    if (!list.length) {
      body = '<p class="mt-3 text-sm text-sage-600 dark:text-sage-300">No client accounts yet.</p>';
    } else {
      body = '<ul class="mt-4 space-y-2.5">' + list.map(function (a) {
        var m = a.membership || null;
        var plan = m ? ssGetPlan(m.planId) : null;
        return '<li class="flex items-center gap-3 rounded-2xl border border-sage-100 dark:border-sage-700/60 bg-sage-50 dark:bg-forest-900/50 p-3.5">' +
          '<span class="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-forest-700 dark:bg-gold-500 text-cream-50 dark:text-forest-900 text-xs font-semibold">' + esc(initials(a.name)) + "</span>" +
          '<div class="min-w-0 flex-1">' +
          '<p class="text-sm font-semibold text-forest-700 dark:text-cream-100 truncate">' + esc(a.name) + "</p>" +
          '<p class="text-xs text-sage-500 dark:text-sage-400 truncate">' + esc(a.email) + (plan ? " · " + esc(plan.name) + " plan" : "") + "</p></div>" +
          (m && m.joined ? '<span class="text-[11px] text-sage-400 dark:text-sage-500 whitespace-nowrap">' + ssFmtDate(m.joined) + "</span>" : "") +
          "</li>";
      }).join("") + "</ul>";
    }
    return cardWrap(
      '<div class="flex flex-wrap items-center justify-between gap-3">' +
      sectionLabel("Recent signups") +
      '<button type="button" data-view="clients" class="text-sm font-medium text-forest-700 dark:text-gold-300 hover:underline">View all</button></div>' + body);
  }
  function renderOverview() {
    var root = $("ov-body");
    if (!root) return;
    var clients = clientAccounts();
    var appts = ssAppointments();
    var pays = ssPayments();
    var todayAppts = appts.filter(function (a) { return a.date === today() && a.status !== "Cancelled"; })
      .sort(function (a, b) { return (a.time || "") < (b.time || "") ? -1 : 1; });
    var activeMems = clients.filter(function (a) { return a.membership && a.membership.expiry && a.membership.expiry >= today(); });
    var availableToday = ssTherapists().filter(function (t) {
      return t.active !== false && (t.days || []).indexOf(ssDayName(today())) > -1 && ssDaySlots(t.id, today()).length > 0;
    });
    var pending = pays.filter(function (p) { return p.status === "Pending"; });
    var pendingTotal = pending.reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);
    var monthKey = today().slice(0, 7);
    var monthPaid = pays.filter(function (p) { return p.status === "Paid" && String(p.date || "").slice(0, 7) === monthKey; });
    var monthRevenue = monthPaid.reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);

    root.innerHTML =
      '<div class="grid gap-4 grid-cols-2 xl:grid-cols-3">' +
      statCard("users", String(clients.length), "Total clients") +
      statCard("calendar-check", String(todayAppts.length), "Today's appointments") +
      statCard("gem", String(activeMems.length), "Active memberships") +
      statCard("user-round-check", String(availableToday.length), "Available therapists today") +
      statCard("hourglass", String(pending.length), "Pending payments") +
      statCard("trending-up", ssMoney(monthRevenue), "Monthly revenue") +
      "</div>" +
      todayScheduleHTML(todayAppts) +
      revenueChartHTML() +
      '<div class="grid gap-5 lg:grid-cols-2">' + recentEnquiriesHTML() + recentSignupsHTML(clients) + "</div>";
    ssIcons();
  }

  function renderClients() {
    var wrap = $("cli-rows");
    if (!wrap) return;
    var q = clientQuery.toLowerCase();
    var appts = ssAppointments();
    var list = clientAccounts().filter(function (a) {
      return !q || String(a.name || "").toLowerCase().indexOf(q) > -1 || String(a.email || "").toLowerCase().indexOf(q) > -1;
    });
    wrap.innerHTML = list.map(function (a) {
      var m = a.membership || null;
      var plan = m ? ssGetPlan(m.planId) : null;
      var count = appts.filter(function (x) { return x.userId === a.email; }).length;
      var actions = '<div class="flex flex-wrap justify-end gap-2">' +
        '<button type="button" data-action="client-view" data-id="' + esc(a.email) + '" class="rounded-full border border-sage-300 dark:border-sage-600 px-4 py-2 text-xs font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60 transition-colors">View</button>';
      if (!isSelfOrAdmin(a)) {
        actions += '<button type="button" data-action="client-delete" data-id="' + esc(a.email) + '" class="rounded-full border border-red-200 dark:border-red-500/40 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Delete</button>';
      }
      actions += "</div>";
      return "<tr>" +
        '<td data-label="Name"><span class="flex items-center gap-2.5"><span class="grid place-items-center w-8 h-8 shrink-0 rounded-full bg-forest-700 dark:bg-gold-500 text-cream-50 dark:text-forest-900 text-[11px] font-semibold">' + esc(initials(a.name)) + "</span><span class='font-medium'>" + esc(a.name) + "</span></span></td>" +
        '<td data-label="Email">' + esc(a.email) + "</td>" +
        '<td data-label="Mobile">' + esc(a.mobile || "—") + "</td>" +
        '<td data-label="Plan">' + (plan ? esc(plan.name) : "Pay as you go") + "</td>" +
        '<td data-label="Appointments">' + count + "</td>" +
        '<td data-label="Joined">' + (m && m.joined ? ssFmtDate(m.joined) : "—") + "</td>" +
        '<td data-label="Actions">' + actions + "</td></tr>";
    }).join("");
    var isEmpty = list.length === 0;
    var table = $("cli-table-wrap");
    var empty = $("cli-empty");
    if (table) table.classList.toggle("hidden", isEmpty);
    if (empty) empty.classList.toggle("hidden", !isEmpty);
    ssIcons();
  }
  function openClientModal(email) {
    var acc = null;
    ssAccounts().forEach(function (a) { if (a.email === email) acc = a; });
    if (!acc) { ssToast("That client no longer exists.", "error"); return; }
    pick.client = acc;
    var title = $("clm-title");
    if (title) title.textContent = acc.name;
    var body = $("clm-body");
    var m = acc.membership || null;
    var plan = m ? ssGetPlan(m.planId) : null;
    var theirAppts = sortDescByDate(ssAppointments().filter(function (a) { return a.userId === acc.email; }), "date").slice(0, 5);
    var theirPays = sortDescByDate(ssPayments().filter(function (p) { return p.userId === acc.email; }), "date").slice(0, 5);
    var apptRows = theirAppts.length
      ? theirAppts.map(function (a) {
        return '<div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sage-100 dark:border-sage-700/60 bg-sage-50 dark:bg-forest-900/50 px-3.5 py-2.5 text-sm">' +
          '<span class="min-w-0 truncate"><span class="font-medium text-forest-700 dark:text-cream-100">' + esc(a.treatmentName) + "</span><span class='text-sage-500 dark:text-sage-400'> · " + ssFmtDate(a.date) + " " + esc(a.time) + "</span></span>" +
          apptBadge(a.status) + "</div>";
      }).join("")
      : '<p class="text-sm text-sage-500 dark:text-sage-400">No appointments yet.</p>';
    var payRows = theirPays.length
      ? theirPays.map(function (p) {
        return '<div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sage-100 dark:border-sage-700/60 bg-sage-50 dark:bg-forest-900/50 px-3.5 py-2.5 text-sm">' +
          '<span class="min-w-0 truncate"><span class="font-medium text-forest-700 dark:text-cream-100">' + esc(p.id) + "</span><span class='text-sage-500 dark:text-sage-400'> · " + esc(p.service) + "</span></span>" +
          '<span class="flex items-center gap-2 whitespace-nowrap"><span class="font-medium">' + ssMoney(p.amount) + "</span>" + payBadge(p.status) + "</span></div>";
      }).join("")
      : '<p class="text-sm text-sage-500 dark:text-sage-400">No payments yet.</p>';
    if (body) {
      body.innerHTML =
        '<dl class="space-y-2.5">' +
        detailRow("Email", esc(acc.email)) +
        detailRow("Mobile", esc(acc.mobile || "—")) +
        detailRow("Plan", plan ? esc(plan.name) : "Pay as you go") +
        detailRow("Sessions", m ? (m.used || 0) + " used · " + Math.max(0, (m.sessions || 0) - (m.used || 0)) + " left" : "—") +
        detailRow("Membership expiry", m && m.expiry ? ssFmtDate(m.expiry) : "—") +
        "</dl>" +
        '<div><p class="text-xs font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400 mb-2">Recent appointments</p><div class="space-y-2">' + apptRows + "</div></div>" +
        '<div><p class="text-xs font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400 mb-2">Recent payments</p><div class="space-y-2">' + payRows + "</div></div>";
    }
    openModal("client-modal");
  }
  function deleteClient(email) {
    confirmModal("Delete client?", "This removes the account for " + email + ". Their historical appointments and invoices stay in the records.", "Delete", function () {
      var next = ssAccounts().filter(function (a) { return a.email !== email; });
      ssSet(SS_KEYS.accounts, next);
      ssToast("Client removed.", "success");
      renderAll();
    });
  }

  function renderTherapists() {
    var grid = $("ther-grid");
    if (!grid) return;
    var list = ssTherapists();
    grid.innerHTML = list.map(function (t) {
      var pill = t.active !== false
        ? '<span class="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300 px-2.5 py-1 text-[11px] font-semibold">Active</span>'
        : '<span class="inline-flex items-center rounded-full bg-sage-100 text-sage-700 dark:bg-sage-700/70 dark:text-sage-100 px-2.5 py-1 text-[11px] font-semibold">Inactive</span>';
      var chips = (t.days || []).map(function (d) {
        return '<span class="rounded-full bg-sage-100 dark:bg-sage-700/60 px-2.5 py-0.5 text-[11px] text-sage-700 dark:text-sage-200">' + esc(d) + "</span>";
      }).join("");
      return '<div class="rounded-3xl bg-white dark:bg-forest-800 border border-sage-100 dark:border-sage-700/60 overflow-hidden shadow-card flex flex-col">' +
        '<div class="relative h-44 overflow-hidden">' +
        '<img src="' + t.image + '" alt="' + esc(t.name) + '" loading="lazy" class="w-full h-full object-cover" />' +
        '<span class="absolute top-3 start-3">' + pill + "</span></div>" +
        '<div class="p-5 flex flex-col flex-1">' +
        '<h2 class="font-display text-xl font-semibold text-forest-700 dark:text-cream-100">' + esc(t.name) + "</h2>" +
        '<p class="text-xs uppercase tracking-wider text-sage-500 dark:text-sage-400">' + esc(t.specialty) + "</p>" +
        '<p class="mt-2 flex items-center gap-2 text-sm text-sage-600 dark:text-sage-300"><i data-lucide="briefcase" class="w-4 h-4 text-sage-500"></i>' + Number(t.experience || 0) + " yrs experience</p>" +
        '<div class="mt-3 flex flex-wrap gap-1.5">' + (chips || '<span class="text-xs text-sage-500 dark:text-sage-400">By appointment</span>') + "</div>" +
        '<div class="mt-auto pt-4 flex flex-wrap gap-2">' +
        '<button type="button" data-action="ther-edit" data-id="' + esc(t.id) + '" class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-sage-300 dark:border-sage-600 px-4 py-2 text-xs font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60 transition-colors"><i data-lucide="pencil" class="w-3.5 h-3.5"></i>Edit</button>' +
        '<button type="button" data-action="ther-delete" data-id="' + esc(t.id) + '" class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200 dark:border-red-500/40 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i>Delete</button>' +
        "</div></div></div>";
    }).join("");
    var isEmpty = list.length === 0;
    var empty = $("ther-empty");
    if (empty) empty.classList.toggle("hidden", !isEmpty);
    grid.classList.toggle("hidden", isEmpty);
    ssIcons();
  }
  function buildDayChecks(selected) {
    var wrap = $("th-days");
    if (!wrap) return;
    wrap.innerHTML = DAYS.map(function (d) {
      var on = (selected || []).indexOf(d) > -1;
      return '<label class="cursor-pointer"><input type="checkbox" class="peer sr-only" data-day="' + d + '"' + (on ? " checked" : "") + ' />' +
        '<span class="inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors border-sage-300 dark:border-sage-600 text-sage-700 dark:text-sage-200 peer-checked:border-forest-700 peer-checked:bg-forest-700 peer-checked:text-cream-50 dark:peer-checked:border-gold-500 dark:peer-checked:bg-gold-500 dark:peer-checked:text-forest-900">' + d + "</span></label>";
    }).join("");
  }
  function openTherModal(id) {
    therEditId = id || null;
    var t = id ? ssGetTherapist(id) : null;
    var title = $("thm-title");
    if (title) title.textContent = t ? "Edit therapist" : "Add therapist";
    var nameEl = $("th-name");
    var specEl = $("th-specialty");
    var expEl = $("th-experience");
    var expertEl = $("th-expertise");
    var slotsEl = $("th-slots");
    var bioEl = $("th-bio");
    var activeEl = $("th-active");
    if (nameEl) nameEl.value = t ? t.name : "";
    if (specEl) specEl.value = t ? t.specialty : "";
    if (expEl) expEl.value = t ? t.experience : "";
    if (expertEl) expertEl.value = t ? (t.expertise || []).join(", ") : "";
    if (slotsEl) slotsEl.value = t ? (t.slots || []).join(", ") : "09:00, 10:00, 11:00, 14:00, 15:00, 16:00";
    if (bioEl) bioEl.value = t ? (t.bio || "") : "";
    if (activeEl) activeEl.checked = t ? t.active !== false : true;
    buildDayChecks(t ? t.days : ["Mon", "Tue", "Wed", "Thu", "Fri"]);
    openModal("ther-modal");
  }
  function saveTherapist() {
    var name = $("th-name") ? $("th-name").value.trim() : "";
    var specialty = $("th-specialty") ? $("th-specialty").value.trim() : "";
    var experience = $("th-experience") ? Number($("th-experience").value || 0) : 0;
    var expertise = $("th-expertise") ? splitList($("th-expertise").value) : [];
    var slots = $("th-slots") ? splitList($("th-slots").value) : [];
    var bio = $("th-bio") ? $("th-bio").value.trim() : "";
    var active = $("th-active") ? $("th-active").checked : true;
    var days = [];
    var boxes = $("th-days") ? $("th-days").querySelectorAll("input[type=checkbox]") : [];
    boxes.forEach(function (b) { if (b.checked) days.push(b.getAttribute("data-day")); });
    if (!name) { ssToast("Please enter the therapist's name.", "error"); return; }
    if (!days.length) { ssToast("Please pick at least one working day.", "error"); return; }
    if (!slots.length) { ssToast("Please add at least one time slot.", "error"); return; }
    var list = ssTherapists();
    if (therEditId) {
      var idx = -1;
      for (var i = 0; i < list.length; i++) { if (list[i].id === therEditId) { idx = i; break; } }
      if (idx === -1) { ssToast("That therapist no longer exists.", "error"); return; }
      list[idx] = Object.assign({}, list[idx], { name: name, specialty: specialty, experience: experience, expertise: expertise, days: days, slots: slots, active: active, bio: bio });
      ssToast("Therapist updated.", "success");
    } else {
      list.push({
        id: ssId("th"), name: name, specialty: specialty, experience: experience,
        expertise: expertise, days: days, slots: slots, image: DEFAULT_THER_IMAGE,
        rating: 5, active: active, bio: bio
      });
      ssToast("Therapist added.", "success");
    }
    ssSet(SS_KEYS.therapists, list);
    closeModal("ther-modal");
    renderAll();
  }
  function deleteTherapist(id) {
    var t = ssGetTherapist(id);
    if (!t) return;
    confirmModal("Delete therapist?", t.name + " will be removed from the team. Past appointments keep their name on record.", "Delete", function () {
      var next = ssTherapists().filter(function (x) { return x.id !== id; });
      ssSet(SS_KEYS.therapists, next);
      ssToast("Therapist deleted.", "success");
      renderAll();
    });
  }

  function renderTreatments() {
    var wrap = $("tr-rows");
    if (!wrap) return;
    var q = treatQuery.toLowerCase();
    var list = ssTreatments().filter(function (t) {
      return !q || String(t.name || "").toLowerCase().indexOf(q) > -1 || String(t.category || "").toLowerCase().indexOf(q) > -1;
    });
    wrap.innerHTML = list.map(function (t) {
      return "<tr>" +
        '<td data-label="Treatment"><span class="flex items-center gap-3 min-w-0"><img src="' + t.image + '" alt="' + esc(t.name) + '" loading="lazy" class="w-12 h-12 rounded-xl object-cover shrink-0" /><span class="font-medium truncate">' + esc(t.name) + "</span></span></td>" +
        '<td data-label="Category">' + esc(t.category) + "</td>" +
        '<td data-label="Duration">' + t.duration + " min</td>" +
        '<td data-label="Price">' + ssMoney(t.price) + "</td>" +
        '<td data-label="Featured">' + (t.featured
          ? '<span class="inline-flex items-center rounded-full bg-gold-500/20 dark:bg-gold-500/25 px-2.5 py-1 text-[11px] font-semibold text-gold-700 dark:text-gold-300">Featured</span>'
          : '<span class="text-sage-400 dark:text-sage-500">—</span>') + "</td>" +
        '<td data-label="Actions"><div class="flex flex-wrap justify-end gap-2">' +
        '<button type="button" data-action="treat-edit" data-id="' + esc(t.id) + '" class="rounded-full border border-sage-300 dark:border-sage-600 px-4 py-2 text-xs font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60 transition-colors">Edit</button>' +
        '<button type="button" data-action="treat-delete" data-id="' + esc(t.id) + '" class="rounded-full border border-red-200 dark:border-red-500/40 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Delete</button>' +
        "</div></td></tr>";
    }).join("");
    var isEmpty = list.length === 0;
    var table = $("tr-table-wrap");
    var empty = $("tr-empty");
    if (table) table.classList.toggle("hidden", isEmpty);
    if (empty) empty.classList.toggle("hidden", !isEmpty);
    ssIcons();
  }
  function openTreatModal(id) {
    treatEditId = id || null;
    var t = id ? ssGetTreatment(id) : null;
    var title = $("trm-title");
    if (title) title.textContent = t ? "Edit treatment" : "Add treatment";
    var nameEl = $("t-name");
    var catEl = $("t-category");
    var durEl = $("t-duration");
    var priceEl = $("t-price");
    var descEl = $("t-desc");
    var benEl = $("t-benefits");
    var imgEl = $("t-image");
    var featEl = $("t-featured");
    if (nameEl) nameEl.value = t ? t.name : "";
    if (catEl) catEl.value = t ? t.category : "Massage";
    if (durEl) durEl.value = t ? t.duration : 60;
    if (priceEl) priceEl.value = t ? t.price : 89;
    if (descEl) descEl.value = t ? (t.desc || "") : "";
    if (benEl) benEl.value = t ? (t.benefits || []).join(", ") : "";
    if (imgEl) imgEl.value = t ? (t.image || "") : "";
    if (featEl) featEl.checked = t ? !!t.featured : false;
    openModal("treat-modal");
  }
  function saveTreatment() {
    var name = $("t-name") ? $("t-name").value.trim() : "";
    var category = $("t-category") ? $("t-category").value : "Massage";
    var duration = $("t-duration") ? Number($("t-duration").value || 0) : 0;
    var price = $("t-price") ? Number($("t-price").value || 0) : 0;
    var desc = $("t-desc") ? $("t-desc").value.trim() : "";
    var benefits = $("t-benefits") ? splitList($("t-benefits").value) : [];
    var image = $("t-image") ? $("t-image").value.trim() : "";
    var featured = $("t-featured") ? $("t-featured").checked : false;
    if (!name) { ssToast("Please enter the treatment name.", "error"); return; }
    if (!duration || duration < 10) { ssToast("Please enter a valid duration.", "error"); return; }
    if (price < 0) { ssToast("Please enter a valid price.", "error"); return; }
    var list = ssTreatments();
    if (treatEditId) {
      var idx = -1;
      for (var i = 0; i < list.length; i++) { if (list[i].id === treatEditId) { idx = i; break; } }
      if (idx === -1) { ssToast("That treatment no longer exists.", "error"); return; }
      list[idx] = Object.assign({}, list[idx], {
        name: name, category: category, duration: duration, price: price,
        desc: desc, benefits: benefits, image: image || list[idx].image || DEFAULT_TREAT_IMAGE, featured: featured
      });
      ssToast("Treatment updated.", "success");
    } else {
      list.push({
        id: ssId("t"), name: name, category: category, duration: duration, price: price,
        image: image || DEFAULT_TREAT_IMAGE, desc: desc, benefits: benefits, featured: featured
      });
      ssToast("Treatment added.", "success");
    }
    ssSet(SS_KEYS.treatments, list);
    closeModal("treat-modal");
    renderAll();
  }
  function deleteTreatment(id) {
    var t = ssGetTreatment(id);
    if (!t) return;
    confirmModal("Delete treatment?", t.name + " will be removed from the public menu and booking flow.", "Delete", function () {
      var next = ssTreatments().filter(function (x) { return x.id !== id; });
      ssSet(SS_KEYS.treatments, next);
      ssToast("Treatment deleted.", "success");
      renderAll();
    });
  }

  function renderAppointments() {
    var wrap = $("appt-rows");
    if (!wrap) return;
    var all = sortDescByDate(ssAppointments(), "date");
    var counts = { All: all.length, Pending: 0, Confirmed: 0, Completed: 0, Cancelled: 0 };
    all.forEach(function (a) { if (counts[a.status] !== undefined) counts[a.status]++; });
    var strip = $("appt-counts");
    if (strip) {
      var icons = { Pending: "hourglass", Confirmed: "circle-check", Completed: "badge-check", Cancelled: "circle-x" };
      strip.innerHTML = ["Pending", "Confirmed", "Completed", "Cancelled"].map(function (s) {
        return statCard(icons[s], String(counts[s]), s);
      }).join("");
    }
    var rows = all.filter(function (a) { return apptFilter === "All" || a.status === apptFilter; });
    wrap.innerHTML = rows.map(function (a) {
      return "<tr>" +
        '<td data-label="ID"><span class="text-xs text-sage-500 dark:text-sage-400">' + esc(a.id) + "</span></td>" +
        '<td data-label="Date">' + ssFmtDate(a.date) + "</td>" +
        '<td data-label="Time">' + esc(a.time) + "</td>" +
        '<td data-label="Client">' + esc(a.clientName) + "</td>" +
        '<td data-label="Treatment">' + esc(a.treatmentName) + "</td>" +
        '<td data-label="Therapist">' + esc(a.therapistName) + "</td>" +
        '<td data-label="Price">' + ssMoney(a.price) + "</td>" +
        '<td data-label="Status">' + statusSelect("appt-status", a.id, a.status, ["Pending", "Confirmed", "Completed", "Cancelled"]) + "</td>" +
        '<td data-label="Actions"><div class="flex flex-wrap justify-end gap-2">' +
        '<button type="button" data-action="appt-details" data-id="' + esc(a.id) + '" class="rounded-full border border-sage-300 dark:border-sage-600 px-4 py-2 text-xs font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60 transition-colors">Details</button>' +
        '<button type="button" data-action="appt-delete" data-id="' + esc(a.id) + '" class="rounded-full border border-red-200 dark:border-red-500/40 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Delete</button>' +
        "</div></td></tr>";
    }).join("");
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
  function changeApptStatus(id, status) {
    var list = ssAppointments();
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { idx = i; break; } }
    if (idx === -1) { ssToast("That appointment no longer exists.", "error"); return; }
    list[idx] = Object.assign({}, list[idx], { status: status });
    ssSet(SS_KEYS.appointments, list);
    var a = list[idx];
    if (a.userId) {
      ssAddNotification(a.userId, "Appointment " + status.toLowerCase(), a.treatmentName + " on " + ssFmtDate(a.date) + " at " + a.time + " is now " + status + ".");
    }
    ssToast("Appointment marked " + status + ".", "success");
    renderAppointments();
    renderOverview();
  }
  function openApptModal(id) {
    var list = ssAppointments();
    var a = null;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { a = list[i]; break; } }
    if (!a) { ssToast("Appointment details are unavailable.", "error"); return; }
    var title = $("am-title");
    if (title) title.textContent = a.treatmentName;
    var body = $("am-body");
    if (body) {
      body.innerHTML =
        detailRow("Booking ID", esc(a.id)) +
        detailRow("Client", esc(a.clientName)) +
        detailRow("Email", esc(a.userId)) +
        detailRow("Date", ssFmtDate(a.date)) +
        detailRow("Time", esc(a.time) + " · " + Number(a.duration || 0) + " min") +
        detailRow("Therapist", esc(a.therapistName)) +
        detailRow("Price", ssMoney(a.price)) +
        detailRow("Status", apptBadge(a.status)) +
        detailRow("Preference", a.preference ? esc(a.preference) : "<span class='text-sage-500 dark:text-sage-400'>None given</span>") +
        detailRow("Booked", ssTimeAgo(a.createdAt || Date.now()));
    }
    openModal("appt-modal");
  }
  function deleteAppt(id) {
    confirmModal("Delete appointment?", "The booking will be permanently removed from the schedule.", "Delete", function () {
      var next = ssAppointments().filter(function (a) { return a.id !== id; });
      ssSet(SS_KEYS.appointments, next);
      ssToast("Appointment deleted.", "success");
      renderAll();
    });
  }

  function renderMemberships() {
    var grid = $("mem-plans");
    if (!grid) return;
    grid.innerHTML = ssMemberships().map(function (p) {
      return '<div class="rounded-3xl bg-white dark:bg-forest-800 border ' +
        (p.popular ? "border-gold-400 ring-2 ring-gold-400/60 dark:ring-gold-500/60 " : "border-sage-100 dark:border-sage-700/60 ") +
        'p-5 shadow-card">' +
        '<div class="flex items-center justify-between gap-2">' +
        '<h2 class="font-display text-xl font-semibold text-forest-700 dark:text-cream-100">' + esc(p.name) + "</h2>" +
        (p.popular ? '<span class="rounded-full bg-gold-500 text-forest-900 px-2.5 py-0.5 text-[11px] font-semibold">Popular</span>' : "") +
        "</div>" +
        '<div class="mt-4 grid grid-cols-3 gap-2">' +
        '<div><label for="plan-price-' + esc(p.id) + '" class="block text-[11px] font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400 mb-1">Price</label>' +
        '<input id="plan-price-' + esc(p.id) + '" type="number" min="0" value="' + Number(p.price || 0) + '" class="w-full rounded-xl border border-sage-200 dark:border-sage-600 bg-white dark:bg-forest-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400" /></div>' +
        '<div><label for="plan-sessions-' + esc(p.id) + '" class="block text-[11px] font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400 mb-1">Sessions</label>' +
        '<input id="plan-sessions-' + esc(p.id) + '" type="number" min="1" value="' + Number(p.sessions || 0) + '" class="w-full rounded-xl border border-sage-200 dark:border-sage-600 bg-white dark:bg-forest-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400" /></div>' +
        '<div><label for="plan-discount-' + esc(p.id) + '" class="block text-[11px] font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400 mb-1">Discount %</label>' +
        '<input id="plan-discount-' + esc(p.id) + '" type="number" min="0" max="100" value="' + Number(p.discount || 0) + '" class="w-full rounded-xl border border-sage-200 dark:border-sage-600 bg-white dark:bg-forest-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400" /></div>' +
        "</div>" +
        '<p class="mt-3 text-xs text-sage-500 dark:text-sage-400">' + esc(p.validity || "30 days per cycle") + " · " + (p.includes || []).length + " included treatments</p>" +
        '<div class="mt-4 flex flex-wrap gap-2">' +
        '<button type="button" data-action="plan-save" data-id="' + esc(p.id) + '" class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-forest-700 hover:bg-forest-600 dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-forest-900 text-cream-50 px-4 py-2.5 text-sm font-medium transition-colors"><i data-lucide="save" class="w-4 h-4"></i>Save</button>' +
        '<button type="button" data-action="plan-edit" data-id="' + esc(p.id) + '" class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-sage-300 dark:border-sage-600 px-4 py-2.5 text-sm font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60 transition-colors"><i data-lucide="list" class="w-4 h-4"></i>Details</button>' +
        "</div></div>";
    }).join("");

    var rowsWrap = $("mem-rows");
    if (rowsWrap) {
      var members = clientAccounts().filter(function (a) { return a.membership; });
      rowsWrap.innerHTML = members.map(function (a) {
        var m = a.membership;
        var plan = ssGetPlan(m.planId);
        var sessions = Number(m.sessions || 0);
        var used = Number(m.used || 0);
        var remaining = Math.max(0, sessions - used);
        var pct = sessions ? Math.min(100, Math.round((used / sessions) * 100)) : 0;
        var expired = !m.expiry || m.expiry < today();
        return "<tr>" +
          '<td data-label="Name"><span class="flex items-center gap-2.5 min-w-0"><span class="grid place-items-center w-8 h-8 shrink-0 rounded-full bg-forest-700 dark:bg-gold-500 text-cream-50 dark:text-forest-900 text-[11px] font-semibold">' + esc(initials(a.name)) + "</span><span class='font-medium truncate'>" + esc(a.name) + "</span></span></td>" +
          '<td data-label="Plan">' + (plan ? esc(plan.name) : "—") + "</td>" +
          '<td data-label="Sessions"><div class="min-w-[9rem]"><p class="text-xs text-sage-500 dark:text-sage-400 mb-1">' + used + " used · " + remaining + " left</p>" +
          '<div class="h-2 rounded-full bg-sage-100 dark:bg-sage-700 overflow-hidden"><div class="h-full rounded-full bg-gold-500" style="width:' + pct + '%"></div></div></div></td>' +
          '<td data-label="Expiry">' + (m.expiry ? ssFmtDate(m.expiry) : "—") + (expired ? ' <span class="inline-flex items-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-300 px-2 py-0.5 text-[11px] font-semibold">Expired</span>' : "") + "</td>" +
          '<td data-label="Actions"><div class="flex flex-wrap justify-end gap-2">' +
          '<button type="button" data-action="member-extend" data-id="' + esc(a.email) + '" class="rounded-full border border-sage-300 dark:border-sage-600 px-4 py-2 text-xs font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60 transition-colors">Extend 30 days</button>' +
          '<button type="button" data-action="member-remove" data-id="' + esc(a.email) + '" class="rounded-full border border-red-200 dark:border-red-500/40 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Remove</button>' +
          "</div></td></tr>";
      }).join("");
      var isEmpty = members.length === 0;
      var wrap = $("mem-members-wrap");
      var empty = $("mem-empty");
      if (wrap) wrap.classList.toggle("hidden", isEmpty);
      if (empty) empty.classList.toggle("hidden", !isEmpty);
    }
    ssIcons();
  }
  function savePlan(id) {
    var priceEl = $("plan-price-" + id);
    var sessionsEl = $("plan-sessions-" + id);
    var discountEl = $("plan-discount-" + id);
    var list = ssMemberships();
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { idx = i; break; } }
    if (idx === -1) { ssToast("That plan no longer exists.", "error"); return; }
    var price = Number(priceEl ? priceEl.value : list[idx].price);
    var sessions = Number(sessionsEl ? sessionsEl.value : list[idx].sessions);
    var discount = Number(discountEl ? discountEl.value : list[idx].discount);
    if (!price || price < 0 || !sessions || sessions < 1 || discount < 0 || discount > 100) {
      ssToast("Please enter a valid price, session count and discount.", "error");
      return;
    }
    list[idx] = Object.assign({}, list[idx], { price: price, sessions: sessions, discount: discount });
    ssSet(SS_KEYS.memberships, list);
    ssToast(list[idx].name + " plan updated.", "success");
    renderAll();
  }
  function openPlanModal(id) {
    var p = ssGetPlan(id);
    if (!p) { ssToast("That plan no longer exists.", "error"); return; }
    planEditId = id;
    var title = $("plm-title");
    if (title) title.textContent = p.name + " plan";
    var inc = $("plm-includes");
    if (inc) inc.value = (p.includes || []).join(", ");
    var ben = $("plm-benefits");
    if (ben) ben.value = (p.benefits || []).join(", ");
    openModal("plan-modal");
  }
  function savePlanLists() {
    var list = ssMemberships();
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].id === planEditId) { idx = i; break; } }
    if (idx === -1) { ssToast("That plan no longer exists.", "error"); return; }
    var includes = $("plm-includes") ? splitList($("plm-includes").value) : [];
    var benefits = $("plm-benefits") ? splitList($("plm-benefits").value) : [];
    list[idx] = Object.assign({}, list[idx], { includes: includes, benefits: benefits });
    ssSet(SS_KEYS.memberships, list);
    ssToast(list[idx].name + " plan details updated.", "success");
    planEditId = null;
    closeModal("plan-modal");
    renderAll();
  }
  function extendMembership(email) {
    var accounts = ssAccounts();
    var acc = null;
    for (var i = 0; i < accounts.length; i++) { if (accounts[i].email === email) acc = accounts[i]; }
    if (!acc || !acc.membership) { ssToast("That client has no membership.", "error"); return; }
    var base = acc.membership.expiry && acc.membership.expiry >= today() ? acc.membership.expiry : today();
    var expiry = addDays(base, 30);
    ssUpdateAccount(email, { membership: Object.assign({}, acc.membership, { expiry: expiry }) });
    ssAddNotification(email, "Membership extended", "Your membership now runs until " + ssFmtDate(expiry) + ".");
    ssToast("Membership extended to " + ssFmtDate(expiry) + ".", "success");
    renderAll();
  }
  function removeMembership(email) {
    confirmModal("Remove membership?", "This client will fall back to pay-as-you-go pricing. Their session history stays on the account.", "Remove", function () {
      ssUpdateAccount(email, { membership: null });
      ssAddNotification(email, "Membership removed", "Your membership has been removed by the front desk. You can re-join a plan any time.");
      ssToast("Membership removed.", "success");
      renderAll();
    });
  }

  function renderPayments() {
    var rowsWrap = $("pay-rows");
    if (!rowsWrap) return;
    var list = sortDescByDate(ssPayments(), "date");
    var paidTotal = 0;
    var pendingTotal = 0;
    var failedMonth = 0;
    var monthKey = today().slice(0, 7);
    list.forEach(function (p) {
      if (p.status === "Paid") paidTotal += Number(p.amount || 0);
      if (p.status === "Pending") pendingTotal += Number(p.amount || 0);
      if (p.status === "Failed" && String(p.date || "").slice(0, 7) === monthKey) failedMonth++;
    });
    var summary = $("pay-summary");
    if (summary) {
      summary.innerHTML =
        statCard("wallet", ssMoney(paidTotal), "Total paid") +
        statCard("hourglass", ssMoney(pendingTotal), "Pending amount") +
        statCard("triangle-alert", String(failedMonth), "Failed this month") +
        statCard("receipt", String(list.length), "Invoices");
    }
    var rows = list.filter(function (p) { return payFilter === "All" || p.status === payFilter; });
    rowsWrap.innerHTML = rows.map(function (p) {
      return "<tr>" +
        '<td data-label="Invoice"><span class="font-medium">' + esc(p.id) + "</span></td>" +
        '<td data-label="Date">' + ssFmtDate(p.date) + "</td>" +
        '<td data-label="Client">' + esc(p.clientName || "—") + "</td>" +
        '<td data-label="Service">' + esc(p.service) + "</td>" +
        '<td data-label="Amount">' + ssMoney(p.amount) + "</td>" +
        '<td data-label="Method">' + esc(p.method || "Card") + "</td>" +
        '<td data-label="Status">' + statusSelect("pay-status", p.id, p.status, ["Paid", "Pending", "Failed"]) + "</td>" +
        '<td data-label="Receipt"><div class="flex flex-wrap justify-end">' +
        '<button type="button" data-action="receipt" data-id="' + esc(p.id) + '" class="rounded-full border border-sage-300 dark:border-sage-600 px-4 py-2 text-xs font-medium text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60 transition-colors">View</button>' +
        "</div></td></tr>";
    }).join("");
    var isEmpty = rows.length === 0;
    var table = $("pay-table-wrap");
    var empty = $("pay-empty");
    if (table) table.classList.toggle("hidden", isEmpty);
    if (empty) empty.classList.toggle("hidden", !isEmpty);
    document.querySelectorAll("#pay-filters .pay-chip").forEach(function (chip) {
      var on = chip.getAttribute("data-filter") === payFilter;
      chip.className = "pay-chip rounded-full border px-4 py-2 text-sm font-medium transition-colors " +
        (on
          ? "border-forest-700 bg-forest-700 text-cream-50 dark:bg-gold-500 dark:border-gold-500 dark:text-forest-900"
          : "border-sage-300 dark:border-sage-600 text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60");
    });
    ssIcons();
  }
  function changePayStatus(id, status) {
    var list = ssPayments();
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { idx = i; break; } }
    if (idx === -1) { ssToast("That invoice no longer exists.", "error"); return; }
    list[idx] = Object.assign({}, list[idx], { status: status });
    ssSet(SS_KEYS.payments, list);
    ssToast("Invoice " + list[idx].id + " marked " + status + ".", "success");
    renderPayments();
    renderOverview();
  }
  function openReceipt(id) {
    var list = ssPayments();
    var p = null;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { p = list[i]; break; } }
    if (!p) { ssToast("That invoice is unavailable.", "error"); return; }
    pick.receipt = p;
    var body = $("rc-body");
    if (body) {
      body.innerHTML =
        detailRow("Invoice", esc(p.id)) +
        detailRow("Date", ssFmtDate(p.date)) +
        detailRow("Client", esc(p.clientName || "—")) +
        detailRow("Service", esc(p.service)) +
        detailRow("Amount", ssMoney(p.amount)) +
        detailRow("Method", esc(p.method || "Card")) +
        detailRow("Status", payBadge(p.status));
    }
    openModal("receipt-modal");
  }
  function openPayModal() {
    var sel = $("pm-client");
    if (sel) {
      var clients = clientAccounts();
      sel.innerHTML = clients.map(function (a) {
        return '<option value="' + esc(a.email) + '">' + esc(a.name) + " (" + esc(a.email) + ")</option>";
      }).join("");
    }
    var service = $("pm-service");
    if (service) service.value = "";
    var amount = $("pm-amount");
    if (amount) amount.value = "";
    var method = $("pm-method");
    if (method) method.value = "Card";
    var status = $("pm-status");
    if (status) status.value = "Paid";
    openModal("pay-modal");
  }
  function savePayment() {
    var email = $("pm-client") ? $("pm-client").value : "";
    var service = $("pm-service") ? $("pm-service").value.trim() : "";
    var amount = $("pm-amount") ? Number($("pm-amount").value || 0) : 0;
    var method = $("pm-method") ? $("pm-method").value : "Card";
    var status = $("pm-status") ? $("pm-status").value : "Paid";
    var acc = null;
    ssAccounts().forEach(function (a) { if (a.email === email) acc = a; });
    if (!acc) { ssToast("Please choose a client.", "error"); return; }
    if (!service) { ssToast("Please enter the service description.", "error"); return; }
    if (!amount || amount < 0) { ssToast("Please enter a valid amount.", "error"); return; }
    ssAddPayment({
      userId: acc.email,
      clientName: acc.name,
      date: today(),
      service: service,
      amount: amount,
      method: method,
      status: status,
      type: "treatment"
    });
    ssAddNotification(acc.email, "Payment " + status.toLowerCase(), "We recorded " + ssMoney(amount) + " for " + service + ".");
    ssToast("Payment recorded.", "success");
    closeModal("pay-modal");
    renderAll();
  }

  function renderAvailability() {
    var list = $("avail-list");
    if (!list) return;
    var all = ssTherapists();
    var dayName = ssDayName(today());
    var available = all.filter(function (t) { return ssIsDayAvailable(t.id, today()); });
    var top = $("avail-top");
    if (top) {
      top.innerHTML = '<span class="inline-flex items-center gap-2 rounded-full border border-sage-200 dark:border-sage-700 bg-white dark:bg-forest-800 px-4 py-2 text-sm font-medium text-forest-700 dark:text-cream-100">' +
        '<i data-lucide="calendar-check" class="w-4 h-4 text-gold-500"></i>' + available.length + " of " + all.length + " available today</span>";
    }
    list.innerHTML = all.map(function (t) {
      var onToday = ssIsDayAvailable(t.id, today());
      var pill = onToday
        ? '<span class="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300 px-2.5 py-1 text-[11px] font-semibold">Available today</span>'
        : '<span class="inline-flex items-center rounded-full bg-sage-100 text-sage-700 dark:bg-sage-700/70 dark:text-sage-100 px-2.5 py-1 text-[11px] font-semibold">Off today</span>';
      var chips = DAYS.map(function (d) {
        var on = (t.days || []).indexOf(d) > -1;
        return '<button type="button" data-action="avail-day" data-id="' + esc(t.id) + '" data-day="' + d + '" class="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ' +
          (on
            ? "border-forest-700 bg-forest-700 text-cream-50 dark:border-gold-500 dark:bg-gold-500 dark:text-forest-900"
            : "border-sage-300 dark:border-sage-600 text-sage-700 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-700/60") +
          '">' + d + "</button>";
      }).join("");
      return cardWrap(
        '<div class="flex flex-wrap items-center justify-between gap-3">' +
        '<div class="min-w-0">' +
        '<h2 class="font-display text-xl font-semibold text-forest-700 dark:text-cream-100 truncate">' + esc(t.name) + "</h2>" +
        '<p class="text-xs uppercase tracking-wider text-sage-500 dark:text-sage-400">' + esc(t.specialty) + "</p></div>" + pill + "</div>" +
        '<p class="mt-4 text-xs font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400">Working days - ' + esc(dayName) + "</p>" +
        '<div class="mt-2 flex flex-wrap gap-2">' + chips + "</div>" +
        '<div class="mt-4 flex flex-wrap items-end gap-3">' +
        '<div class="min-w-[14rem] flex-1">' +
        '<label for="avail-slots-' + esc(t.id) + '" class="block text-xs font-semibold uppercase tracking-wider text-sage-500 dark:text-sage-400 mb-1.5">Slots (comma list)</label>' +
        '<input id="avail-slots-' + esc(t.id) + '" type="text" value="' + esc((t.slots || []).join(", ")) + '" class="w-full rounded-xl border border-sage-200 dark:border-sage-600 bg-white dark:bg-forest-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400" /></div>' +
        '<button type="button" data-action="avail-save" data-id="' + esc(t.id) + '" class="inline-flex items-center gap-2 rounded-full bg-forest-700 hover:bg-forest-600 dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-forest-900 text-cream-50 px-5 py-2.5 text-sm font-medium transition-colors"><i data-lucide="save" class="w-4 h-4"></i>Save</button>' +
        "</div>");
    }).join("") || '<p class="text-sm text-sage-600 dark:text-sage-300">No therapists yet - add one from the Therapists section.</p>';
    ssIcons();
  }
  function toggleAvailDay(id, day) {
    var list = ssTherapists();
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { idx = i; break; } }
    if (idx === -1) return;
    var days = (list[idx].days || []).slice();
    var at = days.indexOf(day);
    if (at > -1) days.splice(at, 1);
    else days.push(day);
    list[idx] = Object.assign({}, list[idx], { days: days });
    ssSet(SS_KEYS.therapists, list);
    ssToast((list[idx].name || "Therapist") + (at > -1 ? " now off on " : " now works on ") + day + ".", "success");
    renderAvailability();
    renderOverview();
  }
  function saveAvailSlots(id) {
    var input = $("avail-slots-" + id);
    var slots = splitList(input ? input.value : "");
    if (!slots.length) { ssToast("Please add at least one slot.", "error"); return; }
    var list = ssTherapists();
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { idx = i; break; } }
    if (idx === -1) return;
    list[idx] = Object.assign({}, list[idx], { slots: slots });
    ssSet(SS_KEYS.therapists, list);
    ssToast("Slots updated for " + (list[idx].name || "therapist") + ".", "success");
    renderAvailability();
    renderOverview();
  }

  function renderEnquiries() {
    var wrap = $("enq-list");
    if (!wrap) return;
    var list = ssGet(SS_KEYS.enquiries, []).slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    if (!list.length) {
      wrap.innerHTML = cardWrap(
        '<div class="text-center py-4">' +
        '<span class="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-sage-100 dark:bg-sage-700 text-forest-700 dark:text-gold-300"><i data-lucide="mail" class="w-6 h-6"></i></span>' +
        '<h2 class="mt-4 font-display text-xl font-semibold text-forest-700 dark:text-cream-100">Inbox zero</h2>' +
        '<p class="mt-1 text-sm text-sage-600 dark:text-sage-300">Messages from the contact form arrive here.</p></div>');
      ssIcons();
      return;
    }
    wrap.innerHTML = list.map(function (e) {
      return cardWrap(
        '<div class="flex flex-wrap items-start justify-between gap-3">' +
        '<div class="min-w-0">' +
        '<div class="flex flex-wrap items-center gap-2">' +
        '<h2 class="font-display text-lg font-semibold text-forest-700 dark:text-cream-100">' + esc(e.name) + "</h2>" + enqBadge(e.status) + "</div>" +
        '<div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sage-500 dark:text-sage-400">' +
        '<span class="inline-flex items-center gap-1.5"><i data-lucide="mail" class="w-3.5 h-3.5"></i>' + esc(e.email) + "</span>" +
        (e.phone ? '<span class="inline-flex items-center gap-1.5"><i data-lucide="phone" class="w-3.5 h-3.5"></i>' + esc(e.phone) + "</span>" : "") +
        '<span class="inline-flex items-center gap-1.5"><i data-lucide="clock-3" class="w-3.5 h-3.5"></i>' + ssTimeAgo(e.ts || 0) + "</span>" +
        "</div></div>" +
        '<div class="flex flex-wrap items-center gap-2">' +
        statusSelect("enq-status", e.id, e.status, ["New", "Replied", "Closed"]) +
        '<button type="button" data-action="enq-delete" data-id="' + esc(e.id) + '" class="rounded-full border border-red-200 dark:border-red-500/40 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Delete</button>' +
        "</div></div>" +
        '<p class="mt-3 text-sm leading-relaxed text-sage-600 dark:text-sage-300">' + esc(e.message) + "</p>");
    }).join("");
    ssIcons();
  }
  function changeEnqStatus(id, status) {
    var list = ssGet(SS_KEYS.enquiries, []);
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { idx = i; break; } }
    if (idx === -1) { ssToast("That enquiry no longer exists.", "error"); return; }
    list[idx] = Object.assign({}, list[idx], { status: status });
    ssSet(SS_KEYS.enquiries, list);
    ssToast("Enquiry marked " + status + ".", "success");
    renderEnquiries();
    renderOverview();
  }
  function deleteEnquiry(id) {
    confirmModal("Delete enquiry?", "The message will be permanently removed from your inbox.", "Delete", function () {
      var next = ssGet(SS_KEYS.enquiries, []).filter(function (e) { return e.id !== id; });
      ssSet(SS_KEYS.enquiries, next);
      ssToast("Enquiry deleted.", "success");
      renderAll();
    });
  }

  function renderSettings() {
    var s = (ssPreferences() || {}).adminSettings || {};
    var nameEl = $("st-spa-name");
    var tagEl = $("st-tagline");
    var phoneEl = $("st-phone");
    var emailEl = $("st-email");
    var addrEl = $("st-address");
    var hoursEl = $("st-hours");
    var curEl = $("st-currency");
    if (nameEl && document.activeElement !== nameEl) nameEl.value = s.spaName || "SereneSpa";
    if (tagEl && document.activeElement !== tagEl) tagEl.value = s.tagline || "";
    if (phoneEl && document.activeElement !== phoneEl) phoneEl.value = s.phone || "";
    if (emailEl && document.activeElement !== emailEl) emailEl.value = s.email || "";
    if (addrEl && document.activeElement !== addrEl) addrEl.value = s.address || "";
    if (hoursEl && document.activeElement !== hoursEl) hoursEl.value = s.hours || "";
    if (curEl) curEl.value = s.currency || "USD";
    var se = $("set-admin-email");
    if (se) se.textContent = U ? U.email : "";
    ssIcons();
  }
  function saveSettings() {
    var adminSettings = {
      spaName: $("st-spa-name") ? $("st-spa-name").value.trim() : "SereneSpa",
      tagline: $("st-tagline") ? $("st-tagline").value.trim() : "",
      phone: $("st-phone") ? $("st-phone").value.trim() : "",
      email: $("st-email") ? $("st-email").value.trim() : "",
      address: $("st-address") ? $("st-address").value.trim() : "",
      hours: $("st-hours") ? $("st-hours").value.trim() : "",
      currency: $("st-currency") ? $("st-currency").value : "USD"
    };
    if (!adminSettings.spaName) { ssToast("Please enter the spa name.", "error"); return; }
    ssSet(SS_KEYS.preferences, Object.assign({}, ssPreferences(), { adminSettings: adminSettings }));
    ssToast("Footer updated", "success");
  }

  function bindDelegates() {
    document.addEventListener("click", function (e) {
      if (!e.target || !e.target.closest) return;
      var vb = e.target.closest("button[data-view], a[data-view]");
      if (vb) {
        e.preventDefault();
        setView(vb.getAttribute("data-view"));
        return;
      }
      var ab = e.target.closest("[data-action]");
      if (!ab) return;
      var action = ab.getAttribute("data-action");
      var id = ab.getAttribute("data-id");
      if (action === "close-modal") {
        var m = ab.closest(".modal-backdrop");
        if (m) closeModal(m.id);
      } else if (action === "confirm-yes") {
        var cb = confirmCb;
        confirmCb = null;
        closeModal("confirm-modal");
        if (cb) cb();
      } else if (action === "ther-add") {
        openTherModal(null);
      } else if (action === "ther-edit") {
        openTherModal(id);
      } else if (action === "ther-save") {
        saveTherapist();
      } else if (action === "ther-delete") {
        deleteTherapist(id);
      } else if (action === "treat-add") {
        openTreatModal(null);
      } else if (action === "treat-edit") {
        openTreatModal(id);
      } else if (action === "treat-save") {
        saveTreatment();
      } else if (action === "treat-delete") {
        deleteTreatment(id);
      } else if (action === "client-view") {
        openClientModal(id);
      } else if (action === "client-delete") {
        deleteClient(id);
      } else if (action === "appt-filter") {
        apptFilter = ab.getAttribute("data-filter") || "All";
        renderAppointments();
      } else if (action === "appt-details") {
        openApptModal(id);
      } else if (action === "appt-delete") {
        deleteAppt(id);
      } else if (action === "plan-save") {
        savePlan(id);
      } else if (action === "plan-edit") {
        openPlanModal(id);
      } else if (action === "plan-lists-save") {
        savePlanLists();
      } else if (action === "member-extend") {
        extendMembership(id);
      } else if (action === "member-remove") {
        removeMembership(id);
      } else if (action === "pay-filter") {
        payFilter = ab.getAttribute("data-filter") || "All";
        renderPayments();
      } else if (action === "pay-record") {
        openPayModal();
      } else if (action === "pay-save") {
        savePayment();
      } else if (action === "receipt") {
        openReceipt(id);
      } else if (action === "avail-day") {
        toggleAvailDay(id, ab.getAttribute("data-day"));
      } else if (action === "avail-save") {
        saveAvailSlots(id);
      } else if (action === "enq-delete") {
        deleteEnquiry(id);
      } else if (action === "reset-demo") {
        confirmModal("Reset demo data?", "All local changes will be erased and the original SereneSpa seed data will be restored. You will stay signed in.", "Reset", resetDemoData);
      }
    });

    document.addEventListener("change", function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      var action = t.getAttribute("data-action");
      var id = t.getAttribute("data-id");
      if (action === "appt-status") changeApptStatus(id, t.value);
      else if (action === "pay-status") changePayStatus(id, t.value);
      else if (action === "enq-status") changeEnqStatus(id, t.value);
    });

    document.addEventListener("input", function (e) {
      var t = e.target;
      if (!t || !t.id) return;
      if (t.id === "cli-search") {
        clientQuery = t.value.trim();
        renderClients();
      } else if (t.id === "tr-search") {
        treatQuery = t.value.trim();
        renderTreatments();
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
    var form = $("settings-form");
    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); saveSettings(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var u = ssUser();
    if (!u || u.role !== "admin") { location.replace("login.html?next=admin"); return; }
    U = u;
    ssSeed();
    bindShell();
    bindForms();
    bindDelegates();
    renderAll();
    setView("overview");
  });

})();
