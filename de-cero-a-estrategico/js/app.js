// De Cero a Estratégico — app de una sola página con rutas por hash.

const $app = document.getElementById("app");
const $nav = document.getElementById("nav");

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : "—");
const fmtMin = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + " min" : ""}` : `${m} min`);
const levelOf = (n) => LEVELS[n - 1];
const userName = (id) => (state.users.find((u) => u.id === id) || {}).name || "Alguien de la comunidad";

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function parseHash() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, query] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query || ""));
  return { parts, params, raw };
}

function embedUrl(url) {
  if (!url) return null;
  let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0`;
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
  if (m) return `https://player.vimeo.com/video/${m[1]}${m[2] ? "?h=" + m[2] : ""}`;
  return null;
}

const levelPill = (n) => `<span class="pill n${n}">Nivel ${n} · ${esc(levelOf(n).tag)}</span>`;
const money = (n) => "$" + Math.round(n).toLocaleString("es-AR");

// ¿La persona actual puede ver este nivel? (sin cuenta, solo el Nivel 1)
function unlocked(level) {
  if (level === 1) return true;
  const u = currentUser();
  return !!u && hasLevel(u.id, level);
}

// Etiqueta de precio o estado de un nivel
function priceTag(level) {
  if (level === 1) return `<span class="pill ok">Gratis</span>`;
  if (unlocked(level)) return `<span class="pill ok">✓ Desbloqueado</span>`;
  if (!PAID_LEVELS_OPEN) return `<span class="pill price">Próximamente</span>`;
  return `<span class="pill price">🔒 ${money(levelOf(level).price)}</span>`;
}

// Mientras los niveles pagos no estén abiertos, no hay botón de compra
const buyBtn = (level, cls = "") =>
  PAID_LEVELS_OPEN
    ? `<button class="btn ${cls}" data-action="buy" data-level="${level}">Desbloquear Nivel ${level} · ${money(levelOf(level).price)}</button>`
    : "";

// Lo que ve quien entra a un video de un nivel que no tiene
function paywall(level) {
  const L = levelOf(level);
  const cs = COURSES.filter((c) => c.level === level);
  if (!PAID_LEVELS_OPEN) {
    return `
    <div class="card paywall">
      <div class="paywall-lock">🎬</div>
      <h3>El Nivel ${level} · ${esc(L.tag)} lo estoy grabando</h3>
      <p class="muted">Ya podés ver todo el Nivel 1, que es gratis. Este nivel lo voy a abrir pronto: ${cs.map((c) => esc(c.title)).join(", ")}.</p>
      <a class="btn" href="#/cursos?nivel=1">Ver el Nivel 1</a>
    </div>`;
  }
  return `
    <div class="card paywall">
      <div class="paywall-lock">🔒</div>
      <h3>Este video es parte del Nivel ${level} · ${esc(L.tag)}</h3>
      <p class="muted">El Nivel 1 es gratis. Los niveles 2 y 3 se desbloquean con un pago único, sin suscripción.</p>
      <ul class="keypoints">
        <li><b>${cs.length} series</b>: ${cs.map((c) => esc(c.title)).join(", ")}.</li>
        <li><b>${cs.length * 3} videos</b> con lo que uso, listo para copiar.</li>
        <li><b>${cs.length} desafíos</b> en los que te doy mi opinión sobre lo que armaste.</li>
        <li>Podés preguntarme en cada video.</li>
      </ul>
      <div class="paywall-price"><b>${money(L.price)}</b><span class="muted small">pago único · Nivel ${level} completo</span></div>
      ${buyBtn(level)}
      <p class="tiny muted" style="margin:10px 0 0">Pagás con Mercado Pago: tarjeta, débito o dinero en cuenta.</p>
    </div>`;
}

function requireLogin() {
  if (currentUser()) return true;
  go(`#/ingresar?volver=${encodeURIComponent(location.hash || "#/")}`);
  return false;
}

function nextLessonFor(userId) {
  return LESSONS.find((l) => !isDone(userId, l.code)) || null;
}

// ───────────── Navegación ─────────────

function renderNav(route) {
  const u = currentUser();
  const cur = route.parts[0] || "";
  const link = (href, label, key) => `<a href="${href}" class="${cur === key ? "active" : ""}">${label}</a>`;
  const theme = document.documentElement.dataset.theme;
  const dark = theme ? theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  $nav.innerHTML = [
    link("#/cursos", "Lo que comparto", "cursos"),
    link("#/test", "¿Por dónde empiezo?", "test"),
    link("#/herramientas", "Herramientas", "herramientas"),
    u && u.role === "alumno" ? link("#/mis-notas", "Mi recorrido", "mis-notas") : "",
    u && u.role === "admin" ? link("#/panel", "Panel", "panel") : "",
    u && u.role === "admin" ? `<a href="grabacion.html">Grabación ↗</a>` : "",
    u
      ? `<a href="#" data-action="logout" title="${esc(u.email)}">Salir (${esc(u.name.split(" ")[0])})</a>`
      : link("#/ingresar", "Ingresar", "ingresar"),
    `<button class="icon-btn" data-action="theme" aria-label="Cambiar tema">${dark ? "☀" : "☾"}</button>`,
  ].join("");
}

// ───────────── Páginas ─────────────

function pageHome() {
  const u = currentUser();
  const total = LESSONS.reduce((a, l) => a + l.min, 0);
  const next = u && u.role === "alumno" ? nextLessonFor(u.id) : null;
  return `
  <section class="hero">
    <div class="wrap hero-grid">
      <div>
        <span class="pill accent">Hola, soy Mili 👋</span>
        <h1 class="hero-title">Lo que aprendo, <span>te lo comparto.</span></h1>
        <p class="lead">Todos los días pruebo herramientas, armo cosas con IA y con datos, y me equivoco bastante. Acá te cuento lo que me funcionó y lo que no, simple y para que lo uses mañana.</p>
        <div class="row" style="margin-top:26px">
          <a class="btn" href="#/test">¿Por dónde empiezo?</a>
          <a class="btn ghost" href="#/cursos">Ver todo lo que comparto</a>
        </div>
      </div>
      <div class="hero-portrait" aria-hidden="true">
        <div class="portrait-blob"><img src="img/avatar/retrato.png" alt="" /></div>
        <span class="float-chip c1">✎ Lo que uso, listo para copiar</span>
        <span class="float-chip c2">✦ Lo que funcionó y lo que no</span>
        <span class="float-chip c3">▶ Videos de 5 a 18 min</span>
      </div>
    </div>
  </section>

  ${next ? `
  <section class="section-sm"><div class="wrap">
    <div class="card row between">
      <div>
        <div class="muted small">Seguí donde quedaste</div>
        <h3 style="margin:4px 0">${esc(next.title)}</h3>
        <div class="small muted">${esc(COURSE_BY_ID[next.courseId].title)} · ${next.min} min</div>
      </div>
      <a class="btn" href="#/clase/${next.code}">Continuar</a>
    </div>
  </div></section>` : ""}

  <section class="section-sm">
    <div class="wrap grid g4">
      <div class="card kpi flat"><div class="v">3</div><div class="l">niveles, como mi propio camino</div></div>
      <div class="card kpi flat"><div class="v">${COURSES.length}</div><div class="l">series de 3 videos + un desafío</div></div>
      <div class="card kpi flat"><div class="v">${LESSONS.length}</div><div class="l">videos cortos y prácticos</div></div>
      <div class="card kpi flat"><div class="v">≈${Math.round(total / 60)} h</div><div class="l">de contenido en total</div></div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <h2>Los 3 niveles</h2>
      <p class="muted">Lo ordené como fui creciendo yo: cada escalón se apoya en el anterior. Podés arrancar donde quieras.</p>
      <div class="stair-cards">
        ${LEVELS.map((l) => {
          const cs = COURSES.filter((c) => c.level === l.n);
          return `<a class="card stair-card" data-n="${l.n}" href="#/cursos?nivel=${l.n}">
            <div class="stair-head s${l.n}"><span class="stair-price">${!l.price ? "Gratis" : PAID_LEVELS_OPEN ? money(l.price) : "Próximamente"}</span><span class="num">${l.n}</span><b>${esc(l.tag)}</b></div>
            <div class="stair-body">
              <h3>${esc(l.name)}</h3>
              <p class="muted small" style="margin:0">${esc(l.desc)}</p>
              <ul class="small" style="margin:10px 0 0;padding-left:1.1em">${cs.map((c) => `<li>${esc(c.title)}</li>`).join("")}${EXTRAS.filter((x) => x.level === l.n).map((x) => `<li>${esc(x.title)} ↗</li>`).join("")}</ul>
              <span class="tiny muted">${esc(l.range)}</span>
            </div>
          </a>`;
        }).join("")}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <h2>Qué vas a encontrar</h2>
      <div class="grid g4" style="margin-top:16px">
        <div class="card flat"><h3>▶ Videos cortos</h3><p class="muted small">De 5 a 18 minutos. Te muestro lo que hago, en pantalla y al grano.</p></div>
        <div class="card flat"><h3>✎ Probalo vos</h3><p class="muted small">La fórmula, el prompt o la plantilla que uso, lista para copiar.</p></div>
        <div class="card flat"><h3>✦ Nota de Mili</h3><p class="muted small">Lo que me pasó a mí: lo que salió bien, lo que no y qué aprendí.</p></div>
        <div class="card flat"><h3>✓ Desafíos</h3><p class="muted small">Al final de cada serie te propongo un desafío. Me mostrás lo que armaste y te doy mi opinión.</p></div>
      </div>
    </div>
  </section>

  <section class="section" id="equipos">
    <div class="wrap">
      <div class="card teams">
        <div>
          <span class="pill accent">Para equipos y marcas</span>
          <h2 style="margin-top:12px">¿Lo compartimos con tu equipo?</h2>
          <p class="muted">Además de lo que comparto acá, trabajo con empresas y marcas. Si algo de esto te sirve, escribime y lo charlamos.</p>
          ${linkedinUrl() ? `<a class="btn" href="${esc(linkedinUrl())}" target="_blank" rel="noopener">Escribime por LinkedIn ↗</a>` : ""}
        </div>
        <div class="grid">
          <div class="offer"><h3>🎤 Charlas y talleres para equipos</h3><p class="muted small">Sesiones prácticas sobre IA, datos y operaciones, con ejemplos de su propio trabajo.</p></div>
          <div class="offer"><h3>🧭 Acompañar la adopción de IA</h3><p class="muted small">De la primera idea al uso diario: qué priorizar, cómo cuidar los datos y cómo lograr que la gente la use.</p></div>
          <div class="offer"><h3>🤝 Colaboraciones con marcas</h3><p class="muted small">Si tu herramienta ayuda a trabajar mejor, la pruebo de verdad y cuento cómo me fue: lo que funcionó y lo que no.</p></div>
        </div>
      </div>
    </div>
  </section>`;
}

