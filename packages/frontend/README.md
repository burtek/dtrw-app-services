# frontend

The React SPA that provides the web dashboard for `dtrw-app-services`. It lets operators manage projects, Docker containers, reverse-proxy routing, and user accounts from a single browser tab.

## Purpose

The frontend is the primary user interface for the `dtrw.ovh` infrastructure. It:

- Displays all **projects** tracked in the system together with their GitHub CI/CD status, live URLs, and Jira links.
- Shows all **Docker containers** and lets operators assign them to projects by role (frontend, backend, database, docker-proxy, standalone).
- Provides a **routing** editor for creating and updating Caddy reverse-proxy rules, with a diff view to preview changes before applying them.
- Manages **user accounts** in the Authelia authentication database.

## Architecture

```
┌────────────────────────────────────────────────────┐
│                  React SPA                         │
│                                                    │
│  ┌───────────────────────────────────────────────┐ │
│  │               App (Tabs)                      │ │
│  │  ┌─────────────┬────────────┬───────────────┐ │ │
│  │  │  Projects,  │  Routing   │  (future tabs)│ │ │
│  │  │  Containers,│            │               │ │ │
│  │  │  Users      │            │               │ │ │
│  │  └──────┬──────┴──────┬─────┘               │ │ │
│  │         │             │                     │ │ │
│  │  ┌──────▼──────┐ ┌────▼──────────────────┐  │ │ │
│  │  │ Redux Store │ │  React Hook Form       │  │ │ │
│  │  │ (RTK)       │ │  Radix UI Themes       │  │ │ │
│  │  └─────────────┘ └───────────────────────┘  │ │ │
│  └───────────────────────────────────────────────┘ │
│                        │                           │
│              ┌─────────▼──────────┐                │
│              │  fetch /api/*      │                │
│              │  (proxied to :4000)│                │
│              └────────────────────┘                │
└────────────────────────────────────────────────────┘
```

State is managed with **Redux Toolkit**. All server communication goes through the `fetch /api/*` path, which the Vite dev server proxies to the backend during development and Nginx routes in production.

## Views

### Projects, Containers & Users tab

The default tab shows three side-by-side columns backed by a shared search bar:

| Column | Description |
|---|---|
| **Projects** | List of projects with name, GitHub workflow status badge, main URL, Jira link, and additional URLs. Supports create, edit, and delete. |
| **Containers** | List of Docker containers. Each can be assigned to a project and given a role via drag-and-drop. Supports create, edit, and delete. |
| **Users** | List of Authelia user accounts. Supports create, edit, and delete. |

### Routing tab

A full-height editor for managing Caddy routing rules:

- Browse and edit routing entries (host, path, upstream).
- Preview the generated `Caddyfile` diff before applying changes.
- Apply changes to the live Caddy instance via the backend API.

## Key components

| Component | Path | Description |
|---|---|---|
| `App` | `src/App.tsx` | Root component; Radix UI `Tabs` shell |
| `Projects` | `src/projects/` | Project list + create/edit/delete forms |
| `Containers` | `src/containers/` | Container list + assignment form + drag-and-drop |
| `Users` | `src/users/` | User list + create/edit/delete forms |
| `Routing` | `src/routing/` | Routing rule editor + Caddyfile diff viewer |
| `SearchWrapper` | `src/search/` | Context-based cross-column search |
| `redux/` | `src/redux/` | Redux store and slices |
| `components/` | `src/components/` | Shared form fields, dialogs, badges, error boundaries |

## Tech stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 7.2 | Dev server and production bundler |
| TypeScript | 5.9 | Type safety |
| Radix UI Themes | 3.2.1 | Component library and design system |
| Redux Toolkit | 2.11 | Application state management |
| React Hook Form | 7.71 | Form state and validation |
| react-dnd | 16.0 | Drag-and-drop container assignment |
| react-diff-viewer-continued | 4.2 | Caddyfile diff preview |
| react-toastify | 11.0 | Toast notifications |
| Vitest + Testing Library | 4.0 | Unit and component tests |

## Development

```bash
# Install dependencies (from repo root)
yarn install

# Start the Vite dev server (proxies /api/* to http://localhost:4000)
yarn workspace frontend start:dev

# Run tests
yarn workspace frontend test

# Run linter
yarn workspace frontend lint
```

## Build

```bash
yarn workspace frontend build
```

TypeScript is compiled with `tsc -b` first, then Vite bundles the output into `dist/`. The `dist/` directory is served by the `nginx:alpine` Docker image in production.
