#pragma once
#include <cstdint>
#include <string>

/// Was dieser Dienst aus der Umgebung braucht.
///
/// Die Werte stehen in `.env.example` — und zwar nicht aus Bequemlichkeit:
/// die Vollanalyse liest keine `.cpp`- und `.h`-Dateien. Ohne die
/// `.env.example` bliebe diese Konfiguration unsichtbar.
struct Config {
    std::string database_url;  ///< DATABASE_URL, ohne Vorgabewert
    std::uint16_t port;        ///< API_CPP_PORT, Vorgabe 8083
    int db_pool_max;           ///< DB_POOL_MAX, Vorgabe 10
    std::string log_level;     ///< LOG_LEVEL, Vorgabe "info"
};

/// Liest die Umgebung. Wirft, wenn DATABASE_URL fehlt: ein Dienst, der
/// ohne Zugangsdaten anlaeuft und bei der ersten Anfrage umfaellt,
/// verschiebt den Fehler nur dorthin, wo er niemandem mehr etwas sagt.
Config config_aus_umgebung();
