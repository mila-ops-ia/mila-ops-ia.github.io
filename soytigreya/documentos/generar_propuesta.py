# Genera la propuesta comercial de mila·ops para SoyTigreYa (Word).
# Uso: python3 generar_propuesta.py salida.docx carpeta_capturas
import sys
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SALIDA, CAPT = sys.argv[1], sys.argv[2]
ROJO = RGBColor(0xD0, 0x20, 0x13)
PIZARRA = RGBColor(0x51, 0x57, 0x69)
VIOLETA = RGBColor(0x6B, 0x63, 0xD0)
GRIS = RGBColor(0x6E, 0x72, 0x80)

doc = Document()
sec = doc.sections[0]
sec.page_height, sec.page_width = Cm(29.7), Cm(21)
sec.top_margin = sec.bottom_margin = Cm(2.2)
sec.left_margin = sec.right_margin = Cm(2.3)

def fuente(estilo, tam, negrita=False, color=None):
    s = doc.styles[estilo]
    s.font.name = 'Arial'
    s.element.rPr.rFonts.set(qn('w:eastAsia'), 'Arial')
    s.font.size = Pt(tam); s.font.bold = negrita
    if color: s.font.color.rgb = color
    return s

normal = fuente('Normal', 10.5)
normal.paragraph_format.line_spacing = 1.25
normal.paragraph_format.space_after = Pt(5)
for nombre, tam, color in (('Heading 1', 17, ROJO), ('Heading 2', 12.5, PIZARRA)):
    h = fuente(nombre, tam, True, color)
    h.paragraph_format.space_before = Pt(14 if nombre == 'Heading 1' else 9)
    h.paragraph_format.space_after = Pt(5)
    h.paragraph_format.keep_with_next = True
    h.font.italic = False

def p(texto, negrita_inicio=None, just=True, tam=None, color=None, italic=False):
    par = doc.add_paragraph()
    if negrita_inicio:
        r = par.add_run(negrita_inicio); r.bold = True
        if tam: r.font.size = Pt(tam)
    r = par.add_run(texto)
    if tam: r.font.size = Pt(tam)
    if color: r.font.color.rgb = color
    r.italic = italic
    if just: par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    return par

def vinetas(items):
    for it in items:
        par = doc.add_paragraph(style='List Bullet')
        par.paragraph_format.space_after = Pt(2)
        if isinstance(it, tuple):
            r = par.add_run(it[0]); r.bold = True
            par.add_run(it[1])
        else:
            par.add_run(it)

def sombrear(celda, color):
    tcPr = celda._tc.get_or_add_tcPr()
    sh = OxmlElement('w:shd'); sh.set(qn('w:val'), 'clear'); sh.set(qn('w:color'), 'auto'); sh.set(qn('w:fill'), color)
    tcPr.append(sh)

def tabla(filas, anchos, tam=9.5, destacar=None):
    t = doc.add_table(rows=len(filas), cols=len(filas[0]))
    t.style = 'Table Grid'; t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, fila in enumerate(filas):
        for j, txt in enumerate(fila):
            c = t.cell(i, j); c.width = Cm(anchos[j]); c.text = ''
            par = c.paragraphs[0]; par.paragraph_format.space_after = Pt(1); par.paragraph_format.line_spacing = 1.1
            r = par.add_run(txt); r.font.size = Pt(tam)
            if i == 0:
                r.bold = True; r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF); sombrear(c, 'D02013')
            elif destacar is not None and i == destacar:
                r.bold = True; sombrear(c, 'FBE9E7')
            elif i % 2 == 0:
                sombrear(c, 'F2F3F5')
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return t

def caja(titulo, lineas):
    t = doc.add_table(rows=1, cols=1); t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.cell(0, 0); c.width = Cm(16.4); sombrear(c, 'F2F3F5')
    par = c.paragraphs[0]; r = par.add_run(titulo); r.bold = True; r.font.color.rgb = ROJO; r.font.size = Pt(11)
    for ln in lineas:
        q = c.add_paragraph(); q.paragraph_format.space_after = Pt(2)
        if isinstance(ln, tuple):
            a = q.add_run(ln[0]); a.bold = True; q.add_run(ln[1])
        else:
            q.add_run(ln)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)

