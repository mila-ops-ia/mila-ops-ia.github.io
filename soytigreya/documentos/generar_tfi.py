import sys
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SALIDA = sys.argv[1]
CAPT = sys.argv[2]
MODO = sys.argv[3] if len(sys.argv) > 3 else 'todo'   # 'tfi' = solo las 8 hojas · 'anexos' = solo los anexos · 'todo' = como antes
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
    t.autofit = False
    for j, a in enumerate(anchos): t.columns[j].width = Cm(a)
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

def enlace(par, url, texto=None, tam=None):
    """Agrega un hipervínculo real (clickeable en el PDF)."""
    rid = par.part.relate_to(url, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', is_external=True)
    h = OxmlElement('w:hyperlink'); h.set(qn('r:id'), rid)
    r = OxmlElement('w:r'); rpr = OxmlElement('w:rPr')
    f = OxmlElement('w:rFonts'); f.set(qn('w:ascii'), 'Arial'); f.set(qn('w:hAnsi'), 'Arial'); rpr.append(f)
    c = OxmlElement('w:color'); c.set(qn('w:val'), 'D02013'); rpr.append(c)
    u = OxmlElement('w:u'); u.set(qn('w:val'), 'single'); rpr.append(u)
    if tam:
        z = OxmlElement('w:sz'); z.set(qn('w:val'), str(int(tam * 2))); rpr.append(z)
    r.append(rpr); t = OxmlElement('w:t'); t.text = texto or url; r.append(t); h.append(r); par._p.append(h)

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
rc = cab.add_run('SoyTigreYa · Anexos' if MODO == 'anexos' else 'SoyTigreYa · Trabajo Final Integrador'); rc.font.size = Pt(9); rc.font.color.rgb = RGBColor(0x64, 0x70, 0x7D)

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
centrado('El upgrade de la app Soy Tigre: beneficios, comercio de cercanía y servicios al vecino', 14, color=NARANJA, despues=16)
centrado('Propuesta de innovación digital para el Municipio de Tigre', 12, despues=46)
_q = doc.add_paragraph(); _q.alignment = WD_ALIGN_PARAGRAPH.CENTER; _q.paragraph_format.space_after = Pt(2)
_q.add_run().add_picture(CAPT.rsplit('/', 1)[0] + '/img/qr-soytigreya.png', width=Cm(3.4))
_l1 = centrado('Prototipo funcional: ', 10, color=AZUL, despues=2); enlace(_l1, 'https://mila-ops-ia.github.io/soytigreya/', tam=10)
_l2 = centrado('Todo el material: ', 10, color=AZUL, despues=58); enlace(_l2, 'https://mila-ops-ia.github.io/soytigreya/enlaces.html', tam=10)
for etiqueta, valor in (('Alumna: ', 'Milagros Sanabria'), ('Docente: ', 'Mg. Mauro Matías Alberti'), ('Modalidad: ', 'Individual'), ('Fecha: ', 'Noviembre de 2026')):
    par = doc.add_paragraph(); par.alignment = WD_ALIGN_PARAGRAPH.CENTER; par.paragraph_format.space_after = Pt(2)
    r = par.add_run(etiqueta); r.bold = True
    par.add_run(valor)
doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

# ---------- 1 ----------
doc.add_heading('1. Introducción y presentación del caso', 1)
p('Tigre es un partido del norte del conurbano bonaerense, con 446.925 habitantes según el Censo 2022, que combina realidades muy distintas: el casco histórico y el Delta, barrios cerrados como Nordelta y localidades de fuerte vida comercial como Don Torcuato, El Talar, General Pacheco y Benavídez. En ese territorio, el Municipio sostiene desde hace años la tarjeta de beneficios "Soy Tigre", que da descuentos a los vecinos en más de 500 comercios adheridos, y la app oficial "Tigre Municipio", donde se puede ver el estado de los turnos médicos, hacer reclamos, pedir la tarjeta y consultar la agenda y la altura del río.')
p('El caso elegido es la relación entre tres actores que hoy funcionan por separado: el vecino que quiere ahorrar y resolver trámites, el comercio de barrio que necesita vender y el municipio que busca dinamizar la economía local. Elegí este caso porque vivo la problemática de cerca: los comercios de la zona dependen cada vez más de plataformas de delivery con comisiones altas, mientras que los beneficios de la tarjeta municipal se usan sobre todo en el local y de forma manual. La propuesta, SoyTigreYa, es el upgrade de Soy Tigre: a la tarjeta que ya existe le suma la compra de cercanía sin comisión y los servicios municipales, en una sola experiencia digital.')

# ---------- 2 ----------
doc.add_heading('2. Diagnóstico de la situación actual', 1)
doc.add_heading('Necesidad o problema observado', 2)
p('El comercio de cercanía compite en desventaja en el canal digital. Las grandes plataformas de pedidos cobran comisiones de entre el 20% y el 30% por pedido según el plan contratado, y la presión total sobre el comercio llega al 35% (Develop Argentina, 2026; iProfesional, 2026). Eso obliga al comercio a subir precios en la app o a resignar margen. Al mismo tiempo, el programa de beneficios municipal tiene alcance, pero no tiene un canal propio de venta: el descuento se valida en la caja, mostrando la tarjeta, y el municipio no obtiene información sobre cómo y dónde se usa.')
doc.add_heading('Dificultades de las personas y organizaciones involucradas', 2)
viñetas([
    ('Vecinos: ', 'la información está dispersa en varias apps, deben recordar qué comercio tiene qué descuento y muchos trámites todavía requieren ir en persona.'),
    ('Comercios: ', 'pagan comisiones altas para estar en apps privadas y no cuentan con una herramienta simple para cargar productos, ofertas y horarios.'),
    ('Municipio: ', 'no puede medir el impacto real de la tarjeta ni el consumo por localidad, y gestiona reclamos con poca trazabilidad para el vecino.'),
])
doc.add_heading('Oportunidades de mejora', 2)
p('Existe una base instalada que reduce el costo de adopción: miles de vecinos ya tienen la tarjeta y la app municipal, y más de 500 comercios ya están adheridos. Hay dos antecedentes en Rosario: MuniShop, la tienda online sin comisión que el Banco Municipal lanzó en 2023, sumó unos 150 comercios y quedó inactiva al año; y Coopexpress, una cooperativa de cadetes que reparte para comercios por fuera de las apps. A diferencia de MuniShop, SoyTigreYa no crea un sitio nuevo: se monta sobre la tarjeta y la app que el vecino ya usa.')
doc.add_heading('Cambios posibles mediante herramientas digitales', 2)
viñetas([
    'Aplicar el descuento automáticamente al comprar por la app, sin cupones.',
    'Dar a los comercios un canal de venta propio sin comisión: solo el costo de la pasarela de pago.',
    'Unificar en una sola app la credencial, los beneficios, las compras, los trámites y los pagos.',
    'Generar datos de consumo y de reclamos por localidad para decidir mejor.',
])

# ---------- 3 ----------
doc.add_heading('3. Propuesta de innovación o negocio digital', 1)
doc.add_heading('En qué consiste', 2)
p('SoyTigreYa es el upgrade de la app Soy Tigre: una plataforma municipal, de tipo marketplace y de servicios, que convierte la tarjeta en el centro de una experiencia digital completa. Está organizada en cuatro perfiles que comparten los mismos datos, como ocurriría en la realidad: la vecina, la dueña de un comercio, el área de Atención al Vecino y el área de Desarrollo Económico del municipio; cada uno ve solo lo que necesita. Funciona en el celular como aplicación web instalable (PWA), con la identidad de la app oficial y un inicio en cuatro categorías, con todo a un toque.')
doc.add_heading('Cómo funcionaría', 2)
viñetas([
    ('Credencial digital: ', 'un QR que cambia cada 30 segundos y el historial del ahorro de cada mes. La tarjeta física se sigue enviando al domicilio: la digital se suma, no la reemplaza.'),
    ('Beneficios reales: ', 'los comercios adheridos con los descuentos publicados por el Municipio, en lista y mapa, ordenados por cercanía.'),
    ('Compras con retiro o con envío del comercio: ', 'el descuento se aplica solo y se paga desde la app. El vecino elige retirar o que lo lleve el cadete del propio comercio a su ubicación, que toma el celular sin escribir la dirección. Ve la hora de llegada y, si hay demora, el comercio le avisa. Si algo sale mal, el comercio tiene 24 horas para resolver; si no responde, se devuelve el pago.'),
    ('Trámites y pagos: ', 'turnos municipales, reclamos con foto, mapa y seguimiento por etapas, pago de tasas y multas, y estacionamiento medido con mapa de zonas.'),
    ('Salud, deporte y trabajo: ', 'turnos médicos en la red municipal (hospitales de diagnóstico inmediato, Materno Infantil y centros de atención), con guardias visibles; inscripción a escuelas deportivas de los 18 polideportivos y a la colonia de verano; búsquedas laborales con CV guardado y cursos gratuitos.'),
    ('Lo propio de Tigre: ', 'altura del río Luján con pronóstico a 24 horas y aviso al celular cuando supera el nivel de alerta por crecida; botón de alerta en todas las pantallas, que envía la ubicación al Centro de Operaciones; colectivos, farmacias de turno, eventos culturales y puntos verdes para reciclar.'),
    ('Tigri: ', 'un asistente que entiende lenguaje cotidiano ("quiero pizza", "hay un bache") y lleva a la acción.'),
    ('Puntos Tigre: ', 'se suman al comprar en el barrio (1 punto cada $1.000), pagar la tasa en término, reciclar en un punto verde escaneando su QR, ir a un turno o tener un reclamo resuelto. Se canjean por cupones, descuento en la tasa, saldo de estacionamiento o entradas culturales, y dan nivel: Cachorro, Tigre y Tigre de Oro.'),
    ('Panel del comercio, con formato de CRM: ', 'indicadores del día, pedidos en tablero o en lista, clientes (quién compra, cuánto y quiénes repiten), reclamos, productos y Mi local, con fotos, horarios y envío propio.'),
    ('Paneles del municipio, con el mismo formato: ', 'Atención al Vecino trabaja los reclamos como casos, por estado y urgencia, y cierra con foto; Desarrollo Económico sigue a los comercios como cuentas por etapa de adhesión y ve la proyección financiera.'),
])
p('Todo esto está implementado en un prototipo funcional navegable, con datos de demostración (el enlace está en la portada). El inventario completo de funciones está en los Anexos.')
doc.add_heading('Qué valor aporta', 2)
p('El diferencial no es competir con las grandes plataformas en volumen o publicidad, sino en precio final y en cercanía: como el comercio no paga una comisión de entre el 20% y el 35% y reparte con su propio cadete, cobrando el envío completo, el mismo plato puede costar menos en SoyTigreYa, y el vecino suma además el descuento de su tarjeta.')

# ---------- 4 ----------
doc.add_heading('4. Usuarios o público objetivo', 1)
tabla([
    ['Usuario', 'Necesidades', 'Beneficios que obtiene'],
    ['Vecinos con tarjeta Soy Tigre', 'Ahorrar, resolver trámites sin filas, saber qué pasa en su barrio', 'Descuento automático, todo en una app, seguimiento de pedidos y reclamos'],
    ['Comercios y gastronómicos locales', 'Vender más sin perder margen, herramientas simples', 'Canal sin comisión, visibilidad, panel fácil, validación automática del descuento'],
    ['Municipio', 'Dinamizar la economía local y medir el impacto de sus programas', 'Datos por localidad, trazabilidad de reclamos, recaudación digital, cercanía'],
], [4.2, 5.4, 6.4])
viñetas([
    ('Proto-persona principal, Lucía, la vecina: ', '41 años, docente de Tigre Centro con dos hijos. No sabe en qué comercios aplica su tarjeta, paga las tasas cuando se acuerda y nunca supo si resolvieron su reclamo de alumbrado: "quiero resolver todo desde el celu, sin dar vueltas".'),
    ('Rosa, la comerciante: ', 'dueña de una casa de pastas en Tigre Centro, con cadete propio. Las apps de delivery se llevan hasta el 35% de cada pedido y no tiene tiempo para sistemas complicados: "quiero vender por el celular sin regalar mi ganancia".'),
    ('Carlos, de Atención al Vecino: ', 'recibe reclamos por varios canales y no puede ordenarlos por urgencia ni avisarle al vecino cómo sigue el suyo: "necesito ver todos los casos en un solo lugar".'),
    ('Marina, de Desarrollo Económico: ', 'administra la tarjeta Soy Tigre sin saber cuánto se usa ni en qué localidad: "necesito datos para decidir dónde poner el esfuerzo".'),
])
p('Para adultos mayores hay un modo de letra grande y alto contraste.')

# ---------- 5 ----------
_h5 = doc.add_heading('5. Aplicación de contenidos de la Diplomatura', 1)
p('Todos los módulos se aplicaron y se pueden ver en el prototipo. La propuesta combina mejora continua (digitalizar procesos existentes) e innovación disruptiva (un canal público sin comisión que cambia la lógica de intermediación de las plataformas).')
tabla([
    ['Módulo', 'Contenidos aplicados', 'Cómo se aplican en SoyTigreYa'],
    ['1 · Transformación digital', 'Digitalización vs. transformación; research e hipótesis de oportunidad; ética digital; sobreexpectación; adopción y gestión del cambio', 'No se digitaliza la tarjeta: se reorganiza la relación vecino–comercio–municipio con datos compartidos. Ley 25.326 y aviso de prototipo. Tigri con reglas antes que con IA. Piloto con early adopters.'],
    ['2 · Metodologías ágiles', 'Manifiesto ágil, Scrum, Kanban y Lean; Design Thinking; persona y propuesta de valor; ideación; prototipado y testeo; Lean Canvas', 'Sprints de dos semanas; Kanban de pedidos con límite de trabajo en curso en el panel del comercio; cuatro proto-personas; brainstorming y 6-3-5 para priorizar el retiro y el envío con cadete del comercio antes que un reparto propio; Lean Canvas (ver Anexos).'],
    ['3 · Innovación', 'Doble diamante; deseabilidad, factibilidad y viabilidad; POV; SCAMPER; MVP e historias de usuario; financiamiento por tramos; SMART, KPIs y ROI; explore/exploit', 'POV de Lucía; SCAMPER: QR en lugar del cupón de papel, combinar beneficios y compras, eliminar la comisión. MVP por incrementos con tramos que se liberan si se valida la hipótesis. Objetivos SMART y ROI en el panel de Desarrollo Económico.'],
    ['4 · UX/UI', 'Diseño centrado en las personas; heurísticas de Nielsen; onboarding; accesibilidad POUR; leyes de Hick y Fitts; arquitectura de la información; pruebas de usabilidad', 'Inicio al centro de la barra y cuatro categorías con todo a un toque (Hick y Fitts); estado visible del pedido y del reclamo; un solo estilo de íconos; mapas con ubicación; letra grande; plan de prueba con 5 usuarios por perfil (ver Anexos).'],
    ['5 · Gestión de productos', 'Product Vision Board; Product-Market Fit; growth hacking: gamificación, escasez y referidos', 'Visión: que el ahorro y la venta se queden en Tigre. PMF medido con retención y NPS, con encuesta dentro de la app. Puntos Tigre, ofertas flash e invitaciones entre vecinos. Embudo AARRR en el panel municipal.'],
    ['Clase final', 'Pitch, presentación efectiva, KPIs y monetización', 'Pitch de 5 minutos para inversores: pain point, MVP, business case y propuesta. Monetización por piloto, escalamiento y suscripción de soporte.'],
], [3.0, 5.4, 7.6])

# ---------- 6 ----------
doc.add_heading('6. Plan de implementación', 1)
viñetas([
    ('Etapa 1 · Piloto (meses 1 a 3), qué se hace primero: ', 'Tigre Centro con 40 comercios: credencial, beneficios y compra con retiro o con envío del cadete del comercio. Metas para pasar de etapa: 40 comercios vendiendo, 2.000 vecinos que compraron, NPS de 40 o más y 95% de pedidos sin incidencias.'),
    ('Etapa 2 · Todo Tigre (meses 4 a 6), qué hace falta: ', 'solo si el piloto cumple sus metas: todas las localidades y comercios no gastronómicos, pago de tasas y estacionamiento, y reclamos con foto y mapa.'),
    ('Etapa 3 · Mejora continua (meses 7 a 12), cómo queda funcionando: ', 'turnero completo, Tigri con inteligencia artificial conectada a los sistemas municipales, Puntos Tigre y canal por WhatsApp.'),
])
doc.add_heading('Recursos necesarios', 2)
viñetas([
    ('Equipo: ', 'líder de producto, diseñador UX/UI, dos desarrolladores y un referente de la Secretaría de Desarrollo Económico.'),
    ('Soporte por suscripción: ', 'el equipo de soporte acompaña todas las etapas con capacitación, mesa de ayuda y mejoras.'),
    ('Tecnología: ', 'aplicación web progresiva, base de datos en la nube, pasarela de pagos, validación de identidad (Mi Argentina o RENAPER) y servicios de mapas.'),
    ('Comunicación: ', 'las redes que el Municipio ya tiene activas, con Tigri como cara y los comercios como difusores.'),
])
p('', negrita_inicio='Inversión del Municipio por etapa (precio = costo del equipo × 1,30):').paragraph_format.keep_with_next = True
tabla([
    ['Concepto', 'Monto', 'Cómo se calcula (meses × costo por mes)'],
    ['Piloto (meses 1 a 3)', '$37 millones', '3 × $9,5 millones de equipo × 1,30.'],
    ['Todo Tigre (meses 4 a 6)', '$30 millones', '3 × $7,7 millones de equipo × 1,30.'],
    ['Mejora continua (meses 7 a 12)', '$42 millones', '6 × $6,9 millones + $0,6 millones de hosting.'],
    ['Total del año 1', '$109 millones', '$37 + $30 + $42 millones (USD 69.000).'],
    ['Desde el año 2, por año', '$55,2 millones', '12 × $4,5 millones + $1,2 millones de hosting.'],
], [5.3, 2.8, 7.9])
doc.add_heading('Posibles aliados', 2)
tabla([
    ['Aliado', 'Qué aporta'],
    ['Desarrollo Económico y Modernización', 'El programa Soy Tigre y la integración con la app oficial.'],
    ['Cámara de comercio de Tigre (CACIT) y CAME', 'Llegada a los comercios para sumarlos y capacitarlos.'],
    ['Mercado Pago, Cuenta DNI y MODO', 'Cobro con QR y cofinanciamiento de los descuentos.'],
    ['Uber Envíos y Cabify Envíos', 'Desde el año 2, reparto por viaje y sin comisión.'],
    ['Universidad Nacional del Delta', 'Pruebas de usabilidad y prácticas de estudiantes.'],
], [7.0, 9.0])
doc.add_heading('Principales desafíos o riesgos', 2)
tabla([
    ['Riesgo', 'Nivel', 'Mitigación'],
    ['Baja adopción de comercios', 'Alto', 'Panel simple y capacitación. Se prueba en el piloto.'],
    ['Financiar el descuento', 'Alto', 'Banco socio y topes por compra. Se prueba en el piloto.'],
    ['Logística del envío', 'Medio', 'Retiro o envío del comercio; partners desde el año 2.'],
    ['Competencia de las apps', 'Medio', 'Competir por precio final y cercanía, no por publicidad.'],
    ['Datos personales', 'Medio', 'Ley 25.326, datos agregados y consentimiento explícito.'],
    ['Brecha digital', 'Medio', 'Modo accesible, versión web, WhatsApp y tarjeta física.'],
    ['Problemas con una compra', 'Bajo', 'Respuesta en 24 horas o reintegro automático.'],
    ['Abuso de los Puntos Tigre', 'Bajo', 'Canjes con tope y vencimiento a 12 meses.'],
], [4.8, 1.6, 9.6])

# ---------- 7 ----------
doc.add_heading('7. Resultados esperados', 1)
viñetas([
    ('Para los usuarios: ', 'ahorro visible cada mes, menos filas y trámites, y seguimiento de pedidos y reclamos en una sola app.'),
    ('Para los comercios y el municipio: ', 'más ventas sin comisión y un canal digital propio; datos de consumo por localidad, mejor gestión de reclamos y más recaudación digital.'),
    ('Impacto en la comunidad: ', 'un comercio con 60 pedidos de $20.000 por mes deja de pagar $300.000 mensuales de comisión (60 × $20.000 × 25%). Con 100 comercios, desde el año 2, son $360 millones por año que quedan en Tigre ($300.000 × 100 × 12); parte vuelve al barrio en sueldos y proveedores (unos $173 millones) y al Municipio por tasa (hasta $11,5 millones).'),
    ('Crecimiento futuro: ', 'desde el año 2, partners de reparto que cobren por viaje y no por comisión y, como opción, la misma plataforma para otros municipios.'),
])
p('Lo que vuelve a la caja del Municipio (Plan Destacado, publicidad local, un banco que cofinancia descuentos y el ahorro de trámites presenciales) es de $40,6, $124,4 y $152,6 millones en los años 1 a 3. Año 1: $40,6 − $109 = −$68,4; año 2: $124,4 − $55,2 = +$69,2: la inversión se recupera en 2 años. A 5 años se proyectaron tres escenarios: conservador (175 comercios), recupera en 3 años y 3 meses; esperado (250), en 2 años; optimista (500), en 1 año y 8 meses.', negrita_inicio='Viabilidad económica. ')
p('vecinos activos y retención a 90 días, pedidos y comercios activos, comisiones evitadas, tiempo de resolución de reclamos y NPS. Objetivos del primer año:', negrita_inicio='Indicadores de éxito: ')
tabla([
    ['Objetivo', 'Meta', 'Cómo se calcula'],
    ['Comercios con Plan Destacado', '30', 'Planes activos: 30 × $25.000 × 6 meses = $4,5 millones de ingreso.'],
    ['Trámites hechos por la app', '5.000', 'Trámites iniciados en la app: 5.000 × $1.500 = $7,5 millones de ahorro.'],
    ['Plata que queda en los comercios', '$67,5 millones', '50 comercios × 30 pedidos por mes × $20.000 × 25% × 9 meses.'],
    ['Vuelve a la caja del Municipio', '$40,6 millones', 'Plan $4,5 + publicidad $3,6 + banco $25 + ahorro $7,5 (en millones).'],
], [5.2, 2.6, 8.2])

# ---------- 8 ----------
doc.add_heading('8. Conclusiones', 1)
p('Empecé este trabajo con una pregunta: ¿por qué un comercio de mi barrio tiene que entregar hasta un tercio de cada venta para llegar al celular de sus vecinos, si el Municipio ya tiene una tarjeta y una app que los conectan? La respuesta que encontré es que no hace falta inventar nada nuevo: hace falta unir lo que ya existe.')
p('Por eso creo que SoyTigreYa es viable en Tigre y en Argentina. No parte de cero, porque la tarjeta, los comercios adheridos y la app municipal ya están. Y se puede probar con poco riesgo: un piloto de tres meses con 40 comercios, que crece solo si cumple sus metas.')
p('La Diplomatura me dio el orden para llegar hasta acá: mirar primero a las personas y después a la tecnología, convertir una idea en algo que se puede probar y ponerle números que se puedan explicar. Confirmé que lo digital puede ser una herramienta de equidad: con infraestructura pública, el comercio chico compite de igual a igual.')
p('Por ahora no tengo la oportunidad de llevar este proyecto adelante, pero estoy contenta con lo que pude crear: una app que logré materializar, aunque sea en un ambiente de prueba. No soy desarrolladora; para construirla me apoyé mucho en Claude Code. Aprendí que hoy se puede pasar de una idea a un prototipo sin saber programar, y que lo que no se puede delegar es entender el problema.')
if MODO == 'tfi':
    p('además del trabajo, la app y la presentación, por iniciativa propia sumé un folleto, un pitch, instructivos de uso y anexos. Todo está en este enlace:', negrita_inicio='Material adicional: ')
    _le = doc.add_paragraph(); enlace(_le, 'https://mila-ops-ia.github.io/soytigreya/enlaces.html')
    _pg = OxmlElement('w:pgNumType'); _pg.set(qn('w:start'), '0'); sec._sectPr.append(_pg)
    doc.save(SALIDA)
    print('ok')
    sys.exit(0)

# ---------- anexo ----------
doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
doc.add_heading('Anexo A: herramientas aplicadas', 1)
p('Estos anexos amplían el trabajo sin repetirlo: herramientas, cálculos, inventario de funciones y fuentes. En las tablas, "M" significa millones de pesos.').runs[0].italic = True
doc.add_heading('Mapa de empatía de Lucía (proto-persona)', 2)
tabla([
    ['Piensa y siente', 'Ve'],
    ['"Quiero apoyar al comercio del barrio, pero me sale más caro y todo está disperso."', 'Promociones que no sabe dónde aplican, varias apps del municipio y filas para trámites.'],
    ['Oye', 'Dice y hace'],
    ['"El reclamo de la luz nunca lo resolvieron." "En la app los precios son más altos."', 'Pide comida los viernes, paga la tasa cuando se acuerda y reclama por teléfono.'],
], [8.0, 8.0])
p('Punto de vista (POV): Lucía, vecina de Tigre Centro, necesita resolver compras, beneficios y trámites desde el celular porque hoy todo está disperso, paga de más y no ve su ahorro.')
doc.add_heading('Historias de usuario', 2)
tabla([
    ['Historia', 'Criterio de aceptación'],
    ['Como vecina quiero pedir para retirar con mi descuento para ahorrar sin perder tiempo.', 'El descuento se aplica solo y recibo un código de retiro.'],
    ['Como dueña de un comercio quiero recibir pedidos ya pagados para vender sin pagar comisión.', 'El pedido aparece en "Nuevos" y avanza a "Listo" en dos toques.'],
    ['Como agente de Atención al Vecino quiero ver los reclamos en un mapa para asignarlos más rápido.', 'Cada reclamo muestra ubicación, foto y etapa.'],
    ['Como responsable de Desarrollo Económico quiero medir ventas por localidad para decidir políticas.', 'El tablero muestra ventas, comisiones evitadas y embudo del producto.'],
], [9.0, 7.0])
doc.add_heading('Lean Canvas', 2)
tabla([
    ['Bloque', 'Contenido'],
    ['Problema', 'Comisiones de 20% a 30% para los comercios; beneficios, compras y trámites dispersos; el municipio no mide el impacto.'],
    ['Segmentos', 'Vecinos con tarjeta Soy Tigre y comercios de barrio. Early adopters: gastronomía de Tigre Centro.'],
    ['Propuesta de valor única', 'Que el ahorro y la venta se queden en Tigre: el vecino paga menos y el comercio vende sin comisión.'],
    ['Solución', 'App con descuento automático, compra con retiro o envío del comercio, trámites, pagos, puntos y paneles de gestión.'],
    ['Canales', 'App municipal, comercios adheridos, CACIT (cámara de comercio de Tigre) y canales del municipio.'],
    ['Fuentes de ingreso', 'Gratis para el vecino y 0% de comisión. En el año 2: Plan Destacado ($30 M), publicidad local ($14,4 M), banco que cofinancia descuentos ($50 M) y ahorro en atención ($30 M): $124,4 M. Para el equipo de soporte: suscripción por municipio.'],
    ['Estructura de costos', 'Año 1: $109 M (piloto, escalamiento y seis meses de suscripción de soporte). Desde el año 2: $55,2 M por año (suscripción de soporte $4,5 M por mes e infraestructura $1,2 M). Pasarela 0,6% a 0,8%.'],
    ['Métricas clave', 'Vecinos activos, retención, NPS, comercios activos, comercios con Plan Destacado y comisiones evitadas.'],
    ['Ventaja injusta', 'Más de 500 comercios y la tarjeta Soy Tigre ya instalada, con el aval del municipio.'],
], [4.0, 12.0])
doc.add_heading('Proyección financiera a tres años (escenario propuesto)', 2)
tabla([
    ['Concepto', 'Año 1', 'Año 2', 'Año 3'],
    ['Costo para el Municipio', '$109,0 M', '$55,2 M', '$55,2 M'],
    ['Plan Destacado (30 / 100 / 120 comercios)', '$4,5 M', '$30,0 M', '$36,0 M'],
    ['Publicidad local (2 / 4 / 6 espacios)', '$3,6 M', '$14,4 M', '$21,6 M'],
    ['Banco o billetera que cofinancia descuentos', '$25,0 M', '$50,0 M', '$50,0 M'],
    ['Ahorro en atención presencial', '$7,5 M', '$30,0 M', '$45,0 M'],
    ['Vuelve a la caja del Municipio', '$40,6 M', '$124,4 M', '$152,6 M'],
    ['Resultado del año', '−$68,4 M', '+$69,2 M', '+$97,4 M'],
    ['Acumulado', '−$68,4 M', '+$0,8 M', '+$98,2 M'],
], [7.0, 3.0, 3.0, 3.0])
p('Recupero de la inversión: 2 años. Sin las palancas (suscripción de $6,9 millones por mes desde el año 2 y aporte bancario de $30 millones), 3 años y 4 meses. El año 1 incluye solo seis meses de ingresos, porque la plataforma está en piloto. Supuestos a validar en el piloto; el panel de Desarrollo Económico permite simular las palancas.')
doc.add_heading('Proyección a 5 años en tres escenarios', 2)
tabla([
    ['', 'Conservador', 'Esperado', 'Optimista'],
    ['Comercios vendiendo (año 1 a año 5)', '35 → 175', '50 → 250', '60 → 500'],
    ['Pedidos por mes por comercio', '30 y luego 45', '30 y luego 60', '30 y luego 60'],
    ['Aporte del banco o billetera por año', '$30 M', '$50 M', '$50 M'],
    ['Costo para el Municipio en 5 años', '$329,8 M', '$329,8 M', '$329,8 M'],
    ['Vuelve a la caja del Municipio en 5 años', '$459,5 M', '$702,0 M', '$915,3 M'],
    ['Resultado acumulado al año 5', '+$129,7 M', '+$372,2 M', '+$585,5 M'],
    ['Recupero de la inversión', '3 años y 3 meses', '2 años', '1 año y 8 meses'],
    ['Queda en los comercios en 5 años', '$1.370,2 M', '$2.587,5 M', '$4.581,0 M'],
    ['Vuelve al barrio en 5 años (48%)', '$657,7 M', '$1.242,0 M', '$2.198,9 M'],
    ['Tasa municipal sobre esas ventas, tope (0,80%)', '$43,8 M', '$82,8 M', '$146,6 M'],
], [7.0, 3.0, 3.0, 3.0])
p('Los tres escenarios usan las mismas fórmulas y el mismo costo; cambia la adopción. Resultado acumulado, año por año: conservador −$82,2 millones, −$57,5 millones, −$12,8 millones, +$48,4 millones y +$129,7 millones; esperado −$68,4 millones, +$0,8 millones, +$98,2 millones, +$219,6 millones y +$372,2 millones; optimista −$65,4 millones, +$29,0 millones, +$169,6 millones, +$350,7 millones y +$585,5 millones. El escenario esperado coincide con la proyección a tres años y crece 50 comercios por año; el conservador supone 30% menos comercios, menos pedidos y un aporte bancario menor; el optimista llega a los 500 comercios ya adheridos a Soy Tigre. Comercios con Plan Destacado al año 5: 120, 180 y 330; trámites por la app: 35.000, 50.000 y 70.000. Son supuestos propios, a validar en el piloto.')
def fig_anexo(letra, archivo, txt):
    par = doc.add_paragraph(); par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.keep_with_next = True
    par.add_run().add_picture(f'{CAPT}/{archivo}', width=Cm(15))
    ley = doc.add_paragraph(); ley.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = ley.add_run(f'Gráfico {letra}. {txt}'); r.font.size = Pt(9); r.italic = True

fig_anexo('A', 'fig-escenarios.png', 'Resultado acumulado para el Municipio a 5 años, en los tres escenarios')
doc.add_heading('Hoja de ruta y próximos pasos', 2)
fig_anexo('B', 'fig-hoja-de-ruta.png', 'Hoja de ruta: del piloto en Tigre Centro a otros municipios')
tabla([
    ['Etapa', 'Cuándo', 'Condición para avanzar'],
    ['Piloto', 'Meses 1 a 3', '40 comercios, 2.000 vecinos, NPS de 40 o más y 95% de pedidos sin incidencias.'],
    ['Todo Tigre', 'Meses 4 a 6', 'Acuerdo con un banco o billetera y adopción sostenida.'],
    ['Mejora continua', 'Meses 7 a 12', '50 comercios activos y 30 con Plan Destacado.'],
    ['Partners estratégicos', 'Año 2', 'Convenio con una cooperativa o un servicio de envíos por viaje, y demanda medida en la app.'],
    ['Otros municipios', 'Año 3 en adelante', 'Resultados auditables en Tigre y un municipio con tarjeta de beneficios propia.'],
], [4.0, 3.2, 8.8])
p('Suscripción de soporte (customer success). El equipo de soporte no entrega la plataforma y se retira: la acompaña con un servicio mensual que incluye soporte técnico, capacitación presencial a los comercios, mesa de ayuda, mantenimiento y mejoras. Funciona como una suscripción: $6,9 millones por mes (USD 4.370) entre los meses 7 y 12, cuando la plataforma se está estabilizando, y $4,5 millones por mes (USD 2.850) desde el año 2, con un equipo más chico. No es un costo adicional: el primer semestre de suscripción ($41,4 millones) ya está dentro de los $109 millones del año 1, y los $54 millones anuales siguientes son casi todo el costo de $55,2 millones por año, junto con $1,2 millones de infraestructura. El Municipio puede darla de baja al cierre de cada etapa.')
p('Partners estratégicos de reparto. El envío con el cadete del comercio está disponible desde el piloto y no exige logística nueva, pero no todos los locales tienen cadete. Más adelante, la etapa siguiente es integrar terceros que cobren por viaje y no un porcentaje de la venta: servicios de envíos por viaje como Uber Envíos y Cabify Envíos, que ya operan en Buenos Aires (cobertura y tarifas en Tigre a confirmar en el piloto), o mensajerías de la zona. El comercio conserva el 0% de comisión sobre la venta y elige el reparto que le conviene. Es una hipótesis a validar: depende de las condiciones comerciales de cada servicio.')
p('Otros municipios. La plataforma se configura por municipio (marca, localidades, rubros y trámites), por lo que el segundo municipio no paga el desarrollo de base: paga la adaptación, la integración con sus sistemas y la licencia. Los candidatos naturales son municipios que ya tienen una tarjeta de beneficios y comercios adheridos. La propuesta se lleva con los resultados medidos en Tigre: comercios activos, plata que quedó en los comercios y recupero.')
p('Tarjeta física. Soy Tigre hoy envía la tarjeta física al domicilio del vecino, y eso se mantiene. La credencial digital con QR se suma, no la reemplaza: el vecino usa la que prefiera. Recibir la tarjeta en casa es parte del vínculo con el programa y asegura que nadie quede afuera por no tener celular, en línea con la mitigación de la brecha digital.')
doc.add_heading('Montos principales en pesos y en dólares', 2)
tabla([
    ['Concepto', 'Pesos', 'Dólares'],
    ['Costo del upgrade, año 1', '$109,0 M', 'USD 69.000'],
    ['Costo por año desde el año 2', '$55,2 M', 'USD 35.000'],
    ['Costo total en 5 años', '$329,8 M', 'USD 209.000'],
    ['Queda en los comercios, año 2', '$360,0 M', 'USD 228.000'],
    ['Vuelve al barrio, año 2', '$172,8 M', 'USD 109.000'],
    ['Vuelve al Municipio por tasa, año 2 (tope)', '$11,5 M', 'USD 7.300'],
    ['Resultado acumulado al año 5: conservador', '+$129,7 M', 'USD 82.000'],
    ['Resultado acumulado al año 5: esperado', '+$372,2 M', 'USD 236.000'],
    ['Resultado acumulado al año 5: optimista', '+$585,5 M', 'USD 371.000'],
    ['Queda en los comercios en 5 años: esperado', '$2.587,5 M', 'USD 1,64 M'],
], [9.0, 3.5, 3.5])
p('Conversión al dólar oficial del Banco Nación, tipo vendedor, del 18 de noviembre de 2026: $1.580 por dólar. Los montos en dólares están redondeados y son una referencia: el modelo se calcula en pesos de hoy, sin ajuste por inflación ni por variación futura del tipo de cambio.')
doc.add_heading('Efecto en la economía local: la plata que se queda trabaja tres veces', 2)
tabla([
    ['Vuelta', 'Año 1', 'Año 2', 'Año 3'],
    ['1 · Se queda en el comercio: comisiones que no se pagan a las apps (25% de las ventas)', '$67,5 M', '$360,0 M', '$540,0 M'],
    ['2 · Vuelve a circular en el barrio: sueldos, proveedores y mejoras (48% de la vuelta 1)', '$32,4 M', '$172,8 M', '$259,2 M'],
    ['3 · Vuelve al Municipio: tasa a comercios, 0,80% de las ventas (tope)', '$2,2 M', '$11,5 M', '$17,3 M'],
], [8.5, 2.5, 2.5, 2.5])
p('Son tres beneficiarios distintos y no se suman. La recirculación del 48% surge de estudios de comercios independientes en Estados Unidos (Civic Economics y AMIBA) y es un supuesto a validar en el piloto. La tasa es la alícuota general de la tasa por verificación de industrias y comercios de Tigre (Ordenanza Impositiva 2026, N.º 4336/25); solo es recaudación nueva sobre ventas nuevas o formalizadas. En la app, el vecino ve este efecto con sus propias compras ("Tu compra trabaja 3 veces en Tigre").')
doc.add_heading('Metas del piloto: cómo se miden y dónde se comprueban', 2)
tabla([
    ['Objetivo', 'Meta', 'Cómo se calcula', 'Dónde se comprueba'],
    ['Comercios vendiendo (mes 3)', '40', 'Comercios con al menos un pedido entregado en el mes', 'Panel de Desarrollo Económico'],
    ['Vecinos que compraron (mes 3)', '2.000', 'Vecinos distintos con al menos un pedido', 'Panel de Desarrollo Económico'],
    ['Recomendación (NPS)', '40 o más', '% que responde 9 o 10 − % que responde 0 a 6', 'Encuesta dentro de la app'],
    ['Pedidos sin incidencias', '95%', '(pedidos − pedidos con reclamo) ÷ pedidos × 100', 'Panel de Atención al Vecino'],
    ['Comercios activos (mes 12)', '50', 'Comercios con pedidos en el mes', 'Panel de Desarrollo Económico'],
], [4.0, 2.0, 6.5, 3.5])
p('Comparación de escala. La inversión del año 1 ($109 millones) equivale a lo que 100 comercios pagan hoy en comisiones en menos de cuatro meses ($30 millones por mes). No es el recupero: ese se calcula aparte, con los ingresos propios del Municipio.')
p('Fórmulas del modelo. Plata que queda en los comercios = comercios × pedidos por mes × ticket × 25% × meses; en el año 2: 100 × 60 × $20.000 × 25% × 12 = $360 millones (sobre $1.440 millones de ventas). Vuelve al barrio = lo anterior × 48%. Vuelve al Municipio = ventas × 0,80%. Recupero = momento en que el resultado acumulado deja de ser negativo: −$68,4 millones (año 1) + $69,2 millones (año 2) = +$0,8 millones, es decir, al cierre del año 2. Todas las metas se leen en los paneles de la app, por lo que se pueden auditar mes a mes.')
doc.add_heading('Ventaja competitiva: el envío a cargo del comercio', 2)
tabla([
    ['', 'Apps de delivery', 'SoyTigreYa'],
    ['Comisión sobre la venta', '20% a 30%', '0%'],
    ['Si se usa el reparto', 'Hasta 35% en total', '0%: reparte el cadete del comercio'],
    ['Quién cobra el envío', 'La app', 'El comercio, completo'],
    ['Quién decide precio y zona de envío', 'La app', 'El comercio'],
    ['Quién atiende al cliente', 'Un repartidor de la app', 'El cadete del local'],
    ['A dónde va la plata', 'Fuera del distrito', 'Queda en Tigre'],
], [6.0, 4.5, 5.5])
p('El comercio activa el envío en su panel, fija el precio y hasta dónde lleva, y lo puede desactivar cuando quiera. No requiere logística nueva: usa el cadete que muchos locales ya tienen. Como referencia de la etapa siguiente, en Rosario la cooperativa de cadetes Coopexpress reparte para comercios por fuera de las apps (La Capital).')
p('Adquisición por redes sociales. No se crean cuentas nuevas: se usan las que el Municipio ya tiene activas (Instagram, TikTok, Facebook), con Tigri como cara de la campaña, videos cortos de comercios del barrio y un botón para que cada comercio comparta su local. Se mide con vecinos nuevos por canal (registros desde cada enlace o QR), costo por vecino registrado (gasto de la campaña ÷ vecinos nuevos) y cuántos de ellos hacen su primer pedido.')
doc.add_heading('Matriz de riesgos: peligrosidad, vulnerabilidad y nivel', 2)
tabla([
    ['Riesgo', 'Peligrosidad', 'Vulnerabilidad', 'Nivel'],
    ['Baja adopción de los comercios', 'Alta', 'Alta: sin comercios no hay ventas ni datos', 'Alto'],
    ['Financiamiento del descuento', 'Media', 'Alta: el recupero en 2 años depende del banco socio', 'Alto'],
    ['Competencia de plataformas privadas', 'Alta', 'Media: no se compite en publicidad, sí en precio final y cercanía', 'Medio'],
    ['Logística del delivery', 'Media', 'Media: hay retiro y envío del comercio; no todos tienen cadete', 'Medio'],
    ['Protección de datos personales', 'Baja', 'Alta: un incidente daña la confianza en el Municipio', 'Medio'],
    ['Costo y abuso de los Puntos Tigre', 'Media', 'Media: topes y vencimiento limitan el costo', 'Medio'],
    ['Problemas con una compra', 'Media', 'Baja: respuesta en 24 horas y reintegro automático', 'Bajo'],
    ['Brecha digital', 'Media', 'Baja: modo accesible, versión web y WhatsApp', 'Bajo'],
], [4.4, 2.9, 6.7, 2.0])
p('Peligrosidad es la probabilidad de que el riesgo ocurra; vulnerabilidad, cuánto afectaría al proyecto con las mitigaciones ya previstas en la sección 6. El nivel combina las dos. Es una valoración cualitativa de la autora, a revisar con los datos del piloto. Los dos riesgos altos son los que se validan primero: la meta de 40 comercios en tres meses y el acuerdo con un banco o billetera.')
doc.add_heading('Antecedente histórico: MuniShop (Rosario)', 2)
p('En junio de 2023 el Banco Municipal de Rosario lanzó MuniShop, una plataforma de venta online gratuita para los comercios de la ciudad y sin comisión por transacción, heredera de Vidrieras en Red (2020). Ese año sumó unos 150 comercios (La Capital, 2023). En agosto de 2024, Punto Biz informó que el sitio llevaba meses inactivo y que se preparaba un relanzamiento; a noviembre de 2026 no se pudo confirmar que esté activo. Por eso se toma como aprendizaje y no como modelo vigente: SoyTigreYa no crea un sitio nuevo, se monta sobre la tarjeta y la app que el vecino ya usa.')
doc.add_heading('Comparación con otras contrataciones', 2)
tabla([
    ['Caso', 'Qué incluye', 'Monto'],
    ['SoyTigreYa (propuesta)', 'Año 1: piloto, escalamiento y seis meses de soporte; después, $55 M por año', '$109 M'],
    ['Ciudad de Santa Fe (2025)', 'App municipal: desarrollo, implementación y mantenimiento. Presupuesto oficial; ofertas de $274,9 M y $284,4 M', '$316 M'],
    ['Ciudad de Buenos Aires', 'Plataforma de diseño y trámites digitales (adjudicado)', '$483,6 M'],
    ['San Cayetano, PBA (2026)', 'Municipio chico: gestión georreferenciada y app con turnos de salud (adjudicado)', '$85,7 M'],
    ['Agencias privadas (2026)', 'App enfocada, sin integraciones municipales ni soporte anual', 'USD 12.000 a 40.000'],
], [4.2, 9.0, 2.8])
p('Billetera Santa Fe, por su parte, financia hoy los reintegros mitad el comercio y mitad el banco, sin fondos del Estado: el mismo esquema que propone SoyTigreYa con el aporte bancario.')
doc.add_heading('Product Vision Board', 2)
tabla([
    ['Visión', 'Grupo objetivo', 'Necesidades', 'Producto', 'Objetivos'],
    ['Que el ahorro y la venta se queden en Tigre.', 'Vecinos, comercios y áreas del municipio.', 'Comprar y resolver sin intermediarios; vender sin comisión; medir.', 'Upgrade de Soy Tigre con cuatro perfiles conectados.', 'Consumo local, formalización y cobro en término.'],
], [3.2, 3.2, 3.4, 3.2, 3.0])
doc.add_heading('Embudo AARRR', 2)
p('Adquisición (registro), activación (primer pedido), retención (repite en 30 días), referidos (invitaciones) e ingresos (tres compras o más). Se lee en el panel de Desarrollo Económico.')
doc.add_heading('Plan de prueba de usabilidad', 2)
viñetas([
    'Cinco participantes por perfil, porque cinco usuarios detectan cerca del 85% de los problemas de usabilidad.',
    'Tareas: pedir para retirar, cargar un reclamo con foto, canjear puntos (vecina); preparar y entregar un pedido (comercio).',
    'Técnica think aloud, con moderador y observador, consentimiento informado y medición de éxito o fracaso por tarea.',
    'Revisión complementaria con las 10 heurísticas de Nielsen y los principios de accesibilidad POUR.',
])
doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
doc.add_heading('Anexo B: todo lo que tiene el prototipo', 1)
p('Inventario completo de las funciones implementadas en el prototipo, por perfil. Todas se pueden recorrer en mila-ops-ia.github.io/soytigreya, con datos de demostración.')
tabla([
    ['Función', 'Qué hace', 'Quién la usa'],
    ['Credencial digital', 'QR que cambia cada 30 segundos e historial del ahorro de cada mes. La tarjeta física sigue vigente.', 'Lucía'],
    ['Beneficios', 'Comercios adheridos con sus descuentos, en lista y mapa, ordenados por cercanía.', 'Lucía'],
    ['Comprar', 'Pedido con descuento automático, pago desde la app, retiro en el local o envío con el cadete del comercio a la ubicación que comparte el celular (sin escribir la dirección), con hora de llegada, aviso de demora y código de entrega.', 'Lucía y Rosa'],
    ['Problemas con una compra', 'El vecino reclama con foto; el comercio tiene 24 horas para devolver o reponer. Si no responde, el pago se devuelve solo; si la propuesta no sirve, el vecino pide otra.', 'Lucía y Rosa'],
    ['Turnos municipales', 'Licencia de conducir, zoonosis y otros trámites, con recordatorio.', 'Lucía y Carlos'],
    ['Reclamos', 'Alumbrado, bacheo, poda y residuos, con foto, ubicación en el mapa y seguimiento por etapas.', 'Lucía y Carlos'],
    ['Pagos', 'Tasas municipales, multas de tránsito y estacionamiento medido con mapa de zonas.', 'Lucía'],
    ['Salud', 'Turnos médicos en la red municipal, centros en el mapa y guardias visibles.', 'Lucía'],
    ['Deporte', 'Inscripción a escuelas deportivas de los polideportivos y a la colonia de verano.', 'Lucía'],
    ['Empleo y cursos', 'Búsquedas laborales del distrito con CV guardado, seguimiento de postulaciones y cursos gratuitos.', 'Lucía'],
    ['Altura del río', 'Nivel del río Luján, pronóstico a 24 horas, niveles de atención (1,90 m) y alerta (2,30 m) y aviso al celular si hay crecida.', 'Lucía'],
    ['Botón de alerta', 'Visible en todas las pantallas: envía la ubicación al Centro de Operaciones.', 'Lucía'],
    ['Colectivos y farmacias', 'Cuánto falta para el colectivo y farmacias de turno en el mapa.', 'Lucía'],
    ['Eventos', 'Ferias, música, talleres y corridas del distrito.', 'Lucía'],
    ['Reciclaje', 'Puntos verdes en el mapa; al escanear su QR se suman puntos.', 'Lucía'],
    ['Puntos Tigre', 'Se suman por comprar (1 cada $1.000), pagar la tasa en término (200), reciclar (40), reclamo resuelto (100) e ir al turno (30). Se canjean por cupón de $2.000, 10% en la tasa, saldo de estacionamiento o entrada cultural. Niveles: Cachorro, Tigre (1.000 puntos) y Tigre de Oro (3.000). Vencen a los 12 meses.', 'Lucía y Marina'],
    ['Tigri', 'Asistente que entiende lenguaje cotidiano, escrito o hablado, y lleva a la acción.', 'Lucía'],
    ['Cerca tuyo y accesibilidad', 'Ordena todo por distancia con el botón Cómo llegar; modo de letra grande y alto contraste; se instala en el celular.', 'Lucía'],
    ['Panel del comercio', 'Pedidos en tablero o lista, clientes, reclamos, productos y ofertas flash, Mi local, envío propio, cobros y Plan Destacado.', 'Rosa'],
    ['Panel de Atención al Vecino', 'Casos por estado y urgencia, mapa de calor, cuadrillas y turnos del día.', 'Carlos'],
    ['Panel de Desarrollo Económico', 'Ventas y ahorro por período y localidad, comercios como cuentas, embudo AARRR, proyección financiera e informe descargable.', 'Marina'],
    ['Recorrido guiado y opinión', 'Diez pasos que muestran un pedido y un reclamo pasando por los cuatro perfiles, y un formulario de opinión.', 'Todos'],
], [3.6, 9.4, 3.0])
doc.add_heading('Anexo C: fuentes consultadas', 1)
for f in [
    'Tigre Municipio, ficha en App Store: apps.apple.com/us/app/id1643762916',
    'Municipio de Tigre, tigre.gob.ar/novedades: beneficios Soy Tigre en supermercados (2024), mascotas (2024) y gastronomía (2025).',
    'Parlamentario.com, notas sobre Soy Tigre (2024 y 2026), polideportivos y pista de atletismo (2026), Portal de Empleo y Tigre Instituto Formativo (2026) y hospitales municipales (2026).',
    'Zona Norte Hoy, farmacias adheridas a Soy Tigre (octubre de 2026).',
    'Municipalidad de Santa Fe, Licitación Pública 1/2025 (app municipal); FM Vintage, ofertas recibidas (2025).',
    'Caynet, app de San Cayetano (2026); Voces de la Comuna 15, plataforma de trámites de la Ciudad de Buenos Aires.',
    'Pausa y Mirador Provincial, relanzamiento de Billetera Santa Fe (noviembre de 2025).',
    'Municipalidad de Tigre, Ordenanza Impositiva 2026 (N.º 4336/25), Boletín Oficial N.º 1051: tasa por verificación de industrias y comercios.',
    'Civic Economics, Indie Impact Study Series; AMIBA, The Local Multiplier Effect: recirculación local de comercios independientes.',
    'Banco de la Nación Argentina, cotización del dólar oficial, tipo vendedor, al 18 de noviembre de 2026 ($1.580), según La Nación.',
    'Fotos ilustrativas: Wikimedia Commons (CC BY y CC BY-SA), con créditos en el repositorio del proyecto.',
    'La Capital (Rosario), "Delivery bajo la lupa", y RosarioPlus, notas sobre la cooperativa de cadetes Coopexpress.',
    'Municipalidad de Rosario, "El Banco Municipal lanzó MuniShop" (2023); La Capital, "Unos 150 comercios ya son parte de la plataforma de compras del Banco Municipal" (2023); Punto Biz, "A un año de su lanzamiento, el sitio de ventas Munishop fue a boxes" (2024).',
    'Govlaunch, Munimercado de la ciudad de Neuquén.',
    'Sitio Andino, "San Carlos presenta Góndola Sancarlina" (2026).',
    'Aire de Santa Fe y Gobierno de Santa Fe, notas sobre Billetera Santa Fe.',
    'Uber Argentina, página de Uber Envíos en Buenos Aires; Cabify, Cabify Logistics; El Cronista, notas sobre Cabify Envíos (2021 y 2026).',
    'Mercado, ronda de negocios de la Cámara de Comercio y Servicios de Tigre (CACIT) con CAME (2026).',
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

if MODO == 'anexos':
    # quita la portada y el cuerpo: deja desde "Anexo A" y agrega un encabezado propio
    cuerpo = doc.element.body
    for el in list(cuerpo):
        if el.tag.endswith('}sectPr'):
            continue
        if el.tag.endswith('}p') and 'Anexo A: herramientas aplicadas' in ''.join(el.itertext()):
            break
        cuerpo.remove(el)
    primero = doc.paragraphs[0]
    tit = primero.insert_paragraph_before('SoyTigreYa · Anexos del Trabajo Final Integrador')
    tit.runs[0].bold = True; tit.runs[0].font.size = Pt(16)
    sub = primero.insert_paragraph_before('Milagros Sanabria · Diplomatura en Negocios Digitales e Innovación · UNDelta · 2026. Material de apoyo: herramientas aplicadas, proyecciones y fuentes consultadas.')
    sub.runs[0].font.size = Pt(10); sub.runs[0].italic = True

doc.save(SALIDA)
print('ok')
