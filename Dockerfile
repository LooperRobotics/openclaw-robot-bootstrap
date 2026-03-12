FROM docker:cli AS docker-cli

FROM node:22-bookworm

# Copy Docker CLI binary for Docker-out-of-Docker (DooD)
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker

ARG OPENCLAW_VERSION=latest

ENV NODE_ENV=production \
    OPENCLAW_HOME=/root \
    OPENCLAW_STATE_DIR=/root/.openclaw

# Install the OpenClaw CLI/runtime and ClawHub CLI globally.
# --ignore-scripts skips node-llama-cpp source build (not needed for gateway use).
RUN npm install -g "openclaw@${OPENCLAW_VERSION}" --ignore-scripts clawhub \
    && npm cache clean --force

WORKDIR /root

EXPOSE 18789

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:18789/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Official docs note Docker CMD uses --allow-unconfigured.
CMD ["openclaw", "gateway", "--port", "18789", "--allow-unconfigured"]
