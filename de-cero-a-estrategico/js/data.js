// Contenido de "De Cero a Estratégico".
// Cada clase: video (url opcional), puntos clave, práctica, Nota de Mili y quiz de 1 pregunta.
// Los códigos siguen el formato N{nivel}-{curso}-{clase} y N{nivel}-{curso}-T para talleres.

const LEVELS = [
  {
    n: 1,
    id: "N1",
    name: "Inicial",
    tag: "Arranco",
    desc: "Lo básico que más uso todos los días: planillas, IA y cómo funciona una empresa por dentro.",
    range: "5–8 min por video",
    price: 0,
  },
  {
    n: 2,
    id: "N2",
    name: "Operativo",
    tag: "Hago que funcione",
    desc: "Herramientas de analista: datos, tableros, SQL, operaciones, supply chain y automatización.",
    range: "11–15 min por video",
    price: 20000,
  },
  {
    n: 3,
    id: "N3",
    name: "Estratégico",
    tag: "Decido y transformo",
    desc: "Business cases, IA a escala, liderazgo, negociación y cómo contar una historia con datos.",
    range: "12–18 min por video",
    price: 20000,
  },
];

const TOPICS = ["Herramientas digitales", "IA", "Datos", "Operaciones", "Carrera", "Liderazgo", "Estrategia"];

// Helpers para escribir el contenido de forma compacta
const L = (title, min, puntos, practica, nota, quiz) => ({ type: "clase", title, min, puntos, practica, nota, quiz });
const T = (title, min, consigna, entregable, nota) => ({ type: "taller", title, min, consigna, entregable, nota });

