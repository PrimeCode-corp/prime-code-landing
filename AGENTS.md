# AGENTS.md

Guía para agentes de código (Codex y otros) que trabajan en este repositorio. Léela completa antes de modificar cualquier sección.

## Qué es Prime Code y para qué existe esta landing

**Prime Code S.A.C.** es una empresa de desarrollo de Tarapoto (San Martín, Perú). Se posiciona como el equipo que hace **sistemas a medida con orden y profesionalidad**: primero entiende cómo trabaja el negocio del cliente y después construye el sistema que lo ordena, con procesos definidos de principio a fin y acompañamiento después de la entrega.

Líneas de servicio (son las 6 filas de la sección Servicios):
1. Sistemas a medida
2. Páginas web
3. Entradas para eventos: venta, acreditación y control en puerta con la marca del organizador, y validación que funciona sin señal. Es **un producto más**, no el titular de la empresa.
4. Paneles y reportes
5. Automatización
6. Soporte y mantenimiento

Clientes reales que se muestran: **Alcanfest** (festival de arte y cultura), **Conaea San Martín 2026** (congreso nacional) y **Clave**.

### Objetivo de la landing
- **Conseguir contactos y cotizaciones** de negocios de la región. Toda la página empuja a la acción principal, **Cotizar**, que lleva a `#contacto`. La vía secundaria es WhatsApp o el correo.
- Transmitir **orden, profesionalidad y cercanía**: que un negocio sienta que Prime Code lo va a ordenar, no solo hacerle "un programa".
- Dar confianza con pruebas reales: logos de clientes, testimonios y el equipo en Tarapoto.

### A quién le habla
Dueños, administradores y organizadores de eventos del nororiente peruano. **La mayoría no son técnicos.**
- Usar "sistema" o "web" en lugar de "software" o "plataforma"; sin jerga (nada de "stack", "SaaS", "cloud").
- Tono profesional, cercano y directo, tuteando ("tu negocio", "te ayudamos").
- Evitar repetir las mismas palabras entre secciones ("a medida", "soluciones", "profesional"). Los textos del diseño ya están revisados para no redundar: **copiarlos tal cual**.

### Prioridades técnicas
- **Rendimiento en móvil y con conexiones lentas**: el público navega mucho desde el celular. HTML estático por defecto e imágenes optimizadas con `astro:assets` (`<Image>`, formatos modernos, `loading="lazy"` salvo en el Hero).
- **JavaScript mínimo**: solo como islas, para lo que de verdad lo necesita (el símbolo ASCII y, más adelante, el carrusel de testimonios), hidratadas con `client:visible`.
- **SEO local**: títulos y descripciones en español, un solo `<h1>` (en el Hero), jerarquía correcta de encabezados y textos alternativos útiles.
- **Accesibilidad**: contraste según la paleta (celeste nunca como texto sobre crema), elementos decorativos con `aria-hidden`, botones y enlaces con nombre accesible y animaciones que respetan `prefers-reduced-motion`.

## De dónde salen las pantallas y cómo pasarlas

El diseño está en un lienzo de Claude Design (página "Landing · Prime Code"). Cada sección se exporta como un archivo `.dc.html` de **1440 × 932** (el footer es de 1440 × 600). Para pasar una sección:

1. Copiar **solo el marcado** que está dentro de `<x-dc>` al componente de `src/components/sections/`, reemplazando el cascarón. **No** copiar `support.js`, `<helmet>` ni la clase `DCLogic`.
2. Convertir los estilos inline a clases de Tailwind con los tokens existentes (colores, fuentes, tamaños, radios). Si un valor exportado coincide con un token (por ejemplo `max(40px, 5.56vw)` → `text-display-xl`), usar el token.
3. Convertir lo que quede en `vw` a `--u` con valores arbitrarios, y los elementos `absolute` con las fórmulas de `--frame`. Ver "Sistema de diseño y escala" y el comentario de `global.css`.
4. Cambiar `min-height: max(720px, 64.7vw)` por `screen-section` (o `screen-section-sm` / `screen-section-2`), y el padding lateral por `section-frame`.
5. Pasar los `@keyframes` del `<helmet>` a `global.css` como animaciones con nombre y aplicarlos con clases (`animate-*`, `animate-delay-*`). Si el componente de Astro necesita un keyframe exclusivo, puede ir en un `<style>` del propio componente.
6. Los `<script type="text/x-dc">` con lógica (el ASCII) se reescriben como **isla**: un componente de framework o un `<script>` de Astro con JS plano. No traer el runtime del lienzo.
7. Las imágenes (`/_blob/...`) las entrega el diseño aparte: van en `src/assets/` y se usan con `<Image>`.
8. Revisar la sección en 2560×1300, 1920×960, 1440×932 y 1280×720 (ver la tabla en el comentario de `global.css`) y correr `npm run build`.