def numero_pagina(par):
    r = par.add_run()
    for tipo, txt in (('begin', None), (None, 'PAGE'), ('end', None)):
        if tipo:
            e = OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'), tipo); r._r.append(e)
        else:
            e = OxmlElement('w:instrText'); e.set(qn('xml:space'), 'preserve'); e.text = txt; r._r.append(e)

def salto():
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

def figura(f, txt, ancho):
    par = doc.add_paragraph(); par.alignment = WD_ALIGN_PARAGRAPH.CENTER; par.paragraph_format.keep_with_next = True
    par.add_run().add_picture(f'{CAPT}/{f}', width=Cm(ancho))
    ley = doc.add_paragraph(); ley.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = ley.add_run(txt); r.font.size = Pt(8.5); r.italic = True; r.font.color.rgb = GRIS

QR = CAPT.rsplit('/', 1)[0] + '/img/qr-soytigreya.png'
def qr_bloque(txt, ancho=3.2):
    par = doc.add_paragraph(); par.alignment = WD_ALIGN_PARAGRAPH.CENTER; par.paragraph_format.keep_with_next = True
    par.add_run().add_picture(QR, width=Cm(ancho))
    ley = doc.add_paragraph(); ley.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = ley.add_run(txt); r.font.size = Pt(8.5); r.italic = True; r.font.color.rgb = GRIS

# ---------- encabezado y pie ----------
sec.different_first_page_header_footer = True
cab = sec.header.paragraphs[0]; cab.alignment = WD_ALIGN_PARAGRAPH.RIGHT
r = cab.add_run('SoyTigreYa · Propuesta comercial · '); r.font.size = Pt(8.5); r.font.color.rgb = GRIS
r = cab.add_run('mila·ops'); r.font.size = Pt(8.5); r.bold = True; r.font.color.rgb = VIOLETA
pie = sec.footer.paragraphs[0]; pie.alignment = WD_ALIGN_PARAGRAPH.CENTER; numero_pagina(pie)

# ---------- portada ----------
def centrado(txt, tam, negrita=False, color=None, antes=0, despues=4):
    par = doc.add_paragraph(); par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.space_before = Pt(antes); par.paragraph_format.space_after = Pt(despues)
    r = par.add_run(txt); r.font.size = Pt(tam); r.bold = negrita
    if color: r.font.color.rgb = color
    return par

centrado('PROPUESTA COMERCIAL', 11, True, GRIS, antes=40, despues=18)
centrado('SoyTigreYa', 40, True, ROJO, despues=6)
centrado('La super-app de beneficios, comercio de barrio y trámites del vecino de Tigre', 14, False, PIZARRA, despues=30)
centrado('Un prototipo que ya funciona, listo para un piloto de 3 meses en Tigre Centro', 12, True, despues=60)
fig = doc.add_paragraph(); fig.alignment = WD_ALIGN_PARAGRAPH.CENTER
fig.add_run().add_picture(f'{CAPT}/perfiles.jpg', width=Cm(14))
centrado('Para: Municipio de Tigre · Secretaría de Desarrollo Económico y área de Modernización', 10.5, False, PIZARRA, antes=24)
par = centrado('Presenta: ', 10.5, False, PIZARRA)
r = par.add_run('mila·ops'); r.bold = True; r.font.color.rgb = VIOLETA; r.font.size = Pt(10.5)
r = par.add_run(' · Milagros Belén Sanabria'); r.font.size = Pt(10.5); r.font.color.rgb = PIZARRA
centrado('Noviembre de 2026 · Valores referenciales en pesos, más IVA · Validez de la oferta: 30 días', 9, False, GRIS, antes=4)
centrado('Documento elaborado como parte del Trabajo Final Integrador de la Diplomatura en Negocios Digitales e Innovación (UNDelta).', 8.5, False, GRIS, antes=10)
salto()

