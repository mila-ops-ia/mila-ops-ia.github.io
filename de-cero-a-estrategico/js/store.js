// Persistencia. Dos modos:
// - Supabase: si js/config.js tiene URL y clave. Login por mail y datos en la base.
// - Demo: sin configuración. Todo vive en el localStorage de este navegador.
// La app lee siempre de `state` (en memoria); las escrituras se guardan en el modo activo.

const CFG = window.DCE_CONFIG || {};
const REMOTE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
// Flujo "implicit": el link del mail funciona aunque se abra en otro navegador o en el celular.
const sb = REMOTE && window.supabase ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { flowType: "implicit" } }) : null;

const STORE_KEY = "dce:v1";
const RETURN_KEY = "dce:volver";
const ADMIN_EMAIL = "mili@deceroaestrategico.com";
const ADMIN_CODE = "mili2026"; // solo en modo demo

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));
const now = () => new Date().toISOString();

let memoryFallback = null;

function emptyState() {
  return {
    users: [],
    sessionUserId: null,
    progress: {}, // userId -> code -> { viewed, completed, quizAnswer, quizCorrect, at }
    ratings: [], // { id, userId, code, stars, comment, at }
    submissions: [], // { id, userId, code, link, desc, at, grade, feedback, gradedAt }
    questions: [], // { id, userId, code, text, at, answer, answeredAt }
    levelTest: {}, // userId -> { level, score, at }
    recording: {}, // code -> { status, notes, url }
    purchases: [], // { id, userId, level, amount, source, at }
  };
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    if (memoryFallback) return memoryFallback;
  }
  const s = seedDemo(emptyState());
  saveLocal(s);
  return s;
}

function saveLocal(s) {
  memoryFallback = s;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch (e) {
    /* sin almacenamiento: queda en memoria */
  }
}

let state = REMOTE ? emptyState() : loadLocal();
if (!state.purchases) state.purchases = [];

// Aplica un cambio en memoria y, en Supabase, lo guarda en la base.
function update(fn, remoteWrite) {
  fn(state);
  if (!REMOTE) return saveLocal(state);
  if (!remoteWrite) return;
  remoteWrite().then(({ error }) => {
    if (error) {
      console.error(error);
      if (typeof toast === "function") toast("No se pudo guardar: " + error.message);
    }
  });
}

function resetDemo() {
  if (REMOTE) return;
  state = seedDemo(emptyState());
  saveLocal(state);
}

// ───────────── Carga inicial (Supabase) ─────────────

const fromRow = {
  user: (r) => ({ id: r.id, name: r.name || r.email, email: r.email, role: r.role, createdAt: r.created_at, lastActive: r.last_active }),
  rating: (r) => ({ id: r.id, userId: r.user_id, code: r.code, stars: r.stars, comment: r.comment, at: r.created_at }),
  submission: (r) => ({
    id: r.id, userId: r.user_id, code: r.code, link: r.link, desc: r.description, at: r.created_at,
    ...(r.grade !== null ? { grade: r.grade, feedback: r.feedback, gradedAt: r.graded_at } : {}),
  }),
  question: (r) => ({
    id: r.id, userId: r.user_id, code: r.code, text: r.text, at: r.created_at,
    ...(r.answer !== null ? { answer: r.answer, answeredAt: r.answered_at } : {}),
  }),
  purchase: (r) => ({ id: r.id, userId: r.user_id, level: r.level, amount: Number(r.amount), source: r.source, at: r.created_at }),
};

let loginError = null; // mensaje para mostrar si el link del mail falló
let paymentReturn = null; // { status, level } al volver de Mercado Pago

