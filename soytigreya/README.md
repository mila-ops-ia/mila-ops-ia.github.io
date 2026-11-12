# SoyTigreYa

**Beneficios Soy Tigre, comercio de barrio y trámites municipales en una sola app.**

Prototipo funcional, propuesto por **mila·ops**, del Trabajo Final Integrador de la **Diplomatura en Negocios Digitales e Innovación** (Universidad Nacional del Delta, 2026). Autora: Milagros Belén Sanabria.

👉 **Probala en vivo:** https://mila-ops-ia.github.io/soytigreya

<img src="img/qr-soytigreya.png" alt="Código QR para abrir SoyTigreYa" width="160">
Se puede instalar en el celular: en Android, menú ⋮ › "Instalar app"; en iPhone, Compartir › "Agregar a inicio".

> ⚠️ **Prototipo académico.** No es una app oficial del Municipio de Tigre ni está vinculada con él. Los comercios, las personas y los números son de demostración. Usa la identidad visual pública del municipio solo como referencia para la propuesta.

---

## La idea

SoyTigreYa convierte la tarjeta de beneficios **Soy Tigre** en una super-app municipal:

- **Comercio de cercanía sin comisión.** Los comercios venden con retiro en el local (takeaway) sin pagar el 20 a 30% de comisión de las apps privadas, y el descuento Soy Tigre se aplica solo.
- **Trámites y servicios del vecino.** Turnos, reclamos con foto y mapa, pagos de tasas, multas y estacionamiento, altura del río, colectivos, farmacias de turno y botón de alerta.
- **Datos para el municipio.** Ventas por localidad, comisiones que quedan en el distrito y gestión de reclamos.

## Cuatro perfiles

Al entrar se elige con quién recorrer la app:

| Perfil | Rol | Qué ve |
|---|---|---|
| 👩🏻 Lucía | Vecina de Tigre Centro | La app del celu: beneficios, compras, trámites, Puntos Tigre y la asistente Tigri |
| 👩🏻‍🍳 Rosa | Dueña de Pastas Doña Rosa | El panel de su local: pedidos, productos y la comisión que se ahorró |
| 👨🏽‍💼 Carlos | Atención al Vecino | Los reclamos en el mapa y los turnos del día |
| 👩🏽‍💼 Marina | Desarrollo Económico | El impacto: ventas, comercios, ahorro de los vecinos y puntos |

El botón **"▶ Ver el recorrido guiado"** muestra, en 10 pasos, cómo un pedido y un reclamo pasan por las cuatro personas.

## Funciones principales

- Credencial digital con QR que cambia cada 30 segundos
- Beneficios en lista y mapa (OpenStreetMap)
- Takeaway con descuento automático, horario de retiro y código de retiro
- Pagos simulados con Mercado Pago, Cuenta DNI, tarjeta o efectivo
- **Puntos Tigre:** se suman al comprar en el barrio, pagar la tasa a tiempo, reciclar y por reclamos resueltos. Se canjean por cupones, descuento en la tasa, estacionamiento o entradas culturales
- **Tigri:** asistente de chat que entiende frases como "quiero pizza", "hay un bache" o "farmacia de turno". Por ahora funciona con reglas, y en la etapa 3 se conectaría a inteligencia artificial
- Modo de letra grande y alto contraste
- Versión de escritorio y app instalable (PWA) que abre sin conexión

## Documentos

- [Presentación: pitch de venta y defensa del TFI (PDF, 22 diapositivas)](documentos/Presentacion%20-%20SoyTigreYa.pdf)
- [Propuesta comercial de mila·ops para el Municipio de Tigre (PDF)](documentos/Propuesta%20comercial%20-%20SoyTigreYa%20-%20mila-ops.pdf): planes, precios, retorno esperado y plan del piloto
- [Propuesta comercial (Word)](documentos/Propuesta%20comercial%20-%20SoyTigreYa%20-%20mila-ops.docx)
- [Trabajo Final Integrador (PDF)](documentos/Trabajo%20Final%20Integrador%20-%20SoyTigreYa.pdf)
- [Trabajo Final Integrador (Word)](documentos/Trabajo%20Final%20Integrador%20-%20SoyTigreYa.docx)
- [Capturas del prototipo](capturas/)

## Cómo está hecha

- HTML, CSS y JavaScript sin frameworks ni proceso de compilación
- [Leaflet](https://leafletjs.com) + OpenStreetMap para los mapas y [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) para los QR
- Datos de demostración guardados en el navegador (`localStorage`). Cada aparato tiene su propia demo; "Reiniciar los datos de la demo" vuelve al inicio
- Colores del Municipio de Tigre (rojo `#D02013`, gris pizarra `#515769`) y tipografía Montserrat

```
index.html      la app
css/app.css     estilos
js/data.js      datos de demo: comercios, beneficios, perfiles, puntos
js/app.js       lógica, pantallas, Tigri y recorrido guiado
manifest.json   instalación en el celu
sw.js           funcionamiento sin conexión
documentos/     trabajo escrito (PDF, Word y el script que lo genera)
capturas/       capturas de pantalla
```

Para verla en tu compu, desde esta carpeta:

```bash
python3 -m http.server 8450
```

y abrí http://localhost:8450.

## Fuentes de los datos

- Población de Tigre: Censo Nacional 2022 (446.925 habitantes)
- Comisiones de apps de delivery: Develop Argentina (marzo de 2026) e iProfesional (julio de 2026)
- Antecedentes: MuniShop (Rosario), Munimercado (Neuquén), Góndola Sancarlina (Mendoza), Billetera Santa Fe, Boti y BAX (CABA), App Ciudadana (Córdoba)
- Costos de referencia: tarifas publicadas de Supabase y Mercado Pago (2026) y sueldos IT de Develop Argentina (junio de 2026)
