use axum::{routing::{get, post}, response::Json, Router};
use serde::{Serialize, Deserialize};
use tower_http::cors::CorsLayer;

#[derive(Serialize, Clone)]
struct SystemState {
    status: String,
    uptime: String,
    active_memory_tokens: usize,
    cpu_usage: u8,
    vram_allocation: String,
}

#[derive(Deserialize)]
struct ActionCommand {
    command: String,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/api/state", get(get_state))
        .route("/api/execute", post(handle_execute))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8000").await.unwrap();
    println!("Sovereign Daemon listening on port 8000...");
    axum::serve(listener, app).await.unwrap();
}

async fn get_state() -> Json<SystemState> {
    Json(SystemState {
        status: "EXECUTING".to_string(),
        uptime: "04:12:45".to_string(),
        active_memory_tokens: 14208,
        cpu_usage: 24,
        vram_allocation: "11.8 GB / 16.0 GB".to_string(),
    })
}

async fn handle_execute(Json(payload): Json<ActionCommand>) -> Json<serde_json::Value> {
    println!("Intercept command triggered: {}", payload.command);
    Json(serde_json::json!({ "status": "SUCCESS" }))
}
