// Datos de demo. Para usar la app en otro municipio, cambiar MARCA y LOCALIDADES.
const MARCA = {
  app: 'SoyTigreYa',
  tarjeta: 'Soy Tigre',
  municipio: 'Municipio de Tigre',
  comisionApps: 0.30, // comisión típica de las apps privadas, para comparar
};

const LOCALIDADES = ['Tigre Centro', 'Nordelta', 'Don Torcuato', 'El Talar', 'Benavídez', 'General Pacheco', 'Delta'];

// Rubros del paraguas Soy Tigre: comercios que venden con retiro y comercios de servicios que se reservan por turno.
const CATS = [
  { id: 'gastro', nombre: 'Gastronomía', emoji: '🍔' },
  { id: 'almacen', nombre: 'Súper y almacén', emoji: '🛒' },
  { id: 'verdu', nombre: 'Verdulería', emoji: '🥬' },
  { id: 'farmacia', nombre: 'Farmacia y perfumería', emoji: '💊' },
  { id: 'salud', nombre: 'Salud y óptica', emoji: '🩺' },
  { id: 'belleza', nombre: 'Peluquería y belleza', emoji: '💇' },
  { id: 'deporte', nombre: 'Gimnasios y deporte', emoji: '🏋️' },
  { id: 'ropa', nombre: 'Indumentaria', emoji: '👕' },
  { id: 'hogar', nombre: 'Hogar y ferretería', emoji: '🔧' },
  { id: 'tecno', nombre: 'Tecnología', emoji: '📱' },
  { id: 'auto', nombre: 'Automotor', emoji: '🚗' },
  { id: 'educacion', nombre: 'Educación', emoji: '🎓' },
  { id: 'turismo', nombre: 'Turismo y hotelería', emoji: '🚤' },
  { id: 'entretenimiento', nombre: 'Entretenimiento', emoji: '🎬' },
  { id: 'pet', nombre: 'Mascotas', emoji: '🐾' },
  { id: 'libreria', nombre: 'Librería', emoji: '📚' },
];

