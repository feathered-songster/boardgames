from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    designer: Mapped[str | None] = mapped_column(String(200))
    year_published: Mapped[int | None]
    min_players: Mapped[int] = mapped_column(default=1)
    max_players: Mapped[int] = mapped_column(default=4)
    play_time_minutes: Mapped[int | None]
    description: Mapped[str | None] = mapped_column(Text)
