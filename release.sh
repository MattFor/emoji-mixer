#!/usr/bin/env bash

set -euo pipefail

VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
    echo "Usage: ./release.sh <version>"
    exit 1
fi

echo "Preparing release $VERSION"

#
# package.json
#
python3 - <<PY
import json

with open("package.json", "r", encoding="utf-8") as f:
    data = json.load(f)

data["version"] = "$VERSION"

with open("package.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4)
    f.write("\n")
PY

#
# package-lock.json
#
if [[ -f package-lock.json ]]; then
python3 - <<PY
import json

with open("package-lock.json", "r", encoding="utf-8") as f:
    data = json.load(f)

data["version"] = "$VERSION"

if "packages" in data and "" in data["packages"]:
    data["packages"][""]["version"] = "$VERSION"

with open("package-lock.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4)
    f.write("\n")
PY
fi

#
# Replace version headers
#
for file in README.md index.js index.d.ts data.js
do
    [[ -f "$file" ]] || continue

    sed -Ei \
        "s/(Emoji Mix URL Generator( Version)? )[0-9]+\.[0-9]+(\.[0-9]+)?/\1$VERSION/g" \
        "$file"
done

echo
echo "Generating compatibility data..."
echo

python3 converter.py

echo
echo "Cleaning dist..."
echo

rm -rf dist

echo
echo "Building package..."
echo

npm run build

echo
echo "Packing package..."
echo

npm pack --dry-run

echo
echo "Running tests..."
echo

if ! node --test tests/*js; then
    echo
    echo "Tests failed. Aborting release."
    exit 1
fi

echo
echo "All tests passed."
echo

echo "Files that will be published:"
npm pack --dry-run

echo
echo "Release $VERSION is ready."