const linkedinUrl = () => (window.DCE_CONFIG || {}).linkedinUrl || "";

function pageCursos(params) {
  const u = currentUser();
  const nivel = params.nivel ? Number(params.nivel) : null;
  const tema = params.tema || null;
  const q = (n, t) => {
    const p = new URLSearchParams();
    if (n) p.set("nivel", n);
    if (t) p.set("tema", t);
    const s = p.toString();
    return `#/cursos${s ? "?" + s : ""}`;
  };
  const fits = (x) => (!nivel || x.level === nivel) && (!tema || x.topic === tema);
  const list = COURSES.filter(fits);
  const extras = EXTRAS.filter(fits);
  const topicsInUse = TOPICS.filter((t) => COURSES.some((c) => c.topic === t) || EXTRAS.some((x) => x.topic === t));

  return `
  <section class="section-sm"><div class="wrap">
    <h1>Lo que comparto</h1>
    <p class="muted">${COURSES.length} series de videos cortos en 3 niveles. Filtrá por nivel o por tema.</p>
    <div class="filters">
      <button class="chip ${!nivel ? "on" : ""}" data-action="goto" data-href="${q(null, tema)}">Todos los niveles</button>
      ${LEVELS.map((l) => `<button class="chip ${nivel === l.n ? "on" : ""}" data-action="goto" data-href="${q(l.n, tema)}">${l.n} · ${esc(l.tag)}</button>`).join("")}
    </div>
    <div class="filters" style="margin-top:-8px">
      <button class="chip ${!tema ? "on" : ""}" data-action="goto" data-href="${q(nivel, null)}">Todos los temas</button>
      ${topicsInUse.map((t) => `<button class="chip ${tema === t ? "on" : ""}" data-action="goto" data-href="${q(nivel, t)}">${esc(t)}</button>`).join("")}
    </div>

    ${LEVELS.filter((l) => list.some((c) => c.level === l.n) || extras.some((x) => x.level === l.n)).map((l) => {
      const lp = u ? levelProgress(u.id, l.n) : null;
      return `
      <div style="margin-top:28px">
        <div class="row between" style="margin-bottom:12px">
          <div class="row">${levelPill(l.n)}${priceTag(l.n)}<span class="muted small">${esc(l.range)}</span></div>
          ${!unlocked(l.n) ? buyBtn(l.n, "sm") : lp ? `<div class="small muted" style="min-width:180px">Tu avance: ${lp.done}/${lp.total} · ${lp.pct}%<div class="progress" style="margin-top:4px"><i style="width:${lp.pct}%"></i></div></div>` : ""}
        </div>
        <div class="grid g4">${list.filter((c) => c.level === l.n).map(courseCard).join("")}${extras.filter((x) => x.level === l.n).map(extraCard).join("")}</div>
      </div>`;
    }).join("") || `<div class="empty card">No hay series con ese filtro.</div>`}
  </div></section>`;
}

// Tarjeta que lleva a otra web mía (por ejemplo, Mi camino)
function extraCard(x) {
  return `<a class="card course-card extra-card" href="${esc(x.url)}" target="_blank" rel="noopener">
    <span class="bar-top" style="background:var(--accent)"></span>
    <div class="row between"><span class="pill">${esc(x.topic)}</span><span class="tiny muted">Mi camino ↗</span></div>
    <h3>${esc(x.title)}</h3>
    <p class="muted small" style="margin:0">${esc(x.desc)}</p>
    <div class="tiny" style="margin-top:auto;color:var(--accent);font-weight:700">Ir a Mi camino ↗</div>
  </a>`;
}

function courseCard(c) {
  const u = currentUser();
  const p = u ? courseProgress(u.id, c.id) : null;
  const mins = c.lessons.reduce((a, l) => a + l.min, 0);
  return `<a class="card course-card" href="#/curso/${c.id}">
    <span class="bar-top" style="background:var(--n${c.level})"></span>
    <div class="row between"><span class="pill">${esc(c.topic)}</span><span class="tiny muted">${c.id}</span></div>
    <h3>${esc(c.title)}</h3>
    <p class="muted small" style="margin:0">${esc(c.desc)}</p>
    <div class="tiny muted" style="margin-top:auto">${unlocked(c.level) ? "" : "🔒 "}3 videos + desafío · ${fmtMin(mins)}</div>
    ${p ? `<div class="progress"><i style="width:${p.pct}%"></i></div>` : ""}
  </a>`;
}

