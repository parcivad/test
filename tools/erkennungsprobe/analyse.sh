#!/bin/sh
# WOERTLICH aus Substrate/Raptor/crates/workbench/src/analyze.rs.
# Erwartet die gewaehlten Wurzeln auf stdin, eine je Zeile.
# Stand: 1dc9f9b (22.08.2026).
set -e

report() { echo "$1	$2	$3	$4"; }

# Only source code, and node_modules stays out: it holds the environment
# variables of FOREIGN packages, not those of the app.
#
# `.rs`, `.cpp`, `.cc`, `.h` and `.hpp` came late, and their absence was
# not a small gap: a Rust or C++ server was DETECTED as an app and then
# analysed to zero — no variable, no port, no database, while all three
# stood in the file next door. Measured on a monorepo with nine apps on
# 22.08.: `apps/api-rust` and `apps/api-cpp` were the only two with an
# empty proposal, and it looked like they had no configuration.
files() {
  find "$1" -type f \
    \( -name '*.js' -o -name '*.ts' -o -name '*.jsx' -o -name '*.tsx' \
       -o -name '*.mjs' -o -name '*.py' -o -name '*.go' \
       -o -name '*.rs' -o -name '*.cpp' -o -name '*.cc' \
       -o -name '*.h' -o -name '*.hpp' \
       -o -name '*.env*' \) \
    2>/dev/null | grep -v node_modules | head -n 400
}

# Only the environment files. They are read differently from source: a
# line `NAME=value` is a name, no call needed.
env_files() {
  find "$1" -maxdepth 2 -type f -name '*.env*' 2>/dev/null \
    | grep -v node_modules | head -n 20
}