# ---------- 1. resumen ejecutivo ----------
doc.add_heading('1. Resumen ejecutivo', 1)
p('Tigre ya tiene lo más difícil: una tarjeta de beneficios con más de 500 comercios adheridos y vecinos que la usan. Lo que falta es un canal digital propio. Hoy, cuando un vecino pide comida por una app privada, entre el 20% y el 30% de cada venta se va del distrito en comisiones. Y los trámites, los reclamos y los beneficios están repartidos en varias apps distintas.')
p('SoyTigreYa une todo en una sola app: la credencial digital Soy Tigre, compras con retiro en el local sin comisión y con el descuento aplicado solo, trámites, pagos, reclamos con seguimiento y un programa de puntos que premia comprar en el barrio, pagar a tiempo y reciclar. El municipio suma dos paneles de gestión: uno para Atención al Vecino y otro para Desarrollo Económico.')
caja('La propuesta en una mirada', [
    ('Qué ofrecemos: ', 'un piloto llave en mano de 3 meses en Tigre Centro y Paseo Victorica, sobre un prototipo que ya funciona.'),
    ('Inversión del piloto: ', '$55 millones + IVA (referencial, noviembre de 2026).'),
    ('Qué gana el distrito: ', 'en el escenario conservador, unos $360 millones por año en comisiones que quedan en Tigre, 2,4 veces la inversión del primer año.'),
    ('Qué pedimos: ', 'una carta de intención para iniciar el piloto con 40 comercios y 2.000 vecinos.'),
    ('Pruébela hoy: ', 'mila-ops-ia.github.io/soytigreya · botón "Ver el recorrido guiado".'),
])
qr_bloque('Escaneá el código para abrir la demo en el celular')

# ---------- 2. costo de no hacer nada ----------
doc.add_heading('2. El costo de no hacer nada', 1)
p('Las plataformas privadas de delivery cobran al comercio entre el 20% y el 30% de cada pedido según el plan, más cargos por el procesamiento de pagos, y la presión total llega al 35% (Develop Argentina, 2026; iProfesional, 2026). El comercio tiene dos salidas: subir los precios dentro de la app o resignar margen. En los dos casos, ese dinero sale del distrito.')
p('Para dimensionarlo, tomamos una comisión media del 25% y un ticket promedio de $20.000. Si esas ventas pasan por SoyTigreYa, la comisión queda en el bolsillo del comercio y del vecino:')
tabla([
    ['Escenario', 'Comercios activos', 'Pedidos por mes', 'Ventas por mes', 'Comisiones que quedan en Tigre, por año'],
    ['Conservador', '100', '6.000', '$120 millones', '$360 millones'],
    ['Medio', '250', '25.000', '$500 millones', '$1.500 millones'],
    ['Optimista', '400', '60.000', '$1.200 millones', '$3.600 millones'],
], [2.8, 2.8, 2.8, 3.4, 4.6], destacar=1)
p('Supuestos: 60, 100 y 150 pedidos por comercio por mes, ticket promedio de $20.000 y comisión media evitada del 25%. Son escenarios para dimensionar el impacto, no una proyección de ventas.', tam=8.5, color=GRIS, italic=True)

# ---------- 3. la solución ----------
doc.add_heading('3. La solución, funcionando hoy', 1)
p('SoyTigreYa no es una maqueta: es un prototipo funcional publicado, instalable en el celular, con cuatro perfiles que comparten los mismos datos. Un recorrido guiado de 10 pasos muestra cómo un pedido y un reclamo pasan por las cuatro personas.')
tabla([
    ['Perfil', 'Quién es', 'Qué hace en SoyTigreYa'],
    ['Lucía', 'Vecina', 'Usa su credencial, encuentra beneficios, compra con retiro, hace trámites y reclamos, paga tasas y suma Puntos Tigre.'],
    ['Rosa', 'Dueña de un comercio', 'Recibe pedidos pagados en su panel, carga productos y precios, y ve la comisión que se ahorró.'],
    ['Carlos', 'Atención al Vecino', 'Gestiona los reclamos en un mapa, con foto y etapas, y organiza los turnos del día.'],
    ['Marina', 'Desarrollo Económico', 'Mide el impacto: ventas por localidad y rubro, comisiones retenidas, ahorro de los vecinos y puntos.'],
], [2.2, 3.4, 10.8])
t = doc.add_table(rows=2, cols=3); t.alignment = WD_TABLE_ALIGNMENT.CENTER
for k, (f, txt) in enumerate([('inicio.jpg', 'Inicio de la vecina'), ('pedido.jpg', 'Pedido con código de retiro'), ('reclamo.jpg', 'Reclamo con mapa')]):
    c = t.cell(0, k); c.text = ''; q = c.paragraphs[0]; q.alignment = WD_ALIGN_PARAGRAPH.CENTER
    q.add_run().add_picture(f'{CAPT}/{f}', width=Cm(4.2))
    l = t.cell(1, k).paragraphs[0]; l.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rr = l.add_run(txt); rr.font.size = Pt(8.5); rr.italic = True; rr.font.color.rgb = GRIS

