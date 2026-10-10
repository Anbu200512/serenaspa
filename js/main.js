

tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: { 50: "#fdfcf9", 100: "#faf7f0", 200: "#f3ede1", 300: "#e9dfcb", 400: "#ddd0b4" },
        sage: {
          50: "#f4f7f4", 100: "#e6ede7", 200: "#cddcd0", 300: "#adc4b3", 400: "#88a68f",
          500: "#6a8b74", 600: "#54705c", 700: "#445a4b", 800: "#38493e", 900: "#2e3c33"
        },
        beige: { 50: "#faf8f4", 100: "#f5f0e6", 200: "#ece3d2", 300: "#dfd1b8", 400: "#cdb894" },
        gold: { 300: "#d9c49a", 400: "#c9ad77", 500: "#b89a5c", 600: "#9c7f48" },
        forest: { 600: "#2a4b3b", 700: "#1f3a2e", 800: "#16291f", 900: "#0f1f17" }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "ui-serif", "Georgia", "serif"],
        sans: ["Jost", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 45px -22px rgba(31,58,46,.35)",
        card: "0 2px 14px rgba(31,58,46,.07)",
        lift: "0 26px 55px -26px rgba(31,58,46,.45)"
      }
    }
  }
};

const SS_KEYS = {
  theme: "serenespa_theme",
  direction: "serenespa_direction",
  user: "serenespa_user",
  accounts: "serenespa_accounts",
  appointments: "serenespa_appointments",
  treatments: "serenespa_treatments",
  therapists: "serenespa_therapists",
  memberships: "serenespa_memberships",
  payments: "serenespa_payments",
  notifications: "serenespa_notifications",
  preferences: "serenespa_preferences",
  enquiries: "serenespa_enquiries"
};

function ssGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) { return fallback; }
}
function ssSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { return false; }
}
function ssId(prefix) {
  return prefix + "-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}
function ssTodayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function ssAddDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function ssMoney(n) { return "$" + Number(n || 0).toLocaleString("en-US"); }
function ssFmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function ssDayName(iso) {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return "";
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}
function ssTimeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}
function ssEscape(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function ssIcons() { if (window.lucide) lucide.createIcons(); }

const SS_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SS_DEFAULT_TREATMENTS = [
  {
    id: "t1", name: "Swedish Massage", category: "Massage", duration: 60, price: 89,
    image: "https://images.pexels.com/photos/6560291/pexels-photo-6560291.jpeg?auto=compress&cs=tinysrgb&w=900",
    desc: "Long, flowing strokes with light to medium pressure to ease tension and boost circulation.",
    benefits: ["Relieves muscle tension", "Improves blood flow", "Reduces stress hormones", "Promotes deep relaxation"],
    featured: true
  },
  {
    id: "t2", name: "Deep Tissue Massage", category: "Therapy", duration: 75, price: 110,
    image: "https://images.pexels.com/photos/38407786/pexels-photo-38407786.jpeg?auto=compress&cs=tinysrgb&w=900",
    desc: "Slow, firm pressure that targets the deeper layers of muscle and connective tissue.",
    benefits: ["Breaks up adhesions", "Eases chronic pain", "Aids injury recovery", "Restores mobility"],
    featured: true
  },
  {
    id: "t3", name: "Aromatherapy Massage", category: "Relaxation", duration: 60, price: 95,
    image: "https://images.pexels.com/photos/6629607/pexels-photo-6629607.jpeg?auto=compress&cs=tinysrgb&w=900",
    desc: "Therapeutic massage blended with essential oils chosen to calm, uplift or rebalance you.",
    benefits: ["Calms the nervous system", "Balances mood", "Nourishes the skin", "Eases headache tension"],
    featured: true
  },
  {
    id: "t4", name: "Hot Stone Therapy", category: "Therapy", duration: 90, price: 130,
    image: "https://images.pexels.com/photos/6629530/pexels-photo-6629530.jpeg?auto=compress&cs=tinysrgb&w=900",
    desc: "Smooth heated basalt stones melt away stubborn knots while warming the whole body.",
    benefits: ["Releases deep tension", "Improves joint flexibility", "Encourages detox", "Deep warmth comfort"],
    featured: true
  },
  {
    id: "t5", name: "Relaxation Massage", category: "Relaxation", duration: 60, price: 85,
    image: "https://images.pexels.com/photos/4599377/pexels-photo-4599377.jpeg?auto=compress&cs=tinysrgb&w=900",
    desc: "A gentle, rhythmic treatment designed to quiet the mind and reset a busy week.",
    benefits: ["Lowers anxiety", "Improves sleep quality", "Softens tight muscles", "Leaves you recharged"],
    featured: false
  },
  {
    id: "t6", name: "Head & Shoulder Massage", category: "Specialty", duration: 45, price: 65,
    image: "https://images.pexels.com/photos/23349902/pexels-photo-23349902.jpeg?auto=compress&cs=tinysrgb&w=900",
    desc: "Focused work on the scalp, neck and shoulders for screen-strained bodies.",
    benefits: ["Relieves tension headache", "Releases neck stiffness", "Reduces eye strain", "Sharpens focus"],
    featured: false
  },
  {
    id: "t7", name: "Foot Reflexology", category: "Specialty", duration: 50, price: 70,
    image: "https://images.pexels.com/photos/5793888/pexels-photo-5793888.jpeg?auto=compress&cs=tinysrgb&w=900",
    desc: "Pressure-point work across the feet that corresponds to systems throughout the body.",
    benefits: ["Eases tired feet", "Supports circulation", "Encourages detox", "Whole-body balance"],
    featured: false
  },
  {
    id: "t8", name: "Couple Massage", category: "Massage", duration: 60, price: 180,
    image: "https://images.pexels.com/photos/7365434/pexels-photo-7365434.jpeg?auto=compress&cs=tinysrgb&w=900",
    desc: "Two therapists, one serene room — share a side-by-side massage with your partner or friend.",
    benefits: ["Shared quality time", "Synchronised relaxation", "Private suite", "Herbal tea ritual"],
    featured: false
  }
];

const SS_DEFAULT_THERAPISTS = [
  {
    id: "th1", name: "Elena Marlowe", specialty: "Swedish & Relaxation Therapy", experience: 11,
    expertise: ["Swedish Massage", "Relaxation Massage", "Aromatherapy Massage"],
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    slots: ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"],
    image: "https://images.pexels.com/photos/14677599/pexels-photo-14677599.jpeg?auto=compress&cs=tinysrgb&w=600",
    rating: 4.9, active: true,
    bio: "Elena trained in Stockholm and has spent a decade helping guests unwind with slow, flowing Scandinavian technique."
  },
  {
    id: "th2", name: "Marcus Vale", specialty: "Deep Tissue & Sports Recovery", experience: 9,
    expertise: ["Deep Tissue Massage", "Swedish Massage"],
    days: ["Mon", "Tue", "Wed", "Thu", "Sat"],
    slots: ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"],
    image: "https://images.pexels.com/photos/31880869/pexels-photo-31880869.jpeg?auto=compress&cs=tinysrgb&w=600",
    rating: 4.8, active: true,
    bio: "A former sports therapist, Marcus specialises in firm, focused pressure that resolves stubborn muscle knots."
  },
  {
    id: "th3", name: "Aria Bennett", specialty: "Aromatherapy & Holistic Wellness", experience: 8,
    expertise: ["Aromatherapy Massage", "Relaxation Massage", "Head & Shoulder Massage"],
    days: ["Tue", "Wed", "Thu", "Fri", "Sat"],
    slots: ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
    image: "https://images.pexels.com/photos/37524408/pexels-photo-37524408.jpeg?auto=compress&cs=tinysrgb&w=600",
    rating: 4.9, active: true,
    bio: "Aria blends botanical oils with intuitive bodywork to create a treatment tuned to how you feel that day."
  },
  {
    id: "th4", name: "Daniel Reyes", specialty: "Hot Stone & Thermal Therapy", experience: 12,
    expertise: ["Hot Stone Therapy", "Deep Tissue Massage"],
    days: ["Mon", "Wed", "Thu", "Fri", "Sun"],
    slots: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"],
    image: "https://images.pexels.com/photos/30975995/pexels-photo-30975995.jpeg?auto=compress&cs=tinysrgb&w=600",
    rating: 4.7, active: true,
    bio: "Daniel is our thermal therapy specialist, known for precise stone placement and deeply warming sessions."
  },
  {
    id: "th5", name: "Mira Castellano", specialty: "Reflexology & Pressure Point Therapy", experience: 7,
    expertise: ["Foot Reflexology", "Head & Shoulder Massage", "Relaxation Massage"],
    days: ["Mon", "Tue", "Thu", "Fri", "Sat"],
    slots: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
    image: "https://images.pexels.com/photos/6270346/pexels-photo-6270346.jpeg?auto=compress&cs=tinysrgb&w=600",
    rating: 4.8, active: true,
    bio: "Trained in Milan, Mira maps every reflex point with calm precision — ideal for tired feet and heavy legs."
  },
  {
    id: "th6", name: "Sophia Lindqvist", specialty: "Couples & Shared Spa Rituals", experience: 10,
    expertise: ["Couple Massage", "Swedish Massage", "Aromatherapy Massage"],
    days: ["Wed", "Thu", "Fri", "Sat", "Sun"],
    slots: ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"],
    image: "https://images.pexels.com/photos/26820703/pexels-photo-26820703.jpeg?auto=compress&cs=tinysrgb&w=600",
    rating: 5.0, active: true,
    bio: "Sophia hosts our couple suites, keeping both guests perfectly in sync from welcome tea to final stretch."
  }
];

const SS_DEFAULT_MEMBERSHIPS = [
  {
    id: "m1", name: "Relax", price: 49, period: "month", sessions: 2, discount: 5,
    includes: ["Relaxation Massage", "Foot Reflexology"],
    benefits: ["2 sessions every month", "5% off all extra treatments", "Members-only lounge access", "Free herbal tea ritual"],
    validity: "30 days per cycle", popular: false
  },
  {
    id: "m2", name: "Restore", price: 89, period: "month", sessions: 4, discount: 10,
    includes: ["Deep Tissue Massage", "Hot Stone Therapy", "Swedish Massage"],
    benefits: ["4 sessions every month", "10% off all extra treatments", "Priority weekday booking", "1 guest pass per month"],
    validity: "30 days per cycle", popular: true
  },
  {
    id: "m3", name: "Wellness", price: 139, period: "month", sessions: 6, discount: 15,
    includes: ["All standard massages", "Aromatherapy Massage", "Head & Shoulder Massage"],
    benefits: ["6 sessions every month", "15% off all extra treatments", "Priority booking any day", "2 guest passes per month", "Quarterly wellness review"],
    validity: "30 days per cycle", popular: false
  },
  {
    id: "m4", name: "Premium", price: 229, period: "month", sessions: 10, discount: 25,
    includes: ["Entire treatment menu", "1 Couple Massage per month", "Hot Stone upgrades"],
    benefits: ["10 sessions every month", "25% off all extra treatments", "Same-day appointments", "4 guest passes per month", "Annual spa day gift"],
    validity: "30 days per cycle", popular: false
  }
];

const SS_DEFAULT_ACCOUNTS = [
  { name: "Aisha Kapoor", email: "aisha@example.com", mobile: "9876543210", password: "spa123", role: "client",
    membership: { planId: "m3", sessions: 6, used: 4, expiry: ssAddDaysISO(18), joined: ssAddDaysISO(-12) } },
  { name: "Noah Whitfield", email: "noah@example.com", mobile: "9876543211", password: "spa123", role: "client",
    membership: { planId: "m1", sessions: 2, used: 1, expiry: ssAddDaysISO(9), joined: ssAddDaysISO(-21) } },
  { name: "SereneSpa Admin", email: "admin@serenespa.com", mobile: "9876543212", password: "admin123", role: "admin", membership: null }
];

function ssSeedAppointments() {
  return [
    { id: "APT-KICK01", userId: "aisha@example.com", clientName: "Aisha Kapoor", treatmentId: "t2", treatmentName: "Deep Tissue Massage",
      therapistId: "th2", therapistName: "Marcus Vale", date: ssAddDaysISO(1), time: "15:00", duration: 75, price: 110,
      status: "Confirmed", preference: "Focus on lower back and shoulders, please keep the room cool.", createdAt: Date.now() - 864e5 },
    { id: "APT-KICK02", userId: "noah@example.com", clientName: "Noah Whitfield", treatmentId: "t1", treatmentName: "Swedish Massage",
      therapistId: "th1", therapistName: "Elena Marlowe", date: ssTodayISO(), time: "11:00", duration: 60, price: 89,
      status: "Confirmed", preference: "", createdAt: Date.now() - 1728e5 },
    { id: "APT-HIST1", userId: "aisha@example.com", clientName: "Aisha Kapoor", treatmentId: "t4", treatmentName: "Hot Stone Therapy",
      therapistId: "th4", therapistName: "Daniel Reyes", date: ssAddDaysISO(-6), time: "14:00", duration: 90, price: 130,
      status: "Completed", preference: "", createdAt: Date.now() - 7 * 864e5 },
    { id: "APT-HIST2", userId: "aisha@example.com", clientName: "Aisha Kapoor", treatmentId: "t3", treatmentName: "Aromatherapy Massage",
      therapistId: "th3", therapistName: "Aria Bennett", date: ssAddDaysISO(-13), time: "16:00", duration: 60, price: 95,
      status: "Completed", preference: "Lavender blend if available.", createdAt: Date.now() - 14 * 864e5 },
    { id: "APT-HIST3", userId: "aisha@example.com", clientName: "Aisha Kapoor", treatmentId: "t7", treatmentName: "Foot Reflexology",
      therapistId: "th5", therapistName: "Mira Castellano", date: ssAddDaysISO(-20), time: "10:00", duration: 50, price: 70,
      status: "Completed", preference: "", createdAt: Date.now() - 21 * 864e5 },
    { id: "APT-CANC1", userId: "aisha@example.com", clientName: "Aisha Kapoor", treatmentId: "t5", treatmentName: "Relaxation Massage",
      therapistId: "th1", therapistName: "Elena Marlowe", date: ssAddDaysISO(-27), time: "17:00", duration: 60, price: 85,
      status: "Cancelled", preference: "", createdAt: Date.now() - 28 * 864e5 },
    { id: "APT-KICK03", userId: "noah@example.com", clientName: "Noah Whitfield", treatmentId: "t7", treatmentName: "Foot Reflexology",
      therapistId: "th5", therapistName: "Mira Castellano", date: ssTodayISO(), time: "16:00", duration: 50, price: 70,
      status: "Pending", preference: "First visit — gentle pressure please.", createdAt: Date.now() - 36e5 }
  ];
}

function ssSeedPayments() {
  return [
    { id: "INV-2601", userId: "aisha@example.com", clientName: "Aisha Kapoor", date: ssAddDaysISO(-12), service: "Wellness Membership — Monthly",
      amount: 139, method: "Card", status: "Paid", type: "membership" },
    { id: "INV-2602", userId: "aisha@example.com", clientName: "Aisha Kapoor", date: ssAddDaysISO(-6), service: "Hot Stone Therapy · 90 min",
      amount: 130, method: "Card", status: "Paid", type: "treatment" },
    { id: "INV-2603", userId: "aisha@example.com", clientName: "Aisha Kapoor", date: ssAddDaysISO(-13), service: "Aromatherapy Massage · 60 min",
      amount: 95, method: "Wallet", status: "Paid", type: "treatment" },
    { id: "INV-2604", userId: "aisha@example.com", clientName: "Aisha Kapoor", date: ssAddDaysISO(1), service: "Deep Tissue Massage · 75 min",
      amount: 110, method: "Pay at spa", status: "Pending", type: "treatment" },
    { id: "INV-2605", userId: "noah@example.com", clientName: "Noah Whitfield", date: ssAddDaysISO(-21), service: "Relax Membership — Monthly",
      amount: 49, method: "Card", status: "Paid", type: "membership" },
    { id: "INV-2606", userId: "noah@example.com", clientName: "Noah Whitfield", date: ssAddDaysISO(-2), service: "Swedish Massage · 60 min",
      amount: 89, method: "Card", status: "Failed", type: "treatment" }
  ];
}

function ssSeedNotifications() {
  const now = Date.now();
  return [
    { id: "n1", userId: "aisha@example.com", title: "Welcome to SereneSpa", body: "Your member account is ready. Explore treatments and book your first session.", ts: now - 864e5 * 12, read: false },
    { id: "n2", userId: "aisha@example.com", title: "Appointment confirmed", body: "Deep Tissue Massage with Marcus Vale is confirmed for tomorrow at 15:00.", ts: now - 864e5, read: false },
    { id: "n3", userId: "aisha@example.com", title: "Membership update", body: "2 of 6 Wellness sessions remaining this cycle. Renew before your expiry to keep your discount.", ts: now - 36e5 * 5, read: false },
    { id: "n4", userId: "aisha@example.com", title: "Payment received", body: "We received $130 for your Hot Stone Therapy. Receipt INV-2602 is ready.", ts: now - 864e5 * 6, read: true },
    { id: "n5", userId: "noah@example.com", title: "Appointment pending", body: "Your Foot Reflexology booking is awaiting confirmation from the front desk.", ts: now - 36e5, read: false },
    { id: "n6", userId: "admin", title: "New enquiry received", body: "Lena Ortiz asked about corporate wellness packages.", ts: now - 72e5, read: false }
  ];
}

function ssSeedEnquiries() {
  return [
    { id: "ENQ-1001", name: "Lena Ortiz", email: "lena.ortiz@northbay.co", phone: "555-0142",
      message: "Do you offer corporate wellness packages for a team of 12?", status: "New", ts: Date.now() - 72e5 },
    { id: "ENQ-1002", name: "Tom Beckett", email: "tom.beckett@mailbox.com", phone: "555-0177",
      message: "Is the couple suite available on Sunday evenings?", status: "New", ts: Date.now() - 864e5 * 2 },
    { id: "ENQ-1003", name: "Priya Nair", email: "priya.nair@wellread.io", phone: "555-0198",
      message: "I would like to upgrade from Restore to Wellness — how does the proration work?", status: "Replied", ts: Date.now() - 864e5 * 4 }
  ];
}

function ssSeedPreferences() {
  return {
    therapistId: "th1",
    preferredTime: "15:00",
    notes: "Quiet room, medium pressure. Please avoid oil blends with strong citrus.",
    adminSettings: {
      spaName: "SereneSpa",
      tagline: "Relax. Restore. Rejuvenate.",
      phone: "+1 (555) 018-2244",
      email: "hello@serenespa.com",
      address: "14 Willow Court, Riverside District",
      hours: "Mon–Sat 9:00–20:00 · Sun 10:00–18:00",
      currency: "USD"
    }
  };
}

function ssSeed() {
  if (!ssGet(SS_KEYS.treatments)) ssSet(SS_KEYS.treatments, SS_DEFAULT_TREATMENTS);
  if (!ssGet(SS_KEYS.therapists)) ssSet(SS_KEYS.therapists, SS_DEFAULT_THERAPISTS);
  if (!ssGet(SS_KEYS.memberships)) ssSet(SS_KEYS.memberships, SS_DEFAULT_MEMBERSHIPS);
  if (!ssGet(SS_KEYS.accounts)) ssSet(SS_KEYS.accounts, SS_DEFAULT_ACCOUNTS);
  if (!ssGet(SS_KEYS.appointments)) ssSet(SS_KEYS.appointments, ssSeedAppointments());
  if (!ssGet(SS_KEYS.payments)) ssSet(SS_KEYS.payments, ssSeedPayments());
  if (!ssGet(SS_KEYS.notifications)) ssSet(SS_KEYS.notifications, ssSeedNotifications());
  if (!ssGet(SS_KEYS.enquiries)) ssSet(SS_KEYS.enquiries, ssSeedEnquiries());
  if (!ssGet(SS_KEYS.preferences)) ssSet(SS_KEYS.preferences, ssSeedPreferences());
}

function ssTreatments() { return ssGet(SS_KEYS.treatments, SS_DEFAULT_TREATMENTS); }
function ssTherapists() { return ssGet(SS_KEYS.therapists, SS_DEFAULT_THERAPISTS); }
function ssMemberships() { return ssGet(SS_KEYS.memberships, SS_DEFAULT_MEMBERSHIPS); }
function ssAppointments() { return ssGet(SS_KEYS.appointments, []); }
function ssPayments() { return ssGet(SS_KEYS.payments, []); }
function ssAccounts() { return ssGet(SS_KEYS.accounts, SS_DEFAULT_ACCOUNTS); }
function ssNotifications() { return ssGet(SS_KEYS.notifications, []); }
function ssPreferences() { return ssGet(SS_KEYS.preferences, ssSeedPreferences()); }

function ssUser() { return ssGet(SS_KEYS.user, null); }
function ssSaveUser(u) { ssSet(SS_KEYS.user, u); }
function ssIsAdmin() { const u = ssUser(); return !!u && u.role === "admin"; }

function ssGetTreatment(id) { return ssTreatments().find(t => t.id === id) || null; }
function ssGetTherapist(id) { return ssTherapists().find(t => t.id === id) || null; }
function ssGetPlan(id) { return ssMemberships().find(m => m.id === id) || null; }

function ssAccountMembership(email) {
  const acc = ssAccounts().find(a => a.email === email);
  return acc && acc.membership ? acc.membership : null;
}
function ssUpdateAccount(email, patch) {
  const accounts = ssAccounts();
  const i = accounts.findIndex(a => a.email === email);
  if (i > -1) {
    accounts[i] = Object.assign({}, accounts[i], patch);
    ssSet(SS_KEYS.accounts, accounts);
    if (ssUser() && ssUser().email === email) {
      const u = ssUser();
      Object.assign(u, patch);
      ssSaveUser(u);
    }
    return true;
  }
  return false;
}

function ssBookedSlots(therapistId, dateISO, excludeApptId) {
  return ssAppointments()
    .filter(a => a.therapistId === therapistId && a.date === dateISO && a.status !== "Cancelled" && a.id !== excludeApptId)
    .map(a => a.time);
}
function ssDaySlots(therapistId, dateISO) {
  const th = ssGetTherapist(therapistId);
  if (!th) return [];
  const day = ssDayName(dateISO);
  if (!th.days.includes(day)) return [];
  const booked = ssBookedSlots(therapistId, dateISO);
  return (th.slots || []).filter(s => !booked.includes(s));
}
function ssIsDayAvailable(therapistId, dateISO) {
  const th = ssGetTherapist(therapistId);
  if (!th || !th.active) return false;
  if (dateISO < ssTodayISO()) return false;
  return th.days.includes(ssDayName(dateISO));
}

function ssAddNotification(userId, title, body) {
  const list = ssNotifications();
  list.unshift({ id: ssId("n"), userId, title, body, ts: Date.now(), read: false });
  ssSet(SS_KEYS.notifications, list.slice(0, 80));
}
function ssUnreadCount(email) {
  return ssNotifications().filter(n => (n.userId === email || n.userId === "admin") && !n.read).length;
}
function ssAddPayment(p) {
  const list = ssPayments();
  const id = "INV-" + String(Date.now()).slice(-6);
  const rec = Object.assign({ id, method: "Card", status: "Paid", type: "treatment" }, p);
  list.unshift(rec);
  ssSet(SS_KEYS.payments, list);
  return rec;
}
function ssAddEnquiry(e) {
  const list = ssGet(SS_KEYS.enquiries, []);
  const rec = Object.assign({ id: ssId("ENQ"), status: "New", ts: Date.now() }, e);
  list.unshift(rec);
  ssSet(SS_KEYS.enquiries, list);
  return rec;
}

function ssToast(message, type) {
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    document.body.appendChild(root);
  }
  const icon = type === "error" ? "circle-alert" : type === "success" ? "circle-check" : "info";
  const el = document.createElement("div");
  el.className = "ss-toast" + (type ? " toast-" + type : "");
  el.setAttribute("role", "status");
  el.innerHTML = '<i data-lucide="' + icon + '" class="w-4 h-4 mt-0.5 shrink-0"></i><span>' + ssEscape(message) + "</span>";
  root.appendChild(el);
  ssIcons();
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 320);
  }, 3400);
}

function ssInitReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) {
    els.forEach(e => e.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(e => io.observe(e));
}

function ssInitFaq() {
  document.querySelectorAll(".faq-item").forEach(item => {
    const btn = item.querySelector(".faq-q");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const open = item.classList.contains("open");
      item.parentElement.querySelectorAll(".faq-item.open").forEach(o => o.classList.remove("open"));
      if (!open) item.classList.add("open");
    });
  });
}

function ssInitContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.name || !data.email || !data.message) { ssToast("Please fill in your name, email and message.", "error"); return; }
    ssAddEnquiry({ name: data.name, email: data.email, phone: data.phone || "", message: data.message });
    form.reset();
    ssToast("Thank you — our team will reply within one business day.", "success");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ssSeed();
  ssInitReveal();
  ssInitFaq();
  ssInitContactForm();
  ssIcons();
});
