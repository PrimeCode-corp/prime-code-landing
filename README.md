# Prime Code · Landing

Landing de **Prime Code S.A.C.**, empresa de desarrollo de sistemas a medida en Tarapoto (San Martín, Perú). Su objetivo es conseguir contactos y cotizaciones: toda la página lleva a la acción principal, **Cotizar**.

## Enlaces

| Entorno | URL | Rama |
|---|---|---|
| **Producción** | https://prime-code-landing-production.up.railway.app/ | `master` |
| **QA** | https://prime-code-landing-qa.alcanfest-frontend.workers.dev/ | `qa` |
| **Diseño** (flujo completo de pantallas) | https://claude.ai/artifact/64RSdQfzuY9fkqq8zAvmSi#page-c73113370f23 | — |

> El dominio **prime-code.net** todavía no está habilitado. Por ahora, producción solo se ve en el enlace de Railway.

## Stack

- [Astro 7](https://docs.astro.build): sitio estático. Genera `dist/` y no tiene servidor propio.
- [Tailwind CSS v4](https://tailwindcss.com) con `@tailwindcss/vite`. No hay `tailwind.config`: toda la configuración está en `src/styles/global.css`.
- Fuentes con `@fontsource`: Chakra Petch, IBM Plex Sans e IBM Plex Mono.
- Node **26.13.0**, la versión de `.node-version` (mínimo 22.23.4, según `package.json`).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias |
| `npm run dev` | Servidor de desarrollo en `http://localhost:4321` |
| `npm run build` | Build de producción en `dist/` |
| `npm run build:qa` | Igual que `build`, y además crea `dist/_headers` con `X-Robots-Tag: noindex` para que QA no se indexe |
| `npm run preview` | Sirve el build localmente |
| `npx astro check` | Chequeo de tipos |

No hay tests ni linter configurados. Para comprobar que todo compila, usa `npm run build`.

## Estructura

```
src/
├── layouts/Layout.astro        <head>, metadatos y estilos globales
├── components/sections/        un componente por sección de la landing
├── pages/
│   ├── index.astro             la landing: monta las secciones en orden
│   └── estilos.astro           página de prueba del sistema de diseño
└── styles/global.css           tokens de Tailwind, utilidades y escala responsive
```

Orden de las secciones: Header · Hero · Nosotros · Clientes · Soluciones · Servicios · Diferenciales · Testimonios · CTA · Footer.

## Sistema de diseño

- Los tokens (colores, tipografía, escala de texto, radios y animaciones) están en `src/styles/global.css`. En `/estilos` se ven aplicados.
- Las pantallas del diseño se hicieron sobre un artboard de **1440 × 932 px**. Las medidas en `vw` de los exportados se convierten a la unidad `--u`, que escala con el ancho y el alto de la ventana y tiene un tope de 1440px. Las fórmulas de conversión están en el comentario al inicio de `global.css`.
- La guía para pasar cada pantalla del diseño a código y las reglas de marca están en [`CLAUDE.md`](./CLAUDE.md).

## Flujo de trabajo y despliegue

```
rama de trabajo (desde master) ──PR──► qa ──► QA (Cloudflare Workers)
            └──────────── PR de la misma rama ──► master ──► Producción (Railway)
```

1. Crea la rama desde `master`, no desde `qa`: `git switch master && git pull && git switch -c feat/mi-cambio`.
2. Abre un PR a `qa`. Otra persona lo aprueba y se mergea con **Create a merge commit**. No borres la rama.
3. Prueba el cambio en QA.
4. Abre un PR de la **misma rama** a `master`. Tiene que pasar el check **"Origen del PR"**, que exige que la rama ya esté en `qa`. Otra persona lo aprueba y un admin lo mergea.

Las reglas están en GitHub (copia en `.github/rulesets/`). El check está en `.github/workflows/flujo-ramas.yml`. Ninguna de las dos ramas acepta push directo.

- **QA**: Cloudflare Workers Builds despliega cada merge a `qa` con `npm run build:qa`. El Worker se configura en `wrangler.jsonc`.
- **Producción**: Railway despliega cada merge a `master` con `npm run build` y sirve `dist/`.
