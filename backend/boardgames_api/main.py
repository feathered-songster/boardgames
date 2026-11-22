from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import __version__, models, schemas
from .database import Base, engine, get_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Keeps the demo small. A real project would use Alembic migrations.
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="Boardgames API", version=__version__, lifespan=lifespan)

Db = Annotated[Session, Depends(get_db)]


@app.get("/health")
def health():
    return {"status": "ok", "version": __version__}


@app.get("/games", response_model=list[schemas.GameRead])
def list_games(db: Db, q: str | None = None):
    stmt = select(models.Game).order_by(models.Game.title)
    if q:
        stmt = stmt.where(models.Game.title.ilike(f"%{q}%"))
    return db.scalars(stmt).all()


@app.post("/games", response_model=schemas.GameRead, status_code=201)
def create_game(payload: schemas.GameCreate, db: Db):
    game = models.Game(**payload.model_dump())
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


def _get_or_404(db: Session, game_id: int) -> models.Game:
    game = db.get(models.Game, game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@app.get("/games/{game_id}", response_model=schemas.GameRead)
def get_game(game_id: int, db: Db):
    return _get_or_404(db, game_id)


@app.put("/games/{game_id}", response_model=schemas.GameRead)
def update_game(game_id: int, payload: schemas.GameCreate, db: Db):
    game = _get_or_404(db, game_id)
    for key, value in payload.model_dump().items():
        setattr(game, key, value)
    db.commit()
    db.refresh(game)
    return game


@app.delete("/games/{game_id}", status_code=204)
def delete_game(game_id: int, db: Db):
    db.delete(_get_or_404(db, game_id))
    db.commit()
    return Response(status_code=204)
