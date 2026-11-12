// SoyTigreYa: prototipo con tres vistas (Vecino, Comercio, Municipio) que comparten los mismos datos.
// Todo se guarda en el navegador (localStorage). "Reiniciar demo" (vista Municipio) vuelve a los datos iniciales.

const KEY = 'soytigreya-v2';
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
    v: 2, rol: 'vecino', tab: 'inicio', sesion: false, letra: false,
    usuario: { nombre: 'Lucía Fernández', dni: '30.456.789', nro: 'ST-104-2291', loc: 'Tigre Centro', desde: 2023, partida: '12-345678-9', patente: 'AF123BC' },
    comercios, pedidos, reclamos, turnos: [], notifs: [],
    carrito: null, filtro: { cat: 'todas', loc: 'todas', q: '' }, comprarTab: 'comercios',
    benef: { rubro: 'todas', vista: 'lista' },
    abierto: null, sheet: null, sub: null, pago: 'mp', retiro: 0,
    servTab: 'turnos', turnoForm: { tramite: 'licencia', dia: 0, hora: null },
    recForm: { tipo: 'alumbrado', loc: 'Tigre Centro', dir: '', texto: '', foto: null, pos: null },
    tasas, multas: [{ id: 'M88123', patente: 'AF123BC', motivo: 'Estacionar en lugar prohibido', lugar: 'Av. Cazón 900', fecha: ahora - 12 * 864e5, monto: 45000, pagada: false }],
    multaBusca: '', estac: { saldo: 3500, zona: 'A', activo: null, historial: [] },
    parada: 'estacion', alerta: null, cobro: null, comprobante: null,
    chat: [], benefSel: null, busca: '',
    panelCid: 'c2', panelTab: 'pedidos', pagosApp: 0,
    puntos: seedPuntos(pedidos),
  };
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
    if (s && s.v === 2) { if (!s.puntos) s.puntos = seedPuntos(s.pedidos); return s; }
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
  app.className = 'shell ' + (S.rol === 'vecino' ? 'phone' : 'wide');
  if (S.rol === 'vecino' && !S.sesion) {
    app.innerHTML = rolesBar() + vIngreso() + sheet();
    after(); save(); return;
  }
  const vista = S.rol === 'vecino' ? vecino() : S.rol === 'comercio' ? panelComercio() : municipio();
  const fab = S.rol === 'vecino' && !(S.abierto && S.carrito) ? `<button class="fab" data-a="sheet" data-v="tigri" aria-label="Hablar con Tigri"><span>🐯</span><b>Tigri</b></button>` : '';
  app.innerHTML = topbar() + `<main class="main">${vista}</main>` + (S.rol === 'vecino' ? navVecino() + fab : '') + sheet();
  after();
  save();
}

function rolesBar() {
  const roles = [['vecino', '🙋 Vecino'], ['comercio', '🏪 Comercio'], ['municipio', '🏛️ Municipio']];
  return `<nav class="roles" aria-label="Ver la app como">${roles.map(([id, t]) => `<button class="${S.rol === id ? 'on' : ''}" data-a="rol" data-v="${id}">${t}</button>`).join('')}</nav>`;
}

function topbar() {
  const sinLeer = S.notifs.filter((n) => !n.leida).length;
  return `<header class="top">
    <div class="marca"><span class="logo">🐯</span><b>SoyTigre<span>Ya</span></b></div>
    <div class="top-der">${S.rol === 'vecino' ? `
      <button class="sos" data-a="sub" data-v="alerta" aria-label="Botón de alerta">🆘</button>
      <button class="campana" data-a="notifs" aria-label="Notificaciones">🔔${sinLeer ? `<i>${sinLeer}</i>` : ''}</button>` : ''}
    </div>
  </header>` + rolesBar();
}

function navVecino() {
  const tabs = [['inicio', '🏠', 'Inicio'], ['beneficios', '🎁', 'Beneficios'], ['comprar', '🛍️', 'Comprar'], ['servicios', '🏛️', 'Trámites'], ['credencial', '🪪', 'Credencial']];
  const activos = S.pedidos.filter((p) => p.mio && ['recibido', 'preparacion', 'listo'].includes(p.estado)).length;
  return `<nav class="bottom">${tabs.map(([id, e, t]) => `<button class="${S.tab === id && !S.sub ? 'on' : ''}" data-a="tab" data-v="${id}"><span>${e}${id === 'comprar' && activos ? `<i>${activos}</i>` : ''}</span>${t}</button>`).join('')}</nav>`;
}

