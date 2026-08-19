#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKFLOW="$ROOT/.github/workflows/desktop-release.yml"

assert_contains() {
  local expected="$1"
  if ! grep -Fq -- "$expected" "$WORKFLOW"; then
    echo "Eksik release davranisi: $expected" >&2
    exit 1
  fi
}

assert_contains '  publish:'
assert_contains '    needs: build'
assert_contains 'uses: actions/download-artifact@v4'
assert_contains 'merge-multiple: true'
assert_contains 'gh release create "$TAG"'
assert_contains 'gh release edit "$TAG" --draft=false'
assert_contains 'gh release upload "$TAG" "$file" --clobber'

echo 'Desktop release workflow testi gecti.'