async function initStore() {
  // Vuelta desde Mercado Pago: ?pago=ok|pendiente|error&nivel=2
  const qs = new URLSearchParams(location.search);
  if (qs.get("pago")) {
    paymentReturn = { status: qs.get("pago"), level: Number(qs.get("nivel")) };
    history.replaceState(null, "", location.pathname + `#/cursos?nivel=${paymentReturn.level || 2}`);
  }
  if (!REMOTE) return;
  if (!sb) throw new Error("No se pudo cargar la librería de Supabase.");

  // Al volver desde el link del mail, la URL trae los datos de sesión (o un error).
  // Se lee antes de getSession, que la limpia.
  const startUrl = location.hash + location.search;
  const { data: { session } } = await sb.auth.getSession();

  // Vuelta desde Google o desde un mail de Supabase (link de recuperación de contraseña)
  if (/access_token=|error_code=|[?&]code=/.test(startUrl)) {
    if (/error_code=/.test(startUrl)) loginError = "El link venció o ya se usó. Pedí uno nuevo.";
    let volver = "";
    try { volver = localStorage.getItem(RETURN_KEY) || ""; localStorage.removeItem(RETURN_KEY); } catch (e) {}
    const recovery = /type=recovery/.test(startUrl);
    history.replaceState(null, "", location.pathname + (!session ? "#/ingresar" : recovery ? "#/nueva-clave" : volver || "#/"));
  }

  const s = emptyState();
  const videos = await sb.rpc("public_videos");
  (videos.data || []).forEach((v) => (s.recording[v.code] = { url: v.url }));

  if (session) {
    // RLS filtra: un alumno recibe solo sus filas, el admin recibe todo.
    const [profiles, progress, ratings, submissions, questions, tests] = await Promise.all([
      sb.from("profiles").select("*"),
      sb.from("progress").select("*"),
      sb.from("ratings").select("*"),
      sb.from("submissions").select("*").order("created_at"),
      sb.from("questions").select("*").order("created_at"),
      sb.from("level_tests").select("*"),
    ]);
    const err = [profiles, progress, ratings, submissions, questions, tests].find((r) => r.error);
    if (err) throw err.error;

    s.users = profiles.data.map(fromRow.user);
    s.sessionUserId = session.user.id;
    progress.data.forEach((r) => {
      s.progress[r.user_id] = s.progress[r.user_id] || {};
      s.progress[r.user_id][r.code] = {
        viewed: r.viewed, completed: r.completed, at: r.updated_at,
        ...(r.quiz_answer !== null ? { quizAnswer: r.quiz_answer, quizCorrect: r.quiz_correct } : {}),
      };
    });
    s.ratings = ratings.data.map(fromRow.rating);
    s.submissions = submissions.data.map(fromRow.submission);
    s.questions = questions.data.map(fromRow.question);
    tests.data.forEach((r) => (s.levelTest[r.user_id] = { level: r.level, score: r.score, at: r.created_at }));
    s.purchases = await loadPurchases();

    if (s.users.find((u) => u.id === session.user.id)?.role === "admin") {
      const rec = await sb.from("recordings").select("*");
      (rec.data || []).forEach((r) => (s.recording[r.code] = { status: r.status, notes: r.notes, url: r.url }));
    }
  }
  state = s;
}

// Si la tabla de compras todavía no existe, la web sigue andando (todo pago queda bloqueado)
async function loadPurchases() {
  const { data, error } = await sb.from("purchases").select("*").order("created_at");
  if (error) { console.warn("Compras:", error.message); return []; }
  return data.map(fromRow.purchase);
}

// ───────────── Niveles pagos ─────────────

function hasLevel(userId, level) {
  if (level === 1) return true;
  const u = state.users.find((x) => x.id === userId);
  if (u && u.role === "admin") return true;
  return state.purchases.some((p) => p.userId === userId && p.level === level);
}

// Demo: habilita al instante. Supabase: pide el link de pago a la función crear-pago y redirige.
async function buyLevel(userId, level) {
  if (!REMOTE) {
    update((s) => s.purchases.push({ id: uid(), userId, level, amount: LEVELS[level - 1].price, source: "demo", at: now() }));
    return { ok: true };
  }
  const { data, error } = await sb.functions.invoke("crear-pago", {
    body: { level, returnUrl: location.origin + location.pathname },
  });
  if (error || !data || !data.url) {
    let msg = (data && data.error) || (error && error.message) || "No se pudo iniciar el pago";
    try { const b = await error.context.json(); if (b.error) msg = b.error; } catch (e) {}
    return { error: msg };
  }
  location.href = data.url;
  return { redirecting: true };
}

// Al volver de pagar, el aviso de Mercado Pago puede tardar unos segundos: reintenta
async function waitForPurchase(userId, level, tries = 8) {
  for (let i = 0; i < tries; i++) {
    if (hasLevel(userId, level)) return true;
    if (!REMOTE) return false;
    await new Promise((r) => setTimeout(r, 2500));
    state.purchases = await loadPurchases();
  }
  return hasLevel(userId, level);
}

