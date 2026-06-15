# AGENTS.md

## Cursor Cloud specific instructions

This repo is the **Sovereign AI Orchestration Stack**: a set of standalone Python 3 scripts plus one FastAPI server. There is no build step. The startup update script already installs Python deps (`requirements.txt` + `pytest`) and creates the runtime data dirs, so the notes below are only the non-obvious gotchas.

### Layout gotcha (two copies of each tool)
Each tool exists twice with different APIs:
- **Root scripts** (`orchestrator-api.py`, `echo-nexus-cli.py`, `handoff-write.py`, `skill-registry.py`, `memory-sync.py`, etc.) — these are the ones wired up by `bootstrap.sh` and use **flag-style args** (e.g. `python3 echo-nexus-cli.py --add "task" --priority 5`, `--list`, `--next`).
- **`gap-*/` copies** (`gap-2-orchestrator/orchestrator.py`, `gap-1-echo-nexus/echo-nexus.py`, ...) — referenced in `README.md` and use **subcommand-style args** (e.g. `orchestrator.py serve --port 8000`). The README's command examples match the `gap-*` copies, not the root scripts.

### Running the main application (orchestrator)
The core app is the FastAPI orchestrator. Run it with `python3 orchestrator-api.py --port 8000` (binds 0.0.0.0). Interactive docs at `/docs`. Key endpoints: `GET /v1/health`, `POST /v1/events`, `GET /v1/queue`, `GET /v1/dlq`. It auto-creates `~/.orchestrator/{queue,dlq}` on its own. With no routes configured, queued events have no handler and the worker retries then moves them to the DLQ — that is expected, not a bug.

### CLI tools need home data dirs
`echo-nexus-cli.py` and `handoff-write.py` read/write under `~/.echo-nexus`, `~/.agent-handoffs`, and `~/mind-weaver/`. These dirs are normally created by `bootstrap.sh`; the update script creates them too. `handoff-write.py --status` only accepts `completed|paused|error|delegated`.

### Tests / lint
- Tests: `python3 -m pytest` (suite lives in `tests/`; `pytest` is not in `requirements.txt` so the update script installs it separately).
- There is no configured linter. For a quick syntax sanity check use `python3 -m py_compile <file>`.

### Known pre-existing breakage (do NOT "fix" as part of setup)
Two auxiliary scripts have committed syntax errors and will not import/run: `gap-3-memory/memory-sync.py` (duplicate `exist_ok` kwarg) and `gap-6-research-memory/research-capture.py` (stray space in an identifier). The root `memory-sync.py` has the same duplicate-kwarg error. The core orchestrator and all other root CLIs compile and run fine.

### PATH note
`pip` installs console scripts (`uvicorn`, `pytest`, `httpx`) to `~/.local/bin`, which is not on `PATH`. Invoke via the Python module form instead (`python3 -m pytest`, `python3 -m uvicorn`) or run the scripts directly with `python3 <script>.py`.
