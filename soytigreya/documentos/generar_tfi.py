import sys
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SALIDA = sys.argv[1]
CAPT = sys.argv[2]
AZUL = RGBColor(0x51, 0x57, 0x69)
NARANJA = RGBColor(0xD0, 0x20, 0x13)

doc = Document()
sec = doc.sections[0]
sec.page_height, sec.page_width = Cm(29.7), Cm(21)
sec.top_margin = sec.bottom_margin = Cm(2.5)
sec.left_margin = sec.right_margin = Cm(2.5)

def fuente(estilo, tam, negrita=False, color=None):
    s = doc.styles[estilo]
    s.font.name = 'Arial'
    s.element.rPr.rFonts.set(qn('w:eastAsia'), 'Arial')
    s.font.size = Pt(tam)
    s.font.bold = negrita
    if color: s.font.color.rgb = color
    return s

normal = fuente('Normal', 11)
normal.paragraph_format.line_spacing = 1.5
normal.paragraph_format.space_after = Pt(3)
for nombre, tam in (('Heading 1', 14), ('Heading 2', 12)):
    h = fuente(nombre, tam, True, AZUL)
    h.paragraph_format.space_before = Pt(10 if nombre == 'Heading 1' else 6)
    h.paragraph_format.space_after = Pt(3)
    h.paragraph_format.keep_with_next = True
    h.paragraph_format.line_spacing = 1.15
    h.font.italic = False

def p(texto, just=True, negrita_inicio=None):
    par = doc.add_paragraph()
    if negrita_inicio:
        r = par.add_run(negrita_inicio); r.bold = True
    par.add_run(texto)
    if just: par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    return par

def viñetas(items):
    for it in items:
        par = doc.add_paragraph(style='List Bullet')
        par.paragraph_format.line_spacing = 1.5
        par.paragraph_format.space_after = Pt(2)
        if isinstance(it, tuple):
            r = par.add_run(it[0]); r.bold = True
            par.add_run(it[1])
        else:
            par.add_run(it)
        par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

def sombrear(celda, color):
    tcPr = celda._tc.get_or_add_tcPr()
    sh = OxmlElement('w:shd'); sh.set(qn('w:val'), 'clear'); sh.set(qn('w:color'), 'auto'); sh.set(qn('w:fill'), color)
    tcPr.append(sh)

def tabla(filas, anchos):
    t = doc.add_table(rows=len(filas), cols=len(filas[0]))
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, fila in enumerate(filas):
        for j, txt in enumerate(fila):
            c = t.cell(i, j)
            c.width = Cm(anchos[j])
            c.text = ''
            par = c.paragraphs[0]
            par.paragraph_format.line_spacing = 1.15
            par.paragraph_format.space_after = Pt(2)
            r = par.add_run(txt); r.font.size = Pt(10)
            if i == 0:
                r.bold = True; r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF); sombrear(c, 'D02013')
            elif i % 2 == 0:
                sombrear(c, 'F2F3F5')
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return t

def numero_pagina(par):
    r = par.add_run()
    for tipo, txt in (('begin', None), (None, 'PAGE'), ('end', None)):
        if tipo:
            e = OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'), tipo); r._r.append(e)
        else:
            e = OxmlElement('w:instrText'); e.set(qn('xml:space'), 'preserve'); e.text = txt; r._r.append(e)

# ---------- portada ----------
sec.different_first_page_header_footer = True
pie = sec.footer.paragraphs[0]; pie.alignment = WD_ALIGN_PARAGRAPH.CENTER; numero_pagina(pie)
cab = sec.header.paragraphs[0]; cab.alignment = WD_ALIGN_PARAGRAPH.RIGHT
rc = cab.add_run('SoyTigreYa · Trabajo Final Integrador'); rc.font.size = Pt(9); rc.font.color.rgb = RGBColor(0x64, 0x70, 0x7D)

def centrado(txt, tam, negrita=False, color=None, antes=0, despues=6):
    par = doc.add_paragraph(); par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.space_before = Pt(antes); par.paragraph_format.space_after = Pt(despues)
    par.paragraph_format.line_spacing = 1.15
    r = par.add_run(txt); r.font.size = Pt(tam); r.bold = negrita
    if color: r.font.color.rgb = color
    return par