// ---------- ingreso ----------
function vIngreso() {
  return `<main class="main ingreso">
    <div class="ing-logo">🐯</div>
    <h1>${MARCA.app}</h1>
    <p class="muted">Tu credencial ${MARCA.tarjeta}, los comercios del barrio y los trámites del municipio, en una sola app.</p>
    <ul class="ing-lista">
      <li>🎁 <span>Descuentos en más de 500 comercios, en el local o pidiendo para retirar.</span></li>
      <li>🏛️ <span>Turnos, reclamos con foto y pago de tasas sin hacer filas.</span></li>
      <li>🐯 <span>Tigri, una asistente que te ayuda con todo.</span></li>
    </ul>
    <button class="btn grande mia" data-a="ingresar" data-v="miargentina">Ingresar con Mi Argentina</button>
    <button class="btn grande claro" data-a="sheet" data-v="dni">Ingresar con DNI</button>
    <p class="muted chico centro">Prototipo de demostración: no se conecta con Mi Argentina ni con RENAPER.</p>
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
  const cerca2 = S.comercios.filter((c) => c.loc === S.usuario.loc && c.abierto);
  const r = rioAhora();
  const accesos = [
    ['🎁', 'Beneficios', 'tab', 'beneficios'], ['🥡', 'Takeaway', 'cat', 'gastro'], ['🧾', 'Pagar tasas', 'sub', 'tasas'], ['🚗', 'Estacionar', 'sub', 'estacionamiento'],
    ['📣', 'Reclamos', 'serv', 'reclamos'], ['📅', 'Turnos', 'serv', 'turnos'], ['🚌', 'Colectivos', 'sub', 'colectivos'], ['💊', 'Farmacias', 'sub', 'farmacias'],
  ];
  return `
  <section class="hola"><p class="muted">Hola,</p><h1>${esc(S.usuario.nombre.split(' ')[0])} 👋</h1></section>
  <input class="buscar" type="search" placeholder="🔎 Buscá comercios, beneficios o trámites" value="${esc(S.busca)}" data-f="busca">
  <div id="resBusca">${resultadosBusca()}</div>
  ${puntosMini()}
  <div class="card ahorro">
    <p>Este mes ahorraste con tu tarjeta ${MARCA.tarjeta}</p>
    <strong>${plata(ahorro)}</strong>
    <span>en ${plural(mes.length, 'compra', 'compras')} en comercios del distrito</span>
    <button class="btn-claro" data-a="tab" data-v="credencial">Ver mi historial</button>
  </div>
  ${activo ? cardActivo(activo) : ''}
  <button class="card rio-mini ${r.nivel.clase}" data-a="sub" data-v="rio">
    <span class="rio-ico">🌊</span><div><b>Río Luján: ${r.altura.toFixed(2).replace('.', ',')} m</b><span class="muted">${r.nivel.txt} · ${r.sube ? 'subiendo ↑' : 'bajando ↓'}</span></div><span class="flecha">›</span>
  </button>
  <h2>¿Qué necesitás?</h2>
  <div class="accesos">${accesos.map(([e, t, a, v]) => `<button data-a="${a}" data-v="${v}"><span>${e}</span>${t}</button>`).join('')}</div>
  <button class="card tigri-card" data-a="sheet" data-v="tigri"><span class="tg-avatar">🐯</span><div><b>¿Te ayudo con algo?</b><span class="muted">Preguntale a Tigri: "farmacia de turno", "quiero pizza", "hay un bache"…</span></div></button>
  <h2>Cerca tuyo, en ${esc(S.usuario.loc)}</h2>
  <div class="carrusel">${cerca2.map(miniComercio).join('') || '<p class="muted">Todavía no hay comercios con pedidos en tu localidad.</p>'}</div>
  <h2>Avisos</h2>
  <div class="lista">${AVISOS.map((a) => `<div class="fila"><span class="ico">${a.emoji}</span><div><b>${a.titulo}</b><p class="muted">${a.texto}</p></div></div>`).join('')}</div>`;
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
    <div class="mini-img" style="background:${c.color}">${c.emoji}<em>-${c.desc}%</em></div>
    <b>${esc(c.nombre)}</b><span class="muted">${cat(c.cat).nombre} · ${c.prep} min</span></button>`;
}