function pageCurso(id) {
  const c = COURSE_BY_ID[id];
  if (!c) return notFound();
  const u = currentUser();
  const p = u ? courseProgress(u.id, c.id) : null;
  return `
  <section class="section-sm"><div class="wrap" style="max-width:820px">
    <a href="#/cursos?nivel=${c.level}" class="small">← Nivel ${c.level}</a>
    <div class="row" style="margin:14px 0 8px">${levelPill(c.level)}<span class="pill">${esc(c.topic)}</span></div>
    <h1>${esc(c.title)}</h1>
    <p class="muted">${esc(c.desc)}</p>
    ${!unlocked(c.level)
      ? `<div class="card unlock-bar"><div><b>🔒 Esta serie es parte del Nivel ${c.level}</b><div class="small muted">${PAID_LEVELS_OPEN ? `Con un pago único de ${money(levelOf(c.level).price)} desbloqueás las ${COURSES.filter((x) => x.level === c.level).length} series del nivel.` : "Lo estoy grabando y lo abro pronto. Mientras tanto, el Nivel 1 es gratis."}</div></div>${buyBtn(c.level)}</div>`
      : p ? `<div class="small muted">${p.done} de ${p.total} vistos<div class="progress" style="margin-top:6px"><i style="width:${p.pct}%"></i></div></div>` : `<p class="small"><a href="#/ingresar?volver=${encodeURIComponent("#/curso/" + c.id)}">Ingresá</a> para guardar tu progreso.</p>`}
    <div class="card" style="margin-top:20px;padding:10px 16px">
      <ul class="lesson-list">${c.lessons.map((l, i) => {
        const done = u && isDone(u.id, l.code);
        return `<li><a href="#/clase/${l.code}">
          <span class="check ${done ? "done" : ""}">${done ? "✓" : l.type === "taller" ? "✦" : i + 1}</span>
          <span style="flex:1"><b>${esc(l.title)}</b><br><span class="tiny muted">${l.code} · ${l.type === "taller" ? "Desafío" : "Video"} · ${l.min} min</span></span>
          <span class="muted">›</span>
        </a></li>`;
      }).join("")}</ul>
    </div>
  </div></section>`;
}

function pageClase(code) {
  const l = LESSON_BY_CODE[code];
  if (!l) return notFound();
  const c = COURSE_BY_ID[l.courseId];
  const u = currentUser();
  const student = u && u.role === "alumno";
  const locked = !unlocked(l.level);
  if (student && !locked) {
    const p = prog(u.id, code);
    if (!p || !p.viewed) setProg(u.id, code, { viewed: true });
  }
  const p = student ? prog(u.id, code) : null;
  const rec = state.recording[code] || {};
  const embed = embedUrl(rec.url);
  const idx = LESSONS.indexOf(l);
  const prev = LESSONS[idx - 1];
  const next = LESSONS[idx + 1];
  const loginHint = `<p class="small muted"><a href="#/ingresar?volver=${encodeURIComponent("#/clase/" + code)}">Ingresá</a> para guardar tu recorrido, responder y contarme qué te pareció.</p>`;

  const video = locked
    ? `<div class="video locked"><div><div class="play">🔒</div><b>Nivel ${l.level} · ${esc(levelOf(l.level).tag)}</b><div class="small" style="opacity:.75">${l.code} · ${l.min} min</div></div></div>`
    : embed
    ? `<div class="video"><iframe src="${esc(embed)}" title="${esc(l.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`
    : `<div class="video"><div><div class="play">▶</div><b>Lo estoy grabando</b><div class="small" style="opacity:.75">${l.code} · ${l.min} min</div></div></div>`;

  let body = "";
  if (l.type === "clase") {
    const answered = p && p.quizAnswer !== undefined;
    body = `
      <div class="card"><h3>Lo importante</h3><ul class="keypoints">${l.puntos.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="card"><h3>Probalo vos</h3><p class="muted small">${esc(l.practica.label)}</p>
        <div class="codebox"><pre>${esc(l.practica.code)}</pre><button class="btn sm soft" data-action="copy" data-text="${esc(l.practica.code)}">Copiar</button></div>
      </div>
      <div class="mili"><img class="avatar" src="img/avatar/feliz.png" alt="Mili" /><div><b>Nota de Mili</b><p>${esc(l.nota)}</p></div></div>
      <div class="card"><h3>Pregunta rápida</h3><p><b>${esc(l.quiz[0])}</b></p>
        <div class="options">${l.quiz[1].map((o, i) => {
          let cls = "";
          if (answered) cls = i === l.quiz[2] ? "right" : i === p.quizAnswer ? "wrong" : "";
          return `<button class="option ${cls}" data-action="quiz" data-code="${code}" data-i="${i}" ${answered || !student ? "disabled" : ""}>${esc(o)}</button>`;
        }).join("")}</div>
        ${answered ? `<p class="small" style="margin:12px 0 0">${p.quizCorrect ? "¡Correcto! 🎉" : "Casi. La respuesta está marcada en verde."}</p>` : ""}
        ${!student ? loginHint : ""}
      </div>`;
  } else {
    const subs = student ? state.submissions.filter((s) => s.userId === u.id && s.code === code) : [];
    const last = subs[subs.length - 1];
    body = `
      <div class="card"><h3>El desafío</h3><p>${esc(l.consigna)}</p>
        <h3 style="margin-top:16px">Qué me mostrás</h3><ul class="keypoints">${l.entregable.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>
      <div class="mili"><img class="avatar" src="img/avatar/feliz.png" alt="Mili" /><div><b>Nota de Mili</b><p>${esc(l.nota)}</p></div></div>
      <div class="card"><h3>Lo que armaste</h3>
        ${last ? `
          <div class="thread" style="margin-bottom:16px">
            <div class="small muted">Compartido el ${fmtDate(last.at)}</div>
            ${last.link ? `<div><a href="${esc(last.link)}" target="_blank" rel="noopener">${esc(last.link)}</a></div>` : ""}
            ${last.desc ? `<p class="small" style="margin:6px 0 0">${esc(last.desc)}</p>` : ""}
            ${last.grade !== undefined
              ? `<div class="answer"><div class="row"><span class="pill ok">${last.grade}/10</span><span class="tiny muted">Lo que opina Mili · ${fmtDate(last.gradedAt)}</span></div><p class="small" style="margin:6px 0 0">${esc(last.feedback)}</p></div>`
              : `<div class="answer"><span class="pill warn">Mili todavía no lo vio</span></div>`}
          </div>
          <p class="small muted">¿Lo mejoraste? Compartime la nueva versión.</p>` : ""}
        ${student ? `
          <form data-form="submit" data-code="${code}">
            <div class="field"><label for="s-link">Link a tu trabajo</label><input id="s-link" name="link" type="url" placeholder="https://…" /></div>
            <div class="field"><label for="s-desc">Descripción o comentario</label><textarea id="s-desc" name="desc" placeholder="Contame qué hiciste, qué te costó…"></textarea></div>
            <button class="btn" style="margin-top:14px">${last ? "Compartir nueva versión" : "Compartir lo que armé"}</button>
          </form>` : loginHint}
      </div>`;
  }

  // Calificación
  const myRating = student ? state.ratings.find((r) => r.userId === u.id && r.code === code) : null;
  const rating = student ? `
    <div class="card"><h3>¿Te sirvió ${l.type === "taller" ? "este desafío" : "este video"}?</h3>
      <form data-form="rate" data-code="${code}">
        <div class="stars" data-stars="${myRating ? myRating.stars : 0}">
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star ${myRating && n <= myRating.stars ? "on" : ""}" data-action="star" data-n="${n}" aria-label="${n} estrellas">★</button>`).join("")}
        </div>
        <input type="hidden" name="stars" value="${myRating ? myRating.stars : 0}" />
        <div class="field" style="margin-top:10px"><textarea name="comment" placeholder="Comentario (opcional)">${esc(myRating ? myRating.comment : "")}</textarea></div>
        <button class="btn sm" style="margin-top:10px">${myRating ? "Actualizar" : "Enviar"}</button>
      </form>
    </div>` : "";

  // Consultas
  const myQs = student ? state.questions.filter((x) => x.userId === u.id && x.code === code) : [];
  const support = student ? `
    <div class="card"><h3>Preguntame</h3>
      <p class="small muted">¿Te quedó una duda o lo aplicaste distinto? Contame y te respondo acá.</p>
      ${myQs.map((x) => `
        <div class="thread" style="margin-bottom:14px">
          <div class="small"><b>Vos</b> · <span class="muted">${fmtDate(x.at)}</span></div>
          <div class="small">${esc(x.text)}</div>
          ${x.answer ? `<div class="answer small"><b>Mili</b> · <span class="muted">${fmtDate(x.answeredAt)}</span><div>${esc(x.answer)}</div></div>` : `<div class="tiny muted" style="margin-top:4px">Esperando respuesta…</div>`}
        </div>`).join("")}
      <form data-form="ask" data-code="${code}">
        <textarea name="text" placeholder="Escribí tu pregunta…" required></textarea>
        <button class="btn sm" style="margin-top:10px">Enviar pregunta</button>
      </form>
    </div>` : "";

  const doneBtn = student && l.type === "clase"
    ? (p && p.completed
        ? `<span class="pill ok">✓ Visto</span>`
        : `<button class="btn" data-action="complete" data-code="${code}">Ya lo vi ✓</button>`)
    : student && p && p.completed ? `<span class="pill ok">✓ Compartido</span>` : "";

  return `
  <section class="section-sm"><div class="wrap">
    <a href="#/curso/${c.id}" class="small">← ${esc(c.title)}</a>
    <div class="lesson-layout" style="margin-top:14px">
      <div class="stack">
        ${video}
        <div class="row between">
          <div>
            <div class="row" style="margin-bottom:6px">${levelPill(l.level)}<span class="tiny muted">${l.code} · ${l.min} min</span></div>
            <h2 style="margin:0">${esc(l.title)}</h2>
          </div>
          ${locked ? "" : doneBtn}
        </div>
        ${locked ? paywall(l.level) : body + rating + support}
        <div class="row between">
          ${prev ? `<a class="btn ghost sm" href="#/clase/${prev.code}">← Anterior</a>` : "<span></span>"}
          ${next ? `<a class="btn ghost sm" href="#/clase/${next.code}">Siguiente →</a>` : ""}
        </div>
      </div>
      <aside class="card" style="padding:10px 14px;position:sticky;top:80px">
        <div class="small muted" style="padding:8px 4px 0">${c.id}</div>
        <b style="display:block;padding:0 4px 4px">${esc(c.title)}</b>
        <ul class="lesson-list">${c.lessons.map((x, i) => {
          const done = u && isDone(u.id, x.code);
          return `<li><a href="#/clase/${x.code}" style="${x.code === code ? "background:var(--accent-soft);border-radius:12px" : ""}">
            <span class="check ${done ? "done" : ""}">${done ? "✓" : x.type === "taller" ? "✦" : i + 1}</span>
            <span class="small" style="flex:1">${esc(x.title)}<br><span class="tiny muted">${x.min} min</span></span>
          </a></li>`;
        }).join("")}</ul>
      </aside>
    </div>
  </div></section>`;
}

// ── Test de nivel ──
let testAnswers = [];

function pageTest() {
  const step = testAnswers.length;
  if (step < LEVEL_TEST.length) {
    const t = LEVEL_TEST[step];
    return `
    <section class="section"><div class="wrap">
      <div class="card test-card">
        <div class="row between"><span class="pill accent">¿Por dónde empiezo?</span><span class="small muted">Pregunta ${step + 1} de ${LEVEL_TEST.length}</span></div>
        <div class="progress" style="margin:16px 0 22px"><i style="width:${(step / LEVEL_TEST.length) * 100}%"></i></div>
        <h2>${esc(t.q)}</h2>
        <div class="options" style="margin-top:16px">
          ${t.a.map((a, i) => `<button class="option" data-action="test-answer" data-i="${i}">${esc(a)}</button>`).join("")}
        </div>
        ${step > 0 ? `<button class="btn ghost sm" style="margin-top:16px" data-action="test-back">← Volver</button>` : ""}
      </div>
    </div></section>`;
  }
  const score = testAnswers.reduce((a, b) => a + b, 0);
  const level = score <= 2 ? 1 : score <= 5 ? 2 : 3;
  const L = levelOf(level);
  const first = COURSES.find((c) => c.level === level);
  const u = currentUser();
  if (u && u.role === "alumno" && (!state.levelTest[u.id] || state.levelTest[u.id].score !== score)) {
    saveLevelTest(u.id, level, score);
  }
  return `
  <section class="section"><div class="wrap">
    <div class="card test-card center">
      <span class="pill accent">Tu resultado</span>
      <div class="stairs" style="max-width:300px;margin:22px auto">
        ${LEVELS.map((x) => `<div class="step s${x.n}" style="min-height:${60 + x.n * 40}px;opacity:${x.n === level ? 1 : 0.35};cursor:default"><span class="num">${x.n}</span></div>`).join("")}
      </div>
      <h2>Te recomiendo empezar por el nivel ${level}: ${esc(L.tag)}</h2>
      <p class="muted">${esc(L.desc)}</p>
      <p class="small muted">Igual podés mirar cualquier serie: los niveles son una guía, no una regla.</p>
      <div class="row" style="justify-content:center;margin-top:18px">
        <a class="btn" href="#/curso/${first.id}">Arrancar con "${esc(first.title)}"</a>
        <a class="btn ghost" href="#/cursos?nivel=${level}">Ver el nivel ${level}</a>
      </div>
      <button class="btn ghost sm" style="margin-top:16px" data-action="test-reset">Volver a responder</button>
    </div>
  </div></section>`;
}

// ── Herramientas ──
function pageHerramientas() {
  const num = (name, label, val, hint = "") =>
    `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="number" min="0" step="any" value="${val}" data-calc />${hint ? `<div class="tiny muted" style="margin-top:4px">${hint}</div>` : ""}</div>`;
  return `
  <section class="section-sm"><div class="wrap">
    <h1>Herramientas</h1>
    <p class="muted">Las calculadoras que uso en mi trabajo. Te las comparto: cambiá los números y mirá qué pasa.</p>
    <div class="grid tools-grid" style="margin-top:20px;align-items:start">
      <div class="card" id="kpi-calc">
        <h2>KPIs logísticos</h2>
        <p class="small muted">OTIF, Fill Rate e IRA contra tu meta.</p>
        <div class="grid g2">
          ${num("pedidos", "Pedidos totales", 500)}
          ${num("otif_ok", "A tiempo y completos", 462)}
          ${num("u_ped", "Unidades pedidas", 12000)}
          ${num("u_ent", "Unidades entregadas", 11640)}
          ${num("items", "Ítems contados", 300)}
          ${num("items_ok", "Ítems exactos", 289)}
        </div>
        <h3 style="margin-top:18px">Metas (%)</h3>
        <div class="grid g3">
          ${num("m_otif", "OTIF", 95)}
          ${num("m_fr", "Fill Rate", 98)}
          ${num("m_ira", "IRA", 98)}
        </div>
        <div class="grid g3" style="margin-top:18px" id="kpi-out"></div>
      </div>

      <div class="card" id="roi-calc">
        <h2>ROI de automatización</h2>
        <p class="small muted">¿Conviene automatizar esa tarea? Calculá ahorro, payback y ROI a 12 meses.</p>
        <div class="grid g2">
          ${num("min_tarea", "Minutos por tarea", 15)}
          ${num("veces_mes", "Veces por mes", 120)}
          ${num("personas", "Personas que la hacen", 3)}
          ${num("costo_hora", "Costo por hora ($)", 9000)}
          ${num("pct_auto", "% que se automatiza", 80)}
          ${num("inversion", "Inversión inicial ($)", 1500000)}
          ${num("costo_mes", "Costo mensual herramienta ($)", 60000)}
        </div>
        <div class="grid g2" style="margin-top:18px" id="roi-out"></div>
      </div>
    </div>
  </div></section>`;
}

function calc() {
  const v = (id) => Number((document.getElementById(id) || {}).value) || 0;
  const pct = (a, b) => (b ? (a / b) * 100 : 0);
  const kOut = document.getElementById("kpi-out");
  if (kOut) {
    const rows = [
      ["OTIF", pct(v("otif_ok"), v("pedidos")), v("m_otif")],
      ["Fill Rate", pct(v("u_ent"), v("u_ped")), v("m_fr")],
      ["IRA", pct(v("items_ok"), v("items")), v("m_ira")],
    ];
    kOut.innerHTML = rows.map(([n, r, m]) => {
      const ok = r >= m;
      return `<div class="result"><div class="small muted">${n}</div><div class="v" style="color:var(${ok ? "--ok" : "--bad"})">${r.toFixed(1)}%</div>
        <div class="tiny">${ok ? "✓ En meta" : `▼ ${(m - r).toFixed(1)} pts bajo meta`} (${m}%)</div></div>`;
    }).join("");
  }
  const rOut = document.getElementById("roi-out");
  if (rOut) {
    const horas = (v("min_tarea") * v("veces_mes") * v("personas") * (v("pct_auto") / 100)) / 60;
    const ahorroMes = horas * v("costo_hora");
    const neto = ahorroMes - v("costo_mes");
    const payback = neto > 0 ? v("inversion") / neto : null;
    const roi12 = v("inversion") ? ((neto * 12 - v("inversion")) / v("inversion")) * 100 : null;
    const money = (n) => "$ " + Math.round(n).toLocaleString("es-AR");
    rOut.innerHTML = `
      <div class="result"><div class="small muted">Horas liberadas por mes</div><div class="v">${horas.toFixed(1)} h</div></div>
      <div class="result"><div class="small muted">Ahorro neto mensual</div><div class="v" style="color:var(${neto > 0 ? "--ok" : "--bad"})">${money(neto)}</div></div>
      <div class="result"><div class="small muted">Payback</div><div class="v">${payback ? payback.toFixed(1) + " meses" : "—"}</div></div>
      <div class="result"><div class="small muted">ROI a 12 meses</div><div class="v" style="color:var(${roi12 > 0 ? "--ok" : "--bad"})">${roi12 === null ? "—" : roi12.toFixed(0) + "%"}</div></div>
      <p class="tiny muted" style="grid-column:1/-1;margin:0">${neto > 0 ? (payback <= 6 ? "Recuperás la inversión en menos de 6 meses: buen candidato." : payback <= 12 ? "Se paga dentro del año. Revisá si hay beneficios no monetarios." : "Tarda más de un año en pagarse: revisá el alcance o el costo.") : "Con estos números el ahorro no cubre el costo mensual."}</p>`;
  }
}

// ── Mis notas ──
function pageMisNotas() {
  if (!requireLogin()) return "";
  const u = currentUser();
  if (u.role === "admin") return `<section class="section"><div class="wrap"><div class="card empty">Esta sección es para la comunidad. Andá al <a href="#/panel">Panel</a>.</div></div></section>`;
  const done = LESSONS.filter((l) => isDone(u.id, l.code)).length;
  const qs = quizStats(u.id);
  const subs = state.submissions.filter((s) => s.userId === u.id);
  const graded = subs.filter((s) => s.grade !== undefined);
  const avg = graded.length ? (graded.reduce((a, s) => a + s.grade, 0) / graded.length).toFixed(1) : "—";
  const myQs = state.questions.filter((x) => x.userId === u.id);
  const test = state.levelTest[u.id];
  return `
  <section class="section-sm"><div class="wrap">
    <h1>Mi recorrido</h1>
    <p class="muted">Hola, ${esc(u.name.split(" ")[0])}. Esto es lo que llevás hasta ahora.${test ? ` Te recomendé arrancar por el <b>nivel ${test.level}</b>.` : ` <a href="#/test">¿Por dónde empiezo?</a>`}</p>
    <div class="grid g4" style="margin-top:16px">
      <div class="card kpi"><div class="v">${Math.round((done / LESSONS.length) * 100)}%</div><div class="l">vistos (${done} de ${LESSONS.length})</div></div>
      <div class="card kpi"><div class="v">${qs.pct === null ? "—" : qs.pct + "%"}</div><div class="l">preguntas rápidas acertadas (${qs.correct}/${qs.answered})</div></div>
      <div class="card kpi"><div class="v">${avg}</div><div class="l">promedio en desafíos</div></div>
      <div class="card kpi"><div class="v">${myQs.length}</div><div class="l">preguntas (${myQs.filter((x) => x.answer).length} respondidas)</div></div>
    </div>

    <h2 style="margin-top:32px">Por nivel</h2>
    <div class="grid g3">${LEVELS.map((l) => {
      const p = levelProgress(u.id, l.n);
      return `<div class="card"><div class="row between">${levelPill(l.n)}${priceTag(l.n)}</div><div class="row between" style="margin:12px 0 6px"><b>${esc(l.name)}</b><span class="small muted">${p.done}/${p.total}</span></div><div class="progress"><i style="width:${p.pct}%;background:var(--n${l.n})"></i></div>${unlocked(l.n) ? "" : `<div style="margin-top:14px">${buyBtn(l.n, "sm")}</div>`}</div>`;
    }).join("")}</div>

    <h2 style="margin-top:32px">Mis desafíos</h2>
    ${subs.length ? `<div class="table-wrap"><table>
      <tr><th>Desafío</th><th>Compartido</th><th>Estado</th><th class="num">Puntaje</th><th>Lo que opina Mili</th></tr>
      ${subs.slice().reverse().map((s) => `<tr>
        <td><a href="#/clase/${s.code}">${esc(LESSON_BY_CODE[s.code].title.replace("Desafío: ", ""))}</a></td>
        <td>${fmtDate(s.at)}</td>
        <td>${s.grade !== undefined ? `<span class="pill ok">Con devolución</span>` : `<span class="pill warn">Por ver</span>`}</td>
        <td class="num"><b>${s.grade ?? "—"}</b></td>
        <td style="white-space:normal;min-width:220px" class="small">${esc(s.feedback || "")}</td>
      </tr>`).join("")}
    </table></div>` : `<div class="card empty">Todavía no compartiste ningún desafío.</div>`}

    <h2 style="margin-top:32px">Mis preguntas</h2>
    ${myQs.length ? `<div class="stack">${myQs.slice().reverse().map((x) => `
      <div class="card flat">
        <div class="tiny muted"><a href="#/clase/${x.code}">${x.code} · ${esc(LESSON_BY_CODE[x.code].title)}</a> · ${fmtDate(x.at)}</div>
        <div style="margin-top:4px">${esc(x.text)}</div>
        ${x.answer ? `<div class="thread answer small" style="margin-top:8px"><b>Mili:</b> ${esc(x.answer)}</div>` : `<div class="tiny muted" style="margin-top:6px">Esperando respuesta…</div>`}
      </div>`).join("")}</div>` : `<div class="card empty">Todavía no me preguntaste nada. Podés hacerlo desde cada video.</div>`}
  </div></section>`;
}

// ── Ingresar ──
let sentTo = null; // mail al que se mandó el link para cambiar la contraseña
let authMode = "entrar"; // entrar | crear | olvide

const googleIcon = `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;

