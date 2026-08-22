# Erkennungsprobe

Die beiden Skripte, die der Raptor in seiner Zelle laufen lässt —
wörtlich, damit man vor dem Hochladen sieht, was er sehen wird.

```bash
sh probe.sh              # Erkennung: welche Apps, welches Framework
sh probe.sh analyse      # Vollanalyse: Variablen, Ports, Datenbanken
```

Die Quelle ist `Substrate/Raptor/crates/workbench/src/{detect,analyze}.rs`.
Wer dort etwas ändert, muss es hier nachziehen — sonst prüft diese Probe
etwas anderes als die Zelle, und das ist schlimmer als keine Probe.

**Kein Verzeichnis dieses Namens ist zufällig gewählt.** `tools` steht in
der Liste der durchsuchten Verzeichnisse, dieses Unterverzeichnis hat
aber keine `package.json`, `Cargo.toml` oder `CMakeLists.txt` — es wird
also nicht als App gemeldet. Wer hier eine hinzufügt, hat eine App mehr.