const SEED_COMERCIOS = [
  { id: 'c1', nombre: 'Parrilla del Paseo', cat: 'gastro', loc: 'Tigre Centro', dir: 'Paseo Victorica 310', desc: 20, emoji: '🥩', color: '#9a3b1b', prep: 30, productos: [
    { nombre: 'Bife de chorizo con papas', desc: '400 g, papas rústicas', precio: 21500, emoji: '🥩' },
    { nombre: 'Choripán completo', desc: 'Con chimichurri y criolla', precio: 7800, emoji: '🌭' },
    { nombre: 'Provoleta', desc: 'Con orégano y aceite de oliva', precio: 8900, emoji: '🧀' },
    { nombre: 'Ensalada mixta', desc: 'Lechuga, tomate y cebolla', precio: 5200, emoji: '🥗' },
    { nombre: 'Agua saborizada 500 ml', desc: '', precio: 2400, emoji: '🥤' },
  ]},
  { id: 'c2', nombre: 'Pastas Doña Rosa', cat: 'gastro', loc: 'Tigre Centro', dir: 'Av. Cazón 1240', desc: 30, emoji: '🍝', color: '#b5541c', prep: 25, productos: [
    { nombre: 'Sorrentinos de jamón y queso', desc: 'Con salsa a elección', precio: 13900, emoji: '🍝' },
    { nombre: 'Ñoquis de papa', desc: 'Con tuco casero', precio: 10500, emoji: '🥔' },
    { nombre: 'Lasaña de verdura', desc: 'Porción grande', precio: 14200, emoji: '🍲' },
    { nombre: 'Tiramisú', desc: 'Porción individual', precio: 6200, emoji: '🍰' },
  ]},
  { id: 'c3', nombre: 'Café Victorica', cat: 'gastro', loc: 'Tigre Centro', dir: 'Paseo Victorica 150', desc: 10, emoji: '☕', color: '#5b3a29', prep: 15, productos: [
    { nombre: 'Café con leche y 2 medialunas', desc: '', precio: 6500, emoji: '☕' },
    { nombre: 'Tostado de jamón y queso', desc: 'En pan de miga', precio: 8200, emoji: '🥪' },
    { nombre: 'Licuado de banana', desc: '400 ml', precio: 5400, emoji: '🍌' },
    { nombre: 'Budín de limón', desc: 'Porción', precio: 3900, emoji: '🍋' },
  ]},
  { id: 'c4', nombre: 'Sushi Río Luján', cat: 'gastro', loc: 'Nordelta', dir: 'Av. de los Lagos 7010', desc: 20, emoji: '🍣', color: '#1f4e6b', prep: 35, productos: [
    { nombre: 'Combinado 15 piezas', desc: 'Salmón, langostino y palta', precio: 24500, emoji: '🍣' },
    { nombre: 'Gyozas de cerdo', desc: '6 unidades', precio: 9800, emoji: '🥟' },
    { nombre: 'Poke bowl de salmón', desc: 'Arroz, salmón, palta y mango', precio: 16900, emoji: '🥗' },
  ]},
  { id: 'c5', nombre: 'La Pizzería de Torcuato', cat: 'gastro', loc: 'Don Torcuato', dir: 'Av. Marquez 520', desc: 20, emoji: '🍕', color: '#a52a2a', prep: 25, productos: [
    { nombre: 'Muzzarella grande', desc: '8 porciones', precio: 13500, emoji: '🍕' },
    { nombre: 'Fugazzeta rellena', desc: '8 porciones', precio: 17200, emoji: '🧅' },
    { nombre: 'Empanadas x 6', desc: 'Carne, pollo o jamón y queso', precio: 12000, emoji: '🥟' },
    { nombre: 'Gaseosa 1,5 l', desc: '', precio: 4200, emoji: '🥤' },
  ]},
  { id: 'c6', nombre: 'Rotisería El Talar', cat: 'gastro', loc: 'El Talar', dir: 'Av. Constituyentes 3400', desc: 30, emoji: '🍗', color: '#8a5a00', prep: 20, productos: [
    { nombre: 'Pollo al spiedo entero', desc: 'Con papas fritas', precio: 18900, emoji: '🍗' },
    { nombre: 'Milanesa napolitana con puré', desc: '', precio: 12600, emoji: '🍖' },
    { nombre: 'Tarta de jamón y queso', desc: 'Porción', precio: 5600, emoji: '🥧' },
  ]},
  { id: 'c7', nombre: 'Almacén Benavídez', cat: 'almacen', loc: 'Benavídez', dir: 'Av. Benavídez 890', desc: 10, emoji: '🛒', color: '#2e6b3a', prep: 15, productos: [
    { nombre: 'Leche entera 1 l', desc: '', precio: 1650, emoji: '🥛' },
    { nombre: 'Yerba mate 1 kg', desc: '', precio: 5900, emoji: '🧉' },
    { nombre: 'Fideos secos 500 g', desc: '', precio: 1400, emoji: '🍝' },
    { nombre: 'Aceite de girasol 1,5 l', desc: '', precio: 4300, emoji: '🫗' },
    { nombre: 'Pan francés 1 kg', desc: '', precio: 3200, emoji: '🥖' },
  ]},
  { id: 'c8', nombre: 'Verdulería Don Ramón', cat: 'verdu', loc: 'General Pacheco', dir: 'Av. Hipólito Yrigoyen 1100', desc: 10, emoji: '🥬', color: '#3f7d20', prep: 15, productos: [
    { nombre: 'Papa 2 kg', desc: '', precio: 2800, emoji: '🥔' },
    { nombre: 'Tomate redondo 1 kg', desc: '', precio: 3100, emoji: '🍅' },
    { nombre: 'Banana 1 kg', desc: '', precio: 2600, emoji: '🍌' },
    { nombre: 'Bolsón de verduras de estación', desc: '5 kg surtidos', precio: 9500, emoji: '🧺' },
  ]},
  { id: 'c9', nombre: 'Patitas Pet Shop', cat: 'pet', loc: 'Nordelta', dir: 'Centro Comercial Nordelta, local 12', desc: 20, emoji: '🐾', color: '#6b3fa0', prep: 15, productos: [
    { nombre: 'Alimento perro adulto 3 kg', desc: '', precio: 15800, emoji: '🐕' },
    { nombre: 'Alimento gato 1,5 kg', desc: '', precio: 9900, emoji: '🐈' },
    { nombre: 'Piedras sanitarias 4 kg', desc: '', precio: 4500, emoji: '🪨' },
  ]},
  { id: 'c10', nombre: 'Librería El Delta', cat: 'libreria', loc: 'Tigre Centro', dir: 'Av. Liniers 210', desc: 10, emoji: '📚', color: '#1d5f8a', prep: 15, productos: [
    { nombre: 'Cuaderno tapa dura 48 h', desc: '', precio: 3900, emoji: '📓' },
    { nombre: 'Caja de lápices x 12', desc: '', precio: 4600, emoji: '✏️' },
    { nombre: 'Resma A4 500 hojas', desc: '', precio: 8900, emoji: '📄' },
  ]},
  { id: 'c11', nombre: 'Farmacia Pacheco', cat: 'farmacia', loc: 'General Pacheco', dir: 'Av. Boulogne Sur Mer 2200', desc: 10, emoji: '💊', color: '#0f7a6e', prep: 10, productos: [
    { nombre: 'Protector solar FPS 50', desc: '200 ml', precio: 18500, emoji: '🧴' },
    { nombre: 'Alcohol en gel 250 ml', desc: '', precio: 3200, emoji: '🧼' },
    { nombre: 'Pañales talle G x 30', desc: '', precio: 16400, emoji: '👶' },
  ]},
  { id: 'c12', nombre: 'Tienda Delta Ropa', cat: 'ropa', loc: 'Benavídez', dir: 'Av. Benavídez 1500', desc: 20, emoji: '👕', color: '#7a3355', prep: 20, productos: [
    { nombre: 'Remera algodón lisa', desc: 'Talles S a XXL', precio: 14900, emoji: '👕' },
    { nombre: 'Buzo con capucha', desc: 'Frisa', precio: 32000, emoji: '🧥' },
    { nombre: 'Medias x 3 pares', desc: '', precio: 6900, emoji: '🧦' },
  ]},
  { id: 'c13', nombre: 'Gimnasio Activo Talar', foto: 'gym', cat: 'deporte', loc: 'El Talar', dir: 'Av. Constituyentes 3550', desc: 15, emoji: '🏋️', color: '#2F5D8A', prep: 0, servicio: true, productos: [
    { nombre: 'Clase de prueba', desc: 'Funcional o musculación, 1 hora', precio: 6000, emoji: '🏋️' },
    { nombre: 'Pase libre mensual', desc: 'Sala de musculación sin límite', precio: 42000, emoji: '🏋️' },
    { nombre: 'Pack 8 clases de funcional', desc: 'Válido por 30 días', precio: 30000, emoji: '🏃' },
  ]},
  { id: 'c14', nombre: 'Estilo Nordelta Peluquería', cat: 'belleza', loc: 'Nordelta', dir: 'Av. de los Lagos 7200, local 4', desc: 20, emoji: '💇', color: '#8A3F6B', prep: 0, servicio: true, productos: [
    { nombre: 'Corte y peinado', desc: 'Lavado incluido', precio: 18000, emoji: '💇' },
    { nombre: 'Color completo', desc: 'Con tratamiento', precio: 45000, emoji: '💇' },
    { nombre: 'Manicuría semipermanente', desc: '', precio: 16000, emoji: '💅' },
  ]},
  { id: 'c15', nombre: 'Óptica Visión Delta', cat: 'salud', loc: 'Benavídez', dir: 'Av. Benavídez 1320', desc: 25, emoji: '👓', color: '#1F6B6B', prep: 0, servicio: true, productos: [
    { nombre: 'Control visual', desc: 'Con optómetra, 30 minutos', precio: 12000, emoji: '👓' },
    { nombre: 'Anteojos recetados', desc: 'Armazón + cristales monofocales', precio: 95000, emoji: '👓' },
  ]},
  { id: 'c16', nombre: 'Taller Mecánico Torcuato', cat: 'auto', loc: 'Don Torcuato', dir: 'Av. Marquez 1800', desc: 10, emoji: '🔧', color: '#4A4F5C', prep: 0, servicio: true, productos: [
    { nombre: 'Service básico', desc: 'Aceite, filtros y revisión general', precio: 85000, emoji: '🔧' },
    { nombre: 'Alineación y balanceo', desc: '4 ruedas', precio: 38000, emoji: '🚗' },
  ]},
  { id: 'c17', nombre: 'TecnoFix Pacheco', cat: 'tecno', loc: 'General Pacheco', dir: 'Av. Hipólito Yrigoyen 1450', desc: 15, emoji: '📱', color: '#3B4E7A', prep: 0, servicio: true, productos: [
    { nombre: 'Cambio de batería de celular', desc: 'En el día', precio: 35000, emoji: '📱' },
    { nombre: 'Cambio de pantalla', desc: 'Presupuesto según modelo', precio: 90000, emoji: '📱' },
  ]},
  { id: 'c18', nombre: 'Hostería Isla Verde', foto: 'puerto', cat: 'turismo', loc: 'Delta', dir: 'Río Sarmiento, muelle 412', desc: 20, emoji: '🏝️', color: '#2E6B4F', prep: 0, servicio: true, productos: [
    { nombre: 'Noche en habitación doble', desc: 'Con desayuno', precio: 98000, emoji: '🏝️' },
    { nombre: 'Paseo en lancha por las islas', desc: '1 hora y media', precio: 25000, emoji: '🚤' },
  ]},
  { id: 'c19', nombre: 'Cine del Paseo', cat: 'entretenimiento', loc: 'Tigre Centro', dir: 'Paseo Victorica 520', desc: 30, emoji: '🎬', color: '#5A2E6B', prep: 0, servicio: true, productos: [
    { nombre: 'Entrada 2D', desc: 'Cualquier función', precio: 9000, emoji: '🎬' },
    { nombre: 'Combo pochoclo y gaseosa', desc: '', precio: 8500, emoji: '🥤' },
  ]},
  { id: 'c20', nombre: 'Instituto de Inglés Delta', cat: 'educacion', loc: 'Benavídez', dir: 'Av. Benavídez 980', desc: 20, emoji: '🎓', color: '#2C5F8A', prep: 0, servicio: true, productos: [
    { nombre: 'Clase de nivelación', desc: 'Gratis con tu credencial', precio: 0, emoji: '🎓' },
    { nombre: 'Cuota mensual', desc: '2 clases por semana', precio: 48000, emoji: '🎓' },
  ]},
  { id: 'c21', nombre: 'Ferretería El Tornillo', cat: 'hogar', loc: 'Don Torcuato', dir: 'Av. Marquez 760', desc: 10, emoji: '🔧', color: '#7A5A2E', prep: 15, productos: [
    { nombre: 'Juego de destornilladores', desc: '6 piezas', precio: 14500, emoji: '🔧' },
    { nombre: 'Lámpara LED 12 W', desc: 'Pack x 3', precio: 7800, emoji: '💡' },
    { nombre: 'Cinta métrica 5 m', desc: '', precio: 6200, emoji: '🔧' },
  ]},
];

