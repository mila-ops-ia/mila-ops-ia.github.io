// Espacio privado de grabación: los 48 videos con guion, estado y notas.

const STATUSES = ["Por grabar", "Grabado", "Editado", "Subido"];
const STATUS_PILL = { "Por grabar": "", Grabado: "warn", Editado: "accent", Subido: "ok" };

const $rec = document.getElementById("rec");
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let filter = { level: 0, status: "" };
const openItems = new Set();

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1800);
}

function renderGate() {
  if (REMOTE) {
    $rec.innerHTML = `
    <section class="section"><div class="wrap" style="max-width:440px">
      <div class="card center">
        <h2>Acceso privado</h2>
        <p class="muted small">Este espacio es solo para Mili. Ingresá en la web con tu mail de admin y volvé acá.</p>
        <a class="btn" href="index.html#/ingresar">Ingresar</a>
      </div>
    </div></section>`;
    return;
  }
  $rec.innerHTML = `
  <section class="section"><div class="wrap" style="max-width:440px">
    <div class="card">
      <h2>Acceso privado</h2>
      <p class="muted small">Este espacio es solo para Mili.</p>
      <form id="gate">
        <div class="field"><label for="code">Código de acceso</label><input id="code" type="password" autocomplete="off" required /></div>
        <button class="btn" style="margin-top:14px;width:100%">Entrar</button>
      </form>
    </div>
  </div></section>`;
  document.getElementById("gate").addEventListener("submit", (e) => {
    e.preventDefault();
    if (loginAdmin(document.getElementById("code").value)) render();
    else toast("Código incorrecto");
  });
}

function render() {
  if (!isAdmin()) return renderGate();

  const counts = Object.fromEntries(STATUSES.map((s) => [s, LESSONS.filter((l) => recOf(l.code).status === s).length]));
  const totalMin = LESSONS.reduce((a, l) => a + l.min, 0);
  const pendingMin = LESSONS.filter((l) => recOf(l.code).status === "Por grabar").reduce((a, l) => a + l.min, 0);
  const list = LESSONS.filter((l) => (!filter.level || l.level === filter.level) && (!filter.status || recOf(l.code).status === filter.status));

  $rec.innerHTML = `
  <section class="section-sm"><div class="wrap">
    <h1>Espacio de grabación</h1>
    <p class="muted">48 videos · ${Math.round(totalMin / 60)} h de contenido · te quedan ${Math.round(pendingMin / 60 * 10) / 10} h por grabar.</p>
    <div class="grid g4" style="margin:18px 0">
      ${STATUSES.map((s) => `<button class="card kpi" style="text-align:left;cursor:pointer;font:inherit;color:inherit" data-status-filter="${s}">
        <div class="v">${counts[s]}</div><div class="l">${s}</div>
        <div class="progress" style="margin-top:8px"><i style="width:${(counts[s] / LESSONS.length) * 100}%"></i></div>
      </button>`).join("")}
    </div>
    <div class="filters">
      <button class="chip ${!filter.level ? "on" : ""}" data-level="0">Todos los niveles</button>
      ${LEVELS.map((l) => `<button class="chip ${filter.level === l.n ? "on" : ""}" data-level="${l.n}">Nivel ${l.n} · ${esc(l.tag)}</button>`).join("")}
    </div>
    <div class="filters" style="margin-top:-8px">
      <button class="chip ${!filter.status ? "on" : ""}" data-status="">Todos los estados</button>
      ${STATUSES.map((s) => `<button class="chip ${filter.status === s ? "on" : ""}" data-status="${s}">${s}</button>`).join("")}
    </div>

    ${COURSES.filter((c) => list.some((l) => l.courseId === c.id)).map((c) => `
      <h3 style="margin:26px 0 10px"><span class="pill n${c.level}" style="margin-right:8px">${c.id}</span>${esc(c.title)}</h3>
      <div class="stack">${list.filter((l) => l.courseId === c.id).map(item).join("")}</div>
    `).join("") || `<div class="card empty">No hay videos con ese filtro.</div>`}
  </div></section>`;
}

