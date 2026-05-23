from pydantic import BaseModel


class DailyOneRM(BaseModel):
    date: str
    one_rm: float


class ProgressionOption(BaseModel):
    type: str  # "weight" | "reps"
    reps: int
    weight_kg: float
    description: str


class ProgressionResponse(BaseModel):
    exercise_name: str
    history: list[DailyOneRM]
    predicted_1rm: float
    options: list[ProgressionOption]
    last_reps: int
    last_weight_kg: float