## Contenido de cada sección (referencia rápida)

Textos y comportamiento final según el diseño aprobado. Si el exportado y esta lista no coinciden, manda el exportado.

- **Header**: solo el símbolo del logo (sin el texto "Prime Code"). Menú: Inicio · Nosotros · Servicios ▾ · Clientes · Contacto.
- **Hero** (`#inicio`): fondo vino oscuro → cacao. A la izquierda, `<h1>` "**Prime** Code" ("Prime" en vino-claro), el subtítulo "Un negocio profesional merece / una web **a su altura**." y el botón "Cotizar". A la derecha, "Sistemas / hechos / a medida" con degradado que entra desde el vino y un párrafo. Al centro el retrato, que **es de referencia y se reemplaza**. Abajo, la tarjeta crema "4+ Años de experiencia" con ícono de doble chevrón, la tarjeta de vidrio "Orden · Marca personal" (detrás del retrato) y la franja "Confían en nosotros" con iniciales superpuestas.
- **Sección 1 · Nosotros** (`#nosotros`): fondo crema. Párrafo "En Prime Code creemos que un buen sistema no se nota…", enlace "Conoce más", tarjeta oscura con esquina recortada y botón celeste cuadrado, y la tarjeta vino "Cómo trabajamos" con 4 barras en chevrón: 01 Levantamiento · 02 Diseño · 03 Desarrollo · 04 Soporte.
- **Sección 2 · Clientes** (`#clientes`): cuadrícula de 4 × 3 con líneas finas y logos en gris intercalados (negro y gris, como un tablero de ajedrez). Al pasar el cursor, cada logo pasa a color. Los 3 logos se repiten hasta que haya más clientes. La última celda lleva "Ellos ya confían en nosotros. **Tu negocio puede ser el siguiente.**" y el botón "Cotizar".
- **Sección 3 · Soluciones personalizadas** (`#soluciones`): fondo cacao con el **símbolo PC en ASCII** al centro. Se construye en 1 s con caracteres que aparecen al azar (primero como punto) y luego queda con un parpadeo leve. Trazo en `rojo-ascii`, relleno crema y sombra crema tenue. "Soluciones personalizadas" entra desde la derecha y se queda arriba a la izquierda. "TARAPOTO, PERÚ" entra desde la izquierda y se queda abajo a la derecha, con las coordenadas debajo. Abajo a la izquierda, botones de WhatsApp, Instagram, Facebook y Correo. **Sin rayos ni estelas**: se probaron y se descartaron.
- **Sección 4 · Servicios** (`#servicios`, dos pantallas): fondo de franjas vino animadas. Título "¿Cómo te **ayudamos**?" y el subtítulo "Todo lo que tu empresa necesita para trabajar con orden, desde el primer levantamiento hasta el soporte diario." Siguen 6 filas de vidrio vino (01–06, ver la lista de servicios arriba), cada una con un botón cuadrado de marco vino y centro celeste, y una flecha en bucle.
- **Sección 5 · Lo que nos diferencia** (`#diferenciales`): fondo crema, título y botón "Empezar un proyecto". Cinco tarjetas verticales con fondos hechos en CSS: Tu marca al frente · Plazos claros · Procesos de principio a fin · Cerca de ti · Acompañamiento real.
- **Sección 6 · Testimonios** (`#testimonios`): "Lo que dicen nuestros **clientes**", paginación vertical celeste, retrato en tonos rojos (de referencia), testimonio justificado y firma con línea vino.
- **Sección 7 · CTA** (`#contacto`): banner vino con degradado animado, "Construyamos el sistema / que tu negocio **necesita**" ("necesita" en celeste), texto de apoyo y el botón "Cotizar mi proyecto".
- **Footer**: distribución tipo Alcanfest. Línea superior y 4 columnas: PRIME CODE (menú) · SERVICIOS · REDES · HABLEMOS DE TU PROYECTO, con el botón "Agenda una reunión" en celeste con sombra offset y el correo. Fila legal: "© 2026 Prime Code S.A.C. · Tarapoto, San Martín · Perú" | "Política de privacidad", y "Prime Code" a la derecha.

## Pendientes y reglas de contenido

- **Datos por confirmar** (en el diseño son de ejemplo): correo (`hola@primecode.pe`), número de WhatsApp, enlaces de Instagram y Facebook. Centralizarlos en un solo archivo de datos (por ejemplo `src/data/contacto.ts`) para cambiarlos en un solo lugar.
- **Testimonios**: el texto y la firma están entre corchetes porque todavía no hay testimonios reales; se piden a cada cliente al cierre del proyecto. **Nunca publicar un testimonio inventado ni atribuirle frases a un cliente real.** Mientras no haya, la sección puede ocultarse con una bandera.
- **Retratos** del Hero y de Testimonios: son imágenes de referencia de la plantilla, recoloreadas. Se reemplazan por fotos propias, idealmente recortadas sin fondo.
- No inventar cifras, clientes ni logros. El único dato numérico aprobado es "4+ años de experiencia".
- No usar imágenes ni textos del modelo original ("Elevate"): solo sirvió de referencia de estructura.

