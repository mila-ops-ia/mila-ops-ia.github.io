// SoyTigreYa: prototipo con tres vistas (Vecino, Comercio, Municipio) que comparten los mismos datos.
// Todo se guarda en el navegador (localStorage). "Reiniciar demo" (vista Municipio) vuelve a los datos iniciales.

const KEY = 'soytigreya-v5';
const ESTADOS = ['recibido', 'preparacion', 'listo', 'retirado'];
const ESTADO_TXT = { recibido: 'Recibido', preparacion: 'En preparación', listo: 'Listo para retirar', retirado: 'Retirado', rechazado: 'Rechazado' };
const RECLAMO_TXT = { recibido: 'Recibido', asignado: 'Asignado a una cuadrilla', 'en curso': 'En curso', resuelto: 'Resuelto' };
const PAGOS = [
  { id: 'mp', nombre: 'Mercado Pago', emoji: '💙' },
  { id: 'dni', nombre: 'Cuenta DNI', emoji: '🟢' },
  { id: 'tarjeta', nombre: 'Débito o crédito', emoji: '💳' },
  { id: 'efectivo', nombre: 'Efectivo al retirar', emoji: '💵' },
];
const RUBROS = [...CATS, ...RUBROS_EXTRA];
const SERVICIOS = [
  { emoji: '🎁', txt: 'Beneficios en comercios', a: 'tab', v: 'beneficios', kw: 'beneficio descuento credencial comercio' },
  { emoji: '🥡', txt: 'Pedir para retirar', a: 'cat', v: 'gastro', kw: 'comida takeaway pedir retirar' },
  { emoji: '🧾', txt: 'Pagar tasas municipales', a: 'sub', v: 'tasas', kw: 'tasa abl impuesto pagar servicios generales' },
  { emoji: '🚗', txt: 'Estacionamiento medido', a: 'sub', v: 'estacionamiento', kw: 'estacionar estacionamiento auto patente' },
  { emoji: '🚨', txt: 'Multas de tránsito', a: 'sub', v: 'multas', kw: 'multa infraccion transito patente' },
  { emoji: '📣', txt: 'Hacer un reclamo', a: 'serv', v: 'reclamos', kw: 'reclamo luz alumbrado bache poda basura residuos' },
  { emoji: '📅', txt: 'Pedir un turno', a: 'serv', v: 'turnos', kw: 'turno licencia conducir zoonosis medico castracion' },
  { emoji: '🌊', txt: 'Altura del río', a: 'sub', v: 'rio', kw: 'rio marea altura agua crecida sudestada' },
  { emoji: '🚌', txt: 'Colectivos', a: 'sub', v: 'colectivos', kw: 'colectivo bondi linea parada' },
  { emoji: '💊', txt: 'Farmacias de turno', a: 'sub', v: 'farmacias', kw: 'farmacia turno remedio' },
  { emoji: '🆘', txt: 'Botón de alerta', a: 'sub', v: 'alerta', kw: 'alerta emergencia seguridad robo panico' },
  { emoji: '🎪', txt: 'Agenda cultural', a: 'serv', v: 'agenda', kw: 'agenda evento feria musica cultura' },
  { emoji: '🏥', txt: 'Salud: turnos y centros de salud', a: 'sub', v: 'salud', kw: 'salud turno medico hospital guardia pediatra clinica odontologo dentista oculista cardiologo vacuna cafys hdi' },
  { emoji: '💼', txt: 'Empleos y cursos gratuitos', a: 'sub', v: 'trabajo', kw: 'trabajo empleo laburo busqueda cv curriculum postular curso capacitacion oficio formacion tif' },
  { emoji: '🏅', txt: 'Deporte y polideportivos', a: 'sub', v: 'deportes', kw: 'deporte polideportivo natacion pileta futbol voley basquet atletismo remo colonia gimnasia escuela deportiva' },
  { emoji: '⭐', txt: 'Puntos Tigre: sumar y canjear', a: 'sub', v: 'puntos', kw: 'puntos canje canjear premio nivel' },
  { emoji: '♻️', txt: 'Reciclar y sumar puntos', a: 'sub', v: 'reciclar', kw: 'reciclar reciclaje punto verde ecopunto' },
];

// ---------- utilidades ----------
const $ = (s) => document.querySelector(s);
const plata = (n) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('es-AR');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hora = (ts) => new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
const fecha = (ts) => new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
const rubro = (id) => RUBROS.find((c) => c.id === id) || { nombre: id, emoji: '🏪' };
const cat = rubro;
const comercio = (id) => S.comercios.find((c) => c.id === id);
const inicioMes = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1).getTime();
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Punto cerca del centro de una localidad, siempre el mismo para el mismo número.
function cerca(loc, i) {
  const [la, lo] = LOC_COORDS[loc] || LOC_COORDS['Tigre Centro'];
  return [la + (((i * 37) % 11) - 5) * 0.0019, lo + (((i * 53) % 13) - 6) * 0.0021];
}

// ---------- datos ----------
function seed() {
  const r = rng(7);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const comercios = SEED_COMERCIOS.map((c, i) => ({
    ...c, abierto: true, pos: cerca(c.loc, i + 3),
    productos: c.productos.map((p, j) => ({ id: c.id + 'p' + j, disponible: true, ...p })),
  }));

  // Historial de 6 meses: compras de todo el distrito y algunas propias.
  const pedidos = [];
  const ahora = Date.now();
  const pesos = comercios.flatMap((c) => Array(c.cat === 'gastro' ? 4 : 1).fill(c));
  let n = 1000;
  for (let m = 5; m >= 0; m--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - m);
    const desde = inicioMes(d);
    const hasta = m === 0 ? ahora : inicioMes(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    const cant = m === 0 ? Math.round(140 * (new Date().getDate() / 30)) + 10 : 110 + Math.floor(r() * 50) + (5 - m) * 12;
    for (let i = 0; i < cant; i++) {
      const c = pick(pesos);
      const items = [];
      const k = 1 + Math.floor(r() * 3);
      for (let j = 0; j < k; j++) {
        const p = pick(c.productos);
        const ya = items.find((it) => it.pid === p.id);
        if (ya) ya.qty++; else items.push({ pid: p.id, nombre: p.nombre, precio: p.precio, qty: 1 });
      }
      pedidos.push(armarPedido({
        id: 'P' + n++, cid: c.id, items, desc: c.desc, pago: pick(PAGOS).id,
        creado: desde + Math.floor(r() * (hasta - desde)), estado: 'retirado', mio: r() < 0.07, loc: c.loc,
      }));
    }
  }

  // Pedidos en curso de otros vecinos, para que el panel del comercio no arranque vacío.
  const c2 = comercios.find((c) => c.id === 'c2');
  [['recibido', [[0, 1], [3, 1]], 8], ['preparacion', [[1, 2]], 18]].forEach(([estado, its, min], k) => {
    pedidos.push(armarPedido({
      id: 'P' + n++, cid: 'c2', items: its.map(([j, q]) => ({ pid: c2.productos[j].id, nombre: c2.productos[j].nombre, precio: c2.productos[j].precio, qty: q })),
      desc: c2.desc, pago: k ? 'dni' : 'mp', creado: ahora - min * 60000, estado, mio: false, loc: c2.loc, retiro: `a las ${hora(ahora + (30 - min) * 60000)}`,
    }));
  });

  const reclamos = [];
  for (let i = 0; i < 46; i++) {
    const creado = ahora - Math.floor(r() * 25 * 864e5);
    const hasta = Math.floor(r() * 4);
    const loc = pick(LOCALIDADES);
    reclamos.push({
      id: 'R' + (5200 + i), tipo: pick(TIPOS_RECLAMO).id, loc, dir: '', texto: '', foto: null, pos: cerca(loc, i * 7 + 1), mio: false, creado,
      estado: ESTADOS_RECLAMO[hasta], historial: ESTADOS_RECLAMO.slice(0, hasta + 1).map((e, k) => ({ estado: e, t: creado + k * 864e5 * 0.8 })),
    });
  }
  const c0 = ahora - 3 * 864e5;
  reclamos.push({ id: 'R5250', tipo: 'alumbrado', loc: 'Tigre Centro', dir: 'Sarmiento 450', texto: 'Hay dos lámparas apagadas en la cuadra.', foto: null, pos: cerca('Tigre Centro', 2), mio: true, creado: c0, estado: 'asignado', historial: [{ estado: 'recibido', t: c0 }, { estado: 'asignado', t: c0 + 864e5 }] });

  const anio = new Date().getFullYear();
  const mesAct = new Date().getMonth();
  const tasas = [mesAct - 2, mesAct - 1, mesAct].map((m, i) => ({
    id: 'TSG' + i, concepto: 'Tasa por Servicios Generales', periodo: `Cuota ${m + 1}/${anio}`,
    vence: new Date(anio, m, 15).getTime(), monto: 18450 + i * 620, pagada: i === 0,
  }));

  return {
    v: 3, rol: 'vecino', perfil: null, tour: null, tab: 'inicio', sesion: true, letra: false,
    usuario: { nombre: 'Lucía Fernández', dni: '30.456.789', nro: 'ST-104-2291', loc: 'Tigre Centro', desde: 2023, partida: '12-345678-9', patente: 'AF123BC' },
    comercios, pedidos, reclamos, turnos: [], notifs: [],
    carrito: null, filtro: { cat: 'todas', loc: 'todas', q: '' }, comprarTab: 'comercios',
    benef: { rubro: 'todas', vista: 'lista' },
    abierto: null, sheet: null, sub: null, pago: 'mp', retiro: 0,
    servTab: 'turnos', turnoForm: { tramite: 'licencia', dia: 0, hora: null },
    recForm: { tipo: 'alumbrado', loc: 'Tigre Centro', dir: '', texto: '', foto: null, pos: null },
    reclamosPed: seedRP(pedidos), rpForm: null,
    tasas, multas: [{ id: 'M88123', patente: 'AF123BC', motivo: 'Estacionar en lugar prohibido', lugar: 'Av. Cazón 900', fecha: ahora - 12 * 864e5, monto: 45000, pagada: false }],
    multaBusca: '', estac: { saldo: 3500, zona: 'A', activo: null, historial: [] },
    parada: 'estacion', alerta: null, cobro: null, comprobante: null,
    chat: [], benefSel: null, busca: '',
    panelCid: 'c2', panelTab: 'pedidos', pagosApp: 0,
    puntos: seedPuntos(pedidos),
  };
}

// Reclamos de compras: uno esperando respuesta de Rosa y otro vencido, que ya pasó a mediación.
function seedRP(pedidos) {
  const ret = pedidos.filter((p) => p.cid === 'c2' && p.estado === 'retirado' && !p.mio).sort((a, b) => b.creado - a.creado);
  const ahora = Date.now();
  const out = [];
  if (ret[0]) out.push({ id: 'RC101', pid: ret[0].id, cid: 'c2', motivo: 'falta', texto: 'Pedí dos porciones de tiramisú y vino una sola.', foto: null, creado: ahora - 3 * 36e5, estado: 'abierto', mio: false, vecino: 'Martín G.', historial: [{ t: ahora - 3 * 36e5, txt: 'Reclamo enviado al comercio' }] });
  if (ret[1]) out.push({ id: 'RC097', pid: ret[1].id, cid: 'c2', motivo: 'cobro', texto: 'Me cobraron el precio sin el descuento Soy Tigre.', foto: null, creado: ahora - 30 * 36e5, estado: 'abierto', mio: false, vecino: 'Sofía P.', historial: [{ t: ahora - 30 * 36e5, txt: 'Reclamo enviado al comercio' }] });
  return out;
}

// Puntos Tigre: historial inicial a partir de las compras propias de los últimos meses.
function seedPuntos(pedidos) {
  const hist = pedidos.filter((p) => p.mio).map((p) => ({ t: p.creado, txt: `Compra en ${comercio2(p.cid).nombre}`, pts: Math.floor(p.total / PUNTOS.porCompra), emoji: '🛍️' }));
  const ahora = Date.now();
  hist.push({ t: ahora - 40 * 864e5, txt: 'Tasa pagada antes del vencimiento', pts: PUNTOS.tasaATiempo, emoji: '🧾' });
  hist.push({ t: ahora - 18 * 864e5, txt: 'Reciclaje en Punto Verde Plaza Mitre', pts: PUNTOS.reciclar, emoji: '♻️' });
  hist.push({ t: ahora - 9 * 864e5, txt: 'Reciclaje en Punto Verde Plaza Mitre', pts: PUNTOS.reciclar, emoji: '♻️' });
  hist.sort((a, b) => a.t - b.t);
  const total = hist.reduce((a, h) => a + h.pts, 0);
  return { saldo: total, acumulado: total, historial: hist, cupones: [], descTasa: 0, canjeados: 0 };
}
function comercio2(id) { return SEED_COMERCIOS.find((c) => c.id === id); }

function sumarPuntos(pts, txt, emoji) {
  if (pts <= 0) return 0;
  S.puntos.saldo += pts; S.puntos.acumulado += pts;
  S.puntos.historial.push({ t: Date.now(), txt, pts, emoji });
  return pts;
}
function nivelActual(acum) {
  const n = NIVELES.filter((x) => acum >= x.desde).pop();
  const sig = NIVELES[NIVELES.indexOf(n) + 1];
  return { n, sig, falta: sig ? sig.desde - acum : 0, pct: sig ? ((acum - n.desde) / (sig.desde - n.desde)) * 100 : 100 };
}

function armarPedido(p) {
  const subtotal = p.items.reduce((a, it) => a + it.precio * it.qty, 0);
  const descuento = Math.round(subtotal * p.desc / 100);
  return { codigo: String(1000 + Math.floor(Math.random() * 9000)), ...p, subtotal, descuento, total: subtotal - descuento };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 3) {
      if (!s.reclamosPed) s.reclamosPed = seedRP(s.pedidos); if (!s.puntos) s.puntos = seedPuntos(s.pedidos); (s.comercios || []).forEach((c) => { const sd = SEED_COMERCIOS.find((x) => x.id === c.id); if (sd && sd.foto) c.foto = sd.foto; if (sd && c.destacado === undefined) c.destacado = !!sd.destacado; }); return s; }
  } catch (e) { /* sin almacenamiento */ }
  return seed();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ ...S, sheet: S.sheet === 'tigri' ? null : null })); } catch (e) { /* sin lugar o sin almacenamiento */ }
}

let S = load();

// ---------- render ----------
function render() {
  const app = $('#app');
  document.documentElement.style.fontSize = S.letra ? '19px' : '16px';
  document.body.classList.toggle('letra-grande', !!S.letra);
  const perf = perfilActual();
  if (!perf) {
    if (S.sheet && S.sheet !== 'pagando') S.sheet = null;
    app.className = 'shell landing';
    app.innerHTML = (S.metodo ? vMetodo() : vPerfiles()) + tourCard() + sheet();
    after(); save(); return;
  }
  S.rol = perf.vista === 'vecino' ? 'vecino' : perf.vista === 'comercio' ? 'comercio' : 'municipio';
  app.className = 'shell ' + (S.rol === 'vecino' ? 'phone' : 'wide') + (S.tour ? ' en-tour' : '');
  const vista = perf.vista === 'vecino' ? vecino() : perf.vista === 'comercio' ? panelComercio() : perf.vista === 'atencion' ? vAtencion() : vEconomia();
  const fab = S.rol === 'vecino' && !S.tour && !(S.abierto && S.carrito) && !(S.tab === 'inicio' && !S.sub) && !S.sub ? `<button class="fab" data-a="sheet" data-v="tigri" aria-label="Hablar con Tigri">${!S.tigriVisto && S.tab === 'inicio' && !S.sub ? '<span class="fab-globo">¡Hola! ¿Te ayudo?</span>' : ''}${tigriSvg()}</button>` : '';
  app.innerHTML = topbar(perf) + `<main class="main">${vista}</main>` + (S.rol === 'vecino' ? navVecino() + fab : '') + tourCard() + sheet();
  after();
  save();
}

function perfilActual() { return PERFILES.find((x) => x.id === S.perfil) || null; }

function avatarHtml(perf, cls = '') {
  return `<span class="avatar-p ${cls}" style="background:${perf.color}">${perf.nombre[0]}</span>`;
}

function topbar(perf) {
  const sinLeer = S.notifs.filter((n) => !n.leida).length;
  const sub = perf.vista === 'comercio' ? '<span class="marca-sub">Comercios</span>' : perf.vista === 'vecino' ? '' : '<span class="marca-sub">Panel municipal</span>';
  return `<header class="top">
    <div class="marca"><span class="logo">${tigriSvg()}</span><b>SoyTigre<span>Ya</span></b>${sub}</div>
    <div class="top-der">${perf.vista === 'vecino' ? `
      <button class="sos" data-a="sub" data-v="alerta" aria-label="Botón de alerta">🆘<b>Alerta</b></button>
      <button class="campana" data-a="notifs" aria-label="Notificaciones">🔔${sinLeer ? `<i>${sinLeer}</i>` : ''}</button>` : ''}
      <button class="quien" data-a="sheet" data-v="perfil" aria-label="Perfil y cambiar de perfil">${avatarHtml(perf)}<span class="quien-txt"><b>${perf.nombre}</b><small>${perf.rol}</small></span></button>
    </div>
  </header>`;
}

function navVecino() {
  const tabs = [['beneficios', '🎁', 'Beneficios'], ['comprar', '🛍️', 'Comprar'], ['inicio', '🏠', 'Inicio'], ['servicios', '🏛️', 'Trámites'], ['credencial', '🪪', 'Credencial']];
  const activos = S.pedidos.filter((p) => p.mio && ['recibido', 'preparacion', 'listo'].includes(p.estado)).length;
  return `<nav class="bottom">${tabs.map(([id, e, t]) => `<button class="${id === 'inicio' ? 'centro ' : ''}${S.tab === id && !S.sub ? 'on' : ''}" data-a="tab" data-v="${id}" aria-label="${t}"><span>${e}${id === 'comprar' && activos ? `<i>${activos}</i>` : ''}</span>${t}</button>`).join('')}</nav>`;
}

// ---------- Tigri: cachorro de tigre dibujado en SVG (diseño propio) ----------
function tigriSvg(cls = '') {
  return `<svg class="tigri-svg ${cls}" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="23" cy="27" r="14" fill="#E2701A"/><circle cx="77" cy="27" r="14" fill="#E2701A"/>
    <circle cx="23" cy="28" r="7.5" fill="#FFC6B3"/><circle cx="77" cy="28" r="7.5" fill="#FFC6B3"/>
    <ellipse cx="50" cy="57" rx="41" ry="36" fill="#F28C28"/>
    <path d="M50 21 l-5 11 h10z M38 24 l-1 10 l-5 -7z M62 24 l1 10 l5 -7z" fill="#3A2414"/>
    <path d="M9 52 q8 1 13 -2 M9 62 q8 0 12 -3 M91 52 q-8 1 -13 -2 M91 62 q-8 0 -12 -3" stroke="#3A2414" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="72" rx="21" ry="15" fill="#FFF4E6"/>
    <ellipse cx="35" cy="54" rx="6.5" ry="7.5" fill="#2B1A10" class="tg-ojo"/><ellipse cx="65" cy="54" rx="6.5" ry="7.5" fill="#2B1A10" class="tg-ojo"/>
    <circle cx="37.5" cy="51" r="2.4" fill="#fff"/><circle cx="67.5" cy="51" r="2.4" fill="#fff"/>
    <ellipse cx="24" cy="67" rx="5.5" ry="3.2" fill="#FF8F9A" opacity=".55"/><ellipse cx="76" cy="67" rx="5.5" ry="3.2" fill="#FF8F9A" opacity=".55"/>
    <path d="M44.5 64.5 q5.5 -3.5 11 0 q-1.5 5 -5.5 6 q-4 -1 -5.5 -6z" fill="#C2456A"/>
    <path d="M50 70.5 v3 M50 73.5 q-5 4.5 -9 0.5 M50 73.5 q5 4.5 9 0.5" stroke="#3A2414" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="75" r="1" fill="#C9A88C"/><circle cx="37" cy="72" r="1" fill="#C9A88C"/><circle cx="60" cy="75" r="1" fill="#C9A88C"/><circle cx="63" cy="72" r="1" fill="#C9A88C"/>
  </svg>`;
}

// ---------- elegir perfil ----------
function vPerfiles() {
  return `<main class="main perfiles">
    <div class="ing-logo">${tigriSvg()}</div>
    <h1>SoyTigre<span>Ya</span></h1>
    <p class="lead">Beneficios, compras en el barrio y trámites de Tigre en un solo lugar. Elegí con quién recorrerla.</p>
    <div class="perfiles-grid">${PERFILES.map((p) => `
      <button class="perfil-card" data-a="perfil" data-v="${p.id}">
        ${avatarHtml(p, 'grande')}
        <span class="perfil-txt"><b>${p.nombre}</b><span class="perfil-rol">${p.rol}</span></span>
        <span class="flecha">›</span>
      </button>`).join('')}</div>
    <button class="btn grande tour-btn" data-a="tourIniciar">▶ Ver el recorrido guiado <small>2 minutos</small></button>
    <div class="qr-entrada"><div class="qr" data-qr="https://mila-ops-ia.github.io/soytigreya"></div><div><b>Abrila en tu celu</b><span class="muted">Escaneá el código o entrá a mila-ops-ia.github.io/soytigreya</span></div></div>
    ${feedbackHtml()}
    <p class="pie-links"><button class="link" data-a="metodo">Cómo lo diseñamos</button><span>·</span><button class="link" data-a="reiniciar">Reiniciar la demo</button></p>
    <p class="muted chico centro">Prototipo académico: no se conecta con Mi Argentina ni con sistemas del municipio.<br>Fotos: Wikimedia Commons (CC BY y CC BY-SA), créditos en el README.</p>
  </main>`;
}

// ---------- vecino ----------
function vecino() {
  if (S.sub) return vSub();
  if (S.tab === 'beneficios') return vBeneficios();
  if (S.tab === 'comprar') return S.abierto ? vComercio(comercio(S.abierto)) : vComprar();
  if (S.tab === 'credencial') return vCredencial();
  if (S.tab === 'servicios') return vServicios();
  return vInicio();
}

function misDelMes() {
  const desde = inicioMes();
  return S.pedidos.filter((p) => p.mio && p.estado !== 'rechazado' && p.creado >= desde);
}

function vInicio() {
  const mes = misDelMes();
  const ahorro = mes.reduce((a, p) => a + p.descuento, 0);
  const activo = S.pedidos.filter((p) => p.mio && ['recibido', 'preparacion', 'listo'].includes(p.estado)).sort((a, b) => b.creado - a.creado)[0];
  const cerca2 = S.comercios.filter((c) => (c.loc === S.usuario.loc || c.destacado) && c.abierto).sort((a, b) => !!b.destacado - !!a.destacado);
  const r = rioAhora();
  const alto = r.altura.toFixed(2).replace('.', ',');
  const accesos = [
    ['🛍️', 'Comprar', 'tab', 'comprar', 'r'], ['🎁', 'Beneficios', 'tab', 'beneficios', 'r'], ['💳', 'Pagar', 'serv', 'pagos', 'p'], ['📣', 'Reclamar', 'serv', 'reclamos', 'p'],
    ['🏥', 'Salud', 'sub', 'salud', 's'], ['🏅', 'Deporte', 'sub', 'deportes', 'n'], ['💼', 'Empleo', 'sub', 'trabajo', 'a'], ['📅', 'Turnos', 'serv', 'turnos', 'p'],
    ['🚗', 'Estacionar', 'sub', 'estacionamiento', 'p'], ['🚌', 'Colectivos', 'sub', 'colectivos', 'a'], ['💊', 'Farmacias', 'sub', 'farmacias', 's'], ['🌊', `Río ${alto} m`, 'sub', 'rio', 'a'],
  ];
  const aviso = r.nivel.clase !== 'normal' ? `<button class="aviso-rio ${r.nivel.clase}" data-a="sub" data-v="rio"><span>🌊</span><div><b>Río Luján en ${r.nivel.txt.toLowerCase()}: ${alto} m</b><small>${r.sube ? 'Subiendo' : 'Bajando'} · tocá para ver el pronóstico</small></div></button>` : '';
  return `
  <section class="hola hola-fila"><h1>Hola, ${esc(S.usuario.nombre.split(' ')[0])}</h1><div class="hola-acc"><button class="tigri-hola" data-a="sheet" data-v="tigri" aria-label="Hablar con Tigri">${tigriSvg()}<b>Tigri</b></button><button class="lupa ${S.buscando ? 'on' : ''}" data-a="buscando" aria-label="Buscar">🔎</button></div></section>
  ${S.buscando || S.busca ? `<input class="buscar" type="search" placeholder="Buscá comercios, beneficios o trámites" value="${esc(S.busca)}" data-f="busca"><div id="resBusca">${resultadosBusca()}</div>` : ''}
  <div class="dash"><div class="dcol">
  <div class="wallet">
    <div class="wcard" data-a="voltear" role="button" tabindex="0" aria-label="Tu tarjeta Soy Tigre. Tocá para ver el código QR">
      <div class="wcara wfrente">
        <div class="wfila"><span class="wmarca">SOY TIGRE</span><span class="wmuni">Municipio de Tigre</span></div>
        <div class="wmonto">${plata(ahorro)}</div>
        <div class="wet">ahorrados este mes · ${plural(mes.length, 'compra', 'compras')}</div>
        <div class="wfila wpie"><span>${esc(S.usuario.nombre)}</span><span class="wqr"><i data-lucide="qr-code"></i></span></div>
      </div>
      <div class="wcara wdorso">
        <div class="qr" data-qr="token"></div>
        <div class="wdorso-txt"><b>Mostralo en la caja</b><span>Código válido por 30 segundos</span><span class="wvolver">Tocá para dar vuelta</span></div>
      </div>
    </div>
    <button class="wcard2" data-a="sub" data-v="puntos"><span>⭐ ${S.puntos.saldo.toLocaleString('es-AR')} Puntos Tigre</span><span>Canjear ›</span></button>
  </div>
  ${encuestaNps()}
  ${activo ? cardActivo(activo) : ''}
  ${aviso}
  <div class="hub">${accesos.map(([e, x, a, v, c]) => `<button class="hub-${c}" data-a="${a}" data-v="${v}"><span>${e}</span>${x}</button>`).join('')}</div>
  </div><div class="dcol">
  ${bannerFlash()}
  ${publicidadHtml()}
  <div class="h2-fila"><h2>Para vos, hoy</h2><button class="link" data-a="tab" data-v="comprar">Ver todos</button></div>
  <div class="carrusel">${cerca2.map(miniComercio).join('') || '<p class="muted">Todavía no hay comercios con pedidos en tu localidad.</p>'}</div>
  </div></div>`;
}

