// Der C++-Dienst des Monorepos: ein Endpunkt, eine Datenbank.
//
// Bewusst ohne Framework — ein roher TCP-Listener und libpq. Was hier
// interessant ist, ist nicht der HTTP-Teil, sondern dass die
// Konfiguration nebenan in config.cpp steht und die Vollanalyse sie
// trotzdem nicht findet (siehe README, "Was hier absichtlich schiefgeht").

#include <arpa/inet.h>
#include <libpq-fe.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>

#include <cstring>
#include <iostream>
#include <string>

#include "config.h"

namespace {

std::string antwort(int code, const std::string& koerper) {
    const char* grund = code == 200 ? "OK" : (code == 503 ? "Service Unavailable" : "Not Found");
    return "HTTP/1.1 " + std::to_string(code) + " " + grund +
           "\r\nContent-Type: application/json\r\nContent-Length: " +
           std::to_string(koerper.size()) + "\r\nConnection: close\r\n\r\n" + koerper;
}

std::string items(PGconn* db) {
    PGresult* r = PQexec(db, "select id, name from items order by id limit 100");
    if (PQresultStatus(r) != PGRES_TUPLES_OK) {
        PQclear(r);
        // 503, nicht 500: die Datenbank ist weg, nicht der Code kaputt.
        return antwort(503, R"({"error":"database unavailable"})");
    }
    std::string json = "[";
    for (int i = 0; i < PQntuples(r); ++i) {
        if (i) json += ",";
        json += R"({"id":)" + std::string(PQgetvalue(r, i, 0)) + R"(,"name":")" +
                std::string(PQgetvalue(r, i, 1)) + R"("})";
    }
    json += "]";
    PQclear(r);
    return antwort(200, json);
}

}  // namespace

int main() {
    Config cfg;
    try {
        cfg = config_aus_umgebung();
    } catch (const std::exception& e) {
        std::cerr << e.what() << "\n";
        return 78;  // EX_CONFIG
    }

    PGconn* db = PQconnectdb(cfg.database_url.c_str());
    if (PQstatus(db) != CONNECTION_OK) {
        std::cerr << "datenbank: " << PQerrorMessage(db) << "\n";
        return 75;  // EX_TEMPFAIL — spaeter nochmal versuchen
    }

    int server = socket(AF_INET, SOCK_STREAM, 0);
    int an = 1;
    setsockopt(server, SOL_SOCKET, SO_REUSEADDR, &an, sizeof(an));

    sockaddr_in adresse{};
    adresse.sin_family = AF_INET;
    adresse.sin_addr.s_addr = INADDR_ANY;
    adresse.sin_port = htons(cfg.port);

    if (bind(server, reinterpret_cast<sockaddr*>(&adresse), sizeof(adresse)) < 0) {
        std::cerr << "port " << cfg.port << " nicht belegbar: " << std::strerror(errno) << "\n";
        return 75;
    }
    listen(server, 64);
    std::cout << "api-cpp hoert auf " << cfg.port << "\n";

    for (;;) {
        int c = accept(server, nullptr, nullptr);
        if (c < 0) continue;
        char puffer[2048] = {};
        ssize_t n = read(c, puffer, sizeof(puffer) - 1);
        std::string pfad;
        if (n > 0) {
            std::string zeile(puffer);
            auto a = zeile.find(' ');
            auto b = zeile.find(' ', a + 1);
            if (a != std::string::npos && b != std::string::npos) pfad = zeile.substr(a + 1, b - a - 1);
        }
        std::string out = pfad == "/health"  ? antwort(200, R"({"ok":true})")
                          : pfad == "/items" ? items(db)
                                             : antwort(404, R"({"error":"not found"})");
        write(c, out.data(), out.size());
        close(c);
    }
}
