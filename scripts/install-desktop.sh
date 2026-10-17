#!/usr/bin/env bash
# Builds a release binary and installs the app for this user, with a launcher
# entry and icons. Needs no sudo. The app's data folder is backed up first and
# never written to.
#
# Usage: npm run desktop:install
set -euo pipefail

app_id="allies"   # the Cargo package name: the binary's name and the window's app id

root="$(cd "$(dirname "$0")/.." && pwd)"
conf="$root/src-tauri/tauri.conf.json"
name="$(node -p "require(process.argv[1]).productName" "$conf")"
identifier="$(node -p "require(process.argv[1]).identifier" "$conf")"
# The SQL plugin resolves a SQLite path against the config folder, not the data
# folder, so that is where allies.db and pictures/ live and where the backup
# reads from.
conf_dir="${XDG_CONFIG_HOME:-$HOME/.config}"
data="${XDG_DATA_HOME:-$HOME/.local/share}"
bin_dir="$HOME/.local/bin"

if pgrep -x -- "${app_id:0:15}" >/dev/null; then
  echo "Close $name first, then run this again." >&2
  exit 1
fi

npm --prefix "$root" run tauri build -- --no-bundle

# Back up the data, keeping the five newest backups.
if [ -d "$conf_dir/$identifier" ]; then
  backup="$conf_dir/$identifier.backup-$(date +%Y-%m-%d-%H%M%S)"
  cp -a "$conf_dir/$identifier" "$backup"
  echo "Backed up $conf_dir/$identifier to $backup"
  find "$conf_dir" -maxdepth 1 -name "$identifier.backup-*" -print0 \
    | sort -rz | tail -zn +6 | xargs -0r rm -rf --
fi

# Copy, then rename, so a running copy of the binary is never written over.
mkdir -p "$bin_dir"
cp "$root/src-tauri/target/release/$app_id" "$bin_dir/.$app_id.new"
chmod 755 "$bin_dir/.$app_id.new"
mv -f "$bin_dir/.$app_id.new" "$bin_dir/$app_id"

for size in 32x32 64x64 128x128; do
  mkdir -p "$data/icons/hicolor/$size/apps"
  cp "$root/src-tauri/icons/$size.png" "$data/icons/hicolor/$size/apps/$app_id.png"
done
mkdir -p "$data/icons/hicolor/256x256/apps"
cp "$root/src-tauri/icons/128x128@2x.png" "$data/icons/hicolor/256x256/apps/$app_id.png"

mkdir -p "$data/applications"
entry="$data/applications/$app_id.desktop"
cat > "$entry" <<EOF
[Desktop Entry]
Type=Application
Name=$name
Exec=$bin_dir/$app_id
Icon=$app_id
StartupWMClass=$app_id
Terminal=false
Categories=Utility;
EOF

if command -v desktop-file-validate >/dev/null; then
  desktop-file-validate "$entry"
fi
update-desktop-database "$data/applications" 2>/dev/null || true
gtk-update-icon-cache --ignore-theme-index "$data/icons/hicolor" 2>/dev/null || true

echo "Installed $name. Open it from the launcher. Run npm run desktop:install again after a change."
echo "To restore a backup, close the app and move the backup folder back to $conf_dir/$identifier."