doc.add_heading('Módulos incluidos', 2)
vinetas([
    ('Credencial digital Soy Tigre: ', 'QR que cambia cada 30 segundos y validación en caja.'),
    ('Beneficios: ', 'directorio en lista y mapa, por rubro y localidad, en el local o por la app.'),
    ('Compras con retiro: ', 'catálogo, descuento automático, horario de retiro, pago con Mercado Pago, Cuenta DNI o tarjeta, y código de retiro.'),
    ('Trámites y pagos: ', 'turnos, reclamos con foto, mapa y seguimiento, tasas, multas y estacionamiento medido.'),
    ('Servicios de Tigre: ', 'altura del río con alertas, colectivos, farmacias de turno y botón de alerta.'),
    ('Puntos Tigre: ', 'puntos por comprar en el barrio, pagar a tiempo, reciclar y reclamos resueltos; canjes por cupones, descuento en tasas, estacionamiento o cultura.'),
    ('Tigri: ', 'asistente conversacional que lleva al vecino a la acción que necesita.'),
    ('Paneles de gestión: ', 'comercio, Atención al Vecino y Desarrollo Económico.'),
])

# ---------- 4. por qué ----------
doc.add_heading('4. Por qué SoyTigreYa', 1)
tabla([
    ['Alternativa', 'Costo para el comercio', 'Datos para el municipio', 'Integra la tarjeta Soy Tigre', 'Tiempo hasta usarla'],
    ['Seguir con apps privadas', '20% a 30% por pedido', 'No', 'No', 'Ya'],
    ['Sumar módulos a la app actual', 'Sin comisión', 'Parcial', 'Sí', 'Desarrollo largo'],
    ['Desarrollo a medida desde cero', 'Sin comisión', 'Sí', 'Sí', '9 a 12 meses'],
    ['SoyTigreYa', 'Sin comisión (solo pasarela)', 'Sí, en tiempo real', 'Sí', 'Piloto en 3 meses'],
], [4.2, 3.4, 3.0, 2.9, 2.9], destacar=4)
vinetas([
    ('Ya existe y se puede probar: ', 'se reduce el riesgo de invertir en algo que no se vio funcionar.'),
    ('Diseñada desde la operación: ', 'cada flujo parte de cómo trabajan el vecino, el comercio y el municipio.'),
    ('Sin dependencia del proveedor: ', 'el código y los datos son del municipio, sobre tecnología abierta y estándar.'),
    ('Identidad municipal: ', 'usa la marca y los colores del municipio, y se integra con la app "Tigre Municipio".'),
])

# ---------- 5. planes y precios ----------
doc.add_heading('5. Planes y precios', 1)
tabla([
    ['Plan', 'Qué incluye', 'Duración', 'Inversión (+ IVA)'],
    ['1. Piloto llave en mano', 'Adaptación del prototipo, base de datos en producción, alta de 40 comercios, capacitación, soporte y medición de resultados en Tigre Centro y Paseo Victorica', '3 meses', '$55 millones'],
    ['2. Escalamiento', 'Todas las localidades, comercios no gastronómicos, pagos de tasas y estacionamiento, integración con la app y los sistemas municipales', '3 meses', '$55 millones'],
    ['3. Licencia y soporte', 'Mantenimiento, mejoras continuas, soporte con niveles de servicio, monitoreo e informes mensuales', 'Mensual', '$6,9 millones por mes'],
], [3.4, 7.6, 2.0, 3.4])
vinetas([
    ('Cómo se calcularon: ', 'costo de un equipo de 4 personas (líder de producto, UX/UI y 2 desarrolladores) con sueldos de referencia de $3,5 millones brutos por mes (Develop Argentina, junio de 2026), más un margen del 30%. La licencia supone 1,5 personas dedicadas.'),
    ('Infraestructura: ', 'se factura al costo, sin margen. Hoy ronda los USD 100 por mes (Supabase Pro con uso); el hosting y los mapas no tienen costo.'),
    ('Pasarela de pagos: ', 'la comisión de Mercado Pago (0,6% a 0,8% con QR y saldo) la paga cada comercio, como en cualquier cobro.'),
    ('Forma de pago: ', '40% a la firma y 60% a la entrega de cada etapa. Los valores se ajustan por IPC cada trimestre.'),
    ('Primer año completo: ', 'piloto + escalamiento + 6 meses de licencia, unos $151 millones + IVA. Desde el segundo año, unos $82 millones por año.'),
])

