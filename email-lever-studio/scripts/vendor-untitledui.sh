#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_ROOT="${REPO_ROOT}/.tmp"
STAMP="$(date +%Y%m%d-%H%M%S)"
WORKDIR="${TMP_ROOT}/untitled-ui-${STAMP}"

SRC_APP_DIR="${WORKDIR}/app"
DEST_DIR="${REPO_ROOT}/email-lever-studio/client/src/untitled-ui"

mkdir -p "${WORKDIR}"

(
  cd "${WORKDIR}"
  npx untitledui@latest init app --vite --yes
)

mkdir -p "${DEST_DIR}"
rsync -a --delete "${SRC_APP_DIR}/src/" "${DEST_DIR}/"

echo "Vendored Untitled UI into:"
echo "  ${DEST_DIR}"
echo
echo "Next step: ensure dependencies match the vendored code."