function item(l) {
  const r = recOf(l.code);
  const script = buildScript(l);
  return `
  <div class="card rec-item ${openItems.has(l.code) ? "open" : ""}" data-code="${l.code}">
    <div class="rec-head" data-toggle="${l.code}">
      <code>${l.code}</code>
      <b style="flex:1;min-width:180px">${esc(l.title)}</b>
      <span class="tiny muted">${l.type === "taller" ? "Desafío" : "Video"} · ${l.min} min</span>
      <select class="status-select" data-set-status="${l.code}" aria-label="Estado">
        ${STATUSES.map((s) => `<option ${s === r.status ? "selected" : ""}>${s}</option>`).join("")}
      </select>
      <span class="pill ${STATUS_PILL[r.status]}">${r.status}</span>
    </div>
    <div class="rec-body">
      <div class="grid g2" style="align-items:start">
        <div>
          <h3>Guion con tiempos</h3>
          <ul class="timeline">${script.map((b) => `<li><span class="t">${b.from}–${b.to}</span><span><b>${esc(b.name)}</b><br><span class="small muted">${esc(b.text)}</span></span></li>`).join("")}</ul>
        </div>
        <div class="stack">
          <div><h3>Ideas clave</h3><ul class="keypoints small">${(l.type === "clase" ? l.puntos : [l.consigna]).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
          <div><h3>Qué mostrar en pantalla</h3><ul class="keypoints small">${screenPlan(l).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
            ${l.type === "clase" ? `<div class="codebox small" style="margin-top:8px"><pre style="padding-right:0">${esc(l.practica.code)}</pre></div>` : ""}
          </div>
          <div class="mili"><img class="avatar" src="img/avatar/feliz.png" alt="Mili" /><div><b>Tu anécdota</b><p class="small">${esc(l.nota)}</p></div></div>
          <div class="field"><label for="url-${l.code}">Link del video (YouTube no listado o Vimeo)</label>
            <input id="url-${l.code}" data-url="${l.code}" type="url" placeholder="https://youtu.be/…" value="${esc(r.url)}" />
            <div class="tiny muted" style="margin-top:4px">Al guardarlo, el video aparece en la web.</div></div>
          <div class="field"><label for="notes-${l.code}">Notas</label>
            <textarea id="notes-${l.code}" data-notes="${l.code}" placeholder="Toma 2 salió mejor, recortar el inicio…">${esc(r.notes)}</textarea></div>
          <a class="small" href="index.html#/clase/${l.code}" target="_blank">Ver el video en la web ↗</a>
        </div>
      </div>
    </div>
  </div>`;
}

document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.closest("select, input, textarea, a")) return;
  const lv = t.closest("[data-level]");
  if (lv) { filter.level = Number(lv.dataset.level); return render(); }
  const st = t.closest("[data-status]");
  if (st) { filter.status = st.dataset.status; return render(); }
  const sf = t.closest("[data-status-filter]");
  if (sf) { filter.status = filter.status === sf.dataset.statusFilter ? "" : sf.dataset.statusFilter; return render(); }
  const tg = t.closest("[data-toggle]");
  if (tg) {
    const code = tg.dataset.toggle;
    openItems.has(code) ? openItems.delete(code) : openItems.add(code);
    tg.parentElement.classList.toggle("open");
  }
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.setStatus) {
    setRec(t.dataset.setStatus, { status: t.value });
    toast(`${t.dataset.setStatus} → ${t.value}`);
    render();
  } else if (t.dataset.url !== undefined) {
    setRec(t.dataset.url, { url: t.value.trim() });
    toast("Link guardado");
  } else if (t.dataset.notes !== undefined) {
    setRec(t.dataset.notes, { notes: t.value });
    toast("Notas guardadas");
  }
});

$rec.innerHTML = `<div class="empty">Cargando…</div>`;
initStore()
  .catch((err) => {
    console.error(err);
    toast("No pudimos conectar con la base de datos. Probá recargar.");
  })
  .then(render);