# ---------- 6. retorno ----------
doc.add_heading('6. Retorno esperado', 1)
tabla([
    ['Escenario', 'Comisiones que quedan en Tigre, por año', 'Relación con la inversión del primer año ($151 M)'],
    ['Conservador', '$360 millones', '2,4 veces'],
    ['Medio', '$1.500 millones', '10 veces'],
    ['Optimista', '$3.600 millones', '24 veces'],
], [3.4, 6.5, 6.5], destacar=1)
p('Ese valor queda en manos de los comercios y los vecinos del distrito, no en las arcas municipales. Para el municipio, el retorno directo llega por otras vías:')
vinetas([
    ('Cobro en término: ', 'los Puntos Tigre premian pagar la tasa antes del vencimiento. La meta del piloto es que el 80% de los usuarios del programa pague a tiempo.'),
    ('Horas de atención: ', 'si 2.000 reclamos por mes entran por la app con foto y ubicación, y cada uno ahorra 8 minutos de carga telefónica o presencial, son unas 267 horas por mes.'),
    ('Formalización: ', 'para vender en la app, el comercio tiene que estar habilitado y al día con sus tasas.'),
    ('Datos para decidir: ', 'consumo por localidad y rubro, mapa de reclamos y uso de beneficios, en tiempo real.'),
])

# ---------- 7. piloto ----------
doc.add_heading('7. Plan del piloto (12 semanas)', 1)
tabla([
    ['Semanas', 'Qué se hace'],
    ['1 y 2', 'Relevamiento con la Secretaría, ajustes de marca y textos, base de datos en producción, carga de comercios y beneficios'],
    ['3 y 4', 'Alta y capacitación presencial de los primeros 40 comercios en Tigre Centro y Paseo Victorica'],
    ['5 y 6', 'Lanzamiento a vecinos con tarjeta Soy Tigre, comunicación por canales municipales y mesa de ayuda'],
    ['7 a 10', 'Operación asistida, mejoras semanales (sprints de 2 semanas) y medición de indicadores'],
    ['11 y 12', 'Informe de resultados, encuesta a vecinos y comercios, y recomendación para el escalamiento'],
], [2.4, 14.0])
doc.add_heading('Responsabilidades', 2)
vinetas([
    ('mila·ops pone: ', 'el producto, la adaptación, la infraestructura, la capacitación, el soporte y la medición.'),
    ('El municipio pone: ', 'un referente de Desarrollo Económico, el padrón de comercios adheridos, la difusión por sus canales y el acceso a los responsables de reclamos y turnos.'),
])
doc.add_heading('Criterios de éxito', 2)
tabla([
    ['Indicador', 'Meta al final del piloto'],
    ['Comercios con catálogo activo', '40'],
    ['Vecinos con al menos un pedido', '2.000'],
    ['Pedidos entregados sin incidencias', '95%'],
    ['Satisfacción de vecinos y comercios (NPS)', '40 o más'],
    ['Reclamos cargados desde la app', '30% del total de la zona'],
], [9.0, 7.4])

# ---------- 8. datos y soporte ----------
doc.add_heading('8. Seguridad, datos y soporte', 1)
vinetas([
    ('Protección de datos: ', 'cumplimiento de la Ley 25.326, consentimiento explícito y uso de datos agregados para los tableros.'),
    ('Propiedad: ', 'los datos y el código son del municipio. Al finalizar el contrato se entregan completos, sin costo.'),
    ('Infraestructura: ', 'base de datos en la nube con copias de seguridad diarias, accesos por rol y registro de cambios.'),
    ('Identidad: ', 'ingreso con Mi Argentina o validación de DNI para vecinos; usuario institucional para el personal municipal.'),
    ('Accesibilidad: ', 'modo de letra grande y alto contraste, versión web y, en la etapa 3, canal por WhatsApp.'),
])
tabla([
    ['Nivel de servicio', 'Ejemplo', 'Primera respuesta'],
    ['Crítico', 'La app no carga o no se pueden pagar pedidos', '4 horas'],
    ['Alto', 'Un módulo no funciona para un grupo de usuarios', '1 día hábil'],
    ['Normal', 'Consultas, ajustes y mejoras', '3 días hábiles'],
], [3.2, 9.0, 4.2])
p('Disponibilidad objetivo: 99,5% mensual. Mesa de ayuda de lunes a viernes de 9 a 18 h e informes mensuales de uso.', tam=9.5)