## Proyecto

Landing de Prime Code S.A.C. (sitio en español, `lang="es"`). Astro 7 + Tailwind CSS v4 (vía `@tailwindcss/vite`, **sin** `tailwind.config`). Fuentes con `@fontsource`. Node >= 22.

## Comandos

- `npx astro dev --background` — servidor de desarrollo en `localhost:4321` (ver «Servidor de desarrollo» al final de este archivo para `stop`/`status`/`logs`; si el servidor lo abrió el usuario en su terminal, `logs` no está disponible).
- `npm run build` — build a `dist/`; es la forma de comprobar que todo compila.
- `npx astro check` — chequeo de tipos (tsconfig `astro/tsconfigs/strict`).
- No hay tests ni linter configurados.

## Arquitectura

- `src/pages/index.astro` monta `Layout` + las secciones en orden: Header (absolute, superpuesto al Hero, no sticky) → `<main>` con Hero, Nosotros, Clientes, Soluciones, Servicios, Diferenciales, Testimonios, CTA → Footer.
- `src/components/sections/*.astro`: un componente por sección. Hoy son **cascarones** (título + línea mono con ancla y alto de referencia) que se reemplazan con el contenido exportado del diseño; el comentario al inicio de cada uno describe qué va ahí.
- `src/layouts/Layout.astro`: `<head>` y carga de `global.css`.
- `src/pages/estilos.astro`: página de prueba del sistema de diseño, con un bloque que muestra en vivo `--u` y `--frame`. Usarla para verificar tokens.
- `src/styles/global.css`: **toda** la configuración de Tailwind y del sistema de diseño (`@theme`, `@utility`, `@layer base`). El comentario al inicio del archivo documenta las fórmulas de conversión.

## Sistema de diseño y escala (clave)

- Artboard de diseño: **1440 × 932 px**; los exportados vienen en `vw`. Nunca usar `vw` directo en layout: usar la unidad `--u` = `min(1vw, 1.545vh, --maxw/100)` (tope 14.4px). `--maxw` (1440px) es el único valor a editar para cambiar el ancho máximo. No meter `--frame` (contiene `%`) dentro de `--u`.
- Conversión de medidas exportadas con valores arbitrarios: `Nvw` → `[calc(var(--u)*N)]`; `max(Apx, Nvw)` → `[max(Apx,calc(var(--u)*N))]`. Las `@keyframes` pueden quedarse en `vw`.
- Elementos `absolute` se ubican respecto a la sección a ancho completo: compensar con `--frame` (fórmulas en el comentario de `global.css`).
- Utilidades propias: `section-frame` (fondo a todo lo ancho, contenido centrado + gutter; toda sección y el Header la usan), `screen-section` (`max(720px,100vh)`), `screen-section-sm` (Clientes, 560px), `screen-section-2` (Servicios, dos pantallas), `animate-delay-*` (ms). Los altos de pantalla usan `vh`, nunca `--u`. El Footer no lleva alto de pantalla.
- Tokens: colores `cacao(-900/-950)`, `vino(-700/-500)`, `vino-claro`, `rojo-ascii` (solo ASCII), `celeste` (acento), `crema`, `borde`, `texto-2`; fuentes `font-display` (Chakra Petch 500/600), `font-sans` (IBM Plex Sans 300/400/600, por defecto; párrafos en 300), `font-mono` (IBM Plex Mono 400); tamaños `text-display-xl/lg/md`, `text-title`, `text-body-lg/body/body-sm`, `text-caption`; `px-gutter`, `gap-cards`, `h-header-h`; `shadow-offset(-hover)`; `ease-brand`; `animate-fade-in`, `animate-rise`.
- Reglas de marca: botones principales `bg-celeste text-cacao`; celeste nunca como texto sobre crema. Radios: los por defecto de Tailwind están eliminados; solo `rounded-sm` (2px), `rounded` (4px), `rounded-lg` (8px, máximo). Nada de botones píldora.
- Usar solo clases de Tailwind / tokens configurados, sin estilos sueltos. `prefers-reduced-motion` ya desactiva animaciones globalmente.

## Servidor de desarrollo

<!-- PEGAR AQUÍ el contenido del AGENTS.md original que generó Astro (instrucciones de `astro dev --background`, `stop`, `status`, `logs`).
Codex no entiende la importación `@AGENTS.md` de Claude, así que todo tiene que estar en este archivo. -->
