ARG OPENCLAW_VERSION=main

FROM docker:cli AS docker-cli

FROM ghcr.io/openclaw/openclaw:${OPENCLAW_VERSION}

# Copy Docker CLI binary for Docker-out-of-Docker (DooD).
# The official image does not include Docker CLI by default.
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker

EXPOSE 18789

CMD ["openclaw", "gateway", "--port", "18789", "--allow-unconfigured"]