function publicidadHtml(cual) {
  const lista = cual ? PUBLICIDADES.filter((p) => p.id === cual) : PUBLICIDADES;
  return `<div class="pub-fila${cual ? ' sola' : ''}">${lista.map((p) => `<button class="pub" data-a="${p.a}" data-v="${p.v}" style="--pc:${p.color};${p.foto ? `background-image:url(${FOTO(p.foto)});--velo:1` : ''}">
    <span class="pub-tipo">${p.tipo}</span>
    <span class="pub-ico">${p.emoji}</span>
    <b>${p.titulo}</b><span class="pub-txt">${p.texto}</span></button>`).join('')}</div>`;
}

function resultadosBusca() {
  const q = norm(S.busca).trim();
  if (q.length < 2) return '';
  const res = [];
  S.comercios.forEach((c) => { if (norm(c.nombre + ' ' + c.productos.map((p) => p.nombre).join(' ')).includes(q)) res.push(`<button class="fila" data-a="abrir" data-v="${c.id}"><span class="ico">${c.emoji}</span><div><b>${esc(c.nombre)}</b><p class="muted">Pedí para retirar · -${c.desc}%</p></div></button>`); });
  BENEFICIOS.forEach((b, i) => { if (norm(b.nombre + ' ' + rubro(b.rubro).nombre + ' ' + b.texto).includes(q)) res.push(`<button class="fila" data-a="verBenef" data-v="${i}"><span class="ico">${b.emoji}</span><div><b>${esc(b.nombre)}</b><p class="muted">En el local · ${b.texto}</p></div></button>`); });
  SERVICIOS.forEach((s) => { if (norm(s.txt + ' ' + s.kw).includes(q)) res.push(`<button class="fila" data-a="${s.a}" data-v="${s.v}"><span class="ico">${s.emoji}</span><div><b>${s.txt}</b><p class="muted">Trámite o servicio</p></div></button>`); });
  return `<div class="lista resultados">${res.slice(0, 8).join('') || `<p class="muted">No encontré nada con "${esc(S.busca)}". Probá preguntarle a Tigri.</p>`}</div>`;
}

function miniComercio(c) {
  return `<button class="mini" data-a="abrir" data-v="${c.id}">
    <div class="mini-img" style="background:${c.color}${c.foto ? ` url(${FOTO(c.foto)}) center/cover` : ''}">${c.foto ? '' : c.emoji}<em>-${c.desc}%</em></div>
    <div class="mini-txt">${c.destacado ? '<span class="dest-tag">Destacado</span>' : ''}<b>${esc(c.nombre)}</b><span class="muted">${c.servicio ? 'Turnos online' : `Retirá en ${c.prep} min`}</span></div></button>`;
}

function cardActivo(p) {
  const c = comercio(p.cid);
  return `<button class="card activo" data-a="verPedidos">
    <div><span class="pill ${p.estado}">${ESTADO_TXT[p.estado]}</span><b>${esc(c.nombre)}</b>
    <span class="muted">${p.servicio ? 'Turno' : 'Retiro'} ${p.retiro} · código <b>${p.codigo}</b></span></div><span class="flecha">›</span></button>`;
}

// ---------- beneficios ----------
function listaBeneficios() {
  const f = S.benef;
  const fis = BENEFICIOS.map((b, i) => ({ ...b, i, pos: cerca(b.loc, i * 3 + 20), tipo: 'local' })).filter((b) => f.rubro === 'todas' || b.rubro === f.rubro);
  const app = S.comercios.filter((c) => f.rubro === 'todas' || c.cat === f.rubro).map((c) => ({ nombre: c.nombre, rubro: c.cat, loc: c.loc, emoji: c.emoji, texto: c.servicio ? `${c.desc}% reservando por la app` : `${c.desc}% pidiendo por la app`, pos: c.pos, tipo: 'app', id: c.id }));
  return fis;
}

function vBeneficios() {
  const f = S.benef;
  const yo = miPos();
  const lista = listaBeneficios().map((b) => ({ ...b, d: distKm(yo, b.pos) })).sort((a, b) => a.d - b.d);
  const rubrosUsados = RUBROS.filter((r) => BENEFICIOS.some((b) => b.rubro === r.id));
  return `
  <h1 class="titulo">Beneficios ${MARCA.tarjeta}</h1>
  <p class="muted sub">Más de 500 comercios adheridos. Mostrá tu credencial en la caja antes de pagar.</p>
  <div class="seg"><button class="${f.vista === 'lista' ? 'on' : ''}" data-a="benefVista" data-v="lista">📋 Lista</button><button class="${f.vista === 'mapa' ? 'on' : ''}" data-a="benefVista" data-v="mapa">🗺️ Mapa</button></div>
  <div class="chips">${[{ id: 'todas', nombre: 'Todo', emoji: '✨' }, ...rubrosUsados].map((c) => `<button class="chip ${f.rubro === c.id ? 'on' : ''}" data-a="benefRubro" data-v="${c.id}">${c.emoji} ${c.nombre}</button>`).join('')}</div>
  ${ubicBar()}
  ${f.vista === 'mapa' ? '<div class="mapa" data-map="beneficios"></div><p class="muted chico">Tocá un punto para ver el beneficio. Ubicaciones aproximadas.</p>' : `
  <div class="benef-lista">${lista.map((b) => `<button class="benef-fila" data-a="verBenef" data-v="${b.i}">
      <span class="benef-foto" style="${b.foto ? `background-image:url(${FOTO(b.foto)})` : ''}">${b.foto ? '' : b.emoji}</span>
      <div class="benef-info"><b>${esc(b.nombre)}</b><span class="benef-dir">${esc(b.dir || b.loc)}${b.dir && !b.dir.includes(b.loc) ? ` · ${b.loc}` : ''}</span>
      <span class="benef-dias">${esc(b.dias)} <em class="benef-km">· a ${kmTxt(b.d)}</em></span><span class="benef-txt">${esc(b.texto)}</span></div></button>`).join('') || '<p class="vacio">No hay beneficios en este rubro.</p>'}</div>
  <p class="muted chico">Beneficios reales publicados por el Municipio y medios locales (2024-2026). Pueden cambiar: confirmalos en la app Tigre Municipio.</p>`}`;
}

// ---------- comprar ----------
function vComprar() {
  const f = S.filtro;
  const activos = S.pedidos.filter((p) => p.mio && ['recibido', 'preparacion', 'listo'].includes(p.estado)).length;
  const seg = `<div class="seg"><button class="${S.comprarTab === 'comercios' ? 'on' : ''}" data-a="comprarTab" data-v="comercios">🛍️ Comercios</button><button class="${S.comprarTab === 'pedidos' ? 'on' : ''}" data-a="comprarTab" data-v="pedidos">🧾 Mis pedidos${activos ? ` (${activos})` : ''}</button></div>`;
  if (S.comprarTab === 'pedidos') return `<h1 class="titulo">Comprar y reservar en el barrio</h1>${seg}${vPedidos()}`;
  return `
  <h1 class="titulo">Comprar y reservar en el barrio</h1>
  ${seg}
  <p class="muted sub">Retirás en el local o reservás tu turno, y el descuento ${MARCA.tarjeta} se aplica solo.</p><p class="aviso-demo">Propuesta nueva del prototipo: estos comercios son de ejemplo para mostrar cómo funcionaría pedir y reservar por la app. Los beneficios reales están en <button class="link" data-a="tab" data-v="beneficios">Beneficios</button>.</p>
  ${publicidadHtml('p2')}
  <input class="buscar" type="search" placeholder="Buscar comercio o producto" value="${esc(f.q)}" data-f="q">
  <div class="chips">${[{ id: 'todas', nombre: 'Todo', emoji: '✨' }, ...CATS].map((c) => `<button class="chip ${f.cat === c.id ? 'on' : ''}" data-a="cat" data-v="${c.id}">${c.emoji} ${c.nombre}</button>`).join('')}</div>
  <label class="sel">📍 <select data-f="loc"><option value="todas">Todas las localidades</option>${LOCALIDADES.map((l) => `<option ${f.loc === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
  <div id="lista" class="lista">${listaComercios()}</div>`;
}

function listaComercios() {
  const f = S.filtro;
  const q = norm(f.q).trim();
  const res = S.comercios.filter((c) => (f.cat === 'todas' || c.cat === f.cat) && (f.loc === 'todas' || c.loc === f.loc) &&
    (!q || norm(c.nombre).includes(q) || c.productos.some((p) => norm(p.nombre).includes(q))));
  if (!res.length) return '<p class="vacio">No encontramos comercios con ese filtro.</p>';
  res.sort((a, b) => !!b.destacado - !!a.destacado);
  return res.map((c) => `<button class="comercio ${c.abierto ? '' : 'cerrado'}" data-a="abrir" data-v="${c.id}">
    <div class="avatar" style="background:${c.color}">${c.emoji}</div>
    <div class="info"><b>${esc(c.nombre)}</b>${c.destacado ? '<span class="dest-tag">Destacado</span>' : ''}<span class="muted">${cat(c.cat).nombre} · ${c.loc}</span>
    <span class="muted">${!c.abierto ? 'Cerrado ahora' : c.servicio ? '📅 Reservá tu turno online' : `🥡 Retiro en ${c.prep} min`}</span></div>
    <span class="desc">-${c.desc}%</span></button>`).join('');
}

function vComercio(c) {
  const car = S.carrito && S.carrito.cid === c.id ? S.carrito : null;
  const cant = (pid) => (car && car.items[pid]) || 0;
  const tot = car ? totalesCarrito() : null;
  return `
  <button class="volver" data-a="cerrarComercio">‹ Volver</button>
  <div class="hero" style="background:${c.color}${c.foto ? ` url(${FOTO(c.foto)}) center/cover` : ''}">${c.foto ? '' : `<span>${c.emoji}</span>`}</div>
  <h1 class="titulo">${esc(c.nombre)}</h1>
  <p class="muted sub">${esc(c.dir)} · ${c.loc}</p>
  <div class="tags"><span class="tag desc">${MARCA.tarjeta}: -${c.desc}%</span><span class="tag">${c.servicio ? '📅 Turnos online' : `🥡 Retiro en ${c.prep} min`}</span><span class="tag">0% comisión</span></div>
  ${c.abierto ? '' : '<p class="aviso">Este comercio está cerrado ahora. Podés mirar, pero no pedir.</p>'}
  <div class="productos">${c.productos.map((p) => `
    <div class="prod ${p.disponible ? '' : 'agotado'}">
      <span class="prod-ico">${p.emoji}</span>
      <div class="info"><b>${esc(p.nombre)}</b>${p.desc ? `<span class="muted">${esc(p.desc)}</span>` : ''}
        <span class="precio">${plata(p.precio * (1 - c.desc / 100))} <s>${plata(p.precio)}</s></span></div>
      ${!p.disponible ? '<span class="muted">Agotado</span>' : !c.abierto ? '' : cant(p.id)
        ? `<div class="qty"><button data-a="menos" data-v="${p.id}">−</button><b>${cant(p.id)}</b><button data-a="mas" data-v="${p.id}">+</button></div>`
        : `<button class="add" data-a="mas" data-v="${p.id}" aria-label="Agregar">+</button>`}
    </div>`).join('')}</div>
  ${tot ? `<div class="barra-carrito"><button class="btn" data-a="sheet" data-v="checkout">Ver pedido (${tot.unidades}) · ${plata(tot.total)}</button></div>` : ''}`;
}

function totalesCarrito() {
  const c = comercio(S.carrito.cid);
  const items = Object.entries(S.carrito.items).map(([pid, qty]) => {
    const p = c.productos.find((x) => x.id === pid);
    return { pid, nombre: p.nombre, precio: p.precio, qty, emoji: p.emoji };
  });
  const subtotal = items.reduce((a, it) => a + it.precio * it.qty, 0);
  const extra = flashActiva(c) ? c.flash.extra : 0;
  const descuento = Math.round(subtotal * (c.desc + extra) / 100);
  const hayCupon = S.puntos.cupones.some((x) => x.tipo === 'cupon');
  const cupon = hayCupon && !S.noUsarCupon ? Math.min(2000, subtotal - descuento) : 0;
  return { c, extra, items, subtotal, descuento, hayCupon, cupon, total: subtotal - descuento - cupon, unidades: items.reduce((a, it) => a + it.qty, 0) };
}

// ---------- Puntos Tigre ----------
function puntosMini() {
  const { n } = nivelActual(S.puntos.acumulado);
  return `<button class="puntos-mini" data-a="sub" data-v="puntos"><span>⭐ <b>${S.puntos.saldo.toLocaleString('es-AR')}</b> Puntos Tigre</span><span class="muted">${n.emoji} Nivel ${n.nombre} ›</span></button>`;
}

function puntosCard() {
  const { n, sig, falta, pct } = nivelActual(S.puntos.acumulado);
  return `<button class="card puntos-card" data-a="sub" data-v="puntos">
    <div class="pc-top"><span class="pc-num">⭐ ${S.puntos.saldo.toLocaleString('es-AR')}</span><span class="pill listo">${n.emoji} ${n.nombre}</span></div>
    <div class="barra-nivel"><i style="width:${Math.min(100, pct)}%"></i></div>
    <span class="muted">${sig ? `Te faltan ${falta.toLocaleString('es-AR')} puntos para ${sig.emoji} ${sig.nombre}` : '¡Llegaste al nivel máximo!'}</span>
    <span class="link">Canjear puntos ›</span></button>`;
}

function sPuntos() {
  const p = S.puntos;
  const vence = new Date(); vence.setMonth(vence.getMonth() + PUNTOS.vencenMeses);
  return `${puntosCard().replace('data-a="sub" data-v="puntos"', '')}
  <p class="muted chico centro">Los puntos vencen a los ${PUNTOS.vencenMeses} meses de sumarlos.</p>
  <h2>Canjeá tus puntos</h2>
  <div class="lista">${CANJES.map((c) => { const ok = p.saldo >= c.costo; const pend = c.id === 'tasa' && p.descTasa; return `<div class="fila canje"><span class="ico">${c.emoji}</span><div><b>${c.txt}</b><p class="muted">${c.detalle}</p></div><button class="btn mini-btn" data-a="canjear" data-v="${c.id}" ${ok && !pend ? '' : 'disabled'}>${pend ? 'Pendiente' : `⭐ ${c.costo}`}</button></div>`; }).join('')}</div>
  ${p.cupones.length ? `<h2>Mis cupones</h2><div class="lista">${p.cupones.map((c) => `<div class="fila"><span class="ico">🎟️</span><div><b>${esc(c.txt)}</b><p class="muted">Código ${c.codigo}</p></div></div>`).join('')}</div>` : ''}
  <div class="card referidos"><b>🤝 Invitá a un vecino</b><span class="muted">Cuando se registra con tu código, sumás 50 puntos cada uno.</span><div class="ref-cod"><code>${S.usuario.nro.replace('ST-', 'TIGRE-')}</code><button class="btn mini-btn" data-a="invitar">Compartir</button></div></div>
  <h2>Cómo sumar</h2>
  <div class="lista">${FORMAS_SUMAR.map((f) => `<div class="fila"><span class="ico">${f.emoji}</span><div><b>${f.txt}</b></div><span class="tag-mini">${f.pts}</span></div>`).join('')}</div>
  <button class="btn grande" data-a="sub" data-v="reciclar">♻️ Reciclar ahora y sumar</button>
  <h2>Movimientos</h2>
  <div class="lista">${p.historial.slice(-12).reverse().map((h) => `<div class="fila"><span class="ico">${h.emoji}</span><div><b>${esc(h.txt)}</b><p class="muted">${fecha(h.t)}</p></div><div class="der"><b class="${h.pts > 0 ? 'verde' : 'rojo'}">${h.pts > 0 ? '+' : ''}${h.pts}</b></div></div>`).join('')}</div>`;
}

function sReciclar() {
  if (S.reciclado && Date.now() - S.reciclado.t < 120000) {
    return `<div class="card alerta-ok"><span class="grande-emoji">♻️</span><h2>¡Gracias por reciclar!</h2><p>Sumaste ⭐ ${PUNTOS.reciclar} puntos en ${esc(S.reciclado.lugar)}.</p>
      <p class="muted">Tenés ${S.puntos.saldo.toLocaleString('es-AR')} puntos.</p><button class="btn" data-a="sub" data-v="puntos">Ver mis puntos</button></div>`;
  }
  return `<p class="muted sub">En cada punto verde hay un código QR. Escanealo al dejar tus residuos separados y sumás ${PUNTOS.reciclar} puntos.</p>
  ${cercaHtml('reciclar', 'Puntos verdes cerca tuyo', 2)}
  <div class="card escaner"><span class="grande-emoji">📷</span><p><b>Escaneá el QR del punto verde</b></p><p class="muted chico">Demostración: elegí el punto verde para simular el escaneo.</p></div>
  <div class="lista">${PUNTOS_VERDES.map((v) => `<button class="fila" data-a="reciclar" data-v="${v}"><span class="ico">♻️</span><div><b>${v}</b><p class="muted">Plástico, cartón, vidrio y latas</p></div><span class="tag-mini">+${PUNTOS.reciclar}</span></button>`).join('')}</div>`;
}

function horarios(c) {
  if (!c.servicio) return horariosRetiro(c.prep);
  const out = []; const d = new Date(); d.setHours(0, 0, 0, 0);
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  let k = 0;
  while (out.length < 6) {
    d.setDate(d.getDate() + 1); k++;
    if (d.getDay() === 0) continue;
    const nombre = k === 1 ? 'Mañana' : dias[d.getDay()][0].toUpperCase() + dias[d.getDay()].slice(1) + ' ' + d.getDate();
    ['10:00', '17:30'].forEach((h) => { if (out.length < 6) out.push({ i: out.length, txt: `${nombre} ${h}` }); });
  }
  return out;
}
function horariosRetiro(prep) {
  const base = new Date(Date.now() + prep * 60000);
  base.setSeconds(0, 0);
  base.setMinutes(Math.ceil(base.getMinutes() / 5) * 5);
  return [0, 15, 30, 45, 60, 90].map((m, i) => ({ i, txt: i === 0 ? `Lo antes posible (${hora(base)})` : hora(base.getTime() + m * 60000) }));
}

function vPedidos() {
  const mios = S.pedidos.filter((p) => p.mio).sort((a, b) => b.creado - a.creado);
  const activos = mios.filter((p) => ['recibido', 'preparacion', 'listo'].includes(p.estado));
  const pasados = mios.filter((p) => !activos.includes(p)).slice(0, 12);
  return `
  ${activos.length ? activos.map(pedidoActivo).join('') : `<div class="vacio">No tenés pedidos en curso.<br><button class="btn" data-a="cat" data-v="gastro">Pedir para retirar</button></div>`}
  ${activos.some((p) => p.cid === 'c2') ? '<p class="tip">💡 Para ver cómo avanza, tocá tu foto arriba y entrá como <b>Rosa</b>, la dueña del local.</p>' : ''}
  <h2>Anteriores</h2>
  <div class="lista">${pasados.map((p) => { const c = comercio(p.cid); return `<div class="fila"><span class="ico">${c.emoji}</span>
    <div><b>${esc(c.nombre)}</b><p class="muted">${fecha(p.creado)} · ${plural(p.items.reduce((a, i) => a + i.qty, 0), 'producto', 'productos')} · ${ESTADO_TXT[p.estado]}</p>${bloqueRP(p)}</div>
    <div class="der"><b>${plata(p.total)}</b><span class="verde">-${plata(p.descuento)}</span></div></div>`; }).join('')}</div>`;
}

function pedidoActivo(p) {
  const c = comercio(p.cid);
  const idx = ESTADOS.indexOf(p.estado);
  return `<div class="card pedido">
    <div class="ped-cab"><span class="avatar chico" style="background:${c.color}">${c.emoji}</span><div><b>${esc(c.nombre)}</b><span class="muted">${esc(c.dir)}</span></div></div>
    <ol class="pasos">${ESTADOS.slice(0, 3).map((e, i) => `<li class="${i < idx ? 'hecho' : i === idx ? 'actual' : ''}">${p.servicio ? ['Turno pedido', 'Confirmado', 'Te esperan'][i] : ESTADO_TXT[e]}</li>`).join('')}</ol>
    <div class="retiro">
      <div><span class="muted">${p.servicio ? 'Tu turno' : 'Retirás'}</span><b>${p.retiro}</b><span class="muted">${p.servicio ? 'Código de reserva' : 'Código de retiro'}</span><b class="codigo">${p.codigo}</b></div>
      <div class="qr chico" data-qr="RETIRO|${p.id}|${p.codigo}"></div>
    </div>
    <details><summary>Detalle · ${plata(p.total)}</summary>
      ${p.items.map((it) => `<p class="linea"><span>${it.qty} × ${esc(it.nombre)}</span><span>${plata(it.precio * it.qty)}</span></p>`).join('')}
      <p class="linea verde"><span>Beneficio ${MARCA.tarjeta} (-${p.desc}%)</span><span>-${plata(p.descuento)}</span></p>
      <p class="linea"><span>Pago</span><span>${PAGOS.find((x) => x.id === p.pago).nombre}</span></p>
    </details>
    ${bloqueRP(p)}
  </div>`;
}

// ---------- credencial ----------
function vCredencial() {
  const u = S.usuario;
  const meses = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - m);
    const desde = inicioMes(d), hasta = inicioMes(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    const ped = S.pedidos.filter((p) => p.mio && p.estado !== 'rechazado' && p.creado >= desde && p.creado < hasta);
    meses.push({ txt: MESES[d.getMonth()], ahorro: ped.reduce((a, p) => a + p.descuento, 0) });
  }
  const max = Math.max(...meses.map((m) => m.ahorro), 1);
  const total = meses.reduce((a, m) => a + m.ahorro, 0);
  return `
  <h1 class="titulo">Mi credencial</h1>
  <div class="credencial">
    <div class="cred-top"><span>🐯 ${MARCA.tarjeta}</span><span class="muted-claro">${MARCA.municipio}</span></div>
    <div class="qr grande" data-qr="token"></div>
    <p class="cred-timer">El código cambia en <b id="timer">30</b> s</p>
    <div class="cred-datos"><div><span>Titular</span><b>${esc(u.nombre)}</b></div><div><span>DNI</span><b>${esc(u.dni)}</b></div>
      <div><span>N.º de socio</span><b>${esc(u.nro)}</b></div><div><span>Localidad</span><b>${esc(u.loc)}</b></div></div>
    <p class="cred-ok">✔ Identidad validada</p>
  </div>
  <p class="muted centro">Mostrala en la caja de cualquier comercio adherido.</p>
  <h2>Puntos Tigre</h2>
  ${puntosCard()}
  <h2>Lo que ahorraste</h2>
  <div class="card"><p class="muted">Últimos 6 meses</p><strong class="grande-num">${plata(total)}</strong>
    <div class="barras">${meses.map((m, i) => `<div class="barra ${i === 5 ? 'hoy' : ''}"><span style="height:${Math.max(4, (m.ahorro / max) * 100)}%"></span><em>${m.txt}</em><small>${m.ahorro ? '$' + Math.round(m.ahorro / 1000) + 'k' : '—'}</small></div>`).join('')}</div></div>
  <h2>Mis datos y preferencias</h2>
  <div class="card form">
    <label>Nombre y apellido<input data-f="nombre" value="${esc(u.nombre)}"></label>
    <label>Localidad<select data-f="uloc">${LOCALIDADES.map((l) => `<option ${u.loc === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label>Patente de tu auto<input data-f="patente" value="${esc(u.patente)}" maxlength="7"></label>
    <button class="switch-fila" data-a="letra"><span>🔠 Letra grande y más contraste</span><span class="switch ${S.letra ? 'on' : ''}">${S.letra ? 'Activada' : 'Apagada'}</span></button>
    <button class="link rojo" data-a="cambiarPerfil">Salir y cambiar de perfil</button>
  </div>`;
}

// ---------- trámites ----------
function vServicios() {
  const t = S.servTab;
  const tabs = [['turnos', '📅 Turnos'], ['reclamos', '📣 Reclamos'], ['pagos', '💳 Pagos'], ['agenda', '🎪 Agenda']];
  let cuerpo = '';
  if (t === 'turnos') cuerpo = vTurnos();
  else if (t === 'reclamos') cuerpo = vReclamos();
  else if (t === 'pagos') cuerpo = vPagos();
  else cuerpo = `<div class="lista">${AGENDA.map((a) => `<div class="fila"><span class="dia">${a.dia}</span><div><b>${a.emoji} ${a.titulo}</b><p class="muted">${a.texto}</p></div></div>`).join('')}</div>
    <h2>Avisos de servicio</h2><div class="lista">${AVISOS.map((a) => `<div class="fila"><span class="ico">${a.emoji}</span><div><b>${a.titulo}</b><p class="muted">${a.texto}</p></div></div>`).join('')}</div>`;
  return `<h1 class="titulo">Trámites y servicios</h1>
  <div class="seg">${tabs.map(([id, txt]) => `<button class="${t === id ? 'on' : ''}" data-a="serv" data-v="${id}">${txt}</button>`).join('')}</div>${cuerpo}
  <h2>Más servicios</h2>
  <div class="accesos">${[['🏥', 'Salud', 'salud'], ['💼', 'Empleo', 'trabajo'], ['🏅', 'Deportes', 'deportes'], ['🌊', 'Río', 'rio']].map(([e, x, v]) => `<button data-a="sub" data-v="${v}"><span>${e}</span>${x}</button>`).join('')}</div>`;
}

function diasHabiles() {
  const out = []; const d = new Date(); d.setHours(0, 0, 0, 0);
  while (out.length < 6) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d)); }
  return out;
}