const TRAMITES = [
  { id: 'licencia', nombre: 'Licencia de conducir', lugar: 'Centro de Licencias, Av. Italia 1100', emoji: '🚗' },
  { id: 'zoonosis', nombre: 'Zoonosis (castración y vacunas)', lugar: 'Centro de Zoonosis, El Talar', emoji: '🐶' },
  { id: 'medico', nombre: 'Turno médico municipal', lugar: 'Centro de Salud de tu localidad', emoji: '🩺' },
  { id: 'tasas', nombre: 'Consulta de tasas municipales', lugar: 'Atención al vecino, Tigre Centro', emoji: '🧾' },
];

const TIPOS_RECLAMO = [
  { id: 'alumbrado', nombre: 'Alumbrado', emoji: '💡' },
  { id: 'bacheo', nombre: 'Bacheo', emoji: '🚧' },
  { id: 'poda', nombre: 'Poda', emoji: '🌳' },
  { id: 'residuos', nombre: 'Residuos', emoji: '🗑️' },
];

const AVISOS = [
  { tipo: 'transito', emoji: '🚦', titulo: 'Corte parcial en Av. Cazón', texto: 'Por obras, entre Liniers y Mitre, hasta el viernes.' },
  { tipo: 'clima', emoji: '🌧️', titulo: 'Alerta amarilla por lluvias', texto: 'Para esta tarde. Evitá circular por calles anegadas.' },
  { tipo: 'servicio', emoji: '💧', titulo: 'Baja presión de agua en El Talar', texto: 'Trabajos de mantenimiento hasta las 18 h.' },
];

