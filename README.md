# OpenClaw Robot Control Stack

OpenClaw Gateway with ROS Humble integration for robot control. Runs OpenClaw Gateway behind a Tailscale sidecar with ROS Humble core as a message broker sidecar. Enables remote robot control via OpenClaw agents with native ROS topic/service communication.

**Stack Components:**
- **OpenClaw Gateway:** Agent runtime and API server
- **Tailscale Sidecar:** Secure network access (HTTPS on port 8443)
- **ROS Humble Sidecar:** ROS topic/service bridge for robot communication

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
| `OPENCLAW_VERSION` | No | Image tag (default: `main`). Available: `main`, `main-slim`, `main-amd64`, `main-slim-amd64`, etc. |
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

To upgrade to a newer image, update `OPENCLAW_VERSION` in `.env`:

```
OPENCLAW_VERSION=main-slim-amd64
```

Then rebuild:

```bash
docker compose build --pull
docker compose up -d
```

## Data persistence

`${OPENCLAW_STATE_PATH}` (default `./openclaw-state`) is mounted to `/home/node/.openclaw` in the container. Config, credentials, sessions, and workspace data survive restarts here.

## ROS Integration

The `ros-humble` sidecar runs ROS Humble core and bridges OpenClaw agent commands to robot middleware.

- **ROS Distribution:** Humble (Ubuntu 22.04 compatible)
- **Network:** Shared network via Tailscale (localhost communication)
- **Usage:** Agents can publish/subscribe to ROS topics or call services

Example agent interaction:

```javascript
// Inside OpenClaw agent
const ros_bridge = exec('ros2 topic pub /robot_cmd std_msgs/String "data: move_forward"');
```

Configure `ROS_DOMAIN_ID` and robot parameters in `.env`.
