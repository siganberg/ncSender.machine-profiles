#!/usr/bin/env bash
# Tags the next version; the Release workflow publishes profiles.json for it.
# Usage: .scripts/release.sh ["what changed"]
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
  echo "Commit or stash your changes first." >&2
  exit 1
fi
node scripts/validate.mjs

git fetch --tags --quiet
latest=$(git tag -l 'v*' --sort=-v:refname | head -n1)
if [ -z "$latest" ]; then
  next="v1.0.0"
else
  IFS=. read -r major minor patch <<<"${latest#v}"
  next="v${major}.${minor}.$((patch + 1))"
fi

notes="${1:-}"
if [ -z "$notes" ]; then
  range="${latest:+$latest..}HEAD"
  notes=$(git log --format='- %s' "$range")
fi

git push --quiet origin HEAD
git tag -a "$next" -m "$notes"
git push --quiet origin "$next"
echo "Tagged $next; the Release workflow publishes profiles.json."