const AGENDA = [
  { dia: 'Sáb 14', emoji: '🎪', titulo: 'Feria en el Puerto de Frutos', texto: 'Artesanos y productores locales, de 10 a 19 h.' },
  { dia: 'Dom 15', emoji: '🎶', titulo: 'Música en el Paseo Victorica', texto: 'Bandas locales al aire libre, 17 h. Gratis.' },
  { dia: 'Mié 18', emoji: '🎨', titulo: 'Taller de cerámica', texto: 'Centro cultural de Benavídez, con inscripción.' },
  { dia: 'Sáb 21', emoji: '🏃', titulo: 'Corrida por el Delta', texto: '5 y 10 km. Inscripción gratuita con tu credencial.' },
];

// ---------- agregados v2 ----------
// Centro aproximado de cada localidad, para los mapas.
const LOC_COORDS = {
  'Tigre Centro': [-34.4255, -58.5797],
  'Nordelta': [-34.4027, -58.6430],
  'Don Torcuato': [-34.4900, -58.6250],
  'El Talar': [-34.4720, -58.6560],
  'Benavídez': [-34.4120, -58.6960],
  'General Pacheco': [-34.4600, -58.6380],
  'Delta': [-34.3850, -58.5650],
};

// Comercios donde el beneficio se usa en el local, mostrando la credencial. Nombres inventados.
const BENEFICIOS = [
  { nombre: 'Supermercado La Ribera', rubro: 'almacen', loc: 'Tigre Centro', emoji: '🛒', texto: '10% de descuento', dias: 'Martes y miércoles', tope: 'Tope $8.000 por semana' },
  { nombre: 'Súper Pacheco', rubro: 'almacen', loc: 'General Pacheco', emoji: '🛒', texto: '10% de descuento', dias: 'Todos los días', tope: 'Tope $6.000 por semana' },
  { nombre: 'Autoservicio El Talar', rubro: 'almacen', loc: 'El Talar', emoji: '🛒', texto: '8% de descuento', dias: 'Lunes a jueves', tope: '' },
  { nombre: 'Farmacia del Puerto', rubro: 'farmacia', loc: 'Tigre Centro', emoji: '💊', texto: 'Hasta 40% en perfumería', dias: 'Todos los días', tope: '' },
  { nombre: 'Farmacia Torcuato', rubro: 'farmacia', loc: 'Don Torcuato', emoji: '💊', texto: '20% en medicamentos de venta libre', dias: 'Todos los días', tope: '' },
  { nombre: 'Óptica Visión Delta', rubro: 'salud', loc: 'Benavídez', emoji: '👓', texto: '25% en anteojos recetados', dias: 'Todos los días', tope: '' },
  { nombre: 'Heladería Río Tigre', rubro: 'gastro', loc: 'Tigre Centro', emoji: '🍦', texto: '15% de descuento', dias: 'Lunes a viernes', tope: '' },
  { nombre: 'Cervecería Nordelta', rubro: 'gastro', loc: 'Nordelta', emoji: '🍺', texto: '2x1 en pintas', dias: 'Jueves', tope: '' },
  { nombre: 'Panadería La Espiga', rubro: 'gastro', loc: 'Don Torcuato', emoji: '🥐', texto: '10% de descuento', dias: 'Todos los días', tope: '' },
  { nombre: 'Lancha Delta Paseos', rubro: 'turismo', loc: 'Delta', emoji: '🚤', texto: '30% en paseos por las islas', dias: 'Lunes a viernes', tope: '' },
  { nombre: 'Hostería Isla Verde', rubro: 'turismo', loc: 'Delta', emoji: '🏝️', texto: '20% en estadías', dias: 'Domingo a jueves', tope: '' },
  { nombre: 'Gimnasio Activo Talar', rubro: 'deporte', loc: 'El Talar', emoji: '🏋️', texto: 'Matrícula gratis y 15% en la cuota', dias: '', tope: '' },
  { nombre: 'Instituto de Inglés Delta', rubro: 'educacion', loc: 'Benavídez', emoji: '🎓', texto: '20% en la cuota mensual', dias: '', tope: '' },
  { nombre: 'Zapatería Paso a Paso', rubro: 'ropa', loc: 'General Pacheco', emoji: '👟', texto: '15% de descuento', dias: 'Todos los días', tope: '' },
  { nombre: 'Veterinaria Huellitas', rubro: 'pet', loc: 'Nordelta', emoji: '🐾', texto: '15% en consultas', dias: 'Lunes a sábado', tope: '' },
  { nombre: 'Barbería Puerto', rubro: 'belleza', loc: 'Tigre Centro', emoji: '💇', texto: '20% en cortes', dias: 'Lunes a jueves', tope: '' },
  { nombre: 'Spa del Río', rubro: 'belleza', loc: 'Nordelta', emoji: '💅', texto: '15% en tratamientos', dias: 'Todos los días', tope: '' },
  { nombre: 'Teatro del Delta', rubro: 'entretenimiento', loc: 'Tigre Centro', emoji: '🎬', texto: '2x1 en entradas', dias: 'Jueves y domingos', tope: '' },
  { nombre: 'Parque acuático Tigre (demo)', rubro: 'entretenimiento', loc: 'Tigre Centro', emoji: '🎬', texto: '50% en el pase del titular', dias: 'No incluye feriados', tope: '' },
  { nombre: 'Lavadero Pacheco', rubro: 'auto', loc: 'General Pacheco', emoji: '🚗', texto: '15% en lavado completo', dias: 'Lunes a viernes', tope: '' },
  { nombre: 'Kinesiología Benavídez', rubro: 'salud', loc: 'Benavídez', emoji: '🩺', texto: '20% en sesiones', dias: '', tope: '' },
  { nombre: 'Club Náutico Delta', rubro: 'deporte', loc: 'Delta', emoji: '🚤', texto: '25% en clases de remo', dias: 'Fines de semana', tope: '' },
  { nombre: 'Hotel Boutique Victorica', rubro: 'turismo', loc: 'Tigre Centro', emoji: '🏝️', texto: '20% en estadías', dias: 'Domingo a jueves', tope: '' },
  { nombre: 'Celulares Talar', rubro: 'tecno', loc: 'El Talar', emoji: '📱', texto: '10% en accesorios', dias: 'Todos los días', tope: '' },
  { nombre: 'Ferretería El Tornillo', rubro: 'hogar', loc: 'Don Torcuato', emoji: '🔧', texto: '10% de descuento', dias: 'Todos los días', tope: '' },
];

