# Flujo de PRs con QA y producción

Flujo de la landing de Prime Code (`PrimeCode-corp/prime-code-landing`, tomado
del de Alcanfest): rama de trabajo → PR a `qa` (despliega QA en Cloudflare) →
PR de la misma rama a `master` (despliega producción en Railway), con aprobación
obligatoria en ambos pasos.

La landing es un sitio Astro **estático**: `npm run build` genera `dist/` y no
hay servidor propio. QA usa `npm run build:qa`, que además crea `dist/_headers`
con `X-Robots-Tag: noindex` para que Google no indexe la copia de QA.

## Resumen

| Pieza | Dónde | Qué hace |
|---|---|---|
| Ruleset `qa` | GitHub → Settings → Rules | PR obligatorio con 1 aprobación, solo merge commit, sin force push ni borrado |
| Ruleset `master` | GitHub → Settings → Rules | Lo mismo, más el check "Origen del PR" |
| Ruleset `master-produccion` | GitHub → Settings → Rules | Solo los admins pueden mergear a `master` |
| Workflow `flujo-ramas.yml` | `.github/workflows/` | Bloquea el PR a `master` si la rama no pasó antes por `qa` |
| `wrangler.jsonc` + `build:qa` | Raíz del repo | Configuración del Worker de QA (`prime-code-landing-qa`) |
| Workers Builds | Cloudflare → Worker → Settings → Builds | Despliega QA en cada merge a `qa` |
| Deploy de Railway | Railway → servicio → Settings | Despliega producción en cada merge a `master` |

## Requisitos

- **Repo público, o plan Team o superior.** En repos privados de cuentas Free,
  los rulesets se guardan pero no se aplican.
- **Al menos dos personas con permiso de escritura.** Nadie puede aprobar su
  propio PR y no hay bypass para la aprobación. Con una sola persona, todo merge
  queda bloqueado.
- **Al menos un admin del repo que no sea siempre el autor.** El merge a
  `master` lo hace un admin (ver `master-produccion`).
- **Las ramas `qa` y `master` ya creadas** en el remoto antes de importar los
  rulesets.

## Flujo de trabajo

1. Crear la rama de trabajo desde `master`, no desde `qa`. Así no se lleva a
   producción lo que otros tengan pendiente en QA.
2. Abrir el PR de la rama a `qa`. Otra persona lo aprueba, se mergea con
   **Create a merge commit** y se prueba en QA.
3. Abrir el PR de la **misma rama** a `master`. Otra persona lo aprueba y un
   admin lo mergea marcando la casilla de bypass (ver más abajo).
4. No borrar la rama al mergear a `qa`: se necesita para el paso 3.

Reglas para el equipo:

- No mergear `qa` dentro de la rama de trabajo: llevaría a `master` cambios
  ajenos, y el check no lo detecta.
- Si el PR a `qa` tiene conflictos, resolverlos en una rama auxiliar creada desde
  la de trabajo y abrir el PR a `qa` desde ella. El PR a `master` sigue saliendo
  de la rama original.
- Si la rama recibe commits nuevos después de mergear a `qa`, esos commits deben
  pasar otra vez por `qa` antes de `master`.
- Los hotfixes siguen el mismo camino. No hay atajo directo a `master`.

## 1. Rulesets de GitHub

Se importan en **Settings → Rules → Rulesets → New ruleset → Import a ruleset**,
uno por archivo. Guardar los JSON en `.github/rulesets/` como copia: GitHub no
los lee de ahí, así que si se cambian hay que volver a aplicarlos en la web.

### `qa.json`

```json
{
  "name": "qa",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/qa"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["merge"]
      }
    }
  ]
}
```

### `master.json`

```json
{
  "name": "master",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/master"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["merge"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "Origen del PR", "integration_id": 15368 }
        ]
      }
    }
  ]
}
```

### `master-produccion.json`

```json
{
  "name": "master-produccion",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [
    {
      "actor_type": "RepositoryRole",
      "actor_id": 5,
      "bypass_mode": "pull_request"
    }
  ],
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/master"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "update",
      "parameters": {
        "update_allows_fetch_and_merge": false
      }
    }
  ]
}
```

### Qué hace cada opción

| Opción | Efecto |
|---|---|
| `deletion` | Nadie puede borrar la rama |
| `non_fast_forward` | Bloquea `git push --force` |
| `required_approving_review_count: 1` | Hace falta 1 aprobación de alguien con permiso de escritura |
| `dismiss_stale_reviews_on_push` | Un commit nuevo anula las aprobaciones anteriores |
| `require_last_push_approval: false` | No exige que apruebe alguien distinto a quien hizo el último push (con `true`, sí). Igual nadie puede aprobar su propio PR |
| `allowed_merge_methods: ["merge"]` | Solo "Create a merge commit". Squash y rebase crean commits nuevos, y el check no los encontraría en `qa` |
| `required_status_checks` | El PR no se mergea hasta que el check "Origen del PR" pase |
| `integration_id: 15368` | El check debe venir de GitHub Actions (ese es su ID fijo), no de cualquier app |
| `update` | Solo los actores de la bypass list pueden actualizar la rama, es decir, mergear |
| `RepositoryRole` con `actor_id: 5` | El rol de admin del repo. Otros valores: 4 = maintain, 2 = write |
| `bypass_mode: "pull_request"` | El bypass solo vale al mergear un PR, no para push directo |

