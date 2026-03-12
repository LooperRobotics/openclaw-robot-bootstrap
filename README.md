# OpenClaw Docker Image

Runs OpenClaw Gateway behind a Tailscale sidecar. Tailscale Funnel exposes the gateway over HTTPS on port 8443, accessible from anywhere in your tailnet (or publicly via Funnel).

## Quick start

```bash
cp .env.example .env
# Edit .env: set TS_AUTHKEY and OPENCLAW_GATEWAY_PASSWORD at minimum
docker compose up -d --build
```

### Key environment variables

| Variable | Required | Description |
|---|---|---|
| `TS_AUTHKEY` | Yes (first start) | Tailscale auth key from [admin/settings/keys](https://login.tailscale.com/admin/settings/keys) |
| `OPENCLAW_GATEWAY_PASSWORD` | Yes | Password for gateway access |
| `TS_HOSTNAME` | No | Tailnet node hostname (default: `openclaw-gateway`) |
| `OPENCLAW_VERSION` | No | Pin to a release tag, e.g. `2026.2.26` (default: `latest`) |
| `OPENCLAW_STATE_PATH` | No | Host path for persistent state (default: `./openclaw-state`) |
| `OPENCLAW_LOG_LEVEL` | No | `trace`/`debug`/`info`/`warn`/`error` (default: `info`) |

## Accessing the Control UI

- **Local:** `http://127.0.0.1:18789/`
- **Via Tailscale:** `https://<TS_HOSTNAME>.<tailnet>.ts.net:8443/`

## First-time onboarding

```bash
docker compose exec openclaw-gateway openclaw onboard
```

Useful checks:

```bash
docker compose exec openclaw-gateway openclaw doctor
docker compose exec openclaw-gateway openclaw status
```

## Upgrading

```bash
docker compose pull
docker compose build --pull --no-cache
docker compose up -d
```

To pin a version, set in `.env`:

```
OPENCLAW_VERSION=2026.2.26
```

Then rebuild:

```bash
docker compose build --pull
docker compose up -d
```

## Data persistence

`${OPENCLAW_STATE_PATH}` (default `./openclaw-state`) is mounted to `/root/.openclaw` in the container. Config, credentials, sessions, and workspace data survive restarts here.