function pageIngresar(params) {
  const volver = params.volver || "#/";
  if (currentUser()) return `<section class="section"><div class="wrap" style="max-width:460px"><div class="card center"><h2>Ya ingresaste</h2><a class="btn" href="${esc(volver)}">Continuar</a></div></div></section>`;
  if (!REMOTE) return pageIngresarDemo(volver);
  if (sentTo) {
    return `
    <section class="section"><div class="wrap" style="max-width:460px">
      <div class="card center">
        <h2>Revisá tu mail ✉</h2>
        <p class="muted">Te mandamos un link a <b>${esc(sentTo)}</b> para que elijas una contraseña nueva.</p>
        <p class="tiny muted">¿No llegó? Fijate en spam o promociones.</p>
        <button class="btn ghost sm" data-action="auth-mode" data-mode="entrar">Volver a ingresar</button>
      </div>
    </div></section>`;
  }
  const tab = (mode, label) => `<button class="chip ${authMode === mode ? "on" : ""}" data-action="auth-mode" data-mode="${mode}">${label}</button>`;
  const email = `<div class="field"><label for="l-email">Mail</label><input id="l-email" name="email" type="email" required autocomplete="email" /></div>`;
  let form;
  if (authMode === "crear") {
    form = `<form data-form="signup" data-volver="${esc(volver)}">
      <div class="field"><label for="l-name">Nombre</label><input id="l-name" name="name" required autocomplete="name" /></div>
      ${email}
      <div class="field"><label for="l-pass">Contraseña</label><input id="l-pass" name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="Mínimo 8 caracteres" /></div>
      <button class="btn" style="width:100%;margin-top:18px">Crear mi cuenta</button>
    </form>`;
  } else if (authMode === "olvide") {
    form = `<form data-form="reset">
      <p class="small muted" style="margin:0 0 10px">Te mandamos un link para que elijas una contraseña nueva.</p>
      ${email}
      <button class="btn" style="width:100%;margin-top:18px">Mandame el link</button>
    </form>
    <button class="btn ghost sm" style="margin-top:12px" data-action="auth-mode" data-mode="entrar">← Volver</button>`;
  } else {
    form = `<form data-form="signin" data-volver="${esc(volver)}">
      ${email}
      <div class="field"><label for="l-pass">Contraseña</label><input id="l-pass" name="password" type="password" required autocomplete="current-password" /></div>
      <button class="btn" style="width:100%;margin-top:18px">Entrar</button>
    </form>
    <button class="link-btn" data-action="auth-mode" data-mode="olvide">¿Olvidaste tu contraseña?</button>`;
  }
  return `
  <section class="section"><div class="wrap" style="max-width:460px">
    <div class="card">
      <h2>${authMode === "crear" ? "Creá tu cuenta" : "Ingresá"}</h2>
      <p class="muted small">Así guardamos lo que vas viendo, tus desafíos y tus preguntas.</p>
      <button class="btn google-btn" data-action="google" data-volver="${esc(volver)}">${googleIcon} Continuar con Google</button>
      <div class="or"><span>o con tu mail</span></div>
      ${authMode === "olvide" ? "" : `<div class="filters" style="margin:0 0 6px">${tab("entrar", "Ya tengo cuenta")}${tab("crear", "Crear cuenta")}</div>`}
      ${form}
    </div>
  </div></section>`;
}