centrado('Universidad Nacional del Delta', 14, True, antes=20)
centrado('Diplomatura en Negocios Digitales e Innovación', 12)
centrado('Trabajo Final Integrador', 12, despues=60)
centrado('SoyTigreYa', 32, True, NARANJA)
centrado('Super-app municipal de beneficios, comercio de cercanía y servicios al vecino', 14, color=NARANJA, despues=16)
centrado('Propuesta de innovación digital para el Municipio de Tigre', 12, despues=150)
for etiqueta, valor in (('Alumna: ', 'Milagros Belén Sanabria'), ('Docente: ', 'Mg. Mauro Matías Alberti'), ('Modalidad: ', 'Individual'), ('Fecha: ', 'Noviembre de 2026')):
    par = doc.add_paragraph(); par.alignment = WD_ALIGN_PARAGRAPH.CENTER; par.paragraph_format.space_after = Pt(2)
    r = par.add_run(etiqueta); r.bold = True
    par.add_run(valor)
doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

# ---------- 1 ----------
doc.add_heading('1. Introducción y presentación del caso', 1)
p('Tigre es un partido del norte del conurbano bonaerense, con 446.925 habitantes según el Censo 2022, que combina realidades muy distintas: el casco histórico y el Delta, barrios cerrados como Nordelta y localidades de fuerte vida comercial como Don Torcuato, El Talar, General Pacheco y Benavídez. En ese territorio, el Municipio sostiene desde hace años la tarjeta de beneficios "Soy Tigre", que da descuentos a los vecinos en más de 500 comercios adheridos, y la app oficial "Tigre Municipio", donde se pueden pedir turnos médicos, hacer reclamos, gestionar la tarjeta y consultar la agenda y la altura del río.')
p('El caso elegido es la relación entre tres actores que hoy funcionan por separado: el vecino que quiere ahorrar y resolver trámites, el comercio de barrio que necesita vender y el municipio que busca dinamizar la economía local. Elegí este caso porque vivo la problemática de cerca: los comercios de la zona dependen cada vez más de plataformas de delivery con comisiones altas, mientras que los beneficios de la tarjeta municipal se usan sobre todo en el local y de forma manual. La propuesta, SoyTigreYa, busca transformar la tarjeta en una plataforma activa que integre beneficios, compras de cercanía y servicios municipales en una sola experiencia digital.')

# ---------- 2 ----------
doc.add_heading('2. Diagnóstico de la situación actual', 1)
doc.add_heading('Necesidad o problema observado', 2)
p('El comercio de cercanía compite en desventaja en el canal digital. Las grandes plataformas de pedidos cobran comisiones de entre el 20% y el 30% por pedido según el plan contratado, más cargos por el procesamiento de pagos, y la presión total sobre el comercio llega al 35% (Develop Argentina, 2026; iProfesional, 2026). Eso obliga al comercio a subir precios en la app o a resignar margen. Al mismo tiempo, el programa de beneficios municipal tiene alcance, pero no tiene un canal propio de venta: el descuento se valida en la caja, mostrando la tarjeta, y el municipio no obtiene información sobre cómo y dónde se usa.')
doc.add_heading('Dificultades de las personas y organizaciones involucradas', 2)
viñetas([
    ('Vecinos: ', 'la información está dispersa en varias apps (municipio, colectivos, alertas, turismo), deben recordar qué comercio tiene qué descuento y muchos trámites todavía requieren ir en persona o hacer filas.'),
    ('Comercios: ', 'pagan comisiones altas para estar en apps privadas, tienen poca formación digital y no cuentan con una herramienta simple para cargar productos, ofertas y horarios de retiro.'),
    ('Municipio: ', 'no puede medir el impacto real de la tarjeta, no tiene datos de consumo por localidad y gestiona reclamos con poca trazabilidad para el vecino, que no sabe en qué estado está su pedido.'),
])
doc.add_heading('Oportunidades de mejora', 2)
p('Existe una base instalada que reduce el costo de adopción: miles de vecinos ya tienen la tarjeta y la app municipal. Además, hay antecedentes en Argentina: MuniShop, del Banco Municipal de Rosario, una plataforma sin comisión que en 2023 reunía unos 150 comercios; Munimercado en Neuquén y Góndola Sancarlina en Mendoza, gratuitas para el comercio local; y Billetera Santa Fe, cuyo reintegro financiado entre el Estado y el comercio mueve el consumo de cercanía. Córdoba y la Ciudad de Buenos Aires, por su parte, ya ofrecen reclamos con foto, pagos integrados y asistentes conversacionales.')
doc.add_heading('Cambios posibles mediante herramientas digitales', 2)
viñetas([
    'Aplicar el descuento automáticamente al comprar por la app, sin cupones ni verificación manual.',
    'Dar a los comercios un canal de venta propio con comisión cero o mínima, limitada al costo de la pasarela de pago.',
    'Unificar en una sola app la credencial, los beneficios, las compras, los trámites, los pagos y los avisos.',
    'Generar datos de consumo y de reclamos por localidad para que el municipio tome mejores decisiones.',
])

