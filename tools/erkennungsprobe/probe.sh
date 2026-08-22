#!/bin/sh
# Was der Raptor in seiner Zelle sieht — hier, ohne Zelle.
#
# Wörtlich aus workbench/src/detect.rs und analyze.rs übernommen. Der
# einzige Unterschied: kein Auspacken eines Tarballs, es wird der Baum
# genommen, in dem dieses Skript liegt.
set -eu
cd "$(dirname "$0")/../.."

report() { printf '%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "${4:-}"; }

erkennung() {
  melde() { printf 'APP\t%s\t%s\t%s\n' "$1" "$2" "$3"; }
  pruefe() {
    d="$1"
    if [ -f "$d/package.json" ]; then
      # Reihenfolge zaehlt: ein Next.js-Projekt HAT auch eine package.json.
      if grep -q '"next"' "$d/package.json" 2>/dev/null; then
        melde "$d" nextjs "package.json contains next"
      elif grep -q '"react-scripts"' "$d/package.json" 2>/dev/null; then
        melde "$d" react "package.json contains react-scripts"
      else
        melde "$d" javascript "package.json"
      fi
      return 0
    fi
    [ -f "$d/go.mod" ]           && { melde "$d" go "go.mod"; return 0; }
    [ -f "$d/Cargo.toml" ]       && { melde "$d" rust "Cargo.toml"; return 0; }
    [ -f "$d/pyproject.toml" ]   && { melde "$d" python "pyproject.toml"; return 0; }
    [ -f "$d/requirements.txt" ] && { melde "$d" python "requirements.txt"; return 0; }
    [ -f "$d/CMakeLists.txt" ]   && { melde "$d" cpp "CMakeLists.txt"; return 0; }
    return 1
  }
  pruefe . || true
  for base in apps packages services examples tools libs backend frontend; do
    [ -d "$base" ] || continue
    for d in "$base"/*; do
      [ -d "$d" ] || continue
      pruefe "$d" || true
    done
  done
  echo "END"
}

dateien() {
  find "$1" -type f \
    \( -name '*.js' -o -name '*.ts' -o -name '*.jsx' -o -name '*.tsx' \
       -o -name '*.mjs' -o -name '*.py' -o -name '*.go' -o -name '*.env*' \) \
    2>/dev/null | grep -v node_modules | head -n 400
}

analyse() {
  erkennung | while IFS='	' read -r marke root _ _; do
    [ "$marke" = "APP" ] || continue
    [ -d "$root" ] || continue
    for f in $(dateien "$root"); do
      grep -oh 'process\.env\.[A-Za-z_][A-Za-z0-9_]*' "$f" 2>/dev/null \
        | sed 's/process\.env\.//' | sort -u | while read -r n; do
          [ -n "$n" ] && report ENV "$root" "$n" "$f"; done
      grep -oh "os\.environ\[['\"][A-Za-z_][A-Za-z0-9_]*" "$f" 2>/dev/null \
        | sed "s/.*\[['\"]//" | sort -u | while read -r n; do
          [ -n "$n" ] && report ENV "$root" "$n" "$f"; done
    done
    if [ -f "$root/package.json" ]; then
      grep -oh '\-p [0-9]\{2,5\}' "$root/package.json" 2>/dev/null \
        | sed 's/-p //' | sort -u | while read -r p; do
          report PORT "$root" "$p" "$root/package.json"; done
    fi
    for f in $(dateien "$root"); do
      grep -oh 'listen(\s*[0-9]\{2,5\}' "$f" 2>/dev/null \
        | sed 's/listen(\s*//' | sort -u | while read -r p; do
          report PORT "$root" "$p" "$f"; done
    done
    [ -f "$root/package.json" ] && {
      grep -q '"pg"' "$root/package.json" 2>/dev/null && report DB "$root" postgres "$root/package.json"
      grep -q '"mongoose"' "$root/package.json" 2>/dev/null && report DB "$root" mongodb "$root/package.json"
      grep -q '"redis"' "$root/package.json" 2>/dev/null && report DB "$root" redis "$root/package.json"
    }
  done
  echo "END"
}

case "${1:-erkennung}" in
  erkennung) erkennung ;;
  analyse)   analyse ;;
  *) echo "Aufruf: $0 [erkennung|analyse]" >&2; exit 2 ;;
esac
