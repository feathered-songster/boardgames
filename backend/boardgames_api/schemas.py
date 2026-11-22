from pydantic import BaseModel, ConfigDict, Field, model_validator


class GameCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    designer: str | None = Field(default=None, max_length=200)
    year_published: int | None = Field(default=None, ge=1800, le=2100)
    min_players: int = Field(default=1, ge=1)
    max_players: int = Field(default=4, ge=1)
    play_time_minutes: int | None = Field(default=None, ge=1)
    description: str | None = None

    @model_validator(mode="after")
    def _players_range(self):
        if self.max_players < self.min_players:
            raise ValueError("max_players must be >= min_players")
        return self


class GameRead(GameCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