// Admin: habilitar un nivel a mano (regalo, transferencia, etc.)
function grantLevel(userId, level) {
  const p = { id: uid(), userId, level, amount: 0, source: "manual", at: now() };
  update(
    (s) => s.purchases.push(p),
    () => sb.from("purchases").insert({ id: p.id, user_id: userId, level, amount: 0, source: "manual", created_at: p.at })
  );
}

function revokeLevel(id) {
  update(
    (s) => (s.purchases = s.purchases.filter((p) => p.id !== id)),
    () => sb.from("purchases").delete().eq("id", id)
  );
}

// ───────────── Sesión ─────────────

function currentUser() {
  return state.users.find((u) => u.id === state.sessionUserId) || null;
}

function isAdmin() {
  const u = currentUser();
  return !!u && u.role === "admin";
}

// ── Ingreso con Google o con mail y contraseña (Supabase) ──

const authErrors = (msg) => {
  if (/invalid login credentials/i.test(msg)) return "El mail o la contraseña no coinciden.";
  if (/already registered|already exists/i.test(msg)) return "Ya hay una cuenta con ese mail. Entrá con tu contraseña o con Google.";
  if (/password should be at least|weak/i.test(msg)) return "La contraseña tiene que tener al menos 8 caracteres.";
  if (/email not confirmed/i.test(msg)) return "Falta confirmar el mail de esta cuenta.";
  if (/rate limit|only request this after/i.test(msg)) return "Hubo muchos intentos seguidos. Probá de nuevo en un rato.";
  return msg;
};

async function loginGoogle(volver) {
  try { localStorage.setItem(RETURN_KEY, volver || "#/"); } catch (e) {}
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: location.origin + location.pathname },
  });
  return error ? { error: authErrors(error.message) } : { redirecting: true };
}

async function signUpPassword(name, email, password) {
  const { data, error } = await sb.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { name: name.trim() }, emailRedirectTo: location.origin + location.pathname },
  });
  if (error) return { error: authErrors(error.message) };
  if (!data.session) return { needsConfirm: true }; // si Supabase pide confirmar el mail
  await initStore();
  return { ok: true };
}

async function signInPassword(email, password) {
  const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) return { error: authErrors(error.message) };
  await initStore();
  return { ok: true };
}

async function sendPasswordReset(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: location.origin + location.pathname });
  return error ? { error: authErrors(error.message) } : { sent: true };
}

async function setNewPassword(password) {
  const { error } = await sb.auth.updateUser({ password });
  return error ? { error: authErrors(error.message) } : { ok: true };
}

// Demo: entra directo con nombre y mail. Supabase: manda un link de ingreso al mail.
async function login(name, email, volver) {
  email = email.trim().toLowerCase();
  name = name.trim();
  if (REMOTE) {
    try { localStorage.setItem(RETURN_KEY, volver || "#/"); } catch (e) {}
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { data: { name }, emailRedirectTo: location.origin + location.pathname },
    });
    return error ? { error: error.message } : { sent: true };
  }
  let user = state.users.find((u) => u.email === email);
  update((s) => {
    if (!user) {
      user = { id: uid(), name, email, role: "alumno", createdAt: now(), lastActive: now() };
      s.users.push(user);
    } else if (name) {
      user.name = name;
    }
    user.lastActive = now();
    s.sessionUserId = user.id;
  });
  return { user };
}

function loginAdmin(code) {
  if (REMOTE || code !== ADMIN_CODE) return false;
  update((s) => {
    let admin = s.users.find((u) => u.role === "admin");
    if (!admin) {
      admin = { id: uid(), name: "Milagros Sanabria", email: ADMIN_EMAIL, role: "admin", createdAt: now(), lastActive: now() };
      s.users.push(admin);
    }
    s.sessionUserId = admin.id;
  });
  return true;
}

async function logout() {
  if (REMOTE) {
    await sb.auth.signOut();
    await initStore();
    return;
  }
  update((s) => (s.sessionUserId = null));
}

