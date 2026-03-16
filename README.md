# dtrw app services

A self-hosted infrastructure management dashboard for applications running on the `dtrw.ovh` server. It provides a unified web interface to manage projects, Docker containers, reverse-proxy routing, and user accounts across the entire hosting environment.

## Purpose

`dtrw-app-services` is the central control panel for the `dtrw.ovh` self-hosted infrastructure. It replaces manual config-file editing and Docker CLI operations with a single web UI backed by a REST API. Specifically it:

- **Tracks projects** — each project maps a GitHub repository to its live URLs, Jira board, and CI/CD status.
- **Manages Docker containers** — lists running containers, assigns them to projects, and classifies them by role (frontend, backend, database, docker-proxy, standalone).
- **Configures reverse-proxy routing** — reads and writes the [Caddy](https://caddyserver.com/) `Caddyfile` so new routes are live without restarting the proxy.
- **Manages authentication** — maintains the [Authelia](https://www.authelia.com/) user database so access-control changes take effect immediately.
- **Monitors CI/CD** — polls the GitHub Actions API (and accepts webhooks) to surface workflow run status alongside each project.

## Monorepo architecture

This repository is a **Yarn workspaces monorepo** containing two packages that are deployed together:

```
dtrw-app-services/
├── packages/
│   ├── backend/     # Fastify REST API (Node.js)
│   └── frontend/    # React SPA (served by Nginx)
├── docker/
│   ├── backend/env              # Backend runtime env-var file (not committed)
│   └── frontend/nginx.conf      # Nginx SPA config
├── docker-compose.yml           # Full-stack production deployment
├── package.json                 # Workspace root + shared scripts
└── vitest.config.ts             # Root test configuration (projects: backend + frontend)
```

### Runtime architecture

```
                  ┌─────────────────────────────────────────────────┐
                  │                   Browser                        │
                  └────────────────────┬────────────────────────────┘
                                       │ HTTPS (dtrw.ovh)
                  ┌────────────────────▼────────────────────────────┐
                  │          Caddy reverse proxy (:443)              │
                  └──────────┬──────────────────────┬───────────────┘
                             │ /                    │ /api/*
              ┌──────────────▼──────────┐  ┌───────▼────────────────┐
              │  Nginx (frontend :80)   │  │  Fastify API (:4000)   │
              │  React SPA              │  │  (backend)             │
              └─────────────────────────┘  └───────┬────────────────┘
                                                   │
               ┌───────────────────────────────────┼────────────────────────┐
               │               │                   │                        │
  ┌────────────▼──────┐ ┌──────▼──────┐ ┌─────────▼──────────┐ ┌──────────▼──────────┐
  │  SQLite (Drizzle) │ │ GitHub API  │ │ Docker Socket Proxy │ │   Caddy Admin API   │
  │  /db/db.db        │ │ (Octokit)   │ │ (Tecnativa :2375)   │ │   (:2019)           │
  └───────────────────┘ └─────────────┘ └─────────────────────┘ └─────────────────────┘
                                                   │
                                         ┌─────────▼──────────┐
                                         │  Authelia config   │
                                         │  files on disk     │
                                         └────────────────────┘
```

### Docker Compose services

| Service | Image | Purpose |
|---|---|---|
| `services_frontend` | `nginx:alpine` | Serves the built React SPA; handles HTML5 history routing |
| `services_backend` | `node:24-alpine` | Runs the Fastify API server |
| `services_dproxy` | `tecnativa/docker-socket-proxy` | Exposes a filtered Docker socket to the backend (avoids mounting the raw socket) |

## Packages

| Package | Path | Description |
|---|---|---|
| **backend** | `packages/backend` | Fastify REST API — projects, containers, routing, GitHub, Caddy, Authelia |
| **frontend** | `packages/frontend` | React SPA dashboard — tabs for Projects, Containers, Users, and Routing |

See each package's own `README.md` for detailed documentation:
- [`packages/backend/README.md`](packages/backend/README.md)
- [`packages/frontend/README.md`](packages/frontend/README.md)

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.9 |
| Runtime | Node.js | 24.7+ |
| Backend framework | Fastify | 5.7.3 |
| Backend build | Rollup | 4.59 |
| Frontend framework | React | 19.2 |
| Frontend build | Vite | 7.2 |
| Database | SQLite + Drizzle ORM | 0.45.1 |
| Validation | Zod | 4.3.6 |
| State management | Redux Toolkit | 2.11 |
| UI library | Radix UI Themes | 3.2.1 |
| Testing | Vitest | 4.0.18 |
| Package manager | Yarn Workspaces | v3+ |
| Containerisation | Docker + Docker Compose | — |
| Reverse proxy | Caddy | — |
| Authentication | Authelia | — |

## Getting started

### Prerequisites

- Node.js ≥ 24.7
- Yarn ≥ 3
- Docker & Docker Compose (for production)

### Install dependencies

```bash
yarn install
```

### Development

Run both packages in watch mode with a single command:

```bash
yarn dev
```

- **Backend** rebuilds on file changes and listens on `http://localhost:4000`
- **Frontend** starts the Vite dev server on `http://localhost:3000` and proxies `/api/*` to the backend

### Available scripts

| Script | Description |
|---|---|
| `yarn dev` | Start backend + frontend in development/watch mode |
| `yarn build` | Build both packages for production |
| `yarn lint` | Run ESLint on both packages |
| `yarn test` | Run the full test suite (Vitest, all packages) |
| `yarn test:backend` | Run backend tests only |
| `yarn test:frontend` | Run frontend tests only |
| `yarn generate` | Generate a new Drizzle database migration |
| `yarn migrate` | Apply pending database migrations |
| `yarn check-db` | Validate the database schema against migrations |
| `yarn release` | Bump version, update `CHANGELOG.md`, and tag the release |

## Deployment

Production deployments are handled by GitHub Actions (`.github/workflows/deploy.yaml`). The workflow:

1. Builds Docker images for `frontend` (Nginx) and `backend` (Node.js).
2. Copies the images and `docker-compose.yml` to the VPS over SSH.
3. Runs `docker compose up -d` on the VPS.

To deploy manually:

```bash
yarn build
docker compose up -d
```

Required environment variables for the backend are documented in [`packages/backend/README.md`](packages/backend/README.md#environment-variables).
