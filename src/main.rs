use axum::{
    extract::State,
    response::{sse::{Event, Sse}, Json},
    routing::{get, post},
    Router,
};
use futures_util::stream::Stream;
use serde::{Serialize, Deserialize};
use std::{convert::Infallible, sync::Arc, time::Duration};
use tokio::sync::broadcast;
use tokio_stream::{wrappers::BroadcastStream, StreamExt};
use tower_http::cors::CorsLayer;

#[derive(Serialize, Clone)]
struct SystemState {
    status: String,
    uptime: String,
    active_memory_tokens: usize,
    cpu_usage: u8,
    vram_allocation: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct StreamLog {
    id: String,
    timestamp: String,
    source: String,
    level: String,
    message: String,
}

#[derive(Deserialize)]
struct ActionCommand {
    command: String,
}

struct AppState {
    tx: broadcast::Sender<StreamLog>,
}

#[tokio::main]
async fn main() {
    let (tx, _) = broadcast::channel::<StreamLog>(100);
    let shared_state = Arc::new(AppState { tx });

    // Spawn an internal loop that feeds synthetic system updates into the log stream channel
    let tx_clone = shared_state.tx.clone();
    tokio::spawn(async move {
        let mut count = 0;
        loop {
            tokio::time::sleep(Duration::from_secs(4)).await;
            count += 1;
            let _ = tx_clone.send(StreamLog {
                id: count.to_string(),
                timestamp: "Continuous".to_string(),
                source: "AGENT".to_string(),
                level: "INFO".to_string(),
                message: format!("Sovereign background iteration loop #{} complete.", count),
            });
        }
    });

    let app = Router::new()
        .route("/api/state", get(get_state))
        .route("/api/execute", post(handle_execute))
        .route("/api/stream", get(stream_logs))
        .with_state(shared_state)
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8000").await.unwrap();
    println!("Sovereign Daemon fully bound to port 8000.");
    axum::serve(listener, app).await.unwrap();
}

async fn get_state() -> Json<SystemState> {
    Json(SystemState {
        status: "EXECUTING".to_string(),
        uptime: "04:12:45".to_string(),
        active_memory_tokens: 14208,
        cpu_usage: 18,
        vram_allocation: "11.8 GB / 16.0 GB".to_string(),
    })
}

async fn handle_execute(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ActionCommand>,
) -> Json<serde_json::Value> {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let new_log = StreamLog {
        id: format!("cmd-{}", timestamp),
        timestamp: "Now".to_string(),
        source: "SYSTEM".to_string(),
        level: "SUCCESS".to_string(),
        message: format!("Command processed natively: {}", payload.command),
    };
    let _ = state.tx.send(new_log);
    Json(serde_json::json!({ "status": "SUCCESS" }))
}

async fn stream_logs(
    State(state): State<Arc<AppState>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let rx = state.tx.subscribe();
    let stream = BroadcastStream::new(rx).filter_map(|msg| match msg {
        Ok(log) => Some(Ok(Event::default().json_data(log).unwrap())),
        Err(_) => None,
    });
    Sse::new(stream).keep_alive(axum::response::sse::KeepAlive::default())
}