function touch() {
  const u = currentUser();
  if (!u) return;
  const at = now();
  update(() => (u.lastActive = at), () => sb.from("profiles").update({ last_active: at }).eq("id", u.id));
}

// ───────────── Escrituras ─────────────

function setProg(userId, code, patch) {
  const at = now();
  let row;
  update(
    (s) => {
      s.progress[userId] = s.progress[userId] || {};
      row = s.progress[userId][code] = { ...(s.progress[userId][code] || {}), ...patch, at };
      const u = s.users.find((x) => x.id === userId);
      if (u) u.lastActive = at;
    },
    () =>
      sb.from("progress").upsert({
        user_id: userId, code, viewed: !!row.viewed, completed: !!row.completed,
        quiz_answer: row.quizAnswer ?? null, quiz_correct: row.quizCorrect ?? null, updated_at: at,
      })
  );
}

function saveLevelTest(userId, level, score) {
  const at = now();
  update(
    (s) => (s.levelTest[userId] = { level, score, at }),
    () => sb.from("level_tests").upsert({ user_id: userId, level, score, created_at: at })
  );
}

function saveRating(userId, code, stars, comment) {
  const at = now();
  update(
    (s) => {
      const r = s.ratings.find((x) => x.userId === userId && x.code === code);
      if (r) Object.assign(r, { stars, comment, at });
      else s.ratings.push({ id: uid(), userId, code, stars, comment, at });
    },
    () => sb.from("ratings").upsert({ user_id: userId, code, stars, comment, created_at: at }, { onConflict: "user_id,code" })
  );
}

function addQuestion(userId, code, text) {
  const q = { id: uid(), userId, code, text, at: now() };
  update(
    (s) => s.questions.push(q),
    () => sb.from("questions").insert({ id: q.id, user_id: userId, code, text, created_at: q.at })
  );
}

function addSubmission(userId, code, link, desc) {
  const x = { id: uid(), userId, code, link, desc, at: now() };
  update(
    (s) => s.submissions.push(x),
    () => sb.from("submissions").insert({ id: x.id, user_id: userId, code, link, description: desc, created_at: x.at })
  );
}

function answerQuestion(id, answer) {
  const at = now();
  update(
    (s) => Object.assign(s.questions.find((q) => q.id === id), { answer, answeredAt: at }),
    () => sb.from("questions").update({ answer, answered_at: at }).eq("id", id)
  );
}

function gradeSubmission(id, grade, feedback) {
  const at = now();
  update(
    (s) => Object.assign(s.submissions.find((x) => x.id === id), { grade, feedback, gradedAt: at }),
    () => sb.from("submissions").update({ grade, feedback, graded_at: at }).eq("id", id)
  );
}

const recOf = (code) => ({ status: "Por grabar", notes: "", url: "", ...(state.recording[code] || {}) });

function setRec(code, patch) {
  let r;
  update(
    (s) => (r = s.recording[code] = { ...recOf(code), ...patch }),
    () => sb.from("recordings").upsert({ code, status: r.status, notes: r.notes, url: r.url, updated_at: now() })
  );
}

// ───────────── Lecturas ─────────────

function prog(userId, code) {
  return (state.progress[userId] && state.progress[userId][code]) || null;
}

function isDone(userId, code) {
  const p = prog(userId, code);
  return !!(p && p.completed);
}

function levelProgress(userId, level) {
  const ls = LESSONS.filter((l) => l.level === level);
  const done = ls.filter((l) => isDone(userId, l.code)).length;
  return { done, total: ls.length, pct: Math.round((done / ls.length) * 100) };
}

function courseProgress(userId, courseId) {
  const ls = COURSE_BY_ID[courseId].lessons;
  const done = ls.filter((l) => isDone(userId, l.code)).length;
  return { done, total: ls.length, pct: Math.round((done / ls.length) * 100) };
}

function quizStats(userId) {
  const p = state.progress[userId] || {};
  const answered = Object.values(p).filter((x) => x.quizAnswer !== undefined);
  const correct = answered.filter((x) => x.quizCorrect).length;
  return { answered: answered.length, correct, pct: answered.length ? Math.round((correct / answered.length) * 100) : null };
}