# ---------- 3 ----------
doc.add_heading('3. Propuesta de innovación o negocio digital', 1)
doc.add_heading('En qué consiste', 2)
p('SoyTigreYa es una super-app municipal, de tipo marketplace y plataforma de servicios, que convierte la tarjeta Soy Tigre en el centro de una experiencia digital completa. Está organizada en cuatro perfiles que comparten los mismos datos, como ocurriría en la realidad: la vecina, la dueña de un comercio, el área de Atención al Vecino y el área de Desarrollo Económico del municipio; cada uno ve solo lo que necesita. Funciona en el celular como aplicación web instalable (PWA), lo que permite publicarla rápido y sin depender de las tiendas de aplicaciones en la primera etapa.')
doc.add_heading('Cómo funcionaría', 2)
viñetas([
    ('Credencial digital: ', 'un código QR que cambia cada 30 segundos para validar la identidad en la caja, más un historial que muestra cuánto ahorró el vecino cada mes.'),
    ('Beneficios: ', 'un directorio con lista y mapa de los comercios adheridos, filtrado por rubro y localidad, que distingue los beneficios para usar en el local de los que también se pueden pedir por la app.'),
    ('Compras con retiro en el local (takeaway): ', 'el vecino arma su pedido, el descuento se aplica solo, elige el horario de retiro y paga con Mercado Pago, Cuenta DNI, tarjeta o en efectivo. Recibe avisos cuando el pedido está en preparación y listo, y retira con un código que el comercio valida.'),
    ('Trámites y pagos: ', 'turnos (licencia de conducir, zoonosis, salud), reclamos con foto, ubicación en el mapa y seguimiento por etapas, pago de tasas, consulta y pago de multas con descuento, y estacionamiento medido con saldo.'),
    ('Servicios propios de Tigre: ', 'altura del río con pronóstico y niveles de alerta, arribos de colectivos, farmacias de turno y un botón de alerta que envía la ubicación al Centro de Operaciones.'),
    ('Tigri, la asistente: ', 'un asistente conversacional con la identidad del programa que responde en lenguaje cotidiano ("quiero pizza", "hay un bache en mi calle", "¿qué farmacia está de turno?") y lleva al vecino directamente a la acción que necesita.'),
    ('Puntos Tigre: ', 'un programa de recompensas que premia lo que le hace bien al distrito. El vecino suma puntos al comprar en comercios adheridos (1 punto cada $1.000), al pagar la tasa antes del vencimiento, al reciclar en un punto verde escaneando su código QR y cuando un reclamo suyo se resuelve. Los canjea por cupones en comercios, un descuento en la próxima cuota de la tasa municipal, saldo de estacionamiento medido o entradas a actividades culturales. Tiene niveles (Cachorro, Tigre y Tigre de Oro) para sostener el uso en el tiempo.'),
    ('Panel del comercio: ', 'pedidos en tres columnas (nuevos, en preparación, listos), carga de productos y precios, porcentaje de descuento y un resumen con las ventas y la comisión que se ahorró.'),
    ('Paneles del municipio: ', 'Atención al Vecino gestiona los reclamos en un mapa (con foto y etapas) y los turnos del día; Desarrollo Económico ve las ventas por localidad y rubro, el ahorro de los vecinos y las comisiones que quedaron en el distrito.'),
])
p('Como parte del trabajo desarrollé un prototipo funcional navegable que implementa estos módulos con datos de demostración, de modo que la propuesta se puede recorrer y probar, no solo describir. Está publicado en mila-ops-ia.github.io/soytigreya, se puede instalar en el celular e incluye un recorrido guiado de diez pasos que muestra cómo un pedido y un reclamo pasan por los cuatro perfiles; en el Anexo se incluyen capturas.')
doc.add_heading('Qué valor aporta', 2)
p('El diferencial no es competir con las grandes plataformas en volumen o publicidad, sino en precio final y en cercanía: como el comercio no paga una comisión del 30%, el mismo plato puede costar menos en SoyTigreYa, y el vecino suma además el descuento de su tarjeta. Para el municipio, la propuesta transforma un programa de descuentos pasivo en una herramienta activa de desarrollo económico, con datos para decidir y un canal directo con la comunidad.')

