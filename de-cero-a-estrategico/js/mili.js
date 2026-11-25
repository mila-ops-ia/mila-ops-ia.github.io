// Avatar interactivo de Mili: acompaña la navegación, habla, viaja por la página y reacciona.
// Expresiones disponibles: feliz, risa, sorpresa, pensando (img/avatar/*.png).

const Mili = (() => {
  const MOODS = ["feliz", "risa", "sorpresa", "pensando"];
  const PREF_KEY = "dce:mili"; // "on" | "quiet"
  const POS_KEY = "dce:mili-pos"; // { side, bottom }
  const SEEN_KEY = "dce:mili-seen";
  const TOUR_KEY = "dce:mili-tour";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  let pref = store.get(PREF_KEY, "on");
  let pos = store.get(POS_KEY, { side: "right", bottom: 18 });
  let seen = {};
  try { seen = JSON.parse(sessionStorage.getItem(SEEN_KEY) || "{}"); } catch (e) {}

  const root = document.createElement("div");
  root.className = "mili-widget entering";
  root.innerHTML = `
    <div class="mili-bubble" role="status" aria-live="polite"><p></p><div class="mili-actions"></div><button class="mili-x" aria-label="Cerrar mensaje">×</button></div>
    <div class="mili-menu" hidden></div>
    <button class="mili-face" aria-label="Hablar con Mili" aria-expanded="false">
      <span class="mili-tilt">${MOODS.map((m) => `<img src="img/avatar/${m}.png" alt="" data-mood="${m}" draggable="false" />`).join("")}</span>
    </button>`;
  document.body.appendChild(root);

  const $bubble = root.querySelector(".mili-bubble");
  const $text = $bubble.querySelector("p");
  const $actions = $bubble.querySelector(".mili-actions");
  const $menu = root.querySelector(".mili-menu");
  const $face = root.querySelector(".mili-face");
  const $tilt = root.querySelector(".mili-tilt");
  let current = "feliz";
  let hideTimer, moodTimer, idleTimer, typeTimer, flapTimer, homeTimer;
  let away = false; // está "de viaje" sobre algún elemento
  let flewAt = 0;
  let tour = null;

  // ── Posición base (arrastrable) ──
  function applyPos() {
    root.style.bottom = pos.bottom + "px";
    root.style.left = pos.side === "left" ? "18px" : "auto";
    root.style.right = pos.side === "right" ? "18px" : "auto";
    root.classList.toggle("on-left", pos.side === "left");
  }
  applyPos();
  requestAnimationFrame(() => setTimeout(() => root.classList.remove("entering"), 50));

  // ── Expresiones ──
  function mood(m) {
    current = m;
    root.querySelectorAll(".mili-face img").forEach((img) => img.classList.toggle("on", img.dataset.mood === m));
  }

  function anim(name) {
    if (reduced) return;
    $face.classList.remove("hop", "shake", "spin", "wave");
    void $face.offsetWidth; // reinicia la animación
    $face.classList.add(name);
  }

  // Mueve la "boca" mientras escribe: alterna la expresión con otra parecida
  function startTalking(m) {
    stopTalking();
    if (reduced) return;
    const alt = m === "risa" ? "feliz" : m === "sorpresa" ? "feliz" : "risa";
    let open = false;
    root.classList.add("talking");
    flapTimer = setInterval(() => {
      open = !open;
      root.querySelectorAll(".mili-face img").forEach((img) => img.classList.toggle("on", img.dataset.mood === (open ? alt : m)));
    }, 150);
  }

  function stopTalking() {
    clearInterval(flapTimer);
    root.classList.remove("talking");
    mood(current);
  }

  // ── Globo de diálogo ──
  function say(text, m = "feliz", ms = 5500, actions = []) {
    mood(m);
    anim(m === "sorpresa" ? "shake" : "hop");
    clearTimeout(moodTimer);
    moodTimer = setTimeout(() => !tour && mood("feliz"), ms + 600);
    if (pref === "quiet" && !actions.length) return;
    closeMenu();
    clearTimeout(hideTimer);
    clearTimeout(typeTimer);
    $actions.innerHTML = actions.map((a, i) => `<button data-act="${i}" class="${i ? "ghost" : ""}">${a.label}</button>`).join("");
    $actions.onclick = (e) => {
      const b = e.target.closest("[data-act]");
      if (b) actions[Number(b.dataset.act)].run();
    };
    $bubble.classList.add("show");
    placeBubble();

    // Escribe letra por letra
    const plain = text.replace(/<[^>]+>/g, "");
    if (reduced) {
      $text.innerHTML = text;
    } else {
      let i = 0;
      startTalking(m);
      const step = () => {
        i += 2;
        $text.textContent = plain.slice(0, i);
        if (i < plain.length) typeTimer = setTimeout(step, 22);
        else { $text.innerHTML = text; stopTalking(); }
      };
      step();
    }
    if (ms) hideTimer = setTimeout(hideBubble, ms + plain.length * 11);
  }

  function hideBubble() {
    $bubble.classList.remove("show");
    clearTimeout(typeTimer);
    stopTalking();
  }

  // Acomoda el globo según dónde esté la cara: abajo si está arriba, a la derecha si no entra a la izquierda
  function placeBubble() {
    const r = $face.getBoundingClientRect();
    const w = Math.min(310, innerWidth - 36);
    root.classList.toggle("bubble-below", r.top < 240);
    root.classList.toggle("bubble-start", pos.side === "left" || r.right - w < 8);
  }

  // Un saludo por página y por sesión, para no repetir
  function sayOnce(key, text, m, ms) {
    if (seen[key]) return;
    seen[key] = 1;
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {}
    setTimeout(() => say(text, m, ms), 700);
  }

  // ── Viajar hasta un elemento de la página ──
  function flyTo(el, { offsetY = 0 } = {}) {
    if (!el || reduced) return;
    const r = el.getBoundingClientRect();
    const f = $face.getBoundingClientRect();
    const baseX = f.left + f.width / 2 - currentShift.x;
    const baseY = f.top + f.height / 2 - currentShift.y;
    const x = Math.min(Math.max(r.right - 30, 60), innerWidth - 60);
    const y = Math.min(Math.max(r.top + 30 + offsetY, 110), innerHeight - 60);
    shift(x - baseX, y - baseY);
    away = true;
    flewAt = Date.now();
    setTimeout(placeBubble, 650);
  }

  const currentShift = { x: 0, y: 0 };
  function shift(x, y) {
    currentShift.x = x;
    currentShift.y = y;
    root.style.transform = x || y ? `translate(${x}px, ${y}px)` : "";
  }

  function goHome() {
    away = false;
    shift(0, 0);
    setTimeout(placeBubble, 650);
  }

  function homeLater(ms) {
    clearTimeout(homeTimer);
    homeTimer = setTimeout(() => !tour && goHome(), ms);
  }

  // Si la persona se desplaza, vuelve a su lugar (salvo cuando el desplazamiento lo hizo Mili)
  let autoScrolling = false;
  addEventListener("scroll", () => {
    if (away && !tour && !autoScrolling && Date.now() - flewAt > 800) { hideBubble(); goHome(); }
  }, { passive: true });

  // Lleva la página hasta un elemento (sin scroll suave: el movimiento lo pone el vuelo de Mili)
  function scrollToEl(el, done) {
    autoScrolling = true;
    el.scrollIntoView({ behavior: "instant", block: "center" });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTimeout(() => (autoScrolling = false), 200);
      done();
    }));
  }

  // ── Confeti ──
  function confetti() {
    if (reduced) return;
    const f = $face.getBoundingClientRect();
    const colors = ["#5d55b8", "#9a98b8", "#e9b730", "#a29bf2", "#2f8a5b", "#f07a6c"];
    for (let i = 0; i < 26; i++) {
      const p = document.createElement("i");
      p.className = "mili-confetti";
      const a = Math.random() * Math.PI * 2;
      const d = 60 + Math.random() * 90;
      p.style.cssText = `left:${f.left + f.width / 2}px;top:${f.top + f.height / 2}px;background:${colors[i % colors.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 60}px;--r:${Math.random() * 720 - 360}deg`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1100);
    }
  }

  // ── Mira hacia el puntero ──
  let tiltFrame = null;
  if (!reduced && matchMedia("(pointer: fine)").matches) {
    addEventListener("pointermove", (e) => {
      if (tiltFrame) return;
      tiltFrame = requestAnimationFrame(() => {
        tiltFrame = null;
        const f = $face.getBoundingClientRect();
        const dx = e.clientX - (f.left + f.width / 2);
        const dy = e.clientY - (f.top + f.height / 2);
        const ry = Math.max(-16, Math.min(16, dx / 30));
        const rx = Math.max(-12, Math.min(12, -dy / 30));
        $tilt.style.transform = `rotateY(${ry}deg) rotateX(${rx}deg)`;
      });
    });
  }

  // ── Arrastrar y cosquillas ──
  let drag = null;
  let pokes = [];
  $face.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, moved: false, rect: root.getBoundingClientRect() };
    $face.setPointerCapture(e.pointerId);
  });
  $face.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 8) return;
    drag.moved = true;
    root.classList.add("dragging");
    hideBubble();
    closeMenu();
    shift(currentShift.x + dx, currentShift.y + dy);
    drag.x = e.clientX;
    drag.y = e.clientY;
  });
  $face.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const wasDrag = drag.moved;
    drag = null;
    root.classList.remove("dragging");
    if (!wasDrag) return onFaceClick();
    // Se pega al costado más cercano
    const r = $face.getBoundingClientRect();
    pos = {
      side: r.left + r.width / 2 < innerWidth / 2 ? "left" : "right",
      bottom: Math.round(Math.min(Math.max(innerHeight - r.bottom, 12), innerHeight - 200)),
    };
    store.set(POS_KEY, pos);
    root.classList.add("snapping");
    shift(0, 0);
    applyPos();
    away = false;
    setTimeout(() => root.classList.remove("snapping"), 400);
    say("¡Me quedo acá! 😄", "risa", 1800);
  });

  function onFaceClick() {
    const now = Date.now();
    pokes = pokes.filter((t) => now - t < 1200).concat(now);
    if (pokes.length >= 3) {
      pokes = [];
      anim("spin");
      confetti();
      return say(["¡Ey, me hacés cosquillas! 😂", "¡Jajaja, pará! 🙈", "¡Ok, ok, estoy despierta! 😆"][Math.floor(Math.random() * 3)], "risa", 2500);
    }
    $menu.hidden ? openMenu() : (closeMenu(), mood("feliz"));
  }

  // ── Menú rápido ──
  function menuItems() {
    const u = typeof currentUser === "function" ? currentUser() : null;
    const items = [];
    if (u && u.role === "admin") {
      items.push(["#/panel", "📊 Ir al panel"], ["grabacion.html", "🎬 Espacio de grabación"]);
    } else {
      const next = u ? nextLessonFor(u.id) : null;
      if (next) items.push([`#/clase/${next.code}`, "▶ Seguir donde quedé"]);
      items.push(["#/test", "🧭 ¿Por dónde empiezo?"], ["#/cursos", "📚 Lo que comparto"]);
      if (u) items.push(["#/mis-notas", "✓ Mi recorrido"]);
      else items.push(["#/ingresar", "👋 Crear mi cuenta"]);
      if (document.querySelector("[data-form=ask]")) items.push(["ask", "💬 Hacerte una pregunta"]);
    }
    if (!u || u.role !== "admin") items.push(["equipos", "🤝 Para equipos y marcas"]);
    items.push(["tour", "✨ Mostrame la web"]);
    items.push(["quiet", pref === "quiet" ? "🔔 Volver a hablarme" : "🔕 Silenciar mensajes"]);
    return items;
  }

  function openMenu() {
    hideBubble();
    $menu.innerHTML = `<b>¿En qué te ayudo?</b>` + menuItems().map(([href, label]) => `<button data-go="${href}">${label}</button>`).join("");
    $menu.hidden = false;
    $face.setAttribute("aria-expanded", "true");
    mood("pensando");
    anim("hop");
    placeBubble();
  }

  function closeMenu() {
    $menu.hidden = true;
    $face.setAttribute("aria-expanded", "false");
  }

  $face.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFaceClick(); }
  });
  $bubble.querySelector(".mili-x").addEventListener("click", () => {
    hideBubble();
    if (tour) endTour();
  });
  $menu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (!b) return;
    const go = b.dataset.go;
    closeMenu();
    if (go === "quiet") {
      pref = pref === "quiet" ? "on" : "quiet";
      store.set(PREF_KEY, pref);
      pref === "on" ? say("¡Acá estoy de nuevo! 💜", "risa") : mood("feliz");
    } else if (go === "tour") {
      if (location.hash.replace("#", "") && location.hash !== "#/") { location.hash = "#/"; setTimeout(startTour, 500); }
      else startTour();
    } else if (go === "equipos") {
      const show = () => {
        const sec = document.getElementById("equipos");
        if (!sec) return;
        scrollToEl(sec, () => {
          flyTo(sec.querySelector(".teams"));
          setTimeout(() => say("Si querés que lo compartamos con tu equipo o hacer algo juntos, escribime 💜", "risa", 4500), 500);
          homeLater(7000);
        });
      };
      if (location.hash && location.hash !== "#/") { location.hash = "#/"; setTimeout(show, 450); } else show();
    } else if (go === "ask") {
      const f = document.querySelector("[data-form=ask]");
      scrollToEl(f, () => { f.querySelector("textarea").focus({ preventScroll: true }); flyTo(f); say("Escribime acá abajo 👇", "feliz", 3500); homeLater(5000); });
    } else if (go.startsWith("#")) {
      location.hash = go;
    } else {
      location.href = go;
    }
  });
  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) closeMenu();
  });

  // ── Recorrido guiado por la portada ──
  const TOUR = [
    [".stair-cards", "Esta es la escalera: <b>3 niveles</b>, de <i>Arranco</i> a <i>Decido y transformo</i>. Como mi propio camino.", "feliz"],
    [".hero .btn", "¿No sabés por dónde empezar? Respondé <b>4 preguntas</b> y te digo por dónde arrancar.", "pensando"],
    [".section-sm .grid", `Son <b>${COURSES.length} series</b> de videos cortos, con lo que uso listo para copiar y un desafío donde te doy mi opinión.`, "risa"],
    [null, "Cuando me necesites, tocame. ¡Y si querés, arrastrame a otro costado! 💜", "risa"],
  ];

  function startTour() {
    tour = { i: 0 };
    store.set(TOUR_KEY, 1);
    tourStep();
  }

  function tourStep() {
    if (!tour) return;
    const step = TOUR[tour.i];
    if (!step) return endTour();
    const [sel, text, m] = step;
    const el = sel && document.querySelector(sel);
    const last = tour.i === TOUR.length - 1;
    const next = { label: last ? "¡Listo!" : "Siguiente →", run: () => { tour.i++; last ? endTour() : tourStep(); } };
    const skip = { label: "Saltear", run: endTour };
    if (el) {
      el.classList.add("mili-spot");
      scrollToEl(el, () => { flyTo(el); setTimeout(() => say(text, m, 0, last ? [next] : [next, skip]), 450); });
    } else {
      goHome();
      setTimeout(() => { say(text, m, 0, [next]); confetti(); }, 500);
    }
    document.querySelectorAll(".mili-spot").forEach((x) => x !== el && x.classList.remove("mili-spot"));
  }

  function endTour() {
    tour = null;
    document.querySelectorAll(".mili-spot").forEach((x) => x.classList.remove("mili-spot"));
    hideBubble();
    goHome();
    mood("feliz");
  }

  // Reacciona al pasar por la escalera de la portada
  let stepTimer;
  document.addEventListener("mouseover", (e) => {
    const st = e.target.closest && e.target.closest(".stair-cards .stair-card");
    if (!st || tour) return;
    clearTimeout(stepTimer);
    stepTimer = setTimeout(() => {
      const n = Number(st.dataset.n);
      const lines = {
        1: ["Nivel 1: arrancamos desde cero, sin vueltas. 🌱", "feliz"],
        2: ["Nivel 2: herramientas para que las cosas funcionen. ⚙️", "pensando"],
        3: ["Nivel 3: decidir, liderar y transformar. 🚀", "risa"],
      };
      say(lines[n][0], lines[n][1], 2600);
    }, 250);
  });

  // ── Reacciones a la navegación ──
  function onRoute(route) {
    clearTimeout(idleTimer);
    if (tour && route.parts[0]) endTour();
    if (away && !tour) goHome();
    const u = typeof currentUser === "function" ? currentUser() : null;
    const first = u ? u.name.split(" ")[0] : "";
    const [p0, p1] = route.parts;

    if (!p0) {
      if (u && u.role === "alumno") {
        const next = nextLessonFor(u.id);
        sayOnce("home", next ? `¡Hola, ${esc(first)}! Te quedó pendiente <b>${esc(next.title)}</b>. ¿Seguimos?` : `¡Hola, ${esc(first)}! Terminaste todo 🎉`, "risa");
      } else if (!u && !store.get(TOUR_KEY, 0) && !seen.home) {
        seen.home = 1;
        setTimeout(() => {
          anim("wave");
          say("¡Hola! Soy Mili 👋 ¿Te muestro la web en 20 segundos?", "risa", 0, [
            { label: "¡Dale!", run: startTour },
            { label: "Ahora no", run: () => { store.set(TOUR_KEY, 1); say("¡Listo! Si me necesitás, tocame 💜", "feliz", 3000); } },
          ]);
        }, 900);
      } else if (!u) {
        sayOnce("home", "¡Hola de nuevo! 👋 Si no sabés por dónde arrancar, respondé 4 preguntas y te digo.", "feliz");
      }
    } else if (p0 === "cursos") {
      sayOnce("cursos", "Cada serie son 3 videos cortos y un desafío. Filtrá por nivel o por tema.", "feliz");
    } else if (p0 === "clase" && LESSON_BY_CODE[p1]) {
      const l = LESSON_BY_CODE[p1];
      if (typeof unlocked === "function" && !unlocked(l.level)) sayOnce("paywall", `Este video es del Nivel ${l.level}. Si el Nivel 1 te sirvió, acá seguimos subiendo 💜`, "pensando", 6500);
      else if (l.type === "taller") sayOnce("taller", "En los desafíos me mostrás lo que armaste y te doy mi opinión. ¡Animate!", "feliz", 6500);
      else sayOnce("clase", `Este video dura ${l.min} minutos. Al final te dejo una pregunta rápida.`, "feliz");
      idleTimer = setTimeout(() => {
        const f = document.querySelector("[data-form=ask]");
        if (f) say("¿Te trabaste con algo? Preguntame abajo y te respondo 💬", "pensando", 7000);
      }, 90000);
    } else if (p0 === "test") {
      sayOnce("test", "Respondé como sos hoy, no como te gustaría ser. No hay respuestas malas 😉", "pensando");
    } else if (p0 === "herramientas") {
      sayOnce("herramientas", "Estas calculadoras las uso en el trabajo real. Cambiá los números y mirá qué pasa.", "pensando");
    } else if (p0 === "mis-notas" && u) {
      const done = LESSONS.filter((l) => isDone(u.id, l.code)).length;
      sayOnce("notas", done ? `Llevás ${done} de ${LESSONS.length}. ¡Un escalón a la vez! 💜` : "Todavía no arrancaste. El primer video dura 6 minutos 😉", done ? "risa" : "feliz");
    } else if (p0 === "panel" && u && u.role === "admin") {
      const q = state.questions.filter((x) => !x.answer).length;
      const s = state.submissions.filter((x) => x.grade === undefined).length;
      say(q || s ? `Tenés ${q} pregunta${q === 1 ? "" : "s"} y ${s} desafío${s === 1 ? "" : "s"} esperándote.` : "Está todo al día. ¡A grabar! 🎬", q || s ? "pensando" : "risa");
    }
  }

  // ── Reacciones a acciones ──
  const PHRASES = {
    "quiz-ok": [["¡Bien ahí! 🎉", "risa"], ["¡Exacto! Se nota que prestaste atención.", "risa"], ["¡Eso! Una más para tu escalera.", "risa"]],
    "quiz-bad": [["¡Uy, casi! Mirá la respuesta en verde, es de las que confunden.", "sorpresa"], ["No pasa nada, a mí también me costó esa 😅", "sorpresa"]],
    complete: [["¡Visto! Uno más en tu recorrido 💪", "risa"]],
    "level-done": [["¡Terminaste un nivel entero! Subiste un escalón 🎉", "risa"]],
    copy: [["Copiado. Pegalo en tu planilla y probalo 😉", "feliz"]],
    rate: [["¡Gracias! Lo leo todo y me sirve un montón 💜", "risa"]],
    ask: [["Recibido. Te respondo acá mismo, en este video.", "pensando"]],
    submit: [["¡Gracias por compartirlo! Lo miro con mucha atención.", "risa"]],
    "test-done": [["¡Listo! Ya sabés por dónde arrancar.", "risa"]],
    purchase: [["¡Bienvenida/o al siguiente nivel! Ya tenés todo desbloqueado 🎉", "risa"]],
  };
  // Dónde ir a reaccionar en cada caso
  const TARGETS = { "quiz-ok": ".options", "quiz-bad": ".options", copy: ".codebox", rate: "[data-form=rate]", ask: "[data-form=ask]", submit: "[data-form=submit]" };
  const CELEBRATE = ["quiz-ok", "complete", "level-done", "submit", "test-done", "purchase"];

  function react(kind) {
    const options = PHRASES[kind];
    if (!options) return;
    const [text, m] = options[Math.floor(Math.random() * options.length)];
    const target = TARGETS[kind] && document.querySelector(TARGETS[kind]);
    if (target && target.getBoundingClientRect().top < innerHeight && target.getBoundingClientRect().bottom > 0) {
      flyTo(target);
      setTimeout(() => { say(text, m, 3800); if (CELEBRATE.includes(kind)) confetti(); }, reduced ? 0 : 600);
      homeLater(5200);
    } else {
      say(text, m);
      if (CELEBRATE.includes(kind)) setTimeout(confetti, 150);
    }
  }

  mood("feliz");
  return { say, react, onRoute, mood, startTour };
})();
