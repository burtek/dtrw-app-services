# backend

The Fastify REST API that powers the `dtrw-app-services` dashboard. It manages projects, Docker containers, Caddy routing, Authelia users, and GitHub CI/CD status for applications hosted on the `dtrw.ovh` infrastructure.

## Purpose

The backend is the single source of truth for the entire hosting environment. It:

- Persists projects and container assignments in a local **SQLite** database.
- Reads and writes the **Caddy** `Caddyfile` (via the Caddy Admin API) so routing changes take effect without a restart.
- Reads and writes the **Authelia** user database so access-control changes are immediate.
- Communicates with the **Docker Socket Proxy** to list and act on containers without exposing the raw Docker socket.
- Polls the **GitHub Actions API** and accepts webhooks to track workflow run status in real time.
- Sends **email notifications** via SMTP when relevant events occur.

## Architecture

```
                    ┌──────────────────────┐
                    │   Fastify HTTP API   │
                    │      (:4000)         │
                    └──────┬───────────────┘
                           │
          ┌────────────────┼─────────────────────┐
          │                │                     │
 ┌────────▼───────┐ ┌──────▼──────┐ ┌────────────▼──────────┐
 │ Drizzle ORM    │ │ GitHub API  │ │  External services     │
 │ SQLite         │ │ (Octokit)   │ │  ┌─────────────────┐  │
 │ /db/db.db      │ │ + webhooks  │ │  │ Docker Proxy    │  │
 └────────────────┘ └─────────────┘ │  │ Caddy Admin API │  │
                                    │  │ Authelia files  │  │
                                    │  │ SMTP            │  │
                                    │  └─────────────────┘  │
                                    └───────────────────────┘
```

## Services

| Service | Directory | Description |
|---|---|---|
| **Projects** | `src/projects/` | CRUD for projects (slug, name, GitHub URL, Jira, URLs) |
| **Containers** | `src/containers/` | CRUD for Docker containers; links them to projects by role |
| **GitHub** | `src/github/` | Polls GitHub Actions API; validates HMAC-SHA256 webhooks |
| **Caddy** | `src/caddy/` | Reads/writes Caddyfile; hot-reloads via Caddy Admin API |
| **Docker** | `src/docker/` | Proxies Docker API calls through the Docker Socket Proxy |
| **Users** | `src/users/` | Manages the Authelia YAML user database |
| **Health** | `src/health/` | Liveness/readiness endpoints; version reporting |
| **Database** | `src/database/` | Drizzle ORM plugin; SQLite initialisation and migrations |

## Database schema

### `projects`

| Column | Type | Notes |
|---|---|---|
| `id` | `INTEGER` | Primary key |
| `slug` | `TEXT` | Unique, URL-safe identifier |
| `name` | `TEXT` | Human-readable name |
| `github` | `TEXT` | GitHub repository URL |
| `main_url` | `TEXT` | Primary live URL |
| `jira` | `TEXT` | Jira project URL (optional) |
| `more_urls` | `TEXT` | JSON array of additional URLs |
| `planned` | `INTEGER` | `1` if the project is planned (not yet live) |

### `containers`

| Column | Type | Notes |
|---|---|---|
| `id` | `INTEGER` | Primary key |
| `project_id` | `INTEGER` | FK → `projects.id` (nullable for `standalone`) |
| `name` | `TEXT` | Unique Docker container name |
| `type` | `TEXT` | One of `frontend`, `backend`, `database`, `docker-proxy`, `standalone` |

Business rules enforced at the database level:
- `standalone` containers must not have a `project_id`.
- All other types must have a `project_id`.
- Each project may have at most one container of each type.

## Environment variables

All variables are validated at startup with Zod. The backend refuses to start if any required variable is missing or invalid.

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `development`, `production`, or `test` |
| `PORT` | — | HTTP port (default: `4000`) |
| `DB_FILE_NAME` | ✅ | Path to the SQLite database file (or `:memory:` for tests) |
| `DB_MIGRATIONS_FOLDER` | ✅ | Path to the Drizzle migrations directory |
| `AUTHELIA_CONFIG` | ✅ | Path to `configuration.yml` |
| `AUTHELIA_USERS` | ✅ | Path to `users.yml` |
| `AUTHELIA_USERS_SCHEMA_URL` | ✅ | JSON schema URL for the Authelia users file |
| `CADDY_CADDYFILE_PATH` | ✅ | Path to the `Caddyfile` |
| `CADDY_FETCH_INTERVAL` | ✅ | How often (ms) to poll the Caddyfile |
| `CADDY_WILDCARD_DOMAIN` | ✅ | Wildcard domain (e.g. `dtrw.ovh`) |
| `CADDYFILE_ADMIN` | ✅ | Admin email embedded in the Caddyfile |
| `CF_TOKEN` | — | Cloudflare API token (for DNS-01 ACME challenges) |
| `DOCKER_PROXY` | — | Docker Socket Proxy URL (e.g. `tcp://services_dproxy:2375`) |
| `DOCKER_AUTHELIA_CONTAINER_NAME` | — | Authelia container name (required when `DOCKER_PROXY` is set) |
| `DOCKER_CADDY_ADMIN_HOST` | — | Caddy Admin API URL (required when `DOCKER_PROXY` is set) |
| `DOCKER_CADDY_CONTAINER_NAME` | — | Caddy container name (required when `DOCKER_PROXY` is set) |
| `GITHUB_ACTIONS_PAT` | ✅ | GitHub Personal Access Token (`github_pat_…`) |
| `GITHUB_POLLING_INTERVAL` | — | How often (ms) to poll GitHub Actions (default: `300000`) |
| `GITHUB_WEBHOOK_SECRET` | ✅ | Secret for validating GitHub webhook payloads |
| `EMAIL_SMTP_USER` | ✅ | SMTP username (email address) |
| `EMAIL_SMTP_PASS` | ✅ | SMTP password |
| `EMAIL_FROM` | ✅ | Sender address, e.g. `My App <noreply@example.com>` |
| `LOGS_FILE` | — | Optional path for writing log output to a file |

## Development

```bash
# Install dependencies (from repo root)
yarn install

# Start in watch mode (rebuilds on file changes)
yarn workspace backend start:dev

# Run tests
yarn workspace backend test

# Run linter
yarn workspace backend lint
```

## Build

```bash
yarn workspace backend build
```

Rollup compiles the TypeScript source to a CommonJS bundle at `dist/index.js` with source maps.

## Database migrations

```bash
# Generate a new migration after changing the schema
yarn generate

# Apply pending migrations
yarn migrate

# Validate schema consistency
yarn check-db
```
