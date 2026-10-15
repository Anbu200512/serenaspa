(function () {
  var REMEMBER_KEY = "serenespa_remember";

  function el(id) { return document.getElementById(id); }

  function val(id) {
    var node = el(id);
    return node ? String(node.value || "") : "";
  }

  function showError(id, message) {
    var node = el(id);
    if (node) {
      node.textContent = message;
      node.classList.remove("hidden");
    }
    ssToast(message, "error");
  }

  function clearError(id) {
    var node = el(id);
    if (!node) return;
    node.textContent = "";
    node.classList.add("hidden");
  }

  function bindPwToggle(btnId, inputId) {
    var btn = el(btnId);
    var input = el(inputId);
    if (!btn || !input) return;
    btn.addEventListener("click", function () {
      var visible = input.type === "text";
      input.type = visible ? "password" : "text";
      btn.setAttribute("aria-label", visible ? "Show password" : "Hide password");
      btn.innerHTML = '<i data-lucide="' + (visible ? "eye" : "eye-off") + '" class="h-5 w-5"></i>';
      ssIcons();
    });
  }

  function normalizeMobile(digits) {
    if (digits.length === 12 && digits.indexOf("91") === 0) return digits.slice(2);
    if (digits.length === 11 && digits.charAt(0) === "0") return digits.slice(1);
    return digits;
  }

  function findAccount(raw) {
    var value = String(raw || "").trim();
    var lower = value.toLowerCase();
    var digits = normalizeMobile(value.replace(/\D/g, ""));
    var accounts = ssAccounts();
    for (var i = 0; i < accounts.length; i++) {
      var account = accounts[i];
      if (account.email && String(account.email).toLowerCase() === lower) return account;
      if (digits.length >= 6 && account.mobile && String(account.mobile).replace(/\D/g, "") === digits) return account;
    }
    return null;
  }

  function fillDemo(email, password) {
    var idInput = el("login-id");
    var pwInput = el("login-password");
    if (idInput) idInput.value = email;
    if (pwInput) {
      pwInput.value = password;
      pwInput.type = "password";
    }
    var toggle = el("login-pw-toggle");
    if (toggle) {
      toggle.setAttribute("aria-label", "Show password");
      toggle.innerHTML = '<i data-lucide="eye" class="h-5 w-5"></i>';
    }
    clearError("login-error");
    ssIcons();
    ssToast("Demo credentials filled in — select Sign in to continue.", "info");
  }

  function loginRedirect(session) {
    if (session.role === "admin") return "admin-dashboard.html";
    var next = "";
    try { next = new URLSearchParams(window.location.search).get("next") || ""; } catch (e) { next = ""; }
    var pages = { dashboard: "dashboard.html" };
    return pages[next.replace(/[^\w-]/g, "").toLowerCase()] || "dashboard.html";
  }

  function initLogin() {
    var form = el("login-form");
    if (!form) return;

    bindPwToggle("login-pw-toggle", "login-password");

    var clientBtn = el("demo-client");
    var adminBtn = el("demo-admin");
    if (clientBtn) clientBtn.addEventListener("click", function () { fillDemo("aisha@example.com", "spa123"); });
    if (adminBtn) adminBtn.addEventListener("click", function () { fillDemo("admin@serenespa.com", "admin123"); });

    var forgotBtn = el("forgot-btn");
    if (forgotBtn) forgotBtn.addEventListener("click", function () {
      ssToast("Demo mode — password resets are not actually sent. Any credentials will sign you in.", "info");
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearError("login-error");

      var identifier = val("login-id").trim();
      var password = val("login-password");
      if (!identifier || !password) {
        showError("login-error", "Enter your email or mobile number and password to continue.");
        return;
      }

      var account = findAccount(identifier);
      var session;
      if (account) {
        session = {
          name: account.name,
          email: account.email,
          mobile: account.mobile,
          role: account.role,
          membership: account.membership || null
        };
      } else {
        var email = /@/.test(identifier) ? identifier : "";
        var digits = normalizeMobile(identifier.replace(/\D/g, ""));
        var niceName = email ? email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : "Guest";
        session = { name: niceName, email: email || digits || identifier, mobile: digits, role: "client", membership: null };
      }

      var remember = el("login-remember");
      try {
        if (remember && remember.checked) localStorage.setItem(REMEMBER_KEY, "1");
        else localStorage.removeItem(REMEMBER_KEY);
      } catch (e) {}

      ssSaveUser(session);
      window.location.href = loginRedirect(session);
    });
  }

  function initSignup() {
    var form = el("signup-form");
    if (!form) return;

    bindPwToggle("su-pw-toggle", "su-password");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearError("signup-error");

      var name = val("su-name").trim().replace(/\s+/g, " ");
      var email = val("su-email").trim();
      var mobileDigits = normalizeMobile(val("su-mobile").replace(/^\+91/i, "").replace(/\D/g, ""));
      var password = val("su-password");
      var confirm = val("su-confirm");
      var terms = el("su-terms");

      var words = name.split(" ").filter(Boolean);
      if (words.length < 2 && name.length < 4) {
        showError("signup-error", "Please enter your full name — two words or at least four characters.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        showError("signup-error", "Enter a valid email address, for example name@example.com.");
        return;
      }
      if (mobileDigits.length !== 10) {
        showError("signup-error", "Your mobile number must be exactly 10 digits — a +91 prefix is fine.");
        return;
      }
      if (password.length < 6) {
        showError("signup-error", "Choose a password with at least 6 characters.");
        return;
      }
      if (password !== confirm) {
        showError("signup-error", "The passwords do not match — please retype them.");
        return;
      }
      if (!terms || !terms.checked) {
        showError("signup-error", "Please agree to the demo terms to create your account.");
        return;
      }

      var accounts = ssAccounts();
      var duplicate = accounts.some(function (account) {
        return account.email && String(account.email).toLowerCase() === email.toLowerCase();
      });
      if (duplicate) {
        showError("signup-error", "An account with this email already exists — sign in instead.");
        return;
      }

      var newAccount = { name: name, email: email, mobile: mobileDigits, password: password, role: "client", membership: null };
      accounts.push(newAccount);
      ssSet(SS_KEYS.accounts, accounts);
      ssSaveUser({ name: newAccount.name, email: newAccount.email, mobile: newAccount.mobile, role: "client", membership: null });
      ssAddNotification(newAccount.email, "Welcome to SereneSpa", "Your account is ready — book your first session from the dashboard.");
      window.location.href = "dashboard.html";
    });
  }

  function bindSocial() {
    var buttons = document.querySelectorAll("[data-social]");
    if (!buttons.length) return;
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener("click", function () {
        var provider = btn.getAttribute("data-social") || "social";
        var label = provider.charAt(0).toUpperCase() + provider.slice(1);
        ssSaveUser({ name: label + " User", email: "user@" + provider + ".demo", mobile: "", role: "client", membership: null });
        ssToast("Signed in with " + label + ".", "success");
        window.location.href = "dashboard.html";
      });
    });
  }

  window.ssLogout = function () {
    try { localStorage.removeItem(SS_KEYS.user); } catch (e) {}
    try { localStorage.removeItem(REMEMBER_KEY); } catch (e) {}
    window.location.href = "index.html";
  };

  function init() {
    initLogin();
    initSignup();
    bindSocial();
    ssIcons();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