// Rubros extra que solo aparecen en Beneficios.
const RUBROS_EXTRA = []; // todos los rubros ya están en CATS

const FARMACIAS = [
  { nombre: 'Farmacia del Puerto', loc: 'Tigre Centro', dir: 'Av. Cazón 980', tel: '4749-0000' },
  { nombre: 'Farmacia Central Tigre', loc: 'Tigre Centro', dir: 'Av. Liniers 640', tel: '4731-0000' },
  { nombre: 'Farmacia Pacheco', loc: 'General Pacheco', dir: 'Av. Boulogne Sur Mer 2200', tel: '4740-0000' },
  { nombre: 'Farmacia Torcuato', loc: 'Don Torcuato', dir: 'Av. Marquez 1100', tel: '4748-0000' },
  { nombre: 'Farmacia Los Lagos', loc: 'Nordelta', dir: 'Av. de los Lagos 6800', tel: '4871-0000' },
  { nombre: 'Farmacia San Benito', loc: 'Benavídez', dir: 'Av. Benavídez 700', tel: '4871-1000' },
  { nombre: 'Farmacia El Talar', loc: 'El Talar', dir: 'Av. Constituyentes 3100', tel: '4736-0000' },
];

// Colectivos: líneas y paradas de ejemplo, con arribos simulados.
const LINEAS = [
  { id: '60', color: '#1d5f8a', frecuencia: 9 },
  { id: '203', color: '#b5541c', frecuencia: 14 },
  { id: '720', color: '#2e6b3a', frecuencia: 18 },
  { id: '723', color: '#6b3fa0', frecuencia: 22 },
];
const PARADAS = [
  { id: 'estacion', nombre: 'Estación Tigre', lineas: ['60', '203', '720'] },
  { id: 'cazon', nombre: 'Av. Cazón y Liniers', lineas: ['60', '723'] },
  { id: 'pacheco', nombre: 'Centro de Pacheco', lineas: ['203', '720', '723'] },
  { id: 'torcuato', nombre: 'Estación Don Torcuato', lineas: ['203', '723'] },
];

const ZONAS_ESTAC = [
  { id: 'A', nombre: 'Zona A · Tigre Centro', tarifa: 900 },
  { id: 'B', nombre: 'Zona B · Paseo Victorica', tarifa: 1200 },
  { id: 'C', nombre: 'Zona C · Centro de Pacheco', tarifa: 700 },
];

const ESTADOS_RECLAMO = ['recibido', 'asignado', 'en curso', 'resuelto'];