### Por qué `master` lleva dos rulesets

El bypass de un ruleset salta **todas** sus reglas. Si la restricción de merge
(`update`, con bypass para admins) estuviera en el mismo ruleset que la
aprobación, los admins podrían mergear sin aprobación. Separados, el bypass de
`master-produccion` no afecta a `master`, que no tiene bypass: la aprobación y
el check siguen siendo obligatorios para todos.

No fusionarlos en un solo archivo, ni renombrar `master-produccion.json` como
`master.json` (lo reemplazaría y se perderían la aprobación y el check).

### Limitaciones de la bypass list

- No acepta usuarios sueltos: solo roles del repo (`RepositoryRole`), teams
  (`Team`, con el ID del team), admins de la organización (`OrganizationAdmin`)
  o apps (`Integration`). Para dar permiso a personas concretas, crear un team.
  El ID se obtiene con `gh api orgs/<org>/teams/<slug> --jq .id`, o se elige el
  team por nombre en la web después de importar.
- `bypass_mode: "pull_request"` no obliga a cumplir las reglas del propio
  ruleset: quien tiene bypass puede mergear un PR saltándolas. Por eso la
  aprobación va en otro ruleset.

### Cómo se ve al mergear a `master`

- **Quien no es admin** ve "Merging is blocked — Cannot update this protected
  ref" y no puede mergear, aunque el PR esté aprobado.
- **Un admin** ve además la casilla roja "Merge without waiting for requirements
  to be met (bypass rules)". Para mergear tiene que marcarla. Solo salta
  `master-produccion`: si falta la aprobación o el check, el merge sigue
  bloqueado.
- Cada merge queda registrado como bypass en **Settings → Rules → Insights**.

Si la casilla roja confunde al equipo y no hace falta limitar quién despliega a
producción, borrar `master-produccion`: el autor podrá mergear su PR una vez
aprobado, que es lo habitual.

## 2. Check "Origen del PR"

Guardar en `.github/workflows/flujo-ramas.yml`. Si el repo usa otros nombres de
rama, cambiar `master` y `qa` en el archivo.

```yaml
# Asegura el flujo X → qa → X → master: un PR a master solo pasa si el último
# commit de su rama ya está en qa. El ruleset de master exige este check por el
# nombre del job ("Origen del PR"): si se renombra, hay que cambiarlo también ahí.
name: Flujo de ramas

on:
  pull_request:
    branches: [master]
    types: [opened, synchronize, reopened]

permissions:
  contents: read

jobs:
  origen:
    name: Origen del PR
    runs-on: ubuntu-latest
    steps:
      - name: Verificar que la rama ya pasó por qa
        env:
          GH_TOKEN: ${{ github.token }}
          REPO: ${{ github.repository }}
          HEAD_REF: ${{ github.head_ref }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
        run: |
          if [ "$HEAD_REF" = "qa" ]; then
            echo "::error::qa no se mergea a master: abre el PR desde la rama de trabajo."
            exit 1
          fi

          # "behind" o "identical": el commit ya es parte de la historia de qa.
          status=$(gh api "repos/$REPO/compare/qa...$HEAD_SHA" --jq .status)
          case "$status" in
            behind|identical)
              echo "$HEAD_REF ya está en qa."
              ;;
            *)
              echo "::error::$HEAD_REF no está en qa (o tiene commits nuevos): primero mergea su PR a qa y luego vuelve a ejecutar este check."
              exit 1
              ;;
          esac
```

Cómo funciona: compara `qa` con el último commit de la rama. Si ese commit ya
está en la historia de `qa` (`behind` o `identical`), pasa. Si la rama tiene
commits que no están en `qa` (`ahead` o `diverged`), falla. También rechaza los
PR que salen de la propia `qa`.

A tener en cuenta:

- El nombre del job (`Origen del PR`) debe coincidir con el `context` de
  `master.json`. Si se cambia uno, cambiar el otro.
- El check corre al abrir el PR y con cada push a la rama, no al mergear a `qa`.
  Si el PR a `master` se abrió antes de mergear a `qa`, fallará: después del
  merge a `qa`, volver a ejecutarlo desde la pestaña Checks del PR
  (**Re-run jobs**).
- Al importar `master.json` antes de que el workflow haya corrido alguna vez,
  GitHub puede avisar de que el check no existe. Es normal: aparece en el primer
  PR a `master`.