function pageNuevaClave() {
  if (!currentUser()) return `<section class="section"><div class="wrap" style="max-width:460px"><div class="card center"><h2>El link venció</h2><p class="muted">Pedí uno nuevo desde "¿Olvidaste tu contraseña?".</p><a class="btn" href="#/ingresar">Ir a ingresar</a></div></div></section>`;
  return `
  <section class="section"><div class="wrap" style="max-width:460px">
    <div class="card">
      <h2>Elegí tu contraseña nueva</h2>
      <form data-form="newpass">
        <div class="field"><label for="l-pass">Contraseña nueva</label><input id="l-pass" name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="Mínimo 8 caracteres" /></div>
        <button class="btn" style="width:100%;margin-top:18px">Guardar</button>
      </form>
    </div>
  </div></section>`;
}

function pageIngresarDemo(volver) {
  return `
  <section class="section"><div class="wrap" style="max-width:460px">
    <div class="card">
      <h2>Ingresá</h2>
      <p class="muted small">Con tu nombre y mail guardamos lo que vas viendo, tus desafíos y tus preguntas.</p>
      <form data-form="login" data-volver="${esc(volver)}">
        <div class="field"><label for="l-name">Nombre</label><input id="l-name" name="name" required autocomplete="name" /></div>
        <div class="field"><label for="l-email">Mail</label><input id="l-email" name="email" type="email" required autocomplete="email" /></div>
        <button class="btn" style="width:100%;margin-top:18px">Ingresar</button>
      </form>
      <p class="tiny muted" style="margin:14px 0 0">Modo demo: las cuentas se guardan solo en este navegador.</p>
    </div>
    ${REMOTE ? "" : `<details class="card flat" style="margin-top:16px">
      <summary class="small" style="cursor:pointer;font-weight:700">Soy Mili (acceso admin)</summary>
      <form data-form="admin" style="margin-top:12px">
        <div class="field"><label for="a-code">Código de acceso</label><input id="a-code" name="code" type="password" autocomplete="off" /></div>
        <button class="btn ghost" style="margin-top:12px">Entrar al panel</button>
      </form>
    </details>`}
  </div></section>`;
}