// ---------- Puntos Tigre ----------
const PUNTOS = {
  porCompra: 1000, // 1 punto cada $1.000 gastados en comercios adheridos
  tasaATiempo: 200, // por cuota pagada antes del vencimiento
  tasaVencida: 50,
  reclamoResuelto: 100,
  reciclar: 40,
  vencenMeses: 12,
};
const FORMAS_SUMAR = [
  { emoji: '🛍️', txt: 'Comprar en comercios adheridos', pts: '1 punto cada $1.000' },
  { emoji: '🧾', txt: 'Pagar la tasa antes del vencimiento', pts: '200 por cuota' },
  { emoji: '♻️', txt: 'Reciclar en un punto verde (escaneando su QR)', pts: '40 por entrega' },
  { emoji: '📣', txt: 'Un reclamo tuyo que la cuadrilla resuelve', pts: '100' },
  { emoji: '📅', txt: 'Ir al turno que pediste', pts: '30' },
];
const CANJES = [
  { id: 'cupon', emoji: '🎟️', txt: 'Cupón de $2.000 en un comercio adherido', costo: 400, detalle: 'Se descuenta solo en tu próximo pedido por la app.' },
  { id: 'tasa', emoji: '🧾', txt: '10% en tu próxima cuota de tasa', costo: 600, detalle: 'Tope de $3.000 por cuota. Requiere ordenanza municipal.' },
  { id: 'estac', emoji: '🚗', txt: '$1.500 de saldo de estacionamiento', costo: 300, detalle: 'Se acredita al instante.' },
  { id: 'evento', emoji: '🎪', txt: 'Entrada para una actividad cultural', costo: 250, detalle: 'Recibís un código para presentar en la entrada.' },
];
const NIVELES = [
  { nombre: 'Cachorro', desde: 0, emoji: '🐾' },
  { nombre: 'Tigre', desde: 1000, emoji: '🐯' },
  { nombre: 'Tigre de Oro', desde: 3000, emoji: '🏆' },
];
const PUNTOS_VERDES = ['Punto Verde Plaza Mitre (Tigre Centro)', 'Punto Verde Nordelta Centro', 'Punto Verde Don Torcuato Estación', 'Punto Verde El Talar'];

// ---------- Perfiles de la demo ----------
const PERFILES = [
  { id: 'lucia', nombre: 'Lucía', rol: 'Vecina de Tigre Centro', avatar: '👩🏻', color: '#D02013', vista: 'vecino',
    hace: 'Usa la app en el celu: beneficios, pedidos, trámites, puntos y Tigri.', entra: 'Entraría con Mi Argentina' },
  { id: 'rosa', nombre: 'Rosa', rol: 'Dueña de Pastas Doña Rosa', avatar: '👩🏻‍🍳', color: '#b5541c', vista: 'comercio', cid: 'c2',
    hace: 'Recibe pedidos, carga productos y ve cuánto ahorró en comisiones.', entra: 'Entraría con el CUIT y la clave del comercio' },
  { id: 'carlos', nombre: 'Carlos', rol: 'Atención al Vecino · Municipio', avatar: '👨🏽‍💼', color: '#515769', vista: 'atencion',
    hace: 'Gestiona los reclamos en el mapa y los turnos del día.', entra: 'Entraría con su usuario municipal' },
  { id: 'marina', nombre: 'Marina', rol: 'Desarrollo Económico · Municipio', avatar: '👩🏽‍💼', color: '#3A3F4D', vista: 'economia',
    hace: 'Mide el impacto: ventas por localidad, comercios y comisiones que quedan en Tigre.', entra: 'Entraría con su usuario municipal' },
];

// Turnos del día que ve Atención al Vecino (inventados para la demo).
const TURNOS_DEMO = [
  { hora: '08:30', nombre: 'Juan P.', tramite: 'licencia' },
  { hora: '09:00', nombre: 'Marta G.', tramite: 'zoonosis' },
  { hora: '09:30', nombre: 'Sergio L.', tramite: 'licencia' },
  { hora: '10:30', nombre: 'Ana R.', tramite: 'medico' },
  { hora: '11:00', nombre: 'Pablo D.', tramite: 'tasas' },
];

// ---------- Feedback de quienes ven el prototipo (se guarda en Supabase) ----------
// Si url o key están vacíos, el feedback queda guardado solo en el navegador.
// Tabla soytigreya_feedback en el proyecto Supabase de Reparto (solo permite agregar). La clave publicable es pública por diseño.
const FEEDBACK = { url: 'https://jzefklukeiyeokpomkiv.supabase.co', key: 'sb_publishable__fEK77Puwz9u-h_tEXPrzg_SJ_gxln_', tabla: 'soytigreya_feedback' };

// ---------- Deporte en Tigre ----------
// El distrito tiene una red de 18 polideportivos municipales (fuente: notas de prensa 2019 y 2026).
// Nombres reales citados en medios; localidades, horarios y cupos son de demostración.
const POLIDEPORTIVOS = [
  { id: 'sarmiento', nombre: 'Polideportivo Sarmiento', loc: 'Tigre Centro', nota: 'Pista de atletismo "Abel Acevedo", homologada', disc: ['Atletismo', 'Natación', 'Gimnasia artística'], emoji: '🏃' },
  { id: 'errecart', nombre: 'Polideportivo Ñato Errecart', loc: 'Benavídez', nota: 'Barrio La Mascota · pileta climatizada', disc: ['Natación', 'Fútbol', 'Vóley', 'Básquet'], emoji: '🌊' },
  { id: 'micro', nombre: 'Microestadio Ciudad de Benavídez', loc: 'Benavídez', nota: 'Estadio cubierto para torneos', disc: ['Básquet', 'Vóley', 'Handball'], emoji: '🏆' },
  { id: 'pacheco', nombre: 'Polideportivo N.º 10 General Pacheco', loc: 'General Pacheco', nota: 'Deporte adaptado y escuelas deportivas', disc: ['Deporte adaptado', 'Fútbol', 'Tenis'], emoji: '♿' },
  { id: 'moreno', nombre: 'Polideportivo N.º 6 Mariano Moreno', loc: 'El Talar', nota: 'Actividades para adultos mayores', disc: ['Newcom', 'Gimnasia', 'Fútbol'], emoji: '🏋️' },
  { id: 'zabala', nombre: 'Polideportivo Zabala', loc: 'Don Torcuato', nota: 'Canchas de fútbol y playón', disc: ['Fútbol', 'Hockey', 'Patín'], emoji: '⚽' },
  { id: 'remo', nombre: 'Escuela de remo · Río Luján', loc: 'Tigre Centro', nota: 'Con clubes del Delta, la capital del remo', disc: ['Remo', 'Kayak'], emoji: '🚣' },
];