# `|| [ -n "$root" ]`: without this, `read` swallows the last line if it
# carries no trailing newline — and with ONE selected app that is the
# only line.
while read -r root || [ -n "$root" ]; do
  [ -n "$root" ] || continue
  [ -d "$root" ] || continue

  # ── Environment variables ──────────────────────────────────────
  #
  # One pattern per language, because every language asks differently.
  # What is NOT here is not found — and an app whose configuration is
  # not found looks like an app without configuration.
  for f in $(files "$root"); do
    # JS/TS: process.env.NAME
    grep -oh 'process\.env\.[A-Za-z_][A-Za-z0-9_]*' "$f" 2>/dev/null \
      | sed 's/process\.env\.//' | sort -u | while read -r n; do
        [ -n "$n" ] && report ENV "$root" "$n" "$f"
      done
    # Python: os.environ["NAME"] — the subscript form only. `.get()` is
    # covered below; both are common and neither is wrong.
    grep -oh "os\.environ\[['\"][A-Za-z_][A-Za-z0-9_]*" "$f" 2>/dev/null \
      | sed "s/.*\[['\"]//" | sort -u | while read -r n; do
        [ -n "$n" ] && report ENV "$root" "$n" "$f"
      done
    # Python: os.environ.get("NAME") and os.getenv("NAME")
    grep -oh "os\.environ\.get(\s*['\"][A-Za-z_][A-Za-z0-9_]*" "$f" 2>/dev/null \
      | sed "s/.*['\"]//" | sort -u | while read -r n; do
        [ -n "$n" ] && report ENV "$root" "$n" "$f"
      done
    grep -oh "os\.getenv(\s*['\"][A-Za-z_][A-Za-z0-9_]*" "$f" 2>/dev/null \
      | sed "s/.*['\"]//" | sort -u | while read -r n; do
        [ -n "$n" ] && report ENV "$root" "$n" "$f"
      done
    # Rust: env::var("NAME") and env::var_os("NAME"), with or without
    # the `std::` in front.
    grep -oh 'env::var\(_os\)\?(\s*"[A-Za-z_][A-Za-z0-9_]*' "$f" 2>/dev/null \
      | sed 's/.*"//' | sort -u | while read -r n; do
        [ -n "$n" ] && report ENV "$root" "$n" "$f"
      done
    # C/C++: getenv("NAME") — also catches std::getenv.
    grep -oh 'getenv(\s*"[A-Za-z_][A-Za-z0-9_]*' "$f" 2>/dev/null \
      | sed 's/.*"//' | sort -u | while read -r n; do
        [ -n "$n" ] && report ENV "$root" "$n" "$f"
      done
    # Go: os.Getenv("NAME")
    grep -oh 'os\.Getenv(\s*"[A-Za-z_][A-Za-z0-9_]*' "$f" 2>/dev/null \
      | sed 's/.*"//' | sort -u | while read -r n; do
        [ -n "$n" ] && report ENV "$root" "$n" "$f"
      done
  done

  # ── Environment variables, from the .env files ─────────────────
  #
  # `.env*` was in the file list from the beginning, and no pattern
  # ever read it: the ones above look for CALLS, and `NAME=value` is
  # not a call. So the file was searched and yielded nothing —
  # measured on 22.08., a `.env.example` with four lines gave zero
  # findings.
  #
  # Only upper case with underscores: a `.env` also carries comments
  # and the occasional `export`, and a lower-case word before an `=`
  # is more often prose than a variable.
  for f in $(env_files "$root"); do
    grep -oh '^[ 	]*\(export[ 	][ 	]*\)\?[A-Z_][A-Z0-9_]*[ 	]*=' "$f" 2>/dev/null \
      | sed 's/export[ 	]*//; s/[ 	]*=.*//; s/^[ 	]*//' | sort -u | while read -r n; do
        [ -n "$n" ] && report ENV "$root" "$n" "$f"
      done
  done

  # ── Ports ──────────────────────────────────────────────────────
  #
  # `listen(NNNN` alone was too narrow: it is the Node form and almost
  # nothing else. Python binds through a tuple, Rust and C through
  # their own calls, and a `.env` simply writes the number down.
  # Measured on 22.08.: a Python service with `("0.0.0.0", 8084)` and a
  # Rust service with `bind(("0.0.0.0", port))` both reported no port
  # at all.
  if [ -f "$root/package.json" ]; then
    grep -oh '\-p [0-9]\{2,5\}' "$root/package.json" 2>/dev/null \
      | sed 's/-p //' | while read -r p; do
        report PORT "$root" "$p" "$root/package.json"
      done
  fi
  for f in $(files "$root"); do
    # Node: listen(3000  /  .listen(3000
    grep -oh 'listen(\s*[0-9]\{2,5\}' "$f" 2>/dev/null \
      | sed 's/listen(\s*//' | sort -u | while read -r p; do
        report PORT "$root" "$p" "$f"
      done
    # Python/Rust: a tuple ("host", 8084) — the number after the comma.
    grep -oh '("[^"]*",\s*[0-9]\{2,5\}' "$f" 2>/dev/null \
      | sed 's/.*,\s*//' | sort -u | while read -r p; do
        report PORT "$root" "$p" "$f"
      done
    # C: htons(8083)
    grep -oh 'htons(\s*[0-9]\{2,5\}' "$f" 2>/dev/null \
      | sed 's/htons(\s*//' | sort -u | while read -r p; do
        report PORT "$root" "$p" "$f"
      done
  done
  # From the .env files: any name carrying PORT, with a number behind
  # it. Deliberately narrow — a bare number in a `.env` is more often a
  # timeout than a port.
  for f in $(env_files "$root"); do
    grep -oh '^[ 	]*\(export[ 	][ 	]*\)\?[A-Z_]*PORT[A-Z_]*[ 	]*=[ 	]*[0-9]\{2,5\}' "$f" 2>/dev/null \
      | sed 's/.*=[ 	]*//' | sort -u | while read -r p; do
        report PORT "$root" "$p" "$f"
      done
  done

  # ── Databases ──────────────────────────────────────────────────
  [ -f "$root/prisma/schema.prisma" ] && {
    grep -q postgres "$root/prisma/schema.prisma" 2>/dev/null \
      && report DB "$root" postgres "$root/prisma/schema.prisma"
    grep -q mysql "$root/prisma/schema.prisma" 2>/dev/null \
      && report DB "$root" mysql "$root/prisma/schema.prisma"
  }
  [ -f "$root/package.json" ] && {
    grep -q '"pg"' "$root/package.json" 2>/dev/null \
      && report DB "$root" postgres "$root/package.json"
    grep -q '"mongoose"' "$root/package.json" 2>/dev/null \
      && report DB "$root" mongodb "$root/package.json"
    grep -q '"redis"' "$root/package.json" 2>/dev/null \
      && report DB "$root" redis "$root/package.json"
  }
  # Rust: the dependency names the driver, and the FEATURE names the
  # kind. `sqlx` alone says nothing — it speaks four.
  [ -f "$root/Cargo.toml" ] && {
    grep -qE '(^|[^a-z])(tokio-postgres|postgres)[^a-z]|features.*"postgres"' \
      "$root/Cargo.toml" 2>/dev/null \
      && report DB "$root" postgres "$root/Cargo.toml"
    grep -qE '(^|[^a-z])mysql[^a-z]|features.*"mysql"' "$root/Cargo.toml" 2>/dev/null \
      && report DB "$root" mysql "$root/Cargo.toml"
    grep -qE '(^|[^a-z])(mongodb|redis)[^a-z]' "$root/Cargo.toml" 2>/dev/null && {
      grep -qE '(^|[^a-z])mongodb[^a-z]' "$root/Cargo.toml" \
        && report DB "$root" mongodb "$root/Cargo.toml"
      grep -qE '(^|[^a-z])redis[^a-z]' "$root/Cargo.toml" \
        && report DB "$root" redis "$root/Cargo.toml"
    }
  }
  # Python: the distribution name. psycopg/psycopg2 are both Postgres.
  [ -f "$root/pyproject.toml" ] && {
    grep -q 'psycopg' "$root/pyproject.toml" 2>/dev/null \
      && report DB "$root" postgres "$root/pyproject.toml"
    grep -qE 'pymysql|mysqlclient' "$root/pyproject.toml" 2>/dev/null \
      && report DB "$root" mysql "$root/pyproject.toml"
    grep -q 'pymongo' "$root/pyproject.toml" 2>/dev/null \
      && report DB "$root" mongodb "$root/pyproject.toml"
    grep -qE '^\s*"?redis' "$root/pyproject.toml" 2>/dev/null \
      && report DB "$root" redis "$root/pyproject.toml"
  }
  [ -f "$root/requirements.txt" ] && {
    grep -q 'psycopg' "$root/requirements.txt" 2>/dev/null \
      && report DB "$root" postgres "$root/requirements.txt"
  }
  # C/C++: what CMake links against. libpq IS Postgres — there is no
  # other library of that name.
  [ -f "$root/CMakeLists.txt" ] && {
    grep -qiE 'postgresql|libpq|\bpq\b' "$root/CMakeLists.txt" 2>/dev/null \
      && report DB "$root" postgres "$root/CMakeLists.txt"
    grep -qiE 'mysqlclient|libmysql|mariadb' "$root/CMakeLists.txt" 2>/dev/null \
      && report DB "$root" mysql "$root/CMakeLists.txt"
    grep -qiE 'hiredis' "$root/CMakeLists.txt" 2>/dev/null \
      && report DB "$root" redis "$root/CMakeLists.txt"
  }
done
echo "END"