// ── Panel admin ──
let adminTab = "consultas";

function pageAdmin() {
  if (!requireLogin()) return "";
  if (!isAdmin()) return `<section class="section"><div class="wrap"><div class="card empty">Esta sección es privada.</div></div></section>`;
  const students = state.users.filter((u) => u.role === "alumno");
  const active = students.filter((u) => Date.now() - new Date(u.lastActive) < 30 * 86400000).length;
  const avgRating = state.ratings.length ? (state.ratings.reduce((a, r) => a + r.stars, 0) / state.ratings.length).toFixed(1) : "—";
  const pendingQ = state.questions.filter((q) => !q.answer);
  const pendingS = state.submissions.filter((s) => s.grade === undefined);

  const tabs = [
    ["consultas", `Preguntas (${pendingQ.length})`],
    ["talleres", `Desafíos (${pendingS.length})`],
    ["alumnos", "Comunidad"],
    ["clases", "Videos"],
    ["comentarios", "Comentarios"],
    ["ventas", `Ventas (${state.purchases.length})`],
  ];
  const paid = state.purchases.filter((p) => p.source !== "manual");
  const revenue = paid.reduce((a, p) => a + p.amount, 0);

  let content = "";
  if (adminTab === "consultas") {
    const qs = state.questions.slice().sort((a, b) => (!!a.answer - !!b.answer) || b.at.localeCompare(a.at));
    content = qs.length ? `<div class="stack">${qs.map((q) => `
      <div class="card flat">
        <div class="row between"><div class="small"><b>${esc(userName(q.userId))}</b> · <a href="#/clase/${q.code}">${q.code} · ${esc(LESSON_BY_CODE[q.code].title)}</a></div><span class="tiny muted">${fmtDate(q.at)}</span></div>
        <p style="margin:6px 0 10px">${esc(q.text)}</p>
        ${q.answer
          ? `<div class="thread answer small"><b>Tu respuesta:</b> ${esc(q.answer)}</div>`
          : `<form data-form="answer" data-id="${q.id}"><textarea name="answer" required placeholder="Escribí tu respuesta…"></textarea><button class="btn sm" style="margin-top:8px">Responder</button></form>`}
      </div>`).join("")}</div>` : `<div class="card empty">No hay preguntas.</div>`;
  } else if (adminTab === "talleres") {
    const ss = state.submissions.slice().sort((a, b) => ((a.grade !== undefined) - (b.grade !== undefined)) || b.at.localeCompare(a.at));
    content = ss.length ? `<div class="stack">${ss.map((s) => `
      <div class="card flat">
        <div class="row between"><div class="small"><b>${esc(userName(s.userId))}</b> · ${s.code} · ${esc(LESSON_BY_CODE[s.code].title)}</div><span class="tiny muted">${fmtDate(s.at)}</span></div>
        ${s.link ? `<div class="small" style="margin-top:6px"><a href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.link)}</a></div>` : ""}
        ${s.desc ? `<p class="small" style="margin:6px 0 0">${esc(s.desc)}</p>` : ""}
        ${s.grade !== undefined
          ? `<div class="thread answer small" style="margin-top:10px"><span class="pill ok">${s.grade}/10</span> ${esc(s.feedback)}</div>`
          : `<form data-form="grade" data-id="${s.id}" style="margin-top:10px">
              <div class="grid" style="grid-template-columns:110px 1fr;gap:10px">
                <div><label>Nota</label><select name="grade" required><option value="">—</option>${[1,2,3,4,5,6,7,8,9,10].map((n) => `<option>${n}</option>`).join("")}</select></div>
                <div><label>Tu opinión</label><textarea name="feedback" required style="min-height:60px" placeholder="Qué estuvo bien, qué mejorar…"></textarea></div>
              </div>
              <button class="btn sm" style="margin-top:8px">Enviar devolución</button>
            </form>`}
      </div>`).join("")}</div>` : `<div class="card empty">Todavía nadie compartió un desafío.</div>`;
  } else if (adminTab === "alumnos") {
    content = `<div class="table-wrap"><table>
      <tr><th>Persona</th><th class="num">Vistos</th><th class="num">Aciertos</th><th class="num">Desafíos</th><th class="num">Promedio</th><th>Última actividad</th></tr>
      ${students.sort((a, b) => b.lastActive.localeCompare(a.lastActive)).map((u) => {
        const done = LESSONS.filter((l) => isDone(u.id, l.code)).length;
        const qs = quizStats(u.id);
        const subs = state.submissions.filter((s) => s.userId === u.id);
        const g = subs.filter((s) => s.grade !== undefined);
        return `<tr>
          <td><b>${esc(u.name)}</b><br><span class="tiny muted">${esc(u.email)}</span></td>
          <td class="num">${Math.round((done / LESSONS.length) * 100)}%</td>
          <td class="num ${qs.pct !== null && qs.pct < 60 ? "red" : ""}">${qs.pct === null ? "—" : qs.pct + "%"}</td>
          <td class="num">${subs.length}</td>
          <td class="num">${g.length ? (g.reduce((a, s) => a + s.grade, 0) / g.length).toFixed(1) : "—"}</td>
          <td>${fmtDate(u.lastActive)}</td>
        </tr>`;
      }).join("")}
    </table></div>`;
  } else if (adminTab === "clases") {
    content = `<p class="small muted">Los videos con menos de 60% de acierto en la pregunta rápida se marcan en rojo.</p>
    <div class="table-wrap"><table>
      <tr><th>Código</th><th>Video</th><th class="num">Abiertos</th><th class="num">Vistos</th><th class="num">¿Le sirvió?</th><th class="num">% acierto</th></tr>
      ${LESSONS.map((l) => {
        const st = lessonStats(l.code);
        const red = st.quizPct !== null && st.quizPct < 60;
        return `<tr class="${red ? "red-row" : ""}">
          <td><code>${l.code}</code></td>
          <td><a href="#/clase/${l.code}">${esc(l.title)}</a></td>
          <td class="num">${st.views}</td>
          <td class="num">${st.completed}</td>
          <td class="num">${st.rating === null ? "—" : "★ " + st.rating.toFixed(1) + ` <span class="tiny muted">(${st.ratings})</span>`}</td>
          <td class="num ${red ? "red" : ""}">${l.type === "taller" ? "<span class='muted'>desafío</span>" : st.quizPct === null ? "—" : st.quizPct + "%"}</td>
        </tr>`;
      }).join("")}
    </table></div>`;
  } else if (adminTab === "ventas") {
    const rows = state.purchases.slice().sort((a, b) => b.at.localeCompare(a.at));
    const by = (lvl) => paid.filter((p) => p.level === lvl);
    content = `
    <div class="grid g3" style="margin-bottom:18px">
      ${[2, 3].map((lvl) => `<div class="card flat"><div class="row between">${levelPill(lvl)}<b>${money(by(lvl).reduce((a, p) => a + p.amount, 0))}</b></div><div class="small muted" style="margin-top:8px">${by(lvl).length} venta${by(lvl).length === 1 ? "" : "s"} · ${money(levelOf(lvl).price)} c/u</div></div>`).join("")}
      <div class="card flat"><b>Habilitar a mano</b><div class="small muted" style="margin:4px 0 10px">Para un regalo, una beca o un pago por transferencia.</div>
        <form data-form="grant" class="row" style="gap:8px">
          <select name="user" required style="flex:1;min-width:140px"><option value="">Persona…</option>${students.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join("")}</select>
          <select name="level" required style="width:auto"><option value="2">Nivel 2</option><option value="3">Nivel 3</option></select>
          <button class="btn sm">Habilitar</button>
        </form>
      </div>
    </div>
    ${rows.length ? `<div class="table-wrap"><table>
      <tr><th>Fecha</th><th>Persona</th><th>Nivel</th><th class="num">Monto</th><th>Origen</th><th></th></tr>
      ${rows.map((p) => `<tr>
        <td>${fmtDate(p.at)}</td>
        <td>${esc(userName(p.userId))}</td>
        <td>Nivel ${p.level}</td>
        <td class="num">${p.amount ? money(p.amount) : "—"}</td>
        <td>${p.source === "manual" ? `<span class="pill">Manual</span>` : p.source === "demo" ? `<span class="pill">Demo</span>` : `<span class="pill ok">Mercado Pago</span>`}</td>
        <td>${p.source === "manual" ? `<button class="btn ghost sm" data-action="revoke" data-id="${p.id}">Quitar</button>` : ""}</td>
      </tr>`).join("")}
    </table></div>` : `<div class="card empty">Todavía no hay ventas.</div>`}`;
  } else {
    const rs = state.ratings.filter((r) => r.comment).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
    content = rs.length ? `<div class="stack">${rs.map((r) => `
      <div class="card flat">
        <div class="row between"><div class="small"><b>${esc(userName(r.userId))}</b> · <a href="#/clase/${r.code}">${r.code}</a></div><span style="color:#e9b730">${"★".repeat(r.stars)}<span style="color:var(--line)">${"★".repeat(5 - r.stars)}</span></span></div>
        <p style="margin:6px 0 0">${esc(r.comment)}</p>
        <div class="tiny muted">${fmtDate(r.at)}</div>
      </div>`).join("")}</div>` : `<div class="card empty">Todavía no hay comentarios.</div>`;
  }

  return `
  <section class="section-sm"><div class="wrap">
    <div class="row between">
      <div><h1 style="margin:0">Panel</h1><p class="muted" style="margin:0">Privado · solo vos ves esto.</p></div>
      <div class="row"><a class="btn ghost sm" href="grabacion.html">Espacio de grabación ↗</a>${REMOTE ? "" : `<button class="btn ghost sm" data-action="reset">Reiniciar datos demo</button>`}</div>
    </div>
    <div class="grid kpis" style="margin:20px 0 26px">
      <div class="card kpi"><div class="v">${money(revenue)}</div><div class="l">vendido (${paid.length} nivel${paid.length === 1 ? "" : "es"})</div></div>
      <div class="card kpi"><div class="v">${active}</div><div class="l">personas activas (30 días)</div></div>
      <div class="card kpi"><div class="v">★ ${avgRating}</div><div class="l">¿les sirvió? (promedio)</div></div>
      <div class="card kpi ${pendingQ.length ? "alert" : ""}"><div class="v">${pendingQ.length}</div><div class="l">preguntas sin responder</div></div>
      <div class="card kpi ${pendingS.length ? "alert" : ""}"><div class="v">${pendingS.length}</div><div class="l">desafíos por ver</div></div>
    </div>
    <div class="tabs">${tabs.map(([k, label]) => `<button class="chip tab ${adminTab === k ? "on" : ""}" data-action="tab" data-tab="${k}">${label}</button>`).join("")}</div>
    ${content}
  </div></section>`;
}