function vTurnos() {
  const f = S.turnoForm;
  const dias = diasHabiles();
  const horas = ['08:30', '09:00', '09:30', '10:30', '11:00', '12:00', '13:30', '14:00'];
  const ocupadas = (f.dia * 3 + f.tramite.length) % 4;
  const mios = S.turnos.slice().sort((a, b) => a.cuando - b.cuando);
  return `
  ${mios.length ? `<h2>Mis turnos</h2><div class="lista">${mios.map((x) => { const tr = TRAMITES.find((y) => y.id === x.tramite); return `<div class="fila"><span class="ico">${tr.emoji}</span><div><b>${tr.nombre}</b><p class="muted">${new Date(x.cuando).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · ${x.hora} h<br>${tr.lugar}</p></div><button class="link" data-a="cancelarTurno" data-v="${x.id}">Cancelar</button></div>`; }).join('')}</div>` : ''}
  <h2>Pedir un turno</h2>
  <div class="card form">
    <div class="opciones">${TRAMITES.map((tr) => `<button class="opcion ${f.tramite === tr.id ? 'on' : ''}" data-a="tramite" data-v="${tr.id}">${tr.emoji} ${tr.nombre}</button>`).join('')}</div>
    <p class="muted">Día</p>
    <div class="chips">${dias.map((d, i) => `<button class="chip ${f.dia === i ? 'on' : ''}" data-a="dia" data-v="${i}">${d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })}</button>`).join('')}</div>
    <p class="muted">Horario</p>
    <div class="chips">${horas.map((h, i) => { const tomado = i % 4 === ocupadas; return `<button class="chip ${f.hora === h ? 'on' : ''}" ${tomado ? 'disabled' : ''} data-a="horaTurno" data-v="${h}">${h}</button>`; }).join('')}</div>
    <button class="btn" data-a="pedirTurno" ${f.hora ? '' : 'disabled'}>Confirmar turno</button>
  </div>
  ${cercaHtml('tramites', 'Dónde atendemos', 3)}`;
}

