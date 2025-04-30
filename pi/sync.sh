#!/usr/bin/env sh

TEMPFILE="/tmp/$(uuidgen)"
trap 'rm -f "$TEMPFILE"' EXIT
deno compile -A --no-check --target aarch64-unknown-linux-gnu --output "$TEMPFILE" main.ts
ssh wolf@wolf-pi "rm -f /home/wolf/fixitwand"
scp "$TEMPFILE" wolf@wolf-pi:/home/wolf/fixitwand
ssh wolf@wolf-pi "cd /home/wolf && ./fixitwand $@"
