#include "config.h"

#include <cstdlib>
#include <stdexcept>
#include <string>

namespace {

std::string wert(const char* name, const char* vorgabe) {
    const char* v = std::getenv(name);
    return (v && *v) ? std::string(v) : std::string(vorgabe);
}

}  // namespace

Config config_aus_umgebung() {
    const char* db = std::getenv("DATABASE_URL");
    if (!db || !*db) {
        throw std::runtime_error(
            "DATABASE_URL fehlt — ohne Datenbank hat dieser Dienst nichts zu tun");
    }

    Config c;
    c.database_url = db;
    // stoul statt atoi: atoi meldet einen Tippfehler als 0, und Port 0
    // laesst das Betriebssystem einen zufaelligen waehlen — der Dienst
    // laeuft dann, ist aber nirgends erreichbar.
    c.port = static_cast<std::uint16_t>(std::stoul(wert("API_CPP_PORT", "8083")));
    c.db_pool_max = std::stoi(wert("DB_POOL_MAX", "10"));
    c.log_level = wert("LOG_LEVEL", "info");
    return c;
}