function cardActivo(p) {
  const c = comercio(p.cid);
  return `<button class="card activo" data-a="verPedidos">
    <div><span class="pill ${p.estado}">${ESTADO_TXT[p.estado]}</span><b>${esc(c.nombre)}</b>
    <span class="muted">Retiro ${p.retiro} · código <b>${p.codigo}</b></span></div><span class="flecha">›</span></button>`;
}

// ---------- beneficios ----------
function listaBeneficios() {
  const f = S.benef;
  const fis = BENEFICIOS.map((b, i) => ({ ...b, i, pos: cerca(b.loc, i * 3 + 20), tipo: 'local' })).filter((b) => f.rubro === 'todas' || b.rubro === f.rubro);
  const app = S.comercios.filter((c) => f.rubro === 'todas' || c.cat === f.rubro).map((c) => ({ nombre: c.nombre, rubro: c.cat, loc: c.loc, emoji: c.emoji, texto: `${c.desc}% pidiendo por la app`, pos: c.pos, tipo: 'app', id: c.id }));
  return [...fis, ...app];
}

function vBeneficios() {
  const f = S.benef;
  const lista = listaBeneficios();
  const rubrosUsados = RUBROS.filter((r) => BENEFICIOS.some((b) => b.rubro === r.id) || S.comercios.some((c) => c.cat === r.id));
  return `
  <h1 class="titulo">Beneficios ${MARCA.tarjeta}</h1>
  <p class="muted sub">Mostrá tu credencial en el local o pedí por la app: el descuento es el mismo.</p>
  <div class="seg"><button class="${f.vista === 'lista' ? 'on' : ''}" data-a="benefVista" data-v="lista">📋 Lista</button><button class="${f.vista === 'mapa' ? 'on' : ''}" data-a="benefVista" data-v="mapa">🗺️ Mapa</button></div>
  <div class="chips">${[{ id: 'todas', nombre: 'Todo', emoji: '✨' }, ...rubrosUsados].map((c) => `<button class="chip ${f.rubro === c.id ? 'on' : ''}" data-a="benefRubro" data-v="${c.id}">${c.emoji} ${c.nombre}</button>`).join('')}</div>
  ${f.vista === 'mapa' ? '<div class="mapa" data-map="beneficios"></div><p class="muted chico">⚫ se usa en el local · 🔴 también pedís por la app</p>' : `
  <div class="lista">${lista.map((b) => b.tipo === 'local'
    ? `<button class="fila" data-a="verBenef" data-v="${b.i}"><span class="ico">${b.emoji}</span><div><b>${esc(b.nombre)}</b><p class="muted">${rubro(b.rubro).nombre} · ${b.loc}</p><p class="benef-txt">${esc(b.texto)}${b.dias ? ` · ${b.dias}` : ''}</p></div><span class="tag-mini">En el local</span></button>`
    : `<button class="fila" data-a="abrir" data-v="${b.id}"><span class="ico">${b.emoji}</span><div><b>${esc(b.nombre)}</b><p class="muted">${rubro(b.rubro).nombre} · ${b.loc}</p><p class="benef-txt">${esc(b.texto)}</p></div><span class="tag-mini app">Por la app</span></button>`).join('')}</div>`}`;
}