# ---------- 4 ----------
doc.add_heading('4. Usuarios o público objetivo', 1)
tabla([
    ['Usuario', 'Necesidades', 'Beneficios que obtiene'],
    ['Vecinos con tarjeta Soy Tigre', 'Ahorrar, resolver trámites sin filas, saber qué pasa en su barrio', 'Descuento automático, todo en una app, seguimiento de pedidos y reclamos'],
    ['Comercios y gastronómicos locales', 'Vender más sin perder margen, herramientas simples', 'Canal sin comisión, visibilidad, panel fácil, validación automática del descuento'],
    ['Municipio', 'Dinamizar la economía local y medir el impacto de sus programas', 'Datos por localidad, trazabilidad de reclamos, recaudación digital, cercanía'],
], [4.2, 5.4, 6.4])
p('Usuario principal (proto-persona). ', negrita_inicio=None).runs[0].bold = True
p('Lucía, 41 años, vive en Tigre Centro, trabaja como docente y tiene dos hijos. Usa el celular para casi todo, pero le cuesta seguir las promociones y no sabe en qué comercios aplica su tarjeta. Pide comida para retirar los viernes, paga las tasas cuando se acuerda y alguna vez hizo un reclamo por alumbrado sin enterarse de si lo resolvieron. Lo que más valora es ahorrar tiempo y plata, y sentir que su compra ayuda al comercio del barrio. Su frase: "quiero resolver todo desde el celu, sin dar vueltas".')
p('Se contemplan también usuarios secundarios con necesidades particulares, como adultos mayores, para quienes la app incluye un modo de letra grande y alto contraste, y vecinos con poca conectividad, que pueden acceder a la versión web y en una etapa posterior a un canal por WhatsApp.')

