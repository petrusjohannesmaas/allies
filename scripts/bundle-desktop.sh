#!/usr/bin/env bash
# Builds a release binary and stages it as a bundle in ~/bundles/APP_ID/ for desktop-pull on
# the laptop to install. Installs nothing on this machine and needs no sudo.
#
# Usage: npm run desktop:bundle
set -euo pipefail

app_id="allies"   # the Cargo package name: the binary's name and the window's app id

root="$(cd "$(dirname "$0")/.." && pwd)"
conf="$root/src-tauri/tauri.conf.json"
name="$(node -p "require(process.argv[1]).productName" "$conf")"
identifier="$(node -p "require(process.argv[1]).identifier" "$conf")"
commit="$(git -C "$root" rev-parse HEAD)"
bundles="$HOME/bundles"

npm --prefix "$root" run tauri build -- --no-bundle

# Stage in a dot folder (ls skips it), then swap it in, so a pull never copies half a bundle.
stage="$bundles/.$app_id.new"
rm -rf "$stage"
mkdir -p "$stage"
cp "$root/src-tauri/target/release/$app_id" "$stage/$app_id"
chmod 755 "$stage/$app_id"

for size in 32x32 64x64 128x128; do
  mkdir -p "$stage/icons/hicolor/$size/apps"
  cp "$root/src-tauri/icons/$size.png" "$stage/icons/hicolor/$size/apps/$app_id.png"
done
mkdir -p "$stage/icons/hicolor/256x256/apps"
cp "$root/src-tauri/icons/128x128@2x.png" "$stage/icons/hicolor/256x256/apps/$app_id.png"

# desktop-pull rewrites Exec to the binary's full path on the laptop.
cat > "$stage/$app_id.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=$name
Exec=$app_id
Icon=$app_id
StartupWMClass=$app_id
Terminal=false
Categories=Utility;
EOF

cat > "$stage/bundle.env" <<EOF
app_id=$app_id
identifier=$identifier
commit=$commit
EOF

rm -rf "${bundles:?}/$app_id"
mv "$stage" "$bundles/$app_id"

echo "Bundled $name at $bundles/$app_id. Run desktop-pull $app_id on the laptop to install it."