# ---------- 9. riesgos ----------
doc.add_heading('9. Riesgos y cómo los cubrimos', 1)
tabla([
    ['Riesgo', 'Cómo lo cubrimos'],
    ['Pocos comercios se suman', 'Alta acompañada, panel simple y capacitación presencial; difusión con la Cámara de Comercio'],
    ['Pocos vecinos la usan', 'Lanzamiento con la tarjeta Soy Tigre ya instalada, Puntos Tigre y comunicación municipal'],
    ['¿Quién financia los descuentos?', 'Esquema compartido municipio–comercio con topes, como Billetera Santa Fe; cupones aportados por los comercios'],
    ['Competencia de apps privadas', 'Competir por precio final y cercanía, no por publicidad'],
    ['Logística del delivery', 'El piloto es solo con retiro en el local; el delivery se evalúa después, con cooperativas'],
    ['Datos personales', 'Ley 25.326, datos agregados, consentimiento y accesos por rol'],
], [5.0, 11.4])

# ---------- 10. equipo ----------
doc.add_heading('10. Quiénes somos', 1)
par = p('', negrita_inicio=None)
r = par.add_run('mila·ops'); r.bold = True; r.font.color.rgb = VIOLETA
par.add_run(' diseña apps, automatizaciones y agentes de IA con una idea simple: primero entender la operación, después automatizarla.')
p('Milagros Belén Sanabria lidera el proyecto. Tiene 10 años en operaciones: empezó en atención al cliente, pasó por logística y facturación, coordinó equipos y hoy trabaja en procesos, calidad y mejora continua con IA. Es técnica en Logística, se formó en Lean Six Sigma y en la Diplomatura en Negocios Digitales e Innovación. Diseñó y construyó el prototipo de SoyTigreYa.')
p('Para el piloto se suman un diseñador UX/UI y dos desarrolladores, bajo su coordinación.')

# ---------- 11. próximos pasos ----------
doc.add_heading('11. Próximos pasos', 1)
tabla([
    ['Paso', 'Qué', 'Cuándo'],
    ['1', 'Demo en vivo con la Secretaría de Desarrollo Económico y Modernización', 'Semana 1'],
    ['2', 'Carta de intención y definición del referente municipal', 'Semana 2'],
    ['3', 'Firma del piloto y kickoff', 'Semana 3'],
    ['4', 'Lanzamiento con los primeros 40 comercios', 'Semana 6'],
], [1.4, 11.0, 4.0])
qr_bloque('Demo en vivo: mila-ops-ia.github.io/soytigreya')
caja('Contacto', [
    ('mila·ops · ', 'Milagros Belén Sanabria'),
    ('Web: ', 'mila-ops-ia.github.io/servicios'),
    ('Demo: ', 'mila-ops-ia.github.io/soytigreya'),
])

# ---------- anexo ----------
doc.add_heading('Anexo: supuestos y fuentes', 1)
vinetas([
    'Población de Tigre: 446.925 habitantes (Censo Nacional 2022).',
    'Comisiones de apps de delivery: 20% a 30% según el plan, con cargos de hasta 35% (Develop Argentina, marzo de 2026; iProfesional, julio de 2026).',
    'Sueldos de referencia: $2,5 a $4,5 millones brutos por mes para perfiles semi senior (Develop Argentina, junio de 2026); se tomó el punto medio, $3,5 millones.',
    'Infraestructura: Supabase Pro desde USD 25 por mes más uso (tarifas publicadas, 2026); GitHub Pages y OpenStreetMap sin costo.',
    'Pasarela: Mercado Pago con QR y saldo, 0,6% a 0,8% + IVA; con crédito y acreditación inmediata, hasta 6% + IVA (tarifas publicadas, 2026).',
    'Escenarios de retorno: ticket promedio de $20.000 y comisión media evitada del 25%; supuestos propios para dimensionar el impacto.',
    'Comercios adheridos a Soy Tigre: más de 500 (Parlamentario, 2024).',
    'Prototipo: datos de demostración; no es una app oficial del Municipio de Tigre.',
])

doc.save(SALIDA)
print('ok')