function notFound() {
  return `<section class="section"><div class="wrap"><div class="card empty"><h2>No encontramos esa página</h2><a class="btn" href="#/">Volver al inicio</a></div></div></section>`;
}

// ───────────── Render ─────────────

function render() {
  const route = parseHash();
  const [p0, p1] = route.parts;
  let html;
  switch (p0) {
    case undefined: html = pageHome(); break;
    case "cursos": html = pageCursos(route.params); break;
    case "curso": html = pageCurso(p1); break;
    case "clase": html = pageClase(p1); break;
    case "test": html = pageTest(); break;
    case "herramientas": html = pageHerramientas(); break;
    case "mis-notas": html = pageMisNotas(); break;
    case "ingresar": html = pageIngresar(route.params); break;
    case "nueva-clave": html = pageNuevaClave(); break;
    case "panel": html = pageAdmin(); break;
    default: html = notFound();
  }
  if (html === "") return; // redirigió
  $app.innerHTML = html;
  renderNav(route);
  $nav.classList.remove("open");
  calc();
  if (typeof Mili !== "undefined") Mili.onRoute(route);
}

const miliReact = (kind) => typeof Mili !== "undefined" && Mili.react(kind);

window.addEventListener("hashchange", () => {
  render();
  window.scrollTo(0, 0);
});