// Estadísticas por clase (admin)
function lessonStats(code) {
  let views = 0, completed = 0, answered = 0, correct = 0;
  Object.values(state.progress).forEach((p) => {
    const x = p[code];
    if (!x) return;
    if (x.viewed) views++;
    if (x.completed) completed++;
    if (x.quizAnswer !== undefined) {
      answered++;
      if (x.quizCorrect) correct++;
    }
  });
  const rs = state.ratings.filter((r) => r.code === code);
  const avg = rs.length ? rs.reduce((a, r) => a + r.stars, 0) / rs.length : null;
  return { views, completed, answered, quizPct: answered ? Math.round((correct / answered) * 100) : null, rating: avg, ratings: rs.length };
}

// ───────────── Datos de demostración ─────────────

function seedDemo(s) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const daysAgo = (d) => new Date(Date.now() - d * 86400000 - rnd() * 3600000 * 8).toISOString();

  const people = [
    ["Lucía Fernández", "lucia@example.com", 22],
    ["Martín Gómez", "martin@example.com", 9],
    ["Sofía Benítez", "sofia@example.com", 30],
    ["Diego Acosta", "diego@example.com", 4],
    ["Valentina Ríos", "valentina@example.com", 14],
    ["Joaquín Duarte", "joaquin@example.com", 2],
  ];
  const comments = [
    "Súper clara, la fórmula me sirvió al otro día en el trabajo.",
    "Me encantó la Nota de Mili, me sentí identificada.",
    "Un poco rápida la parte práctica, pero muy útil.",
    "¡Por fin entendí esto!",
    "Me gustaría un ejemplo más.",
    "",
  ];
  const questions = [
    "¿Esto funciona igual en Google Sheets?",
    "¿Cómo lo aplico si mis datos vienen de otro sistema?",
    "No me sale la fórmula con punto y coma, ¿qué puede ser?",
    "¿Tenés alguna plantilla de ejemplo para descargar?",
  ];

  people.forEach(([name, email, n], idx) => {
    const id = uid();
    s.users.push({ id, name, email, role: "alumno", createdAt: daysAgo(40 + idx), lastActive: daysAgo(idx * 4 + rnd() * 3) });
    s.progress[id] = {};
    LESSONS.slice(0, n).forEach((l) => {
      const p = { viewed: true, completed: true, at: daysAgo(rnd() * 30) };
      if (l.type === "clase") {
        const bad = l.code === "N2-01-02" ? rnd() < 0.7 : rnd() < 0.1; // una clase floja para el tablero
        p.quizAnswer = bad ? (l.quiz[2] + 1) % 3 : l.quiz[2];
        p.quizCorrect = !bad;
        if (rnd() < 0.5) s.ratings.push({ id: uid(), userId: id, code: l.code, stars: bad ? 3 : 4 + Math.round(rnd()), comment: pick(comments), at: p.at });
      } else {
        s.submissions.push({
          id: uid(), userId: id, code: l.code, link: "https://docs.google.com/spreadsheets/d/ejemplo",
          desc: "Acá está mi entrega, me costó la parte del formato condicional.", at: p.at,
          ...(rnd() < 0.5 ? { grade: 7 + Math.round(rnd() * 3), feedback: "¡Muy buen trabajo! Revisá los nombres de las columnas.", gradedAt: p.at } : {}),
        });
      }
      s.progress[id][l.code] = p;
    });
    // una clase vista sin completar
    const next = LESSONS[n];
    if (next) s.progress[id][next.code] = { viewed: true, at: daysAgo(1) };
    if (rnd() < 0.7) {
      const l = LESSONS[Math.floor(rnd() * n)];
      s.questions.push({ id: uid(), userId: id, code: l.code, text: pick(questions), at: daysAgo(rnd() * 6),
        ...(rnd() < 0.4 ? { answer: "¡Sí! Solo cambiá el separador según la configuración regional.", answeredAt: daysAgo(0.5) } : {}) });
    }
    // Quien avanzó más allá del Nivel 1 compró el Nivel 2 (y Sofía también el 3)
    if (n > 16) s.purchases.push({ id: uid(), userId: id, level: 2, amount: 20000, source: "mercadopago", at: daysAgo(20 + idx) });
    if (n > 26) s.purchases.push({ id: uid(), userId: id, level: 3, amount: 20000, source: "mercadopago", at: daysAgo(8) });
  });
  return s;
}