const COURSES = [
  // ───────────── NIVEL 1 · ARRANCO ─────────────
  {
    id: "N1-01",
    level: 1,
    topic: "Herramientas digitales",
    title: "Excel y Sheets desde cero",
    desc: "Perderle el miedo a la planilla. Lo básico que más uso, con ejemplos de verdad.",
    lessons: [
      L("Celdas, filas y tus primeras fórmulas", 6,
        ["Una planilla es una grilla: columnas con letras, filas con números, celdas con dirección (B3).",
         "Toda fórmula empieza con =. Podés sumar, restar, multiplicar y dividir referencias.",
         "Las referencias se ajustan solas al arrastrar; con $ las fijás ($B$1).",
         "Excel y Google Sheets funcionan casi igual: lo que aprendés acá sirve en los dos."],
        { label: "Calculá un total con IVA", code: "=B2*(1+$E$1)" },
        "Empecé en atención al cliente. La planilla era mi lista de pendientes y nada más. Cuando pasé a depósito e inventario entendí que dos fórmulas bien puestas te ahorran horas. Así que nada: arrancá por lo básico, que es lo que más vas a usar.",
        ["¿Qué hace el signo $ en la referencia $E$1?", ["Convierte el valor en moneda", "Fija la celda para que no cambie al arrastrar", "Suma toda la columna E"], 1]),
      L("SUMA, PROMEDIO y CONTAR.SI", 7,
        ["SUMA y PROMEDIO trabajan sobre rangos: =SUMA(B2:B20).",
         "CONTAR.SI cuenta celdas que cumplen una condición: estados, nombres, montos.",
         "SUMAR.SI suma solo lo que cumple la condición (ej.: ventas de una zona).",
         "En Sheets el separador de argumentos puede ser coma o punto y coma según el idioma."],
        { label: "Contá los pedidos pendientes", code: '=CONTAR.SI(C2:C200;"Pendiente")' },
        "Hace poco armé una app para un familiar que llevaba su negocio en un cuaderno. Antes de programar nada, pasé el cuaderno a una planilla y conté lo que estaba pendiente. Ese número simple ordenó todo lo demás.",
        ["Querés saber cuántas filas dicen \"Entregado\". ¿Qué función usás?", ["PROMEDIO", "SUMA", "CONTAR.SI"], 2]),
      L("Formato, filtros y ordenar", 6,
        ["Un buen formato es para leer rápido: encabezados en negrita, números alineados a la derecha.",
         "Inmovilizá la primera fila para no perder los títulos al bajar.",
         "Los filtros te dejan ver solo lo que importa sin borrar nada.",
         "Formato condicional: que la planilla te avise en color lo que está mal."],
        { label: "Regla de formato condicional: marcar vencidos", code: "=Y($D2<HOY();$E2<>\"Cerrado\")" },
        "En depósito hacía recuentos cíclicos: comparar el stock físico contra el sistema. Con un filtro y un color solo para las diferencias, en un minuto sabía dónde mirar. Si todo está pintado, nada es urgente.",
        ["¿Para qué sirve inmovilizar la primera fila?", ["Para que nadie la pueda editar", "Para ver los encabezados al desplazarte", "Para ordenar los datos"], 1]),
      T("Desafío: tu primer control de gastos", 25,
        "Te propongo armar tu planilla de gastos del mes: categorías, un total por categoría con SUMAR.SI, un promedio por día y un formato condicional que marque en rojo lo que se pasa de tu presupuesto.",
        ["Link a tu planilla (con permiso de lectura)", "Una línea: qué descubriste de tus gastos"],
        "Esto lo hago en mi casa: todos los pagos del mes en una planilla, con lo que vence marcado. Te lo dejo en versión simple para que lo armes con tus gastos. 💜"),
    ],
  },
  {
    id: "N1-02",
    level: 1,
    topic: "IA",
    title: "IA para el día a día",
    desc: "Cómo uso la IA en mi día: escribir, resumir y organizarme. Sin humo.",
    lessons: [
      L("Qué es la IA generativa (y qué no)", 6,
        ["Un asistente de IA predice texto: es muy bueno redactando, resumiendo y explicando.",
         "No \"sabe\" todo: puede inventar datos con total seguridad. Siempre verificá cifras y nombres.",
         "No pegues información confidencial de tu empresa sin saber la política interna.",
         "Pensalo como un compañero rápido y entusiasta al que siempre le revisás el trabajo."],
        { label: "Pedile que te diga qué no sabe", code: "Si no estás seguro de algún dato, decímelo explícitamente en lugar de inventarlo." },
        "Uso Claude todos los días y aun así reviso cada número antes de usarlo. Como digo siempre: la IA es la parte fácil. Lo difícil es que el número sea creíble.",
        ["¿Cuál es el riesgo principal de usar IA sin revisar?", ["Que tarde mucho", "Que invente datos con seguridad", "Que escriba muy formal"], 1]),
      L("Cómo escribir un buen prompt", 7,
        ["Fórmula simple: rol + contexto + tarea + formato + tono.",
         "Cuanto más contexto le das, menos genérico es el resultado.",
         "Pedí el formato que necesitás: tabla, viñetas, mail de 5 líneas.",
         "Iterá: \"más corto\", \"más cálido\", \"agregá un ejemplo\"."],
        { label: "Plantilla de prompt", code: "Actuá como [rol]. Contexto: [situación]. Tarea: [qué necesito]. Formato: [tabla / viñetas / mail]. Tono: [cercano / formal]. Extensión: [máx. N líneas]." },
        "Cuando armé asistentes de IA para mi equipo, lo que más cambió no fue la herramienta. Fue el orden: primero entender el proceso y después contarle a la IA qué necesitábamos. Así automatizamos el 60 % de la redacción manual.",
        ["¿Qué suele mejorar más un resultado genérico?", ["Escribir en mayúsculas", "Darle más contexto y un formato claro", "Usar palabras técnicas"], 1]),
      L("IA para mails, resúmenes y planificación", 8,
        ["Mails: pegá el borrador y pedí que lo haga más claro y corto, manteniendo tu voz.",
         "Resúmenes: pedí decisiones, pendientes y responsables, no solo un resumen.",
         "Planificación: dale tus tareas y tu semana, y pedile un plan realista por bloques.",
         "Guardá tus mejores prompts: es tu kit personal."],
        { label: "Resumen de reunión accionable", code: "Resumí estas notas en: 1) decisiones tomadas, 2) pendientes con responsable y fecha, 3) dudas abiertas. Máximo 10 viñetas.\n\n[pegá tus notas]" },
        "Todas las mañanas a las 8 me llega un WhatsApp con mi día: agenda, mails importantes y cómo va mi búsqueda. Lo armé con IA y ya no tengo que acordarme de todo. Empezá por algo chico: una tarea que repetís todos los días.",
        ["Para un resumen de reunión útil conviene pedir…", ["Un texto largo y detallado", "Decisiones, pendientes y responsables", "Una traducción al inglés"], 1]),
      T("Desafío: tu kit de 5 prompts", 30,
        "Te propongo armar 5 prompts para cosas reales de tu semana: un mail, un resumen, una planificación, una explicación y uno libre. Probalos, mejoralos al menos una vez y guardá el antes y el después.",
        ["Link a un documento con tus 5 prompts", "Para cada uno: el resultado y qué cambiaste al iterar"],
        "Yo guardo los prompts que me funcionan para no escribirlos cada vez. Arrancá por cinco y fijate cuáles te quedan."),
    ],
  },
  {
    id: "N1-03",
    level: 1,
    topic: "Estrategia",
    title: "Cómo funciona una empresa",
    desc: "Cómo se conectan las áreas y cómo sabe una empresa si va bien. Lo que aprendí pasando por cada una.",
    lessons: [
      L("Las áreas y cómo se conectan", 6,
        ["Comercial vende, Operaciones entrega, Finanzas controla, Personas sostiene al equipo.",
         "Los problemas casi nunca son de un área: aparecen en los traspasos entre áreas.",
         "Saber qué necesita el área de al lado te hace mucho más valiosa o valioso.",
         "Un organigrama te dice quién manda; un mapa de procesos te dice cómo funciona."],
        { label: "Preguntas para entender un área", code: "1. ¿Qué entrega esta área y a quién?\n2. ¿Qué necesita recibir de otras áreas?\n3. ¿Cómo mide si le fue bien?\n4. ¿Cuál es su dolor más frecuente?" },
        "Empecé en atención al cliente. Me llegaban los reclamos de todo lo que había fallado antes: un pedido que no salió, una factura mal hecha. Sin buscarlo, ahí empecé a entender cómo se conecta todo.",
        ["¿Dónde suelen aparecer los problemas en una empresa?", ["Dentro de un área aislada", "En los traspasos entre áreas", "Solo en Finanzas"], 1]),
      L("Clientes, ventas y cadena de valor", 7,
        ["La cadena de valor es el camino desde que entra un pedido hasta que el cliente está conforme.",
         "Cada eslabón agrega valor… o costo y demora.",
         "Margen = precio − costo. Vender más no siempre es ganar más.",
         "Entender al cliente interno es tan importante como entender al externo."],
        { label: "Margen porcentual", code: "=(Precio-Costo)/Precio" },
        "Después pasé por depósito, logística y facturación. Ahí vi la otra punta: lo que en ventas parece un clic, en el depósito es armar, despachar y facturar. Cuando pasamos los remitos a online, sacamos el papel y bajaron los tiempos de despacho.",
        ["Si el precio es 100 y el costo 70, el margen es…", ["30%", "70%", "130%"], 0]),
      L("Indicadores: cómo sabe una empresa si va bien", 6,
        ["Un KPI es un número que importa, con una meta y un responsable.",
         "Pocos y buenos: si todo es prioridad, nada lo es.",
         "Indicadores de resultado (ventas) y de proceso (pedidos a tiempo).",
         "Un número sin contexto no dice nada: comparalo contra meta, mes anterior o año anterior."],
        { label: "Variación contra el mes anterior", code: "=(MesActual-MesAnterior)/MesAnterior" },
        "Cuando me puse a buscar trabajo, lo primero que hice fue medir: postulaciones, respuestas y entrevistas. Lo conté en LinkedIn como AS-IS, KPIs y TO-BE. Sin números, todo era sensación.",
        ["¿Qué le falta a un número para ser un buen KPI?", ["Muchos decimales", "Una meta y un responsable", "Un gráfico 3D"], 1]),
      T("Desafío: mapeá una empresa real", 25,
        "Te propongo elegir una empresa (la tuya o una que conozcas) y armar un mapa simple: las áreas, qué entrega cada una, por dónde pasa un pedido de punta a punta y 3 KPIs que mirarías.",
        ["Link o foto del mapa", "Los 3 KPIs con su meta tentativa"],
        "Este mapa es lo primero que hago cuando quiero entender un proceso: quién hace qué y dónde se traba. Primero el proceso, después la herramienta."),
    ],
  },
  // ───────────── NIVEL 2 · HAGO QUE FUNCIONE ─────────────
  {
    id: "N2-01",
    level: 2,
    topic: "Datos",
    title: "Excel y Sheets para analistas",
    desc: "Búsquedas, tablas dinámicas y limpieza de datos como en el trabajo real.",
    lessons: [
      L("BUSCARX y BUSCARV sin miedo", 13,
        ["BUSCARV busca a la derecha y se rompe si movés columnas; BUSCARX busca en cualquier dirección.",
         "Siempre definí qué pasa si no encuentra: evitás los #N/A en el reporte.",
         "La clave de búsqueda tiene que ser única y limpia (sin espacios de más).",
         "Para varias condiciones, combiná claves o usá FILTRAR."],
        { label: "Traer el precio de un producto", code: '=BUSCARX(A2;Productos!A:A;Productos!C:C;"No encontrado")' },
        "Cruzando dos bases con BUSCARV encontré cientos de clientes duplicados que nadie había visto. Ese hallazgo me llevó a mi primer proyecto de datos.",
        ["¿Qué ventaja tiene BUSCARX sobre BUSCARV?", ["Es más rápido de escribir", "Busca en cualquier dirección y maneja el no encontrado", "Funciona sin datos"], 1]),
      L("Tablas dinámicas", 14,
        ["Filas, columnas, valores y filtros: con eso resumís miles de registros en segundos.",
         "Los datos de origen tienen que estar en formato tabla: una fila por registro, un encabezado por columna.",
         "Cambiá Suma por Recuento o Promedio según la pregunta.",
         "Usá segmentaciones para que otras personas filtren sin romper nada."],
        { label: "Datos de origen listos para una dinámica", code: "Fecha | Zona | Producto | Cliente | Unidades | Importe\n(una fila por venta, sin celdas combinadas ni totales intermedios)" },
        "Una tabla dinámica bien armada reemplazó un reporte que alguien tardaba un día entero en hacer a mano. No era magia: eran datos ordenados.",
        ["¿Qué necesitan los datos de origen de una tabla dinámica?", ["Celdas combinadas", "Una fila por registro y encabezados claros", "Totales en cada fila"], 1]),
      L("Limpieza de datos", 12,
        ["ESPACIOS saca espacios de más; MAYUSC/MINUSC unifica textos.",
         "Separá texto en columnas para dividir nombres, códigos o fechas.",
         "Quitá duplicados con criterio: primero entendé por qué están.",
         "Documentá cada limpieza para poder repetirla el mes que viene."],
        { label: "Clave limpia para cruzar bases", code: "=MAYUSC(ESPACIOS(A2))" },
        "El 80% de mi tiempo como analista era limpiar datos. Aprender a hacerlo rápido y documentado fue lo que me liberó tiempo para analizar.",
        ["¿Qué hace la función ESPACIOS?", ["Agrega espacios entre palabras", "Quita espacios sobrantes", "Cuenta los espacios"], 1]),
      T("Desafío: reporte semanal desde datos crudos", 35,
        "Con una base de ventas desordenada (o una tuya), limpiá los datos, cruzala con una tabla de productos usando BUSCARX y armá una tabla dinámica con ventas por zona y producto, más 3 conclusiones.",
        ["Link a la planilla", "Las 3 conclusiones en viñetas"],
        "Este desafío es mi primer mes como analista, comprimido en 35 minutos."),
    ],
  },
  {
    id: "N2-02",
    level: 2,
    topic: "Datos",
    title: "Reportes y tableros",
    desc: "SQL básico y Looker Studio para pasar de planillas a tableros que se usan.",
    lessons: [
      L("Qué hace bueno a un tablero", 12,
        ["Un tablero responde preguntas de una audiencia concreta.",
         "Arriba lo más importante: los 3 a 5 KPIs con meta.",
         "Elegí el gráfico por la pregunta: tendencia en líneas, comparación en barras.",
         "Si necesita un manual, está demasiado complicado."],
        { label: "Brief de tablero", code: "Audiencia: …\nPregunta principal: …\nKPIs (máx. 5) y meta: …\nFrecuencia de actualización: …\nDecisión que habilita: …" },
        "Hice tableros hermosos que nadie usaba. El primero que funcionó lo diseñé sentándome con quien lo iba a mirar y preguntándole qué decisión tenía que tomar.",
        ["¿Con qué empieza un buen tablero?", ["Con muchos gráficos", "Con la pregunta y la audiencia", "Con los colores de la marca"], 1]),
      L("SQL básico para analistas", 15,
        ["SELECT elige columnas, FROM la tabla, WHERE filtra.",
         "GROUP BY agrupa y SUM/COUNT resumen, como una tabla dinámica.",
         "JOIN une tablas por una clave, como un BUSCARX gigante.",
         "ORDER BY y LIMIT para ver los primeros resultados."],
        { label: "Ventas por zona del último mes", code: "SELECT zona, SUM(importe) AS ventas\nFROM ventas\nWHERE fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)\nGROUP BY zona\nORDER BY ventas DESC;" },
        "Aprendí SQL porque me cansé de esperar que alguien me pasara los datos. Fue de lo mejor que hice por mi autonomía.",
        ["¿Qué cláusula se parece a armar una tabla dinámica?", ["WHERE", "GROUP BY", "LIMIT"], 1]),
      L("Tu primer tablero en Looker Studio", 14,
        ["Conectá una fuente: Google Sheets, BigQuery o un CSV.",
         "Definí dimensiones (zona, fecha) y métricas (ventas, pedidos).",
         "Agregá controles de fecha y filtros para que se explore solo.",
         "Compartilo con permisos de lectura y una fecha de actualización visible."],
        { label: "Campo calculado: ticket promedio", code: "SUM(importe) / COUNT_DISTINCT(pedido_id)" },
        "Mi primer tablero en Looker reemplazó cuatro mails semanales con adjuntos. La gente dejó de preguntarme números y empezó a preguntarme por qué.",
        ["En Looker Studio, \"zona\" es una…", ["Métrica", "Dimensión", "Fuente"], 1]),
      T("Desafío: tablero de ventas", 35,
        "Armá un tablero en Looker Studio (o la herramienta que uses) con 3 a 5 KPIs, una tendencia, una comparación por segmento y un filtro de fecha. Incluí el brief de tablero.",
        ["Link al tablero con permiso de lectura", "Tu brief de tablero"],
        "Cuando veo este desafío miro una sola cosa primero: ¿entiendo la conclusión en 10 segundos?"),
    ],
  },
  {
    id: "N2-03",
    level: 2,
    topic: "Operaciones",
    title: "Operaciones y supply chain",
    desc: "OTIF, Fill Rate, IRA y cómo trabajar con un operador logístico.",
    lessons: [
      L("OTIF y Fill Rate", 13,
        ["OTIF: pedidos entregados a tiempo y completos sobre pedidos totales.",
         "Fill Rate: unidades entregadas sobre unidades pedidas.",
         "Podés tener Fill Rate alto y OTIF bajo: entregás casi todo, pero tarde.",
         "Definí bien \"a tiempo\": ¿fecha pactada, ventana horaria, día hábil?"],
        { label: "OTIF en planilla", code: '=CONTAR.SI.CONJUNTO(D:D;"Sí";E:E;"Sí")/CONTARA(A2:A1000)' },
        "En mi etapa en la industria farmacéutica, un punto de OTIF era la diferencia entre un cliente tranquilo y una llamada urgente. Aprendí a respetar ese número.",
        ["Si entregás todo completo pero tarde, ¿qué baja?", ["El Fill Rate", "El OTIF", "Ninguno"], 1]),
      L("IRA: exactitud de inventario", 12,
        ["IRA: ítems cuyo conteo coincide con el sistema sobre ítems contados.",
         "Definí tolerancia: ¿exacto o ±2%?",
         "Conteos cíclicos: contar poco y seguido es mejor que un inventario anual gigante.",
         "Un IRA bajo genera quiebres fantasma: el sistema dice que hay y no hay."],
        { label: "Ítem exacto con tolerancia", code: "=SI(ABS(Fisico-Sistema)<=Sistema*0,02;1;0)" },
        "Una vez buscamos durante una semana un producto que el sistema decía que teníamos. El problema no era el depósito, era el IRA.",
        ["¿Qué mide el IRA?", ["Velocidad de entrega", "Coincidencia entre inventario físico y sistema", "Rotación de stock"], 1]),
      L("Trabajar con un 3PL", 14,
        ["Un 3PL es un operador logístico que almacena, prepara y/o distribuye por vos.",
         "El contrato tiene que tener SLAs medibles: OTIF, IRA, tiempos de preparación.",
         "Reuniones de seguimiento con datos, no con sensaciones.",
         "La relación funciona como sociedad: compartí pronósticos y cambios a tiempo."],
        { label: "Tablero mínimo de SLA con un 3PL", code: "KPI | Meta | Real | Responsable | Acción\nOTIF | 95% |  |  | \nIRA | 98% |  |  | \nPreparación en 24 h | 97% |  |  | " },
        "Mis mejores reuniones con operadores logísticos empezaron cuando llevé los datos y una pregunta en lugar de una queja.",
        ["¿Qué tiene que tener un contrato con un 3PL?", ["Solo el precio", "SLAs medibles con meta", "Fotos del depósito"], 1]),
      T("Desafío: diagnóstico logístico", 40,
        "Con una base de pedidos (te damos un ejemplo o usá la tuya), calculá OTIF, Fill Rate e IRA, comparalos con la meta y escribí un diagnóstico de una página con 3 acciones priorizadas.",
        ["Link a la planilla con los cálculos", "Diagnóstico de una página"],
        "Este es el ejercicio que más se parece a mi trabajo real en supply chain. Si te sale, ya pensás como analista de operaciones."),
    ],
  },
  {
    id: "N2-04",
    level: 2,
    topic: "Operaciones",
    title: "Procesos y automatización",
    desc: "SOPs, AS-IS/TO-BE y automatizaciones con N8N.",
    lessons: [
      L("SOPs que la gente usa", 11,
        ["Un SOP describe cómo se hace algo, paso a paso, para que salga igual siempre.",
         "Escribilo con quien hace la tarea, no desde el escritorio.",
         "Un paso = un verbo. Agregá capturas de pantalla.",
         "Tiene dueño y fecha de revisión, si no se vuelve viejo."],
        { label: "Estructura de SOP", code: "Objetivo:\nAlcance:\nResponsable:\nPasos (verbo + qué + dónde):\n1.\n2.\nExcepciones:\nÚltima revisión:" },
        "Escribí un SOP de 20 páginas que nadie leyó. El siguiente fue de una página con capturas, y lo pegaron al lado de la pantalla.",
        ["¿Con quién conviene escribir un SOP?", ["Con la persona que hace la tarea", "Solo con el gerente", "Con nadie, lo escribe la IA"], 0]),
      L("AS-IS y TO-BE", 13,
        ["AS-IS: cómo funciona hoy el proceso, aunque duela.",
         "Medí tiempos, esperas y retrabajos en cada paso.",
         "TO-BE: cómo debería funcionar, eliminando, simplificando y recién después automatizando.",
         "La brecha entre los dos es tu plan de trabajo."],
        { label: "Tabla AS-IS", code: "Paso | Responsable | Tiempo | Espera | Retrabajo | Dolor\n1. Recibe pedido por mail | Ventas | 5 min | 2 h | Sí | Datos incompletos" },
        "Mapeando un AS-IS descubrimos que un pedido pasaba por 7 manos y 3 planillas. El TO-BE quedó en 3 pasos, y eso fue antes de automatizar nada.",
        ["¿Qué conviene hacer antes de automatizar?", ["Comprar una herramienta", "Eliminar y simplificar pasos", "Agregar más aprobaciones"], 1]),
      L("Automatizar con N8N", 15,
        ["N8N conecta aplicaciones con flujos: disparador → pasos → acción.",
         "Empezá por tareas repetitivas, con reglas claras y de alto volumen.",
         "Ejemplo: formulario → planilla → mail de confirmación → aviso en chat.",
         "Siempre agregá un manejo de errores y alguien que reciba la alerta."],
        { label: "Esquema de un flujo", code: "Disparador: nuevo formulario recibido\n→ Validar datos obligatorios\n→ Agregar fila en Google Sheets\n→ Enviar mail de confirmación\n→ Avisar al equipo en el chat\n→ Si falla: alerta al responsable" },
        "La primera automatización que armé con N8N le devolvió a un equipo unas 10 horas por semana. Lo más lindo fue ver qué hicieron con ese tiempo.",
        ["¿Qué tareas conviene automatizar primero?", ["Las que cambian siempre", "Repetitivas, con reglas claras y mucho volumen", "Las que se hacen una vez al año"], 1]),
      T("Desafío: automatizá un proceso", 40,
        "Elegí un proceso repetitivo, mapeá su AS-IS, diseñá el TO-BE y armá el flujo de automatización en N8N (o el esquema detallado si no tenés acceso). Estimá las horas que ahorra.",
        ["Link al mapa AS-IS / TO-BE", "Captura o export del flujo", "Horas ahorradas por mes (estimadas)"],
        "Este desafío es el puente al nivel estratégico: cuando sabés cuántas horas ahorrás, ya podés armar un business case."),
    ],
  },

  // ───────────── NIVEL 3 · DECIDO Y TRANSFORMO ─────────────
  {
    id: "N3-01",
    level: 3,
    topic: "Estrategia",
    title: "Business cases y ROI",
    desc: "Convertir una buena idea en una decisión aprobada.",
    lessons: [
      L("Estructura de un business case", 14,
        ["Problema → opciones → recomendación → números → riesgos → próximos pasos.",
         "Arrancá por el problema en lenguaje de negocio, no por la solución.",
         "Siempre mostrá la opción \"no hacer nada\" y cuánto cuesta.",
         "Una página de resumen ejecutivo vale más que 30 slides."],
        { label: "Resumen ejecutivo en 5 líneas", code: "Problema: …\nImpacto hoy (en $ u horas): …\nPropuesta: …\nInversión y retorno: …\nDecisión que necesito: …" },
        "El primer business case que me aprobaron no tenía el modelo más sofisticado. Tenía el problema explicado en una frase que el director repitió en la reunión.",
        ["¿Qué opción siempre conviene incluir?", ["La más cara", "No hacer nada y su costo", "Solo la que te gusta"], 1]),
      L("ROI, payback y VAN simple", 16,
        ["ROI = (beneficio − inversión) / inversión.",
         "Payback: en cuántos meses recuperás la inversión.",
         "VAN: traer los flujos futuros a hoy con una tasa; si da positivo, crea valor.",
         "Sé conservadora o conservador con los beneficios: mejor sorprender para bien."],
        { label: "Payback en meses", code: "=Inversion/(AhorroMensual-CostoMensual)" },
        "Aprendí a presentar siempre un escenario pesimista. Paradójicamente, es el que más confianza genera.",
        ["Inversión 1.000, beneficio 1.500. ¿Cuál es el ROI?", ["50%", "150%", "33%"], 0]),
      L("Presentar para que te digan que sí", 13,
        ["Conocé a tu audiencia: qué le preocupa y cómo la miden.",
         "Pre-vendé: hablá con las personas clave antes de la reunión.",
         "Empezá por la conclusión y la decisión que necesitás.",
         "Prepará las 3 preguntas difíciles y sus respuestas."],
        { label: "Primera slide", code: "Recomendamos [acción] para [resultado] con una inversión de [$] y retorno en [N] meses. Necesitamos su aprobación para [próximo paso]." },
        "Mi mejor presentación duró 8 minutos. Hice todo el trabajo antes: cada persona en la sala ya había visto los números conmigo.",
        ["¿Con qué conviene empezar una presentación ejecutiva?", ["Con la historia de la empresa", "Con la conclusión y la decisión que necesitás", "Con el detalle técnico"], 1]),
      T("Desafío: business case de una automatización", 40,
        "Tomá la automatización del nivel operativo (u otra idea) y armá un business case completo: problema, opciones, ROI, payback, riesgos y una primera slide lista para presentar.",
        ["Link al documento o presentación", "La planilla con los cálculos"],
        "Este es el desafío que más me piden revisar antes de presentarlo de verdad en su trabajo. Esa es la idea."),
    ],
  },
  {
    id: "N3-02",
    level: 3,
    topic: "IA",
    title: "IA a escala",
    desc: "Roadmap, gobernanza y adopción para llevar la IA a toda una organización.",
    lessons: [
      L("Roadmap de IA", 16,
        ["Partí de problemas de negocio, no de herramientas.",
         "Priorizá casos por impacto, factibilidad y riesgo.",
         "Ganancias rápidas primero para construir confianza; apuestas grandes después.",
         "Cada caso con dueño, métrica de éxito y fecha de revisión."],
        { label: "Matriz de priorización de casos", code: "Caso | Impacto (1-5) | Factibilidad (1-5) | Riesgo (1-5) | Puntaje = I×F÷R | Dueño" },
        "Acompañando la adopción de IA en distintos equipos vi un patrón: los que arrancaron por un problema concreto avanzaron; los que arrancaron por la herramienta se quedaron en pilotos.",
        ["¿Por dónde conviene empezar un roadmap de IA?", ["Por la herramienta más nueva", "Por problemas de negocio priorizados", "Por el presupuesto disponible"], 1]),
      L("Gobernanza y riesgos", 14,
        ["Política clara: qué datos se pueden usar y con qué herramientas.",
         "Revisión humana en decisiones que afectan a personas o clientes.",
         "Registro de casos en uso, con dueño y nivel de riesgo.",
         "Gobernanza no es frenar: es poder avanzar rápido sin sorpresas."],
        { label: "Política de IA en una página", code: "Herramientas aprobadas: …\nDatos permitidos / prohibidos: …\nCuándo es obligatoria la revisión humana: …\nA quién consultar: …\nCómo registrar un caso nuevo: …" },
        "Una política de una página, bien comunicada, me sirvió más que un manual de 40. La gente necesita saber qué puede hacer, no solo qué no.",
        ["El objetivo de la gobernanza de IA es…", ["Prohibir su uso", "Avanzar rápido sin sorpresas", "Que solo la use sistemas"], 1]),
      L("Adopción: que la gente la use", 15,
        ["La herramienta es el 20%; el cambio de hábitos es el 80%.",
         "Formá referentes por área que acompañen a sus equipos.",
         "Mostrá casos reales del propio equipo, no demos genéricas.",
         "Medí uso y valor: cuántas personas la usan y para qué."],
        { label: "Métricas de adopción", code: "Usuarios activos semanales / usuarios con acceso\nCasos de uso documentados por área\nHoras ahorradas reportadas\nSatisfacción (1-5)" },
        "En una capacitación, el momento que cambió todo fue cuando una analista mostró cómo resolvía su reporte con IA. Ninguna demo mía tuvo ese efecto.",
        ["¿Qué pesa más en la adopción de IA?", ["La marca de la herramienta", "El cambio de hábitos de las personas", "El precio de la licencia"], 1]),
      T("Desafío: roadmap de IA para una empresa", 40,
        "Para una empresa real o ficticia, listá 6 casos de uso, priorizalos con la matriz, armá un roadmap de 6 meses y una política de IA de una página.",
        ["Link al roadmap", "Tu política de IA de una página"],
        "Esto es literalmente lo que hago con las empresas que acompaño. Te lo dejo como plantilla para que lo hagas en la tuya."),
    ],
  },
  {
    id: "N3-03",
    level: 3,
    topic: "Liderazgo",
    title: "Liderazgo y negociación",
    desc: "Pasar de hacer a liderar, dar feedback y negociar con método.",
    lessons: [
      L("De hacer a liderar", 13,
        ["Tu trabajo ya no es hacer todo bien, es que el equipo haga bien.",
         "Delegá resultados, no tareas: qué, para cuándo y cómo lo sabremos.",
         "Reuniones 1 a 1 frecuentes: el espacio más importante de tu semana.",
         "Tu energía y tu ejemplo marcan el clima más que cualquier discurso."],
        { label: "Agenda de 1 a 1", code: "1. ¿Cómo estás?\n2. ¿Qué te está trabando?\n3. Avances y prioridades\n4. Feedback en las dos direcciones\n5. Algo para tu desarrollo" },
        "Mi primer error como líder fue seguir haciendo todo yo. El equipo no crecía y yo me agotaba. Delegar me costó, pero fue lo que nos hizo crecer a todos.",
        ["Delegar bien significa…", ["Pasar tareas sin contexto", "Delegar resultados con fecha y criterio de éxito", "Hacerlo vos para que salga bien"], 1]),
      L("Feedback y conversaciones difíciles", 14,
        ["Modelo SCI: Situación, Comportamiento, Impacto.",
         "Hablá de hechos observables, no de la persona.",
         "Preguntá antes de concluir: puede haber contexto que no ves.",
         "Cerrá con un acuerdo concreto y una fecha de seguimiento."],
        { label: "Feedback con SCI", code: "En [situación], vi que [comportamiento concreto]. Eso generó [impacto]. ¿Cómo lo ves vos? ¿Qué podemos acordar?" },
        "Una de las conversaciones más difíciles que tuve terminó siendo el inicio de una gran relación de trabajo. Lo que la salvó fue preguntar antes de juzgar.",
        ["En SCI, la C es…", ["Carácter", "Comportamiento observable", "Conclusión"], 1]),
      L("Negociar con método", 17,
        ["Separá posiciones (lo que piden) de intereses (por qué lo piden).",
         "Conocé tu alternativa si no hay acuerdo: te da poder y calma.",
         "Creá opciones antes de repartir: agrandá la torta.",
         "Usá criterios objetivos: precios de mercado, datos, benchmarks."],
        { label: "Preparación de negociación", code: "Mi objetivo: …\nMi alternativa si no hay acuerdo: …\nIntereses de la otra parte: …\nOpciones de valor mutuo: …\nCriterios objetivos: …\nMi límite: …" },
        "Negociando con proveedores aprendí que el que más se prepara casi siempre gana, y que preguntar \"¿por qué es importante para vos?\" abre puertas que el precio no abre.",
        ["¿Qué te da más poder en una negociación?", ["Hablar más fuerte", "Conocer tu alternativa si no hay acuerdo", "Ceder rápido"], 1]),
      T("Desafío: plan de negociación", 35,
        "Elegí una negociación real que tengas por delante (aumento, proveedor, alcance de un proyecto) y completá la preparación. Escribí además cómo abrirías la conversación.",
        ["Tu preparación completa", "Tu apertura en 3 a 5 frases"],
        "Me encanta este desafío porque muchas personas me escriben después contándome cómo les fue. Spoiler: casi siempre mejor de lo que esperaban."),
    ],
  },
  {
    id: "N3-04",
    level: 3,
    topic: "Estrategia",
    title: "Proyectos ágiles y storytelling con datos",
    desc: "Llevar proyectos a buen puerto y contar los resultados para que muevan decisiones.",
    lessons: [
      L("Ágil sin dogma", 12,
        ["Ágil es entregar valor en ciclos cortos y aprender de cada uno.",
         "Tablero simple: por hacer, en curso, hecho.",
         "Reunión diaria corta: qué hice, qué haré, qué me traba.",
         "Retrospectiva: qué mantenemos, qué cambiamos."],
        { label: "Retrospectiva en 15 minutos", code: "¿Qué salió bien?\n¿Qué nos trabó?\n¿Qué probamos distinto el próximo ciclo?\nResponsable y fecha de cada cambio" },
        "No necesité certificaciones para trabajar ágil. Necesité un tablero visible y el hábito de revisar cada dos semanas qué estábamos aprendiendo.",
        ["¿Qué es lo esencial de trabajar ágil?", ["Usar muchas ceremonias", "Entregar en ciclos cortos y aprender", "No planificar nada"], 1]),
      L("Priorizar y medir", 15,
        ["Matriz impacto vs. esfuerzo: primero lo de alto impacto y bajo esfuerzo.",
         "Definí la métrica de éxito antes de arrancar.",
         "Decir que no también es priorizar.",
         "Revisá prioridades cuando cambia el contexto, no cada vez que alguien grita."],
        { label: "Puntaje RICE", code: "=(Alcance*Impacto*Confianza)/Esfuerzo" },
        "La frase que más me ayudó a priorizar fue: \"si hacemos esto, ¿qué dejamos de hacer?\". Ordena cualquier reunión.",
        ["En impacto vs. esfuerzo, ¿qué hacés primero?", ["Alto esfuerzo, bajo impacto", "Alto impacto, bajo esfuerzo", "Lo que pidió el último"], 1]),
      L("Storytelling con datos", 18,
        ["Estructura: contexto → conflicto → resolución → llamado a la acción.",
         "Un gráfico, un mensaje: el título del gráfico es la conclusión.",
         "Sacá todo lo que no ayuda: bordes, leyendas, decimales.",
         "Resaltá con color solo lo que querés que miren."],
        { label: "Título que es conclusión", code: "En lugar de: \"Ventas por mes\"\nMejor: \"Las ventas cayeron 12% desde que cambió el plazo de entrega\"" },
        "El día que empecé a titular mis gráficos con la conclusión, mis presentaciones se acortaron a la mitad y las decisiones llegaron el doble de rápido.",
        ["¿Qué debería decir el título de un gráfico?", ["El nombre de la base de datos", "La conclusión principal", "La fecha de extracción"], 1]),
      T("Desafío: contá tu proyecto en 5 slides", 35,
        "Elegí un proyecto (de esta serie o de tu trabajo) y contalo en 5 slides: contexto, problema, lo que hiciste, resultados con un gráfico bien titulado y el pedido o próximo paso.",
        ["Link a la presentación"],
        "Este es el cierre del camino: de una planilla en el nivel inicial a contar una historia que mueve una decisión. Así fue mi camino, y puede ser el tuyo."),
    ],
  },
];

