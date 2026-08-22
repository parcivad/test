//! Der Lese-Dienst.
//!
//! Ein Endpunkt, eine Datenbank, kein Zustand dazwischen. Was aus der
//! Umgebung kommt, steht zusaetzlich in `.env.example` — fuer Menschen,
//! die den Dienst starten wollen, ohne den Quelltext zu lesen.
//!
//! Bis zum 22.08. fand die Vollanalyse hier gar nichts: sie durchsuchte
//! keine `.rs`-Dateien. Der Dienst wurde als App erkannt und stand dann
//! ohne eine einzige Variable da. Seit `env::var` in den Mustern steht,
//! findet sie alle fuenf.

use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;
use sqlx::postgres::PgPoolOptions;

#[derive(Serialize, sqlx::FromRow)]
struct Item {
    id: i64,
    name: String,
}

async fn items(State(pool): State<sqlx::PgPool>) -> Result<Json<Vec<Item>>, http_error::Error> {
    let rows = sqlx::query_as::<_, Item>("select id, name from items order by id limit 100")
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

async fn health() -> &'static str {
    "ok"
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()))
        .init();

    // Ohne Zugangsdaten gar nicht erst anlaufen. Ein Dienst, der startet
    // und bei der ersten Anfrage umfaellt, verschiebt den Fehler nur
    // dorthin, wo er niemandem mehr etwas sagt.
    let database_url = std::env::var("DATABASE_URL")
        .map_err(|_| "DATABASE_URL fehlt — ohne Datenbank hat dieser Dienst nichts zu tun")?;
    let port: u16 = std::env::var("API_RUST_PORT")
        .unwrap_or_else(|_| "8082".into())
        .parse()?;

    let pool = PgPoolOptions::new()
        .max_connections(
            std::env::var("DB_POOL_MAX")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(10),
        )
        .connect(&database_url)
        .await?;

    let app = Router::new()
        .route("/health", get(health))
        .route("/items", get(items))
        .with_state(pool);

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port)).await?;
    tracing::info!("api-rust hoert auf {port}");
    axum::serve(listener, app).await?;
    Ok(())
}

mod http_error {
    /// Ein Datenbankfehler ist 503, kein 500: die Datenbank ist weg,
    /// nicht der Code kaputt. Wer beides als 500 meldet, laesst den
    /// Betreiber im Code suchen.
    pub struct Error(sqlx::Error);

    impl From<sqlx::Error> for Error {
        fn from(e: sqlx::Error) -> Self {
            Error(e)
        }
    }

    impl axum::response::IntoResponse for Error {
        fn into_response(self) -> axum::response::Response {
            tracing::error!("datenbank: {}", self.0);
            (
                axum::http::StatusCode::SERVICE_UNAVAILABLE,
                axum::Json(serde_json::json!({"error": "database unavailable"})),
            )
                .into_response()
        }
    }
}