# ---------- 5 ----------
doc.add_heading('5. Aplicación de contenidos de la Diplomatura', 1)
doc.add_heading('Innovación y transformación digital', 2)
p('La propuesta combina mejora continua e innovación disruptiva. Por un lado, digitaliza procesos existentes (validar el descuento, pedir un turno, pagar una tasa). Por otro, cambia el modelo de un sector: un actor público ofrece un canal de comercialización sin comisión, algo que altera la lógica de intermediación de las plataformas privadas. La transformación digital no consiste en pasar a una app lo que ya existe, sino en reorganizar la relación entre municipio, comercio y vecino alrededor de datos compartidos.')
doc.add_heading('Design Thinking y experiencia de usuario (UX/UI)', 2)
p('Partí de la empatía con los tres actores para definir el problema desde sus necesidades reales y no desde la tecnología. A partir del mapa del recorrido del vecino (customer journey) identifiqué puntos de fricción: no saber dónde usar el beneficio, hacer filas, no tener respuesta a los reclamos. El diseño responde a esos puntos: el descuento se aplica solo, el pedido se sigue en tres pasos, el reclamo muestra una línea de tiempo y la asistente Tigri traduce lenguaje cotidiano en acciones. Se incorporaron criterios de accesibilidad, como el modo de letra grande y alto contraste, y elementos de gamificación (puntos, niveles y canjes) para motivar conductas deseadas y aumentar la retención.')
doc.add_heading('Lean Startup y metodologías ágiles', 2)
p('El prototipo funcional es un producto mínimo viable (MVP) pensado para validar hipótesis con el menor costo posible antes de invertir en desarrollo completo. El roadmap se organiza en etapas incrementales y el trabajo se plantea en sprints de dos semanas, con revisión frecuente junto a comercios y vecinos. Las metas se formulan con el criterio SMART; por ejemplo: "lograr que 40 comercios de Tigre Centro publiquen su catálogo y que 2.000 vecinos hagan al menos un pedido en los primeros tres meses del piloto".')
doc.add_heading('Comercio electrónico, gestión de producto y monetización', 2)
p('SoyTigreYa es un marketplace de cercanía con pasarelas de pago locales y modalidad takeaway para resolver el problema logístico del delivery. Como producto digital, se gestiona con indicadores (KPIs): adopción, retención, satisfacción y eficiencia operativa. En cuanto a monetización, el modelo no busca rentabilidad comercial sino sostenibilidad: un esquema freemium para comercios (uso básico gratuito y servicios destacados opcionales), publicidad local optativa y el ahorro de costos operativos del municipio por la digitalización de trámites, sobre una infraestructura en la nube sin servidores propios (serverless) que escala con el uso. Los Puntos Tigre se financian de forma compartida: los cupones los aporta el comercio, que gana clientes, y el descuento en tasas lo absorbe el municipio, que a cambio mejora el cobro en término.')

# ---------- 6 ----------
doc.add_heading('6. Plan de implementación', 1)
viñetas([
    ('Etapa 1 · Validación y MVP (meses 1 a 3): ', 'entrevistas a vecinos y comercios, prueba del prototipo y ajuste del diseño. Piloto de credencial, beneficios y takeaway en Tigre Centro y Paseo Victorica con 30 a 50 comercios.'),
    ('Etapa 2 · Escalamiento (meses 4 a 6): ', 'extensión a todas las localidades y a comercios no gastronómicos, pago de tasas y estacionamiento, reclamos con foto y mapa, y acuerdos con cooperativas de entrega.'),
    ('Etapa 3 · Super-app inteligente (meses 7 a 12): ', 'turnero completo, Tigri con inteligencia artificial conectada a los sistemas municipales, Puntos Tigre y canal por WhatsApp.'),
])
doc.add_heading('Recursos necesarios', 2)
viñetas([
    ('Equipo: ', 'líder de producto, diseñador UX/UI, dos desarrolladores, un referente de la Secretaría de Desarrollo Económico y un equipo de soporte y capacitación a comercios.'),
    ('Tecnología: ', 'aplicación web progresiva, base de datos en la nube, pasarela de pagos, validación de identidad (Mi Argentina o RENAPER) y servicios de mapas.'),
    ('Comunicación: ', 'campaña para vecinos y comercios aprovechando los canales municipales existentes.'),
])
doc.add_heading('Presupuesto estimado de la Etapa 1', 2)
tabla([
    ['Rubro', 'Detalle', 'Costo estimado'],
    ['Equipo de producto', 'Líder, UX/UI y 2 desarrolladores semi senior durante 3 meses (sueldo de referencia: $2,5 a $4,5 millones brutos por mes)', '$30 a $54 millones'],
    ['Base de datos en la nube', 'Supabase, plan Pro', 'USD 25 por mes más uso'],
    ['Hosting y mapas', 'GitHub Pages y OpenStreetMap', 'Sin costo'],
    ['Pasarela de pagos', 'Mercado Pago: QR con saldo / tarjeta de crédito con acreditación inmediata', '0,6% a 0,8% / hasta 6%, más IVA'],
    ['Capacitación y difusión', 'Equipos y canales propios del municipio', 'Sin costo adicional'],
], [3.6, 8.4, 4.0])
doc.add_heading('Posibles aliados', 2)
p('Secretaría de Desarrollo Económico del Municipio, cámaras de comercio locales, Mercado Pago y Banco Provincia (Cuenta DNI) como medios de pago, cooperativas de mensajería para el delivery, la Universidad Nacional del Delta para investigación y prácticas, y el área de Modernización para la integración con los sistemas existentes.')
doc.add_heading('Principales desafíos o riesgos', 2)
tabla([
    ['Riesgo', 'Mitigación'],
    ['Baja adopción de los comercios', 'Panel muy simple, capacitación presencial y acompañamiento en el alta.'],
    ['Logística del delivery', 'Empezar solo con retiro en el local; sumar delivery con cooperativas en la etapa 2.'],
    ['Financiamiento del descuento', 'Esquema compartido municipio–comercio con topes, como en Billetera Santa Fe.'],
    ['Competencia de plataformas privadas', 'Competir por precio final y cercanía, no por publicidad.'],
    ['Protección de datos personales', 'Cumplir la Ley 25.326, usar datos agregados y consentimiento explícito.'],
    ['Brecha digital', 'Modo accesible, versión web y canal por WhatsApp.'],
    ['Costo y abuso de los Puntos Tigre', 'Canjes con tope, vencimiento a 12 meses, puntos solo por compras con QR y reclamos validados; el descuento en tasas requiere ordenanza.'],
], [5.6, 10.4])