// ───────────── Acciones ─────────────

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const a = el.dataset.action;
  const u = currentUser();

  if (a === "goto") return go(el.dataset.href);
  if (a === "menu") return $nav.classList.toggle("open");
  if (a === "theme") {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("dce:theme", next); } catch (err) {}
    return renderNav(parseHash());
  }
  if (a === "logout") {
    e.preventDefault();
    logout().then(() => {
      toast("Sesión cerrada");
      go("#/");
    });
    return;
  }
  if (a === "auth-mode") {
    authMode = el.dataset.mode;
    sentTo = null;
    return render();
  }
  if (a === "google") {
    el.disabled = true;
    loginGoogle(el.dataset.volver).then((r) => {
      el.disabled = false;
      if (r.error) toast(/provider is not enabled|Unsupported provider/i.test(r.error) ? "El ingreso con Google todavía no está activado. Usá tu mail y contraseña." : r.error);
    });
    return;
  }
  if (a === "login-retry") {
    sentTo = null;
    return render();
  }
  if (a === "copy") {
    const text = el.dataset.text;
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .then(() => miliReact("copy"))
      .catch(() => toast("No se pudo copiar, seleccionalo a mano"));
    return;
  }
  if (a === "quiz" && u) {
    const l = LESSON_BY_CODE[el.dataset.code];
    const i = Number(el.dataset.i);
    setProg(u.id, l.code, { quizAnswer: i, quizCorrect: i === l.quiz[2] });
    render();
    return miliReact(i === l.quiz[2] ? "quiz-ok" : "quiz-bad");
  }
  if (a === "complete" && u) {
    setProg(u.id, el.dataset.code, { completed: true });
    render();
    return miliReact(levelProgress(u.id, LESSON_BY_CODE[el.dataset.code].level).pct === 100 ? "level-done" : "complete");
  }
  if (a === "star") {
    const form = el.closest("form");
    const n = Number(el.dataset.n);
    form.querySelector("[name=stars]").value = n;
    form.querySelectorAll(".star").forEach((s) => s.classList.toggle("on", Number(s.dataset.n) <= n));
    return;
  }
  if (a === "test-answer") {
    testAnswers.push(Number(el.dataset.i));
    render();
    if (testAnswers.length === LEVEL_TEST.length) miliReact("test-done");
    return;
  }
  if (a === "test-back") {
    testAnswers.pop();
    return render();
  }
  if (a === "test-reset") {
    testAnswers = [];
    return render();
  }
  if (a === "tab") {
    adminTab = el.dataset.tab;
    return render();
  }
  if (a === "buy") {
    const level = Number(el.dataset.level);
    if (!u) {
      toast("Primero creá tu cuenta: así el nivel queda guardado a tu nombre.");
      return go(`#/ingresar?volver=${encodeURIComponent(location.hash || "#/cursos")}`);
    }
    el.disabled = true;
    el.textContent = "Abriendo Mercado Pago…";
    buyLevel(u.id, level).then((r) => {
      if (r.error) {
        el.disabled = false;
        toast(r.error);
        return render();
      }
      if (r.ok) {
        render();
        setTimeout(() => miliReact("purchase"), 900); // después del saludo de la página
      }
    });
    return;
  }
  if (a === "revoke" && isAdmin()) {
    if (confirm("¿Quitar este acceso manual?")) {
      revokeLevel(el.dataset.id);
      render();
    }
    return;
  }
  if (a === "reset") {
    if (confirm("¿Borrar todos los datos de este navegador y volver a los datos de demostración?")) {
      resetDemo();
      loginAdmin(ADMIN_CODE);
      toast("Datos reiniciados");
      render();
    }
  }
});

document.addEventListener("submit", (e) => {
  const form = e.target.closest("[data-form]");
  if (!form) return;
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form));
  const kind = form.dataset.form;
  const u = currentUser();

  if (kind === "login") {
    const btn = form.querySelector("button");
    btn.disabled = true;
    login(f.name, f.email, form.dataset.volver).then((r) => {
      btn.disabled = false;
      if (r.error) return toast(/rate limit/i.test(r.error) ? "Se mandaron muchos mails seguidos. Probá de nuevo en un rato." : r.error);
      if (r.sent) {
        sentTo = f.email.trim();
        return render();
      }
      toast(`¡Hola, ${f.name.split(" ")[0]}!`);
      go(form.dataset.volver || "#/");
    });
    return;
  }
  // Ingreso con contraseña: crear cuenta, entrar, recuperar y elegir una nueva
  if (["signup", "signin", "reset", "newpass"].includes(kind)) {
    const btn = form.querySelector("button");
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Un momento…";
    const done = (r) => {
      btn.disabled = false;
      btn.textContent = label;
      if (r.error) return toast(r.error);
      if (r.sent) { sentTo = f.email.trim(); return render(); }
      if (r.needsConfirm) return toast("Te mandamos un mail para confirmar la cuenta. Abrilo y después entrá.");
      if (kind === "newpass") { toast("¡Listo! Tu contraseña nueva quedó guardada."); return go("#/"); }
      authMode = "entrar";
      const me = currentUser();
      if (me) toast(`¡Hola, ${me.name.split(" ")[0]}!`);
      go(form.dataset.volver || "#/");
    };
    if (kind === "signup") signUpPassword(f.name, f.email, f.password).then(done);
    if (kind === "signin") signInPassword(f.email, f.password).then(done);
    if (kind === "reset") sendPasswordReset(f.email).then(done);
    if (kind === "newpass") setNewPassword(f.password).then(done);
    return;
  }
  if (kind === "admin") {
    if (loginAdmin(f.code)) {
      toast("Hola, Mili 💜");
      return go("#/panel");
    }
    return toast("Código incorrecto");
  }
  if (!u) return requireLogin();

  if (kind === "rate") {
    const stars = Number(f.stars);
    if (!stars) return toast("Elegí de 1 a 5 estrellas");
    saveRating(u.id, form.dataset.code, stars, f.comment.trim());
    render();
    return miliReact("rate");
  }
  if (kind === "ask") {
    if (!f.text.trim()) return;
    addQuestion(u.id, form.dataset.code, f.text.trim());
    render();
    return miliReact("ask");
  }
  if (kind === "submit") {
    if (!f.link.trim() && !f.desc.trim()) return toast("Agregá un link o una descripción");
    addSubmission(u.id, form.dataset.code, f.link.trim(), f.desc.trim());
    setProg(u.id, form.dataset.code, { completed: true });
    render();
    return miliReact("submit");
  }
  if (kind === "answer" && isAdmin()) {
    answerQuestion(form.dataset.id, f.answer.trim());
    toast("Respuesta enviada");
    return render();
  }
  if (kind === "grant" && isAdmin()) {
    const level = Number(f.level);
    if (hasLevel(f.user, level)) return toast("Esa persona ya tiene ese nivel");
    grantLevel(f.user, level);
    toast(`Nivel ${level} habilitado para ${userName(f.user).split(" ")[0]}`);
    return render();
  }
  if (kind === "grade" && isAdmin()) {
    gradeSubmission(form.dataset.id, Number(f.grade), f.feedback.trim());
    toast("Devolución enviada");
    return render();
  }
});

document.addEventListener("input", (e) => {
  if (e.target.matches("[data-calc]")) calc();
});

$app.innerHTML = `<div class="empty">Cargando…</div>`;
initStore()
  .catch((err) => {
    console.error(err);
    toast("No pudimos conectar con la base de datos. Probá recargar.");
  })
  .then(() => {
    touch();
    render();
    if (loginError) toast(loginError);
    handlePaymentReturn();
  });

// Al volver de Mercado Pago: confirma el pago (el aviso puede tardar unos segundos)
async function handlePaymentReturn() {
  if (!paymentReturn) return;
  const { status, level } = paymentReturn;
  paymentReturn = null;
  const u = currentUser();
  if (status === "error") return toast("El pago no se completó. Podés intentarlo de nuevo cuando quieras.");
  if (status === "pendiente") return toast("Tu pago quedó pendiente. Apenas se acredite, el nivel se habilita solo.");
  if (!u) return;
  toast("Confirmando tu pago…");
  const ok = await waitForPurchase(u.id, level);
  render();
  if (ok) setTimeout(() => miliReact("purchase"), 900);
  else toast("Mercado Pago todavía no nos avisó. Recargá en un ratito; si no aparece, escribime.");
}
