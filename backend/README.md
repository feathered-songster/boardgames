# backend

FastAPI + SQLAlchemy CRUD API for the board games catalog (PyPI: `boardgames-catalog-api`).

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest
uvicorn boardgames_api.main:app --reload   # SQLite by default, docs at /docs
```

Set `DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db` to use Postgres.
Endpoints: `GET /health`, `GET /games?q=`, `POST /games`, `GET|PUT|DELETE /games/{id}`.
