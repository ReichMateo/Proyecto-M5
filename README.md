# GitHub MCP Agent

Un MCP Server en Node.js + TypeScript que expone herramientas (tools) para automatizar operaciones comunes de GitHub, pensado para ser usado por un agente de IA (Gemini, Claude u otro LLM) dentro de **Antigravity** mediante comandos en lenguaje natural.

Construido con el SDK oficial de Model Context Protocol, Octokit (cliente oficial de GitHub) y Zod para validación de inputs.

---

## Tabla de contenidos

- [Qué hace este proyecto](#qué-hace-este-proyecto)
- [Casos de uso](#casos-de-uso)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
  - [Obtener un GitHub Personal Access Token](#1-obtener-un-github-personal-access-token)
  - [Configurar `.env`](#2-configurar-env)
  - [Configurar el server en Antigravity](#3-configurar-el-server-en-antigravity)
- [Tools disponibles](#tools-disponibles)
- [Ejemplos de uso](#ejemplos-de-uso)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Licencia](#licencia)

---

## Qué hace este proyecto

Este server permite que un agente de IA, dentro de Antigravity, ejecute operaciones reales sobre GitHub a partir de pedidos en lenguaje natural — sin que la persona tenga que ir manualmente a la interfaz web de GitHub ni recordar comandos de `gh` CLI. El agente decide sola qué operación ejecutar y con qué parámetros, en base a las descripciones que este server expone para cada tool.

## Casos de uso

- "Creá un repositorio llamado `landing-page` y descripción 'sitio de aterrizaje para la campaña de marketing'."
- "¿Qué repositorios tengo en mi cuenta?"
- "Abrí un issue en `landing-page` reportando que el botón de contacto no funciona."
- "Agregá un archivo `CHANGELOG.md` al repo `api-backend` con el resumen de esta semana."
- "¿Qué issues abiertos hay en `api-backend`?"

## Arquitectura

El flujo de una solicitud atraviesa 4 componentes, cada uno con un rol distinto:

```
┌──────────────┐      gestiona la sesión       ┌──────────────┐
│  Antigravity  │ ─────────────────────────────▶│  LLM (Client) │
│    (Host)     │                                │ Gemini/Claude │
└──────────────┘                                └───────┬──────┘
                                                          │ decide qué tool
                                                          │ invocar y con
                                                          │ qué parámetros
                                                          ▼
                                                 ┌──────────────────┐
                                                 │   MCP Server      │
                                                 │  (este proyecto)  │
                                                 │                    │
                                                 │  valida inputs     │
                                                 │  con Zod, ejecuta  │
                                                 │  la operación      │
                                                 └────────┬───────────┘
                                                          │ llamadas
                                                          │ autenticadas
                                                          ▼
                                                 ┌──────────────────┐
                                                 │   GitHub API       │
                                                 │   (vía Octokit)    │
                                                 └──────────────────┘
```

**Quién decide qué:** el usuario nunca elige directamente qué tool se ejecuta — es el LLM quien lee las descripciones de cada tool (definidas en este server) y decide cuál invocar según el pedido en lenguaje natural. Por eso las descripciones de los tools están escritas pensando en que el LLM las lee, no en que un humano las lea como documentación.

**Comunicación por stdio:** el Host (Antigravity) levanta este server como un subproceso y se comunica con él por entrada/salida estándar (`stdin`/`stdout`), no por HTTP. Por esta razón, el código nunca usa `console.log` en el flujo principal — cualquier texto fuera del protocolo JSON-RPC en `stdout` corrompería la comunicación. Todo el logging interno va por `stderr` (ver `src/utils/logging.ts`).

## Requisitos

- **Node.js 18 o superior**
- Una cuenta de GitHub con permisos para generar un Personal Access Token
- [Antigravity](https://antigravity.google/) instalado, como Host de MCP
- (Opcional, recomendado para debugging) [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

## Instalación

```bash
# 1. Cloná el repositorio
git clone https://github.com/ReichMateo/proyecto-m5.git
cd proyecto-m5

# 2. Instalá las dependencias
npm install

# 3. Compilá el proyecto
npm run build
```

Esto genera la carpeta `dist/` con el código compilado, que es lo que Antigravity va a ejecutar.

## Configuración

### 1. Obtener un GitHub Personal Access Token

1. En GitHub, andá a tu foto de perfil (arriba a la derecha) → **Settings**.
2. En el menú izquierdo, bajá hasta **Developer settings**.
3. **Personal access tokens** → **Tokens (classic)**.
4. **Generate new token** → **Generate new token (classic)**.
5. Ponele un nombre descriptivo, por ejemplo `github-mcp-agent`.
6. Marcá los siguientes scopes:
   - `repo` — necesario para crear repositorios, issues y commits.
   - `user` — necesario para leer datos del usuario autenticado.
   - `admin:org` — necesario solo si vas a operar sobre repositorios de una organización, no de tu cuenta personal.
7. Generá el token y **copialo de inmediato** — GitHub solo lo muestra una vez.

> ⚠️ **Nunca subas tu token a un repositorio.** Si lo hacés por error, revocalo inmediatamente desde la misma sección de Developer settings, aunque lo borres en un commit posterior — el historial de git lo conserva igual.

### 2. Configurar `.env`

Copiá el archivo de ejemplo y completalo con tu token real:

```bash
cp .env.example .env
```

`.env` debe quedar así (con tu token real, sin comillas):

```
GITHUB_TOKEN=ghp_tuTokenAca
```

Este archivo está en `.gitignore` y nunca debe subirse al repositorio.

### 3. Configurar el server en Antigravity

Antigravity centraliza la configuración de servers MCP en un archivo `mcp_config.json`.

**Cómo llegar a ese archivo desde la interfaz:**

1. En el panel del Agente, hacé click en el botón **"..."** (arriba del panel lateral).
2. Seleccioná **"MCP Servers"**.
3. Click en **"Manage MCP Servers"**.
4. Click en **"View raw config"** — esto abre el archivo `mcp_config.json` para editar directamente.

En Windows, ese archivo también se puede encontrar directamente en:
```
C:\Users\<TU_USUARIO>\.gemini\antigravity\mcp_config.json
```
En macOS/Linux:
```
~/.gemini/antigravity/mcp_config.json
```

**Agregá tu server** dentro del objeto `mcpServers` (sin borrar otros servers que ya tengas configurados):

```json
{
  "mcpServers": {
    "github-agent": {
      "command": "node",
      "args": [
        "RUTA_ABSOLUTA_A_TU_PROYECTO/dist/utils/server.js"
      ],
      "env": {
        "GITHUB_TOKEN": "ghp_tuTokenAca"
      }
    }
  }
}
```

> En Windows, las barras de la ruta deben escribirse dobles (`\\`), porque en JSON la barra simple es un carácter de escape. Por ejemplo: `"C:\\Users\\usuario\\proyecto-m5\\dist\\utils\\server.js"`.

Guardá el archivo y reiniciá Antigravity (o refrescá el panel de MCP Servers si tiene esa opción) para que tome la nueva configuración.

**Verificación:** volvé al panel de MCP Servers — deberías ver `github-agent` listado como conectado, con 5 tools disponibles.

## Tools disponibles

### `create_repository`

Crea un nuevo repositorio en la cuenta autenticada.

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | string | Sí | 3-100 caracteres, solo letras, números y guiones |
| `description` | string | No | Descripción breve del repositorio |
| `isPrivate` | boolean | No (default `false`) | Si el repositorio debe ser privado |

**Ejemplo de prompt efectivo:**
> "Creá un repositorio privado llamado `api-interna` con la descripción 'servicios internos del equipo de backend'."

### `create_issue`

Crea un nuevo issue en un repositorio existente.

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `owner` | string | Sí | Usuario u organización dueño del repositorio |
| `repo` | string | Sí | Nombre del repositorio |
| `title` | string | Sí | Título del issue |
| `body` | string | No | Descripción detallada del issue |

**Ejemplo de prompt efectivo:**
> "Abrí un issue en mi repo `api-interna` que diga 'El endpoint de login devuelve 500 en producción'."

### `list_repositories`

Lista los repositorios del usuario autenticado.

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `limit` | number | No (default `30`) | Cantidad máxima de repositorios a devolver (1-100) |

**Ejemplo de prompt efectivo:**
> "¿Qué repositorios tengo en mi cuenta de GitHub?"

### `create_commit`

Crea o actualiza un archivo en un repositorio mediante un commit. Si el archivo ya existe en la ruta indicada, se actualiza; si no, se crea.

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `owner` | string | Sí | Usuario u organización dueño del repositorio |
| `repo` | string | Sí | Nombre del repositorio |
| `path` | string | Sí | Ruta del archivo dentro del repositorio |
| `content` | string | Sí | Contenido completo del archivo |
| `message` | string | Sí | Mensaje del commit |
| `branch` | string | No | Rama destino. Por defecto, la rama principal |

**Ejemplo de prompt efectivo:**
> "Actualizá el README de `api-interna` agregando una sección de 'Cómo contribuir' al final."

### `list_issues`

Lista los issues de un repositorio, filtrando por estado.

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `owner` | string | Sí | Usuario u organización dueño del repositorio |
| `repo` | string | Sí | Nombre del repositorio |
| `state` | `"open"` \| `"closed"` \| `"all"` | No (default `"open"`) | Estado de los issues a listar |

**Ejemplo de prompt efectivo:**
> "¿Qué issues abiertos hay en `api-interna`?"

## Ejemplos de uso

Con el server conectado en Antigravity, algunos flujos completos que ejercitan varios tools a la vez:

1. **Arrancar un proyecto nuevo:**
   > "Creá un repositorio llamado `blog-personal`, después subí un README inicial que diga solo el título del proyecto."
   → invoca `create_repository`, luego `create_commit`.

2. **Reportar y trackear trabajo:**
   > "Abrí un issue en `blog-personal` para agregar soporte de comentarios, y después mostrame todos los issues abiertos de ese repo."
   → invoca `create_issue`, luego `list_issues`.

3. **Revisar el estado general:**
   > "¿Qué repositorios tengo, y cuántos issues abiertos hay en cada uno de los últimos tres?"
   → invoca `list_repositories`, luego `list_issues` varias veces.

## Testing

El proyecto incluye 15 tests unitarios con Vitest, organizados en 3 archivos:

- `tests/tools.test.ts` — validación de los schemas de Zod (inputs válidos e inválidos, valores por defecto).
- `tests/github.test.ts` — lógica de `operations.ts` con Octokit mockeado (`vi.mock`), sin llamadas reales a la API.
- `tests/errors.test.ts` — transformación de errores técnicos a mensajes en lenguaje natural.

Correr todos los tests:

```bash
npm run test
```

Los tests son deterministas y no requieren token de GitHub ni conexión a internet, porque las dependencias externas están mockeadas.

## Troubleshooting

**"GITHUB_TOKEN no está configurado"**
El server no encuentra la variable de entorno. Si estás corriendo con `npx tsx`, confirmá que existe un `.env` en la raíz con `GITHUB_TOKEN=...`. Si estás corriendo desde Antigravity, confirmá que el bloque `env` en `mcp_config.json` tiene el token cargado.

**El LLM no elige el tool correcto, o pide parámetros equivocados**
Casi siempre es un problema de la `description` del tool, no de la lógica interna. Revisá que las descripciones distingan claramente cada tool de los demás (por ejemplo, que quede claro que `create_issue` necesita un repositorio *existente*, a diferencia de `create_repository`).

**Error 404 al crear un commit en un archivo que debería existir**
Es el comportamiento esperado del flujo interno: antes de crear/actualizar, el server consulta si el archivo ya existe. Un 404 en ese paso intermedio no es un error real, solo indica "el archivo no existe todavía" — el commit se sigue creando igual, como archivo nuevo.

**Error 422 "name already exists on this account"**
GitHub no permite dos repositorios con el mismo nombre en la misma cuenta. Elegí otro nombre.

**Rate limit alcanzado**
El server reintenta automáticamente con backoff exponencial (esperas crecientes) hasta 3 veces antes de devolver un error. Si seguís viendo el problema, esperá unos minutos — GitHub resetea el límite por hora.

**Antigravity no muestra el server como conectado**
Confirmá: (1) que corriste `npm run build` y existe `dist/utils/server.js`; (2) que la ruta en `mcp_config.json` es absoluta y correcta para tu sistema operativo; (3) que reiniciaste Antigravity después de editar la configuración.

## Estructura del proyecto

```
/src
  /tools          → definición de cada tool (schema + operación + manejo de errores)
  /schemas        → schemas de Zod para validar inputs
  /github         → cliente de Octokit (client.ts) y operaciones (operations.ts)
  /errors         → clases de error custom y transformación a lenguaje natural
  /utils
    server.ts     → entry point del MCP server
    types.ts      → tipos TypeScript compartidos
    retry.ts      → exponential backoff para rate limiting
    logging.ts    → logging estructurado por stderr
/tests            → tests unitarios con Vitest
.env.example      → variables de entorno necesarias, sin valores reales
```

## Licencia

MIT