// ---------- comprar ----------
function vComprar() {
  const f = S.filtro;
  const activos = S.pedidos.filter((p) => p.mio && ['recibido', 'preparacion', 'listo'].includes(p.estado)).length;
  const seg = `<div class="seg"><button class="${S.comprarTab === 'comercios' ? 'on' : ''}" data-a="comprarTab" data-v="comercios">🛍️ Comercios</button><button class="${S.comprarTab === 'pedidos' ? 'on' : ''}" data-a="comprarTab" data-v="pedidos">🧾 Mis pedidos${activos ? ` (${activos})` : ''}</button></div>`;
  if (S.comprarTab === 'pedidos') return `<h1 class="titulo">Comprar en el barrio</h1>${seg}${vPedidos()}`;
  return `
  <h1 class="titulo">Comprar en el barrio</h1>
  ${seg}
  <p class="muted sub">Retirás en el local y el descuento ${MARCA.tarjeta} se aplica solo.</p>
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
  return res.map((c) => `<button class="comercio ${c.abierto ? '' : 'cerrado'}" data-a="abrir" data-v="${c.id}">
    <div class="avatar" style="background:${c.color}">${c.emoji}</div>
    <div class="info"><b>${esc(c.nombre)}</b><span class="muted">${cat(c.cat).nombre} · ${c.loc}</span>
    <span class="muted">${c.abierto ? `🥡 Retiro en ${c.prep} min` : 'Cerrado ahora'}</span></div>
    <span class="desc">-${c.desc}%</span></button>`).join('');
}

function vComercio(c) {
  const car = S.carrito && S.carrito.cid === c.id ? S.carrito : null;
  const cant = (pid) => (car && car.items[pid]) || 0;
  const tot = car ? totalesCarrito() : null;
  return `
  <button class="volver" data-a="cerrarComercio">‹ Volver</button>
  <div class="hero" style="background:${c.color}"><span>${c.emoji}</span></div>
  <h1 class="titulo">${esc(c.nombre)}</h1>
  <p class="muted sub">${esc(c.dir)} · ${c.loc}</p>
  <div class="tags"><span class="tag desc">${MARCA.tarjeta}: -${c.desc}%</span><span class="tag">🥡 Retiro en ${c.prep} min</span><span class="tag">0% comisión</span></div>
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
  const descuento = Math.round(subtotal * c.desc / 100);
  const hayCupon = S.puntos.cupones.some((x) => x.tipo === 'cupon');
  const cupon = hayCupon && !S.noUsarCupon ? Math.min(2000, subtotal - descuento) : 0;
  return { c, items, subtotal, descuento, hayCupon, cupon, total: subtotal - descuento - cupon, unidades: items.reduce((a, it) => a + it.qty, 0) };
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
  <div class="card escaner"><span class="grande-emoji">📷</span><p><b>Escaneá el QR del punto verde</b></p><p class="muted chico">Demostración: elegí el punto verde para simular el escaneo.</p></div>
  <div class="lista">${PUNTOS_VERDES.map((v) => `<button class="fila" data-a="reciclar" data-v="${v}"><span class="ico">♻️</span><div><b>${v}</b><p class="muted">Plástico, cartón, vidrio y latas</p></div><span class="tag-mini">+${PUNTOS.reciclar}</span></button>`).join('')}</div>`;
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
  ${activos.length ? '<p class="tip">💡 Para ver cómo avanza, tocá <b>Comercio</b> arriba y movelo desde el panel del local.</p>' : ''}
  <h2>Anteriores</h2>
  <div class="lista">${pasados.map((p) => { const c = comercio(p.cid); return `<div class="fila"><span class="ico">${c.emoji}</span>
    <div><b>${esc(c.nombre)}</b><p class="muted">${fecha(p.creado)} · ${plural(p.items.reduce((a, i) => a + i.qty, 0), 'producto', 'productos')} · ${ESTADO_TXT[p.estado]}</p></div>
    <div class="der"><b>${plata(p.total)}</b><span class="verde">-${plata(p.descuento)}</span></div></div>`; }).join('')}</div>`;
}