function vReclamos() {
  const f = S.recForm;
  const mios = S.reclamos.filter((r) => r.mio).sort((a, b) => b.creado - a.creado);
  return `
  <h2>Nuevo reclamo</h2>
  <div class="card form">
    <div class="opciones cuatro">${TIPOS_RECLAMO.map((t) => `<button class="opcion-btn ${f.tipo === t.id ? 'on' : ''}" data-a="recTipo" data-v="${t.id}">${t.emoji}<br>${t.nombre}</button>`).join('')}</div>
    <label>Localidad<select data-f="recLoc">${LOCALIDADES.map((l) => `<option ${f.loc === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label>Dirección<input data-f="recDir" placeholder="Calle y altura" value="${esc(f.dir)}"></label>
    <p class="muted">Marcá el lugar en el mapa (podés mover el pin)</p>
    <div class="mapa chico-mapa" data-map="picker"></div>
    <button class="link" data-a="miUbicacion">📍 Usar mi ubicación</button>
    <label>Contanos qué pasa<textarea data-f="recTxt" rows="3" placeholder="Por ejemplo: el poste de la esquina no enciende">${esc(f.texto)}</textarea></label>
    <label class="foto-btn">${f.foto ? `<img src="${f.foto}" alt="Foto del reclamo">` : '<span>📷 Agregar una foto</span>'}<input type="file" accept="image/*" capture="environment" data-f="recFoto"></label>
    ${f.foto ? '<button class="link rojo" data-a="quitarFoto">Quitar foto</button>' : ''}
    <button class="btn" data-a="enviarReclamo">Enviar reclamo</button>
  </div>
  <h2>Mis reclamos</h2>
  <div class="lista">${mios.map(tarjetaReclamo).join('') || '<p class="muted">Todavía no hiciste reclamos.</p>'}</div>`;
}

function tarjetaReclamo(r) {
  const t = TIPOS_RECLAMO.find((x) => x.id === r.tipo);
  const idx = ESTADOS_RECLAMO.indexOf(r.estado);
  return `<div class="card reclamo">
    <div class="rec-cab">${r.foto ? `<img src="${r.foto}" alt="">` : `<span class="ico">${t.emoji}</span>`}<div><b>${t.nombre} · N.º ${r.id}</b><p class="muted">${esc(r.dir || r.loc)} · ${fecha(r.creado)}</p>${r.texto ? `<p>${esc(r.texto)}</p>` : ''}</div></div>
    <ol class="timeline">${ESTADOS_RECLAMO.map((e, i) => { const h = r.historial.find((x) => x.estado === e); return `<li class="${i <= idx ? 'hecho' : ''}"><b>${RECLAMO_TXT[e]}</b>${h ? `<span class="muted">${fecha(h.t)} ${hora(h.t)}</span>` : ''}</li>`; }).join('')}</ol>
  </div>`;
}

function vPagos() {
  const deuda = S.tasas.filter((t) => !t.pagada).reduce((a, t) => a + t.monto, 0);
  const multas = S.multas.filter((m) => !m.pagada && m.patente === S.usuario.patente);
  return `<div class="lista pagos-lista">
    <button class="fila" data-a="sub" data-v="tasas"><span class="ico">🧾</span><div><b>Tasas municipales</b><p class="muted">Partida ${S.usuario.partida}</p></div><div class="der"><b class="${deuda ? 'rojo' : 'verde'}">${deuda ? plata(deuda) : 'Al día'}</b></div></button>
    <button class="fila" data-a="sub" data-v="estacionamiento"><span class="ico">🚗</span><div><b>Estacionamiento medido</b><p class="muted">${S.estac.activo ? 'Tenés un estacionamiento activo' : 'Saldo disponible'}</p></div><div class="der"><b>${plata(S.estac.saldo)}</b></div></button>
    <button class="fila" data-a="sub" data-v="multas"><span class="ico">🚨</span><div><b>Multas de tránsito</b><p class="muted">Patente ${esc(S.usuario.patente)}</p></div><div class="der"><b class="${multas.length ? 'rojo' : 'verde'}">${multas.length ? plural(multas.length, 'multa', 'multas') : 'Sin multas'}</b></div></button>
  </div>`;
}

// ---------- subpantallas ----------
function vSub() {
  const titulos = { puntos: 'Puntos Tigre', reciclar: 'Reciclar y sumar puntos', tasas: 'Tasas municipales', multas: 'Multas de tránsito', estacionamiento: 'Estacionamiento medido', rio: 'Altura del río', colectivos: 'Colectivos', farmacias: 'Farmacias de turno', alerta: 'Botón de alerta', deportes: 'Deporte en Tigre', trabajo: 'Trabajo y formación', salud: 'Salud' };
  const cuerpo = { puntos: sPuntos, reciclar: sReciclar, tasas: sTasas, multas: sMultas, estacionamiento: sEstac, rio: sRio, colectivos: sColectivos, farmacias: sFarmacias, alerta: sAlerta, deportes: sDeportes, trabajo: sTrabajo, salud: sSalud }[S.sub];
  return `<button class="volver" data-a="cerrarSub">‹ Volver</button><h1 class="titulo">${titulos[S.sub]}</h1>${cuerpo ? cuerpo() : ''}`;
}

function sTasas() {
  const pend = S.tasas.filter((t) => !t.pagada);
  const total = pend.reduce((a, t) => a + t.monto, 0);
  return `<p class="muted sub">Partida ${S.usuario.partida} · ${esc(S.usuario.loc)}</p>
  <div class="lista">${S.tasas.map((t) => { const vencida = !t.pagada && t.vence < Date.now(); return `<div class="fila"><span class="ico">${t.pagada ? '✅' : vencida ? '⚠️' : '🧾'}</span><div><b>${t.concepto}</b><p class="muted">${t.periodo} · vence ${fecha(t.vence)}</p></div><div class="der"><b>${plata(t.monto)}</b><span class="${t.pagada ? 'verde' : vencida ? 'rojo' : 'muted'}">${t.pagada ? 'Pagada' : vencida ? 'Vencida' : 'A vencer'}</span></div></div>`; }).join('')}</div>
  ${pend.length ? `<button class="btn grande" data-a="cobrar" data-v="tasas">Pagar ${plural(pend.length, 'cuota', 'cuotas')} · ${plata(total)}</button>` : '<p class="vacio">🎉 Estás al día con tus tasas.</p>'}
  <p class="tip">💡 Pagar a tiempo suma puntos ciudadanos (próximamente).</p>`;
}

function sMultas() {
  const pat = (S.multaBusca || S.usuario.patente).toUpperCase().replace(/\s/g, '');
  const res = S.multas.filter((m) => m.patente === pat);
  return `<div class="card form"><label>Patente<input data-f="multaBusca" value="${esc(pat)}" maxlength="7"></label><button class="btn" data-a="buscarMulta">Consultar</button></div>
  <h2>Resultado para ${esc(pat)}</h2>
  <div class="lista">${res.map((m) => `<div class="fila"><span class="ico">${m.pagada ? '✅' : '🚨'}</span><div><b>${m.motivo}</b><p class="muted">${m.lugar} · ${fecha(m.fecha)} · Acta ${m.id}</p>${m.pagada ? '' : `<p class="verde chico">Pagando antes del juicio tenés 50% de descuento</p>`}</div><div class="der"><b>${plata(m.pagada ? m.monto : m.monto / 2)}</b>${m.pagada ? '<span class="verde">Pagada</span>' : `<s class="muted">${plata(m.monto)}</s>`}</div></div>`).join('') || '<p class="vacio">✅ No hay multas para esa patente.</p>'}</div>
  ${res.some((m) => !m.pagada) ? `<button class="btn grande" data-a="cobrar" data-v="multas">Pagar con descuento</button>` : ''}`;
}

function sEstac() {
  const e = S.estac;
  const z = ZONAS_ESTAC.find((x) => x.id === (e.activo ? e.activo.zona : e.zona));
  return `<div class="card saldo"><span class="muted">Saldo</span><strong>${plata(e.saldo)}</strong>
    <div class="chips">${[2000, 5000, 10000].map((m) => `<button class="chip" data-a="cobrar" data-v="saldo-${m}">+ ${plata(m)}</button>`).join('')}</div></div>
  ${e.activo ? `<div class="card estac-activo">
      <p class="muted">Estacionado en</p><b>${z.nombre}</b><p class="muted">Patente ${esc(e.activo.patente)} · desde las ${hora(e.activo.inicio)}</p>
      <div class="estac-num"><span id="estacT">00:00</span><span id="estacC">${plata(0)}</span></div>
      <button class="btn grande rojo-btn" data-a="finEstac">Terminar estacionamiento</button></div>`
    : `${cercaHtml('estacionamiento', 'Zonas de estacionamiento medido', 3)}<div class="card form">
      <label>Zona<select data-f="zona">${ZONAS_ESTAC.map((x) => `<option value="${x.id}" ${e.zona === x.id ? 'selected' : ''}>${x.nombre} · ${plata(x.tarifa)}/h</option>`).join('')}</select></label>
      <label>Patente<input data-f="patente" value="${esc(S.usuario.patente)}" maxlength="7"></label>
      <button class="btn grande" data-a="iniEstac">Empezar a estacionar</button>
      <p class="muted chico">Se cobra por minuto y se descuenta del saldo al terminar.</p></div>`}
  ${e.historial.length ? `<h2>Últimos</h2><div class="lista">${e.historial.slice(-5).reverse().map((h) => `<div class="fila"><span class="ico">🚗</span><div><b>${ZONAS_ESTAC.find((x) => x.id === h.zona).nombre}</b><p class="muted">${fecha(h.inicio)} · ${h.minutos} min</p></div><div class="der"><b>${plata(h.costo)}</b></div></div>`).join('')}</div>` : ''}`;
}

function rioAltura(t) {
  const h = t / 36e5;
  return 1.2 + 0.7 * Math.sin((2 * Math.PI * h) / 12.42) + 0.25 * Math.sin((2 * Math.PI * h) / 24.8 + 1);
}
function nivelRio(a) {
  if (a >= 2.3) return { txt: 'Alerta', clase: 'alerta' };
  if (a >= 1.9) return { txt: 'Atención', clase: 'atencion' };
  return { txt: 'Normal', clase: 'normal' };
}
function rioAhora() {
  const a = rioAltura(Date.now());
  return { altura: a, nivel: nivelRio(a), sube: rioAltura(Date.now() + 6e5) > a };
}

function sRio() {
  const r = rioAhora();
  const pts = [];
  let maxA = 0, maxT = 0;
  for (let i = 0; i <= 48; i++) {
    const t = Date.now() + i * 30 * 60000;
    const a = rioAltura(t);
    if (a > maxA) { maxA = a; maxT = t; }
    pts.push([i * (300 / 48), 120 - ((a - 0) / 3) * 120]);
  }
  const y = (a) => 120 - (a / 3) * 120;
  return `<div class="card rio-grande ${r.nivel.clase}"><p class="muted">Río Luján, puerto de Tigre</p><strong>${r.altura.toFixed(2).replace('.', ',')} m</strong><span class="pill">${r.nivel.txt} · ${r.sube ? 'subiendo ↑' : 'bajando ↓'}</span></div>
  <div class="card"><h3>Próximas 24 horas</h3>
    <svg viewBox="0 0 300 130" class="rio-svg" role="img" aria-label="Pronóstico de altura del río">
      <line x1="0" x2="300" y1="${y(2.3)}" y2="${y(2.3)}" class="lim-alerta"/><text x="2" y="${y(2.3) - 3}" class="lim-txt">Alerta 2,30 m</text>
      <line x1="0" x2="300" y1="${y(1.9)}" y2="${y(1.9)}" class="lim-aten"/><text x="2" y="${y(1.9) - 3}" class="lim-txt">Atención 1,90 m</text>
      <polyline points="${pts.map((p) => p.join(',')).join(' ')}" class="rio-linea"/>
      <circle cx="0" cy="${pts[0][1]}" r="4" class="rio-punto"/>
    </svg>
    <p class="muted">Pico estimado: <b>${maxA.toFixed(2).replace('.', ',')} m</b> a las ${hora(maxT)}.</p></div>
  <p class="tip">🔔 Si el río pasa el nivel de alerta, te avisamos con una notificación. Datos simulados para la demo.</p>`;
}

function sColectivos() {
  const p = PARADAS.find((x) => x.id === S.parada);
  const min = Math.floor(Date.now() / 60000);
  return `<label class="sel">🚏 <select data-f="parada">${PARADAS.map((x) => `<option value="${x.id}" ${x.id === S.parada ? 'selected' : ''}>${x.nombre}</option>`).join('')}</select></label>
  <div class="lista">${p.lineas.map((id) => { const l = LINEAS.find((x) => x.id === id); const off = (id.length * 7 + p.id.length * 3) % l.frecuencia; const prox = l.frecuencia - ((min + off) % l.frecuencia); return `<div class="fila"><span class="linea-num" style="background:${l.color}">${l.id}</span><div><b>Línea ${l.id}</b><p class="muted">Después: ${prox + l.frecuencia} y ${prox + 2 * l.frecuencia} min</p></div><div class="der"><b class="grande-min">${prox} min</b></div></div>`; }).join('')}</div>
  <p class="tip">🚌 Arribos simulados. En la versión real se conectan con los datos de posición de los colectivos.</p>`;
}

function sFarmacias() {
  const dia = Math.floor(Date.now() / 864e5);
  const lista = FARMACIAS.map((f, i) => ({ ...f, turno: (dia + i) % 3 === 0 })).sort((a, b) => (b.turno - a.turno) || (b.loc === S.usuario.loc) - (a.loc === S.usuario.loc));
  return `<p class="muted sub">Hoy, ${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}. En rojo, las de turno.</p>${cercaHtml('farmacias', 'Farmacias cerca tuyo', 3)}<h2>Todas</h2>
  <div class="lista">${lista.map((f) => `<div class="fila"><span class="ico">💊</span><div><b>${f.nombre}</b><p class="muted">${f.dir} · ${f.loc}</p>${f.turno ? '<span class="pill listo">De turno las 24 h</span>' : ''}</div><a class="ir" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.nombre + ' ' + f.dir + ' ' + f.loc + ' Tigre')}" target="_blank" rel="noopener">Cómo llegar</a></div>`).join('')}</div>`;
}

function sDeportes() {
  if (!S.inscrip) S.inscrip = [];
  const tab = S.depTab || 'actividades';
  const pol = (id) => POLIDEPORTIVOS.find((p) => p.id === id);
  const mias = ACTIVIDADES.filter((a) => S.inscrip.includes(a.id));
  const f = S.depDisc || 'todas';
  const discs = [...new Set(ACTIVIDADES.map((a) => a.disc))];
  const acts = ACTIVIDADES.filter((a) => f === 'todas' || a.disc === f).sort((a, b) => (pol(b.pid).loc === S.usuario.loc) - (pol(a.pid).loc === S.usuario.loc));
  const colonia = `<div class="dep-colonia"><span class="dep-colonia-ico">${COLONIA.emoji}</span><div><b>${COLONIA.titulo}</b><p>${COLONIA.texto}</p>
    ${S.inscrip.includes('colonia') ? '<span class="pill listo">Inscripción enviada ✓</span>' : '<button class="btn" data-a="inscribir" data-v="colonia">Inscribir a mi familia</button>'}</div></div>`;
  const tarjeta = (a) => { const p = pol(a.pid); const ya = S.inscrip.includes(a.id); return `<div class="dep-act">
    <span class="dep-ico">${a.emoji}</span>
    <div class="dep-txt"><b>${a.disc}</b><span>${p.nombre} · ${p.loc}</span><small>${a.dias} · ${a.edad}</small></div>
    <div class="dep-der">${ya ? `<span class="pill listo">Inscripta</span><button class="link" data-a="desinscribir" data-v="${a.id}">Cancelar</button>` : `<button class="mini-btn" data-a="inscribir" data-v="${a.id}">Anotarme</button><small class="${a.cupos <= 4 ? 'rojo' : 'muted'}">${a.cupos} cupos</small>`}</div></div>`; };
  return `<div class="foto-banner" style="background-image:url(${FOTO('natacion')})"><span>18 polideportivos · actividades gratis</span></div><p class="muted sub">Tigre tiene <b>18 polideportivos municipales</b>. Las actividades son gratuitas para vecinos con domicilio en el distrito. Anotarte suma 30 Puntos Tigre.</p>
  <div class="seg">${[['actividades', 'Actividades'], ['polis', 'Polideportivos']].map(([id, t2]) => `<button class="${tab === id ? 'on' : ''}" data-a="depTab" data-v="${id}">${t2}</button>`).join('')}</div>
  ${tab === 'actividades' ? `
    ${colonia}
    ${mias.length ? `<h2>Mis actividades</h2><div class="dep-lista">${mias.map(tarjeta).join('')}</div>` : ''}
    <h2>Escuelas deportivas</h2>
    <div class="chips">${['todas', ...discs].map((d) => `<button class="chip ${f === d ? 'on' : ''}" data-a="depDisc" data-v="${d}">${d === 'todas' ? 'Todas' : d}</button>`).join('')}</div>
    <div class="dep-lista">${acts.filter((a) => !S.inscrip.includes(a.id)).map(tarjeta).join('') || '<p class="muted">Ya estás anotada en todas las de esta disciplina.</p>'}</div>`
  : `${cercaHtml('deportes', 'Polideportivos cerca tuyo')}<h2>Qué hay en cada uno</h2><div class="dep-lista">${POLIDEPORTIVOS.map((p) => `<div class="dep-act">
      <span class="dep-ico">${p.emoji}</span>
      <div class="dep-txt"><b>${p.nombre}</b><span>${p.loc} · ${p.nota}</span><div class="dep-tags">${p.disc.map((d) => `<em>${d}</em>`).join('')}</div></div></div>`).join('')}</div>
    <p class="muted chico">Se muestran 7 de los 18 polideportivos. Horarios y cupos de demostración.</p>`}`;
}

const POST_ESTADOS = ['CV enviado', 'La empresa lo vio', 'Te llaman a entrevista'];
function sTrabajo() {
  if (!S.empleo) S.empleo = { cv: false, post: {}, cursos: {} };
  const E = S.empleo;
  const tab = S.trabTab || 'empleos';
  const seg = `<div class="seg">${[['empleos', 'Empleos'], ['cursos', 'Cursos'], ['cv', 'Mi CV']].map(([id, x]) => `<button class="${tab === id ? 'on' : ''}" data-a="trabTab" data-v="${id}">${x}</button>`).join('')}</div>`;
  if (tab === 'cv') {
    return `<p class="muted sub">Tu CV queda guardado para postularte con un toque. Lo ven solo las empresas a las que te postulás.</p>${seg}
    <div class="cv-card">
      <div class="cv-cab"><span class="avatar-p" style="background:#D02013">${S.usuario.nombre[0]}</span><div><b>${esc(S.usuario.nombre)}</b><span>${esc(S.usuario.loc)} · DNI validado con tu credencial</span></div></div>
      <div class="cv-sec"><small>Experiencia</small><p>Atención al público · Kiosco del Puerto (3 años)</p><p>Cajera · Supermercado de la zona (1 año)</p></div>
      <div class="cv-sec"><small>Educación</small><p>Secundario completo</p>${Object.keys(E.cursos).length ? `<p>En curso: ${Object.keys(E.cursos).map((k) => CURSOS.find((c) => c.id === k).nombre).join(', ')} (TIF)</p>` : ''}</div>
      <div class="cv-sec"><small>Disponibilidad</small><p>Medio tiempo o tiempo completo · Zona Tigre y alrededores</p></div>
      ${E.cv ? '<span class="pill listo">CV listo para postularte ✓</span>' : '<button class="btn grande" data-a="cvListo">Confirmar mi CV</button>'}
    </div>
    <div class="pe-card"><b>🤝 ${PUNTO_EMPLEO.titulo}</b><p>${PUNTO_EMPLEO.texto}</p></div>`;
  }
  if (tab === 'cursos') {
    const f = S.cursoArea || 'todas';
    const areas = [...new Set(CURSOS.map((c) => c.area))];
    return `<div class="foto-banner" style="background-image:url(${FOTO('curso')})"><span>Tigre Instituto Formativo</span></div><p class="muted sub">Más de 870 cursos gratuitos del <b>Tigre Instituto Formativo</b>. Requisitos: vivir en Tigre, ser mayor de 18 y tener DNI. Se ingresa con una entrevista de admisión.</p>${seg}
    <div class="chips">${['todas', ...areas].map((a) => `<button class="chip ${f === a ? 'on' : ''}" data-a="cursoArea" data-v="${a}">${a === 'todas' ? 'Todos' : a}</button>`).join('')}</div>
    <div class="dep-lista">${CURSOS.filter((c) => f === 'todas' || c.area === f).map((c) => { const ya = E.cursos[c.id]; return `<div class="dep-act">
      <span class="dep-ico">${c.emoji}</span>
      <div class="dep-txt"><b>${c.nombre}</b><span>${c.sede} · ${c.modo}</span><small>${c.dur} · empieza en ${c.inicio}</small>${ya ? `<small class="verde"><b>Entrevista: ${ya}</b></small>` : ''}</div>
      <div class="dep-der">${ya ? '<span class="pill listo">Turno pedido</span>' : `<button class="mini-btn" data-a="cursoTurno" data-v="${c.id}">Inscribirme</button><small class="${c.cupos <= 5 ? 'rojo' : 'muted'}">${c.cupos} cupos</small>`}</div></div>`; }).join('')}</div>`;
  }
  const f = S.empRubro || 'todos';
  const rubros = [...new Set(EMPLEOS.map((e) => e.rubro))];
  const mias = EMPLEOS.filter((e) => E.post[e.id] !== undefined);
  const tarjeta = (e) => { const est = E.post[e.id]; return `<div class="emp">
    <div class="emp-cab"><span class="dep-ico">${e.emoji}</span><div class="dep-txt"><b>${e.puesto}</b><span>${e.empresa} · ${e.loc}</span></div><small class="muted">hace ${plural(e.dias, 'día', 'días')}</small></div>
    <div class="dep-tags"><em>${e.jornada}</em>${e.req.map((r) => `<em>${r}</em>`).join('')}</div>
    ${est !== undefined ? `<div class="emp-estado">${POST_ESTADOS.map((x, i) => `<span class="${i <= est ? 'on' : ''}">${x}</span>`).join('')}</div>` : `<button class="btn" data-a="postular" data-v="${e.id}">Postularme</button>`}
  </div>`; };
  return `<p class="muted sub">Búsquedas de comercios y empresas de Tigre, actualizadas cada semana. Postulate con tu CV guardado.</p>${seg}
  ${!E.cv ? '<button class="aviso-cv" data-a="trabTab" data-v="cv">📝 <span><b>Completá tu CV</b> para postularte con un toque</span> ›</button>' : ''}
  ${mias.length ? `<h2>Mis postulaciones</h2>${mias.map(tarjeta).join('')}` : ''}
  <h2>Búsquedas abiertas</h2>
  <div class="chips">${['todos', ...rubros].map((r) => `<button class="chip ${f === r ? 'on' : ''}" data-a="empRubro" data-v="${r}">${r === 'todos' ? 'Todas' : r}</button>`).join('')}</div>
  ${EMPLEOS.filter((e) => E.post[e.id] === undefined && (f === 'todos' || e.rubro === f)).map(tarjeta).join('') || '<p class="muted">Ya te postulaste a todas las de este rubro.</p>'}`;
}

const ESP_ICO = { 'Clínica médica': '🩺', 'Pediatría': '👶', 'Ginecología': '🤰', 'Obstetricia': '🤰', 'Neonatología': '👶', 'Cardiología': '❤️', 'Oftalmología': '👁️', 'Odontología': '🦷', 'Vacunación': '💉', 'Salud mental': '🧠', 'Traumatología': '🦴', 'Laboratorio': '🧪', 'Diagnóstico por imágenes': '🩻' };
function sSalud() {
  if (!S.salud) S.salud = { esp: null, centro: null, dia: 0, hora: null, mios: [] };
  const H = S.salud;
  const tab = S.saludTab || 'turno';
  const seg = `<div class="seg">${[['turno', 'Sacar turno'], ['mios', `Mis turnos${H.mios.length ? ` (${H.mios.length})` : ''}`], ['centros', 'Centros']].map(([id, x]) => `<button class="${tab === id ? 'on' : ''}" data-a="saludTab" data-v="${id}">${x}</button>`).join('')}</div>`;
  const urg = `<div class="sal-urg"><div><b>¿Es una urgencia?</b><span>Guardia 24 h en los 3 HDI y en el Materno Infantil.</span></div><a class="sal-tel" href="tel:${SALUD_INFO.emergencias}">📞 ${SALUD_INFO.emergencias}</a></div>`;
  if (tab === 'centros') {
    return `${urg}${seg}${cercaHtml('salud', 'Centros cerca tuyo')}<h2>Toda la red</h2><div class="dep-lista">${CENTROS_SALUD.map((c) => `<div class="dep-act"><span class="dep-ico">🏥</span><div class="dep-txt"><b>${c.nombre}</b><span>${c.tipo} · ${c.loc}</span><div class="dep-tags">${c.guardia ? '<em class="guardia">Guardia 24 h</em>' : ''}${c.esp.map((e) => `<em>${e}</em>`).join('')}</div></div></div>`).join('')}</div>
    <p class="muted chico">Red municipal: 3 Hospitales de Diagnóstico Inmediato, Materno Infantil, hospitales especializados y 23 CAFyS. Turnos también por teléfono al ${SALUD_INFO.turnosTel}.</p>`;
  }
  if (tab === 'mios') {
    return `${urg}${seg}${H.mios.length ? `<div class="dep-lista">${H.mios.map((m, i) => `<div class="dep-act"><span class="dep-ico">${ESP_ICO[m.esp] || '🩺'}</span><div class="dep-txt"><b>${m.esp}</b><span>${m.centro}</span><small><b>${m.cuando}</b> · llevá tu DNI</small></div><div class="dep-der"><span class="pill listo">Confirmado</span><button class="link" data-a="saludCancelar" data-v="${i}">Cancelar</button></div></div>`).join('')}</div>` : '<p class="vacio">No tenés turnos de salud. Sacá uno en un minuto.</p>'}`;
  }
  const esps = ['Clínica médica', 'Pediatría', 'Ginecología', 'Cardiología', 'Oftalmología', 'Odontología', 'Vacunación', 'Salud mental', 'Laboratorio'];
  const centros = H.esp ? CENTROS_SALUD.filter((c) => c.esp.includes(H.esp)) : [];
  const dias = Array.from({ length: 5 }, (_, i) => { const d = new Date(Date.now() + (i + 1) * 864e5); return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }); });
  const horas = ['8:00', '8:40', '9:20', '10:30', '11:10', '14:00'];
  return `${urg}${seg}
  <h2>1. ¿Qué especialidad?</h2>
  <div class="sal-esp">${esps.map((e) => `<button class="${H.esp === e ? 'on' : ''}" data-a="saludEsp" data-v="${e}"><span>${ESP_ICO[e]}</span>${e}</button>`).join('')}</div>
  ${H.esp ? `<h2>2. ¿Dónde?</h2><div class="chips">${centros.map((c) => `<button class="chip ${H.centro === c.id ? 'on' : ''}" data-a="saludCentro" data-v="${c.id}">${c.nombre.replace('Hospital Materno Infantil Dr. Florencio Escardó', 'Materno Infantil Escardó')} · ${c.loc}</button>`).join('')}</div>` : ''}
  ${H.centro ? `<h2>3. ¿Cuándo?</h2><div class="chips">${dias.map((d, i) => `<button class="chip ${H.dia === i ? 'on' : ''}" data-a="saludDia" data-v="${i}">${d}</button>`).join('')}</div>
    <div class="chips">${horas.map((h) => `<button class="chip ${H.hora === h ? 'on' : ''}" data-a="saludHora" data-v="${h}">${h}</button>`).join('')}</div>
    <button class="btn grande" data-a="saludConfirmar" ${H.hora ? '' : 'disabled'}>Confirmar turno</button>` : ''}
  <p class="muted chico">También podés pedir turno por teléfono al <b>${SALUD_INFO.turnosTel}</b>. La atención en la red municipal es gratuita.</p>`;
}

function sAlerta() {
  if (S.alerta) {
    const a = S.alerta;
    return `<div class="card alerta-ok"><span class="grande-emoji">✅</span><h2>Alerta enviada</h2>
      <p>${a.tipo} · ${hora(a.t)}</p><p class="muted">El Centro de Operaciones recibió tu ubicación. Un móvil fue asignado y llega en unos ${a.demora} minutos.</p>
      <button class="link" data-a="cancelarAlerta">Fue un error, cancelar la alerta</button></div>
      ${telefonos()}`;
  }
  const tipos = [['🚔', 'Seguridad o robo'], ['🚑', 'Emergencia médica'], ['🔥', 'Incendio'], ['💜', 'Violencia de género']];
  return `<p class="aviso">Demostración: esta alerta no se envía a ningún lado. En una emergencia real llamá al 911.</p>
  <p class="muted sub">Tocá el tipo de emergencia. Se envía tu ubicación al Centro de Operaciones del municipio.</p>
  <div class="alertas">${tipos.map(([e, t]) => `<button data-a="enviarAlerta" data-v="${t}"><span>${e}</span>${t}</button>`).join('')}</div>
  ${telefonos()}`;
}
function telefonos() {
  return `<h2>Llamar</h2><div class="tels"><a href="tel:911">🚓 911<span>Policía</span></a><a href="tel:107">🚑 107<span>Emergencias médicas</span></a><a href="tel:100">🚒 100<span>Bomberos</span></a><a href="tel:144">💜 144<span>Violencia de género</span></a></div>`;
}

// ---------- hojas ----------
function sheet() {
  if (!S.sheet) return '';
  let html = '';
  const s = S.sheet;
  if (s === 'checkout' && S.carrito) {
    const t = totalesCarrito();
    html = `<h2>Tu pedido en ${esc(t.c.nombre)}</h2>
      ${t.items.map((it) => `<div class="linea-item"><span>${it.emoji}</span><span class="grow">${esc(it.nombre)}</span>
        <div class="qty"><button data-a="menos" data-v="${it.pid}">−</button><b>${it.qty}</b><button data-a="mas" data-v="${it.pid}">+</button></div>
        <b>${plata(it.precio * it.qty)}</b></div>`).join('')}
      <div class="totales">
        <p class="linea"><span>Subtotal</span><span>${plata(t.subtotal)}</span></p>
        <p class="linea verde"><span>🐯 Beneficio ${MARCA.tarjeta} (-${t.c.desc}%)</span><span>-${plata(t.descuento)}</span></p>
        ${t.hayCupon ? `<button class="linea cupon-fila" data-a="toggleCupon"><span>🎟️ Usar mi cupón Puntos Tigre</span><span>${t.cupon ? '-' + plata(t.cupon) : 'No usar'} ${t.cupon ? '✔' : '○'}</span></button>` : ''}
        <p class="linea total"><span>Total</span><span>${plata(t.total)}</span></p>
        <p class="compara">Ahorrás <b>${plata(t.descuento + t.cupon)}</b> y sumás <b>⭐ ${Math.floor(t.total / PUNTOS.porCompra)} Puntos Tigre</b>. Como ${esc(t.c.nombre)} no paga comisión por vender acá, el precio no viene inflado.</p>
      </div>
      <p class="muted">${t.c.servicio ? '¿Cuándo es tu turno?' : '¿Cuándo lo retirás?'}</p>
      <div class="chips">${horarios(t.c).map((h) => `<button class="chip ${S.retiro === h.i ? 'on' : ''}" data-a="retiro" data-v="${h.i}">${h.txt}</button>`).join('')}</div>
      <p class="muted">¿Cómo pagás?</p>
      <div class="pagos">${PAGOS.map((p) => `<button class="${S.pago === p.id ? 'on' : ''}" data-a="pago" data-v="${p.id}">${p.emoji} ${p.nombre}</button>`).join('')}</div>
      <button class="btn grande" data-a="pagar">${t.c.servicio ? (S.pago === 'efectivo' ? 'Reservar turno' : 'Reservar y pagar') : S.pago === 'efectivo' ? 'Confirmar pedido' : 'Pagar'} ${plata(t.total)}</button>`;
  } else if (s === 'cobro' && S.cobro) {
    const c = S.cobro;
    if (S.pago === 'efectivo') S.pago = 'mp';
    html = `<h2>${c.concepto}</h2>${c.detalle.map((d) => `<p class="linea"><span>${d[0]}</span><span>${d[1]}</span></p>`).join('')}
      <p class="linea total"><span>Total</span><span>${plata(c.monto)}</span></p>
      <p class="muted">¿Cómo pagás?</p>
      <div class="pagos">${PAGOS.filter((p) => p.id !== 'efectivo').map((p) => `<button class="${S.pago === p.id ? 'on' : ''}" data-a="pago" data-v="${p.id}">${p.emoji} ${p.nombre}</button>`).join('')}</div>
      <button class="btn grande" data-a="confirmarCobro">Pagar ${plata(c.monto)}</button>`;
  } else if (s === 'comprobante' && S.comprobante) {
    const c = S.comprobante;
    html = `<div class="comprobante"><span class="grande-emoji">✅</span><h2>Pago aprobado</h2><p class="grande-num">${plata(c.monto)}</p>
      <p class="muted">${c.concepto}</p><p class="muted">Operación N.º ${c.nro} · ${PAGOS.find((p) => p.id === c.pago).nombre} · ${fecha(c.t)} ${hora(c.t)}</p>
      <button class="btn" data-a="cerrarSheet">Listo</button></div>`;
  } else if (s === 'pagando') {
    html = `<div class="pagando"><div class="spinner"></div><p>${S.pagandoTxt || 'Procesando el pago…'}</p></div>`;
  } else if (s === 'notifs') {
    const ns = S.notifs.slice().reverse();
    html = `<h2>Notificaciones</h2>${ns.length ? `<div class="lista">${ns.map((n) => `<div class="fila"><span class="ico">${n.emoji}</span><div><b>${esc(n.txt)}</b><p class="muted">${fecha(n.t)} ${hora(n.t)}</p></div></div>`).join('')}</div>` : '<p class="muted">No tenés notificaciones.</p>'}`;
  } else if (s === 'benef' && S.benefSel != null) {
    const b = BENEFICIOS[S.benefSel];
    html = `<div class="benef-det">${b.foto ? `<div class="benef-det-foto" style="background-image:url(${FOTO(b.foto)})"></div>` : `<span class="grande-emoji">${b.emoji}</span>`}<h2>${esc(b.nombre)}</h2><p class="muted">${rubro(b.rubro).nombre} · ${esc(b.dir || '')} · ${b.loc}</p>
      <p class="benef-grande">${esc(b.texto)}</p>${b.dias ? `<p class="benef-dias">📅 ${b.dias}</p>` : ''}${b.pago ? `<p class="muted">💳 ${esc(b.pago)}</p>` : ''}
      <a class="ir" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.nombre + ' ' + (b.dir || '') + ' Tigre')}" target="_blank" rel="noopener">Cómo llegar</a>
      ${b.fuente ? `<p class="muted chico">Fuente: ${esc(b.fuente)}</p>` : ''}
      <p class="muted">Mostrá tu credencial ${MARCA.tarjeta} en la caja antes de pagar.</p>
      <button class="btn grande" data-a="tab" data-v="credencial">🪪 Mostrar mi credencial</button></div>`;
  } else if (s === 'dni') {
    html = `<h2>Ingresar con DNI</h2><p class="muted">Validamos tu identidad con los datos de tu DNI.</p>
      <div class="form"><label>Número de DNI<input id="inDni" inputmode="numeric" placeholder="30456789" value="30456789"></label>
      <label>Número de trámite (está en el frente del DNI)<input id="inTramite" inputmode="numeric" placeholder="00123456789" value="00123456789"></label>
      <label>Sexo<select id="inSexo"><option>F</option><option>M</option><option>X</option></select></label>
      <button class="btn grande" data-a="ingresar" data-v="dni">Validar e ingresar</button></div>`;
  } else if (s === 'rp' && S.rpForm) {
    const f = S.rpForm, p = S.pedidos.find((x) => x.id === f.pid), c = comercio(p.cid);
    html = `<h2>¿Qué pasó con tu pedido?</h2><p class="muted">${esc(c.nombre)} · pedido #${p.id} · ${plata(p.total)}</p>
      <div class="chips rp-motivos">${MOTIVOS_RP.map(([id, t]) => `<button class="chip ${f.motivo === id ? 'on' : ''}" data-a="rpMotivo" data-v="${id}">${t}</button>`).join('')}</div>
      <div class="form"><label>Contanos qué pasó<textarea data-f="rpTxt" rows="3" placeholder="Por ejemplo: faltó una porción de tiramisú">${esc(f.texto)}</textarea></label>
      <label class="foto-btn">${f.foto ? `<img src="${f.foto}" alt="Foto">` : '<span>📷 Agregar una foto (opcional)</span>'}<input type="file" accept="image/*" capture="environment" data-f="rpFoto"></label></div>
      <p class="tip">El comercio tiene 24 horas para proponerte una solución: devolverte la plata o reponer el producto. Si no responde o no te convence, interviene la oficina de defensa del consumidor del municipio.</p>
      <button class="btn grande" data-a="rpEnviar">Enviar reclamo</button>`;
  } else if (s === 'onboarding') {
    const pasos = [
      ['🪪', 'Tu credencial Soy Tigre, en el celu', 'Mostrá el QR en la caja de cualquier comercio adherido. Cambia cada 30 segundos para que nadie la copie.'],
      ['🛍️', 'Comprá en el barrio, sin comisión', 'Pedí para retirar: el descuento se aplica solo y el comercio cobra el 100% de la venta.'],
      ['⭐', 'Sumá Puntos Tigre', 'Comprando en el barrio, pagando a tiempo o reciclando. Los canjeás por descuentos y saldo.'],
    ];
    const i = S.onbPaso || 0, pa = pasos[i];
    html = `<div class="onb"><span class="onb-ico">${pa[0]}</span><h2>${pa[1]}</h2><p class="muted">${pa[2]}</p>
      <div class="onb-puntos">${pasos.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <button class="btn grande" data-a="onbSig">${i < pasos.length - 1 ? 'Siguiente' : 'Empezar'}</button>
      ${i < pasos.length - 1 ? '<button class="link" data-a="onbFin">Saltear</button>' : ''}</div>`;
  } else if (s === 'perfil') {
    const perf = perfilActual();
    html = `<div class="perfil-hoja">${avatarHtml(perf, 'grande')}<h2>${perf.nombre}</h2><p class="muted">${perf.rol}</p><p>${perf.hace}</p><p class="muted chico">🔐 ${perf.entra}</p>
      <button class="btn grande" data-a="cambiarPerfil">🔄 Cambiar de perfil</button>
      <button class="btn grande claro" data-a="tourIniciar">▶ Ver el recorrido guiado</button></div>`;
  } else if (s === 'tigri') {
    if (!S.chat.length) S.chat.push({ de: 'tg', html: saludo(), acciones: [] });
    return `<div class="velo" data-a="cerrarSheet"></div><div class="sheet chat" role="dialog" aria-label="Chat con Tigri">
      <div class="chat-cab"><span class="tg-avatar">${tigriSvg()}</span><div><b>Tigri</b><span class="muted">Cachorro de tigre y asistente de ${MARCA.app}</span></div><button class="cerrar" data-a="cerrarSheet" aria-label="Cerrar">✕</button></div>
      <div class="chat-msgs" id="chatMsgs">${S.chat.map(burbuja).join('')}</div>
      <div class="chat-sug">${['Farmacia de turno', '¿Cómo está el río?', 'Quiero pizza', 'Hay un bache', '¿Cuántos puntos tengo?', '¿Cuánto ahorré?', 'Quiero reciclar', 'Pagar tasas'].map((x) => `<button class="chip" data-a="chatSug" data-v="${x}">${x}</button>`).join('')}</div>
      <form class="chat-in" data-form="chat"><input id="chatIn" placeholder="Escribile a Tigri…" autocomplete="off"><button class="btn" type="submit" aria-label="Enviar">➤</button></form>
    </div>`;
  }
  return `<div class="velo" data-a="cerrarSheet"></div><div class="sheet" role="dialog"><button class="cerrar" data-a="cerrarSheet" aria-label="Cerrar">✕</button>${html}</div>`;
}

// ---------- Tigri ----------
function burbuja(m) {
  if (m.de === 'yo') return `<div class="msg yo">${esc(m.txt)}</div>`;
  return `<div class="msg-fila"><span class="tg-mini">${tigriSvg()}</span><div class="msg tg">${m.html}${m.acciones && m.acciones.length ? `<div class="msg-acc">${m.acciones.map((a) => `<button class="chip" data-a="${a.a}" data-v="${a.v}">${a.t}</button>`).join('')}</div>` : ''}</div></div>`;
}

const tiene = (q, ...pal) => pal.some((p) => q.includes(p));

function tigriResponde(texto) {
  const q = norm(texto);
  const nombre = S.usuario.nombre.split(' ')[0];
  const R = (html, acciones = []) => ({ html, acciones });

  if (tiene(q, 'emergencia', 'robo', 'me robaron', 'ayuda urgente', 'auxilio', 'incendio', 'violencia', 'panico')) {
    return R(`Si es una emergencia, <b>llamá ya al 911</b> (o al 107 si es médica, 144 por violencia de género). También podés usar el botón de alerta: le manda tu ubicación al Centro de Operaciones.`, [{ t: '🆘 Botón de alerta', a: 'sub', v: 'alerta' }]);
  }
  if (tiene(q, 'problema con', 'falto', 'llego mal', 'vino mal', 'me cobraron', 'devolucion', 'reembolso', 'reclamar un pedido', 'reclamo del pedido')) {
    return R('Si tuviste un problema con una compra, reportalo desde <b>Mis pedidos</b> con "Tuve un problema con este pedido". El comercio tiene <b>24 horas</b> para proponerte una solución (devolverte la plata o reponer el producto). Si no responde o no te convence, media la oficina de defensa del consumidor del municipio.', [{ t: 'Ir a mis pedidos', a: 'verPedidos', v: '' }]);
  }
  if (tiene(q, 'recicl', 'punto verde', 'ecopunto')) {
    return R(`¡Bien ahí! Cada vez que dejás tus residuos separados en un punto verde y escaneás su QR, sumás <b>⭐ ${PUNTOS.reciclar} puntos</b>. Hay en ${PUNTOS_VERDES.length} lugares del distrito ♻️`, [{ t: '♻️ Reciclar y sumar', a: 'sub', v: 'reciclar' }]);
  }
  if (tiene(q, 'punto', 'canje', 'canjear', 'premio', 'nivel')) {
    const { n, sig, falta } = nivelActual(S.puntos.acumulado);
    const alcanza = CANJES.filter((c) => S.puntos.saldo >= c.costo);
    return R(`Tenés <b>⭐ ${S.puntos.saldo.toLocaleString('es-AR')} Puntos Tigre</b> y sos nivel <b>${n.emoji} ${n.nombre}</b>${sig ? ` (te faltan ${falta} para ${sig.nombre})` : ''}. ${alcanza.length ? `Ya te alcanza para: ${alcanza.map((c) => `<br>• ${c.emoji} ${c.txt}`).join('')}` : 'Seguí sumando comprando en el barrio, pagando a tiempo o reciclando.'}`, [{ t: '⭐ Canjear puntos', a: 'sub', v: 'puntos' }]);
  }
  if (tiene(q, 'farmacia', 'remedio', 'medicamento')) {
    const dia = Math.floor(Date.now() / 864e5);
    const turno = FARMACIAS.filter((f, i) => (dia + i) % 3 === 0);
    const mia = turno.find((f) => f.loc === S.usuario.loc) || turno[0];
    return R(`Hoy está de turno <b>${mia.nombre}</b>, en ${mia.dir} (${mia.loc}). ${turno.length > 1 ? `También: ${turno.filter((f) => f !== mia).map((f) => f.nombre).join(', ')}.` : ''} Y ojo, con tu ${MARCA.tarjeta} tenés descuento en farmacias adheridas 💊`, [{ t: 'Ver todas', a: 'sub', v: 'farmacias' }, { t: 'Descuentos en farmacias', a: 'benefRubro', v: 'farmacia' }]);
  }
  if (tiene(q, 'rio', 'marea', 'crecida', 'sudestada', 'inunda', 'agua sube')) {
    const r = rioAhora();
    return R(`El Río Luján está en <b>${r.altura.toFixed(2).replace('.', ',')} m</b> y ${r.sube ? 'subiendo' : 'bajando'}. Nivel: <b>${r.nivel.txt.toLowerCase()}</b>. ${r.nivel.clase === 'normal' ? 'Tranqui por ahora 🌊' : 'Atenti si estás en zona baja o en las islas.'}`, [{ t: 'Ver pronóstico', a: 'sub', v: 'rio' }]);
  }
  if (tiene(q, 'colectivo', 'bondi', 'linea ', 'parada')) {
    return R('Te muestro cuánto falta para los colectivos en tu parada 🚌', [{ t: 'Ver colectivos', a: 'sub', v: 'colectivos' }]);
  }
  if (tiene(q, 'pedido', 'mi compra', 'ya esta', 'esta listo')) {
    const act = S.pedidos.filter((p) => p.mio && ['recibido', 'preparacion', 'listo'].includes(p.estado)).sort((a, b) => b.creado - a.creado)[0];
    if (act) return R(`Tu pedido de <b>${esc(comercio(act.cid).nombre)}</b> está <b>${ESTADO_TXT[act.estado].toLowerCase()}</b>. Lo retirás ${act.retiro}, con el código <b>${act.codigo}</b>.`, [{ t: 'Ver mi pedido', a: 'verPedidos', v: '' }]);
    return R('No tenés pedidos en curso. ¿Querés pedir algo para retirar?', [{ t: '🥡 Ver locales', a: 'cat', v: 'gastro' }]);
  }
  if (tiene(q, 'ahorr', 'cuanto gaste', 'descuento me')) {
    const mes = misDelMes();
    return R(`Este mes ahorraste <b>${plata(mes.reduce((a, p) => a + p.descuento, 0))}</b> en ${plural(mes.length, 'compra', 'compras')} con tu ${MARCA.tarjeta}. ¡Bien ahí, ${esc(nombre)}! 🐯`, [{ t: 'Ver mi historial', a: 'tab', v: 'credencial' }]);
  }
  const tipoRec = tiene(q, 'luz', 'alumbrado', 'lampara', 'poste', 'oscuro') ? 'alumbrado' : tiene(q, 'bache', 'pozo', 'calle rota', 'asfalto') ? 'bacheo' : tiene(q, 'poda', 'arbol', 'rama') ? 'poda' : tiene(q, 'basura', 'residuo', 'contenedor', 'recoleccion') ? 'residuos' : null;
  if (tipoRec || tiene(q, 'reclamo', 'queja', 'denuncia')) {
    const t = TIPOS_RECLAMO.find((x) => x.id === tipoRec);
    return R(`${t ? `Uh, cargamos un reclamo de <b>${t.nombre.toLowerCase()}</b>.` : 'Dale, hagamos el reclamo.'} Marcá el lugar en el mapa y, si podés, sumá una foto: así la cuadrilla lo resuelve más rápido 📸`, [{ t: '📣 Cargar reclamo', a: 'irReclamo', v: tipoRec || 'alumbrado' }]);
  }
  if (tiene(q, 'turno', 'licencia', 'registro', 'zoonosis', 'castra', 'vacuna', 'medico')) {
    const tr = tiene(q, 'licencia', 'registro') ? 'licencia' : tiene(q, 'zoonosis', 'castra', 'vacuna') ? 'zoonosis' : tiene(q, 'medico') ? 'medico' : 'licencia';
    return R(`Te dejo listo el turno para <b>${TRAMITES.find((x) => x.id === tr).nombre.toLowerCase()}</b>. Elegí día y horario 📅`, [{ t: 'Pedir turno', a: 'irTurno', v: tr }]);
  }
  if (tiene(q, 'tasa', 'abl', 'impuesto', 'deuda')) {
    const d = S.tasas.filter((t) => !t.pagada).reduce((a, t) => a + t.monto, 0);
    return R(d ? `Tenés <b>${plata(d)}</b> pendientes de tasas municipales. Lo pagás en dos toques con Mercado Pago o Cuenta DNI.` : 'Estás al día con tus tasas 🎉', [{ t: 'Ver tasas', a: 'sub', v: 'tasas' }]);
  }
  if (tiene(q, 'multa', 'infraccion', 'fotomulta')) return R(`Consulto la patente <b>${esc(S.usuario.patente)}</b>. Si pagás antes del juicio tenés 50% de descuento.`, [{ t: 'Ver multas', a: 'sub', v: 'multas' }]);
  if (tiene(q, 'estacion', 'estacionar', 'parquimetro')) return R(`Tenés ${plata(S.estac.saldo)} de saldo para estacionamiento medido. ${S.estac.activo ? 'Ahora tenés uno activo.' : '¿Arrancamos?'}`, [{ t: '🚗 Estacionamiento', a: 'sub', v: 'estacionamiento' }]);
  if (tiene(q, 'evento', 'agenda', 'finde', 'fin de semana', 'que hacer', 'feria', 'paseo')) {
    return R(`Para estos días: ${AGENDA.slice(0, 3).map((a) => `<br>• <b>${a.dia}</b> ${a.emoji} ${a.titulo}`).join('')}`, [{ t: 'Ver agenda', a: 'serv', v: 'agenda' }]);
  }
  // Comida y productos: busco en los comercios.
  const palabras = q.split(/[^a-z0-9ñ]+/).filter((w) => w.length > 3 && !['quiero', 'tengo', 'ganas', 'comer', 'pedir', 'algo', 'donde', 'busco', 'necesito', 'comprar'].includes(w));
  const hits = S.comercios.filter((c) => c.abierto && palabras.some((w) => norm(c.nombre + ' ' + c.productos.map((p) => p.nombre).join(' ') + ' ' + rubro(c.cat).nombre).includes(w.slice(0, Math.max(4, w.length - 2)))));
  if (hits.length) return R(`Mirá, encontré esto con descuento ${MARCA.tarjeta}: ${hits.slice(0, 3).map((c) => `<br>• <b>${esc(c.nombre)}</b> (${c.loc}), -${c.desc}%`).join('')}`, hits.slice(0, 3).map((c) => ({ t: `${c.emoji} ${c.nombre}`, a: 'abrir', v: c.id })));
  if (tiene(q, 'hambre', 'comer', 'comida', 'cenar', 'almorzar')) return R('¿Se te antoja algo? Hay pastas, parrilla, sushi, pizza y más, todo para retirar con descuento 🍝', [{ t: '🥡 Ver locales', a: 'cat', v: 'gastro' }]);
  const benHits = BENEFICIOS.map((b, i) => ({ ...b, i })).filter((b) => palabras.some((w) => norm(b.nombre + ' ' + rubro(b.rubro).nombre).includes(w)));
  if (benHits.length) return R(`Con tu credencial tenés: ${benHits.slice(0, 3).map((b) => `<br>• <b>${esc(b.nombre)}</b>: ${esc(b.texto)}`).join('')}`, benHits.slice(0, 3).map((b) => ({ t: `${b.emoji} ${b.nombre}`, a: 'verBenef', v: String(b.i) })));
  if (tiene(q, 'beneficio', 'descuento', 'promo')) return R('Tenés descuentos en supermercados, farmacias, gastronomía, turismo y más 🎁', [{ t: 'Ver beneficios', a: 'tab', v: 'beneficios' }, { t: 'En el mapa', a: 'benefMapa', v: '' }]);
  if (tiene(q, 'hola', 'buenas', 'buen dia', 'que tal', 'ayuda', 'que podes', 'que haces')) return R(saludo(), []);
  if (tiene(q, 'salud', 'medico', 'hospital', 'guardia', 'pediatra', 'dentista', 'odontolog', 'turno medico', 'vacuna')) return R(`Podés sacar turno en los hospitales municipales y en los <b>23 CAFyS</b>. Si es una urgencia, hay <b>guardia 24 h</b> en los 3 HDI y en el Materno Infantil.`, [{ t: 'Sacar turno de salud', a: 'sub', v: 'salud' }]);
  if (tiene(q, 'trabajo', 'empleo', 'laburo', 'curso', 'capacit', 'cv', 'oficio')) return R(`Hay <b>${EMPLEOS.length} búsquedas abiertas</b> en comercios y empresas de Tigre, y cursos gratis del Tigre Instituto Formativo. Con tu CV guardado te postulás con un toque.`, [{ t: 'Ver empleos y cursos', a: 'sub', v: 'trabajo' }]);
  if (tiene(q, 'deporte', 'polideportivo', 'natacion', 'pileta', 'futbol', 'colonia', 'remo', 'atletismo', 'voley', 'basquet')) return R('Tigre tiene <b>18 polideportivos</b> con escuelas deportivas gratis: natación, fútbol, vóley, básquet, atletismo, remo y más. Y ya abrió la inscripción a la <b>colonia de verano 2027</b>. ¿Te muestro?', [{ t: 'Ver actividades', a: 'sub', v: 'deportes' }]);
  if (tiene(q, 'gracias', 'genial', 'buenisimo', 'joya')) return R(`¡De nada, ${esc(nombre)}! Acá estoy cuando me necesites 🐯`);
  return R(`Mmm, eso todavía no lo sé 🙈. Puedo ayudarte con <b>beneficios</b>, <b>Puntos Tigre</b>, <b>pedidos</b>, <b>turnos</b>, <b>reclamos</b>, <b>tasas</b>, el <b>río</b>, <b>colectivos</b> y <b>farmacias</b>. Si necesitás hablar con una persona, llamá al 147.`);
}

function saludo() {
  return `¡Hola, ${esc(S.usuario.nombre.split(' ')[0])}! Soy <b>Tigri</b> 🐯, tu asistente de ${MARCA.app}. Puedo buscarte descuentos, contarte tus Puntos Tigre, ayudarte a pedir para retirar, sacar turnos, cargar reclamos o decirte cómo está el río. ¿Qué necesitás?`;
}

function chatEnviar(txt) {
  txt = txt.trim();
  if (!txt) return;
  S.chat.push({ de: 'yo', txt });
  S.chat.push({ de: 'tg', html: '<span class="escribiendo"><i></i><i></i><i></i></span>', tmp: true });
  render();
  setTimeout(() => {
    S.chat = S.chat.filter((m) => !m.tmp);
    S.chat.push({ de: 'tg', ...tigriResponde(txt) });
    if (S.chat.length > 40) S.chat = S.chat.slice(-40);
    if (S.sheet === 'tigri') render(); else save();
  }, 650);
}

// ---------- comercio ----------
function panelComercio() {
  const c = comercio((perfilActual() && perfilActual().cid) || S.panelCid);
  S.panelCid = c.id;
  const nRP = (S.reclamosPed || []).filter((r) => r.cid === c.id && estadoRP(r) === 'abierto').length;
  const tabs = [['pedidos', '🧾 Pedidos'], ['reclamos', `⚠️ Reclamos${nRP ? ` (${nRP})` : ''}`], ['productos', '📦 Productos'], ['resumen', '📈 Resumen']];
  const cuerpo = S.panelTab === 'productos' ? pcProductos(c) : S.panelTab === 'resumen' ? pcResumen(c) : S.panelTab === 'reclamos' ? pcReclamos(c) : pcPedidos(c);
  return `
  <div class="panel-cab">
    <div class="avatar" style="background:${c.color}">${c.emoji}</div>
    <div class="grow"><b class="panel-nombre">${esc(c.nombre)}</b>
      <span class="muted">${esc(c.dir)} · ${c.loc} · ${MARCA.tarjeta} -${c.desc}%</span></div>
    <button class="switch ${c.abierto ? 'on' : ''}" data-a="toggleAbierto">${c.abierto ? '🟢 Abierto' : '⚪ Cerrado'}</button>
  </div>
  <div class="seg">${tabs.map(([id, t]) => `<button class="${S.panelTab === id ? 'on' : ''}" data-a="panelTab" data-v="${id}">${t}</button>`).join('')}</div>
  ${cuerpo}`;
}

function pcPedidos(c) {
  const ped = S.pedidos.filter((p) => p.cid === c.id);
  const col = (estado, titulo) => {
    const lista = ped.filter((p) => p.estado === estado).sort((a, b) => a.creado - b.creado);
    return `<div class="col"><h3>${titulo} <span>${lista.length}</span></h3>${lista.map((p) => tarjetaPedido(p)).join('') || '<p class="muted vacio-col">Nada por acá</p>'}</div>`;
  };
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const entregadosHoy = ped.filter((p) => p.estado === 'retirado' && p.creado >= hoy.getTime()).length;
  return `<div class="kanban">${col('recibido', '🆕 Nuevos')}${col('preparacion', '👩‍🍳 En preparación · máx. 5')}${col('listo', '✅ Listos para retirar')}</div>
  <p class="muted">Entregados hoy: ${entregadosHoy}. Los pedidos nuevos llegan cuando un vecino compra desde la app. Sin comisión por venta.</p>`;
}

function tarjetaPedido(p) {
  const pago = PAGOS.find((x) => x.id === p.pago);
  const acciones = p.estado === 'recibido'
    ? `<button class="btn" data-a="avanzar" data-v="${p.id}">Empezar a preparar</button><button class="link rojo" data-a="rechazar" data-v="${p.id}">Rechazar</button>`
    : p.estado === 'preparacion'
      ? `<button class="btn" data-a="avanzar" data-v="${p.id}">Marcar listo</button>`
      : `<div class="validar"><input inputmode="numeric" maxlength="4" placeholder="Código" id="cod-${p.id}"><button class="btn" data-a="entregar" data-v="${p.id}">Entregar</button></div>`;
  return `<div class="tped">
    <div class="tped-cab"><b>#${p.id}</b><span class="muted">Retira ${p.retiro}</span></div>
    ${p.items.map((it) => `<p>${it.qty} × ${esc(it.nombre)}</p>`).join('')}
    <p class="linea"><span>${pago.emoji} ${pago.nombre}</span><b>${plata(p.total)}</b></p>
    <p class="muted chico">Incluye beneficio ${MARCA.tarjeta} de ${plata(p.descuento)}. ${p.pago === 'efectivo' ? 'Cobrar al entregar.' : 'Ya pagado.'}</p>
    ${acciones}</div>`;
}

function pcProductos(c) {
  return `
  <div class="card form fila-form">
    <label>Descuento ${MARCA.tarjeta}<select data-f="descComercio">${[10, 15, 20, 25, 30].map((d) => `<option value="${d}" ${c.desc === d ? 'selected' : ''}>${d}%</option>`).join('')}</select></label>
    <label>Tiempo de preparación<select data-f="prepComercio">${[10, 15, 20, 25, 30, 35, 45].map((d) => `<option value="${d}" ${c.prep === d ? 'selected' : ''}>${d} min</option>`).join('')}</select></label>
  </div>
  <div class="tabla">${c.productos.map((p) => `
    <div class="trow ${p.disponible ? '' : 'agotado'}">
      <span class="prod-ico">${p.emoji}</span><b class="grow">${esc(p.nombre)}</b>
      <label class="precio-input">$<input type="number" min="0" step="100" value="${p.precio}" data-f="precio" data-v="${p.id}"></label>
      <button class="switch ${p.disponible ? 'on' : ''}" data-a="toggleProd" data-v="${p.id}">${p.disponible ? 'Disponible' : 'Agotado'}</button>
    </div>`).join('')}</div>
  <div class="card flash-panel">${flashActiva(c) ? `<b>⏱ Oferta flash activa: ${c.desc + c.flash.extra}% de descuento</b><span class="muted">Termina en ${restaFlash(c)}. Los vecinos la ven en el inicio.</span><button class="link rojo" data-a="finFlash">Terminar oferta</button>` : `<b>Oferta flash</b><span class="muted">Sumá 15% extra durante 2 horas para mover la venta en horario bajo. Es una táctica de growth hacking: escasez y descuento.</span><button class="btn" data-a="flash">Lanzar oferta flash</button>`}</div>
  <h2>Agregar producto</h2>
  <div class="card form fila-form">
    <label class="angosto">Ícono<input id="npEmoji" value="🍽️" maxlength="2"></label>
    <label class="grow">Nombre<input id="npNombre" placeholder="Ej.: Milanesa con papas"></label>
    <label>Precio<input id="npPrecio" type="number" min="0" step="100" placeholder="0"></label>
    <button class="btn" data-a="agregarProd">Agregar</button>
  </div>`;
}

function pcResumen(c) {
  const desde = inicioMes();
  const mes = S.pedidos.filter((p) => p.cid === c.id && p.estado === 'retirado' && p.creado >= desde);
  const ventas = mes.reduce((a, p) => a + p.total, 0);
  const comision = ventas * MARCA.comisionApps;
  const top = {};
  mes.forEach((p) => p.items.forEach((it) => { top[it.nombre] = (top[it.nombre] || 0) + it.qty; }));
  const ranking = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return `<div class="kpis">
    ${kpi('Ventas del mes', plata(ventas))}${kpi('Pedidos retirados', mes.length)}
    ${kpi('Ticket promedio', plata(mes.length ? ventas / mes.length : 0))}${kpi('Comisión que no pagaste', plata(comision), 'verde', `vs. ${MARCA.comisionApps * 100}% en apps privadas`)}
  </div>
  <h2>Plan Destacado</h2>
  <div class="card plan ${c.destacado ? 'activo' : ''}">
    <div class="plan-cab"><div><b>Vender sigue siendo gratis: 0% de comisión.</b><span class="muted">El plan es opcional, para crecer más rápido.</span></div><strong>${plata(MODELO.planPrecio)}<small>/mes</small></strong></div>
    <ul class="plan-lista"><li>Aparecés primero en "Para vos, hoy", en Comprar y en el mapa, con la etiqueta Destacado.</li><li>Ofertas flash ilimitadas con aviso a vecinos cercanos (sin el plan: 1 por mes).</li><li>Un espacio en la publicidad del inicio por mes.</li><li>Informe de tus clientes: horarios, barrios y lo más pedido.</li></ul>
    ${c.destacado ? `<div class="plan-inf"><p><b>Tu informe de clientes</b></p><p class="linea"><span>Horario pico</span><b>viernes de 20 a 21 h</b></p><p class="linea"><span>Barrio que más te compra</span><b>${esc(c.loc)}</b></p><p class="linea"><span>Clientes que repiten</span><b>38%</b></p></div>
      <div class="plan-pie"><span class="pill listo">Plan activo</span><button class="link" data-a="planToggle">Cancelar el plan</button></div>`
    : '<div class="plan-pie"><button class="btn" data-a="planToggle">Activar Plan Destacado</button><span class="muted chico">Se cancela cuando quieras.</span></div>'}
  </div>
  <h2>Lo más pedido este mes</h2>
  <div class="card">${ranking.map(([n, q]) => `<p class="linea"><span>${esc(n)}</span><b>${q}</b></p>`).join('') || '<p class="muted">Todavía sin ventas este mes.</p>'}</div>`;
}

const kpi = (t, v, cls = '', sub = '') => `<div class="kpi ${cls}"><span>${t}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;

// ---------- municipio: Atención al Vecino (Carlos) ----------
function vAtencion() {
  const abiertos = S.reclamos.filter((r) => r.estado !== 'resuelto');
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const nuevosHoy = S.reclamos.filter((r) => r.creado >= hoy.getTime()).length;
  const resueltosSemana = S.reclamos.filter((r) => r.estado === 'resuelto' && r.historial.some((h) => h.estado === 'resuelto' && h.t >= Date.now() - 7 * 864e5)).length;
  const gestion = abiertos.slice().sort((a, b) => (b.mio - a.mio) || (b.creado - a.creado)).slice(0, 8);
  const turnosHoy = [...TURNOS_DEMO, ...S.turnos.map((t) => ({ hora: t.hora, nombre: S.usuario.nombre.split(' ')[0] + ' ' + S.usuario.nombre.split(' ')[1][0] + '.', tramite: t.tramite, app: true }))].sort((a, b) => a.hora.localeCompare(b.hora));
  return `
  <h1 class="titulo">Atención al Vecino</h1>
  <p class="muted sub">Reclamos y turnos del distrito, en tiempo real. Datos de demostración.</p>
  <div class="kpis">
    ${kpi('Reclamos abiertos', abiertos.length, abiertos.length > 30 ? 'rojo-kpi' : '')}
    ${kpi('Nuevos hoy', nuevosHoy)}
    ${kpi('Resueltos esta semana', resueltosSemana, 'verde')}
    ${kpi('Turnos de hoy', turnosHoy.length)}
  </div>
  <div class="dos">
    <div class="card"><h3>Mapa de reclamos</h3><div class="mapa" data-map="municipio"></div>
      <p class="muted chico">🔴 recibido · 🟡 asignado o en curso · 🟢 resuelto · los puntos grandes llegaron desde la app</p></div>
    <div class="card"><h3>Para gestionar</h3>
      ${gestion.map((r) => { const t = TIPOS_RECLAMO.find((x) => x.id === r.tipo); const sig = ESTADOS_RECLAMO[ESTADOS_RECLAMO.indexOf(r.estado) + 1]; return `<div class="gest ${r.mio ? 'de-app' : ''}">${r.foto ? `<img src="${r.foto}" alt="Foto del reclamo">` : `<span class="ico">${t.emoji}</span>`}<div class="grow"><b>${t.nombre} · ${r.id}</b>${r.mio ? ' <span class="pill recibido">desde la app</span>' : ''}<p class="muted chico">${esc(r.dir || '')} ${r.loc} · ${RECLAMO_TXT[r.estado]}</p>${r.texto ? `<p class="chico">${esc(r.texto)}</p>` : ''}</div><button class="btn mini-btn" data-a="avanzarReclamo" data-v="${r.id}">${sig === 'resuelto' ? 'Resolver' : sig === 'asignado' ? 'Asignar cuadrilla' : 'Iniciar'}</button></div>`; }).join('')}
    </div>
    <div class="card"><h3>Mediación de compras · Defensa del Consumidor</h3><p class="muted chico">Casos que el comercio no respondió en 24 horas o que el vecino no aceptó.</p>${mediacionesHtml()}</div>
    <div class="card"><h3>Turnos de hoy</h3>
      ${turnosHoy.map((t) => { const tr = TRAMITES.find((x) => x.id === t.tramite); return `<p class="linea"><span><b>${t.hora}</b> · ${esc(t.nombre)}${t.app ? ' <span class="pill recibido">desde la app</span>' : ''}</span><span class="muted">${tr.emoji} ${tr.nombre}</span></p>`; }).join('')}
    </div>
    <div class="card"><h3>Reclamos por tipo</h3>
      ${TIPOS_RECLAMO.map((t) => `<p class="linea"><span>${t.emoji} ${t.nombre}</span><span><b class="rojo">${S.reclamos.filter((r) => r.tipo === t.id && r.estado !== 'resuelto').length} abiertos</b> · <span class="verde">${S.reclamos.filter((r) => r.tipo === t.id && r.estado === 'resuelto').length} resueltos</span></span></p>`).join('')}
    </div>
  </div>`;
}

// ---------- municipio: Desarrollo Económico (Marina) ----------
function sostenibilidadHtml() {
  const M = MODELO;
  const dest = S.comercios.filter((c) => c.destacado).length;
  const filas = [
    ['Plan Destacado', `${M.planMeta} comercios × ${plata(M.planPrecio)} × 12`, M.planMeta * M.planPrecio * 12],
    ['Publicidad local', `${M.pubEspacios} espacios × ${plata(M.pubPrecio)} × 12`, M.pubEspacios * M.pubPrecio * 12],
    ['Banco o billetera que cofinancia descuentos', 'acuerdo anual', M.banco],
    ['Ahorro en atención presencial', `${M.tramites.toLocaleString('es-AR')} trámites × ${plata(M.ahorroTramite)}`, M.tramites * M.ahorroTramite],
  ];
  const ingreso = filas.reduce((a, f) => a + f[2], 0);
  const costo = M.licenciaMes * 12 + M.infraAnual;
  const res = ingreso - costo;
  const mill = (n) => `$${(n / 1e6).toFixed(1).replace('.', ',')} M`;
  return `<div class="card sost"><div class="sost-cab"><div><h3>Sostenibilidad del programa · año 2</h3><p class="muted chico">Gratis para el vecino y 0% de comisión para el comercio. Supuestos a validar en el piloto.</p></div>
    <span class="sost-res ${res >= 0 ? 'ok' : ''}">${res >= 0 ? 'Se paga sola' : 'Requiere aporte'} · ${res >= 0 ? '+' : ''}${mill(res)}</span></div>
    <table class="sost-t">${filas.map((f) => `<tr><td>${f[0]}<small>${f[1]}</small></td><td>${mill(f[2])}</td></tr>`).join('')}
      <tr class="tot"><td>Ingresos y ahorros</td><td>${mill(ingreso)}</td></tr>
      <tr><td>Costo: licencia y soporte + infraestructura<small>${plata(M.licenciaMes)} × 12 + ${mill(M.infraAnual)}</small></td><td>−${mill(costo)}</td></tr></table>
    <p class="muted chico">Hoy en la demo: ${plural(dest, 'comercio', 'comercios')} con Plan Destacado. Además, pagar la tasa en término con Puntos Tigre (meta: de 71% a 80%) adelanta recaudación.</p></div>`;
}

function vEconomia() {
  const desde = inicioMes();
  const mes = S.pedidos.filter((p) => p.estado === 'retirado' && p.creado >= desde);
  const ventas = mes.reduce((a, p) => a + p.total, 0);
  const ahorroVecinos = mes.reduce((a, p) => a + p.descuento, 0);
  const porLoc = LOCALIDADES.map((l) => ({ l, v: mes.filter((p) => p.loc === l).reduce((a, p) => a + p.total, 0), n: S.comercios.filter((c) => c.loc === l).length + BENEFICIOS.filter((b) => b.loc === l).length }));
  const maxLoc = Math.max(...porLoc.map((x) => x.v), 1);
  const porCat = CATS.map((c) => ({ c, v: mes.filter((p) => comercio(p.cid).cat === c.id).reduce((a, p) => a + p.total, 0) })).filter((x) => x.v).sort((a, b) => b.v - a.v);
  const maxCat = Math.max(...porCat.map((x) => x.v), 1);
  const topCom = S.comercios.map((c) => ({ c, v: mes.filter((p) => p.cid === c.id).reduce((a, p) => a + p.total, 0) })).sort((a, b) => b.v - a.v).slice(0, 5);
  return `
  <h1 class="titulo">Desarrollo Económico</h1>
  <p class="muted sub">Impacto de SoyTigreYa en ${MESES[new Date().getMonth()]} ${new Date().getFullYear()}, hasta hoy. Datos de demostración.</p>
  <div class="kpis">
    ${kpi('Ventas en comercios locales', plata(ventas))}
    ${kpi('Comisiones que quedaron en Tigre', plata(ventas * MARCA.comisionApps), 'verde', `lo que se habría ido en apps al ${MARCA.comisionApps * 100}%`)}
    ${kpi('Ahorro de los vecinos', plata(ahorroVecinos), 'verde')}
    ${kpi('Comercios adheridos', S.comercios.length + BENEFICIOS.length)}
  </div>
  <div class="kpi-mas">
    <div><span>Pedidos retirados</span><b>${mes.length.toLocaleString('es-AR')}</b></div>
    <div><span>Puntos Tigre canjeados</span><b>${(184200 + S.puntos.canjeados).toLocaleString('es-AR')}</b></div>
    <div><span>Tasas pagadas en término <small>meta 80%</small></span><b>71%</b></div>
    <div><span>Reclamos de compras <small>${indicadoresRP().sinMed}% sin mediación</small></span><b>${indicadoresRP().tasa} c/100</b></div>
    <div><span>Pagos hechos por la app</span><b>${(1840 + S.pagosApp).toLocaleString('es-AR')}</b></div>
  </div>
  ${sostenibilidadHtml()}
  <div class="dos">
    <div class="card"><h3>Embudo del producto (AARRR)</h3>${embudo()}</div>
    <div class="card"><h3>Objetivos SMART del piloto</h3>${objetivosSmart()}</div>
    <div class="card"><h3>Consumo por localidad</h3>
      ${porLoc.map((x) => `<div class="hbar"><span class="hbar-t">${x.l}<small>${x.n} comercios</small></span><div class="hbar-b"><i style="width:${(x.v / maxLoc) * 100}%;opacity:${0.35 + 0.65 * (x.v / maxLoc)}"></i></div><b>${plata(x.v)}</b></div>`).join('')}
    </div>
    <div class="card"><h3>Consumo por rubro</h3>
      ${porCat.map((x) => `<div class="hbar"><span class="hbar-t">${x.c.emoji} ${x.c.nombre}</span><div class="hbar-b"><i class="naranja" style="width:${(x.v / maxCat) * 100}%"></i></div><b>${plata(x.v)}</b></div>`).join('')}
    </div>
    <div class="card"><h3>Comercios con más ventas</h3>
      ${topCom.map((x, i) => `<p class="linea"><span>${i + 1}. ${x.c.emoji} ${esc(x.c.nombre)} <small class="muted">${x.c.loc}</small></span><b>${plata(x.v)}</b></p>`).join('')}
    </div>
    <div class="card"><h3>Último movimiento</h3>
      ${S.pedidos.slice().sort((a, b) => b.creado - a.creado).slice(0, 5).map((p) => `<p class="linea"><span>${comercio(p.cid).emoji} ${esc(comercio(p.cid).nombre)} <small class="muted">${hora(p.creado)} · ${fecha(p.creado)}</small></span><b>${plata(p.total)}</b></p>`).join('')}
    </div>
  </div>`;
}

// ---------- Lugares cercanos: un solo componente de mapa + lista por distancia ----------
// Ubicación del vecino: demo cerca de su localidad. Las ubicaciones de los lugares son aproximadas.
// UBIC: ubicación real (GPS) o punto tocado en el mapa. Vive solo en memoria: no se guarda.
let UBIC = null;
function miPos() { return UBIC ? UBIC.pos : cerca(S.usuario.loc, 3); }
function ubicTxt() { return UBIC ? (UBIC.tipo === 'gps' ? 'Tu ubicación' : 'Punto elegido') : `${S.usuario.loc} (demo)`; }
function ubicBar() {
  return `<div class="ubic-bar"><span class="ubic-txt">📍 Desde: <b>${esc(ubicTxt())}</b></span>
    ${UBIC ? '<button class="ubic-btn claro" data-a="ubicReset">Quitar</button>' : ''}<button class="ubic-btn" data-a="miUbic">${UBIC && UBIC.tipo === 'gps' ? 'Actualizar' : 'Usar mi ubicación'}</button></div>
    <p class="ubic-tip">También podés tocar el mapa para buscar desde otro punto.</p>`;
}
function distKm(a, b) {
  const R = 6371, r = Math.PI / 180;
  const dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const kmTxt = (d) => (d < 0.95 ? `${Math.max(100, Math.round(d * 10) * 100)} m` : `${d.toFixed(1).replace('.', ',')} km`);
function lugares(tipo) {
  if (tipo === 'salud') {
    const hosp = CENTROS_SALUD.filter((c) => c.id !== 'cafys').map((c, i) => ({ nombre: c.nombre, sub: c.guardia ? 'Guardia 24 h' : c.tipo, pos: cerca(c.loc, i + 41), emoji: '🏥', color: c.guardia ? '#D02013' : '#0E7C86' }));
    const cafys = LOCALIDADES.map((l, i) => ({ nombre: `CAFyS ${l}`, sub: 'Centro de Atención Familiar y de Salud', pos: cerca(l, i + 61), emoji: '🩺', color: '#0E7C86' }));
    return [...hosp, ...cafys];
  }
  if (tipo === 'deportes') return POLIDEPORTIVOS.map((p, i) => ({ nombre: p.nombre, sub: p.disc.join(' · '), pos: cerca(p.loc, i + 81), emoji: p.emoji, color: '#C2410C' }));
  if (tipo === 'tramites') return [{ nombre: 'Municipalidad de Tigre', sub: 'Av. Cazón 1514 · Atención de 8 a 14 h', pos: cerca('Tigre Centro', 101), emoji: '🏛️', color: '#3A3F4D' },
    ...LOCALIDADES.filter((l) => l !== 'Tigre Centro').map((l, i) => ({ nombre: `Delegación municipal ${l}`, sub: 'Trámites, tasas y licencias', pos: cerca(l, i + 103), emoji: '🏛️', color: '#3A3F4D' }))];
  if (tipo === 'estacionamiento') return ZONAS_ESTAC.map((z, i) => ({ nombre: z.nombre, sub: `${plata(z.tarifa)} por hora · lunes a sábado de 8 a 20`, pos: z.id === 'C' ? cerca('General Pacheco', 121) : cerca('Tigre Centro', 121 + i * 2), emoji: '🚗', color: '#1F5F99', accion: { a: 'zonaEstac', v: z.id, t: 'Estacionar acá' } }));
  if (tipo === 'farmacias') { const dia = Math.floor(Date.now() / 864e5); return FARMACIAS.map((f, i) => { const turno = (dia + i) % 3 === 0; return { nombre: f.nombre, sub: `${f.dir}${turno ? ' · De turno 24 h' : ''}`, pos: cerca(f.loc, i + 141), emoji: '💊', color: turno ? '#D02013' : '#0E7C86', tel: f.tel }; }); }
  if (tipo === 'reciclar') return PUNTOS_VERDES.map((n, i) => { const loc = LOCALIDADES.find((l) => n.includes(l)) || 'Tigre Centro'; return { nombre: n.replace(/ \(.*\)/, ''), sub: 'Plásticos, papel, vidrio y latas', pos: cerca(loc, i + 161), emoji: '♻️', color: '#1B7A47' }; });
  return [];
}
function cercaHtml(tipo, titulo = 'Cerca tuyo', max = 4) {
  const yo = miPos();
  const ls = lugares(tipo).map((l) => ({ ...l, d: distKm(yo, l.pos) })).sort((a, b) => a.d - b.d);
  return `<div class="cerca-box">
    <div class="h2-fila"><h2>${titulo}</h2></div>
    ${ubicBar()}
    <div class="mapa-cerca" data-map="lugares" data-tipo="${tipo}"></div>
    <div class="cerca-lista">${ls.slice(0, S.cercaTodos === tipo ? 99 : max).map((l) => `<div class="cerca-fila">
      <span class="cerca-pin" style="background:${l.color}">${l.emoji}</span>
      <div class="dep-txt"><b>${esc(l.nombre)}</b><span>${esc(l.sub)}</span></div>
      <div class="cerca-der"><b>${kmTxt(l.d)}</b>${l.accion ? `<button class="mini-btn" data-a="${l.accion.a}" data-v="${l.accion.v}">${l.accion.t}</button>` : `<a class="ir" href="https://www.google.com/maps/dir/?api=1&destination=${l.pos[0].toFixed(5)},${l.pos[1].toFixed(5)}" target="_blank" rel="noopener">Cómo llegar</a>`}</div>
    </div>`).join('')}</div>
    ${ls.length > max && S.cercaTodos !== tipo ? `<button class="link ver-mas" data-a="cercaTodos" data-v="${tipo}">Ver los ${ls.length}</button>` : ''}
  </div>`;
}

// ---------- mapas (Leaflet + OpenStreetMap) ----------
let mapas = [];
const pin = (emoji) => L.divIcon({ html: `<span>${emoji}</span>`, className: 'pin', iconSize: [30, 30], iconAnchor: [15, 28] });
const MAPAS = {
  lugares(m, el) {
    const yo = miPos();
    const ls = lugares(el.dataset.tipo);
    L.circleMarker(yo, { radius: 9, color: '#fff', weight: 3, fillColor: '#1F6FB2', fillOpacity: 1 }).addTo(m).bindPopup(UBIC ? (UBIC.tipo === 'gps' ? 'Estás acá' : 'Punto elegido') : 'Ubicación de demostración');
    m.on('click', (e) => { UBIC = { pos: [e.latlng.lat, e.latlng.lng], tipo: 'mapa' }; render(); });
    ls.forEach((l) => {
      const ir = l.accion ? `<button class="link" data-a="${l.accion.a}" data-v="${l.accion.v}">${l.accion.t}</button>` : `<a href="https://www.google.com/maps/dir/?api=1&destination=${l.pos[0].toFixed(5)},${l.pos[1].toFixed(5)}" target="_blank" rel="noopener">Cómo llegar</a>`;
      L.circleMarker(l.pos, { radius: 9, color: '#fff', weight: 2, fillColor: l.color, fillOpacity: 1 }).addTo(m)
        .bindPopup(`<b>${esc(l.nombre)}</b><br>${esc(l.sub)}<br>${kmTxt(distKm(yo, l.pos))} · ${ir}`);
    });
    const cercanos = ls.map((l) => l.pos).sort((a, b) => distKm(yo, a) - distKm(yo, b)).slice(0, 3);
    m.fitBounds(L.latLngBounds([yo, ...cercanos]).pad(0.35), { maxZoom: 15 });
  },
  beneficios(m) {
    const lista = listaBeneficios();
    lista.forEach((b) => {
      const btn = b.tipo === 'local' ? `<button class="link" data-a="verBenef" data-v="${b.i}">Ver beneficio</button>` : `<button class="link" data-a="abrir" data-v="${b.id}">Pedir por la app</button>`;
      L.circleMarker(b.pos, { radius: 9, color: '#fff', weight: 2, fillColor: '#D02013', fillOpacity: 1 })
        .addTo(m).bindPopup(`<b>${b.emoji} ${esc(b.nombre)}</b><br>${esc(b.texto)}<br>${btn}`);
    });
    const yo = miPos();
    L.circleMarker(yo, { radius: 9, color: '#fff', weight: 3, fillColor: '#1F6FB2', fillOpacity: 1 }).addTo(m).bindPopup(ubicTxt());
    m.on('click', (e) => { UBIC = { pos: [e.latlng.lat, e.latlng.lng], tipo: 'mapa' }; render(); });
    m.setView(yo, UBIC ? 14 : 12);
  },
  picker(m) {
    const f = S.recForm;
    const pos = f.pos || LOC_COORDS[f.loc];
    const mk = L.marker(pos, { draggable: true, icon: pin('📍') }).addTo(m);
    const fijar = (ll) => { S.recForm.pos = [ll.lat, ll.lng]; save(); };
    mk.on('dragend', () => fijar(mk.getLatLng()));
    m.on('click', (e) => { mk.setLatLng(e.latlng); fijar(e.latlng); });
    m.setView(pos, 15);
  },
  municipio(m) {
    const col = { recibido: '#c0392b', asignado: '#E39A1B', 'en curso': '#E39A1B', resuelto: '#1b8a4b' };
    S.reclamos.forEach((r) => {
      const t = TIPOS_RECLAMO.find((x) => x.id === r.tipo);
      L.circleMarker(r.pos, { radius: r.mio ? 9 : 6, color: '#fff', weight: 1.5, fillColor: col[r.estado], fillOpacity: 0.9 }).addTo(m)
        .bindPopup(`<b>${t.emoji} ${t.nombre} · ${r.id}</b><br>${r.loc} · ${RECLAMO_TXT[r.estado]}${r.foto ? `<br><img src="${r.foto}" style="width:140px;border-radius:6px;margin-top:4px">` : ''}`);
    });
    m.setView([-34.44, -58.62], 11);
  },
};
function initMaps() {
  mapas.forEach((m) => m.remove());
  mapas = [];
  document.querySelectorAll('[data-map]').forEach((el) => {
    if (typeof L === 'undefined') { el.innerHTML = '<p class="muted centro">El mapa necesita conexión a internet.</p>'; return; }
    const m = L.map(el, { scrollWheelZoom: false, attributionControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    mapas.push(m);
    MAPAS[el.dataset.map](m, el);
  });
}

// ---------- después de pintar ----------
let timerId = null;
// ---------- íconos: los emojis del contenido pasan a íconos de línea (Lucide) ----------
const EMOJI_ICONO = {
  '🎢': 'ferris-wheel', '🚲': 'bike',
  '🏥': 'hospital', '❤️': 'heart-pulse', '👁️': 'eye', '🦷': 'smile', '💉': 'syringe', '🧠': 'brain', '🩻': 'scan', '🤰': 'baby', '📞': 'phone', '🧪': 'flask-conical', '🦴': 'bone',
  '🏭': 'factory', '🛵': 'bike', '💼': 'briefcase', '📝': 'file-text',
  '⚽': 'goal', '🏐': 'volleyball', '🏀': 'dribbble', '🤸': 'person-standing', '🚣': 'sailboat', '♿': 'accessibility', '☀️': 'sun', '☀': 'sun', '📢': 'megaphone', '🏅': 'medal',
  '🏠': 'house', '🎁': 'gift', '🛍️': 'shopping-bag', '🛍': 'shopping-bag', '🏛️': 'landmark', '🏛': 'landmark', '🪪': 'id-card', '🔔': 'bell', '🆘': 'siren',
  '🔎': 'search', '⭐': 'star', '🌊': 'waves', '🚌': 'bus', '💊': 'pill', '🚗': 'car', '🧾': 'receipt', '📣': 'megaphone', '📅': 'calendar',
  '📍': 'map-pin', '📷': 'camera', '🥡': 'utensils', '🛒': 'shopping-basket', '💳': 'credit-card', '♻️': 'recycle', '♻': 'recycle', '🎟️': 'ticket', '🎟': 'ticket',
  '🏆': 'trophy', '🐯': 'paw-print', '🍔': 'utensils', '🥬': 'carrot', '🐾': 'paw-print', '📚': 'book-open', '👕': 'shirt', '🩺': 'stethoscope',
  '🚤': 'sailboat', '🏋️': 'dumbbell', '🏋': 'dumbbell', '🎓': 'graduation-cap', '🔧': 'wrench', '💡': 'lightbulb', '🚧': 'construction', '🌳': 'trees',
  '🗑️': 'trash-2', '🗑': 'trash-2', '🚦': 'traffic-cone', '🌧️': 'cloud-rain', '🌧': 'cloud-rain', '💧': 'droplet', '🎪': 'tent', '🎶': 'music', '🎨': 'palette',
  '🏃': 'footprints', '🚔': 'shield-alert', '🚑': 'ambulance', '🔥': 'flame', '💜': 'heart-handshake', '📦': 'package', '📈': 'chart-line', '🆕': 'inbox',
  '👩‍🍳': 'chef-hat', '✅': 'circle-check', '💙': 'wallet', '🟢': 'wallet', '💵': 'banknote', '🔄': 'refresh-cw', '🔐': 'lock', '🙋': 'user',
  '🥩': 'beef', '🍝': 'soup', '☕': 'coffee', '🍣': 'fish', '🍕': 'pizza', '🍗': 'drumstick', '🌭': 'sandwich', '🧀': 'egg-fried', '🥗': 'salad',
  '🥤': 'cup-soda', '🥔': 'carrot', '🍲': 'soup', '🍰': 'cake-slice', '🥪': 'sandwich', '🍌': 'banana', '🍋': 'citrus', '🥟': 'croissant', '🧅': 'pizza',
  '🥧': 'cookie', '🥛': 'milk', '🧉': 'coffee', '🫗': 'droplets', '🥖': 'croissant', '🍅': 'apple', '🧺': 'shopping-basket',
  '🐕': 'dog', '🐈': 'cat', '🪨': 'package', '📓': 'notebook', '✏️': 'pencil', '✏': 'pencil', '📄': 'file-text', '🧴': 'spray-can', '🧼': 'hand', '👶': 'baby',
  '🧥': 'shirt', '🧦': 'footprints', '🍽️': 'utensils', '🍽': 'utensils', '🚨': 'triangle-alert', '🍦': 'ice-cream-cone', '🍺': 'beer', '🥐': 'croissant',
  '👓': 'glasses', '🏝️': 'palmtree', '🏝': 'palmtree', '👟': 'footprints', '🎉': 'party-popper', '⚠️': 'triangle-alert', '⚠': 'triangle-alert',
  '👩‍💼': 'user', '👨‍💼': 'user', '🛠️': 'wrench', '🛠': 'wrench', '📋': 'list', '🗺️': 'map', '🗺': 'map', '✨': 'layout-grid', '📱': 'smartphone',
  '👋': '', '🙈': '', '🐶': 'dog', '🎮': 'gamepad-2', '⏱': 'timer', '🔠': 'type', '🏪': 'store', '💇': 'scissors', '💅': 'paintbrush', '🎬': 'clapperboard', '📊': 'chart-column', '🤝': 'handshake',
};
const RE_EMOJI = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|\p{Emoji_Modifier})?(?:‍(?:\p{Extended_Pictographic})(?:️|\p{Emoji_Modifier})?)*/gu;
const sinEmoji = (t) => String(t).replace(RE_EMOJI, '').replace(/️/g, '').replace(/^\s+/, '');
function iconizar(raiz) {
  const tw = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const nodos = [];
  while (tw.nextNode()) { if (RE_EMOJI.test(tw.currentNode.nodeValue)) nodos.push(tw.currentNode); RE_EMOJI.lastIndex = 0; }
  nodos.forEach((n) => {
    if (n.parentNode && /^(OPTION|TEXTAREA|SCRIPT|STYLE)$/.test(n.parentNode.nodeName)) { n.nodeValue = sinEmoji(n.nodeValue); return; }
    const frag = document.createDocumentFragment();
    let ult = 0; const v = n.nodeValue;
    v.replace(RE_EMOJI, (m, i) => {
      frag.appendChild(document.createTextNode(v.slice(ult, i)));
      const base = m.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
      const nombre = EMOJI_ICONO[base] ?? EMOJI_ICONO[base.replace(/️/g, '')];
      if (nombre) { const el = document.createElement('i'); el.setAttribute('data-lucide', nombre); el.className = 'ic'; frag.appendChild(el); }
      ult = i + m.length; return m;
    });
    frag.appendChild(document.createTextNode(v.slice(ult).replace(/^\s{2,}/, ' ')));
    n.parentNode.replaceChild(frag, n);
  });
  raiz.querySelectorAll('[placeholder]').forEach((el) => { el.placeholder = sinEmoji(el.placeholder); });
  if (window.lucide) lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
}

function after() {
  iconizar(document.getElementById('app'));
  document.querySelectorAll('[data-qr]').forEach((el) => {
    const txt = el.dataset.qr === 'token' ? tokenCredencial() : el.dataset.qr;
    el.innerHTML = qrSvg(txt);
  });
  initMaps();
  const msgs = $('#chatMsgs'); if (msgs) msgs.scrollTop = msgs.scrollHeight;
  clearInterval(timerId);
  const enCred = S.rol === 'vecino' && S.tab === 'credencial' && !S.sub;
  const enEstac = S.rol === 'vecino' && S.sub === 'estacionamiento' && S.estac.activo;
  if (enCred || enEstac) {
    const tick = () => {
      if (enCred) {
        const resta = 30 - Math.floor((Date.now() / 1000) % 30);
        const t = $('#timer'); if (t) t.textContent = resta;
        if (resta === 30) { const q = document.querySelector('[data-qr="token"]'); if (q) q.innerHTML = qrSvg(tokenCredencial()); }
      }
      if (enEstac) {
        const { min, costo } = costoEstac();
        const t = $('#estacT'); if (t) t.textContent = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')} h`;
        const c = $('#estacC'); if (c) c.textContent = plata(costo);
      }
    };
    tick();
    timerId = setInterval(tick, 1000);
  }
}

function costoEstac() {
  const a = S.estac.activo;
  const min = Math.max(1, Math.ceil((Date.now() - a.inicio) / 60000));
  const z = ZONAS_ESTAC.find((x) => x.id === a.zona);
  return { min, costo: Math.round((z.tarifa / 60) * min) };
}

function tokenCredencial() {
  return `SOYTIGRE|${S.usuario.nro}|${Math.floor(Date.now() / 30000).toString(36)}`;
}

function qrSvg(texto) {
  if (typeof qrcode !== 'function') return `<div class="qr-falta">${esc(texto)}</div>`;
  const q = qrcode(0, 'M'); q.addData(texto); q.make();
  return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}

let toastId = null;
function toast(txt) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = sinEmoji(txt); t.className = 'show';
  clearTimeout(toastId); toastId = setTimeout(() => { t.className = ''; }, 3200);
}

function notificar(obj, txt, emoji) {
  if (!obj.mio) return;
  S.notifs.push({ t: Date.now(), txt, emoji, leida: false });
}

function achicarFoto(file, cb) {
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 640 / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      cb(cv.toDataURL('image/jpeg', 0.6));
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}

function procesando(txt, fn) {
  S.sheet = 'pagando'; S.pagandoTxt = txt;
  setTimeout(() => { fn(); render(); }, 1300);
}

function crearPedido(t, retiro) {
  const p = armarPedido({
    id: 'P' + (Math.max(...S.pedidos.map((x) => Number(x.id.slice(1)))) + 1), cid: t.c.id,
    items: t.items.map(({ pid, nombre, precio, qty }) => ({ pid, nombre, precio, qty })),
    desc: t.c.desc + (t.extra || 0), pago: S.pago, creado: Date.now(), estado: 'recibido', mio: true, loc: t.c.loc, servicio: !!t.c.servicio, retiro: t.c.servicio ? retiro.toLowerCase() : `a las ${retiro}`,
  });
  if (t.cupon) { p.cupon = t.cupon; p.total -= t.cupon; S.puntos.cupones.splice(S.puntos.cupones.findIndex((c) => c.tipo === 'cupon'), 1); }
  S.pedidos.push(p);
  const pts = sumarPuntos(Math.floor(p.total / PUNTOS.porCompra), `Compra en ${t.c.nombre}`, '🛍️');
  S.carrito = null; S.sheet = null; S.abierto = null; S.tab = 'comprar'; S.comprarTab = 'pedidos';
  if (!S.tour) setTimeout(() => toast(`✅ ${t.c.servicio ? 'Turno reservado' : 'Pedido enviado'}. Ahorraste ${plata(p.descuento + (p.cupon || 0))} y sumaste ⭐ ${pts} puntos.`), 100);
  return p;
}

// ---------- reclamos de compras: vecino → comercio (24 h) → mediación del municipio ----------
const MOTIVOS_RP = [['falta', 'Faltó un producto'], ['mal', 'Llegó en mal estado'], ['demora', 'No estaba listo a la hora'], ['cobro', 'Me cobraron de más'], ['otro', 'Otro problema']];
const RP_TXT = { abierto: 'Esperando respuesta del comercio', respondido: 'El comercio propuso una solución', resuelto: 'Resuelto', mediacion: 'En mediación del municipio', cerrado: 'Cerrado por el municipio' };
const motivoRP = (m) => (MOTIVOS_RP.find((x) => x[0] === m) || ['', 'Otro problema'])[1];
function estadoRP(r) { return r.estado === 'abierto' && Date.now() - r.creado > 24 * 36e5 ? 'mediacion' : r.estado; }
function rpDePedido(pid) { return (S.reclamosPed || []).find((r) => r.pid === pid); }
function horasRestantes(r) { return Math.max(0, Math.ceil((r.creado + 24 * 36e5 - Date.now()) / 36e5)); }
function propuestaTxt(r) {
  const pr = r.propuesta; if (!pr) return '';
  return pr.tipo === 'reponer' ? 'reponer el producto en tu próximo retiro' : `devolverte ${plata(pr.monto)}`;
}
function bloqueRP(p) {
  const r = rpDePedido(p.id);
  if (!r) return p.estado === 'rechazado' ? '' : `<button class="link rp-link" data-a="rpAbrir" data-v="${p.id}">⚠️ Tuve un problema con este pedido</button>`;
  const e = estadoRP(r);
  let acc = '';
  if (e === 'abierto') acc = `<p class="muted chico">${comercio(r.cid).nombre} tiene ${horasRestantes(r)} h para responder. Si no responde, interviene el municipio.</p>`;
  if (e === 'respondido') acc = `<p><b>Propuesta del comercio:</b> ${propuestaTxt(r)}.</p><div class="rp-acc"><button class="btn mini-btn" data-a="rpAceptar" data-v="${r.id}">Aceptar</button><button class="link rojo" data-a="rpRechazar" data-v="${r.id}">No acepto, que medie el municipio</button></div>`;
  if (e === 'mediacion') acc = '<p class="muted chico">La oficina de defensa del consumidor del municipio está revisando el caso.</p>';
  if (e === 'resuelto' || e === 'cerrado') acc = `<p class="muted chico">${esc(r.historial[r.historial.length - 1].txt)}</p>`;
  return `<div class="rp-box ${e}"><div class="rp-cab"><b>Reclamo ${r.id} · ${motivoRP(r.motivo)}</b><span class="pill ${e === 'resuelto' || e === 'cerrado' ? 'resuelto' : e === 'mediacion' ? 'abierto' : 'asignado'}">${RP_TXT[e]}</span></div>${acc}</div>`;
}
function pcReclamos(c) {
  const lista = (S.reclamosPed || []).filter((r) => r.cid === c.id).sort((a, b) => b.creado - a.creado);
  if (!lista.length) return '<p class="vacio">No tenés reclamos de vecinos. ¡Bien ahí!</p>';
  return `<p class="muted sub">Tenés 24 horas para proponer una solución. Si no respondés o el vecino no acepta, el caso pasa a la oficina de defensa del consumidor del municipio.</p><div class="lista">${lista.map((r) => {
    const p = S.pedidos.find((x) => x.id === r.pid); const e = estadoRP(r);
    const acc = e === 'abierto' ? `<p class="rp-plazo">Quedan ${horasRestantes(r)} h para responder</p><div class="rp-acc">
        <button class="btn mini-btn" data-a="rpProponer" data-v="${r.id}|total">Devolver todo (${plata(p.total)})</button>
        <span class="rp-parcial">$<input type="number" min="1" max="${p.total}" step="100" placeholder="Monto" id="rpm-${r.id}"><button class="btn mini-btn claro" data-a="rpProponer" data-v="${r.id}|parcial">Devolver parte</button></span>
        <button class="btn mini-btn claro" data-a="rpProponer" data-v="${r.id}|reponer">Reponer el producto</button></div>`
      : `<p class="muted chico">${esc(r.historial[r.historial.length - 1].txt)}</p>`;
    return `<div class="card rp-card"><div class="rp-cab"><b>${r.id} · ${motivoRP(r.motivo)}</b><span class="pill ${e === 'abierto' ? 'abierto' : e === 'resuelto' || e === 'cerrado' ? 'resuelto' : 'asignado'}">${RP_TXT[e]}</span></div>
      <p class="muted chico">${r.mio ? esc(S.usuario.nombre) : esc(r.vecino || 'Vecino')} · pedido #${r.pid} · ${p ? p.items.map((it) => `${it.qty} × ${esc(it.nombre)}`).join(', ') : ''} · ${plata(p ? p.total : 0)}</p>
      ${r.texto ? `<p>"${esc(r.texto)}"</p>` : ''}${r.foto ? `<img class="rp-foto" src="${r.foto}" alt="Foto del reclamo">` : ''}${acc}</div>`;
  }).join('')}</div>`;
}
function mediacionesHtml() {
  const lista = (S.reclamosPed || []).filter((r) => estadoRP(r) === 'mediacion');
  if (!lista.length) return '<p class="muted">No hay casos en mediación.</p>';
  return lista.map((r) => { const p = S.pedidos.find((x) => x.id === r.pid); const c = comercio(r.cid);
    const motivo = r.propuesta ? `El vecino no aceptó la propuesta: ${propuestaTxt(r)}.` : 'El comercio no respondió en 24 horas.';
    return `<div class="gest de-app"><span class="ico">🤝</span><div class="grow"><b>${r.id} · ${esc(c.nombre)} · ${motivoRP(r.motivo)}</b><p class="muted chico">${motivo} Pedido de ${plata(p ? p.total : 0)}.</p>${r.texto ? `<p class="chico">"${esc(r.texto)}"</p>` : ''}</div>
      <div class="rp-acc col-acc"><button class="btn mini-btn" data-a="rpMediar" data-v="${r.id}|vecino">Reintegro al vecino</button><button class="link" data-a="rpMediar" data-v="${r.id}|comercio">A favor del comercio</button></div></div>`; }).join('');
}
function indicadoresRP() {
  const rps = S.reclamosPed || [];
  const tasa = ((rps.length + 96) / 6000) * 100; // sobre los ~6.000 pedidos por mes del escenario conservador
  const cerrados = rps.filter((r) => ['resuelto', 'cerrado'].includes(estadoRP(r)));
  const sinMed = cerrados.filter((r) => r.estado === 'resuelto').length + 7, totalCerr = cerrados.length + 8;
  return { tasa: tasa.toFixed(1).replace('.', ','), sinMed: Math.round((sinMed / totalCerr) * 100) };
}

// ---------- feedback de visitantes: 1 a 5 tigres, comentario y nombre ----------
function fbEstado() { try { return JSON.parse(localStorage.getItem('soytigreya-feedback') || 'null'); } catch (e) { return null; } }
function feedbackHtml() {
  const hecho = fbEstado();
  if (hecho && !S.fbOtra) {
    return `<div class="card fb fb-ok"><b>¡Gracias, ${esc(hecho.nombre)}!</b><span class="muted">Tu opinión (${hecho.nota} de 5 tigres) ya llegó. Me ayuda a mejorar el prototipo.</span><button class="link" data-a="fbOtra">Dejar otra opinión</button></div>`;
  }
  const f = S.fb || { nota: 0, texto: '', nombre: '' };
  const etiquetas = ['', 'No me convenció', 'Puede mejorar', 'Está bien', 'Me gustó', '¡Me encantó!'];
  return `<div class="card fb">
    <b>¿Qué te pareció el prototipo?</b>
    <span class="muted">Tu opinión me ayuda a mejorarlo. Toma 30 segundos.</span>
    <div class="fb-tigres" role="radiogroup" aria-label="Puntaje de 1 a 5 tigres">${[1, 2, 3, 4, 5].map((n) => `<button class="fb-tigre ${n <= f.nota ? 'on' : ''}" data-a="fbNota" data-v="${n}" role="radio" aria-checked="${n === f.nota}" aria-label="${n} de 5">🐾</button>`).join('')}</div>
    <span class="fb-etq">${f.nota ? etiquetas[f.nota] : 'Elegí de 1 a 5 tigres'}</span>
    <label class="fb-campo">Comentario (opcional)<textarea data-f="fbTxt" rows="3" maxlength="500" placeholder="¿Qué te gustó? ¿Qué cambiarías?">${esc(f.texto)}</textarea></label>
    <label class="fb-campo">Tu nombre<input data-f="fbNombre" maxlength="60" placeholder="Nombre y apellido" value="${esc(f.nombre)}"></label>
    <button class="btn" data-a="fbEnviar" ${S.fbEnviando ? 'disabled' : ''}>${S.fbEnviando ? 'Enviando…' : 'Enviar opinión'}</button>
  </div>`;
}
async function fbMandar(dato) {
  if (!FEEDBACK.url || !FEEDBACK.key) return 'local';
  const r = await fetch(`${FEEDBACK.url}/rest/v1/${FEEDBACK.tabla}`, {
    method: 'POST',
    headers: { apikey: FEEDBACK.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(dato),
  });
  if (!r.ok) throw new Error('No se pudo enviar');
  return 'ok';
}

// ---------- contenidos de la Diplomatura en la app ----------
function flashActiva(c) { return !!(c && c.flash && c.flash.hasta > Date.now()); }
function restaFlash(c) { const m = Math.max(0, Math.round((c.flash.hasta - Date.now()) / 60000)); return `${Math.floor(m / 60)} h ${m % 60} min`; }
function bannerFlash() {
  const c = S.comercios.find(flashActiva);
  if (!c) return '';
  return `<button class="card flash" data-a="abrir" data-v="${c.id}"><span class="flash-tag">Oferta flash</span><b>${esc(c.nombre)}: ${c.desc + c.flash.extra}% de descuento</b><span class="muted">Solo por ${restaFlash(c)} · pedí para retirar</span></button>`;
}
function encuestaNps() {
  if (!S.npsPendiente) return '';
  return `<div class="card nps"><div class="nps-cab"><b>¿Qué tan probable es que recomiendes SoyTigreYa a un vecino?</b><button class="cerrar-nps" data-a="npsCerrar" aria-label="Cerrar">✕</button></div>
    <div class="nps-escala">${Array.from({ length: 11 }, (_, k) => `<button data-a="nps" data-v="${k}">${k}</button>`).join('')}</div>
    <div class="nps-ref"><span>Nada probable</span><span>Muy probable</span></div></div>`;
}
function npsActual() {
  const base = [];
  for (let k = 0; k < 60; k++) base.push(k < 31 ? 9 + (k % 2) : k < 49 ? 7 + (k % 2) : 3 + (k % 4));
  const todas = [...base, ...(S.encuestas || []).map((e) => e.nota)];
  const pro = todas.filter((n) => n >= 9).length, det = todas.filter((n) => n <= 6).length;
  return { nps: Math.round(((pro - det) / todas.length) * 100), n: todas.length };
}
function embudo() {
  const activos = 1410 + S.pedidos.filter((p) => p.mio && p.creado > Date.now() - 864e5).length;
  const pasos = [
    ['Adquisición', 'Vecinos registrados', 3240],
    ['Activación', 'Hicieron su primer pedido', activos],
    ['Retención', 'Volvieron a pedir en 30 días', 820],
    ['Referidos', 'Llegaron invitados por otro vecino', 260],
    ['Ingresos', 'Compraron 3 veces o más', 410],
  ];
  return pasos.map(([n, d, v], i) => `<div class="emb" style="--w:${Math.max(22, (v / pasos[0][2]) * 100)}%"><div class="emb-bar"><b>${n}</b><span>${v.toLocaleString('es-AR')}</span></div><small class="muted">${d}${i ? ` · ${Math.round((v / pasos[0][2]) * 100)}% de los registrados` : ''}</small></div>`).join('') + '<p class="muted chico">Datos de demostración. Modelo AARRR de growth hacking.</p>';
}
function objetivosSmart() {
  const n = npsActual();
  const obj = [
    ['40 comercios con catálogo activo al cierre del piloto (semana 12)', S.comercios.length, 40],
    ['2.000 vecinos con al menos un pedido en 12 semanas', 1410, 2000],
    [`NPS de 40 o más (hoy ${n.nps}, sobre ${n.n} respuestas)`, Math.max(0, n.nps), 40],
    ['95% de pedidos entregados sin incidencias', 97, 95],
  ];
  return obj.map(([t, v, m]) => { const pct = Math.min(100, Math.round((v / m) * 100)); return `<div class="smart"><div class="linea"><span>${t}</span><b class="${pct >= 100 ? 'verde' : ''}">${pct}%</b></div><div class="barra-nivel"><i style="width:${pct}%"></i></div></div>`; }).join('');
}

const METODO = [
  { id: 'm1', mod: 'Módulo 1', titulo: 'Transformación digital', items: [
    ['Digitalización vs. transformación digital', 'No se pasó la tarjeta a una app: se reorganizó la relación entre vecino, comercio y municipio alrededor de datos compartidos.', 'Perfiles de Marina y Carlos'],
    ['Research e hipótesis de oportunidad', 'Problema: los comercios pierden 20–30% en comisiones y el vecino tiene todo disperso. Hipótesis: un canal municipal sin comisión.', 'Pantalla de entrada'],
    ['Empatizar y modelos mentales', 'Lucía, Rosa, Carlos y Marina son proto-personas: cada una ve solo lo que necesita.', 'Los 4 perfiles'],
    ['Ética digital y cumplimiento', 'Ley 25.326, datos agregados, consentimiento y banda de "prototipo no oficial".', 'Banda superior'],
    ['Ciclo de vida y adopción', 'Piloto con early adopters (40 comercios) antes de escalar a todo el distrito.', 'Objetivos SMART de Marina'],
    ['Sobreexpectación (curva de Gartner)', 'Tigri funciona con reglas: la IA llega en la etapa 3, cuando haya datos y casos claros.', 'Chat con Tigri'],
  ] },
  { id: 'm2', mod: 'Módulo 2', titulo: 'Metodologías ágiles', items: [
    ['Manifiesto ágil e iteración', 'Prototipo construido en iteraciones cortas, con cambios después de cada revisión.', 'Toda la app'],
    ['Kanban con límite WIP', 'Rosa ve sus pedidos en columnas: nuevos, en preparación (máximo 5) y listos.', 'Panel de Rosa'],
    ['Persona y propuesta de valor', 'Para el vecino: ahorrar y resolver todo en una app. Para el comercio: vender sin comisión.', 'Inicio de Lucía'],
    ['Ideación (brainstorming, 6-3-5)', 'De las ideas a la priorización: takeaway primero, delivery después.', 'Comprar en el barrio'],
    ['Prototipar y testear', 'Prototipo de alta fidelidad navegable, listo para pruebas con usuarios.', 'Recorrido guiado'],
    ['Lean Canvas y estructura de costos', 'Comisión 0%, costos de equipo e infraestructura; ingresos por plan piloto y licencia.', 'Presentación y trabajo'],
  ] },
  { id: 'm3', mod: 'Módulo 3', titulo: 'Innovación y diseño', items: [
    ['Doble diamante', 'Espacio del problema (empatizar, definir) y de la solución (idear, prototipar, testear).', 'Cómo lo diseñamos'],
    ['POV', 'Lucía, vecina de Tigre Centro, necesita resolver compras y trámites desde el celu porque hoy está todo disperso y no ve su ahorro.', 'Inicio de Lucía'],
    ['SCAMPER', 'Sustituir el cupón de papel por QR, Combinar beneficios y compras, Eliminar la comisión.', 'Credencial y compras'],
    ['MVP e historias de usuario', '"Como vecina quiero pedir para retirar con mi descuento para ahorrar sin perder tiempo."', 'Compra con retiro'],
    ['Deseabilidad, factibilidad, viabilidad', 'El vecino lo quiere, se puede construir con tecnología abierta y se sostiene sin comisión.', 'Planes del piloto'],
    ['Medir: SMART, KPIs y ROI', 'Embudo de producto, objetivos SMART y retorno en comisiones que quedan en Tigre.', 'Panel de Marina'],
  ] },
  { id: 'm4', mod: 'Módulo 4', titulo: 'UX/UI', items: [
    ['Onboarding', 'Tres pantallas la primera vez que entra Lucía: credencial, compras y puntos.', 'Entrar como Lucía'],
    ['Visibilidad del estado (Nielsen)', 'El pedido muestra en qué paso está; el reclamo, su línea de tiempo.', 'Mis pedidos y reclamos'],
    ['Prevención de errores', 'Confirmaciones antes de rechazar, cancelar o canjear; validación del código de retiro.', 'Panel de Rosa'],
    ['Accesibilidad (POUR)', 'Modo de letra grande y alto contraste; textos claros; íconos con texto.', 'Credencial › Mis datos'],
    ['Ley de Hick y arquitectura de la información', 'Cinco secciones fijas en la barra de abajo y accesos directos agrupados.', 'Barra inferior'],
    ['Recuperarse de errores (Nielsen 9)', 'Si algo sale mal con una compra, el vecino lo reporta y ve en qué etapa está la solución.', 'Mis pedidos › Tuve un problema'],
    ['Pruebas de usabilidad', 'Plan: 5 usuarios por perfil, think aloud y tareas del recorrido guiado.', 'Recorrido guiado'],
  ] },
  { id: 'm5', mod: 'Módulo 5', titulo: 'Gestión de productos', items: [
    ['Product Vision Board', 'Visión: que el ahorro y la venta se queden en Tigre. Grupo: vecinos y comercios. Necesidad: comprar y resolver sin intermediarios.', 'Presentación'],
    ['Explore / Exploit', 'Explore: delivery y Tigri con IA. Exploit: takeaway, beneficios y trámites que ya funcionan.', 'Roadmap'],
    ['Product-Market Fit', 'Se mide con retención, NPS y uso recurrente en el piloto.', 'Encuesta NPS y embudo'],
    ['Growth hacking: gamificación', 'Puntos Tigre con niveles y canjes.', 'Puntos Tigre'],
    ['Growth hacking: escasez y descuentos', 'Ofertas flash de 2 horas que lanza el comercio.', 'Panel de Rosa › Productos'],
    ['Satisfacción y retención', 'Reclamos de compras cada 100 pedidos y porcentaje resuelto sin mediación: un reclamo bien resuelto retiene al cliente.', 'Panel de Marina'],
    ['Growth hacking: referidos', 'Invitá a un vecino y suman 50 puntos cada uno.', 'Puntos Tigre'],
  ] },
];

function vMetodo() {
  const m = METODO.find((x) => x.id === S.metodoTab) || METODO[0];
  return `<main class="main metodo">
    <button class="volver" data-a="cerrarMetodo">‹ Volver</button>
    <h1 class="titulo">Cómo lo diseñamos</h1>
    <p class="muted sub">Cada contenido de la Diplomatura en Negocios Digitales e Innovación, y dónde se ve dentro de la app.</p>
    <div class="diamante"><div><b>Espacio del problema</b><span>Empatizar · Definir</span></div><div><b>Espacio de la solución</b><span>Idear · Prototipar · Testear</span></div></div>
    <div class="seg metodo-tabs">${METODO.map((x) => `<button class="${x.id === m.id ? 'on' : ''}" data-a="metodoTab" data-v="${x.id}">${x.mod.replace('Módulo ', 'M')}</button>`).join('')}</div>
    <h2>${m.mod} · ${m.titulo}</h2>
    <div class="lista">${m.items.map(([t, d, d2]) => `<div class="fila metodo-item"><div><b>${t}</b><p class="muted">${d}</p><span class="tag-mini app">Dónde verlo: ${d2}</span></div></div>`).join('')}</div>
    <button class="btn grande" data-a="tourIniciar">▶ Verlo en el recorrido guiado</button>
  </main>`;
}

// ---------- recorrido guiado ----------
const TOUR = [
  { perfil: null, titulo: 'Una plataforma, cuatro personas', texto: 'Vas a ver cómo una compra y un reclamo pasan por la vecina, el comercio y el municipio. Tocá "Siguiente" para avanzar.' },
  { perfil: 'lucia', titulo: 'Lucía arma su pedido', texto: 'Pide sorrentinos en Pastas Doña Rosa. El 30% de descuento Soy Tigre se aplica solo y además suma Puntos Tigre.',
    prep() { S.tab = 'comprar'; S.comprarTab = 'comercios'; S.abierto = 'c2'; S.carrito = { cid: 'c2', items: { c2p0: 2, c2p3: 1 } }; S.sheet = 'checkout'; S.retiro = 0; },
    accion() { const t = totalesCarrito(); S.tour.pedido = crearPedido(t, horariosRetiro(t.c.prep)[0].txt.replace(/Lo antes posible \((.*)\)/, '$1')).id; } },
  { perfil: 'lucia', titulo: 'El pedido sale al local', texto: 'Lucía ve en qué paso está su pedido y el código para retirarlo. No pagó comisión de delivery ni de app.',
    prep() { S.tab = 'comprar'; S.comprarTab = 'pedidos'; S.sheet = null; } },
  { perfil: 'rosa', titulo: 'Rosa lo recibe en su panel', texto: 'En "Pastas Doña Rosa" entra el pedido nuevo, ya pagado y con el descuento incluido. Lo prepara y lo marca listo.',
    prep() { S.panelTab = 'pedidos'; },
    accion() { const p = S.pedidos.find((x) => x.id === S.tour.pedido); if (p && p.estado === 'recibido') { ACT.avanzar(p.id); ACT.avanzar(p.id); } } },
  { perfil: 'lucia', titulo: 'Aviso: ¡está listo!', texto: 'A Lucía le llega la notificación. Va al local y muestra su código de retiro.',
    prep() { S.tab = 'comprar'; S.comprarTab = 'pedidos'; S.sheet = 'notifs'; S.notifs.forEach((n) => { n.leida = true; }); } },
  { perfil: 'rosa', titulo: 'Rosa entrega con el código', texto: 'Rosa valida el código de Lucía y entrega el pedido. La venta queda registrada sin intermediarios.',
    prep() { S.panelTab = 'pedidos'; },
    accion() { const p = S.pedidos.find((x) => x.id === S.tour.pedido); if (p && p.estado !== 'retirado') { p.estado = 'retirado'; S.npsPendiente = p.id; notificar(p, 'Retiraste tu pedido. ¡Gracias por comprar en el barrio!', '🎉'); } } },
  { perfil: 'lucia', titulo: 'Lucía reporta un bache', texto: 'Volviendo a casa ve un pozo. Lo reporta con la dirección y el lugar exacto en el mapa (también puede sumar una foto).',
    prep() { S.tab = 'servicios'; S.servTab = 'reclamos'; S.sheet = null; S.recForm = { tipo: 'bacheo', loc: 'Tigre Centro', dir: 'Mitre 120', texto: 'Pozo grande en la esquina, ya se cayó una moto.', foto: null, pos: null }; },
    accion() { ACT.enviarReclamo(); S.tour.reclamo = S.reclamos[S.reclamos.length - 1].id; } },
  { perfil: 'carlos', titulo: 'Carlos lo ve en el mapa', texto: 'En Atención al Vecino el reclamo aparece en el mapa y en la lista, marcado "desde la app". Lo asigna a una cuadrilla y lo resuelve.',
    accion() { const r = S.reclamos.find((x) => x.id === S.tour.reclamo); while (r && r.estado !== 'resuelto') ACT.avanzarReclamo(r.id); } },
  { perfil: 'lucia', titulo: 'Resuelto, y con premio', texto: 'Lucía recibe el aviso de que se resolvió y suma 100 Puntos Tigre, que puede canjear por cupones o un descuento en la tasa.',
    prep() { S.tab = 'credencial'; S.sub = 'puntos'; S.sheet = null; S.notifs.forEach((n) => { n.leida = true; }); } },
  { perfil: 'marina', titulo: 'Marina mide el impacto', texto: 'En Desarrollo Económico se ven las ventas en comercios locales, las comisiones que quedaron en Tigre y el ahorro de los vecinos. Fin del recorrido.' },
];

function tourCard() {
  if (!S.tour) return '';
  const i = S.tour.paso, st = TOUR[i], perf = PERFILES.find((x) => x.id === st.perfil);
  const ultimo = i === TOUR.length - 1;
  return `<div class="tour" role="dialog" aria-label="Recorrido guiado">
    <div class="tour-cab">${perf ? avatarHtml(perf) : '<span class="tg-avatar chico">${tigriSvg()}</span>'}<div class="grow"><small>Paso ${i + 1} de ${TOUR.length}${perf ? ` · ${perf.nombre}, ${perf.rol}` : ''}</small><b>${st.titulo}</b></div><button class="cerrar-tour" data-a="tourSalir" aria-label="Salir del recorrido">✕</button></div>
    <p>${st.texto}</p>
    <div class="tour-barra"><i style="width:${((i + 1) / TOUR.length) * 100}%"></i></div>
    <button class="btn" data-a="tourSig">${ultimo ? 'Terminar ✓' : 'Siguiente ▶'}</button>
  </div>`;
}

function irPaso(i) {
  S.tour.paso = i;
  const st = TOUR[i];
  S.sub = null; S.abierto = null; S.sheet = null;
  S.perfil = st.perfil;
  if (st.prep) st.prep();
  window.scrollTo(0, 0);
}

// "Mientras tanto": qué cambió para el perfil al que entrás.
function mientrasTanto(id) {
  if (id === 'lucia') { const n = S.notifs.filter((x) => !x.leida); return n.length ? `${n[n.length - 1].emoji} ${n[n.length - 1].txt}` : ''; }
  if (id === 'rosa') { const n = S.pedidos.filter((p) => p.cid === 'c2' && p.estado === 'recibido').length; const r = (S.reclamosPed || []).filter((x) => x.cid === 'c2' && estadoRP(x) === 'abierto').length; return n || r ? `Mientras tanto: ${n ? plural(n, 'pedido nuevo', 'pedidos nuevos') : ''}${n && r ? ' y ' : ''}${r ? plural(r, 'reclamo para responder', 'reclamos para responder') : ''}.` : ''; }
  if (id === 'carlos') { const m = (S.reclamosPed || []).filter((x) => estadoRP(x) === 'mediacion').length; if (m) return `Mientras tanto: ${plural(m, 'caso de compra espera', 'casos de compras esperan')} mediación.`; const n = S.reclamos.filter((r) => r.mio && r.estado === 'recibido').length; return n ? `📣 Mientras tanto: entró ${plural(n, 'reclamo nuevo', 'reclamos nuevos')} desde la app.` : ''; }
  return '';
}

// ---------- acciones ----------
const ACT = {
  perfil(v) {
    S.perfil = v; S.sheet = null; S.sub = null; S.abierto = null; S.tab = 'inicio'; S.panelTab = 'pedidos';
    if (v === 'lucia' && !S.chat.length) S.chat.push({ de: 'tg', html: saludo(), acciones: [] });
    if (v === 'lucia' && !S.onboard && !S.tour) { S.sheet = 'onboarding'; S.onbPaso = 0; }
    const msg = mientrasTanto(v) || `👋 Entraste como ${PERFILES.find((x) => x.id === v).nombre}.`;
    setTimeout(() => toast(msg), 150);
    window.scrollTo(0, 0);
  },
  fbNota(v) { S.fb = S.fb || { nota: 0, texto: '', nombre: '' }; S.fb.nota = Number(v); },
  fbOtra() { S.fbOtra = true; S.fb = { nota: 0, texto: '', nombre: (fbEstado() || {}).nombre || '' }; },
  fbEnviar() {
    const f = S.fb || { nota: 0, texto: '', nombre: '' };
    if (!f.nota) { toast('Elegí de 1 a 5 tigres.'); return false; }
    if (!f.nombre.trim()) { toast('Escribí tu nombre para enviar la opinión.'); return false; }
    const dato = { nota: f.nota, comentario: f.texto.trim().slice(0, 500) || null, nombre: f.nombre.trim().slice(0, 60), pagina: location.pathname };
    S.fbEnviando = true; render();
    fbMandar(dato).then(() => {
      try { localStorage.setItem('soytigreya-feedback', JSON.stringify({ ...dato, t: Date.now() })); } catch (e) { /* sin almacenamiento */ }
      S.fb = null; S.fbOtra = false; S.fbEnviando = false; render(); toast('¡Gracias! Tu opinión llegó.');
    }).catch(() => { S.fbEnviando = false; render(); toast('No se pudo enviar. Revisá tu conexión y probá de nuevo.'); });
    return false;
  },
  rpAbrir(pid) { S.rpForm = { pid, motivo: 'falta', texto: '', foto: null }; S.sheet = 'rp'; },
  rpMotivo(v) { S.rpForm.motivo = v; },
  rpEnviar() {
    const f = S.rpForm, p = S.pedidos.find((x) => x.id === f.pid);
    const id = 'RC' + (101 + (S.reclamosPed || []).length + Math.floor(Math.random() * 800));
    S.reclamosPed = S.reclamosPed || [];
    S.reclamosPed.push({ id, pid: p.id, cid: p.cid, motivo: f.motivo, texto: f.texto.trim(), foto: f.foto, creado: Date.now(), estado: 'abierto', mio: true, historial: [{ t: Date.now(), txt: 'Reclamo enviado al comercio' }] });
    S.rpForm = null; S.sheet = null;
    toast(`Tu reclamo ${id} llegó a ${comercio(p.cid).nombre}. Tiene 24 horas para responder.`);
  },
  rpProponer(v) {
    const [id, tipo] = v.split('|'); const r = S.reclamosPed.find((x) => x.id === id); const p = S.pedidos.find((x) => x.id === r.pid);
    let monto = tipo === 'total' ? p.total : 0;
    if (tipo === 'parcial') { monto = Number(($('#rpm-' + id) || {}).value); if (!(monto > 0 && monto <= p.total)) { toast(`Poné un monto entre $1 y ${plata(p.total)}.`); return false; } }
    r.propuesta = { tipo, monto }; r.estado = 'respondido';
    r.historial.push({ t: Date.now(), txt: `El comercio propuso ${propuestaTxt(r)}` });
    notificar(r, `${comercio(r.cid).nombre} respondió tu reclamo: propone ${propuestaTxt(r)}`, '🧾');
    if (!r.mio) { r.estado = 'resuelto'; r.historial.push({ t: Date.now(), txt: `El vecino aceptó: ${propuestaTxt(r)}` }); }
    toast(r.mio ? 'Propuesta enviada al vecino.' : 'Propuesta enviada. El vecino la aceptó.');
  },
  rpAceptar(id) {
    const r = S.reclamosPed.find((x) => x.id === id); const p = S.pedidos.find((x) => x.id === r.pid);
    r.estado = 'resuelto';
    const txt = r.propuesta.tipo === 'reponer' ? 'Aceptaste: el comercio repone el producto en tu próximo retiro.' : `Aceptaste: te devolvimos ${plata(r.propuesta.monto)} por ${PAGOS.find((x) => x.id === p.pago).nombre}.`;
    r.historial.push({ t: Date.now(), txt }); toast(txt);
  },
  rpRechazar(id) {
    if (!confirm('¿No aceptás la propuesta? El caso pasa a la oficina de defensa del consumidor del municipio.')) return false;
    const r = S.reclamosPed.find((x) => x.id === id); r.estado = 'mediacion';
    r.historial.push({ t: Date.now(), txt: 'No aceptaste la propuesta: pasó a mediación del municipio' });
    toast('Tu caso pasó a mediación del municipio.');
  },
  rpMediar(v) {
    const [id, fav] = v.split('|'); const r = S.reclamosPed.find((x) => x.id === id); const p = S.pedidos.find((x) => x.id === r.pid);
    r.estado = 'cerrado'; r.fallo = fav;
    const txt = fav === 'vecino' ? `Mediación: el municipio resolvió devolverte ${plata(p.total)}.` : 'Mediación: el municipio resolvió a favor del comercio.';
    r.historial.push({ t: Date.now(), txt }); notificar(r, txt, '🤝'); toast('Caso cerrado. Se avisó al vecino y al comercio.');
  },
  metodo() { S.metodo = true; S.metodoTab = S.metodoTab || 'm1'; window.scrollTo(0, 0); },
  metodoTab(v) { S.metodoTab = v; },
  cerrarMetodo() { S.metodo = false; window.scrollTo(0, 0); },
  onbSig() { if ((S.onbPaso || 0) >= 2) { S.onboard = true; S.sheet = null; } else S.onbPaso = (S.onbPaso || 0) + 1; },
  onbFin() { S.onboard = true; S.sheet = null; },
  nps(v) { S.encuestas = S.encuestas || []; S.encuestas.push({ nota: Number(v), t: Date.now() }); S.npsPendiente = null; sumarPuntos(20, 'Respondiste la encuesta', '⭐'); toast('Gracias. Tu opinión mejora la app y sumaste 20 puntos.'); },
  npsCerrar() { S.npsPendiente = null; },
  flash() { const c = comercio(S.panelCid); c.flash = { extra: 15, hasta: Date.now() + 2 * 36e5 }; toast('Oferta flash lanzada por 2 horas.'); },
  finFlash() { const c = comercio(S.panelCid); c.flash = null; },
  invitar() {
    const txt = `Sumate a SoyTigreYa con mi código ${S.usuario.nro.replace('ST-', 'TIGRE-')}: https://mila-ops-ia.github.io/soytigreya`;
    if (navigator.share) navigator.share({ title: 'SoyTigreYa', text: txt }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast('Invitación copiada.')).catch(() => {});
    return false;
  },
  cambiarPerfil() { S.perfil = null; S.tour = null; S.sheet = null; S.sub = null; window.scrollTo(0, 0); },
  tourIniciar() { S.tour = { paso: 0 }; irPaso(0); },
  tourSig() {
    const st = TOUR[S.tour.paso];
    if (st.accion) st.accion();
    if (S.tour.paso >= TOUR.length - 1) { S.tour = null; S.perfil = null; setTimeout(() => toast('✅ Recorrido terminado. Ahora podés entrar con cualquier perfil.'), 100); return; }
    irPaso(S.tour.paso + 1);
  },
  tourSalir() { S.tour = null; S.sheet = null; },
  saludTab(v) { S.saludTab = v; },
  saludEsp(v) { S.salud.esp = v; S.salud.centro = null; S.salud.hora = null; },
  saludCentro(v) { S.salud.centro = v; },
  saludDia(v) { S.salud.dia = +v; },
  saludHora(v) { S.salud.hora = v; },
  saludConfirmar() {
    const H = S.salud; const c = CENTROS_SALUD.find((x) => x.id === H.centro);
    const d = new Date(Date.now() + (H.dia + 1) * 864e5);
    H.mios.push({ esp: H.esp, centro: `${c.nombre} · ${c.loc}`, cuando: `${d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}, ${H.hora}` });
    notificar({ mio: true }, `Turno confirmado: ${H.esp} en ${c.nombre}.`, '🏥');
    S.salud = { esp: null, centro: null, dia: 0, hora: null, mios: H.mios }; S.saludTab = 'mios';
    toast('Turno confirmado. Te recordamos un día antes.');
  },
  saludCancelar(v) { S.salud.mios.splice(+v, 1); toast('Cancelaste el turno. Liberaste el lugar para otro vecino.'); },
  trabTab(v) { S.trabTab = v; window.scrollTo(0, 0); },
  empRubro(v) { S.empRubro = v; },
  cursoArea(v) { S.cursoArea = v; },
  cvListo() { S.empleo.cv = true; S.trabTab = 'empleos'; toast('¡Listo! Tu CV quedó guardado. Ya podés postularte con un toque.'); },
  postular(v) {
    if (!S.empleo.cv) { S.trabTab = 'cv'; toast('Primero confirmá tu CV. Es un solo paso.'); return; }
    S.empleo.post[v] = 0;
    const e = EMPLEOS.find((x) => x.id === v);
    toast(`Te postulaste a ${e.puesto} en ${e.empresa}. Te avisamos cuando la vean.`);
    setTimeout(() => { if (S.empleo.post[v] === 0) { S.empleo.post[v] = 1; notificar({ mio: true }, `${e.empresa} vio tu postulación a ${e.puesto}.`, '💼'); render(); } }, 6000);
  },
  cursoTurno(v) {
    const c = CURSOS.find((x) => x.id === v);
    const d = new Date(Date.now() + 5 * 864e5);
    S.empleo.cursos[v] = `${d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })} 10:30`;
    toast(`Pediste entrevista de admisión para ${c.nombre}. Llevá tu DNI.`);
  },
  depTab(v) { S.depTab = v; },
  depDisc(v) { S.depDisc = v; },
  inscribir(v) {
    if (!S.inscrip) S.inscrip = [];
    if (S.inscrip.includes(v)) return;
    S.inscrip.push(v);
    sumarPuntos(30, v === 'colonia' ? 'Inscripción a la colonia de verano' : 'Inscripción a ' + (ACTIVIDADES.find((a) => a.id === v) || {}).disc);
    toast(v === 'colonia' ? 'Inscripción enviada. Te avisamos cuando se confirme el cupo. Sumaste 30 puntos.' : '¡Listo! Quedaste anotada. Sumaste 30 Puntos Tigre.');
  },
  desinscribir(v) { S.inscrip = (S.inscrip || []).filter((x) => x !== v); toast('Cancelaste la inscripción.'); },
  buscando() { S.buscando = !S.buscando; if (!S.buscando) S.busca = ''; setTimeout(() => { const b = document.querySelector('.buscar'); if (b) b.focus(); }, 30); },
  miUbic() {
    if (!navigator.geolocation) { toast('Tu navegador no permite usar la ubicación. Tocá el mapa para elegir un punto.'); return false; }
    toast('Buscando tu ubicación…');
    navigator.geolocation.getCurrentPosition((p) => {
      const pos = [p.coords.latitude, p.coords.longitude];
      const enTigre = pos[0] > -34.56 && pos[0] < -34.2 && pos[1] > -58.82 && pos[1] < -58.45;
      UBIC = { pos, tipo: 'gps' };
      toast(enTigre ? 'Listo: te mostramos primero lo más cercano a vos.' : 'Estás fuera de Tigre: ordenamos igual por distancia desde donde estás.');
      render();
    }, () => toast('No pudimos obtener tu ubicación. Revisá el permiso del navegador o tocá el mapa.'), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    return false;
  },
  ubicReset() { UBIC = null; },
  cercaTodos(v) { S.cercaTodos = v; },
  zonaEstac(v) { S.estac.zona = v; toast('Elegiste ' + ZONAS_ESTAC.find((z) => z.id === v).nombre + '. Confirmá la patente y empezá.'); setTimeout(() => { const b = document.querySelector('[data-a=iniEstac]'); if (b) b.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60); },
  planToggle() { const c = comercio(perfilActual().cid); c.destacado = !c.destacado; toast(c.destacado ? 'Plan Destacado activo: tu local aparece primero para los vecinos.' : 'Cancelaste el Plan Destacado. Seguís vendiendo con 0% de comisión.'); },
  letra() { S.letra = !S.letra; },
  voltear(v, el) { el.classList.toggle('dada'); return false; },
  tab(v) { S.tab = v; S.abierto = null; S.sub = null; S.sheet = null; window.scrollTo(0, 0); },
  sub(v) { S.sub = v; S.sheet = null; window.scrollTo(0, 0); },
  cerrarSub() { S.sub = null; },
  cat(v) { S.tab = 'comprar'; S.comprarTab = 'comercios'; S.abierto = null; S.sub = null; S.sheet = null; S.filtro.cat = v; window.scrollTo(0, 0); },
  comprarTab(v) { S.comprarTab = v; },
  verPedidos() { S.tab = 'comprar'; S.comprarTab = 'pedidos'; S.abierto = null; S.sub = null; S.sheet = null; window.scrollTo(0, 0); },
  serv(v) { S.tab = 'servicios'; S.servTab = v; S.sub = null; S.sheet = null; window.scrollTo(0, 0); },
  abrir(v) { S.tab = 'comprar'; S.comprarTab = 'comercios'; S.abierto = v; S.sub = null; S.sheet = null; window.scrollTo(0, 0); },
  cerrarComercio() { S.abierto = null; },
  benefVista(v) { S.benef.vista = v; },
  benefRubro(v) { S.tab = 'beneficios'; S.sub = null; S.sheet = null; S.benef.rubro = v; },
  benefMapa() { S.tab = 'beneficios'; S.sub = null; S.sheet = null; S.benef.vista = 'mapa'; },
  verBenef(v) { S.benefSel = Number(v); S.sheet = 'benef'; },
  verBenefNom(v) { const i = BENEFICIOS.findIndex((b) => b.nombre === v); if (i >= 0) { S.benefSel = i; S.sheet = 'benef'; } },
  mas(pid) {
    const c = S.comercios.find((x) => x.productos.some((p) => p.id === pid));
    if (S.carrito && S.carrito.cid !== c.id) {
      if (!confirm(`Ya tenés un pedido en ${comercio(S.carrito.cid).nombre}. ¿Lo descartamos y empezamos uno nuevo?`)) return false;
      S.carrito = null;
    }
    if (!S.carrito) S.carrito = { cid: c.id, items: {} };
    S.carrito.items[pid] = (S.carrito.items[pid] || 0) + 1;
  },
  menos(pid) {
    if (!S.carrito) return;
    S.carrito.items[pid] = (S.carrito.items[pid] || 0) - 1;
    if (S.carrito.items[pid] <= 0) delete S.carrito.items[pid];
    if (!Object.keys(S.carrito.items).length) { S.carrito = null; if (S.sheet === 'checkout') S.sheet = null; }
  },
  sheet(v) { S.sheet = v; S.retiro = 0; if (v === 'tigri') S.tigriVisto = true; if (v === 'tigri' && !S.chat.length) S.chat.push({ de: 'tg', html: saludo(), acciones: [] }); },
  cerrarSheet() { if (S.sheet !== 'pagando') S.sheet = null; },
  retiro(v) { S.retiro = Number(v); },
  pago(v) { S.pago = v; },
  pagar() {
    const t = totalesCarrito();
    const retiro = horarios(t.c)[S.retiro].txt.replace(/Lo antes posible \((.*)\)/, '$1');
    procesando(S.pago === 'efectivo' ? 'Enviando tu pedido…' : `Procesando el pago con ${PAGOS.find((p) => p.id === S.pago).nombre}…`, () => crearPedido(t, retiro));
  },
  // cobros municipales
  cobrar(v) {
    if (v === 'tasas') {
      const pend = S.tasas.filter((t) => !t.pagada);
      const bruto = pend.reduce((a, t) => a + t.monto, 0);
      const desc = S.puntos.descTasa ? Math.min(3000, Math.round(pend[0].monto * 0.1)) : 0;
      const aTiempo = pend.filter((t) => t.vence >= Date.now()).length;
      const pts = aTiempo * PUNTOS.tasaATiempo + (pend.length - aTiempo) * PUNTOS.tasaVencida;
      S.cobro = { tipo: 'tasas', pts, usoDesc: !!desc, concepto: 'Tasas municipales', detalle: [...pend.map((t) => [t.periodo, plata(t.monto)]), ...(desc ? [['🎁 Canje Puntos Tigre (10%)', '-' + plata(desc)]] : []), ['⭐ Puntos que sumás', String(pts)]], monto: bruto - desc };
    } else if (v === 'multas') {
      const pend = S.multas.filter((m) => !m.pagada && m.patente === (S.multaBusca || S.usuario.patente).toUpperCase());
      S.cobro = { tipo: 'multas', ids: pend.map((m) => m.id), concepto: 'Multas de tránsito', detalle: pend.map((m) => [`Acta ${m.id} (50% off)`, plata(m.monto / 2)]), monto: pend.reduce((a, m) => a + m.monto / 2, 0) };
    } else if (v.startsWith('saldo-')) {
      const m = Number(v.slice(6));
      S.cobro = { tipo: 'saldo', concepto: 'Carga de saldo de estacionamiento', detalle: [['Saldo actual', plata(S.estac.saldo)]], monto: m };
    }
    S.sheet = 'cobro';
  },
  confirmarCobro() {
    const c = S.cobro;
    procesando(`Procesando el pago con ${PAGOS.find((p) => p.id === S.pago).nombre}…`, () => {
      if (c.tipo === 'tasas') {
        S.tasas.forEach((t) => { t.pagada = true; });
        if (c.usoDesc) S.puntos.descTasa = 0;
        sumarPuntos(c.pts, 'Pago de tasas municipales', '🧾');
      }
      if (c.tipo === 'multas') S.multas.forEach((m) => { if (c.ids.includes(m.id)) m.pagada = true; });
      if (c.tipo === 'saldo') S.estac.saldo += c.monto;
      S.pagosApp++;
      S.comprobante = { monto: c.monto, concepto: c.concepto, pago: S.pago, t: Date.now(), nro: String(Date.now()).slice(-8) };
      S.cobro = null; S.sheet = 'comprobante';
    });
  },
  buscarMulta() { S.multaBusca = ($('[data-f="multaBusca"]').value || '').toUpperCase().replace(/\s/g, ''); },
  iniEstac() {
    const z = ZONAS_ESTAC.find((x) => x.id === S.estac.zona);
    if (S.estac.saldo < z.tarifa / 2) { toast('No te alcanza el saldo. Cargá un poco antes de empezar.'); return false; }
    S.estac.activo = { zona: z.id, patente: S.usuario.patente, inicio: Date.now() };
    toast(`🚗 Listo, estás estacionado en ${z.nombre}.`);
  },
  finEstac() {
    const { min, costo } = costoEstac();
    S.estac.historial.push({ zona: S.estac.activo.zona, inicio: S.estac.activo.inicio, minutos: min, costo });
    S.estac.saldo -= costo; S.estac.activo = null; S.pagosApp++;
    toast(`Terminaste: ${min} min, ${plata(costo)}.`);
  },
  enviarAlerta(v) {
    if (!confirm(`¿Enviar una alerta de "${v}" con tu ubicación?`)) return false;
    S.alerta = { tipo: v, t: Date.now(), demora: 4 + Math.floor(Math.random() * 6) };
  },
  cancelarAlerta() { S.alerta = null; toast('Alerta cancelada.'); },
  notifs() { S.sheet = 'notifs'; S.notifs.forEach((n) => { n.leida = true; }); },
  tramite(v) { S.turnoForm.tramite = v; S.turnoForm.hora = null; },
  irTurno(v) { S.tab = 'servicios'; S.servTab = 'turnos'; S.sub = null; S.sheet = null; S.turnoForm.tramite = v; S.turnoForm.hora = null; window.scrollTo(0, 0); },
  dia(v) { S.turnoForm.dia = Number(v); S.turnoForm.hora = null; },
  horaTurno(v) { S.turnoForm.hora = v; },
  pedirTurno() {
    const f = S.turnoForm;
    const d = diasHabiles()[f.dia];
    S.turnos.push({ id: 'T' + Date.now(), tramite: f.tramite, cuando: d.getTime(), hora: f.hora });
    S.turnoForm.hora = null;
    toast('📅 Turno confirmado. Te avisamos un día antes.');
  },
  cancelarTurno(v) { if (!confirm('¿Cancelar este turno?')) return false; S.turnos = S.turnos.filter((t) => t.id !== v); },
  recTipo(v) { S.recForm.tipo = v; },
  irReclamo(v) { S.tab = 'servicios'; S.servTab = 'reclamos'; S.sub = null; S.sheet = null; S.recForm.tipo = v; window.scrollTo(0, 0); },
  quitarFoto() { S.recForm.foto = null; },
  miUbicacion() {
    if (!navigator.geolocation) { toast('Tu navegador no comparte la ubicación.'); return false; }
    navigator.geolocation.getCurrentPosition(
      (p) => { S.recForm.pos = [p.coords.latitude, p.coords.longitude]; render(); toast('📍 Ubicación marcada.'); },
      () => toast('No pude obtener tu ubicación. Mové el pin a mano.'),
      { timeout: 8000 },
    );
    return false;
  },
  enviarReclamo() {
    const f = S.recForm;
    if (!f.dir.trim()) { toast('Poné la dirección para que la cuadrilla sepa dónde ir.'); return false; }
    const id = 'R' + (Math.max(...S.reclamos.map((r) => Number(r.id.slice(1)))) + 1);
    const t = Date.now();
    S.reclamos.push({ id, tipo: f.tipo, loc: f.loc, dir: f.dir.trim(), texto: f.texto.trim(), foto: f.foto, pos: f.pos || LOC_COORDS[f.loc], estado: 'recibido', historial: [{ estado: 'recibido', t }], creado: t, mio: true });
    S.recForm = { tipo: f.tipo, loc: f.loc, dir: '', texto: '', foto: null, pos: null };
    toast(`📣 Reclamo N.º ${id} enviado. Te avisamos cada avance.`);
  },
  // comercio
  panelTab(v) { S.panelTab = v; },
  toggleAbierto() { const c = comercio(S.panelCid); c.abierto = !c.abierto; },
  avanzar(id) {
    const p = S.pedidos.find((x) => x.id === id);
    const c = comercio(p.cid);
    p.estado = ESTADOS[ESTADOS.indexOf(p.estado) + 1];
    if (p.estado === 'preparacion') notificar(p, `${c.nombre} está preparando tu pedido`, '👩‍🍳');
    if (p.estado === 'listo') notificar(p, `Tu pedido de ${c.nombre} está listo para retirar`, '✅');
  },
  rechazar(id) {
    if (!confirm('¿Rechazar este pedido? Se le avisa al vecino y se le devuelve el pago.')) return false;
    const p = S.pedidos.find((x) => x.id === id);
    p.estado = 'rechazado';
    notificar(p, `${comercio(p.cid).nombre} no pudo tomar tu pedido. Te devolvemos el pago.`, '⚠️');
  },
  entregar(id) {
    const p = S.pedidos.find((x) => x.id === id);
    const cod = $('#cod-' + id).value.trim();
    if (cod !== p.codigo) { toast('❌ El código no coincide. Pedíselo al vecino.'); return false; }
    p.estado = 'retirado';
    notificar(p, 'Retiraste tu pedido. ¡Gracias por comprar en el barrio!', '🎉');
    if (p.mio) S.npsPendiente = p.id;
    toast('✅ Pedido entregado.');
  },
  toggleProd(pid) { const p = comercio(S.panelCid).productos.find((x) => x.id === pid); p.disponible = !p.disponible; },
  agregarProd() {
    const nombre = $('#npNombre').value.trim(), precio = Number($('#npPrecio').value), emoji = $('#npEmoji').value.trim() || '🍽️';
    if (!nombre || !(precio > 0)) { toast('Completá el nombre y el precio.'); return false; }
    const c = comercio(S.panelCid);
    c.productos.push({ id: c.id + 'p' + Date.now(), nombre, precio, emoji, desc: '', disponible: true });
    toast('📦 Producto agregado al catálogo.');
  },
  // municipio
  avanzarReclamo(id) {
    const r = S.reclamos.find((x) => x.id === id);
    const sig = ESTADOS_RECLAMO[ESTADOS_RECLAMO.indexOf(r.estado) + 1];
    if (!sig) return false;
    r.estado = sig; r.historial.push({ estado: sig, t: Date.now() });
    const t = TIPOS_RECLAMO.find((x) => x.id === r.tipo);
    if (sig === 'resuelto' && r.mio) sumarPuntos(PUNTOS.reclamoResuelto, `Reclamo ${r.id} resuelto`, '📣');
    notificar(r, `Tu reclamo de ${t.nombre.toLowerCase()} N.º ${r.id}: ${RECLAMO_TXT[sig].toLowerCase()}`, sig === 'resuelto' ? '✅' : '🛠️');
  },
  // Tigri
  chatSug(v) { chatEnviar(v); return false; },
  // Puntos Tigre
  toggleCupon() { S.noUsarCupon = !S.noUsarCupon; },
  canjear(id) {
    const c = CANJES.find((x) => x.id === id);
    if (S.puntos.saldo < c.costo) { toast(`Te faltan ${c.costo - S.puntos.saldo} puntos para este canje.`); return false; }
    if (id === 'tasa' && S.puntos.descTasa) { toast('Ya tenés un descuento de tasa esperando tu próximo pago.'); return false; }
    if (!confirm(`¿Canjear ${c.costo} puntos por: ${c.txt}?`)) return false;
    S.puntos.saldo -= c.costo; S.puntos.canjeados += c.costo;
    S.puntos.historial.push({ t: Date.now(), txt: `Canje: ${c.txt}`, pts: -c.costo, emoji: c.emoji });
    if (id === 'estac') { S.estac.saldo += 1500; toast('🚗 Sumamos $1.500 a tu saldo de estacionamiento.'); }
    else if (id === 'tasa') { S.puntos.descTasa = 1; toast('🧾 Listo: el 10% se descuenta en tu próximo pago de tasas.'); }
    else {
      const codigo = 'PT-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      S.puntos.cupones.push({ tipo: id, txt: c.txt, codigo, t: Date.now() });
      toast(id === 'cupon' ? '🎟️ Cupón listo: se aplica en tu próximo pedido.' : `🎪 Tu código de entrada es ${codigo}.`);
    }
  },
  reciclar(v) {
    const pts = sumarPuntos(PUNTOS.reciclar, `Reciclaje en ${v}`, '♻️');
    S.reciclado = { lugar: v, t: Date.now() };
    toast(`♻️ ¡Gracias por reciclar! Sumaste ⭐ ${pts} puntos.`);
  },
  reiniciar() { if (!confirm('¿Volver a los datos iniciales de la demo?')) return false; S = seed(); },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.a];
  if (!fn) return;
  e.preventDefault();
  if (fn(el.dataset.v, el) !== false) render();
});

document.addEventListener('submit', (e) => {
  if (e.target.dataset.form === 'chat') {
    e.preventDefault();
    const inp = $('#chatIn');
    const v = inp.value; inp.value = '';
    chatEnviar(v);
  }
});

document.addEventListener('input', (e) => {
  const f = e.target.dataset.f;
  if (f === 'q') { S.filtro.q = e.target.value; $('#lista').innerHTML = listaComercios(); save(); }
  if (f === 'busca') { S.busca = e.target.value; $('#resBusca').innerHTML = resultadosBusca(); save(); }
  if (f === 'nombre') { S.usuario.nombre = e.target.value; save(); }
  if (f === 'recDir') { S.recForm.dir = e.target.value; save(); }
  if (f === 'recTxt') { S.recForm.texto = e.target.value; save(); }
  if (f === 'rpTxt' && S.rpForm) { S.rpForm.texto = e.target.value; save(); }
  if (f === 'fbTxt' || f === 'fbNombre') { S.fb = S.fb || { nota: 0, texto: '', nombre: '' }; S.fb[f === 'fbTxt' ? 'texto' : 'nombre'] = e.target.value; save(); }
  if (f === 'patente') { S.usuario.patente = e.target.value.toUpperCase().replace(/\s/g, ''); save(); }
});

document.addEventListener('change', (e) => {
  const el = e.target, f = el.dataset.f;
  if (!f) return;
  if (f === 'loc') S.filtro.loc = el.value;
  else if (f === 'uloc') S.usuario.loc = el.value;
  else if (f === 'panelCid') S.panelCid = el.value;
  else if (f === 'descComercio') comercio(S.panelCid).desc = Number(el.value);
  else if (f === 'prepComercio') comercio(S.panelCid).prep = Number(el.value);
  else if (f === 'recLoc') { S.recForm.loc = el.value; S.recForm.pos = null; }
  else if (f === 'zona') S.estac.zona = el.value;
  else if (f === 'parada') S.parada = el.value;
  else if (f === 'rpFoto') { if (el.files && el.files[0]) achicarFoto(el.files[0], (url) => { S.rpForm.foto = url; render(); }); return; }
  else if (f === 'recFoto') { if (el.files && el.files[0]) achicarFoto(el.files[0], (url) => { S.recForm.foto = url; render(); }); return; }
  else if (f === 'precio') { const p = comercio(S.panelCid).productos.find((x) => x.id === el.dataset.v); p.precio = Math.max(0, Number(el.value) || 0); save(); toast('Precio actualizado.'); return; }
  else if (f === 'nombre' || f === 'patente' || f === 'multaBusca') { render(); return; }
  else return;
  render();
});

render();

// Enlaces directos: ?perfil=lucia|rosa|carlos|marina y ?tour=1 (los usa la presentación)
(() => {
  const q = new URLSearchParams(location.search);
  const perf = q.get('perfil');
  if (perf && PERFILES.some((x) => x.id === perf)) { S.perfil = perf; S.onboard = true; S.sheet = null; render(); }
  if (q.get('tour') === '1') { ACT.tourIniciar(); render(); }
})();

// Instalable en el celu (solo en https, por ejemplo en GitHub Pages).
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
