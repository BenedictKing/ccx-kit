#!/bin/bash
set -e

# Fix volume-mounted/cache directories that Docker may create as root
sudo mkdir -p /home/tester/.local/share /home/tester/.cache /home/tester/.claude
sudo chown -R tester:tester /home/tester/.local /home/tester/.cache /home/tester/.claude 2>/dev/null || true

# Install mitmproxy CA cert if mounted
if [ -f /mitm-certs/mitmproxy-ca-cert.pem ]; then
    sudo cp /mitm-certs/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca.crt
    sudo update-ca-certificates 2>/dev/null || true
    echo "mitmproxy CA cert installed"
fi

exec "$@"