# ---------- 7 ----------
doc.add_heading('7. Resultados esperados', 1)
viñetas([
    ('Para los usuarios: ', 'ahorro concreto y visible cada mes, menos tiempo en filas y trámites, seguimiento de pedidos y reclamos, y una sola app para la vida en el distrito.'),
    ('Para los comercios y el municipio: ', 'más ventas sin comisiones abusivas, un canal digital propio y un incentivo a la formalización. El municipio obtiene datos de consumo por localidad, mejora la gestión de reclamos y aumenta la recaudación digital.'),
    ('Impacto en la comunidad: ', 'el consumo queda dentro del partido y fortalece el empleo local. La propuesta tiene triple impacto: económico, porque protege el bolsillo del vecino y el margen del comerciante; social, porque conecta a la comunidad; y de gestión, porque posiciona al municipio como referente de innovación.'),
    ('Crecimiento futuro: ', 'asistente con inteligencia artificial, puntos ciudadanos, integración con transporte y turismo del Delta, y un modelo replicable en otros municipios, ya que la marca y las localidades se configuran fácilmente.'),
])
p('Viabilidad económica: mila·ops ofrece un piloto de 3 meses ($55 millones + IVA), el escalamiento ($55 millones) y una licencia con soporte ($6,9 millones por mes). En un escenario conservador, las comisiones que quedan en el distrito rondan los $360 millones por año, 2,4 veces la inversión del primer año (ver la propuesta comercial).')
p('Para medir el éxito se proponen estos indicadores: vecinos activos por mes, tasa de retención a 90 días, pedidos semanales, comercios activos, ahorro acumulado de los vecinos, comisiones evitadas, tiempo promedio de resolución de reclamos, porcentaje de tasas pagadas en término, puntos sumados y canjeados, y satisfacción de los usuarios (NPS).')

# ---------- 8 ----------
doc.add_heading('8. Conclusiones', 1)
p('La Diplomatura me dio un método para pensar la innovación como una disciplina y no como una ocurrencia: empezar por el problema de las personas, validar rápido con un prototipo, planificar por etapas y medir con indicadores. Llevar esas herramientas a un caso real de mi comunidad me permitió ver que la tecnología disponible ya alcanza para resolver problemas concretos, y que lo difícil está en entender a los usuarios, ordenar el proceso y sumar a los actores correctos.')
p('SoyTigreYa muestra que la transformación digital puede ser una herramienta de equidad: cuando un municipio ofrece infraestructura digital pública, los comercios pequeños acceden a canales que antes solo podían pagar los grandes, y los vecinos ganan tiempo, ahorro y voz. Construir el prototipo, además de escribir la propuesta, fue la mejor forma de comprobar que la idea es viable y de detectar qué ajustar antes de llevarla a la práctica.')