const ACTIVIDADES = [
  { id: 'a1', disc: 'Natación', pid: 'errecart', edad: 'De 6 a 12 años', dias: 'Lunes y miércoles 17:00', cupos: 6, emoji: '🌊' },
  { id: 'a2', disc: 'Atletismo', pid: 'sarmiento', edad: 'Desde 14 años', dias: 'Martes y jueves 18:30', cupos: 12, emoji: '🏃' },
  { id: 'a3', disc: 'Fútbol infantil', pid: 'zabala', edad: 'De 7 a 12 años', dias: 'Sábados 10:00', cupos: 4, emoji: '⚽' },
  { id: 'a4', disc: 'Vóley', pid: 'micro', edad: 'Desde 13 años', dias: 'Martes y jueves 19:00', cupos: 8, emoji: '🏐' },
  { id: 'a5', disc: 'Básquet', pid: 'micro', edad: 'De 10 a 16 años', dias: 'Lunes y viernes 18:00', cupos: 9, emoji: '🏀' },
  { id: 'a6', disc: 'Gimnasia artística', pid: 'sarmiento', edad: 'De 5 a 10 años', dias: 'Viernes 17:30', cupos: 3, emoji: '🤸' },
  { id: 'a7', disc: 'Remo', pid: 'remo', edad: 'Desde 12 años', dias: 'Sábados y domingos 9:00', cupos: 5, emoji: '🚣' },
  { id: 'a8', disc: 'Deporte adaptado', pid: 'pacheco', edad: 'Todas las edades', dias: 'Miércoles 16:00', cupos: 10, emoji: '♿' },
  { id: 'a9', disc: 'Newcom', pid: 'moreno', edad: 'Mayores de 60', dias: 'Lunes y viernes 10:00', cupos: 15, emoji: '🏐' },
];

const COLONIA = { titulo: 'Colonia de verano 2027', texto: 'Del 5 de enero al 26 de febrero en 12 polideportivos. Pileta, deportes y recreación con docentes, guardavidas y médicos. Gratis para vecinos con domicilio en Tigre.', emoji: '☀️' };

// ---------- Publicidad ----------
// Espacios para comercios adheridos y campañas del municipio. Siempre rotulados como publicidad.
const PUBLICIDADES = [
  { id: 'p1', tipo: 'Campaña municipal', titulo: 'Vacunación antirrábica gratuita', texto: 'Este sábado en el Polideportivo Sarmiento, de 9 a 13 h.', color: '#1F6F5C', emoji: '🐶', a: 'serv', v: 'agenda', foto: 'perro' },
  { id: 'p2', tipo: 'Publicidad', titulo: 'Hostería Isla Verde', texto: 'Escapada al Delta con 20% Soy Tigre reservando por la app.', color: '#2E5E4E', emoji: '🏝️', a: 'abrir', v: 'c18', foto: 'delta' },
  { id: 'p3', tipo: 'Publicidad', titulo: 'Gimnasio Activo Talar', texto: 'Primera clase gratis reservando por la app.', color: '#2F3A56', emoji: '🏋️', a: 'abrir', v: 'c13', foto: 'gym' },
  { id: 'p4', tipo: 'Campaña municipal', titulo: 'Colonia de verano 2027', texto: 'Inscripción abierta hasta el 20 de diciembre.', color: '#C2410C', emoji: '☀️', a: 'sub', v: 'deportes' },
];

// ---------- Trabajo y formación ----------
// Inspirado en el Portal de Empleo del municipio (empleos.tigre.gob.ar), Punto Empleo
// y el Tigre Instituto Formativo (TIF). Búsquedas y cursos de demostración.
const EMPLEOS = [
  { id: 'e1', puesto: 'Ayudante de cocina', empresa: 'Pastas Doña Rosa', rubro: 'Gastronomía', loc: 'Tigre Centro', jornada: 'Medio tiempo · tarde', dias: 2, req: ['Experiencia no excluyente', 'Manipulación de alimentos'], emoji: '🍝' },
  { id: 'e2', puesto: 'Vendedor/a de mostrador', empresa: 'Ferretería El Tornillo', rubro: 'Comercio', loc: 'Don Torcuato', jornada: 'Tiempo completo', dias: 1, req: ['Secundario completo', 'Conocimientos de ferretería'], emoji: '🔧' },
  { id: 'e3', puesto: 'Operario/a de producción', empresa: 'Empresa del Parque Industrial', rubro: 'Industria', loc: 'General Pacheco', jornada: 'Turno rotativo', dias: 3, req: ['Secundario completo', 'Disponibilidad horaria'], emoji: '🏭' },
  { id: 'e4', puesto: 'Recepcionista', empresa: 'Hostería Isla Verde', rubro: 'Turismo', loc: 'Delta', jornada: 'Fines de semana', dias: 4, req: ['Inglés básico', 'Atención al público'], emoji: '🏝️' },
  { id: 'e5', puesto: 'Repartidor/a con moto', empresa: 'Almacén Benavídez', rubro: 'Logística', loc: 'Benavídez', jornada: 'Medio tiempo · mañana', dias: 5, req: ['Moto propia', 'Licencia vigente'], emoji: '🛵' },
  { id: 'e6', puesto: 'Técnico/a en celulares', empresa: 'TecnoFix Pacheco', rubro: 'Oficios', loc: 'General Pacheco', jornada: 'Tiempo completo', dias: 6, req: ['Curso de reparación', 'Experiencia de 1 año'], emoji: '📱' },
  { id: 'e7', puesto: 'Instructor/a de musculación', empresa: 'Gimnasio Activo Talar', rubro: 'Deporte', loc: 'El Talar', jornada: 'Medio tiempo · noche', dias: 2, req: ['Profesorado de Educación Física o en curso'], emoji: '🏋️' },
];

