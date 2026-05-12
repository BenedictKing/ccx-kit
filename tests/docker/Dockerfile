# Clean-room environment for ccx-kit end-to-end smoke test
# Base: Debian-based Node 22 (close to typical user Linux environment)
#
# NOTE: If docker.io is unreachable, override NODE_IMAGE at build time, e.g.
#   docker build --build-arg NODE_IMAGE=docker.m.daocloud.io/library/node:22-bookworm .

ARG NODE_IMAGE=node:22-bookworm
FROM ${NODE_IMAGE}

# Keep this image intentionally minimal and offline-friendly:
# node:22-bookworm already includes Node/npm/npx. The smoke script provides
# shims for npm/sudo so we do not need apt-get, Debian mirrors, or sudo.

RUN useradd -m -s /bin/bash tester \
  && mkdir -p /home/tester/.local/bin \
  && chown -R tester:tester /home/tester

USER tester
WORKDIR /home/tester

# Make ~/.local/bin available on PATH (the smoke script installs shims here).
ENV PATH="/home/tester/.local/bin:${PATH}"

# Workdir for the mounted repo and packed tarball.
WORKDIR /home/tester/work

# Default: drop into shell. docker-compose overrides with the test script.
CMD ["/bin/bash"]