# ---------- anexo ----------
doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
doc.add_heading('Anexo: capturas del prototipo funcional', 1)
p('Prototipo navegable desarrollado para este trabajo, con datos de demostración. Disponible en mila-ops-ia.github.io/soytigreya.')
_qr = doc.add_paragraph(); _qr.alignment = WD_ALIGN_PARAGRAPH.CENTER
_qr.add_run().add_picture(CAPT.rsplit('/', 1)[0] + '/img/qr-soytigreya.png', width=Cm(3))
_ley = doc.add_paragraph(); _ley.alignment = WD_ALIGN_PARAGRAPH.CENTER
_r = _ley.add_run('Escaneá el código para abrir la app en el celular'); _r.font.size = Pt(9); _r.italic = True

def figura_ancha(n, f, txt):
    par = doc.add_paragraph(); par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.keep_with_next = True
    par.add_run().add_picture(f'{CAPT}/{f}', width=Cm(15))
    ley = doc.add_paragraph(); ley.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = ley.add_run(f'Figura {n}. {txt}'); r.font.size = Pt(9); r.italic = True

figura_ancha(1, 'perfiles.jpg', 'Pantalla de entrada: los cuatro perfiles y el recorrido guiado')
imgs = [('inicio.jpg', 'Inicio de Lucía (vecina)'), ('pedido.jpg', 'Seguimiento del pedido'), ('reclamo.jpg', 'Reclamo con mapa'),
        ('tigri.jpg', 'Chat con Tigri'), ('credencial.jpg', 'Credencial con QR'), ('puntos.jpg', 'Puntos Tigre')]
t = doc.add_table(rows=4, cols=3)
for k, (f, txt) in enumerate(imgs):
    fila, col = (k // 3) * 2, k % 3
    c = t.cell(fila, col); c.text = ''
    par = c.paragraphs[0]; par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.add_run().add_picture(f'{CAPT}/{f}', width=Cm(4.3))
    leyenda = t.cell(fila + 1, col).paragraphs[0]; leyenda.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = leyenda.add_run(f'Figura {k + 2}. {txt}'); r.font.size = Pt(9); r.italic = True
figura_ancha(8, 'carlos.jpg', 'Panel de Atención al Vecino (Carlos): reclamos en el mapa')
figura_ancha(9, 'marina.jpg', 'Panel de Desarrollo Económico (Marina): impacto en el distrito')

doc.add_heading('Fuentes consultadas', 2)
for f in [
    'Tigre Municipio, ficha en App Store: apps.apple.com/us/app/id1643762916',
    'Parlamentario.com, notas sobre la tarjeta Soy Tigre (2024).',
    'La Capital (Rosario), "Unos 150 comercios ya son parte de la plataforma de compras del Banco Municipal" (2023).',
    'Govlaunch, Munimercado de la ciudad de Neuquén.',
    'Sitio Andino, "San Carlos presenta Góndola Sancarlina" (2026).',
    'Aire de Santa Fe y Gobierno de Santa Fe, notas sobre Billetera Santa Fe.',
    'BAE Negocios, lanzamiento de BAX en la Ciudad de Buenos Aires; La Voz e Hoy Día Córdoba sobre la App Ciudadana.',
    'Censo Nacional de Población 2022 (INDEC), datos del partido de Tigre publicados por telencuestas.com.',
    'Develop Argentina, "App de delivery propia vs. Rappi en Argentina" (marzo de 2026) y "Cuánto gana un programador en Argentina" (junio de 2026).',
    'iProfesional, "Más pedidos y cargos de hasta 35%: la presión del delivery sobre comercios y repartidores" (julio de 2026).',
    'Tarifas publicadas de Supabase (plan Pro) y de Mercado Pago (cobro con QR), 2026.',
    'Criptonoticias, token ciudadano de Marcos Paz; La Gaceta, app de reciclaje con premios de Tafí Viejo.',
    'Alberti, M. M., Clase final: Proyecto integrador de innovación y transformación digital, Diplomatura en Negocios Digitales e Innovación.',
]:
    par = doc.add_paragraph(style='List Bullet'); par.paragraph_format.line_spacing = 1.15
    r = par.add_run(f); r.font.size = Pt(10)

doc.save(SALIDA)
print('ok')