const CURSOS = [
  { id: 'k1', nombre: 'Electricidad domiciliaria', area: 'Oficios', dur: '4 meses', modo: 'Presencial', sede: 'TIF · Tigre Centro', inicio: 'Marzo 2027', cupos: 8, emoji: '💡' },
  { id: 'k2', nombre: 'Soldadura', area: 'Oficios', dur: '3 meses', modo: 'Presencial', sede: 'TIF · General Pacheco', inicio: 'Marzo 2027', cupos: 5, emoji: '🔥' },
  { id: 'k3', nombre: 'Pastelería profesional', area: 'Gastronomía', dur: '3 meses', modo: 'Presencial', sede: 'TIF · El Talar', inicio: 'Febrero 2027', cupos: 6, emoji: '🍰' },
  { id: 'k4', nombre: 'Excel para el trabajo', area: 'Digital', dur: '6 semanas', modo: 'Virtual', sede: 'Campus virtual TIF', inicio: 'Diciembre 2026', cupos: 30, emoji: '📊' },
  { id: 'k5', nombre: 'Marketing digital para comercios', area: 'Digital', dur: '2 meses', modo: 'Virtual', sede: 'Campus virtual TIF', inicio: 'Diciembre 2026', cupos: 25, emoji: '📱' },
  { id: 'k6', nombre: 'Peluquería y barbería', area: 'Belleza', dur: '5 meses', modo: 'Presencial', sede: 'TIF · Benavídez', inicio: 'Marzo 2027', cupos: 4, emoji: '💇' },
  { id: 'k7', nombre: 'Inglés para atención al turista', area: 'Idiomas', dur: '4 meses', modo: 'Híbrido', sede: 'TIF · Tigre Centro', inicio: 'Marzo 2027', cupos: 12, emoji: '🎓' },
  { id: 'k8', nombre: 'Reparación de celulares', area: 'Oficios', dur: '2 meses', modo: 'Presencial', sede: 'TIF · Don Torcuato', inicio: 'Febrero 2027', cupos: 7, emoji: '🛠️' },
];

const PUNTO_EMPLEO = { titulo: 'Punto Empleo', texto: 'Asesoramiento gratis para armar tu CV y prepararte para una entrevista. Próximo operativo: martes 24, de 10 a 15 h, en el Instituto Superior de Tigre.' };

// ---------- Salud ----------
// Red municipal de salud de Tigre (fuentes: notas de prensa 2019-2026 y Ministerio de Salud PBA).
// Nombres de hospitales reales; especialidades por centro y horarios de turnos son de demostración.
const CENTROS_SALUD = [
  { id: 'nores', nombre: 'HDI Dr. Valentín Nores', tipo: 'Hospital de Diagnóstico Inmediato', loc: 'Tigre Centro', guardia: true, esp: ['Clínica médica', 'Pediatría', 'Traumatología', 'Laboratorio'] },
  { id: 'mocoroa', nombre: 'HDI Dr. Eduardo Juan Mocoroa', tipo: 'Hospital de Diagnóstico Inmediato', loc: 'Benavídez', guardia: true, esp: ['Clínica médica', 'Pediatría', 'Ginecología', 'Laboratorio'] },
  { id: 'ferrara', nombre: 'HDI Dr. Floreal Ferrara', tipo: 'Hospital de Diagnóstico Inmediato', loc: 'Don Torcuato', guardia: true, esp: ['Clínica médica', 'Pediatría', 'Diagnóstico por imágenes'] },
  { id: 'escardo', nombre: 'Hospital Materno Infantil Dr. Florencio Escardó', tipo: 'Hospital · 140 camas', loc: 'Tigre Centro', guardia: true, esp: ['Pediatría', 'Obstetricia', 'Neonatología'] },
  { id: 'cardio', nombre: 'Hospital Cardiovascular', tipo: 'Hospital especializado', loc: 'Tigre Centro', guardia: false, esp: ['Cardiología'] },
  { id: 'oftalmo', nombre: 'Hospital Oftalmológico', tipo: 'Hospital especializado', loc: 'Tigre Centro', guardia: false, esp: ['Oftalmología'] },
  { id: 'odonto', nombre: 'Hospital Odontológico', tipo: 'Hospital especializado', loc: 'Tigre Centro', guardia: false, esp: ['Odontología'] },
  { id: 'cafys', nombre: 'CAFyS de tu barrio', tipo: 'Centro de Atención Familiar y de Salud · 23 en el distrito', loc: 'Todas las localidades', guardia: false, esp: ['Clínica médica', 'Pediatría', 'Ginecología', 'Vacunación', 'Salud mental'] },
];
const SALUD_INFO = { turnosTel: '0800-444-3400', emergencias: '107' };

const FOTO = (k) => `img/fotos/${k}.jpg`;
