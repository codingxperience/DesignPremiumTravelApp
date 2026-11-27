#!/bin/sh
set -eu
cd "${CI_PRIMARY_REPOSITORY_PATH:?Xcode Cloud checkout is missing}"

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" != "24" ]; then
  brew install node@24
  PATH="$(brew --prefix node@24)/bin:$PATH"
  export PATH
fi
node scripts/check-beta-backend.mjs
tools_dir=$(mktemp -d)
trap 'rm -rf -- "$tools_dir"' EXIT
npm install --prefix "$tools_dir" --no-audit --no-fund "$(node -p 'require("./package.json").packageManager')"
PATH="$tools_dir/node_modules/.bin:$PATH"
export PATH
pnpm install --frozen-lockfile
pnpm typecheck
pnpm mobile:sync ios