- No detecta si la rama se creó desde `qa` o si se mergeó `qa` dentro de ella.
  Eso depende de quien revisa.

## 3. Deploy automático de QA (Cloudflare Workers Builds)

Requisitos en el repo:

- `wrangler.jsonc` (ya está en la raíz) con `"name": "prime-code-landing-qa"`.
  El Worker en Cloudflare debe llamarse **igual**; si no coinciden, el build falla.
  Publica solo archivos estáticos: `assets.directory` = `./dist`.
- `npm run build:qa` genera `dist/` y `dist/_headers` (noindex).
- `wrangler` está en `devDependencies`, así que `npx wrangler deploy` usa esa
  versión. Para probar sin publicar: `npm run build:qa && npx wrangler deploy --dry-run`.

Conexión: en Cloudflare, **Workers & Pages → Create → Import a repository** (o, si
el Worker ya existe, abrirlo → **Settings → Builds → Connect**). Nombre del
Worker: `prime-code-landing-qa`.
La primera vez pide instalar la app de Cloudflare en la cuenta u organización de
GitHub (un owner de la organización debe aprobarlo). Darle acceso solo al repo
que se va a desplegar.

| Campo | Valor |
|---|---|
| Git account | La organización o cuenta dueña del repo |
| Repository | El repo |
| Production branch | `qa` |
| Disable builds | Apagado |
| Build command | `npm run build:qa` |
| Deploy command | `npx wrangler deploy` |
| Preview command | Sin tocar |
| Enable Preview builds | **Desmarcado**. Si queda marcado, cada push a cualquier rama crea una versión preview |
| Path | `/` |
| API token | `Create new token` (Cloudflare lo crea con los permisos justos) |
| API token name | Sin tocar |
| Variable name / value | Vacíos. Si el build falla por la versión de Node, agregar `NODE_VERSION` = `22` |
| Build caching | Opcional. Activado acelera los builds |

A tener en cuenta:

- Los merges hechos antes de conectar no se despliegan solos: el primer build
  automático llega con el siguiente push o merge a `qa`.
- `npx wrangler deploy` desde una computadora sigue funcionando y publica lo que
  haya en local, de cualquier rama, reemplazando lo que desplegó el build. Una
  vez conectado, dejar de usarlo.
- Cloudflare rechaza assets de más de 25 MiB por archivo.

## 4. Deploy de producción (Railway)

1. En Railway: **New Project → Deploy from GitHub repo** y elegir
   `PrimeCode-corp/prime-code-landing` (la app de Railway debe tener acceso al
   repo; un owner de la organización puede tener que aprobarlo).
2. En el servicio: **Settings → Source → Branch** = `master`. Así solo un merge a
   `master` dispara el deploy. Con el ruleset `master-produccion`, solo los
   admins del repo pueden hacerlo.
3. Build: Railway usa Railpack, que detecta un sitio Astro estático, ejecuta
   `npm run build` (no `build:qa`, así producción **sí** se indexa) y sirve
   `dist/` con Caddy. No hace falta start command: el repo no tiene script
   `start` a propósito. En los logs del primer deploy, confirmar que sirve
   `dist/` como sitio estático.
   - Si en cambio intenta ejecutar `npm start` y falla, agregar en `package.json`
     `"start": "astro preview --host 0.0.0.0 --port $PORT"` y volver a desplegar.
4. Node: Railpack toma la versión de `engines.node` de `package.json` (>= 22).
5. **Settings → Networking → Generate Domain** para la URL de Railway, o
   **Custom Domain** para el dominio final (y crear el CNAME que indica Railway).
6. `wrangler.jsonc` y `scripts/qa-noindex.mjs` no afectan a Railway.

## Checklist para un proyecto nuevo

1. Commit de `.github/`, `wrangler.jsonc`, `scripts/` y `package.json` en `master`
   y push (todavía sin rulesets, así que el push directo funciona).
2. Crear `qa` desde `master` y subirla: `git push origin master:qa`. Así el
   workflow existe en ambas ramas.
3. Importar los tres rulesets en **Settings → Rules → Rulesets**.
4. Confirmar que hay al menos dos personas con permiso de escritura y un admin.
5. Crear el Worker `prime-code-landing-qa` y conectar Workers Builds con `qa` como
   production branch y `npm run build:qa` como build command.
6. Conectar Railway con `master`.
7. Probar con un cambio pequeño:
   - Un `git push origin HEAD:qa` directo debe ser rechazado.
   - Un PR a `master` desde una rama que no está en `qa` debe fallar en "Origen del PR".
   - El PR a `qa` no se mergea sin aprobación. Tras mergear, Cloudflare despliega
     y la respuesta de QA trae `X-Robots-Tag: noindex` (`curl -I <url-qa>`).
   - El PR a `master` aprobado solo lo puede mergear un admin, marcando la casilla de bypass.
     Tras mergear, Railway despliega y producción **no** trae `X-Robots-Tag`.