// Expandir códigos y metadatos
const LESSONS = [];
COURSES.forEach((c) => {
  c.lessons.forEach((l, i) => {
    l.code = l.type === "taller" ? `${c.id}-T` : `${c.id}-0${i + 1}`;
    l.courseId = c.id;
    l.level = c.level;
    l.topic = c.topic;
    l.index = i;
    LESSONS.push(l);
  });
});

const LESSON_BY_CODE = Object.fromEntries(LESSONS.map((l) => [l.code, l]));

// Niveles pagos: mientras no estén grabados, se ven como "Próximamente" y no se pueden comprar
const PAID_LEVELS_OPEN = false;

// Accesos que llevan a otras webs mías (aparecen como una tarjeta más en su nivel)
const EXTRAS = [
  {
    level: 1,
    topic: "Carrera",
    title: "LinkedIn desde 0",
    desc: "Mi método para armar tu perfil, una guía de regalo y las asesorías 1:1. Lo tengo todo en mi web Mi camino.",
    url: "https://mila-ops-ia.github.io/mi-camino/",
  },
];
const COURSE_BY_ID = Object.fromEntries(COURSES.map((c) => [c.id, c]));

// Test de nivel: cada opción suma puntos; el total recomienda un nivel
const LEVEL_TEST = [
  {
    q: "¿Cómo te llevás con Excel o Google Sheets?",
    a: ["Casi no lo uso o me cuesta", "Uso fórmulas y filtros sin problema", "Hago tablas dinámicas, cruces y tableros"],
  },
  {
    q: "¿Cómo usás la IA hoy?",
    a: ["Poco o nada", "Para escribir, resumir y organizarme", "Pienso cómo implementarla en un equipo o empresa"],
  },
  {
    q: "¿Qué describe mejor tu trabajo actual?",
    a: ["Estoy buscando trabajo o arrancando", "Ejecuto y mejoro procesos, armo reportes", "Lidero personas, proyectos o decisiones"],
  },
  {
    q: "Si te piden justificar una inversión, vos…",
    a: ["No sabría por dónde empezar", "Calculo cuánto tiempo o plata ahorra", "Armo un business case con ROI y riesgos"],
  },
];