function pedidoActivo(p) {
  const c = comercio(p.cid);
  const idx = ESTADOS.indexOf(p.estado);
  return `<div class="card pedido">
    <div class="ped-cab"><span class="avatar chico" style="background:${c.color}">${c.emoji}</span><div><b>${esc(c.nombre)}</b><span class="muted">${esc(c.dir)}</span></div></div>
    <ol class="pasos">${ESTADOS.slice(0, 3).map((e, i) => `<li class="${i < idx ? 'hecho' : i === idx ? 'actual' : ''}">${ESTADO_TXT[e]}</li>`).join('')}</ol>
    <div class="retiro">
      <div><span class="muted">Retirás</span><b>${p.retiro}</b><span class="muted">Código de retiro</span><b class="codigo">${p.codigo}</b></div>
      <div class="qr chico" data-qr="RETIRO|${p.id}|${p.codigo}"></div>
    </div>
    <details><summary>Detalle · ${plata(p.total)}</summary>
      ${p.items.map((it) => `<p class="linea"><span>${it.qty} × ${esc(it.nombre)}</span><span>${plata(it.precio * it.qty)}</span></p>`).join('')}
      <p class="linea verde"><span>Beneficio ${MARCA.tarjeta} (-${p.desc}%)</span><span>-${plata(p.descuento)}</span></p>
      <p class="linea"><span>Pago</span><span>${PAGOS.find((x) => x.id === p.pago).nombre}</span></p>
    </details>
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
    <button class="link rojo" data-a="salir">Cerrar sesión</button>
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
  <div class="accesos">${[['🌊', 'Río', 'rio'], ['🚌', 'Colectivos', 'colectivos'], ['💊', 'Farmacias', 'farmacias'], ['🆘', 'Alerta', 'alerta']].map(([e, x, v]) => `<button data-a="sub" data-v="${v}"><span>${e}</span>${x}</button>`).join('')}</div>`;
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
  </div>`;
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
  const titulos = { puntos: 'Puntos Tigre', reciclar: 'Reciclar y sumar puntos', tasas: 'Tasas municipales', multas: 'Multas de tránsito', estacionamiento: 'Estacionamiento medido', rio: 'Altura del río', colectivos: 'Colectivos', farmacias: 'Farmacias de turno', alerta: 'Botón de alerta' };
  const cuerpo = { puntos: sPuntos, reciclar: sReciclar, tasas: sTasas, multas: sMultas, estacionamiento: sEstac, rio: sRio, colectivos: sColectivos, farmacias: sFarmacias, alerta: sAlerta }[S.sub];
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
    : `<div class="card form">
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
  return `<p class="muted sub">Hoy, ${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
  <div class="lista">${lista.map((f) => `<div class="fila"><span class="ico">💊</span><div><b>${f.nombre}</b><p class="muted">${f.dir} · ${f.loc}</p>${f.turno ? '<span class="pill listo">De turno las 24 h</span>' : ''}</div><a class="link" href="tel:${f.tel.replace(/\D/g, '')}">Llamar</a></div>`).join('')}</div>`;
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
      <p class="muted">¿Cuándo lo retirás?</p>
      <div class="chips">${horariosRetiro(t.c.prep).map((h) => `<button class="chip ${S.retiro === h.i ? 'on' : ''}" data-a="retiro" data-v="${h.i}">${h.txt}</button>`).join('')}</div>
      <p class="muted">¿Cómo pagás?</p>
      <div class="pagos">${PAGOS.map((p) => `<button class="${S.pago === p.id ? 'on' : ''}" data-a="pago" data-v="${p.id}">${p.emoji} ${p.nombre}</button>`).join('')}</div>
      <button class="btn grande" data-a="pagar">${S.pago === 'efectivo' ? 'Confirmar pedido' : 'Pagar'} ${plata(t.total)}</button>`;
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
    html = `<div class="benef-det"><span class="grande-emoji">${b.emoji}</span><h2>${esc(b.nombre)}</h2><p class="muted">${rubro(b.rubro).nombre} · ${b.loc}</p>
      <p class="benef-grande">${esc(b.texto)}</p>${b.dias ? `<p>📅 ${b.dias}</p>` : ''}${b.tope ? `<p class="muted">${b.tope}</p>` : ''}
      <p class="muted">Mostrá tu credencial ${MARCA.tarjeta} en la caja antes de pagar.</p>
      <button class="btn grande" data-a="tab" data-v="credencial">🪪 Mostrar mi credencial</button></div>`;
  } else if (s === 'dni') {
    html = `<h2>Ingresar con DNI</h2><p class="muted">Validamos tu identidad con los datos de tu DNI.</p>
      <div class="form"><label>Número de DNI<input id="inDni" inputmode="numeric" placeholder="30456789" value="30456789"></label>
      <label>Número de trámite (está en el frente del DNI)<input id="inTramite" inputmode="numeric" placeholder="00123456789" value="00123456789"></label>
      <label>Sexo<select id="inSexo"><option>F</option><option>M</option><option>X</option></select></label>
      <button class="btn grande" data-a="ingresar" data-v="dni">Validar e ingresar</button></div>`;
  } else if (s === 'tigri') {
    return `<div class="velo" data-a="cerrarSheet"></div><div class="sheet chat" role="dialog" aria-label="Chat con Tigri">
      <div class="chat-cab"><span class="tg-avatar">🐯</span><div><b>Tigri</b><span class="muted">Tu asistente de ${MARCA.app}</span></div><button class="cerrar" data-a="cerrarSheet" aria-label="Cerrar">✕</button></div>
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
  return `<div class="msg tg">${m.html}${m.acciones && m.acciones.length ? `<div class="msg-acc">${m.acciones.map((a) => `<button class="chip" data-a="${a.a}" data-v="${a.v}">${a.t}</button>`).join('')}</div>` : ''}</div>`;
}

const tiene = (q, ...pal) => pal.some((p) => q.includes(p));

