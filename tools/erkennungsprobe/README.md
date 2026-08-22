# Erkennungsprobe

Die beiden Skripte, die der Raptor in seiner Zelle laufen lässt —
wörtlich, damit man vor dem Hochladen sieht, was er sehen wird.

```bash
sh probe.sh                                   # Erkennung: welche Apps
printf 'apps/api-rust\n' | sh analyse.sh      # Vollanalyse einer Auswahl
```

`analyse.sh` ist **wörtlich** aus `workbench/src/analyze.rs` kopiert
(Stand `1dc9f9b`); nur der Tarball-Kopf fehlt, weil hier schon ein
ausgepackter Baum liegt. `probe.sh analyse` tut dasselbe für alle
erkannten Apps auf einmal.

Die Quelle ist `Substrate/Raptor/crates/workbench/src/{detect,analyze}.rs`.
Wer dort etwas ändert, muss es hier nachziehen — sonst prüft diese Probe
etwas anderes als die Zelle, und das ist schlimmer als keine Probe.

**Kein Verzeichnis dieses Namens ist zufällig gewählt.** `tools` steht in
der Liste der durchsuchten Verzeichnisse, dieses Unterverzeichnis hat
aber keine `package.json`, `Cargo.toml` oder `CMakeLists.txt` — es wird
also nicht als App gemeldet. Wer hier eine hinzufügt, hat eine App mehr.
