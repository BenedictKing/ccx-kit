# Clean-room environment for ccx-kit end-to-end smoke test
FROM docker.1ms.run/library/ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    bash \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash tester \
  && echo 'tester ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers \
  && mkdir -p /home/tester/.local/bin /home/tester/.local/share /home/tester/.cache /home/tester/.claude \
  && chown -R tester:tester /home/tester

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER tester
ENV PATH="/home/tester/.local/bin:${PATH}"
WORKDIR /home/tester/work

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/bash"]