// Parte de la consigna de grabación: tiempos estimados por bloque
function buildScript(lesson) {
  const total = lesson.min * 60;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  const blocks = [];
  if (lesson.type === "clase") {
    const parts = [
      ["Apertura", 0.07, `Presentarte y contar qué vas a llevarte de este video: "${lesson.title}".`],
      ...lesson.puntos.map((p, i) => [`Idea ${i + 1}`, 0.5 / lesson.puntos.length, p]),
      ["Práctica en pantalla", 0.25, `${lesson.practica.label}. Mostrar paso a paso y dejarla para copiar.`],
      ["Nota de Mili", 0.1, "Contar la anécdota en primera persona."],
      ["Cierre", 0.08, "Resumen en una frase + invitar a la pregunta rápida y a dejar preguntas."],
    ];
    let t = 0;
    parts.forEach(([name, share, text]) => {
      const d = total * share;
      blocks.push({ from: fmt(t), to: fmt(t + d), name, text });
      t += d;
    });
  } else {
    const parts = [
      ["Apertura", 0.06, "Qué vamos a construir y para qué sirve en el trabajo real."],
      ["El desafío", 0.1, lesson.consigna],
      ["Lo hago en vivo", 0.6, "Resolverlo en pantalla con un caso de ejemplo, pensando en voz alta: lo que funciona y lo que no."],
      ["Errores comunes", 0.1, "Qué suele salir mal y cómo revisarlo antes de compartirlo."],
      ["Cómo compartirlo", 0.08, `Qué me muestran: ${lesson.entregable.join("; ")}.`],
      ["Cierre", 0.06, "Nota de Mili + qué viene después."],
    ];
    let t = 0;
    parts.forEach(([name, share, text]) => {
      const d = total * share;
      blocks.push({ from: fmt(t), to: fmt(t + d), name, text });
      t += d;
    });
  }
  return blocks;
}

function screenPlan(lesson) {
  if (lesson.type === "taller") {
    return ["Slide del desafío", "Pantalla compartida resolviendo el caso", "Checklist de lo que me tienen que mostrar", "Un ejemplo bien resuelto"];
  }
  return ["Slide de título con código " + lesson.code, "Slides con las ideas clave", `Demo: ${lesson.practica.label}`, "Slide final con la pregunta rápida"];
}