function tigriResponde(texto) {
  const q = norm(texto);
  const nombre = S.usuario.nombre.split(' ')[0];
  const R = (html, acciones = []) => ({ html, acciones });

  if (tiene(q, 'emergencia', 'robo', 'me robaron', 'ayuda urgente', 'auxilio', 'incendio', 'violencia', 'panico')) {
    return R(`Si es una emergencia, <b>llamá ya al 911</b> (o al 107 si es médica, 144 por violencia de género). También podés usar el botón de alerta: le manda tu ubicación al Centro de Operaciones.`, [{ t: '🆘 Botón de alerta', a: 'sub', v: 'alerta' }]);
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
  const c = comercio(S.panelCid);
  const tabs = [['pedidos', '🧾 Pedidos'], ['productos', '📦 Productos'], ['resumen', '📈 Resumen']];
  const cuerpo = S.panelTab === 'productos' ? pcProductos(c) : S.panelTab === 'resumen' ? pcResumen(c) : pcPedidos(c);
  return `
  <div class="panel-cab">
    <div class="avatar" style="background:${c.color}">${c.emoji}</div>
    <div class="grow"><select class="sel-comercio" data-f="panelCid">${S.comercios.map((x) => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select>
      <span class="muted">${esc(c.dir)} · ${c.loc}</span></div>
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
  return `<div class="kanban">${col('recibido', '🆕 Nuevos')}${col('preparacion', '👩‍🍳 En preparación')}${col('listo', '✅ Listos para retirar')}</div>
  <p class="muted">Entregados hoy: ${entregadosHoy}. Los pedidos nuevos llegan cuando un vecino compra desde la vista <b>Vecino</b>.</p>`;
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
  <h2>Lo más pedido este mes</h2>
  <div class="card">${ranking.map(([n, q]) => `<p class="linea"><span>${esc(n)}</span><b>${q}</b></p>`).join('') || '<p class="muted">Todavía sin ventas este mes.</p>'}</div>`;
}

const kpi = (t, v, cls = '', sub = '') => `<div class="kpi ${cls}"><span>${t}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;

// ---------- municipio ----------
function municipio() {
  const desde = inicioMes();
  const mes = S.pedidos.filter((p) => p.estado === 'retirado' && p.creado >= desde);
  const ventas = mes.reduce((a, p) => a + p.total, 0);
  const ahorroVecinos = mes.reduce((a, p) => a + p.descuento, 0);
  const porLoc = LOCALIDADES.map((l) => ({ l, v: mes.filter((p) => p.loc === l).reduce((a, p) => a + p.total, 0), n: S.comercios.filter((c) => c.loc === l).length + BENEFICIOS.filter((b) => b.loc === l).length }));
  const maxLoc = Math.max(...porLoc.map((x) => x.v), 1);
  const porCat = CATS.map((c) => ({ c, v: mes.filter((p) => comercio(p.cid).cat === c.id).reduce((a, p) => a + p.total, 0) })).filter((x) => x.v).sort((a, b) => b.v - a.v);
  const maxCat = Math.max(...porCat.map((x) => x.v), 1);
  const abiertos = S.reclamos.filter((r) => r.estado !== 'resuelto');
  const gestion = abiertos.slice().sort((a, b) => (b.mio - a.mio) || (b.creado - a.creado)).slice(0, 8);
  const topCom = S.comercios.map((c) => ({ c, v: mes.filter((p) => p.cid === c.id).reduce((a, p) => a + p.total, 0) })).sort((a, b) => b.v - a.v).slice(0, 5);
  return `
  <h1 class="titulo">Tablero del ${MARCA.municipio}</h1>
  <p class="muted sub">${MESES[new Date().getMonth()]} ${new Date().getFullYear()}, hasta hoy. Datos de demostración.</p>
  <div class="kpis">
    ${kpi('Ventas en comercios locales', plata(ventas))}
    ${kpi('Pedidos retirados', mes.length.toLocaleString('es-AR'))}
    ${kpi('Ahorro de los vecinos', plata(ahorroVecinos), 'verde')}
    ${kpi('Comisiones que quedaron en el distrito', plata(ventas * MARCA.comisionApps), 'verde', `lo que se habría ido en apps al ${MARCA.comisionApps * 100}%`)}
    ${kpi('Comercios adheridos', S.comercios.length + BENEFICIOS.length)}
    ${kpi('Reclamos abiertos', abiertos.length, abiertos.length > 30 ? 'rojo-kpi' : '')}
    ${kpi('Turnos pedidos', S.turnos.length + 312)}
    ${kpi('Puntos Tigre canjeados', (184200 + S.puntos.canjeados).toLocaleString('es-AR'), '', 'en cupones, tasas, estacionamiento y cultura')}
    ${kpi('Tasas pagadas en término', '71%', 'verde', 'meta del piloto: 80% con Puntos Tigre')}
    ${kpi('Pagos hechos por la app', (1840 + S.pagosApp).toLocaleString('es-AR'), '', 'tasas, multas y estacionamiento')}
  </div>
  <div class="dos">
    <div class="card"><h3>Mapa de reclamos</h3><div class="mapa" data-map="municipio"></div>
      <p class="muted chico">🔴 recibido · 🟡 asignado o en curso · 🟢 resuelto</p></div>
    <div class="card"><h3>Reclamos para gestionar</h3>
      ${gestion.map((r) => { const t = TIPOS_RECLAMO.find((x) => x.id === r.tipo); const sig = ESTADOS_RECLAMO[ESTADOS_RECLAMO.indexOf(r.estado) + 1]; return `<div class="gest">${r.foto ? `<img src="${r.foto}" alt="">` : `<span class="ico">${t.emoji}</span>`}<div class="grow"><b>${t.nombre} · ${r.id}</b>${r.mio ? ' <span class="pill recibido">desde la app</span>' : ''}<p class="muted chico">${esc(r.dir || '')} ${r.loc} · ${RECLAMO_TXT[r.estado]}</p></div><button class="btn mini-btn" data-a="avanzarReclamo" data-v="${r.id}">${sig === 'resuelto' ? 'Resolver' : sig === 'asignado' ? 'Asignar' : 'Iniciar'}</button></div>`; }).join('')}
    </div>
    <div class="card"><h3>Consumo por localidad</h3>
      ${porLoc.map((x) => `<div class="hbar"><span class="hbar-t">${x.l}<small>${x.n} comercios</small></span><div class="hbar-b"><i style="width:${(x.v / maxLoc) * 100}%;opacity:${0.35 + 0.65 * (x.v / maxLoc)}"></i></div><b>${plata(x.v)}</b></div>`).join('')}
    </div>
    <div class="card"><h3>Consumo por rubro</h3>
      ${porCat.map((x) => `<div class="hbar"><span class="hbar-t">${x.c.emoji} ${x.c.nombre}</span><div class="hbar-b"><i class="naranja" style="width:${(x.v / maxCat) * 100}%"></i></div><b>${plata(x.v)}</b></div>`).join('')}
    </div>
    <div class="card"><h3>Comercios con más ventas</h3>
      ${topCom.map((x, i) => `<p class="linea"><span>${i + 1}. ${x.c.emoji} ${esc(x.c.nombre)} <small class="muted">${x.c.loc}</small></span><b>${plata(x.v)}</b></p>`).join('')}
    </div>
    <div class="card"><h3>Reclamos por tipo</h3>
      ${TIPOS_RECLAMO.map((t) => `<p class="linea"><span>${t.emoji} ${t.nombre}</span><span><b class="rojo">${S.reclamos.filter((r) => r.tipo === t.id && r.estado !== 'resuelto').length} abiertos</b> · <span class="verde">${S.reclamos.filter((r) => r.tipo === t.id && r.estado === 'resuelto').length} resueltos</span></span></p>`).join('')}
    </div>
  </div>
  <button class="link" data-a="reiniciar">↺ Reiniciar los datos de la demo</button>`;
}

// ---------- mapas (Leaflet + OpenStreetMap) ----------
let mapas = [];
const pin = (emoji) => L.divIcon({ html: `<span>${emoji}</span>`, className: 'pin', iconSize: [30, 30], iconAnchor: [15, 28] });
const MAPAS = {
  beneficios(m) {
    const lista = listaBeneficios();
    lista.forEach((b) => {
      const btn = b.tipo === 'local' ? `<button class="link" data-a="verBenef" data-v="${b.i}">Ver beneficio</button>` : `<button class="link" data-a="abrir" data-v="${b.id}">Pedir por la app</button>`;
      L.circleMarker(b.pos, { radius: 9, color: '#fff', weight: 2, fillColor: b.tipo === 'local' ? '#515769' : '#D02013', fillOpacity: 1 })
        .addTo(m).bindPopup(`<b>${b.emoji} ${esc(b.nombre)}</b><br>${esc(b.texto)}<br>${btn}`);
    });
    m.setView(LOC_COORDS[S.usuario.loc] || LOC_COORDS['Tigre Centro'], 12);
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
    MAPAS[el.dataset.map](m);
  });
}

// ---------- después de pintar ----------
let timerId = null;
function after() {
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
  t.textContent = txt; t.className = 'show';
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

// ---------- acciones ----------
const ACT = {
  rol(v) {
    S.rol = v; S.sheet = null;
    if (v === 'vecino') {
      const nuevas = S.notifs.filter((n) => !n.leida);
      if (nuevas.length) setTimeout(() => toast(`${nuevas[nuevas.length - 1].emoji} ${nuevas[nuevas.length - 1].txt}`), 150);
    }
    window.scrollTo(0, 0);
  },
  ingresar(v) {
    if (v === 'dni') {
      const dni = $('#inDni').value.replace(/\D/g, ''), tr = $('#inTramite').value.replace(/\D/g, '');
      if (dni.length < 7 || tr.length < 8) { toast('Revisá el DNI y el número de trámite.'); return false; }
    }
    procesando(v === 'dni' ? 'Validando tu identidad…' : 'Conectando con Mi Argentina…', () => {
      S.sesion = true; S.sheet = null; S.tab = 'inicio';
      if (!S.chat.length) S.chat.push({ de: 'tg', html: saludo(), acciones: [] });
      setTimeout(() => toast(`👋 ¡Bienvenida, ${S.usuario.nombre.split(' ')[0]}!`), 100);
    });
  },
  salir() { if (!confirm('¿Cerrar sesión?')) return false; S.sesion = false; S.tab = 'inicio'; S.sub = null; },
  letra() { S.letra = !S.letra; },
  tab(v) { S.tab = v; S.abierto = null; S.sub = null; S.sheet = null; window.scrollTo(0, 0); },
  sub(v) { S.sub = v; S.sheet = null; S.rol = 'vecino'; window.scrollTo(0, 0); },
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
  sheet(v) { S.sheet = v; S.retiro = 0; if (v === 'tigri' && !S.chat.length) S.chat.push({ de: 'tg', html: saludo(), acciones: [] }); },
  cerrarSheet() { if (S.sheet !== 'pagando') S.sheet = null; },
  retiro(v) { S.retiro = Number(v); },
  pago(v) { S.pago = v; },
  pagar() {
    const t = totalesCarrito();
    const retiro = horariosRetiro(t.c.prep)[S.retiro].txt.replace(/Lo antes posible \((.*)\)/, '$1');
    procesando(S.pago === 'efectivo' ? 'Enviando tu pedido…' : `Procesando el pago con ${PAGOS.find((p) => p.id === S.pago).nombre}…`, () => {
      const p = armarPedido({
        id: 'P' + (Math.max(...S.pedidos.map((x) => Number(x.id.slice(1)))) + 1), cid: t.c.id,
        items: t.items.map(({ pid, nombre, precio, qty }) => ({ pid, nombre, precio, qty })),
        desc: t.c.desc, pago: S.pago, creado: Date.now(), estado: 'recibido', mio: true, loc: t.c.loc, retiro: `a las ${retiro}`,
      });
      if (t.cupon) { p.cupon = t.cupon; p.total -= t.cupon; S.puntos.cupones.splice(S.puntos.cupones.findIndex((c) => c.tipo === 'cupon'), 1); }
      S.pedidos.push(p);
      const pts = sumarPuntos(Math.floor(p.total / PUNTOS.porCompra), `Compra en ${t.c.nombre}`, '🛍️');
      S.carrito = null; S.sheet = null; S.abierto = null; S.tab = 'comprar'; S.comprarTab = 'pedidos';
      setTimeout(() => toast(`✅ Pedido enviado. Ahorraste ${plata(p.descuento + (p.cupon || 0))} y sumaste ⭐ ${pts} puntos.`), 100);
    });
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
  else if (f === 'recFoto') { if (el.files && el.files[0]) achicarFoto(el.files[0], (url) => { S.recForm.foto = url; render(); }); return; }
  else if (f === 'precio') { const p = comercio(S.panelCid).productos.find((x) => x.id === el.dataset.v); p.precio = Math.max(0, Number(el.value) || 0); save(); toast('Precio actualizado.'); return; }
  else if (f === 'nombre' || f === 'patente' || f === 'multaBusca') { render(); return; }
  else return;
  render();
});

render();
