# app/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import List

class TextReview(BaseModel):
    review: str

class PredictionResult(BaseModel):
    review: str
    sentimento_predito: int
    sentimento_str: str
    model_id: int | None = None
    data_predicao: datetime | None = None

class PredictionWithContext(BaseModel):
    prediction_id: int
    review_id: int
    game_id: int
    game_name: str
    review_text_raw: str
    sentimento_predito: int
    sentimento_str: str
    data_predicao: datetime
    model_id: int
    model_name: str
    model_version: str


# Schemas adicionais usados em `app/main.py` (métricas, salvamento, consistência)
class ConsistencySample(BaseModel):
    review_id: int
    review_text_raw: str
    review_score_raw: int
    artificial_analysis: int


class GameConsistency(BaseModel):
    game_id: int
    total_with_ai: int
    consistent: int
    inconsistent: int
    consistency_rate: float
    samples: List[ConsistencySample]


class SaveTextReview(BaseModel):
    review: str
    game_id: int
    review_score_raw: int


class ReviewMetrics(BaseModel):
    review_id: int
    char_num: int
    word_num: int
    sent_num: int


class GameDashboard(BaseModel):
    game_id: int
    game_name: str
    total_reviews: int
    positivas: int
    negativas: int
    percentual_positivas: float  # 0 to 1
    percentual_negativas: float  # 0 to 1
    avg_votes: float
    fonte: str  # "review_score_raw"